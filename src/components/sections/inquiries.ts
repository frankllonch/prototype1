import { html, type Html } from '../html.ts';
import { band } from './band.ts';
import type { AboutContent } from '../../content/sections.ts';
import type { Dictionary } from '../../content/i18n.ts';

const MAIL = 'editorial@alzuetagallery.com';

export function inquiriesSection(about: AboutContent, t: Dictionary): Html {
  return band('inquiries', t.nav.inquiries, undefined, html`
    <div class="inquiries">
      ${about.inquiries ? html`<p class="inquiries-line">${about.inquiries}</p>` : ''}
      <ul class="inquiries-list">
        <li><span class="label">${t.inquiries.art}</span> <a href="mailto:${MAIL}">${MAIL}</a></li>
        <li><span class="label">${t.inquiries.other}</span> <a href="mailto:${MAIL}">${MAIL}</a></li>
        <li><span class="label">${t.inquiries.elsewhere}</span>
          <span>
            <a href="https://instagram.com/claudiavalsells" rel="noopener">Instagram</a>,
            <a href="https://www.linkedin.com/" rel="noopener">LinkedIn</a>
          </span></li>
        <li><span class="label">${t.inquiries.studio}</span> <span>${t.inquiries.city}</span></li>
      </ul>
    </div>
  `);
}
