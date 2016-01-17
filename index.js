const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const app = express();

http.createServer(app).listen(80, process.env.N_LISTEN);
https.createServer({
    key: fs.readFileSync(process.env.N_SSLKEY),
    cert: fs.readFileSync(process.env.N_SSLCERT)
}, app).listen(443, process.env.N_LISTEN);
