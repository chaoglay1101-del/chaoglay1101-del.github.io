"""Cross-check: every i18n key referenced by the pages vs _en_keys.json."""

import json
import pathlib
import re

SITE = pathlib.Path(__file__).resolve().parents[1]
PAGES = ("index.html", "research.html", "cv.html", "cv-onepage.html")

key_re = re.compile(r'data-i18n(?:-html|-meta)?="([^"]+)"')
attr_re = re.compile(r'data-i18n-attr="([^"]+)"')

referenced = set()
for name in PAGES:
    text = (SITE / name).read_text(encoding="utf-8")
    referenced.update(key_re.findall(text))
    for spec in attr_re.findall(text):
        for pair in spec.split(","):
            referenced.add(pair.split(":")[1].strip())

en = json.loads((SITE / "tools" / "_en_keys.json").read_text(encoding="utf-8"))
en_keys = set(en)

missing = sorted(referenced - en_keys)
extra = sorted(en_keys - referenced)

print("referenced:", len(referenced))
print("en_keys.json:", len(en_keys))
print("referenced but missing from en:", missing or "none")
print("in en but not referenced:", extra or "none")
