"""Generate crawlable bilingual HTML pages from the reviewed local catalog."""
import base64
from html import escape
import json
import os
from pathlib import Path
import re
import urllib.parse
import xml.etree.ElementTree as ET

from news_sync import ROOT, load_content

GROUPS = {'product': 'products', 'solution': 'solutions', 'industry': 'industries', 'news': 'news'}
LABELS = {'product': ('产品中心', 'Products'), 'solution': ('解决方案', 'Solutions'),
          'industry': ('行业应用', 'Industries'), 'news': ('新闻与技术导读', 'News & insights')}
PARAMETERS = {'frequency': ('频率', 'Frequency'), 'stability': ('频率稳定性', 'Frequency stability'),
              'output': ('输出接口', 'Output'), 'supply': ('供电电压 (V)', 'Supply voltage (V)'),
              'temperature': ('温度范围 (°C)', 'Temperature range (°C)'), 'package': ('封装尺寸 (mm)', 'Package dimensions (mm)')}
WORKFLOW = [
    ('记录本应用所需的频率、稳定性、接口、供电、封装和温度范围。', 'Record frequency, stability, interface, supply, package and temperature requirements.'),
    ('在本站产品目录中筛选型号，并下载对应原厂规格书核对完整测试条件。', 'Filter local catalog models and download the manufacturer datasheet to verify full test conditions.'),
    ('使用具体订货代码确认配置、资格等级及交期，再开展原理图、布局和样机验证。', 'Confirm configuration, qualification and lead time for the ordering code, then validate schematic, layout and prototype.')]


def tr(pair, lang):
    return pair[lang == 'en']


def safe(value):
    return escape(str(value), quote=True)


def json_script(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')


def route(kind, item_id='', lang='zh'):
    slug = str(item_id).lower()
    if slug and not re.fullmatch(r'[a-z0-9-]+', slug):
        raise ValueError('Unsafe page ID: ' + slug)
    return ('/en' if lang == 'en' else '') + '/' + GROUPS[kind] + '/' + (slug + '/' if slug else '')


def site_config():
    config = json.loads((ROOT / 'data/site-config.json').read_text())
    configured = os.environ.get('SITE_URL') or config.get('site_url')
    if config.get('require_custom_domain') and not configured:
        raise ValueError('Custom domain is awaiting confirmation. Set SITE_URL or data/site-config.json site_url before producing a release build.')
    url = (configured or os.environ.get('URL') or '').rstrip('/')
    parts = urllib.parse.urlsplit(url)
    if parts.scheme != 'https' or not re.fullmatch(r'[A-Za-z0-9.-]+(?::[0-9]+)?', parts.netloc) or parts.path or parts.query or parts.fragment or parts.username:
        raise ValueError('SITE_URL must be an HTTPS origin without credentials, path, query or fragment')
    config['site_url'] = url
    return config


class StaticPages:
    def __init__(self, target, content, catalog):
        self.target = target
        self.content = content
        self.catalog = catalog
        self.products = {p['model']: p for p in catalog['products']}
        self.categories = {c['id']: c for c in catalog['categories']}
        self.notes = load_content(ROOT / 'reading-data.js')
        self.config = site_config()
        self.origin = self.config['site_url']
        self.pages = []
        self.search = []
        self.logo = self.extract_brand()

    def extract_brand(self):
        source = (ROOT / 'index.html').read_text()
        images = re.findall(r'<img\b[^>]*src="(data:image/[^;]+;base64,[^"]+)"[^>]*>', source)
        folder = self.target / 'assets/brand'
        folder.mkdir(parents=True, exist_ok=True)
        names = []
        for i, src in enumerate(dict.fromkeys(images)):
            mime, encoded = src.split(';base64,', 1)
            suffix = '.png' if mime.endswith('/png') else '.jpg'
            name = f'brand-{i}{suffix}'
            (folder / name).write_bytes(base64.b64decode(encoded))
            names.append('/assets/brand/' + name)
        if not names:
            raise ValueError('No brand logo found')
        return names[0]

    def title(self, kind, item, lang):
        if kind == 'product':
            return item['model'] + ' · ' + self.categories[item['category']]['name'][lang]
        return item['title'][lang]

    def description(self, kind, item, lang):
        if kind == 'product':
            p = item
            parts = [p['model'], self.categories[p['category']]['name'][lang]]
            for key in ['frequency', 'output', 'package']:
                if p['values'].get(key, {}).get(lang):
                    parts.append(p['values'][key][lang])
            parts.append(tr(('查看参数、下载原厂规格书，联系芯聚电子进行技术选型与询价。', 'View specifications, download the manufacturer PDF and contact SIMACITY for selection and inquiries.'), lang))
            value = '；'.join(parts) if lang == 'zh' else '. '.join(parts)
        else:
            prefix = item['date'] + ' · ' if kind == 'news' else ''
            value = prefix + self.title(kind, item, lang) + '：' + item['summary'][lang]
        limit = 180 if lang == 'zh' else 300
        return value if len(value) <= limit else value[:limit - 1].rstrip() + '…'

    def link(self, href, label, cls=''):
        return f'<a href="{safe(href)}"' + (f' class="{safe(cls)}"' if cls else '') + f'>{safe(label)}</a>'

    def header(self, lang, alternate):
        en = lang == 'en'
        home = '/'
        nav = [(route('product', lang=lang), LABELS['product']), (route('solution', lang=lang), LABELS['solution']),
               ('/#technology', ('技术与创新', 'Technology')), ('/#downloads', ('资料下载', 'Downloads')),
               (route('news', lang=lang), ('新闻动态', 'News')), ('/#about', ('关于我们', 'About'))]
        links = ''.join(self.link(url, tr(label, lang)) for url, label in nav)
        return f'''<a class="detail-skip" href="#main">{tr(('跳至正文','Skip to content'),lang)}</a>
<header class="header"><div class="brand-pair"><a class="simacity-brand" href="{home}" aria-label="SIMACITY"><img src="{self.logo}" alt="SIMACITY" width="2126" height="740"></a><span class="brand-divider" aria-hidden="true"></span><a class="logo" href="/"><em>Si</em>Time<span>®</span><small>THE HEARTBEAT OF TECHNOLOGY</small></a></div>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="navigation" aria-label="{tr(('打开导航','Open navigation'),lang)}">☰</button><nav id="navigation" aria-label="{tr(('主导航','Main navigation'),lang)}">{links}</nav>
<div class="nav-actions"><a href="{route('product',lang=lang)}" id="detail-search-open" aria-label="{tr(('搜索本站资料','Search this site'),lang)}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></a><a class="language" href="{alternate}" hreflang="{'zh-CN' if en else 'en'}">{tr(('简体中文 / EN','中文 / EN'),lang)}</a><a class="button small" href="/#contact">{tr(('联系我们 ↗','Contact ↗'),lang)}</a></div></header>'''

    def footer(self, lang):
        return f'''<footer class="detail-footer"><div><strong>SIMACITY / 芯聚电子</strong><p>{tr(('SiTime 精密计时产品选型与咨询','SiTime precision timing selection and inquiries'),lang)}</p></div><div><a href="tel:+862162271972">021-62271972</a><a href="mailto:sales@simacity.com.cn">sales@simacity.com.cn</a><a href="/#contact">{tr(('联系芯聚电子','Contact SIMACITY'),lang)}</a></div><p>{tr(('参数以本站原厂规格书为准 · 本站非 SiTime 官方网站','Consult the local manufacturer datasheets. This is not the SiTime corporate website.'),lang)}</p></footer>
<dialog id="detail-search-dialog"><button class="dialog-close" type="button" aria-label="{tr(('关闭搜索','Close search'),lang)}">×</button><h2>{tr(('搜索本站资料','Search this site'),lang)}</h2><label for="detail-search">{tr(('型号、应用或新闻关键词','Model, application or news keyword'),lang)}</label><input id="detail-search" type="search" autocomplete="off"><div id="detail-search-results" aria-live="polite"></div></dialog>'''

    def write(self, path, title, description, body, lang, alternate, crumbs, entity):
        canonical = self.origin + path
        zh_path = alternate if lang == 'en' else path
        en_path = path if lang == 'en' else alternate
        breadcrumbs = [{'@type': 'ListItem', 'position': i + 1, 'name': label, 'item': self.origin + url} for i, (label, url) in enumerate(crumbs)]
        graph = [
            {'@type': 'Organization', '@id': self.origin + '/#organization', 'name': self.config['organization'], 'url': self.origin + '/', 'email': self.config['email'], 'telephone': self.config['phone']},
            {'@type': 'WebSite', '@id': self.origin + '/#website', 'name': self.config['name'], 'url': self.origin + '/', 'publisher': {'@id': self.origin + '/#organization'}},
            {'@type': 'BreadcrumbList', 'itemListElement': breadcrumbs}, entity]
        full_title = title + (' | 上海芯聚电子' if lang == 'zh' else ' | SIMACITY')
        head = f'''<!doctype html><html lang="{'en' if lang == 'en' else 'zh-CN'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{safe(full_title)}</title><meta name="description" content="{safe(description)}"><link rel="canonical" href="{canonical}">
<link rel="alternate" hreflang="zh-CN" href="{self.origin + zh_path}"><link rel="alternate" hreflang="en" href="{self.origin + en_path}"><link rel="alternate" hreflang="x-default" href="{self.origin + zh_path}">
<meta property="og:title" content="{safe(full_title)}"><meta property="og:description" content="{safe(description)}"><meta property="og:url" content="{canonical}"><meta property="og:type" content="{'article' if entity['@type'] in ['TechArticle','NewsArticle','BlogPosting'] else 'website'}">
<link rel="stylesheet" href="/styles.css"><script type="application/ld+json">{json_script({'@context':'https://schema.org','@graph':graph})}</script>
<script defer src="/detail-search-data.js"></script><script defer src="/detail-pages.js"></script></head><body class="standalone-page">'''
        breadcrumb_html = '<nav class="detail-breadcrumbs" aria-label="' + tr(('面包屑', 'Breadcrumb'), lang) + '">' + '<span aria-hidden="true"> / </span>'.join(self.link(url, label) for label, url in crumbs) + '</nav>'
        html = head + self.header(lang, alternate) + '<main id="main" class="detail-main">' + breadcrumb_html + body + '</main>' + self.footer(lang) + '</body></html>'
        destination = self.target / path.lstrip('/') / 'index.html'
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(html)
        self.pages.append({'path': path, 'lang': lang, 'alternate': alternate, 'title': full_title})

    def image(self, item, title):
        src = item.get('image')
        return f'<img class="detail-illustration" src="/{safe(src)}" alt="{safe(title)}" width="600" height="340">' if src else ''

    def inquiry(self, kind, item, lang):
        query = {'product': item['model']} if kind == 'product' else {'application': self.title(kind, item, lang), 'type': 'technical'}
        return '/?' + urllib.parse.urlencode(query) + '#contact'

    def specs(self, product, lang):
        rows = []
        for key, label in PARAMETERS.items():
            value = product['values'].get(key, {}).get(lang, '').strip()
            if not value:
                continue
            label = product.get('parameterLabels', {}).get(key, {}).get(lang) or tr(label, lang)
            rows.append((label, value))
        rows += [(entry['label'][lang], entry['value'][lang]) for entry in product['extra']]
        return '<table class="detail-specs"><caption>' + tr(('产品参数', 'Specifications'), lang) + '</caption><tbody>' + ''.join(f'<tr><th scope="row">{safe(label)}</th><td>{safe(value)}</td></tr>' for label, value in rows) + '</tbody></table>'

    def document(self, product, lang):
        doc = product['datasheet']
        if doc['type'] == 'pdf':
            return f'<a class="button" href="/{safe(doc["local"])}" download="{safe(doc["filename"])}">{tr(("下载原厂规格书 PDF ↓","Download manufacturer PDF ↓"),lang)}</a><p class="detail-muted">PDF · {doc["bytes"]/1048576:.2f} MB · {doc["pages"]} {tr(("页","pages"),lang)}</p>'
        url = '/?' + urllib.parse.urlencode({'product': product['model'], 'type': 'datasheet'}) + '#contact'
        return '<p>' + tr(('此型号暂无已验证的原厂规格书，可向芯聚电子索取。', 'A verified manufacturer datasheet is not yet available. Request it from SIMACITY.'), lang) + '</p>' + self.link(url, tr(('索取规格书 →', 'Request datasheet →'), lang), 'button')

    def reading(self, item, kind, lang):
        output = '<section class="local-reading">'
        if kind != 'news':
            output += '<h2>' + tr(('工程选型说明', 'Engineering selection notes'), lang) + '</h2>'
            for i, key in enumerate(item.get('focus', {}).get('zh', [])):
                pair = self.notes['focusCopy'].get(key, self.notes['focusCopy']['接口配合'])
                output += '<h3>' + safe(item['focus'][lang][i]) + '</h3><p>' + safe(tr(pair, lang)) + '</p>'
            output += '<h2>' + tr(('从需求到验证', 'From requirements to validation'), lang) + '</h2><ol>' + ''.join('<li>' + safe(tr(pair, lang)) + '</li>' for pair in WORKFLOW) + '</ol>'
        else:
            default = {'title': ['计时产品阅读提示', 'Timing product context'], 'body': ['选型时请把资讯中的产品方向与实际需求区分开。具体参数和完整测试条件，请查阅本站对应型号的原厂 PDF。', 'Distinguish product announcements from application requirements. Consult the local manufacturer PDF for exact specifications and test conditions.']}
            topic = next((topic for topic in self.notes['topics'] if re.search(topic['pattern'], item['title']['en'], re.I)), default)
            output += '<h2>' + safe(tr(topic['title'], lang)) + '</h2><p>' + safe(tr(topic['body'], lang)) + '</p>'
            output += '<p class="detail-muted">' + tr(('以上为本站原创阅读提示，不属于原厂文章的逐字转载。', 'These are original SIMACITY reading notes, not a verbatim reproduction of the manufacturer article.'), lang) + '</p>'
        return output + '</section>'

    def cards(self, kind, items, lang):
        result = '<div class="detail-card-grid">'
        for item in items:
            item_id = item['model'] if kind == 'product' else item['id']
            title = self.title(kind, item, lang)
            text = self.description(kind, item, lang)
            result += '<article class="detail-card" data-page-card data-search="' + safe((title + ' ' + text).lower()) + '"><h2>' + self.link(route(kind, item_id, lang), title) + '</h2>'
            if kind == 'news':
                result += '<time datetime="' + item['date'] + '">' + item['date'] + '</time>'
            result += '<p>' + safe(text) + '</p>' + self.link(route(kind, item_id, lang), tr(('查看详情 →', 'View details →'), lang), 'detail-card-link') + '</article>'
        return result + '</div>'

    def product_page(self, p, lang):
        path = route('product', p['model'], lang)
        title = self.title('product', p, lang)
        description = self.description('product', p, lang)
        family = self.categories[p['category']]['name'][lang]
        body = '<article><div class="detail-kicker">SiTime / ' + safe(family) + '</div><h1>' + safe(p['model']) + '</h1><div class="detail-product-hero">' + self.image(p, p['model']) + '<div><h2>' + safe(family) + '</h2><p>' + safe(self.categories[p['category']]['description'][lang]) + '</p><div class="detail-actions">' + self.document(p, lang) + '</div>' + self.link(self.inquiry('product', p, lang), tr(('咨询此型号 →', 'Ask about this model →'), lang), 'detail-card-link') + '</div></div>'
        body += self.specs(p, lang) + '<p class="detail-note">' + tr(('参数范围对应不同订货选项，并非所有参数可同时组合。抖动、相位噪声等性能需结合规格书中的测试条件理解。', 'Ranges cover different ordering options; not every combination is available. Interpret jitter and phase noise using the datasheet test conditions.'), lang) + '</p>'
        related = [s for s in self.content['solutions'] if p['model'] in s['models']]
        if related:
            body += '<section><h2>' + tr(('相关应用方案', 'Related applications'), lang) + '</h2>' + self.cards('solution', related, lang) + '</section>'
        body += '<p class="detail-muted">' + tr(('资料核对日期：', 'Data checked: '), lang) + safe(p['datasheet']['verified']) + '</p></article>'
        entity = {'@type': 'Product', '@id': self.origin + path + '#product', 'name': p['model'], 'model': p['model'], 'description': description,
                  'category': family, 'brand': {'@type': 'Brand', 'name': 'SiTime'}, 'url': self.origin + path}
        if p.get('image'):
            entity['image'] = self.origin + '/' + p['image']
        crumbs = [(tr(('首页', 'Home'), lang), '/'), (tr(LABELS['product'], lang), route('product', lang=lang)), (p['model'], path)]
        self.write(path, title, description, body, lang, route('product', p['model'], 'en' if lang == 'zh' else 'zh'), crumbs, entity)

    def editorial_page(self, kind, item, lang):
        path = route(kind, item['id'], lang)
        title = self.title(kind, item, lang)
        body = '<article class="detail-editorial"><div class="detail-kicker">' + safe(tr(LABELS[kind], lang)) + '</div><h1>' + safe(title) + '</h1>'
        if kind == 'news':
            body += '<p class="detail-muted">' + tr(('原始资讯日期：', 'Original update date: '), lang) + '<time datetime="' + item['date'] + '">' + item['date'] + '</time></p>'
        body += self.image(item, title) + '<p class="detail-lead">' + safe(item['summary'][lang]) + '</p>'
        if kind == 'news' and lang == 'zh':
            body += '<p class="detail-muted">原文题名：' + safe(item['title']['en']) + '</p>'
        body += self.reading(item, kind, lang)
        models = [self.products[m] for m in item['models'] if m in self.products]
        if models:
            body += '<section><h2>' + tr(('相关产品与本站资料', 'Related products and local documents'), lang) + '</h2>' + self.cards('product', models, lang) + '</section>'
        if kind == 'industry':
            related = [s for s in self.content['solutions'] if item['id'] in s['industries']]
            body += '<section><h2>' + tr(('本行业应用方案', 'Industry applications'), lang) + '</h2>'
            body += self.cards('solution', related, lang) if related else '<p>' + tr(('该行业暂无独立应用条目，可联系芯聚电子讨论选型。', 'No separate application entries are listed for this industry. Contact SIMACITY for selection assistance.'), lang) + '</p>'
            body += '</section>'
        body += '<div class="detail-actions">' + self.link('/#downloads', tr(('查找原厂规格书 ↓', 'Find manufacturer datasheets ↓'), lang), 'button') + self.link(self.inquiry(kind, item, lang), tr(('联系芯聚电子 →', 'Contact SIMACITY →'), lang), 'detail-card-link') + '</div><p class="detail-note">' + tr(('依据 SiTime 公开信息整理，本站提供原创概览和阅读提示；具体器件条件以本站原厂 PDF 为准。', 'Prepared from public SiTime information with original overviews and reading notes. Consult the local manufacturer PDFs for device conditions.'), lang) + '</p></article>'
        entity = {'@type': ('NewsArticle' if item.get('type') == 'release' else 'BlogPosting') if kind == 'news' else 'TechArticle',
                  '@id': self.origin + path + '#article', 'headline': title, 'description': self.description(kind, item, lang),
                  'inLanguage': 'en' if lang == 'en' else 'zh-CN', 'mainEntityOfPage': self.origin + path,
                  'author': {'@type': 'Organization', 'name': self.config['name']}, 'publisher': {'@id': self.origin + '/#organization'}}
        if item.get('image'):
            entity['image'] = self.origin + '/' + item['image']
        crumbs = [(tr(('首页', 'Home'), lang), '/'), (tr(LABELS[kind], lang), route(kind, lang=lang)), (title, path)]
        seo_title = title + ' · ' + item['date'] if kind == 'news' else title
        self.write(path, seo_title, self.description(kind, item, lang), body, lang, route(kind, item['id'], 'en' if lang == 'zh' else 'zh'), crumbs, entity)

    def listing(self, kind, items, lang):
        path = route(kind, lang=lang)
        title = tr(LABELS[kind], lang)
        description = tr((f'{len(items)} 个条目，查看 SiTime {title}及相关本站资料。', f'Browse {len(items)} SiTime {title.lower()} entries and related local resources.'), lang)
        body = '<div class="detail-kicker">SIMACITY / SiTime</div><h1>' + safe(title) + '</h1><p class="detail-lead">' + safe(description) + '</p><div class="detail-list-tools"><label for="page-filter">' + tr(('搜索当前目录', 'Search this directory'), lang) + '</label><input id="page-filter" type="search" placeholder="' + tr(('型号或关键词', 'Model or keyword'), lang) + '" autocomplete="off"><p id="page-filter-status" role="status" aria-live="polite"></p></div>'
        if kind == 'solution':
            body += '<p>' + self.link(route('industry', lang=lang), tr(('按行业查看 →', 'Browse industries →'), lang)) + '</p>'
        body += self.cards(kind, items, lang)
        entity = {'@type': 'CollectionPage', '@id': self.origin + path, 'name': title, 'url': self.origin + path,
                  'mainEntity': {'@type': 'ItemList', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': self.title(kind, item, lang), 'url': self.origin + route(kind, item.get('model', item.get('id')), lang)} for i, item in enumerate(items)]}}
        self.write(path, title, description, body, lang, route(kind, lang='en' if lang == 'zh' else 'zh'), [(tr(('首页', 'Home'), lang), '/'), (title, path)], entity)

    def home_metadata(self):
        path = self.target / 'index.html'
        source = path.read_text()
        source = re.sub(r'<link\b[^>]*rel="canonical"[^>]*>\s*', '', source)
        schema = {'@context': 'https://schema.org', '@graph': [
            {'@type': 'Organization', '@id': self.origin + '/#organization', 'name': self.config['organization'], 'url': self.origin + '/', 'email': self.config['email'], 'telephone': self.config['phone']},
            {'@type': 'WebSite', '@id': self.origin + '/#website', 'name': self.config['name'], 'url': self.origin + '/', 'publisher': {'@id': self.origin + '/#organization'}}]}
        source = source.replace('</head>', f'<link rel="canonical" href="{self.origin}/"><script type="application/ld+json">{json_script(schema)}</script>\n</head>')
        path.write_text(source)

    def generate(self):
        for kind, items in [('product', self.catalog['products']), ('solution', self.content['solutions']), ('industry', self.content['industries']), ('news', self.content['news'])]:
            for lang in ['zh', 'en']:
                self.listing(kind, items, lang)
                for item in items:
                    if kind == 'product':
                        self.product_page(item, lang)
                    else:
                        self.editorial_page(kind, item, lang)
            for item in items:
                self.search.append({'zh': self.title(kind, item, 'zh'), 'en': self.title(kind, item, 'en'), 'zhUrl': route(kind, item.get('model', item.get('id')), 'zh'), 'enUrl': route(kind, item.get('model', item.get('id')), 'en')})
        (self.target / 'detail-search-data.js').write_text('window.SITE_SEARCH = ' + json_script(self.search) + ';\n')
        (self.target / 'site-pages-config.js').write_text('window.SITE_PAGES = true;\n')
        self.home_metadata()
        namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
        alternate_ns = 'http://www.w3.org/1999/xhtml'
        ET.register_namespace('', namespace)
        ET.register_namespace('xhtml', alternate_ns)
        tree = ET.Element('{' + namespace + '}urlset')
        root = ET.SubElement(tree, '{' + namespace + '}url')
        ET.SubElement(root, '{' + namespace + '}loc').text = self.origin + '/'
        for page in self.pages:
            row = ET.SubElement(tree, '{' + namespace + '}url')
            ET.SubElement(row, '{' + namespace + '}loc').text = self.origin + page['path']
            zh = page['alternate'] if page['lang'] == 'en' else page['path']
            en = page['path'] if page['lang'] == 'en' else page['alternate']
            for language, path in [('zh-CN', zh), ('en', en), ('x-default', zh)]:
                ET.SubElement(row, '{' + alternate_ns + '}link', {'rel': 'alternate', 'hreflang': language, 'href': self.origin + path})
        ET.ElementTree(tree).write(self.target / 'sitemap.xml', encoding='utf-8', xml_declaration=True)
        (self.target / 'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /inquiry-received.html\n\nSitemap: ' + self.origin + '/sitemap.xml\n')
        (self.target / '404.html').write_text('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>页面未找到 | 芯聚电子</title></head><body><h1>页面未找到</h1><p><a href="/">返回首页</a> · <a href="/products/">查找产品</a></p></body></html>')
        return {'origin': self.origin, 'detail_pages': len(self.search) * 2, 'listing_pages': 8, 'sitemap_urls': len(self.pages) + 1}


def generate_pages(target, content):
    return StaticPages(target, content, load_content(ROOT / 'catalog-data.js')).generate()
