import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\aryan\\.gemini\\antigravity\\brain\\5aaf353b-f47f-4d73-b7e6-cdfe906c6bd1';

const PORT = 3338;
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
    '.svg': 'image/svg+xml'
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
  const DEBUG_PORT = 9226;

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

  console.log('[3/5] Navigating to page and capturing spider web transition phases...');

  // Navigate to page
  await sendCmd('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });

  // Phase 1: High velocity shooting (220ms)
  await new Promise(r => setTimeout(r, 220));
  const shot1 = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (shot1?.result?.data) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'spider_web_phase1_shot.png'), Buffer.from(shot1.result.data, 'base64'));
  }

  // Phase 2: Web expanded & THWIP! Badge impact (200ms later = ~420ms)
  await new Promise(r => setTimeout(r, 200));
  const shot2 = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (shot2?.result?.data) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'spider_web_phase2_thwip.png'), Buffer.from(shot2.result.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'spider_web_transition_active.png'), Buffer.from(shot2.result.data, 'base64'));
  }

  // Wait for transition to complete
  await new Promise(r => setTimeout(r, 600));

  console.log('[4/5] Verifying transition completion and floating navbar icons...');

  const inspectScript = `
    (() => {
      const overlay = document.getElementById('spider-web-transition');
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
  console.log('\n--- Spider Web Transition Status ---');
  console.log(`  Overlay hidden after completion: ${inspectRes.isOverlayHidden} (style.display: "${inspectRes.overlayDisplay}")`);
  console.log(`  Brand Logo floating class:       ${inspectRes.brandFloating} (animation: "${inspectRes.brandAnimationName}")`);

  console.log('\n--- Floating Navbar Icons Inspection ---');
  for (const ic of inspectRes.icons) {
    console.log(`  - ${ic.name.padEnd(25)}: animationName=${ic.animationName}, delay=${ic.animationDelay}`);
  }

  // Screenshot of settled Light Mode
  const shotLight = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (shotLight?.result?.data) {
    const lightPath = path.join(ARTIFACT_DIR, 'settled_light_floating_navbar.png');
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
    const darkPath = path.join(ARTIFACT_DIR, 'settled_dark_floating_navbar.png');
    fs.writeFileSync(darkPath, Buffer.from(shotDark.result.data, 'base64'));
    console.log(`  Saved Dark Mode screenshot to: ${darkPath}`);
  }

  // Refresh with Dark Theme to capture Dark Spider Web Transition
  await sendCmd('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise(r => setTimeout(r, 400));

  const shotDarkWeb = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (shotDarkWeb?.result?.data) {
    const darkWebPath = path.join(ARTIFACT_DIR, 'spider_web_transition_dark_active.png');
    fs.writeFileSync(darkWebPath, Buffer.from(shotDarkWeb.result.data, 'base64'));
    console.log(`  Saved Dark Spider Web Transition screenshot to: ${darkWebPath}`);
  }

  ws.close();
  chromeProcess.kill();
  server.close();
  console.log('\nAll checks and captures completed successfully!');
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
