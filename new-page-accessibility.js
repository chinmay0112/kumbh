(() => {
  const panel = document.getElementById('accessibility-settings');
  const toggle = document.getElementById('accessibility-toggle');
  const contrast = document.getElementById('contrast-toggle');
  const zoomButtons = [...document.querySelectorAll('[data-page-zoom]')];
  function close(restoreFocus = false) {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) panel.querySelector('button').focus();
  });
  document.getElementById('top-language-toggle').addEventListener('click', () => document.getElementById('language-toggle').click());
  document.getElementById('skip-main').addEventListener('click', () => document.getElementById('main-content').focus({ preventScroll: true }));
  function zoom(value) {
    document.body.style.zoom = value === '1' ? '' : value;
    zoomButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pageZoom === value)));
    window.ScrollTrigger?.refresh();
  }
  zoomButtons.forEach(button => button.addEventListener('click', () => zoom(button.dataset.pageZoom)));
  contrast.addEventListener('click', () => {
    const enabled = document.documentElement.classList.toggle('high-contrast');
    contrast.setAttribute('aria-pressed', String(enabled));
  });
  document.getElementById('accessibility-reset').addEventListener('click', () => {
    zoom('1');
    document.documentElement.classList.remove('high-contrast');
    contrast.setAttribute('aria-pressed', 'false');
  });
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) close(true);
  });
})();
