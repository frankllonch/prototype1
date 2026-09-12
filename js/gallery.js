/**
 * The year readout, after the iOS photo library: nothing interrupts the grid;
 * the year of whatever is at the top of the viewport floats over it while you
 * scroll, and fades once you stop.
 */
export function initYearFloat() {
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
        const first = tiles.find((tile) => tile.getBoundingClientRect().bottom >= probe);
        const year = first?.dataset.year ?? '';
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
/** Density control: one custom property resizes all 154 tiles. Remembered per browser. */
export function initZoom() {
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
