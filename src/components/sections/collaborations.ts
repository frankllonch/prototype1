import type { Html } from '../html.ts';
import { gallery } from '../gallery.ts';
import { band } from './band.ts';
import type { Dictionary, Locale } from '../../content/i18n.ts';
import type { Project } from '../../content/types.ts';

/**
 * Collaborations, as the same contact sheet the artwork uses — equal-area tiles,
 * the same entry, the same cursor. Each tile leads to the project's own page,
 * since a collaboration is several photographs and a text, which a single-plate
 * lightbox cannot hold.
 */
export function collaborationsSection(projects: readonly Project[], locale: Locale, t: Dictionary): Html {
  return band('collaborations', t.nav.collaborations, t.pages.collaborationsIntro,
    gallery({ items: projects, basePath: '/collaborations', locale, t, eagerCount: projects.length }));
}
