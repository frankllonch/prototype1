/**
 * Renders the whole site to dist/ as static HTML.
 *
 * Every route is a pure function of the dataset, so the build is deterministic:
 * same content in, byte-identical pages out.
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { html, join, type Html } from './components/html.ts';
import {
  availableWorks, collaborations, editorialPages, findEditorial, works, workYears,
} from './content/load.ts';
import { detailPage, editorialPage, galleryPage, homePage, longformPage } from './pages/index.ts';
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

/**
 * Filters are a progressive enhancement: without JavaScript the gallery still
 * shows every work, grouped under sticky year markers, so nothing is gated
 * behind script. With JavaScript these narrow the view in place.
 */
function yearFilters(): Html {
  return html`<div class="filters" role="group" aria-label="Filter works">
    <button type="button" class="filter is-active" data-filter="all" aria-pressed="true">All</button>
    <button type="button" class="filter" data-filter="available" aria-pressed="false">
      Available (${availableWorks.length})
    </button>
    ${join(workYears.map((year) =>
      html`<button type="button" class="filter" data-filter="${year}" aria-pressed="false">${year}</button>`))}
  </div>`;
}

async function buildAssets() {
  await mkdir(DIST, { recursive: true });
  await cp(path.join(ROOT, 'src', 'assets', 'site.css'), path.join(DIST, 'site.css'));
  await cp(path.join(ROOT, 'src', 'assets', 'fonts'), path.join(DIST, 'fonts'), { recursive: true });

  // The browser bundle is authored in TypeScript and type-stripped here; it has no
  // imports, so transpiling the single module is the entire build step it needs.
  const source = await readFile(path.join(ROOT, 'src', 'assets', 'site.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  await writeFile(path.join(DIST, 'site.js'), outputText);
}

async function main() {
  // Keep dist/media: re-rendering 370 images on every build would be absurd.
  for (const entry of ['site.css', 'site.js', 'fonts', 'index.html', 'works', 'projects', 'editorial', 'about', 'colour-chart', 'exhibitions']) {
    const target = path.join(DIST, entry);
    if (existsSync(target)) await rm(target, { recursive: true, force: true });
  }

  await buildAssets();

  const about = findEditorial('about');

  await writePage('', homePage({ works, collaborations, about, workCount: works.length }));

  await writePage('works', galleryPage({
    title: 'Works',
    active: 'works',
    intro: `${works.length} paintings, ${workYears[workYears.length - 1]}–${workYears[0]}. Colour as material, language and subject.`,
    items: works,
    basePath: '/works',
    groupByYear: true,
    filters: yearFilters(),
  }));

  await writePage('projects', galleryPage({
    title: 'Projects',
    active: 'projects',
    intro: 'Collaborations, commissions and colour work made with architects, designers and studios.',
    items: collaborations,
    basePath: '/projects',
  }));

  await writePage('editorial', editorialPage(collaborations));

  const longform: Array<[string, string, string]> = [
    ['about', 'about', 'about'],
    ['colour-chart', 'colour-chart', 'colour-chart'],
    ['whats-color-exhibitions', 'exhibitions', 'exhibitions'],
  ];
  for (const [slug, route, active] of longform) {
    const page = findEditorial(slug);
    if (page) await writePage(route, longformPage(page, active));
  }

  const details: Array<{ items: readonly Project[]; basePath: string; backLabel: string; active: string }> = [
    { items: works, basePath: '/works', backLabel: 'All works', active: 'works' },
    { items: collaborations, basePath: '/projects', backLabel: 'All projects', active: 'projects' },
  ];

  let detailCount = 0;
  for (const { items, basePath, backLabel, active } of details) {
    for (const [i, project] of items.entries()) {
      await writePage(`${basePath.slice(1)}/${project.slug}`, detailPage({
        project,
        ...(items[i - 1] ? { previous: items[i - 1] } : {}),
        ...(items[i + 1] ? { next: items[i + 1] } : {}),
        basePath,
        backLabel,
        backHref: `${basePath}/`,
        active,
      }));
      detailCount++;
    }
  }

  console.log(
    `Built ${pagesWritten} pages: ${works.length} works, ${collaborations.length} projects, ` +
    `${longform.length} long-form, plus home, two gallery indexes and the editorial flow.`,
  );
}

await main();
