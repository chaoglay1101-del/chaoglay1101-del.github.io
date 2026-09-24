# Personal website

Static, dependency-free portfolio site for **Yu-Chen Chao**: three hand-written
pages with a shared stylesheet, a small progressive-enhancement script, and a
Traditional Chinese translation pack. There is no build step and no framework —
open the files and they work.

Bilingual by design: English lives in the HTML (the source language), Chinese
lives in `assets/js/i18n.js`, and the 中文/EN button in the header switches
between them. The choice is remembered in `localStorage`, and the theme button
follows the operating-system preference until the visitor chooses otherwise.

## Layout

```text
index.html                Home: about, research summary, results table, skills, work, education, contact
research.html             Research: question, data, method, results, limitations, reproducibility, sources
cv.html                   CV: profile, education, research, skills, experience, projects, notes
assets/css/styles.css     Single stylesheet, light and dark themes, print styles for the CV
assets/js/main.js         Theme toggle, language toggle, mobile navigation, print button, current year
assets/js/i18n.js         Chinese strings (see "Editing copy" below)
assets/img/               Favicon and the research-design diagram
tools/                    Maintenance and validation scripts (not part of the published page)
```

## Local preview

```powershell
uv run python -m http.server 8000 --directory 10_Personal_Website
```

Then open <http://localhost:8000/>. Serving over HTTP is recommended so that
relative paths, `localStorage`, and the deferred scripts behave exactly as they
do in production.

## Editing copy

English text is the source of truth and stays in the HTML. Anything a visitor
reads is tagged with one of four attributes, which also decide how the
translation is applied:

| Attribute | Written by `main.js` with | Notes |
| --- | --- | --- |
| `data-i18n="key"` | `textContent` | Plain text. Never put entities or markup in the translation. |
| `data-i18n-html="key"` | `innerHTML` | For fragments containing `<code>` or other inline markup. |
| `data-i18n-meta="key"` | `content` attribute | Page title and social-preview tags. |
| `data-i18n-attr="attr:key"` | that attribute | For example `aria-label:nav.toggle` or `alt:research.method.figureAlt`. |

Workflow for a copy change:

```powershell
# 1. Edit the English text in the HTML, keeping (or adding) its data-i18n attribute.
# 2. Refresh the English key list that translators work from.
uv run python 10_Personal_Website/tools/_extract_en.py
# 3. Add or update the Chinese string in assets/js/i18n.js.
# 4. Check coverage, stale keys, and markup hazards.
uv run python 10_Personal_Website/tools/_check_i18n.py
# 5. Proof-read the Chinese pages without a browser.
uv run python 10_Personal_Website/tools/_preview_zh.py
```

Rules for `assets/js/i18n.js`:

- No HTML entities. Most keys are written with `textContent`, where `&lt;` would
  appear on the page literally, so values use real characters (`<`, `α`, `—`).
- `<code>` markup is allowed only in keys the pages render with `innerHTML`;
  `_check_i18n.py` enforces both rules by reading the pages.
- Keys are alphabetical, matching `tools/_en_keys.json`, so the two files diff
  cleanly line by line.
- The two `ui.theme*` keys are an exception to the alphabetical source list:
  `main.js` looks them up at runtime because the theme button has to describe the
  theme it switches to. `_check_i18n.py` finds them by scanning `main.js`, so
  coverage is still enforced. English for those two lives in the button's
  `data-label-dark` / `data-label-light` attributes, which double as the
  no-JavaScript fallback.

## Validation

```powershell
uv run python 10_Personal_Website/tools/_verify_html.py   # UTF-8, tag balance, header controls
uv run python 10_Personal_Website/tools/_check_keys.py    # page keys vs the English source list
uv run python 10_Personal_Website/tools/_check_i18n.py    # Chinese coverage and hazards
uv run python 10_Personal_Website/tools/_list_i18n.py     # every key in document order
```

`_check_i18n.py` and `_preview_zh.py` write reports into `tools/` (ignored by
git) and exit non-zero when something needs attention.

## Personal details

Personal details are filled in, and anything that reads as a sentence rather
than a proper noun is wired into the translation workflow:

| Detail | Where |
| --- | --- |
| Location: New Taipei City, Taiwan | `cv.html` hero, key `cv.contact.location` |
| Email: `chaoglay1101@gmail.com` (real `mailto:` link) | `cv.html` hero and the `index.html` contact card |
| Degree: September 2024 – July 2026, Upper Second-Class Honours (2:1), GPA 3.25, ceremony November 2026 | `cv.html` (`cv.edu.meta`), `index.html` (`home.edu.dates`, `home.edu.record`) |
| Internship: Tax Advisory Intern, Evershine CPAs Firm, Philippines tax incentive applications, SOP flowcharts | `cv.html` (`cv.exp.*`), `index.html` (`home.exp.e3*`) |

One placeholder is outstanding: the **internship dates**, still marked with the
`.todo` class in `cv.html` and `index.html`. Once the dates are known, replace
`dates to add`, then delete `class="todo"` and its `title` tooltip so the accent
styling disappears. If the dates should read in Chinese as well, move them into
a `data-i18n-*` attribute and follow the workflow above.

The firm's office location was not supplied, so both pages list the firm name
only rather than guessing a city.

## Publishing

The pages use canonical URLs on `https://chaoglay1101-del.github.io/`, so this
folder is published as the root of that site rather than from a sub-path.
`.nojekyll` is already present, which keeps GitHub Pages from running Jekyll.
