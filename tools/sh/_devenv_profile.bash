if [ "${FS:-}" -a "${GAMEDIR:-}" ]; then
  exit
fi

# Use your default bash profile as basis
if [ -f ~/.bashrc ]; then source ~/.bashrc; else source /etc/bash.bashrc; fi

# Add tools in PATH
export PATH="$TOOLS/gamedev:$TOOLS/build:$PATH"
# Provide
#  setters : _desc_section _desc_cmd
# and command help_usage
. ${TOOLS}/sh/_devenv_helper.sh


# Set PROMPT
export PROMPT_COMMAND=_prompt_command
_prompt_command(){
  export RES="$(realpath $RESSOURCES --relative-to=.)"
}
export PS1="\n$(tput setaf 3)\$(pwd)\$(devprompt .)\n$(tput sgr0)\$ "
export PS2="¦ "
export PS4="+ "
HISTCONTROL=ignoreboth
shopt -s checkwinsize
shopt -s globstar
# set a fancy prompt (non-color, unless we know we "want" color)
case "$TERM" in
  xterm-color) color_prompt=yes;;
esac


# N.B on bash : using   for   here instead of while that create a nested  environnement
# for i in $(find $TOOLS/gamedev  -maxdepth 1 -executable -type f | xargs -I{} basename {}); do
#   _desc="$($i --short-help 2> /dev/null)"
#   if [ -n "$_desc" ]; then _desc_cmd "${i}" "${_desc}"; fi
# done


_desc_section NOW, you can use following environment variables
_desc_var \$FS "The root for the game"
_desc_var \$RES "Directory that contains resources"

_desc_section New commands
_desc_cmd assetscheck "Show missing referenced assets"
_desc_cmd po2pot "Generate a pot file from a po file"

pwd(){
  echo $PWD | sed "s|$FS|($GAME)|"
}

_desc_cmd 'cdp' "navigate in game directories"
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

_desc_cmd 'cdpi' "interactive navigation in game directories"
function cdpi(){
  ret="$(find $FS -type d | sed "s|^$FS||" | PYTHONPATH=${FRAMEWORK_ROOT}/tools/lib/python3 python3 -m ogaget.selector 'Choose directory:')"
  if [ -n "$ret" ]
  then
    cd $(echo $ret | sed "s|^|$FS|")
  fi
}

_desc_cmd 'mkroom [to/room]' "create room(s) and ensure attributes are existing"
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
mkroom(){
  (
  if [ -n "$1" ]; then
    _room="$1"
    if [ -z "$( echo $PWD | grep ${FS} )"]; then
      cd ${FS}
    fi
    [ "${_room}" ] && mkdir -p "${_room}"
  else 
    _room=.
  fi
  find $FS -type d | while read i; do
    [ ! -f "$i/_attributes.js" ] && _mk_gen $i/_attributes.js
  done
  )
}

_desc_cmd 'mkpeople name' "create attribute file for a people"
_desc_cmd 'mkitem name' "create attribute file for an item"
_desc_cmd 'mklink name' "create attribute file for a link"
_mk_gen_item(){
  tgt="$1:$2.js"
  shift 2
  _mk_gen $tgt $*
}
alias mkpeople="_mk_gen_item people"
alias mkitem="_mk_gen_item item"
alias mklink="_mk_gen_item link"

_desc_cmd 'mkpo lang' create po files for lang in all rooms
mkpo(){
[ -n "$1" ] && potouch $GAMEDIR $1 -auto
}

_desc_cmd 'build' compile for testing
build(){
  ( cd $FRAMEWORK_ROOT; $(which build) $GAMEDIR _build/$(basename $GAMEDIR))
}

_desc_cmd 'lint' compile for lint check
lint(){
  ( cd $FRAMEWORK_ROOT;  $(which lint) $GAMEDIR -v --no-style $*  2>&1 | tee .lint_errors)
}

_desc_cmd 'fixlint' helper for fixing lint
fixlint(){
  ( cd $FRAMEWORK_ROOT; $(which lint) $GAMEDIR -v -live -fix --no-style $*  2>&1 | tee .lint_errors)
}

_desc_cmd 'lintlocal' simple lint check on current directory
lintlocal(){
  tgt=$(realpath .)
  (
  cd $FRAMEWORK_ROOT
  lint.py $tgt -local -fix $* -vars Blob,vt,mesg,Builtin,learn,state,_,global_fire_done | grep -v ':1: Expected'
  )
}

_desc_cmd 'start_game_server' run webroot as server
start_game_server(){
  (
  cd $FRAMEWORK_ROOT
  DISCRETION=${DISCRETION:-t} GAME=${GAME:-} sh $TOOLS/start_game_server.sh
  )
}





_desc_section The following shortcuts apply on a current dir:

_desc_cmd pofix     fix metadatas of pofiles
alias pofix='NOPOLIB= po_arrange_metadatas .'

_desc_cmd pocheck   show message that are missing
alias pocheck='pocheck . $POLANG'

_desc_cmd poinject  update messages with an external po file
alias poinject='poinject .'

_desc_cmd poget     show a msgstr from its msgid
_complete_poget() {
  [ $COMP_CWORD -gt 1 ] && orig="${COMP_WORDS[1]}" || orig="."
  COMPREPLY=( $(compgen -W "$(poget ${orig} -list)" -- ${COMP_WORDS[COMP_CWORD]}) )
}
complete -F _complete_poget poget


_desc_cmd polist    show all msgids
alias polist='poget -list'


_complete_pomove() {
  [ $COMP_CWORD -gt 2 ] && \
      COMPREPLY=( $(compgen -W "$(poget ${COMP_WORDS[1]} -list)"-- ${COMP_WORDS[COMP_CWORD]}) ) || \
      COMPREPLY=( $(compgen -d ${COMP_WORDS[COMP_CWORD]}) )
}
complete -F _complete_pomove pomove


help_usage
