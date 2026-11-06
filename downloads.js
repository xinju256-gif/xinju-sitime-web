(() => {
  const data = window.MEMS_CATALOG;
  const $ = (id) => document.getElementById(id);
  const state = { query: '', category: 'all', availability: 'all', page: 1 };
  const pageSize = 12;
  const text = (zh, en) => window.siteI18n.language === 'en' ? en : zh;
  const bilingual = (value) => value[window.siteI18n.language];
  const category = (product) => data.categories.find((item) => item.id === product.category);
  const normalize = (value) => value.normalize('NFKC').toLowerCase();
  function node(tag, className, value) {
    const el = document.createElement(tag); if (className) el.className = className;
    if (value !== undefined) el.textContent = value; return el;
  }
  function matches() {
    const query = normalize(state.query.trim());
    return data.products.filter((p) => {
      const group = category(p);
      const terms = [p.model, group.name.zh, group.name.en, 'PDF SiTime', ...Object.values(p.values).flatMap((v) => [v.zh, v.en])].join(' ');
      return (state.category === 'all' || p.category === state.category)
        && (state.availability === 'all' || (state.availability === 'pdf' ? p.datasheet.type === 'pdf' : p.datasheet.type !== 'pdf'))
        && (!query || normalize(terms).includes(query));
    });
  }
  function renderResults() {
    const list = $('download-list'); list.replaceChildren();
    const results = matches(); const pages = Math.max(1, Math.ceil(results.length / pageSize));
    state.page = Math.min(state.page, pages);
    $('download-status').textContent = text(`找到 ${results.length} 个型号 · 第 ${state.page} / ${pages} 页`, `${results.length} models · Page ${state.page} of ${pages}`);
    for (const p of results.slice((state.page - 1) * pageSize, state.page * pageSize)) {
      const pdf = p.datasheet.type === 'pdf';
      const row = node('article', 'download-row'); row.dataset.downloadModel = p.model;
      const icon = node('span', 'download-file-icon' + (pdf ? '' : ' is-pending'), pdf ? 'PDF' : '…'); icon.setAttribute('aria-hidden', 'true');
      const info = node('div', 'download-info');
      const model = node('button', 'download-model', p.model); model.type = 'button';
      model.setAttribute('aria-label', text(`查看 ${p.model} 参数`, `View ${p.model} specifications`));
      model.addEventListener('click', () => window.openCatalogProduct(p.model));
      info.append(model, node('p', '', bilingual(category(p).name)));
      const meta = node('div', 'download-meta');
      meta.append(node('span', pdf ? 'download-ready' : 'download-pending', pdf ? text('SiTime 原厂规格书', 'SiTime manufacturer datasheet') : text('规格书待补', 'Datasheet pending')));
      meta.append(node('small', '', pdf ? `PDF · ${(p.datasheet.bytes / 1048576).toFixed(2)} MB · ${p.datasheet.pages} ${text('页', 'pages')}` : text('可联系芯聚电子索取', 'Request from SIMACITY')));
      const actions = node('div', 'download-row-actions');
      actions.append(window.createDatasheetLink(p, false, 'download-action'));
      row.append(icon, info, meta, actions); list.append(row);
    }
    if (!results.length) {
      const empty = node('div', 'download-empty');
      empty.append(node('h3', '', text('未找到匹配资料', 'No matching documents')), node('p', '', text('请尝试其他型号或参数，也可重置筛选。', 'Try another model or parameter, or reset the filters.'))); list.append(empty);
    }
    const pagination = $('download-pagination'); pagination.replaceChildren();
    for (const [label, delta] of [[text('上一页', 'Previous'), -1], [text('下一页', 'Next'), 1]]) {
      if (delta === 1) pagination.append(node('span', '', `${state.page} / ${pages}`));
      const button = node('button', '', label); button.type = 'button';
      button.disabled = delta < 0 ? state.page === 1 : state.page === pages;
      button.addEventListener('click', () => { state.page += delta; renderResults(); $('download-status').scrollIntoView({ block: 'start' }); }); pagination.append(button);
    }
  }
  function render() {
    $('downloads-title').textContent = text('原厂规格书，集中查找。', 'Manufacturer datasheets. One place.');
    $('downloads-intro').textContent = text('按型号、产品类别或技术参数查找 SiTime 原厂 PDF，点击即可下载。', 'Find SiTime manufacturer PDFs by model, product family or specifications. Download directly.');
    $('download-query-label').textContent = text('搜索型号或参数', 'Search models or specifications');
    $('download-category-label').textContent = text('产品类别', 'Product family');
    $('download-availability-label').textContent = text('资料状态', 'Availability');
    $('download-query').placeholder = text('例如：SiT8008、TCXO、LVDS', 'Try SiT8008, TCXO or LVDS');
    $('download-reset').textContent = text('重置筛选', 'Reset filters');
    $('download-note').textContent = text('仅提供已验证的 SiTime 原厂 PDF。待补型号可直接向芯聚电子索取资料。', 'Only verified SiTime manufacturer PDFs are provided. Contact SIMACITY for models with pending datasheets.');
    $('download-pagination').setAttribute('aria-label', text('下载中心分页', 'Downloads pagination'));
    const ready = data.products.filter((p) => p.datasheet.type === 'pdf').length;
    const totals = $('downloads-totals'); totals.replaceChildren();
    for (const [count, label] of [[ready, text('份原厂 PDF', 'manufacturer PDFs')], [data.products.length - ready, text('个型号待补', 'models pending')]]) {
      const stat = node('div'); stat.append(node('strong', '', String(count)), node('span', '', label)); totals.append(stat);
    }
    const categories = $('download-category'); categories.replaceChildren(new Option(text('全部类别', 'All families'), 'all'));
    for (const item of data.categories) categories.add(new Option(bilingual(item.name), item.id));
    categories.value = state.category;
    const availability = $('download-availability'); availability.replaceChildren();
    for (const [value, label] of [['all', text('全部型号', 'All models')], ['pdf', text('可下载 PDF', 'PDF available')], ['pending', text('待补规格书', 'Datasheet pending')]]) availability.add(new Option(label, value));
    availability.value = state.availability; renderResults();
  }
  $('download-query').addEventListener('input', (e) => { state.query = e.target.value; state.page = 1; renderResults(); });
  $('download-category').addEventListener('change', (e) => { state.category = e.target.value; state.page = 1; renderResults(); });
  $('download-availability').addEventListener('change', (e) => { state.availability = e.target.value; state.page = 1; renderResults(); });
  $('download-reset').addEventListener('click', () => { state.query = ''; state.category = 'all'; state.availability = 'all'; state.page = 1; $('download-query').value = ''; render(); });
  window.filterDownloads = ({ query = '', category = 'all', availability = 'all' } = {}) => { state.query = query; state.category = category; state.availability = availability; state.page = 1; $('download-query').value = query; render(); };
  document.addEventListener('site:languagechange', render);
  render();
})();
