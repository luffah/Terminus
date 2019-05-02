#!/usr/bin/env python3
# encoding: utf-8
"""
   Helper for project paramaters
   License : GPL
"""
import os
from os.path import split, join, isfile, isdir, dirname, realpath
import sys
from .logging import print_err
TOOLS = dirname(dirname(sys.argv[0]))
BUILD_TOOLS = join(TOOLS, 'build')

DEFAULT_LANGS = ['en', 'fr']


def get_project_parameters(gamedir, tgt):
    """ get all project paramets (prepare most of things) """
    app_name = split(gamedir[:-1] if gamedir.endswith('/') else gamedir)[-1]
    params = {
        # source
        # 'project_dir_info': '(directory that contains game files)',
        'project_dir': gamedir,
        'root_dir_info': '(directory that represent file system content)',
        'game_info_file': 'credits.txt',
        'root_subdir': 'fs',
        'lib_subdir': '_lib',
        'ui_subdir': '_ui',
        'app_name': app_name,
        # target
        'target_dir': realpath(tgt),
        'target_css_subdir': 'css',
        'target_img_subdir': 'img',
        'target_sound_subdir': 'snd',
        'target_music_subdir': 'snd',
        'target_js_subdir': 'js',
        'dialog.%s.js': '%s.dialog.%s.js' % (app_name, '%s'),
        'dialog.%s.po': '%s.%s.po' % (app_name, '%s'),
        'game.js': '%s.js' % app_name,
        'game.min.%s.js': '%s.min.%s.js' % (app_name, '%s'),
        'min.css':  '%s.min.css' % app_name,
        'all_transpiled.%s.js': '%s.es5.%s.js' % (app_name, '%s'),
        'index.html': 'index.html',
        'game.min.%s.html': '%s.%s.html' % (app_name, '%s')
    }
    params['webroot_dir'] = join(gamedir, '_web')
    params['css_dir'] = join(params['webroot_dir'], 'css')
    params['js_dir'] = join(params['webroot_dir'], 'js')
    params['img_dir'] = join(params['webroot_dir'], 'img')
    params['sound_dir'] = join(params['webroot_dir'], 'snd')
    params['music_dir'] = join(params['webroot_dir'], 'snd')

    for key in list(params.keys()):
        if key.endswith('_subdir'):
            params[key.replace('_subdir', '_dir')] = join(
                params['target_dir'] if key.startswith('target_') else
                params['project_dir'],
                params[key])

    for key in list(params.keys()):
        if key.endswith('_file'):
            params['./'+key] = join(params['project_dir'], params[key])
        if key.endswith('.js') or key.endswith('.po'):
            params['./'+key] = join(params['target_js_dir'], params[key])
        if key.endswith('.css'):
            params['./'+key] = join(params['target_css_dir'], params[key])
        elif key == 'index.html':
            params['./'+key] = join(params['webroot_dir'], params[key])
        elif key.endswith('.html'):
            params['./'+key] = join(params['target_dir'], params[key])

    assert test_param(params, 'project_dir')
    assert test_param(params, 'target_dir')
    assert test_param(params, 'root_dir')

    return params


#
# placement of code blocks
#
# additionnal js code block are prefixed with '_'

CONTENT_POSITION = [
    'license',        # /* builtin */
    'contamination',  #
    'engine',         # ( engine specified for linting only )
    'assets',         # -> assets to load
    'credits',        # -> credits (that are not contained in assets)
    'lib',            # -> functions in lib dir
    'ui',             # -> functions in ui dir
    '_init',
    '_background',
    '_effects',
    '_before',
    '_functions',
    '_utils',
    '_common',
    ##########        #
    'content',        # -> FS content
    ##########        #
    'hidden_rooms',   # -> unlockables
    'links',          #
    '_after',
    '_onload',
    '_menu',
    '_gamestart'
]


ASSET_TYPES = ['sound', 'music', 'img']
CREDIT_INFO_KEYS = ['title']
CREDIT_AUTHOR_KEYS = [
    'artist',    # for external assets
    'composer',  # for composed things
    'designer',  # who has designed
    'author'
]
CREDIT_BY_LISTED_KEYS = [
    'background designer',
    'bug report',
    'character designer',
    'color designer',
    'context',
    'help',
    'original designer',
    'sketch designer',
    'storyboarding',
    'thanks',
    'translation',
    'testing'
]


#
# In Project directory
ASSET_FORMAT = "{type}:{name}"
ASSET_FORMAT_RE = r"^{type}:([^:]*)(:.*)?{ext}$"

RE_CONTENT = {
    'room_attributes': '_attributes.js',
    'dir': r"^(hidden:)?([^:]*)$",
    'hidden_dir': r"^hidden:(.*)$",
    'regular_dir': r"^[^:]*$",
    'item': ASSET_FORMAT_RE.format(type='item', ext='\.js'),
    'people': ASSET_FORMAT_RE.format(type='people', ext='\.js'),
    'link': ASSET_FORMAT_RE.format(type='link', ext='\.js'),
    'img': ASSET_FORMAT_RE.format(type='img', ext='\.[bijfgmnpsv]+'),
    'music': ASSET_FORMAT_RE.format(type='music', ext='\.[3agmopvw]+'),
    'sound': ASSET_FORMAT_RE.format(type='sound', ext='\.[3agmopvw]+')
}

ROOM_ATTR_FILE = '_attributes.js'

#
# Inside attributes file
RE_START_ATTR_FILE = r"^\({\s*(//.*|/\*.*\*/)?"
RE_END_ATTR_FILE = r"^}\)\s*(/.*|/\*.*\*/)?"
RE_ASSET_JS = {
    'img': r"\s*img:\s*([\"'])([^,']*)\1.*",
    'music': r"\s*music:\s*([\"'])([^,']*)\1.*",
    'sound': r"\s*sound:\s*([\"'])([^,']*)\1.*",
    'explicit_img': r".*mkImg\(\s*([\"'])([^,']*)\1.*\).*",
    'explicit_music': r".*playMusic\(\s*([\"'])([^,']*)\1.*\).*",
    'explicit_sound': r".*playSound\(\s*([\"'])([^,']*)\1.*\).*"
}

CONTAMINATION_NOTE = """/*
 * Here is a free software.
 *
 * You can use it, share it, modify it,
 * and even sell it without authors permission,
 * provided that the changes made to the code remain free (GPL-compatible).
 *
 * The authors gave it free (as in freedom) in order to :
 * - promote usage of Command Line Interface
 * - encourage peoples to regain control over software by practicing CLI
 * - to use filesystem as a metaphor of a system easy to control,
 *   ie an authoritarian system
 *
 * Here is the result of a thousand hours of work.
 * Plus Yours :)
 */"""


def test_param(params, name):
    """ test a specific parameter """
    val = params.get(name, '')
    if not val:
        return False
    if name == 'target_dir':
        parent = dirname(realpath(val))
        if not isdir(parent):
            print_err("'%s' can't be located :\n"
                      " %s  not found " % (name, parent))
            return False
    elif name.endswith('_dir'):
        if not isdir(val):
            print_err(
                "'%s' missing :\n %s %s not found " % (
                    name, val, params.get(name + '_info', ''))
            )
            return False
    return True


def po_perimeter(gamedir):
    """ webroot is outside of perimeter """
    return not isfile(join(gamedir, 'index.html'))
