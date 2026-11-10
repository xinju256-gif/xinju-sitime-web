(() => {
  const dialog = document.querySelector('#content-dialog');
  const valid = new Set(['product', 'solution', 'industry', 'news']);
  window.updateLocalRoute = (kind, id) => {
    if (!valid.has(kind)) return;
    try { history.replaceState(null, '', `#read/${kind}/${encodeURIComponent(id)}`); } catch { /* Embedded previews may not permit history updates. */ }
  };
  function openFromHash() {
    const match = location.hash.match(/^#read\/(product|solution|industry|news)\/([^/]+)$/);
    if (!match) { const directory = { '#products': 'product', '#applications': 'solution', '#downloads': 'download', '#news': 'news' }[location.hash]; if (directory && !document.querySelector(location.hash)) location.replace(window.detailPageHref(directory, '')); return; }
    let id;
    try { id = decodeURIComponent(match[2]); } catch { return; }
    const opener = match[1] === 'product' ? window.openCatalogProduct : window.openEditorialItem;
    if (typeof opener !== 'function') { location.replace(window.detailPageHref(match[1], id)); return; }
    if (match[1] === 'product') opener(id); else opener(match[1], id);
  }
  window.addEventListener('hashchange', openFromHash);
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    const match = location.hash.match(/^#read\/(product|solution|industry|news)\//);
    if (match) {
      try { history.replaceState(null, '', match[1] === 'product' ? '#products' : match[1] === 'news' ? '#news' : '#applications'); } catch { /* See above. */ }
    }
  });
  setTimeout(openFromHash, 0);
})();
