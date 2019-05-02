#!/usr/bin/env python3
import sys
from os.path import join, dirname, realpath, basename
sys.path.append(
    join(dirname(dirname(realpath(__file__))),'lib','python3')
)
from common import write, onlyfiles
from common.po import get_po_content, gen_po_header, lang_from_fname


def main(d):
    for f in onlyfiles(d, ext='.po', rec=True):
        fname = basename(f)
        lang = lang_from_fname(fname)

        if lang:
            write(f, gen_po_header(lang) + ["\n"] + get_po_content(f))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: %s <dir>' % sys.argv[0])
        exit(1)

    main(sys.argv[1])
