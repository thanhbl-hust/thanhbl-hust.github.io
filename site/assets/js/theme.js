// Light/dark theme. Light is the default; the visitor's choice is kept in localStorage.
// Loaded as a plain (non-module) script at the top of <head> on every page, so the
// saved theme is set on <html data-theme> before first paint. Once the body exists
// it adds the toggle switch (the knob slides; colours cross-fade via html.theme-anim).
(function () {
  var KEY = 'theme';
  var root = document.documentElement;

  var SUN = '<svg class="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/>' +
    '<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg class="icon-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) { /* storage blocked: theme just isn't remembered */ }
  }

  root.dataset.theme = saved() === 'dark' ? 'dark' : 'light';

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-label', 'Dark mode');
    btn.innerHTML = '<span class="theme-knob" aria-hidden="true">' + SUN + MOON + '</span>';

    var timer;
    function sync() {
      btn.setAttribute('aria-checked', String(root.dataset.theme === 'dark'));
    }
    btn.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.classList.add('theme-anim');
      root.dataset.theme = next;
      save(next);
      sync();
      clearTimeout(timer);
      timer = setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
    });

    sync();
    document.body.append(btn);
  });
})();
