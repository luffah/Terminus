#!/usr/bin/env python3
import sys
from os.path import join, dirname, realpath
sys.path.append(
    join(dirname(dirname(realpath(__file__))),'lib','python3')
)
from _terminal_game_common.html import inject

if __name__ == '__main__':
    htmlfile = sys.argv[1]
    cssfile = sys.argv[2]
    jsfile = sys.argv[3]
    targetfile = sys.argv[4]

    inject(htmlfile, cssfile, jsfile, targetfile)
