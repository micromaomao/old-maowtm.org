const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');
const app = express();
const mongoose = require('mongoose');
mongoose.connect(process.env.N_DB);
const db = mongoose.connection;
const pages = require('./pages');
var redisClient = require("redis").createClient({
    host: process.env.N_REDIS
});
global.lock = require("redis-lock")(redisClient);
db.on('error', function (err) {
    console.error(err);
    console.error('Faild to connect to db. Exiting...');
    process.exit(1);
});
db.on('open', function() {

    // HTTP Redirect to HTTPS
    app.use(function(req, res, next) {
        if(!req.secure) {
            res.redirect(302, 'https://' + req.hostname + req.originalUrl);
        } else {
            res.set('Strict-Transport-Security', 'max-age=10886400; includeSubdomains; preload');
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

    app.use(require('./subs/static'));

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
    var imgs = [{
        name: "avatar.png",
        path: "static/imgs/avatar.png"
    }, {
        name: "bitcoin-mainaddr-qr.png",
        path: "static/imgs/bitcoin-mainaddr-qr.png"
    }, {
        name: "maze.png",
        path: "static/imgs/maze.png"
    }, {
        name: "avatar-favicon.png",
        path: "static/imgs/avatar-favicon.png"
    }];
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
            image.addImageIfNotExist(imgs[i].name, __dirname + '/' + imgs[i].path, function (err) {
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
            http.createServer(app).listen(80, process.env.N_LISTEN);
            const httpsopts = {
                key: fs.readFileSync(process.env.N_SSLKEY),
                cert: fs.readFileSync(process.env.N_SSLCERT),
                ciphers: [
                    "ECDHE-RSA-AES256-SHA384",
                    "DHE-RSA-AES256-SHA384",
                    "ECDHE-RSA-AES256-SHA256",
                    "DHE-RSA-AES256-SHA256",
                    "ECDHE-RSA-AES128-SHA256",
                    "DHE-RSA-AES128-SHA256",
                    "HIGH",
                    "!aNULL", "!eNULL", "!EXPORT", "!DES", "!RC4", "!MD5", "!PSK", "!SRP", "!CAMELLIA"
                ].join(':'),
                honorCipherOrder: true
            };
            https.createServer(httpsopts, app).listen(443, process.env.N_LISTEN);
            if(process.env.N_LISTEN2) {
                http.createServer(app).listen(80, process.env.N_LISTEN2);
                https.createServer(httpsopts, app).listen(443, process.env.N_LISTEN2);
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
