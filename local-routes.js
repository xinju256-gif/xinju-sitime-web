(() => {
  const dialog = document.querySelector('#content-dialog');
  const valid = new Set(['product', 'solution', 'industry', 'news']);
  window.updateLocalRoute = (kind, id) => {
    if (!valid.has(kind)) return;
    try { history.replaceState(null, '', `#read/${kind}/${encodeURIComponent(id)}`); } catch { /* Embedded previews may not permit history updates. */ }
  };
  function openFromHash() {
    const match = location.hash.match(/^#read\/(product|solution|industry|news)\/([^/]+)$/);
    if (!match) return;
    let id;
    try { id = decodeURIComponent(match[2]); } catch { return; }
    if (match[1] === 'product') window.openCatalogProduct(id);
    else window.openEditorialItem(match[1], id);
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
