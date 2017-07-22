/*
  Maowtm.org launcher script.

  To simplify matter, the server will pretend to be running on production. This
  means that, access the website, you need to edit your host so that the domain
  you're developing points to localhost, like this:

    127.0.0.1 maowtm.org
    127.0.0.1 static.maowtm.org
    127.0.0.1 img.maowtm.org
    127.0.0.1 schsrch.xyz
    etc...

  You then need to generate a fake certificate for all maowtm.org domains by
  (simply) doing:

    cd local-dev-cert
    make

  Then you will need to examine and add the newly generated CA certificate
  `local-dev-cert/ca.crt` into your browser's trusted root certificates store.

  Please be informed that the CA is generated when you run `make`. Therefore,
  everyone gets a different CA certificate. The key for this CA have been
  removed so there's no worry. No one can use this CA to attack you.
*/

const Maowtm = require('./index')
Maowtm({
  db: '127.0.0.1',
  redis: '127.0.0.1',
  elasticsearch: '127.0.0.1:9200',
  listen: [
    '127.0.0.1'
  ],
  ssl: {
    key: 'local-dev-cert/server.key',
    cert: 'local-dev-cert/server.crt'
    // ca: 'x3.crt'
  },
  apps: [
    // {
    //   hostname: 'schsrch.xyz',
    //   init: require('schsrch')
    // }
  ],
  rbs: [
    // {
    //   path: '/awesome/app/',
    //   dir: path.join(__dirname, '../some-static-stuff/')
    // }
  ]
})
