(function (global) {
  'use strict';
  global.DeckNavigation = {
    parseHash(hash, count) {
      const match = /^#slide=(\d+)$/.exec(hash);
      if (!match) return null;
      const value = Number(match[1]) - 1;
      return Number.isSafeInteger(value) && value >= 0 && value < count ? value : null;
    },
    create(steps) {
      return {
        index: 0, step: 0,
        next() {
          if (this.step < steps[this.index]) this.step++;
          else if (this.index < steps.length - 1) { this.index++; this.step = 0; }
        },
        previous() {
          if (this.step > 0) this.step--;
          else if (this.index > 0) { this.index--; this.step = steps[this.index]; }
        },
        jump(index, reveal = true) {
          if (!Number.isInteger(index) || index < 0 || index >= steps.length) return;
          this.index = index; this.step = reveal ? steps[index] : 0;
        }
      };
    }
  };
})(globalThis);
