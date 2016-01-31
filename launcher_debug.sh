#!/bin/sh
## Development env launcher

mongod --fork --bind_ip 127.6.0.233 --logpath /tmp/maowtmdev_mongolog --dbpath /tmp/maowtmdev_mongodbdata --nojournal --nohttpinterface --noauth
echo "N_LISTEN=127.6.0.233 N_LISTEN2=::1 N_SSLKEY=~/letsencrypt/maowtmorg.key N_SSLCERT=~/letsencrypt/maowtmorg.crt N_DB='mongodb://127.6.0.233' N_REDIS=127.6.0.233 node debug index.js"
echo "mongod --shutdown --dbpath /tmp/maowtmdev_mongodbdata"
