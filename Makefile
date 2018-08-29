# Use `gulp` after installing gulp-concat gulp-cli gulp-autoprefixer gulp-html-replace.

default: help

# COMPILE #
all: .npm  ## Build with gulp
	./node_modules/.bin/gulp

.npm:
	npm install && touch .npm



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
