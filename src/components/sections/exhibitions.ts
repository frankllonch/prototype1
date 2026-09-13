import { html, join, raw, type Html } from '../html.ts';
import { responsiveImage } from '../image.ts';
import { slider } from '../slider.ts';
import { band } from './band.ts';
import type { Exhibition } from '../../content/sections.ts';
import type { Dictionary } from '../../content/i18n.ts';

/** Exhibitions: an index first, so you choose which one to read. */
export function exhibitionsSection(exhibitions: readonly Exhibition[], t: Dictionary): Html {
  return band('exhibitions', t.nav.exhibitions, t.pages.exhibitionsIntro, html`
    <ul class="index-grid">
      ${join(
        exhibitions.map(
          (exhibition) => html`<li class="index-card">
            <a href="#exhibition-${exhibition.slug}" data-panel-open="exhibition-${exhibition.slug}"
               data-cursor-title="${exhibition.title}">
              ${exhibition.cover
                ? responsiveImage({ image: exhibition.cover, sizes: '(max-width: 700px) 92vw, 30vw' })
                : ''}
              <span class="index-meta">
                <span class="index-title">${exhibition.title}</span>
                <span class="index-year">${exhibition.year ?? ''}</span>
              </span>
            </a>
          </li>`,
        ),
      )}
    </ul>
  `);
}

/**
 * Exhibition bodies, rendered once into the page and raised as an overlay on
 * demand: the photographs in a slide-through, the text beneath. In the markup
 * rather than fetched, so opening one is instant and the text is present for
 * search engines and for readers without scripting, who reach it through the
 * plain `#exhibition-…` anchor.
 */
export function exhibitionPanels(exhibitions: readonly Exhibition[], t: Dictionary): Html {
  return html`<div class="panels">
    ${join(
      exhibitions.map(
        (exhibition) => html`<article class="panel" id="exhibition-${exhibition.slug}" data-panel>
          <header class="panel-head">
            <h3 class="panel-title">${exhibition.title}</h3>
            ${exhibition.year ? html`<span class="panel-year">${exhibition.year}</span>` : ''}
            <a class="panel-close" href="#" data-panel-close>${t.nav.close}</a>
          </header>
          ${slider({ images: exhibition.images, counter: t.detail.counter, previous: t.detail.previous, next: t.detail.next })}
          <div class="panel-text">
            ${join(exhibition.rows.flatMap((row) => row.columns)
              .filter((column) => column.kind === 'text')
              .map((column) => html`<div class="prose">${raw(column.kind === 'text' ? column.html : '')}</div>`))}
          </div>
        </article>`,
      ),
    )}
  </div>`;
}
