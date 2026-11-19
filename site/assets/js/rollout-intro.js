// RolloutIntro — full-screen intro, shown only on the first view in a session (see session.js):
//   1. types `kubectl rollout restart deploy <name>` in a small terminal
//   2. terminal moves up, a Deployment with <replicas> Running pods appears
//   3. RollingUpdate (maxSurge 1 / maxUnavailable 0) replaces the pods one by one
//   4. a `kubectl rollout status` line follows along
//   5. zooms into a pod and hands over to the page (onComplete)
//
// Usage: new RolloutIntro({ onComplete }).mount();
// Skip: the Skip button or any key. When it plays is decided in session.js (not
// when coming back from cv/ or blogs/; ?intro forces it). With prefers-reduced-motion
// it still plays, but without big movement: no FLIP slides and a fade instead of the zoom.

import { Timeline } from './timeline.js';
import { Terminal } from './terminal.js';
import { Deployment } from './deployment.js';
import { shouldAnimate, markSeen } from './session.js';

export const CONFIG = {
  deployment: 'my-portfolio',
  replicas: 3,
  // Also read by the inline script in index.html — keep the two in sync.
  storageKey: 'rollout-intro:seen',
  // All in ms. Total with these values ≈ 6 s (owner's target).
  timing: {
    start: 200,        // empty screen before typing
    typeMin: 16,       // per typed character: random between typeMin and typeMax
    typeMax: 30,
    afterType: 200,    // pause before "Enter"
    afterOutput: 300,  // "restarted" visible before the terminal moves up
    layout: 400,       // terminal moves up, Deployment appears
    pending: 250,      // new pod: Pending -> ContainerCreating
    creating: 450,     // new pod: ContainerCreating -> Running
    nextPod: 120,      // Ready -> next new pod is created
    terminate: 500,    // old pod fades while Terminating, then is removed
    hold: 350,         // after "successfully rolled out"
    exit: 600,         // zoom into a pod + fade to the page
    skipExit: 300,     // fade when skipped
  },
};

const EASE = 'cubic-bezier(.65, 0, .35, 1)';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class RolloutIntro {
  constructor({ onComplete = () => {}, config = CONFIG } = {}) {
    this.onComplete = onComplete;
    this.cfg = config;
    this.done = false;
  }

  // Reduced motion doesn't stop the intro (the owner's own Windows has animation
  // effects off and wants to see it); it only tones the movement down.
  static shouldPlay(cfg = CONFIG) {
    return shouldAnimate(cfg.storageKey);
  }

  mount(parent = document.body) {
    const root = document.documentElement;
    if (!RolloutIntro.shouldPlay(this.cfg)) {
      root.classList.remove('intro-pending');
      this.done = true;
      this.onComplete();
      return this;
    }

    markSeen(this.cfg.storageKey);
    this.build();
    parent.append(this.el);
    root.classList.add('intro-open');
    root.classList.remove('intro-pending'); // the pre-paint cover from index.html is no longer needed

    this.onKey = () => this.finish(true);
    window.addEventListener('keydown', this.onKey);
    this.timeline = new Timeline();
    this.play(this.timeline);
    return this;
  }

  build() {
    const { deployment, replicas, timing } = this.cfg;
    this.el = document.createElement('div');
    this.el.className = 'ri';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', `Intro: kubectl rollout restart deploy ${deployment}`);
    this.el.style.setProperty('--ri-terminate', `${timing.terminate}ms`);
    this.el.innerHTML = `
      <button class="ri-skip" type="button">Skip</button>
      <div class="ri-center" aria-hidden="true">
        <div class="ri-term"></div>
        <div class="ri-stage" hidden></div>
      </div>`;

    this.term = new Terminal(this.el.querySelector('.ri-term'), { prompt: '$ ' });
    this.deploy = new Deployment({ name: deployment, replicas });
    this.stage = this.el.querySelector('.ri-stage');
    this.stage.append(this.deploy.el);
    this.el.querySelector('.ri-skip').addEventListener('click', () => this.finish(true));
  }

  async play(t) {
    const { deployment, replicas, timing: T } = this.cfg;

    await t.sleep(T.start);
    await this.term.type(`kubectl rollout restart deploy ${deployment}`, t, T.typeMin, T.typeMax);
    await t.sleep(T.afterType);
    this.term.enter(`deployment.apps/${deployment} restarted`);
    await t.sleep(T.afterOutput);

    this.showDeployment(T.layout);
    await t.sleep(T.layout);

    // maxSurge 1 / maxUnavailable 0: one extra pod at a time, and an old pod
    // is only terminated once its replacement is Ready.
    for (let i = 0; i < replicas; i++) {
      const pod = this.deploy.addPod('new', 'pending');
      await t.sleep(T.pending);
      this.deploy.setPhase(pod, 'creating');
      await t.sleep(T.creating);
      this.deploy.setPhase(pod, 'running');

      const old = this.deploy.nextOldPod();
      this.deploy.setPhase(old, 'terminating');
      t.sleep(T.terminate).then(() => this.deploy.remove(old));
      await t.sleep(i < replicas - 1 ? T.nextPod : T.terminate);
    }

    await t.sleep(T.hold);
    this.finish(false);
  }

  // Terminal shrinks and slides up (FLIP) while the Deployment fades in below it.
  showDeployment(duration) {
    const term = this.term.el;
    const a = term.getBoundingClientRect();
    term.classList.add('is-compact');
    this.stage.hidden = false;
    if (reducedMotion()) return; // no slide; the stage still fades in (CSS)
    const b = term.getBoundingClientRect();
    term.animate([
      { transformOrigin: '0 0', transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width})` },
      { transformOrigin: '0 0', transform: 'none' },
    ], { duration, easing: EASE });
  }

  finish(skipped) {
    if (this.done) return;
    this.done = true;
    this.timeline.cancel();
    window.removeEventListener('keydown', this.onKey);
    document.documentElement.classList.remove('intro-open');

    const T = this.cfg.timing;
    let frames = [{ opacity: 1 }, { opacity: 0 }];
    let duration = skipped ? T.skipExit : T.exit;
    const target = skipped || reducedMotion() ? null : this.deploy.focusPod();
    if (target) {
      const r = target.getBoundingClientRect();
      this.el.style.transformOrigin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
      frames = [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 1, offset: 0.35 },
        { opacity: 0, transform: 'scale(4)' },
      ];
    }

    // Start the exit first, so onComplete can see (and wait for) it via getAnimations().
    const anim = this.el.animate(frames, { duration, easing: EASE, fill: 'forwards' });
    anim.onfinish = () => this.el.remove();
    this.onComplete(); // the page starts its entrance underneath the fading overlay
  }
}
