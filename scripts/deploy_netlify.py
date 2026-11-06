#!/usr/bin/env python3
"""Upload the reviewed build; credentials are supplied as repository secrets."""
import io
import json
import os
from pathlib import Path
import re
import urllib.request
import zipfile

root = Path(__file__).resolve().parents[1] / 'dist'
site = os.environ['NETLIFY_SITE_ID']
if not re.fullmatch(r'[a-zA-Z0-9-]+', site):
    raise SystemExit('Invalid Netlify site ID')
if not (root / 'index.html').is_file():
    raise SystemExit('Build dist before deployment')
buffer = io.BytesIO()
with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(root.rglob('*')):
        if file.is_file():
            archive.write(file, file.relative_to(root))
req = urllib.request.Request(
    f'https://api.netlify.com/api/v1/sites/{site}/deploys',
    data=buffer.getvalue(), method='POST',
    headers={'Authorization': 'Bearer ' + os.environ['NETLIFY_AUTH_TOKEN'], 'Content-Type': 'application/zip'},
)
with urllib.request.urlopen(req, timeout=180) as response:
    result = json.load(response)
print('Netlify accepted deploy:', result['id'])
print('Deploy URL:', result.get('deploy_ssl_url') or result.get('deploy_url'))
print('State:', result.get('state', 'unknown'))
