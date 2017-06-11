everything: server.key server.crt ca.crt
clean:
	find . -maxdepth 1 ! -name '.' ! -name '*.conf' ! -name Makefile ! -name 'server.crt' ! -name 'server.key' ! -name 'ca.crt' | xargs rm -rv || true
	rm -f server.key server.crt ca.crt
regen: clean everything

ca: ca.conf
	umask o=
	mkdir ca || true
	touch ca/db.txt
	openssl genrsa 4096 > ca/ca.key
	openssl req -config ca.conf -new -x509 -key ca/ca.key -days 36500 -out ca/ca.crt

server.key:
	openssl genrsa 4096 > server.key

server.crt: server.key cert.conf ca
	openssl req -config cert.conf -new -key server.key -out server.csr
	yes | openssl ca -config ca.conf -days 36500 -create_serial -in server.csr -extensions issue_ext -out server.crt

ca.crt: ca
	cp ca/ca.crt ca.crt
	find . -maxdepth 1 ! -name '.' ! -name '*.conf' ! -name Makefile ! -name 'server.crt' ! -name 'server.key' ! -name 'ca.crt' | xargs rm -rv
