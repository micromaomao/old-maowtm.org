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
  
  let rbSurveyResponseSchema = new mongoose.Schema({
    surveyId: 'String',
    time: 'Number',
    ip: 'String',
    response: 'String'
  })
  let RbSurveyResponse = mongoose.model('rbSurveyResponse', rbSurveyResponseSchema)

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

  const surveies = {
    'sciebpc-empire': {
      q: [
        {
          question: 'What is your age group?',
          answer: [
            '≤19', '20-34', '35-49', '50-64', '≥65'
          ],
          mode: 'single'
        },
        {
          question: 'Do you use WeChat? How often do you check it?',
          answer: [
            'Many times every day', 'One or few times every day', 'Few times a week', 'Never'
          ],
          mode: 'single'
        },
        {
          question: 'What is your current nationality?',
          mode: 'input',
          placeholder: 'US'
        },
        {
          question: 'What do you mostly do on WeChat?',
          answer: [
            'Chat with friends',
            'See how others are doing on Moment',
            'Pay expenses with WeChat Pay',
            'Share gaming achievements with WeChat Game',
            'Get information from official accounts',
            'Kill time',
            'WeRun motivates me to walk/exercise more'
          ],
          mode: 'select-orother'
        },
        {
          question: 'Do you think WeChat Pay will replace cash payment?',
          answer: ['Yes for sure', 'Maybe', 'No'],
          mode: 'single'
        },
        {
          question: 'What social network do you use the most?',
          answer: [
            'WeChat', 'QQ', 'Facebook', 'Weibo'
          ],
          mode: 'single-orother'
        },
        {
          question: 'On a scale of 1-5, how much do you depend on WeChat in your everyday life?',
          answer: [
            '1 (Not at all)', '2', '3', '4', "5 (Can't live without)"
          ],
          mode: 'single',
          singleLine: true
        },
        {
          question: 'On a scale of 1-5, rate your satisfaction with WeChat currently.',
          answer: [
            '1 (Not satisfied at all)', '2', '3', '4', '5 (Deeply impressed)'
          ],
          mode: 'single',
          singleLine: true
        },
        {
          question: 'Do you think WeChat will remain its current popularity after 10 years from now?',
          mode: 'open',
          placeholder: 'Required, please briefly explain why.'
        }
      ]
    }
  }
  rRb.get('/survey/:id', (req, res, next) => {
    let svid = req.params.id
    if (!surveies[svid]) {
      next()
      return
    }
    let sv = surveies[svid]
    res.send(pages.survey({id: svid, desc: sv.desc, q: sv.q}))
  })
  rRb.get('/survey/:id/success', (req, res, next) => {
    let svid = req.params.id
    if (!surveies[svid]) {
      next()
      return
    }
    res.send(pages.surveySuccess())
  })
  rRb.post('/survey/:id', function (req, res, next) {
    let ctype = req.get('Content-Type')
    let done = false
    if (ctype !== 'application/json') {
      res.status(415)
      res.send('Content type incorrect.')
      done = true
      return
    }
    let svid = req.params.id.trim()
    if (svid.length === 0) {
      res.status(403)
      res.send('What are you sending svid?')
      done = true
      return
    }
    if (!surveies[svid]) {
      res.status(404)
      res.send('Survey not found.')
      done = true
      return
    }
    let body = ''
    req.setEncoding('utf8')
    req.on('data', chunk => {
      if (done) return
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
      try {
        if (typeof JSON.parse(body) != 'object') {
          throw 1
        }
      } catch (e) {
        res.status(403)
        res.send('Content is not valid JSON.')
        return
      }
      let msg = new RbSurveyResponse({surveyId: svid, time: Date.now(), ip: req.ip, response: body})
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
