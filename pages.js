const jade = require('jade');
const fs = require('fs');

var pages = {};
var pagesfo = __dirname + '/pages/';
var list = fs.readdirSync(pagesfo);
list.forEach(function (fname) {
    var fnmatch = fname.match(/^([A-Za-z0-9\-_]+)\.jade$/);
    if (fnmatch) {
        var name = fnmatch[1];
        pages[name] = jade.compileFile(pagesfo + fname);
    } else {
        console.log('pages: skipped ' + fname + ' .');
    }
});

module.exports = pages;
