/**
 * Renders the site to dist/, once per locale.
 *
 * Two locations only: the homepage, which carries every section, and the artwork
 * page. Detail pages hang off those — one per painting, one per collaboration.
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import type { Html } from './components/html.ts';
import { collaborations, findEditorial, works, workYears } from './content/load.ts';
import { DEFAULT_LOCALE, LOCALES, localeDir, type Locale } from './content/i18n.ts';
import { BASE } from './content/paths.ts';
import { artworkPage, detailPage, homePage } from './pages/index.ts';
import type { Project } from './content/types.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');

let pagesWritten = 0;

async function writePage(route: string, page: Html) {
  const dir = path.join(DIST, route);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), page.__html);
  pagesWritten++;
}

async function buildAssets() {
  await mkdir(DIST, { recursive: true });
  const css = await readFile(path.join(ROOT, 'src', 'assets', 'site.css'), 'utf8');
  await writeFile(path.join(DIST, 'site.css'), BASE ? css.replaceAll("url('/fonts/", `url('${BASE}/fonts/`) : css);
  await cp(path.join(ROOT, 'src', 'assets', 'fonts'), path.join(DIST, 'fonts'), { recursive: true });

  const source = await readFile(path.join(ROOT, 'src', 'assets', 'site.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  await writeFile(path.join(DIST, 'site.js'), outputText);
}

async function buildLocale(locale: Locale) {
  const route = (p: string) => localeDir(locale, p).replace(/^\/|\/$/g, '');

  await writePage(route('/'), homePage({
    artwork: works,
    collaborations,
    about: findEditorial('about'),
    colourChart: findEditorial('colour-chart'),
    exhibitionsPage: findEditorial('whats-color-exhibitions'),
    locale,
  }));

  await writePage(route('/artwork/'), artworkPage(works, workYears, locale));

  const sets: ReadonlyArray<{ items: readonly Project[]; basePath: string; active: string }> = [
    { items: works, basePath: '/artwork', active: 'artwork' },
    { items: collaborations, basePath: '/collaborations', active: 'collaborations' },
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
  const generated = ['site.css', 'site.js', 'fonts', 'index.html', 'artwork', 'collaborations',
    // Routes from the previous structure, removed now that everything is one page.
    'works', 'projects', 'editorial', 'about', 'colour-chart', 'exhibitions',
    ...LOCALES.filter((l) => l !== DEFAULT_LOCALE)];
  for (const entry of generated) {
    const target = path.join(DIST, entry);
    if (existsSync(target)) await rm(target, { recursive: true, force: true });
  }

  await buildAssets();
  for (const locale of LOCALES) await buildLocale(locale);

  console.log(
    `Built ${pagesWritten} pages across ${LOCALES.length} locales (${LOCALES.join(', ')}): ` +
    `homepage + artwork index, ${works.length} artwork details, ${collaborations.length} collaboration details.` +
    (BASE ? `\nBase path: ${BASE}` : ''),
  );
}

await main();
