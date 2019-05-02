#!/usr/bin/env python3
# pylint: disable=unexpected-keyword-arg
"""
   Register assets and read credit files
"""
from os.path import basename, realpath, relpath
from . import onlyfiles
from .build_params import RE_CONTENT, ASSET_TYPES
from .jspart import protect_js_property_key
from .logging import print_err
from .credit import parse_credit_asset


class Assets():
    """ store assets """
    assetsdict = {}

    def register(self, typ, fpath, ref):
        """ register asset """
        source = relpath(realpath(fpath))
        filename = basename(source)
        ref_name = protect_js_property_key(ref)
        if typ not in self.assetsdict:
            self.assetsdict[typ] = {}
        info_file = ".".join(source.split('.')[:-1]) + '.txt'
        refcredit = parse_credit_asset(info_file, typ)
        if not refcredit:
            refcredit = {}
            print_err('please credit the artists for %s in %s',
                      filename, info_file)
        self.assetsdict[typ][ref_name] = (source, filename, refcredit)

    def detect(self, room, rec=False):
        """ register assets referenced in a room """
        for typ in ASSET_TYPES:
            for fpath, matched in onlyfiles(
                    room, match=RE_CONTENT[typ], rec=rec):
                self.register(typ, fpath, matched.group(1))

    def items(self, typ=False):
        """ get all assets of some type """
        return ([] if not self.assetsdict.get(typ, 0)
                else self.assetsdict[typ].items())
