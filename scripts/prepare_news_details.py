"""Assemble reviewed commentary and short excerpts for already published news.

This is an explicit editorial preparation step, not part of automatic collection.
Full source articles remain outside the repository and are never published.
"""
import argparse
import json
from pathlib import Path
import re
from news_sync import ROOT, load_content, canonical


def prepare(research_path, cache_dir):
    profiles = json.loads((ROOT / 'data/news-detail-profiles.json').read_text())
    highlights = json.loads((ROOT / 'data/news-detail-highlights.json').read_text())
    research = {entry['id']: entry for entry in json.loads(research_path.read_text())}
    articles = {}
    for item in load_content()['news']:
        record = research[item['id']]
        if record['status'] != 'verified' or canonical(record['source']) != canonical(item['source']):
            raise ValueError('Source requires review: ' + item['id'])
        paragraphs = (cache_dir / (item['id'] + '.txt')).read_text().splitlines()
        candidates = [p for p in paragraphs if len(p.split()) >= 18 and not re.match(r'(About SiTime|SiTime is the Precision Timing|Forward-Looking)', p, re.I)]
        if re.search(r'Reports.*Financial Results|Raises Revenue Guidance', item['title']['en'], re.I):
            candidates = [p for p in candidates if re.search(r'(?:net )?revenue.*\$', p, re.I)] or candidates
        if not candidates:
            raise ValueError('No suitable excerpt: ' + item['id'])
        excerpt = ' '.join(candidates[0].split()[:38])
        if len(candidates[0].split()) > 38:
            excerpt += ' …'
        profile = next(p['key'] for p in profiles if re.search(p['pattern'], item['title']['en'], re.I))
        articles[item['id']] = {'profile': profile, 'source': item['source'], 'checked': record['checked'],
            'source_sha256': record['source_sha256'], 'excerpt': excerpt,
            'models': record['models'], 'platforms': record['platforms']}
        if item['id'] in highlights:
            articles[item['id']]['highlight'] = highlights[item['id']]
    output = {'profiles': {p['key']: {k: v for k, v in p.items() if k not in ['key', 'pattern']} for p in profiles}, 'articles': articles}
    (ROOT / 'news-details-data.js').write_text('window.NEWS_DETAILS = ' + json.dumps(output, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('Prepared detailed guides:', len(articles), 'Individually written highlights:', len(highlights))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('research', type=Path)
    parser.add_argument('cache_dir', type=Path)
    args = parser.parse_args()
    prepare(args.research, args.cache_dir)
