import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\aryan\\.gemini\\antigravity\\brain\\5aaf353b-f47f-4d73-b7e6-cdfe906c6bd1';

const PORT = 3341;
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(ROOT_DIR, reqPath);

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.otf': 'font/otf',
    '.woff2': 'font/woff2'
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

async function run() {
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`[1/5] Server listening on http://127.0.0.1:${PORT}`);

  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const DEBUG_PORT = 9229;

  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--window-size=1280,820',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--disable-gpu-shader-disk-cache',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const resp = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
      if (resp.ok) {
        const targets = await resp.json();
        const page = targets.find(t => t.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to Chrome DevTools port');
    chromeProcess.kill();
    server.close();
    process.exit(1);
  }

  console.log(`[2/5] Connected to Chrome DevTools Protocol`);

  const ws = new WebSocket(wsUrl);
  await new Promise(resolve => ws.onopen = resolve);

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const cb = pending.get(data.id);
      pending.delete(data.id);
      cb(data);
    }
  };

  function sendCmd(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCmd('Runtime.enable');
  await sendCmd('Page.enable');

  console.log('[3/5] Navigating to page and capturing Gravity Falling 3D book transition phases...');

  // Navigate to page and wait for complete initial load
  await sendCmd('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise(r => setTimeout(r, 1200));

  // Helper to trigger and capture at exact millisecond offsets
  const triggerAndCapture = async (delayMs) => {
    await sendCmd('Runtime.evaluate', {
      expression: `
        (() => {
          const overlay = document.getElementById('book-transition');
          overlay.style.display = '';
          overlay.className = 'book-overlay';
          // Force layout reflow
          void overlay.offsetWidth;
          // Re-clone elements to restart all CSS keyframe animations from t=0
          const parent = overlay.parentNode;
          const clone = overlay.cloneNode(true);
          parent.replaceChild(clone, overlay);
          window.tempoApp.initBookTransition();
        })()
      `
    });
    await new Promise(r => setTimeout(r, delayMs));
    const shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
    return shot?.result?.data;
  };

  // Phase 1: Gravity Plunge (falling from top of viewport ~150ms)
  console.log('  Capturing Phase 1 (Gravity Plunge from Top)...');
  const shot1Data = await triggerAndCapture(150);
  if (shot1Data) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'gravity_falling.png'), Buffer.from(shot1Data, 'base64'));
    console.log('  Saved: gravity_falling.png');
  }

  // Phase 2: Ground Impact & Bounce Rebound (~320ms)
  console.log('  Capturing Phase 2 (Ground Impact & Bounce Rebound)...');
  const shot2Data = await triggerAndCapture(320);
  if (shot2Data) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'gravity_impact_bounce.png'), Buffer.from(shot2Data, 'base64'));
    console.log('  Saved: gravity_impact_bounce.png');
  }

  // Phase 3: Book Size Becomes BIG in Center (~480ms)
  console.log('  Capturing Phase 3 (Book Size Becomes BIG in Center)...');
  const shot3Data = await triggerAndCapture(480);
  if (shot3Data) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'gravity_size_big.png'), Buffer.from(shot3Data, 'base64'));
    console.log('  Saved: gravity_size_big.png');
  }

  // Phase 4: Cover Flipping Open from Spine (~620ms)
  console.log('  Capturing Phase 4 (Cover Flipping Open from Spine)...');
  const shot4Data = await triggerAndCapture(620);
  if (shot4Data) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'gravity_cover_opening.png'), Buffer.from(shot4Data, 'base64'));
    console.log('  Saved: gravity_cover_opening.png');
  }

  // Phase 5: Pages Waving in Gust of Wind Till Middle (~780ms)
  console.log('  Capturing Phase 5 (Pages Waving in Gust of Wind Till Middle)...');
  const shot5Data = await triggerAndCapture(780);
  if (shot5Data) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'gravity_pages_wave.png'), Buffer.from(shot5Data, 'base64'));
    console.log('  Saved: gravity_pages_wave.png');
  }

  // Phase 6: Mobile Viewport Test (375x812 iPhone / Mobile screen)
  console.log('  Capturing Phase 6 (Mobile Viewport Verification)...');
  await sendCmd('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  const shotMobileData = await triggerAndCapture(780);
  if (shotMobileData) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'gravity_mobile_view.png'), Buffer.from(shotMobileData, 'base64'));
    console.log('  Saved: gravity_mobile_view.png');
  }
  // Reset desktop metrics
  await sendCmd('Emulation.clearDeviceMetricsOverride');

  // Wait for transition completion to reach settled view (>1050ms)
  await new Promise(r => setTimeout(r, 1150));

  console.log('[4/5] Verifying transition completion and floating navbar icons...');

  const inspectScript = `
    (() => {
      const overlay = document.getElementById('book-transition');
      const overlayStyle = window.getComputedStyle(overlay);
      const isOverlayHidden = overlay.style.display === 'none' || overlayStyle.display === 'none';

      // Inspect navbar icons
      const icons = [
        { name: 'search-icon', el: document.querySelector('.search-icon') },
        { name: 'notifications-btn svg', el: document.querySelector('#notifications-btn svg') },
        { name: 'create-project-btn svg', el: document.querySelector('#open-create-project-modal-btn svg') },
        { name: 'create-task-btn svg', el: document.querySelector('#open-create-task-modal-btn svg') },
        { name: 'sidebar-header-toggle svg', el: document.querySelector('#sidebar-header-toggle-btn svg') },
        { name: 'nav-dashboard icon', el: document.querySelector('#nav-dashboard .nav-icon') },
        { name: 'nav-my-tasks icon', el: document.querySelector('#nav-my-tasks .nav-icon') },
        { name: 'nav-upcoming icon', el: document.querySelector('#nav-upcoming .nav-icon') },
        { name: 'nav-completed icon', el: document.querySelector('#nav-completed .nav-icon') },
        { name: 'nav-settings icon', el: document.querySelector('#nav-settings .nav-icon') },
        { name: 'sidebar-add-project svg', el: document.querySelector('#sidebar-add-project-btn svg') }
      ];

      const iconResults = icons.map(item => {
        if (!item.el) return { name: item.name, exists: false };
        const cs = window.getComputedStyle(item.el);
        return {
          name: item.name,
          exists: true,
          animationName: cs.animationName,
          animationDelay: cs.animationDelay,
          animationDuration: cs.animationDuration,
          willChange: cs.willChange,
          transform: cs.transform
        };
      });

      // Brand Logo floating check
      const brandLogo = document.querySelector('.brand-wrapper');
      const brandCs = brandLogo ? window.getComputedStyle(brandLogo) : null;

      return {
        isOverlayHidden,
        overlayDisplay: overlay.style.display,
        brandFloating: brandLogo ? brandLogo.classList.contains('floating') : false,
        brandAnimationName: brandCs ? brandCs.animationName : null,
        icons: iconResults
      };
    })()
  `;

  const evalResp = await sendCmd('Runtime.evaluate', {
    expression: inspectScript,
    awaitPromise: true,
    returnByValue: true
  });

  const inspectRes = evalResp.result?.result?.value || evalResp.result?.value;
  console.log('\n--- 3D Book Transition Status ---');
  console.log(`  Overlay hidden after completion: ${inspectRes.isOverlayHidden} (style.display: "${inspectRes.overlayDisplay}")`);
  console.log(`  Brand Logo floating class:       ${inspectRes.brandFloating} (animation: "${inspectRes.brandAnimationName}")`);

  console.log('\n--- Floating Navbar Icons Inspection ---');
  for (const ic of inspectRes.icons) {
    console.log(`  - ${ic.name.padEnd(25)}: animationName=${ic.animationName}, delay=${ic.animationDelay}`);
  }

  // Screenshot of settled Light Mode
  const shotLight = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (shotLight?.result?.data) {
    const lightPath = path.join(ARTIFACT_DIR, 'settled_light_book.png');
    fs.writeFileSync(lightPath, Buffer.from(shotLight.result.data, 'base64'));
    console.log(`  Saved Light Mode screenshot to: ${lightPath}`);
  }

  // Switch to Dark Theme and capture screenshot
  console.log('\n[5/5] Switching to Dark Theme and capturing screenshots...');
  await sendCmd('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('tempo_theme', 'dark');
    `
  });

  await new Promise(r => setTimeout(r, 200));

  const shotDark = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (shotDark?.result?.data) {
    const darkPath = path.join(ARTIFACT_DIR, 'settled_dark_book.png');
    fs.writeFileSync(darkPath, Buffer.from(shotDark.result.data, 'base64'));
    console.log(`  Saved Dark Mode screenshot to: ${darkPath}`);
  }

  // Trigger Book Transition in Dark Theme to capture active dark book
  const shotDarkBookData = await triggerAndCapture(780);
  if (shotDarkBookData) {
    const darkBookPath = path.join(ARTIFACT_DIR, 'book_dark_transition_active.png');
    fs.writeFileSync(darkBookPath, Buffer.from(shotDarkBookData, 'base64'));
    console.log(`  Saved Dark Book Transition screenshot to: ${darkBookPath}`);
  }

  ws.close();
  chromeProcess.kill();
  server.close();
  console.log('\nAll Gravity 3D Book checks and captures completed successfully!');
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
