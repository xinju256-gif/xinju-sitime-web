(() => {
  const en = document.documentElement.lang === 'en';
  try { localStorage.setItem('simacity-language', en ? 'en' : 'zh'); } catch { /* Navigation works without storage. */ }
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('navigation');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', en ? (open ? 'Close navigation' : 'Open navigation') : (open ? '关闭导航' : '打开导航'));
    nav.classList.toggle('open', open);
  });
  const filter = document.getElementById('page-filter');
  const normalized = value => value.normalize('NFKC').toLowerCase();
  if (filter) {
    const cards = [...document.querySelectorAll('[data-page-card]')];
    const apply = () => {
      const query = normalized(filter.value.trim()); let count = 0;
      for (const card of cards) { card.hidden = !normalized(card.dataset.search).includes(query); if (!card.hidden) count++; }
      document.getElementById('page-filter-status').textContent = en ? `${count} entries` : `共 ${count} 个条目`;
    };
    filter.value = new URLSearchParams(location.search).get('q') || '';
    filter.addEventListener('input', apply); apply();
  }
  const dialog = document.getElementById('detail-search-dialog');
  const input = document.getElementById('detail-search');
  const render = () => {
    const query = normalized(input.value.trim()); const target = document.getElementById('detail-search-results'); target.replaceChildren();
    const matches = (window.SITE_SEARCH || []).filter(item => normalized(item.zh + ' ' + item.en).includes(query));
    for (const item of matches.slice(0, 30)) {
      const a = document.createElement('a'); a.href = en ? item.enUrl : item.zhUrl; a.textContent = (en ? item.en : item.zh) + ' →'; target.append(a);
    }
    const p = document.createElement('p'); p.textContent = en ? `${matches.length} matches${matches.length > 30 ? '; showing the first 30. Refine your query.' : ''}` : `共 ${matches.length} 条结果${matches.length > 30 ? '，显示前 30 条，请缩小关键词。' : ''}`; target.append(p);
  };
  document.getElementById('detail-search-open')?.addEventListener('click', event => { event.preventDefault(); render(); dialog.showModal(); input.focus(); });
  dialog?.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  input?.addEventListener('input', render);
})();
