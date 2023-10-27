const express = require('express')
const _pages = require('../pages')
const RelativeTime = require('./reltime.js')
const cheerio = require('cheerio')
var pages

module.exports = function (db) {
  var mongoose = db
  pages = _pages(db)
  mongoose.Schema = require('mongoose').Schema
  var rMain = express.Router()

  var dataMe = {
    birth: 998323200
  }
  rMain.get('/', function (req, res) {
    res.send(pages.home())
  })
  rMain.get('/Contacts/', function (req, res) {
    res.redirect('/')
  })
  rMain.get('/data/me/', function (req, res) {
    dataMe.age = Math.floor(Date.now() / 1000) - dataMe.birth
    res.send(dataMe)
  })
  rMain.get('/geterror', function (req, res) {
    throw new Error(req.query.msg ? `${req.query.msg} (error message given in url)` : 'Your error.')
  })
  rMain.get('/holiday/:season/', function (req, res, next) {
    let season = req.params.season
    let thepage
    let time = new Date()
    if (/^\d+$/.test(req.query.fakeTime)) {
      time = new Date(parseInt(req.query.fakeTime) * 1000)
      if (Number.isNaN(time.getTime())) {
        next(new Error('Invalid timestamp.'))
        return
      }
    } else if (typeof req.query.fakeTime === 'string') {
      next(new Error('Invalid fakeTime.'))
      return
    }
    if ((!/^[sw]\d+$/.test(season)) || (!(thepage = pages[`holiday_${season}`]))) {
      next()
      return
    }
    res.send(thepage({
      time,
      RelativeTime
    }))
  })

  rMain.use(function (req, res, next) {
    if (req.method !== 'GET') {
      next()
      return
    }
    if (!/^\/[a-zA-Z0-9_\/]+$/.test(req.path)) { // eslint-disable-line no-useless-escape
      next()
      return
    }
    let page = null
    let pagePath = req.path.replace(/\/$/, '')
    if ((page = pages['mainsite' + pagePath])) {
      var agepre = (Date.now() / 1000 - dataMe.birth) / (60 * 60 * 24 * 365)
      let html = page({
        age: Math.round(agepre * 10) / 10,
        agepre,
        pagePath
      })
      let $ = cheerio.load(html)
      let $content = $('.content').eq(0)
      let tocStructure = []
      let lastId = 0
      $content.children('h2, h3').each(function (i) {
        let $this = $(this)
        if ($this.is('h2')) {
          tocStructure.push({
            heading: $this.text(),
            id: lastId++,
            subheadings: []
          })
          $this.attr('id', `h${lastId - 1}`)
        } else if ($this.is('h3')) {
          if (tocStructure.length === 0) return
          tocStructure[tocStructure.length - 1].subheadings.push({
            heading: $this.text(),
            id: lastId++,
            subheadings: []
          })
          $this.attr('id', `h${lastId - 1}`)
        }
      })
      function getLi (structure) { // eslint-disable-line
        let li = $('<li></li>')
        let a = $('<a></a>')
        a.text(structure.heading)
        a.attr('href', '#h' + structure.id)
        li.append(a)
        if (structure.subheadings.length > 0) {
          let ol = $('<ol></ol>')
          li.append(ol)
          structure.subheadings.map(getLi).forEach(sli => {
            ol.append(sli)
          })
        }
        return li
      }
      let mol = $('<ol></ol>')
      tocStructure.map(getLi).forEach(sli => {
        mol.append(sli)
      })
      $('.__tableofcontents').eq(0).after(mol).remove()
      mol.before($('<h2>Table of contents</h2>'))
      mol.addClass('tableofcontents')
      res.send($.html())
    } else {
      next()
    }
  })

  return function (req, res, next) {
    if (req.hostname === 'maowtm.org') {
      rMain(req, res, next)
    } else {
      next()
    }
  }
}
