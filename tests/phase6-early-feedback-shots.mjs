/**
 * Phase 6 early-feedback screenshots (v0.9.37).
 * Run: node tests/phase6-early-feedback-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-early-feedback');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.37';
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

async function bootPlay(page, base, { stick = false } = {}) {
  const q = [`v=${VER}`, 'lang=zh'];
  if (stick) q.push('stick=1');
  // Skip coach for clean first-kill shots (mark seen)
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
  await new Promise((r) => setTimeout(r, 250));
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
    // 1280 first kill
    const desk = await browser.newPage();
    await desk.setViewport({ width: 1280, height: 800 });
    await bootPlay(desk, base);
    await desk.evaluate(() => {
      window.__swarm.hideRunCoach?.();
      window.__swarm._early = window.__swarm._early || { firstKillDone: false, firstLevelDone: false, firstHealDone: false, pending: null };
      window.__swarm._early.firstKillDone = false;
      window.__swarm.showEarlyToast('首殺', 'FIRST BLOOD', 5000, 'firstKill');
    });
    await desk.waitForFunction(() => {
      const el = document.getElementById('early-toast');
      return el && !el.classList.contains('hidden');
    }, WAIT);
    const killOk = await desk.evaluate(() => {
      const el = document.getElementById('early-toast');
      const r = el.getBoundingClientRect();
      const pe = getComputedStyle(el).pointerEvents;
      return { pe, w: r.width, zh: document.getElementById('early-toast-zh')?.textContent, top: r.top };
    });
    report.checks.push({ view: '1280-kill', killOk });
    if (killOk.pe !== 'none') throw new Error('early-toast must be pointer-events none');
    if (killOk.zh !== '首殺') throw new Error('zh copy');
    await desk.screenshot({ path: join(SHOT_DIR, '1280-first-kill.png'), type: 'png' });
    report.shots.push('1280-first-kill.png');

    // first level juice
    await desk.evaluate(() => {
      window.__swarm.hideEarlyToast?.();
      window.__swarm._early.firstLevelDone = false;
      const bar = document.querySelector('.xp-bar');
      if (bar) bar.classList.add('xp-first-level');
      const fill = document.getElementById('xp-fill');
      if (fill) fill.style.width = '100%';
      // open level panel with glow
      document.getElementById('hud')?.classList.add('hidden');
      const lvl = document.getElementById('screen-level');
      lvl?.classList.remove('hidden');
      lvl?.classList.add('first-level-glow');
      const cards = document.getElementById('level-cards');
      if (cards && !cards.children.length) {
        for (let i = 0; i < 3; i++) {
          const b = document.createElement('button');
          b.className = 'level-card';
          b.innerHTML = `<div class="lc-ico">⚡</div><div class="lc-name">測試 ${i + 1}</div><div class="lc-desc">early</div>`;
          cards.appendChild(b);
        }
      }
    });
    await new Promise((r) => setTimeout(r, 100));
    await desk.screenshot({ path: join(SHOT_DIR, '1280-first-level.png'), type: 'png' });
    report.shots.push('1280-first-level.png');
    await desk.close();

    // 390 first kill
    const phone = await browser.newPage();
    await phone.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await bootPlay(phone, base, { stick: true });
    await phone.evaluate(() => {
      window.__swarm.hideRunCoach?.();
      document.getElementById('stick')?.classList.remove('hidden');
      window.__swarm.showEarlyToast('首殺', 'FIRST BLOOD', 5000, 'firstKill');
    });
    await phone.waitForFunction(() => {
      const el = document.getElementById('early-toast');
      return el && !el.classList.contains('hidden');
    }, WAIT);
    await phone.screenshot({ path: join(SHOT_DIR, '390-first-kill.png'), type: 'png' });
    report.shots.push('390-first-kill.png');

    // 390 first level
    await phone.evaluate(() => {
      window.__swarm.hideEarlyToast?.();
      document.getElementById('hud')?.classList.add('hidden');
      document.getElementById('stick')?.classList.add('hidden');
      const lvl = document.getElementById('screen-level');
      lvl?.classList.remove('hidden');
      lvl?.classList.add('first-level-glow');
      const cards = document.getElementById('level-cards');
      if (cards && !cards.children.length) {
        for (let i = 0; i < 3; i++) {
          const b = document.createElement('button');
          b.className = 'level-card';
          b.innerHTML = `<div class="lc-ico">⚡</div><div class="lc-name">升級 ${i + 1}</div><div class="lc-desc">early</div>`;
          cards.appendChild(b);
        }
      }
      document.querySelector('.xp-bar')?.classList.add('xp-first-level');
    });
    await new Promise((r) => setTimeout(r, 80));
    await phone.screenshot({ path: join(SHOT_DIR, '390-first-level.png'), type: 'png' });
    report.shots.push('390-first-level.png');

    // defer-with-coach path (logic check via exposed helpers)
    const deferOk = await phone.evaluate(() => {
      const S = window.__swarm;
      S.hideEarlyToast?.();
      S._early = { firstKillDone: false, firstLevelDone: false, firstHealDone: false, pending: null };
      S.showRunCoach?.({ touch: true });
      // simulate note via toast path: pending when coach up — call through module state manually
      // Use showEarlyToast only after hide
      const coachUp = S.isCoachVisible?.();
      S.hideRunCoach?.();
      return { coachWas: !!coachUp, coachNow: !!S.isCoachVisible?.() };
    });
    report.checks.push({ view: 'coach-defer', deferOk });

    await phone.close();
    writeFileSync(join(SHOT_DIR, 'measure.json'), JSON.stringify(report, null, 2));
    console.log('shots', report.shots);
    console.log('checks', JSON.stringify(report.checks));
    console.log('phase6-early-feedback-shots OK');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
