#!/usr/bin/env python3
"""
Move entries (all langs) of msgids to another directory.
"""
import re
import sys
import argparse
from os.path import join, dirname, realpath
sys.path.append(
    join(dirname(dirname(realpath(__file__))),'lib','python3')
)
from _terminal_game_common import _regexp
from _terminal_game_common.po import move_po_msgs, fetch_langs, po_list_msgids

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('origdir', help="the source directory")
    parser.add_argument('targetdir', help="the target directory")
    parser.add_argument('msgid', nargs='*', help="a msgid to move")
    args=parser.parse_args()
    langs = fetch_langs(args.origdir)
    mlst = po_list_msgids(args.origdir, langs)
    msgids = set([])
    for m in args.msgid:
        print(m)
        if '*' in m:
            rx = _regexp(m)
            msgids |= set(filter(lambda a: re.match(rx, a), mlst))
        else:
            msgids.add(m)
    move_po_msgs(args.origdir, list(msgids), langs, tgt=args.targetdir)
