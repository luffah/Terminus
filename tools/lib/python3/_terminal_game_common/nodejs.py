#!/usr/bin/env python3
# encoding: utf-8
"""
   Wrapper for nodejs
   License : GPL
"""
from os import system, symlink, chdir, getcwd
from os.path import join, realpath, dirname, islink, isdir, isfile
from shutil import which
import subprocess
from . import concatenated
from .build_params import BUILD_TOOLS
from .logging import print_info

NODEJS = which("nodejs") or which("node")
if NODEJS:
    NODEJS_VERSION = subprocess.getoutput(NODEJS + ' --version')
    print('using %s %s' % (NODEJS, NODEJS_VERSION))
    NODEMODULES = join(realpath(BUILD_TOOLS), "node_modules")
    NODEBIN = join(NODEMODULES, ".bin")

def _install_deps(force=False):
    d = getcwd()
    chdir(BUILD_TOOLS)
    if force or not isfile('package-lock.json'):
        system('npm install')
    chdir(d)

def _nodebin(cmd, args):
    return system("%s %s %s" % (NODEJS, join(NODEBIN, cmd), " ".join(args)))


def transpile(files, target):
    """ Transpile """
    complete = concatenated(files)
    # specific to babeljs... preset env is not found without that
    nodemodules_local = join(dirname(complete), "node_modules")
    if not (islink(nodemodules_local) or isdir(nodemodules_local)):
        symlink(NODEMODULES, nodemodules_local)
    #
    print_info("%14s > %s", 'Transpile JS', target)
    return _nodebin('babel', ['--presets env', '-o %s' % target, complete])


def minify(src, target):
    """ Minify """
    print_info("%14s > %s", 'Minify JS', target)
    return _nodebin('uglifyjs', ['-o %s' % target, src, '-c', '-m'])


def postcss(files, target):
    """ Autoprefix """
    print_info("%14s > %s", 'Autoprefix & Minify CSS', target)
    complete = concatenated(files)
    return system("%s %s %s %s" % (
        NODEJS, join(BUILD_TOOLS, 'postcss.js'), complete, target))
