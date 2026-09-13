import { html, join, raw, type Html } from './html.ts';
import { rowsBody } from './rows.ts';
import { responsiveImage } from './image.ts';
import { slider } from './slider.ts';
import { describeImage } from '../content/describe.ts';
import { displayTitle } from '../content/title.ts';
import type { Dictionary, Locale } from '../content/i18n.ts';
import type { Project } from '../content/types.ts';

interface DetailProps {
  readonly project: Project;
  readonly previous?: Project;
  readonly next?: Project;
  readonly locale: Locale;
  readonly t: Dictionary;
  /** Locale-prefixed base for sibling links, e.g. `/ca/works`. */
  readonly linkBase: string;
  readonly backLabel: string;
  readonly backHref: string;
}

/** Only renders rows that the source page actually carries a value for. */
function factList(project: Project, t: Dictionary): Html {
  const { year, reference, dimensions, materials, location, client, credits, available } = project.metadata;
  const facts: Array<[string, string]> = [];
  if (year) facts.push([t.facts.year, String(year)]);
  if (dimensions) facts.push([t.facts.dimensions, dimensions]);
  if (materials) facts.push([t.facts.medium, materials]);
  if (location) facts.push([t.facts.location, location]);
  if (client) facts.push([t.facts.client, client]);
  if (credits?.length) facts.push([t.facts.credits, credits.join(', ')]);
  if (reference) facts.push([t.facts.reference, reference]);
  if (available) facts.push([t.facts.status, t.facts.availableValue]);
  if (!facts.length) return html``;

  return html`<dl class="facts">
    ${join(facts.map(([term, value]) => html`<div><dt>${term}</dt><dd>${value}</dd></div>`))}
  </dl>`;
}

function pager(
  previous: Project | undefined, next: Project | undefined,
  linkBase: string, locale: Locale, t: Dictionary,
): Html {
  if (!previous && !next) return html``;
  return html`<nav class="pager" aria-label="${t.detail.previous} / ${t.detail.next}">
    ${previous
      ? html`<a class="pager-link pager-prev" href="${linkBase}/${previous.slug}/" rel="prev">
          <span class="pager-dir">${t.detail.previous}</span>
          <span class="pager-title">${displayTitle(previous.title, previous.kind, locale)}</span>
        </a>`
      : html`<span></span>`}
    ${next
      ? html`<a class="pager-link pager-next" href="${linkBase}/${next.slug}/" rel="next">
          <span class="pager-dir">${t.detail.next}</span>
          <span class="pager-title">${displayTitle(next.title, next.kind, locale)}</span>
        </a>`
      : html`<span></span>`}
  </nav>`;
}

/**
 * A collaboration: the photographs in a slide-through, then the text beneath —
 * the hierarchy the source site uses and the one the work deserves, since these
 * projects are photographed rather than written.
 */
function collaborationBody(project: Project, t: Dictionary): Html {
  const text = project.rows
    .flatMap((row) => row.columns)
    .filter((column) => column.kind === 'text');

  return html`<div class="collab">
    ${slider({ images: project.images, counter: t.detail.counter, previous: t.detail.previous, next: t.detail.next })}
    <div class="collab-text">
      ${join(text.map((column) => html`<div class="prose">${raw(column.kind === 'text' ? column.html : '')}</div>`))}
    </div>
  </div>`;
}

/**
 * A painting reads as a museum label: the plate holds the column, the facts sit
 * in the margin beside it. A collaboration uses the same shell but leads with
 * its imagery and puts the text underneath.
 */
export function detail({
  project, previous, next, locale, t, linkBase, backLabel, backHref,
}: DetailProps): Html {
  const [plate, ...rest] = project.images;
  const isWork = project.kind === 'work';

  // For a painting the first image is the plate and the body would repeat it,
  // so drop the row that contained it. Collaborations keep their full body.
  const bodyRows = isWork
    ? project.rows.filter(
        (row) => !row.columns.some((c) => c.kind === 'images' && c.images.some((i) => i.id === plate?.id)),
      )
    : project.rows;

  return html`<article class="detail ${isWork ? 'detail-work' : 'detail-project'}">
    <a class="detail-back" href="${backHref}">${backLabel}</a>

    <header class="detail-head">
      <h1 class="detail-title">${displayTitle(project.title, project.kind, locale)}</h1>
    </header>

    ${!isWork ? collaborationBody(project, t) : ''}

    <div class="detail-main">
      ${plate && isWork
        ? html`<figure class="plate">
            ${responsiveImage({
              image: plate,
              sizes: '(max-width: 900px) 94vw, 52vw',
              priority: true,
              alt: describeImage(project, plate.alt, locale),
            })}
            ${plate.caption ? html`<figcaption>${plate.caption}</figcaption>` : ''}
          </figure>`
        : ''}
      ${isWork && bodyRows.length ? rowsBody(bodyRows, { eagerRows: 0 }) : ''}
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
    </div>

    ${isWork ? html`<aside class="detail-aside">${factList(project, t)}</aside>` : ''}

    ${pager(previous, next, linkBase, locale, t)}
  </article>`;
}
