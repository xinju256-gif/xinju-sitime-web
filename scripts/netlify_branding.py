"""Disable the site-level Netlify badge and verify the setting without logging secrets."""
import json
import os
import re
import urllib.error
from deploy_netlify import request_json, notice

site_id = os.environ['NETLIFY_SITE_ID'].strip()
token = os.environ['NETLIFY_AUTH_TOKEN'].strip()
if not re.fullmatch(r'[a-zA-Z0-9-]+', site_id):
    raise ValueError('Invalid Netlify site ID')
path = '/sites/' + site_id
site = request_json(path, token)
if site.get('built_with_badge_enabled') is not False:
    try:
        request_json(path, token, json.dumps({'built_with_badge_enabled': False}).encode(), method='PATCH')
    except urllib.error.HTTPError as error:
        payload = json.loads(error.read().decode('utf-8'))
        message = str(payload.get('message') or payload.get('error') or 'Request rejected')
        notice('Netlify badge update rejected: HTTP ' + str(error.code) + ' ' + message, error=True)
        raise SystemExit(1)
verified = request_json(path, token)
if verified.get('built_with_badge_enabled') is not False:
    raise RuntimeError('Netlify badge setting did not change to disabled')
notice('Netlify site badge disabled and verified: built_with_badge_enabled=false. URL: https://sitime-cn.com')
