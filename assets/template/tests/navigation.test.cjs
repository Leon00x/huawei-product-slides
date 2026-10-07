const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = {}; vm.createContext(ctx);
if (fs.existsSync('js/navigation.js')) vm.runInContext(fs.readFileSync('js/navigation.js', 'utf8'), ctx);
test('invalid direct links cannot produce a missing slide', () => {
  assert.ok(ctx.DeckNavigation, 'Navigation is not implemented');
  for (const hash of ['#slide=0', '#slide=12', '#slide=-1', '#slide=8junk', '#anything', '#slide=NaN']) {
    assert.equal(ctx.DeckNavigation.parseHash(hash, 11), null);
  }
  assert.equal(ctx.DeckNavigation.parseHash('#slide=8', 11), 7);
});
test('step sequence advances content before moving to next page', () => {
  assert.ok(ctx.DeckNavigation, 'Navigation is not implemented');
  const d = ctx.DeckNavigation.create([0, 2, 0]);
  d.next(); assert.equal(d.index, 1); assert.equal(d.step, 0);
  d.next(); assert.equal(d.index, 1); assert.equal(d.step, 1);
  d.next(); assert.equal(d.index, 1); assert.equal(d.step, 2);
  d.next(); assert.equal(d.index, 2);
  d.previous(); assert.equal(d.index, 1); assert.equal(d.step, 2);
  d.previous(); assert.equal(d.step, 1);
});
test('page boundaries remain stable and jumps reveal the complete page', () => {
  assert.ok(ctx.DeckNavigation, 'Navigation is not implemented');
  const d = ctx.DeckNavigation.create([0, 2, 0]);
  d.previous(); assert.equal(d.index, 0);
  d.jump(1); assert.equal(d.step, 2);
  d.jump(2); d.next(); assert.equal(d.index, 2);
  d.jump(100); assert.equal(d.index, 2);
});
