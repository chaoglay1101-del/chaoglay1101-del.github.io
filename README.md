# Personal website

Static, dependency-free portfolio site for **Yu-Chen Chao**: three hand-written
pages with a shared stylesheet, two small progressive-enhancement scripts, and a
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
| Either | What the author is looking for | The CV profile (`cv.html#profile`), and the "Next: master's" end of the home-page timeline |

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
   section on the home page (`#contribute`) exists for this reason, and each of
   its four items links to the evidence: the CV lines that show it
   (`cv.html#evidence-…`), the Tableau project, or the runnable example. The tool
   inventory lives in the CV's Technical skills section, which is fine for keyword
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
4. **Each fact has one home.** The CV holds the record (dates, marks, bullets,
   the internship, skills); `research.html` holds the evidence for both projects;
   the home page says each thing once, in a line, and links to where it is
   documented. Before adding a sentence to the home page, check whether another
   page already says it, and link instead. The October 2026 redesign removed the
   home page's experience, education and skills sections for this reason: they
   repeated the CV nearly word for word.

What deliberately does **not** appear: service-selling framing ("how I can help
you"), scale metrics the author does not have, awards and social feeds that would
be empty, and any test score that has not been obtained. Comparisons with other
sites are useful for structure, not for claims.


## Layout

```text
index.html                     Home: hero, what I bring (each item linked to its evidence), selected work with an overview timeline, contact
research.html                  Research and projects: the final-year research (six steps, question, data, method, results, limitations, agenda, reproducibility, sources), then the Tableau coursework project (#tableau); data, method and reproducibility details open on request
cv.html                        CV: a two-minute tour, then the complete record, profile through to notes, with an evidence index above Skills; the internship certificate opens on request
cv-onepage.html                One-page CV for applications, built to print on a single A4 sheet
assets/css/styles.css          Main stylesheet: light and dark themes, print styles
assets/css/cv-print.css        Document layout and print geometry for cv-onepage.html
assets/js/main.js              Theme toggle, language toggle, mobile navigation, print button, ?lang= deep link, current year; opens collapsed sections for links and printing
assets/js/story.js             Step-through stories, their charts, the cohort strips and the evidence index (see "Step-through stories")
assets/js/i18n.js              Chinese strings (see "Editing copy" below)
assets/img/                    Favicon, the research-design diagram, social share card, and the CV portrait
assets/pdf/                    Generated CVs for download; the pages link to these (see "Downloadable PDFs")
tools/                         Maintenance, validation, and PDF build scripts (published, but kept out of search results)
.github/workflows/             Site checks on every push, and the CV PDF build (see "Publishing")
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
python tools/_verify_html.py   # UTF-8, tag balance, local files, external links, share cards
python tools/_check_keys.py    # page keys vs the English source list
python tools/_check_i18n.py    # Chinese coverage and hazards
python tools/_check_public.py  # every tracked file is meant to be public, and none is missing
python tools/_check_stale.py <rev>  # Chinese left behind by a copy rewrite
python tools/_list_i18n.py     # every key in document order
python tools/_build_cv_pdfs.py # rebuild assets/pdf/ with headless Chrome or Edge
```

Each check exits non-zero when something needs attention, which is what lets
the "Site checks" workflow (`.github/workflows/checks.yml`) run all of them on
every push to `main`. `_check_i18n.py`, `_preview_zh.py` and `_check_stale.py`
also write reports into `tools/`, which `.gitignore` keeps out of the site.

Plain `python` is enough: the scripts use the standard library only.

## Personal details

Personal details are filled in, and anything that reads as a sentence rather
than a proper noun is wired into the translation workflow:

| Detail | Where |
| --- | --- |
| Location: New Taipei City, Taiwan | `cv.html` hero, key `cv.contact.location` |
| Email: `chaoglay1101@gmail.com` (real `mailto:` link) | `cv.html` hero and the `index.html` contact card |
| Degree: September 2024 – June 2026, Class II (Division I), overall weighted mark 61/100, GPA 3.25, degree to be conferred 12 November 2026 | `cv.html` (`cv.edu.meta`); the home page shows the classification, GPA, and conferral date without the weighted mark |
| Internship: Intern, tax advisory team, Evershine CPAs Firm (永輝啟佳聯合會計師事務所), July – September 2025, Philippines tax incentive applications and SOP flowcharts | `cv.html` (`cv.exp.*`), `index.html` (`home.exp.e3*`) |
| Public proof: `assets/pdf/Internship_Certificate_Redacted.pdf`, on the CV behind a "View the internship certificate" toggle | Retains name, employer, role, and dates; removes sex, date of birth, passport and ID numbers, certificate number, company tax ID, director name, and address |

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

### Detail on request

Long reference material sits in `<details class="more">` blocks: the data,
method and reproducibility detail on `research.html`, the Tableau embed, and the
internship certificate on the CV. The section heading and its one-line summary
stay visible, so a skimming reader still gets the point. `main.js` opens a
block when a link points inside it and opens every block before printing (and
closes them again afterwards); `story.js` opens one before jumping to a cited
table row. The open buttons themselves are hidden in print.

### Business analytics project

The Tableau project is presented as the second project on `research.html`
(`#tableau`), with the interactive Tableau Public story loaded only when the
reader opens it, and summarised in one line on the home page. It is described
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

A step, or a point inside a step, can be linked to directly; see the deep links
in "Step-through stories" below.

## Step-through stories

`research.html` opens with the findings in six steps, and `cv.html` with the CV
told in six steps, both driven by `assets/js/story.js`. The techniques come from
Slidev slide decks: a step reveals its annotations one click at a time, a
hand-drawn mark on the chart follows each click, a presentation mode advances
one click per key press, and any step and click can be linked to.

| Feature | Where | What it does |
| --- | --- | --- |
| Six-step findings | `research.html#story` | Read by scrolling, or press **P** (the Present button) for one annotation per key press: → or Space forward, ← back, Home and End, **F** full screen, Esc to leave. Each step links to the table rows its numbers come from (tagged `data-cite-id`) and a bar brings the reader back. |
| Two-minute tour | `cv.html#intro` | The same engine over the CV, with a timeline whose marks follow the steps and a presenter timer (**T**) whose per-step budget, in seconds, is `data-deck-timer` on the deck. |
| Overview timeline | `index.html`, Selected work | The CV timeline with every item labelled and no step marks: an element with `data-timeline` is drawn by `story.js` from the same `TIMELINE` data, so the two pages cannot disagree about dates. |
| Cohort strips | `cv.html`, under the two assessed marks | The mark beside the class mean, upper quartile and maximum already stated in `cv.research.grade1` and `cv.research.grade2`. |
| Evidence index | `cv.html`, above Skills | One button per capability marks the CV lines that show it (`data-ev="key"` on those lines); pressing again moves to the next line. |

Deep links follow Slidev's `?clicks=` idea: `research.html#step-4.2` opens step 4
with its first two marks drawn, `cv.html#intro-3` opens step 3 of the tour, and
`cv.html#evidence-panel` lights up one capability. In presentation mode the
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
  print, so `cv.html` prints the same text as before and the PDFs in
  `assets/pdf/` do not need rebuilding for this feature.
- **Progressive enhancement.** Without JavaScript the sections are hidden
  (`html:not(.js)`) and the pages read as before. If `story.js` fails to load or
  stops with an error, `html.story-off` hides them in the same way rather than
  leaving dimmed text beside empty charts.
- **Motion is optional.** Under `prefers-reduced-motion` the marks and charts
  appear without being drawn.

## Publishing

**Live at <https://chaoglay1101-del.github.io/>.** This repository is named
after the account, so GitHub Pages serves it at the root of that address, and
Pages is set to deploy from the `main` branch. The canonical and `og:url` values
point at that root for the same reason. `.nojekyll` keeps Pages from running
Jekyll, so every file is served exactly as committed.

Publishing is therefore just committing to `main`:

1. Edit and commit (in the browser, in github.dev, or push from a clone).
2. Pages deploys on its own; the "pages build and deployment" run in the Actions
   tab shows when it is live, usually within two minutes.
3. "Site checks" runs beside it. A red cross does not take the site down, since
   Pages does not wait for it, but it means something should be fixed in the next
   commit; open the run for the failing step and the attached reports.

Every tracked file is public, `tools/`, `.github/` and this README included, so
nothing private belongs here: no submission documents, no transcripts, no data
files, no working notes. `_check_public.py` enforces the shapes of that rule
(see "Validation"), and `robots.txt` keeps `tools/` and the README out of
search results.

Until October 2026 the site was kept in the research repository
(`digital-payment-pressure-bank-margins`, folder `10_Personal_Website`) and
copied here with `git subtree`. That copy has been retired: edit here only.

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
