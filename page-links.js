window.detailPageHref = (kind, id, lang = window.siteI18n.language) => {
  const folders = { product: 'products', solution: 'solutions', industry: 'industries', news: 'news' };
  return (lang === 'en' ? '/en' : '') + '/' + folders[kind] + '/' + encodeURIComponent(String(id).toLowerCase()) + '/';
};
(() => {
  function renderDirectories() {
    const en = window.siteI18n.language === 'en';
    const titles = {
      product: ['浏览产品详情目录 →', 'Browse product detail pages →'],
      solution: ['浏览全部方案详情 →', 'Browse application detail pages →'],
      news: ['浏览新闻详情目录 →', 'Browse news detail pages →']
    };
    for (const link of document.querySelectorAll('[data-independent-directory]')) {
      const kind = link.dataset.independentDirectory;
      link.hidden = !window.SITE_PAGES;
      link.href = window.detailPageHref(kind, '');
      link.textContent = titles[kind][en ? 1 : 0];
    }
  }
  document.addEventListener('site:languagechange', renderDirectories);
  renderDirectories();
})();
