import { RolloutIntro } from './rollout-intro.js';
import { NamespaceList } from './namespaces.js';

const page = document.querySelector('.page');
const namespaces = new NamespaceList(document.getElementById('kube'));

new RolloutIntro({
  // Called when the intro hands over (or right away if it doesn't play this session).
  onComplete: async () => {
    document.body.classList.add('is-ready');
    // Start typing `kubectl get namespace` once the page entrance has finished.
    await Promise.all(page.getAnimations().map(a => a.finished.catch(() => {})));
    namespaces.play();
  },
}).mount();
