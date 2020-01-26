#!/usr/bin/env python3
import os
import sys
import re
from shutil import which
import subprocess

TMPDIR = '.build'
WEBROOT = 'webroot'
IMAGEDIR = os.path.join(WEBROOT, 'img')
CSSDIR = WEBROOT
SOUNDDIR = os.path.join(WEBROOT, 'snd')
LANG_TO_INDEX = {
    'fr': 'index.html',
    'en': 'terminus.en.html'
}

try:
    from polib import pofile
except ImportError:
    print("\nThis script requires polib >= 1.0.0\n\n"
          "To fix this, run: pip install --upgrade polib\n\n"
          "( If you don't need to parse po files,\n"
          "  use NOPOLIB= environment variable )\n")
    exit(1)


NODEJS = which("nodejs") or which("node")

if NODEJS:
    NODEJS_VERSION = subprocess.getoutput(NODEJS + ' --version')
    print('using %s %s' % (NODEJS, NODEJS_VERSION))
    NODEMODULES = "node_modules"
    NODEBIN = os.path.join(NODEMODULES, ".bin")


def nodebin(cmd, *args, path=NODEBIN):
    _cmd = "%s %s %s" % (NODEJS, os.path.join(path, cmd), " ".join(args))
    return os.system(_cmd)


def po2json(orig):
    """ convert po entries in js format """
    lines = []
    entries = pofile(orig)
    if not entries:
        return lines
    lines += [
        "// generated from po file\n",
        "var dialog={"
    ]
    for entry in entries:
        if not entry.msgstr:
            continue
        if len(entry.msgid.split("\n")) > 2:
            msgid = ('"%s"') % entry.msgid.replace('"', '\"')
        else:
            msgid = entry.msgid.replace("\n", "")
            if " " in msgid or "-" in msgid:
                msgid = ('"%s"') % msgid.replace('"', '\\"')
        msgstr = entry.msgstr.replace(
            '\\', '\\\\').replace(
                '\\"', '\\\\"').replace(
                    "\n", "\\n").replace(
                        '"', '\\"')
        lines.append(str('%s:"%s",\n' % (msgid, msgstr)))
    lines.append("};\n")
    return lines


def htmlinject(htmlfile, targetfile, csscontent="", jscontent=""):
    """ put js and css content in html file """
    js_injected, css_injected = (0, 0)
    css_txt = "<style>%s</style>" % "\n".join(csscontent)
    js_txt = "<script>%s</script>" % "\n".join(jscontent)

    lines = []
    with open(htmlfile, "r") as buf:
        lines = [line.strip() for line in buf.readlines()
                 if not re.match(r"\s*<!--.*-->\s*", line)]

    with open(targetfile, "w") as buf:
        for line in lines:
            if re.match(r"<script.*src=.*</script>", line):
                if not js_injected:
                    buf.write(js_txt)
                    js_injected = True
            elif re.match(r"<link.*rel=\"stylesheet\".*/>", line):
                if not css_injected:
                    buf.write(css_txt)
                    css_injected = True
            else:
                buf.write(line)


def unifyjs(dest, lines=[], jssrc=[]):
    ret = lines
    for fname in jssrc:
        with open(fname, "r") as buf:
            ret += buf.readlines()

    tmp = dest + '.tmp'

    with open(tmp, "w") as buf:
        buf.writelines(ret)

    nodebin('uglifyjs', '-o',  dest, tmp, '-c', '-m')

    with open(dest, "r") as buf:
        return buf.readlines()


def postcss(fpath):
    """ Autoprefix """
    target = os.path.join(TMPDIR, 'min.css')
    nodebin('postcss.js', fpath, target, path='.')
    with open(target, "r") as buf:
        return buf.readlines()


def make_all(lang):
    os.makedirs(WEBROOT, exist_ok=True)
    os.makedirs(TMPDIR, exist_ok=True)
    os.makedirs(IMAGEDIR, exist_ok=True)
    os.makedirs(SOUNDDIR, exist_ok=True)
    os.makedirs(CSSDIR, exist_ok=True)

    jssrc = [
        'src/js/engine/howler.core.js',
        'src/js/engine/js.js',
        'src/js/engine/Gettext.js',
        'src/js/engine/Cookie.js',
        'src/js/engine/GameState.js',
        'src/js/engine/EventTarget.js',
        'src/js/engine/Sound.js',
        'src/js/engine/Music.js',
        'src/js/engine/ReturnSequence.js',
        'src/js/engine/VTerm.js',
        'src/js/engine/User.js',
        'src/js/engine/Parse.js',
        'src/js/engine/Command.js',
        'src/js/engine/Commands.js',
        'src/js/engine/Pic.js',
        'src/js/engine/Item.js',
        'src/js/engine/Room.js',
        'src/js/terminus.init.js',
        'src/js/terminus.assets.js',
        'src/js/terminus.utils.js',
        'src/js/terminus.gamestart.js',
        'src/js/terminus.level1.js',
        'src/js/terminus.level2.js',
        'src/js/terminus.run.js',
    ]

    htmlinject(
        'src/index.html',
        WEBROOT + '/' + LANG_TO_INDEX[lang],
        jscontent=unifyjs(
            TMPDIR + '/min.js',
            lines=po2json('src/lang/terminus.%s.po' % lang),
            jssrc=jssrc),
        csscontent=postcss('src/css/terminus.css')
    )

    os.system('cp src/img/* %s/' % IMAGEDIR)
    os.system('cp src/css/*webfont*.* %s/' % CSSDIR)
    os.system('cp src/snd/* %s/' % SOUNDDIR)


if __name__ == '__main__':
    for l in sys.argv[1:]:
        make_all(l)
