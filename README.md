# Claudia Valsells — redesign prototype

A working redesign of [claudiavalsells.com](https://www.claudiavalsells.com), built
from the real content of the current site: **154 paintings, 15 collaborations,
3 long-form pages, 370 images** — everything that is on the site today, nothing invented.

WordPress stays the CMS. Claudia keeps publishing exactly as she does now.

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

| Route | What it is |
|---|---|
| `/` | Editorial opening — oversized wordmark, a recent plate, recent work, project teasers |
| `/works/` | All 154 paintings. Build-time justified rows, sticky year markers, filters |
| `/editorial/` | The flowing section: every project read end to end as one publication |
| `/projects/` | Collaborations as a gallery |
| `/works/<slug>/`, `/projects/<slug>/` | Detail pages with prev/next |
| `/about/`, `/colour-chart/`, `/exhibitions/` | Long-form pages |

### The gallery

Rows are packed **at build time** from known intrinsic image dimensions, then
rendered so each tile takes `flex-grow` proportional to its aspect ratio. Within a
row every image resolves to the same height, so the row justifies exactly — with no
cropping, no JavaScript, and no measuring in the browser, which means no layout shift.

The rhythm (`RHYTHM` in `src/components/gallery.ts`) cycles the target row height so
lines land on 3, 4, 5, 3, 4 and a two-up every sixth row. It is tuned to this
archive: 127 of the 154 covers are 2:3 gallery photographs, so without a deliberate
rhythm the page marches. Changing the design of the whole gallery means editing one
array of six numbers.

Below 900px the same markup re-wraps into two or four per line and re-justifies
each line, rather than switching to a different layout.

### The cursor

Hovering a work shows its title in a cursor-following label
(`initCursor` in `src/assets/site.ts`). It is decoration, never the only route to
the information:

- the title is also in each tile's caption, permanently visible on touch and coarse pointers;
- keyboard focus reveals the caption, since there is no cursor to read;
- `prefers-reduced-motion` drops the easing.

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
  extract.ts      Sitemap-driven crawler → typed dataset
  images.ts       Image pipeline (download → AVIF/WebP/JPEG at 3 widths)
  serve.ts        Zero-dependency static server
src/
  content/
    types.ts      The content model. Start here.
    load.ts       Reads the dataset, merges image variants, derives collections
    title.ts      Presentation titles (the source bakes metadata into them)
    describe.ts   Factual alt text from metadata
  components/
    html.ts       40-line escaping template tag — the whole "framework"
    layout.ts     Document shell, nav, footer
    image.ts      Responsive <picture>
    gallery.ts    Justified-row packing + tiles
    editorial.ts  Rows/columns, preserving the source composition
    detail.ts     Detail pages
  pages/index.ts  Page composition
  assets/
    site.css      One stylesheet
    site.ts       ~190 lines: cursor, reveals, nav, filters
  build.ts        Renders every route
```

**Runtime dependencies: none.** Build dependencies: `typescript`,
`node-html-parser` (extraction), `sharp` (images). No framework, no bundler, no
client-side router. `sharp` earns its place — the current site ships 14.5 MB of
unoptimised JPEG on one page.

### Design

The work is the colour, so the interface has none: a warm paper ground, ink-black
type, one typeface (Newsreader, self-hosted and subset for English/Catalan/Spanish).
Every text tone meets WCAG AA on the paper ground — 16.1:1, 7.5:1 and 4.6:1 — and
the lightest tone is still the floor for anything carrying information.

The design commits to one look rather than following the system theme, the way
the reference sites do.

## Results

`/works/` — the same page as the current site's `/artwork/`, same 154 paintings:

| | Current site | This prototype |
|---|---|---|
| Initial page weight | 14.8 MB | **361 KB** |
| Requests | 190 | **9** |
| Images fetched on load | 154 of 154 | **6** of 154 |
| Image format | JPEG | AVIF (WebP + JPEG fallbacks) |
| Layout shift | — | none (every image has intrinsic dimensions) |
| Scripts | 39 | 1, 7 KB |

A 400px AVIF thumbnail averages **7 KB**, against 100 KB+ for the equivalent today.

Verified across all 176 built pages: 2,289 internal links with none broken, no
missing media, exactly one `h1` per page, no link without an accessible name.

## Known limitations

- The IA still shows collaborations as one section; splitting *personal* from
  *commissioned* needs Claudia's classification (see `DISCOVERY.md` §5).
- Catalan is not implemented. The fonts are already subset for it and the content
  model is per-record, so the work is a locale field plus translated content —
  but the translation itself is the real cost.
- `location`, `client` and `credits` render when present; the source site has
  none of them as structured data.
- The WooCommerce question is unresolved and deliberately untouched.
