#!/usr/bin/env python3
"""
   Show missing po entries for a directory
"""
import sys
from os.path import isfile, join, realpath, relpath, basename
from polib import pofile
sys.path.append(
    join(dirname(dirname(realpath(__file__))),'lib','python3')
)
from _terminal_game_common import onlydirs, onlyfiles
from _terminal_game_common.po import \
    find_po_references, lang_from_fname, fetch_langs, _get_po_comment
from _terminal_game_common.colors import YELLOW, RYELLOW

USAGE = 'Usage: %s dir [lang|po_source] -g' % sys.argv[0]

def _po_check(d, langs, rec=False, po_source=False):
    po_refs = find_po_references(d)
    lines = []
    prtlist = []
    extra = []
    comments = []
    for lang in langs:
        msgids_found = False
        po_orig = False
        po_fname = join(d, '%s.po' % lang)
        if isfile(po_fname):
            po_orig = pofile(po_fname)
            for msg_id in list(
                    set(map(lambda e: e.msgid, po_orig)) -
                    set(po_refs)
            ):
                entry = po_orig.find(msg_id)
                comment = _get_po_comment(entry)
                extra.append(
                    YELLOW % "[%s] %s" % (lang, msg_id) +
                    ('\n%s\n%s' %( comment, entry.msgstr ) if comment else '')
                )
        else:
            lines += ['Oops ! Missing file %s' % relpath(po_fname)]
        for msg_id in po_refs:
            if not (po_orig and po_orig.find(msg_id)):
                prtlist.append('  missing %s' % msg_id)
            elif po_orig:
                entry_tgt = po_orig.find(msg_id)
                entry_src = po_source.find(msg_id) if po_source else False
                comment = _get_po_comment(entry_tgt)
                if comment:
                    comments.append(
                        YELLOW % "[%s] %s" % (lang, msg_id) +
                        '\n%s\n%s' %( comment, entry_tgt.msgstr )
                    )
                if not entry_tgt.msgstr:
                    if entry_src and entry_src.msgstr:
                        prtlist.append(
                            '  %s (to inject :: %s)' %
                            (
                                msg_id,
                                entry_src.msgstr.split('\n')[0][0:40] +
                                '...' if len(
                                    entry_src.msgstr) > 40 else '')
                        )
                    else:
                        prtlist.append('  %s (empty)' % msg_id)
        if prtlist:
            lines += ['%s' % relpath(po_fname)] + [
                YELLOW % "\n".join(prtlist)]
    if extra:
        extra.sort()
        print(RYELLOW % ' Extra po entries ' + ' in %s' % basename(d))
        for msg in extra:
            print(msg)

    if comments:
        extra.sort()
        print(RYELLOW % ' Comments on entries ' + ' in %s' % basename(d))
        for msg in comments:
            print(msg)

    if lines:
        print(RYELLOW % ' Missing msgids ' + ' in %s' % basename(d))
        for msg in lines:
            print(msg)

    if rec:
        for r in onlydirs(d):
            _po_check(r, langs, po_source=po_source)


def _global_check(d, langs, po_source=False):
    for lang in langs:
        occur = {}
        if po_source:
            for entry in po_source:
                occur[entry.msgid] = []

        occurx = {}
        for f in onlyfiles(d, ext='%s.po' % lang, rec=True):
            try:
                entries = pofile(f)
                for entry in entries:
                    i = entry.msgid
                    if i in occur:
                        occur[i].append(relpath(f))
                    elif i in occurx:
                        occurx[i].append(relpath(f))
                    else:
                        occurx[i] = [relpath(f)]
            except:
                continue

        msgids_missing = [i for i in occur.keys() if len(occur[i]) == 0]
        msgids_dbl = [i for i in occur.keys() if len(occur[i]) > 1]
        # msgids_new = [i for i in occurx.keys() if len(occurx[i]) == 1]
        msgids_new_dbl = [i for i in occurx.keys() if len(occurx[i]) > 1]
        msgids_missing.sort()
        msgids_new_dbl.sort()
        msgids_dbl.sort()

        if msgids_new_dbl or msgids_dbl:
            print('MSGIDS redefined :')
            for i in msgids_new_dbl:
                print('  %s IN %s' %
                      (" ".join(i.split()), " AND ".join(occurx[i])))
            for i in msgids_dbl:
                print('  %s IN %s' %
                      (" ".join(i.split()), " AND ".join(occur[i])))
            print("\n")

        if po_source:
            print('MSGIDS missing:')
            for i in msgids_missing:
                msgstr = po_source.find(i).msgstr
                print("  %s %s" % (
                    " ".join(i.split()), ':: ' +
                    (" ".join(msgstr.split()))[0:40] +
                    ('...' if len(msgstr) > 40 else '')
                ))


def main(d, opts):
    d = realpath(d)
    langs = opts['lang'].split(',') if 'lang' in opts else fetch_langs(d)
    po_source = pofile(opts['po_source']) if 'po_source' in opts else False

    if '-g' in opts:
        _global_check(d, langs, po_source)
    else:
        _po_check(d, langs,
                  po_source=po_source,
                  rec=('-rec' in opts))


if __name__ == '__main__':
    opts = {}

    if len(sys.argv) < 2:
        print(USAGE)
        exit(1)

    for i in sys.argv[2:]:
        if i in ['-g', '-rec']:
            opts[i] = i
        elif i.endswith('.po'):
            if isfile(i):
                opts['po_source'] = i
                opts['lang'] = lang_from_fname(i)
            else:
                print("%s not exists" % i)
        elif 'lang' not in opts:
            opts['lang'] = i
    main(sys.argv[1], opts)
