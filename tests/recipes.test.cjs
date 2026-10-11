const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/recipes/pricing-table.js', 'utf8');
function render(rows) {
  function node(tag) {return {tag, children:[], textContent:'', append(child){this.children.push(child)}, replaceChildren(child){this.children=[child]}};}
  const context = {document:{createElement:node}}; context.globalThis=context;
  vm.runInNewContext(source,context);
  const container=node('div'); return context.DeckPricing.render(container,rows);
}
test('cache input appears directly after input and missing values do not become fabricated prices',()=>{
  const table=render([{name:'A',input:'input-value',cacheInput:'cache-value',output:'output-value'},{name:'B'}]);
  assert.deepEqual(table.children[0].children[0].children.map(x=>x.textContent),['Name','Input','Cached input','Output']);
  assert.deepEqual(table.children[1].children[0].children.map(x=>x.textContent),['A','input-value','cache-value','output-value']);
  assert.deepEqual(table.children[1].children[1].children.map(x=>x.textContent),['B','—','—','—']);
});
test('cache column is omitted when no row supplies a cached input price',()=>{
  const table=render([{name:'<script>',input:null,output:null}]);
  assert.deepEqual(table.children[0].children[0].children.map(x=>x.textContent),['Name','Input','Output']);
  assert.equal(table.children[1].children[0].children[0].textContent,'<script>');
});
