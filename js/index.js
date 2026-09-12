/**
 * The site's client-side code, booted in one place. No framework, no dependencies.
 *
 * Everything here is an enhancement: the pages are complete and navigable with
 * scripting off. Section links are real anchors, artwork tiles are real links,
 * and every panel is a real element reachable by its own `#` fragment.
 */
import { initMenuToggle, initSectionNav } from "./nav.js";
import { initScramble } from "./scramble.js";
import { initYearFloat, initZoom } from "./gallery.js";
import { initLightbox } from "./lightbox.js";
import { initPanels } from "./panels.js";
import { initCursor } from "./cursor.js";
import { initReveals } from "./reveals.js";
initMenuToggle();
initSectionNav();
initScramble();
initYearFloat();
initZoom();
initLightbox();
initPanels();
initCursor();
initReveals();
