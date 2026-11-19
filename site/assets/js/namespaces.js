// The `kubectl get namespace` block on the main page.
// index.html holds the finished state (command, table, links), so it works without
// JS and with reduced motion. When it should animate, play() types the command,
// waits, then reveals the table. The my-cv / my-blogs rows act as a small menu:
// hover / focus / ↑ ↓ select a row, Enter opens it; my-cv is selected by default.

import { Timeline } from './timeline.js';
import { Terminal } from './terminal.js';
import { shouldAnimate, markSeen } from './session.js';

const CONFIG = {
  command: 'kubectl get namespace',
  storageKey: 'kubectl-ns:seen', // typed only on the first view per session (session.js)
  typeMin: 40,                   // ms per character, random in [typeMin, typeMax] (~50)
  typeMax: 60,
  afterType: 300,                // pause before the output appears
};

export class NamespaceList {
  constructor(root) {
    this.root = root;
    this.cmdLine = root.querySelector('.kube-cmd');
    this.rows = [...root.querySelectorAll('a.kube-row')];
    this.selected = 0;
    this.ready = false;

    // Same rules as the intro (session.js). Typing isn't big movement, so it
    // plays with reduced motion too.
    this.animate = shouldAnimate(CONFIG.storageKey);

    if (this.animate) {
      this.term = new Terminal(this.cmdLine, { prompt: '$ ' }); // empty prompt + blinking cursor
      // Table keeps its space but stays invisible (and unfocusable), so the
      // vertically centred page doesn't jump when it appears.
      root.classList.add('is-typing');
    }
    this.bindEvents();
  }

  // Call once the whoami block is fully shown.
  async play() {
    if (this.animate) {
      markSeen(CONFIG.storageKey);
      const t = new Timeline();
      await this.term.type(CONFIG.command, t, CONFIG.typeMin, CONFIG.typeMax);
      await t.sleep(CONFIG.afterType);
      this.term.cursor.remove(); // the cursor moves to the next prompt line
      this.root.classList.remove('is-typing');
    }
    this.ready = true;
    this.select(0);
  }

  select(i) {
    this.selected = Math.max(0, Math.min(this.rows.length - 1, i));
    this.rows.forEach((row, j) => {
      const on = j === this.selected;
      row.classList.toggle('is-selected', on);
      row.tabIndex = on ? 0 : -1; // roving tabindex: Tab enters the list once, ↑ ↓ move inside
    });
  }

  bindEvents() {
    this.rows.forEach((row, i) => {
      row.addEventListener('mouseenter', () => { if (this.ready) this.select(i); });
      row.addEventListener('focus', () => this.select(i));
    });

    document.addEventListener('keydown', e => {
      if (!this.ready || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      // Only when nothing else has focus (or a row does): don't steal keys from
      // the github link, the theme toggle, etc.
      const active = document.activeElement;
      const onRow = this.rows.includes(active);
      if (!onRow && active && active !== document.body) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.select(this.selected + (e.key === 'ArrowDown' ? 1 : -1));
        if (onRow) this.rows[this.selected].focus();
      } else if (e.key === 'Enter' && !onRow) { // on a focused row the link handles Enter itself
        e.preventDefault();
        this.rows[this.selected].click();
      }
    });
  }
}
