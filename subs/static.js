const express = require('express')
const sharp = require('sharp')
const qs = require('querystring')
const UglifyJS = require('uglify-js')
const staticCache = require('../static-cache')
const path = require('path')

module.exports = function (db, lock) {
  let mongoose = db
  let pages = require('../pages')(db)
  mongoose.Schema = require('mongoose').Schema
  let imageSchema = new mongoose.Schema({
    name: {type: 'String', index: true},
    src: 'Buffer',
    width: 'Number'
  })
  let cachedScaleSchema = new mongoose.Schema({
    imgId: {type: 'ObjectId', index: true},
    scale: {type: 'Number', index: true},
    format: {type: 'String', index: true},
    data: 'Buffer'
  })

  // These stuff "cache" images ( and their different sizes, when needed ) to database.

  // See http://sharp.dimens.io/en/stable/#formats
  const validExtensions = [
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'tiff'
  ]

  /**
   * Add or replace image with name `imgName` with `buffer`.
   * @param imgName string an unique name of the image. Extension must be included.
   * @param imageData Buffer raw data of the image.
   * @param callback function(err)
   */
  imageSchema.static('addImage', function (imgName, imageData, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Illegal / no callback.')
    }
    if (typeof imgName !== 'string' || imgName.length <= 0 ||
      !Buffer.isBuffer(imageData) || imageData.length <= 0) {
      return callback(new Error('Illegal argument.'))
    }
    var ext = imgName.match(/\.([a-zA-Z0-9]+)$/)
    if (!ext) {
      return callback(new Error('Extension not provided.'))
    }
    ext = ext[1]
    if (validExtensions.indexOf(ext) < 0) {
      return callback(new Error(ext.toUpperCase() + ': Format not supported.'))
    }
    let sImg = sharp(imageData)
    sImg.metadata().then(metadata =>
      sImg.toFormat('png', {compressionLevel: 9}).toBuffer()
        .then(buffer =>
          Image.findOne({name: imgName}).then(existiingImgDoc => new Promise((resolve, reject) => {
            if (existiingImgDoc) {
              new Image(existiingImgDoc).purge(function (err) {
                if (err) {
                  reject(err)
                  return
                }
                resolve()
              })
            } else {
              resolve()
            }
          })).then(() => new Image({name: imgName, src: buffer, width: metadata.width}).save()))
    ).then(() => callback(), err => callback(err))
  })
  /**
   * Read a image cache from database. The nearest 50px scale will be returned. If there isn't already
   * a cached scaled image for the caller to use, one will be created. If the width provided is larger
   * than the width of the original image, the original will be returned.
   * @param scale integer width in px.
   * @param callback function(err, buffer) the function to give data to.
   */
  imageSchema.method('queryScale', function (scale, format, callback) {
    if (typeof format !== 'string') {
      callback = format
      format = 'png'
    }
    if (typeof callback !== 'function') {
      throw new Error('Illegal callback.')
    }
    if (!Number.isFinite(scale) && scale > 0) {
      if (format === 'png') {
        callback(null, this.src)
        return
      } else {
        scale = this.width
      }
    }
    if (!Number.isInteger(scale) || scale <= 0) {
      return callback(new Error('Illegal argument.'))
    }
    scale = Math.ceil(scale / 50) * 50
    if (scale >= this.width) {
      if (format === 'png') {
        callback(null, this.src)
        return
      } else {
        scale = this.width
      }
    }
    var th = this
    // Lock the image to prevent double-caching.
    lock('imageCaching\t' + th._id.toString(), function (done) {
      CachedScale.findOne({ imgId: th._id, scale: scale, format: format }, function (err, cachedDoc) {
        if (err) {
          callback(err, null)
          done()
        } else {
          if (cachedDoc) {
            callback(null, cachedDoc.data)
            done()
          } else {
            createImageScale()
          }
        }
      })
      function createImageScale () {
        var cachedDoc = new CachedScale({
          imgId: th._id,
          scale: scale,
          format: format
        })
        sharp(th.src).metadata()
          .then(metadata => sharp(th.src).resize(scale, Math.round((scale / metadata.width) * metadata.height)).toFormat('png', {compressionLevel: 9})
            .toBuffer())
          .then(buffer => {
            cachedDoc.set('data', buffer)
            console.log(`Saving ${scale}@${format} for ${th.name}...`)
            return cachedDoc.save().then(() => Promise.resolve(buffer))
          }).then(buffer => {
            callback(null, buffer)
            done()
          }, err => callback(err))
      }
    })
  })
  /*
   * Remove the image and all it's cache from database.
   */
  imageSchema.method('purge', function (callback) {
    if (typeof callback !== 'function') {
      throw new Error('Illegal callback.')
    }
    var _id = this._id
    lock('imageCaching\t' + _id.toString(), function (done) {
      CachedScale.remove({imgId: _id}, function (err) {
        if (err) {
          callback(err)
          done()
          return
        }
        Image.remove({_id: _id}, function (err) {
          callback(err)
          done()
        })
      })
    })
  })

  var Image = mongoose.model('image', imageSchema)
  var CachedScale = mongoose.model('cachedScale', cachedScaleSchema)

  var rStatic = express.Router()
  let compressJs = process.env.NODE_ENV === 'production'
  rStatic.use(function (req, res, next) {
    if (!req.path.match(/\.js$/) || req.path.match(/^\/script-lab\//)) {
      return next()
    }
    staticCache(req.path, function (fileName, data, done) {
      if (!compressJs) {
        done(null, '// Javascript minify disabled because NODE_ENV.\n' + data)
        return
      }
      var headComment = '// Minified js. Source: https://github.com/micromaomao/maowtm.org/tree/master/static/' + fileName + '\n\n'
      try {
        var result = UglifyJS.minify(data, {fromString: true})
        if (result.code) {
          done(null, headComment + result.code)
        } else if (result.error) {
          done(result.error)
        } else {
          done(new Error("Can't minify js."))
        }
      } catch (e) {
        done(e)
      }
    }, function (err, data) {
      if (err) {
        return next(err)
      }
      if (!data) {
        return next()
      }
      res.type('.js')
      res.send(data)
    })
  })
  rStatic.use(function (req, res, next) {
    var pathMatch = req.path.match(/\.(svg|xml)$/)
    if (!pathMatch) {
      return next()
    }
    var ext = pathMatch[1]
    staticCache(req.path, function (fileName, data, done) {
      var headComment = '<!-- Compactify-ed xml. Source: https://github.com/micromaomao/maowtm.org/tree/master/static/' + fileName + ' -->\n\n'
      try {
        var result = headComment + data.replace(/\n\s{0,}/g, ' ')
        done(null, result)
      } catch (e) {
        done(e)
      }
    }, function (err, data) {
      if (err) {
        return next(err)
      }
      if (!data) {
        return next()
      }
      res.type('.' + ext)
      res.send(data)
    })
  })
  rStatic.use(express.static(path.join(__dirname, '..', 'static')))
  var rImg = express.Router({
    strict: true
  })
  rImg.get('/', function (req, res) {
    res.send(pages.imgIndex())
  })
  rImg.get(/^\/(.+)$/, function (req, res, next) {
    // let requestPage = /^text\/html/.test(req.get('accept'))
    let desiredWidth = parseInt(req.query.width)
    let desiredFormat = req.query.as || 'png'
    if (!validExtensions.find(x => x === desiredFormat)) {
      delete req.query.as
      let qr = qs.stringify(req.query)
      if (qr.length > 0) {
        qr = '?' + qr
      }
      res.redirect(302, req.path + qr)
      return
    }
    let imgName = req.params[0]
    if (!req.query.width || Number.isNaN(desiredWidth) || desiredWidth <= 0) {
      desiredWidth = Infinity
    }
    function doResponse (imgName, notFind) {
      Image.findOne({ name: imgName }, function (err, img) {
        if (err) {
          next(err)
        } else if (!img) {
          if (imgName === 's/404.png' || notFind) {
            next()
            return
          }
          doResponse('s/404.png', true)
        } else {
          if (req.query.width) {
            if (desiredWidth >= img.width) {
              delete req.query.width
              let qr = qs.stringify(req.query)
              if (qr.length > 0) {
                qr = '?' + qr
              }
              res.redirect(302, req.path + qr)
              return
            } else if (req.query.width.toString() !== desiredWidth.toString()) {
              req.query.width = desiredWidth
              let qr = qs.stringify(req.query)
              if (qr.length > 0) {
                qr = '?' + qr
              }
              res.redirect(302, req.path + qr)
              return
            }
          }
          img.queryScale(desiredWidth, desiredFormat, function (err, buff) {
            if (err) {
              next(err)
            } else {
              if (notFind) {
                res.status(404)
              }
              // if (requestPage && !notFind) {
              //   if (req.query.width || req.query.as) {
              //     delete req.query.as
              //     delete req.query.width
              //     let qr = qs.stringify(req.query)
              //     if (qr.length > 0) {
              //       qr = '?' + qr
              //     }
              //     res.redirect(302, req.path + qr)
              //     return
              //   }
              //   res.send(pages.imgPage({imgName, path: req.path, buff}))
              // } else {
              //   res.type(desiredFormat)
              //   res.send(buff)
              // }
              // This is fancy, but it causes problems with cache.
              res.type(desiredFormat)
              res.send(buff)
            }
          })
        }
      })
    }
    doResponse(imgName)
  })
  rImg.use(function (req, res, next) {
    res.status(404)
    res.end()
  })
  return function (req, res, next) {
    if (req.hostname === 'static.maowtm.org') {
      rStatic(req, res, next)
    } else if (req.hostname === 'img.maowtm.org') {
      rImg(req, res, next)
    } else {
      next()
    }
  }
}
