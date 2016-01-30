const jade = require('jade');

module.exports = {
    index: jade.compileFile('pages/index.jade'),
    auth: jade.compileFile('pages/auth.jade'),
    gpg: jade.compileFile('pages/gpg.jade'),
    countdown: jade.compileFile('pages/countdown.jade'),
    htmlstuff: jade.compileFile('pages/htmlstuff.jade')
};
