#!/usr/bin/env python
import sys
import re

HTML = sys.argv[1]
CSS = sys.argv[2]
JS = sys.argv[3]
TGT = sys.argv[4]

js_txt = ""
css_txt = ""

with open(TGT, "w") as f:
    with open(CSS, "r") as css:
        css_txt = "<style>%s</style>" % css.read()
    with open(JS, "r") as js:
        js_txt = "<script>%s</script>" % js.read()
    with open(HTML, "r") as html:
        js_injected = False
        css_injected = False
        lines = [line.strip() for line in html.readlines()
                if (not re.match(r"\s*<!--.*-->\s*", line))
                ]
        for line in lines:
            if (re.match(r"<script.*src=.*</script>", line)):
                if not js_injected:
                    f.write(js_txt)
                    js_injected = True
            elif (re.match(r"<link.*rel=\"stylesheet\".*/>", line)):
                if not css_injected:
                    f.write(css_txt)
                    css_injected = True
            else:
                f.write(line)
