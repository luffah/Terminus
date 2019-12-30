NODEJS=nodejs
LANGS=fr en

all: .npm
	python3 Makefile.py fr

.npm:
	npm install && touch .npm

clean:
	rm -rf webroot
	rm -rf .build
