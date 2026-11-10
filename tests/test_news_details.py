"""Check provenance and boundaries between approved news and editorial context."""
import json
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from news_sync import ROOT, load_content

class NewsDetailTests(unittest.TestCase):
    def test_details_cover_only_published_sources_with_bounded_excerpts(self):
        published = {n['id']: n for n in load_content()['news']}
        details = load_content(ROOT / 'news-details-data.js')
        self.assertEqual(set(details['articles']), set(published))
        for item_id, detail in details['articles'].items():
            with self.subTest(article=item_id):
                self.assertEqual(detail['source'], published[item_id]['source'])
                self.assertLessEqual(len(detail['excerpt'].split()), 39)
                self.assertRegex(detail['source_sha256'], r'^[a-f0-9]{64}$')
                profile = details['profiles'][detail['profile']]
                for lang in ['zh', 'en']:
                    self.assertGreaterEqual(len(profile['paragraphs'][lang]), 2)
                    self.assertGreaterEqual(len(profile['checks'][lang]), 3)
                self.assertNotIn('<script', detail['excerpt'].lower())

    def test_highlights_keep_reported_and_adjusted_financial_data_distinct(self):
        details = load_content(ROOT / 'news-details-data.js')
        article = details['articles']['fed8b534016db3']['highlight']
        body = ' '.join(article['paragraphs']['zh'])
        self.assertIn('51.6%', body)
        self.assertIn('70.7%', body)
        self.assertIn('不能直接混用', body)

if __name__ == '__main__':
    unittest.main()
