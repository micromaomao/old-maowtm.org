const express = require('express')
const _pages = require('../../pages')
let pages

module.exports = function (db, lock) {
  let mongoose = db
  pages = _pages(db)
  const {PastPaperIndex, PastPaperDoc} = require('../../lib/pastPaperIndex')(db)

  let rMain = express.Router()

  rMain.get('/', function (req, res, next) {
    res.send(pages.schsrch({}))
  })
  rMain.get('/search/fullText/:q', function (req, res, next) {
    let query = req.params.q.trim()
    PastPaperIndex.search(query).then(result => {
      res.send(result)
    }).catch(err => {
      next(err)
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
