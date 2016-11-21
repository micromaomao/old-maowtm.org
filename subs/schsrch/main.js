const express = require('express')
const os = require('os')
const _pages = require('../../pages')
let pages

module.exports = function (db, lock) {
  pages = _pages(db)
  const {PastPaperIndex, PastPaperDoc} = require('../../lib/pastPaperIndex')(db)

  let rMain = express.Router()

  let viewCount = 0
  rMain.get('/vc', function (req, res) {
    res.send({vc: viewCount, uptime: os.loadavg()})
  })
  rMain.use(function (req, res, next) {
    viewCount ++
    setTimeout(function () {
      viewCount --
    }, 10000)
    next()
  })
  rMain.get('/', function (req, res, next) {
    res.send(pages.schsrch({}))
  })
  rMain.get('/search/fullText/:q', function (req, res, next) {
    let query = req.params.q.trim()
    PastPaperIndex.search(query).then(result => {
      Promise.all(result.map(rst => new Promise((resolve, reject) => {
        PastPaperDoc.find({subject: rst.doc.subject, time: rst.doc.time, paper: rst.doc.paper, variant: rst.doc.variant}, {_id: true, type: true}, (err, res) => {
          if (err) {
            resolve({doc: rst.doc, index: rst.index, related: []})
          } else {
            resolve({doc: rst.doc, index: rst.index, related: res.filter(x => x.type !== rst.doc.type)})
          }
        })
      }))).then(rst => res.send(rst)).catch(e => next(e))
    }).catch(err => {
      next(err)
    })
  })
  rMain.get('/search/pp/', function (req, res, next) {
    let query = {}
    if (req.query.subject) {
      query.subject = req.query.subject
    }
    if (req.query.time) {
      query.time = req.query.time
    }
    if (req.query.paper) {
      try {
        query.paper = parseInt(req.query.paper)
      } catch (e) {
        next(e)
        return
      }
    }
    if (req.query.variant) {
      try {
        query.variant = parseInt(req.query.variant)
      } catch (e) {
        next(e)
        return
      }
    }
    if (req.query.type) {
      query.type = req.query.type
    }
    PastPaperDoc.find(query, {doc: false}).exec((err, rst) => {
      if (err) {
        next(err)
        return
      }
      if (rst.length >= 50) {
        res.send([])
        return
      }
      res.send(rst)
    })
  })

  let rFile = express.Router()

  rFile.get('/:id', function (req, res, next) {
    let id = req.params.id
    PastPaperDoc.findOne({_id: id}, {doc: true, fileType: true}, (err, doc) => {
      if (err) {
        next(err)
      } else if (!doc) {
        next()
      } else {
        res.type(doc.fileType)
        res.send(doc.doc)
      }
    })
  })

  return function (req, res, next) {
    if (req.hostname === 'schsrch.xyz') {
      rMain(req, res, next)
    } else if (req.hostname === 'www.schsrch.xyz') {
      res.redirect('https://schsrch.xyz')
    } else if (req.hostname === 'file.schsrch.xyz') {
      rFile(req, res, next)
    } else {
      next()
    }
  }
}
