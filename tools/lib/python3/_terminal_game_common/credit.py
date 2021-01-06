import re
from ogaget.credit_file import parse as _just_parse_credit_file
from . import get_content, spaced, write
from .build_params import CREDIT_AUTHOR_KEYS, CREDIT_BY_LISTED_KEYS, \
    CREDIT_INFO_KEYS

"""
 /experimental/ could help to minify js;
 set INDEX_CREDIT_DATAS = True to shorten CREDITS hash by storing
 redondant names in a list CREDITS_DATA
 TODO generate a js code block that refill CREDITS
 and RES (see credits_builder in build.py)
"""
INDEX_CREDIT_DATAS = False

CREDITS_DATA = []
EXTRA_CREDITS = {}
LANG_CREDITS = {}

RE_LANG_SPECIFIC_KEY = r"^\[([a-z]+)\]\s*(.*)"


def get_credit_data_idx(name):
    if INDEX_CREDIT_DATAS:
        if name not in CREDITS_DATA:
            CREDITS_DATA.append(name)
        return CREDITS_DATA.index(name)
    else:
        return name


def parse_credit(fpath):
    """
    parse a project credit file (see credit file format in ogaget project)
    return a dictionnary ({key:list(values)}, ordered_keys)
    """
    # parsed = _just_parse_credit_file(fpath)
    (parsed, sorted_keys) = _just_parse_credit_file(fpath, return_ordered_keys=True)
    credits_ = {}
    lkeys = {}
    for key in parsed:
        m = re.match(RE_LANG_SPECIFIC_KEY, key)
        # vals = parsed.get(key, [None])[0]
        vals = parsed.get(key, None)
        if m:
            lang = m.group(1)
            lkeys[key] = m.group(2)
            for val in vals:
                _add_extra_credit(
                    lkeys[key],
                    get_credit_data_idx(val),
                    LANG_CREDITS, key=lang
                )
        elif vals:
            credits_[key] = (
                [get_credit_data_idx(val) for val in vals]
                if isinstance(vals, list) else vals
            )

    keys_ = []
    # for key in sorted(parsed.keys(), key=lambda k: parsed[k][1]):
    for key in sorted_keys:
        key_ = lkeys.get(key, key)
        if key_ not in keys_:
            keys_.append(key_)

    return (credits_, keys_)


def _add_extra_credit(typ, name, tab, key=None):
    if key:
        if key not in tab:
            tab[key] = {}
    tgt = tab[key] if key else tab

    idx = get_credit_data_idx(name)
    if typ not in tgt:
        tgt[typ] = {}
    if name not in tgt[typ]:
        tgt[typ][idx] = 0
    tgt[typ][idx] += 1


def add_extra_credit(typ, name):
    """
       store things (typ) done by peoples (name)
    """
    _add_extra_credit(typ, name, EXTRA_CREDITS)


def parse_credit_asset(
        fpath,
        asset_type,
        if_any_key=CREDIT_AUTHOR_KEYS,
        info_keys=CREDIT_INFO_KEYS,
        extra_credits_keys=CREDIT_BY_LISTED_KEYS
):
    """
    parse a credit file for an asset (see _just_parse_credit_file)
    (unordered credit)
    return a dictionnary {key:list(values)}
    """
    parsed = _just_parse_credit_file(fpath)
    refcredit = {}

    minimum = False
    for key in parsed:
        if (not if_any_key) or key in if_any_key:
            minimum = True
        # for val in parsed[key][0]:
        for val in parsed[key]:
            if key in info_keys + (if_any_key or []):
                refcredit[key] = get_credit_data_idx(val)
            if key in extra_credits_keys:
                add_extra_credit(
                    spaced(asset_type, key),
                    val
                )

            m = re.match(RE_LANG_SPECIFIC_KEY, key)
            if m:
                lang = m.group(1)
                nkey = m.group(2)
                if (not extra_credits_keys) or nkey in extra_credits_keys:
                    _add_extra_credit(
                        spaced(asset_type, nkey),
                        get_credit_data_idx(val),
                        LANG_CREDITS, key=lang
                    )
                continue

    return refcredit if minimum else []
