"""Validate the repaired pages: UTF-8, tags balanced, local files present.

Also checks the critical markup (the three header control buttons) and, since a
missing ``assets/js/i18n.js`` once left the language toggle silently broken,
that every local ``href``/``src`` reference resolves to a file on disk.
"""

import html.parser
import pathlib
import re

SITE = pathlib.Path(__file__).resolve().parents[1]
PAGES = ("index.html", "research.html", "cv.html")

REF_RE = re.compile(r'(?:href|src)="([^"]+)"')
EXTERNAL_RE = re.compile(r"^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|//|#)")

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"}


class Checker(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append(f"stray </{tag}>")
            return
        if self.stack[-1] == tag:
            self.stack.pop()
        else:
            self.errors.append(f"</{tag}> closes <{self.stack[-1]}>")


problems = 0
for name in PAGES:
    path = SITE / name
    text = path.read_text(encoding="utf-8")
    parser = Checker()
    parser.feed(text)
    unclosed = [t for t in parser.stack if t not in ("html", "body")]

    print("=" * 60, name)
    print("  valid utf-8:", "yes")
    print("  3 header buttons:", text.count('data-action="toggle-') == 3)
    print("  '??' remaining:", text.count("??"))
    print("  parser errors:", parser.errors or "none")
    print("  unclosed tags:", unclosed or "none")
    print("  i18n keys referenced:", len(set(re.findall(r'data-i18n[a-z-]*="([^"]+)"', text))))

    missing = []
    for ref in REF_RE.findall(text):
        if EXTERNAL_RE.match(ref):
            continue
        target = ref.split("#", 1)[0].split("?", 1)[0]
        if target and not (SITE / target).exists():
            missing.append(ref)
    print("  local files missing:", missing or "none")

    if parser.errors or unclosed or text.count("??") or missing:
        problems += 1

print("\nRESULT:", "ALL GOOD" if problems == 0 else f"{problems} page(s) with issues")
