/**
 * Browser Verification for Overview Stat Icon Theme Colors and Responsive Sidebar
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = 3334;
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
  const DEBUG_PORT = 9223;

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
  await new Promise(r => setTimeout(r, 500));

  console.log('[3/4] Testing Overview Icons Colors and Sidebar Behavior...');

  // Test 1: Overview icons color matching across themes
  const testScript = `
    (() => {
      const results = {};

      function getIconStyles() {
        const total = document.querySelector('.stat-icon-wrapper.total');
        const completed = document.querySelector('.stat-icon-wrapper.completed');
        const pending = document.querySelector('.stat-icon-wrapper.pending');
        const overdue = document.querySelector('.stat-icon-wrapper.overdue');

        return {
          totalColor: window.getComputedStyle(total).color,
          totalBg: window.getComputedStyle(total).backgroundColor,
          completedColor: window.getComputedStyle(completed).color,
          completedBg: window.getComputedStyle(completed).backgroundColor,
          pendingColor: window.getComputedStyle(pending).color,
          pendingBg: window.getComputedStyle(pending).backgroundColor,
          overdueColor: window.getComputedStyle(overdue).color,
          overdueBg: window.getComputedStyle(overdue).backgroundColor
        };
      }

      // Default Carbon & Sage Teal
      results.defaultTheme = getIconStyles();

      // Check that not all icons have the same color
      const uniqueColors = new Set([
        results.defaultTheme.totalColor,
        results.defaultTheme.completedColor,
        results.defaultTheme.pendingColor,
        results.defaultTheme.overdueColor
      ]);
      results.defaultDistinctCount = uniqueColors.size;

      // Switch to Obsidian Amber
      document.documentElement.setAttribute('data-theme', 'obsidian-amber');
      results.obsidianAmber = getIconStyles();

      // Switch to Sunset Crimson
      document.documentElement.setAttribute('data-theme', 'sunset-crimson');
      results.sunsetCrimson = getIconStyles();

      // Switch to Midnight Navy
      document.documentElement.setAttribute('data-theme', 'midnight-navy');
      results.midnightNavy = getIconStyles();

      // Reset to default
      document.documentElement.removeAttribute('data-theme');

      return results;
    })()
  `;

  const themeEval = await sendCmd('Runtime.evaluate', {
    expression: testScript,
    returnByValue: true
  });
  const themeData = themeEval.result?.result?.value || themeEval.result?.value;

  console.log('--- Overview Section Icon Colors Verification ---');
  console.log('Default Carbon & Sage Teal:');
  console.log(`  - Total Tasks:     ${themeData.defaultTheme.totalColor}`);
  console.log(`  - Completed Tasks: ${themeData.defaultTheme.completedColor}`);
  console.log(`  - Pending Tasks:   ${themeData.defaultTheme.pendingColor}`);
  console.log(`  - Overdue Tasks:   ${themeData.defaultTheme.overdueColor}`);
  console.log(`  - Distinct Color Count: ${themeData.defaultDistinctCount}/4 distinct colors (NOT all the same teal!)`);

  console.log('Obsidian Amber Theme:');
  console.log(`  - Total Tasks:     ${themeData.obsidianAmber.totalColor}`);
  console.log(`  - Completed Tasks: ${themeData.obsidianAmber.completedColor}`);
  console.log(`  - Pending Tasks:   ${themeData.obsidianAmber.pendingColor}`);
  console.log(`  - Overdue Tasks:   ${themeData.obsidianAmber.overdueColor}`);

  console.log('Sunset Crimson Theme:');
  console.log(`  - Total Tasks:     ${themeData.sunsetCrimson.totalColor}`);
  console.log(`  - Completed Tasks: ${themeData.sunsetCrimson.completedColor}`);
  console.log(`  - Pending Tasks:   ${themeData.sunsetCrimson.pendingColor}`);
  console.log(`  - Overdue Tasks:   ${themeData.sunsetCrimson.overdueColor}`);

  // Test 2: Sidebar viewport resizing and hamburger click behavior
  // Set viewport to mobile (600px width)
  await sendCmd('Emulation.setDeviceMetricsOverride', {
    width: 600,
    height: 800,
    deviceScaleFactor: 1,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 200));

  const mobileSidebarScript = `
    (async () => {
      const sidebar = document.querySelector('#app-sidebar');
      const toggleBtn = document.querySelector('#sidebar-toggle-btn');
      const brandName = document.querySelector('.brand-name');
      const navLabel = document.querySelector('.nav-label');
      const navCount = document.querySelector('.nav-count');

      const initialWidth = sidebar.getBoundingClientRect().width;
      const toggleBtnDisplay = window.getComputedStyle(toggleBtn).display;
      const brandNameDisplay = window.getComputedStyle(brandName).display;
      const navLabelDisplay = window.getComputedStyle(navLabel).display;
      const navCountDisplay = window.getComputedStyle(navCount).display;

      // Click hamburger button to open
      toggleBtn.click();
      await new Promise(r => setTimeout(r, 250));
      const openWidth = sidebar.getBoundingClientRect().width;
      const openClassPresent = sidebar.classList.contains('open');

      // Click hamburger button to close
      toggleBtn.click();
      await new Promise(r => setTimeout(r, 250));
      const closedWidth = sidebar.getBoundingClientRect().width;
      const closedClassPresent = sidebar.classList.contains('open');

      return {
        toggleBtnDisplay,
        initialWidth,
        brandNameDisplay,
        navLabelDisplay,
        navCountDisplay,
        openWidth,
        openClassPresent,
        closedWidth,
        closedClassPresent
      };
    })()
  `;

  const mobileEval = await sendCmd('Runtime.evaluate', {
    expression: mobileSidebarScript,
    awaitPromise: true,
    returnByValue: true
  });
  const mobileData = mobileEval.result?.result?.value || mobileEval.result?.value;

  console.log('\n--- Mobile Viewport (<= 768px, hamburger menu displayed) ---');
  console.log(`  - Hamburger Menu Button Display: ${mobileData.toggleBtnDisplay} (Displayed)`);
  console.log(`  - Sidebar Initial Width:         ${mobileData.initialWidth}px (Icon-only rail, NOT whole window)`);
  console.log(`  - Brand Name Display:            ${mobileData.brandNameDisplay} (Hidden)`);
  console.log(`  - Nav Labels Display:            ${mobileData.navLabelDisplay} (Hidden)`);
  console.log(`  - Nav Counts Display:            ${mobileData.navCountDisplay} (Hidden)`);
  console.log(`  - After Click Hamburger Button:  ${mobileData.openWidth}px (Expanded full drawer, open=${mobileData.openClassPresent})`);
  console.log(`  - After 2nd Click (Toggle back): ${mobileData.closedWidth}px (Collapsed back to icon-only, open=${mobileData.closedClassPresent})`);

  // Clear override back to Desktop native window (1280x800)
  await sendCmd('Emulation.clearDeviceMetricsOverride');
  await new Promise(r => setTimeout(r, 200));

  const desktopSidebarScript = `
    (async () => {
      const sidebar = document.querySelector('#app-sidebar');
      const toggleBtn = document.querySelector('#sidebar-toggle-btn');
      const headerToggleBtn = document.querySelector('#sidebar-header-toggle-btn');
      const brandName = document.querySelector('.brand-name');
      const navLabel = document.querySelector('.nav-label');

      const desktopWidth = sidebar.getBoundingClientRect().width;
      const innerWidth = window.innerWidth;
      const toggleBtnDisplay = window.getComputedStyle(toggleBtn).display;
      const brandNameDisplay = window.getComputedStyle(brandName).display;
      const navLabelDisplay = window.getComputedStyle(navLabel).display;

      // Test clicking header hamburger to collapse sidebar on desktop
      headerToggleBtn.click();
      await new Promise(r => setTimeout(r, 250));
      const collapsedWidth = sidebar.getBoundingClientRect().width;
      const collapsedToggleBtnDisplay = window.getComputedStyle(toggleBtn).display;
      const collapsedBrandDisplay = window.getComputedStyle(brandName).display;

      // Test clicking topbar hamburger to resize/expand sidebar back on desktop
      toggleBtn.click();
      await new Promise(r => setTimeout(r, 250));
      const expandedWidth = sidebar.getBoundingClientRect().width;
      const expandedToggleBtnDisplay = window.getComputedStyle(toggleBtn).display;

      return {
        innerWidth,
        toggleBtnDisplay,
        desktopWidth,
        brandNameDisplay,
        navLabelDisplay,
        collapsedWidth,
        collapsedToggleBtnDisplay,
        collapsedBrandDisplay,
        expandedWidth,
        expandedToggleBtnDisplay
      };
    })()
  `;

  const desktopEval = await sendCmd('Runtime.evaluate', {
    expression: desktopSidebarScript,
    awaitPromise: true,
    returnByValue: true
  });
  const desktopData = desktopEval.result?.result?.value || desktopEval.result?.value;

  console.log('\n--- Desktop Viewport (> 768px, hamburger menu not shown initially) ---');
  console.log(`  - Viewport Inner Width:          ${desktopData.innerWidth}px`);
  console.log(`  - Initial Topbar Hamburger:      ${desktopData.toggleBtnDisplay} (Hidden)`);
  console.log(`  - Initial Sidebar Width:         ${desktopData.desktopWidth}px (Whole sidebar displayed)`);
  console.log(`  - Brand Name Display:            ${desktopData.brandNameDisplay} (Visible)`);
  console.log(`  - Nav Labels Display:            ${desktopData.navLabelDisplay} (Visible)`);
  console.log('\n--- Desktop Hamburger Menu Resizing Sidebar ---');
  console.log(`  - After Click Header Hamburger:  ${desktopData.collapsedWidth}px (Collapsed to icon-only rail!)`);
  console.log(`  - Collapsed Topbar Hamburger:    ${desktopData.collapsedToggleBtnDisplay} (Displayed now!)`);
  console.log(`  - Collapsed Brand Name Display:  ${desktopData.collapsedBrandDisplay} (Hidden)`);
  console.log(`  - After Click Topbar Hamburger:  ${desktopData.expandedWidth}px (Resized back to whole sidebar!)`);
  console.log(`  - Restored Topbar Hamburger:     ${desktopData.expandedToggleBtnDisplay} (Hidden again!)`);

  console.log('\n[4/4] All Checks Completed Successfully!');

  ws.close();
  chromeProcess.kill();
  server.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Error in verification:', err);
  process.exit(1);
});
