const pug = require('pug');
const fs = require('fs');

var pages = {};
var pagesfo = __dirname + '/pages/';
var list = fs.readdirSync(pagesfo);
list.forEach(function (fname) {
    var fnmatch = fname.match(/^([A-Za-z0-9\-_]+)\.pug/);
    if (fnmatch) {
        var name = fnmatch[1];
        pages[name] = pug.compileFile(pagesfo + fname);
    } else {
        console.log('pages: skipped ' + fname + ' .');
    }
});

module.exports = pages;
