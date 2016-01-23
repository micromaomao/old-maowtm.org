const express = require('express');
const pages = require('../pages');
const gpgKeyInfo = require('./gpgKeyInfo');

var r_main = express.Router();
var r_www = express.Router();

r_www.get('/', function(req, res) {
    res.redirect(302, 'https://maowtm.org');
});
r_main.get('/', function(req, res) {
    res.send(pages.index());
});
r_main.get('/auth', function(req, res) {
    res.send(pages.auth());
});
r_main.get(/^\/auth\/gpg\/((\w+)\/)?$/, function(req, res, next) {
    var keyhash = req.params[1];
    if(!keyhash) {
        res.send(pages.gpg());
    } else {
        try {
            res.send(pages.gpg({key: gpgKeyInfo(keyhash)}));
        } catch (e) {
            if(e instanceof gpgKeyInfo.notFindError)
                next();
            else
                throw e;
        }
    }
});

module.exports = function(req, res, next) {
    if(req.hostname == 'www.maowtm.org') {
        r_www(req, res, next);
    } else if (req.hostname == 'maowtm.org') {
        r_main(req, res, next);
    } else {
        next();
    }
};
