# Tempo Unified Master Test Runner (Phase 6)
# Executes all test suites and generates a comprehensive verification report

import os
import sys
import time
import subprocess

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
os.chdir(project_root)

TEST_SUITES = [
    {
        'name': 'Database Configuration & Environment Setup',
        'file': 'tests/test_phase4_1_setup.py'
    },
    {
        'name': 'PostgreSQL Schema Migrations & Tracking',
        'file': 'tests/test_phase4_2_migrations.py'
    },
    {
        'name': 'PostgreSQL Persistence & Transactional Reordering',
        'file': 'tests/test_database_integration.py'
    },
    {
        'name': 'Authentication, Bcrypt & Multi-Tenant Security',
        'file': 'tests/test_auth_security.py'
    },
    {
        'name': 'Multi-User Boundary Isolation & Cache Defense',
        'file': 'tests/test_user_isolation.py'
    },
    {
        'name': 'Express REST API Contract Verification',
        'file': 'tests/test_backend_api.py'
    },
    {
        'name': 'Carbon & Sage Teal Palette Compliance',
        'file': 'tests/test_color_palette.py'
    },
    {
        'name': 'Frontend Shell Linkage & ES Import Resolution',
        'file': 'tests/test_frontend_shell.py'
    },
    {
        'name': 'Semantic HTML Layout, Drawer & Responsive Rules',
        'file': 'tests/test_main_layout.py'
    },
    {
        'name': 'Interactive JavaScript Functionality & State Store',
        'file': 'tests/test_phase2_functionality.py'
    }
]

print("================================================================================")
print("🚀 TEMPO UNIFIED VERIFICATION MATRIX (PHASE 6)")
print("================================================================================\n")

start_all = time.time()
results = []
failed_count = 0

for idx, suite in enumerate(TEST_SUITES, 1):
    print(f"[{idx}/{len(TEST_SUITES)}] Running {suite['name']}...")
    suite_start = time.time()
    
    proc = subprocess.run(
        [sys.executable, suite['file']],
        capture_output=True,
        text=True
    )
    duration = time.time() - suite_start
    is_pass = proc.returncode == 0
    
    if not is_pass:
        failed_count += 1
        print(f"     ❌ FAILED in {duration:.2f}s\n{proc.stderr}\n{proc.stdout}")
    else:
        print(f"     ✓ PASSED in {duration:.2f}s")
        
    results.append({
        'name': suite['name'],
        'file': suite['file'],
        'passed': is_pass,
        'duration': duration
    })

total_time = time.time() - start_all

print("\n================================================================================")
print("📊 VERIFICATION RESULTS SUMMARY")
print("================================================================================")
print(f"{'#':<3} {'Test Suite':<55} {'Status':<10} {'Duration':<8}")
print("-" * 80)

for idx, r in enumerate(results, 1):
    status_str = "PASS" if r['passed'] else "FAIL"
    print(f"{idx:<3} {r['name']:<55} {status_str:<10} {r['duration']:.2f}s")

print("-" * 80)
print(f"Total Suites: {len(TEST_SUITES)} | Passed: {len(TEST_SUITES) - failed_count} | Failed: {failed_count} | Total Time: {total_time:.2f}s")
print("================================================================================\n")

if failed_count == 0:
    print("🎉 ALL TESTS PASSED! TEMPO IS 100% PRODUCTION READY!\n")
    sys.exit(0)
else:
    print(f"❌ {failed_count} test suite(s) failed.\n")
    sys.exit(1)

