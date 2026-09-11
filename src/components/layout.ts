import { html, raw, type Html } from './html.ts';

export interface LayoutProps {
  readonly title: string;
  readonly description?: string;
  /** Slug of the active nav item, for `aria-current`. */
  readonly active?: string;
  readonly children: Html;
  /** Detail pages drop the site header so the artwork opens the page. */
  readonly bare?: boolean;
}

interface NavItem { readonly href: string; readonly label: string; readonly key: string }

export const NAV: readonly NavItem[] = [
  { href: '/works/', label: 'Works', key: 'works' },
  { href: '/editorial/', label: 'Editorial', key: 'editorial' },
  { href: '/projects/', label: 'Projects', key: 'projects' },
  { href: '/exhibitions/', label: 'Exhibitions', key: 'exhibitions' },
  { href: '/colour-chart/', label: 'Colour Chart', key: 'colour-chart' },
  { href: '/about/', label: 'About', key: 'about' },
];

/**
 * The nav panel is visible by default and only collapses on narrow screens once
 * scripting has confirmed it can be reopened — so with JavaScript off the links
 * are all still there, stacked, rather than sealed behind a dead button.
 */
function header(active?: string): Html {
  return html`<header class="site-header">
    <a class="site-title" href="/">Claudia Valsells</a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
      <span class="nav-toggle-label">Menu</span>
    </button>
    <div class="site-nav-panel" id="site-nav">
      <nav class="site-nav" aria-label="Primary">
        <ul>
          ${NAV.map(
            (item) => html`<li>
              <a href="${item.href}" ${item.key === active ? raw('aria-current="page"') : ''}>${item.label}</a>
            </li>`,
          )}
        </ul>
      </nav>
      <a class="site-inquire" href="mailto:editorial@alzuetagallery.com">Inquiries</a>
    </div>
  </header>`;
}

function footer(): Html {
  return html`<footer class="site-footer">
    <div class="footer-col">
      <span class="label">Inquiries</span>
      <a href="mailto:editorial@alzuetagallery.com">Art — Alzueta Gallery</a>
      <a href="mailto:editorial@alzuetagallery.com">Other enquiries</a>
    </div>
    <div class="footer-col">
      <span class="label">Elsewhere</span>
      <a href="https://instagram.com/claudiavalsells" rel="noopener">Instagram</a>
      <a href="https://www.linkedin.com/" rel="noopener">LinkedIn</a>
    </div>
    <div class="footer-col">
      <span class="label">Studio</span>
      <span>Barcelona</span>
    </div>
    <p class="footer-note">
      Prototype built from the content of claudiavalsells.com. Design and code in progress.
    </p>
  </footer>`;
}

export function layout({ title, description, active, children, bare = false }: LayoutProps): Html {
  const fullTitle = title === 'Claudia Valsells' ? title : `${title} — Claudia Valsells`;
  return raw(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${fullTitle}</title>
${description ? `<meta name="description" content="${description.replace(/"/g, '&quot;').slice(0, 300)}" />` : ''}
<link rel="preload" href="/fonts/newsreader-normal.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/site.css" />
<script>document.documentElement.classList.add('js')</script>
</head>
<body${bare ? ' class="is-bare"' : ''}>
<a class="skip-link" href="#main">Skip to content</a>
${bare ? '' : header(active).__html}
<main id="main">${children.__html}</main>
${footer().__html}
<div class="cursor" aria-hidden="true"><span class="cursor-label"></span></div>
<script type="module" src="/site.js"></script>
</body>
</html>`);
}
