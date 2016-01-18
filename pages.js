const jade = require('jade');

module.exports = {
    index: jade.compileFile('pages/index.jade')
};
