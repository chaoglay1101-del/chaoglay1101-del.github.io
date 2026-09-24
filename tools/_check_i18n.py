"""Validate assets/js/i18n.js against the strings the pages actually ask for.

Checks performed:

* every key referenced by index.html, research.html and cv.html is present in the
  Traditional Chinese pack, and no stale key sits unused in the pack;
* markup hazards are absent. Keys rendered with ``textContent`` or as an
  attribute must not carry HTML entities (they would appear literally as
  ``&lt;``), and keys rendered with ``innerHTML`` must have balanced ``<code>``
  tags.

The writer is HTML-entity free on purpose: values use real characters
(``<``, ``\u03b1``, ...) so that the same string renders correctly whichever
mode the key uses.

A report is written to tools/_i18n_report.txt in ASCII-safe form so it can be
read on a cp950 console. Run from the project root:

    uv run python 10_Personal_Website/tools/_check_i18n.py
"""

from __future__ import annotations

import json
import pathlib
import re
import sys

SITE = pathlib.Path(__file__).resolve().parents[1]
PAGES = ("index.html", "research.html", "cv.html", "cv-onepage.html", "404.html")
SCRIPT = SITE / "assets" / "js" / "i18n.js"
MAIN_SCRIPT = SITE / "assets" / "js" / "main.js"
OUT = SITE / "tools" / "_i18n_report.txt"

PACK_RE = re.compile(r"window\.SITE_I18N\s*=\s*(\{.*\})\s*;\s*$", re.DOTALL)
TEXT_RE = re.compile(r'data-i18n="([^"]+)"')
HTML_RE = re.compile(r'data-i18n-html="([^"]+)"')
META_RE = re.compile(r'data-i18n-meta="([^"]+)"')
ATTR_RE = re.compile(r'data-i18n-attr="([^"]+)"')
ENTITY_RE = re.compile(r"&(?:[a-zA-Z]+|#\d+);")
# Inline markup allowed inside data-i18n-html values; each tag must be balanced.
INLINE_TAGS = ("code", "strong", "em", "span", "sub", "sup")
MARKUP_RE = re.compile(r"</?[a-zA-Z][^>]*>")
LOOKUP_RE = re.compile(r"\blookup\(([^)]*)\)")
KEY_LITERAL_RE = re.compile(r'"([A-Za-z][\w.-]*)"')


def runtime_keys() -> set[str]:
    """Keys main.js resolves itself, so they never appear in the HTML.

    Reads every string literal passed to ``lookup(...)``, including calls whose
    argument is a conditional such as
    ``lookup(isDark ? "ui.themeLight" : "ui.themeDark", currentLang)``.

    They are written with setAttribute, so they must obey the same rule as
    attribute keys: no HTML entities.
    """
    if not MAIN_SCRIPT.exists():
        return set()
    script = MAIN_SCRIPT.read_text(encoding="utf-8")
    keys: set[str] = set()
    for arguments in LOOKUP_RE.findall(script):
        keys.update(KEY_LITERAL_RE.findall(arguments))
    return keys


def page_kinds() -> dict[str, set[str]]:
    """Map every key the site asks for to how it is rendered."""
    found: dict[str, set[str]] = {}
    for name in PAGES:
        text = (SITE / name).read_text(encoding="utf-8")
        for key in TEXT_RE.findall(text):
            found.setdefault(key, set()).add("text")
        for key in HTML_RE.findall(text):
            found.setdefault(key, set()).add("html")
        for key in META_RE.findall(text):
            found.setdefault(key, set()).add("attribute")
        for spec in ATTR_RE.findall(text):
            for pair in spec.split(","):
                _, key = (part.strip() for part in pair.split(":"))
                found.setdefault(key, set()).add("attribute")
    for key in runtime_keys():
        found.setdefault(key, set()).add("javascript")
    return found


def load_packs() -> dict[str, dict[str, str]]:
    """Parse the translation packs out of i18n.js without running JavaScript."""
    if not SCRIPT.exists():
        return {}
    match = PACK_RE.search(SCRIPT.read_text(encoding="utf-8"))
    if match is None:
        raise SystemExit(f"cannot parse {SCRIPT.name}: expected window.SITE_I18N = {{ ... }};")
    # Trailing commas are valid in a JavaScript object literal but not in JSON,
    # so drop them before handing the body to json.loads.
    body = re.sub(r",(\s*[}\]])", r"\1", match.group(1))
    packs = json.loads(body)
    return {lang: dict(entries) for lang, entries in packs.items()}


def main() -> int:
    kinds = page_kinds()
    packs = load_packs()
    lines: list[str] = []
    problems = 0

    lines.append(f"pages and scripts ask for {len(kinds)} keys; i18n.js defines {sorted(packs) or 'no pack'}")
    if not packs:
        lines.append("PROBLEM: assets/js/i18n.js is missing or empty; the language toggle has nothing to load.")
        problems += 1

    for lang, pack in sorted(packs.items()):
        missing = sorted(set(kinds) - set(pack))
        unused = sorted(set(pack) - set(kinds))
        lines.append("")
        lines.append("=" * 70)
        lines.append(f"pack '{lang}': {len(pack)} strings, {len(missing)} missing, {len(unused)} unused")
        if missing:
            problems += 1
            lines.append("  MISSING:")
            lines.extend(f"    {key}  [{'+'.join(sorted(kinds[key]))}]" for key in missing)
        if unused:
            problems += 1
            lines.append("  UNUSED:")
            lines.extend(f"    {key}" for key in unused)

        hazards = []
        for key, value in sorted(pack.items()):
            modes = kinds.get(key, set())
            mode_label = "+".join(sorted(modes)) or "unused"
            entity = ENTITY_RE.search(value)
            if entity and (modes & {"text", "attribute", "javascript"}):
                hazards.append(f"    {key}  [{mode_label}] entity {entity.group(0)} would render literally")
            if "html" in modes:
                for tag in INLINE_TAGS:
                    if value.count(f"<{tag}>") != value.count(f"</{tag}>"):
                        hazards.append(f"    {key}  [html] unbalanced <{tag}> tags")
            elif MARKUP_RE.search(value):
                hazards.append(f"    {key}  [{mode_label}] contains markup that would be shown as text")
        if hazards:
            problems += 1
            lines.append("  HAZARDS:")
            lines.extend(hazards)

    lines.append("")
    lines.append("=" * 70)
    lines.append("render mode per key (text|html|attribute):")
    for key in sorted(kinds):
        lines.append(f"  {key}  [{'|'.join(sorted(kinds[key]))}]")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT.relative_to(SITE.parent)}")
    print("RESULT:", "ALL GOOD" if problems == 0 else f"{problems} problem group(s); see report")
    return 0 if problems == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
