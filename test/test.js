/* global describe, it, before, after */
// Mocha test file.

const Maowtm = require('..')
const should = require('should')
const request = require('supertest')
const sharp = require('sharp')
const cheerio = require('cheerio')
const path = require('path')

const { MONGODB: DB, REDIS, ES } = process.env

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason)
  console.error(reason.stack)
  process.exit(1)
})

try {
  DB.should.be.a.String().and.should.not.be.empty()
  REDIS.should.be.a.String().and.should.not.be.empty()
  ES.should.be.a.String().and.should.not.be.empty()
} catch (e) {
  console.log('You need to provide env MONGODB, REDIS and ES. E.g. MONGODB=127.0.0.1')
  process.exit(1)
}

const initParm = {
  db: DB,
  redis: REDIS,
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
      redis: REDIS,
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
      redis: REDIS,
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
      redis: REDIS,
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
    redis: REDIS,
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
      it('should have static file (static.maowtm.org)', function (done) {
        request(app)
          .get('/script/layout.js')
          .set('Host', 'static.maowtm.org')
          .expect(200)
          .end(done)
      })

      function shouldRedirectDomain (from, to) {
        it(`should redirect ${from} to ${to}`, function (done) {
          request(app)
            .get('/')
            .set('Host', from)
            .expect(302)
            .expect('Location', 'https://' + to + '/')
            .end(done)
        })
      }
      shouldRedirectDomain('www.maowtm.org', 'maowtm.org')
      shouldRedirectDomain('www.schsrch.xyz', 'paper.sc')
      shouldRedirectDomain('beta.schsrch.xyz', 'paper.sc')
      // shouldRedirectDomain('schsrch.xyz', 'paper.sc')
      shouldRedirectDomain('schsrch.org', 'paper.sc')
      shouldRedirectDomain('www.schsrch.org', 'paper.sc')
      shouldRedirectDomain('fuckcie.com', 'paper.sc')
      shouldRedirectDomain('www.fuckcie.com', 'paper.sc')

      it('should 200 for scripts', function (done) {
        request(app)
          .get('/script/layout.js')
          .set('Host', 'static.maowtm.org')
          .expect(200)
          .expect('Content-Type', /javascript/)
          .end(done)
      })
      it('should 200 for scripts (again)', function (done) {
        request(app)
          .get('/script/layout.js')
          .set('Host', 'static.maowtm.org')
          .expect(200)
          .expect('Content-Type', /javascript/)
          .end(done)
      })
    })
  }
})()

const imageTypeMatch = /^image\/[a-z]+$/
function assertWidthAtLeast (res, done, widthTest, withIn) {
  try {
    res.type.should.match(imageTypeMatch)
    var ext = res.type.split('/')[1]
    ext.should.be.a.String().and.should.not.be.empty()
    let sImg = sharp(res.body)
    sImg.metadata().then(metadata => {
      var width = metadata.width
      if (width >= widthTest && width - widthTest <= withIn) {
        done()
      } else {
        done(new Error('expected width to be ' + widthTest + '(+' + withIn + '), but ' + width + ' get.'))
      }
    }, err => done(err))
  } catch (e) {
    done(e)
  }
}

(function () {
  var destory
  var maow = new Maowtm(Object.assign({}, initParm, {
    db: DB,
    redis: REDIS,
    callback: function (err, app, finalize) {
      destory = finalize
      if (err) {
        throw err
      }
      imageTest(app)
    },
    mockSecure: true
  }))

  function imageTest (app) {
    const testImg = 'avatar.png'
    const testImgUrl = '/' + testImg
    var Image = maow.db.model('image')
    var CachedScale = maow.db.model('cachedScale')
    describe('static::image fetching', function () {
      before(function (done) {
        if (!Image || !CachedScale) {
          done(new Error('database not working.'))
          return
        }
        Image.findOne({name: testImg}, function (err, imgDoc) {
          if (err) {
            done(err)
          } else {
            if (imgDoc) {
              CachedScale.remove({imgId: imgDoc._id}, done)
              console.log(' -> Removing all cachedScale of ' + testImg)
            } else {
              done()
            }
          }
        })
      })
      before(function (done) {
        this.timeout(10000)
        let sImg = sharp(path.join(__dirname, testImg))
        sImg.metadata().then(metadata => {
          sImg.toFormat('png', {compressionLevel: 9})
            .toBuffer()
            .then(buffer => Image.update({name: testImg}, {name: testImg, width: metadata.width, src: buffer}, {upsert: true}))
            .then(() => {
              console.log(' -> Add image ' + testImg + ' into database.')
              done()
            }, err => done(err))
        }, err => done(err))
      })
      after(function () {
        destory()
        console.log(' -> Destroyed maowtm instance.')
      })
      it('should contain ' + testImg, function (done) {
        request(app)
          .get(testImgUrl)
          .set('Host', 'img.maowtm.org')
          .expect(200)
          .expect('Content-Type', imageTypeMatch)
          .end(done)
      })
      it('should return image with the width specified', function (done) {
        request(app)
          .get(testImgUrl)
          .set('Host', 'img.maowtm.org')
          .query({width: 100})
          .expect(200)
          .expect('Content-Type', imageTypeMatch)
          .end(function (err, res) {
            if (err) {
              done(err)
              return
            }
            assertWidthAtLeast(res, done, 100, 50)
          })
      })
      it('should redirect for width bigger than the image itself', function (done) {
        request(app)
          .get(testImgUrl)
          .set('Host', 'img.maowtm.org')
          .query({width: 10000})
          .expect(302)
          .expect('Location', testImgUrl)
          .end(done)
      })
      it('should redirect for illegal width (0)', function (done) {
        request(app)
          .get(testImgUrl)
          .set('Host', 'img.maowtm.org')
          .query({width: 0})
          .expect(302)
          .expect('Location', testImgUrl)
          .end(done)
      })
      it('should redirect for illegal width (negative)', function (done) {
        request(app)
          .get(testImgUrl)
          .set('Host', 'img.maowtm.org')
          .query({width: -10000})
          .expect(302)
          .expect('Location', testImgUrl)
          .end(done)
      })
      it('should redirect for illegal width (not number)', function (done) {
        request(app)
          .get(testImgUrl)
          .set('Host', 'img.maowtm.org')
          .query({width: 'null'})
          .expect(302)
          .expect('Location', testImgUrl)
          .end(done)
      })
      it('should redirect for not integer width', function (done) {
        request(app)
          .get(testImgUrl)
          .set('Host', 'img.maowtm.org')
          .query({width: 100.25})
          .expect(302)
          .expect('Location', testImgUrl + '?width=100')
          .end(done)
      })
      it('should redirect for illegal width (not number, preserve other arguments)', function (done) {
        request(app)
          .get(testImgUrl)
          .set('host', 'img.maowtm.org')
          .query({width: 'null', other: 'yes'})
          .expect(302)
          .expect('location', testImgUrl + '?other=yes')
          .end(done)
      })
      it('should redirect for not integer width (preserve other arguments)', function (done) {
        request(app)
          .get(testImgUrl)
          .query({width: 100.25, other: 'yes'})
          .set('Host', 'img.maowtm.org')
          .expect(302)
          .expect('Location', /^\/.+\.[a-zA-Z]{3}\?(width|other)=/)
          .expect('Location', /width=100/)
          .expect('Location', /other=yes/)
          .expect('Location', /(100|yes)$/)
          .end(done)
      })
      it('should give 404 for no existing image', function (done) {
        request(app)
          .get('/404')
          .set('Host', 'img.maowtm.org')
          .expect(404)
          .end(done)
      })
      it('should give 404 for no existing image (with width given)', function (done) {
        request(app)
          .get('/404')
          .query({width: 100})
          .set('Host', 'img.maowtm.org')
          .expect(404)
          .end(done)
      })
      it('should return page for root', function (done) {
        request(app)
          .get('/')
          .set('Host', 'img.maowtm.org')
          .expect(200)
          .expect('Content-Type', /^text\/html/)
          .end(done)
      })
      it('should return cached version if possible', function (done) {
        this.timeout(4000)
        var stub = 'Stub!'
        var stubId
        function before (done) {
          Image.findOne({name: testImg}, function (err, imgDoc) {
            if (err) {
              done(err)
              return
            }
            if (!imgDoc) {
              done(new Error("Image wasn't cached"))
              return
            }
            var cache = new CachedScale({
              imgId: imgDoc._id,
              scale: 300,
              format: 'png',
              data: Buffer.from(stub, 'utf8')
            })
            cache.save(function (err) {
              if (err) {
                done(err)
                return
              }
              console.log(' -> Saved fake cache.')
              stubId = cache._id
              done()
            })
          })
        }
        var _done = done
        done = function (err) {
          CachedScale.remove({_id: stubId}, function (e) {
            if (e) {
              _done(e)
              return
            }
            console.log(' -> Removed fake cache.')
            _done(err)
          })
        }
        before(function (err) {
          if (err) {
            done(err)
            return
          }
          request(app)
            .get(testImgUrl)
            .set('Host', 'img.maowtm.org')
            .query({width: 300})
            .expect(200)
            .expect('Content-Type', imageTypeMatch)
            .end(function (err, res) {
              if (err) {
                done(err)
                return
              }
              var bufstr = res.body.toString('utf8')
              if (bufstr === stub) {
                done()
              } else {
                done(new Error('Image was not read from cache.'))
              }
            })
        })
      })
    })
  }
})()

;(function () {
  var destory
  var maow = new Maowtm(Object.assign({}, initParm, {
    db: DB,
    redis: REDIS,
    callback: function (err, app, finalize) {
      destory = finalize
      if (err) {
        throw err
      }
      imageTest(app)
    },
    mockSecure: true
  }))

  function imageTest (app) {
    var Image = maow.db.model('image')
    var CachedScale = maow.db.model('cachedScale')

    function ensureImageNotExist (name, done) {
      if (!Image || !CachedScale) {
        done(new Error('database not working.'))
        return
      }
      Image.findOne({name: name}, function (err, imgFound) {
        if (err) {
          done(err)
          return
        }
        if (imgFound) {
          Image.remove({_id: imgFound._id}, function (err) {
            if (err) {
              done(err)
              return
            }
            console.log(' -> Removed image ' + name + ' for test.')
            CachedScale.remove({imgId: imgFound._id}, function (err) {
              if (err) {
                done(err)
                return
              }
              console.log(' -> Removed cached scale of image ' + name + ' for test.')
              done()
            })
          })
        } else {
          done()
        }
      })
    }
    function generateImage (size, done) {
      sharp(path.join(__dirname, 'white.png'))
        .resize(size, size)
        .toFormat('png', {compressionLevel: 9})
        .toBuffer()
        .then(buff => {
          done(null, buff)
        }, err => done(err))
    }

    describe('static::image', function () {
      after(function () {
        destory()
        console.log(' -> Destroyed maowtm instance.')
      })
      it('should add image', function (done) {
        this.timeout(6000)
        const imgName = '__test_image.png'
        const imgWidth = 500
        var imgBuff = null
        var test = {
          a: function () {
            ensureImageNotExist(imgName, function (err) {
              if (err) {
                done(err)
                return
              }
              test.b()
            })
          },
          b: function () {
            generateImage(imgWidth, function (err, buff) {
              if (err) {
                done(err)
                return
              }
              imgBuff = buff
              test.c()
            })
          },
          c: function () {
            Image.addImage(imgName, imgBuff, function (err) {
              if (err) {
                done(err)
                return
              }
              Image.findOne({name: imgName}, function (err, doc) {
                if (err) {
                  done(err)
                  return
                }
                try {
                  doc.name.should.be.exactly(imgName)
                  doc.width.should.be.exactly(imgWidth)
                  if (!imgBuff.equals(doc.src)) throw new Error('Image data not match.')
                  done()
                } catch (e) {
                  done(e)
                }
              })
            })
          }
        }
        test.a()
      })
      it('should replace image', function (done) {
        this.timeout(6000)
        const imgName = '__test_image_replace.png'
        const imgWidth = 500
        const imgWidthCacheStub = 200
        const imgWidth2 = 400
        var imgBuff = null
        var imgBuffCacheStub = null
        var imgBuff2 = null
        var imgIdCacheStub = null
        var test = {
          a: function () {
            ensureImageNotExist(imgName, function (err) {
              if (err) {
                done(err)
                return
              }
              test.b()
            })
          },
          b: function () {
            generateImage(imgWidth, function (err, buff) {
              if (err) {
                done(err)
                return
              }
              imgBuff = buff
              generateImage(imgWidth2, function (err, buff) {
                if (err) {
                  done(err)
                  return
                }
                imgBuff2 = buff
                generateImage(imgWidthCacheStub, function (err, buff) {
                  if (err) {
                    done(err)
                    return
                  }
                  imgBuffCacheStub = buff
                  test.c()
                })
              })
            })
          },
          c: function () {
            var imgDoc = new Image({ name: imgName, width: imgWidth, src: imgBuff })
            imgDoc.save(function (err) {
              if (err) {
                done(err)
                return
              }
              var testCache = new CachedScale({ imgId: imgDoc._id, scale: imgWidthCacheStub, data: imgBuffCacheStub })
              testCache.save(function (err) {
                if (err) {
                  done(err)
                  return
                }
                imgIdCacheStub = testCache._id
                test.d()
              })
            })
          },
          d: function () {
            Image.addImage(imgName, imgBuff2, function (err) {
              if (err) {
                done(err)
                return
              }
              Image.findOne({name: imgName}, function (err, doc) {
                if (err) {
                  done(err)
                  return
                }
                try {
                  doc.name.should.be.exactly(imgName)
                  doc.width.should.be.exactly(imgWidth2)
                  if (!imgBuff2.equals(doc.src)) throw new Error('Image data not match.')
                  test.e()
                } catch (e) {
                  done(e)
                }
              })
            })
          },
          e: function () {
            CachedScale.findOne({ _id: imgIdCacheStub }, function (err, cachedDoc) {
              if (err) {
                done(err)
                return
              }
              if (cachedDoc) {
                done(new Error('Cache was not removed.'))
              } else {
                done()
              }
            })
          }
        }
        test.a()
      })
      it('should not replace image with invalid buffer', function (done) {
        const imgName = '__test_image_replace_invalid.png'
        const imgWidth = 500
        var imgBuff = null
        var imgBuff2 = null
        var test = {
          a: function () {
            ensureImageNotExist(imgName, function (err) {
              if (err) {
                done(err)
                return
              }
              test.b()
            })
          },
          b: function () {
            generateImage(imgWidth, function (err, buff) {
              if (err) {
                done(err)
                return
              }
              imgBuff = buff
              imgBuff2 = Buffer.from('Stub!', 'utf8')
              test.c()
            })
          },
          c: function () {
            var imgDoc = new Image({ name: imgName, width: imgWidth, src: imgBuff })
            imgDoc.save(function (err) {
              if (err) {
                done(err)
                return
              }
              test.d()
            })
          },
          d: function () {
            Image.addImage(imgName, imgBuff2, function (err) {
              if (err) {
                try {
                  err.message.should.match(/unsupported/)
                  test.e()
                } catch (e) {
                  done(e)
                }
              } else {
                done(new Error('No error was produced.'))
              }
            })
          },
          e: function () {
            Image.findOne({name: imgName}, function (err, doc) {
              if (err) {
                done(err)
                return
              }
              if (!doc) {
                done(new Error('Original image disappeared.'))
              } else {
                try {
                  doc.name.should.be.exactly(imgName)
                  doc.width.should.be.exactly(imgWidth)
                  if (!imgBuff.equals(doc.src)) throw new Error('Image data not match.')
                  done()
                } catch (e) {
                  done(new Error('Original image modified: ' + e.message))
                }
              }
            })
          }
        }
        test.a()
      })
      it('should throw error when format is not supported', function (done) {
        const imgName = '__test_image_format.bmp'
        const imgBuff = Buffer.from('Stub!', 'utf8')
        Image.addImage(imgName, imgBuff, function (err) {
          if (!err) {
            done(new Error('No error was produced.'))
          } else {
            try {
              err.message.should.match(/Format not supported/)
              err.message.should.match(/BMP/)
              done()
            } catch (e) {
              done(e)
            }
          }
        })
      })
      it('should throw error when extension is not provided', function (done) {
        const imgName = '__test_image_noformat'
        const imgBuff = Buffer.from('Stub!', 'utf8')
        Image.addImage(imgName, imgBuff, function (err) {
          if (!err) {
            done(new Error('No error was produced.'))
          } else {
            try {
              err.message.should.match(/Extension not provided/)
              done()
            } catch (e) {
              done(e)
            }
          }
        })
      })
    })
  }
})()

describe('require("pages")', function () {
  const pages = require('../pages')()
  it('should have necessary pages', function (done) {
    should.exist(pages, 'expected pages module to exist.')
    should.exist(pages.layout, 'expected layout page to exist.')
    should.exist(pages.rbIndex, 'expected rbIndex page to exist.')
    should.exist(pages['mainsite/Main_Page'], 'expected mainsite/Main_Page page to exist.')
    should.exist(pages.error, 'expected error page to exist.')
    done()
  })
})

;(function () {
  let destory
  let maow = new Maowtm(Object.assign({}, initParm, {
    db: DB,
    redis: REDIS,
    callback: function (err, app, finalize) {
      destory = finalize
      if (err) {
        throw err
      }
      rbTest(app)
    },
    mockSecure: true
  }))

  function rbTest (app) {
    describe('rb.maowtm.org/pm/...', () => {
      after(() => {
        destory()
        console.log(' -> Destroyed maowtm instance.')
      })

      const RbAnoyMessage = maow.db.model('rbAnoyMessage')
      const testUrl = '/pm/alice/'

      before(done => {
        RbAnoyMessage.remove({}, err => {
          if (err) {
            done(err)
            return
          }
          console.log('Removed all rbAnoyMessage for test')
          done()
        })
      })

      let zeroMsgTest = done => {
        request(app)
          .get(testUrl)
          .set('Host', 'rb.maowtm.org')
          .expect(200)
          .expect(res => res.type.should.match(/^text\/html(;|$)/))
          .end((err, res) => {
            if (err) {
              done(err)
              return
            }
            try {
              let $ = cheerio.load(res.text)
              let msgs = $('.msgs')
              msgs.length.should.equal(1, 'There must only be one .msgs container.')
              msgs.find('.msg').length.should.equal(0, 'There must be no message present.')
              done()
            } catch (e) {
              done(e)
            }
          })
      }

      it('should not show anything for a new name', zeroMsgTest)
      it('should not add empty message', done => {
        request(app)
          .post(testUrl)
          .set('Host', 'rb.maowtm.org')
          .type('text')
          .send('')
          .expect(403)
          .end(done)
      })
      it('should not add over length message', done => {
        request(app)
          .post(testUrl)
          .set('Host', 'rb.maowtm.org')
          .type('text')
          .send('x'.repeat(256))
          .expect(413)
          .end(done)
      })
      it('should not add empty message with only spaces in it', done => {
        request(app)
          .post(testUrl)
          .set('Host', 'rb.maowtm.org')
          .type('text')
          .send(' \n\r\t')
          .expect(403)
          .end(done)
      })
      it('should not add message to no-namers', done => {
        request(app)
          .post('/pm/%20/')
          .set('Host', 'rb.maowtm.org')
          .type('text')
          .send('message')
          .expect(403)
          .end(done)
      })
      it('should not add message to long namers', done => {
        request(app)
          .post('/pm/' + ('x'.repeat(21)) + '/')
          .set('Host', 'rb.maowtm.org')
          .type('text')
          .send('message')
          .expect(413)
          .end(done)
      })
      it('should add message to other names', done => {
        request(app)
          .post('/pm/bob/')
          .set('Host', 'rb.maowtm.org')
          .type('text')
          .send('message')
          .expect(200)
          .end(done)
      })
      it('should not show anything for the old name', zeroMsgTest)
      let testOneMessage = (url, msgText) => done => {
        request(app)
          .get(url)
          .set('Host', 'rb.maowtm.org')
          .expect(200)
          .expect(res => res.type.should.match(/^text\/html(;|$)/))
          .end((err, res) => {
            if (err) {
              done(err)
              return
            }
            try {
              let $ = cheerio.load(res.text)
              let msgs = $('.msgs')
              msgs.length.should.equal(1, 'There must only be one .msgs container.')
              let msg = msgs.find('.msg')
              msg.length.should.equal(1, 'There must be one message present.')
              msg.find('p').text().should.equal(msgText, `The message text must be ${msgText}.`)
              done()
            } catch (e) {
              done(e)
            }
          })
      }
      let msNewNameTest = testOneMessage('/pm/bob/', 'message')
      it('should show the message for the new name', msNewNameTest)
      it('should add message', done => {
        request(app)
          .post(testUrl)
          .set('Host', 'rb.maowtm.org')
          .type('text')
          .send('msg')
          .expect(200)
          .end(done)
      })
      it('should show the message', testOneMessage(testUrl, 'msg'))
      it('should add another message', done => {
        request(app)
          .post(testUrl)
          .set('Host', 'rb.maowtm.org')
          .type('text')
          .send('msg2')
          .expect(200)
          .end(done)
      })
      it('should show the two message', done => {
        request(app)
          .get(testUrl)
          .set('Host', 'rb.maowtm.org')
          .expect(200)
          .expect(res => res.type.should.match(/^text\/html(;|$)/))
          .end((err, res) => {
            if (err) {
              done(err)
              return
            }
            try {
              let $ = cheerio.load(res.text)
              let msgs = $('.msgs')
              msgs.length.should.equal(1, 'There must only be one .msgs container.')
              let msg = msgs.find('.msg')
              msg.length.should.equal(2, 'There must be two message present.')
              msg.eq(0).find('p').text().should.equal('msg2', 'The message text must be right.')
              msg.eq(1).find('p').text().should.equal('msg', 'The message text must be right.')
              done()
            } catch (e) {
              done(e)
            }
          })
      })
      it('should still show the message for the new name', msNewNameTest)
      it('should add message to maowtm', done => {
        request(app)
          .post('/pm/maowtm/')
          .set('Host', 'rb.maowtm.org')
          .type('text')
          .send('msg3')
          .expect(200)
          .end(done)
      })
      it('should show the message', testOneMessage('/pm/maowtm/', 'msg3'))
      it('should show the message on /', testOneMessage('/', 'msg3'))
      it('should redirect non-lowercase name', done => {
        request(app)
          .get('/pm/AliCe/')
          .set('Host', 'rb.maowtm.org')
          .expect('Location', '/pm/alice')
          .end(done)
      })
      it('should redirect non-lowercase name', done => {
        request(app)
          .get('/pm/Bob/')
          .set('Host', 'rb.maowtm.org')
          .expect('Location', '/pm/bob')
          .end(done)
      })
      it('should add message to non-lowercase name', done => {
        request(app)
          .post('/pm/Eve/')
          .set('Host', 'rb.maowtm.org')
          .type('text')
          .send('msg')
          .expect(200)
          .end(err => {
            if (err) {
              done(err)
              return
            }
            testOneMessage('/pm/eve/', 'msg')(done)
          })
      })
    })
  }
})()
;(function () {
  let destory
  let maow = new Maowtm(Object.assign({}, initParm, {
    db: DB,
    redis: REDIS,
    callback: function (err, app, finalize) {
      destory = finalize
      if (err) {
        throw err
      }
      rbTest(app)
    },
    mockSecure: true
  }))

  function rbTest (app) {
    describe('rb.maowtm.org/survey/...', () => {
      after(() => {
        destory()
        console.log(' -> Destroyed maowtm instance.')
      })

      const RbSurveyResponse = maow.db.model('rbSurveyResponse')
      const testSurvey = '__unit_test'
      const testUrl = `/survey/${testSurvey}/`

      before(done => {
        RbSurveyResponse.remove({surveyId: testSurvey}, err => {
          if (err) {
            done(err)
            return
          }
          console.log('Removed all rbSurveyResponse:surveyId=__unit_test for test')
          done()
        })
      })

      it('should show survey', done => {
        function getTypeCheck (mod) {
          switch (mod) {
            case 'single':
              return 'radio'
            case 'select':
              return 'checkbox'
            default:
              throw new Error(`Mode ${mod} invalid.`)
          }
        }
        function testAnChoose (an, i, mode, idx) {
          let t = ('HELlO')[idx]
          let ipt = an.find('input')
          ipt.length.should.equal(1, 'Only one input')
          ipt.attr('type').should.equal(getTypeCheck(mode), 'input[type=...]')
          let idCheck = `q${i}s${idx}`
          ipt.attr('id').should.equal(idCheck, 'input[id=qxsx]')
          let lab = an.find('label')
          lab.length.should.equal(1, 'One label')
          lab.text().should.equal(t, 'Answer text')
          lab.attr('for').should.equal(idCheck, 'label[for]')
        }
        function testOthr (an, i, mode, idx) {
          let ipt = an.find('input')
          ipt.length.should.equal(2, 'Two input element')
          let chooseIpt = ipt.eq(0)
          chooseIpt.attr('type').should.equal(getTypeCheck(mode), 'input[type=...]')
          chooseIpt.attr('id').should.equal(`q${i}sothr`, 'input[id=qxsothr]')
          let othrIpt = ipt.eq(1)
          othrIpt.attr('type').should.equal('text', 'input[type=text]')
          othrIpt.hasClass('opsy').should.be.true('Input box should have opsy class')
        }
        request(app)
          .get(testUrl)
          .set('Host', 'rb.maowtm.org')
          .expect(200)
          .expect(res => res.type.should.match(/^text\/html(;|$)/))
          .end((err, res) => {
            if (err) {
              done(err)
              return
            }
            try {
              let $ = cheerio.load(res.text)
              let ques = $('.que')
              ques.length.should.equal(6, 'There should be 6 questions.')
              for (let i = 0; i < 6; i++) {
                let que
                let mod
                let ans
                switch (i) {
                  case 0:
                    que = ques.eq(i)
                    mod = que.data('mod')
                    mod.should.equal('single', 'Question 1 should be mode/single.')
                    que.find('.h').text().should.equal('1. single', 'Question heading')
                    ans = que.find('.ans')
                    ans.length.should.equal(5, '5 answers')
                    ans.each((idx, an) => {
                      an = $(an)
                      testAnChoose(an, i, mod, idx)
                    })
                    break
                  case 1:
                    que = ques.eq(i)
                    mod = que.data('mod')
                    mod.should.equal('select', 'Question 2 should be mode/select.')
                    que.find('.h').text().should.equal('2. select', 'Question heading')
                    ans = que.find('.ans')
                    ans.length.should.equal(5, '5 answers')
                    ans.each((idx, an) => {
                      an = $(an)
                      testAnChoose(an, i, mod, idx)
                    })
                    break
                  case 2:
                    que = ques.eq(i)
                    mod = que.data('mod')
                    mod.should.equal('single', 'Question 3 should be mode/single.')
                    que.find('.h').text().should.equal('3. single-orother', 'Question heading')
                    ans = que.find('.ans')
                    ans.length.should.equal(6, '6 answers')
                    ans.each((idx, an) => {
                      an = $(an)
                      if (idx < 5) testAnChoose(an, i, mod, idx)
                      else testOthr(an, i, mod, idx)
                    })
                    break
                  case 3:
                    que = ques.eq(i)
                    mod = que.data('mod')
                    mod.should.equal('select', 'Question 4 should be mode/select.')
                    que.find('.h').text().should.equal('4. select-orother', 'Question heading')
                    ans = que.find('.ans')
                    ans.length.should.equal(6, '6 answers')
                    ans.each((idx, an) => {
                      an = $(an)
                      if (idx < 5) testAnChoose(an, i, mod, idx)
                      else testOthr(an, i, mod, idx)
                    })
                    break
                  case 4:
                    que = ques.eq(i)
                    mod = que.data('mod')
                    mod.should.equal('input', 'Question 5 should be mode/input.')
                    que.find('.h').text().should.equal('5. input', 'Question heading')
                    ans = que.find('.ans')
                    ans.length.should.equal(1, '1 answers')
                    ans.find('input[type=text]').length.should.equal(1, 'Should have input box')
                    break
                  case 5:
                    que = ques.eq(i)
                    mod = que.data('mod')
                    mod.should.equal('open', 'Question 6 should be mode/open.')
                    que.find('.h').text().should.equal('6. open', 'Question heading')
                    ans = que.find('.ans')
                    ans.length.should.equal(1, '1 answers')
                    ans.find('textarea').length.should.equal(1, 'Should have input box')
                    break
                }
              }
              done()
            } catch (e) {
              done(e)
            }
          })
      })
      it('should not submit empty survey', done => {
        request(app)
          .post(testUrl)
          .set('Host', 'rb.maowtm.org')
          .type('json')
          .send(' \n\r\t')
          .expect(403)
          .end(done)
      })
      it('should only accept JSON', done => {
        request(app)
          .post(testUrl)
          .set('Host', 'rb.maowtm.org')
          .type('json')
          .send('{not-valid-json}')
          .expect(403)
          .end(done)
      })
      it('should not accept response for non-existing survey', done => {
        request(app)
          .post('/survey/__')
          .set('Host', 'rb.maowtm.org')
          .type('json')
          .send('{}')
          .expect(404)
          .end(done)
      })
      it('should submit response', done => {
        let payload = `{"test": ${JSON.stringify(Math.floor(Math.random() * 256).toString(16))}}`
        request(app)
          .post(testUrl)
          .set('Host', 'rb.maowtm.org')
          .type('json')
          .send(payload)
          .expect(200)
          .end(err => {
            if (err) {
              done(err)
              return
            }
            RbSurveyResponse.find({surveyId: testSurvey}, (err, doc) => {
              if (err) {
                done(err)
                return
              }
              try {
                doc.length.should.equal(1, 'One response should be there.')
                doc[0].response.should.equal(payload, 'Response should be right.')
                done()
              } catch (e) {
                done(e)
              }
            })
          })
      })
      it('should have success page', done => {
        request(app)
          .get(testUrl + 'success/')
          .set('Host', 'rb.maowtm.org')
          .expect(200)
          .expect(res => res.type.should.match(/^text\/html(;|$)/))
          .end((err, res) => {
            if (err) {
              done(err)
              return
            }
            try {
              res.text.should.match(/[Tt]hank [Yy]ou/, 'Should say thank you.')
              done()
            } catch (e) {
              done(e)
            }
          })
      })
      it('should not have success page for non-existing survey', done => {
        request(app)
          .get('/survey/__/success/')
          .set('Host', 'rb.maowtm.org')
          .expect(404)
          .end(done)
      })
    })
  }
})()
