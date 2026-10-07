# Personal website

Static, dependency-free portfolio site for **Yu-Chen Chao**: three hand-written
pages with a shared stylesheet, a small progressive-enhancement script, and a
Traditional Chinese translation pack. There is no build step and no framework —
open the files and they work.

Bilingual by design: English lives in the HTML (the source language), Chinese
lives in `assets/js/i18n.js`, and the 中文/EN button in the header switches
between them. The choice is remembered in `localStorage`, and the theme button
follows the operating-system preference until the visitor chooses otherwise.

## Who the site is for

The site serves two audiences at once, and the page order is arranged for both:

| Audience | What they need first | Where they find it |
| --- | --- | --- |
| Recruiters | The credential, then a CV file, within the first screen | The hero credentials strip, the `Download CV (PDF)` button, `cv.html`, `cv-onepage.html`, and the files in `assets/pdf/` |
| Admissions committees | The written work and the direction of future research | `research.html`, especially the Research agenda section, plus the public research report in the code repository |
| Either | What the author is looking for | The "What I am looking for" section on the home page (`#targets`) |

Two consequences are deliberate, and both should stay in mind when editing:

- the p-value results table lives on `research.html` only, rather than being
  repeated on the home page, because a recruiter reads it as noise;
- `cv.html` comes before `research.html` in every navigation menu.

## Content conventions

Three rules decide how the copy is written. They were chosen by comparing this
site with established personal sites in the same position — a graduate site that
reads well states capability as value, sources every number, and states limits as
plainly as results.

1. **Capability is written as value, not as a tool list.** The "What I bring"
   section on the home page (`#contribute`) exists for this reason. The `#skills`
   section below it is still a tool inventory, and that is fine for keyword
   matching, but a reader should not have to infer what the author can do from a
   list of libraries.
2. **Every number is traceable.** The credentials strip carries a note saying
   where its figures come from, and the class-relative figures behind the two
   marks are shown next to the project each belongs to rather than asserted in
   the hero. If a number cannot be traced to a file or a documented result, it
   does not go on the site.
3. **Limits get the same space as results.** Both projects say in writing what
   the evidence cannot support. This is a differentiator, not a weakness to
   soften, and it is the reason the research agenda section reads as a plan
   rather than a set of findings.

What deliberately does **not** appear: service-selling framing ("how I can help
you"), scale metrics the author does not have, awards and social feeds that would
be empty, and any test score that has not been obtained. Comparisons with other
sites are useful for structure, not for claims.


## Layout

```text
index.html                     Home: what I am looking for, about, what I bring, research summary, experience, education, skills, work, contact
research.html                  Research: question, data, method, results, limitations, research agenda, reproducibility, sources
cv.html                        CV: the complete record, profile through to notes
cv-onepage.html                One-page CV for applications, built to print on a single A4 sheet
assets/css/styles.css          Main stylesheet: light and dark themes, print styles
assets/css/cv-print.css        Document layout and print geometry for cv-onepage.html
assets/js/main.js              Theme toggle, language toggle, mobile navigation, print button, ?lang= deep link, current year
assets/js/i18n.js              Chinese strings (see "Editing copy" below)
assets/img/                    Favicon, the research-design diagram, social share card, and the CV portrait
assets/pdf/                    Generated CVs for download; the pages link to these (see "Downloadable PDFs")
tools/                         Maintenance, validation, and PDF build scripts (published, but kept out of search results)
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
- `?lang=zh` switches a page to Chinese for that visit without touching
  `localStorage`. Any value starting with `zh` works (`zh`, `zh-Hant`,
  `zh-Hant-TW`); anything else gives English. This is how a Chinese page can be
  linked to, and how the Chinese PDFs are generated from a browser profile that
  has never opened the site.
- **Changing English means re-reading the Chinese.** `_check_i18n.py` proves that
  every key exists; it cannot prove the key still says the right thing. Run
  `_check_stale.py <last-published-rev>` before publishing: it reports the keys
  whose English moved while their Chinese stayed put, which is a mistake that has
  already reached the live site once.

## Validation

```powershell
uv run python 10_Personal_Website/tools/_verify_html.py   # UTF-8, tag balance, header controls
uv run python 10_Personal_Website/tools/_check_keys.py    # page keys vs the English source list
uv run python 10_Personal_Website/tools/_check_i18n.py    # Chinese coverage and hazards
uv run python 10_Personal_Website/tools/_list_i18n.py     # every key in document order
uv run python 10_Personal_Website/tools/_build_cv_pdfs.py # rebuild assets/pdf/ with headless Chrome
uv run python 10_Personal_Website/tools/_check_stale.py <rev>  # Chinese left behind by a copy rewrite
uv run python 10_Personal_Website/tools/_publish.py      # run every check above, then audit a publish
```

`_check_i18n.py`, `_preview_zh.py`, and `_check_stale.py` write reports into
`tools/` (ignored by git) and exit non-zero when something needs attention.

`_publish.py` is the one to reach for before publishing, and it is safe to run
at any time: it validates, refuses to work from a dirty folder, works out which
revision is live, runs the staleness check against it, splits, and then prints
exactly which files would become public. **It does not push unless you pass
`--push`.** The manual sequence in "Deploying to the user site" below is what it
does, in order.

## Personal details

Personal details are filled in, and anything that reads as a sentence rather
than a proper noun is wired into the translation workflow:

| Detail | Where |
| --- | --- |
| Location: New Taipei City, Taiwan | `cv.html` hero, key `cv.contact.location` |
| Email: `chaoglay1101@gmail.com` (real `mailto:` link) | `cv.html` hero and the `index.html` contact card |
| Degree: September 2024 – June 2026, Class II (Division I), overall weighted mark 61/100, GPA 3.25, degree to be conferred 12 November 2026 | `cv.html` (`cv.edu.meta`), `index.html` (`home.edu.dates`, `home.edu.record`) |
| Internship: Intern, tax advisory team, Evershine CPAs Firm (永輝啟佳聯合會計師事務所), July – September 2025, Philippines tax incentive applications and SOP flowcharts | `cv.html` (`cv.exp.*`), `index.html` (`home.exp.e3*`) |
| Public proof: `assets/pdf/Internship_Certificate_Redacted.pdf`, embedded in the home page and CV | Retains name, employer, role, and dates; removes sex, date of birth, passport and ID numbers, certificate number, company tax ID, director name, and address |

Every placeholder has been filled, so the `.todo` marker class and its CSS have
been removed. The firm's office location was not supplied, so both pages list the
firm name only rather than guessing a city. If any of these details should change,
edit the English text in the HTML and update the matching key in
`assets/js/i18n.js`.

### Assessed project marks

Project marks are kept separate from the module results printed on the
transcript. The 77/100 research-project module result is the official transcript
mark; the 80/100 research-project component is worth 65% of that module. The
Business Analytics module result is 70/100:

| Transcript module | Transcript result | Separate assessment detail |
| --- | --- | --- |
| Accounting and Finance Research Project | 77/100 · Pass | Research project component: 80/100 (65% of module); 13 points above the component class average (67); class maximum 84 |
| Business Analytics | 70/100 · Pass | 6.3 points above the class average (63.7); class maximum 76; Tableau story project |

Class averages and maxima are shown as supplied supplemental coursework data;
the transcript module totals remain the official recorded results.

### Business analytics project

The Tableau project is described with figures measured from the coursework files
rather than from memory. Each of these was read off the data and is safe to
quote:

| Figure | Where it comes from |
| --- | --- |
| 437 coded fields, 174 economies, 12 population groups across six survey waves (2011–2024) | `GlobalFindexDatabase2025.csv`, the World Bank Global Findex extract used for the project |
| 24 business-readable measures | `GlobalFindex_Fintech_Cleaned.xlsx`, the cleaned analysis file the Tableau story reads |
| 171 economies and four waves (2014, 2017, 2021, 2024) | the same file once the 2011 and 2022 waves are excluded for coverage; the report applies that exclusion as a Tableau filter |
| Five dashboards: Mobile Money Boom, Leapfrogging the Plastic Era, The Catch-Up, The Usage Paradox, Platform Transformation | the report's contents page and its dashboard sections |

Do not add a figure that cannot be traced to those files. The source document
also contains a student identifier, the tutor's name, and the assessment cover
sheet: those must never be published, and none of them appear on the site.

The findings quoted on the site are the ones the report states — mobile money
adoption leads in Sub-Saharan Africa, digital payment use runs ahead of
debit-card ownership, savings lag behind payment usage, and mobile money drives
women's financial participation further than traditional banking does. The
project's own critical assessments (no transaction-level data, no qualitative
evidence, and the chart types that would have worked better) are quoted as
limits, in the same spirit as the research project's limitations.

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
- **Send the PDF file, not the URL.** The files in `assets/pdf/` are what an
  application actually sends; see "Downloadable PDFs" below.
- **Portrait included.** `assets/img/profile.jpg` is a 4:5 crop (640×800) shown
  at 27 mm wide on the printed sheet and beside the name block. It is a local
  file, never a stock image or a placeholder.

### Downloadable PDFs

`assets/pdf/` holds the files an application sends. They are generated from the
HTML rather than maintained by hand, so they cannot drift away from the pages:

| File | Built from | Length |
| --- | --- | --- |
| `Chao_YuChen_CV_EN.pdf` | `cv-onepage.html` | one A4 page |
| `Chao_YuChen_CV_ZH.pdf` | `cv-onepage.html?lang=zh` | one A4 page |
| `Chao_YuChen_CV_Full_EN.pdf` | `cv.html` | the complete record |
| `Chao_YuChen_CV_Full_ZH.pdf` | `cv.html?lang=zh` | the complete record |

The full CVs run to four or five pages depending on the language, so no page
count is promised in the copy: only the one-page CV asserts a single sheet, and
the build is what checks it. Any page count written into a label will go stale
the next time a bullet is added.

Rebuilding rewrites the PDFs even when nothing changed, because the browser
stamps a creation date into the file. When the CV pages themselves have not
changed, discard the rebuilt files rather than committing a metadata-only diff.

Rebuild them after any copy change:

```powershell
uv run python 10_Personal_Website/tools/_build_cv_pdfs.py
```

Four details are load-bearing:

- **The filenames are documents, not web assets.** Name first, with underscores,
  following the convention used elsewhere in the project, because an applicant
  tracking system reads the filename it is handed.
- **The Chinese builds exist because `main.js` honours `?lang=zh`.** The headless
  run uses a throw-away browser profile, so there is no stored preference to
  fight with.
- **The links choose their file at runtime.** A link marked
  `data-cv-download="Chao_YuChen_CV"` has its `href` rewritten to the `_EN` or
  `_ZH` file by the active language. The `href` in the HTML points at the English
  file, which is what a browser without JavaScript fetches.
- **`*.pdf` is ignored at the repository root** for submission drafts, so the
  negation rules at the end of `.gitignore` are what keep the CVs in the
  published site. Without them `git subtree` would publish pages that link to
  files it left behind. The build also warns if a one-page CV no longer fits on
  one page, so keep that check.

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
duplicating the source, so this repository stays the single source of truth.

`tools/_publish.py` runs the whole sequence and stops at the first thing that
looks wrong. Without `--push` it only reports, which is the useful half: the
audit names every file that would become public before it becomes public.

```powershell
# one-off: point a remote at the published site repository
git remote add site https://github.com/chaoglay1101-del/chaoglay1101-del.github.io.git

# validate everything, split, and list what would go public. Nothing is pushed.
uv run python 10_Personal_Website/tools/_publish.py

# publish, then confirm the live pages answer
uv run python 10_Personal_Website/tools/_publish.py --push --verify-live
```

The equivalent by hand, which is what that script does in order:

```powershell
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
`.gitignore` can silently swallow a site file. It has now happened twice:
`robots.txt` was excluded by the blanket `*.txt` rule, and the CVs in
`assets/pdf/` would have been excluded by the blanket `*.pdf` rule. Both needed a
negation rule at the end of `.gitignore`, where a later rule wins.

`_publish.py` turns that habit into a gate: it fails when a file the pages link
to is absent from the split, and it fails when a file that should never be public
is present in it, since the whole folder is published including `tools/`. So the
third time this happens it stops the push instead of reaching the site.
`git ls-tree -r site-publish --name-only` is still worth reading, and the script
prints it as the list of files that would become public.

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
