#!/usr/bin/env python3
"""Inventory former manufacturer links and verify local website assets."""
import csv
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote
from news_sync import ROOT, load_content

data = load_content()
catalog = load_content(ROOT / 'catalog-data.js')
rows = []
for kind, key in [('industry', 'industries'), ('solution', 'solutions'), ('news', 'news')]:
    for item in data[key]:
        rows.append({'type': kind, 'name': item['title']['zh'], 'original': item['source'],
                     'local': '#read/' + kind + '/' + quote(item['id']), 'status': 'on-site original editorial content'})
for p in catalog['products']:
    route = '#read/product/' + quote(p['model'])
    for key in ['source', 'manufacturer']:
        if p.get(key):
            rows.append({'type': 'product-' + key, 'name': p['model'], 'original': p[key], 'local': route, 'status': 'on-site specifications'})
    doc = p['datasheet']
    rows.append({'type': 'datasheet', 'name': p['model'], 'original': doc.get('url', ''),
                 'local': doc['local'] if doc['type'] == 'pdf' else '#contact',
                 'status': 'local PDF' if doc['type'] == 'pdf' else 'pending manufacturer PDF; local inquiry'})
    if doc['type'] == 'pdf':
        assert (ROOT / doc['local']).is_file(), p['model']
assets = json.loads((ROOT / 'data/local-assets.json').read_text())
for source, entry in assets.items():
    rows.append({'type': 'image', 'name': Path(entry['local']).name, 'original': source, 'local': entry['local'], 'status': entry['status']})
for item in data['industries'] + data['solutions'] + data['news'] + catalog['products']:
    if item.get('image'):
        assert not item['image'].startswith(('http:', 'https:', '//')), item['image']
        assert (ROOT / item['image']).is_file(), item['image']


class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.anchors = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        for key in ['href', 'src', 'action']:
            value = attrs.get(key, '')
            assert not value.startswith(('http:', 'https:', '//')), f'Outbound HTML {tag} {key}: {value}'
            if value.startswith('#'):
                self.anchors.append(value[1:])
            elif value and not value.startswith(('data:', 'mailto:', 'tel:')):
                raw_path = value.split('#')[0].split('?')[0]
                if raw_path.startswith('/'):
                    local = ROOT / 'dist' / raw_path.lstrip('/')
                    if raw_path.endswith('/'):
                        local /= 'index.html'
                else:
                    local = ROOT / raw_path
                assert local.is_file(), value


audit = Audit()
audit.feed((ROOT / 'index.html').read_text())
for anchor in audit.anchors:
    assert not anchor or anchor in audit.ids, anchor
output = ROOT / 'data/link-migration-audit.csv'
with output.open('w', newline='') as stream:
    writer = csv.DictWriter(stream, fieldnames=['type', 'name', 'original', 'local', 'status'])
    writer.writeheader()
    writer.writerows(rows)
summary = {'local_content_entries': len(data['industries']) + len(data['solutions']) + len(data['news']),
           'local_product_entries': len(catalog['products']), 'local_pdf_count': sum(p['datasheet']['type'] == 'pdf' for p in catalog['products']),
           'pending_pdf_count': sum(p['datasheet']['type'] != 'pdf' for p in catalog['products']),
           'localized_image_sources': len(assets), 'migration_rows': len(rows), 'outbound_html_links': 0}
(ROOT / 'data/link-migration-summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary, indent=2))
