/**
 * The site's only client-side code. No framework, no dependencies.
 *
 * Everything here is an enhancement: the pages are complete and navigable with
 * this file blocked. Section links are real anchors, artwork tiles are real links,
 * and exhibition panels are real elements reachable by their own `#` fragment.
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
/* --------------------------------------------------------------- scramble */
/**
 * Proximity scramble on titles: characters near the pointer show `*` and snap
 * back, the nearer ones holding longer, so a word resolves as a ripple.
 *
 * Characters are armed **only when the pointer moves**, never from inside the
 * animation loop. Re-arming each frame is what made the earlier version jitter:
 * the loop kept extending its own deadlines, so nothing ever settled and the text
 * shimmered for as long as the cursor rested anywhere near it. The loop now only
 * *resolves* deadlines and stops the moment none are left.
 *
 * A character shows a steady `*` rather than a random glyph each frame — one
 * substitution, held, then gone. That is what keeps it calm instead of flickering.
 */
function initScramble() {
    const roots = document.querySelectorAll('[data-scramble]');
    if (!roots.length || reduceMotion.matches || !finePointer.matches)
        return;
    const RADIUS = 80;
    const HOLD = 260; // ms held by a character directly under the pointer
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
    const deadline = new Map();
    let frame = 0;
    const resolve = () => {
        const now = performance.now();
        for (const [span, at] of deadline) {
            if (now >= at) {
                span.textContent = span.dataset.ch;
                deadline.delete(span);
            }
        }
        frame = deadline.size ? requestAnimationFrame(resolve) : 0;
    };
    let lastArm = 0;
    const arm = (pointerX, pointerY) => {
        const now = performance.now();
        // Clear anything already due here as well, so a frozen animation frame can
        // never leave a character stuck showing an asterisk.
        for (const [span, at] of deadline) {
            if (now >= at) {
                span.textContent = span.dataset.ch;
                deadline.delete(span);
            }
        }
        for (const span of chars) {
            const box = span.getBoundingClientRect();
            // Skip anything scrolled out of view rather than measuring all of them.
            if (box.bottom < 0 || box.top > window.innerHeight)
                continue;
            const dx = pointerX - (box.left + box.width / 2);
            const dy = pointerY - (box.top + box.height / 2);
            const distance = Math.hypot(dx, dy);
            if (distance >= RADIUS)
                continue;
            const until = now + HOLD * (1 - distance / RADIUS);
            // Only ever extend a deadline, so a character cannot be yanked back early.
            if ((deadline.get(span) ?? 0) < until) {
                deadline.set(span, until);
                span.textContent = '*';
            }
        }
        if (deadline.size && !frame)
            frame = requestAnimationFrame(resolve);
    };
    document.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse')
            return;
        // Throttled on the clock rather than on an animation frame: arming is cheap
        // and must not depend on a frame callback that a background tab withholds.
        const now = performance.now();
        if (now - lastArm < 16)
            return;
        lastArm = now;
        arm(event.clientX, event.clientY);
    }, { passive: true });
}
/* ------------------------------------------------------------ section nav */
/**
 * Smooth scrolling between homepage sections, and the same links working as
 * ordinary navigation from the artwork page. Uses the platform's own smooth
 * scroll; there is no animation code here to go wrong.
 */
function initSectionNav() {
    const links = document.querySelectorAll('[data-section]');
    const sections = [...document.querySelectorAll('.band[id]')];
    for (const link of links) {
        link.addEventListener('click', (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
                return;
            const id = link.dataset.section;
            const target = document.getElementById(id);
            if (!target)
                return; // another page: let the link navigate home
            event.preventDefault();
            target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
            history.replaceState(null, '', `#${id}`);
        });
    }
    // Mark the section currently in view, so the bar always says where you are.
    if (!sections.length || !('IntersectionObserver' in window))
        return;
    const byId = new Map([...links].map((l) => [l.dataset.section, l]));
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting)
                continue;
            for (const l of links)
                l.removeAttribute('aria-current');
            byId.get(entry.target.id)?.setAttribute('aria-current', 'true');
        }
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => observer.observe(s));
}
/* ------------------------------------------------------------- year float */
/**
 * The year readout, after the iOS photo library: nothing interrupts the grid;
 * the year of whatever is at the top of the viewport floats over it while you
 * scroll, and fades once you stop.
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
        const probe = window.innerHeight * 0.18;
        let year = '';
        for (const tile of tiles) {
            if (tile.getBoundingClientRect().bottom >= probe) {
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
/** Density control: one custom property resizes all 154 tiles. */
function initZoom() {
    const steps = document.querySelectorAll('.zoom-step');
    const galleryEl = document.querySelector('[data-gallery]');
    if (!steps.length || !galleryEl)
        return;
    const KEY = 'cv:zoom';
    const apply = (unit, persist) => {
        galleryEl.style.setProperty('--unit', `${unit}px`);
        for (const step of steps) {
            const active = step.dataset.unit === unit;
            step.classList.toggle('is-active', active);
            step.setAttribute('aria-pressed', String(active));
        }
        if (persist) {
            try {
                localStorage.setItem(KEY, unit);
            }
            catch { /* private mode */ }
        }
    };
    for (const step of steps)
        step.addEventListener('click', () => apply(step.dataset.unit ?? '126', true));
    try {
        const saved = localStorage.getItem(KEY);
        if (saved && [...steps].some((s) => s.dataset.unit === saved))
            apply(saved, false);
    }
    catch { /* keep the default */ }
}
/* --------------------------------------------------------------- lightbox */
/**
 * A painting opens over the contact sheet: the grid stays put, blurred, and you
 * move between works without a page load.
 *
 * One transition per action, and only one in flight. Every navigation takes a
 * ticket; when the fade-out finishes, the swap happens only if that ticket is
 * still the current one. A second click simply issues a new ticket, so the older
 * one lapses instead of racing it — which is what previously made the plate jump
 * back and forth or animate in the wrong direction.
 *
 * History: opening pushes one entry, moving between works replaces it. Back
 * therefore leaves the lightbox in a single press rather than walking back
 * through every painting you looked at.
 */
function initLightbox() {
    const box = document.querySelector('[data-lightbox]');
    const galleryEl = document.querySelector('[data-lightbox-source]');
    if (!box || !galleryEl)
        return;
    const plate = box.querySelector('[data-lightbox-plate]');
    const titleEl = box.querySelector('[data-lightbox-title]');
    const countEl = box.querySelector('[data-lightbox-count]');
    const metaEl = box.querySelector('[data-lightbox-meta]');
    const prevBtn = box.querySelector('[data-lightbox-prev]');
    const nextBtn = box.querySelector('[data-lightbox-next]');
    const tiles = () => [...galleryEl.querySelectorAll('.tile')].filter((t) => !t.hidden);
    const FADE = 200;
    let current = -1;
    let ticket = 0;
    let pending = 0;
    let openedAt = '';
    const fill = (tile, index, total) => {
        const picture = tile.querySelector('picture');
        if (picture) {
            const clone = picture.cloneNode(true);
            clone.classList.remove('tile-image');
            // `sizes` is a width, so it must be expressed as one; the height cap is CSS.
            for (const source of clone.querySelectorAll('source'))
                source.setAttribute('sizes', '(max-width: 900px) 92vw, 46vw');
            const img = clone.querySelector('img');
            if (img) {
                img.setAttribute('sizes', '(max-width: 900px) 92vw, 46vw');
                img.loading = 'eager';
                img.removeAttribute('fetchpriority');
            }
            plate.replaceChildren(clone);
        }
        const d = tile.dataset;
        titleEl.textContent = d.title ?? '';
        countEl.textContent = (countEl.dataset.template ?? '{n} / {total}')
            .replace('{n}', String(index + 1))
            .replace('{total}', String(total));
        const facts = [d.dimensions, d.materials, d.year];
        if (d.available === 'true')
            facts.push(box.dataset.availableLabel ?? '');
        metaEl.replaceChildren(...facts.filter(Boolean).map((fact) => {
            const li = document.createElement('span');
            li.textContent = fact;
            return li;
        }));
    };
    const show = (index, animate) => {
        const list = tiles();
        if (!list.length)
            return;
        const wrapped = (index + list.length) % list.length;
        if (wrapped === current && animate)
            return;
        const tile = list[wrapped];
        current = wrapped;
        const href = tile.getAttribute('href');
        if (href)
            history.replaceState({ lightbox: true }, '', href);
        const mine = ++ticket;
        if (!animate || reduceMotion.matches) {
            fill(tile, wrapped, list.length);
            box.classList.remove('is-changing');
            return;
        }
        box.classList.add('is-changing');
        window.clearTimeout(pending);
        pending = window.setTimeout(() => {
            if (mine !== ticket)
                return; // a newer navigation won; drop this one
            fill(tile, wrapped, list.length);
            box.classList.remove('is-changing');
        }, FADE);
    };
    const open = (tile) => {
        openedAt = location.pathname + location.search;
        box.hidden = false;
        document.body.classList.add('is-locked');
        const list = tiles();
        current = -1;
        show(list.indexOf(tile), false);
        requestAnimationFrame(() => box.classList.add('is-open'));
        history.pushState({ lightbox: true }, '', tile.getAttribute('href') ?? location.href);
        nextBtn.focus({ preventScroll: true });
    };
    const close = (restore) => {
        if (box.hidden)
            return;
        ticket++;
        window.clearTimeout(pending);
        box.classList.remove('is-open', 'is-changing');
        document.body.classList.remove('is-locked');
        window.setTimeout(() => { box.hidden = true; plate.replaceChildren(); }, 260);
        if (restore && openedAt)
            history.replaceState({}, '', openedAt);
        tiles()[current]?.focus({ preventScroll: true });
    };
    galleryEl.addEventListener('click', (event) => {
        const tile = event.target.closest('.tile');
        if (!tile || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
            return;
        event.preventDefault();
        open(tile);
    });
    prevBtn.addEventListener('click', () => show(current - 1, true));
    nextBtn.addEventListener('click', () => show(current + 1, true));
    box.querySelector('[data-lightbox-close]')?.addEventListener('click', () => close(true));
    box.querySelector('[data-lightbox-veil]')?.addEventListener('click', () => close(true));
    document.addEventListener('keydown', (event) => {
        if (box.hidden)
            return;
        if (event.key === 'Escape')
            close(true);
        else if (event.key === 'ArrowLeft')
            show(current - 1, true);
        else if (event.key === 'ArrowRight')
            show(current + 1, true);
    });
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
            show(current + (dx < 0 ? 1 : -1), true);
    }, { passive: true });
    window.addEventListener('popstate', () => { if (!box.hidden)
        close(false); });
}
/* ------------------------------------------------------- exhibition panel */
/**
 * An exhibition opens above the homepage, which stays visible and softly blurred
 * behind it. The panels are already in the page — this only raises one — so there
 * is no fetch, no page load and nothing to wait for.
 */
function initPanels() {
    const panels = [...document.querySelectorAll('[data-panel]')];
    const veil = document.querySelector('[data-panel-veil]');
    if (!panels.length || !veil)
        return;
    let open = null;
    const close = (restore) => {
        if (!open)
            return;
        open.classList.remove('is-open');
        open = null;
        veil.hidden = true;
        document.body.classList.remove('is-locked', 'is-behind-panel');
        if (restore)
            history.replaceState(null, '', location.pathname + location.search);
    };
    const show = (slug) => {
        const panel = document.getElementById(`exhibition-${slug}`);
        if (!panel)
            return;
        if (open && open !== panel)
            open.classList.remove('is-open');
        open = panel;
        veil.hidden = false;
        panel.classList.add('is-open');
        panel.scrollTop = 0;
        document.body.classList.add('is-locked', 'is-behind-panel');
        panel.querySelector('[data-panel-close]')?.focus({ preventScroll: true });
    };
    for (const trigger of document.querySelectorAll('[data-exhibition]')) {
        trigger.addEventListener('click', (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
                return;
            event.preventDefault();
            history.replaceState(null, '', `#exhibition-${trigger.dataset.exhibition}`);
            show(trigger.dataset.exhibition);
        });
    }
    for (const panel of panels) {
        panel.querySelector('[data-panel-close]')?.addEventListener('click', (event) => {
            event.preventDefault();
            close(true);
        });
    }
    veil.addEventListener('click', () => close(true));
    document.addEventListener('keydown', (event) => {
        if (open && event.key === 'Escape')
            close(true);
    });
    // Arriving on a shared #exhibition-… link opens that one straight away.
    const hash = /^#exhibition-(.+)$/.exec(location.hash);
    if (hash)
        show(hash[1]);
}
/* ----------------------------------------------------------------- cursor */
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
        const ease = reduceMotion.matches ? 1 : 0.18;
        x += (targetX - x) * ease;
        y += (targetY - y) * ease;
        cursor.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        frame = Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1 || active
            ? requestAnimationFrame(tick)
            : 0;
    };
    document.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse')
            return;
        targetX = event.clientX;
        targetY = event.clientY;
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
        if (!frame)
            frame = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener('pointerleave', () => {
        active = false;
        cursor.classList.remove('is-visible');
    });
}
/* ---------------------------------------------------------------- reveals */
/** Whether an element is *provably* below the fold. A zero-height box means
 *  layout is unknown, so the honest answer is no — show it. */
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
    // The first screen must not wait on an observer callback, which is throttled in
    // a backgrounded tab; a reader landing there would find an empty page.
    for (const el of targets) {
        if (isOffscreen(el))
            continue;
        el.classList.add('is-in');
        observer.unobserve(el);
        revealed++;
    }
    window.setTimeout(() => {
        if (revealed === 0) {
            targets.forEach((el) => el.classList.add('is-in'));
            observer.disconnect();
            return;
        }
        for (const el of targets)
            if (!isOffscreen(el))
                el.classList.add('is-in');
    }, 2500);
}
/* -------------------------------------------------------------------- nav */
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
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
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
initScramble();
initSectionNav();
initYearFloat();
initZoom();
initLightbox();
initPanels();
initCursor();
initReveals();
