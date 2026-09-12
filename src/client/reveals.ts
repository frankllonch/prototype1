import { reduceMotion } from './env.ts';

/**
 * Elements marked `.reveal` (and every gallery tile) fade in as they scroll into
 * view. The first screen is shown immediately rather than waiting on an observer
 * callback, which a backgrounded tab throttles; and if nothing at all has
 * revealed after a grace period, everything is shown — a decorative effect must
 * never be able to leave a page blank.
 */
const GRACE = 2500;

export function initReveals(): void {
  const targets = [...document.querySelectorAll<HTMLElement>('.reveal, .tile')];
  if (!targets.length) return;

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    for (const el of targets) el.classList.add('is-in');
    return;
  }

  let revealed = 0;
  const reveal = (el: Element) => { el.classList.add('is-in'); observer.unobserve(el); revealed++; };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });

  for (const el of targets) (isOffscreen(el) ? observer.observe(el) : reveal(el));

  window.setTimeout(() => {
    if (revealed === 0) { for (const el of targets) el.classList.add('is-in'); observer.disconnect(); return; }
    for (const el of targets) if (!isOffscreen(el)) el.classList.add('is-in');
  }, GRACE);
}

/** Provably below or above the fold. A zero-height box means layout is unknown, so: not offscreen. */
function isOffscreen(el: HTMLElement): boolean {
  const box = el.getBoundingClientRect();
  return box.height !== 0 && (box.top >= window.innerHeight || box.bottom <= 0);
}
