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
   * a collaboration's page is mostly text and images the lightbox cannot show, so
   * those tiles stay ordinary links.
   */
  readonly lightbox?: boolean;
  readonly eagerCount?: number;
}

/**
 * Zoom levels for the contact sheet.
 *
 * `unit` is the side of the square each work occupies, in px. Because every tile
 * is sized to the same *area* rather than the same height, the number of works
 * on a screen is a function of that unit alone — so each level can be labelled
 * with how many of Claudia's 154 pieces are visible at once.
 *
 * Derived from a ~1400×800 viewport with ~15% lost to gaps: visible ≈ 950_000 / unit²
 */
const ZOOM_LEVELS = [
  { unit: 200, visible: 24 },
  { unit: 126, visible: 60 },
  { unit: 78, visible: 154 },
] as const;

const DEFAULT_ZOOM = 1;

/**
 * Metadata is mirrored onto the tile as data attributes so the lightbox can build
 * its caption straight from the DOM. The alternative — shipping a JSON copy of all
 * 154 records alongside the markup that already contains them — would cost ~100 KB
 * to say the same thing twice.
 */
function tile(project: Project, basePath: string, locale: Locale, index: number, priority: boolean): Html {
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
  items, basePath, locale, t, trackYears = false, lightbox = false, eagerCount = 18,
}: GalleryProps): Html {
  const tiles = items.map((item, index) =>
    tile(item, localePath(locale, basePath), locale, index, index < eagerCount),
  );

  return html`<div
    class="gallery"
    data-gallery
    ${trackYears ? html`data-track-years` : ''}
    ${lightbox ? html`data-lightbox-source` : ''}
    style="--unit:${ZOOM_LEVELS[DEFAULT_ZOOM]!.unit}px"
  >${join(tiles)}</div>`;
}

/** Floating year readout, filled in by the scroll handler. */
export function yearIndicator(): Html {
  return html`<div class="year-float" data-year-float aria-hidden="true"><span></span></div>`;
}

/** The zoom control: three densities, labelled by works visible at each. */
export function zoomControl(t: Dictionary): Html {
  return html`<div class="zoom" role="group" aria-label="${t.gallery.density}">
    <span class="zoom-label">${t.gallery.density}</span>
    ${join(
      ZOOM_LEVELS.map(
        (level, i) => html`<button
          type="button"
          class="zoom-step${i === DEFAULT_ZOOM ? ' is-active' : ''}"
          data-unit="${level.unit}"
          aria-pressed="${i === DEFAULT_ZOOM ? 'true' : 'false'}"
        >${level.visible}</button>`,
      ),
    )}
  </div>`;
}
