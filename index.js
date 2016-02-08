const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');
const app = express();
const pages = require('./pages');
const mongoose = require('mongoose');
const redis = require("redis");
const redislock = require("redis-lock");

var maowtm = function (config) {
    config = config || {};
    this.config = config;
    this._mongodb = config.db || "mongodb://127.0.0.1";
    mongoose.connect(this._mongodb);
    this.db = mongoose.connection;
    this._redis = config.redis || "127.0.0.1";
    this.redis = redis.createClient({
        host: this._redis
    });
    this.lock = redislock(this.redis);
    this._listen = config.listen || "127.0.0.1";
    if (typeof this._listen == 'object') {
        if (this._listen.length > 2) {
            throw new Error("Can't listen more than 2.");
        }
        this._listen2 = this._listen[1];
        this._listen = this._listen[0];
    }
    this._ssl = config.ssl;
    if (!(this._ssl && this._ssl.cert && this._ssl.key))
        throw new Error("No ssl cert provided")
    var _this = this;

    this.db.on('error', function (err) {
        console.error(err);
        console.error('Faild to connect to db. Exiting...');
        process.exit(1);
    });
    this.db.on('open', function() {

        try {
            fs.accessSync('acme-challenge', fs.R_OK);
            console.log('ACME challenge file read.');
            var ct = fs.readFileSync('acme-challenge', {encoding: 'utf8'});
            app.get('/.well-known/acme-challenge/*', function (req, res) {
                res.send(ct);
            });
        } catch (e) {
        }

        app.use(function(req, res, next) {
            if(!req.secure) {
                res.redirect(302, 'https://' + req.hostname + req.originalUrl);
            } else {
                res.set('Strict-Transport-Security', 'max-age=10886400; includeSubdomains; preload');
                res.set('X-XSS-Protection', '1; mode=block');
                res.set('X-Frame-Options', 'sameorigin');
                res.set('X-Content-Type-Options', 'nosniff');
                next();
            }
        });

        app.use(function(req, res, next) {
            res.error = function (status, error) {
                if (typeof status != 'number') {
                    error = status;
                    status = 501;
                }
                res.status(status);
                res.send(pages.error({error: error, status: status, req: req}));
            };
            next();
        });

        app.use(require('./subs/static').setLock(_this.lock));

        // Add trailing / for all GET for all router below. ( i.e. Not including static )
        app.use(function(req, res, next) {
            var prasedUrl = url.parse(req.originalUrl, false);
            if(req.method == 'GET' && prasedUrl.pathname.substr(-1) != '/') {
                prasedUrl.pathname += '/';
                res.redirect(302, url.format(prasedUrl));
            } else {
                next();
            }
        });

        app.use(require('./subs/main'));
        
        app.use(function(req, res) {
            res.error(404, "Not find");
        });

        var image = mongoose.model('image');
        var imgs = fs.readdirSync('static/imgs');
        var doAddActivities;
        var activityFiles;
        var actcd = __dirname + '/data/activities';
        function doAddImg(i) {
            if (i >= imgs.length) {
                fs.readdir(actcd, function (err, files) {
                    if(err) {
                        console.error(err);
                        process.exit(1);
                    } else {
                        activityFiles = files;
                        doAddActivities(0);
                    }
                });
            } else {
                image.addImageIfNotExist(imgs[i], __dirname + '/static/imgs/' + imgs[i], function (err) {
                    if(err) {
                        console.error(err);
                        console.error('Faild to load image: ' + imgs[i].name);
                        process.exit(1);
                    } else {
                        doAddImg(i + 1);
                    }
                });
            }
        }
        var activityImportLog = mongoose.model('activityImportLog');
        doAddActivities = function (i) {
            if(i >= activityFiles.length) {
                http.createServer(app).listen(80, _this._listen);
                const httpsopts = {
                    key: fs.readFileSync(_this._ssl.key),
                    cert: fs.readFileSync(_this._ssl.cert),
                    ciphers: "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:ECDHE-RSA-DES-CBC3-SHA:ECDHE-ECDSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA",
                    honorCipherOrder: true
                };
                https.createServer(httpsopts, app).listen(443, _this._listen);
                if(_this._listen2) {
                    http.createServer(app).listen(80, _this._listen2);
                    https.createServer(httpsopts, app).listen(443, _this._listen2);
                }
                return;
            }
            var fname = activityFiles[i];
            if(!fname.match(/^[a-zA-Z0-9]+\.json$/)) {
                doAddActivities(i + 1);
                return;
            }
            activityImportLog.importFile(fname, function (err) {
                if(err) {
                    console.error(err);
                    console.error('Faild to import ' + activityFiles[i] + ' .');
                    process.exit(1);
                } else {
                    doAddActivities(i + 1);
                }
            }, actcd);
        }
        doAddImg(0);
    });
};

module.exports = maowtm;

