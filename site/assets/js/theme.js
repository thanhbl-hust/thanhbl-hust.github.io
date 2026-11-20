// Light/dark theme. Light is the default; the visitor's choice is kept in localStorage.
// Loaded as a plain (non-module) script at the top of <head> on every page, so the
// saved theme is set on <html data-theme> before first paint. The switch itself is in
// templates/partials/top-bar.html; once the body exists this wires it up (the knob
// slides; the page cross-fades via a view transition, or html.theme-anim without one).
(function () {
  var KEY = 'theme';
  var root = document.documentElement;

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) { /* storage blocked: theme just isn't remembered */ }
  }

  root.dataset.theme = saved() === 'dark' ? 'dark' : 'light';

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    var timer;
    function sync() {
      btn.setAttribute('aria-checked', String(root.dataset.theme === 'dark'));
    }
    btn.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      function apply() {
        root.dataset.theme = next;
        save(next);
        sync();
      }
      if (document.startViewTransition) {
        // The whole page cross-fades as one picture (html.theme-vt sets the speed in
        // main.css), so every letter, surface and the bottom fade change in step. With
        // per-element colour transitions, some text seemed to change late (owner noticed)
        // and the bottom fade ran ahead of the page. The knob's own slide plays live
        // inside the new picture.
        root.classList.add('theme-vt');
        document.startViewTransition(apply).finished
          .finally(function () { root.classList.remove('theme-vt'); });
      } else {
        root.classList.add('theme-anim');
        apply();
        clearTimeout(timer);
        timer = setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
      }
    });

    sync();
  });
})();
