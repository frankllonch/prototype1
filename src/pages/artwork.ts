import { html, type Html } from '../components/html.ts';
import { layout } from '../components/layout.ts';
import { filterControls, gallery, yearIndicator } from '../components/gallery.ts';
import { dict, type Locale } from '../content/i18n.ts';
import type { Project } from '../content/types.ts';

/** The artwork index — the one separate page. */
export function artworkPage(items: readonly Project[], years: readonly number[], locale: Locale): Html {
  const t = dict(locale);
  const intro = t.pages.artworkIntro(items.length, years[years.length - 1]!, years[0]!);
  return layout({
    title: t.pages.artwork,
    locale,
    path: '/artwork/',
    description: intro,
    active: 'artwork',
    children: html`
      <section class="page-head">
        <h1 data-scramble>${t.pages.artwork}</h1>
        <p class="page-intro">${intro}</p>
        ${filterControls(years, items.length, t)}
      </section>
      ${gallery({ items, basePath: '/artwork', locale, t, trackYears: true, lightbox: true })}
      ${yearIndicator()}
    `,
  });
}
