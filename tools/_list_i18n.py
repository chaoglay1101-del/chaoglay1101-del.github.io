"""Collect every i18n key referenced by the pages, with its English text."""

import html.parser
import pathlib
import re

SITE = pathlib.Path(__file__).resolve().parents[1]
PAGES = ("index.html", "research.html", "cv.html")

key_re = re.compile(r'data-i18n(?:-html|-meta)?="([^"]+)"')
attr_re = re.compile(r'data-i18n-attr="([^"]+)"')

seen: dict[str, str] = {}
for name in PAGES:
    text = (SITE / name).read_text(encoding="utf-8")
    for m in key_re.finditer(text):
        seen.setdefault(m.group(1), name)
    for m in attr_re.finditer(text):
        for pair in m.group(1).split(","):
            _, key = pair.split(":")
            seen.setdefault(key.strip(), name)

print("total keys:", len(seen))
for key in sorted(seen):
    print(key)
