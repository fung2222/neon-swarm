/**
 * Phase 6 result-share screenshots (v0.9.39).
 * Run: node tests/phase6-result-share-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-result-share');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.39';
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

async function bootOver(page, base) {
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
  await page.evaluate(() => {
    window.__swarm.hideRunCoach?.();
    const g = window.__swarm.game;
    if (g) {
      g.t = 201; // 3:21
      g.kills = 128;
      g.score = 4200;
      g.mapZone = 'assembly';
      g.alive = false;
    }
    // Force over screen via UI + fill fields (avoid full endRun ads path flakiness)
    const S = window.__swarm;
    S.state = 'over';
    document.getElementById('hud')?.classList.add('hidden');
    document.getElementById('stick')?.classList.add('hidden');
    document.getElementById('over-score').textContent = '4200';
    document.getElementById('over-time').textContent = '3:21';
    document.getElementById('over-kills').textContent = '128';
    document.getElementById('over-zone').textContent = '機甲組裝區';
    S._lastShare = {
      timeStr: '3:21', kills: 128, zone: '機甲組裝區', score: 4200, isZh: true,
    };
    S.refreshShareButton?.();
    // show over via cyber-ui if present
    if (S.ui && S.ui.show) S.ui.show('over');
    else {
      document.querySelectorAll('.screen').forEach((el) => el.classList.add('hidden'));
      document.getElementById('screen-over')?.classList.remove('hidden');
    }
  });
  await page.waitForFunction(() => {
    const el = document.getElementById('screen-over');
    return el && !el.classList.contains('hidden') && document.getElementById('btn-share');
  }, WAIT);
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
    // Grant clipboard in Chromium for confirm path
    const ctx = desk.browserContext ? desk.browserContext() : browser.defaultBrowserContext();
    try {
      await ctx.overridePermissions('http://127.0.0.1', ['clipboard-read', 'clipboard-write']);
    } catch (_) {}
    await bootOver(desk, base);
    const btnOk = await desk.evaluate(() => {
      const b = document.getElementById('btn-share');
      const r = b.getBoundingClientRect();
      const retry = document.getElementById('btn-retry');
      return {
        zh: document.getElementById('share-zh')?.textContent,
        en: document.getElementById('share-en')?.textContent,
        ghost: b.classList.contains('ghost'),
        w: Math.round(r.width),
        retryPrimary: retry && !retry.classList.contains('ghost'),
      };
    });
    report.checks.push({ view: '1280-over', btnOk });
    if (!btnOk.ghost) throw new Error('share must be ghost');
    if (btnOk.zh !== '複製戰績' && btnOk.zh !== '分享戰績') throw new Error('zh label');
    await desk.screenshot({ path: join(SHOT_DIR, '1280-over-share.png'), type: 'png' });
    report.shots.push('1280-over-share.png');

    // Click copy → confirm
    await desk.evaluate(async () => {
      // Force clipboard path (no share sheet in headless)
      const text = window.__swarm.buildShareText(window.__swarm._lastShare);
      const r = await window.__swarm.shareOrCopy(text, {
        preferShare: false,
        clipboard: {
          writeText: async () => {},
        },
      });
      window.__swarm.showShareConfirm(
        r.ok ? '已複製' : '複製失敗',
        r.ok ? 'COPIED' : 'COPY FAILED',
        !r.ok,
      );
    });
    await desk.waitForFunction(() => {
      const el = document.getElementById('share-confirm');
      return el && !el.classList.contains('hidden') && el.textContent.includes('已複製');
    }, WAIT);
    const conf = await desk.evaluate(() => document.getElementById('share-confirm')?.textContent);
    report.checks.push({ view: '1280-copied', conf });
    await desk.screenshot({ path: join(SHOT_DIR, '1280-copied.png'), type: 'png' });
    report.shots.push('1280-copied.png');

    const mob = await browser.newPage();
    await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await bootOver(mob, base);
    await mob.screenshot({ path: join(SHOT_DIR, '390-over-share.png'), type: 'png' });
    report.shots.push('390-over-share.png');
    await mob.evaluate(() => {
      window.__swarm.showShareConfirm('已複製', 'COPIED', false);
    });
    await mob.waitForFunction(() => {
      const el = document.getElementById('share-confirm');
      return el && !el.classList.contains('hidden');
    }, WAIT);
    await mob.screenshot({ path: join(SHOT_DIR, '390-copied.png'), type: 'png' });
    report.shots.push('390-copied.png');

    writeFileSync(join(SHOT_DIR, 'measure.json'), JSON.stringify(report, null, 2));
    console.log('phase6-result-share-shots OK', report.shots.join(', '));
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
