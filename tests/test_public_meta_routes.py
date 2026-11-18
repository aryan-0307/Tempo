# Test Suite: Public Routes, Meta Files, and Animated 404 Page
# Verifies all public routes, status codes, content types, and security boundaries.

import os
import sys
import time
import json
import urllib.request
import urllib.error
import subprocess
import xml.etree.ElementTree as ET

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
os.chdir(project_root)

print("================================================================================")
print("🌐 TEMPO PUBLIC ROUTES, METADATA & 404 PAGE VERIFICATION")
print("================================================================================\n")

# Locate Node.js binary
node_candidates = [
    r'C:\Users\aryan\AppData\Local\Author Software\nvm\installs\v26.12.1\node.exe',
    r'C:\Users\aryan\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe',
    r'C:\Program Files\nodejs\node.exe',
    'node'
]

node_bin = None
for candidate in node_candidates:
    if os.path.exists(candidate):
        node_bin = candidate
        break

if not node_bin:
    node_bin = 'node'

print(f"  [OK] Using Node.js binary: {node_bin}")

TEST_PORT = 3982
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"

env = os.environ.copy()
env['PORT'] = str(TEST_PORT)
env['JWT_SECRET'] = 'test_secret_public_routes_suite_2026'

server_proc = subprocess.Popen(
    [node_bin, 'server/server.js'],
    cwd=project_root,
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

def cleanup():
    if server_proc and server_proc.poll() is None:
        server_proc.terminate()
        try:
            server_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server_proc.kill()
        print("  [OK] Test server stopped cleanly.")

try:
    # 1. Wait for server boot
    booted = False
    for _ in range(30):
        time.sleep(0.2)
        try:
            req = urllib.request.Request(f"{BASE_URL}/api/health")
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status == 200:
                    booted = True
                    break
        except Exception:
            pass

    assert booted, "Server failed to respond on /api/health within 6 seconds"
    print("--- 1. Testing Server Boot & Health Check ---")
    print(f"  [PASS] Server online on {BASE_URL}")

    # Helper function for HTTP requests
    def fetch(path):
        url = f"{BASE_URL}{path}"
        req = urllib.request.Request(url)
        try:
            with urllib.request.urlopen(req) as resp:
                return resp.status, resp.headers.get('Content-Type', ''), resp.read()
        except urllib.error.HTTPError as e:
            return e.code, e.headers.get('Content-Type', ''), e.read()

    # 2. Test /privacy
    print("\n--- 2. Testing Privacy Policy (/privacy) ---")
    status, ct, body = fetch('/privacy')
    assert status == 200, f"/privacy returned {status}"
    assert 'text/html' in ct, f"Wrong Content-Type: {ct}"
    html_text = body.decode('utf-8')
    assert '<title>Privacy Policy' in html_text, "Title missing in /privacy"
    assert 'DOCUMENT // PRIVACY' in html_text, "Privacy badge missing"
    assert '[COMPANY_NAME_REQUIRING_USER_APPROVAL' in html_text, "Company approval notice missing"
    assert '[EMAIL_ADDRESS_REQUIRING_USER_APPROVAL' in html_text, "Email approval notice missing"
    assert 'Multi-Tenant Data Isolation' in html_text, "Multi-tenant section missing"
    print("  [PASS] /privacy returned 200 OK with correct HTML and flagged approval placeholders.")

    # 3. Test /terms
    print("\n--- 3. Testing Terms of Service (/terms) ---")
    status, ct, body = fetch('/terms')
    assert status == 200, f"/terms returned {status}"
    assert 'text/html' in ct, f"Wrong Content-Type: {ct}"
    html_text = body.decode('utf-8')
    assert '<title>Terms of Service' in html_text, "Title missing in /terms"
    assert 'DOCUMENT // TERMS' in html_text, "Terms badge missing"
    assert '[GOVERNING_LAW_REQUIRING_USER_APPROVAL' in html_text, "Governing law placeholder missing"
    assert 'Acceptable Use Policy' in html_text, "AUP section missing"
    print("  [PASS] /terms returned 200 OK with correct HTML and legal terms structure.")

    # 4. Test /robots.txt
    print("\n--- 4. Testing robots.txt (/robots.txt) ---")
    status, ct, body = fetch('/robots.txt')
    assert status == 200, f"/robots.txt returned {status}"
    assert 'text/plain' in ct, f"Wrong Content-Type: {ct}"
    robots_text = body.decode('utf-8')
    assert 'User-agent: *' in robots_text, "User-agent missing in robots.txt"
    assert 'Allow: /privacy' in robots_text, "Allow: /privacy missing"
    assert 'Allow: /terms' in robots_text, "Allow: /terms missing"
    assert 'Disallow: /api/' in robots_text, "Disallow: /api/ missing"
    assert 'Disallow: /.well-known/' in robots_text, "Disallow: /.well-known/ missing"
    assert 'Sitemap: https://tempo-ofxg.onrender.com/sitemap.xml' in robots_text, "Sitemap directive missing"
    print("  [PASS] /robots.txt returned 200 OK with public allows, private disallows, and sitemap directive.")

    # 5. Test /sitemap.xml
    print("\n--- 5. Testing sitemap.xml (/sitemap.xml) ---")
    status, ct, body = fetch('/sitemap.xml')
    assert status == 200, f"/sitemap.xml returned {status}"
    assert 'application/xml' in ct or 'text/xml' in ct, f"Wrong Content-Type: {ct}"
    xml_text = body.decode('utf-8')
    root = ET.fromstring(xml_text)
    urls = [elem.text for elem in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    assert 'https://tempo-ofxg.onrender.com/' in urls, "Root URL missing in sitemap"
    assert 'https://tempo-ofxg.onrender.com/privacy' in urls, "/privacy missing in sitemap"
    assert 'https://tempo-ofxg.onrender.com/terms' in urls, "/terms missing in sitemap"
    assert 'https://tempo-ofxg.onrender.com/llms.txt' in urls, "/llms.txt missing in sitemap"
    for u in urls:
        assert '/api/' not in u, f"Private API URL leaked in sitemap: {u}"
        assert '/server/' not in u, f"Private server path leaked in sitemap: {u}"
    print(f"  [PASS] /sitemap.xml returned 200 OK with {len(urls)} validated public URLs.")

    # 6. Test /llms.txt
    print("\n--- 6. Testing llms.txt (/llms.txt) ---")
    status, ct, body = fetch('/llms.txt')
    assert status == 200, f"/llms.txt returned {status}"
    assert 'text/plain' in ct or 'text/markdown' in ct, f"Wrong Content-Type: {ct}"
    llms_text = body.decode('utf-8')
    assert '# Tempo Productivity Workspace' in llms_text, "Heading missing in llms.txt"
    assert 'Production URL' in llms_text, "Production URL missing in llms.txt"
    assert 'Ephemeral Guest Mode' in llms_text, "Guest mode section missing in llms.txt"
    print("  [PASS] /llms.txt returned 200 OK with structured platform documentation.")

    # 7. Test /site.webmanifest
    print("\n--- 7. Testing site.webmanifest (/site.webmanifest) ---")
    status, ct, body = fetch('/site.webmanifest')
    assert status == 200, f"/site.webmanifest returned {status}"
    assert 'manifest+json' in ct or 'application/json' in ct, f"Wrong Content-Type: {ct}"
    manifest = json.loads(body.decode('utf-8'))
    assert manifest.get('name') == 'Tempo - Minimal Productivity Workspace'
    assert manifest.get('short_name') == 'Tempo'
    assert manifest.get('display') == 'standalone'
    assert len(manifest.get('icons', [])) >= 2, "Icons missing in site.webmanifest"
    print("  [PASS] /site.webmanifest returned 200 OK with valid PWA manifest JSON.")

    # 8. Test /favicon.ico
    print("\n--- 8. Testing favicon.ico (/favicon.ico) ---")
    status, ct, body = fetch('/favicon.ico')
    assert status == 200, f"/favicon.ico returned {status}"
    assert 'image/x-icon' in ct or 'image/vnd.microsoft.icon' in ct, f"Wrong Content-Type: {ct}"
    assert body[:4] == b'\x00\x00\x01\x00', f"Invalid ICO magic header: {body[:4]}"
    assert len(body) > 1000, f"favicon.ico too small: {len(body)} bytes"
    print(f"  [PASS] /favicon.ico returned 200 OK with valid binary icon ({len(body)} bytes).")

    # 9. Test /.well-known/security.txt and /security.txt
    print("\n--- 9. Testing security.txt (/.well-known/security.txt & /security.txt) ---")
    for sec_path in ['/.well-known/security.txt', '/security.txt']:
        status, ct, body = fetch(sec_path)
        assert status == 200, f"{sec_path} returned {status}"
        assert 'text/plain' in ct, f"Wrong Content-Type for {sec_path}: {ct}"
        sec_text = body.decode('utf-8')
        assert 'Contact: mailto:security@tempo.dev' in sec_text, "Contact field missing"
        assert 'Canonical: https://tempo-ofxg.onrender.com/.well-known/security.txt' in sec_text, "Canonical missing"
        assert 'Expires:' in sec_text, "Expires field missing"
        assert 'Policy: https://tempo-ofxg.onrender.com/privacy' in sec_text, "Policy link missing"
        print(f"  [PASS] {sec_path} returned 200 OK complying with RFC 9116.")

    # 10. Test Custom Animated 404 Page
    print("\n--- 10. Testing Custom Animated 404 Page ---")
    for bad_path in ['/nonexistent-route-xyz', '/random/page/missing', '/broken']:
        status, ct, body = fetch(bad_path)
        assert status == 404, f"{bad_path} should return 404, got {status}"
        assert 'text/html' in ct, f"Wrong Content-Type for 404: {ct}"
        body_text = body.decode('utf-8')
        assert '404' in body_text, "404 text missing in error page"
        assert 'STATUS CODE // 404 NOT FOUND' in body_text, "404 badge missing"
        assert 'Return to Workspace' in body_text, "Return button missing in 404 page"
        print(f"  [PASS] {bad_path} properly returned HTTP 404 with custom animated 404 page.")

    # 11. Test 404 on API endpoints
    print("\n--- 11. Testing 404 on Unrecognized API Endpoints ---")
    status, ct, body = fetch('/api/nonexistent-api-action')
    assert status == 404, f"/api/nonexistent should return 404, got {status}"
    assert 'application/json' in ct, f"API 404 should return JSON, got {ct}"
    err_json = json.loads(body.decode('utf-8'))
    assert err_json.get('success') is False
    assert 'Resource not found' in err_json.get('error', '')
    print("  [PASS] /api/nonexistent returned 404 JSON with structured error message.")

    # 12. Test Sensitive File Protection (403 Forbidden)
    print("\n--- 12. Testing Sensitive File Protection (403 Forbidden) ---")
    for blocked_path in ['/.env', '/server/server.js', '/tests/test_backend_api.py', '/package.json']:
        status, ct, body = fetch(blocked_path)
        assert status == 403, f"{blocked_path} should be blocked with 403, got {status}"
        err_json = json.loads(body.decode('utf-8'))
        assert err_json.get('error') == 'Access denied.'
        print(f"  [PASS] Direct request to {blocked_path} blocked with 403 Forbidden.")

    print("\n================================================================================")
    print("🎉 ALL PUBLIC ROUTES, METADATA & 404 PAGE CHECKS PASSED (100%)!")
    print("================================================================================\n")

finally:
    cleanup()
