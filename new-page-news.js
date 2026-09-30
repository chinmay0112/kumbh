(() => {
  const filters = document.querySelectorAll('[data-news-filter]');
  const items = document.querySelectorAll('[data-news-category]');
  const empty = document.querySelector('.news-empty');
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.newsFilter;
    let visible = 0;
    filters.forEach(filter => {
      filter.classList.toggle('active', filter === button);
      filter.setAttribute('aria-pressed', String(filter === button));
    });
    items.forEach(item => {
      item.hidden = category !== 'all' && item.dataset.newsCategory !== category;
      if (!item.hidden) visible++;
    });
    empty.hidden = visible > 0;
    document.dispatchEvent(new CustomEvent('news:filtered'));
  }));
})();
