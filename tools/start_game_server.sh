#!/bin/sh
. $(dirname $0)/sh/_choose_game.sh

SERVPATH_DIR=$(cat ${GAME_PATH}/credits.txt  | sed -n 's/^\s*webroot_dir\s*:\s*\(\S\+\)\s*$/\1/p')
if [ -z "${SERVPATH_DIR}" ]; then
  SERVPATH_DIR=webroot
fi
SERVPATH=${GAME_PATH}/webroot
PIDFILE=server.pid
SERVPORT=7341
serve(){
  if test -f ${PIDFILE}; then
    _OLDPID=$(cat ${PIDFILE}) 
    _OLDPID=$(ps -ao pid | grep "^\s*${_OLDPID}\$")
    if [ "${_OLDPID}" ]; then
      kill ${_OLDPID}
      sleep 1
    fi
  fi
  _CWD=$PWD
  cd ${SERVPATH}
  python -mSimpleHTTPServer ${SERVPORT} > server.log 2>&1 & PID=$!
  cd ${_CWD}
  echo $PID > ${PIDFILE}
  wait $PID
  rm ${PIDFILE}
}
serve & 
echo "Server for '${GAME}' is up"
echo "Game url : http://localhost:${SERVPORT}"
[ "${OPEN_URL_WITH}" ] && ${OPEN_URL_WITH} http://localhost:${SERVPORT}
