#!/usr/bin/env python
import re
import sys
import polib

LANG = sys.argv[1]
APP_NAME = 'terminus'
ORIG = ('./src/lang/%s.%s.po' % (APP_NAME, LANG))
TGT = ('./src/lang/%s.pot' % APP_NAME)

po = polib.pofile(ORIG)
if not po:
    exit(1)

pot = polib.POFile()
pot.metadata = po.metadata
for entry in po:
    if not entry.comment:
        com = entry.msgstr
        if len(com.split("\n")) > 2 and not re.match(r".*({{|%s)", com):
           com = "\n".join(com.split("\n")[0:2]) + " ..."
        entry.comment = '[%s] "%s"' % (LANG,
                com.replace("\n",'\\n').replace('"','\\"'))
    entry.msgstr = ''
    pot.append(entry)

pot.save(TGT)
