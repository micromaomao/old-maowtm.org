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
    var data_me = {
        birth: 998323200
    }
    r_main.get('/', function(req, res) {
        res.send(pages.index({
            age: Math.round(( Date.now() / 1000 - data_me.birth ) / ( 60*60*24*365 ) * 10) / 10
        }));
    });
    r_main.get('/data/me/', function(req, res) {
        data_me.age = Math.floor(Date.now() / 1000) - data_me.birth;
        res.send(data_me);
    })

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
