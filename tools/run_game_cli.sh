#!/bin/sh
LANG="${2:-$LANG}"

. $(dirname $0)/sh/_choose_game.sh

if [ "$LANG" ]; then
  LANG=${LANG%_*}
else
  LANG=$(PYTHONPATH=$(dirname $0)/lib/python3 python3 -m ogaget.selector 'Lang ?' $(ls ${GAMEPATH}/*.po | sed 's|.*/\([^/]*\).po|\1|') 3>&2 2>&1 1>&3)
fi

${FRAMEWORK_ROOT}/tools/gamedev/testgame $GAMEPATH -l ${LANG}
