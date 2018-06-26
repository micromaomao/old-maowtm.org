const path = require('path')
const fs = require('fs')

var cached = {}
var staticPath = path.join(__dirname, 'static/')
if (!staticPath.match(/\/$/)) {
  staticPath = staticPath + '/'
}

module.exports = function (requestPath, set, done) {
  requestPath = decodeURIComponent(requestPath)
  var fpath = path.join(staticPath, requestPath)

  if (requestPath.match(/(^|\/)\.\.($|\/)/) || fpath.substr(0, staticPath.length) !== staticPath) {
    return done(new Error('Path not valid.'))
  }
  var fileName = fpath.substr(staticPath.length)
  if (cached[fileName]) {
    done(null, cached[fileName])
  } else {
    fs.readFile(fpath, {encoding: 'utf-8'}, function (err, data) {
      if (err) {
        return done()
      }
      set(fileName, data, function (err, processedData) {
        if (err) {
          return done(err)
        }
        cached[fileName] = processedData
        done(null, processedData)
      })
    })
  }
}
