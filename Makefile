NODEJS=nodejs

LANGS?=fr en

all: .npm
	test -L src/js/.build || (cd src/js; ln -s ../../.build .build)
	python3 Makefile.py ${LANGS}

.npm:
	npm install && touch .npm

_LINK=src/js/.build
clean:
	rm -rf webroot .build .npm
	test -L ${_LINK} && unlink ${_LINK} || (test -e ${_LINK} && echo ! Warning ! ${_LINK} shall be removed || true)

server: all
	xterm -e "cd webroot; python -mSimpleHTTPServer" &
