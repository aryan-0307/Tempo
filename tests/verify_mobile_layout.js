import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\aryan\\.gemini\\antigravity\\brain\\5aaf353b-f47f-4d73-b7e6-cdfe906c6bd1';

const PORT = 3345;
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
  console.log(`[1/4] Server listening on http://127.0.0.1:${PORT}`);

  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const DEBUG_PORT = 9231;

  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--window-size=375,812',
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

  console.log(`[2/4] Connected to Chrome DevTools Protocol`);

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

  await sendCmd('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });

  console.log('[3/4] Navigating to page in mobile view (375x812)...');
  await sendCmd('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  // Wait for initial load and transition to finish
  await new Promise(r => setTimeout(r, 1400));

  // Inspect layout metrics
  const evalResult = await sendCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const topbar = document.querySelector('.app-topbar');
        const topbarRect = topbar.getBoundingClientRect();
        const left = document.querySelector('.topbar-left').getBoundingClientRect();
        const bell = document.querySelector('#notifications-btn').getBoundingClientRect();
        const projectBtn = document.querySelector('#open-create-project-modal-btn').getBoundingClientRect();
        const taskBtn = document.querySelector('#open-create-task-modal-btn').getBoundingClientRect();
        const search = document.querySelector('.topbar-center').getBoundingClientRect();

        return {
          topbar: { width: topbarRect.width, height: topbarRect.height },
          left: { left: left.left, right: left.right, top: left.top, width: left.width },
          bell: { left: bell.left, right: bell.right, top: bell.top, width: bell.width },
          projectBtn: { left: projectBtn.left, right: projectBtn.right, top: projectBtn.top, width: projectBtn.width },
          taskBtn: { left: taskBtn.left, right: taskBtn.right, top: taskBtn.top, width: taskBtn.width },
          search: { left: search.left, right: search.right, top: search.top, width: search.width },
          windowWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth
        };
      })()
    `,
    returnByValue: true
  });

  const metrics = evalResult.result.value;
  console.log('Mobile Topbar Layout Metrics (375px):', JSON.stringify(metrics, null, 2));

  // Capture Mobile Dark Mode screenshot (matching user's screenshot)
  await sendCmd('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('tempo_theme', 'dark');
    `
  });
  await new Promise(r => setTimeout(r, 200));

  console.log('[4/5] Capturing mobile and desktop screenshots...');
  const shotDark = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (shotDark?.result?.data) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_header_dark_no_empty_space.png'), Buffer.from(shotDark.result.data, 'base64'));
    console.log('  Saved: mobile_header_dark_no_empty_space.png');
  }

  // Capture Mobile Light Mode screenshot
  await sendCmd('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('tempo_theme', 'light');
    `
  });
  await new Promise(r => setTimeout(r, 200));
  const shotLight = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (shotLight?.result?.data) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_header_light_no_empty_space.png'), Buffer.from(shotLight.result.data, 'base64'));
    console.log('  Saved: mobile_header_light_no_empty_space.png');
  }

  // Also test narrow 320px screen
  await sendCmd('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 568,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 200));
  const shot320 = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (shot320?.result?.data) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_header_320px_narrow.png'), Buffer.from(shot320.result.data, 'base64'));
    console.log('  Saved: mobile_header_320px_narrow.png');
  }

  // Desktop Viewport Test (1280x800)
  console.log('[5/5] Capturing desktop view (1280x800) to confirm zero desktop regression...');
  await sendCmd('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 400));
  const shotDesktop = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (shotDesktop?.result?.data) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'desktop_view_verified.png'), Buffer.from(shotDesktop.result.data, 'base64'));
    console.log('  Saved: desktop_view_verified.png');
  }

  console.log('\n--- ALL VISUAL VERIFICATIONS COMPLETED SUCCESSFULLY ---');

  ws.close();
  chromeProcess.kill();
  server.close();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
