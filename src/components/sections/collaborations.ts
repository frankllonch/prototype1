import { html, join, raw, type Html } from '../html.ts';
import { gallery } from '../gallery.ts';
import { slider } from '../slider.ts';
import { band } from './band.ts';
import { displayTitle } from '../../content/title.ts';
import { localePath, type Dictionary, type Locale } from '../../content/i18n.ts';
import type { Project } from '../../content/types.ts';

/**
 * Collaborations, as the same contact sheet the artwork uses — equal-area tiles,
 * the same entry, the same cursor. A tile opens its collaboration as a panel over
 * the page, the way an exhibition does; its href is still the project's own page,
 * for direct links and for readers without scripting.
 */
export function collaborationsSection(projects: readonly Project[], locale: Locale, t: Dictionary): Html {
  return band('collaborations', t.nav.collaborations, t.pages.collaborationsIntro,
    gallery({ items: projects, basePath: '/collaborations', locale, t, panels: 'collaboration', eagerCount: projects.length }));
}

/**
 * Collaboration bodies, rendered once into the page and raised on demand:
 * the photographs in a slide-through, the text beneath — the same shape as an
 * exhibition, so the two read as one system.
 */
export function collaborationPanels(projects: readonly Project[], locale: Locale, t: Dictionary): Html {
  return html`<div class="panels">
    ${join(
      projects.map((project) => {
        const name = displayTitle(project.title, project.kind, locale);
        const text = project.rows.flatMap((row) => row.columns).filter((column) => column.kind === 'text');
        return html`<article class="panel" id="collaboration-${project.slug}" data-panel>
          <header class="panel-head">
            <h3 class="panel-title">${name}</h3>
            ${project.metadata.year ? html`<span class="panel-year">${project.metadata.year}</span>` : ''}
            <a class="panel-close" href="#" data-panel-close>${t.nav.close}</a>
          </header>
          ${slider({ images: project.images, counter: t.detail.counter, previous: t.detail.previous, next: t.detail.next })}
          <div class="panel-text">
            ${join(text.map((column) => html`<div class="prose">${raw(column.kind === 'text' ? column.html : '')}</div>`))}
            <p class="panel-permalink"><a href="${localePath(locale, `/collaborations/${project.slug}/`)}">${t.detail.permalink} →</a></p>
          </div>
        </article>`;
      }),
    )}
  </div>`;
}
