#!/usr/bin/env python3
# pylint: disable=unexpected-keyword-arg
"""
   Generate javascript and move assets
"""
import os
from os.path import basename, join
from re import match
from . import copy, copy_dir, ensure_dir, onlydirs, onlyfiles, write
from .assets import Assets
from .credit import EXTRA_CREDITS, LANG_CREDITS, CREDITS_DATA, parse_credit
from .build_params import (
    ASSET_TYPES, CONTAMINATION_NOTE, CONTENT_POSITION,
    RE_CONTENT, ROOM_ATTR_FILE
)
from .html import fetch_javascript_src, fetch_css_src, inject as htmlinject
from .jspart import protect_js_property_key, quoted, jsdeclare_var, jsonize
from .nodejs import transpile, minify, postcss as _postcss
from .po import POLines, lang_from_fname, po2json
from .trace import (LineFollower, follow_as, get_attrs_content,
                    get_content, add_comma, rm_trailing_comma)
from .logging import print_err, print_info

INDENT_STRING = '  '


def _nopo(polines, typ, name, indent=''):
    return []
    # TODO before uncomment , ensure missing check nopo is not already set up
    # nopo = polines.missing(typ, name)
    # return follow_as(
    #     'nopo',
    #     [indent + "nopo: [" + ", ".join(nopo) + "],\n"]
    # ) if nopo else []


def _embrace(path, brackets, content, name, indent=''):
    return (
        follow_as(path, [brackets[0] % (indent, name)]) +
        rm_trailing_comma(content) +
        follow_as(path, [brackets[1] % indent])
    ) if content else []


def _crawl_subdir(room, polines, assets, jslines, indent):
    name = basename(room[:-1] if room.endswith('/') else room)
    return _embrace(
        room, ["%s%s: {\n", "\n%s}\n"],
        _crawl_attrs(room, polines, assets, jslines, indent),
        protect_js_property_key(name),
        indent * INDENT_STRING
    )


def _crawl_hidden(room, polines, assets, jslines, hidden_name):
    return _embrace(
        room, ["%snewRoom(%s, {\n", "\n%s})\n"],
        _crawl_attrs(room, polines, assets, jslines, 0),
        quoted(protect_js_property_key(hidden_name))
    )


def _crawl_fetch_children(room, polines, assets, jslines, indent):
    children = []

    for fpath, matched in onlydirs(room, match=RE_CONTENT['hidden_dir']):
        jslines['hidden_rooms'] += _crawl_hidden(
            fpath, polines, assets, jslines,
            hidden_name=matched.group(1)
        )

    for fpath, _ in onlydirs(room, match=RE_CONTENT['regular_dir']):
        children += add_comma(_crawl_subdir(
            fpath, polines, assets, jslines,
            indent=indent + 2))

    return children


def _crawl_fetch_content(room, polines, indent):
    lvl = indent * INDENT_STRING
    content = {'item': [], 'people': []}
    for typ in list(content.keys()):
        for fpath, matched in onlyfiles(
                room, match=RE_CONTENT[typ], ext='.js'):
            tname = protect_js_property_key(matched.group(1))
            content[typ] += _embrace(
                room, ["%s%s: {\n", "\n%s},\n"],
                get_attrs_content(fpath, lvl) + _nopo(
                    polines, typ, matched.group(1), lvl + INDENT_STRING
                ),
                tname, lvl)
    return content


def _get_varname(room):
    return '$%s' % basename(
        room[:-1] if room.endswith('/') else room
    )


def _crawl_attrs(room, polines, assets, jslines, indent):
    polines.add(room)

    # extra functions
    for i in [j for j in CONTENT_POSITION if j.startswith('_')]:
        jslines[i] += get_content(join(room, '%s.js' % i))

    lvl = indent * INDENT_STRING
    lvl1 = (indent + 1) * INDENT_STRING
    name = basename(
        room[:-1] if room.endswith('/') else room
    ).replace('hidden:', '')
    attrs = _nopo(polines, 'room', name, lvl1)
    attrs += add_comma(get_attrs_content(join(room, ROOM_ATTR_FILE), lvl))

    attrs += _embrace(room, ["%s%s: {\n", "%s},\n"],
                      _crawl_fetch_children(
                          room, polines, assets, jslines, indent),
                      'children', lvl1)

    for (typ, values) in _crawl_fetch_content(
            room, polines, indent + 2).items():
        attrs += _embrace(room, ["%s%ss: {\n", "%s},"], values, typ, lvl1)

    for fpath, matched in onlyfiles(room, match=RE_CONTENT['link'], ext='.js'):
        tname = quoted(protect_js_property_key(matched.group(1)))
        jslines['links'] += _embrace(
            room, ["%s" + _get_varname(room) + ".newLink(%s, {\n", "%s})"],
            get_attrs_content(fpath, '') + _nopo(polines, 'link',
                                                 matched.group(1),
                                                 INDENT_STRING),
            tname)

    assets.detect(room)
    return attrs


def _dir2js(params):
    ensure_dir(params['target_js_dir'])

    assets = Assets()
    assets.detect(params['project_dir'])
    assets.detect(params['ui_dir'], rec=True)

    polines = POLines()
    polines.add(params['project_dir'])
    polines.add(params['ui_dir'], rec=True)

    assets_builder = params.get('assets_builder', default_assets_builder)
    licenses_builder = params.get('licenses_builder', default_licenses_builder)
    game_defaults_builder = params.get('game_defaults_builder',
                                       default_game_defaults_builder)
    credits_builder = params.get('credits_builder', default_credits_builder)

    jslines = {
        'game_defaults': game_defaults_builder(params),
        'license': licenses_builder(params),
        'contamination': [
            ('CONTAMINATION_NOTE',
             CONTAMINATION_NOTE.splitlines(True))
        ],
        'ui': get_content(params['ui_dir'], ext='.js'),
        'engine': get_content(
            params.get('engine_files', [])
        ),
        'hidden_rooms': [],
        'links': []
    }

    for i in [j for j in CONTENT_POSITION if j.startswith('_')]:
        jslines[i] = get_content(join(params['project_dir'], '%s.js' % i))

    jslines['content'] = _embrace(
        params['root_dir'], ["%snewRoom(%s, {\n", "\n%s})\n"],
        _crawl_attrs(params['root_dir'], polines, assets, jslines, 0),
        quoted(protect_js_property_key(
            basename(params['root_dir'])))
    )
    jslines['assets'] = assets_builder(params, assets)
    jslines['credits'] = credits_builder(params)

    js_file = LineFollower(params['./game.js'])

    for i in CONTENT_POSITION:
        js_file.write(jslines[i], title=i)
    js_file.close()
    pogen(params, polines)

    params.update({
        'line_follower': js_file,
        'assets': assets
    })
    return params


def _get_extra_credits(tab):
    """ sort """
    for typ in tab:
        tab[typ] = sorted(
            [k for k in tab[typ]],
            key=lambda a: 1 /
            tab[typ][a]
        )
    return tab


def pogen(params, polines):
    """ build dialog file"""
    for (lang, content) in polines.get():
        if lang not in LANG_CREDITS:
            print_err(
                "Missing translators information.\n"
                "Add a line '[%s] translation: names;...'\n"
                "in file: '%s'" % (lang, params['./game_info_file']))
            print_info('exiting...')
            exit()
        write(params['./dialog.%s.po'] % lang, content)
        write(
            params['./dialog.%s.js'] % lang,
            po2json(params['./dialog.%s.po'] % lang) + [
                "const APP_NAME = '%s';" % params['app_name'],
                "const LANG = '%s';\n" % lang] +
            jsdeclare_var('LANG_CREDITS',
                          _get_extra_credits(LANG_CREDITS[lang])),
            title='%s dialogs' % lang
        )


def default_licenses_builder(dicparam):
    """ license ... """
    dicparam['license'] = 'GPL'
    return follow_as('default_licenses_builder', ['/* license is GPL */\n'])


def default_credits_builder(dicparam):

    (credits_, keys_) = parse_credit(dicparam['./game_info_file'])

    if os.environ.get('DEBUG', False):
        from pprint import pprint
        pprint(credits_)
        pprint(keys_)

    return follow_as(
        'default_credits_builder',
        jsdeclare_var('CREDITS', credits_) +
        jsdeclare_var('CREDITS_ORD', keys_) +
        (
            jsdeclare_var('CREDITS_EXTRA',  _get_extra_credits(EXTRA_CREDITS))
            if EXTRA_CREDITS.keys() else []
        ) +
        (
            jsdeclare_var('CREDITS_DATA', CREDITS_DATA)
            # TODO append here code block to refill RES and CREDITS dict
            if CREDITS_DATA else []
        )
    )


def default_game_defaults_builder(params):
    """ propagate params file as defaults """
    game_settings = params.get('game',{})

    users = game_settings.get('users',{})

    default_user = users.get('default', '')
    user = users.get(default_user, {})

    start_dir = game_settings.get(
        'start_dir', user.get(
            'variables',{}).get(
                'HOME','/'))

    users = { k:v for k, v in users.items() if k != 'default' }
    for u in users:
        users[u]['v'] = users[u].pop('variables')

    return follow_as(
        'default_game_defaults_builder',"""
var GameDefaults = { env: function (){
      return new Env({
        me: %s, // current user
        r: %s, // current working dir
        users: %s,
        fs: $rootfs,
        fixpaths: 1
        })
    }
}
""" % (jsonize(default_user), jsonize(start_dir), jsonize(users))
    )


def default_assets_builder(params, assets):
    """ reference assets in js and copy content """
    jsassets = {}
    for typ in ASSET_TYPES:
        ensure_dir(params['target_%s_dir' % typ])
        jsassets[typ] = {}
        for ref, (source, filename, credit) in assets.items(typ):
            copy(source, params['target_%s_dir' % typ], filename)
            ftgt = join(params['target_%s_subdir' % typ], filename)
            if typ == 'img':
                objrefs = ftgt
            else:
                fsplitted = ftgt.split('.')
                objrefs = [".".join(fsplitted[:-1]) + '.', fsplitted[-1]]
            jsassets[typ][ref] = {'src': objrefs, 'by': credit}

    return follow_as('default_assets_builder', jsdeclare_var('RES', jsassets))


def build(params):
    """ make an usable js script from project_dir """
    # print(CONTAMINATION_NOTE)
    ensure_dir(params['target_dir'])
    ensure_dir(params['target_js_dir'])
    copy_dir('css_dir', 'target_dir', 'target_css_subdir', params=params)
    copy_dir('engine_dir', 'target_js_dir', 'target_engine_subdir', params=params)
    return _dir2js(params)


def transpilejs(params):
    """ transpile js """
    langmatch = params['dialog.%s.js'].replace(
        '.', '\\.').replace('%s', '[a-zA-Z_]+')
    avoid = r".*%s.*" % langmatch
    engine_files = [
        fpath
        for fpath in
        fetch_javascript_src(params['./index.html'])
        if not match(avoid, fpath)
    ]
    for fdial, _ in onlyfiles(
            params['target_js_dir'], ext='.js', match=langmatch
    ):
        transpile(
            [fdial] + engine_files,
            params['./all_transpiled.%s.js'] % lang_from_fname(fdial)
        )


def minifyjs(params):
    """ minify js """
    langmatch = params['all_transpiled.%s.js'].replace(
        '.', '\\.').replace('%s', '[a-zA-Z_]+')
    for ftr, _ in onlyfiles(
            params['target_js_dir'], ext='.js', match=langmatch
    ):
        minify(
            ftr,
            params['./game.min.%s.js'] % lang_from_fname(ftr)
        )


def postcss(params):
    """ call postcss autoprefixer """
    css_files = fetch_css_src(params['./index.html'])
    _postcss(css_files, params['./min.css'])


def all_in_one_html(params):
    """ generate minimal all-in-one html """
    orig = params['./index.html']
    css = params['./min.css']
    langmatch = params['game.min.%s.js'].replace(
        '.', '\\.').replace('%s', '[a-zA-Z_]+')
    for jsmin, _ in onlyfiles(
            params['target_js_dir'], ext='.js', match=langmatch
    ):
        target = params['./game.min.%s.html'] % lang_from_fname(jsmin)
        htmlinject(orig, css, jsmin, target)
