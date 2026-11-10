"""Disable the site-level Netlify badge and verify the setting without logging secrets."""
import json
import os
import re
from deploy_netlify import request_json, notice

site_id = os.environ['NETLIFY_SITE_ID'].strip()
token = os.environ['NETLIFY_AUTH_TOKEN'].strip()
if not re.fullmatch(r'[a-zA-Z0-9-]+', site_id):
    raise ValueError('Invalid Netlify site ID')
path = '/sites/' + site_id
site = request_json(path, token)
if site.get('built_with_badge_enabled') is not False:
    request_json(path, token, json.dumps({'built_with_badge_enabled': False}).encode(), method='PATCH')
verified = request_json(path, token)
if verified.get('built_with_badge_enabled') is not False:
    raise RuntimeError('Netlify badge setting did not change to disabled')
notice('Netlify site badge disabled and verified: built_with_badge_enabled=false. URL: https://sitime-cn.com')
