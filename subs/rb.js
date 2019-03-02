const express = require('express')
const fs = require('fs')
const path = require('path')
const _pages = require('../pages')
let pages

module.exports = function (db, lock, rbs = []) {
  let mongoose = db
  pages = _pages(db)
  mongoose.Schema = require('mongoose').Schema

  let rbAnoyMessageSchema = new mongoose.Schema({
    message: 'String',
    time: 'Number',
    deleted: { type: 'Boolean', default: false },
    to: { type: 'String', index: true }
  })
  let RbAnoyMessage = mongoose.model('rbAnoyMessage', rbAnoyMessageSchema)

  let rbSurveyResponseSchema = new mongoose.Schema({
    surveyId: { type: 'String', index: true },
    time: 'Number',
    ip: 'String',
    response: 'String'
  })
  let RbSurveyResponse = mongoose.model('rbSurveyResponse', rbSurveyResponseSchema)

  let rRb = express.Router()

  rRb.get('/', function (req, res, next) {
    RbAnoyMessage.find({ deleted: false, to: 'maowtm' }).sort({ time: -1 }).exec((err, msgs) => {
      if (err) {
        next(err)
        return
      }
      res.send(pages.rbIndex({ msgs, index: true }))
    })
  })

  rRb.options('/pm/:to', function (req, res, next) {
    res.set('Access-Control-Allow-Origin', '*')
    res.end()
  })
  rRb.get('/pm/:to', function (req, res, next) {
    res.set('Access-Control-Allow-Origin', '*')
    let to = req.params.to.trim()
    if (to.toLowerCase() !== to) {
      res.redirect('/pm/' + encodeURIComponent(to.toLowerCase()))
      return
    }
    if (to === "secret-pyq") {
      res.status(403)
      res.send(pages.error({req, err: 403}))
      return
    }
    RbAnoyMessage.find({ deleted: false, to: to }).sort({ time: -1 }).exec((err, msgs) => {
      if (err) {
        next(err)
        return
      }
      res.send(pages.rbIndex({ msgs, to: to }))
    })
  })
  rRb.post('/pm/:to', function (req, res, next) {
    res.set('Access-Control-Allow-Origin', '*')
    let ctype = req.get('Content-Type')
    let done = false
    if (ctype !== 'text/plain') {
      res.status(415)
      res.send('Content type incorrect.')
      done = true
      return
    }
    let to = req.params.to.trim().toLowerCase()
    if (to.length === 0) {
      res.status(403)
      res.send('Who are you sending to?')
      done = true
      return
    }
    if (to.length > 20) {
      res.status(413)
      res.send('The person you are sending to has a very long name!')
      done = true
      return
    }
    let body = ''
    req.setEncoding('utf8')
    req.on('data', chunk => {
      if (done) return
      if (body.length + chunk.length > 255) {
        res.status(413)
        res.send('Content excess the character limit of 255.')
        done = true
        return
      }
      body += chunk
    })
    req.on('end', () => {
      if (done) return
      done = true
      body = body.trim()
      if (body.length === 0) {
        res.status(403)
        res.send('Content is empty.')
        return
      }
      let msg = new RbAnoyMessage({ message: body, time: Date.now(), to: to })
      msg.save(err => {
        if (err) {
          next(err)
        } else {
          res.end()
        }
      })
    })
  })

  const surveies = require('./surveies.data.js')
  for (let survid of Object.keys(surveies)) {
    let srv = surveies[survid]
    try {
      if (fs.statSync(path.join(__dirname, '../static/script/', `survey-${survid.replace(/\//g, '-')}.js`)).isFile()) {
        srv.addScript = `/script/survey-${survid.replace(/\//g, '-')}.js`
      }
    } catch (e) {}
  }
  rRb.get('/survey/:id', (req, res, next) => {
    let svid = req.params.id
    if (!surveies[svid]) {
      next()
      return
    }
    let sv = surveies[svid]
    res.send(pages.survey(Object.assign({ lang: 'en' }, sv, { id: svid })))
  })
  rRb.get('/survey/:id/success', (req, res, next) => {
    let svid = req.params.id
    let sv = surveies[svid]
    if (!sv) {
      next()
      return
    }
    res.send(pages.surveySuccess({ lang: sv.lang || 'en' }))
  })
  rRb.post('/survey/:id', function (req, res, next) {
    let ctype = req.get('Content-Type')
    let done = false
    if (ctype !== 'application/json') {
      res.status(415)
      res.send('Content type incorrect.')
      done = true
      return
    }
    let svid = req.params.id.trim()
    if (svid.length === 0) {
      res.status(403)
      res.send('What are you sending svid?')
      done = true
      return
    }
    if (!surveies[svid]) {
      res.status(404)
      res.send('Survey not found.')
      done = true
      return
    }
    let body = ''
    req.setEncoding('utf8')
    req.on('data', chunk => {
      if (done) return
      body += chunk
    })
    req.on('end', () => {
      if (done) return
      done = true
      body = body.trim()
      if (body.length === 0) {
        res.status(403)
        res.send('Content is empty.')
        return
      }
      try {
        if (typeof JSON.parse(body) !== 'object') {
          throw new Error()
        }
      } catch (e) {
        res.status(403)
        res.send('Content is not valid JSON.')
        return
      }
      let msg = new RbSurveyResponse({ surveyId: svid, time: Date.now(), ip: req.ip, response: body })
      msg.save(err => {
        if (err) {
          next(err)
        } else {
          res.end()
        }
      })
    })
  })

  for (let staticApp of rbs) {
    if (!staticApp.path.startsWith('/')) throw new Error('path should be absolute.')
    if (!staticApp.path.endsWith('/')) {
      staticApp = Object.assign({}, staticApp, {
        path: staticApp.path + '/'
      })
    }
    rRb.use(staticApp.path, express.static(staticApp.dir, {
      index: ['index.html']
    }))
  }

  return function (req, res, next) {
    if (req.hostname === 'rb.maowtm.org') {
      rRb(req, res, next)
    } else {
      next()
    }
  }
}
