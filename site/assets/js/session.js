// When the page animations (intro, `kubectl get namespace` typing) should play:
// only on the first view in this tab's session (sessionStorage) — not on reloads,
// not when coming back from cv/ or blogs/ (owner's final choice) — or always with
// ?intro in the URL (testing; main.js strips it right after, so Back doesn't replay).
// index.html's inline pre-paint script repeats the intro check — keep the two in sync.

export function forcedByUrl() {
  return new URLSearchParams(location.search).has('intro');
}

export function shouldAnimate(storageKey) {
  if (forcedByUrl()) return true;
  try { return sessionStorage.getItem(storageKey) !== '1'; } catch { return true; }
}

export function markSeen(storageKey) {
  try { sessionStorage.setItem(storageKey, '1'); } catch { /* not remembered: plays again next time */ }
}
