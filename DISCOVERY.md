# Discovery — what the current site actually is

Audited 2026-09-11 against `https://www.claudiavalsells.com`.

## 1. The current stack

| | |
|---|---|
| CMS | **WordPress 6.8.8** (not Cargo Collective) |
| Theme | `koncept` (ThemeForest) + a `koncept-child` child theme |
| Page builder | Krown/WPBakery-style shortcodes — `krown-column-row` / `krown-column-container` |
| Content types | `page` (26) and a `portfolio` custom post type (154) |
| Taxonomy | `portfolio_category` — only two terms: `pinturas-paintings`, `available` |
| Media library | 748 attachments |
| Plugins seen | `wpforms-lite`; a Yoast-style SEO plugin (emits `wp-sitemap.xml`, JSON-LD, canonical + og tags) |
| Commerce | **WooCommerce is installed** — `/carrito/`, `/finalizar-compra/`, `/available-works/`, and an `available` term on 13 paintings |
| Rendering | Server-rendered PHP, no build step, no static generation |
| REST API | `wp/v2/pages` and `wp/v2/media` respond; the `portfolio` post type is **not** registered with `show_in_rest`, so it is invisible to the REST API |

### Performance of the current site

Measured on `/artwork/`, the main gallery:

| Metric | Current site |
|---|---|
| Page weight | **14.8 MB** (14.5 MB of it images) |
| Images | 154, **none lazy-loaded** — every one fetched on load |
| Formats | 100% JPEG; no WebP, no AVIF |
| Requests | 190, including 39 scripts |
| Document height | 27,000 px |

This is the single biggest problem with the site as it stands, and it is a theme
problem rather than a content problem.

## 2. How Claudia publishes today

1. Log in to `/wp-admin`.
2. **Portfolio → Add New** for a painting, or **Pages → Add New** under `/projects/` for a collaboration.
3. Title goes in the WordPress title field. On paintings she writes it as
   `UNTITLED 2026, 162X130CM` — the theme has nowhere to put dimensions, so they
   are typed into the title.
4. The body is built with the theme's row/column builder: a row, split into
   `span4`/`span12` columns, each holding either images or a text block.
5. Images are uploaded through the standard WordPress media library.
6. Categories `pinturas-paintings` and (for sale) `available` are ticked.
7. Publish. The `/artwork/` grid and the sitemap pick it up automatically.

**This prototype changes none of that.** See `README.md` → "Publishing".

## 3. What was extracted

`npm run extract` crawls the WordPress sitemaps and produced `content/projects.json`.

| | Records | Notes |
|---|---|---|
| Works (paintings) | **154 / 154** | every `portfolio` post |
| Projects (collaborations) | **15 / 15** | every page under `/projects/` |
| Long-form pages | **3 / 3** | About, Colour Chart, Exhibitions |
| Unique images | **370** | all downloaded and re-rendered |

Metadata coverage across the 154 paintings:

| Field | Coverage | Source |
|---|---|---|
| `year` | 154 / 154 | `cv2026`-style stamp in the body, else the title, else publication date |
| `dimensions` | 153 / 154 | parsed from title or body |
| `materials` | 117 / 154 | "Acrylic on canvas", "Gouache on paper", … |
| `reference` | 108 / 154 | Claudia's inventory codes (L585, M615, PL581 — large/medium/paper) |
| `available` | 13 flagged | the `available` taxonomy term |

Long-form text captured in full: About 8,914 characters, Colour Chart 4,703,
Exhibitions 24,480 across 32 rows and 41 images.

## 4. What could not be extracted, and why

| Item | Why |
|---|---|
| **Image captions** | Zero of 370 images carry a caption on the source site. Nothing to extract; the model supports `caption` and will pick them up if they are ever added. |
| **Alt text** | Only 35 of 370 images have an `alt` attribute. The gallery links are named by their visible caption text; for detail-page plates the prototype builds a factual description from the work's own metadata (`src/content/describe.ts`). Nothing is invented. |
| **`location`, `client`, `credits`** | These fields exist in the content model but the source site records them only inside prose, never as structured data. They are left empty rather than guessed at. Populating them is a content task for Claudia, not a parsing problem. |
| **2 paintings' body images** | `color-dialgogues-iv-2021-2` and `recent-works-2017-5` have a dead `placehold.it` image in the body. Their real featured images were recovered from `og:image`. |
| **1 painting's dimensions** | One work states no dimensions anywhere on its page. |
| **WooCommerce prices / stock** | Out of scope for this prototype and not present in the public markup. Needs a decision (see below). |

## 5. Things found that need a decision, not a fix

These are content and business questions. None of them are things a developer
should quietly resolve.

1. **Is the shop staying?** WooCommerce is installed and 13 works are tagged
   `available`, but there is no visible buy path. Keep, remove, or replace with
   an enquiry form?
2. **The photography is inconsistent.** 127 of the 154 covers are 2:3 *gallery
   installation photographs* — the painting on a white wall, floor visible — not
   flat reproductions of the artwork. The remaining 27 are flat scans at true
   canvas proportions. This means the gallery cannot show the paintings' real
   proportions, and roughly half of each tile is white wall. Re-shooting the
   archive flat is the single biggest visual upgrade available, and it is a
   photography budget line, not a design one.
3. **Typos in the source content.** `COLOR DIALGOGUES IV` (for "Dialogues") and
   "comunication" in the About text. Reproduced verbatim — correcting an artist's
   copy is an editorial decision.
4. **Two inquiry addresses are planned** ("Inquiries art" and "Inquiries others")
   but only `editorial@alzuetagallery.com` exists today. Both footer links
   currently point at it.
5. **The requested IA does not match the current site.** Claudia's brief asks for
   *personal projects* and *commissioned projects* as separate sections, and for
   *What's Color?* (three editions) to stand on its own. Today all 15 are in one
   undifferentiated "Collaborations" bucket and What's Color is mixed into the
   Exhibitions page. Splitting them requires Claudia to classify the 15 projects
   one by one. The prototype keeps them in one section until she does; the
   content model already carries `kind` and can take a further field without
   restructuring anything.
6. **Redirects.** 154 painting URLs and 26 page URLs will change shape. A
   redirect map is needed at launch or the existing search ranking is lost.

## 6. Catalan

Claudia asked for Catalan "optional, depending on price". The prototype ships the
machinery and the whole interface; the content is the remaining cost.

**Done** — every interface string (`src/content/i18n.ts`): navigation, labels,
filters, museum-label field names, pagination, page introductions, footer. Catalan
lives at `/ca/`, English at the root, with `hreflang` on every page and a switcher
in the bar. Inter is subset to include `l·l`, `ç` and the accented vowels.

**Not done, deliberately** — Claudia's own writing. The About text (8,914
characters), the Exhibitions page (24,480) and the Colour Chart essay (4,703) are
her voice. Machine-translating an artist's statement and publishing it under her
name would be a fabrication, so those pages fall back to English and say so.

**What it costs to finish:** ~38,000 characters of literary Catalan translation.
That is a translator's invoice, not development time — the code already has the
slot. Worth pricing separately in the proposal, because it is the entire remaining
cost of the Catalan version.
