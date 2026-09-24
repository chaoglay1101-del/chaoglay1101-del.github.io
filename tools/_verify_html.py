"""Validate the pages: UTF-8, tags balanced, local files present, links sane.

Checks that matter for this site:

* every local ``href``/``src`` resolves to a file on disk (a missing
  ``assets/js/i18n.js`` once left the language toggle silently broken);
* the ``og:image`` share card resolves, because a broken link preview fails
  silently everywhere;
* external links open in a new tab with ``rel="noopener"``;
* the language and theme controls are present, and the navigation toggle is
  present on pages that actually have a navigation menu.
"""

import html.parser
import pathlib
import re

SITE = pathlib.Path(__file__).resolve().parents[1]
PAGES = ("index.html", "research.html", "cv.html", "cv-onepage.html", "404.html")

REF_RE = re.compile(r'(?:href|src)="([^"]+)"')
EXTERNAL_RE = re.compile(r"^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|//|#)")
ANCHOR_RE = re.compile(r"<a\b[^>]*>")
LINK_TAG_RE = re.compile(r"<link\b[^>]*>")
HREF_RE = re.compile(r'\bhref="([^"]*)"')
NAV_RE = re.compile(r'<nav\b[^>]*class="[^"]*primary-nav')


def external_link_problems(text: str) -> list[str]:
    """External anchors must open in a new tab and drop the referrer."""
    found = []
    for tag in ANCHOR_RE.findall(text):
        href = HREF_RE.search(tag)
        if not href or not href.group(1).lower().startswith(("http://", "https://")):
            continue
        if 'target="_blank"' not in tag:
            found.append(f"missing target=_blank: {href.group(1)}")
        if not re.search(r'\brel="[^"]*\bnoopener\b', tag):
            found.append(f"missing rel=noopener: {href.group(1)}")
    return found


def stray_target_problems(text: str) -> list[str]:
    """target= belongs on anchors, never on <link> elements."""
    return [tag for tag in LINK_TAG_RE.findall(text) if "target=" in tag]

# Social-sharing images are absolute URLs, so they need a separate check: the
# path after the site origin must resolve to a file, or link previews break
# silently (social scrapers never report the error to anyone).
META_TAG_RE = re.compile(r"<meta\b[^>]*>")
SOCIAL_IMAGE_RE = re.compile(r'(?:property="og:image"|name="twitter:image")')
CONTENT_RE = re.compile(r'content="([^"]*)"')
SITE_ORIGIN = "https://chaoglay1101-del.github.io/"


def social_images(text: str) -> list[str]:
    found = []
    for tag in META_TAG_RE.findall(text):
        if SOCIAL_IMAGE_RE.search(tag):
            match = CONTENT_RE.search(tag)
            if match:
                found.append(match.group(1))
    return found

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

    has_nav = bool(NAV_RE.search(text))
    needed = ["toggle-lang", "toggle-theme"] + (["toggle-nav"] if has_nav else [])
    absent = [action for action in needed if f'data-action="{action}"' not in text]
    external = external_link_problems(text)
    stray = stray_target_problems(text)

    print("=" * 60, name)
    print("  valid utf-8:", "yes")
    print("  header controls present:", not absent, f"({len(needed)} checked)")
    print("  '??' remaining:", text.count("??"))
    print("  parser errors:", parser.errors or "none")
    print("  unclosed tags:", unclosed or "none")
    print("  i18n keys referenced:", len(set(re.findall(r'data-i18n[a-z-]*="([^"]+)"', text))))

    missing = []
    for ref in REF_RE.findall(text):
        if EXTERNAL_RE.match(ref):
            continue
        target = ref.split("#", 1)[0].split("?", 1)[0]
        # A leading slash means "relative to the site root", which is how the
        # 404 page has to reference its assets at any URL depth.
        if target.startswith("/"):
            target = target.lstrip("/")
        if target and not (SITE / target).exists():
            missing.append(ref)
    print("  local files missing:", missing or "none")
    print("  external links:", f"{len(ANCHOR_RE.findall(text))} anchors, problems: {external or 'none'}")
    if stray:
        print("  <link> tags carrying target=:", stray)

    social = social_images(text)
    broken_social = [
        url
        for url in social
        if url.startswith(SITE_ORIGIN) and not (SITE / url[len(SITE_ORIGIN) :]).exists()
    ]
    wrong_origin = [url for url in social if not url.startswith(SITE_ORIGIN)]
    # Shareable pages advertise themselves with og:title; the 404 page sets
    # noindex instead and deliberately has no preview card.
    shareable = 'property="og:title"' in text
    print("  social image:", ", ".join(sorted(set(social))) or ("MISSING" if shareable else "n/a (noindex page)"))
    if broken_social:
        print("  social image not on disk:", broken_social)
    if wrong_origin:
        print("  social image on an unexpected origin:", wrong_origin)

    if (
        parser.errors
        or unclosed
        or text.count("??")
        or missing
        or (shareable and not social)
        or broken_social
        or wrong_origin
        or absent
        or external
        or stray
    ):
        problems += 1

print("\nRESULT:", "ALL GOOD" if problems == 0 else f"{problems} page(s) with issues")
