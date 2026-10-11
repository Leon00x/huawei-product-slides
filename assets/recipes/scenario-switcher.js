/* Manual switching; no timers, backend actions or embedded scenario content. */
(function() {
  document.querySelectorAll('.recipe-scenarios').forEach(container => {
    const buttons = [...container.querySelectorAll('[data-ops-choice]')];
    const panels = [...container.querySelectorAll('[data-ops-panel]')];
    const select = button => {
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      panels.forEach(panel => { panel.hidden = panel.dataset.opsPanel !== button.dataset.opsChoice; });
    };
    buttons.forEach(button => button.addEventListener('click', () => select(button)));
    if(buttons.length) select(buttons[0]);
  });
})();
