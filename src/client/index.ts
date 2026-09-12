/**
 * The site's client-side code, booted in one place. No framework, no dependencies.
 *
 * Everything here is an enhancement: the pages are complete and navigable with
 * scripting off. Section links are real anchors, artwork tiles are real links,
 * and every panel is a real element reachable by its own `#` fragment.
 */
import { initMenuToggle, initSectionNav } from './nav.ts';
import { initScramble } from './scramble.ts';
import { initYearFloat, initZoom } from './gallery.ts';
import { initLightbox } from './lightbox.ts';
import { initPanels } from './panels.ts';
import { initCursor } from './cursor.ts';
import { initReveals } from './reveals.ts';

initMenuToggle();
initSectionNav();
initScramble();
initYearFloat();
initZoom();
initLightbox();
initPanels();
initCursor();
initReveals();
