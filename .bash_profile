if [ "$(basename $0)" != "$(basename $SHELL)" ]
then
   echo "Usage :"
   echo "  source $0"
   echo "or"
   echo "  . $0"
   # exit 0
fi

if [ -f ~/.bashrc ]; then
  source ~/.bashrc
else
  source /etc/bash.bashrc
fi

export WORKSPACE="${WORKSPACE:-$(realpath .)}"
export TOOLS="$WORKSPACE/tools"
export RESSOURCES="$WORKSPACE/ressources"
export PYTHONPATH="$TOOLS/lib/python3"
export PATH="$TOOLS/gamedev:$TOOLS/build:$PATH"

_set_prompt(){
  export PROMPT_COMMAND=_prompt_command
  _prompt_command(){
    export RES="$(realpath $RESSOURCES --relative-to=.)"
  }
  export PS1='\n\033[0;47m \033[0m$(tput setaf 3)$(pwd)$(devprompt .)\n$ $(tput sgr0)'
  export PS2="¦ "
  export PS4="+ "
  HISTCONTROL=ignoreboth
  shopt -s checkwinsize
  shopt -s globstar
  # set a fancy prompt (non-color, unless we know we "want" color)
  case "$TERM" in
    xterm-color) color_prompt=yes;;
  esac
}

# if [ -x /usr/bin/dircolors ]; then
#     test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
#     alias ls='ls --color=auto'
#     alias dir='dir --color=auto'
#     alias vdir='vdir --color=auto'
#     alias grep='grep --color=auto'
#     alias fgrep='fgrep --color=auto'
#     alias egrep='egrep --color=auto'
# fi
if [ "${FS:-}" -a "${GAMEDIR:-}" ]; then

  _set_prompt
  cat << EOF
NOW, you can use following environment variables:
    \$FS  (the root in the game)
and \$RES (ressources directory for images, and sounds)
Altered commands : pwd
New commands :
EOF
  _desc_cmd(){
    printf "  %-14s -> %s\n" "$1" "${*:2:20}"
  }

  pwd(){
    echo $PWD | sed "s|$FS|($APP_NAME)|"
  }

  _desc_cmd 'cdp' navigate in game directories
  cdp(){
    if [ "${1:0:1}" = '/' -o -z "${1}" ]; then
      cd $FS/$*
    else
      cd $*
    fi
  }
  _complete_cdp() {
    local cur
    cur=${COMP_WORDS[COMP_CWORD]}
    if [ "${cur:0:1}" = '/' -o -z "${cur}" ]; then
      COMPREPLY=( $(compgen -W "$(find $FS -type d| xargs realpath | sed "s|$FS||")" -- ${cur}) )
    else
      COMPREPLY=( $(compgen -W "$(find . -maxdepth 1 -type d | sed "s|./||")" -- ${cur}) )
    fi
  }
  complete -F _complete_cdp cdp

  if which fzy 2>&1 > /dev/null
  then
    _desc_cmd 'cdi' interactive cd alternative
    function cdi(){
      ret="$(find $FS -type d | sed "s|$FS|($APP_NAME)|" | fzy)"
      if [ -n "$ret" ]
      then
        cd $(echo $ret | sed "s|($APP_NAME)|$FS|")
      fi
    }
  fi

  _desc_cmd 'mkpeople <name>' create attribute file for a people
  _desc_cmd 'mkitem <name>' create attribute file for an item
  _desc_cmd 'mklink <name>' create attribute file for a link
  _desc_cmd 'mkattributes' create attribute file for current room
  _desc_cmd 'mkpo <lang>' create po file for current room
  _desc_cmd 'build' compile for testing
  _desc_cmd 'lint' compile for lint check
  _desc_cmd 'fixlint' helper for fixing lint
  _desc_cmd 'lintlocal' simple lint check on current directory
  _desc_cmd 'start_game_server' run webroot as server

  _mk_gen(){
    [ -z "$1" ] && return
    tgt="$1"
    shift
    if [ ! -f "$tgt" ]
    then
      echo "({" > $tgt
      [ -n "$*" ] && (echo $* >> $tgt)
      echo "})" >> $tgt
    else 
      $EDITOR $tgt
    fi
  }
  mkattributes(){
    if [ "$1" = "-a" ]
    then
      find $FS -type d | while read i; do [ ! -f "$i/_attributes.js" ] && mkattributes $i; done;
    else 
      [ -n "$1" ] && room="$1" || room=.
      _mk_gen $room/_attributes.js
    fi
  }
  _mk_gen_item(){
    tgt="$1:$2.js"
    shift 2
    _mk_gen $tgt $*
  }
  alias mkpeople="_mk_gen_item people"
  alias mkitem="_mk_gen_item item"
  alias mklink="_mk_gen_item link"
  mkpo(){
    [ -n "$1"] && potouch . $1 && $EDITOR $1.po
  }

  build(){ ( cd $WORKSPACE; $(which build) $GAMEDIR _build/$(basename $GAMEDIR)) }
  fixlint(){ ( cd $WORKSPACE; $(which lint) $GAMEDIR -v -live -fix --no-style $*  2>&1 | tee .lint_errors) }
  lint(){ ( cd $WORKSPACE;  $(which lint) $GAMEDIR -v --no-style $*  2>&1 | tee .lint_errors) }
  lintlocal(){
    tgt=$(realpath .)
    (
    cd $WORKSPACE
    lint.py $tgt -local -fix $* -vars Blob,vt,mesg,Builtin,learn,state,_,global_fire_done | grep -v ':1: Expected'
    )
  }
  start_game_server(){
    GAME=$(basename $GAMEDIR)
    (
    cd $WORKSPACE
    GAME=$GAME make server
    )
  }

  echo "The follow shortcuts apply on a current dir:"
  _desc_cmd pofix     fix metadatas of pofiles
  _desc_cmd pocheck   show message that are missing
  _desc_cmd poinject  update messages with an external po file
  _desc_cmd poget     show a msgstr from its msgid
  _desc_cmd polist    show all msgids
  alias pofix='NOPOLIB= po_arrange_metadatas .'
  alias pocheck='pocheck . $POLANG'
  alias poinject='poinject .'
  alias polist='poget -list'

  _complete_pomove() {
    [ $COMP_CWORD -gt 2 ] && \
        COMPREPLY=( $(compgen -W "$(poget ${COMP_WORDS[1]} -list)"-- ${COMP_WORDS[COMP_CWORD]}) ) || \
        COMPREPLY=( $(compgen -d ${COMP_WORDS[COMP_CWORD]}) )
  }
  complete -F _complete_pomove pomove

  _complete_poget() {
    [ $COMP_CWORD -gt 1 ] && orig="${COMP_WORDS[1]}" || orig="."
    COMPREPLY=( $(compgen -W "$(poget ${orig} -list)" -- ${COMP_WORDS[COMP_CWORD]}) )
  }
  complete -F _complete_poget poget
fi
