#!/usr/bin/env python3
# encoding: utf-8
"""
   Contains common functions for buildsystem
   License : GPL
"""
from os import listdir, environ, mkdir, system
from os.path import isdir, isfile, islink, join, basename, dirname, relpath
import re
import shutil
import sys
from .logging import print_info


REGEXP_MODE = environ.get('REGEXP_MODE', 'shell')

if REGEXP_MODE == 'shell':
    def _regexp(matched):
        return matched.replace('*', '.*')
else:  # python
    def _regexp(matched):
        return matched


def get_content(fname, ext='', rec=False, lvl=0, join=None):
    """ get content of file(s) with name ending with ext """
    ret = []
    if isfile(fname):
        if fname.endswith(ext):
            with open(fname, "r") as buf:
                ret = buf.readlines()
    elif isdir(fname) and (lvl==0 or rec):
        for child in listdir(fname):
            ret += get_content(
                join(fname, child),
                ext=ext,
                rec=rec,
                lvl=lvl+1
            )
    if join:
        ret = join.join(ret)
    return ret


def write(fname, lines, append=False, title=''):
    """
       write lines in the file fname
    """
    if lines:
        print_info("%14s %s %s", title, '>>' if append else '> ',
                relpath(fname))
    with open(fname, ("a" if append else "w")) as buf:
        buf.writelines(lines)


def concatenated(files):
    """
       concatenate all files in one
       returns the path of the new file
    """
    if len(files) == 1:
        return files[0]

    ftgt = join(dirname(files[0]), "_concatenated_%s_" % basename(files[0]))

    with open(ftgt, "w") as tgt:
        for fpath in [f for f in files if isfile(f)]:
            with open(fpath, "r") as buf:
                tgt.writelines(buf.readlines())
    return ftgt


def ensure_dir(tgt):
    """
       just mkdir -p
    """
    if tgt and not isdir(tgt):
        mkdir(tgt)


def remove_dir(tgt):
    """
       just rm -rf
    """
    if not isdir(tgt):
        shutil.rmtree(tgt)  # if needed, ignore_errors=True


def copy(orig, tgt, fname=False):
    """
       just cp
    """
    if isfile(orig):
        shutil.copyfile(orig,
                        join(tgt, fname) if fname else tgt)


def copy_dir(orig, tgt, subdir=False, params=False):
    """
       just cp -rT
    """
    if isinstance(params, dict):
        params = dict(params)
        orig = params.get(orig, 0)
        tgt = params.get(tgt, 0)
        if not (orig and tgt):
            return False
        if subdir:
            subdir = params.get(subdir, 0)
            if not subdir or not isdir(tgt):
                return False

    if orig == (join(tgt, subdir) if subdir else tgt):
        return True


    print(orig)
    if isdir(orig):
        system(
            'cp -rT %s %s' % (
                orig,
                join(tgt, subdir) if subdir else tgt
            )
        )


def filelist(test):
    """
       decorator to list content of a directories
    """
    def _only(path,
              prefix='', ext='',
              match=False,
              rec=False):
        if not isdir(path) or islink(path) or (
                callable(rec) and not rec(path)
        ):
            # stop propagation
            return []
        ret = []
        for fname in listdir(path):
            fpath = join(path, fname)
            if (
                    test(fpath) and
                    fname.endswith(ext) and
                    fname.startswith(prefix)
            ):
                if match:
                    match_obj = re.match(match, fname)
                    if match_obj:
                        ret += [(fpath, match_obj)]
                else:
                    ret += [fpath]
            if rec:
                ret += _only(fpath, prefix, ext, match, rec)
        return ret

    return _only


def on_last_line(func):
    """
       decorator to apply a function on last line of file.readlines()
    """
    # decorator that apply on last line
    def _on_last_line(lines):
        if lines:
            last_line = lines[-1].rstrip()
            if last_line:
                lastchar = lines[-1].endswith('\n')
                lines[-1] = func(last_line)
                if lastchar:
                    lines[-1] += '\n'
        return lines
    return _on_last_line


@filelist
def onlyfiles(fpath):
    """
       list files filtered by :
             extension ext
       or   a function verify
       or   a regexp match

       if match is used return  a list of tuple (filename, match)
    """
    return isfile(fpath)


@filelist
def onlydirs(fpath):
    """
       return subdirectories filtered by some attributes.

       see onlyfiles
    """
    return isdir(fpath) and not islink(fpath)


@on_last_line
def add_comma(line):
    """ add comma on last line of (list of str) lines """
    return line + ',' if not line.endswith(',') else line


@on_last_line
def rm_trailing_comma(line):
    """ add comma on last line of lines """
    return line[:-1] if line.endswith(',') else line


def spaced(stra, strb):
   """ add a space between 2 strings """
   if stra and strb:
       return stra + ' ' + strb
   else:
       return stra or strb
