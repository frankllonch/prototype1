import type { Html } from '../components/html.ts';
import { layout } from '../components/layout.ts';
import { detail } from '../components/detail.ts';
import { displayTitle } from '../content/title.ts';
import { dict, localePath, type Dictionary, type Locale } from '../content/i18n.ts';
import type { Project } from '../content/types.ts';

interface DetailPageProps {
  readonly project: Project;
  readonly previous?: Project;
  readonly next?: Project;
  /** Locale-less route prefix, e.g. `/artwork`. */
  readonly basePath: string;
  readonly active: keyof Dictionary['nav'];
  readonly locale: Locale;
}

/** One painting or one collaboration, reachable by its own URL. */
export function detailPage({ project, previous, next, basePath, active, locale }: DetailPageProps): Html {
  const t = dict(locale);
  const isWork = project.kind === 'work';
  return layout({
    title: displayTitle(project.title, project.kind, locale),
    locale,
    path: `${basePath}/${project.slug}/`,
    active,
    description: project.description ?? '',
    children: detail({
      project,
      ...(previous ? { previous } : {}),
      ...(next ? { next } : {}),
      locale,
      t,
      backLabel: isWork ? t.detail.allWorks : t.detail.allProjects,
      backHref: localePath(locale, isWork ? '/artwork/' : '/#collaborations'),
      linkBase: localePath(locale, basePath),
    }),
  });
}
