import { html, join, raw, type Html } from './html.ts';
import { responsiveImage } from './image.ts';
import { displayTitle } from '../content/title.ts';
import type { Locale } from '../content/i18n.ts';
import { localePath } from '../content/i18n.ts';
import type { Column, Project, Row } from '../content/types.ts';

/**
 * Renders a project's body using the row/column composition it already had on
 * the source site. Claudia laid these pages out herself — three images abreast,
 * then a full-width passage of text — and that rhythm is the editorial design.
 * We inherit it rather than re-flowing everything into a uniform template.
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

export function editorialBody(rows: readonly Row[], { eagerRows = 1 } = {}): Html {
  return html`<div class="editorial-body">
    ${join(rows.map((row, i) => html`<div class="row">${join(row.columns.map((c) => column(c, i < eagerRows)))}</div>`))}
  </div>`;
}

/**
 * One project as a spread in a publication: an oversized title, the metadata in
 * the margin, then the project's own composition.
 */
export interface SpreadOptions {
  /**
   * Cap on the images shown. The homepage section is a reading, not the archive —
   * one project carries 44 photographs, which stacked full-width ran to 38,000px
   * on its own. The whole project is a click away on its own page.
   */
  readonly maxImages?: number;
  readonly readLabel?: string;
}

export function editorialSpread(
  project: Project, index: number, locale: Locale, options: SpreadOptions = {},
): Html {
  const { year, location, client, materials } = project.metadata;
  const facts = [year, location, client, materials].filter(Boolean);
  const name = displayTitle(project.title, project.kind, locale);
  const href = localePath(locale, `/collaborations/${project.slug}/`);

  // Trim whole image-columns rather than slicing inside one, so a row that was
  // composed as a triptych is never left showing two of three.
  let budget = options.maxImages ?? Infinity;
  const rows: Row[] = [];
  for (const row of project.rows) {
    const columns = row.columns.filter((column) => {
      if (column.kind !== 'images') return true;
      if (budget <= 0) return false;
      budget -= column.images.length;
      return true;
    });
    if (columns.length) rows.push({ columns });
  }

  return html`<article class="spread" id="${project.slug}">
    <header class="spread-head">
      <p class="spread-index">${String(index + 1).padStart(2, '0')}</p>
      <h2 class="spread-title reveal">
        <a href="${href}" data-cursor-title="${name}">${name}</a>
      </h2>
      ${facts.length ? html`<p class="spread-facts">${join(facts.map((f) => html`<span>${f}</span>`), '')}</p>` : ''}
    </header>
    ${editorialBody(rows, { eagerRows: index === 0 ? 1 : 0 })}
    ${options.readLabel
      ? html`<p class="spread-more"><a href="${href}">${options.readLabel} →</a></p>`
      : ''}
  </article>`;
}
