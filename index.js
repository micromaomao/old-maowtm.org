const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const app = express();

// HTTP Redirect to HTTPS
app.use(function(req, res, next) {
    if(!req.secure) {
        res.redirect(302, 'https://' + req.hostname + req.originalUrl);
    } else {
        res.set('Strict-Transport-Security', 'max-age=10886400; includeSubdomains; preload');
        next();
    }
});

app.use(require('./subs/main'));

http.createServer(app).listen(80, process.env.N_LISTEN);
https.createServer({
    key: fs.readFileSync(process.env.N_SSLKEY),
    cert: fs.readFileSync(process.env.N_SSLCERT)
}, app).listen(443, process.env.N_LISTEN);
