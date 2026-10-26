/**
 * Phase 6 safe-area screenshots (v0.9.36).
 * Injects large --sa-* CSS overrides to simulate notch + home indicator.
 * Run: node tests/phase6-safe-area-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-safe-area');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.36';
const WAIT = { timeout: 45000, polling: 250 };

/** Simulated phone insets (large enough to fail if chrome ignores them) */
const SA = { top: 54, right: 28, bottom: 40, left: 28 };

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

async function injectSafeArea(page) {
  await page.addStyleTag({
    content: `
      :root {
        --sa-top: ${SA.top}px !important;
        --sa-right: ${SA.right}px !important;
        --sa-bottom: ${SA.bottom}px !important;
        --sa-left: ${SA.left}px !important;
      }
      /* Visual guide for audit (pointer-events none) */
      body::after {
        content: '';
        position: fixed; inset: 0; z-index: 9999; pointer-events: none;
        box-shadow:
          inset 0 ${SA.top}px 0 0 rgba(255,0,80,0.22),
          inset 0 -${SA.bottom}px 0 0 rgba(255,0,80,0.22),
          inset ${SA.left}px 0 0 0 rgba(255,0,80,0.18),
          inset -${SA.right}px 0 0 0 rgba(255,0,80,0.18);
      }
    `,
  });
}

async function bootPlay(page, base, { stick = false } = {}) {
  const q = [`v=${VER}`, 'lang=zh'];
  if (stick) q.push('stick=1');
  await page.goto(base + `/index.html?${q.join('&')}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await injectSafeArea(page);
  await new Promise((r) => setTimeout(r, 150));
  await page.click('#btn-play');
  await page.waitForFunction(
    () => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game,
    WAIT,
  );
  await new Promise((r) => setTimeout(r, 280));
}

function rectOutsideInset(r, vw, vh) {
  const pad = 1; // float slack
  return {
    clearTop: r.top >= SA.top - pad,
    clearBottom: r.bottom <= vh - SA.bottom + pad,
    clearLeft: r.left >= SA.left - pad,
    clearRight: r.right <= vw - SA.right + pad,
    r,
  };
}

async function measureChrome(page) {
  return page.evaluate((sa) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el || el.classList.contains('hidden')) return null;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return null;
      return {
        sel,
        top: r.top, right: r.right, bottom: r.bottom, left: r.left,
        w: r.width, h: r.height,
        clearTop: r.top >= sa.top - 1,
        clearBottom: r.bottom <= vh - sa.bottom + 1,
        clearLeft: r.left >= sa.left - 1,
        clearRight: r.right <= vw - sa.right + 1,
      };
    };
    return {
      vw, vh, sa,
      hudLeft: pick('.hud-left'),
      hudRight: pick('.hud-right'),
      hudButtons: pick('.hud-buttons.top'),
      btnMute: pick('#btn-mute'),
      btnPause: pick('#btn-pause'),
      stick: pick('#stick'),
      slots: pick('#weapon-slots'),
      xp: pick('.xp-bar'),
      beat: pick('#beat-banner'),
      coach: pick('#run-coach'),
      goal: pick('.hud-goal'),
    };
  }, SA);
}

async function run() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  });
  const report = { sa: SA, shots: [], checks: [] };
  try {
    // --- 390×844 play with stick + large insets ---
    const phone = await browser.newPage();
    await phone.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await bootPlay(phone, base, { stick: true });
    // Ensure stick visible + slots painted
    await phone.evaluate(() => {
      const stick = document.getElementById('stick');
      if (stick) stick.classList.remove('hidden');
      const banner = document.getElementById('beat-banner');
      if (banner) {
        banner.classList.remove('hidden');
        const zh = banner.querySelector('.beat-zh') || banner;
        if (banner.querySelector('.beat-zh')) banner.querySelector('.beat-zh').textContent = '安全區測試';
        else banner.textContent = '安全區測試 SAFE-AREA';
      }
      // force a couple weapon slots if empty
      const slots = document.getElementById('weapon-slots');
      if (slots && !slots.children.length) {
        for (let i = 0; i < 3; i++) {
          const d = document.createElement('div');
          d.className = 'wslot';
          d.innerHTML = '<div class="wslot-ico">🔫</div><div class="wslot-name">MG</div><div class="wslot-lv">Lv1</div>';
          slots.appendChild(d);
        }
      }
    });
    await new Promise((r) => setTimeout(r, 120));
    let m = await measureChrome(phone);
    report.checks.push({ view: '390-play', m });
    await phone.screenshot({ path: join(SHOT_DIR, '390-play-safe.png'), type: 'png' });
    report.shots.push('390-play-safe.png');

    // Pause panel
    await phone.evaluate(() => {
      document.getElementById('hud')?.classList.add('hidden');
      document.getElementById('stick')?.classList.add('hidden');
      document.getElementById('beat-banner')?.classList.add('hidden');
      document.getElementById('screen-pause')?.classList.remove('hidden');
      window.__swarm.state = 'pause';
    });
    await new Promise((r) => setTimeout(r, 80));
    await phone.screenshot({ path: join(SHOT_DIR, '390-pause-safe.png'), type: 'png' });
    report.shots.push('390-pause-safe.png');
    const pausePad = await phone.evaluate((sa) => {
      const el = document.getElementById('screen-pause');
      const cs = getComputedStyle(el);
      return {
        pt: parseFloat(cs.paddingTop),
        pb: parseFloat(cs.paddingBottom),
        pl: parseFloat(cs.paddingLeft),
        pr: parseFloat(cs.paddingRight),
        okTop: parseFloat(cs.paddingTop) >= sa.top - 1,
        okBottom: parseFloat(cs.paddingBottom) >= sa.bottom - 1,
      };
    }, SA);
    report.checks.push({ view: '390-pause-pad', pausePad });

    // Over panel
    await phone.evaluate(() => {
      document.getElementById('screen-pause')?.classList.add('hidden');
      document.getElementById('screen-over')?.classList.remove('hidden');
    });
    await new Promise((r) => setTimeout(r, 80));
    await phone.screenshot({ path: join(SHOT_DIR, '390-over-safe.png'), type: 'png' });
    report.shots.push('390-over-safe.png');

    // Level-up panel
    await phone.evaluate(() => {
      document.getElementById('screen-over')?.classList.add('hidden');
      const lvl = document.getElementById('screen-level');
      lvl?.classList.remove('hidden');
      const cards = document.getElementById('level-cards');
      if (cards && !cards.children.length) {
        for (let i = 0; i < 3; i++) {
          const b = document.createElement('button');
          b.className = 'level-card';
          b.innerHTML = `<div class="lc-ico">⚡</div><div class="lc-name">測試 ${i + 1}</div><div class="lc-desc">safe-area</div>`;
          cards.appendChild(b);
        }
      }
    });
    await new Promise((r) => setTimeout(r, 80));
    await phone.screenshot({ path: join(SHOT_DIR, '390-level-safe.png'), type: 'png' });
    report.shots.push('390-level-safe.png');
    await phone.close();

    // --- 1280 desktop with simulated insets (sanity) ---
    const desk = await browser.newPage();
    await desk.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await bootPlay(desk, base, { stick: false });
    await desk.evaluate(() => {
      const banner = document.getElementById('beat-banner');
      if (banner) {
        banner.classList.remove('hidden');
        const zh = banner.querySelector('.beat-zh');
        if (zh) zh.textContent = '安全區·桌面';
      }
    });
    await new Promise((r) => setTimeout(r, 100));
    m = await measureChrome(desk);
    report.checks.push({ view: '1280-play', m });
    await desk.screenshot({ path: join(SHOT_DIR, '1280-play-safe.png'), type: 'png' });
    report.shots.push('1280-play-safe.png');
    await desk.close();

    // Assert critical chrome clear of insets on phone play
    const play = report.checks.find((c) => c.view === '390-play')?.m;
    const fails = [];
    if (play?.hudButtons && !play.hudButtons.clearTop) fails.push('hudButtons top');
    if (play?.hudButtons && !play.hudButtons.clearRight) fails.push('hudButtons right');
    if (play?.btnMute && !play.btnMute.clearTop) fails.push('btnMute top');
    if (play?.btnMute && !play.btnMute.clearRight) fails.push('btnMute right');
    if (play?.stick && !play.stick.clearLeft) fails.push('stick left');
    if (play?.stick && !play.stick.clearBottom) fails.push('stick bottom');
    if (play?.slots && !play.slots.clearBottom) fails.push('slots bottom');
    if (play?.xp && !play.xp.clearBottom) fails.push('xp bottom');
    if (play?.xp && !play.xp.clearLeft) fails.push('xp left');
    if (play?.xp && !play.xp.clearRight) fails.push('xp right');
    if (play?.hudLeft && !play.hudLeft.clearLeft) fails.push('hudLeft left');
    if (play?.hudLeft && !play.hudLeft.clearTop) fails.push('hudLeft top');
    if (pausePad && !pausePad.okTop) fails.push('pause pad top');
    if (pausePad && !pausePad.okBottom) fails.push('pause pad bottom');

    writeFileSync(join(SHOT_DIR, 'measure.json'), JSON.stringify(report, null, 2));
    console.log('shots', report.shots);
    console.log('pausePad', pausePad);
    console.log('390 key', {
      hudLeft: play?.hudLeft,
      hudButtons: play?.hudButtons,
      stick: play?.stick,
      slots: play?.slots,
      xp: play?.xp,
      beat: play?.beat,
    });
    if (fails.length) {
      throw new Error('safe-area clearance failed: ' + fails.join(', '));
    }
    console.log('phase6-safe-area-shots OK');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
