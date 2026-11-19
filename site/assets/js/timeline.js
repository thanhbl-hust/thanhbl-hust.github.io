// Cancellable sleep(). After cancel(), pending and future sleeps never resolve,
// so an async script awaiting them simply stops where it is.
export class Timeline {
  constructor() {
    this.cancelled = false;
    this.timers = new Set();
  }

  sleep(ms) {
    if (this.cancelled) return new Promise(() => {});
    return new Promise(resolve => {
      const id = setTimeout(() => { this.timers.delete(id); resolve(); }, ms);
      this.timers.add(id);
    });
  }

  cancel() {
    this.cancelled = true;
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }
}
