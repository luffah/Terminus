#!/bin/sh
. ./tools/sh/_choose_game.sh
(
cd ${GAME_PATH}
export FS="$GAME_PATH/rootfs"
`which bash` --init-file ${TOOLS}/sh/_devenv_profile.bash
)
