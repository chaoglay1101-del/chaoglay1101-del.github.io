"""Extract the English source text for every i18n key, as JSON for translation.

Handles data-i18n (text), data-i18n-html (inner HTML), data-i18n-meta (content
attribute) and data-i18n-attr="attr:key" pairs.
"""

import json
import pathlib
import re

SITE = pathlib.Path(__file__).resolve().parents[1]
PAGES = ("index.html", "research.html", "cv.html", "cv-onepage.html", "404.html")

# Regexes that capture opening tag + its inner text up to the matching close.
TEXT_RE = re.compile(r'<(?P<tag>\w+)(?P<attrs>[^>]*?)\bdata-i18n="(?P<key>[^"]+)"(?P<rest>[^>]*)>(?P<inner>.*?)</(?P=tag)>', re.DOTALL)
HTML_RE = re.compile(r'<(?P<tag>\w+)(?P<attrs>[^>]*?)\bdata-i18n-html="(?P<key>[^"]+)"(?P<rest>[^>]*)>(?P<inner>.*?)</(?P=tag)>', re.DOTALL)
META_RE = re.compile(r'<meta[^>]*\bcontent="(?P<content>[^"]*)"[^>]*\bdata-i18n-meta="(?P<key>[^"]+)"', re.DOTALL)
META_RE2 = re.compile(r'<meta[^>]*\bdata-i18n-meta="(?P<key>[^"]+)"[^>]*\bcontent="(?P<content>[^"]*)"', re.DOTALL)
ATTR_RE = re.compile(r'<(?P<tag>\w+)(?P<attrs>[^>]*?)\bdata-i18n-attr="(?P<spec>[^"]+)"[^>]*>', re.DOTALL)

def clean(s: str) -> str:
    s = s.replace("\r", "").replace("\n", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()

out: dict[str, str] = {}
for name in PAGES:
    text = (SITE / name).read_text(encoding="utf-8")
    for m in TEXT_RE.finditer(text):
        out.setdefault(m.group("key"), clean(m.group("inner")))
    for m in HTML_RE.finditer(text):
        out.setdefault(m.group("key"), clean(m.group("inner")))
    for m in META_RE.finditer(text):
        out.setdefault(m.group("key"), clean(m.group("content")))
    for m in META_RE2.finditer(text):
        out.setdefault(m.group("key"), clean(m.group("content")))
    for m in ATTR_RE.finditer(text):
        attrs = m.group("attrs")
        for pair in m.group("spec").split(","):
            attr, key = (p.strip() for p in pair.split(":"))
            am = re.search(rf'{re.escape(attr)}="([^"]*)"', attrs)
            if am:
                out.setdefault(key, clean(am.group(1)))

dest = SITE / "tools" / "_en_keys.json"
dest.write_text(json.dumps(out, ensure_ascii=False, indent=1, sort_keys=True), encoding="utf-8")
print("captured", len(out), "keys ->", dest.name)
