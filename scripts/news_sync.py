#!/usr/bin/env python3
"""Collect first-party news metadata into review files; never publish drafts."""
import argparse
import datetime as dt
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.sitime.com'
NEWS_PATH = re.compile(r'^/company/newsroom/(blog|press-release)/[^/]+/?$')


def canonical(url):
    p = urllib.parse.urlsplit(urllib.parse.urljoin(BASE, url))
    if p.scheme != 'https' or p.netloc != 'www.sitime.com' or not NEWS_PATH.fullmatch(p.path):
        return None
    return BASE + p.path.rstrip('/')


def fetch(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'SIMACITY-News-Review/1.0 (+https://github.com/xinju256-gif/xinju-sitime-web)'})
            with urllib.request.urlopen(req, timeout=45) as res:
                if urllib.parse.urlsplit(res.url).hostname != 'www.sitime.com':
                    raise ValueError('Unexpected source redirect')
                return res.read().decode('utf-8')
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


class Article(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.date = ''
        self.image = ''
        self.in_h1 = False
        self.after_h1 = False
        self.links = set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'a' and (url := canonical(a.get('href', ''))):
            self.links.add(url)
        if tag == 'h1' and not self.title:
            self.in_h1 = True
            self.after_h1 = True
        if tag == 'time' and self.after_h1 and not self.date:
            self.date = a.get('datetime', '')[:10]
        if tag == 'img' and self.after_h1 and not self.image:
            url = urllib.parse.urljoin(BASE, a.get('src', ''))
            if url.startswith(BASE + '/sites/default/files/'):
                self.image = url

    def handle_endtag(self, tag):
        if tag == 'h1':
            self.in_h1 = False

    def handle_data(self, value):
        if self.in_h1:
            self.title += value


def load_content(path=None):
    text = (path or ROOT / 'content-data.js').read_text()
    return json.JSONDecoder().raw_decode(text.split('=', 1)[1].lstrip())[0]


def collect(limit=30):
    known = {canonical(n['source']) for n in load_content()['news']}
    review_dir = ROOT / 'data/news-review'
    review_dir.mkdir(parents=True, exist_ok=True)
    for file in review_dir.glob('*.json'):
        known.add(canonical(json.loads(file.read_text())['source']))
    # This previously published duplicate must not re-enter the review queue.
    known.add(BASE + '/company/newsroom/press-release/sitimes-endura-timing-solutions-aerospace-and-defense-standout-0')
    xml = ET.fromstring(fetch(BASE + '/en_sitemap.xml'))
    entries = {}
    for row in xml:
        loc = row.find('{*}loc')
        modified = row.find('{*}lastmod')
        if loc is not None and (url := canonical(loc.text or '')):
            entries[url] = modified.text if modified is not None else ''
    landing = Article()
    landing.feed(fetch(BASE + '/company/newsroom'))
    for url in landing.links:
        entries.setdefault(url, '9999')
    if len(entries) < 100:
        raise ValueError('Unexpected newsroom coverage: collection stopped without deleting existing news')
    candidates = sorted((u for u in entries if u not in known), key=lambda u: (entries[u], u), reverse=True)
    failures = []
    added = 0
    for url in candidates[:limit]:
        try:
            article = Article()
            article.feed(fetch(url))
            title = ' '.join(article.title.split())
            date = dt.date.fromisoformat(article.date)
            if not title or date > dt.datetime.now(dt.timezone.utc).date():
                raise ValueError('Missing title or future publication date')
            item = {
                'id': hashlib.sha256(url.encode()).hexdigest()[:14],
                'status': 'pending', 'type': 'blog' if '/blog/' in url else 'release',
                'source': url, 'date': str(date),
                'title': {'zh': '', 'en': title},
                'summary': {'zh': '', 'en': ''},
                'imageSource': article.image, 'models': [],
                'collectedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
                'reviewedBy': '',
            }
            (review_dir / (item['id'] + '.json')).write_text(json.dumps(item, ensure_ascii=False, indent=2) + '\n')
            added += 1
        except Exception as exc:
            failures.append({'source': url, 'error': str(exc)})
        time.sleep(.3)
    report = {'discovered': len(entries), 'unseen': len(candidates), 'queued': added, 'remaining': max(0, len(candidates) - limit), 'failures': failures}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if failures:
        raise SystemExit('Some articles failed; review workflow logs. No existing content was removed.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--limit', type=int, default=30)
    args = parser.parse_args()
    if not 1 <= args.limit <= 100:
        parser.error('limit must be between 1 and 100')
    collect(args.limit)
