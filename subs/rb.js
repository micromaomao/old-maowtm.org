const express = require('express')
const _pages = require('../pages')
let pages

module.exports = function (db, lock) {
  let mongoose = db
  pages = _pages(db)
  mongoose.Schema = require('mongoose').Schema

  let rbAnoyMessageSchema = new mongoose.Schema({
    message: 'String',
    time: 'Number',
    deleted: {type: 'Boolean', default: false},
    to: 'String'
  })
  let RbAnoyMessage = mongoose.model('rbAnoyMessage', rbAnoyMessageSchema)

  let rRb = express.Router()

  rRb.get('/', function (req, res, next) {
    RbAnoyMessage.find({deleted: false, to: 'maowtm'}).sort({time: -1}).exec((err, msgs) => {
      if (err) {
        next(err)
        return
      }
      res.send(pages.rbIndex({msgs, index: true}))
    })
  })
  rRb.get('/pm/:to', function (req, res, next) {
    let to = req.params.to.trim()
    if (to.toLowerCase() !== to) {
      res.redirect('/pm/' + encodeURIComponent(to.toLowerCase()))
      return
    }
    RbAnoyMessage.find({deleted: false, to: to}).sort({time: -1}).exec((err, msgs) => {
      if (err) {
        next(err)
        return
      }
      res.send(pages.rbIndex({msgs, to: to}))
    })
  })
  rRb.post('/pm/:to', function (req, res, next) {
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
      let msg = new RbAnoyMessage({message: body, time: Date.now(), to: to})
      msg.save(err => {
        if (err) {
          next(err)
        } else {
          res.end()
        }
      })
    })
  })

  return function (req, res, next) {
    if (req.hostname === 'rb.maowtm.org') {
      rRb(req, res, next)
    } else {
      next()
    }
  }
}
