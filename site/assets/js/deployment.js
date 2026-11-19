// The Deployment frame of the intro: pod cards (drawn as cubes) plus a
// `kubectl rollout status` line computed from the pods' state.
// A card's look is driven by data-phase: pending | creating | running | terminating.

const CUBE = `<svg class="ri-cube" viewBox="0 0 64 64" aria-hidden="true">
  <path class="top" d="M32 6 56 19 32 32 8 19Z"/>
  <path class="left" d="M8 19 32 32 32 58 8 45Z"/>
  <path class="right" d="M56 19 56 45 32 58 32 32Z"/>
</svg>`;

const LABEL = {
  pending: 'Pending',
  creating: 'ContainerCreating',
  running: 'Running',
  terminating: 'Terminating',
};

// Alphabet Kubernetes uses for generated name suffixes (no vowels, no 0/1/3).
const ALPHABET = 'bcdfghjklmnpqrstvwxz2456789';
const randomId = n => Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

const FLIP_MS = 350;
const FLIP_EASE = 'cubic-bezier(.2, .8, .2, 1)';

// Run `mutate`, then animate `els` from where they were to where they ended up.
function flip(els, mutate) {
  const before = new Map(els.map(el => [el, el.getBoundingClientRect()]));
  mutate();
  for (const [el, a] of before) {
    if (!el.isConnected) continue;
    const b = el.getBoundingClientRect();
    const dx = a.left - b.left;
    const dy = a.top - b.top;
    if (dx || dy) {
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: FLIP_MS, easing: FLIP_EASE });
    }
  }
}

export class Deployment {
  constructor({ name, replicas }) {
    this.name = name;
    this.replicas = replicas;
    // pod-template-hash of each ReplicaSet (9 chars keeps the name prefix on one card line)
    const old = randomId(9);
    let next;
    do { next = randomId(9); } while (next === old);
    this.hash = { old, new: next };
    this.usedIds = new Set();
    this.pods = [];

    this.el = document.createElement('div');
    this.el.innerHTML = `
      <section class="ri-deploy">
        <header class="ri-deploy-head">
          <span><span class="ri-kind">Deployment:</span> <b class="ri-deploy-name"></b></span>
          <span class="ri-meta">RollingUpdate · maxSurge 1 · maxUnavailable 0</span>
        </header>
        <ul class="ri-pods"></ul>
      </section>
      <p class="ri-status"></p>`;
    this.el.querySelector('.ri-deploy-name').textContent = name;
    this.list = this.el.querySelector('.ri-pods');
    // Room for the surge pod plus the old pod that is still Terminating.
    this.list.style.setProperty('--slots', replicas + 2);
    this.status = this.el.querySelector('.ri-status');

    for (let i = 0; i < replicas; i++) this.addPod('old', 'running', { animate: false });
  }

  // Pods of one ReplicaSet share `<deployment>-<hash>-`; only the 5-char suffix
  // tells them apart, so it must never repeat and is what the card emphasises.
  uniqueId() {
    let id;
    do { id = randomId(5); } while (this.usedIds.has(id));
    this.usedIds.add(id);
    return id;
  }

  addPod(rs, phase, { animate = true } = {}) {
    const id = this.uniqueId();
    const li = document.createElement('li');
    li.className = animate ? 'ri-pod is-new' : 'ri-pod';
    li.title = `${this.name}-${this.hash[rs]}-${id}`;
    li.innerHTML = `${CUBE}
      <span class="ri-pod-name"><span class="ri-pod-prefix"></span><span class="ri-pod-id"></span></span>
      <span class="ri-pod-status"><i class="ri-ind"></i><span class="ri-phase"></span></span>`;
    li.querySelector('.ri-pod-prefix').textContent = `${this.name}-${this.hash[rs]}-`;
    li.querySelector('.ri-pod-id').textContent = id;

    const pod = { rs, el: li };
    flip([...this.list.children], () => this.list.append(li));
    this.pods.push(pod);
    this.setPhase(pod, phase);
    return pod;
  }

  setPhase(pod, phase) {
    const becameReady = phase === 'running' && pod.phase === 'creating';
    pod.phase = phase;
    pod.el.dataset.phase = phase;
    pod.el.querySelector('.ri-phase').textContent = LABEL[phase];
    if (becameReady) {
      pod.el.classList.remove('is-pulse');
      void pod.el.offsetWidth; // restart the animation
      pod.el.classList.add('is-pulse');
    }
    this.renderStatus();
  }

  nextOldPod() {
    return this.pods.find(p => p.rs === 'old' && p.phase !== 'terminating');
  }

  remove(pod) {
    this.pods = this.pods.filter(p => p !== pod);
    this.renderStatus();
    const out = pod.el.animate(
      [{ opacity: getComputedStyle(pod.el).opacity, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.9)' }],
      { duration: 200, easing: 'ease-in', fill: 'forwards' },
    );
    out.onfinish = () => flip([...this.list.children].filter(el => el !== pod.el), () => pod.el.remove());
  }

  // The pod the exit transition zooms into: the middle one of the new ReplicaSet.
  focusPod() {
    const fresh = this.pods.filter(p => p.rs === 'new');
    return fresh[Math.floor(fresh.length / 2)]?.el ?? null;
  }

  // Same checks, in the same order, as `kubectl rollout status` for a Deployment.
  // Terminating pods don't count: the ReplicaSet controller ignores them.
  renderStatus() {
    const n = this.replicas;
    const d = this.name;
    const active = this.pods.filter(p => p.phase !== 'terminating');
    const updated = active.filter(p => p.rs === 'new').length;
    const available = active.filter(p => p.phase === 'running').length;
    const wait = `Waiting for deployment "${d}" rollout to finish:`;

    let msg;
    if (updated < n) msg = `${wait} ${updated} out of ${n} new replicas have been updated...`;
    else if (active.length > updated) msg = `${wait} ${active.length - updated} old replicas are pending termination...`;
    else if (available < updated) msg = `${wait} ${available} of ${updated} updated replicas are available...`;

    this.status.textContent = msg ?? `deployment "${d}" successfully rolled out`;
    this.status.classList.toggle('is-done', !msg);
  }
}
