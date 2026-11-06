
const $ = (selector) => document.querySelector(selector);
const menu = $('.menu-toggle');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  $('#navigation').classList.toggle('open', open);
});
$('#navigation').addEventListener('click', (event) => {
  if (event.target.closest('a')) { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', '打开导航'); $('#navigation').classList.remove('open'); }
});
const resources = {
  guide: ['计时产品选型指南', 'DESIGN GUIDE', '从系统需求出发，逐步缩小计时方案的选择范围。', ['定义应用场景及工作温度范围。', '列出频率、精度、抖动和相位噪声要求。', '确认电源、逻辑接口、封装和功耗限制。', '对照官方数据手册，并在实际板卡上验证。']],
  mems: ['认识 MEMS 精密计时', 'TECHNOLOGY INSIGHT', 'MEMS 即微机电系统。通过在硅片上制造微型机械结构，可以将机械谐振与电子电路相结合。', ['谐振器产生稳定的机械振动。', '配套电路维持振荡，并完成温度补偿与输出处理。', '不同系列适用于不同环境，实际性能应以对应数据手册为依据。']],
  support: ['开始设计前的需求清单', 'ENGINEERING CHECKLIST', '整理以下信息，有助于与技术团队高效讨论。', ['应用场景、系统框图及产品开发阶段。', '输入与输出频率、接口类型和供电电压。', '精度、抖动、功耗与工作温度要求。', '目标封装尺寸、预计用量和项目时间表。']]
};
function showContent(data) {
  document.dispatchEvent(new CustomEvent('site:detailopen', { detail: { kind: 'resource' } }));
  const container = $('#dialog-content'); container.replaceChildren();
  const category = document.createElement('span'); category.className = 'dialog-category'; category.textContent = data[1];
  const title = document.createElement('h2'); title.textContent = data[0];
  const description = document.createElement('p'); description.textContent = data[2];
  const list = document.createElement('ul'); data[3].forEach((text) => { const item = document.createElement('li'); item.textContent = text; list.append(item); });
  const link = document.createElement('a'); link.href = '#contact'; link.className = 'button'; link.textContent = '整理您的应用需求 ↗'; link.addEventListener('click', () => $('#content-dialog').close());
  container.append(category, title, description, list, link); $('#content-dialog').showModal();
}
document.querySelectorAll('[data-resource]').forEach((button) => button.addEventListener('click', () => showContent(resources[button.dataset.resource])));
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
});
const searchItems = [['MEMS 振荡器', '低抖动 频率 oscillator', '#products'], ['时钟芯片', '同步 时钟分配 clock', '#products'], ['MEMS 谐振器', 'resonator 硅基', '#products'], ['AI 与数据中心', '高速计算 infrastructure', '#applications'], ['汽车电子', '智能驾驶 automotive', '#applications'], ['通信与物联网', '网络 connectivity', '#applications'], ['工业与自动化', 'industrial', '#applications'], ['MEMS 技术与创新', '技术 硅基', '#technology'], ['设计资源与支持', '指南 选型', '#resources'], ['芯聚电子 SIMACITY', '地址 电话 邮箱 公司 联系', '#about']];
searchItems.push(['资料下载', '下载中心 原厂规格书 PDF downloads datasheets', '#downloads', null, null, 'Datasheet downloads']);
searchItems.push(...window.MEMS_CATALOG.products.map((p) => [p.model, [p.values.frequency.zh, p.values.output.zh].join(' '), '#products', p.model]));
searchItems.push(...window.MEMS_CATALOG.categories.map((c) => [c.name.zh, c.name.en, '#products', null, c.id, c.name.en]));
searchItems.push(...window.SITIME_CONTENT.solutions.map((item) => [item.title.zh, item.title.en + ' ' + item.summary.zh, '#applications', null, null, item.title.en, 'solution', item.id]));
searchItems.push(...window.SITIME_CONTENT.news.map((item) => [item.title.zh, item.title.en + ' ' + item.date, '#news', null, null, item.title.en, 'news', item.id]));
function search() {
  const query = $('#site-search').value.trim().normalize('NFKC').toLowerCase(); const results = $('#search-results'); results.replaceChildren();
  const matches = searchItems.filter((item) => (item[0] + item[1] + window.siteI18n.translate(item[0], 'en')).normalize('NFKC').toLowerCase().includes(query));
  matches.slice(0, 30).forEach((item) => { const link = document.createElement('a'); link.href = item[2]; link.textContent = `${window.siteI18n.language === 'en' && item[5] ? item[5] : item[0]} ↗`; link.addEventListener('click', () => { $('#search-dialog').close(); if (item[6]) window.openEditorialItem(item[6], item[7]); else if (item[3]) window.openCatalogProduct(item[3]); else if (item[4]) window.catalogSelectCategory(item[4]); else if (item[2] === '#products') window.catalogReset(); }); results.append(link); });
  if (matches.length > 30) { const more = document.createElement('p'); more.textContent = window.siteI18n.language === 'en' ? `${matches.length} matches. Showing the first 30; refine your search or use the dedicated section filters.` : `共 ${matches.length} 条结果，显示前 30 条；可缩小关键词或前往对应栏目筛选。`; results.append(more); }
  if (!matches.length) { const empty = document.createElement('p'); empty.textContent = '暂无匹配结果，请尝试“振荡器”“汽车”或“技术”。'; results.append(empty); }
}
$('#search-open').addEventListener('click', () => { $('#search-dialog').showModal(); search(); $('#site-search').focus(); });
$('#site-search').addEventListener('input', search);

const floatingToggle = $('#floating-contact-toggle');
const floatingPanel = $('#floating-contact-panel');
function setContactPanel(open, restoreFocus = false) {
  floatingToggle.setAttribute('aria-expanded', String(open));
  floatingPanel.hidden = !open;
  if (open) floatingPanel.querySelector('.contact-panel-close').focus({ preventScroll: true });
  else if (restoreFocus) floatingToggle.focus({ preventScroll: true });
}
floatingToggle.addEventListener('click', () => setContactPanel(floatingToggle.getAttribute('aria-expanded') !== 'true'));
floatingPanel.querySelector('.contact-panel-close').addEventListener('click', () => setContactPanel(false, true));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !floatingPanel.hidden && !document.querySelector('dialog[open]')) { event.preventDefault(); setContactPanel(false, true); }
});
document.addEventListener('click', (event) => {
  if (!floatingPanel.hidden && !event.target.closest('.floating-contact')) setContactPanel(false);
});

