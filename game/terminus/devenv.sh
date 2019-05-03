(
GAMESRC=`dirname $0`
cd ${GAMESRC}

export GAMEDIR="$(realpath $PWD)"
export WORKSPACE="$(realpath $GAMEDIR/../..)"
export FS="$GAMEDIR/fs"
export APP_NAME="$(basename $GAMEDIR)"

`which bash` --init-file ${WORKSPACE}/.bash_profile
)
