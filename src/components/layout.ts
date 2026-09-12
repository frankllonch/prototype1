import { html, join, raw, type Html } from './html.ts';
import { DEFAULT_LOCALE, LOCALES, dict, localePath, type Dictionary, type Locale } from '../content/i18n.ts';
import { withBase } from '../content/paths.ts';

export interface LayoutProps {
  readonly title: string;
  readonly locale: Locale;
  /** Route without the locale prefix, e.g. `/works/`. Drives the language switcher. */
  readonly path: string;
  readonly description?: string;
  readonly active?: string;
  readonly children: Html;
}

interface NavItem {
  readonly key: keyof Dictionary['nav'];
  /** A homepage section id — the link scrolls there instead of loading a page. */
  readonly section?: string;
  /** A real route. Only artwork has one. */
  readonly href?: string;
}

/*
 * One page and one section list. Everything except the artwork lives on the
 * homepage, so these links are anchors: with scripting they scroll, without it
 * the browser jumps to the same place. Nothing here loads a document.
 */
const NAV: readonly NavItem[] = [
  { key: 'artwork', href: '/artwork/' },
  { key: 'about', section: 'about' },
  { key: 'editorial', section: 'editorial' },
  { key: 'exhibitions', section: 'exhibitions' },
  { key: 'collaborations', section: 'collaborations' },
  { key: 'colourChart', section: 'colour-chart' },
  { key: 'inquiries', section: 'inquiries' },
];

/**
 * A single fixed rule across the top, in the manner of nr.world: no background,
 * no blur, no drop shadow. `mix-blend-mode: difference` with white text means the
 * bar inverts against whatever scrolls under it — near-black over the paper
 * ground, white over a dark photograph — so it never needs a plate of its own and
 * never hides a millimetre of artwork.
 */
function header(locale: Locale, t: Dictionary, path: string, active?: string): Html {
  const other = LOCALES.filter((l) => l !== locale);
  return html`<header class="site-header">
    <a class="wordmark" href="${localePath(locale, '/')}">Claudia Valsells</a>

    <nav class="site-nav" id="site-nav" aria-label="Primary">
      ${join(
        NAV.map((item) => {
          // A section link is an anchor on the homepage and a link back to it
          // from anywhere else, so it works from the artwork page too.
          const href = item.href
            ? localePath(locale, item.href)
            : `${localePath(locale, '/')}#${item.section}`;
          return html`<a
            href="${href}"
            ${item.section ? raw(`data-section="${item.section}"`) : ''}
            ${item.key === active ? raw('aria-current="page"') : ''}
          >${t.nav[item.key]}</a>`;
        }),
      )}
    </nav>

    <div class="header-end">
      <a class="header-link" href="mailto:editorial@alzuetagallery.com">${t.nav.inquiries}</a>
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

function footer(t: Dictionary): Html {
  return html`<footer class="site-footer">
    <div class="footer-col">
      <span class="label">${t.footer.inquiries}</span>
      <a href="mailto:editorial@alzuetagallery.com">${t.footer.art}</a>
      <a href="mailto:editorial@alzuetagallery.com">${t.footer.other}</a>
    </div>
    <div class="footer-col">
      <span class="label">${t.footer.elsewhere}</span>
      <a href="https://instagram.com/claudiavalsells" rel="noopener">Instagram</a>
      <a href="https://www.linkedin.com/" rel="noopener">LinkedIn</a>
    </div>
    <div class="footer-col">
      <span class="label">${t.footer.studio}</span>
      <span>${t.footer.city}</span>
    </div>
    <p class="footer-note">${t.footer.note}</p>
  </footer>`;
}

export function layout({ title, locale, path, description, active, children }: LayoutProps): Html {
  const t = dict(locale);
  const fullTitle = title === 'Claudia Valsells' ? title : `${title} — Claudia Valsells`;

  // Tell crawlers and browsers about the other language of this exact page.
  const alternates = LOCALES.map(
    (l) => `<link rel="alternate" hreflang="${dict(l).htmlLang}" href="${localePath(l, path)}" />`,
  ).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="${localePath(DEFAULT_LOCALE, path)}" />`;

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
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<a class="skip-link" href="#main">${t.nav.skip}</a>
${header(locale, t, path, active).__html}
<main id="main">${children.__html}</main>
${footer(t).__html}
<div class="cursor" aria-hidden="true"><span class="cursor-label"></span></div>

<!--
  Lightbox. Empty until opened: it is filled from the tile that was clicked, whose
  markup already carries the srcset and every field the caption needs.
-->
<div class="lightbox" data-lightbox data-available-label="${t.facts.availableValue}" hidden>
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
</div>

<!-- Exhibition detail veil. The panels themselves live inside the page. -->
<div class="panel-veil" data-panel-veil hidden></div>
<script type="module" src="${withBase('/site.js')}"></script>
</body>
</html>`);
}
