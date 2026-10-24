"""Check that every tracked file is meant to be public.

This repository is the published site: GitHub Pages serves ``main`` exactly as
it is, tools/ and README.md included. So the question the old subtree publish
asked before every push (would anything private, generated or missing go
live?) is asked here of the files git tracks.

Two failures this guards against have happened before. A blanket ``*.txt``
ignore rule once hid ``robots.txt``, and a blanket ``*.pdf`` rule would have hid
the downloadable CVs: those are the REQUIRED list. Working notes once sat inside
the site folder next to the pages: those are the FORBIDDEN shapes.

    python tools/_check_public.py

Exit status is non-zero when a required file is missing or a forbidden one is
tracked, so the GitHub Actions check fails on it.
"""

from __future__ import annotations

import pathlib
import re
import subprocess
import sys

SITE = pathlib.Path(__file__).resolve().parents[1]

# Files the pages link to or GitHub Pages needs.
REQUIRED = (
    ".nojekyll",
    "index.html",
    "cv.html",
    "cv-onepage.html",
    "research.html",
    "404.html",
    "robots.txt",
    "sitemap.xml",
    "assets/css/styles.css",
    "assets/css/cv-print.css",
    "assets/js/main.js",
    "assets/js/i18n.js",
    "assets/js/story.js",
    "assets/js/flow.js",
    "assets/img/og-image.png",
    "assets/pdf/Chao_YuChen_CV_EN.pdf",
    "assets/pdf/Chao_YuChen_CV_Full_EN.pdf",
    "assets/pdf/Chao_YuChen_CV_Full_ZH.pdf",
    "assets/pdf/Chao_YuChen_CV_ZH.pdf",
    "assets/pdf/Internship_Certificate_Redacted.pdf",
)

# Shapes of file that must never be public.
FORBIDDEN = (
    (re.compile(r"__pycache__/"), "bytecode cache"),
    (re.compile(r"\.venv/"), "virtual environment"),
    (re.compile(r"\.pyc$"), "bytecode"),
    (re.compile(r"^tools/_.*\.txt$"), "generated report"),
    (re.compile(r"\.(csv|xlsx|xls|dta|sav|pkl|parquet|zip)$"), "private data"),
    (re.compile(r"\.(docx|pptx)$"), "submission document"),
    (re.compile(r"\.(patch|diff)$"), "working patch"),
    (re.compile(r"^PRIVATE_MATERIALS_INDEX"), "private materials index"),
)

# Exceptions to blanket rules: a .txt only as robots.txt, a .pdf only under
# assets/pdf/, Markdown only as the README and the agent rules that keep the
# spec in sync (notes and reports stay elsewhere).
TXT_ALLOWED = ("robots.txt",)
PDF_ALLOWED = re.compile(r"^assets/pdf/[^/]+\.pdf$")
MD_ALLOWED = ("README.md", "AGENTS.md", "CLAUDE.md", ".claude/skills/sync-spec/SKILL.md")


def tracked() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files"], cwd=SITE, capture_output=True, text=True, encoding="utf-8",
    )
    if result.returncode != 0:
        raise SystemExit("git ls-files failed: " + result.stderr.strip())
    return [line for line in result.stdout.splitlines() if line]


def main() -> int:
    files = tracked()
    present = set(files)
    missing = [path for path in REQUIRED if path not in present]
    forbidden = []
    for path in files:
        reasons = [why for pattern, why in FORBIDDEN if pattern.search(path)]
        if not reasons:
            if path.endswith(".txt") and path not in TXT_ALLOWED:
                reasons.append("a .txt that is not robots.txt")
            elif path.endswith(".pdf") and not PDF_ALLOWED.match(path):
                reasons.append("a .pdf outside assets/pdf/")
            elif path.endswith(".md") and path not in MD_ALLOWED:
                reasons.append("Markdown other than the README")
        forbidden.extend(f"{path}  ({why})" for why in reasons)

    print(f"tracked files: {len(files)}")
    for label, items in (("missing", missing), ("forbidden", forbidden)):
        print(f"{label}: {len(items)}")
        for item in items:
            print(f"  {item}")
    ok = not missing and not forbidden
    print("RESULT:", "ALL GOOD" if ok else "fix the files listed above before publishing")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
