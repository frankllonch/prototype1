import { html, type Html } from '../html.ts';

/** Every homepage section shares one shell so the rhythm stays identical. */
export function band(id: string, title: string, intro: string | undefined, body: Html): Html {
  return html`<section class="band" id="${id}">
    <header class="band-head">
      <h2 class="band-title" data-roll>${title}</h2>
      ${intro ? html`<p class="band-intro">${intro}</p>` : ''}
    </header>
    ${body}
  </section>`;
}
