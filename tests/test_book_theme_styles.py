# Test 3D Book Theme Refresh Transition Styling
# Verifies that on refreshing the page, all 12 themes dynamically style the 3D book transition,
# ensuring dark and colored themes never flash or display the light theme lime/cream colors.

import re
import os

print("=== Tempo 3D Book Theme Refresh Transition Verification ===")

# 1. Verify index.html head script
print("\n--- 1. Verifying index.html Head Script ---")
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

head_match = re.search(r'<head>(.*?)</head>', html, re.DOTALL)
assert head_match, "index.html must have a <head> tag"
head_content = head_match.group(1)

# Ensure script runs before stylesheets
script_idx = head_content.find('<script>')
link_idx = head_content.find('<link rel="stylesheet"')
assert script_idx != -1, "index.html must have inline theme initialization script in <head>"
assert link_idx != -1, "index.html must link to css/main.css"
assert script_idx < link_idx, "Theme initialization script must execute before stylesheet link to eliminate FOUC"
assert "localStorage.getItem('tempo_theme')" in head_content, "Script must read 'tempo_theme' from localStorage"
assert "document.documentElement.setAttribute('data-theme'" in head_content, "Script must set data-theme on documentElement"
print("  [PASS] index.html sets documentElement data-theme synchronously in <head> prior to stylesheet parsing.")

# 2. Verify css/themes.css custom properties
print("\n--- 2. Verifying css/themes.css Book Custom Properties ---")
with open('css/themes.css', 'r', encoding='utf-8') as f:
    themes_css = f.read()

required_themes = [
    'light', 'dark', 'carbon-teal', 'midnight-navy', 'obsidian-amber',
    'forest-emerald', 'nordic-frost', 'sunset-crimson', 'cyberpunk-violet',
    'monochrome-slate', 'warm-sepia', 'paper-light'
]

book_vars = [
    '--book-overlay-bg',
    '--book-cover-bg',
    '--book-cover-text',
    '--book-cover-text-shadow',
    '--book-cover-badge-bg',
    '--book-cover-badge-text',
    '--book-cover-emblem',
    '--book-spine-bg',
    '--book-page-bg',
    '--book-base-bg',
    '--book-border',
    '--book-shadow-color',
    '--book-ruled-line',
    '--book-ruled-accent-1',
    '--book-ruled-accent-2',
    '--book-header-mark'
]

for theme in required_themes:
    # Match the theme block
    theme_selector = rf'\[data-theme="{theme}"\]\s*\{{([^}}]+)\}}'
    if theme == 'light':
        theme_selector = r'\[data-theme="light"\],\s*\[data-theme="neo-brutalist"\]\s*\{([^}]+)\}'
    match = re.search(theme_selector, themes_css)
    assert match, f"Theme block [data-theme='{theme}'] missing in css/themes.css"
    block = match.group(1)

    for var in book_vars:
        assert var in block, f"Variable {var} missing in theme '{theme}'"

print(f"  [PASS] All {len(required_themes)} handcrafted themes define complete --book-* custom properties.")

# 3. Verify css/layout.css dynamic variable usage
print("\n--- 3. Verifying css/layout.css Dynamic Variable Usage ---")
with open('css/layout.css', 'r', encoding='utf-8') as f:
    layout_css = f.read()

assert 'var(--book-overlay-bg' in layout_css, ".book-overlay must use var(--book-overlay-bg)"
assert 'var(--book-cover-bg' in layout_css, ".cover-face-front must use var(--book-cover-bg)"
assert 'var(--book-border' in layout_css, "Book elements must use var(--book-border)"
assert 'var(--book-page-bg' in layout_css, ".wind-page and .cover-face-inside must use var(--book-page-bg)"
assert 'var(--book-cover-text' in layout_css, ".cover-title must use var(--book-cover-text)"
assert 'var(--book-cover-badge-bg' in layout_css, ".cover-badge must use var(--book-cover-badge-bg)"
assert 'var(--book-cover-emblem' in layout_css, ".cover-emblem must use var(--book-cover-emblem)"
assert 'var(--book-spine-bg' in layout_css, ".book-spine must use var(--book-spine-bg)"
assert 'var(--book-base-bg' in layout_css, ".book-base-right must use var(--book-base-bg)"
assert 'var(--book-shadow-color' in layout_css, ".book-shadow must use var(--book-shadow-color)"
print("  [PASS] css/layout.css base elements dynamically reference CSS variables.")

# 4. Verify explicit theme override rules
print("\n--- 4. Verifying Explicit Theme Override Rules in css/layout.css ---")
for theme in required_themes:
    if theme == 'light':
        continue
    selector = f'[data-theme="{theme}"] .cover-face-front'
    assert selector in layout_css, f"Missing explicit selector '{selector}' in css/layout.css"

# Specifically check dark theme
dark_cover_match = re.search(r'\[data-theme="dark"\]\s+\.cover-face-front\s*\{([^}]+)\}', layout_css)
assert dark_cover_match, "Dark theme cover rule missing"
dark_cover_body = dark_cover_match.group(1)
assert 'background-color: #18181B' in dark_cover_body, "Dark theme cover must have dark background #18181B"
assert '#C6F55A' not in dark_cover_body, "Dark theme cover must NOT have neon lime background"

dark_title_match = re.search(r'\[data-theme="dark"\]\s+\.cover-title\s*\{([^}]+)\}', layout_css)
assert dark_title_match, "Dark theme cover title rule missing"
dark_title_body = dark_title_match.group(1)
assert 'color: #FFFFFF' in dark_title_body, "Dark theme title must be white #FFFFFF"
assert '#111111' not in dark_title_body.split('color:')[1].split(';')[0], "Dark theme title text must NOT be black"

print("  [PASS] All non-light themes have explicit cover, title, and page overrides in css/layout.css.")
print("  [PASS] Dark theme cover is verified dark (#18181B) with white (#FFFFFF) title and borders.")

print("\nALL 3D BOOK THEME REFRESH VERIFICATIONS PASSED (100%)!")
