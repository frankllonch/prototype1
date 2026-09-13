import { html, join, type Html } from './html.ts';
import { aspectOf, responsiveImage } from './image.ts';
import { displayTitle } from '../content/title.ts';
import type { Dictionary, Locale } from '../content/i18n.ts';
import { localePath } from '../content/i18n.ts';
import type { Project } from '../content/types.ts';

interface GalleryProps {
  readonly items: readonly Project[];
  /** Base path for item links, e.g. `/works` (locale prefix applied here). */
  readonly basePath: string;
  readonly locale: Locale;
  readonly t: Dictionary;
  /** Expose each tile's year so the floating scroll indicator can read it. */
  readonly trackYears?: boolean;
  /**
   * Open works in the lightbox instead of navigating. Only for single artworks:
   * a collaboration's page is mostly text and images the lightbox cannot show.
   */
  readonly lightbox?: boolean;
  /** Open each tile as a panel of this kind (`#<kind>-<slug>`) over the page. */
  readonly panels?: string;
  readonly eagerCount?: number;
}

/** Side of the square each work occupies, in px (every tile has the same area). */
const UNIT = 126;

/** The counts offered by the "Show" filter; "All" is added after them. */
const SHOW_COUNTS = [24, 60] as const;

/**
 * Metadata is mirrored onto the tile as data attributes so the lightbox can build
 * its caption straight from the DOM. The alternative — shipping a JSON copy of all
 * 154 records alongside the markup that already contains them — would cost ~100 KB
 * to say the same thing twice.
 */
function tile(project: Project, basePath: string, locale: Locale, index: number, priority: boolean, panels?: string): Html {
  const image = project.cover;
  if (!image) return html``;

  const name = displayTitle(project.title, project.kind, locale);
  const { year, dimensions, materials, reference, available } = project.metadata;
  const aspect = aspectOf(image);

  return html`<a
    class="tile"
    href="${basePath}/${project.slug}/"
    style="--k:${Math.sqrt(aspect).toFixed(4)};--i:${index % 14}"
    data-cursor-title="${name}"
    ${panels ? html`data-panel-open="${panels}-${project.slug}"` : ''}
    data-title="${name}"
    data-year="${year ?? ''}"
    data-dimensions="${dimensions ?? ''}"
    data-materials="${materials ?? ''}"
    data-reference="${reference ?? ''}"
    data-available="${available ? 'true' : 'false'}"
    data-index="${index}"
  >
    ${responsiveImage({
      image,
      sizes: '(max-width: 599px) 45vw, 170px',
      priority,
      className: 'tile-image',
    })}
    <span class="tile-caption">
      <span class="tile-title">${name}</span>
      <span class="tile-meta">
        ${dimensions ?? year ?? ''}
        ${materials ? html`<span class="tile-medium"> · ${materials}</span>` : ''}
      </span>
    </span>
  </a>`;
}

/**
 * A contact sheet, not a grid.
 *
 * Every tile is sized so all works occupy the same *area*: width is
 * `√aspect × unit`, height is `unit / √aspect`, so the product is always `unit²`.
 * A wide canvas comes out broad and short, a tall one narrow and tall, and both
 * carry equal visual weight.
 *
 * The flow is deliberately unbroken — no year headings interrupt it. The year is
 * reported instead by a floating indicator that follows the scroll, the way the
 * iOS photo library does it, so ten years of work read as one continuous sheet.
 */
export function gallery({
  items, basePath, locale, t, trackYears = false, lightbox = false, panels, eagerCount = 18,
}: GalleryProps): Html {
  const tiles = items.map((item, index) =>
    tile(item, localePath(locale, basePath), locale, index, index < eagerCount, panels),
  );

  return html`<div
    class="gallery"
    data-gallery
    ${trackYears ? html`data-track-years` : ''}
    ${lightbox ? html`data-lightbox-source` : ''}
    style="--unit:${UNIT}px"
  >${join(tiles)}</div>`;
}

/** Floating year readout, filled in by the scroll handler. */
export function yearIndicator(): Html {
  return html`<div class="year-float" data-year-float aria-hidden="true"><span></span></div>`;
}

/**
 * Filters for the sheet: how many of the newest works to show, and which year.
 * Both are plain buttons; the script narrows the sheet in place. Without it the
 * full sheet is shown, so nothing is gated behind scripting.
 */
export function filterControls(years: readonly number[], total: number, t: Dictionary): Html {
  const chip = (group: string, value: string, label: string | number, active = false) =>
    html`<button type="button" class="filter${active ? ' is-active' : ''}"
      data-filter-${group}="${value}" aria-pressed="${active ? 'true' : 'false'}">${label}</button>`;

  return html`<div class="filters" data-filters>
    <div class="filter-group" role="group" aria-label="${t.gallery.show}">
      <span class="filter-label">${t.gallery.show}</span>
      ${join(SHOW_COUNTS.filter((n) => n < total).map((n) => chip('count', String(n), n)))}
      ${chip('count', 'all', t.gallery.all, true)}
    </div>
    <div class="filter-group" role="group" aria-label="${t.gallery.year}">
      <span class="filter-label">${t.gallery.year}</span>
      ${chip('year', 'all', t.gallery.allYears, true)}
      ${join(years.map((year) => chip('year', String(year), year)))}
    </div>
  </div>`;
}
