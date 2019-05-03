#!/usr/bin/env python3
# pylint: disable=unexpected-keyword-arg
"""
   Show some informations for game dev
"""
import sys
from os import environ
from os.path import isfile, join, realpath, basename, dirname
from polib import pofile
sys.path.append(
    join(dirname(dirname(realpath(__file__))),'lib','python3')
)
from _terminal_game_common import onlyfiles
from _terminal_game_common.po import \
    find_po_references, fetch_langs, get_msgid_dbls
from _terminal_game_common.colors import RED, GREEN, RYELLOW, RGREEN
from _terminal_game_common.jspart import get_assets_references


def _get_missing(curdir, langs):
    po_refs = find_po_references(curdir)
    missing = []
    missingpo = []
    comments = 0
    miss = {}
    for lang in langs:
        po_fname = join(curdir, '%s.po' % lang)
        po_orig = None
        if isfile(po_fname):
            po_orig = pofile(po_fname)
        else:
            missingpo.append(basename(po_fname))
        for msg_id in po_refs:
            if po_orig:
                entry = po_orig.find(msg_id)
            if not (po_orig and entry and entry.msgstr):
                if msg_id not in miss:
                    miss[msg_id] = []
                miss[msg_id].append(lang)
            if po_orig and entry and (entry.comment or entry.tcomment):
                comments += 1
    for msg_id in miss:
        missing.append("[%s]%s" % (",".join(miss[msg_id]), msg_id))

    missingpo.sort()
    missing = missingpo + missing
    return ([
        '', (RYELLOW if missing else RGREEN) % " " + " " +
        (RED % " ".join(["missing or incomplete"] + missing))
    ] if missing else [], comments)


def _get_dbl(gamedir, langs):
    occur = get_msgid_dbls(gamedir, langs)
    dbls = []
    for lang in occur:
        for msgid in occur[lang].keys():
            dbls.append(msgid)
    dbls = list(set(dbls))
    dbls.sort()
    return [RED % " ".join(["redefined"] + dbls)] if dbls else []


def _get_assets_missing(curdir):
    refs = [ref for ref in get_assets_references(curdir)
            if not onlyfiles(curdir, prefix=ref)]
    return [
        RYELLOW % " " + " " + RED % " ".join(['missing'] + refs)
    ] if refs else []


def main(currentdir):
    gamepath = realpath(environ.get('FS'))
    current = realpath(currentdir)
    lang = environ.get('POLANG', False)
    if gamepath not in current:
        print('')
        exit()
    langs = [lang] if lang else fetch_langs(gamepath)
    (errors, comments) = _get_missing(current, langs)
    errors += _get_assets_missing(current)
    errors += _get_dbl(gamepath, langs)
    if not errors:
        print(GREEN % ':clean:' + (
            " but .... there is %s comment" % (comments) + (
                "s" if comments > 1 else '') if comments else ''
        ))
    else:
        for msg in errors:
            print(msg)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else environ.get('FS'))
