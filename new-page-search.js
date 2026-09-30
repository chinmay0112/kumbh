(() => {
  const panel = document.getElementById('search-form');
  const toggle = document.getElementById('search-toggle');
  const input = document.getElementById('search');
  function close(restoreFocus = false) {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  }
  panel.querySelector('.search-close').addEventListener('click', () => close(true));
  panel.querySelectorAll('.search-chips a').forEach(link => {
    link.addEventListener('click', () => {
      close();
      const destination = document.querySelector(link.getAttribute('href'));
      if (destination) {
        destination.setAttribute('tabindex', '-1');
        destination.focus({ preventScroll: true });
        destination.addEventListener('blur', () => destination.removeAttribute('tabindex'), { once: true });
      }
    });
  });
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) close();
  });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') close(true);
  });
  input.addEventListener('input', () => {
    const result = document.getElementById('search-result');
    result.textContent = '';
    delete result.dataset.result;
  });
})();
