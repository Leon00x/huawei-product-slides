/* Prices and capacities must come from the current project, never this skill. */
(function(root) {
  'use strict';
  root.DeckPricing = {render(container, rows, labels = {}) {
    const cached = rows.some(row => row.cacheInput != null);
    const columns = [['name', labels.name || 'Name'], ['input', labels.input || 'Input']];
    if (cached) columns.push(['cacheInput', labels.cacheInput || 'Cached input']);
    columns.push(['output', labels.output || 'Output']);
    const table = document.createElement('table'); table.className = 'recipe-pricing';
    const head = document.createElement('thead'), header = document.createElement('tr');
    columns.forEach(([,label]) => {const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = label; header.append(cell);});
    head.append(header); table.append(head);
    const body = document.createElement('tbody');
    rows.forEach(row => {const tr = document.createElement('tr'); columns.forEach(([key]) => {const cell = document.createElement(key === 'name' ? 'th' : 'td'); if(key === 'name') cell.scope = 'row'; cell.textContent = row[key] == null ? (labels.missing || '—') : String(row[key]); tr.append(cell);}); body.append(tr);});
    table.append(body); container.replaceChildren(table); return table;
  }};
})(typeof window !== 'undefined' ? window : globalThis);
