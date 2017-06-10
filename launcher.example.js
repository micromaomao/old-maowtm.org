const maowtm = require('./index')
var www = new maowtm({
  db: "127.0.0.1",
  redis: "127.0.0.1",
  elasticsearch: "127.0.0.1:9200",
  listen: [
    "127.0.0.1"
  ],
  ssl: {
    key: "self-signed-maowtmorg.key",
    cert: "self-signed-maowtmorg.crt"
    // ca: "x3.crt"
  },
  apps: [
    // {
    //   hostname: 'schsrch.xyz',
    //   init: require('schsrch')
    // }
  ]
});
