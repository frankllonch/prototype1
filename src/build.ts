/**
 * Renders the site to dist/, once per locale.
 *
 * Two locations only: the homepage, which carries every section, and the artwork
 * page. Detail pages hang off those — one per painting, one per collaboration.
 */
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import type { Html } from './components/html.ts';
import { collaborations, findPage, works, workYears } from './content/load.ts';
import { DEFAULT_LOCALE, LOCALES, localeDir, type Locale } from './content/i18n.ts';
import { BASE } from './content/paths.ts';
import { homePage } from './pages/home.ts';
import { artworkPage } from './pages/artwork.ts';
import { detailPage } from './pages/detail.ts';
import type { Project } from './content/types.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

let pagesWritten = 0;

async function writePage(route: string, page: Html) {
  const dir = path.join(DIST, route);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), page.__html);
  pagesWritten++;
}

/** src/styles/*.css, concatenated in name order. Font URLs pick up the base path. */
async function buildStyles() {
  const dir = path.join(SRC, 'styles');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.css')).sort();
  const css = await Promise.all(files.map((f) => readFile(path.join(dir, f), 'utf8')));
  const joined = css.join('\n');
  await writeFile(path.join(DIST, 'site.css'), BASE ? joined.replaceAll("url('/fonts/", `url('${BASE}/fonts/`) : joined);
  await cp(path.join(SRC, 'assets', 'fonts'), path.join(DIST, 'fonts'), { recursive: true });
}

/**
 * src/client/*.ts → dist/js/*.js, one for one. They are ES modules and the
 * browser loads them as such; the only build step is stripping the types.
 */
async function buildClient() {
  const dir = path.join(SRC, 'client');
  const out = path.join(DIST, 'js');
  await mkdir(out, { recursive: true });
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.ts'))) {
    const source = await readFile(path.join(dir, file), 'utf8');
    const { outputText } = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        rewriteRelativeImportExtensions: true,
      },
    });
    await writeFile(path.join(out, file.replace(/\.ts$/, '.js')), outputText);
  }
}

async function buildLocale(locale: Locale) {
  const route = (p: string) => localeDir(locale, p).replace(/^\/|\/$/g, '');

  await writePage(route('/'), homePage({
    collaborations,
    about: findPage('about'),
    colourChart: findPage('colour-chart'),
    exhibitionsPage: findPage('whats-color-exhibitions'),
    locale,
  }));
  await writePage(route('/artwork/'), artworkPage(works, workYears, locale));

  const sets: ReadonlyArray<{ items: readonly Project[]; basePath: string; active: 'artwork' | 'collaborations' }> = [
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
  // Everything but dist/media, which holds 370 rendered images and is rebuilt
  // only by `npm run images`.
  const generated = ['site.css', 'site.js', 'js', 'fonts', 'index.html', 'artwork', 'collaborations',
    ...LOCALES.filter((l) => l !== DEFAULT_LOCALE)];
  for (const entry of generated) {
    const target = path.join(DIST, entry);
    if (existsSync(target)) await rm(target, { recursive: true, force: true });
  }
  await mkdir(DIST, { recursive: true });

  await Promise.all([buildStyles(), buildClient()]);
  for (const locale of LOCALES) await buildLocale(locale);

  console.log(
    `Built ${pagesWritten} pages across ${LOCALES.length} locales (${LOCALES.join(', ')}): ` +
    `homepage + artwork index, ${works.length} artwork details, ${collaborations.length} collaboration details.` +
    (BASE ? `\nBase path: ${BASE}` : ''),
  );
}

await main();
