/**
 * Phase 6 kill-streak screenshots (v0.9.38).
 * Run: node tests/phase6-kill-streak-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-kill-streak');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.38';
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

async function bootPlay(page, base) {
  const q = [`v=${VER}`, 'lang=zh'];
  await page.goto(base + `/index.html?${q.join('&')}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => {
    try { localStorage.setItem('neon-swarm-coach-v1', '1'); } catch (_) {}
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.click('#btn-play');
  await page.waitForFunction(
    () => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game,
    WAIT,
  );
  await new Promise((r) => setTimeout(r, 200));
  await page.evaluate(() => { window.__swarm.hideRunCoach?.(); });
}

async function shotToast(page, { zh, en, name, report }) {
  await page.evaluate((zh, en) => {
    window.__swarm.hideEarlyToast?.();
    window.__swarm.showEarlyToast(zh, en, 8000, 'streak');
  }, zh, en);
  await page.waitForFunction(() => {
    const el = document.getElementById('early-toast');
    return el && !el.classList.contains('hidden') && el.classList.contains('kind-streak');
  }, WAIT);
  const ok = await page.evaluate(() => {
    const el = document.getElementById('early-toast');
    const r = el.getBoundingClientRect();
    return {
      pe: getComputedStyle(el).pointerEvents,
      zh: document.getElementById('early-toast-zh')?.textContent,
      en: document.getElementById('early-toast-en')?.textContent,
      kind: el.classList.contains('kind-streak'),
      w: Math.round(r.width),
    };
  });
  report.checks.push({ view: name, ok });
  if (ok.pe !== 'none') throw new Error('pointer-events');
  if (!ok.kind) throw new Error('kind-streak');
  if (ok.zh !== zh) throw new Error('zh ' + ok.zh);
  await page.screenshot({ path: join(SHOT_DIR, name + '.png'), type: 'png' });
  report.shots.push(name + '.png');
}

async function run() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  });
  const report = { shots: [], checks: [] };
  try {
    const desk = await browser.newPage();
    await desk.setViewport({ width: 1280, height: 800 });
    await bootPlay(desk, base);
    await shotToast(desk, { zh: '連殺 ×5', en: 'STREAK ×5', name: '1280-streak-5', report });
    await shotToast(desk, { zh: '連殺 ×10', en: 'STREAK ×10', name: '1280-streak-10', report });

    const mob = await browser.newPage();
    await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await bootPlay(mob, base);
    await shotToast(mob, { zh: '連殺 ×5', en: 'STREAK ×5', name: '390-streak-5', report });
    await shotToast(mob, { zh: '連殺 ×10', en: 'STREAK ×10', name: '390-streak-10', report });

    writeFileSync(join(SHOT_DIR, 'measure.json'), JSON.stringify(report, null, 2));
    console.log('phase6-kill-streak-shots OK', report.shots.join(', '));
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
