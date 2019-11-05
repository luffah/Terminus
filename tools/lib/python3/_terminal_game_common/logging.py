#!/usr/bin/env python3
# encoding: utf-8
"""
   Contains logging functions for buildsystem
   License : GPL
"""
from __future__ import print_function
import sys
from time import sleep
try:
    import colorama
    RED, ORANGE, GREY, RESET = (
            colorama.Fore.RED,
            colorama.Fore.YELLOW,
            colorama.Fore.LIGHTGREEN_EX,
            colorama.Fore.RESET
            )
except:
    RED, ORANGE, GREY, RESET = ['']*4

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
        ERROR_REDIR.write(RED + u"›o‹ nooo : " + (msg % keys) + RESET + "\n")
        sleep(2)


def print_warn(msg, *keys):
    """ print a warning (formatstr, keys,...) """
    if WARNING_REDIR:
        WARNING_REDIR.write(ORANGE + u"! " + (msg % keys) + RESET + "\n")


def print_info(msg, *keys):
    """ print an info (formatstr, keys,...) """
    if INFO_REDIR:
        INFO_REDIR.write(GREY + (msg % keys) + RESET +  "\n")
