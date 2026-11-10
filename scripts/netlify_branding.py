"""Inspect only site branding fields; never print credentials or full API payloads."""
import os
import re
import urllib.request
from deploy_netlify import request_json, notice

site = request_json('/sites/' + os.environ['NETLIFY_SITE_ID'].strip(), os.environ['NETLIFY_AUTH_TOKEN'].strip())
def inspect(value, path='site'):
    if isinstance(value, dict):
        for key, child in value.items():
            current = path + '.' + key
            if re.search('badge|branding|powered|attribution', key, re.I):
                notice(current + ': ' + (str(child) if isinstance(child, (str, bool, int, type(None))) else 'object'))
            inspect(child, current)
    elif isinstance(value, list):
        for i, child in enumerate(value):
            inspect(child, path + '[' + str(i) + ']')
notice('Site configuration keys: ' + ', '.join(sorted(site)))
inspect(site)
with urllib.request.urlopen('https://sitime-cn.com/', timeout=30) as response:
    source = response.read().decode('utf-8')
for match in re.finditer(r'badge|powered by netlify|netlify-identity|netlify-toolbar', source, re.I):
    context = source[max(0, match.start()-100):match.end()+150]
    if 'data:image' not in context:
        notice('Published HTML branding fragment: ' + context)
notice('Branding inspection completed')
