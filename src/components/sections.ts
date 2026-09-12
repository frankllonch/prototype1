import { html, join, raw, type Html } from './html.ts';
import { responsiveImage } from './image.ts';
import { gallery } from './gallery.ts';
import { editorialSpread } from './editorial.ts';
import { displayTitle } from '../content/title.ts';
import type { AboutContent, Exhibition } from '../content/sections.ts';
import { localePath, type Dictionary, type Locale } from '../content/i18n.ts';
import type { Project } from '../content/types.ts';

/** Every homepage section shares one shell so the rhythm stays identical. */
function section(id: string, title: string, intro: string | undefined, body: Html): Html {
  return html`<section class="band" id="${id}">
    <header class="band-head">
      <h2 class="band-title" data-scramble>${title}</h2>
      ${intro ? html`<p class="band-intro">${intro}</p>` : ''}
    </header>
    ${body}
  </section>`;
}

/**
 * About. The two studio photographs sit inside the text, immediately before the
 * sentence naming her gallery — the point where the biography turns from how she
 * works to where the work is shown.
 */
export function aboutSection(about: AboutContent, t: Dictionary): Html {
  return section('about', t.nav.about, undefined, html`
    <div class="about-columns">
      ${join(about.lead.map((block) => raw(block)))}
      ${about.images.length
        ? html`<div class="about-plates">
            ${join(
              about.images.map(
                (image) => html`<figure class="about-plate">
                  ${responsiveImage({ image, sizes: '(max-width: 700px) 45vw, 220px' })}
                </figure>`,
              ),
            )}
          </div>`
        : ''}
      ${join(about.rest.map((block) => raw(block)))}
    </div>
  `);
}

/** Editorial: projects read as a publication rather than browsed as a grid. */
export function editorialSection(projects: readonly Project[], locale: Locale, t: Dictionary): Html {
  return section('editorial', t.nav.editorial, t.pages.editorialIntro, html`
    <div class="publication">
      ${join(projects.map((p, i) => editorialSpread(p, i, locale, { maxImages: 6, readLabel: t.pages.enter })))}
    </div>
  `);
}

/** Exhibitions: an index first, so you choose which one to read. */
export function exhibitionsSection(exhibitions: readonly Exhibition[], t: Dictionary): Html {
  return section('exhibitions', t.nav.exhibitions, t.pages.exhibitionsIntro, html`
    <ul class="index-grid">
      ${join(
        exhibitions.map(
          (exhibition) => html`<li class="index-card">
            <a href="#exhibition-${exhibition.slug}" data-exhibition="${exhibition.slug}"
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

/** Collaborations: the contact sheet, linking to each project's own page. */
export function collaborationsSection(
  projects: readonly Project[], locale: Locale, t: Dictionary,
): Html {
  return section('collaborations', t.nav.collaborations, t.pages.collaborationsIntro, html`
    <ul class="index-grid">
      ${join(
        projects.map((project) => {
          const name = displayTitle(project.title, project.kind, locale);
          return html`<li class="index-card">
            <a href="${localePath(locale, `/collaborations/${project.slug}/`)}" data-cursor-title="${name}">
              ${project.cover
                ? responsiveImage({ image: project.cover, sizes: '(max-width: 700px) 92vw, 24vw' })
                : ''}
              <span class="index-meta">
                <span class="index-title">${name}</span>
                <span class="index-year">${project.metadata.year ?? ''}</span>
              </span>
            </a>
          </li>`;
        }),
      )}
    </ul>
  `);
}

export function colourChartSection(page: Project | undefined, t: Dictionary): Html {
  if (!page) return html``;
  const images = page.images.slice(0, 3);
  const text = page.rows
    .flatMap((r) => r.columns)
    .filter((c) => c.kind === 'text')
    .map((c) => (c.kind === 'text' ? c.html : ''))
    .join('');

  return section('colour-chart', t.nav.colourChart, t.pages.colourChartIntro, html`
    <div class="chart">
      <div class="chart-plates">
        ${join(
          images.map(
            (image) => html`<figure class="figure reveal">
              ${responsiveImage({ image, sizes: '(max-width: 700px) 92vw, 28vw' })}
            </figure>`,
          ),
        )}
      </div>
      <div class="chart-text prose reveal">${raw(text)}</div>
    </div>
  `);
}

export function inquiriesSection(about: AboutContent, t: Dictionary): Html {
  return section('inquiries', t.nav.inquiries, undefined, html`
    <div class="inquiries">
      ${about.inquiries ? html`<p class="inquiries-line">${about.inquiries}</p>` : ''}
      <ul class="inquiries-list">
        <li><span class="label">${t.footer.art}</span>
          <a href="mailto:editorial@alzuetagallery.com">editorial@alzuetagallery.com</a></li>
        <li><span class="label">${t.footer.other}</span>
          <a href="mailto:editorial@alzuetagallery.com">editorial@alzuetagallery.com</a></li>
        <li><span class="label">${t.footer.elsewhere}</span>
          <a href="https://instagram.com/claudiavalsells" rel="noopener">Instagram</a>,
          <a href="https://www.linkedin.com/" rel="noopener">LinkedIn</a></li>
        <li><span class="label">${t.footer.studio}</span> <span>${t.footer.city}</span></li>
      </ul>
    </div>
  `);
}

/**
 * Exhibition detail bodies, rendered once into the page and raised as an overlay
 * on demand. They sit in the markup rather than being fetched so that opening one
 * is instant and so the text is present for search engines and for readers
 * without scripting, who reach it through the plain `#exhibition-…` anchor.
 */
export function exhibitionPanels(exhibitions: readonly Exhibition[], t: Dictionary): Html {
  return html`<div class="panels">
    ${join(
      exhibitions.map(
        (exhibition) => html`<article class="panel" id="exhibition-${exhibition.slug}" data-panel>
          <header class="panel-head">
            <h3 class="panel-title">${exhibition.title}</h3>
            ${exhibition.year ? html`<span class="panel-year">${exhibition.year}</span>` : ''}
            <a class="panel-close" href="#exhibitions" data-panel-close>${t.nav.close}</a>
          </header>
          <div class="panel-body">
            ${join(
              exhibition.rows.map(
                (row) => html`<div class="panel-row">
                  ${join(
                    row.columns.map((column) =>
                      column.kind === 'text'
                        ? html`<div class="prose">${raw(column.html)}</div>`
                        : html`<div class="panel-images">
                            ${join(
                              column.images.map(
                                (image) => html`<figure class="figure">
                                  ${responsiveImage({ image, sizes: '(max-width: 900px) 92vw, 44vw' })}
                                </figure>`,
                              ),
                            )}
                          </div>`,
                    ),
                  )}
                </div>`,
              ),
            )}
          </div>
        </article>`,
      ),
    )}
  </div>`;
}
