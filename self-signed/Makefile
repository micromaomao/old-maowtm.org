everything: key self-signed.crt
clean:
	rm -f key csr self-signed.crt
rebuild: clean everything

key:
	openssl genrsa 4096 > key
self-signed.crt: key req.conf
	openssl req -new -x509 -sha256 -key key -days 36500 -out self-signed.crt -config req.conf
