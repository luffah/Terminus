#!/usr/bin/env python3
# encoding: utf-8
"""
   Contains trace utility for buildsystem
   License : GPL
"""
from os import listdir
from os.path import isfile, isdir, join, relpath
from . import \
    add_comma as _add_comma, \
    rm_trailing_comma as _rm_trailing_comma,\
    print_info, write
from .jspart import get_attrs_content as _get_attrs_content, get_related_var


class LineFollower(object):
    """ implement a file writer that store trace """
    line_follower = []
    buf = None
    fname = None
    varnames = []

    def __init__(self, fname):
        self.fname = fname
        self.buf = open(fname, "w")
        self.buf.flush()

    def get(self, line):
        """
        get (origin, linenumber, line)
        from the final file line number
        """
        return self.line_follower[line-1]

    def close(self):
        """
        close file
        """
        self.buf.close()

    def append(self, lines, orig):
        """
        append lines
        """
        for lnum, line in enumerate(lines):
            self.line_follower.append((orig, lnum + 1, line))

    # def insert(self, lines, orig, idx=0):
    #     """
    #     insert lines at specified index
    #     """
    #     for lnum in range(len(lines)):
    #         self.line_follower.insert(idx, (orig, lnum, lines[lnum]))
    #         idx += 1

    # def find_idx(self, orig):
    #     """
    #     find idx that reference an origin
    #     """
    #     for lnum in range(len(self.line_follower)):
    #         if self.line_follower[lnum][0] == orig:
    #             return lnum
    #     return 0

    # def insert_before(self, orig_before, lines, orig):
    #     """
    #     insert lines before orig
    #     """
    #     self.insert(lines, orig,
    #                 idx=self.find_idx(orig_before))

    def write(self, lines_followed, title=''):
        """
           write lines in the file fname
        """
        if lines_followed:
            print_info("%14s %s %s", title, '>>',
                    relpath(self.fname))
        for line_followed in lines_followed:
            if len(line_followed) == 2:
                orig, lines = line_followed
            elif len(line_followed) == 3:
                orig, lines, varname = line_followed
                if varname:
                    self.varnames.append(varname)
            flines = [
                "%s\n" % s
                for s in "".join(lines).split("\n")
                if s]
            self.buf.writelines(flines)
            self.append(flines, orig)

    def write_trace(self):
        """
           write lines followed in the file fname
        """
        if not self.line_follower:
            return

        lines = []
        cnt = 0
        for orig, lnum, content in self.line_follower:
            cnt += 1
            lines.append("%s|%s|%s|%s" % (cnt, orig, lnum, content))

        write("%s.trace" % self.fname, lines, title='trace')


def follow_as(orig, lines):
    """ format lines for LineFollower """
    return [(orig, lines)] if lines else []


def get_content(fpath, ext=''):
    """
       get content in the file or directory,
       with the right name
    """
    ret = []
    if isinstance(fpath, list):
        for fname in fpath:
            ret += get_content(fname, ext=ext)
    elif isfile(fpath):
        if fpath.endswith(ext):
            with open(fpath, "r") as buf:
                ret = [(fpath, buf.readlines())]
    elif isdir(fpath):
        for fname in sorted(listdir(fpath)):
            ret += get_content(join(fpath, fname), ext=ext)
    return ret


def get_attrs_content(fpath, indent):
    """
    add informations to get_attrs_content
    for LineFollower
    """
    lines = _get_attrs_content(fpath, indent)
    varname = get_related_var(fpath, lines)
    return [(fpath, lines, varname)]


def on_lastlines_of_followed(lines, func):
    """
        apply an function on last block of lines
        of the followed lines
    """
    last_block_content = []
    i = 0
    if lines:
        while not last_block_content and i < len(lines):
            i += 1
            last_block_content = lines[-i][1]
        if last_block_content:
            func(last_block_content)
    return lines


def add_comma(lines):
    """ add comma on lastline """
    return on_lastlines_of_followed(lines, _add_comma)


def rm_trailing_comma(lines):
    """ remove comma on lastline """
    lines = on_lastlines_of_followed(lines, _rm_trailing_comma)
    return lines
