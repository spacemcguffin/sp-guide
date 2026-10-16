(() => {
  const grid = document.getElementById('archiveGrid');
  if (!grid) return;
  const search = document.getElementById('archiveSearch');
  const sort = document.getElementById('archiveSort');
  const clear = document.getElementById('archiveClear');
  const status = document.getElementById('archiveStatus');
  const pages = document.getElementById('archivePages');
  const perPage = 12;
  let articles = [], page = 1;
  const formatDate = value => { const d = new Date(`${value}T12:00:00`); return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('en-GB', {day:'numeric',month:'long',year:'numeric'}).format(d); };
  function node(tag, cls, content) { const el = document.createElement(tag); if (cls) el.className = cls; if (content !== undefined) el.textContent = content; return el; }
  function render() {
    const term = search.value.trim().toLocaleLowerCase();
    clear.hidden = !search.value;
    const filtered = articles.filter(a => `${a.title || ''} ${a.description || ''}`.toLocaleLowerCase().includes(term));
    filtered.sort((a,b) => sort.value === 'az' ? (a.title || '').localeCompare(b.title || '') : sort.value === 'oldest' ? (a.date || '').localeCompare(b.date || '') : (b.date || '').localeCompare(a.date || ''));
    const listing = filtered;
    const totalPages = Math.max(1, Math.ceil(listing.length / perPage)); page = Math.min(page, totalPages);
    status.textContent = term ? `${filtered.length} ${filtered.length === 1 ? 'result' : 'results'} for “${search.value.trim()}”` : `${filtered.length} ${filtered.length === 1 ? 'article' : 'articles'}`;
    grid.replaceChildren(); pages.replaceChildren();
    if (!filtered.length) grid.append(node('p', 'archive-empty', 'No articles found. Try another search.'));
    listing.slice((page - 1) * perPage, page * perPage).forEach(a => {
      const card = node('a', 'news-item archive-card'); card.href = a.url;
      if (a.image) { const img = node('img'); img.src = a.image; img.alt = ''; img.loading = 'lazy'; card.append(img); }
      const date = node('div', 'date', formatDate(a.date));
      const title = node('h3', null, a.title);
      card.append(date, title); grid.append(card);
    });
    if (totalPages <= 1) return;
    function add(label, target, disabled, current = false) {
      const b = node('button', null, label); b.type = 'button'; b.disabled = disabled;
      if (current) b.setAttribute('aria-current', 'page');
      b.addEventListener('click', () => { page = target; render(); document.getElementById('news').scrollIntoView({behavior:'auto'}); }); pages.append(b);
    }
    add('Previous', page - 1, page === 1);
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    for (let n = start; n <= Math.min(totalPages, start + 4); n++) add(String(n), n, false, n === page);
    add('Next', page + 1, page === totalPages);
  }
  search.addEventListener('input', () => { clear.hidden = search.value.length === 0; page = 1; render(); });
  clear.addEventListener('click', () => { search.value = ''; page = 1; render(); search.focus(); });
  sort.addEventListener('change', () => { page = 1; render(); });
  fetch('/news/news.json', {cache:'no-cache'}).then(r => { if (!r.ok) throw Error(`HTTP ${r.status}`); return r.json(); }).then(data => { articles = Array.isArray(data) ? data.filter(a => a.title && a.url) : []; render(); }).catch(err => { console.error('News archive:', err); status.textContent = 'Could not load news articles. Please try again later.'; });
})();
