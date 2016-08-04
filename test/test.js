/* global describe, it, before, after */
// Mocha test file.

const Maowtm = require('..')
const should = require('should')
const request = require('supertest')
const lwip = require('lwip')

const DB = process.env.MONGODB
const REDIS = process.env.REDIS

try {
  DB.should.be.a.String().and.should.not.be.empty()
  REDIS.should.be.a.String().and.should.not.be.empty()
} catch (e) {
  console.log('You need to provide env MONGODB and REDIS. E.g. MONGODB=127.0.0.1 REDIS=127.0.0.1')
  process.exit(1)
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
    Maowtm({
      db: DB,
      redis: REDIS,
      callback: function (err, app, finalize) {
        destory = finalize
        if (err) {
          done(err)
          return
        }
        done()
      }
    })
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
    Maowtm({
      db: '127.255.255.255',
      redis: REDIS,
      callback: makeErrorCallback(function (d, err) {
        destory = d
        done(err)
      }, /connect/)
    })
  })
  it('should throw error when no SSL certificate was given', function (done) {
    var destory
    done = makeDone(done, function () {
      destory()
    })
    Maowtm({
      db: DB,
      redis: REDIS,
      listen: '127.6.0.233',
      callback: makeErrorCallback(function (d, err) {
        destory = d
        done(err)
      }, /SSL/)
    })
  })

  it('should answer acme-challenge', function (done) {
    var testACME
    var destory
    done = makeDone(done, function () {
      destory()
    })
    var acmeString = 'stubstubstub'
    Maowtm({
      db: DB,
      redis: REDIS,
      callback: function (err, app, finalize) {
        destory = finalize
        if (err) {
          done(err)
          return
        }
        testACME(app)
      },
      acme: acmeString
    })

    testACME = function (app) {
      request(app)
        .get('/.well-known/acme-challenge/acmehhh')
        .expect(200)
        .expect(acmeString)
        .end(done)
    }
  })
  it('should redirect http to https', function (done) {
    var test
    var destory
    done = makeDone(done, function () {
      destory()
    })
    Maowtm({
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
    })
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
  Maowtm({
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
  })

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
      it('should redirect www to @', function (done) {
        request(app)
          .get('/')
          .set('Host', 'www.maowtm.org')
          .expect(302)
          .expect('Location', 'https://maowtm.org')
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
    lwip.open(res.body, ext, function (err, lwipImg) {
      if (err) {
        done(err)
        return
      }
      var width = lwipImg.width()
      if (width >= widthTest && width - widthTest <= withIn) {
        done()
      } else {
        done(new Error('expected width to be ' + widthTest + '(+' + withIn + '), but ' + width + ' get.'))
      }
    })
  } catch (e) {
    done(e)
  }
}

(function () {
  var destory
  var maow = new Maowtm({
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
  })

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
              done();
            }
          }
        })
      })
      before(function (done) {
        lwip.open(require('path').join(__dirname, testImg), function (err, lwipImage) {
          if (err) {
            done(err)
            return
          }
          lwipImage.toBuffer('png', function (err, buffer) {
            if (err) {
              done(err)
              return
            }
            Image.update({name: testImg}, {name: testImg, width: lwipImage.width(), src: buffer}, {upsert: true}, function (err) {
              if (err) {
                done(err)
                return
              }
              console.log(' -> Add image ' + testImg + ' into database.')
              done()
            })
          })
        })
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
      it('should redirect for root', function (done) {
        request(app)
          .get('/')
          .query({width: 100})
          .set('Host', 'img.maowtm.org')
          .expect(302)
          .expect('Location', 'https://maowtm.org/img/')
          .end(done)
      })
      it('should return cached version if possible', function (done) {
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
              data: new Buffer(stub, 'utf-8')
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
              var bufstr = res.body.toString('utf-8')
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
  var maow = new Maowtm({
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
  })

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
      function r () {
        return parseInt(Math.random() * 100)
      }
      lwip.create(size, size, [r(), r(), r(), 100], function (err, lwipImage) {
        if (err) {
          done(err)
          return
        }
        lwipImage.toBuffer('png', function (err, buf) {
          if (err) {
            done(err)
            return
          }
          done(null, buf)
        })
      })
    }

    describe('static::image', function () {
      after(function () {
        destory()
        console.log(' -> Destroyed maowtm instance.')
      })
      it('should add image', function (done) {
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
              imgBuff2 = new Buffer('Stub!')
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
                  err.message.should.match(/Invalid [A-Za-z0-9]+ buffer/)
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
        const imgBuff = new Buffer('Stub!')
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
        const imgBuff = new Buffer('Stub!')
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
  const pages = require('../pages')
  it('should have necessary pages', function (done) {
    should.exist(pages)
    should.exist(pages.about)
    should.exist(pages.layout)
    done()
  })
})
