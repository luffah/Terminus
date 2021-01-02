#!/usr/bin/env python3
# encoding: utf-8
"""
   Helper for project paramaters
   License : GPL
"""
import os
from os.path import split, join, isfile, isdir, dirname, realpath
import sys
from ogaget.credit_file import parse
from .logging import print_err
from . import merge_dict
TOOLS = dirname(dirname(sys.argv[0]))
BUILD_TOOLS = join(TOOLS, 'build')

DEFAULT_LANGS = []


def get_project_parameters(gamedir, tgt=''):
    """ get all project paramets (prepare most of things) """
    app_name = split(gamedir[:-1] if gamedir.endswith('/') else gamedir)[-1]
    params = {
        # SOURCE
        'app_name': app_name,
        'project_dir': gamedir,
        # file project_dir/game_info_file
        'game_info_file': 'credits.txt',
        'game_users_file': 'users.txt',
        # dir  project_dir/root_dir
        'root_dir': 'rootfs',
        # dir  project_dir/webroot_dir
        'webroot_dir': 'webroot',
        # file project_dir/webroot_dir/index.html
        'index.html': 'index.html',
        # dir  project_dir/ui_dir
        'ui_dir': 'ui',
        # dir  source_engine_dir (from git root)
        'source_engine_dir': realpath('engine'),
    }
    if tgt:
        params.update({
            # TARGET
            'target_dir': realpath(tgt),
            # dirs project_dir/webroot_dir/{css,img,js,engine}
            'target_engine_subdir': 'js.engine',
            'target_css_subdir': 'css',
            'target_img_subdir': 'img',
            'target_sound_subdir': 'snd',
            'target_music_subdir': 'snd',
            'target_js_subdir': 'js.built',
            # files in  target_dir/js/
            'game.js': 'game.js',
            # %s = lang
            'dialog.%s.js': 'dialog.%s.js',
            'dialog.%s.po': '%s.po',
            # minified targets
            'game.min.%s.js': 'game.min.%s.js',
            'min.css':  'game.min.css',
            'all_transpiled.%s.js': 'game.es5.%s.js',
            'game.min.%s.html': '%s.%s.html' % (app_name, '%s')
        })

        params['target_engine_dir'] = params['source_engine_dir']

    # load project settings
    game_infos = parse(join(params['project_dir'],
                                 params['game_info_file'])).get('params', {})
    users = parse(join(params['project_dir'],
                                 params['game_users_file']), with_order=False)
    merge_dict(game_infos, {'game': { 'users': users}})
    merge_dict(params, game_infos)

    # post processing on variable type
    type_spec = {
        'root_dir': str,
        'webroot_dir': str,
        'game/users/default': str,
        'game/users': dict,
        'game/users/*/groups': list,
        'game/users/*/password': str,
        'game/users/*/variables': dict,
        'game/users/*/variables/*': str,
    }

    def _rec_correct_types(dic, k=None, path=None):
        if not k:
            for nk in dic.keys():
                _rec_correct_types(dic, nk, (path + '/') if path else '' + nk)
            return
        if k not in dic:
            return
        t_spec = type_spec.get(path, None)

        if t_spec and not isinstance(dic[k], t_spec):
            val = dic[k]
            if isinstance(val, list) and t_spec == str:
                dic[k] = val[0]
            # TODO support more types conversion
        elif isinstance(dic[k], dict):
            for nk in dic[k].keys():
                _rec_correct_types(dic[k], nk, path + '/' + nk)
                _rec_correct_types(dic[k], nk, path + '/*')

    _rec_correct_types(params)

    # post processing on directories path
    params['root_dir'] = join(gamedir, params['root_dir'])
    params['ui_dir'] = join(gamedir, params['ui_dir'])
    for key in list(params.keys()):
        if key.endswith('_file'):
            params['./'+key] = join(params['project_dir'], params[key])
    if tgt:
        params['webroot_dir'] = join(gamedir, params['webroot_dir'])
        params['engine_dir'] = join(params['webroot_dir'],
                                    params['target_engine_subdir'])
        for a in ['css', 'img', 'js', 'sound', 'music']:
            params[a + '_dir'] = join(
                params['webroot_dir'],
                params['target_' + a + '_subdir'])
            params['target_' + a + '_dir'] = join(
                params['target_dir'],
                params['target_' + a + '_subdir'])

        for key in list(params.keys()):
            if key.endswith('.js') or key.endswith('.po'):
                params['./'+key] = join(params['target_js_dir'], params[key])
            if key.endswith('.css'):
                params['./'+key] = join(params['target_css_dir'], params[key])
            elif key == 'index.html':
                params['./'+key] = join(params['webroot_dir'], params[key])
            elif key.endswith('.html'):
                params['./'+key] = join(params['target_dir'], params[key])

        assert test_param(params, 'target_dir')
        assert test_param(params, 'source_engine_dir')

    assert test_param(params, 'project_dir')
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
    'game_defaults',  # -> define game object defaults
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
