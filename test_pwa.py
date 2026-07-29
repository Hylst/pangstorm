import http.server
import socketserver
import threading
import time
import json
import urllib.request
import os
import sys

dist = sys.argv[1]
os.chdir(dist)

port = 3457
httpd = socketserver.TCPServer(('', port), http.server.SimpleHTTPRequestHandler)
t = threading.Thread(target=httpd.serve_forever, daemon=True)
t.start()
time.sleep(2)

files = ['/', '/index.html', '/manifest.json', '/sw.js', '/icon-192.png', '/icon-512.png']
for f in files:
    try:
        r = urllib.request.urlopen(f'http://localhost:{port}{f}')
        ct = r.headers.get('Content-Type', '')
        body = r.read()
        print(f'GET {f} -> {r.status} ({ct}) ({len(body)} bytes)')
        r.close()
    except Exception as e:
        print(f'GET {f} -> FAIL: {e}')

# Validate manifest
r = urllib.request.urlopen(f'http://localhost:{port}/manifest.json')
manifest = json.loads(r.read())
print(f'\nManifest:')
print(f'  display: {manifest.get("display")}')
print(f'  start_url: {manifest.get("start_url")}')
print(f'  scope: {manifest.get("scope")}')
print(f'  icons: {len(manifest.get("icons", []))}')
print(f'  orientation: {manifest.get("orientation")}')

# Verify SW install won't fail on assets
r = urllib.request.urlopen(f'http://localhost:{port}/sw.js')
sw_code = r.read().decode()
print(f'\nSW code: {len(sw_code)} bytes')

httpd.shutdown()
