// TODO: Fix neg problem on page.
const express = require('express')
const http = require('http')
const https = require('https')
const fs = require('fs')
const url = require('url')
const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const compression = require('compression')
const path = require('path')
const elasticsearch = require('elasticsearch')
const WebSocket = require('ws')
let pages

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason)
  console.error(reason.stack)
})

// This file will be launched with launcher.js.

var maowtm = function (config) {
  var app = express()
  config = config || {}
  this.config = config
  this._mongodb = config.db || 'mongodb://127.0.0.1'
  this.db = mongoose.createConnection()
  this.es = new elasticsearch.Client({
    host: config.elasticsearch || '127.0.0.1'
  })
  // this._listen can be a array of address.
  this._listen = config.listen || []
  this._ssl = config.ssl
  this.acme = config.acme || null
  this.destory = false
  this.mockSecure = config.mockSecure || false
  this.noInitImages = config.noInitImages || false
  this.apps = config.apps || []
  this.rbs = config.rbs || []
  this.registeredWSHandlers = [] // { shouldHandle, onConnection }
  app.mockSecure = this.mockSecure
  var callback = config.callback
  function fail (error) {
    if (this.destory) return
    if (callback) {
      this.destory = true
      if (this.db) {
        this.db.close()
      }
      callback(error, null, function () {})
    } else {
      console.error('Error initalizing server:')
      console.error(error)
      process.exit(2)
    }
  }
  this.es.ping({
    requestTimeout: 10000
  }, err => {
    if (err) {
      fail(err)
    }
  })
  this.db.openUri(this._mongodb).catch(err => fail(err))
  if ((!Array.isArray(this._listen) || this._listen.length > 0) && !this.mockSecure && !(this._ssl && this._ssl.cert && this._ssl.key)) {
    fail(new Error('No SSL certificate provided'))
    return
  }
  var _this = this

  this.db.on('error', function (err) {
    fail(err)
  })
  this.db.on('open', function () {
    app.use(function (req, res, next) {
      console.log(`${req.method.toUpperCase()} ${req.protocol}://${req.hostname}${req.path} from ${req.ip}`)
      next()
    })

    pages = require('./pages')(this.db)

    app.use(compression({
      filter: (req, res) => {
        // Safari don't really support compression. (Error: can't decode raw data)
        let ua = req.get('User-Agent');
        if (ua && ua.indexOf('Safari') >= 0) {
          return false;
        }
        return true;
      }
    }))
    app.use('/.well-known/', express.static(path.join(__dirname, '.well-known')))
    app.use(function (req, res, next) {
      if (!req.hostname) {
        res.status(404)
        res.end()
        return
      }
      if (!(req.secure || app.mockSecure)) {
        res.redirect(302, 'https://' + req.hostname + req.originalUrl)
      } else {
        res.set('Strict-Transport-Security', 'max-age=155520000; includeSubdomains; preload')
        res.set('X-XSS-Protection', '1; mode=block')
        res.set('X-Frame-Options', 'sameorigin')
        res.set('X-Content-Type-Options', 'nosniff')
        res.set('Expect-CT', 'max-age=155520000, enforce')
        next()
      }
    })

    // Add trailing / for all GET for all router below. ( i.e. Not including static and img )
    app.use(function (req, res, next) {
      if (req.hostname.match(/^(img|static|file)/) || req.path.match(/\.[^/\\\s%]+$/)) {
        next()
        return
      }
      var prasedUrl = url.parse(req.originalUrl, false)
      if (req.method === 'GET' && prasedUrl.pathname.substr(-1) !== '/') {
        prasedUrl.pathname += '/'
        res.redirect(302, url.format(prasedUrl))
      } else {
        next()
      }
    })

    app.use(require('./subs/main')(_this.db))
    app.use(require('./subs/mww')(_this.db))

    _this.apps.forEach(it => {
      let route = it.init({
        mongodb: _this.db,
        elasticsearch: _this.es,
        addWSHandler: function (hnd) {
          _this.registeredWSHandlers.push(hnd)
        }
      })
      app.use(function (req, res, next) {
        if (it.hostname === req.hostname) {
          route(req, res, next)
        } else {
          next()
        }
      })
    })

    app.use(require('./subs/misc')(_this.db))

    let nodeenv = process.env.NODE_ENV || ''
    app.use(function (err, req, res, next) {
      res.status(500)
      let pageObj = { err, req }
      if (typeof err !== 'string') {
        pageObj.err = err.message
        if (err.stack) {
          pageObj.stack = err.stack.replace(new RegExp(path.join(__dirname, '..').replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1'), 'g'), '...') + // eslint-disable-line no-useless-escape
            `\nServer running in NODE_ENV=${nodeenv}\nTime: ${Date.now() / 1000}`
        }
      }
      res.send(pages.error(pageObj))
      console.error(err)
    })

    async function doSetupServer () {
      const httpsopts = (_this._ssl ? {
        key: fs.readFileSync(_this._ssl.key),
        cert: fs.readFileSync(_this._ssl.cert)
      } : null)
      if (httpsopts && _this._ssl.ca) {
        httpsopts.ca = fs.readFileSync(_this._ssl.ca)
      }
      _this._servers = {
        http: [],
        http2: []
      }
      if (!Array.isArray(_this._listen)) {
        if (httpsopts) {
          _this._servers.http2.push(https.createServer(httpsopts, app).listen(443, _this._listen))
        }
        _this._servers.http.push(http.createServer(app).listen(80, _this._listen))
      } else {
        _this._listen.forEach(function (address) {
          if (httpsopts) {
            _this._servers.http2.push(https.createServer(httpsopts, app).listen(443, address))
          }
          _this._servers.http.push(http.createServer(app).listen(80, address))
        })
      }
    }
    _this.es.ping({}).then(() => doSetupServer().then(() => new Promise((resolve, reject) => {
      _this._servers.http2.forEach(server => {
        let wss = new WebSocket.Server({
          server,
          backlog: 100,
          maxPayload: 1024 * 1024 * 1 // 10MiB
        })
        wss.shouldHandle = function (req) {
          let reqHost = req.headers.host
          if (reqHost.endsWith(':443')) reqHost = reqHost.substr(0, reqHost.length - 4)
          console.log(`WS on ${reqHost}${req.url}`)
          let hnd = _this.registeredWSHandlers.find(hnd => hnd.hostname === reqHost)
          if (!hnd) return false
          return hnd.shouldHandle(req)
        }
        wss.on('connection', function (ws, req) {
          let reqHost = req.headers.host
          if (reqHost.endsWith(':443')) reqHost = reqHost.substr(0, reqHost.length - 4)
          console.log(`WS on ${reqHost}${req.url} connected.`)
          let hnd = _this.registeredWSHandlers.find(hnd => hnd.hostname === reqHost)
          if (!hnd) {
            ws.close(1011, `Unexpected host ${req.headers.host}`)
            console.error(`ws: Unexpected 'connection' event on host ${req.headers.host}`)
          } else {
            hnd.onConnection(ws, req)
          }
          ws.on('close', () => {
            console.log(`CLOSE WS on ${reqHost}${req.url}`)
          })
        })
      })
      resolve()
    })).then(() => {
      console.log('Server ready.')
      if (callback) {
        callback(null, app, function () {
          _this._servers.http2.forEach(function (s) {
            s.close()
          })
          _this._servers.http.forEach(function (s) {
            s.close()
          })
          _this.destory = true
          _this.db.close()
        })
      }
    }), err => fail(err)).catch(err => { fail(err) })
  })
}

module.exports = maowtm
