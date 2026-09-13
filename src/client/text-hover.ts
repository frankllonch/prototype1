import { finePointer, reduceMotion } from './env.ts';

/**
 * Hover text effect, after landonorris.com: on hover, every character of a title
 * cycles through uppercase letters and resolves back to itself, left to right.
 *
 * Each character is wrapped in a span holding two layers — the real glyph, which
 * stays in flow and so sets the box's width, and an absolutely positioned cycle
 * layer whose `content` is driven by a CSS keyframe animation. Because the real
 * glyph never leaves the flow, the word cannot change length; the cycling letter
 * is simply clipped to the glyph's box.
 *
 * The script only splits the text and toggles a class. The animation itself —
 * timing, stagger, the letters shown — lives entirely in the stylesheet, one
 * animation per character, offset by `--i`.
 */
const STEP = 32;       // ms between one character starting and the next
const DURATION = 420;  // ms one character spends cycling
const VARIANTS = 3;    // keyframe sequences to draw from, so neighbours differ

export function initTextHover(): void {
  const roots = document.querySelectorAll<HTMLElement>('[data-scramble]');
  if (!roots.length || reduceMotion.matches || !finePointer.matches) return;

  for (const root of roots) {
    const count = split(root);
    if (!count) continue;
    const total = DURATION + STEP * (count - 1);
    let settle = 0;

    root.addEventListener('mouseenter', () => {
      // Restart cleanly on every entry, even mid-animation.
      root.classList.remove('is-cycling');
      void root.offsetWidth;
      root.classList.add('is-cycling');
      window.clearTimeout(settle);
      settle = window.setTimeout(() => root.classList.remove('is-cycling'), total);
    });
  }
}

/** Wraps each character; whitespace is kept but never cycled. Returns the count. */
function split(root: HTMLElement): number {
  const text = root.textContent ?? '';
  root.textContent = '';
  let index = 0;
  for (const character of text) {
    if (!character.trim()) {
      root.append(character);
      continue;
    }
    const wrap = document.createElement('span');
    wrap.className = 'rc';
    wrap.style.setProperty('--i', String(index));

    const glyph = document.createElement('span');
    glyph.className = 'rc-glyph';
    glyph.textContent = character;

    const cycle = document.createElement('span');
    cycle.className = `rc-cycle rc-cycle-${index % VARIANTS}`;
    cycle.dataset.ch = character;
    cycle.setAttribute('aria-hidden', 'true');

    wrap.append(glyph, cycle);
    root.append(wrap);
    index++;
  }
  return index;
}
