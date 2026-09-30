(() => {
  const ticker = document.querySelector('.pilgrimage-ticker');
  if (!ticker) return;
  const button = ticker.querySelector('.ticker-pause');
  button.addEventListener('click', () => {
    const paused = ticker.classList.toggle('is-paused');
    button.setAttribute('aria-pressed', String(paused));
  });
})();
