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
  
  You then need to generate a self-signed certificate for all maowtm.org
  domains by doing:

    cd self-signed
    make

  Then you will need to examine and add the certificate
  `self-signed/self-signed.crt` into your browser's trusted server
  certificates. For Chrome in Linux, this can be achieved by doing:

    certutil -d ~/.pki/nssdb -A -n maowtm-dev -t P < self-signed.crt

  And you should see the certificate appears in Manage Certificate / Server.
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
    key: 'self-signed/key',
    cert: 'self-signed/self-signed.crt'
    // ca: 'x3.crt'
  },
  apps: [
    // {
    //   hostname: 'schsrch.xyz',
    //   init: require('schsrch')
    // }
  ]
})
