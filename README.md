# Claudia Valsells — redesign prototype

A working redesign of [claudiavalsells.com](https://www.claudiavalsells.com), built
from the real content of the current site: **154 paintings, 15 collaborations,
3 long-form pages, 370 images** — everything that is on the site today, nothing invented.

Served in **English and Catalan** (352 pages). WordPress stays the CMS, and
Claudia keeps publishing exactly as she does now.

## Quick start

```bash
npm install
npm run build && npm run serve     # → http://localhost:4321
```

The extracted dataset (`content/projects.json`, `content/images.json`) is committed,
so the content is in the repo. The rendered images are not — 80 MB of derivatives
and 176 MB of downloaded originals do not belong in git — so a fresh clone needs
one image pass before its first build:

```bash
npm run images     # download + render AVIF/WebP → dist/media  (~4 min, resumable)
npm run build
```

Both are incremental: `images` skips any file already downloaded or rendered, and
re-running it after Claudia publishes new work only fetches what is new. To re-pull
the content itself from the live site:

```bash
npm run extract    # crawl WordPress → content/projects.json   (~30 s; HTML is cached under content/raw/)
```

| Script | Does |
|---|---|
| `npm run extract` | Crawls the WordPress sitemaps, parses each page, writes the typed dataset |
| `npm run images` | Downloads every referenced image, renders AVIF + WebP + JPEG at 400/800/1600px |
| `npm run build` | Renders 176 static pages into `dist/` |
| `npm run serve` | Static file server for `dist/` |
| `npm run typecheck` | `tsc --noEmit` |

## What it looks like

Two locations. Everything except the artwork lives on one scrolling page; the
navigation moves between its sections without loading anything.

| Route | What it is |
|---|---|
| `/` | The name, then Exhibitions → Collaborations → Colour Chart → Inquiries |
| `/artwork/` | All 154 paintings as one uninterrupted contact sheet |
| `/artwork/<slug>/` | One painting |
| `/collaborations/<slug>/` | One collaboration: imagery first, text below |

Catalan mirrors all of it under `/ca/`.

### The contact sheet

Every tile is sized so each work occupies the same **area**: width is
`√aspect × unit`, height is `unit / √aspect`, so the product is always `unit²`. A
wide canvas comes out broad and short, a tall one narrow and tall, and both carry
equal weight — which is what lets 154 paintings of eleven different proportions sit
together without any one dominating.

The square root is taken at build time (`--k`); `--unit` is the only thing the
density control touches, so one custom property resizes all 154. Both are
registered with `@property`, which is what makes `width: calc(--k * --unit)`
recompute reliably.

**Years never cut the grid.** The sheet runs unbroken; the year of whatever is at
the top of the viewport floats over it while you scroll and fades when you stop,
after the iOS photo library.

### The lightbox

A painting opens over the sheet: the grid stays put behind a light veil, the
caption sits beside the plate in black at reading size, and arrows, swipe and the
keyboard move between works.

**One transition per action, and only one in flight.** Each navigation takes a
ticket; when the fade finishes the swap happens only if that ticket is still
current, so a second click lapses the first instead of racing it. Opening pushes
one history entry and moving replaces it, so Back leaves the lightbox in a single
press rather than walking through every painting.

The plate is rebuilt from the clicked tile's own `<picture>` at a larger size and
the caption from data attributes already on it — no second copy of the 154 records
is shipped alongside the markup that already holds them.

### About

About is not a destination. It opens over whatever page you are on — the artwork
sheet included — blurred behind it, and closes back to the same place. Set as
justified newspaper columns with the two studio photographs floated into the prose
near the top; their positions are two numbers in `src/content/sections.ts`.

### Exhibitions

The Exhibitions section is an index; choosing one raises it above the homepage,
which stays visible behind a light blur. The six exhibitions are split out of the
source site's single combined page by `src/content/sections.ts`: a row begins a new
exhibition when its text opens with a `<strong>` title *and* carries a year — the
title alone would also catch sub-headings that belong to the exhibition above.

Panels are in the page rather than fetched, so opening one is instant and the text
is there for search engines and for readers without scripting, who reach it through
the plain `#exhibition-…` anchor.

### The wordmark

Characters near the pointer show `*` and snap back, the nearer ones holding
longer, so a title resolves as a ripple. Each character is locked to the width of
its own glyph, so the substituted asterisk cannot change the word's length.
Characters are armed **only when the pointer moves**, never from inside the
animation loop — re-arming each frame is
what made an earlier version shimmer forever while the cursor rested nearby. The
loop only resolves deadlines and stops when none are left. The real characters stay
in the DOM throughout, so selection and the accessible name are untouched.

### Blur

One value for the whole site — 8px, over a veil that is 84% paper. Legibility comes
from the opacity, not the blur; raising the blur to compensate is what made it read
as a filter rather than a plane.

## Publishing — unchanged

**Claudia publishes exactly as she does today.** Nothing about `/wp-admin`,
the media library, or her workflow changes:

> Portfolio → Add New → title → drop in images and text → tick the category → Publish.

What changes is only what happens *after* she presses Publish. The prototype reads
WordPress rather than replacing it:

```
WordPress (unchanged)  →  npm run extract  →  content/projects.json  →  npm run build  →  static HTML
```

To put this into production, the one piece still to add is a trigger: a WordPress
`save_post` hook that calls a build webhook, so publishing rebuilds the site within
a minute. That is roughly twenty lines in the child theme's `functions.php` and it
is the *only* change the WordPress install needs.

**No new CMS is introduced, and none is needed.** The content model in
`src/content/types.ts` mirrors what WordPress already stores — including its
row/column page composition — so there is nothing a headless CMS would add here
except a second place for Claudia to learn.

If a build step turns out to be impossible on the current hosting, the same
templates port to a WordPress child theme without redesigning anything: every
component in `src/components/` is a pure function from data to markup and maps
one-to-one onto a PHP partial. That is why there is no framework here.

## Architecture

```
scripts/
  extract.ts        Sitemap-driven crawler → typed dataset
  images.ts         Image pipeline (download → AVIF/WebP/JPEG at 3 widths)
  serve.ts          Zero-dependency static server
src/
  content/          The data layer. No HTML here.
    types.ts        The content model. Start here.
    load.ts         Reads the dataset, merges image variants, derives collections
    sections.ts     Splits the source's combined pages: six exhibitions, About
    title.ts        Presentation titles (the source bakes metadata into them)
    describe.ts     Factual alt text from metadata
    i18n.ts         Interface strings, en + ca
    paths.ts        Deployment base path
  components/       Pure functions: data → Html. Each maps onto a template partial.
    html.ts         40-line escaping template tag — the whole "framework"
    layout.ts       Document shell: head, header, lightbox, panels
    image.ts        Responsive <picture>
    gallery.ts      The equal-area contact sheet
    rows.ts         A page body in the source's own row/column composition
    detail.ts       Painting and collaboration detail pages
    sections/       One file per homepage section, sharing band.ts
  pages/            One file per route: home, artwork, detail
  client/           Browser code, one ES module per concern, booted by index.ts
  styles/           One stylesheet per concern, concatenated in name order
  build.ts          Renders every route
```

Every file is under 200 lines. Browser modules are transpiled one-for-one into
`dist/js/` and loaded natively — there is no bundler because nothing needs
bundling — with `modulepreload` hints so they fetch in parallel.

**Runtime dependencies: none.** Build dependencies: `typescript`,
`node-html-parser` (extraction), `sharp` (images). No framework, no bundler, no
client-side router.

### Design

The work is the colour, so the interface has none: a warm paper ground, ink type,
one typeface (**Inter**, self-hosted and subset for English/Catalan/Spanish — 54 KB).
Compact and utilitarian: 13px body, 10px labels, a 40px bar and tight gutters, so
the artwork starts within the first screen on every page.

The header is a single fixed rule with no background, no blur and no plate. White
text in `mix-blend-mode: difference` inverts against whatever scrolls under it —
near-black over the paper ground, white over a dark photograph.

Every text tone meets WCAG AA on the paper ground — 16.1:1, 7.5:1 and 4.6:1 — and
the lightest tone is the floor for anything carrying information. The design
commits to one look rather than following the system theme.

### Languages

English lives at the root, Catalan under `/ca/`, with `hreflang` on every page and a
switcher in the bar that lands on the same page in the other language.

`src/content/i18n.ts` holds the interface strings. **Claudia's own writing is not
machine-translated** — the artist statement, the exhibition texts and the Colour
Chart essay run to ~38,000 characters, and presenting an invented Catalan version of
an artist's words as if they were hers would be a fabrication. Those pages fall back
to the English source and say so in the page. A translator's text drops in without
any code change.

## Results

`/works/` — the same page as the current site's `/artwork/`, same 154 paintings:

| | Current site | This prototype |
|---|---|---|
| Initial page weight | 14.8 MB | **~330 KB** |
| Requests | 190 | 28 |
| Images fetched on load | 154 of 154 | 18 of 154 |
| Image format | JPEG | AVIF (WebP + JPEG fallbacks) |
| Layout shift | — | none (every image has intrinsic dimensions) |
| Scripts | 39 | 1, 25 KB |
| Webfont | — | 54 KB, self-hosted, preloaded |

A 400px AVIF thumbnail averages **7 KB**, against 100 KB+ for the equivalent today.

Verified across all 352 built pages (176 × 2 languages): 5,998 internal links with
none broken, no missing media, exactly one `h1` per page, no link without an
accessible name.

## Known limitations

- The IA still shows collaborations as one section; splitting *personal* from
  *commissioned* needs Claudia's classification (see `DISCOVERY.md` §5).
- Catalan ships with the interface translated; Claudia's long-form texts still
  need a human translator (see "Languages" above).
- `location`, `client` and `credits` render when present; the source site has
  none of them as structured data.
- The WooCommerce question is unresolved and deliberately untouched.
