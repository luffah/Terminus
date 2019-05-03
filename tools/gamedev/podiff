#!/usr/bin/env python3
"""
Return the entries id that are missing from orig file to new file
"""
from polib import pofile
import argparse

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('orig.po')
    parser.add_argument('new.po')
    parser.add_argument('-p', help="print messages", action='store_true')
    args=parser.parse_args()
    try:
        (PO_ORIG, PO_NEW, PRINT) = (pofile(getattr(args, 'orig.po')),
                                    pofile(getattr(args, 'new.po')),
                                    args.p)
    except:
        parser.print_help()
        exit(1)

    for entry in [e for e in PO_ORIG if not e in PO_NEW]:
        print(
            entry.__unicode__() if PRINT
            else
            "%s" % entry.msgid
        )
