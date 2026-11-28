# Personal website

Static, dependency-free portfolio site for **Yu-Chen Chao**: four hand-written
pages (home, projects, research and a one-page CV), a redirect, and a branded
not-found page, plus a shared stylesheet, two small progressive-enhancement
scripts, and a Traditional Chinese translation pack. There is no build step and no framework —
open the files and they work.

Bilingual by design: English lives in the HTML (the source language), Chinese
lives in `assets/js/i18n.js`, and the 中文/EN button in the header switches
between them. The choice is remembered in `localStorage`, and the theme button
follows the operating-system preference until the visitor chooses otherwise.

## Who the site is for

The site is written for employers hiring graduates into financial data analysis,
banking analytics and FinTech roles, and the page order is arranged for the two
people who read it there:

| Audience | What they need first | Where they find it |
| --- | --- | --- |
| Recruiters | The credential, then a CV file, within the first screen | The degree line in the hero, the `Download CV (PDF)` button, the "Start with" links to the research, the Tableau story and the internship, the home page (which is the CV), `cv-onepage.html`, and the files in `assets/pdf/` |
| Hiring managers | Evidence of analytical and technical work they can check | `research.html` (the graduate research only) with the public research report in the code repository, and `projects.html` |
| Either | What the author is looking for | The CV profile (`index.html#profile`) |

Graduate-study plans were taken off the site on 23 November 2026 (the owner's
decision, for now). The research agenda section that framed the research as
preparation for a master's degree is in the git history if it is wanted back.

Two consequences are deliberate, and both should stay in mind when editing:

- the p-value results table lives on `research.html` only, rather than being
  repeated on the home page or the projects page, because a recruiter reads it as noise;
- the home page (the CV) comes before `projects.html` and `research.html` in every navigation menu; the old `cv.html` is only a redirect to the home page.

## Content conventions

Three rules decide how the copy is written. They were chosen by comparing this
site with established personal sites in the same position — a graduate site that
reads well states capability as value, sources every number, and states limits as
plainly as results.

1. **Capability is written as value, not as a tool list.** The "What I bring"
   section on the home page (`#contribute`, directly under the hero) is a capability
   matrix: six capability rows against five experiences (graduate research, the Tableau
   project, the Evershine internship, TechStarterWeb, the AI collaboration workflow).
   A cell holds only a dot that links to the evidence (`#evidence-…` on the same page,
   `projects.html#tableau`, `#techstarterweb`, `#workflow`, or `research.html`), never
   rewritten content. Hovering or focusing a row lights its dots; below 48rem the table
   becomes a list, one block per row. The tool
   inventory lives in the CV's Technical skills section, which is fine for keyword
   matching, but a reader should not have to infer what the author can do from a
   list of libraries.
2. **Every number is traceable.** Marks sit where they can be checked: the
   GPA and the overall mark in the Education entry, and the two module marks
   with their class-relative figures next to the project each belongs to. Since
   23 November 2026 the hero carries no marks at all (a decision from a
   three-agent review with evidence: employers weigh skills and internships more
   than GPA, and a single module mark must never read as a First-class degree).
   No module mark is called "First-class". If a number cannot be traced to a file or a documented result, it
   does not go on the site.
3. **Limits get the same space as results.** Both projects say in writing what
   the evidence cannot support. This is a differentiator, not a weakness to
   soften, and it is why the limitations section is written as carefully as
   the results.
4. **Each fact has one home.** The CV holds the record (dates, marks, bullets,
   the internship, skills); `research.html` holds the evidence for the graduate research and
   `projects.html` the other projects; the home page says each project once, in a
   line, and links to where it is documented. Before adding a sentence to the home page, check whether another
   page already says it, and link instead. The October 2026 redesign made the home page the CV itself (the
   old `cv.html` now redirects to it) and moved the Tableau and TechStarterWeb
   write-ups from `research.html` to `projects.html`, so no page repeats another.

What deliberately does **not** appear: service-selling framing ("how I can help
you"), scale metrics the author does not have, awards and social feeds that would
be empty, and any test score that has not been obtained. Comparisons with other
sites are useful for structure, not for claims.


## Layout

```text
index.html                     Home and CV: hero (name, positioning line and degree line, then the Download CV and Read the research buttons with the full CV and print as small links, then a "Start with" line linking the research, the Tableau story and the internship, then the contact line; portrait beside), the "What I bring" capability matrix (each dot linked to its evidence), the complete record (profile with an overview timeline, education, professional experience with the internship first, projects, research, skills with an evidence index), the two-minute tour in five steps as a presentation version after the record, contact; the internship certificate opens on request
projects.html                  Projects: final-year research summary (#research-summary), the Tableau coursework project (#tableau), the personal ETF investment tool (#investment-tool), TechStarterWeb (#techstarterweb), layered-ai-dev-workflow (#workflow), and the GitHub toolbox (#github-toolbox)
research.html                  Research: the final-year research only (six steps, question, data, method, results, limitations, reproducibility, sources); data, method and reproducibility details open on request
cv.html                        Redirect to the home page (keeps old links, including hashes, working); not indexed
cv-onepage.html                One-page CV for applications, built to print on a single A4 sheet
404.html                       Branded not-found page; absolute asset paths (see "Search engines")
robots.txt                     Crawl rules and the sitemap pointer (see "Search engines")
sitemap.xml                    Sitemap of the content pages (see "Search engines")
.nojekyll                      Keeps GitHub Pages from running Jekyll (see "Publishing")
spec-sync.json                 Spec version checked by the "spec-sync" job (see "Version management")
AGENTS.md, CLAUDE.md           Rules for coding agents (see "Version management")
assets/css/styles.css          Main stylesheet: light and dark themes, motion tokens, the project-deck figures, print styles
assets/css/motion.css          Page transitions, scroll entrance and hover states (see "Motion"); not linked from cv-onepage.html
assets/css/cv-print.css        Document layout and print geometry for cv-onepage.html
assets/js/main.js              Theme toggle, language toggle, mobile navigation, print button, ?lang= deep link, current year; opens collapsed sections for links and printing
assets/js/story.js             Step-through stories (one or several decks per page), their charts, the cohort strips and the evidence index (see "Step-through stories")
assets/js/i18n.js              Chinese strings (see "Editing copy" below)
assets/img/                    Favicon, the research-design diagram, social share card, and the CV portrait
assets/pdf/                    Generated CVs for download; the pages link to these (see "Downloadable PDFs")
tools/                         Maintenance, validation, and PDF build scripts (published, but kept out of search results)
.github/workflows/             Site checks on pushes to main and pull requests, and the CV PDF build (see "Publishing")
.claude/hooks/                 Claude Code hook that refuses a `git push` to main (see "Version management")
```

## Where the site lives

This repository is the site and its only copy. GitHub Pages serves `main` as it
is, so there is nothing to build, sync or copy: a commit to `main` is live a
minute or two later. There is no longer a copy inside the research repository,
and nothing needs to be kept on a local machine.

Three ways to edit, from lightest to heaviest:

| Way | When it fits |
| --- | --- |
| The pencil icon on a file in the GitHub web page | A sentence, a date, a link |
| Press `.` on the repository page (github.dev) | Several files at once, for example the English in a page plus its Chinese in `i18n.js` |
| A local clone, previewed with `python -m http.server 8000` from the repository root and opened at <http://localhost:8000/> | Layout work, or running the scripts in `tools/` before pushing |

A clone is optional and disposable: delete it whenever you like, and clone again
when it is useful. Serving over HTTP rather than opening the files directly keeps
relative paths, `localStorage` and the deferred scripts behaving as they do in
production.

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
python tools/_extract_en.py
# 3. Add or update the Chinese string in assets/js/i18n.js.
# 4. Check coverage, stale keys, and markup hazards.
python tools/_check_i18n.py
# 5. Proof-read the Chinese pages without a browser.
python tools/_preview_zh.py
```

Editing in the browser only, steps 2 and 4 are done for you: the "Site checks"
workflow runs on the push and fails if `tools/_en_keys.json` needed refreshing
or a key has no Chinese. Its reports are attached to the run.

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
  `_check_stale.py <previous-rev>` before pushing (the "Site checks" workflow
  runs it against the previous commit on every push): it reports the keys whose
  English moved while their Chinese stayed put, which is a mistake that has
  already reached the live site once.

## Validation

```powershell
python tools/_extract_en.py    # refresh the English key list
git diff --exit-code tools/_en_keys.json
python tools/_verify_html.py   # UTF-8, tag balance, local files, external links, share cards
python tools/_check_keys.py    # page keys vs the English source list
python tools/_check_i18n.py    # Chinese coverage and hazards
python tools/_check_public.py  # every tracked file is meant to be public, and none is missing
node --test "tools/tests/*.test.js"
node tools/_check_spec_sync.mjs <base>
```

`node --test "tools/tests/*.test.js"` runs the version-management script tests.
`node tools/_check_spec_sync.mjs <base>` checks whether committed code changes
have a spec version bump or a documented exemption. Replace `<base>` with the
PR's target branch ref, such as `origin/main`. In CI, the script also reads the
PR description for an exemption. For push and manual runs, CI passes `HEAD^1`.

The Python validation scripts use only the standard library. Install Node.js
to run the tests and spec-sync check locally. The workflow uses Node.js 24.

The workflow runs `python tools/_check_stale.py <rev>` only on pushes to
`main`, using the pre-push commit when available and `HEAD~1` otherwise.
This checks for Chinese translations left behind by English edits.
`_check_i18n.py`, `_preview_zh.py` and `_check_stale.py` write reports into
`tools/`, where `.gitignore` keeps them out of the site.

For maintenance, run `python tools/_list_i18n.py` to list every key in document
order or `python tools/_build_cv_pdfs.py` to rebuild `assets/pdf/` with headless
Chrome or Edge.

## Personal details

Personal details are filled in, and anything that reads as a sentence rather
than a proper noun is wired into the translation workflow:

| Detail | Where |
| --- | --- |
| Location: New Taipei City, Taiwan | `index.html` hero, key `cv.contact.location` |
| Email: `chaoglay1101@gmail.com` (real `mailto:` link) | `index.html` hero and its contact section |
| Degree: September 2024 – June 2026, Class II (Division I), overall weighted mark 61/100, GPA 3.25, degree conferred 12 November 2026 | `index.html` (`cv.edu.meta`); the hero shows the classification, GPA, and conferral date without the weighted mark |
| Phone: printed only. It is on the PDFs and on a printed page, and is not shown on screen | `.cv-phone` in `assets/css/styles.css` prints it in the contact line of `index.html` and `cv-onepage.html`; the HTML holds only an empty `<span class="cv-phone">`, so the number is not in the markup |
| Internship: Intern, tax advisory team, Evershine CPAs Firm (永輝啟佳聯合會計師事務所), July – September 2025, Philippine BOI tax incentive applications (BOI Form 501 schedules, review of long-term financial projections, list of missing statements) and SOP flowcharts | `index.html` (`cv.exp.*`) |
| Public proof: `assets/pdf/Internship_Certificate_Redacted.pdf`, on the CV behind a "View the internship certificate" toggle | Retains name, employer, role, and dates; removes sex, date of birth, passport and ID numbers, certificate number, company tax ID, director name, and address |
| Technical lead and co-founder, TechStarterWeb Consulting · October 2026 – present. Its site went live on 23 October 2026, and the order back office is live. Client delivery has been tested internally only, with no paying clients yet. | `index.html` (`cv.exp.*`), `cv-onepage.html` (`op.exp2*`), and `projects.html` (`research.tsw.lede`) |

External links used in the page markup (copied verbatim from the `href`
values; the reference for any later link change or link check). Whether this
is still the set the owner wants to show is pending the owner's confirmation:

| Link | URL | Pages |
| --- | --- | --- |
| LinkedIn profile | `https://www.linkedin.com/in/yu-chen-chao/` | `index.html`, `projects.html`, `research.html`, `cv-onepage.html` |
| GitHub account | `https://github.com/chaoglay1101-del` | `index.html`, `projects.html`, `research.html`, `cv-onepage.html` |
| Repo: digital payment pressure and bank margins | `https://github.com/chaoglay1101-del/digital-payment-pressure-bank-margins` | `index.html`, `research.html` |
| Repo: mobile money adoption (Tableau) | `https://github.com/chaoglay1101-del/mobile-money-adoption-tableau` | `index.html`, `projects.html` |
| Repo: layered AI dev workflow | `https://github.com/chaoglay1101-del/layered-ai-dev-workflow` | `index.html`, `projects.html` |
| Tableau Public story | `https://public.tableau.com/views/BANALAssignment2/STORY` | `index.html`, `projects.html`, `research.html` |

Deep links into those repos (for example `docs/public-research-report.md` on
`research.html`, `docs/case-study.md` on `projects.html`) are not listed here.

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
| Accounting and Finance Research Project | 77/100 · Pass | Research project component: 80/100 (65% of module); 13 points above the component class average (67); class upper quartile 73; class maximum 84 |
| Business Analytics | 70/100 · Pass | 6.3 points above the class average (63.7); equal to the class upper quartile (70); class maximum 76; Tableau story project |

Class averages, upper quartiles, and maxima are shown as supplied supplemental
coursework data; the transcript module totals remain the official recorded
results.

### Detail on request

Long reference material sits in `<details class="more">` blocks: the data,
method and reproducibility detail on `research.html`, the Tableau embed, and the
internship certificate on the CV. The section heading and its one-line summary
stay visible, so a skimming reader still gets the point. `main.js` opens a
block when a link points inside it and opens every block before printing (and
closes them again afterwards); `story.js` opens one before jumping to a cited
table row. The open buttons themselves are hidden in print.

### Business analytics project

The Tableau project is presented as the second project on `projects.html`
(`#tableau`), with the interactive Tableau Public story loaded only when the
reader opens it, and linked from the home page.

The story has a fixed size in Tableau (1150 × 964 plus a 27-pixel toolbar, with
the workbook tabs hidden by `:tabs=no`), and a narrower frame crops it on both
sides. So the frame is drawn at exactly that size and scaled down to the width
available (`.tableau-fit` in `styles.css`, scaled by `main.js`); on a wide
screen the figure grows past the text column to show it at full size. If the
story is resized in Tableau, change `--tableau-w` and `--tableau-h` to match. It is described
with figures measured from the coursework files
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
opposite trade-offs: `index.html` is the complete record, whereas this one has to
fit on one sheet.

The constraints are deliberate:

- **One A4 page, and the English sheet is full.** Measured on the PDFs of
  11 November 2026, the English text ends about 2.5 mm above the bottom margin
  and the Chinese about 20 mm, so adding a line means removing one somewhere
  else. The build is what catches a second page (see "Downloadable PDFs"); to
  check by hand, press Ctrl+P and keep the scale at 100% and the margins at
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
- **No portrait for now.** The casual photo was taken down on 23 November 2026
  (the owner's decision after the HR review) until a formal head-and-shoulders
  photo replaces it. To bring a photo back, add `assets/img/profile.jpg` (a 4:5
  crop, 640×800) and restore the `<img class="cv-photo-page">` in the
  `index.html` hero and the `<img class="cv-photo">` in the `cv-onepage.html`
  header, each with `data-i18n-attr="alt:cv.photoAlt"` and the `cv.photoAlt`
  key back in `i18n.js`; the layout rules are still in place. English pages
  print without a photo either way.

### Downloadable PDFs

`assets/pdf/` holds the files an application sends. They are generated from the
HTML rather than maintained by hand, so they cannot drift away from the pages:

| File | Built from | Length |
| --- | --- | --- |
| `Chao_YuChen_CV_EN.pdf` | `cv-onepage.html` | one A4 page |
| `Chao_YuChen_CV_ZH.pdf` | `cv-onepage.html?lang=zh` | one A4 page |
| `Chao_YuChen_CV_Full_EN.pdf` | `index.html` | the complete record |
| `Chao_YuChen_CV_Full_ZH.pdf` | `index.html?lang=zh` | the complete record |

The full CVs run to several pages and the count differs by language, so no page
count is promised in the copy: only the one-page CV asserts a single sheet, and
the build is what checks it. Any page count written into a label will go stale
the next time a bullet is added.

Both documents state `size: A4` in their print styles (`cv-print.css` for the
one-page CV, the print block of `styles.css` for the full one). Without it the
browser uses the build machine's default paper, which is how the full CVs were
US Letter until November 2026.

Rebuilding rewrites the PDFs even when nothing changed, because the browser
stamps a creation date into the file. When the CV pages themselves have not
changed, discard the rebuilt files rather than committing a metadata-only diff.

Rebuild them after any change to the CV pages, in either of two ways:

- **In GitHub**, with no local machine: Actions > "Build CV PDFs" > Run
  workflow. It runs on Windows with the fonts the files were first made with
  (Arial, Segoe UI and Cascadia Mono from Windows, Noto Sans TC installed from
  the Google Fonts repository) and attaches the four PDFs to the run as a
  download. The run's summary page lists each file's page count and fonts; the
  current files use Arial and Noto Sans TC throughout, plus Segoe UI and
  Cascadia Mono in the full CVs, and the run fails before committing anything
  if the Chinese came out in a fallback font instead of Noto Sans TC. Tick
  **commit** to put them on the site in the same run; leave it unticked to look
  at them first.
- **Locally**, on a machine with Chrome or Edge: `python tools/_build_cv_pdfs.py`,
  then commit the four files.

Either way the build fails, and nothing is committed, if a one-page CV no longer
fits on one page.

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
- **A PDF is only public under `assets/pdf/`.** `_check_public.py` fails the
  checks when one of the five linked PDFs is missing from the repository, or when
  a PDF anywhere else is committed, which is how a submission draft would leak.
  Submission documents belong in the research repository or the application
  folders, never here.

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
expect them. Singapore's Tripartite guidelines also tell employers not to ask
for a photograph on application forms. Since 23 November 2026 the English
pages print without the photo (`html[lang="en"]` rules in `cv-print.css` and the
print styles), so both English PDFs have none. The casual photo itself was
taken down from every page the same day, so for now no page and no PDF has a
photo. Taiwanese employers do expect one on a Chinese CV, so a formal
head-and-shoulders photo for the Chinese pages is on the owner's list (see
"Portrait" above for how to put it back).

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

A step, or a point inside a step, can be linked to directly; see the deep links
in "Step-through stories" below.

## Step-through stories

`research.html` opens with the findings in six steps, and `index.html` ends its
record with the CV told in five steps (the sixth, a master's plan, was removed on
23 November 2026), both driven by `assets/js/story.js`. The techniques come from
Slidev slide decks: a step reveals its annotations one click at a time, a
hand-drawn mark on the chart follows each click, a presentation mode advances
one click per key press, and any step and click can be linked to.

| Feature | Where | What it does |
| --- | --- | --- |
| Six-step findings | `research.html#story` | Read by scrolling, or press **P** (the Present button) for one annotation per key press: → or Space forward, ← back, Home and End, **F** full screen, Esc to leave. Each step links to the table rows its numbers come from (tagged `data-cite-id`) and a bar brings the reader back. |
| Two-minute tour | `index.html#intro` | The same engine over the CV, with a timeline whose marks follow the steps and a presenter timer (**T**) whose per-step budget, in seconds, is `data-deck-timer` on the deck. |
| Project decks | `projects.html#techstarterweb`, `#tableau`, `#workflow` | One deck per project, four or five steps of one or two sentences each (problem, approach, how it works, result, limits). The figures are plain HTML written in the page, not drawn by `story.js`: a mark in the step's sentence lights the part of the figure it is about (`data-mark="n"` on the figure's items), and the lines between the parts are drawn as they light. A step with no figure of its own keeps the previous one on the stage, fully lit. The last step of the TechStarterWeb and layered-ai-dev-workflow decks links to the write-up in the layered-ai-dev-workflow repository, where the detail lives; the page keeps only the key sentence. Deep links are `#tsw-2.1`, `#tableau-3` and `#workflow-1`. |
| Overview timeline | `index.html`, Profile | The CV timeline with every item labelled and no step marks: an element with `data-timeline` is drawn by `story.js` from the same `TIMELINE` data, so the overview and the tour cannot disagree about dates. An item marked `overviewOnly` (TechStarterWeb) appears in the overview but not in the five-step tour, which stays as told. |
| Cohort strips | `index.html`, under the two assessed marks | The mark beside the class mean, upper quartile and maximum already stated in `cv.research.grade1` and `cv.research.grade2`. |
| Evidence index | `index.html`, above Skills | One button per capability marks the CV lines that show it (`data-ev="key"` on those lines); pressing again moves to the next line. |

A page can hold several decks (`[data-deck]`), as `projects.html` does. Each deck has its own steps, scenes and link prefix (`data-deck-prefix`), and a deck's own Present button plays only that deck. The presentation overlay and the keyboard are shared and only one deck plays at a time: **P** acts on the deck that is playing, or else on the one nearest the middle of the screen. Without JavaScript (or if `story.js` stops) a project deck is not hidden, because on that page the deck is the content: the steps read one after another with their figures beside them. On paper the figures are put back next to their steps and drawn finished.

Deep links follow Slidev's `?clicks=` idea: `research.html#step-4.2` opens step 4
with its first two marks drawn, `index.html#intro-3` opens step 3 of the tour, and
`index.html#evidence-panel` lights up one capability. In presentation mode the
address follows each click, as it does in Slidev; reading by scrolling leaves the
address alone, and the copy-link button writes the current position instead.

Five rules keep it consistent with the rest of the site:

- **Every number in a chart is already on the page.** The chart data at the top
  of `story.js` (`DATA`, `TIMELINE`, `COHORT`) restates the research tables and
  the CV's grade lines and adds nothing of its own. When a published figure
  changes, its entry in `story.js` changes in the same commit.
- **Text stays in the translation workflow.** Step copy uses ordinary
  `data-i18n-html` keys (`research.story.*`, `cv.tour.*`, `cv.evidence.*`), and a
  mark is `<mark class="mk" data-mark="n">`, where `n` is the click that draws it.
  `<mark>` rather than `<span>` keeps `_check_i18n.py`'s markup balance check
  meaningful. Chart labels live in hidden `<span data-s="…" data-i18n="…">`
  elements, so `main.js` translates them like any other key and `story.js`
  redraws when `main.js` announces a `site:languagechange` event.
- **Screen only.** Everything `story.js` adds is `.screen-only` or styled out of
  print, so `index.html` prints the same CV text as before and the PDFs in
  `assets/pdf/` do not need rebuilding for this feature. The exception is the
  project decks, which are the content of `projects.html` and print as plain
  steps with their figures.
- **Progressive enhancement.** Without JavaScript the sections are hidden
  (`html:not(.js)`) and the pages read as before. If `story.js` fails to load or
  stops with an error, `html.story-off` hides them in the same way rather than
  leaving dimmed text beside empty charts. The project decks are the exception:
  they stay, as one column of steps with their figures.
- **Motion is optional.** Under `prefers-reduced-motion` the marks and charts
  appear without being drawn.

## Publishing

**Live at <https://chaoglay1101-del.github.io/>.** This repository is named
after the account, so GitHub Pages serves it at the root of that address, and
Pages is set to deploy from the `main` branch. The canonical and `og:url` values
point at that root for the same reason. `.nojekyll` keeps Pages from running
Jekyll, so every file is served exactly as committed.

Publishing is therefore merging into `main`, through a pull request (see
"Version management"):

1. Edit on a branch (in the browser choose "Create a new branch for this commit
   and start a pull request"; in github.dev or a clone, push a branch) and open a
   pull request.
2. Wait for both "Site checks" jobs, `checks` and `spec-sync`, to pass before
   merging. The workflow runs when a pull request is opened, updated with
   commits, reopened, or edited. It also runs on pushes to `main` and can be
   started manually from the Actions tab. See [Validation](#validation) for
   the local commands.
3. Pages deploys on its own; the "pages build and deployment" run in the Actions
   tab shows when it is live, usually within two minutes.

Every tracked file is public, `tools/`, `.github/` and this README included, so
nothing private belongs here: no submission documents, no transcripts, no data
files, no working notes. `_check_public.py` enforces the shapes of that rule
(see "Validation"), and `robots.txt` keeps `tools/` and the README out of
search results.

Until October 2026 the site was kept in the research repository
(`digital-payment-pressure-bank-margins`, folder `10_Personal_Website`) and
copied here with `git subtree`. That copy has been retired: edit here only.

## Version management

The site moves together with a written spec, "Yu-Chen Chao 個人網站規格書", a
Google Doc in the owner's Drive. The README says how things work; the spec says
what the site is now and why, and keeps a version log. Four pieces keep the two
in step:

| Piece | What it does |
| --- | --- |
| `CLAUDE.md`, `AGENTS.md`, `.claude/skills/sync-spec/SKILL.md` | Tell any coding agent to update the affected spec sections in the same task, with a map from files to sections. After editing by hand, run `/sync-spec` in Claude Code. |
| `spec-sync.json` and the `spec-sync` job in "Site checks" | A pull request that changes pages or code must raise `spec_version` to the spec's new version, or leave the file alone and put a line starting 「規格書不受影響：」 with a reason in the pull request description or a commit message. The description of each change lives in the pull request, not in this file, because a line every pull request rewrites makes every open pull request conflict with the next merge. README, the agent rules, `tools/tests/`, the CV PDFs, `tools/_en_keys.json` and `.gitattributes` are exempt. `git log -p spec-sync.json` shows which spec version each commit matches. |
| `.github/workflows/spec-version-log.yml` | After each push to `main`, appends a row (time, commit, description with the spec version) to section 10 of the spec. Skipped, not failed, until the secret below exists. |
| `.claude/hooks/block-main-push.mjs`, `.github/workflows/direct-push-alert.yml` | Claude Code refuses a `git push` to `main`; any other direct push to `main` opens an issue listing the commits that skipped review. Commits made by the "Build CV PDFs" workflow are expected and do not raise one. |

Branch protection is not switched on, because "Build CV PDFs" commits to `main`
itself; turning it on means changing that workflow to open a pull request first.

To let the version log fill itself (once, by the owner): create a Google Cloud
service account with the Google Docs API enabled (the TechStarterWeb one can be
reused), share the spec with its `…@….iam.gserviceaccount.com` address as an
editor, and add its JSON key as the repository secret `GOOGLE_SERVICE_ACCOUNT`.
`node tools/_spec_version_log.mjs --dry-run` shows the row the next push would add.

## Flow texture

The site is about payment flows, so its texture is a current. It has two
parts, both on screen only:

| Part | Where | What it does |
| --- | --- | --- |
| Tide lines | Between sections and above the footer | One gentle wave, tiled, in place of a straight rule; alternate sections are offset by half a wave. |
| Frosted header | The sticky header | Translucent with a blur, so the page shows through it while scrolling. |

The current lines behind the heroes and footers (`flow.js`) were removed on 3 November 2026 at the owner's request: they made the hero look busy.

The rules it keeps:

- **Print is untouched.** The tide lines, glass header and spacing are inside
  `@media screen`, so `index.html` prints the same text and page count and the
  PDFs in `assets/pdf/` need no rebuild.

## Motion

Five small effects, all timed from the tokens at the top of `styles.css`
(`--t-fast` 160 ms, `--t-mid` 260 ms, `--t-slow` 480 ms, `--ease-out`), none of
which carries information the page does not already show:

| Effect | Where | How |
| --- | --- | --- |
| Page transitions | Home, projects, research, 404 | `@view-transition { navigation: auto }` in `motion.css`: the old and new page cross-fade, and the brand and the navigation (`view-transition-name: site-brand`, `site-nav`) hold still. Browsers without support navigate as before. |
| Scroll entrance | `.card`, `.timeline > li`, the project index cards, the project section headings, and anything marked `class="reveal"` | `animation-timeline: view()`, opacity and a 14 px rise only, inside `@supports`. The animation fills forwards only, so a block that has not reached the screen is in its normal place. Deck steps are not included: `story.js` runs those. |
| Drawn lines | The deck figures (enquiry steps, task-card life, the five layers, data preparation, dashboards in order, CI checks) | The line into a part is drawn when that part lights; plain CSS transitions on `.is-on`, which `story.js` toggles. Drawn from the start without JavaScript. |
| Micro-interactions | Project index cards, buttons, text links | `:hover` and `:focus-visible` together: cards lift 3 px and take the accent border and a soft shadow; links keep a faint line at rest and draw a solid one on hover. Nothing is only visible on hover. |
| Reduced motion and print | Everywhere | Under `prefers-reduced-motion: reduce` there are no transitions, no entrance and no dimming of figures: the finished state is shown. Print has no animation and no transition. |

`cv-onepage.html` does not link `motion.css` and gets none of this. A new page
that should move links `motion.css` after `styles.css`.

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
| `robots.txt` | Allows crawling by default, points to the sitemap, and disallows crawling `/tools/`, `/README.md`, `/AGENTS.md`, `/CLAUDE.md`, and `/spec-sync.json`. |
| `sitemap.xml` | Lists the four content pages (home, projects, research and the one-page CV; `cv.html` is a redirect and is left out) with a `lastmod` date. |
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
