const pug = require('pug')
const fs = require('fs')
const sass = require('node-sass')
const path = require('path')

var pages = {}
var pageBasedir = path.join(__dirname, 'pages')
var list = fs.readdirSync(pageBasedir)
const ghUrl = 'https://github.com/micromaomao/maowtm.org/tree/master/'
const imgsGet = '/imgs/'
function pugMapStatic (url) {
  if (url[0] !== '/') {
    url = '/' + url
  }
  if (url.startsWith(imgsGet)) {
    let imagePart = url.substr(imgsGet.length)
    return 'https://img.maowtm.org/s/' + imagePart
  }
  return 'https://static.maowtm.org' + url
}
function cssMapStatic (url) {
  url = url.getValue()
  if (url[0] !== '/') {
    url = '/' + url
  }
  return sass.types.String('url(' + pugMapStatic(url) + ')')
}
function pugComment (html, pugFile, sassFile) {
  return '<!-- Mixed and minified html + css:\n' +
    '     Source:      ' + ghUrl + 'pages/' + pugFile + '\n' +
    '     Style sheet: ' + (sassFile ? (ghUrl + 'style/' + sassFile) : 'none') + ' -->\n\n' + html.replace(/\s{0,}\n\s{0,}/g, ' ')
}
function processPug (fname) {
  var fnmatch = fname.match(/^([A-Za-z0-9\-_\/]+)\.pug/) // eslint-disable-line no-useless-escape
  var pugFile = path.join(__dirname, 'pages', fname)
  if (fnmatch) {
    var name = fnmatch[1]
    var sassFile = path.join(__dirname, 'style', name + '.sass')
    var pugFn = pug.compileFile(pugFile, {
      basedir: pageBasedir
    })
    fs.access(sassFile, fs.R_OK, function (err) {
      if (!err) {
        sass.render({
          file: sassFile,
          outputStyle: 'compressed',
          functions: {
            'mapStatic($url)': cssMapStatic
          }
        }, function (err, sassResult) {
          if (err) {
            console.error(err)
            return
          }
          pages[name] = function (o) {
            o = o || {}
            o = Object.assign({}, o, { style: sassResult.css, mapStatic: pugMapStatic })
            return pugComment(pugFn(o), fname, name + '.sass')
          }
        })
      } else {
        pages[name] = function (o) {
          o = o || {}
          o = Object.assign({}, o, { mapStatic: pugMapStatic })
          return pugComment(pugFn(o), fname)
        }
        console.log('pages: style for ' + fname + ' not find.')
      }
    })
  } else {
    fs.stat(pugFile, (err, stats) => {
      if (err) {
        console.error(err)
        process.exit(1)
        // TODO
      }
      if (stats.isDirectory()) {
        fs.readdir(pugFile, (err, files) => {
          if (err) {
            console.error(err)
            process.exit(1)
          }
          files.forEach(p => {
            let nFname = path.join(fname, p)
            processPug(nFname)
          })
        })
      } else {
        console.log('pages: skipped ' + fname + ' .')
      }
    })
  }
}

list.forEach(processPug)

// FIXME: Async leak (hard to reproduce as it requires accessing a page *immediately* after the server reports "ready".)
/* TypeError: pages.about is not a function
    at .../maowtm.org/subs/main.js:23:20
    at Layer.handle [as handle_request] (.../maowtm.org/node_modules/express/lib/router/layer.js:95:5)
    at next (.../maowtm.org/node_modules/express/lib/router/route.js:131:13)
    at Route.dispatch (.../maowtm.org/node_modules/express/lib/router/route.js:112:3)
    at Layer.handle [as handle_request] (.../maowtm.org/node_modules/express/lib/router/layer.js:95:5)
    at .../maowtm.org/node_modules/express/lib/router/index.js:277:22
    at Function.process_params (.../maowtm.org/node_modules/express/lib/router/index.js:330:12)
    at next (.../maowtm.org/node_modules/express/lib/router/index.js:271:10)
    at Function.handle (.../maowtm.org/node_modules/express/lib/router/index.js:176:3)
    at router (.../maowtm.org/node_modules/express/lib/router/index.js:46:12)
    at .../maowtm.org/subs/main.js:42:7
    at Layer.handle [as handle_request] (.../maowtm.org/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (.../maowtm.org/node_modules/express/lib/router/index.js:312:13)
    at .../maowtm.org/node_modules/express/lib/router/index.js:280:7
    at Function.process_params (.../maowtm.org/node_modules/express/lib/router/index.js:330:12)
    at next (.../maowtm.org/node_modules/express/lib/router/index.js:271:10)
Server running in NODE_ENV=
Time: 1484312420.64 */

module.exports = _db => {
  return pages
}
