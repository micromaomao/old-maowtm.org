const express = require('express');
const pages = require('../pages');
const mongoose = require('mongoose');
const fs = require('fs');
const querystring = require('querystring');

var r_main = express.Router();
var r_www = express.Router();

var t32 = Math.pow(2, 32);
function baseurl(buf) {
    return buf.toString('base64').replace(/\//g, '_').replace(/\+/g, ' ').replace(/=/g, '');
}
function debaseurl(b) {
    return new Buffer(b.replace(/ /g, '+').replace(/_/g, '/'), 'base64');
}
function timesign_stringify(time) {
    var stamp = Math.floor(time.getTime() / 1000);
    var buf;
    if (stamp > t32 - 1) {
        buf = new Buffer(64 / 8);
        var ln = Math.floor(stamp / t32);
        var rn = stamp % t32;
        buf.writeUInt32BE(ln, 0);
        buf.writeUInt32BE(rn, 32 / 8);
        return baseurl(buf);
    } else {
        buf = new Buffer(32 / 8);
        buf.writeUInt32BE(stamp);
        return baseurl(buf);
    }
}
function timesign_parse(s) {
    var buf = debaseurl(s);
    var ln = buf.readUInt32BE(0);
    var rn;
    if (buf.length > 32 / 8) {
        rn = buf.readUInt32BE(32 / 8);
        return new Date((ln * t32 + rn) * 1000);
    }
    return new Date(ln * 1000);
}
r_www.get('/', function(req, res) {
    res.redirect(302, 'https://maowtm.org');
});
r_main.get('/', function(req, res) {
    // TODO
    res.end("Wait.");
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
