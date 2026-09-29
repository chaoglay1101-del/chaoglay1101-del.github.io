"""Build the downloadable CV PDFs from the HTML pages with a headless browser.

The CV pages are HTML because the site has no build step, but recruiters and
admissions systems want a file, and "open the page and press print" loses
people. Chrome and Edge can each write a PDF straight from a ``file://`` URL, so
the PDFs are regenerated from the pages they came from instead of becoming a
second copy that drifts.

The Chinese versions are rendered with ``?lang=zh``. ``main.js`` honours that
parameter, and a headless run uses a throw-away profile, so there is no stored
preference to fight with.

Filenames use the document convention of the wider project (name first,
underscores) rather than the site's asset convention, because the filename is
what an applicant tracking system reads and an admissions office sees.

Run from the project root:

    uv run python 10_Personal_Website/tools/_build_cv_pdfs.py

Output: 10_Personal_Website/assets/pdf/
"""

from __future__ import annotations

import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

SITE = pathlib.Path(__file__).resolve().parents[1]
OUT_DIR = SITE / "assets" / "pdf"

# (source page, query string, expected page count or None, output filename)
DOCUMENTS = (
    ("cv-onepage.html", "", 1, "Chao_YuChen_CV_EN.pdf"),
    ("cv-onepage.html", "?lang=zh", 1, "Chao_YuChen_CV_ZH.pdf"),
    ("cv.html", "", None, "Chao_YuChen_CV_Full_EN.pdf"),
    ("cv.html", "?lang=zh", None, "Chao_YuChen_CV_Full_ZH.pdf"),
)

BROWSER_SUFFIXES = (
    "Google/Chrome/Application/chrome.exe",
    "Microsoft/Edge/Application/msedge.exe",
)


def find_browser() -> pathlib.Path:
    """Locate Chrome or Edge; both print HTML to PDF the same way."""
    override = os.environ.get("CV_PDF_BROWSER")
    if override:
        return pathlib.Path(override)
    for variable in ("PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA"):
        base = os.environ.get(variable)
        if not base:
            continue
        for suffix in BROWSER_SUFFIXES:
            candidate = pathlib.Path(base) / suffix
            if candidate.exists():
                return candidate
    for name in ("chrome", "msedge"):
        found = shutil.which(name)
        if found:
            return pathlib.Path(found)
    raise SystemExit(
        "no Chrome or Edge found; set CV_PDF_BROWSER to the browser executable"
    )


def page_count(data: bytes) -> int:
    """Pages, counted from the page objects. A hint, not a contract.

    A browser that writes compressed object streams would defeat this, which is
    why the check below only warns rather than failing the build.
    """
    return len(re.findall(rb"/Type\s*/Page(?![s])", data))


def build(browser: pathlib.Path, page: str, query: str, target: pathlib.Path,
          profile: pathlib.Path) -> tuple[bool, int]:
    source = SITE / page
    if not source.exists():
        print(f"  {page}: MISSING")
        return False, 0
    url = source.as_uri() + query
    result = subprocess.run(
        [
            str(browser),
            "--headless=new",
            "--disable-gpu",
            "--no-first-run",
            f"--user-data-dir={profile}",
            # Deferred scripts must finish, or the Chinese pack never applies.
            "--virtual-time-budget=5000",
            "--no-pdf-header-footer",
            f"--print-to-pdf={target}",
            url,
        ],
        capture_output=True,
    )
    if not target.exists():
        print("  browser produced no file")
        print("  stderr:", result.stderr.decode("utf-8", "replace").strip()[:400])
        return False, 0
    data = target.read_bytes()
    if not data.startswith(b"%PDF"):
        print("  not a PDF:", data[:8])
        return False, 0
    return True, page_count(data)


def main() -> int:
    browser = find_browser()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("browser:", browser)
    print("writing:", OUT_DIR.relative_to(SITE.parent))
    problems = 0

    with tempfile.TemporaryDirectory(prefix="cv-pdf-") as temporary:
        profile = pathlib.Path(temporary) / "profile"
        for page, query, expected, name in DOCUMENTS:
            target = OUT_DIR / name
            print(f"\n{name}\n  from {page}{query or ' (English)'}")
            ok, pages = build(browser, page, query, target, profile)
            if not ok:
                problems += 1
                continue
            size = target.stat().st_size
            print(f"  ok: {size:,} bytes, {pages} page(s)")
            if expected is not None and pages and pages != expected:
                print(f"  WARNING: expected {expected} page(s) for a printable sheet")
                problems += 1

    print("\nfiles now on disk:")
    for name in sorted(path.name for path in OUT_DIR.glob("*.pdf")):
        print("  ", name)
    print("\nRESULT:", "ALL GOOD" if problems == 0 else f"{problems} problem(s)")
    return 0 if problems == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
