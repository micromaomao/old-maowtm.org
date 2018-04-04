const express = require('express')
const _pages = require('../pages')
const RelativeTime = require('../subs/reltime.js')
let pages

module.exports = function (db, lock) {
  let mongoose = db
  pages = _pages(db)
  mongoose.Schema = require('mongoose').Schema

  let rNcicgg = express.Router()

  let RbAnoyMessage = mongoose.model('rbAnoyMessage')

  rNcicgg.get('/', function (req, res, next) {
    RbAnoyMessage.find({deleted: false, to: 'ncic'}).sort({time: -1}).then(msgs => {
      res.send(pages.ncicgg({msgs, RelativeTime}))
    }, err => {
      next(err)
    })
  })

  return function (req, res, next) {
    if (req.hostname === 'ncic.gg') {
      rNcicgg(req, res, next)
    } else {
      next()
    }
  }
}
