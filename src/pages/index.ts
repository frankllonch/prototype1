import { html, type Html } from '../components/html.ts';
import { layout } from '../components/layout.ts';
import { gallery, zoomControl, yearIndicator } from '../components/gallery.ts';
import { detail } from '../components/detail.ts';
import {
  collaborationsSection, colourChartSection,
  editorialSection, exhibitionPanels, exhibitionsSection, inquiriesSection,
} from '../components/sections.ts';
import { displayTitle } from '../content/title.ts';
import { splitAbout, splitExhibitions } from '../content/sections.ts';
import { dict, localePath, type Locale } from '../content/i18n.ts';
import type { Project } from '../content/types.ts';

export interface HomeProps {
  readonly artwork: readonly Project[];
  readonly collaborations: readonly Project[];
  readonly about?: Project;
  readonly colourChart?: Project;
  readonly exhibitionsPage?: Project;
  readonly locale: Locale;
}

/**
 * The whole site except the artwork, on one page.
 *
 * Six sections in one continuous scroll; the navigation moves between them rather
 * than loading anything. Artwork is the only thing that gets its own page, because
 * it is the only thing that needs one.
 */
export function homePage({
  artwork, collaborations, about, colourChart, exhibitionsPage, locale,
}: HomeProps): Html {
  const t = dict(locale);
  const aboutContent = splitAbout(about);
  const exhibitions = splitExhibitions(exhibitionsPage);

  return layout({
    title: 'Claudia Valsells',
    locale,
    path: '/',
    description: t.home.tagline,
    children: html`
      <section class="hero">
        <h1 class="hero-name" data-scramble>Claudia Valsells</h1>
        <p class="hero-line">
          ${t.home.tagline}
          <a class="hero-enter" href="${localePath(locale, '/artwork/')}">
            ${t.home.enterArtwork(artwork.length)} →
          </a>
        </p>
      </section>

      ${editorialSection(collaborations.slice(0, 3), locale, t)}
      ${exhibitionsSection(exhibitions, t)}
      ${collaborationsSection(collaborations, locale, t)}
      ${colourChartSection(colourChart, t)}
      ${inquiriesSection(aboutContent, t)}
      ${exhibitionPanels(exhibitions, t)}
    `,
  });
}

/** The artwork index — the one separate page. */
export function artworkPage(items: readonly Project[], years: readonly number[], locale: Locale): Html {
  const t = dict(locale);
  const intro = t.pages.artworkIntro(items.length, years[years.length - 1]!, years[0]!);
  return layout({
    title: t.pages.artwork,
    locale,
    path: '/artwork/',
    description: intro,
    active: 'artwork',
    children: html`
      <section class="page-head">
        <h1 data-scramble>${t.pages.artwork}</h1>
        <p class="page-intro">${intro}</p>
        ${zoomControl(t)}
      </section>
      ${gallery({ items, basePath: '/artwork', locale, t, trackYears: true, lightbox: true })}
      ${yearIndicator()}
    `,
  });
}

export interface DetailPageProps {
  readonly project: Project;
  readonly previous?: Project;
  readonly next?: Project;
  readonly basePath: string;
  readonly active: string;
  readonly locale: Locale;
}

export function detailPage(props: DetailPageProps): Html {
  const { project, basePath, locale, active } = props;
  const t = dict(locale);
  return layout({
    title: displayTitle(project.title, project.kind, locale),
    locale,
    path: `${basePath}/${project.slug}/`,
    active,
    description: project.description ?? '',
    children: detail({
      ...props,
      t,
      backLabel: project.kind === 'work' ? t.detail.allWorks : t.detail.allProjects,
      backHref: project.kind === 'work' ? localePath(locale, '/artwork/') : localePath(locale, '/#collaborations'),
      linkBase: localePath(locale, basePath),
    }),
  });
}
