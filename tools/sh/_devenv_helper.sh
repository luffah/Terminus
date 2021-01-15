
_HELP_DEV_=

_desc_section(){
  _HELP_DEV_="${_HELP_DEV_}
${@}
$(echo "${@}" | sed 's/./-/g')
"
}
_desc_cmd(){
  _HELP_DEV_="${_HELP_DEV_}$(printf "  %-16s -> %s" "$1" "${*:2:20}")
"
}

_desc_var(){
  _HELP_DEV_="${_HELP_DEV_}$(printf "  %-14s => %s" "$1" "${*:2:20}")
"
}


help_usage(){
  echo -e """${_HELP_DEV_}""" | less
}

_finalize_help(){
  unset _desc_section
  unset _desc_cmd
  unset _finalize_help
}

