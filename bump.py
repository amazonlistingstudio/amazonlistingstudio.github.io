#!/usr/bin/env python3
"""Stamp css/js links with a content hash so browsers cannot serve a stale copy."""
import hashlib, pathlib, re

root = pathlib.Path(__file__).parent
html = root / "index.html"
text = html.read_text()

for asset, pattern in (("css/style.css", r'href="css/style\.css(?:\?v=[0-9a-f]+)?"'),
                       ("js/app.js",     r'src="js/app\.js(?:\?v=[0-9a-f]+)?"')):
    digest = hashlib.sha1((root / asset).read_bytes()).hexdigest()[:8]
    attr = "href" if asset.endswith(".css") else "src"
    text = re.sub(pattern, f'{attr}="{asset}?v={digest}"', text)

html.write_text(text)
print("stamped", asset)
