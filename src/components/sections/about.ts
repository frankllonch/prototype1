import { html, join, raw, type Html } from '../html.ts';
import { responsiveImage } from '../image.ts';
import type { AboutContent } from '../../content/sections.ts';
import type { Dictionary } from '../../content/i18n.ts';

/**
 * About opens over whatever you are reading, the page blurred behind it, and
 * closes back to the same place. It is set like a newspaper: justified columns,
 * with the two studio photographs sitting inside the prose near the top.
 */
export function aboutPanel(about: AboutContent, t: Dictionary): Html {
  return html`<article class="panel panel-about" id="about" data-panel>
    <header class="panel-head">
      <h3 class="panel-title">${t.nav.about}</h3>
      <a class="panel-close" href="#" data-panel-close>${t.nav.close}</a>
    </header>
    <div class="about-columns">
      ${join(
        about.blocks.map((block) =>
          block.kind === 'html'
            ? raw(block.html)
            : html`<figure class="about-plate">
                ${responsiveImage({ image: block.image, sizes: '(max-width: 700px) 60vw, 240px' })}
              </figure>`,
        ),
      )}
    </div>
  </article>`;
}
