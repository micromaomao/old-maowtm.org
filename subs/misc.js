const express = require('express')
const _pages = require('../pages')
let pages

module.exports = function (db, lock) {
  let mongoose = db
  pages = _pages(db)
  mongoose.Schema = require('mongoose').Schema
  let rMisc = express.Router()

  rMisc.use(function (req, res, next) {
    if (req.method === 'GET') {
      if (req.hostname &&
          (/^(beta|www)\.schsrch\.xyz$/.test(req.hostname) || /^(www\.)?schsrch\.org$/.test(req.hostname) || /^(www\.)?fuckcie\.com$/.test(req.hostname))) {
        res.redirect('https://schsrch.xyz' + req.path)
        return
      }
      if (req.hostname === 'www.maowtm.org') {
        res.redirect('https://maowtm.org/')
        return
      }
      if (req.hostname === 'www.mww.moe') {
        res.redirect('https://mww.moe')
        return
      }
    }
    next()
  })

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
