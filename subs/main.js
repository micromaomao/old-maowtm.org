const express = require('express')
const _pages = require('../pages')
const RelativeTime = require('./reltime.js')
var pages

module.exports = function (db, lock) {
  var mongoose = db
  pages = _pages(db)
  mongoose.Schema = require('mongoose').Schema
  var rMain = express.Router()

  var dataMe = {
    birth: 998323200
  }
  rMain.get('/', function (req, res) {
    res.redirect('about/')
  })
  rMain.get('/about', function (req, res) {
    var agepre = (Date.now() / 1000 - dataMe.birth) / (60 * 60 * 24 * 365)
    res.send(pages.about({
      age: Math.round(agepre * 10) / 10,
      agepre}))
  })
  rMain.get('/data/me/', function (req, res) {
    dataMe.age = Math.floor(Date.now() / 1000) - dataMe.birth
    res.send(dataMe)
  })
  rMain.get('/tweets', function (req, res) {
    res.redirect('https://twitter.com/WtmMao')
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

  return function (req, res, next) {
    if (req.hostname === 'maowtm.org') {
      rMain(req, res, next)
    } else {
      next()
    }
  }
}
