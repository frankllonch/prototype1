import { html, join, type Html } from './html.ts';
import { aspectOf, responsiveImage } from './image.ts';
import { displayTitle } from '../content/title.ts';
import type { Project } from '../content/types.ts';

export interface GalleryProps {
  readonly items: readonly Project[];
  /** Base path for item links, e.g. `/works`. */
  readonly basePath: string;
  /** Insert a sticky year marker whenever the year changes. */
  readonly groupByYear?: boolean;
  /** How many leading images to load eagerly. */
  readonly eagerCount?: number;
}

interface PackedRow {
  readonly items: readonly Project[];
  /** Sum of the row's aspect ratios — determines how tall the row renders. */
  readonly aspectSum: number;
}

/**
 * A repeating rhythm of target aspect-sums. A smaller sum means fewer, larger
 * images on that line. Cycling through these is what stops 154 paintings from
 * reading as a spreadsheet: the scale changes every line, but predictably, and
 * the same input always produces the same layout.
 *
 * Tuned to the actual archive: 127 of the 154 covers are 2:3 gallery photographs
 * (aspect 0.667), so these targets land on 3, 4, 5, 3, 4 and a 2-up every sixth
 * row — the wide beat that gives the page a pulse. Targets sit just under each
 * multiple of 0.667 because packing is greedy and stops once the sum is reached.
 */
const RHYTHM = [1.9, 2.6, 3.2, 1.9, 2.6, 1.3] as const;

/**
 * Greedy justified-row packing.
 *
 * Rows are packed here, at build time, from known intrinsic dimensions — so the
 * browser never measures anything and the layout cannot shift. The rendered row
 * stays fluid because each tile takes `flex-grow` proportional to its aspect
 * ratio, which re-justifies at any container width and re-wraps on narrow screens.
 */
export function packRows(items: readonly Project[], rhythm: readonly number[] = RHYTHM): PackedRow[] {
  const rows: PackedRow[] = [];
  let current: Project[] = [];
  let sum = 0;

  for (const item of items) {
    current.push(item);
    sum += item.cover ? aspectOf(item.cover) : 0.75;
    const target = rhythm[rows.length % rhythm.length]!;
    if (sum >= target) {
      rows.push({ items: current, aspectSum: sum });
      current = [];
      sum = 0;
    }
  }
  if (current.length) rows.push({ items: current, aspectSum: Math.max(sum, 1.2) });
  return rows;
}

function tile(project: Project, basePath: string, priority: boolean): Html {
  const image = project.cover;
  if (!image) return html``;
  const name = displayTitle(project.title, project.kind);

  const { year, dimensions, materials, available } = project.metadata;

  return html`<a
    class="tile"
    href="${basePath}/${project.slug}/"
    style="--aspect:${aspectOf(image).toFixed(4)}"
    data-cursor-title="${name}"
    data-year="${year ?? ''}"
    data-available="${available ? 'true' : 'false'}"
  >
    ${responsiveImage({
      image,
      sizes: '(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 30vw',
      priority,
      className: 'tile-image',
    })}
    ${available ? html`<span class="tile-flag">Available</span>` : ''}
    <span class="tile-caption">
      <span class="tile-title">${name}</span>
      <span class="tile-meta">
        ${dimensions ?? year ?? ''}
        ${materials ? html`<span class="tile-medium"> · ${materials}</span>` : ''}
      </span>
    </span>
  </a>`;
}

export function gallery({ items, basePath, groupByYear = false, eagerCount = 6 }: GalleryProps): Html {
  const rows = packRows(items);
  let rendered = 0;
  let lastYear: number | undefined;

  const body = rows.map((row) => {
    const marker =
      groupByYear && row.items[0]?.metadata.year !== undefined && row.items[0].metadata.year !== lastYear
        ? ((lastYear = row.items[0].metadata.year), html`<h2 class="year-marker" id="y${lastYear}" data-year="${lastYear}"><span>${lastYear}</span></h2>`)
        : '';

    const tiles = row.items.map((item) => tile(item, basePath, rendered++ < eagerCount));
    return html`${marker}
      <div class="gallery-row" style="--sum:${row.aspectSum.toFixed(4)}">${join(tiles)}</div>`;
  });

  return html`<div class="gallery" data-gallery>${join(body)}</div>`;
}
