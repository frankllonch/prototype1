import { html, join, raw, type Html } from './html.ts';
import { aboutPanel } from './sections/index.ts';
import { findPage } from '../content/load.ts';
import { splitAbout } from '../content/sections.ts';
import { DEFAULT_LOCALE, LOCALES, dict, localePath, type Dictionary, type Locale } from '../content/i18n.ts';
import { withBase } from '../content/paths.ts';

interface LayoutProps {
  readonly title: string;
  readonly locale: Locale;
  /** Locale-less route of this page, e.g. `/artwork/`, for hreflang and the switcher. */
  readonly path: string;
  readonly description?: string;
  /** Nav key of the current page, for `aria-current`. */
  readonly active?: keyof Dictionary['nav'];
  readonly children: Html;
}

interface NavItem {
  readonly key: keyof Dictionary['nav'];
  /** A homepage section id — the link scrolls there instead of loading a page. */
  readonly section?: string;
  /** A panel id — the link raises it over the current page. */
  readonly panel?: string;
  /** A real route. Only artwork has one. */
  readonly href?: string;
}

/*
 * One page and a list of places on it. Everything except the artwork lives on the
 * homepage, so these are anchors: with scripting they scroll or raise a panel,
 * without it the browser jumps to the same place. Nothing here loads a document.
 */
const NAV: readonly NavItem[] = [
  { key: 'artwork', href: '/artwork/' },
  { key: 'about', panel: 'about' },
  { key: 'exhibitions', section: 'exhibitions' },
  { key: 'collaborations', section: 'collaborations' },
  { key: 'colourChart', section: 'colour-chart' },
  { key: 'inquiries', section: 'inquiries' },
];

/** The browser modules, in load order. `index` imports the rest. */
const CLIENT_MODULES = ['env', 'text-roll', 'nav', 'gallery', 'slider', 'lightbox', 'panels', 'cursor', 'reveals', 'index'] as const;

function header(locale: Locale, t: Dictionary, path: string, active?: string): Html {
  const other = LOCALES.filter((l) => l !== locale);
  return html`<header class="site-header">
    <a class="wordmark" href="${localePath(locale, '/')}">Claudia Valsells</a>

    <nav class="site-nav" id="site-nav" aria-label="Primary">
      ${join(
        NAV.map((item) => {
          const href = item.href
            ? localePath(locale, item.href)
            : `${localePath(locale, '/')}#${item.section ?? item.panel}`;
          return html`<a
            href="${href}"
            ${item.section ? raw(`data-section="${item.section}"`) : ''}
            ${item.panel ? raw(`data-panel-open="${item.panel}"`) : ''}
            ${item.key === active ? raw('aria-current="page"') : ''}
          >${t.nav[item.key]}</a>`;
        }),
      )}
    </nav>

    <div class="header-end">
      ${join(
        other.map(
          (l) => html`<a class="header-link lang-switch" href="${localePath(l, path)}" lang="${dict(l).htmlLang}"
            >${dict(l).localeName}</a>`,
        ),
      )}
    </div>

    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
      ${t.nav.menu}
    </button>
  </header>`;
}

/**
 * The lightbox shell. Empty until opened: it is filled from the tile that was
 * clicked, whose markup already carries the srcset and every field the caption
 * needs.
 */
function lightbox(t: Dictionary): Html {
  return html`<div class="lightbox" data-lightbox data-available-label="${t.facts.availableValue}" hidden>
    <div class="lightbox-veil" data-lightbox-veil></div>
    <button type="button" class="lightbox-close" data-lightbox-close>${t.nav.close}</button>
    <button type="button" class="lightbox-nav lightbox-prev" data-lightbox-prev aria-label="${t.detail.previous}"></button>
    <div class="lightbox-plate" data-lightbox-plate></div>
    <div class="lightbox-caption">
      <h2 class="lightbox-title" data-lightbox-title></h2>
      <p class="lightbox-meta" data-lightbox-meta></p>
      <p class="lightbox-count" data-lightbox-count data-template="${t.detail.counter}"></p>
    </div>
    <button type="button" class="lightbox-nav lightbox-next" data-lightbox-next aria-label="${t.detail.next}"></button>
  </div>`;
}

export function layout({ title, locale, path, description, active, children }: LayoutProps): Html {
  const t = dict(locale);
  const fullTitle = title === 'Claudia Valsells' ? title : `${title} — Claudia Valsells`;

  const alternates = LOCALES.map(
    (l) => `<link rel="alternate" hreflang="${dict(l).htmlLang}" href="${localePath(l, path)}" />`,
  ).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="${localePath(DEFAULT_LOCALE, path)}" />`;

  // Preloading the modules lets the browser fetch them in parallel instead of
  // discovering each import only after parsing the one before it.
  const modulePreloads = CLIENT_MODULES
    .map((m) => `<link rel="modulepreload" href="${withBase(`/js/${m}.js`)}" />`)
    .join('\n');

  return raw(`<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${fullTitle}</title>
${description ? `<meta name="description" content="${description.replace(/"/g, '&quot;').slice(0, 300)}" />` : ''}
${alternates}
<link rel="preload" href="${withBase('/fonts/inter-normal.woff2')}" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="${withBase('/site.css')}" />
${modulePreloads}
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<a class="skip-link" href="#main">${t.nav.skip}</a>
${header(locale, t, path, active).__html}
<main id="main">${children.__html}</main>
<div class="cursor" aria-hidden="true"><span class="cursor-label"></span></div>
${lightbox(t).__html}
<div class="panel-veil" data-panel-veil></div>
${aboutPanel(splitAbout(findPage('about')), t).__html}
<script type="module" src="${withBase('/js/index.js')}"></script>
</body>
</html>`);
}
