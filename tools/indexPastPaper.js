#!/usr/bin/env node
const DB = process.env.MONGODB

const mongoose = require('mongoose')
let db = mongoose.createConnection(DB)

const PDFJS = require('pdfjs-dist')
const fs = require('fs')

db.on('error', err => {
  console.error(err)
  process.exit(1)
})
db.on('open', () => {
  const {PastPaperIndex, PastPaperDoc} = require('../lib/pastPaperIndex')(db)

  const indexPdf = path => new Promise((resolve, reject) => {
    const fname = path.split('/').slice(-1)[0]
    let nameMat = fname.match(/^(\d+)_([a-z]\d\d)_([a-z]+)_(\d{1,2})\.pdf$/)
    if (!nameMat) {
      console.error(`Ignoring ${fname}...`)
      resolve()
      return
    }
    const [, subject, time, type, pv] = nameMat
    let paper
    let variant = 0
    paper = parseInt(pv[0])
    if (pv.length === 2) {
      variant = parseInt(pv[1])
    }
    fs.readFile(path, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      let pagePromises = []

      PDFJS.getDocument(new Uint8Array(data)).then(pdfDoc => new Promise((resolve, reject) => {
        const meta = {
          subject,
          time,
          type,
          paper: parseInt(paper),
          variant: parseInt(variant),
          fileType: 'pdf'
        }
        let doAddDoc = () => new Promise((resolve, reject) => {
          let doc = new PastPaperDoc(Object.assign({}, meta, {
            doc: data,
            numPages: pdfDoc.numPages
          }))
          let loadPage = page => new Promise((resolve, reject) => {
            let pIndex = page.pageIndex
            page.getTextContent().then(ct => {
              let textContent = ct.items.map(x => x.str).join('\n\n')
              let idx = new PastPaperIndex({
                doc: doc._id,
                page: pIndex,
                content: textContent
              })
              idx.save(err => {
                if (err) {
                  reject(err)
                  return
                }
                resolve()
              })
            }).catch(reject)
          })
          doc.save(err => {
            if (err) {
              reject(err)
              return
            }

            for (let pn = 1; pn <= pdfDoc.numPages; pn++) {
              pagePromises.push(pdfDoc.getPage(pn).then(page => loadPage(page)))
            }

            Promise.all(pagePromises).then(resolve, reject)
          })
        })
        PastPaperDoc.findOne(meta, (err, doc) => {
          if (err) {
            reject(err)
            return
          }
          if (!doc) {
            doAddDoc().then(resolve, reject)
          } else {
            console.log(`Removing old doc ${fname}`)
            PastPaperIndex.remove({doc: doc._id}, err => {
              if (err) {
                reject(err)
                return
              }
              doc.remove(err => {
                if (err) {
                  reject(err)
                  return
                }
                doAddDoc().then(resolve, reject)
              })
            })
          }
        })
      })).then(resolve).catch(reject)
    })
  })

  Promise.all(process.argv.slice(2).map(path => indexPdf(path))).then(() => process.exit(0)).catch(err => {
    console.error(err)
    process.exit(1)
  })
})
