# sh lib to choose the game in game/ repository
GAME="${1:-$GAME}"
export FRAMEWORK_ROOT="$(dirname $(realpath $0))"
if [ "$(basename "${FRAMEWORK_ROOT}")" = "tools" ]; then
  FRAMEWORK_ROOT="$(dirname "${FRAMEWORK_ROOT}")"
fi
if [ -n "$GAME" -a ! -d "${FRAMEWORK_ROOT}/game/$GAME" ]; then
  GAME=
fi

export TOOLS="$FRAMEWORK_ROOT/tools"
export RESSOURCES="$FRAMEWORK_ROOT/game_art"
# export PYTHONPATH="$TOOLS/lib/python3"

if [ -z "$GAME" ]; then
  GAME="$(ls -d ${FRAMEWORK_ROOT}/game/* | sed 's|.*/||' | PYTHONPATH=${FRAMEWORK_ROOT}/tools/lib/python3 python3 -m ogaget.selector 'Choose game:' )"
fi

[ -z "${GAME}" ] && exit 0
export GAME
export GAME_PATH=${FRAMEWORK_ROOT}/game/$GAME

. ${TOOLS}/sh/_pretty_print.sh

if [ -z "${DISCRETION}" ]; then 
  _print_game_title $GAME $GAME_PATH
fi

