#!/usr/bin/env python3
"""Stamp every asset link with a hash of the file it points at.

Renaming content behind a stable filename is how a browser ends up showing the
wrong slide: the URL never changed, so the cached bytes stayed. Hashing the URL
means any edit produces a new address and no cache can serve the old picture.
Run before committing.
"""
import hashlib
import pathlib
import re

root = pathlib.Path(__file__).parent
html = root / "index.html"
text = html.read_text()


def digest(rel):
    path = root / rel
    if not path.exists():
        return None
    return hashlib.sha1(path.read_bytes()).hexdigest()[:8]


def stamp(match):
    attr, rel = match.group(1), match.group(2)
    d = digest(rel)
    return match.group(0) if d is None else f'{attr}="{rel}?v={d}"'


text, styles = re.subn(r'(href)="(css/[^"?]+)(?:\?v=[0-9a-f]+)?"', stamp, text)
text, scripts = re.subn(r'(src)="(js/[^"?]+)(?:\?v=[0-9a-f]+)?"', stamp, text)
text, images = re.subn(r'(src)="(assets/img/[^"?]+)(?:\?v=[0-9a-f]+)?"', stamp, text)

html.write_text(text)

# The JSON the page fetches needs the same treatment: those URLs live inside
# app.js, so an edited review sat behind a cached file until the script itself
# happened to change.
script = root / "js" / "app.js"
code = script.read_text()


def stamp_fetch(match):
    rel = match.group(1)
    d = digest(rel)
    return match.group(0) if d is None else f'fetch("{rel}?v={d}")'


code, data = re.subn(r'fetch\("(data/[^"?]+)(?:\?v=[0-9a-f]+)?"\)', stamp_fetch, code)
script.write_text(code)

print(f"stamped {styles} stylesheet, {scripts} script, {images} image, {data} data links")
