#!/bin/sh
GAME="${1:-$GAME}"
LANG="${2:-$LANG}"
_CWD=$(dirname $0)
[ "$GAME" ] || GAME=$(PYTHONPATH=$(dirname $0)/lib/python3 python3 -m ogaget.selector 'Game ?' $(ls -d game/* | sed 's|.*/||') 3>&2 2>&1 1>&3)
GAMEPATH=game/${GAME}
if [ "$LANG" ]; then
  LANG=${LANG%_*}
else
  LANG=$(PYTHONPATH=$(dirname $0)/lib/python3 python3 -m ogaget.selector 'Lang ?' $(ls ${GAMEPATH}/*.po | sed 's|.*/\([^/]*\).po|\1|') 3>&2 2>&1 1>&3)
fi
${_CWD}/gamedev/testgame $GAMEPATH -l ${LANG}
