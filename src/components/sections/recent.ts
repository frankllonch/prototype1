import { html, type Html } from '../html.ts';
import { gallery } from '../gallery.ts';
import { localePath, type Dictionary, type Locale } from '../../content/i18n.ts';
import type { Project } from '../../content/types.ts';

/** The newest paintings, straight under the name, with the way into the rest. */
export function recentSection(works: readonly Project[], locale: Locale, t: Dictionary): Html {
  return html`<section class="band band-recent" id="recent">
    <header class="band-head band-head-row">
      <h2 class="band-title" data-scramble>${t.home.recent}</h2>
      <a class="band-more" href="${localePath(locale, '/artwork/')}">${t.home.allArtwork} →</a>
    </header>
    ${gallery({ items: works, basePath: '/artwork', locale, t, eagerCount: works.length })}
  </section>`;
}
