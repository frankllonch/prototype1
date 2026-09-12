/**
 * The site's only client-side code: a title cursor, scroll reveals, a sticky
 * header state and the gallery filter. No framework, no dependencies, ~150 lines.
 *
 * Everything here is an enhancement. The pages are complete and navigable with
 * this file blocked; nothing renders or links through JavaScript.
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
/* ----------------------------------------------------------------- cursor */
/**
 * A label that follows the pointer and names whatever is under it.
 *
 * The title is read from `data-cursor-title`, which mirrors text already present
 * in the tile's caption — so the cursor is decoration, never the only way to
 * learn what a work is. Keyboard users get the caption revealed on focus, and
 * coarse pointers get it permanently.
 */
function initCursor() {
    const cursor = document.querySelector('.cursor');
    const label = cursor?.querySelector('.cursor-label');
    if (!cursor || !label || !finePointer.matches)
        return;
    let targetX = 0, targetY = 0, x = 0, y = 0;
    let active = false;
    let frame = 0;
    let placed = false;
    const tick = () => {
        // Lerp toward the pointer; the lag is what makes it feel weighted.
        const ease = reduceMotion.matches ? 1 : 0.18;
        x += (targetX - x) * ease;
        y += (targetY - y) * ease;
        cursor.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        frame = Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1 || active
            ? requestAnimationFrame(tick)
            : 0;
    };
    const schedule = () => { if (!frame)
        frame = requestAnimationFrame(tick); };
    document.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse')
            return;
        targetX = event.clientX;
        targetY = event.clientY;
        // Start where the pointer already is, or the label swoops in from 0,0.
        if (!placed) {
            placed = true;
            x = targetX;
            y = targetY;
        }
        const hit = event.target?.closest('[data-cursor-title]');
        const title = hit?.dataset.cursorTitle ?? '';
        if (title) {
            if (label.textContent !== title)
                label.textContent = title;
            if (!active) {
                active = true;
                cursor.classList.add('is-visible');
            }
        }
        else if (active) {
            active = false;
            cursor.classList.remove('is-visible');
        }
        schedule();
    }, { passive: true });
    document.addEventListener('pointerleave', () => {
        active = false;
        cursor.classList.remove('is-visible');
    });
}
/* ---------------------------------------------------------------- reveals */
/**
 * Whether an element is *provably* below the fold.
 *
 * Deliberately one-sided: it answers "can I prove this is off-screen?", not "is
 * this on-screen?". A tab that has not painted yet reports every rect as zero, and
 * the naive test (`bottom > 0`) reads that as "off-screen" and hides the entire
 * page. A zero-height box means layout is unknown, so the honest answer is no —
 * show it. Content is only ever withheld from a reveal we are sure they cannot see.
 */
function isOffscreen(el) {
    const box = el.getBoundingClientRect();
    if (box.height === 0)
        return false;
    return box.top >= window.innerHeight || box.bottom <= 0;
}
function initReveals() {
    const targets = document.querySelectorAll('.reveal, .tile');
    if (!targets.length)
        return;
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('is-in'));
        return;
    }
    let revealed = 0;
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting)
                continue;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
            revealed++;
        }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    targets.forEach((el) => observer.observe(el));
    /*
     * Reveal what is already on screen, synchronously, right now. The first screen
     * must not wait on an observer callback or a timer — both are throttled or
     * suspended in a backgrounded tab, and a reader arriving there would find an
     * empty page. Everything below the fold still animates in on scroll.
     */
    for (const el of targets) {
        if (isOffscreen(el))
            continue;
        el.classList.add('is-in');
        observer.unobserve(el);
        revealed++;
    }
    /*
     * Safety net. The entry animation is decoration, but it hides its own content
     * until it runs — so if the observer never fires (a throttled background tab
     * that is later restored, an engine quirk, a mis-set root margin) the gallery
     * would stay blank. After a beat, reveal anything on screen; if nothing at all
     * has been revealed, assume the observer is not working and reveal everything.
     */
    window.setTimeout(() => {
        if (revealed === 0) {
            targets.forEach((el) => el.classList.add('is-in'));
            observer.disconnect();
            return;
        }
        for (const el of targets) {
            if (!isOffscreen(el))
                el.classList.add('is-in');
        }
    }, 2500);
}
/* ----------------------------------------------------------------- header */
function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header)
        return;
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    document.body.prepend(sentinel);
    new IntersectionObserver(([entry]) => header.classList.toggle('is-stuck', !entry?.isIntersecting), { threshold: 1 }).observe(sentinel);
}
/* ---------------------------------------------------------------- filters */
/**
 * Narrows the gallery in place. Tiles carry `data-year` / `data-available`, so
 * filtering is a class toggle: rows keep justifying themselves because each
 * tile's flex-grow is unchanged, and a row whose tiles are all hidden is hidden
 * along with the year marker above it.
 */
function initFilters() {
    const filters = document.querySelectorAll('.filter');
    const galleryEl = document.querySelector('[data-gallery]');
    if (!filters.length || !galleryEl)
        return;
    const rows = [...galleryEl.querySelectorAll('.gallery-row')];
    const markers = [...galleryEl.querySelectorAll('.year-marker')];
    const matches = (tile, value) => {
        if (value === 'all')
            return true;
        if (value === 'available')
            return tile.dataset.available === 'true';
        return tile.dataset.year === value;
    };
    const apply = (value) => {
        for (const row of rows) {
            let visible = 0;
            for (const tile of row.querySelectorAll('.tile')) {
                const show = matches(tile, value);
                tile.hidden = !show;
                if (show)
                    visible++;
            }
            row.hidden = visible === 0;
        }
        // A year marker only makes sense while more than one year is on screen.
        for (const marker of markers) {
            marker.hidden = value !== 'all' && marker.dataset.year !== value;
        }
        for (const button of filters) {
            const isActive = button.dataset.filter === value;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        }
    };
    for (const button of filters) {
        button.addEventListener('click', () => apply(button.dataset.filter ?? 'all'));
    }
}
/* --------------------------------------------------------------- scramble */
/**
 * Proximity scramble. Characters near the pointer flicker to `*` and settle back,
 * the nearer ones taking longer to resolve, so the word ripples rather than
 * flipping all at once.
 *
 * Text is split into spans once, and the original character is kept on the span so
 * a scramble can always be undone — the DOM never loses the real word, which
 * matters for selection, search and screen readers (the element keeps its
 * accessible name because the characters are still there in order).
 */
function initScramble() {
    const roots = document.querySelectorAll('[data-scramble]');
    if (!roots.length || reduceMotion.matches || !finePointer.matches)
        return;
    const RADIUS = 90;
    const SETTLE = 520; // ms for a character right under the pointer
    const chars = [];
    for (const root of roots) {
        const text = root.textContent ?? '';
        root.textContent = '';
        for (const character of text) {
            const span = document.createElement('span');
            span.className = 'sc';
            span.textContent = character;
            if (character.trim()) {
                span.dataset.ch = character;
                chars.push(span);
            }
            root.append(span);
        }
    }
    if (!chars.length)
        return;
    const until = new WeakMap();
    let pointer = null;
    let frame = 0;
    const tick = () => {
        frame = 0;
        const now = performance.now();
        let active = false;
        for (const span of chars) {
            const done = until.get(span) ?? 0;
            if (now < done) {
                active = true;
                // Flicker between the asterisk and the real glyph as it resolves.
                span.textContent = Math.random() < 0.55 ? '*' : span.dataset.ch;
            }
            else if (span.textContent !== span.dataset.ch) {
                span.textContent = span.dataset.ch;
            }
        }
        if (pointer) {
            for (const span of chars) {
                const box = span.getBoundingClientRect();
                const dx = pointer.x - (box.left + box.width / 2);
                const dy = pointer.y - (box.top + box.height / 2);
                const distance = Math.hypot(dx, dy);
                if (distance < RADIUS) {
                    const strength = 1 - distance / RADIUS;
                    until.set(span, Math.max(until.get(span) ?? 0, now + SETTLE * strength));
                    active = true;
                }
            }
        }
        if (active)
            frame = requestAnimationFrame(tick);
    };
    document.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse')
            return;
        pointer = { x: event.clientX, y: event.clientY };
        if (!frame)
            frame = requestAnimationFrame(tick);
    }, { passive: true });
}
/* ------------------------------------------------------------- year float */
/**
 * The year readout, after the iOS photo library: the grid is never interrupted by
 * headings; instead the year of whatever is currently at the top of the viewport
 * floats over it while you scroll, and fades out once you stop.
 */
function initYearFloat() {
    const float = document.querySelector('[data-year-float]');
    const galleryEl = document.querySelector('[data-track-years]');
    const out = float?.querySelector('span');
    if (!float || !galleryEl || !out)
        return;
    const tiles = [...galleryEl.querySelectorAll('.tile')];
    if (!tiles.length)
        return;
    let frame = 0;
    let idle = 0;
    let shown = '';
    const update = () => {
        frame = 0;
        // The first tile whose bottom is still below the top of the viewport wins.
        const probe = window.innerHeight * 0.18;
        let year = '';
        for (const tile of tiles) {
            const box = tile.getBoundingClientRect();
            if (box.bottom >= probe) {
                year = tile.dataset.year ?? '';
                break;
            }
        }
        if (year && year !== shown) {
            shown = year;
            out.textContent = year;
        }
        float.classList.toggle('is-visible', Boolean(year));
    };
    window.addEventListener('scroll', () => {
        if (!frame)
            frame = requestAnimationFrame(update);
        float.classList.add('is-scrolling');
        window.clearTimeout(idle);
        idle = window.setTimeout(() => float.classList.remove('is-scrolling'), 900);
    }, { passive: true });
    update();
}
/* ------------------------------------------------------------------- zoom */
/**
 * Density control for the contact sheet.
 *
 * Every tile's width is `calc(var(--k) * var(--unit))`, so changing one custom
 * property on the container re-sizes all 154 at once and CSS transitions the
 * change. No layout maths here, and no DOM is touched.
 */
function initZoom() {
    const steps = document.querySelectorAll('.zoom-step');
    const galleryEl = document.querySelector('[data-gallery]');
    if (!steps.length || !galleryEl)
        return;
    const STORAGE_KEY = 'cv:zoom';
    const apply = (unit, persist) => {
        galleryEl.style.setProperty('--unit', `${unit}px`);
        for (const step of steps) {
            const active = step.dataset.unit === unit;
            step.classList.toggle('is-active', active);
            step.setAttribute('aria-pressed', String(active));
        }
        if (persist) {
            try {
                localStorage.setItem(STORAGE_KEY, unit);
            }
            catch { /* private mode */ }
        }
    };
    for (const step of steps) {
        step.addEventListener('click', () => apply(step.dataset.unit ?? '126', true));
    }
    // Remember the reader's preferred density between visits.
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && [...steps].some((s) => s.dataset.unit === saved))
            apply(saved, false);
    }
    catch { /* private mode: keep the default */ }
}
/* ------------------------------------------------------------------ nav */
/**
 * Collapses the nav on narrow screens. The `nav-js` class is what switches the
 * stylesheet from "always visible" to "collapsible", so this only ever runs when
 * there is something able to open it again.
 */
function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const panel = document.querySelector('.site-nav');
    if (!toggle || !panel)
        return;
    document.documentElement.classList.add('nav-js');
    const setOpen = (open) => {
        toggle.setAttribute('aria-expanded', String(open));
        panel.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    // Escape closes; so does following a link.
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            setOpen(false);
            toggle.focus();
        }
    });
    panel.addEventListener('click', (event) => {
        if (event.target.closest('a'))
            setOpen(false);
    });
}
/* ------------------------------------------------------------- lightbox */
/**
 * Opens a work over the contact sheet instead of navigating away: the grid stays
 * where it was, blurred behind a veil, and you slide between works without a page
 * load. Arrow keys, swipe and the on-screen arrows all move; Escape closes.
 *
 * Every tile is still a real link to a real page. This intercepts the click and
 * pushes the same URL, so sharing, the back button, middle-click and
 * cmd-click all behave exactly as they would without it — and with scripting off
 * the links simply work.
 */
function initLightbox() {
    const box = document.querySelector('[data-lightbox]');
    const galleryEl = document.querySelector('[data-lightbox-source]');
    if (!box || !galleryEl)
        return;
    const stage = box.querySelector('[data-lightbox-stage]');
    const titleEl = box.querySelector('[data-lightbox-title]');
    const countEl = box.querySelector('[data-lightbox-count]');
    const metaEl = box.querySelector('[data-lightbox-meta]');
    const prevBtn = box.querySelector('[data-lightbox-prev]');
    const nextBtn = box.querySelector('[data-lightbox-next]');
    const tiles = () => [...galleryEl.querySelectorAll('.tile')].filter((t) => !t.hidden);
    let current = -1;
    let openedAt = '';
    /** Rebuilds the plate from the tile's own <picture>, asking for a large size. */
    const paint = (tile, direction) => {
        const picture = tile.querySelector('picture');
        if (!picture)
            return;
        const clone = picture.cloneNode(true);
        clone.classList.remove('tile-image');
        clone.classList.add('lightbox-image');
        // `sizes` describes a *width*, so it has to be expressed as one — the height
        // cap lives in CSS. Asking for ~50vw makes the browser pick the 1600px source
        // on a desktop screen instead of the 400px thumbnail the tile was using.
        for (const source of clone.querySelectorAll('source')) {
            source.setAttribute('sizes', '(max-width: 900px) 92vw, 50vw');
        }
        const img = clone.querySelector('img');
        if (img) {
            img.setAttribute('sizes', '(max-width: 900px) 92vw, 50vw');
            img.loading = 'eager';
            img.removeAttribute('fetchpriority');
        }
        const previous = stage.firstElementChild;
        clone.classList.add(direction >= 0 ? 'enter-from-right' : 'enter-from-left');
        stage.append(clone);
        requestAnimationFrame(() => clone.classList.remove('enter-from-right', 'enter-from-left'));
        if (previous) {
            previous.classList.add(direction >= 0 ? 'leave-to-left' : 'leave-to-right');
            window.setTimeout(() => previous.remove(), 420);
        }
        const d = tile.dataset;
        titleEl.textContent = d.title ?? '';
        const facts = [d.dimensions, d.materials, d.year].filter(Boolean);
        if (d.available === 'true')
            facts.push(box.dataset.availableLabel ?? '');
        metaEl.textContent = facts.filter(Boolean).join(' · ');
    };
    const show = (index, direction, push) => {
        const list = tiles();
        if (!list.length)
            return;
        const wrapped = (index + list.length) % list.length;
        const tile = list[wrapped];
        current = wrapped;
        paint(tile, direction);
        countEl.textContent = countEl.dataset.template
            ? countEl.dataset.template.replace('{n}', String(wrapped + 1)).replace('{total}', String(list.length))
            : `${wrapped + 1} / ${list.length}`;
        prevBtn.hidden = list.length < 2;
        nextBtn.hidden = list.length < 2;
        const href = tile.getAttribute('href');
        if (push && href)
            history.pushState({ lightbox: true }, '', href);
    };
    const open = (tile) => {
        openedAt = location.pathname + location.search;
        box.hidden = false;
        document.body.classList.add('is-locked');
        requestAnimationFrame(() => box.classList.add('is-open'));
        show(tiles().indexOf(tile), 1, true);
        nextBtn.focus({ preventScroll: true });
    };
    const close = (restore) => {
        if (box.hidden)
            return;
        box.classList.remove('is-open');
        document.body.classList.remove('is-locked');
        window.setTimeout(() => {
            box.hidden = true;
            stage.replaceChildren();
        }, 320);
        if (restore && openedAt)
            history.pushState({}, '', openedAt);
        const tile = tiles()[current];
        tile?.focus({ preventScroll: true });
    };
    galleryEl.addEventListener('click', (event) => {
        const tile = event.target.closest('.tile');
        // Leave modified clicks alone — they mean "open this somewhere else".
        if (!tile || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
            return;
        event.preventDefault();
        open(tile);
    });
    prevBtn.addEventListener('click', () => show(current - 1, -1, true));
    nextBtn.addEventListener('click', () => show(current + 1, 1, true));
    box.querySelector('[data-lightbox-close]')?.addEventListener('click', () => close(true));
    box.querySelector('[data-lightbox-veil]')?.addEventListener('click', () => close(true));
    document.addEventListener('keydown', (event) => {
        if (box.hidden)
            return;
        if (event.key === 'Escape')
            close(true);
        else if (event.key === 'ArrowLeft')
            show(current - 1, -1, true);
        else if (event.key === 'ArrowRight')
            show(current + 1, 1, true);
    });
    // Swipe, for touch.
    let startX = 0;
    let startY = 0;
    box.addEventListener('touchstart', (e) => {
        startX = e.changedTouches[0].clientX;
        startY = e.changedTouches[0].clientY;
    }, { passive: true });
    box.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy))
            show(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1, true);
    }, { passive: true });
    // The back button should step out of the lightbox, not off the page.
    window.addEventListener('popstate', () => {
        if (!box.hidden)
            close(false);
    });
}
/* ---------------------------------------------------------------- about */
/**
 * About opens over whatever you are reading, blurring it, rather than taking you
 * to a separate page. The text is fetched from /about/ the first time it is
 * needed — so it costs nothing on any page until someone asks for it — and cached
 * for the rest of the visit.
 */
function initAbout() {
    const overlay = document.querySelector('[data-about]');
    const body = overlay?.querySelector('[data-about-body]');
    const triggers = document.querySelectorAll('[data-overlay="about"]');
    if (!overlay || !body || !triggers.length)
        return;
    let loaded = false;
    let returnTo = null;
    const load = async (href) => {
        if (loaded)
            return;
        try {
            const markup = await fetch(href, { headers: { accept: 'text/html' } }).then((r) => r.text());
            const doc = new DOMParser().parseFromString(markup, 'text/html');
            const source = doc.querySelector('.longform');
            const heading = doc.querySelector('.page-head h1');
            if (!source)
                return;
            body.replaceChildren();
            if (heading) {
                const h = document.createElement('h2');
                h.className = 'about-title';
                h.textContent = heading.textContent ?? '';
                body.append(h);
            }
            /*
             * Set it like a newspaper. The source page stacks its pictures in one row
             * and its text in another, which in a column layout drops every photograph
             * at the top of column one. Pull the paragraphs and the figures apart, then
             * deal the figures back out at even intervals so they sit inside the prose
             * and the text runs around them.
             */
            const blocks = [...source.querySelectorAll('.prose > *')];
            const figures = [...source.querySelectorAll('.figure')];
            for (const figure of figures) {
                figure.classList.remove('reveal');
                figure.classList.add('about-figure', 'is-in');
            }
            const every = figures.length ? Math.max(2, Math.floor(blocks.length / (figures.length + 1))) : 0;
            let next = 0;
            blocks.forEach((block, i) => {
                block.classList.add('about-block');
                body.append(block);
                if (every && next < figures.length && i > 0 && i % every === 0) {
                    body.append(figures[next]);
                    next++;
                }
            });
            // Anything that did not find a slot goes at the end rather than being lost.
            for (; next < figures.length; next++)
                body.append(figures[next]);
            loaded = true;
        }
        catch {
            // Leave the link to behave as a link.
        }
    };
    const open = async (href, trigger) => {
        returnTo = trigger;
        await load(href);
        if (!loaded) {
            location.href = href;
            return;
        }
        overlay.hidden = false;
        document.body.classList.add('is-locked');
        requestAnimationFrame(() => overlay.classList.add('is-open'));
        overlay.querySelector('[data-about-close]')?.focus({ preventScroll: true });
    };
    const close = () => {
        overlay.classList.remove('is-open');
        document.body.classList.remove('is-locked');
        window.setTimeout(() => { overlay.hidden = true; }, 320);
        returnTo?.focus({ preventScroll: true });
    };
    for (const trigger of triggers) {
        trigger.addEventListener('click', (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
                return;
            event.preventDefault();
            void open(trigger.href, trigger);
        });
    }
    overlay.querySelector('[data-about-close]')?.addEventListener('click', close);
    overlay.querySelector('[data-about-veil]')?.addEventListener('click', close);
    document.addEventListener('keydown', (event) => {
        if (!overlay.hidden && event.key === 'Escape')
            close();
    });
}
/* -------------------------------------------------------------------- boot */
initNav();
initScramble();
initYearFloat();
initZoom();
initLightbox();
initAbout();
initCursor();
initReveals();
initHeader();
initFilters();
