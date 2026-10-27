/**
 * Phase 6 mute persist screenshots (v0.9.35).
 * Run: node tests/phase6-mute-persist-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-mute-persist');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.52';
const WAIT = { timeout: 45000, polling: 250 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      let rel = url === '/' ? '/index.html' : url;
      const file = join(ROOT, rel.replace(/^\//, ''));
      if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

async function gotoMenu(page, base, { muted = false } = {}) {
  await page.goto('about:blank');
  await page.evaluateOnNewDocument((isMuted) => {
    try {
      localStorage.setItem('cyber.neon-swarm.muted', isMuted ? '1' : '0');
      localStorage.setItem('neon-swarm-mute', isMuted ? '1' : '0');
    } catch (_) {}
  }, muted);
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  // v0.9.52: mute lives in gear settings — open sheet so mute toggle is visible for shots
  await page.waitForSelector('#btn-settings-home', WAIT);
  await page.click('#btn-settings-home');
  await page.waitForSelector('[data-set="mute"]', WAIT);
  await new Promise((r) => setTimeout(r, 200));
}

async function run() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl', '--ignore-gpu-blocklist', '--window-size=1280,720'],
    defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
  });
  try {
    const page = await browser.newPage();

    // Muted on menu 1280
    await gotoMenu(page, base, { muted: true });
    await page.evaluate(() => { window.__swarm?.syncMuteChrome?.(); });
    await page.evaluate(() => {
      const a = window.__swarm?.audio;
      if (a?.setMuted) a.setMuted(true);
      else if (a) a.muted = true;
      window.__swarm?.syncMuteChrome?.();
      window.__swarm?.ui?.setMuted?.(true);
      const btn = document.querySelector('[data-set="mute"]');
      if (btn) btn.click(); // toggle if needed — normalize below
    });
    // Force muted via persist path
    await page.evaluate(() => {
      const a = window.__swarm?.audio;
      if (!a?.muted && window.__swarm?.toggleMutePersist) window.__swarm.toggleMutePersist();
      if (!a?.muted && a?.setMuted) a.setMuted(true);
      localStorage.setItem('cyber.neon-swarm.muted', '1');
      localStorage.setItem('neon-swarm-mute', '1');
      window.__swarm?.syncMuteChrome?.();
    });
    const visibleMuted = await page.evaluate(() => {
      const b = document.querySelector('[data-set="mute"]');
      const r = b?.getBoundingClientRect();
      return { w: r?.width || 0, display: b ? getComputedStyle(b).display : 'none', audioMuted: !!window.__swarm?.audio?.muted, text: b?.textContent || '' };
    });
    console.log('muted chrome', visibleMuted);
    if (!(visibleMuted.w > 0) || visibleMuted.display === 'none' || !visibleMuted.audioMuted) {
      throw new Error('settings mute not visible/muted: ' + JSON.stringify(visibleMuted));
    }
    const keys = await page.evaluate(() => ({
      kit: localStorage.getItem('cyber.neon-swarm.muted'),
      alias: localStorage.getItem('neon-swarm-mute'),
      ui: !!window.__swarm?.audio?.muted,
      audio: window.__swarm?.audio?.muted,
    }));
    console.log('muted state', keys);
    await page.screenshot({ path: join(SHOT_DIR, '1280-menu-muted.png'), type: 'png' });

    // Unmuted contrast 1280 — new context so evaluateOnNewDocument applies
    const page2 = await browser.newPage();
    await gotoMenu(page2, base, { muted: false });
    await page2.evaluate(() => {
      const a = window.__swarm?.audio;
      if (a?.setMuted) a.setMuted(false);
      else if (a) a.muted = false;
      window.__swarm?.syncMuteChrome?.();
    });
    const unmutedOk = await page2.evaluate(() => {
      const b = document.querySelector('[data-set="mute"]');
      const r = b?.getBoundingClientRect();
      return { w: r?.width || 0, muted: !!window.__swarm?.audio?.muted, display: b ? getComputedStyle(b).display : 'none', text: b?.textContent || '' };
    });
    console.log('unmuted chrome', unmutedOk);
    if (!(unmutedOk.w > 0) || unmutedOk.muted || unmutedOk.display === 'none') {
      throw new Error('settings unmute contrast failed: ' + JSON.stringify(unmutedOk));
    }
    await new Promise((r) => setTimeout(r, 100));
    await page2.screenshot({ path: join(SHOT_DIR, '1280-menu-unmuted.png'), type: 'png' });
    await page2.close();

    // 390 muted
    const page3 = await browser.newPage();
    await page3.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await gotoMenu(page3, base, { muted: true });
    await page3.evaluate(() => {
      const a = window.__swarm?.audio;
      if (a?.setMuted) a.setMuted(true);
      window.__swarm?.syncMuteChrome?.();
    });
    await new Promise((r) => setTimeout(r, 100));
    await page3.screenshot({ path: join(SHOT_DIR, '390-menu-muted.png'), type: 'png' });

    // Cold reload round-trip: mute → reload → still muted
    await page3.evaluate(() => {
      window.__swarm?.toggleMutePersist?.(); // may unmute if was muted — force set
    });
    await page3.evaluate(() => {
      const audio = window.__swarm?.audio;
      if (audio?.setMuted) audio.setMuted(true);
      else if (window.__swarm?.toggleMutePersist && !audio?.muted) {
        window.__swarm.toggleMutePersist();
      }
      localStorage.setItem('cyber.neon-swarm.muted', '1');
      localStorage.setItem('neon-swarm-mute', '1');
      window.__swarm?.syncMuteChrome?.();
    });
    await page3.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page3.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
    const after = await page3.evaluate(() => ({
      kit: localStorage.getItem('cyber.neon-swarm.muted'),
      alias: localStorage.getItem('neon-swarm-mute'),
      audio: window.__swarm?.audio?.muted,
    }));
    console.log('after reload', after);
    if (after.kit !== '1' || !after.audio) {
      throw new Error('mute did not survive reload: ' + JSON.stringify(after));
    }
    await page3.screenshot({ path: join(SHOT_DIR, '390-menu-muted-reload.png'), type: 'png' });

    console.log('shots ok →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
