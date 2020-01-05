NODEJS=nodejs

LANGS?=fr en

all: .npm
	python3 Makefile.py ${LANGS}

.npm:
	npm install && touch .npm

clean:
	rm -rf webroot .build .npm

server: all
	xterm -e "cd webroot; python -mSimpleHTTPServer" &
