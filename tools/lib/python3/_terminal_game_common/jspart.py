#!/usr/bin/env python3
# encoding: utf-8
"""
   js part (parsing of attributes.js files)
"""
from os.path import basename, dirname
import re
from . import get_content, add_comma
from .build_params import (
    ASSET_TYPES, RE_CONTENT, ASSET_FORMAT, RE_ASSET_JS,
    RE_START_ATTR_FILE, RE_END_ATTR_FILE
)
from .logging import print_warn, print_err

JS_STRING_QUOTE = "'"
JS_STRING_ALT_QUOTE = "'"

RE_COMMENT = r"^\s*(/.*|/\*.*|\s+\*.*)"


def protect_js_property_key(key):
    """ prepare key to be used as dict key """
    quote_chr = (
        JS_STRING_ALT_QUOTE if JS_STRING_QUOTE in key
        else
        JS_STRING_QUOTE if (
            '{' in key or '}' in key or
            '[' in key or ']' in key or
            '(' in key or ')' in key or
            '.' in key or ':' in key or
            ' ' in key or '+' in key or
            '-' in key or ',' in key or
            '%' in key
        ) else '')
    return "%s%s%s" % (quote_chr, key, quote_chr)



def protect_js_var(var):
    """ prepare var to be used as variable name """
    ret = ""
    return re.sub('[.()!]+', '_', var)


def quoted(var):
    """ result is a quoted string """
    return var if var.startswith('"') or var.startswith("'") else "'%s'" % var


def get_attrs_content(fname, indent="", as_dict=False):
    """ read lines of an attribute.js file """
    lines = get_content(fname)
    if not lines:
        print_warn("nothing in %s", fname)
        return []
    attrlines = []
    started = False
    ended = False
    errorlines = []
    for (idx, line) in enumerate(lines):
        if started and not ended:
            if re.match(RE_END_ATTR_FILE, line):
                ended = True
            else:
                attrlines.append(line)
        else:
            if re.match(RE_START_ATTR_FILE, line):
                started = True
            elif not line.strip() and not re.match(RE_COMMENT, line):
                errorlines.append(idx + 1)
    if ended:
        for idx in errorlines:
            print_err(
                "file %s, line %d ignored, outside of ({  }) block",
                fname, idx
            )
    else:
        print_err("%s : file misformed", fname)
        print_err("%s : first line shall be '({'", fname)
        print_err("%s : last line  shall be ')}'", fname)

    if as_dict:
        return parse_attrs_lines(attrlines)

    return [indent + s for s in add_comma(attrlines)]


RE_JS_VALUE_F = r"(.*,\s*)?([\"']?)(%s)\2:\s*%s(\s*(,.*)?)"
RE_JS_VALUE_F_INT = r"(\d+),?"
RE_JS_VALUE_F_STR = r"([\"']?)([^\"'?]+)\4,?"
RE_JS_VALUE_F_KEY = r"[^\"'?]+"


def find_js_value(lines, k):
    """ get value defined in attributes """
    for line in [l.strip() for l in lines]:
        matched = re.match(RE_JS_VALUE_F % (
            k, RE_JS_VALUE_F_INT
        ), line)
        if matched:
            return int(matched.group(4))
        matched = re.match(RE_JS_VALUE_F % (
            k, RE_JS_VALUE_F_STR
        ), line)
        if matched:
            return matched.group(5)
    return None

def parse_attrs_lines(lines):
    ret = {}
    for line in [l.strip() for l in lines]:
        matched = re.match(RE_JS_VALUE_F % (
            RE_JS_VALUE_F_KEY, RE_JS_VALUE_F_INT
        ), line)
        if matched:
            ret[matched.group(3)] = int(matched.group(4))
        matched = re.match(RE_JS_VALUE_F % (
            RE_JS_VALUE_F_KEY, RE_JS_VALUE_F_STR
        ), line)
        if matched:
            ret[matched.group(3)] = matched.group(5)
    return ret



def get_related_var(fpath, lines=False):
    """ get var that shall be attributed by engine """
    varname = None
    fname = basename(fpath)
    if not lines:
        lines = get_content(fname)
    if fname == RE_CONTENT['room_attributes']:
        varname = find_js_value(lines, 'var')
        if not varname:
            matched = re.match(RE_CONTENT['dir'], basename(dirname(fpath)))
            varname = '$' + protect_js_var(
                matched.group(2)
            )
    else:
        matched = (
            re.match(RE_CONTENT['item'], fname) or
            re.match(RE_CONTENT['people'], fname) or
            re.match(RE_CONTENT['link'], fname))
        if matched:
            varname = find_js_value(lines, 'var')
            if varname == 0:
                varname = matched.group(1)

    return varname


def get_assets_references(fpath, lines=False):
    """ get all references to assets in code """
    refs = []
    if not lines:
        lines = get_content(fpath, ext='.js')
    for line in lines:
        for typ in ASSET_TYPES:
            matched = (re.match(RE_ASSET_JS[typ], line) or
                       re.match(RE_ASSET_JS['explicit_'+typ], line))
            if matched:
                refs.append(
                    ASSET_FORMAT.format(type=typ, name=matched.group(2))
                )
    return refs


def jsonize(val):
    if isinstance(val, dict):
        values = ""
        for idx, (key, value) in enumerate(val.items()):
            values += "%s%s: %s" % (
                ', ' if idx != 0 else '',
                protect_js_property_key(key),
                jsonize(value)
            )
        return "{%s}" % (" %s " % values if len(values) else values)
    elif isinstance(val, list):
        values = ""
        for idx, value in enumerate(val):
            values += "%s%s" % (
                ', ' if idx != 0 else '',
                jsonize(value)
            )
        return "[%s]" % values
    elif isinstance(val, str):
        value = val.replace('\\', '\\\\')
        return (
            '"%s"' % val.replace('"', '\\"')
        ) if "'" in val else "'%s'" % val
    elif isinstance(val, bool):
        return 1 if val else 0
    elif isinstance(val, int):
        return val


def jsdeclare_var(vname, val):
    return ['var %s = %s' % (vname, jsonize(val))] + ["\n"]
