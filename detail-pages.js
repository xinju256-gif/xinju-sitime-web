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
  if (filter && !document.querySelector('.product-selector')) {
    const cards = [...document.querySelectorAll('[data-page-card]')];
    const facets = [...document.querySelectorAll('[data-page-filter]')];
    const params = new URLSearchParams(location.search);
    const apply = () => {
      const query = normalized(filter.value.trim()); let count = 0;
      for (const card of cards) {
        const matches = normalized(card.dataset.search).includes(query) && facets.every(control => {
          const key = control.dataset.pageFilter; const value = control.value;
          if (value === 'all') return true;
          const actual = card.dataset[key] || '';
          return key === 'output' ? normalized(actual).includes(normalized(value)) : key === 'industry' ? actual.split('|').includes(value) : actual === value;
        });
        card.hidden = !matches; if (matches) count++;
      }
      document.getElementById('page-filter-status').textContent = en ? `${count} entries` : `共 ${count} 个条目`;
    };
    filter.value = params.get('q') || '';
    for (const control of facets) {
      const value = params.get(control.dataset.pageFilter);
      if (value && [...control.options].some(option => option.value === value)) control.value = value;
      control.addEventListener('change', apply);
    }
    filter.addEventListener('input', apply);
    document.getElementById('page-filter-reset')?.addEventListener('click', () => { filter.value = ''; for (const control of facets) control.value = 'all'; apply(); });
    apply();
  }

  if (filter && document.querySelector('.product-selector')) {
    const rows = [...document.querySelectorAll('.product-selector-table [data-page-card]')];
    const choices = [...document.querySelectorAll('[data-product-facet]')];
    const families = [...document.querySelectorAll('[data-product-family]')];
    const options = new Map(rows.map(row => [row, JSON.parse(row.dataset.productOptions)]));
    const params = new URLSearchParams(location.search);
    let family = families.some(button => button.dataset.productFamily === params.get('category')) ? params.get('category') : 'all';
    filter.value = params.get('q') || '';
    choices.forEach(choice => { choice.checked = params.getAll(choice.dataset.productFacet).includes(choice.value); });
    const apply = (updateUrl = true) => {
      const selected = {};
      choices.filter(choice => choice.checked).forEach(choice => (selected[choice.dataset.productFacet] ||= []).push(choice.value));
      let count = 0;
      const query = normalized(filter.value.trim());
      for (const row of rows) {
        const matches = (family === 'all' || row.dataset.category === family) && normalized(row.dataset.search).includes(query)
          && Object.entries(selected).every(([key, values]) => values.some(value => options.get(row)[key].includes(value)));
        row.hidden = !matches; if (matches) count++;
      }
      families.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.productFamily === family)));
      document.getElementById('page-filter-status').textContent = en ? `${count} of ${rows.length} models` : `共 ${count} 个型号 / 全部 ${rows.length} 个`;
      document.getElementById('product-empty').hidden = count !== 0;
      if (updateUrl) {
        const next = new URLSearchParams();
        if (filter.value.trim()) next.set('q', filter.value.trim());
        if (family !== 'all') next.set('category', family);
        Object.entries(selected).forEach(([key, values]) => values.forEach(value => next.append(key, value)));
        history.replaceState(null, '', location.pathname + (next.size ? '?' + next : '') + location.hash);
      }
      const language = document.querySelector('a.language');
      if (language) { const url = new URL(language.href); url.search = location.search; language.href = url.pathname + url.search; }
    };
    families.forEach(button => button.addEventListener('click', () => { family = button.dataset.productFamily; apply(); }));
    choices.forEach(choice => choice.addEventListener('change', () => apply()));
    filter.addEventListener('input', () => apply());
    document.getElementById('page-filter-reset').addEventListener('click', () => { filter.value = ''; family = 'all'; choices.forEach(choice => { choice.checked = false; }); apply(); });
    document.querySelectorAll('.product-facet-more').forEach(button => button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(expanded));
      button.closest('fieldset').querySelectorAll('[data-extra-choice]').forEach(label => { label.hidden = !expanded && !label.querySelector('input').checked; });
      button.textContent = expanded ? (en ? 'Less −' : '收起 −') : (en ? 'More +' : '更多 +');
    }));
    choices.filter(choice => choice.checked).forEach(choice => { choice.closest('label').hidden = false; });
    apply(false);
  }

  const dialog = document.getElementById('detail-search-dialog');
  const input = document.getElementById('detail-search');
  const render = () => {
    const query = normalized(input.value.trim()); const target = document.getElementById('detail-search-results'); target.replaceChildren();
    const matches = (window.SITE_SEARCH || []).filter(item => normalized(item.zh + ' ' + item.en + ' ' + (item.terms || '')).includes(query));
    for (const item of matches.slice(0, 30)) {
      const a = document.createElement('a'); a.href = en ? item.enUrl : item.zhUrl; a.textContent = (en ? item.en : item.zh) + ' →'; target.append(a);
    }
    const p = document.createElement('p'); p.textContent = en ? `${matches.length} matches${matches.length > 30 ? '; showing the first 30. Refine your query.' : ''}` : `共 ${matches.length} 条结果${matches.length > 30 ? '，显示前 30 条，请缩小关键词。' : ''}`; target.append(p);
  };
  document.getElementById('detail-search-open')?.addEventListener('click', event => { event.preventDefault(); render(); dialog.showModal(); input.focus(); });
  dialog?.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  input?.addEventListener('input', render);
})();
