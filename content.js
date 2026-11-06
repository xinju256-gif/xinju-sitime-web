(() => {
  const data = window.SITIME_CONTENT;
  const $ = (selector) => document.querySelector(selector);
  const dialog = $('#content-dialog');
  const state = { industry: 'all', solutionQuery: '', solutionPage: 1, newsType: 'all', newsQuery: '', year: 'all', newsPage: 1 };
  const pageSize = 9;
  let currentItem = null;
  const lang = () => window.siteI18n.language;
  const pick = (value) => value[lang()];
  const text = (zh, en) => lang() === 'en' ? en : zh;
  const normalize = (value) => value.normalize('NFKC').toLowerCase();
  function el(tag, className, label) {
    const node = document.createElement(tag); if (className) node.className = className; if (label !== undefined) node.textContent = label; return node;
  }
  function picture(item, kind) {
    const figure = el('div', 'editorial-picture ' + kind);
    if (item.image) {
      const image = el('img'); window.siteImage(image, item.image); image.alt = pick(item.title); image.loading = 'lazy'; image.width = 600; image.height = 340;
      image.addEventListener('error', () => { image.hidden = true; figure.classList.add('image-fallback'); });
      figure.append(image);
    } else figure.classList.add('image-fallback');
    const label = el('span', 'editorial-image-label', kind === 'news' ? 'SiTime / INSIGHTS' : 'PRECISION TIMING'); figure.append(label); return figure;
  }
  function resultMessage(count, page) {
    const start = (page - 1) * pageSize;
    return text(`共 ${count} 条${count ? ` · 显示 ${start + 1}–${Math.min(start + pageSize, count)}` : ''}`, `${count} results${count ? ` · Showing ${start + 1}–${Math.min(start + pageSize, count)}` : ''}`);
  }
  function paginate(selector, pageKey, count, draw, statusSelector) {
    const total = Math.max(1, Math.ceil(count / pageSize)); const target = $(selector); target.replaceChildren();
    for (const [delta, label, disabled] of [[-1, text('上一页', 'Previous'), state[pageKey] === 1], [1, text('下一页', 'Next'), state[pageKey] === total]]) {
      if (delta === 1) target.append(el('span', '', `${state[pageKey]} / ${total}`));
      const button = el('button', '', label); button.type = 'button'; button.disabled = disabled;
      button.addEventListener('click', () => { state[pageKey] += delta; draw(); $(statusSelector).scrollIntoView({ block: 'start' }); }); target.append(button);
    }
  }
  function openItem(kind, id) {
    const item = (kind === 'solution' ? data.solutions : kind === 'industry' ? data.industries : data.news).find((entry) => entry.id === id);
    if (!item) return;
    document.dispatchEvent(new CustomEvent('site:detailopen', { detail: { kind } }));
    currentItem = { kind, id };
    window.updateLocalRoute?.(kind, id);
    const body = el('div', 'editorial-detail'); body.setAttribute('data-i18n-skip', '');
    const label = kind === 'news' ? text(item.type === 'release' ? 'SiTime 官方新闻稿 · 导读' : 'SiTime 博客与洞察 · 导读', item.type === 'release' ? 'SiTime press release · Brief' : 'SiTime blog & insights · Brief') : text('SiTime 解决方案 · 概览', 'SiTime solutions · Overview');
    body.append(el('div', 'eyebrow dark', label), el('h2', '', pick(item.title)));
    if (kind === 'news') body.append(el('time', 'editorial-date', item.date));
    if (item.image) body.append(picture(item, kind === 'news' ? 'news' : 'solution'));
    body.append(el('p', 'editorial-detail-summary', pick(item.summary)));
    if (kind === 'news' && lang() === 'zh') body.append(el('p', 'editorial-original-title', '原文题名：' + item.title.en));
    if (kind !== 'news' && item.focus) {
      const list = el('ul', 'editorial-focus-list'); pick(item.focus).forEach((focus) => list.append(el('li', '', focus))); body.append(list);
    }
    window.renderLocalReading(body, item, kind);
    if (item.models.length) {
      body.append(el('h3', '', text('相关产品与本站资料', 'Related products and local documents')));
      const related = el('div', 'editorial-related-products');
      item.models.forEach((model) => {
        const button = el('button', '', model + ' ↗'); button.type = 'button';
        button.addEventListener('click', () => { dialog.close(); setTimeout(() => window.openCatalogProduct(model), 0); }); related.append(button);
      }); body.append(related);
    }
    const actions = el('div', 'editorial-detail-actions');
    if (window.SITE_PAGES) { const page = el('a', 'detail-page-link', text('打开独立详情页 →', 'Open full detail page →')); page.href = window.detailPageHref(kind, item.id); actions.append(page); }
    const downloads = el('a', 'button', text('查看本站规格书 ↓', 'Browse local datasheets ↓')); downloads.href = '#downloads';
    downloads.addEventListener('click', () => { window.filterDownloads?.({ query: item.models[0] || '' }); dialog.close(); }); actions.append(downloads);
    {
      const inquiry = el('a', '', text('向芯聚电子咨询 →', 'Ask SIMACITY →')); inquiry.href = '#contact';
      inquiry.addEventListener('click', () => {
        $('#contact-type').value = 'technical';
        if (item.models.length) $('#contact-product').value = item.models.join(', ').slice(0, 300);
        const field = $('#contact-needs'); const line = text('应用咨询：', 'Application inquiry: ') + pick(item.title);
        if (!field.value.includes(pick(item.title))) field.value = line + (field.value ? '\n' + field.value : ''); dialog.close();
      }); actions.append(inquiry);
    }
    body.append(actions, el('p', 'editorial-detail-attribution', text('依据 SiTime 公开资料整理。本站提供原创概览与工程阅读提示，具体器件条件请查阅本站原厂 PDF。', 'Prepared from public SiTime information. Original overviews and engineering reading notes are provided here; consult the local manufacturer PDFs for device conditions.')));
    $('#dialog-content').replaceChildren(body); if (!dialog.open) dialog.showModal();
  }
  dialog.addEventListener('close', () => { if (!dialog.open) currentItem = null; });
  document.addEventListener('site:detailopen', (event) => { if (!['solution', 'industry', 'news'].includes(event.detail.kind)) currentItem = null; });
  function renderIndustries() {
    const filters = $('#industry-filters'); filters.replaceChildren();
    for (const industry of [{ id: 'all', title: { zh: '全部行业', en: 'All industries' } }, ...data.industries]) {
      const button = el('button', '', pick(industry.title)); button.type = 'button'; button.dataset.industry = industry.id; button.setAttribute('aria-pressed', String(state.industry === industry.id));
      button.addEventListener('click', () => { state.industry = industry.id; state.solutionPage = 1; renderIndustries(); renderSolutions(); }); filters.append(button);
    }
    const overview = $('#solution-overview'); overview.replaceChildren();
    const industry = data.industries.find((entry) => entry.id === state.industry);
    if (industry) {
      const copy = el('div'); copy.append(el('h3', '', pick(industry.title)), el('p', '', pick(industry.summary)));
      const button = el('button', '', text('查看行业概览 →', 'View industry overview →')); button.type = 'button'; button.addEventListener('click', () => openItem('industry', industry.id)); overview.append(copy, button); overview.hidden = false;
    } else overview.hidden = true;
  }
  function renderSolutions() {
    const query = normalize(state.solutionQuery.trim());
    const found = data.solutions.filter((item) => (state.industry === 'all' || item.industries.includes(state.industry)) && (!query || normalize([item.title.zh, item.title.en, item.summary.zh, item.summary.en, ...item.models].join(' ')).includes(query)));
    state.solutionPage = Math.min(state.solutionPage, Math.max(1, Math.ceil(found.length / pageSize)));
    $('#solution-status').textContent = resultMessage(found.length, state.solutionPage);
    const grid = $('#solution-grid'); grid.replaceChildren();
    for (const item of found.slice((state.solutionPage - 1) * pageSize, state.solutionPage * pageSize)) {
      const card = el('article', 'solution-card'); card.dataset.solution = item.id;
      card.append(picture(item, 'solution')); const content = el('div', 'solution-card-copy');
      content.append(el('span', 'editorial-kicker', item.industries.map((id) => pick(data.industries.find((entry) => entry.id === id).title)).join(' / ')), el('h3', '', pick(item.title)), el('p', '', pick(item.summary)));
      const button = el('button', 'editorial-card-action', text('方案概览 →', 'Explore solution →')); button.type = 'button'; button.addEventListener('click', () => openItem('solution', item.id)); content.append(button); if (window.SITE_PAGES) { const page = el('a', 'detail-page-link', text('独立详情 →', 'Full page →')); page.href = window.detailPageHref('solution', item.id); content.append(page); } card.append(content); grid.append(card);
    }
    if (!found.length) {
      const empty = el('div', 'editorial-empty', text(state.industry === 'mobile' ? '此行业暂无独立应用条目，可通过上方行业概览查看本站选型说明。' : '暂无匹配方案，请更换关键词或行业。', state.industry === 'mobile' ? 'No separate application entries are listed for this industry. Open the local industry overview for selection notes.' : 'No matching solutions. Try another keyword or industry.')); grid.append(empty);
    }
    paginate('#solution-pagination', 'solutionPage', found.length, renderSolutions, '#solution-status');
  }
  function renderNewsFilters() {
    const filters = $('#news-type-filters'); filters.replaceChildren();
    for (const [id, zh, en] of [['all', '全部动态', 'All updates'], ['release', '官方新闻稿', 'Press releases'], ['blog', '博客与洞察', 'Blog & insights']]) {
      const button = el('button', '', text(zh, en)); button.type = 'button'; button.dataset.newsType = id; button.setAttribute('aria-pressed', String(state.newsType === id));
      button.addEventListener('click', () => { state.newsType = id; state.newsPage = 1; renderNewsFilters(); renderNews(); }); filters.append(button);
    }
    const select = $('#news-year'); const years = [...new Set(data.news.map((item) => item.year))].sort().reverse(); select.replaceChildren();
    for (const year of ['all', ...years]) { const option = el('option', '', year === 'all' ? text('全部年份', 'All years') : year); option.value = year; select.append(option); } select.value = state.year;
  }
  function renderNews() {
    const query = normalize(state.newsQuery.trim());
    const found = data.news.filter((item) => (state.newsType === 'all' || item.type === state.newsType) && (state.year === 'all' || item.year === state.year) && (!query || normalize([item.title.zh, item.title.en, item.summary.zh, item.summary.en, ...item.models].join(' ')).includes(query)));
    state.newsPage = Math.min(state.newsPage, Math.max(1, Math.ceil(found.length / pageSize)));
    $('#news-status').textContent = resultMessage(found.length, state.newsPage);
    const grid = $('#news-grid'); grid.replaceChildren();
    for (const item of found.slice((state.newsPage - 1) * pageSize, state.newsPage * pageSize)) {
      const card = el('article', 'news-card'); card.dataset.news = item.id; card.append(picture(item, 'news'));
      const content = el('div', 'news-card-copy'); const meta = el('div', 'news-card-meta'); meta.append(el('span', '', text(item.type === 'release' ? '官方新闻稿' : '博客与洞察', item.type === 'release' ? 'Press release' : 'Blog & insights')), el('time', '', item.date));
      content.append(meta, el('h3', '', pick(item.title)), el('p', '', pick(item.summary)));
      const button = el('button', 'editorial-card-action', text('阅读导读 →', 'Read brief →')); button.type = 'button'; button.addEventListener('click', () => openItem('news', item.id)); content.append(button); if (window.SITE_PAGES) { const page = el('a', 'detail-page-link', text('独立详情 →', 'Full page →')); page.href = window.detailPageHref('news', item.id); content.append(page); } card.append(content); grid.append(card);
    }
    if (!found.length) grid.append(el('div', 'editorial-empty', text('暂无匹配新闻，请更换关键词、年份或类型。', 'No matching updates. Try another keyword, year or type.')));
    paginate('#news-pagination', 'newsPage', found.length, renderNews, '#news-status');
  }
  function render() {
    const labels = {
      solutionsEyebrow: ['SOLUTIONS / 解决方案', 'SOLUTIONS / APPLICATIONS'], solutionsHeading: ['从应用出发，找到合适的计时方案。', 'The right timing for your application.'],
      solutionsIntro: [`${data.industries.length} 个行业、${data.solutions.length} 个应用概览，连接设计需求与计时产品。`, `${data.industries.length} industries and ${data.solutions.length} application overviews connecting design needs with timing products.`],
      solutionSearch: ['搜索应用或关键词', 'Search applications or keywords'], solutionNote: ['方案说明、选型关注点、相关产品和原厂规格书均可在本站查看，无需跳转原厂网站。', 'Read application notes, selection considerations, related products and manufacturer datasheets on this site.'],
      newsEyebrow: ['NEWS & INSIGHTS / 新闻动态', 'NEWS & INSIGHTS'], newsHeading: ['关注计时技术与行业动态。', 'Timing technology. Industry perspectives.'],
      newsIntro: [`${data.news.length} 条 SiTime 新闻与技术导读，保留原始发布日期，支持站内阅读。`, `${data.news.length} SiTime news and technical briefs, with original dates and on-site reading.`],
      newsSearch: ['搜索新闻', 'Search updates'], newsYear: ['年份', 'Year'], newsNote: ['依据 SiTime 公开信息整理，提供中文题名、原创导读与工程阅读提示。', 'Prepared from public SiTime information, with editorial titles, original briefs and engineering reading notes.']
    };
    document.querySelectorAll('[data-editorial-label]').forEach((node) => { node.textContent = text(...labels[node.dataset.editorialLabel]); });
    $('#solution-query').placeholder = text('例如：光模块、汽车、GNSS', 'Try optical modules, automotive or GNSS'); $('#news-query').placeholder = text('例如：AI、Titan、财务业绩', 'Try AI, Titan or financial results');
    $('#industry-filters').setAttribute('aria-label', text('解决方案行业', 'Solution industries')); $('#news-type-filters').setAttribute('aria-label', text('新闻类型', 'Update type'));
    $('#solution-pagination').setAttribute('aria-label', text('解决方案分页', 'Solution pagination')); $('#news-pagination').setAttribute('aria-label', text('新闻分页', 'Update pagination'));
    renderIndustries(); renderSolutions(); renderNewsFilters(); renderNews();
  }
  $('#solution-query').addEventListener('input', (event) => { state.solutionQuery = event.target.value; state.solutionPage = 1; renderSolutions(); });
  $('#news-query').addEventListener('input', (event) => { state.newsQuery = event.target.value; state.newsPage = 1; renderNews(); });
  $('#news-year').addEventListener('change', (event) => { state.year = event.target.value; state.newsPage = 1; renderNews(); });
  document.addEventListener('site:languagechange', () => { render(); if (currentItem && dialog.open) openItem(currentItem.kind, currentItem.id); });
  window.openEditorialItem = openItem;
  render();
})();
