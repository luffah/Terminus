#!/usr/bin/env python3
# encoding: utf-8
"""
   Wrapper for nodejs
   License : GPL
"""
import os
from os import system, symlink, chdir, getcwd
from os.path import join, realpath, dirname, islink, isdir, isfile, relpath
from shutil import which
import subprocess
from . import concatenated, copy
from .build_params import BUILD_TOOLS
from .logging import print_info, print_err

DEBUG_SKIP = os.environ.get('DEBUG_SKIP', '').split(',')
NODEJS = '' if 'nodejs' in DEBUG_SKIP else which("nodejs") or which("node")
CSSLINT = which("csslint")

NODEJS_INIT_OK = False
if NODEJS:
    # NODEJS_VERSION = subprocess.getoutput(NODEJS + ' --version')
    # print('using %s %s' % (NODEJS, NODEJS_VERSION))
    NODEMODULES = join(realpath(BUILD_TOOLS), "node_modules")
    NODEBIN = join(NODEMODULES, ".bin")
else:
    DEBUG_SKIP = ['npm', 'babel', 'uglifyjs', 'postcss']

def _install_deps(force=False, update=True):
    if 'npm' in DEBUG_SKIP:
        return True
    global NODEJS_INIT_OK
    d = getcwd()
    chdir(BUILD_TOOLS)
    NODEJS_INIT_OK = True
    if force or not isfile('package-lock.json'):
        err = subprocess.call('npm install'.split())
        NODEJS_INIT_OK = (err == 0)
    if update:
        err = subprocess.call('npm update'.split())
        NODEJS_INIT_OK = (err == 0)
    chdir(d)

def _nodebin(cmd, *args):
    if not NODEJS_INIT_OK:
        print('npm install incomplete : abort')
        return
    cmd_path = cmd if cmd.startswith('./') else join(NODEBIN, cmd)
    return system("%s %s %s" % (NODEJS, cmd_path, " ".join(args)))


def transpile(files, target):
    """ Transpile """
    complete = concatenated(files)
    # specific to babeljs... preset env is not found without that
    nodemodules_local = join(dirname(complete), "node_modules")
    if not (islink(nodemodules_local) or isdir(nodemodules_local)):
        symlink(NODEMODULES, nodemodules_local)
    #

    if  'babel' in DEBUG_SKIP:
        print_info("%14s > %s", 'Copy (no babel)', relpath(target))
        copy(complete, target)
        return True

    print_info("%14s > %s", 'Transpile JS', relpath(target))
    return _nodebin('babel', '--presets env', '-o', target, complete)


def minify(src, target):
    """ Minify """

    if  'uglifyjs' in DEBUG_SKIP:
        print_info("%14s > %s", 'Copy (no uglifyjs)', relpath(target))
        copy(src, target)
        return True

    print_info("%14s > %s", 'Minify JS', relpath(target))

    return _nodebin('uglifyjs', '-o',  target, src, '-c', '-m')


def postcss(files, target):
    """ Autoprefix """

    if CSSLINT and not 'csslint' in DEBUG_SKIP:
        for f in files:
           p = subprocess.Popen([CSSLINT, f],
                                stdout=subprocess.PIPE)
           p.communicate()
           if p.returncode != 0:
               print_err('CSS LINT failed for %s', f)

    complete = concatenated(files)

    if  'postcss' in DEBUG_SKIP:
        print_info("%14s > %s", 'Copy (no postcss)', relpath(target))
        copy(complete, target)
        return True

    print_info("%14s > %s", 'Autoprefix CSS', target)
    return _nodebin(join(BUILD_TOOLS, 'postcss.js'), complete, target)
