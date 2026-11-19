import { RolloutIntro } from './rollout-intro.js';
import { NamespaceList } from './namespaces.js';
import { forcedByUrl } from './session.js';

const page = document.querySelector('.page');
const namespaces = new NamespaceList(document.getElementById('kube'));

new RolloutIntro({
  // Called when the intro hands over (or right away if it doesn't play this session).
  onComplete: async () => {
    document.body.classList.add('is-ready');
    // Start typing `kubectl get namespace` once the whoami block is fully visible:
    // after the page entrance and the intro overlay's exit (whichever runs).
    const overlay = document.querySelector('.ri');
    const running = [...page.getAnimations(), ...(overlay ? overlay.getAnimations() : [])];
    await Promise.all(running.map(a => a.finished.catch(() => {})));
    namespaces.play();
  },
}).mount();

// Both animations have read ?intro by now; drop it from the address bar so a later
// Back / reload of this entry doesn't force them again.
if (forcedByUrl()) {
  const url = new URL(location.href);
  url.searchParams.delete('intro');
  history.replaceState(history.state, '', url.pathname + url.search + url.hash);
}
