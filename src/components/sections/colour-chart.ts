import { html, join, raw, type Html } from '../html.ts';
import { responsiveImage } from '../image.ts';
import { band } from './band.ts';
import type { Dictionary } from '../../content/i18n.ts';
import type { Project } from '../../content/types.ts';

export function colourChartSection(page: Project | undefined, t: Dictionary): Html {
  if (!page) return html``;
  const images = page.images.slice(0, 3);
  const text = page.rows
    .flatMap((r) => r.columns)
    .filter((c) => c.kind === 'text')
    .map((c) => (c.kind === 'text' ? c.html : ''))
    .join('');

  return band('colour-chart', t.nav.colourChart, t.pages.colourChartIntro, html`
    <div class="chart">
      <div class="chart-plates">
        ${join(
          images.map(
            (image) => html`<figure class="figure reveal">
              ${responsiveImage({ image, sizes: '(max-width: 700px) 92vw, 28vw' })}
            </figure>`,
          ),
        )}
      </div>
      <div class="chart-text prose reveal">${raw(text)}</div>
    </div>
  `);
}
