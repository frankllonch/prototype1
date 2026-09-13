/**
 * Locales.
 *
 * English is the default and lives at the root; Catalan is served from /ca/.
 *
 * Only the interface is translated here. Claudia's own writing — the artist
 * statement, the exhibition texts, the Colour Chart essay — is not
 * machine-translated: presenting an invented Catalan version of an artist's
 * words as if they were hers would be a fabrication, not a feature. Those slots
 * fall back to the English source.
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
    readonly exhibitions: string;
    readonly collaborations: string;
    readonly colourChart: string;
    readonly inquiries: string;
    readonly menu: string;
    readonly close: string;
    readonly skip: string;
  };
  readonly gallery: {
    readonly show: string;
    readonly all: string;
    readonly year: string;
    readonly allYears: string;
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
    readonly permalink: string;
  };
  readonly home: {
    readonly tagline: string;
  };
  readonly pages: {
    readonly artwork: string;
    readonly artworkIntro: (n: number, from: number, to: number) => string;
    readonly exhibitionsIntro: string;
    readonly collaborationsIntro: string;
    readonly colourChartIntro: string;
  };
  readonly inquiries: {
    readonly art: string;
    readonly other: string;
    readonly elsewhere: string;
    readonly studio: string;
    readonly city: string;
  };
}

const en: Dictionary = {
  htmlLang: 'en',
  localeName: 'English',
  nav: {
    artwork: 'Artwork', about: 'About', exhibitions: 'Exhibitions',
    collaborations: 'Collaborations', colourChart: 'Colour Chart', inquiries: 'Inquiries',
    menu: 'Menu', close: 'Close', skip: 'Skip to content',
  },
  gallery: { show: 'Show', all: 'All', year: 'Year', allYears: 'All years', untitled: 'Untitled' },
  facts: {
    year: 'Year', dimensions: 'Dimensions', medium: 'Medium', location: 'Location',
    client: 'Client', credits: 'Credits', reference: 'Reference', status: 'Status',
    availableValue: 'Available',
  },
  detail: {
    previous: 'Previous', next: 'Next', allWorks: 'All artwork', allProjects: 'All collaborations',
    counter: '{n} of {total}',
    permalink: 'Open on its own page',
  },
  home: {
    tagline: 'An artist working with colour as material, language and subject.',
  },
  pages: {
    artwork: 'Artwork',
    artworkIntro: (n, from, to) => `${n} paintings, ${from}–${to}. Colour as material, language and subject.`,
    exhibitionsIntro: 'Solo shows and editions. Choose one to read it.',
    collaborationsIntro: 'Commissions and colour work made with architects, designers and studios.',
    colourChartIntro: 'An artist colour chart for architects and designers.',
  },
  inquiries: {
    art: 'Art — Alzueta Gallery', other: 'Other enquiries',
    elsewhere: 'Elsewhere', studio: 'Studio', city: 'Barcelona',
  },
};

const ca: Dictionary = {
  htmlLang: 'ca',
  localeName: 'Català',
  nav: {
    artwork: 'Obra', about: 'Perfil', exhibitions: 'Exposicions',
    collaborations: 'Col·laboracions', colourChart: 'Carta de Colors', inquiries: 'Consultes',
    menu: 'Menú', close: 'Tanca', skip: 'Vés al contingut',
  },
  gallery: { show: 'Mostra', all: 'Tot', year: 'Any', allYears: 'Tots els anys', untitled: 'Sense títol' },
  facts: {
    year: 'Any', dimensions: 'Dimensions', medium: 'Tècnica', location: 'Lloc',
    client: 'Client', credits: 'Crèdits', reference: 'Referència', status: 'Estat',
    availableValue: 'Disponible',
  },
  detail: {
    previous: 'Anterior', next: 'Següent',
    allWorks: 'Tota l’obra', allProjects: 'Totes les col·laboracions',
    counter: '{n} de {total}',
    permalink: 'Obre en una pàgina pròpia',
  },
  home: {
    tagline: 'Artista que treballa el color com a matèria, llenguatge i tema.',
  },
  pages: {
    artwork: 'Obra',
    artworkIntro: (n, from, to) => `${n} pintures, ${from}–${to}. El color com a matèria, llenguatge i tema.`,
    exhibitionsIntro: 'Exposicions individuals i edicions. Tria’n una per llegir-la.',
    collaborationsIntro: 'Encàrrecs i treball de color amb arquitectes, dissenyadors i estudis.',
    colourChartIntro: 'Una carta de colors d’artista per a arquitectes i dissenyadors.',
  },
  inquiries: {
    art: 'Art — Alzueta Gallery', other: 'Altres consultes',
    elsewhere: 'Altres', studio: 'Estudi', city: 'Barcelona',
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, ca };

export const dict = (locale: Locale): Dictionary => DICTIONARIES[locale];

/**
 * Where a page lives on disk: the locale segment, no base path. English is at the
 * root, so `/artwork/` for English and `/ca/artwork/` for Catalan.
 */
export const localeDir = (locale: Locale, path: string): string =>
  locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;

/** The URL to emit for a page — the same thing, plus any deployment base path. */
export const localePath = (locale: Locale, path: string): string =>
  withBase(localeDir(locale, path));
