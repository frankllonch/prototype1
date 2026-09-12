import { html, join, type Html } from './html.ts';
import { aspectOf, responsiveImage } from './image.ts';
import { displayTitle } from '../content/title.ts';
import type { Dictionary, Locale } from '../content/i18n.ts';
import { localePath } from '../content/i18n.ts';
import type { Project } from '../content/types.ts';

export interface GalleryProps {
  readonly items: readonly Project[];
  /** Base path for item links, e.g. `/works` (locale prefix applied here). */
  readonly basePath: string;
  readonly locale: Locale;
  readonly t: Dictionary;
  readonly groupByYear?: boolean;
  readonly eagerCount?: number;
}

/**
 * Zoom levels for the contact sheet.
 *
 * `unit` is the side of the square each work occupies, in px. Because every tile
 * is sized to the same *area* rather than the same height, the number of works
 * on a screen is a function of that unit alone — so each level can be labelled
 * with how many of Claudia's 154 pieces are visible at once, which is what the
 * control is actually for.
 *
 * Derived from a ~1400×800 viewport with ~15% lost to gaps:
 *   visible ≈ 950_000 / unit²
 */
export const ZOOM_LEVELS = [
  { unit: 200, visible: 24 },
  { unit: 126, visible: 60 },
  { unit: 78, visible: 154 },
] as const;

export const DEFAULT_ZOOM = 1;

function tile(project: Project, basePath: string, locale: Locale, index: number, priority: boolean): Html {
  const image = project.cover;
  if (!image) return html``;

  const name = displayTitle(project.title, project.kind, locale);
  const { year, dimensions, materials, available } = project.metadata;
  const aspect = aspectOf(image);

  return html`<a
    class="tile"
    href="${basePath}/${project.slug}/"
    style="--k:${Math.sqrt(aspect).toFixed(4)};--i:${index % 14}"
    data-cursor-title="${name}"
    data-year="${year ?? ''}"
    data-available="${available ? 'true' : 'false'}"
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
 * Every tile is sized so all works occupy the same *area* — a wide canvas is
 * broader and shorter, a tall one narrower and taller, but each carries equal
 * visual weight. Width is `√aspect × unit`, so area is `unit²` regardless of
 * shape. The square root is taken at build time because CSS `sqrt()` is still
 * too new to rely on; everything else is a single custom property the zoom
 * control changes, which is why zooming animates 154 tiles without touching the
 * DOM.
 */
export function gallery({
  items, basePath, locale, t, groupByYear = false, eagerCount = 18,
}: GalleryProps): Html {
  let lastYear: number | undefined;
  const body: Html[] = [];

  items.forEach((item, index) => {
    if (groupByYear && item.metadata.year !== undefined && item.metadata.year !== lastYear) {
      lastYear = item.metadata.year;
      body.push(html`<h2 class="year-marker" id="y${lastYear}" data-year="${lastYear}"><span>${lastYear}</span></h2>`);
    }
    body.push(tile(item, localePath(locale, basePath), locale, index, index < eagerCount));
  });

  return html`<div
    class="gallery"
    data-gallery
    style="--unit:${ZOOM_LEVELS[DEFAULT_ZOOM]!.unit}px"
  >${join(body)}</div>`;
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
