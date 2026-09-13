import { finePointer, reduceMotion } from './env.ts';

/**
 * NOT IN USE. Kept for reference; the site runs `text-hover.ts` instead.
 *
 * Proximity scramble on titles. Characters near the pointer show `*` and snap
 * back, the nearer ones holding longer, so a title resolves as a small ripple.
 *
 * Three things keep it calm:
 *  - Characters are armed only when the pointer *moves*, never from inside the
 *    animation loop, so it comes to rest and stays there.
 *  - Every armed character holds for at least MIN_HOLD. Without a floor, a
 *    character at the edge of the radius resolved after a few milliseconds —
 *    one frame of asterisk — which read as flicker.
 *  - Each character is locked to the width of its own glyph, so the substitution
 *    cannot change the word's length; and the asterisk is scaled to fit that
 *    box, so it never runs into its neighbours behind a narrow letter or floats
 *    loose behind a wide one.
 */
const RADIUS = 44;
const MIN_HOLD = 140;
const EXTRA_HOLD = 220; // added in full for a character directly under the pointer
const THROTTLE = 16;

export function initScramble(): void {
  const roots = document.querySelectorAll<HTMLElement>('[data-scramble]');
  if (!roots.length || reduceMotion.matches || !finePointer.matches) return;

  const chars = splitIntoCharacters(roots);
  if (!chars.length) return;

  lockWidths(chars);
  window.addEventListener('resize', debounce(() => lockWidths(chars), 120), { passive: true });

  const deadline = new Map<HTMLElement, number>();
  let frame = 0;
  let lastArm = 0;

  const resolveDue = (now: number) => {
    for (const [span, at] of deadline) {
      if (now >= at) {
        span.textContent = span.dataset.ch!;
        span.classList.remove('is-x');
        deadline.delete(span);
      }
    }
  };

  const loop = () => {
    resolveDue(performance.now());
    frame = deadline.size ? requestAnimationFrame(loop) : 0;
  };

  const arm = (x: number, y: number) => {
    const now = performance.now();
    resolveDue(now); // also here, so a withheld frame can never strand an asterisk
    for (const span of chars) {
      const box = span.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) continue;
      const distance = Math.hypot(x - (box.left + box.width / 2), y - (box.top + box.height / 2));
      if (distance >= RADIUS) continue;
      const until = now + MIN_HOLD + EXTRA_HOLD * (1 - distance / RADIUS);
      if ((deadline.get(span) ?? 0) < until) {
        deadline.set(span, until);
        span.textContent = '*';
        span.classList.add('is-x');
      }
    }
    if (deadline.size && !frame) frame = requestAnimationFrame(loop);
  };

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const now = performance.now();
    if (now - lastArm < THROTTLE) return;
    lastArm = now;
    arm(event.clientX, event.clientY);
  }, { passive: true });
}

/** Wraps each character in a span; whitespace is kept but never scrambled. */
function splitIntoCharacters(roots: NodeListOf<HTMLElement>): HTMLElement[] {
  const chars: HTMLElement[] = [];
  for (const root of roots) {
    const text = root.textContent ?? '';
    root.textContent = '';
    for (const character of text) {
      const span = document.createElement('span');
      span.className = 'sc';
      span.textContent = character;
      if (character.trim()) { span.dataset.ch = character; chars.push(span); }
      root.append(span);
    }
  }
  return chars;
}

/**
 * Fixes every character to its own glyph's width once the fonts are in, and
 * records how far an asterisk must shrink to fit inside it (`--x`, at most 1).
 */
function lockWidths(chars: readonly HTMLElement[]): void {
  void document.fonts.ready.then(() => {
    for (const span of chars) span.style.width = '';
    const widths = chars.map((span) => span.getBoundingClientRect().width);
    chars.forEach((span, i) => {
      const width = widths[i]!;
      span.style.width = `${width.toFixed(3)}px`;
      span.style.setProperty('--x', Math.min(1, width / asteriskWidth(span)).toFixed(3));
    });
  });
}

/** Width of `*` in the same font and size as `sample`, measured once per parent. */
const asteriskWidths = new WeakMap<HTMLElement, number>();
function asteriskWidth(sample: HTMLElement): number {
  const parent = sample.parentElement!;
  const known = asteriskWidths.get(parent);
  if (known) return known;
  const probe = sample.cloneNode(false) as HTMLElement;
  probe.textContent = '*';
  probe.style.width = '';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  parent.append(probe);
  const width = probe.getBoundingClientRect().width || 1;
  probe.remove();
  asteriskWidths.set(parent, width);
  return width;
}

function debounce(fn: () => void, wait: number): () => void {
  let timer = 0;
  return () => { window.clearTimeout(timer); timer = window.setTimeout(fn, wait); };
}
