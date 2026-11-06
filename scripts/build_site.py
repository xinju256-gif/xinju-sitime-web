#!/usr/bin/env python3
"""Build static website, publishing only explicitly approved news."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import shutil
import hashlib
import urllib.request
import urllib.parse
from news_sync import ROOT, canonical, load_content
from static_pages import generate_pages


def reviewed_content(strict=False):
    data = load_content()
    sources = {canonical(n['source']) for n in data['news']}
    ids = {n['id'] for n in data['news']}
    approved = []
    for file in sorted((ROOT / 'data/news-review').glob('*.json')):
        n = json.loads(file.read_text())
        status = n.get('status')
        if status not in ('pending', 'approved', 'rejected'):
            raise ValueError(f'{file.name}: unknown review status')
        if status == 'pending' and strict:
            raise ValueError(f'{file.name}: awaiting editorial review')
        if status != 'approved':
            continue
        url = canonical(n.get('source', ''))
        if not url or url != n['source']:
            raise ValueError(f'{file.name}: invalid manufacturer source')
        if url in sources:
            continue
        if n.get('id') in ids or not n.get('id'):
            raise ValueError(f'{file.name}: duplicate or missing ID')
        for key in ('title', 'summary'):
            for lang in ('zh', 'en'):
                text = n.get(key, {}).get(lang, '').strip()
                if not text or len(text) > (220 if key == 'title' else 1000):
                    raise ValueError(f'{file.name}: complete a concise {key}.{lang}')
        if not n.get('reviewedBy', '').strip():
            raise ValueError(f'{file.name}: reviewedBy is required')
        if n.get('type') not in ('blog', 'release'):
            raise ValueError(f'{file.name}: invalid news type')
        date = dt.date.fromisoformat(n['date'])
        if date > dt.datetime.now(dt.timezone.utc).date():
            raise ValueError(f'{file.name}: future date')
        image = n.get('imageSource', '')
        if image and not image.startswith('https://www.sitime.com/sites/default/files/'):
            raise ValueError(f'{file.name}: unexpected image source')
        products = {p['model'] for p in load_content(ROOT / 'catalog-data.js')['products']}
        if not set(n.get('models', [])).issubset(products):
            raise ValueError(f'{file.name}: unknown related product')
        approved.append({**{k: n[k] for k in ('id', 'type', 'source', 'date', 'title', 'summary')},
                         'year': str(date.year), 'models': n.get('models', []), 'imageSource': image, 'image': image})
        sources.add(url)
        ids.add(n['id'])
    data['news'] += approved
    data['news'].sort(key=lambda n: (n['date'], n['id']), reverse=True)
    if approved:
        data['updated'] = str(dt.datetime.now(dt.timezone.utc).date())
    return data


def build(strict=False):
    data = reviewed_content(strict)
    target = ROOT / 'dist'
    if target.exists():
        shutil.rmtree(target)
    target.mkdir()
    for name in ['index.html', 'styles.css', 'i18n.js', 'catalog-data.js', 'app.js', 'catalog.js', 'content.js', 'inquiry.js', 'downloads.js', 'inquiry-received.html', 'site-assets.js', 'reading-data.js', 'reading-guide.js', 'local-routes.js', 'detail-pages.js', 'page-links.js']:
        shutil.copy2(ROOT / name, target / name)
    forms_enabled = os.environ.get('NETLIFY') == 'true' or os.environ.get('SIMACITY_ENABLE_NETLIFY_FORMS') == '1'
    (target / 'inquiry-config.js').write_text('window.SIMACITY_INQUIRY = ' + json.dumps({'enabled': forms_enabled}) + ';\n')
    if (ROOT / 'assets').exists():
        shutil.copytree(ROOT / 'assets', target / 'assets')
    # Newly approved news must not introduce a manufacturer image dependency.
    for item in data['news']:
        url = item.get('image') or ''
        if not url.startswith('https://'):
            continue
        local = 'assets/site-images/news-' + hashlib.sha256(url.encode()).hexdigest()[:20]
        try:
            if urllib.parse.urlsplit(url).hostname != 'www.sitime.com':
                raise ValueError('Unexpected image host')
            with urllib.request.urlopen(url, timeout=30) as response:
                if urllib.parse.urlsplit(response.url).hostname != 'www.sitime.com':
                    raise ValueError('Unexpected image redirect')
                raw = response.read()
                content_type = response.headers.get_content_type()
            suffix = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif'}.get(content_type)
            if not suffix or not raw:
                raise ValueError('Invalid image response')
            local += suffix
            (target / local).parent.mkdir(parents=True, exist_ok=True)
            (target / local).write_bytes(raw)
            item['image'] = local
        except Exception:
            item['image'] = 'assets/site-images/image-pending.svg'
            print('Image unavailable; using local placeholder for:', item['id'])
    (target / 'content-data.js').write_text('window.SITIME_CONTENT = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    page_summary = generate_pages(target, data)
    print(f'Built dist: {len(data["news"])} published news items; pending/rejected items excluded')
    print('Netlify Forms: ' + ('enabled for production deployment' if forms_enabled else 'disabled; preview uses email'))
    print('Static pages:', json.dumps(page_summary, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--strict', action='store_true', help='Fail checks while any review item remains pending')
    parser.add_argument('--check', action='store_true', help='Validate without creating dist')
    args = parser.parse_args()
    if args.check:
        reviewed_content(args.strict)
    else:
        build(args.strict)
