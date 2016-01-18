const express = require('express');
const pages = require('../pages');

var r_static = express.static('static');

module.exports = function(req, res, next) {
    if(req.hostname == 'static.maowtm.org') {
        r_static(req, res, next);
    } else {
        next();
    }
};
