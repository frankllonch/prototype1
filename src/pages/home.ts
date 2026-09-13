import { html, type Html } from '../components/html.ts';
import { layout } from '../components/layout.ts';
import {
  collaborationPanels, collaborationsSection, colourChartSection,
  exhibitionPanels, exhibitionsSection, inquiriesSection,
} from '../components/sections/index.ts';
import { splitAbout, splitExhibitions } from '../content/sections.ts';
import { dict, type Locale } from '../content/i18n.ts';
import type { Project } from '../content/types.ts';

interface HomeProps {
  readonly collaborations: readonly Project[];
  readonly about?: Project;
  readonly colourChart?: Project;
  readonly exhibitionsPage?: Project;
  readonly locale: Locale;
}

/**
 * The whole site except the artwork, on one page — the sections of the original
 * site, in its order. The navigation moves between them rather than loading
 * anything; artwork is the only thing with its own page, because it is the only
 * thing that needs one. Exhibitions and collaborations open as panels over it.
 */
export function homePage({
  collaborations, about, colourChart, exhibitionsPage, locale,
}: HomeProps): Html {
  const t = dict(locale);
  const aboutContent = splitAbout(about);
  const exhibitions = splitExhibitions(exhibitionsPage);

  return layout({
    title: 'Claudia Valsells',
    locale,
    path: '/',
    description: t.home.tagline,
    children: html`
      <section class="hero">
        <h1 class="hero-name" data-roll>Claudia Valsells</h1>
      </section>
      ${exhibitionsSection(exhibitions, t)}
      ${collaborationsSection(collaborations, locale, t)}
      ${colourChartSection(colourChart, t)}
      ${inquiriesSection(aboutContent, t)}
      ${exhibitionPanels(exhibitions, t)}
      ${collaborationPanels(collaborations, locale, t)}
    `,
  });
}
