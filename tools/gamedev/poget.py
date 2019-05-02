#!/usr/bin/env python3
"""
   Print po
"""
from os import system, environ
from os.path import realpath, isfile, isdir, dirname, join
import re, sys
from polib import pofile
sys.path.append(
    join(dirname(dirname(realpath(__file__))),'lib','python3')
)
from _terminal_game_common import _regexp
from _terminal_game_common.po import po_get, po_list_msgids, fetch_langs

LIVE_EDITOR = environ.get('LIVE_EDITOR', "vi {file} +/{msgid}")
#
# if you prefer nano:
# LIVE_EDITOR = "nano +`sed -n '/msgid\s*\"{msgid}\"/=' {file}` {file}"
#
# (feel free to add tricks for other editors)
#
USAGE = (
    "Show the message string related to a po msgid.\n"
    "Usage:\n"
    " {0} <gamedir> -list\n"
    " {0} <gamedir> <msgid> [<lang>] [-po|-edit]\n"
    "Parameters:\n"
    " <gamedir> : the project directory\n"
    " <msgid> : the gettext id\n"
    "Options:\n"
    " -list : show msgids\n"
    " -po   : show message in po format instead of plain text\n"
    " -edit : call '{1}' in order to edit the message.\n"
    "         Editor can be changed with LIVE_EDITOR variable.\n"
). format(sys.argv[0], LIVE_EDITOR)

def _print_entry(entry, as_po=False, edit=False):
    if edit:
        (e, f) = entry
        system(LIVE_EDITOR.replace('{file}', f).replace('{msgid}', e.msgid))
    elif as_po:
        print("\n" + entry)
    else:
        print(entry.msgstr)


def main(gamedir, langs, msgids, opts):
    gamedir = realpath(gamedir)
    edit = '-edit' in opts
    as_po = '-po' in opts
    listmsgids = '-list' in opts

    if isfile(gamedir) and gamedir.endswith('.po'):
        p = pofile(gamedir)
        if listmsgids:
            for m in [e.msgid for e in p]:
                print(m)
            return
        for msgid in msgids:
            entry = p.find(msgid)
            if entry:
                _print_entry((entry, p) if edit else entry,
                             as_po=as_po, edit=edit)
            else:
                print('# entry not found : %s' % msgid)
        return

    if listmsgids:
        for m in po_list_msgids(gamedir, langs):
            print(m)
        return

    uniq = len(langs) == 1 and len(msgids) == 1
    for lang in langs:
        for msgid in msgids:
            entry = po_get(gamedir, lang, msgid=msgid, with_file=edit)
            if entry:
                if not uniq:
                    print('# [%s] %s' % (lang,msgid))
                _print_entry(entry, as_po=as_po, edit=edit)
                if not uniq:
                    print()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(USAGE)
        exit(1)
    opts = {}
    (gamedir, msgid, langs) = (False,) * 3
    for i in sys.argv[1:]:
        if i in ['-po', '-edit', '-list']:
            opts[i] = i
        elif not gamedir and isdir(i):
            gamedir = i
        elif not msgid:
            msgid = i
        elif not langs:
            langs = i.split(',')
    langs = langs or fetch_langs(gamedir)
    gamedir = gamedir or '.'

    msgids = set([])
    if msgid and '*' in msgid:
        mlst = po_list_msgids(gamedir, langs, rec = '**' in msgid)
        rx = _regexp(msgid)
        msgids |= set([a for a in mlst if re.match(rx, a)])
    else:
        msgids.add(msgid)

    main(gamedir, langs, list(msgids), opts)
