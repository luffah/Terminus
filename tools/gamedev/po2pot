#!/usr/bin/env python
import os
import re
import sys
import polib

ORIG = sys.argv[1]
fname = os.path.basename(ORIG)
dirname = os.path.dirname(ORIG)
TGT = (
    sys.argv[2] if len(sys.argv) > 2
    else dirname + os.path.sep + (
        re.sub(r"\.[a-zA-Z_]+\.po",".pot", fname)
        if re.match(r".*\..*\.po", dirname) else "_.pot"
    ))

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
