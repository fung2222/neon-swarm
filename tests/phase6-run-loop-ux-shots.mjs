/**
 * Phase 6 run-loop UX screenshots (v0.9.33).
 * Run: node tests/phase6-run-loop-ux-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-run-loop-ux');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.33';
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

async function bootPlay(page, base, { stick = false, arsenal = false } = {}) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  const q = [`v=${VER}`, 'lang=zh'];
  if (stick) q.push('stick=1');
  if (arsenal) q.push('arsenal=1');
  await page.goto(base + `/index.html?${q.join('&')}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => { try { localStorage.removeItem('neon-swarm-coach-v1'); } catch (_) {} });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await new Promise((r) => setTimeout(r, 200));
  await page.click('#btn-play');
  await page.waitForFunction(
    () => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game,
    WAIT,
  );
  await new Promise((r) => setTimeout(r, 250));
  return errs;
}

async function run() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,720'],
    defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
  });
  try {
    const page = await browser.newPage();
    await bootPlay(page, base, { stick: true });

    // Force coach visible
    await page.evaluate(() => {
      const S = window.__swarm;
      if (S.hideRunCoach) S.hideRunCoach();
      S._coachSessionShown = false;
      try { localStorage.removeItem('neon-swarm-coach-v1'); } catch (_) {}
      S.showRunCoach({ touch: true });
    });
    await page.waitForFunction(() => {
      const el = document.getElementById('run-coach');
      return el && !el.classList.contains('hidden');
    }, WAIT);
    await new Promise((r) => setTimeout(r, 120));
    await page.screenshot({ path: join(SHOT_DIR, '1280-coach.png'), type: 'png' });

    // Hurt vignette
    await page.evaluate(() => {
      window.__swarm.hideRunCoach();
      window.__swarm.flashHurtVignette();
      const flash = document.getElementById('fx-flash');
      if (flash) flash.classList.add('on');
    });
    await new Promise((r) => setTimeout(r, 60));
    await page.screenshot({ path: join(SHOT_DIR, '1280-hurt.png'), type: 'png' });
    await page.evaluate(() => {
      document.getElementById('fx-hurt')?.classList.remove('on');
      document.getElementById('fx-flash')?.classList.remove('on');
    });

    // XP bar punch — fill mid
    await page.evaluate(() => {
      const fill = document.getElementById('xp-fill');
      if (fill) fill.style.width = '62%';
    });
    await new Promise((r) => setTimeout(r, 80));
    await page.screenshot({ path: join(SHOT_DIR, '1280-xp.png'), type: 'png' });

    // Over screen with zone + loadout
    await page.evaluate(() => {
      const S = window.__swarm;
      const g = S.game;
      if (g) {
        g.mapZone = 'reactor';
        g.weaponSlots = ['mg', 'laser', 'shotgun', null];
        g.laser = 2; g.shotgun = 1;
        g.kills = 42; g.score = 8800; g.t = 195;
        g.alive = false;
      }
      // Call endRun via dead path pieces — use exposed flow
      S.state = 'play';
      // manually populate like endRun
      const zh = true;
      document.getElementById('hud')?.classList.add('hidden');
      document.getElementById('stick')?.classList.add('hidden');
      document.getElementById('over-score').textContent = '8800';
      document.getElementById('over-best').textContent = '8800';
      document.getElementById('over-time').textContent = '3:15';
      document.getElementById('over-best-time').textContent = '3:15';
      document.getElementById('over-kills').textContent = '42';
      document.getElementById('over-goals').textContent = '2';
      document.getElementById('over-zone').textContent = '能源反應爐';
      document.getElementById('over-loadout').textContent = '機槍 Lv1 · 鐳射炮 Lv2 · 散彈槍 Lv1';
      document.getElementById('over-note').textContent = '實驗室暫時捉返你 · 再嚟過？';
      document.getElementById('over-record')?.classList.add('hidden');
      // show over via cyber UI pattern
      for (const name of ['start', 'pause', 'over', 'level', 'gfx']) {
        const el = document.getElementById('screen-' + name);
        if (!el) continue;
        const on = name === 'over';
        el.classList.toggle('hidden', !on);
        if (on) el.style.removeProperty('display');
        else el.style.setProperty('display', 'none', 'important');
      }
      S.state = 'over';
    });
    await page.waitForFunction(() => {
      const el = document.getElementById('screen-over');
      return el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none';
    }, WAIT);
    await new Promise((r) => setTimeout(r, 150));
    await page.screenshot({ path: join(SHOT_DIR, '1280-over.png'), type: 'png' });

    // 390
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(base + `/index.html?v=${VER}&lang=zh&stick=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => { try { localStorage.removeItem('neon-swarm-coach-v1'); } catch (_) {} });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
    await page.click('#btn-play');
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play', WAIT);
    await page.evaluate(() => {
      const S = window.__swarm;
      S._coachSessionShown = false;
      try { localStorage.removeItem('neon-swarm-coach-v1'); } catch (_) {}
      S.showRunCoach({ touch: true });
    });
    await page.waitForFunction(() => {
      const el = document.getElementById('run-coach');
      return el && !el.classList.contains('hidden');
    }, WAIT);
    await new Promise((r) => setTimeout(r, 100));
    await page.screenshot({ path: join(SHOT_DIR, '390-coach.png'), type: 'png' });

    await page.evaluate(() => {
      window.__swarm.hideRunCoach();
      const g = window.__swarm.game;
      if (g) {
        g.mapZone = 'assembly';
        g.weaponSlots = ['mg', 'laser', null, null];
        g.laser = 1;
      }
      document.getElementById('hud')?.classList.add('hidden');
      document.getElementById('over-score').textContent = '1200';
      document.getElementById('over-best').textContent = '1200';
      document.getElementById('over-time').textContent = '1:05';
      document.getElementById('over-best-time').textContent = '1:05';
      document.getElementById('over-kills').textContent = '18';
      document.getElementById('over-goals').textContent = '1';
      document.getElementById('over-zone').textContent = '機甲組裝區';
      document.getElementById('over-loadout').textContent = '機槍 Lv1 · 鐳射炮 Lv1';
      document.getElementById('over-note').textContent = '實驗室暫時捉返你 · 再嚟過？';
      for (const name of ['start', 'pause', 'over', 'level', 'gfx']) {
        const el = document.getElementById('screen-' + name);
        if (!el) continue;
        const on = name === 'over';
        el.classList.toggle('hidden', !on);
        if (on) el.style.removeProperty('display');
        else el.style.setProperty('display', 'none', 'important');
      }
    });
    await page.waitForFunction(() => {
      const el = document.getElementById('screen-over');
      return el && !el.classList.contains('hidden');
    }, WAIT);
    await new Promise((r) => setTimeout(r, 120));
    await page.screenshot({ path: join(SHOT_DIR, '390-over.png'), type: 'png' });

    console.log('shots written to', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
