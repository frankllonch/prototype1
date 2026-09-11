import { html, join, type Html } from '../components/html.ts';
import { layout } from '../components/layout.ts';
import { gallery } from '../components/gallery.ts';
import { responsiveImage } from '../components/image.ts';
import { editorialBody, editorialSpread } from '../components/editorial.ts';
import { detail } from '../components/detail.ts';
import { displayTitle } from '../content/title.ts';
import type { Project } from '../content/types.ts';

/** First sentence or two of a project's text, used as a standfirst. */
const standfirst = (project: Project | undefined, max = 280): string => {
  const text = project?.description ?? '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
};

export interface HomeProps {
  readonly works: readonly Project[];
  readonly collaborations: readonly Project[];
  readonly about?: Project;
  readonly workCount: number;
}

export function homePage({ works, collaborations, about, workCount }: HomeProps): Html {
  const hero = works[0]?.cover;
  const recent = works.slice(0, 12);
  const featured = collaborations.slice(0, 3);

  return layout({
    title: 'Claudia Valsells',
    description: standfirst(about, 160),
    children: html`
      <section class="hero">
        <h1 class="hero-name"><span>Claudia</span><span>Valsells</span></h1>
        ${hero
          ? html`<div class="hero-plate">
              ${responsiveImage({ image: hero, sizes: '(max-width: 900px) 92vw, 48vw', priority: true })}
            </div>`
          : ''}
        <p class="hero-line">
          An artist working with colour as material, language and subject.
          <a href="/works/">${workCount} works</a>, 1996 to now.
        </p>
      </section>

      <section class="strip">
        <div class="strip-head">
          <h2>Recent work</h2>
          <a class="more" href="/works/">All works →</a>
        </div>
        ${gallery({ items: recent, basePath: '/works', eagerCount: 3 })}
      </section>

      <section class="strip">
        <div class="strip-head">
          <h2>Projects</h2>
          <a class="more" href="/editorial/">Read as editorial →</a>
        </div>
        <ul class="teasers">
          ${join(
            featured.map(
              (project) => html`<li class="teaser">
                <a href="/projects/${project.slug}/" data-cursor-title="${displayTitle(project.title, project.kind)}">
                  ${project.cover
                    ? responsiveImage({ image: project.cover, sizes: '(max-width: 900px) 92vw, 30vw' })
                    : ''}
                  <h3>${displayTitle(project.title, project.kind)}</h3>
                  <p>${standfirst(project, 150)}</p>
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
  readonly groupByYear?: boolean;
  readonly filters?: Html;
}

export function galleryPage({
  title, active, intro, items, basePath, groupByYear = false, filters,
}: GalleryPageProps): Html {
  return layout({
    title,
    description: intro,
    active,
    children: html`
      <section class="page-head">
        <h1>${title}</h1>
        <p class="page-intro">${intro}</p>
        ${filters ?? ''}
      </section>
      ${gallery({ items, basePath, groupByYear })}
    `,
  });
}

/** The flowing section: every collaboration read end to end, as a publication. */
export function editorialPage(projects: readonly Project[]): Html {
  return layout({
    title: 'Editorial',
    active: 'editorial',
    description: 'Claudia Valsells’ projects and collaborations, read as a single publication.',
    children: html`
      <section class="page-head page-head-editorial">
        <h1>Editorial</h1>
        <p class="page-intro">
          Every project, read end to end. ${projects.length} chapters — colour charts, residencies,
          collaborations and editions — in the order they were made.
        </p>
        <ol class="contents">
          ${join(
            projects.map(
              (p, i) => html`<li>
                <a href="#${p.slug}">
                  <span class="contents-num">${String(i + 1).padStart(2, '0')}</span>
                  <span class="contents-title">${displayTitle(p.title, p.kind)}</span>
                  <span class="contents-year">${p.metadata.year ?? ''}</span>
                </a>
              </li>`,
            ),
          )}
        </ol>
      </section>
      <div class="publication">
        ${join(projects.map((p, i) => editorialSpread(p, i)))}
      </div>
    `,
  });
}

/** About / Colour Chart / Exhibitions — long-form pages from the source site. */
export function longformPage(project: Project, active: string): Html {
  return layout({
    title: project.title,
    active,
    description: project.description ?? '',
    children: html`
      <section class="page-head">
        <h1>${project.title}</h1>
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
  readonly backLabel: string;
  readonly backHref: string;
  readonly active: string;
}

export function detailPage(props: DetailPageProps): Html {
  return layout({
    title: displayTitle(props.project.title, props.project.kind),
    active: props.active,
    description: props.project.description ?? '',
    children: detail(props),
  });
}
