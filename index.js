const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');
const app = express();
const mongoose = require('mongoose');
mongoose.connect(process.env.N_DB);
const db = mongoose.connection;
var redisClient = require("redis").createClient({
    host: '127.6.0.233'
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
    }];
    function doAddImg(i) {
        if (i >= imgs.length) {
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
    doAddImg(0);
});
