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
var countdownEvents = {
    'spring-holiday': {
        'start': new Date('2016-01-30 00:00:00 (CST)'),
        'end': new Date('2016-02-19 00:00:00 (CST)')
    }
};
r_main.get('/countdown/:event', function (req, res, next) {
    var event = countdownEvents[req.params.event];
    if (!event) {
        next();
        return;
    }
    var now = Date.now();
    if(now > event.start)
        res.redirect(302, req.path + 'end');
    else
        res.redirect(302, req.path + 'start');
});
r_main.get('/countdown/:event/:subevent', function (req, res, next) {
    var event = countdownEvents[req.params.event];
    if (!event) {
        next();
        return;
    }
    var subevent = event[req.params.subevent];
    if (!subevent) {
        next();
        return;
    }
    res.send(pages.countdown({time: subevent, subevent: req.params.subevent, event: req.params.event}));
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
