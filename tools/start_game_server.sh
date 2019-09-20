GAME="${1:-$GAME}"
GAMEPATH=game/${GAME}
SERVPATH_ALTDIR=$(cat game/${GAME}/credits.txt  | sed -n 's/^\s*webroot_dir\s*:\s*\(\S\+\)\s*$/\1/p')
if [ "${SERVPATH_ALTDIR}" ];then
  SERVPATH=game/${GAME}/${SERVPATH_ALTDIR}
else
  SERVPATH=game/${GAME}/webroot
fi
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
echo "http://localhost:${SERVPORT} (${GAME}) is up"
