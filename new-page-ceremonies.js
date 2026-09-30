(() => {
  const filters = document.querySelectorAll('[data-ceremony-filter]');
  const ceremonies = document.querySelectorAll('[data-ceremony-category]');
  filters.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.ceremonyFilter;
      filters.forEach(filter => {
        const selected = filter === button;
        filter.classList.toggle('active', selected);
        filter.setAttribute('aria-pressed', String(selected));
      });
      ceremonies.forEach(ceremony => {
        ceremony.hidden = category !== 'all' && ceremony.dataset.ceremonyCategory !== category;
      });
      document.dispatchEvent(new CustomEvent('ceremonies:filtered'));
    });
  });
})();
