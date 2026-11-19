// Blog post table of contents (built by scripts/build.mjs): marks the entry of the
// section being read with .is-active — the last heading whose top has passed ~1/4 of the viewport.
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
