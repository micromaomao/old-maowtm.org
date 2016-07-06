const pug = require('pug');
const fs = require('fs');
const sass = require('node-sass');
const path = require('path');

var pages = {};
var pagesfo = __dirname + '/pages/';
var list = fs.readdirSync(pagesfo);
function mapStatic(url) {
    url = url.getValue();
    if (url[0] !== "/")
        url = "/" + url;
    return sass.types.String("url(https://static.maowtm.org" + url + ")");
}
list.forEach(function (fname) {
    var fnmatch = fname.match(/^([A-Za-z0-9\-_]+)\.pug/);
    if (fnmatch) {
        var name = fnmatch[1];
        var sassFile = path.join(__dirname, 'style', name + '.sass');
        var pugfn = pug.compileFile(pagesfo + fname);
        fs.access(sassFile, fs.R_OK, function(err) {
            if (!err) {
                sass.render({
                    file: sassFile,
                    outputStyle: "compressed",
                    functions: {
                        'mapStatic($url)': mapStatic
                    }
                }, function(err, sassResult) {
                    if (err) {
                        console.error(err);
                        css = false;
                    }
                    pages[name] = function(o) {
                        o = o || {};
                        var n = Object.create(o);
                        n.style = sassResult.css;
                        return pugfn(n);
                    };
                });
            } else {
                pages[name] = pugfn;
                console.log('pages: style for ' + fname + ' not find.');
            }
        });
    } else {
        console.log('pages: skipped ' + fname + ' .');
    }
});

module.exports = pages;
