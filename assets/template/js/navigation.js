(function (global) {
  'use strict';
  global.DeckNavigation = {
    parseHash(hash, count) {
      const match = /^#slide=(\d+)$/.exec(hash);
      if (!match) return null;
      const value = Number(match[1]) - 1;
      return Number.isSafeInteger(value) && value >= 0 && value < count ? value : null;
    },
    create(steps, hiddenIndices = []) {
      const normalize = indices => new Set(Array.isArray(indices) ? indices.filter(index =>
        Number.isInteger(index) && index >= 0 && index < steps.length) : []);
      let hidden = normalize(hiddenIndices);
      if (hidden.size === steps.length) hidden.clear();
      return {
        index: steps.findIndex((_, index) => !hidden.has(index)), step: 0,
        get visibleIndices() { return steps.map((_, index) => index).filter(index => !hidden.has(index)); },
        isVisible(index) { return Number.isInteger(index) && index >= 0 && index < steps.length && !hidden.has(index); },
        canNext() { return this.step < steps[this.index] || this.visibleIndices.some(index => index > this.index); },
        canPrevious() { return this.step > 0 || this.visibleIndices.some(index => index < this.index); },
        setHidden(indices) {
          const next = normalize(indices);
          if (next.size === steps.length) return false;
          hidden = next;
          if (!this.isVisible(this.index)) this.jump(this.index, false);
          return true;
        },
        next() {
          if (this.step < steps[this.index]) this.step++;
          else {
            const next = this.visibleIndices.find(index => index > this.index);
            if (next !== undefined) { this.index = next; this.step = 0; }
          }
        },
        previous() {
          if (this.step > 0) this.step--;
          else {
            const previous = this.visibleIndices.filter(index => index < this.index).at(-1);
            if (previous !== undefined) { this.index = previous; this.step = steps[previous]; }
          }
        },
        jump(index, reveal = true) {
          if (!Number.isInteger(index) || index < 0 || index >= steps.length) return;
          const visible = this.visibleIndices;
          this.index = visible.find(candidate => candidate >= index) ?? visible.at(-1);
          this.step = reveal ? steps[this.index] : 0;
        }
      };
    }
  };
})(globalThis);
