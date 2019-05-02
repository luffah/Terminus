if [ "$0" != "$SHELL" ]
then
   echo "Usage :"
   echo "  source $0"
   echo "or"
   echo "  . $0"
   exit 0
fi
export CWD="$(realpath $PWD)"
export APP_NAME="$(basename $CWD)"
export WORKSPACE="$(realpath $PWD/../..)"
export TOOLS="$WORKSPACE/tools"
export RESSOURCES="$WORKSPACE/ressources"
export GAMEDIR="$CWD"
export FS="$CWD/fs"
export PYTHONPATH="$TOOLS/lib/python3"
export PATH="$TOOLS/gamedev:$TOOLS/build:$PATH"
export PROMPT_COMMAND=_prompt_command
_prompt_command(){
  export RES="$(realpath $RESSOURCES --relative-to=.)"
}
export PS1='\n\033[0;47m \033[0m$(tput setaf 3)$(pwd)$(devprompt.py .)\n$ $(tput sgr0)'
export PS2="¦ "
export PS4="+ "
HISTCONTROL=ignoreboth
shopt -s checkwinsize
shopt -s globstar
# set a fancy prompt (non-color, unless we know we "want" color)
case "$TERM" in
    xterm-color) color_prompt=yes;;
esac

if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    alias dir='dir --color=auto'
    alias vdir='vdir --color=auto'
    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi

echo "NOW, you can use following environment variables:"
echo "    \$FS  (the root in the game)"
echo "and \$RES (ressources directory for images, and sounds)"
echo "Some commands are customized."
echo "When working directory is in ./fs,"
echo "  these commands substitute the game fs with / :"

echo "  pwd -> get the working directory"
pwd(){
  echo $PWD | sed "s|$FS|($APP_NAME)|"
}

echo "  cdp -> cd alternative to navigate in game files"
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

if alias | grep "alias cdir" 2>&1 > /dev/null
then
  echo "The following alias is disabled:"
  alias cdir
  unalias cdir
fi


if which fzy 2>&1 > /dev/null
then
  echo "  cdir -> interactive cd alternative"
  cdir(){
    ret="$(find $FS -type d | sed \"s|$FS|($APP_NAME)|\" | fzy)"
    if [ -n "$ret" ]
    then
      cd $(echo $ret | sed "s|($APP_NAME)|$FS|")
    fi
  }
fi

echo "  mkpeople <name> -> create attribute file for a people"
echo "  mkitem <name>   -> create attribute file for an item"
echo "  mklink <name>   -> create attribute file for a link"
echo "  mkattributes    -> create attribute file for current room"
echo "  mkpo <lang>     -> create po file for current room"
echo "  build            -> compile for test"
echo "  lint             -> compile for lint check"
echo "  fixlint          -> helper for fixing lint"
echo "  lintlocal        -> simple lint check on current directory"

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
  [ -n "$1"] && potouch.py . $1 && $EDITOR $1.po
}
echo "These shortcuts apply on current dir:"
echo "  pofix    --> fix metadatas of pofiles"
echo "  pocheck  --> show message that are missing"
echo "  poinject --> update messages with an external po file"
echo "  poget    --> show a msgstr from its msgid"
echo "  polist   --> show all msgids"
alias pofix='NOPOLIB= po_arrange_metadatas.py .'
alias pocheck='pocheck.py . \$POLANG'
alias poinject='poinject.py .'
alias polist='poget.py -list'
alias poget='poget.py'

build(){ ( cd $WORKSPACE; build.py $GAMEDIR _build) }
fixlint(){ ( cd $WORKSPACE; lint.py $GAMEDIR -v -live -fix --no-style 2> /dev/null) }
lint(){ ( cd $WORKSPACE; lint.py $GAMEDIR -v --no-style 2> /dev/null) }
lintlocal(){
  tgt=$(realpath .)
  (
  cd $WORKSPACE
  lint.py $tgt -local -fix $* -vars Blob,vt,mesg,Builtin,learn,state,_,global_fire_done | grep -v ':1: Expected'
  )
}
_complete_pomove() {
  [ $COMP_CWORD -gt 2 ] && \
      COMPREPLY=( $(compgen -W "$(poget.py ${COMP_WORDS[1]} -list)"-- ${COMP_WORDS[COMP_CWORD]}) ) || \
      COMPREPLY=( $(compgen -d ${COMP_WORDS[COMP_CWORD]}) )
}
complete -F _complete_pomove pomove.py
_complete_poget() {
  [ $COMP_CWORD -gt 1 ] && orig="${COMP_WORDS[1]}" || orig="."
  COMPREPLY=( $(compgen -W "$(poget.py ${orig} -list)" -- ${COMP_WORDS[COMP_CWORD]}) )
}
complete -F _complete_poget poget

case $EDITOR in
  *vi*)
    _vimcmd(){
      if ! ps -C gvim; then
        gvim; sleep 1
      fi > /dev/null
      gvim  $* > /dev/null
    }
    alias e='_vimcmd --remote '
    alias tn='_vimcmd --remote-send "<ESC>:tabnew<CR>" --remote '
    ;;
esac

chimgext() {
  if [ -L "$1" ]
  then
    tgt="$(realpath $1)"
    unlink "$1"
    ln -s ${tgt%.*}.$2 ${1%.*}.$2
  fi
}
