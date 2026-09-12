import { html, type Html } from '../components/html.ts';
import { layout } from '../components/layout.ts';
import {
  collaborationsSection, colourChartSection, exhibitionPanels,
  exhibitionsSection, inquiriesSection, recentSection,
} from '../components/sections/index.ts';
import { splitAbout, splitExhibitions } from '../content/sections.ts';
import { dict, type Locale } from '../content/i18n.ts';
import type { Project } from '../content/types.ts';

/** How many of the newest paintings open the page. */
const RECENT = 18;

interface HomeProps {
  readonly artwork: readonly Project[];
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
 * thing that needs one.
 */
export function homePage({
  artwork, collaborations, about, colourChart, exhibitionsPage, locale,
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
        <h1 class="hero-name" data-scramble>Claudia Valsells</h1>
      </section>
      ${recentSection(artwork.slice(0, RECENT), locale, t)}
      ${exhibitionsSection(exhibitions, t)}
      ${collaborationsSection(collaborations, locale, t)}
      ${colourChartSection(colourChart, t)}
      ${inquiriesSection(aboutContent, t)}
      ${exhibitionPanels(exhibitions, t)}
    `,
  });
}
