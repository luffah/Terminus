#!/usr/bin/env python3
# encoding: utf-8
"""
   Contains logging functions for buildsystem
   License : GPL
"""
from __future__ import print_function
import sys

ERROR_REDIR = sys.stderr
WARNING_REDIR = sys.stderr
INFO_REDIR = sys.stderr


def silent_log():
    """ disable info and warnings logs """
    global INFO_REDIR
    global WARNING_REDIR
    INFO_REDIR = None
    WARNING_REDIR = None


def print_err(msg, *keys):
    """ print an error (formatstr, keys,...) """
    if ERROR_REDIR:
        print(u"›o‹ nooo : " + (msg % keys), file=ERROR_REDIR)


def print_warn(msg, *keys):
    """ print a warning (formatstr, keys,...) """
    if WARNING_REDIR:
        print(u"/!\\ " + (msg % keys), file=WARNING_REDIR)


def print_info(msg, *keys):
    """ print an info (formatstr, keys,...) """
    if INFO_REDIR:
        print(u"[!] " + (msg % keys), file=INFO_REDIR)
