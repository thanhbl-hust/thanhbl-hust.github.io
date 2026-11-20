// Blog post table of contents (built by scripts/build.mjs).
// 1. Scrollspy: marks the entry of the section being read with .is-active — the last
//    heading whose top has passed ~1/4 of the viewport.
// 2. Drawer (below the 1340px sidebar breakpoint, see main.css): the "Contents" button
//    slides the TOC in from the right over a dimmed page; the backdrop, the × button,
//    Esc or picking an entry closes it.
const links = [...document.querySelectorAll('.toc a[href^="#"]')];
const targets = links
  .map(a => [a, document.getElementById(decodeURIComponent(a.hash.slice(1)))])
  .filter(([, h]) => h);

if (targets.length) {
  let active = null;
  let queued = false;

  const update = () => {
    queued = false;
    const line = window.innerHeight / 4;
    let current = targets[0][0];
    for (const [a, h] of targets) if (h.getBoundingClientRect().top <= line) current = a;
    if (current !== active) {
      active?.classList.remove('is-active');
      current.classList.add('is-active');
      active = current;
    }
  };

  const onScroll = () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

const toc = document.querySelector('.toc');
const toggle = document.querySelector('.toc-toggle');
if (toc && toggle) {
  const root = document.documentElement;
  const backdrop = document.querySelector('.toc-backdrop');
  const wide = matchMedia('(min-width: 1340px)');   // = the sidebar breakpoint in main.css
  let inerted = [];

  const isOpen = () => root.classList.contains('toc-open');

  // While open the page behind doesn't scroll. Done here rather than with overflow: hidden
  // (see main.css): wheel / touch / scroll keys are cancelled unless they scroll the drawer
  // itself (its overscroll-behavior: contain keeps them from reaching the page).
  const drawerScrolls = target => toc.contains(target) && toc.scrollHeight > toc.clientHeight;
  const SCROLL_KEYS = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);
  const blockScroll = e => { if (!drawerScrolls(e.target)) e.preventDefault(); };
  const blockKeys = e => { if (SCROLL_KEYS.has(e.key) && !drawerScrolls(e.target)) e.preventDefault(); };
  const lock = on => {
    const method = on ? 'addEventListener' : 'removeEventListener';
    window[method]('wheel', blockScroll, { passive: false });
    window[method]('touchmove', blockScroll, { passive: false });
    window[method]('keydown', blockKeys);
  };

  const open = () => {
    if (wide.matches || isOpen()) return;
    lock(true);
    root.classList.add('toc-open');
    toggle.setAttribute('aria-expanded', 'true');
    // While open, everything except the drawer and its backdrop is inert: no focus,
    // clicks or screen reader browsing behind it.
    // (the siblings of the drawer and of each of its ancestors, up to <body>)
    inerted = [];
    for (let el = toc; el.parentElement && el !== document.body; el = el.parentElement) {
      for (const sib of el.parentElement.children) {
        if (sib !== el && sib !== backdrop && !sib.inert) inerted.push(sib);
      }
    }
    for (const el of inerted) el.inert = true;
    (toc.querySelector('a.is-active') || toc.querySelector('a'))?.focus({ preventScroll: true });
  };

  const close = ({ restoreFocus = true } = {}) => {
    if (!isOpen()) return;
    lock(false);
    root.classList.remove('toc-open');
    toggle.setAttribute('aria-expanded', 'false');
    for (const el of inerted) el.inert = false;
    inerted = [];
    if (restoreFocus) toggle.focus({ preventScroll: true });
    else document.activeElement?.blur();
  };

  toggle.addEventListener('click', open);
  backdrop?.addEventListener('click', () => close());
  toc.querySelector('.toc-close')?.addEventListener('click', () => close());
  // Picking an entry: close first (unlocks scrolling), then the link's own jump runs.
  toc.addEventListener('click', e => { if (!wide.matches && e.target.closest('a')) close({ restoreFocus: false }); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  wide.addEventListener('change', () => close({ restoreFocus: false }));   // widened into sidebar mode
}
