#!/usr/bin/env python3
"""
Inject all po entries that can be called from a po file
in the corresponding po files of a project directory
"""
import sys
from os.path import join, dirname, realpath
from polib import pofile
import argparse
sys.path.append(
    join(dirname(dirname(realpath(__file__))),'lib','python3')
)
from _terminal_game_common import onlydirs, onlyfiles
from _terminal_game_common.po import \
    find_po_references, lang_from_fname, po_inject

def main(gamedir, src):
    po_source = pofile(src)
    lang = lang_from_fname(src)
    po_inject(gamedir, lang, po_source)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('gamedir', help="the project directory")
    parser.add_argument('source.po', nargs='*')
    args=parser.parse_args()
    main(realpath(args.gamedir), realpath(getattr(args, 'source.po')))
