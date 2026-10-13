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

test('hidden pages are skipped in both directions while visible steps still work', () => {
  const d = ctx.DeckNavigation.create([0,2,0,0,1],[1,3]);
  d.next(); assert.equal(d.index,2);
  d.next(); assert.equal(d.index,4); assert.equal(d.step,0);
  assert.equal(d.canNext(),true); d.next(); assert.equal(d.step,1);
  assert.equal(d.canNext(),false);
  d.previous(); assert.equal(d.step,0); d.previous(); assert.equal(d.index,2);
  d.previous(); assert.equal(d.index,0); assert.equal(d.canPrevious(),false);
});

test('hiding the current page chooses the next visible page or the last visible page', () => {
  const d = ctx.DeckNavigation.create([0,2,0,1]);
  d.jump(1); assert.equal(d.step,2);
  assert.equal(d.setHidden([1,2]),true); assert.equal(d.index,3); assert.equal(d.step,0);
  d.setHidden([1,2,3]); assert.equal(d.index,0); assert.equal(d.step,0);
});

test('hidden direct links resolve to a visible page and hidden edges remain bounded', () => {
  const d = ctx.DeckNavigation.create([0,0,2,0,0],[0,1,4]);
  assert.equal(d.index,2);
  d.jump(0); assert.equal(d.index,2); assert.equal(d.step,2);
  d.jump(4); assert.equal(d.index,3);
  d.next(); assert.equal(d.index,3);
  d.jump(2,false); d.previous(); assert.equal(d.index,2);
});

test('visibility changes cannot hide every page and corrupt preferences fail open to all pages', () => {
  const d = ctx.DeckNavigation.create([0,0],[0]);
  assert.equal(d.setHidden([0,1]),false); assert.deepEqual([...d.visibleIndices],[1]);
  const corrupt = ctx.DeckNavigation.create([0,0],[0,1]);
  assert.deepEqual([...corrupt.visibleIndices],[0,1]);
  const invalid = ctx.DeckNavigation.create([0,0],[false,-1,2,'0',null,Infinity]);
  assert.deepEqual([...invalid.visibleIndices],[0,1]);
});

test('restoring pages preserves the current page and makes the restored pages navigable', () => {
  const d = ctx.DeckNavigation.create([0,0,0],[1]);
  d.next(); assert.equal(d.index,2);
  assert.equal(d.setHidden([]),true); assert.equal(d.index,2);
  d.previous(); assert.equal(d.index,1);
});
