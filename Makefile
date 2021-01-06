NODEJS=nodejs
PYTHON=python3
BUILD_TOOLS=$(realpath ./tools/build)
GAMEDEV_TOOLS=$(realpath ./tools/gamedev)
NODEBIN=${TOOLS}/node_modules/.bin

LANG_REGEX=\(.*\.dialog\.\).*\(\.js\)
LANGS=fr en
SRC=./engine

default: help

# COMPILE #
clean_dist:
	rm -r _build

all: build ## Generate all html files in all languages

devenv: ## Source .bash_profile in order to use dev tools
	bash --init-file .bash_profile

server:
	./tools/start_game_server.sh ${GAME}

test_game:
	./tools/run_game_cli.sh ${GAME}

build: ## Fully build
	for _GAME in $$(ls -d game/$${GAME}*);do \
		echo "BUILD $${_GAME}"; \
		echo "------------------------------"; \
		${BUILD_TOOLS}/build $${_GAME} _build/$$(basename $${_GAME}) -html; \
	done

assemble: ## Transform game file into an usable script
	for _GAME in $$(ls -d game/$${GAME}*);do \
		echo "ASSEMBLE $${_GAME}"; \
		echo "------------------------------"; \
		${BUILD_TOOLS}/build $${_GAME} _build/$$(basename $${_GAME}); \
	done

fetch_resources:  ## Fetch resources
	${GAMEDEV_TOOLS}/ogaget  --recursive ./resources -dl

# js: ${TOOLS}/.npm po  ## Compress javascript files
# 	for _LANG in ${LANGS};do \
# 		_LANG=$${_LANG} make _js; \
# 	done
#
# _js_transpile: _ensure_dir_js_build
# 	${NODEJS} ${NODEBIN}/babel \
# 		-o ./_build/js/all.${_LANG}.js --presets env \
# 		`grep '<script ' ./engine/index.html | grep 'src=' |  egrep -v 'tests/|<!--|-->' | sed 's/.*src="\([^"]*.js\)".*/.\/src\/\1/;s/${LANG_REGEX}/\1${_LANG}\2/'`
#
# _js: _ensure_build_dir _js_transpile
# 	${NODEJS} ${NODEBIN}/uglifyjs \
# 		./_build/js/all.${_LANG}.js \
# 		-o ./_build/js/min.${_LANG}.js -c -m;
#
# _check_polib:
	# ${PYTHON}  -c "import polib" || pip install polib

_ensure_build_dir:
	mkdir -p ./_build

css:
	 ${NODEJS} ${TOOLS}/postcss.js

# html: ## Generate minimal html [usage: _LANG=xx make html]
# 	 ${PYTHON} ${BUILD_TOOLS}/inject ./src/index.html \
# 		 ./_build/min.css ./_build/min.${_LANG}.js \
# 		./webroot/terminus.${_LANG}.html

# EXTRA #
# pot: _ensure_build_dir _check_polib ## Generate a pot file from a pofile [usage: _LANG=xx make pot]
# 	${PYTHON} ${TOOLS}/potgenfromlang $(or  ${_LANG}, fr)

# translatorguide:  ## A little guide for new translators
# 	less src/lang/README

# to_dokuwiki: ## Convert markdown files in wiki_md to wiki_dokuwiki
# 	find ./wiki_md -name '*.md' | \
# 	    while read i; do \
# 	    TGTDIR="`dirname $${i} | sed 's/_md/_dokuwiki/'`"; \
# 			mkdir -p $${TGTDIR}; \
# 	    TGT="`basename $${i%\.md}`.txt"; \
# 			pandoc --from=markdown_github --to=dokuwiki $${i} \
# 			             --output="$${TGTDIR}/$${TGT}";\
# 			done

testfs:
	firefox --jsconsole --safe-mode src/testing.html?filesystem

help: ## Show this help
	@sed -n \
	 's/^\(\([a-zA-Z_-]\+\):.*\)\?#\(#\s*\([^#]*\)$$\|\s*\(.*\)\s*#$$\)/\2=====\4=====\5/p' \
	 $(MAKEFILE_LIST) | \
	 awk 'BEGIN {FS = "====="}; {printf "\033[1m%-4s\033[4m\033[36m%-14s\033[0m %s\n", $$3, $$1, $$2 }' | \
	 sed 's/\s\{14\}//'
