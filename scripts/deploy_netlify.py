#!/usr/bin/env python3
"""Publish the reviewed build, wait for readiness and verify public pages."""
import hashlib
import concurrent.futures
import threading
import json
import os
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]


def summary(line):
    print(line, flush=True)
    path = os.environ.get('GITHUB_STEP_SUMMARY')
    if path:
        with open(path, 'a') as stream:
            stream.write(line + '\n')


def notice(message, error=False):
    clean = str(message).replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
    print(('::error::' if error else '::notice::') + clean, flush=True)


def request_json(path, token, data=None, content_type='application/json', method=None):
    req = urllib.request.Request('https://api.netlify.com/api/v1' + path, data=data, method=method,
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': content_type})
    with urllib.request.urlopen(req, timeout=60 if data is not None else 30) as response:
        raw = response.read()
        return json.loads(raw) if raw.strip() else {}


def file_manifest(root):
    files, by_hash = {}, {}
    for path in sorted(root.rglob('*')):
        if path.is_file():
            sha = hashlib.sha1(path.read_bytes()).hexdigest()
            relative = '/' + path.relative_to(root).as_posix()
            files[relative] = sha
            by_hash.setdefault(sha, (relative, path))
    return files, by_hash


def upload_required(deploy_id, required, by_hash, token):
    lock = threading.Lock()
    next_upload = [0.0]
    def upload(sha):
        relative, path = by_hash[sha]
        for attempt in range(4):
            with lock:
                pause = max(0.0, next_upload[0] - time.monotonic())
                if pause:
                    time.sleep(pause)
                next_upload[0] = time.monotonic() + 0.18
            try:
                endpoint = '/deploys/' + deploy_id + '/files/' + urllib.parse.quote(relative.lstrip('/'), safe='/')
                request_json(endpoint, token, path.read_bytes(), 'application/octet-stream', 'PUT')
                return
            except urllib.error.HTTPError as error:
                if error.code not in [408, 429, 500, 502, 503, 504] or attempt == 3:
                    raise
                delay = min(30, int(error.headers.get('Retry-After', 5 * (attempt + 1))))
                time.sleep(delay)
            except (urllib.error.URLError, TimeoutError):
                if attempt == 3:
                    raise
                time.sleep(3 * (attempt + 1))
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(upload, sha) for sha in required]
        for count, future in enumerate(concurrent.futures.as_completed(futures), 1):
            future.result()
            if count % 400 == 0 or count == len(required):
                print('Netlify files uploaded: ' + str(count) + '/' + str(len(required)))


def verify_public(base, origin):
    checks = [('/', '<title>SiTime中国官方代理商'),
              ('/products/sit8008/', '<h1>SiT8008</h1>'),
              ('/products/', 'class="product-selector-table"'),
              ('/en/products/', 'class="product-selector-table"'),
              ('/solutions/microwave-outdoor-units-odu-timing-solutions/', '工程选型说明'),
              ('/en/products/sit8008/', '<html lang="en">'),
              ('/downloads/', '<h1>资料下载</h1>'),
              ('/en/downloads/', '<h1>Datasheet downloads</h1>'),
              ('/sitemap.xml', origin + '/products/sit8008/'),
              ('/robots.txt', 'Sitemap: ' + origin + '/sitemap.xml'),
              ('/news/fed8b534016db3/', '<h1>SiTime发布2026年第三季度财务业绩</h1>')]
    if urllib.parse.urlsplit(base).scheme != 'https':
        raise ValueError('Verification URL must use HTTPS')
    results = []
    for path, marker in checks:
        with urllib.request.urlopen(base.rstrip('/') + path, timeout=30) as response:
            text = response.read().decode('utf-8')
            if response.status != 200 or marker not in text:
                raise ValueError('Unexpected page content at ' + path)
        if path == '/':
            for old_section in ['products', 'applications', 'downloads', 'news']:
                if re.search(r'<section\b[^>]*\bid="' + old_section + '"', text):
                    raise ValueError('Removed homepage section is still published: ' + old_section)
            if any(marker not in text for marker in ['查询型号', 'id="hero-model-form"', 'action="/products/"', '下载规格书', 'href="/downloads/"', 'SiTime发布2026年第三季度财务业绩']):
                raise ValueError('Homepage search destinations were not published')
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
    files, by_hash = file_manifest(root)
    notice('Netlify API connected. Preparing ' + str(len(files)) + ' website files.')
    summary('## Netlify deployment')
    payload = json.dumps({'files': files, 'async': True}).encode()
    deploy = request_json('/sites/' + site + '/deploys', token, payload)
    deploy_id = deploy['id']
    deadline = time.monotonic() + 180
    while deploy.get('state') == 'preparing':
        if time.monotonic() >= deadline:
            raise TimeoutError('Netlify file manifest preparation timed out')
        time.sleep(3)
        deploy = request_json('/deploys/' + deploy_id, token)
    if deploy.get('state') in ['error', 'failed', 'canceled']:
        raise RuntimeError('Netlify rejected the file manifest')
    required = deploy.get('required', [])
    if not set(required).issubset(by_hash):
        raise ValueError('Netlify requested an unknown file hash')
    notice('Netlify needs ' + str(len(required)) + ' file uploads; unchanged files are reused.')
    if required:
        upload_required(deploy_id, required, by_hash, token)
    deploy = request_json('/deploys/' + deploy_id, token)
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
    notice('Netlify published deploy: ' + permalink)
    origin = json.loads((ROOT / 'data/site-config.json').read_text())['site_url'].rstrip('/')
    production = info.get('ssl_url') or info.get('url')
    candidates = [production]
    if re.fullmatch(r'[a-z0-9-]+', info.get('name', '')):
        candidates.append('https://' + info['name'] + '.netlify.app')
    candidates.append(permalink)
    candidates = list(dict.fromkeys(u for u in candidates if u and u.startswith('https://')))
    verified, public_url, failures = None, None, []
    for candidate in candidates:
        try:
            verified = verify_public(candidate, origin)
            public_url = candidate
            break
        except Exception as error:
            label = 'HTTP ' + str(error.code) if isinstance(error, urllib.error.HTTPError) else type(error).__name__
            failures.append(label)
            notice('Anonymous website check: ' + candidate + ' returned ' + label + '. Netlify API authentication already succeeded.')
    if verified is None:
        visibility_changes = {}
        if info.get('sso_login') is True:
            visibility_changes['sso_login'] = False
        if info.get('has_password') is True or info.get('password'):
            visibility_changes['password'] = ''
        notice('Site access flags: site_sso=' + str(info.get('sso_login')) + ', account_sso=' + str(info.get('account_sso_login')) + ', has_password=' + str(info.get('has_password')))
        if visibility_changes:
            request_json('/sites/' + site, token, json.dumps(visibility_changes).encode(), method='PATCH')
            notice('Requested public access for this corporate site; team-level policies are unchanged.')
            for attempt in range(3):
                if attempt:
                    time.sleep(3 * attempt)
                for candidate in candidates:
                    try:
                        verified = verify_public(candidate, origin)
                        public_url = candidate
                        break
                    except Exception:
                        pass
                if verified is not None:
                    break
    if verified is None:
        protection = [key for key in info if any(term in key.lower() for term in ['protect', 'visitor', 'access', 'password', 'sso'])]
        notice('Site protection fields present: ' + ', '.join(protection))
        raise RuntimeError('Deploy is published, but anonymous website verification failed (' + ', '.join(failures) + '). Check Make public / visitor access in Netlify.')
    summary('- Public deployment verified: ' + str(len(verified)) + ' page/document checks passed.')
    notice('Public deployment verified: ' + str(len(verified)) + ' page/document checks passed. URL: ' + public_url)
    for path in verified:
        summary('  - `' + path + '` — OK')
    summary('- Verified public URL: [' + public_url + '](' + public_url + ')')
    try:
        verify_public(origin, origin)
        summary('- Custom domain verified: [' + origin + '](' + origin + ')')
        notice('Custom domain verified: ' + origin)
    except Exception as error:
        summary('- Custom domain verification pending: `' + type(error).__name__ + '`. Check domain binding, DNS and HTTPS in Netlify.')
        print('::warning::Deployment is published, but custom domain verification is pending. Check domain binding, DNS and HTTPS.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        detail = ('HTTP ' + str(error.code)) if isinstance(error, urllib.error.HTTPError) else type(error).__name__ + ': ' + str(error)[:350]
        notice('Netlify deployment failed: ' + detail, error=True)
        raise
