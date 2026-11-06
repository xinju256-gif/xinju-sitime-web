(() => {
  const data = window.MEMS_CATALOG;
  const state = { category: 'all', query: '', output: 'all', page: 1 };
  const pageSize = 8;
  const root = document.querySelector('#products');
  const search = document.querySelector('#catalog-search');
  const output = document.querySelector('#catalog-output');
  const dialog = document.querySelector('#content-dialog');
  let currentProduct = null;
  const language = () => window.siteI18n.language;
  const bilingual = (value) => value[language()];
  const text = (zh, en) => language() === 'en' ? en : zh;
  const categoryOf = (product) => data.categories.find((category) => category.id === product.category);
  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  const documentLabel = (product, compact = false) => product.datasheet.type === 'pdf'
    ? text(compact ? '原厂规格书 ↓' : '下载原厂规格书 PDF ↓', compact ? 'Manufacturer PDF ↓' : 'Download manufacturer datasheet PDF ↓')
    : text('联系获取规格书', 'Contact for datasheet');
  const activeDownloads = new Set();
  let downloadStatusTimer;
  function showDownloadStatus(message, failure = false) {
    let status = document.querySelector('#datasheet-download-status');
    if (!status) {
      status = element('div', 'datasheet-download-status');
      status.id = 'datasheet-download-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
      document.body.append(status);
    }
    status.textContent = message; status.hidden = false; status.classList.toggle('failure', failure);
    clearTimeout(downloadStatusTimer); downloadStatusTimer = setTimeout(() => { status.hidden = true; }, 12000);
  }
  function prepareInquiry(model) {
    if (window.prepareProductInquiry) { window.prepareProductInquiry(model, 'datasheet'); if (dialog.open) dialog.close(); return; }
    const field = document.querySelector('#contact-needs');
    const prefix = text(`咨询型号：${model}`, `Product inquiry: ${model}`);
    if (!field.value.includes(model)) field.value = prefix + (field.value ? '\n' + field.value : '');
    if (dialog.open) dialog.close();
  }
  function documentLink(product, compact = false, className = '') {
    const link = element('a', className, documentLabel(product, compact));
    const doc = product.datasheet;
    if (doc.type !== 'pdf') {
      link.href = '#contact';
      link.addEventListener('click', () => prepareInquiry(product.model));
      return link;
    }
    link.href = doc.local; link.download = doc.filename;
    if (doc.previewCopy) link.addEventListener('click', async (event) => {
      event.preventDefault();
      if (activeDownloads.has(product.model)) return;
      activeDownloads.add(product.model); link.setAttribute('aria-busy', 'true');
      showDownloadStatus(text(`正在准备 ${product.model} 规格书…`, `Preparing ${product.model} datasheet…`));
      try {
        const response = await fetch(doc.previewCopy, { credentials: 'omit', cache: 'force-cache' });
        if (!response.ok) throw new Error('Download unavailable');
        const payload = (await response.json()).customSettings?.simacityPdf;
        if (!payload || payload.filename !== doc.filename || payload.sha256 !== doc.sha256 || payload.bytes !== doc.bytes || payload.encoding !== 'gzip+base64') throw new Error('Invalid document metadata');
        const encoded = atob(payload.data); const compressed = new Uint8Array(encoded.length);
        for (let i = 0; i < encoded.length; i++) compressed[i] = encoded.charCodeAt(i);
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
        const raw = await new Response(stream).arrayBuffer();
        const header = new TextDecoder().decode(new Uint8Array(raw, 0, Math.min(5, raw.byteLength)));
        if (raw.byteLength !== doc.bytes || header !== '%PDF-') throw new Error('Invalid PDF file');
        const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', raw)), b => b.toString(16).padStart(2, '0')).join('');
        if (digest !== doc.sha256) throw new Error('Document checksum mismatch');
        const url = URL.createObjectURL(new Blob([raw], { type: 'application/pdf' }));
        const download = element('a'); download.href = url; download.download = doc.filename; download.hidden = true;
        document.body.append(download); download.click(); download.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
        showDownloadStatus(text(`${doc.filename} 已开始下载`, `Download started: ${doc.filename}`));
      } catch {
        showDownloadStatus(text('规格书下载失败，请重试或联系芯聚电子获取。', 'Could not download the datasheet. Please retry or contact SIMACITY.'), true);
      } finally { activeDownloads.delete(product.model); link.removeAttribute('aria-busy'); }
    });
    return link;
  }
  const labels = {
    frequency: ['频率', 'Frequency'], stability: ['频率稳定性', 'Frequency stability'], output: ['输出类型', 'Output type'],
    supply: ['供电电压 (V)', 'Supply voltage (V)'], temperature: ['温度范围 (°C)', 'Temperature range (°C)'], package: ['封装尺寸 (mm)', 'Package dimensions (mm)']
  };
  const parameterLabel = (product, key) => product.parameterLabels?.[key] ? bilingual(product.parameterLabels[key]) : text(...labels[key]);
  function parameter(label, value, className) {
    const group = element('div', className);
    group.append(element('dt', '', label), element('dd', '', value));
    return group;
  }
  function openProduct(model) {
    const product = data.products.find((item) => item.model === model);
    if (!product) return;
    document.dispatchEvent(new CustomEvent('site:detailopen', { detail: { kind: 'product' } }));
    currentProduct = model;
    window.updateLocalRoute?.('product', model);
    const category = categoryOf(product);
    const body = element('div', 'catalog-detail');
    body.setAttribute('data-i18n-skip', '');
    body.append(element('div', 'eyebrow dark', 'SiTime / ' + bilingual(category.name)));
    const hero = element('div', 'catalog-detail-hero');
    const image = element('img'); window.siteImage(image, product.image); image.alt = product.model + text(' 产品示意图', ' product illustration'); image.width = 180; image.height = 150;
    const intro = element('div');
    intro.append(element('h2', '', product.model), element('p', '', bilingual(category.description)));
    hero.append(image, intro); body.append(hero);
    const summaryParts = [product.model];
    if (bilingual(product.values.frequency)) summaryParts.push(bilingual(product.values.frequency));
    if (bilingual(product.values.output)) summaryParts.push(bilingual(product.values.output) + text(' 输出', ' output'));
    const summary = element('p', 'catalog-detail-summary', summaryParts.join(' · '));
    body.append(summary);
    const specs = element('dl', 'catalog-specs');
    for (const [key, label] of Object.entries(labels)) {
      if (product.values[key] && bilingual(product.values[key]).trim()) specs.append(parameter(parameterLabel(product, key), bilingual(product.values[key])));
    }
    product.extra.forEach((entry) => specs.append(parameter(bilingual(entry.label), bilingual(entry.value))));
    body.append(specs);
    const note = element('p', 'catalog-detail-note', text(
      '不同参数范围对应不同订货选项，并非所有参数可同时组合。抖动等性能需结合原始规格书的测试频段与工作条件理解。',
      'Ranges cover different ordering options; not every combination is available. Interpret jitter and other performance values using the measurement bandwidth and operating conditions in the original datasheet.'
    )); body.append(note);
    const actions = element('div', 'catalog-detail-actions');
    actions.append(documentLink(product, false, 'button'));
    const inquiry = element('a', 'catalog-inquiry', text('向芯聚电子咨询此型号 →', 'Ask SIMACITY about this model →'));
    inquiry.href = '#contact';
    inquiry.addEventListener('click', () => { if (window.prepareProductInquiry) { window.prepareProductInquiry(product.model, 'inquiry'); if (dialog.open) dialog.close(); } else prepareInquiry(product.model);
    }); actions.append(inquiry);
    if (window.SITE_PAGES) { const page = element('a', 'detail-page-link', text('打开独立详情页 →', 'Open full detail page →')); page.href = window.detailPageHref('product', product.model); actions.append(page); }
    body.append(actions);
    if (product.datasheet.type === 'request') body.append(element('p', 'catalog-request-note', text(
      '此型号暂无已验证的原厂规格书。请联系芯聚电子获取，原厂资料补齐后将在此提供直接下载。',
      'A verified manufacturer datasheet is not yet available for this model. Contact SIMACITY to obtain it; direct download will be added once the original document is available.'
    )));
    const sources = element('div', 'catalog-sources');
    sources.append(element('span', '', text('资料核对日期 ' + product.datasheet.verified + ' · 参数依据公开产品资料整理，具体条件请查阅本站原厂 PDF。', 'Checked ' + product.datasheet.verified + ' · Parameters are based on public product information. Consult the local manufacturer PDF for full conditions.')));
    body.append(sources);
    document.querySelector('#dialog-content').replaceChildren(body);
    if (!dialog.open) dialog.showModal();
  }
  dialog.addEventListener('close', () => { if (!dialog.open) currentProduct = null; });
  document.addEventListener('site:detailopen', (event) => { if (event.detail.kind !== 'product') currentProduct = null; });
  function results() {
    const query = state.query.trim().normalize('NFKC').toLowerCase();
    return data.products.filter((product) => {
      const category = categoryOf(product);
      const searchable = [product.model, category.name.zh, category.name.en, ...Object.values(product.values).flatMap((value) => [value.zh, value.en]), ...product.extra.flatMap((entry) => [entry.label.zh, entry.label.en, entry.value.zh, entry.value.en])].join(' ').normalize('NFKC').toLowerCase();
      return (state.category === 'all' || product.category === state.category)
        && (state.output === 'all' || product.values.output.en.toLowerCase().includes(state.output.toLowerCase()))
        && (!query || searchable.includes(query));
    });
  }
  function renderCategories() {
    const container = document.querySelector('#catalog-categories');
    const all = { id: 'all', name: { zh: '全部产品', en: 'All products' } };
    container.replaceChildren();
    for (const category of [all, ...data.categories]) {
      const count = category.id === 'all' ? data.products.length : data.products.filter((product) => product.category === category.id).length;
      const button = element('button', 'catalog-category'); button.type = 'button'; button.dataset.catalogCategory = category.id;
      button.setAttribute('aria-pressed', String(state.category === category.id));
      button.append(element('span', '', bilingual(category.name)), element('small', '', String(count).padStart(2, '0')));
      button.addEventListener('click', () => { state.category = category.id; state.page = 1; render(); });
      container.append(button);
    }
  }
  function renderRows() {
    const found = results();
    const pages = Math.max(1, Math.ceil(found.length / pageSize)); state.page = Math.min(state.page, pages);
    const first = (state.page - 1) * pageSize;
    document.querySelector('#catalog-result-status').textContent = text(
      `共 ${found.length} 个型号${found.length ? ` · 显示 ${first + 1}–${Math.min(first + pageSize, found.length)}` : ''}`,
      `${found.length} models${found.length ? ` · Showing ${first + 1}–${Math.min(first + pageSize, found.length)}` : ''}`
    );
    const list = document.querySelector('#catalog-list'); list.replaceChildren();
    for (const product of found.slice(first, first + pageSize)) {
      const row = element('article', 'catalog-product'); row.dataset.catalogModel = product.model;
      const identity = element('button', 'catalog-identity'); identity.type = 'button'; identity.setAttribute('aria-label', text('查看 ' + product.model + ' 参数', 'View ' + product.model + ' specifications'));
      const image = element('img'); window.siteImage(image, product.image); image.alt = product.model + text(' 产品示意图', ' product illustration'); image.loading = 'lazy'; image.width = 72; image.height = 72;
      const title = element('div'); title.append(element('h4', '', product.model), element('span', '', bilingual(categoryOf(product).name)));
      identity.append(image, title); identity.addEventListener('click', () => openProduct(product.model));
      const specs = element('dl', 'catalog-row-specs');
      for (const key of (product.summaryFields || ['frequency', 'stability', 'output'])) specs.append(parameter(parameterLabel(product, key), bilingual(product.values[key]) || '—'));
      const actions = element('div', 'catalog-row-actions');
      const details = element('button', '', text('参数详情 →', 'Specifications →')); details.type = 'button'; details.addEventListener('click', () => openProduct(product.model));
      if (window.SITE_PAGES) { const page = element('a', 'detail-page-link', text('完整详情 →', 'Full details →')); page.href = window.detailPageHref('product', product.model); actions.append(page); }
      actions.append(details, documentLink(product, true));
      row.append(identity, specs, actions); list.append(row);
    }
    if (!found.length) {
      const empty = element('div', 'catalog-empty'); empty.append(element('h4', '', text('未找到匹配型号', 'No matching models')), element('p', '', text('请尝试其他型号、参数或输出接口，也可以重置筛选。', 'Try another model, parameter or output type, or reset the filters.'))); list.append(empty);
    }
    const pagination = document.querySelector('#catalog-pagination'); pagination.replaceChildren();
    for (const [label, delta, disabled] of [[text('上一页', 'Previous'), -1, state.page === 1], [text('下一页', 'Next'), 1, state.page === pages]]) {
      const button = element('button', '', label); button.type = 'button'; button.disabled = disabled;
      button.addEventListener('click', () => { state.page += delta; renderRows(); document.querySelector('#catalog-result-status').scrollIntoView({ block: 'start' }); });
      if (delta === 1) pagination.append(element('span', '', `${state.page} / ${pages}`));
      pagination.append(button);
    }
  }
  function render() {
    const copy = {
      eyebrow: ['MEMS TIMING / 产品中心', 'MEMS TIMING / PRODUCT CENTER'], heading: ['精准选型，从这里开始。', 'Find your precision timing solution.'],
      intro: ['汇集 MEMS 晶振与时钟芯片的型号参数、产品示意图及 SiTime 原厂规格书。', 'Explore model specifications, product illustrations and SiTime manufacturer datasheets, organized by product family.'],
      categories: ['产品分类', 'Product families'], updated: ['目录更新：' + data.updated, 'Catalog updated: ' + data.updated], searchLabel: ['搜索型号或技术参数', 'Search models or specifications'], outputLabel: ['输出接口', 'Output type'],
      disclaimer: ['参数用于选型索引，各项范围对应不同订货选项，请以原始规格书的完整测试条件为准。仅提供已验证的 SiTime 原厂规格书；未取得原厂文件的型号可联系芯聚电子获取。', 'Specifications are a selection index. Ranges cover different ordering options; consult the original datasheet for full conditions. Only verified SiTime manufacturer datasheets are available for download; contact SIMACITY for models whose original document is not yet available.']
    };
    root.querySelectorAll('[data-catalog-text]').forEach((node) => { node.textContent = text(...copy[node.dataset.catalogText]); });
    root.querySelector('.catalog-sidebar').setAttribute('aria-label', text('产品分类', 'Product families'));
    document.querySelector('#catalog-pagination').setAttribute('aria-label', text('产品分页', 'Product pagination'));
    search.placeholder = text('例如 SiT8008、LVDS、32.768', 'Try SiT8008, LVDS or 32.768');
    output.options[0].text = text('全部接口', 'All outputs'); document.querySelector('#catalog-reset').textContent = text('重置筛选', 'Reset filters');
    const category = data.categories.find((item) => item.id === state.category);
    document.querySelector('#catalog-category-title').textContent = category ? bilingual(category.name) : text('全部计时产品', 'All timing products');
    document.querySelector('#catalog-category-description').textContent = category ? bilingual(category.description) : text(`${data.categories.length} 个产品分类，按型号与技术参数快速筛选。`, `${data.categories.length} product families. Find a model by name or technical specifications.`);
    document.querySelector('#catalog-total').textContent = text(`${data.products.length} 个型号`, `${data.products.length} models`);
    renderCategories(); renderRows();
  }
  function reset() { state.category = 'all'; state.query = ''; state.output = 'all'; state.page = 1; search.value = ''; output.value = 'all'; render(); }
  search.addEventListener('input', () => { state.query = search.value; state.page = 1; renderRows(); });
  output.addEventListener('change', () => { state.output = output.value; state.page = 1; renderRows(); });
  document.querySelector('#catalog-reset').addEventListener('click', reset);
  document.addEventListener('site:languagechange', () => { const status = document.querySelector('#datasheet-download-status'); if (status) status.hidden = true; render(); if (currentProduct && dialog.open) openProduct(currentProduct); });
  window.catalogReset = reset;
  window.catalogSelectCategory = (id) => { reset(); if (data.categories.some(c => c.id === id)) { state.category = id; render(); } };
  window.openCatalogProduct = openProduct;
  window.createDatasheetLink = documentLink;
  render();
})();

