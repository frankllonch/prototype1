/**
 * Renders the whole site to dist/, once per locale.
 *
 * Every route is a pure function of (dataset, locale), so the build is
 * deterministic: same content in, byte-identical pages out.
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import type { Html } from './components/html.ts';
import { collaborations, findEditorial, works, workYears } from './content/load.ts';
import { DEFAULT_LOCALE, LOCALES, dict, localeDir, type Locale } from './content/i18n.ts';
import { BASE } from './content/paths.ts';
import { detailPage, editorialPage, galleryPage, homePage, longformPage } from './pages/index.ts';
import type { Project } from './content/types.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');

let pagesWritten = 0;

/** `route` is locale-prefixed already; '' is that locale's home page. */
async function writePage(route: string, page: Html) {
  const dir = path.join(DIST, route);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), page.__html);
  pagesWritten++;
}

async function buildAssets() {
  await mkdir(DIST, { recursive: true });
  // The stylesheet references /fonts/ directly, so it needs the same prefix.
  const css = await readFile(path.join(ROOT, 'src', 'assets', 'site.css'), 'utf8');
  await writeFile(path.join(DIST, 'site.css'), BASE ? css.replaceAll("url('/fonts/", `url('${BASE}/fonts/`) : css);
  await cp(path.join(ROOT, 'src', 'assets', 'fonts'), path.join(DIST, 'fonts'), { recursive: true });

  // The browser bundle is authored in TypeScript and type-stripped here; it has
  // no imports, so transpiling the single module is its entire build step.
  const source = await readFile(path.join(ROOT, 'src', 'assets', 'site.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  await writeFile(path.join(DIST, 'site.js'), outputText);
}

const LONGFORM: ReadonlyArray<{ slug: string; route: string; active: string }> = [
  { slug: 'about', route: '/about/', active: 'about' },
  { slug: 'colour-chart', route: '/colour-chart/', active: 'colourChart' },
  { slug: 'whats-color-exhibitions', route: '/exhibitions/', active: 'exhibitions' },
];

async function buildLocale(locale: Locale) {
  const t = dict(locale);
  /** dist-relative directory for a site path, e.g. '/works/' -> 'ca/works'. */
  const route = (p: string) => localeDir(locale, p).replace(/^\/|\/$/g, '');

  await writePage(route('/'), homePage({ works, collaborations, about: findEditorial('about'), locale }));

  await writePage(route('/works/'), galleryPage({
    title: t.pages.works,
    active: 'works',
    intro: t.pages.worksIntro(works.length, workYears[workYears.length - 1]!, workYears[0]!),
    items: works,
    basePath: '/works',
    path: '/works/',
    locale,
    groupByYear: true,
    withZoom: true,
  }));

  await writePage(route('/projects/'), galleryPage({
    title: t.pages.projects,
    active: 'projects',
    intro: t.pages.projectsIntro,
    items: collaborations,
    basePath: '/projects',
    path: '/projects/',
    locale,
  }));

  await writePage(route('/editorial/'), editorialPage(collaborations, locale));

  for (const { slug, route: r, active } of LONGFORM) {
    const page = findEditorial(slug);
    if (page) await writePage(route(r), longformPage(page, active, r, locale));
  }

  const sets: ReadonlyArray<{ items: readonly Project[]; basePath: string; active: string }> = [
    { items: works, basePath: '/works', active: 'works' },
    { items: collaborations, basePath: '/projects', active: 'projects' },
  ];

  for (const { items, basePath, active } of sets) {
    for (const [i, project] of items.entries()) {
      await writePage(route(`${basePath}/${project.slug}/`), detailPage({
        project,
        ...(items[i - 1] ? { previous: items[i - 1] } : {}),
        ...(items[i + 1] ? { next: items[i + 1] } : {}),
        basePath,
        active,
        locale,
      }));
    }
  }
}

async function main() {
  // Keep dist/media: re-rendering 370 images on every build would be absurd.
  const generated = ['site.css', 'site.js', 'fonts', 'index.html', 'works', 'projects',
    'editorial', 'about', 'colour-chart', 'exhibitions', ...LOCALES.filter((l) => l !== DEFAULT_LOCALE)];
  for (const entry of generated) {
    const target = path.join(DIST, entry);
    if (existsSync(target)) await rm(target, { recursive: true, force: true });
  }

  await buildAssets();
  for (const locale of LOCALES) await buildLocale(locale);

  console.log(
    `Built ${pagesWritten} pages across ${LOCALES.length} locales (${LOCALES.join(', ')}): ` +
    `${works.length} works, ${collaborations.length} projects, ${LONGFORM.length} long-form, ` +
    `plus home, two gallery indexes and the editorial flow — each in ${LOCALES.length} languages.` +
    (BASE ? `\nBase path: ${BASE}` : ''),
  );
}

await main();
