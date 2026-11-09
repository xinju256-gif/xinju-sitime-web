#!/usr/bin/env python3
"""Publish the reviewed build, wait for readiness and verify public pages."""
import hashlib
import io
import json
import os
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def summary(line):
    print(line, flush=True)
    path = os.environ.get('GITHUB_STEP_SUMMARY')
    if path:
        with open(path, 'a') as stream:
            stream.write(line + '\n')


def request_json(path, token, data=None, content_type='application/json'):
    req = urllib.request.Request('https://api.netlify.com/api/v1' + path, data=data,
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': content_type})
    with urllib.request.urlopen(req, timeout=180 if data is not None else 30) as response:
        return json.load(response)


def verify_public(base, origin):
    checks = [('/', '<title>SiTime中国官方代理商'),
              ('/products/sit8008/', '<h1>SiT8008</h1>'),
              ('/solutions/microwave-outdoor-units-odu-timing-solutions/', '工程选型说明'),
              ('/en/products/sit8008/', '<html lang="en">'),
              ('/sitemap.xml', origin + '/products/sit8008/'),
              ('/robots.txt', 'Sitemap: ' + origin + '/sitemap.xml')]
    if urllib.parse.urlsplit(base).scheme != 'https':
        raise ValueError('Verification URL must use HTTPS')
    results = []
    for path, marker in checks:
        with urllib.request.urlopen(base.rstrip('/') + path, timeout=30) as response:
            text = response.read().decode('utf-8')
            if response.status != 200 or marker not in text:
                raise ValueError('Unexpected page content at ' + path)
        if path.endswith('/') and 'rel="canonical" href="' + origin + path + '"' not in text:
            raise ValueError('Wrong canonical at ' + path)
        results.append(path)
    local_pdf = ROOT / 'dist/assets/datasheets/SiT8008.pdf'
    with urllib.request.urlopen(base.rstrip('/') + '/assets/datasheets/SiT8008.pdf', timeout=45) as response:
        raw = response.read()
    if not raw.startswith(b'%PDF-') or hashlib.sha256(raw).digest() != hashlib.sha256(local_pdf.read_bytes()).digest():
        raise ValueError('Published PDF checksum mismatch')
    return results + ['/assets/datasheets/SiT8008.pdf']


def main():
    root = ROOT / 'dist'
    site = os.environ['NETLIFY_SITE_ID'].strip()
    token = os.environ['NETLIFY_AUTH_TOKEN'].strip()
    if not re.fullmatch(r'[a-zA-Z0-9-]+', site):
        raise SystemExit('Invalid Netlify site ID')
    if not token or not (root / 'index.html').is_file():
        raise SystemExit('A Netlify token and built dist are required')
    info = request_json('/sites/' + site, token)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(root.rglob('*')):
            if file.is_file():
                archive.write(file, file.relative_to(root))
    summary('## Netlify deployment')
    summary('- Uploading the reviewed static website (' + str(round(buffer.tell()/1048576, 1)) + ' MB).')
    deploy = request_json('/sites/' + site + '/deploys', token, buffer.getvalue(), 'application/zip')
    deploy_id = deploy['id']
    summary('- Deploy ID: `' + deploy_id + '`')
    deadline = time.monotonic() + 300
    last_state = None
    while deploy.get('state') != 'ready':
        state = deploy.get('state', 'unknown')
        if state != last_state:
            print('Deployment state:', state, flush=True)
            last_state = state
        if state in ['error', 'failed', 'canceled']:
            raise RuntimeError('Netlify processing failed; inspect the Netlify deploy log')
        if time.monotonic() >= deadline:
            raise TimeoutError('Netlify did not become ready within five minutes')
        time.sleep(4)
        deploy = request_json('/deploys/' + deploy_id, token)
    info = request_json('/sites/' + site, token)
    if (info.get('published_deploy') or {}).get('id') != deploy_id:
        request_json('/sites/' + site + '/deploys/' + deploy_id + '/restore', token, b'')
        info = request_json('/sites/' + site, token)
        if (info.get('published_deploy') or {}).get('id') != deploy_id:
            raise RuntimeError('Deploy is ready but has not become the published production deploy')
    permalink = deploy.get('deploy_ssl_url')
    if not permalink:
        raise RuntimeError('Netlify did not return a secure deployment URL')
    summary('- Published deploy: [' + permalink + '](' + permalink + ')')
    origin = json.loads((ROOT / 'data/site-config.json').read_text())['site_url'].rstrip('/')
    verified = verify_public(permalink, origin)
    summary('- Public deployment verified: ' + str(len(verified)) + ' page/document checks passed.')
    for path in verified:
        summary('  - `' + path + '` — OK')
    production = info.get('ssl_url') or info.get('url')
    if production:
        summary('- Production URL: [' + production + '](' + production + ')')
    try:
        verify_public(origin, origin)
        summary('- Custom domain verified: [' + origin + '](' + origin + ')')
    except Exception as error:
        summary('- Custom domain verification pending: `' + type(error).__name__ + '`. Check domain binding, DNS and HTTPS in Netlify.')
        print('::warning::Deployment is published, but custom domain verification is pending. Check domain binding, DNS and HTTPS.')


if __name__ == '__main__':
    main()
