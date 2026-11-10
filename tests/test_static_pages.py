import copy
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from news_sync import ROOT, load_content
from static_pages import StaticPages, route, site_config


class StaticPageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.out = Path(self.temp.name)
        self.env = patch.dict(os.environ, {'SITE_URL': 'https://timing.example.test'})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.content = load_content()
        self.catalog = load_content(ROOT / 'catalog-data.js')
        self.pages = StaticPages(self.out, self.content, self.catalog)

    def test_product_has_crawlable_specs_local_pdf_and_hreflang(self):
        product = next(p for p in self.catalog['products'] if p['datasheet']['type'] == 'pdf')
        self.pages.product_page(product, 'zh')
        source = (self.out / route('product', product['model']).strip('/') / 'index.html').read_text()
        self.assertIn('<h1>' + product['model'] + '</h1>', source)
        self.assertIn('<table class="detail-specs">', source)
        self.assertIn('/' + product['datasheet']['local'], source)
        self.assertIn('hreflang="en"', source)
        self.assertIn('https://timing.example.test/products/', source)
        schema = source.split('<script type="application/ld+json">', 1)[1].split('</script>', 1)[0]
        entity = json.loads(schema)['@graph'][-1]
        self.assertEqual(entity['@type'], 'Product')
        self.assertNotIn('offers', entity)
        self.assertNotIn('aggregateRating', entity)

    def test_missing_datasheet_routes_to_local_request(self):
        product = next(p for p in self.catalog['products'] if p['datasheet']['type'] != 'pdf')
        source = self.pages.document(product, 'zh')
        self.assertIn('type=datasheet', source)
        self.assertNotIn('download=', source)
        self.assertNotIn('sitime.com', source)

    def test_download_directory_contains_all_local_pdfs_and_request_routes(self):
        self.pages.download_page('zh')
        source = (self.out / 'downloads/index.html').read_text()
        ready = sum(p['datasheet']['type'] == 'pdf' for p in self.catalog['products'])
        self.assertEqual(source.count('class="download-row"'), len(self.catalog['products']))
        self.assertEqual(source.count(' download="'), ready)
        self.assertIn('type=datasheet', source)
        self.assertIn('/assets/datasheets/SiT8008.pdf', source)
        self.assertNotIn('href="https://www.sitime.com', source)

    def test_english_download_directory_has_its_own_canonical_and_chinese_alternate(self):
        self.pages.download_page('en')
        source = (self.out / 'en/downloads/index.html').read_text()
        self.assertIn('<html lang="en">', source)
        self.assertIn('rel="canonical" href="https://timing.example.test/en/downloads/"', source)
        self.assertIn('hreflang="zh-CN" href="https://timing.example.test/downloads/"', source)

    def test_repeated_news_headlines_have_date_specific_metadata(self):
        news = copy.deepcopy(self.content['news'][0])
        self.pages.editorial_page('news', news, 'zh')
        source = (self.out / route('news', news['id']).strip('/') / 'index.html').read_text()
        self.assertIn(news['date'], source.split('</title>')[0])
        self.assertIn('content="' + news['date'] + ' · ', source)
        self.assertIn('class="local-reading"', source)

    def test_generated_text_cannot_close_schema_script(self):
        news = copy.deepcopy(self.content['news'][0])
        news['title']['zh'] = '标题 </script><script>alert(1)</script>'
        self.pages.editorial_page('news', news, 'zh')
        source = (self.out / route('news', news['id']).strip('/') / 'index.html').read_text()
        self.assertNotIn('<script>alert(1)</script>', source)
        schema = source.split('<script type="application/ld+json">', 1)[1].split('</script>', 1)[0]
        self.assertEqual(json.loads(schema)['@graph'][-1]['headline'], news['title']['zh'])

    def test_domain_and_slug_validation(self):
        for invalid in ['http://example.com', 'https://example.com/path', 'https://user@example.com', 'https://example.com?x=1', 'https://bad host']:
            with self.subTest(url=invalid), patch.dict(os.environ, {'SITE_URL': invalid}):
                with self.assertRaises(ValueError):
                    site_config()
        with self.assertRaises(ValueError):
            route('product', '../private')
        self.assertEqual(route('product', 'SiT8008', 'en'), '/en/products/sit8008/')

    def test_missing_custom_domain_cannot_silently_use_netlify_url(self):
        (self.out / 'data').mkdir(exist_ok=True)
        (self.out / 'data/site-config.json').write_text(json.dumps({'site_url': None, 'require_custom_domain': True}))
        with patch('static_pages.ROOT', self.out), patch.dict(os.environ, {'SITE_URL': '', 'URL': 'https://temporary.netlify.app'}):
            with self.assertRaisesRegex(ValueError, 'awaiting confirmation'):
                site_config()


if __name__ == '__main__':
    unittest.main()
