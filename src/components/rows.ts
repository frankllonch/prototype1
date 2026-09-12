import { html, join, raw, type Html } from './html.ts';
import { responsiveImage } from './image.ts';
import type { Column, Row } from '../content/types.ts';

/**
 * Renders a page body using the row/column composition it already had on the
 * source site. Claudia laid these pages out herself — three images abreast, then
 * a full-width passage of text — and that rhythm is inherited rather than
 * re-flowed into a uniform template.
 */

const sizesFor = (span: number): string =>
  span >= 10
    ? '(max-width: 900px) 94vw, 78vw'
    : span >= 6
      ? '(max-width: 900px) 94vw, 46vw'
      : '(max-width: 900px) 88vw, 30vw';

function column(col: Column, priority: boolean): Html {
  if (col.kind === 'text') {
    return html`<div class="col col-text" style="--span:${col.span}">
      <div class="prose reveal">${raw(col.html)}</div>
    </div>`;
  }
  return html`<div class="col col-images" style="--span:${col.span}">
    ${join(
      col.images.map(
        (image) => html`<figure class="figure reveal">
          ${responsiveImage({ image, sizes: sizesFor(col.span), priority })}
          ${image.caption ? html`<figcaption>${image.caption}</figcaption>` : ''}
        </figure>`,
      ),
    )}
  </div>`;
}

export function rowsBody(rows: readonly Row[], { eagerRows = 1 } = {}): Html {
  return html`<div class="rows">
    ${join(rows.map((row, i) => html`<div class="row">${join(row.columns.map((c) => column(c, i < eagerRows)))}</div>`))}
  </div>`;
}
