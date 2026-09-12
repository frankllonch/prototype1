import { html, join, type Html } from '../components/html.ts';
import { layout } from '../components/layout.ts';
import { gallery, yearIndicator, zoomControl } from '../components/gallery.ts';
import { responsiveImage } from '../components/image.ts';
import { editorialBody, editorialSpread } from '../components/editorial.ts';
import { detail } from '../components/detail.ts';
import { displayTitle } from '../content/title.ts';
import { dict, localePath, type Locale } from '../content/i18n.ts';
import type { Project } from '../content/types.ts';

/** First sentence or two of a project's text, used as a standfirst. */
const standfirst = (project: Project | undefined, max = 220): string => {
  const text = project?.description ?? '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
};

export interface HomeProps {
  readonly works: readonly Project[];
  readonly collaborations: readonly Project[];
  readonly about?: Project;
  readonly locale: Locale;
}

export function homePage({ works, collaborations, about, locale }: HomeProps): Html {
  const t = dict(locale);
  const recent = works.slice(0, 18);
  const featured = collaborations.slice(0, 3);

  return layout({
    title: 'Claudia Valsells',
    locale,
    path: '/',
    description: t.home.tagline,
    children: html`
      <section class="hero">
        <h1 class="hero-name" data-scramble>Claudia Valsells</h1>
      </section>

      <section class="strip">
        <div class="strip-head">
          <h2>${t.home.recentWork}</h2>
          <a class="more" href="${localePath(locale, '/works/')}">${t.home.allWorks} →</a>
        </div>
        ${gallery({ items: recent, basePath: '/works', locale, t, eagerCount: 18 })}
      </section>

      <section class="strip">
        <div class="strip-head">
          <h2>${t.home.projects}</h2>
          <a class="more" href="${localePath(locale, '/editorial/')}">${t.home.readEditorial} →</a>
        </div>
        <ul class="teasers">
          ${join(
            featured.map(
              (project) => html`<li class="teaser">
                <a href="${localePath(locale, `/projects/${project.slug}/`)}"
                   data-cursor-title="${displayTitle(project.title, project.kind, locale)}">
                  ${project.cover
                    ? responsiveImage({ image: project.cover, sizes: '(max-width: 900px) 92vw, 30vw' })
                    : ''}
                  <h3>${displayTitle(project.title, project.kind, locale)}</h3>
                  <p>${standfirst(project, 130)}</p>
                </a>
              </li>`,
            ),
          )}
        </ul>
      </section>
    `,
  });
}

export interface GalleryPageProps {
  readonly title: string;
  readonly active: string;
  readonly intro: string;
  readonly items: readonly Project[];
  readonly basePath: string;
  readonly path: string;
  readonly locale: Locale;
  readonly trackYears?: boolean;
  readonly lightbox?: boolean;
  readonly withZoom?: boolean;
}

export function galleryPage({
  title, active, intro, items, basePath, path, locale,
  trackYears = false, lightbox = false, withZoom = false,
}: GalleryPageProps): Html {
  const t = dict(locale);
  return layout({
    title, locale, path, description: intro, active,
    children: html`
      <section class="page-head">
        <h1 data-scramble>${title}</h1>
        <p class="page-intro">${intro}</p>
        ${withZoom ? zoomControl(t) : ''}
      </section>
      ${gallery({ items, basePath, locale, t, trackYears, lightbox })}
      ${trackYears ? yearIndicator() : ''}
    `,
  });
}

/** The flowing section: every collaboration read end to end, as a publication. */
export function editorialPage(projects: readonly Project[], locale: Locale): Html {
  const t = dict(locale);
  return layout({
    title: t.pages.editorial,
    locale,
    path: '/editorial/',
    active: 'editorial',
    description: t.pages.editorialIntro(projects.length),
    children: html`
      <section class="page-head">
        <h1>${t.pages.editorial}</h1>
        <p class="page-intro">${t.pages.editorialIntro(projects.length)}</p>
        <ol class="contents">
          ${join(
            projects.map(
              (p, i) => html`<li>
                <a href="#${p.slug}">
                  <span class="contents-num">${String(i + 1).padStart(2, '0')}</span>
                  <span class="contents-title">${displayTitle(p.title, p.kind, locale)}</span>
                  <span class="contents-year">${p.metadata.year ?? ''}</span>
                </a>
              </li>`,
            ),
          )}
        </ol>
      </section>
      <div class="publication">
        ${join(projects.map((p, i) => editorialSpread(p, i, locale)))}
      </div>
    `,
  });
}

/** About / Colour Chart / Exhibitions — long-form pages from the source site. */
export function longformPage(project: Project, active: string, path: string, locale: Locale): Html {
  const t = dict(locale);
  return layout({
    title: project.title,
    locale,
    path,
    active,
    description: project.description ?? '',
    children: html`
      <section class="page-head">
        <h1>${project.title}</h1>
        ${t.untranslated ? html`<p class="untranslated">${t.untranslated}</p>` : ''}
      </section>
      <div class="longform">${editorialBody(project.rows, { eagerRows: 1 })}</div>
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
      backHref: localePath(locale, `${basePath}/`),
      linkBase: localePath(locale, basePath),
    }),
  });
}
