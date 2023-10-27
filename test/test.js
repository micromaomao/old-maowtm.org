/* global describe, it, before, after */
// Mocha test file.

const Maowtm = require('..')
const should = require('should')
const request = require('supertest')
const cheerio = require('cheerio')
const path = require('path')

const { MONGODB: DB, ES } = process.env

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason)
  console.error(reason.stack)
  process.exit(1)
})

try {
  DB.should.be.a.String().and.should.not.be.empty()
  ES.should.be.a.String().and.should.not.be.empty()
} catch (e) {
  console.log('You need to provide env MONGODB and ES. E.g. MONGODB=127.0.0.1 ES=http://127.0.0.1:9200')
  process.exit(1)
}

const initParm = {
  db: DB,
  elasticsearch: ES,
  noInitImages: true
}

describe('new maowtm(...)', function () {
  function makeDone (_done, destory) {
    return function (err) {
      try {
        destory.should.be.a.Function()
        destory()
        console.log(' -> Destroyed maowtm instance.')
      } catch (e) {
        _done(e)
        return
      }
      _done(err)
    }
  }
  it('should initialize', function (done) {
    var destory
    done = makeDone(done, function () {
      destory()
    })
    Maowtm(Object.assign({}, initParm, {
      callback: function (err, app, finalize) {
        destory = finalize
        if (err) {
          done(err)
          return
        }
        done()
      }
    }))
  })

  function makeErrorCallback (done, match) {
    return function (err, app, destory) {
      if (!err) {
        done(destory, new Error('No error was thrown'))
      } else {
        if (app) {
          done(destory, new Error('Error was thrown, but app is not null.'))
        } else {
          err.should.be.an.Object()
          err.message.should.match(match)
          done(destory)
        }
      }
    }
  }

  it('should throw error when db is not open', function (done) {
    var destory
    done = makeDone(done, function () {
      destory()
    })
    Maowtm(Object.assign({}, initParm, {
      db: 'mongodb://127.255.255.255/test',
      callback: makeErrorCallback(function (d, err) {
        destory = d
        done(err)
      }, /connect/)
    }))
  })
  it('should throw error when no SSL certificate was given', function (done) {
    var destory
    done = makeDone(done, function () {
      destory()
    })
    Maowtm(Object.assign({}, initParm, {
      db: DB,
      listen: '127.6.0.233',
      callback: makeErrorCallback(function (d, err) {
        destory = d
        done(err)
      }, /SSL/)
    }))
  })

  it('should redirect http to https', function (done) {
    var test
    var destory
    done = makeDone(done, function () {
      destory()
    })
    Maowtm(Object.assign({}, initParm, {
      db: DB,
      callback: function (err, app, finalize) {
        destory = finalize
        if (err) {
          done(err)
          return
        }
        test(app)
      }
    }))
    test = function (app) {
      request(app)
        .get('/somefilename')
        .expect(302)
        .expect('Location', /^https:\/\//)
        .end(done)
    }
  })
})

;(function () {
  var destory, appTest
  Maowtm(Object.assign({}, initParm, {
    db: DB,
    callback: function (err, app, finalize) {
      destory = finalize
      if (err) {
        throw err
      }
      appTest(app)
    },
    mockSecure: true
  }))

  appTest = function (app) {
    describe('Application', function () {
      after(function () {
        destory()
        console.log(' -> Destroyed maowtm instance.')
      })

      it('should send http protection headers', function (done) {
        function setExpects (agent, next) {
          agent.expect('Strict-Transport-Security', /max-age=\d+/)
          agent.expect('Strict-Transport-Security', /includeSubdomains/)
          agent.expect('Strict-Transport-Security', /preload/)
          agent.expect('X-XSS-Protection', /1/)
          agent.expect('X-Frame-Options', /sameorigin/)
          agent.expect('X-Content-Type-Options', /nosniff/)
          agent.end(function (err) {
            switch (true) {
              case err:
                done(err)
                break
              case next:
                next()
                break
              default:
                done()
                break
            }
          })
          return agent
        }
        var req = request(app)
        var tests = {
          root: function () {
            setExpects(req.get('/').set('Host', 'maowtm.org'), tests.notfind)
          },
          notfind: function () {
            setExpects(req.get('/404'))
          }
        }
        tests.root()
      })

      it('should ignore requests with no "Host" header', function (done) {
        request(app)
          .get('/')
          .set('Host', '')
          .expect(404)
          .end(done)
      })

      it('should redirect to directory', function (done) {
        request(app)
          .get('/404')
          .expect(302)
          .expect('Location', '/404/')
          .end(function (err) {
            if (err) {
              done(err)
              return
            }
            request(app)
              .get('/404/')
              .expect(404)
              .end(done)
          })
      })

      function notRedirected (res) {
        if (res.header.location) {
          throw new Error('Location header should not exist')
        }
        res.status.should.not.be.exactly(302)
      }
      it('should not redirect to directory (img.maowtm.org)', function (done) {
        this.timeout(5000)
        request(app)
          .get('/404')
          .set('Host', 'img.maowtm.org')
          .expect(notRedirected)
          .expect(404)
          .end(function (err) {
            if (err) {
              done(err)
              return
            }
            request(app)
              .get('/404/')
              .set('Host', 'img.maowtm.org')
              .expect(notRedirected)
              .end(done)
          })
      })
      it('should not redirect to directory (static.maowtm.org)', function (done) {
        request(app)
          .get('/404')
          .set('Host', 'static.maowtm.org')
          .expect(notRedirected)
          .end(function (err) {
            if (err) {
              done(err)
              return
            }
            request(app)
              .get('/404/')
              .set('Host', 'static.maowtm.org')
              .expect(notRedirected)
              .end(done)
          })
      })

      // it('should have static file (static.maowtm.org)', function (done) {
      //   request(app)
      //     .get('/script/layout.js')
      //     .set('Host', 'static.maowtm.org')
      //     .expect(200)
      //     .end(done)
      // })

      // function shouldRedirectDomain (from, to) {
      //   it(`should redirect ${from} to ${to}`, function (done) {
      //     request(app)
      //       .get('/')
      //       .set('Host', from)
      //       .expect(res => (res.status === 302 || res.status === 301).should.be.true())
      //       .expect('Location', 'https://' + to + '/')
      //       .end(done)
      //   })
      // }
      // shouldRedirectDomain('www.maowtm.org', 'maowtm.org')
      // shouldRedirectDomain('www.schsrch.xyz', 'paper.sc')
      // shouldRedirectDomain('beta.schsrch.xyz', 'paper.sc')
      // shouldRedirectDomain('schsrch.xyz', 'paper.sc')
      // shouldRedirectDomain('schsrch.org', 'paper.sc')
      // shouldRedirectDomain('www.schsrch.org', 'paper.sc')
      // shouldRedirectDomain('fuckcie.com', 'paper.sc')
      // shouldRedirectDomain('www.fuckcie.com', 'paper.sc')

      // it('should 200 for scripts', function (done) {
      //   request(app)
      //     .get('/script/layout.js')
      //     .set('Host', 'static.maowtm.org')
      //     .expect(200)
      //     .expect('Content-Type', /javascript/)
      //     .end(done)
      // })
      // it('should 200 for scripts (again)', function (done) {
      //   request(app)
      //     .get('/script/layout.js')
      //     .set('Host', 'static.maowtm.org')
      //     .expect(200)
      //     .expect('Content-Type', /javascript/)
      //     .end(done)
      // })
    })
  }
})()

describe('require("pages")', function () {
  const pages = require('../pages')()
  it('should have necessary pages', function (done) {
    should.exist(pages, 'expected pages module to exist.')
    should.exist(pages.layout, 'expected layout page to exist.')
    should.exist(pages.rbIndex, 'expected rbIndex page to exist.')
    should.exist(pages['home'], 'expected home page to exist.')
    should.exist(pages.error, 'expected error page to exist.')
    done()
  })
})
