(function () {
  'use strict';
  const slides = [...document.querySelectorAll('#deck > .slide')];
  const slideKeys = slides.map(slide => slide.dataset.slideId || slide.dataset.title);
  const slideSections = slides.map(slide => slide.dataset.section);
  const visibilityKey = window.DeckConfig.id + '-hidden-pages-v1';
  let hiddenKeys = readHiddenKeys(), draftHidden = null;
  const hiddenIndices = keys => slideKeys.flatMap((key, index) => keys.has(key) ? [index] : []);
  const state = DeckNavigation.create(slides.map(s => Number(s.dataset.steps || 0)), hiddenIndices(hiddenKeys));
  const storageKey = window.DeckConfig.id + '-position-v1';
  const dialog = document.getElementById('overview-dialog');
  const controls = document.getElementById('controls');
  const byId = id => document.getElementById(id);
  let idleTimer, toastTimer, returnFocus;
  let pointerAtBottom = false, keyboardControls = false;

  function readHiddenKeys() {
    try {
      const saved = JSON.parse(localStorage.getItem(visibilityKey));
      if (saved?.version !== 1 || !Array.isArray(saved.hidden)) return new Set();
      const keys = new Set(saved.hidden.filter(key => typeof key === 'string' && slideKeys.includes(key)));
      return keys.size < slides.length ? keys : new Set();
    } catch { return new Set(); }
  }

  function refreshOverviewSettings() {
    const editing = draftHidden !== null;
    const choices = editing ? draftHidden : hiddenKeys;
    dialog.classList.toggle('overview-editing', editing);
    byId('overview-manage').hidden = editing;
    for (const id of ['overview-save', 'overview-cancel', 'overview-restore']) byId(id).hidden = !editing;
    byId('overview-mode-label').textContent = editing ? '勾选不演示的页面，再保存' : '点击页面直接跳转';
    byId('overview-skipped-count').textContent = String(choices.size);
    byId('overview-total-count').textContent = String(slides.length);
    byId('overview-save').disabled = choices.size === slides.length;
    byId('overview-settings-error').hidden = !editing || choices.size < slides.length;
  }

  function beginVisibilityEdit() {
    draftHidden = new Set(hiddenKeys);
    refreshThumbnails();
    dialog.querySelector('.thumbnail').focus();
  }

  function cancelVisibilityEdit() {
    draftHidden = null;
    refreshThumbnails();
    byId('overview-manage').focus();
  }

  function saveVisibilityEdit() {
    if (draftHidden === null || draftHidden.size === slides.length) return;
    hiddenKeys = new Set(draftHidden);
    let persisted = true;
    try { localStorage.setItem(visibilityKey, JSON.stringify({version:1, hidden:[...hiddenKeys]})); }
    catch { persisted = false; }
    draftHidden = null;
    state.setHidden(hiddenIndices(hiddenKeys));
    render();
    dialog.close();
    toast(persisted ? '已保存页面屏蔽设置' : '浏览器无法保存设置，本次会话仍会生效');
  }

  const chapters = window.DeckConfig.chapters;
  slides.forEach(slide => {
    if (slide.classList.contains('cover')) return;
    const nav = document.createElement('nav'); nav.className = 'chapter-nav'; nav.setAttribute('aria-label', '演示章节');
    chapters.forEach(chapter => {
      const first = slides.findIndex(s => s.dataset.section === chapter.section);
      if (first < 0) return;
      const link = document.createElement('a'); link.href = `#slide=${first + 1}`;
      link.dataset.chapter = chapter.section;
      const current = chapter.section === slide.dataset.section;
      link.className = current ? 'current' : ''; if (current) link.setAttribute('aria-current', 'true');
      link.textContent = chapter.label; nav.append(link);
    });
    slide.querySelector('.slide-header > span').replaceWith(nav);
  });

  function fit() {
    const rect = byId('viewport').getBoundingClientRect();
    const padding = document.fullscreenElement ? 0 : (window.innerWidth < 700 ? 12 : 36);
    const scale = Math.min((rect.width - padding) / 1600, (rect.height - padding) / 900);
    document.documentElement.style.setProperty('--scale', Math.max(.08, scale));
    const deckBottom = byId('deck').getBoundingClientRect().bottom;
    document.documentElement.style.setProperty('--controls-bottom', `${Math.max(12, innerHeight - deckBottom + 14)}px`);
    if (dialog.open) fitThumbnails();
  }
  function fitThumbnails() {
    dialog.querySelectorAll('.thumbnail-preview').forEach(preview => {
      preview.firstElementChild.style.transform = `scale(${preview.clientWidth / 1600})`;
    });
  }
  function refreshThumbnails() {
    refreshOverviewSettings();
    const grid = byId('overview-grid');
    grid.replaceChildren();
    slides.forEach((slide, index) => {
      const button = document.createElement('button');
      const editing = draftHidden !== null;
      const skipped = (editing ? draftHidden : hiddenKeys).has(slideKeys[index]);
      button.className = 'thumbnail' + (index === state.index ? ' current' : '') +
        (editing && skipped ? ' is-selected' : !editing && skipped ? ' is-skipped' : '');
      button.type = 'button';
      if (editing) button.setAttribute('aria-pressed', String(skipped));
      else if (skipped) { button.disabled = true; button.title = '已屏蔽，请在目录中恢复后演示'; }
      button.setAttribute('aria-label', `第 ${index + 1} 页：${slide.dataset.title}`);
      button.dataset.index = index;
      const preview = document.createElement('div');
      preview.className = 'thumbnail-preview';
      preview.setAttribute('aria-hidden', 'true');
      preview.inert = true;
      const clone = slide.cloneNode(true);
      window.DeckI18n?.copySource(slide, clone);
      if (window.DeckCompleteScenePreview) window.DeckCompleteScenePreview(clone);
      clone.classList.remove('active');
      clone.removeAttribute('aria-hidden');
      clone.removeAttribute('inert');
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      clone.querySelectorAll('a,button,input,textarea,select,[contenteditable]').forEach(el => el.setAttribute('tabindex', '-1'));
      preview.append(clone);
      button.append(preview);
      const caption = document.createElement('div');
      caption.className = 'thumbnail-caption';
      caption.innerHTML = `<b>${String(index + 1).padStart(2, '0')}</b><span>${slide.dataset.title}</span>`;
      button.append(caption);
      if (editing || skipped) {
        const badge = document.createElement('span'); badge.className = 'thumbnail-selection'; badge.setAttribute('aria-hidden', 'true');
        if (editing) {
          const checkbox = document.createElement('span'); checkbox.className = 'thumbnail-selection-box';
          checkbox.textContent = skipped ? '✓' : ''; badge.append(checkbox);
        }
        if (skipped) { const label = document.createElement('span'); label.textContent = '不演示'; badge.append(label); }
        button.append(badge);
      }
      button.addEventListener('click', () => {
        if (draftHidden !== null) {
          if (draftHidden.has(slideKeys[index])) draftHidden.delete(slideKeys[index]);
          else draftHidden.add(slideKeys[index]);
          const scrollTop = dialog.scrollTop;
          refreshThumbnails();
          grid.querySelector(`[data-index="${index}"]`).focus({preventScroll:true});
          dialog.scrollTop = scrollTop;
        } else { state.jump(index); render(); dialog.close(); }
      });
      grid.append(button);
    });
    if (dialog.open) requestAnimationFrame(fitThumbnails);
  }
  function render() {
    const visible = state.visibleIndices;
    slides.forEach((slide, index) => {
      const active = index === state.index;
      slide.classList.toggle('active', active);
      slide.classList.toggle('is-skipped', !state.isVisible(index));
      slide.classList.toggle('presentation-last', index === visible.at(-1));
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
      slide.querySelectorAll('[data-reveal]').forEach(el => {
        const concealed = Number(el.dataset.reveal) > state.step;
        el.classList.toggle('is-concealed', concealed);
        el.setAttribute('aria-hidden', String(concealed));
      });
    });
    const slide = slides[state.index];
    byId('section-label').textContent = slide.dataset.section;
    byId('page-counter').innerHTML = `${String(state.index + 1).padStart(2, '0')} <span>/ ${slides.length}</span>`;
    byId('progress').style.width = `${(visible.indexOf(state.index) + 1) / visible.length * 100}%`;
    byId('previous').disabled = !state.canPrevious();
    byId('next').disabled = !state.canNext();
    slides.forEach(page => page.querySelectorAll('.chapter-nav a').forEach(link => {
      const chapter = chapters.find(item => item.section === link.dataset.chapter);
      const first = slides.findIndex((_, index) => state.isVisible(index) &&
        (chapter.sections || [chapter.section]).includes(slideSections[index]));
      if (first < 0) {
        link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true'); link.setAttribute('tabindex', '-1');
      } else {
        link.href = `#slide=${first + 1}`; link.removeAttribute('aria-disabled'); link.removeAttribute('tabindex');
      }
    }));
    byId('announcement').textContent = `第 ${state.index + 1} 页，共 ${slides.length} 页：${slide.dataset.title}`;
    const hash = `#slide=${state.index + 1}`;
    try { if (location.hash !== hash) history.replaceState(null, '', hash); } catch { location.hash = hash; }
    try { localStorage.setItem(storageKey, JSON.stringify({ index: state.index, step: state.step })); } catch { /* Private browsers can still present. */ }
    refreshThumbnails();
    document.dispatchEvent(new CustomEvent('deckpagechange', { detail: { index: state.index } }));
  }
  function move(direction) { direction > 0 ? state.next() : state.previous(); render(); wake(); }
  function openOverview() {
    returnFocus = document.activeElement;
    draftHidden = null;
    wake(); refreshThumbnails(); dialog.showModal();
    requestAnimationFrame(() => { fitThumbnails(); dialog.querySelector('.current').focus(); });
  }
  function wake(force = false) {
    clearTimeout(idleTimer);
    if (force || pointerAtBottom || (keyboardControls && controls.contains(document.activeElement))) {
      document.body.classList.add('controls-visible');
      if (force && !pointerAtBottom) idleTimer = setTimeout(() => {
        if (!(keyboardControls && controls.contains(document.activeElement))) document.body.classList.remove('controls-visible');
      }, 2600);
    } else {
      idleTimer = setTimeout(() => document.body.classList.remove('controls-visible'), 250);
    }
  }
  function toast(message) {
    byId('toast').textContent = message; byId('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => byId('toast').hidden = true, 3500);
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.body.requestFullscreen) await document.body.requestFullscreen();
      else toast('当前浏览器不支持网页全屏，可使用浏览器的全屏功能。');
    } catch { toast('全屏未能开启，可使用浏览器的全屏功能。'); }
    byId('fullscreen').blur();
  }
  byId('previous').addEventListener('click', () => move(-1));
  byId('next').addEventListener('click', () => move(1));
  byId('page-counter').addEventListener('click', openOverview);
  byId('overview').addEventListener('click', openOverview);
  byId('close-overview').addEventListener('click', () => dialog.close());
  byId('overview-manage').addEventListener('click', beginVisibilityEdit);
  byId('overview-cancel').addEventListener('click', cancelVisibilityEdit);
  byId('overview-save').addEventListener('click', saveVisibilityEdit);
  byId('overview-restore').addEventListener('click', () => { if (draftHidden !== null) { draftHidden.clear(); refreshThumbnails(); byId('overview-restore').focus(); } });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { draftHidden = null; refreshThumbnails(); if (returnFocus?.isConnected) returnFocus.focus(); wake(); });
  byId('fullscreen').addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => { byId('fullscreen-label').textContent = document.fullscreenElement ? '退出全屏' : '全屏'; fit(); wake(); });
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    keyboardControls = false;
    const deck = byId('deck').getBoundingClientRect();
    pointerAtBottom = event.clientY >= Math.min(innerHeight - 100, deck.bottom - 75);
    wake();
  });
  document.documentElement.addEventListener('pointerleave', () => { pointerAtBottom = false; wake(); });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && event.clientY >= innerHeight - 100) wake(true);
  });
  document.addEventListener('focusin', () => wake());
  document.addEventListener('focusout', () => setTimeout(() => wake(), 0));
  window.addEventListener('resize', fit);
  // Observe the actual layout area: fullscreen and viewport emulation can finish
  // their layout update after the window resize event has already fired.
  if (window.ResizeObserver) new ResizeObserver(fit).observe(byId('viewport'));
  window.addEventListener('hashchange', () => { const index = DeckNavigation.parseHash(location.hash, slides.length); if (index !== null) { state.jump(index); render(); } });
  window.addEventListener('storage', event => {
    if (event.key !== visibilityKey && event.key !== null) return;
    hiddenKeys = readHiddenKeys(); state.setHidden(hiddenIndices(hiddenKeys)); render();
  });
  document.addEventListener('decklanguagechange', refreshOverviewSettings);
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !document.querySelector('dialog[open]')) {
      const wasHidden = !document.body.classList.contains('controls-visible');
      keyboardControls = true; wake(true);
      if (wasHidden) { event.preventDefault(); controls.querySelector('button:not(:disabled)').focus(); }
    }
    if (document.querySelector("dialog[open]") || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
    if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (event.key === ' ' && event.target.closest('button,a')) return;
    const nextKeys = ['ArrowRight', 'ArrowDown', 'PageDown', ' '];
    const previousKeys = ['ArrowLeft', 'ArrowUp', 'PageUp'];
    if (nextKeys.includes(event.key)) { event.preventDefault(); move(1); }
    else if (previousKeys.includes(event.key)) { event.preventDefault(); move(-1); }
    else if (event.key === 'Home') { event.preventDefault(); state.jump(state.visibleIndices[0]); render(); }
    else if (event.key === 'End') { event.preventDefault(); state.jump(state.visibleIndices.at(-1)); render(); }
    else if (event.key.toLowerCase() === 'g') { event.preventDefault(); openOverview(); }
    else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
  });
  let touchStart = null;
  byId('viewport').addEventListener('touchstart', event => { if (!event.target.closest('button,a,input,textarea,select,[contenteditable],video,iframe')) touchStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }; }, { passive: true });
  byId('viewport').addEventListener('touchend', event => { if (!touchStart) return; const dx = event.changedTouches[0].clientX - touchStart.x; const dy = event.changedTouches[0].clientY - touchStart.y; if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1); touchStart = null; }, { passive: true });

  const linkedPage = DeckNavigation.parseHash(location.hash, slides.length);
  let saved;
  try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch { saved = null; }
  if (linkedPage !== null) {
    state.jump(linkedPage);
    if (state.index === linkedPage && saved?.index === linkedPage && Number.isInteger(saved.step)) state.step = Math.max(0, Math.min(saved.step, Number(slides[linkedPage].dataset.steps || 0)));
  } else if (!location.hash && saved && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < slides.length) {
    state.jump(saved.index);
    if (state.index === saved.index) state.step = Number.isInteger(saved.step) ? Math.max(0, Math.min(saved.step, Number(slides[saved.index].dataset.steps || 0))) : 0;
  }
  render(); fit(); wake();
  document.fonts.ready.then(fit);
})();
