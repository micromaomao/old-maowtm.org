#!/usr/bin/env node
const DB = process.env.MONGODB

const mongoose = require('mongoose')
let db = mongoose.createConnection(DB)

db.on('error', err => {
  console.error(err)
  process.exit(1)
})
db.on('open', () => {
  const {PastPaperIndex} = require('../lib/pastPaperIndex')(db)

  PastPaperIndex.search(process.argv.slice(2).join(' ')).then(res => {
    console.log(res)
    process.exit(0)
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })
})
