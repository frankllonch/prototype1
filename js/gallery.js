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
/**
 * Filters for the sheet: a count of the newest works to show, and a year. The
 * two combine — the year narrows the set, the count caps it — and filtering is
 * a `hidden` toggle, so the sheet re-flows on its own and the lightbox, which
 * skips hidden tiles, follows automatically.
 */
export function initFilters() {
    const root = document.querySelector('[data-filters]');
    const galleryEl = document.querySelector('[data-gallery]');
    if (!root || !galleryEl)
        return;
    const tiles = [...galleryEl.querySelectorAll('.tile')];
    const countChips = [...root.querySelectorAll('[data-filter-count]')];
    const yearChips = [...root.querySelectorAll('[data-filter-year]')];
    let count = 'all';
    let year = 'all';
    const press = (chips, key, value) => {
        for (const chip of chips) {
            const active = chip.dataset[key] === value;
            chip.classList.toggle('is-active', active);
            chip.setAttribute('aria-pressed', String(active));
        }
    };
    const apply = () => {
        const cap = count === 'all' ? Infinity : Number(count);
        let shown = 0;
        for (const tile of tiles) {
            const matches = year === 'all' || tile.dataset.year === year;
            const show = matches && shown < cap;
            tile.hidden = !show;
            if (show)
                shown++;
        }
        press(countChips, 'filterCount', count);
        press(yearChips, 'filterYear', year);
    };
    for (const chip of countChips)
        chip.addEventListener('click', () => { count = chip.dataset.filterCount; apply(); });
    for (const chip of yearChips)
        chip.addEventListener('click', () => { year = chip.dataset.filterYear; apply(); });
}
