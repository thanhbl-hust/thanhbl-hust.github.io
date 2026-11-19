// A one-command terminal: types a command char by char, then "presses Enter"
// and prints its output.
export class Terminal {
  constructor(el, { prompt = '$ ' } = {}) {
    this.el = el;
    this.prompt = prompt;
    this.reset();
  }

  reset() {
    this.el.textContent = '';
    const ps1 = document.createElement('span');
    ps1.className = 'ps1';
    ps1.textContent = this.prompt;
    this.cmd = document.createElement('span');
    this.cmd.className = 'cmd';
    this.cursor = document.createElement('span');
    this.cursor.className = 'cursor';
    this.line().append(ps1, this.cmd, this.cursor);
  }

  line(extraClass = '') {
    const el = document.createElement('div');
    el.className = `line ${extraClass}`.trim();
    this.el.append(el);
    return el;
  }

  async type(text, timeline, minMs = 40, maxMs = 110) {
    this.cursor.classList.add('typing');
    for (const ch of text) {
      this.cmd.textContent += ch;
      await timeline.sleep(minMs + Math.random() * (maxMs - minMs));
    }
    this.cursor.classList.remove('typing');
  }

  enter(output) {
    this.cursor.remove();
    this.line('out').textContent = output;
  }
}
