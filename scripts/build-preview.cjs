// Build a self-contained LiveCodes preview without enabling online form submission.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const context = { window: {} }; vm.createContext(context);
vm.runInContext(read('catalog-data.js'), context);
const catalog = context.window.MEMS_CATALOG;
const copies = JSON.parse(read('data/preview-documents.json'));
const imageCopies = JSON.parse(read('data/preview-images.json'));
for (const p of catalog.products) {
  if (p.datasheet.type !== 'pdf') continue;
  const copy = copies[p.model]; const bytes = fs.readFileSync(path.join(root, p.datasheet.local));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  if (!copy || copy.sha256 !== sha256 || copy.bytes !== bytes.length || p.datasheet.sha256 !== sha256) throw Error(`Unverified preview PDF: ${p.model}`);
  p.datasheet.previewCopy = copy.url;
}
const markup = read('index.html').replace(/<link rel="stylesheet" href="styles.css">\s*/g, '').replace(/<script defer src="[^"]+"><\/script>\s*/g, '').replace(/(<a\b[^>]*href=")\/(?!\/)/g, '$1https://sitime-cn.com/');
for (const [local, meta] of Object.entries(imageCopies)) {
  const raw = fs.readFileSync(path.join(root, local));
  if (raw.length !== meta.bytes || crypto.createHash('sha256').update(raw).digest('hex') !== meta.sha256) throw Error(`Unverified preview image: ${local}`);
}
const imageLoader = `(() => {
  const copies = ${JSON.stringify(imageCopies)};
  const cache = new Map();
  const fallback = ${JSON.stringify('data:image/svg+xml;base64,' + Buffer.from(read('assets/site-images/image-pending.svg')).toString('base64'))};
  const digest = async raw => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', raw)), b => b.toString(16).padStart(2, '0')).join('');
  async function fetchImage(local) {
    const meta = copies[local]; if (!meta) throw Error('Unverified image');
    const parts = await Promise.all(meta.parts.map(async url => {
      const res = await fetch(url, { credentials: 'omit', cache: 'force-cache' }); if (!res.ok) throw Error('Image copy unavailable');
      const p = (await res.json()).customSettings?.simacityAssetPart; if (!p || p.encoding !== 'base64') throw Error('Invalid image copy');
      const binary = atob(p.data); const raw = new Uint8Array(binary.length); for (let i=0; i<raw.length; i++) raw[i]=binary.charCodeAt(i);
      if (raw.length !== p.bytes || await digest(raw) !== p.sha256) throw Error('Image copy mismatch'); return raw;
    }));
    const raw = new Uint8Array(parts.reduce((n,p)=>n+p.length,0)); let offset=0; for(const p of parts){raw.set(p,offset);offset+=p.length;}
    if (raw.length !== meta.bytes || await digest(raw) !== meta.sha256) throw Error('Image checksum mismatch');
    return URL.createObjectURL(new Blob([raw], { type: meta.mime }));
  }
  window.siteImage = (image, local) => {
    image.src = fallback; image.dataset.localAsset = local;
    if(!cache.has(local)) cache.set(local, fetchImage(local));
    cache.get(local).then(url=>{image.src=url;}).catch(()=>{image.src=fallback;});
  };
})();`;
const scripts = ['i18n.js', 'site-assets.js', 'reading-data.js', 'news-details-data.js', 'reading-guide.js', 'catalog-data.js', 'content-data.js', 'app.js', 'site-pages-config.js', 'page-links.js', 'inquiry-config.js', 'inquiry.js', 'local-routes.js'];
const script = scripts.map((name) => name === 'catalog-data.js' ? 'window.MEMS_CATALOG = ' + JSON.stringify(catalog) + ';' : name === 'site-assets.js' ? imageLoader : name === 'site-pages-config.js' ? 'window.SITE_PAGES = false; window.SITE_ORIGIN = "https://sitime-cn.com";' : read(name)).join('\n;\n');
new vm.Script(script);
const config = {
  title: '芯聚电子 SiTime · 产品、询价与资料下载',
  description: '137 个型号、117 份原厂 PDF、集中下载中心及产品询价',
  markup: { language: 'html', content: markup },
  style: { language: 'css', content: read('styles.css') },
  script: { language: 'javascript', content: script },
  mode: 'result', tools: { enabled: [] }, cssPreset: '', autoupdate: true
};
const output = process.argv[2] || '/tmp/sitime-preview.json';
fs.writeFileSync(output, JSON.stringify(config));
console.log(`Preview ready: ${output} (${fs.statSync(output).size} bytes)`);
