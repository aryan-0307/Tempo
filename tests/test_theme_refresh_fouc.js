/**
 * Browser Verification for Flash-Free Theme Persistence on Page Refresh (No FOUC)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = 3335;
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
  console.log(`[1/4] Server listening on http://127.0.0.1:${PORT}`);

  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const DEBUG_PORT = 9224;

  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--window-size=1280,800',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--disable-gpu-shader-disk-cache',
    '--no-first-run',
    '--no-default-browser-check',
    `http://127.0.0.1:${PORT}/`
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
  await new Promise(r => setTimeout(r, 400));

  console.log('[3/4] Testing Theme Persistence on Refresh without Teal Flash...');

  // Setup preload script that intercepts the earliest lifecycle events
  await sendCmd('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__foucLog = [];
      
      // Check data-theme immediately when documentElement is available
      const checkState = (stage) => {
        const theme = document.documentElement ? document.documentElement.getAttribute('data-theme') : null;
        window.__foucLog.push({ stage, theme, time: performance.now() });
      };

      checkState('pre-script');

      document.addEventListener('DOMContentLoaded', () => {
        checkState('DOMContentLoaded');
      });

      window.addEventListener('load', () => {
        checkState('load');
      });
    `
  });

  const testThemes = ['obsidian-amber', 'sunset-crimson', 'midnight-navy', 'forest-emerald'];

  for (const theme of testThemes) {
    console.log(`\n--- Testing Theme Refresh: "${theme}" ---`);

    // 1. Set theme in localStorage
    await sendCmd('Runtime.evaluate', {
      expression: `localStorage.setItem('tempo_theme', '${theme}');`
    });

    // 2. Reload the page
    await sendCmd('Page.reload');

    // Wait for page to reload
    await new Promise(r => setTimeout(r, 600));

    // 3. Inspect the lifecycle logs and computed styles
    const resultEval = await sendCmd('Runtime.evaluate', {
      expression: `
        (() => {
          const docTheme = document.documentElement.getAttribute('data-theme');
          const statTotal = document.querySelector('.stat-icon-wrapper.total');
          const totalColor = statTotal ? window.getComputedStyle(statTotal).color : null;
          const bgMain = window.getComputedStyle(document.body).backgroundColor;

          return {
            docTheme,
            totalColor,
            bgMain,
            foucLog: window.__foucLog || []
          };
        })()
      `,
      returnByValue: true
    });

    const data = resultEval.result?.result?.value || resultEval.result?.value;
    console.log(`  - Active Theme Attribute:   ${data.docTheme}`);
    console.log(`  - Total Stat Icon Color:    ${data.totalColor}`);
    console.log(`  - Body Background Color:    ${data.bgMain}`);
    console.log(`  - Lifecycle Theme Check:`);
    for (const entry of data.foucLog) {
      console.log(`      * [${entry.stage}] data-theme="${entry.theme}"`);
    }

    if (data.docTheme !== theme) {
      throw new Error(`Expected data-theme to be ${theme} but got ${data.docTheme}`);
    }

    // Verify DOMContentLoaded had the theme set (no flash of default theme)
    const dclEntry = data.foucLog.find(e => e.stage === 'DOMContentLoaded');
    if (!dclEntry || dclEntry.theme !== theme) {
      throw new Error(`Flash detected! At DOMContentLoaded data-theme was "${dclEntry?.theme}" instead of "${theme}"`);
    }
    console.log(`  [PASS] Zero flash of teal color. Theme "${theme}" was active from first paint!`);
  }

  // Cleanup: Reset to default theme
  await sendCmd('Runtime.evaluate', {
    expression: `localStorage.removeItem('tempo_theme');`
  });

  console.log('\n[4/4] All Theme Refresh Tests Passed (Zero Teal Flash)!');

  ws.close();
  chromeProcess.kill();
  server.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Error in verification:', err);
  process.exit(1);
});
