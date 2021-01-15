#!/bin/sh

_print_game_title(){
  # aesthetical things
  _game_title=$1
  _game_path=$2
  _len=$(echo "$_game_title" | wc -c)
  if [ $(( _len % 2 )) -eq 0 ]; then
    _len=$(( 31 - ( _len / 2 ) ))
    _len_r=$(( _len + 1 ))
  else
    _len=$(( 31 - ( _len / 2 ) ))
    _len_r=${_len}
  fi

  sed "s/\(\s\{${_len}\}\)\s*%\s*\(\s\{${_len_r}\}\)/\1$_game_title\2/" << EOF
   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 
   ▒                                                              ▒░
  ,▒                              %                               ▒░
  |▒                                                              ▒░
EOF
cat << EOF
  |▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░
  | ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 
  '->  ${_game_path}
EOF
}

