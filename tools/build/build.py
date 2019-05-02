#!/usr/bin/env python3
"""
   Generate javascript and move assets
"""
import sys
from os import makedirs, symlink, remove
from os.path import join, dirname, realpath, isdir, relpath, islink
sys.path.append(
    join(dirname(dirname(realpath(__file__))),'lib','python3')
)
from _terminal_game_common.nodejs import _install_deps
from _terminal_game_common.build import \
    build, transpilejs, minifyjs, postcss, all_in_one_html
from _terminal_game_common.build_params import get_project_parameters

USAGE = (
    "Build/export the game in html/css/js format.\n"
    "Usage:\n"
    " %s <gamedir> <tgt_dir> [-t] [-transpile|-minify|-css|-html] [-only]\n"
    "Parameters:\n"
    " -t is for writing trace\n"
    "Here is enough for testing the game.\n"
    "Next ther parameters allows to go futher. \n"
    " -transpile : (step 1a) transpile js for compatibility in many browsers\n"
    " -css       : (step 1b) autoprefix css properties\n"
    " -minify    : (step 2) uglify js code\n"
    " -html      : (step 3) generate all-in-one html file\n"
    "Each step depends on the previous ones.\n"
    "If you want to re-execute only one step use '-only'."
)

def _link_dirs_in_project(params, dirs):
    for n in dirs:
        if not isdir(params['%s_dir' % n]):
            if not isdir(params['target_%s_dir' % n]):
                makedirs(params['target_%s_dir' % n])
            if islink(params['%s_dir' % n]):
                remove(params['%s_dir' % n])
            symlink(params['target_%s_dir' % n], params['%s_dir' % n])

def _main(gamedir, tgt, opts):
    if not isdir(tgt):
        makedirs(tgt)
    params = get_project_parameters(gamedir, tgt)
    _link_dirs_in_project(params, ['js', 'img', 'sound', 'music'])
    only = '-only' in opts
    if not only:
        _install_deps()
        build_data = build(params)
        if not build_data:
            exit(1)
        if '-t' in opts:
            build_data['line_follower'].write_trace()
    if '-transpile' in opts or (
            not only and ('-minify' in opts or '-html' in opts)):
        transpilejs(params)
    if '-css' in opts or (
            not only and ('-html' in opts or '-minifyjs' in opts)):
        postcss(params)
    if '-minify' in opts or (
            not only and '-html' in opts):
        minifyjs(params)
    if '-html' in opts or '-all' in opts:
        all_in_one_html(params)


if __name__ == '__main__':
    GAMEDIR = False
    TARGET = False
    OPTS = {}
    for arg in sys.argv[1:]:
        if arg in ['-t', '-transpile']:
            OPTS[arg] = 1
        elif not GAMEDIR:
            GAMEDIR = arg
        elif not TARGET:
            TARGET = arg
        else:
            OPTS[arg] = arg
    if not (GAMEDIR and TARGET):
        print(USAGE)
        exit(1)
    _main(GAMEDIR, TARGET, OPTS)
