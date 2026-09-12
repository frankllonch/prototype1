import { isPlainClick, reduceMotion } from "./env.js";
/**
 * Section links scroll smoothly on the homepage and work as ordinary links from
 * anywhere else. Uses the platform's own smooth scroll; there is no animation
 * code here to go wrong.
 */
export function initSectionNav() {
    const links = document.querySelectorAll('[data-section]');
    const sections = [...document.querySelectorAll('.band[id]')];
    for (const link of links) {
        link.addEventListener('click', (event) => {
            if (!isPlainClick(event))
                return;
            const target = document.getElementById(link.dataset.section);
            if (!target)
                return; // another page: let the link navigate home
            event.preventDefault();
            target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
            history.replaceState(null, '', `#${target.id}`);
        });
    }
    // Mark the section in view, so the bar always says where you are.
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
/** The mobile menu. The panel only collapses once scripting confirms it can reopen. */
export function initMenuToggle() {
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
