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
cv.html                   CV: the complete record, profile through to notes
cv-onepage.html           One-page CV for applications, built to print on a single A4 sheet
assets/css/styles.css     Main stylesheet: light and dark themes, print styles
assets/css/cv-print.css   Document layout and print geometry for cv-onepage.html
assets/js/main.js         Theme toggle, language toggle, mobile navigation, print button, current year
assets/js/i18n.js         Chinese strings (see "Editing copy" below)
assets/img/               Favicon, the research-design diagram, social share card, and the CV portrait
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
| Internship: Tax Advisory Intern, Evershine CPAs Firm, July – August 2025, Philippines tax incentive applications and SOP flowcharts | `cv.html` (`cv.exp.*`), `index.html` (`home.exp.e3*`) |

Every placeholder has been filled, so the `.todo` marker class and its CSS have
been removed. The firm's office location was not supplied, so both pages list the
firm name only rather than guessing a city. If any of these details should change,
edit the English text in the HTML and update the matching key in
`assets/js/i18n.js`.

### Assessed project marks

Both assessed projects carry a highlighted mark line (`.timeline-grade` in
`styles.css`), giving the score, the UK classification, the gap to the class
average, and the position within the class mark range:

| Project | Mark | Class average | Position in the class range |
| --- | --- | --- | --- |
| Research Project (Research Report) | 80/100 · First Class (1st) | 67, so +13 | top 8.6% of the 37.5–84 range |
| Business Analytics (Singapore) | 70/100 · First Class (1st) | 63.7, so +6.3 | top 15.4% of the 37–76 range |

Note what the position figure is and is not. It is the mark's place inside the
range between the reported minimum and maximum, so it assumes marks are spread
evenly across that range; it is not an observed cohort percentile rank. The copy
says "of the … range" rather than "of the cohort" for that reason. If an actual
percentile or rank is ever obtained, use that figure and reword the line.

## The one-page CV

`cv-onepage.html` is the version to send with an application. It is a separate
page rather than a second print stylesheet because the two documents make
opposite trade-offs: `cv.html` is the complete record, whereas this one has to
fit on one sheet.

The constraints are deliberate:

- **One A4 page.** The content is sized to leave roughly 40 mm of slack, so
  ordinary differences in printer margins or font metrics cannot push it onto a
  second page. Confirm with Ctrl+P, keeping the scale at 100% and the margins at
  their default.
- **Applicant-tracking-system friendly.** Single column, no tables, no icons and
  no artwork, because automated parsers read the text layer and some handle
  layout badly.
- **English by default.** Multinational employers normally expect an English CV,
  so the HTML source is English, and the 中文 button still translates the page.
- **Fixed light colours**, defined in `cv-print.css`, so a dark browser theme
  cannot produce a dark CV.
- **Share the PDF, not the URL.** Use "Save as PDF" on that page.
- **Portrait included.** `assets/img/profile.jpg` is a 4:5 crop (640×800) shown
  at 27 mm wide on the printed sheet and beside the name block. It is a local
  file, never a stock image or a placeholder.

### Copy it into Word instead

Some employers insist on `.docx`. For those, paste the one-page CV into Word and
rebuild it as a plain document:

| CV element | Word style |
| --- | --- |
| Section headings (PROFILE, EXPERIENCE, …) | Heading 1, 9–10 pt, small caps |
| Job title, degree name | Heading 2, bold |
| Body text and bullets | Normal, 10–11 pt |
| Page setup | A4, 1.5–2 cm margins, single column, no text boxes |

Keep every link as a real hyperlink, avoid tables and text boxes, and name the
file `Yu-Chen-Chao-CV-Tax.docx` so it is unambiguous in an application inbox.

### A note on photos in a CV

Photographs are expected in Taiwan, most of Asia, the Middle East and continental
Europe, but recruiters in the United Kingdom and the United States frequently
treat them as a red flag: many employers discard CVs with photos outright to
comply with anti-discrimination rules, and applicant tracking systems do not
expect them. The photo is easy to drop for those markets, either delete the
`<img class="cv-photo" …>` element in `cv-onepage.html` or print without it, and
the layout closes up on its own.

### The name

The name is identity rather than copy, so it is handled by three keys instead of
being sprinkled through the markup:

| Key | Used for | English | Chinese |
| --- | --- | --- | --- |
| `name.full` | the CV headings, i.e. the documents | Yu-Chen Chao (趙于楨) | 趙于楨 (Yu-Chen Chao) |
| `name.short` | header brand, home hero eyebrow, footer, copyright | Yu-Chen Chao | 趙于楨 |
| `name.monogram` | the square mark beside the brand | YC | 趙 |

Each language leads with its own script, and both CVs carry both names so an
applicant tracking system and a human can match the Chinese name to the
romanised one. `index.html` also exposes the Chinese name to search engines via
`alternateName` in its JSON-LD `Person` block.

## Linking

Internal links (between the pages of this site) open in the same tab. Every
external link carries `target="_blank"` and `rel="noopener noreferrer"`, so
GitHub, LinkedIn and Tableau open in a new tab, and `styles.css` appends a small
arrow marker so the change of context is not a surprise. `_verify_html.py`
enforces both attributes, so a newly added external link cannot quietly regress.
The arrow is suppressed in print.

## Publishing

The pages use canonical URLs on `https://chaoglay1101-del.github.io/`, so this
folder is published as the root of that site rather than from a sub-path.
`.nojekyll` is already present, which keeps GitHub Pages from running Jekyll.

### Deploying to the user site

**Live at <https://chaoglay1101-del.github.io/>.** GitHub Pages activates itself
for a repository named after the account, so no settings change is needed.

`https://chaoglay1101-del.github.io/` is the root of a separate repository named
`chaoglay1101-del.github.io`. `git subtree` publishes this folder there without
duplicating the source, so this repository stays the single source of truth:

```powershell
# one-off: point a remote at the published site repository
git remote add site https://github.com/chaoglay1101-del/chaoglay1101-del.github.io.git

# publish. The split is a separate step so the exact file list can be checked
# before it becomes public.
git subtree split --prefix=10_Personal_Website -b site-publish
git ls-tree -r site-publish --name-only
git push site site-publish:main

# afterwards, check the live result
#   https://chaoglay1101-del.github.io/
```

The folder has to land at the root of the user site, which is why the canonical
and `og:url` values point at `https://chaoglay1101-del.github.io/` rather than a
sub-path. Every tracked file in this folder is published, including `tools/`,
`README.md` and the portrait, so nothing private belongs here.

One trap worth remembering: **`git subtree` only publishes tracked files**, and
`.gitignore` can silently swallow a site file. That is exactly what happened to
`robots.txt`, which the blanket `*.txt` rule excluded until a negation rule was
added. `git ls-tree -r site-publish --name-only` before the push is the check
that catches it, and it also caught nothing else, so keep running it.

## Social sharing

Each page carries Open Graph and Twitter meta tags so link previews render a
card rather than a bare URL. `assets/img/og-image.png` is the 1200×630 share
card; `_verify_html.py` checks that the `og:image` URL still resolves to a file
on disk, because a broken preview fails silently everywhere.

Note that social scrapers (LinkedIn, Slack, X) do **not** run JavaScript, so a
shared link always shows the English title, description, and image even though
the page itself switches to Chinese in the browser. That is why the share card
and its `og:image:alt` text stay in English.

### Search engines

Three files support discovery, and all three are verified live:

| File | Purpose |
| --- | --- |
| `robots.txt` | Allows crawling, points to the sitemap, and keeps `/tools/` and the README out of search results. |
| `sitemap.xml` | Lists the four content pages with a `lastmod` date. |
| `404.html` | A branded not-found page with links back to the content. Uses absolute asset paths because a 404 is served for URLs at any depth. |

The site is indexable by default: there is no `noindex` on the content pages (the
404 page sets it deliberately), and the canonical URLs already point at the live
origin.

Two things are outside this repository and speed indexing up:

1. **Google Search Console** — verify ownership of
   `https://chaoglay1101-del.github.io/` and submit `sitemap.xml`. Without a
   submission, a brand-new site waits for Google to find it, which can take weeks.
2. **Inbound links** — a link from a LinkedIn profile or post is the strongest
   discovery signal available here.

Request re-crawling in Search Console after changing titles or descriptions, and
use the LinkedIn [Post Inspector](https://www.linkedin.com/post-inspector/) after
changing anything that affects the preview card.
