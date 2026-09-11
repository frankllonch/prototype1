import { html, join, type Html } from './html.ts';
import { editorialBody } from './editorial.ts';
import { responsiveImage } from './image.ts';
import { describeImage } from '../content/describe.ts';
import { displayTitle } from '../content/title.ts';
import type { Project } from '../content/types.ts';

export interface DetailProps {
  readonly project: Project;
  readonly previous?: Project;
  readonly next?: Project;
  readonly basePath: string;
  readonly backLabel: string;
  readonly backHref: string;
}

/** Only renders rows that the source page actually carries a value for. */
function factList(project: Project): Html {
  const { year, reference, dimensions, materials, location, client, credits, available } = project.metadata;
  const facts: Array<[string, string]> = [];
  if (year) facts.push(['Year', String(year)]);
  if (dimensions) facts.push(['Dimensions', dimensions]);
  if (materials) facts.push(['Medium', materials]);
  if (location) facts.push(['Location', location]);
  if (client) facts.push(['Client', client]);
  if (credits?.length) facts.push(['Credits', credits.join(', ')]);
  if (reference) facts.push(['Reference', reference]);
  if (available) facts.push(['Status', 'Available']);
  if (!facts.length) return html``;

  return html`<dl class="facts">
    ${join(facts.map(([term, value]) => html`<div><dt>${term}</dt><dd>${value}</dd></div>`))}
  </dl>`;
}

function pager(previous: Project | undefined, next: Project | undefined, basePath: string): Html {
  if (!previous && !next) return html``;
  return html`<nav class="pager" aria-label="Between works">
    ${previous
      ? html`<a class="pager-link pager-prev" href="${basePath}/${previous.slug}/" rel="prev">
          <span class="pager-dir">Previous</span><span class="pager-title">${displayTitle(previous.title, previous.kind)}</span>
        </a>`
      : html`<span></span>`}
    ${next
      ? html`<a class="pager-link pager-next" href="${basePath}/${next.slug}/" rel="next">
          <span class="pager-dir">Next</span><span class="pager-title">${displayTitle(next.title, next.kind)}</span>
        </a>`
      : html`<span></span>`}
  </nav>`;
}

/**
 * A painting: one large plate, its facts in the margin, then anything else the
 * source page held. A collaboration reuses the same shell but leans on the
 * editorial body, which is where its real content lives.
 */
export function detail({ project, previous, next, basePath, backLabel, backHref }: DetailProps): Html {
  const [plate, ...rest] = project.images;
  const isWork = project.kind === 'work';

  // For a painting the first image is the plate and the body would repeat it,
  // so drop the row that contained it. Collaborations keep their full body.
  const bodyRows = isWork
    ? project.rows.filter((row) => !row.columns.some((c) => c.kind === 'images' && c.images.some((i) => i.id === plate?.id)))
    : project.rows;

  return html`<article class="detail ${isWork ? 'detail-work' : 'detail-project'}">
    <a class="detail-back" href="${backHref}">${backLabel}</a>

    <header class="detail-head">
      <h1 class="detail-title">${displayTitle(project.title, project.kind)}</h1>
    </header>

    <div class="detail-main">
      ${plate && isWork
        ? html`<figure class="plate">
            ${responsiveImage({
              image: plate,
              sizes: '(max-width: 900px) 94vw, 52vw',
              priority: true,
              alt: describeImage(project, plate.alt),
            })}
            ${plate.caption ? html`<figcaption>${plate.caption}</figcaption>` : ''}
          </figure>`
        : ''}
      ${bodyRows.length ? editorialBody(bodyRows, { eagerRows: isWork ? 0 : 1 }) : ''}
    </div>

    <aside class="detail-aside">${factList(project)}</aside>

    ${isWork && rest.length
      ? html`<div class="plate-extra">
          ${join(
            rest.map(
              (image) => html`<figure class="figure reveal">
                ${responsiveImage({ image, sizes: '(max-width: 900px) 94vw, 46vw' })}
                ${image.caption ? html`<figcaption>${image.caption}</figcaption>` : ''}
              </figure>`,
            ),
          )}
        </div>`
      : ''}

    ${pager(previous, next, basePath)}
  </article>`;
}
