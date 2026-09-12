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

Every route exists twice: English at the root, Catalan under `/ca/`.

| Route | What it is |
|---|---|
| `/` | Compact masthead, then straight into recent work |
| `/works/` | All 154 paintings as one contact sheet, with a density control |
| `/editorial/` | The flowing section: every project read end to end as one publication |
| `/projects/` | Collaborations as a contact sheet |
| `/works/<slug>/`, `/projects/<slug>/` | Detail pages with prev/next |
| `/about/`, `/colour-chart/`, `/exhibitions/` | Long-form pages |

### The contact sheet

The works page is a contact sheet, not a grid. Every tile is sized so each work
occupies the same **area**: width is `√aspect × unit`, height is `unit / √aspect`,
so the product is always `unit²`. A wide canvas comes out broad and short, a tall
one narrow and tall, and both carry equal visual weight — which is what lets 154
paintings of eleven different proportions sit together without any one dominating.

The square root is taken at build time (`--k` per tile); `--unit` is the only thing
the density control touches, so changing it re-sizes all 154 tiles by writing a
single custom property. Both are registered with `@property`, which is what makes
`width: calc(--k * --unit)` recompute reliably and lets the change animate.

**Density control** — three levels, labelled with how many of the 154 pieces are
visible at once (24 / 60 / 154), derived from `unit²` against a typical viewport.
The choice is remembered in `localStorage`.

**Entry animation** — tiles fade and lift as they scroll into view, each a beat
after the last (`--i` cycles 0–13), so a dense sheet resolves in a wave. The
transition is on `width`, never on the custom property: animating `--unit` itself
would make the final size depend on the animation completing, and a transition that
never runs would strand every tile at the old size.

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
    i18n.ts       Locales and interface strings
    load.ts       Reads the dataset, merges image variants, derives collections
    title.ts      Presentation titles (the source bakes metadata into them)
    describe.ts   Factual alt text from metadata
  components/
    html.ts       40-line escaping template tag — the whole "framework"
    layout.ts     Document shell, nav, footer
    image.ts      Responsive <picture>
    gallery.ts    Equal-area contact sheet + density control
    editorial.ts  Rows/columns, preserving the source composition
    detail.ts     Detail pages
  pages/index.ts  Page composition
  assets/
    site.css      One stylesheet
    site.ts       ~220 lines: cursor, staggered reveals, nav, density control
  build.ts        Renders every route
```

**Runtime dependencies: none.** Build dependencies: `typescript`,
`node-html-parser` (extraction), `sharp` (images). No framework, no bundler, no
client-side router. `sharp` earns its place — the current site ships 14.5 MB of
unoptimised JPEG on one page.

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
| Scripts | 39 | 1, 9 KB |
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
