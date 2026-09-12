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

interface NavItem { readonly href: string; readonly key: keyof Dictionary['nav'] }

interface NavItemEx extends NavItem { readonly overlay?: boolean }

const NAV: readonly NavItemEx[] = [
  { href: '/works/', key: 'works' },
  { href: '/editorial/', key: 'editorial' },
  { href: '/projects/', key: 'projects' },
  { href: '/exhibitions/', key: 'exhibitions' },
  { href: '/colour-chart/', key: 'colourChart' },
  // Opens over whatever you are reading instead of navigating away. The page at
  // /about/ still exists and still answers, for direct links and no-JS readers.
  { href: '/about/', key: 'about', overlay: true },
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
        NAV.map(
          (item) => html`<a
            href="${localePath(locale, item.href)}"
            ${item.overlay ? raw('data-overlay="about"') : ''}
            ${item.key === active ? raw('aria-current="page"') : ''}
          >${t.nav[item.key]}</a>`,
        ),
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
  <div class="lightbox-bar">
    <span class="lightbox-title" data-lightbox-title></span>
    <span class="lightbox-count" data-lightbox-count data-template="${t.detail.counter}"></span>
    <button type="button" class="lightbox-close" data-lightbox-close>${t.nav.close}</button>
  </div>
  <button type="button" class="lightbox-nav lightbox-prev" data-lightbox-prev aria-label="${t.detail.previous}"></button>
  <div class="lightbox-stage" data-lightbox-stage></div>
  <button type="button" class="lightbox-nav lightbox-next" data-lightbox-next aria-label="${t.detail.next}"></button>
  <p class="lightbox-meta" data-lightbox-meta></p>
</div>

<!-- About overlay. Content is fetched from /about/ the first time it is opened. -->
<div class="about-overlay" data-about hidden>
  <div class="about-veil" data-about-veil></div>
  <div class="about-panel" role="dialog" aria-modal="true" aria-label="${t.nav.about}">
    <button type="button" class="about-close" data-about-close>${t.nav.close}</button>
    <div class="about-body" data-about-body></div>
  </div>
</div>
<script type="module" src="${withBase('/site.js')}"></script>
</body>
</html>`);
}
