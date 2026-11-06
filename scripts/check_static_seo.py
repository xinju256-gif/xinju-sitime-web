from pathlib import Path
from html.parser import HTMLParser
import collections,json,urllib.parse,xml.etree.ElementTree as E
import argparse
parser=argparse.ArgumentParser(description='Check generated SEO metadata, sitemap and local paths')
parser.add_argument('--directory',default=str(Path(__file__).resolve().parents[1]/'dist'))
args=parser.parse_args()
root=Path(args.directory);tree=E.parse(root/'sitemap.xml');urls=[e.text for e in tree.findall('.//{*}loc')];assert len(urls)==len(set(urls)) and len(urls)>1
class P(HTMLParser):
 def __init__(self):super().__init__();self.title=[];self.descriptions=[];self.canonical=[];self.h1=0;self.links=[];self.alt=[];self.json=[];self.capture=None
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='title':self.capture='title'
  if t=='h1':self.h1+=1
  if t=='meta' and d.get('name')=='description':self.descriptions.append(d.get('content'))
  if t=='link' and d.get('rel')=='canonical':self.canonical.append(d.get('href'))
  if t=='link' and d.get('rel')=='alternate':self.alt.append(d)
  if t in ['a','img','script','link']:
   v=d.get('href') or d.get('src')
   if v:self.links.append((t,v,d))
  if t=='script' and d.get('type')=='application/ld+json':self.capture='json'
 def handle_data(self,s):
  if self.capture=='title':self.title.append(s)
  elif self.capture=='json':self.json.append(json.loads(s))
 def handle_endtag(self,t):
  if t in ['script','title']:self.capture=None
parsers={};broken=[]
for url in urls:
 path=urllib.parse.urlsplit(url).path;f=root/path.lstrip('/')/'index.html';assert f.exists(),path;p=P();p.feed(f.read_text());assert len(p.descriptions)==len(p.canonical)==p.h1==1,(path,p.h1);assert len(p.title)==1,path;assert p.canonical==[url],path;assert len(p.json)==1,path
 for t,v,d in p.links:
  if v.startswith(('mailto:','tel:','data:','#')):continue
  parts=urllib.parse.urlsplit(v)
  if parts.netloc:
   assert d.get('rel') in ['alternate','canonical'],(path,v)
   assert parts.netloc==urllib.parse.urlsplit(url).netloc
  else:
   dest=root/parts.path.lstrip('/')
   if parts.path.endswith('/') or not parts.path:dest/='index.html'
   if not dest.exists():broken.append((path,v))
 if path!='/':
  assert len(p.alt)==3,path
  entity=p.json[0]['@graph'][-1];assert entity['@type'] in ['Product','TechArticle','NewsArticle','BlogPosting','CollectionPage']
 parsers[path]=p
assert not broken,broken[:10]
for path,p in parsers.items():
 for a in p.alt:
  target=urllib.parse.urlsplit(a['href']).path;assert target in parsers,(path,target)
  if a.get('hreflang')!='x-default':assert any(urllib.parse.urlsplit(b['href']).path==path for b in parsers[target].alt)
for label,get in [('titles',lambda p:p.title[0]),('descriptions',lambda p:p.descriptions[0])]:
 c=collections.Counter(get(p) for p in parsers.values());duplicates=[(t,n) for t,n in c.items() if n>1];assert not duplicates,(label,duplicates[:6]);print(label,'duplicates',len(duplicates))
print(f'PASS: {len(urls)} sitemap URLs; HTML, unique titles/descriptions, H1, self canonical, JSON-LD, reciprocal hreflang and local paths valid')
