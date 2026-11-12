import os
import re
import sys

# Change working directory to project root if executed from tests dir
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
os.chdir(project_root)

files = [
    'index.html',
    'css/main.css',
    'css/variables.css',
    'css/reset.css',
    'css/layout.css',
    'css/components.css',
    'js/app.js',
    'js/components/sidebar.js',
    'js/components/header.js',
    'js/utils/dom.js',
    'assets/README.md'
]

print("--- 1. Checking File Existence ---")
missing = [f for f in files if not os.path.exists(f)]
if missing:
    print(f"FAILED: Missing files: {missing}")
    sys.exit(1)
for f in files:
    print(f"  [OK] {f} ({os.path.getsize(f)} bytes)")

print("\n--- 2. Verifying index.html Linkages ---")
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

assert 'css/main.css' in html, 'main.css link missing from index.html'
assert 'js/app.js' in html, 'app.js script missing from index.html'
assert 'type="module"' in html, 'type="module" missing from index.html'
print("  [OK] index.html links to css/main.css and js/app.js (type=module)")

print("\n--- 3. Verifying CSS @import Target Resolution ---")
with open('css/main.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

css_imports = re.findall(r'@import url\(["\']\./([^"\']+)["\']\);', css_content)
for imp in css_imports:
    imp_path = os.path.join('css', imp)
    if not os.path.exists(imp_path):
        print(f"FAILED: CSS import {imp_path} does not exist")
        sys.exit(1)
    print(f"  [OK] @import ./{imp} -> {imp_path} ({os.path.getsize(imp_path)} bytes)")

print("\n--- 4. Verifying JS ES Module Import Resolution ---")
js_files = ['js/app.js', 'js/components/sidebar.js', 'js/components/header.js', 'js/utils/dom.js']
for js_file in js_files:
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    dir_name = os.path.dirname(js_file)
    imports = re.findall(r'from ["\']([^"\']+)["\']', content)
    for imp in imports:
        resolved = os.path.normpath(os.path.join(dir_name, imp))
        if not os.path.exists(resolved):
            print(f"FAILED: JS import {imp} in {js_file} points to non-existent {resolved}")
            sys.exit(1)
        print(f"  [OK] {js_file} -> {imp} resolves to {resolved}")

print("\nALL FRONTEND SHELL INTEGRITY CHECKS PASSED!")
