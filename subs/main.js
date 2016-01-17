const express = require('express');

var r_main = express.Router();
var r_www = express.Router();

r_www.get('/', function(req, res) {
    res.redirect(302, 'https://maowtm.org');
});
r_main.get('/', function(req, res) {
    res.type('text');
    res.send("Hi! This is my website (maowtm.org), but I'm currently building it and it don't even have a index page yet. My blog is currently" +
             " at https://micromaomao.github.io/ .");
})

module.exports = function(req, res, next) {
    if(req.hostname == 'www.maowtm.org') {
        r_www(req, res, next);
    } else if (req.hostname == 'maowtm.org') {
        r_main(req, res, next);
    }
};
