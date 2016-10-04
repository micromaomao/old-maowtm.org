const express = require('express')
const _pages = require('../pages')
let pages

module.exports = function (db, lock) {
  let mongoose = db
  pages = _pages(db)
  mongoose.Schema = require('mongoose').Schema
  let rMisc = express.Router()

  rMisc.use(function (req, res, next) {
    res.status(404)
    if (req.method !== 'GET') {
      next()
      return
    }
    res.send(pages.error({err: 404, req}))
  })

  return function (req, res, next) {
    rMisc(req, res, next)
  }
}
