const express = require('express');
const pages = require('../pages');
const mongoose = require('mongoose');
const lwip = require('lwip');
const qs = require('querystring');
const fs = require('fs');

var r_mail = express.Router();
r_mail.get('/view/:mid', function(req, res, next) {
    // TODO: Change implementation
    var mid = req.params.mid;
    if (!mid.match(/^[a-zA-Z0-9\-]{1,30}$/)) {
        next();
        return;
    }
    fs.readFile('data/staticmails/' + mid + '.html', {encoding: 'utf-8'}, function (err, data) {
        if (err) {
            next();
            return;
        }
        res.send(pages.mail_str({content: data, title: mid}));
    });
});

module.exports =  function(req, res, next) {
    if (req.hostname == 'mail.maowtm.org') {
        r_mail(req, res, next);
    } else {
        next();
    }
};
