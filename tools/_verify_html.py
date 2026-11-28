"""Validate the pages: UTF-8, tags balanced, local files present, links sane.

Checks that matter for this site:

* every local ``href``/``src`` resolves to a file on disk (a missing
  ``assets/js/i18n.js`` once left the language toggle silently broken);
* the ``og:image`` share card resolves, because a broken link preview fails
  silently everywhere;
* external links open in a new tab with ``rel="noopener noreferrer"``;
* the language and theme controls are present, and the navigation toggle is
  present on pages that actually have a navigation menu.
"""

import datetime
import html.parser
import pathlib
import re
import sys

SITE = pathlib.Path(__file__).resolve().parents[1]
PAGES = ("index.html", "projects.html", "research.html", "cv-onepage.html", "404.html")

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
        has_noopener = re.search(r'\brel="[^"]*\bnoopener\b', tag)
        has_noreferrer = re.search(r'\brel="[^"]*\bnoreferrer\b', tag)
        if not (has_noopener and has_noreferrer):
            found.append(f"missing rel=noopener noreferrer: {href.group(1)}")
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

# Heading levels are the only cue a screen-reader user has when jumping
# through a page's structure; <title> inside an inline SVG is a different
# element entirely and is intentionally excluded.
HEADING_TAG_RE = re.compile(r"^h([1-6])$")


def heading_structure_problems(headings: list[tuple[str, int, int]]) -> list[str]:
    """Flag more than one <h1>, or a jump that skips a heading level."""
    found = []
    h1s = [h for h in headings if h[1] == 1]
    if len(h1s) > 1:
        lines = ", ".join(str(h[2]) for h in h1s)
        found.append(f"two or more <h1> tags (lines {lines})")
    for prev, curr in zip(headings, headings[1:]):
        if curr[1] - prev[1] > 1:
            found.append(
                f"heading jumps from <{prev[0]}> (line {prev[2]}) to "
                f"<{curr[0]}> (line {curr[2]}) without an intermediate level"
            )
    return found


class Checker(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []
        self.headings = []  # [(tag, level, lineno), ...] in document order

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)
        match = HEADING_TAG_RE.match(tag)
        if match:
            self.headings.append((tag, int(match.group(1)), self.getpos()[0]))

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


CANONICAL_RE = re.compile(r'<link\b[^>]*\brel="canonical"[^>]*>')
ROBOTS_RE = re.compile(r'<meta\b[^>]*\bname="robots"[^>]*>')
LOC_RE = re.compile(r"<loc>\s*([^<]*?)\s*</loc>")
URL_BLOCK_RE = re.compile(r"<url>(.*?)</url>", re.S)
LASTMOD_RE = re.compile(r"<lastmod>\s*([^<]*?)\s*</lastmod>")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def page_seo(text: str) -> tuple[str | None, bool]:
    """Return (canonical URL or None, whether the page is noindex)."""
    canonical = None
    tag = CANONICAL_RE.search(text)
    if tag:
        href = HREF_RE.search(tag.group(0))
        canonical = href.group(1) if href else None
    noindex = any(
        "noindex" in (CONTENT_RE.search(t).group(1).lower() if CONTENT_RE.search(t) else "")
        for t in ROBOTS_RE.findall(text)
    )
    return canonical, noindex


def sitemap_problems(sitemap_text: str, pages: dict[str, str], today: datetime.date) -> list[str]:
    """sitemap.xml must match the pages: right URLs, no noindex pages, valid dates."""
    found = []
    seo = {name: page_seo(text) for name, text in pages.items()}
    entries = URL_BLOCK_RE.findall(sitemap_text)
    if not entries:
        return ["sitemap.xml has no <url> entries"]
    listed = []
    for block in entries:
        locs = LOC_RE.findall(block)
        if len(locs) != 1:
            found.append(f"<url> entry with {len(locs)} <loc> tags")
            continue
        loc = locs[0]
        if loc in listed:
            found.append(f"duplicate <loc>: {loc}")
        listed.append(loc)
        if not loc.startswith(SITE_ORIGIN):
            found.append(f"<loc> not on this site: {loc}")
            continue
        rel = loc[len(SITE_ORIGIN):]
        name = rel or "index.html"
        if name not in pages:
            found.append(f"<loc> does not match a root HTML file: {loc}")
            continue
        canonical, noindex = seo[name]
        if noindex:
            found.append(f"<loc> lists a noindex page: {loc}")
        if canonical != loc:
            found.append(f"<loc> differs from the canonical of {name}: {loc} vs {canonical}")
        stamps = LASTMOD_RE.findall(block)
        if len(stamps) != 1:
            found.append(f"<lastmod> missing or repeated for {loc}")
            continue
        stamp = stamps[0]
        try:
            if not DATE_RE.match(stamp):
                raise ValueError(stamp)
            when = datetime.date.fromisoformat(stamp)
        except ValueError:
            found.append(f"<lastmod> is not a valid YYYY-MM-DD date: {stamp} ({loc})")
            continue
        if when > today:
            found.append(f"<lastmod> is later than today: {stamp} ({loc})")
    for name, (canonical, noindex) in seo.items():
        if canonical and not noindex and canonical not in listed:
            found.append(f"{name} has a canonical and is indexable but is not in sitemap.xml: {canonical}")
    return found


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
    heading_problems = heading_structure_problems(parser.headings)

    print("=" * 60, name)
    print("  valid utf-8:", "yes")
    print("  header controls present:", not absent, f"({len(needed)} checked)")
    print("  '??' remaining:", text.count("??"))
    print("  parser errors:", parser.errors or "none")
    print("  unclosed tags:", unclosed or "none")
    print("  heading structure:", heading_problems or "ok")
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
        or heading_problems
    ):
        problems += 1

root_pages = {p.name: p.read_text(encoding="utf-8") for p in sorted(SITE.glob("*.html"))}
sitemap_found = sitemap_problems(
    (SITE / "sitemap.xml").read_text(encoding="utf-8"), root_pages, datetime.date.today()
)
print("=" * 60, "sitemap.xml")
print("  sitemap problems:", sitemap_found or "none")
if sitemap_found:
    problems += 1

print("\nRESULT:", "ALL GOOD" if problems == 0 else f"{problems} page(s) with issues")
sys.exit(1 if problems else 0)
