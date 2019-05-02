#!/usr/bin/env python3
# encoding: utf-8
"""
    = About links =

    Before use this script, you should know that:
     - a file is a pointer to inodes (filesystem datas);
     - hard link is another file that points on the same inodes;
     - symbolic link is another file that points address of the file.

    In both cases,
       You can move the link file without breaking the link.
       When you edit the link file, the linked file is changed.

    Therefore :

     A symbolic link is a pointer to the path of a file.
      -> you can see which file is pointed;
      -> if you move, rename or remove the file,
          then the link is broken and content inaccessible;
      -> you can change the content by moving the file pointed
          and placing another file at the same path.

     An hard link is a pointer to the content (inodes),
      in fact it is interpreted as a standard file.
      -> you can't see the file pointed (you can only find -samefile ./);
      -> the link will be broken only if you remove the file;
         in that case the content remains accessible with the link.
         You can move and rename freely the file pointed.
"""

from os import link, symlink, remove
from os.path import getsize, realpath, relpath, dirname, isfile
import filecmp
from shutil import copyfile
from glob import glob
import argparse

def _filesize(num):
    for unit in ['', 'k', 'M', 'G']:
        if abs(num) < 1024.0:
            return "%3.1f%s" % (num, unit)
        num /= 1024.0
    return "Too big"

def main(src=None, res=None, linkcmd=None, verbose=False, dry=False,
         relative=True):
    files_src = [f for f in glob(src + '/**', recursive=True) if isfile(f)]
    files_res = [f for f in glob(res + '/**', recursive=True) if isfile(f)]
    totalgained = 0
    for fsrc in files_src:
        for fres in [f for f in files_res if filecmp.cmp(fsrc, f)]:
            if verbose:
                print("%s\n-> %s" % (fres, fsrc))
            totalgained += getsize(fsrc)
            if callable(linkcmd) and not dry:
                remove(fsrc)
                linkcmd(realpath(fres) if not relative else
                          relpath(realpath(fres), dirname(realpath(fsrc))),
                   fsrc)
            break
    print(
        "Total %s : %s" % (
            'loss expected' if linkcmd.__name__[:4] == 'copy'
            else 'gain expected',
            _filesize(totalgained)
    ))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Transform duplicated files into links.'
    )
    parser.add_argument(
        'src',
        help="(project) contains copied files for purpose")
    parser.add_argument(
        'res',
        help="(library) contains ressources files")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        '-s', '--symbolic', action='store_const', dest='linkcmd', const=symlink,
        help="link points to the path of the file"
    )
    group.add_argument(
        '-d', '--hard', action='store_const', dest='linkcmd', const=link,
        help="link is exactly the same file accessible from an another path"
    )
    group.add_argument(
        '-c', '--copy', action='store_const', dest='linkcmd', const=copyfile,
        help="make a copy instead of a link"
    )
    parser.add_argument(
        '--dry-run', action='store_true', dest='dry', default=False
    )
    parser.add_argument(
        '--fullpath', action='store_false', dest='relative', default=True,
        help="make links from full path instead of relative path"
    )
    parser.add_argument(
        '-v', '--verbose', action='store_true', dest='verbose', default=False
    )
    main(**vars(parser.parse_args()))

