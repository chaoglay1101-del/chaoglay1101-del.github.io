"""Gate and run the publish of 10_Personal_Website to the user site repository.

The README documents the publish sequence in prose, and prose is where it has
gone wrong twice: a blanket ``*.txt`` rule swallowed ``robots.txt``, and a
blanket ``*.pdf`` rule would have swallowed the downloadable CVs. Both were
caught by eye, after the fact, by running ``git ls-tree`` and reading the list.
The other failure this guards is quieter: English copy changed, the Chinese pack
did not follow, and the live Chinese page described the previous English for a
fortnight.

So the sequence is mechanical, and this script makes it mechanical: validate,
refuse to publish from a dirty tree, run the staleness check against the revision
that is actually live, split, audit exactly which files would become public
against the files already public, and only then push.

Nothing here is destructive. By default the push is *not* made: the script stops
after the audit and prints the command, because the audit is the step the README
asks to be read before publishing. Pass ``--push`` to actually publish.

Run from the project root:

    uv run python 10_Personal_Website/tools/_publish.py            # audit only
    uv run python 10_Personal_Website/tools/_publish.py --push     # audit, then publish
    uv run python 10_Personal_Website/tools/_publish.py --push --verify-live

Exit status is non-zero when a gate fails, so an automated caller can stop.
"""

from __future__ import annotations

import os
import pathlib
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

# A publish is often run by an automated caller, where a credential prompt is
# not a question anyone can answer: git would sit on it until the process was
# killed. Failing fast turns a silent hang into a message.
GIT_ENV = {**os.environ, "GIT_TERMINAL_PROMPT": "0", "GCM_INTERACTIVE": "never"}

SITE = pathlib.Path(__file__).resolve().parents[1]
REPO = SITE.parent
DIR = "10_Personal_Website"
PREFIX = DIR + "/"
OUT = SITE / "tools" / "_publish_report.txt"

REMOTE = "site"
REMOTE_BRANCH = "main"
SPLIT_BRANCH = "site-publish"
ORIGIN = "https://chaoglay1101-del.github.io/"

# Files the pages link to. git subtree publishes only tracked files, so an
# ignored file is absent from the split while every local check still passes:
# the links 404 on the live site and nothing reports it.
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
    "assets/img/og-image.png",
    "assets/pdf/Chao_YuChen_CV_EN.pdf",
    "assets/pdf/Chao_YuChen_CV_Full_EN.pdf",
    "assets/pdf/Chao_YuChen_CV_Full_ZH.pdf",
    "assets/pdf/Chao_YuChen_CV_ZH.pdf",
)

# Everything in this folder is published, including tools/ and README.md, so
# anything private that drifts in becomes public. These are the shapes of file
# that must never appear in the split.
FORBIDDEN = (
    (re.compile(r"__pycache__/"), "bytecode cache"),
    (re.compile(r"\.venv/"), "virtual environment"),
    (re.compile(r"\.pyc$"), "bytecode"),
    (re.compile(r"^tools/_.*\.txt$"), "generated report"),
    (re.compile(r"\.(csv|xlsx|xls|dta|sav|pkl|parquet|zip)$"), "private data"),
    (re.compile(r"\.(docx|pptx)$"), "submission document"),
    (re.compile(r"^PRIVATE_MATERIALS_INDEX"), "private materials index"),
)

# The two blanket rules the README warns about, expressed as exceptions: a
# ``.txt`` is only allowed as robots.txt, and a ``.pdf`` only under assets/pdf/.
TXT_ALLOWED = ("robots.txt",)
PDF_ALLOWED = re.compile(r"^assets/pdf/[^/]+\.pdf$")

LIVE_PATHS = (
    "/",
    "/cv.html",
    "/cv-onepage.html",
    "/research.html",
    "/robots.txt",
    "/sitemap.xml",
    "/assets/pdf/Chao_YuChen_CV_EN.pdf",
)


class Gate(Exception):
    """A check that has to pass before anything is published."""


def run(args, timeout: int | None = None):
    """Run a command in the repository root and capture its output.

    ``timeout`` is not decoration: the remote is HTTPS, so a fetch that cannot
    authenticate waits for input that will never arrive.
    """
    try:
        return subprocess.run(
            args, cwd=REPO, capture_output=True, text=True, encoding="utf-8",
            env=GIT_ENV, timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return subprocess.CompletedProcess(
            args, 1, "", f"timed out after {timeout}s"
        )


def git(*args, timeout: int | None = None) -> str:
    """Run git and return stdout, raising when it fails."""
    result = run(["git", *args], timeout)
    if result.returncode != 0:
        raise Gate(f"git {' '.join(args)} failed:\n{result.stdout}{result.stderr}")
    return result.stdout.strip()


def git_soft(*args) -> str:
    """Run git and return stdout, or an empty string when it fails."""
    result = run(["git", *args])
    return result.stdout.strip() if result.returncode == 0 else ""


def check_remote() -> str:
    """The publish remote must exist, or the push is a surprise later."""
    url = git_soft("remote", "get-url", REMOTE)
    if not url:
        raise Gate(
            f"remote '{REMOTE}' is not configured. One-off setup:\n"
            f"  git remote add {REMOTE} {ORIGIN}chaoglay1101-del.github.io.git"
        )
    return url


def check_clean(allow_dirty: bool) -> list[str]:
    """A publish from a dirty tree ships something nobody reviewed."""
    status = git_soft("status", "--porcelain", "--", DIR)
    rows = [line for line in status.splitlines() if line.strip()]
    if rows and not allow_dirty:
        listing = "\n".join(f"  {row}" for row in rows)
        raise Gate(
            "the site folder has uncommitted changes, and git subtree publishes "
            f"tracked files only — a new file is invisible here:\n{listing}\n"
            "  Commit them first, or pass --allow-dirty to publish anyway."
        )
    return rows


def check_sync() -> str:
    """Publishing from a branch behind origin is usually a mistake, not fatal."""
    local = git_soft("rev-parse", "main")
    remote = git_soft("rev-parse", "origin/main")
    if local and remote and local != remote:
        return f"main ({local[:9]}) differs from origin/main ({remote[:9]})"
    return ""


def run_validators(scripts) -> list[str]:
    """The existing checks, run the way the README documents them.

    An entry may carry arguments as a tuple, e.g.
    ``("_check_stale.py", last_published_rev)`` — that check compares against a
    revision rather than testing the tree on its own.
    """
    lines = []
    for script in scripts:
        name, extra = (script, ()) if isinstance(script, str) else (script[0], tuple(script[1:]))
        result = run(["uv", "run", "python", str(SITE / "tools" / name), *extra], timeout=600)
        output = (result.stdout + result.stderr).strip().splitlines()
        summary = output[-2] if len(output) > 1 and output[-1] == "" else (
            output[-1] if output else "(no output)"
        )
        lines.append(f"{name}: {summary}")
        if result.returncode != 0:
            raise Gate(
                f"{name} reported a problem, so the publish stops here:\n"
                + "\n".join(output)
            )
    return lines


def published_tree() -> str:
    """The tree hash of the site that is live now, or '' if never published.

    The fetch is best effort and short. An unreachable or credential-gated
    remote must not stall a publish, and the local remote-tracking ref is
    already enough to compare against when the fetch does not complete.
    """
    run(["git", "fetch", REMOTE, "--quiet"], timeout=30)
    return git_soft("rev-parse", f"{REMOTE}/{REMOTE_BRANCH}^{{tree}}")


def last_published_rev(tree: str) -> str:
    """The source revision whose folder is the one now live.

    ``git subtree split`` copies the subdirectory verbatim, so the split
    commit's tree hash *is* the subtree hash of the revision it came from.
    Matching the live tree against the history of the folder therefore names
    the published revision, instead of asking anyone to remember it.
    """
    if not tree:
        return ""
    for rev in git("log", "--format=%H", "--", DIR).splitlines():
        if git_soft("rev-parse", f"{rev}:{DIR}") == tree:
            return rev
    return ""


def split() -> None:
    """Rebuild the publish branch from the working tree.

    Deliberately not ``--rejoin``: that leaves a merge commit in the source
    history, and the README keeps the split as a separate step so the file list
    can be read before anything is public. Rebuilding is slower and honest.
    """
    git_soft("branch", "-D", SPLIT_BRANCH)
    git("subtree", "split", f"--prefix={DIR}", "-b", SPLIT_BRANCH, timeout=900)


def audit(published: set[str]) -> dict[str, list[str]]:
    """Read the split before it becomes public, which is the whole point.

    The split is a separate step from the push exactly so this list can be read
    first: every tracked file in the folder is published, including tools/ and
    README.md, so the audit is what stands between a stray file and the open web.
    """
    files = git("ls-tree", "-r", "--name-only", SPLIT_BRANCH).splitlines()
    present = set(files)
    findings: dict[str, list[str]] = {
        "files": sorted(present),
        "missing": [path for path in REQUIRED if path not in present],
        "forbidden": [],
        "will_publish": sorted(present - published),
        "will_remove": sorted(published - present),
    }
    for path in sorted(present):
        reasons = [why for pattern, why in FORBIDDEN if pattern.search(path)]
        if not reasons:
            # The blanket *.txt and *.pdf rules in .gitignore are meant for
            # private material, so anything of that shape in the split is an
            # exception that was asked for, and it has to be on the allowed list.
            if path.endswith(".txt") and path not in TXT_ALLOWED:
                reasons.append(f"a *.txt that is not {TXT_ALLOWED[0]}")
            elif path.endswith(".pdf") and not PDF_ALLOWED.match(path):
                reasons.append("a *.pdf outside assets/pdf/")
        findings["forbidden"].extend(f"{path}  ({why})" for why in reasons)
    return findings


def push() -> str:
    """Publish the split branch to the user site repository."""
    return git("push", REMOTE, f"{SPLIT_BRANCH}:{REMOTE_BRANCH}")


def fetch_status(url: str) -> int:
    """HTTP status for a URL, or 0 when the request itself failed."""
    request = urllib.request.Request(url, headers={"User-Agent": "publish-check"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            response.read(1)
            return response.status
    except urllib.error.HTTPError as error:
        return error.code
    except Exception:
        return 0


def verify_live(rounds: int = 6) -> list[str]:
    """Poll the live pages: Pages rebuilds after the push, so one check is a race."""
    lines = []
    for round_number in range(1, rounds + 1):
        results = {path: fetch_status(ORIGIN.rstrip("/") + path) for path in LIVE_PATHS}
        if all(status == 200 for status in results.values()):
            lines.append(f"all {len(results)} paths returned 200")
            return lines
        if round_number < rounds:
            time.sleep(20)
        else:
            lines.append(f"after {rounds} rounds the live site does not match:")
            lines.extend(
                f"  {status or 'no response'}  {path}"
                for path, status in sorted(results.items())
                if status != 200
            )
    return lines


def main() -> int:
    arguments = sys.argv[1:]
    push_now = "--push" in arguments
    verify = "--verify-live" in arguments
    allow_dirty = "--allow-dirty" in arguments
    skip_checks = "--skip-checks" in arguments
    since = ""
    if "--since" in arguments:
        index = arguments.index("--since")
        if index + 1 < len(arguments):
            since = arguments[index + 1]

    log: list[str] = []

    def note(text: str) -> None:
        """Print to the console and keep the line for the report."""
        print(text)
        log.append(text)

    try:
        note(f"remote     {check_remote()}")

        dirty = check_clean(allow_dirty)
        if dirty:
            note(f"warning    {len(dirty)} uncommitted path(s) in {DIR}")

        unsynced = check_sync()
        if unsynced:
            note(f"warning    {unsynced}")

        if not skip_checks:
            for line in run_validators(
                ("_verify_html.py", "_check_keys.py", "_check_i18n.py")
            ):
                note(f"check      {line}")

        live_tree = published_tree()
        live_rev = last_published_rev(live_tree)
        if live_rev:
            note(f"published  {live_rev[:9]}  (found by matching tree hashes)")
        else:
            note("published  unknown, so the staleness check has no base revision")

        if not skip_checks and (since or live_rev):
            for line in run_validators((("_check_stale.py", since or live_rev),)):
                note(f"stale      {line}")
        elif not skip_checks:
            note("stale      skipped; pass --since <rev> to check it anyway")

        note(f"split      rebuilding {SPLIT_BRANCH} from {PREFIX}")
        split()

        already = set(
            git_soft("ls-tree", "-r", "--name-only", f"{REMOTE}/{REMOTE_BRANCH}").splitlines()
        )
        findings = audit(already)
        note(f"audit      {len(findings['files'])} file(s) would be published")

        if findings["missing"]:
            raise Gate(
                "required files are absent from the split. git subtree publishes "
                "tracked files only, so a .gitignore rule is probably swallowing "
                "them (this has happened to robots.txt and to the CVs):\n"
                + "\n".join(f"  {path}" for path in findings["missing"])
            )
        if findings["forbidden"]:
            raise Gate(
                "files that must never be public are in the split. The whole "
                "folder is published, including tools/:\n"
                + "\n".join(f"  {path}" for path in findings["forbidden"])
            )

        for path in findings["will_publish"]:
            note(f"new        + {path}")
        for path in findings["will_remove"]:
            note(f"removed    - {path}")
        if not findings["will_publish"] and not findings["will_remove"]:
            note("changed    the published file set is unchanged")

        if not push_now:
            note("")
            note("nothing was pushed: the audit above is the check the README asks")
            note("to be read before publishing. To publish:")
            note(f"  uv run python {PREFIX}tools/_publish.py --push")
            note("or by hand:")
            note(f"  git push {REMOTE} {SPLIT_BRANCH}:{REMOTE_BRANCH}")
            OUT.write_text("\n".join(log) + "\n", encoding="utf-8")
            print(f"wrote {OUT.relative_to(REPO)}")
            print("RESULT: AUDIT ONLY, nothing published")
            return 0

        note(f"push       {push()}")
        note(f"live       {ORIGIN}")

        if verify:
            for line in verify_live():
                note(f"verify     {line}")

        OUT.write_text("\n".join(log) + "\n", encoding="utf-8")
        print(f"wrote {OUT.relative_to(REPO)}")
        print("RESULT: PUBLISHED")
        return 0

    except Gate as gate:
        print("\nPUBLISH STOPPED")
        print(gate)
        log.extend(("", "PUBLISH STOPPED", str(gate)))
        OUT.write_text("\n".join(log) + "\n", encoding="utf-8")
        print(f"wrote {OUT.relative_to(REPO)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
