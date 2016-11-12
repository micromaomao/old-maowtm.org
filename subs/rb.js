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
      lang: 'zh/en',
      desc: '这是一个关于微信的调查。所有收集的数据仅做研究用途。数据为匿名收集并且无个人信息。感谢您抽出宝贵时间参与。 / This survey is about WeChat. All data is collected for research usage. No personal detail will be collected, and all response is anonymous. Thank you for helping us.',
      q: [
        {
          question: '请选择您的年龄段… / What is your age group?',
          answer: [
            '≤19', '20-34', '35-49', '50-64', '≥65'
          ],
          mode: 'single'
        },
        {
          question: '您使用微信吗？多久使用一次？ / Do you use WeChat? How often do you check it?',
          answer: [
            '一天使用多次 / Many times every day',
            '一天偶尔使用 / One or few times every day',
            '一周偶尔使用 / Few times a week',
            '从不使用 / Never'
          ],
          mode: 'single'
        },
        {
          question: '您的国籍？ / What is your nationality?',
          mode: 'input',
          placeholder: 'CN'
        },
        {
          question: '您主要用微信做什么？ / What do you mostly do using WeChat?',
          answer: [
            '聊天 / Chat with friends',
            '看朋友圈 / See how others are doing on Moment',
            '使用微信支付 / Pay expenses with WeChat Pay',
            '使用微信游戏 / Share gaming achievements with WeChat Game',
            '看公众号 / Get information from official accounts',
            '消磨时间 / Kill time',
            '使用微信运动 / WeRun motivates me to walk/exercise more'
          ],
          mode: 'select-orother'
        },
        {
          question: '您认为微信支付会取代现金支付吗？ / Do you think WeChat Pay will replace cash payment?',
          answer: ['会 / Yes for sure', '可能 / Maybe', '不会 / No'],
          mode: 'single'
        },
        {
          question: '您最常使用哪一种社交软件？ / What social network do you use the most?',
          answer: [
            '微信 / WeChat',
            'QQ',
            'Facebook',
            '微博 / Weibo'
          ],
          mode: 'single-orother'
        },
        {
          question: '在1-5的程度中，您在日常生活中对微信的依赖有多少？ / On a scale of 1-5, how much do you depend on WeChat in your everyday life?',
          answer: [
            '1 (一点也不依赖 / Not at all)', '2', '3', '4', "5 (无法离开微信 / Can't live without)"
          ],
          mode: 'single',
          singleLine: true
        },
        {
          question: '在1-5的程度中，您目前对微信的满意度是多少？ / On a scale of 1-5, rate your satisfaction with WeChat currently.',
          answer: [
            '1 (完全不满意 / Not satisfied at all)', '2', '3', '4', '5 (非常满意 / Deeply impressed)'
          ],
          mode: 'single',
          singleLine: true
        },
        {
          question: '您觉得微信在十年之后还能像今天一样受欢迎吗？ / Do you think WeChat will remain its current popularity after 10 years from now?',
          mode: 'open',
          placeholder: '必填，请简单解释原因 / Required, please briefly explain why.'
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
    res.send(pages.survey({id: svid, desc: sv.desc, q: sv.q, lang: sv.lang || 'en'}))
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
        if (typeof JSON.parse(body) !== 'object') {
          throw new Error()
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
