import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import build_site
import news_sync
from news_sync import Article, canonical


class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'data/news-review').mkdir(parents=True)
        self.base = {'updated': '2026-01-01', 'news': [], 'solutions': [], 'industries': []}
        self.item = {
            'id': 'review123', 'type': 'release', 'status': 'approved',
            'source': 'https://www.sitime.com/company/newsroom/press-release/example',
            'date': '2026-01-01', 'title': {'zh': '新品发布', 'en': 'New product'},
            'summary': {'zh': '简短的原创导读。', 'en': 'An original short editorial introduction.'},
            'reviewedBy': 'Editor', 'models': [], 'imageSource': '',
        }
        self.addCleanup(patch.stopall)
        patch.object(build_site, 'ROOT', self.root).start()
        patch.object(build_site, 'load_content', side_effect=lambda path=None: {'products': []} if path else copy.deepcopy(self.base)).start()

    def write(self):
        (self.root / 'data/news-review/item.json').write_text(json.dumps(self.item))

    def test_pending_never_published_and_strict_fails(self):
        self.item['status'] = 'pending'
        self.item['title']['zh'] = ''
        self.write()
        self.assertEqual(build_site.reviewed_content()['news'], [])
        with self.assertRaisesRegex(ValueError, 'awaiting editorial review'):
            build_site.reviewed_content(strict=True)

    def test_approved_published_with_date_and_no_internal_fields(self):
        self.write()
        news = build_site.reviewed_content(strict=True)['news']
        self.assertEqual(len(news), 1)
        self.assertEqual(news[0]['year'], '2026')
        self.assertEqual(news[0]['type'], 'release')
        self.assertNotIn('reviewedBy', news[0])
        self.assertNotIn('status', news[0])

    def test_rejected_excluded(self):
        self.item['status'] = 'rejected'
        self.write()
        self.assertEqual(build_site.reviewed_content(strict=True)['news'], [])

    def test_missing_translation_or_reviewer_blocked(self):
        for field in ['zh', 'en']:
            with self.subTest(lang=field):
                saved = self.item['summary'][field]
                self.item['summary'][field] = ''
                self.write()
                with self.assertRaises(ValueError):
                    build_site.reviewed_content()
                self.item['summary'][field] = saved
        self.item['reviewedBy'] = ''
        self.write()
        with self.assertRaisesRegex(ValueError, 'reviewedBy'):
            build_site.reviewed_content()

    def test_foreign_source_blocked(self):
        self.item['source'] = 'https://www.sitimechina.com/news/example'
        self.write()
        with self.assertRaisesRegex(ValueError, 'manufacturer source'):
            build_site.reviewed_content()

    def test_duplicate_does_not_publish_twice(self):
        self.base['news'] = [{**self.item, 'date': '2026-01-01'}]
        self.write()
        self.assertEqual(len(build_site.reviewed_content()['news']), 1)

    def test_source_parser_uses_article_not_related_date_or_nav_image(self):
        p = Article()
        p.feed('<img src="/sites/default/files/nav.png"><time datetime="2025-01-01"></time>'
               '<h1>A &amp; B</h1><time datetime="2026-01-01T10:00:00Z"></time>'
               '<img src="/sites/default/files/article.png"><time datetime="2026-02-01"></time>')
        self.assertEqual(p.title, 'A & B')
        self.assertEqual(p.date, '2026-01-01')
        self.assertEqual(p.image, 'https://www.sitime.com/sites/default/files/article.png')

    def test_url_canonicalization_and_origin(self):
        self.assertEqual(canonical('/company/newsroom/blog/example?utm_source=test'),
                         'https://www.sitime.com/company/newsroom/blog/example')
        self.assertIsNone(canonical('https://www.sitime.com.evil.example/company/newsroom/blog/test'))
        self.assertIsNone(canonical('https://www.sitime.com/company/newsroom/events'))

    def test_collect_twice_does_not_queue_again(self):
        known = [{'source': f'https://www.sitime.com/company/newsroom/blog/known-{i}'} for i in range(100)]
        new = 'https://www.sitime.com/company/newsroom/blog/new'
        xml = '<urlset>' + ''.join('<url><loc>' + n['source'] + '</loc></url>' for n in known)
        xml += '<url><loc>' + new + '</loc><lastmod>2026-01-01</lastmod></url></urlset>'
        html = '<h1>New article</h1><time datetime="2026-01-01"></time>'
        def response(url):
            if url.endswith('en_sitemap.xml'):
                return xml
            return html
        with patch.object(news_sync, 'ROOT', self.root), patch.object(news_sync, 'load_content', return_value={'news': known}), patch.object(news_sync, 'fetch', side_effect=response), patch.object(news_sync.time, 'sleep'):
            news_sync.collect()
            news_sync.collect()
        files = list((self.root / 'data/news-review').glob('*.json'))
        self.assertEqual(len(files), 1)
        self.assertEqual(json.loads(files[0].read_text())['status'], 'pending')
        self.assertEqual(json.loads(files[0].read_text())['source'], new)


if __name__ == '__main__':
    unittest.main()
