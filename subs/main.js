const express = require('express')
const _pages = require('../pages')
var pages

module.exports = function (db, lock) {
  var mongoose = db
  pages = _pages(db)
  mongoose.Schema = require('mongoose').Schema
  var rMain = express.Router()
  var rWww = express.Router()

  rWww.get('/', function (req, res) {
    res.redirect(302, 'https://maowtm.org')
  })
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

  return function (req, res, next) {
    if (req.hostname === 'www.maowtm.org') {
      rWww(req, res, next)
    } else if (req.hostname === 'maowtm.org') {
      rMain(req, res, next)
    } else {
      next()
    }
  }
}
