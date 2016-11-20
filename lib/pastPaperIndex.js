const mongoose = require('mongoose')
mongoose.Promise = global.Promise

module.exports = db => {
  let docSchema = new mongoose.Schema({
    subject: 'String',
    time: 'String', // Eg. s12, w15, y16 (i.e. for speciman paper)
    type: 'String', // Eg. qp, ms, sp, sm etc.
    paper: 'Number',
    variant: 'Number',
    doc: 'Buffer',
    fileType: {type: 'String', default: 'pdf'},
    numPages: 'Number'
  })
  let indexSchema = new mongoose.Schema({
    doc: 'ObjectId',
    page: 'Number', // starts from 0
    content: 'String'
  })
  let PastPaperIndex
  let PastPaperDoc
  indexSchema.static('search', query => new Promise((resolve, reject) => {
    query = query.replace(/["'\+\-]/g, '')
    PastPaperIndex.find({$text: {$search: query}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}}).limit(10).exec((err, res) => {
      if (err) {
        reject(err)
        return
      }
      Promise.all(res.map(rs => new Promise((resolve, reject) => {
        PastPaperDoc.findOne({_id: rs.doc}, {doc: false}, (err, doc) => {
          if (err) {
            reject(err)
          } else if (!doc) {
            reject(new Error('Document not find.'))
          } else {
            rs.content = rs.content.replace(/\.{3,}/g, '...').replace(/\s{1,}/g, ' ')
            resolve({index: rs, doc: doc})
          }
        })
      }))).then(resolve, reject)
    })
  }))
  indexSchema.index({content: 'text'})
  PastPaperIndex = db.model('pastPaperIndex', indexSchema)
  PastPaperDoc = db.model('pastPaperDoc', docSchema)
  return {PastPaperDoc, PastPaperIndex}
}
