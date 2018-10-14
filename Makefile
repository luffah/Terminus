# Use `gulp` after installing gulp-concat gulp-cli gulp-autoprefixer gulp-html-replace.
NODEJS=nodejs
PYTHON=python3

LANG_REGEX=\(.*\.dialog\.\).*\(\.js\)
LANGS=fr en

default: help

# COMPILE #
all: ## Generate all html files in all languages
	for _LANG in ${LANGS};do \
		_LANG=$${_LANG} make html; \
	done

clean_dist:
	rm -r _build;

.npm:
	npm install && touch .npm

_ensure_dir_build:
	mkdir -p _build

_js_transpile: _ensure_dir_build
	${NODEJS} ./node_modules/.bin/babel \
		-o _build/all.${_LANG}.js --presets env \
		`grep '<script ' ./src/index.html | egrep -v 'tests/|<!--|-->' | sed 's/.*src="\([^"]*.js\)".*/.\/src\/\1/;s/${LANG_REGEX}/\1${_LANG}\2/'`

_js: _js_transpile
	${NODEJS} ./node_modules/.bin/uglifyjs \
		_build/all.${_LANG}.js \
		-o _build/min.${_LANG}.js -c -m;

js: .npm po  ## Compress javascript files
	for _LANG in ${LANGS};do \
		_LANG=$${_LANG} make _js; \
	done

po: ## Generate javascript file from pofile
	mkdir -p ./src/js/_build
	which pip && ( pip search polib || pip install polib)
	find ./src/lang -name '*.po' | sed 's/^.*\.\([A-Za-z-]\+\)\.po/\1/' \
		| while read i; do ${PYTHON} ./buildsystem/po2json.py $${i}; done;

css:
	 ${NODEJS} ./buildsystem/postcss.js

html: css _js ## Generate minimal html [usage: _LANG=xx make html]
	 ${PYTHON} ./buildsystem/inject.py ./src/index.html \
		 ./_build/min.css ./_build/min.${_LANG}.js \
		./webroot/terminus.${_LANG}.html

assets: ## Place images and sounds in webroot dir
	cp src/img/* webroot/img/;
	cp src/snd/*.wav webroot/snd/;

# EXTRA #
to_dokuwiki: ## Convert markdown files in wiki_md to wiki_dokuwiki
	find ./wiki_md -name '*.md' | \
	    while read i; do \
	    TGTDIR="`dirname $${i} | sed 's/_md/_dokuwiki/'`"; \
			mkdir -p $${TGTDIR}; \
	    TGT="`basename $${i%\.md}`.txt"; \
			pandoc --from=markdown_github --to=dokuwiki $${i} \
			             --output="$${TGTDIR}/$${TGT}";\
			done

help: ## Show this help
	@sed -n \
	 's/^\(\([a-zA-Z_-]\+\):.*\)\?#\(#\s*\([^#]*\)$$\|\s*\(.*\)\s*#$$\)/\2=====\4=====\5/p' \
	 $(MAKEFILE_LIST) | \
	 awk 'BEGIN {FS = "====="}; {printf "\033[1m%-4s\033[4m\033[36m%-14s\033[0m %s\n", $$3, $$1, $$2 }' | \
	 sed 's/\s\{14\}//'
