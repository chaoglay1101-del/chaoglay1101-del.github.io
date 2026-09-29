"""Find Chinese strings whose English was rewritten but which never followed.

`_check_i18n.py` enforces coverage: every key the pages ask for exists, and no
key sits unused. It cannot enforce freshness, because English lives in the HTML
while Chinese lives in the pack. Rename a heading, forget the translation, and
every check still passes while the Chinese page says something else entirely.
That is not hypothetical: the home page shipped a hero button reading
"閱讀我的履歷" for a fortnight after the English became "Download CV (PDF)", and
the meta description still advertised the old research portfolio.

The reliable signal is a comparison, not a heuristic. For each key, look at
whether the English changed between two revisions *and* whether the Chinese
changed over the same range. English moved and Chinese stayed put means somebody
forgot. Both moved means it was reviewed.

The English side is read from the working tree, and the Chinese from both the
given revision and the working tree, so the intended workflow is: change copy,
edit the pack, then run this before publishing.

    uv run python 10_Personal_Website/tools/_check_stale.py <last-published-rev>

A report is written to tools/_stale_report.txt in readable form, because the
console may not be able to print Chinese. Exit status is non-zero when any key
looks stale, so it can gate a publish.
"""

from __future__ import annotations

import json
import pathlib
import re
import subprocess
import sys

SITE = pathlib.Path(__file__).resolve().parents[1]
REPO = SITE.parent
PREFIX = "10_Personal_Website/"
PAGES = ("index.html", "research.html", "cv.html", "cv-onepage.html", "404.html")
PACK_REL = "10_Personal_Website/assets/js/i18n.js"
SCRIPT = SITE / "assets" / "js" / "i18n.js"
OUT = SITE / "tools" / "_stale_report.txt"

TEXT_RE = re.compile(r'data-i18n="([^"]+)"[^>]*>(.*?)</', re.DOTALL)
HTML_RE = re.compile(r'data-i18n-html="([^"]+)"[^>]*>(.*?)</', re.DOTALL)
META_RE = re.compile(r'content="([^"]*)"\s+data-i18n-meta="([^"]+)"')
PACK_BODY_RE = re.compile(r"window\.SITE_I18N\s*=\s*(\{.*\})\s*;\s*$", re.DOTALL)


def from_git(path: str, rev: str) -> str:
    """File contents at a revision, or an empty string if it did not exist."""
    result = subprocess.run(
        ["git", "show", f"{rev}:{path}"],
        cwd=REPO, capture_output=True, text=True, encoding="utf-8",
    )
    return result.stdout if result.returncode == 0 else ""


def english_from(read) -> dict[str, str]:
    """The English the pages carry, as a key -> text map."""
    found: dict[str, str] = {}
    for page in PAGES:
        blob = read(PREFIX + page)
        if not blob:
            continue
        for key, value in TEXT_RE.findall(blob):
            found[key] = re.sub(r"\s+", " ", value).strip()
        for key, value in HTML_RE.findall(blob):
            found.setdefault(key, re.sub(r"\s+", " ", value).strip())
        for value, key in META_RE.findall(blob):
            found[key] = value.strip()
    return found


def pack_from(blob: str) -> dict[str, str]:
    """Parse the zh strings out of an i18n.js body."""
    match = PACK_BODY_RE.search(blob)
    if match is None:
        return {}
    body = re.sub(r",(\s*[}\]])", r"\1", match.group(1))
    return dict(json.loads(body).get("zh", {}))


def main() -> int:
    if len(sys.argv) not in (2, 3):
        print("usage: _check_stale.py <old-rev> [new-rev]   (default: working tree)")
        return 2
    old_rev = sys.argv[1]
    new_rev = sys.argv[2] if len(sys.argv) == 3 else None

    if not from_git(PREFIX + PAGES[0], old_rev):
        print(f"revision not found, or it predates the site: {old_rev}")
        return 2

    def read_new(path: str) -> str:
        if new_rev is None:
            return (SITE / path[len(PREFIX):]).read_text(encoding="utf-8")
        return from_git(path, new_rev)

    before_en = english_from(lambda path: from_git(path, old_rev))
    after_en = english_from(read_new)
    before_zh = pack_from(from_git(PACK_REL, old_rev))
    after_zh = pack_from(
        read_new(PACK_REL) if new_rev else SCRIPT.read_text(encoding="utf-8")
    )

    changed_en = sorted(k for k in set(before_en) & set(after_en)
                        if before_en[k] != after_en[k])
    stale = [k for k in changed_en if before_zh.get(k) == after_zh.get(k)]
    reviewed = [k for k in changed_en if k not in stale]
    added = sorted(set(after_en) - set(before_en))
    removed = sorted(set(before_en) - set(after_en))

    lines = [
        f"comparing {old_rev} -> {new_rev or 'working tree'}",
        "",
        f"English changed for {len(changed_en)} keys",
        f"  {len(reviewed)} have a matching Chinese change (reviewed)",
        f"  {len(stale)} look stale: English moved, Chinese did not",
        f"keys added: {len(added)}   removed: {len(removed)}",
    ]
    if added:
        lines.append("")
        lines.append("added keys, which need new Chinese strings:")
        lines.extend(f"  {key}" for key in added)

    if stale:
        lines.append("")
        lines.append("=" * 70)
        lines.append("STALE: the Chinese still describes the previous English")
        for key in stale:
            lines.append("")
            lines.append(f"--- {key}")
            lines.append(f"    old en : {before_en[key]}")
            lines.append(f"    new en : {after_en[key]}")
            lines.append(f"    zh now : {after_zh.get(key, '(missing)')}")

    if reviewed:
        lines.append("")
        lines.append("=" * 70)
        lines.append("reviewed: English and Chinese both changed")
        for key in reviewed:
            lines.append(f"  {key}")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT.relative_to(REPO)}")
    print(f"English changed: {len(changed_en)}  reviewed: {len(reviewed)}  stale: {len(stale)}")
    print("RESULT:", "ALL GOOD" if not stale else f"{len(stale)} string(s) need updating")
    return 0 if not stale else 1


if __name__ == "__main__":
    sys.exit(main())
