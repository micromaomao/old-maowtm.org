const express = require('express');
const pages = require('../pages');
const fs = require('fs');
const querystring = require('querystring');

module.exports = function (db, lock) {
    var mongoose = db;
    mongoose.Schema = require('mongoose').Schema;
    var r_main = express.Router();
    var r_www = express.Router();

    r_www.get('/', function(req, res) {
        res.redirect(302, 'https://maowtm.org');
    });
    r_main.get('/', function(req, res) {
        // TODO
        res.end("Wait.");
    });

    return function(req, res, next) {
        if(req.hostname == 'www.maowtm.org') {
            r_www(req, res, next);
        } else if (req.hostname == 'maowtm.org') {
            r_main(req, res, next);
        } else {
            next();
        }
    };
}
