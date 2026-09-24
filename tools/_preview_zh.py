"""Render each page in Chinese, without a browser, so the copy can be proof-read.

Applies assets/js/i18n.js to the pages with the same regexes used by
_extract_en.py (text, inner HTML, meta content and data-i18n-attr attributes),
then strips markup and writes a readable plain-text rendering of every page to
tools/_zh_preview.txt.

This is a simulation of main.js, not a replacement for it: it proves that each
key resolves and shows how the Chinese page reads end to end.

    uv run python 10_Personal_Website/tools/_preview_zh.py [en|zh]
"""

from __future__ import annotations

import html
import json
import pathlib
import re
import sys

SITE = pathlib.Path(__file__).resolve().parents[1]
PAGES = ("index.html", "research.html", "cv.html", "cv-onepage.html")
SCRIPT = SITE / "assets" / "js" / "i18n.js"
OUT = SITE / "tools" / "_zh_preview.txt"

PACK_RE = re.compile(r"window\.SITE_I18N\s*=\s*(\{.*\})\s*;\s*$", re.DOTALL)
TEXT_RE = re.compile(r'<(?P<tag>\w+)(?P<attrs>[^>]*?)\bdata-i18n="(?P<key>[^"]+)"(?P<rest>[^>]*)>(?P<inner>.*?)</(?P=tag)>', re.DOTALL)
HTML_RE = re.compile(r'<(?P<tag>\w+)(?P<attrs>[^>]*?)\bdata-i18n-html="(?P<key>[^"]+)"(?P<rest>[^>]*)>(?P<inner>.*?)</(?P=tag)>', re.DOTALL)
META_RE = re.compile(r'(?P<pre><meta[^>]*\bcontent=")(?P<content>[^"]*)(?P<mid>"[^>]*\bdata-i18n-meta="(?P<key>[^"]+)"[^>]*>)', re.DOTALL)
META_RE2 = re.compile(r'(?P<pre><meta[^>]*\bdata-i18n-meta="(?P<key>[^"]+)"[^>]*\bcontent=")(?P<content>[^"]*)(?P<post>")', re.DOTALL)
ATTR_RE = re.compile(r'<(?P<tag>\w+)(?P<attrs>[^>]*?)\bdata-i18n-attr="(?P<spec>[^"]+)"[^>]*>', re.DOTALL)
SCRIPT_RE = re.compile(r"<(script|style)\b.*?</\1>", re.DOTALL | re.IGNORECASE)
# Only strip things that really look like tags: an unescaped "<" inside text
# (for example "* p < 0.10") must survive into the preview.
TAG_RE = re.compile(r"</?[a-zA-Z!][^>]*>")
BLANK_RE = re.compile(r"\n{3,}")


def load_pack(lang: str) -> dict[str, str]:
    match = PACK_RE.search(SCRIPT.read_text(encoding="utf-8"))
    if match is None:
        raise SystemExit(f"cannot parse {SCRIPT.name}: expected window.SITE_I18N = {{ ... }};")
    packs = json.loads(re.sub(r",(\s*[}\]])", r"\1", match.group(1)))
    if lang not in packs:
        raise SystemExit(f"pack '{lang}' not found; available: {sorted(packs)}")
    return packs[lang]


def apply_pack(text: str, pack: dict[str, str]) -> str:
    def replace_text(match: re.Match[str]) -> str:
        value = pack.get(match.group("key"))
        if value is None:
            return match.group(0)
        return f"{match.group(0)[: match.start('inner') - match.start(0)]}{value}</{match.group('tag')}>"

    def replace_html(match: re.Match[str]) -> str:
        value = pack.get(match.group("key"))
        if value is None:
            return match.group(0)
        return f"{match.group(0)[: match.start('inner') - match.start(0)]}{value}</{match.group('tag')}>"

    text = TEXT_RE.sub(replace_text, text)
    text = HTML_RE.sub(replace_html, text)

    def replace_meta(match: re.Match[str]) -> str:
        value = pack.get(match.group("key"))
        if value is None:
            return match.group(0)
        return match.group(0).replace(match.group("content"), value, 1)

    text = META_RE.sub(replace_meta, text)
    text = META_RE2.sub(replace_meta, text)

    def replace_attrs(match: re.Match[str]) -> str:
        block = match.group(0)
        attrs = match.group("attrs")
        for pair in match.group("spec").split(","):
            attr, key = (part.strip() for part in pair.split(":"))
            value = pack.get(key)
            if value is None:
                continue
            attrs = re.sub(rf'\b{re.escape(attr)}="[^"]*"', f'{attr}="{value}"', attrs)
        return block[: match.start("attrs") - match.start(0)] + attrs + block[match.end("attrs") - match.start(0) :]

    return ATTR_RE.sub(replace_attrs, text)


def readable(page: str) -> str:
    text = SCRIPT_RE.sub(" ", page)
    text = TAG_RE.sub("\n", text)
    text = html.unescape(text)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    return BLANK_RE.sub("\n\n", "\n".join(line for line in lines if line))


def main() -> int:
    lang = sys.argv[1] if len(sys.argv) > 1 else "zh"
    pack = load_pack(lang)
    chunks = [f"rendering of the three pages in '{lang}' ({len(pack)} strings applied)"]
    for name in PAGES:
        source = (SITE / name).read_text(encoding="utf-8")
        chunks.append("=" * 72)
        chunks.append(f"### {name}")
        chunks.append("=" * 72)
        chunks.append(readable(apply_pack(source, pack)))
    OUT.write_text("\n".join(chunks) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(SITE.parent)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
