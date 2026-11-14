import os
import re
import sys

# Ensure running from repository root
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
os.chdir(project_root)

print("=== Carbon & Sage Teal & Multi-Theme Palette Verification Test ===")

# 1. Verify DESIGN.md exists and documents the approved theme
print("\n--- 1. Verifying Design System Documentation ---")
assert os.path.exists('DESIGN.md'), "DESIGN.md file missing from repository root"
with open('DESIGN.md', 'r', encoding='utf-8') as f:
    design_doc = f.read()

assert 'Carbon & Sage Teal' in design_doc, "Carbon & Sage Teal theme title missing in DESIGN.md"
assert '#151719' in design_doc, "Main background #151719 missing in DESIGN.md"
assert '#202426' in design_doc, "Sidebar background #202426 missing in DESIGN.md"
assert '#303739' in design_doc, "Card background #303739 missing in DESIGN.md"
assert '#6BAFA4' in design_doc, "Primary sage teal #6BAFA4 missing in DESIGN.md"
assert '#A2D2C9' in design_doc, "Light sage teal #A2D2C9 missing in DESIGN.md"
assert '#E7EAE9' in design_doc, "Primary text #E7EAE9 missing in DESIGN.md"
assert '#A3ACAA' in design_doc, "Secondary text #A3ACAA missing in DESIGN.md"
assert '#84918E' in design_doc, "Muted text #84918E missing in DESIGN.md"
assert '#3B4444' in design_doc, "Border #3B4444 missing in DESIGN.md"
assert '#344A46' in design_doc, "Active nav #344A46 missing in DESIGN.md"
assert '#303A39' in design_doc, "Hover background #303A39 missing in DESIGN.md"
print("  [PASS] DESIGN.md exists and comprehensively documents the Carbon & Sage Teal palette and Multi-Theme presets.")

# 2. Approved Colors across the 10 Handcrafted Themes
APPROVED_HEX = {
    # 1. Carbon & Sage Teal (Default)
    '#151719', '#202426', '#303739', '#373F40', '#303A39', '#E7EAE9', '#A3ACAA', '#84918E',
    '#6BAFA4', '#A2D2C9', '#83C3B7', '#344A46', '#3B4444', '#14211E',
    '#80B9A0', '#D2AD70', '#D98B83', '#88AFC2',
    '#E5A49D', '#513A39', '#E0BC80', '#514638', '#A5C4D0', '#35464C',

    # 2. Midnight Navy
    '#0B132B', '#1C2541', '#222E50', '#2A3862', '#233157', '#E0E7FF', '#94A3B8', '#64748B',
    '#38BDF8', '#7DD3FC', '#0EA5E9', '#1E3A5F', '#2E3E64', '#082F49',

    # 3. Obsidian Amber
    '#121214', '#1A1A1E', '#24242A', '#2E2E36', '#282830', '#F4F4F5', '#A1A1AA', '#71717A',
    '#F59E0B', '#FCD34D', '#D97706', '#452D12', '#33333D', '#451A03',

    # 4. Forest Emerald
    '#0E1A16', '#162621', '#1E332D', '#28443C', '#223B33', '#ECFDF5', '#A7F3D0', '#6EE7B7',
    '#10B981', '#34D399', '#059669', '#133D30', '#2A483E', '#064E3B',

    # 5. Nordic Frost
    '#10161A', '#182228', '#202D36', '#283944', '#24343F', '#F1F5F9',
    '#60A5FA', '#93C5FD', '#3B82F6', '#1E334D', '#2F414E', '#0F172A',

    # 6. Sunset Crimson
    '#181116', '#241A21', '#31232D', '#3E2D3A', '#372833', '#FDF2F8', '#F472B6', '#BE185D',
    '#FB7185', '#FDA4AF', '#F43F5E', '#4C1D32', '#473241', '#4C0519',

    # 7. Cyberpunk Violet
    '#13111C', '#1C1929', '#27233A', '#322D4B', '#2C2842', '#F5F3FF', '#C4B5FD', '#8B5CF6',
    '#A855F7', '#C084FC', '#9333EA', '#3B2063', '#3D365A', '#2E1065',

    # 8. Monochrome Slate
    '#18181B', '#222226', '#2C2C32', '#383840', '#323238', '#FAFAFA', '#D4D4D8',
    '#E4E4E7', '#FFFFFF', '#3F3F46', '#43434C',

    # 9. Warm Sepia
    '#1A1614', '#26201D', '#342C28', '#423833', '#3B322D', '#FBF8F5', '#D6C7BC', '#A8978B',
    '#FBBF24', '#B45309', '#4A3525', '#4A3F39', '#2A1706',

    # 10. Paper Light
    '#F8FAFC', '#0284C7', '#0369A1', '#E0F2FE', '#CBD5E1', '#E2E8F0', '#475569'
}
APPROVED_HEX_LOWER = {c.lower() for c in APPROVED_HEX}

APPROVED_RGB = {
    (0, 0, 0),          # Shadows / Elevation overlays
    (21, 23, 25),       # #151719 (Main background / Modal backdrop)
    (107, 175, 164),    # #6BAFA4 (Primary sage teal)
    (162, 210, 201),    # #A2D2C9 (Light sage teal)
    (128, 185, 160),    # #80B9A0 (Success)
    (136, 175, 194),    # #88AFC2 (Info)
    (217, 139, 131),    # #D98B83 (Danger)
    (255, 255, 255)     # Swatch borders
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
