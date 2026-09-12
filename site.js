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
/* -------------------------------------------------------------------- boot */
initNav();
initZoom();
initCursor();
initReveals();
initHeader();
initFilters();
