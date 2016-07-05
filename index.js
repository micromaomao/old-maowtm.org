const express = require('express');
const http = require('http');
const spdy = require('spdy');
const fs = require('fs');
const url = require('url');
const pages = require('./pages');
const mongoose = require('mongoose');
const redis = require("redis");
const redislock = require("redis-lock");

// This file will be launched with launcher.js.

var maowtm = function (config) {
    var app = express();
    config = config || {};
    this.config = config;
    this._mongodb = config.db || "mongodb://127.0.0.1";
    this.db = mongoose.createConnection(this._mongodb);
    this._redis = config.redis || "127.0.0.1";
    this.redis = redis.createClient({
        host: this._redis
    });
    this.lock = redislock(this.redis);
    // this._listen can be a array of address.
    this._listen = config.listen || [];
    this._ssl = config.ssl;
    this.acme = config.acme || null;
    this.destory = false;
    this.mockSecure = config.mockSecure || false;
    app.mockSecure = this.mockSecure;
    var callback = config.callback;
    function fail(error) {
        if (callback) {
            this.destory = true;
            if (this.db) {
                this.db.close();
            }
            callback(error, null, function () {});
        } else {
            throw error;
        }
    }
    if ((!Array.isArray(this._listen) || this._listen.length > 0) && !this.mockSecure && !(this._ssl && this._ssl.cert && this._ssl.key)) {
        fail(new Error("No SSL certificate provided"));
        return;
    }
    var _this = this;

    this.db.on('error', function (err) {
        fail(err);
        return;
    });
    this.db.on('open', function() {

        var acme = _this.acme;
        try {
            fs.accessSync('acme-challenge', fs.R_OK);
            acme = fs.readFileSync('acme-challenge', {encoding: 'utf8'});
            console.log('ACME challenge file read.');
        } catch (e) {
        }
        if (acme) {
            app.get('/.well-known/acme-challenge/*', function (req, res) {
                res.send(acme);
            });
        }

        app.use(function(req, res, next) {
            if(!(req.secure || app.mockSecure)) {
                res.redirect(302, 'https://' + req.hostname + req.originalUrl);
            } else {
                res.set('Strict-Transport-Security', 'max-age=10886400; includeSubdomains; preload');
                res.set('X-XSS-Protection', '1; mode=block');
                res.set('X-Frame-Options', 'sameorigin');
                res.set('X-Content-Type-Options', 'nosniff');
                next();
            }
        });

        app.use(require('./subs/static')(_this.db, _this.lock));

        // Add trailing / for all GET for all router below. ( i.e. Not including static and img )
        app.use(function(req, res, next) {
            if (req.hostname.match(/^(img|static)/)) {
                next();
                return;
            }
            var prasedUrl = url.parse(req.originalUrl, false);
            if(req.method == 'GET' && prasedUrl.pathname.substr(-1) != '/') {
                prasedUrl.pathname += '/';
                res.redirect(302, url.format(prasedUrl));
            } else {
                next();
            }
        });

        app.use(require('./subs/main')(_this.db, _this.lock));

        // TODO handle 404

        var image = mongoose.model('image');
        var imgs = fs.readdirSync('static/imgs');
        function doSetupServer() {
            const httpsopts = (_this._ssl ? {
                key: fs.readFileSync(_this._ssl.key),
                cert: fs.readFileSync(_this._ssl.cert)
            } : null);
            _this._servers = {
                http: [],
                http2: []
            };
            if(!Array.isArray(_this._listen)) {
                if (httpsopts)
                    _this._servers.http2.push(spdy.createServer(httpsopts, app).listen(443, _this._listen));
                _this._servers.http.push(http.createServer(app).listen(80, _this._listen));
            } else {
                _this._listen.forEach(function (address) {
                    if (httpsopts)
                        _this._servers.http2.push(spdy.createServer(httpsopts, app).listen(443, address));
                    _this._servers.http.push(http.createServer(app).listen(80, address));
                });
            }
            if (callback)
                callback(null, app, function() {
                    _this._servers.http2.forEach(function (s) {
                        s.close();
                    });
                    _this._servers.http.forEach(function (s) {
                        s.close();
                    });
                    _this.destory = true;
                    _this.db.close();
                });
        }
        // TODO: Cache necessary resources into database.
        doSetupServer();
    });
};

module.exports = maowtm;
