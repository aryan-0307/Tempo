import os
import re
import sys

# Ensure running from repository root
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
os.chdir(project_root)

print("=== Venice Blue, Rock Blue & Crisp White Palette Verification Test ===")

# 1. Verify DESIGN.md exists and documents the 3 approved colors
print("\n--- 1. Verifying Design System Documentation ---")
assert os.path.exists('DESIGN.md'), "DESIGN.md file missing from repository root"
with open('DESIGN.md', 'r', encoding='utf-8') as f:
    design_doc = f.read()

assert '#FFFFFF' in design_doc or '#ffffff' in design_doc, "Crisp White #FFFFFF missing in DESIGN.md"
assert '#84B3CE' in design_doc or '#84b3ce' in design_doc, "Rock Blue #84B3CE missing in DESIGN.md"
assert '#16587B' in design_doc or '#16587b' in design_doc, "Venice Blue #16587B missing in DESIGN.md"
assert '#F5EEDD' not in design_doc and '#f5eedd' not in design_doc, "Merino #F5EEDD must be eliminated from DESIGN.md"
print("  [PASS] DESIGN.md exists, documents #FFFFFF, #84B3CE, #16587B, and eliminates brown tones.")

# 2. Approved Colors and RGB Triplets
APPROVED_HEX = {
    '#FFFFFF',  # Crisp White
    '#84B3CE',  # Rock Blue
    '#16587B'   # Venice Blue
}
APPROVED_HEX_LOWER = {c.lower() for c in APPROVED_HEX}

APPROVED_RGB = {
    (255, 255, 255),    # #FFFFFF (White)
    (132, 179, 206),    # #84B3CE (Rock Blue)
    (22, 88, 123)       # #16587B (Venice Blue)
}

# 3. Scan all CSS, HTML, and JS files for any unauthorized color codes
print("\n--- 2. Scanning Codebase for Color Compliance ---")
target_extensions = ('.css', '.html', '.js')
scanned_files = []

for root, dirs, files in os.walk('.'):
    # Skip git, agent memory, and node_modules directories
    if '.git' in root or '.agent' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(target_extensions):
            scanned_files.append(os.path.join(root, file))

print(f"  Scrutinizing {len(scanned_files)} files: {', '.join(os.path.basename(f) for f in scanned_files)}")

violations = []

for file_path in scanned_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all hex colors (exclude HTML numeric entities like &#039;)
    hex_matches = re.findall(r'(?<!&)#([0-9a-fA-F]{3,8})\b', content)
    for h in hex_matches:
        full_hex = f"#{h}".lower()
        if full_hex not in APPROVED_HEX_LOWER:
            violations.append(f"{file_path}: Unauthorized hex color '{full_hex}'")

    # Find all rgb / rgba colors
    rgb_matches = re.findall(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)', content)
    for r, g, b in rgb_matches:
        triplet = (int(r), int(g), int(b))
        if triplet not in APPROVED_RGB:
            violations.append(f"{file_path}: Unauthorized rgb/rgba triplet {triplet}")

if violations:
    print(f"\nFAILED: Found {len(violations)} color deviation(s):")
    for v in violations:
        print(f"  [VIOLATION] {v}")
    sys.exit(1)

print(f"  [PASS] Zero color deviations found! All colors adhere 100% to the approved palette.")
print("\nALL PALETTE COMPLIANCE CHECKS PASSED!")

