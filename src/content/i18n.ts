/**
 * Locales.
 *
 * English is the default and lives at the root; Catalan is served from /ca/.
 *
 * Only the interface is translated here. Claudia's own writing — the artist
 * statement, the exhibition texts, the Colour Chart essay, ~38,000 characters of
 * it — is not machine-translated: presenting an invented Catalan version of an
 * artist's words as if they were hers would be a fabrication, not a feature.
 * Those slots fall back to the English source and are marked in the page, and
 * `content/translations/ca.json` is where a translator drops the real text.
 */

import { withBase } from './paths.ts';

export const LOCALES = ['en', 'ca'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export interface Dictionary {
  readonly htmlLang: string;
  readonly localeName: string;
  readonly nav: {
    readonly artwork: string;
    readonly about: string;
    readonly editorial: string;
    readonly exhibitions: string;
    readonly collaborations: string;
    readonly colourChart: string;
    readonly inquiries: string;
    readonly menu: string;
    readonly close: string;
    readonly skip: string;
  };
  readonly gallery: {
    readonly all: string;
    readonly available: string;
    readonly density: string;
    readonly untitled: string;
  };
  readonly facts: {
    readonly year: string;
    readonly dimensions: string;
    readonly medium: string;
    readonly location: string;
    readonly client: string;
    readonly credits: string;
    readonly reference: string;
    readonly status: string;
    readonly availableValue: string;
  };
  readonly detail: {
    readonly previous: string;
    readonly next: string;
    readonly allWorks: string;
    readonly allProjects: string;
    /** Template for the lightbox counter, e.g. "{n} of {total}". */
    readonly counter: string;
  };
  readonly home: {
    readonly tagline: string;
    readonly enterArtwork: (n: number) => string;
  };
  readonly pages: {
    readonly artwork: string;
    readonly artworkIntro: (n: number, from: number, to: number) => string;
    readonly editorialIntro: string;
    readonly exhibitionsIntro: string;
    readonly collaborationsIntro: string;
    readonly colourChartIntro: string;
    readonly enter: string;
    readonly backHome: string;
  };
  readonly footer: {
    readonly inquiries: string;
    readonly art: string;
    readonly other: string;
    readonly elsewhere: string;
    readonly studio: string;
    readonly city: string;
    readonly note: string;
  };
  /** Shown where Claudia's text has not been translated yet. */
  readonly untranslated: string;
}

const en: Dictionary = {
  htmlLang: 'en',
  localeName: 'English',
  nav: {
    artwork: 'Artwork', about: 'About', editorial: 'Editorial',
    exhibitions: 'Exhibitions', collaborations: 'Collaborations',
    colourChart: 'Colour Chart', inquiries: 'Inquiries',
    menu: 'Menu', close: 'Close', skip: 'Skip to content',
  },
  gallery: { all: 'All', available: 'Available', density: 'Shown', untitled: 'Untitled' },
  facts: {
    year: 'Year', dimensions: 'Dimensions', medium: 'Medium', location: 'Location',
    client: 'Client', credits: 'Credits', reference: 'Reference', status: 'Status',
    availableValue: 'Available',
  },
  detail: {
    previous: 'Previous', next: 'Next', allWorks: 'All works', allProjects: 'All projects',
    counter: '{n} of {total}',
  },
  home: {
    tagline: 'An artist working with colour as material, language and subject.',
    enterArtwork: (n) => `${n} paintings`,
  },
  pages: {
    artwork: 'Artwork',
    artworkIntro: (n, from, to) => `${n} paintings, ${from}–${to}. Colour as material, language and subject.`,
    editorialIntro: 'Projects read end to end, in the order they were made.',
    exhibitionsIntro: 'Solo shows and editions. Choose one to read it.',
    collaborationsIntro: 'Commissions and colour work made with architects, designers and studios.',
    colourChartIntro: 'An artist colour chart for architects and designers.',
    enter: 'Read',
    backHome: 'Back',
  },
  footer: {
    inquiries: 'Inquiries', art: 'Art — Alzueta Gallery', other: 'Other enquiries',
    elsewhere: 'Elsewhere', studio: 'Studio', city: 'Barcelona',
    note: 'Prototype built from the content of claudiavalsells.com.',
  },
  untranslated: '',
};

const ca: Dictionary = {
  htmlLang: 'ca',
  localeName: 'Català',
  nav: {
    artwork: 'Obra', about: 'Perfil', editorial: 'Editorial',
    exhibitions: 'Exposicions', collaborations: 'Col·laboracions',
    colourChart: 'Carta de Colors', inquiries: 'Consultes',
    menu: 'Menú', close: 'Tanca', skip: 'Vés al contingut',
  },
  gallery: { all: 'Tot', available: 'Disponible', density: 'Mostrant', untitled: 'Sense títol' },
  facts: {
    year: 'Any', dimensions: 'Dimensions', medium: 'Tècnica', location: 'Lloc',
    client: 'Client', credits: 'Crèdits', reference: 'Referència', status: 'Estat',
    availableValue: 'Disponible',
  },
  detail: {
    previous: 'Anterior', next: 'Següent',
    allWorks: 'Tota l’obra', allProjects: 'Totes les col·laboracions',
    counter: '{n} de {total}',
  },
  home: {
    tagline: 'Artista que treballa el color com a matèria, llenguatge i tema.',
    enterArtwork: (n) => `${n} pintures`,
  },
  pages: {
    artwork: 'Obra',
    artworkIntro: (n, from, to) => `${n} pintures, ${from}–${to}. El color com a matèria, llenguatge i tema.`,
    editorialIntro: 'Projectes llegits de principi a fi, en l’ordre en què es van fer.',
    exhibitionsIntro: 'Exposicions individuals i edicions. Tria’n una per llegir-la.',
    collaborationsIntro: 'Encàrrecs i treball de color amb arquitectes, dissenyadors i estudis.',
    colourChartIntro: 'Una carta de colors d’artista per a arquitectes i dissenyadors.',
    enter: 'Llegeix',
    backHome: 'Enrere',
  },
  footer: {
    inquiries: 'Consultes', art: 'Art — Alzueta Gallery', other: 'Altres consultes',
    elsewhere: 'Altres', studio: 'Estudi', city: 'Barcelona',
    note: 'Prototip construït amb el contingut de claudiavalsells.com.',
  },
  untranslated: 'Text original en anglès — pendent de traducció.',
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, ca };

export const dict = (locale: Locale): Dictionary => DICTIONARIES[locale];

/**
 * Where a page lives on disk: the locale segment, no base path. English is at the
 * root, so `/works/` for English and `/ca/works/` for Catalan.
 */
export const localeDir = (locale: Locale, path: string): string =>
  locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;

/** The URL to emit for a page — the same thing, plus any deployment base path. */
export const localePath = (locale: Locale, path: string): string =>
  withBase(localeDir(locale, path));
