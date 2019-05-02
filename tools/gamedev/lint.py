#!/usr/bin/env python3
"""
Lint game code
"""
import sys
from os import system, popen
from os.path import realpath, isfile, isdir, join, relpath, dirname
import argparse
import re
sys.path.append(
    join(dirname(dirname(realpath(__file__))), 'lib', 'python3')
)
from _terminal_game_common.colors import REVERSE, BOLD, YELLOW
from _terminal_game_common.logging import silent_log
from _terminal_game_common.html import fetch_javascript_src
from _terminal_game_common.build_params import get_project_parameters
from _terminal_game_common.build import build
from _terminal_game_common import onlyfiles

# The linter shall provide result in format
# filename:line:column:error

# These parameters shall be used for system calls:
#                                      JSLINT  JSFIX  EDITOR
# {file} -> the file containing error    x       x      x
# {lnum} -> line number                                 x
# {msg}  -> error msg                                   x
# {vars} -> global vars                 opt


JSLINTVAR = " --global '%s'"
JSLINTDEFAULTVARS = "Blob,Audio,Node,Howl,doTest,dialog,LANG,APP_NAME"
JSLINT = "standard {file} {vars} 2> /dev/null"
JSFIX = "standard --fix {file} 2> /dev/null > /dev/null"
AVOID_TO_LINT = r".*/(js|outsiders)/.*"
LIVE_EDITOR = "vim {file} +:{lnum}"
VERBOSE = False


def _truncate(s):
    return s if len(s) < 70 else s[:69] + '...\n'


def _fix_files(files):
    # TODO:async
    for fpath in files:
        _fix_file(fpath)


def _fix_file(fpath):
    fixcmd = JSFIX.replace('{file}', fpath) \
        if '{file}' in JSFIX else \
        (JSFIX + ' ' + fpath)
    if VERBOSE:
        print("FIX : %s" % fixcmd)
    system(fixcmd)


def _lint_files(files):
    for fpath in files:
        print("\n".join(_lint_file(fpath)))


def _lint_file(fpath, varnames):
    vardefs = "".join([JSLINTVAR % v for v in varnames])
    lintcmd = JSLINT.replace(
        '{file}', fpath).replace(
            '{vars}', vardefs) \
        if '{file}' in JSLINT else \
        (JSLINT + ' ' + fpath)
    if VERBOSE:
        print("LINT : %s" % lintcmd)
    return [it
            for it in popen(lintcmd).read().split('\n')
            if it and fpath in it]


def main(src=None, fix=None, local=None, lint=None, trace=None, nostyle=None,
         varlist="", verbose=None, interactive=None):
    FIX_BEFORE_LINT = JSFIX and nostyle

    params = get_project_parameters(src, '_lint')
    engine_files = [
        it for it in fetch_javascript_src(params['./index.html'])
        if not re.match(AVOID_TO_LINT, it)
    ]

    params.update({
        'engine_files': engine_files
    })

    if local:
        files = onlyfiles(src, ext='.js')
        if fix:
            _fix_files(files)
        if lint:
            _lint_files(files)
        return

    if fix:
        _fix_files(engine_files + onlyfiles(src, ext='.js', rec=True))

    # Now lintin' on compiled file
    if VERBOSE:
        print("COMPILING...")

    tgt = params['target_dir']
    tgtexists = isdir(tgt)  # keep this info for removing later
    if not tgtexists:
        system('mkdir -p  %s' % tgt)

    # disable useless logs
    silent_log()

    build_data = build(params)
    if not build_data:
        exit(1)

    if trace:
        build_data['line_follower'].write_trace()

    line_follower = build_data['line_follower']
    file_to_check = build_data['./game.js']

    varnames = [v for v in
                varlist.split(',') + JSLINTDEFAULTVARS.split(',') +
                line_follower.varnames
                if v]

    varnames_count = {}
    for i in varnames:
        varnames_count[i] = varnames_count.get(i, 0) + 1
    for i in set(varnames):
        if varnames_count[i] > 1:
            print('/!\\ %s defined %d times' % (i, varnames_count[i]))

    if FIX_BEFORE_LINT:
        _fix_file(file_to_check)
    if VERBOSE:
        with open(file_to_check, 'r') as buf:
            lines = buf.readlines()
            maxnum = len(lines)

    lintlines = _lint_file(file_to_check, set(varnames))
    for lintline in lintlines:
        spl = lintline.split(':')
        errmsg = ":".join(spl[3:])
        num = int(spl[1])
        cnum = int(spl[2])
        orig, lnum, line = line_follower.get(num)
        print(
            " ┌ In  %s\n │ line %s : %s" % (
                relpath(orig),
                lnum,
                ":".join(spl[3:])
            )
        )
        if VERBOSE:
            l = lines[num-1]
            if trace:
                print('// ' + lintline)
            print(
                " %s %s"
                " %s %s"
                " %s %s"
                " └" % (
                    YELLOW % "│",
                    _truncate(
                        lines[num-2]
                        if num > 1
                        else '// BEGINNING OF FILE\n'
                    ),
                    BOLD % "!",
                    l[0:cnum-1] + REVERSE % l[cnum-1] + l[cnum:],
                    YELLOW % "│",
                    _truncate(
                        lines[num]
                        if num < maxnum
                        else '// END OF FILE\n'
                    )
                ))
        if isfile(orig):
            if interactive:
                i = input("Edit file ? (Y/n) ")
                if i.startswith('n'):
                    continue
                livecmd = LIVE_EDITOR.replace(
                    '{file}', orig).replace(
                        '{lnum}', str(lnum)).replace('{msg}', errmsg) \
                    if '{file}' in LIVE_EDITOR else \
                    LIVE_EDITOR + ' ' + orig
                system(livecmd)
        else:
            print(">> %s(The error seems to be in buildsystem)" % (line))

    if not tgtexists:
        system('rm -r %s' % tgt)

    if not lintlines:
        print(
            "\nOooh !! your code is perfectly standard !\n"
            "Do something else please.\n")
        exit(0)
    exit(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('src', help="(project) contains game files")
    parser.add_argument('-lint', action='store_const', default=None,
                        const=JSLINT,
                        help="lint...")
    parser.add_argument('-fix', action='store_const', default=None,
                        const=JSFIX,
                        help="fix what can be fixed easily")
    parser.add_argument('-local', action='store_true', default=False,
                        help="only fix for current dir")
    parser.add_argument('-i', '-live', action='store_true', default=False,
                        dest='interactive',
                        help="ask user to correct each error")
    parser.add_argument('-t', '--trace', action='store_true', default=False,
                        dest='trace',
                        help="product trace file")
    parser.add_argument('--no-style', action='store_true', default=False,
                        dest='nostyle',
                        help="don't bother user with coding style issues")
    parser.add_argument( '-v', '--verbose', action='store_true', default=False,
                        dest='verbose')
    parser.add_argument('-vars', action='store', dest='varlist', default="",
                        help="define global vars for the linter"
                        )
    args = parser.parse_args()
    VERBOSE = args.verbose
    main(**vars(args))
