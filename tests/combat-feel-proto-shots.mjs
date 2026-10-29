/**
 * COMBAT-FEEL V1 screenshots — before (?feelProto=0) vs default ON (absent / feelProto=1).
 * Box SwiftShader only — NOT Android phone proof.
 * Run: node tests/combat-feel-proto-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'combat-feel-proto');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const WAIT = { timeout: 45000, polling: 250 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'application/svg+xml',
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

async function armScene(page) {
  return page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    g.taken = { gatling: 1 };
    g.loadout = { primary: ['gatling'], secondary: [], throw: [] };
    g.weaponSlots = ['gatling'];
    g.fireMode = 'primary';
    g.activePrimaryIndex = 0;
    g.aimX = 1; g.aimZ = 0;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.enemies.push({
        id: 'cf' + i, kind: 'soldier', type: 'soldier', family: 'human',
        x: Math.cos(a) * 3.2, z: Math.sin(a) * 3.2,
        prevX: Math.cos(a) * 3.2, prevZ: Math.sin(a) * 3.2,
        vx: 0, vz: 0, hp: 8, maxHp: 8, r: 0.35, speed: 0, damage: 1,
        color: '#c44', slow: 0, hit: 0, score: 10, wob: i * 0.4, animPhase: 0,
      });
    }
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
    return { enemies: g.enemies.length, feel: location.search };
  });
}

async function shootAndCapture(page, name, extraMs = 500) {
  await page.evaluate(() => {
    const g = window.__swarm.game;
    // Force fire intent
    g.firing = true;
    g.fireHeld = true;
    if (g.input) { g.input.fire = true; }
  });
  await new Promise((r) => setTimeout(r, extraMs));
  await page.screenshot({ path: join(SHOT_DIR, name), type: 'png', fullPage: false });
}

async function runVariant(browser, base, qs, label) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  const consoleHits = [];
  page.on('console', (msg) => {
    const t = msg.text();
    if (/COMBAT-FEEL|feelProto|error/i.test(t)) consoleHits.push(t);
  });
  await page.goto(`${base}/index.html?${qs}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 350));
  const meta = await armScene(page);
  await shootAndCapture(page, `${label}-01-fire-muzzle.png`, 700);
  // Force hit flash lean on nearest grunt
  await page.evaluate(() => {
    const g = window.__swarm.game;
    for (const e of g.enemies) { e.hit = 0.14; e.hp = Math.max(1, e.hp - 1); }
  });
  await new Promise((r) => setTimeout(r, 120));
  await page.screenshot({ path: join(SHOT_DIR, `${label}-02-hit-lean.png`), type: 'png', fullPage: false });
  // Kill one grunt via low hp + damage path presentation (logic kill)
  await page.evaluate(() => {
    const g = window.__swarm.game;
    const e = g.enemies[0];
    if (e) { e.hp = 0.01; e.hit = 0.1; }
    // Emit a synthetic kill through game if available — else force _kill
    if (typeof g._kill === 'function' && e) {
      const events = [];
      const idx = g.enemies.indexOf(e);
      g._kill(e, idx, events);
      // Mirror main presentation by pushing into last step? Prefer natural: set hp 0 next step
    }
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: join(SHOT_DIR, `${label}-03-after-kill.png`), type: 'png', fullPage: false });
  const feelOn = await page.evaluate(() => {
    try {
      const q = new URLSearchParams(location.search);
      const v = q.get('feelProto') || q.get('feel');
      if (v === '0' || v === 'false' || v === 'off') return false;
      return true; // default ON
    } catch (_) { return true; }
  });
  await page.close();
  return { label, meta, feelOn, errs: errs.slice(0, 8), consoleHits: consoleHits.slice(0, 8) };
}

async function main() {
  if (!existsSync(CHROME)) {
    writeFileSync(join(SHOT_DIR, 'NOTE.txt'), `Chrome not found at ${CHROME}; screenshots skipped.\n`);
    console.error('NO_CHROME', CHROME);
    process.exit(2);
  }
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl',
      '--ignore-gpu-blocklist', '--window-size=390,844',
    ],
  });
  try {
    const off = await runVariant(browser, base, 'v=0.9.205&lang=zh&ads=0&feelProto=0', 'before');
    const on = await runVariant(browser, base, 'v=0.9.205&lang=zh&ads=0', 'proto');
    const summary = {
      note: 'Box SwiftShader renders — NOT Android verification',
      before: off,
      proto: on,
      shots: [
        'before-01-fire-muzzle.png', 'before-02-hit-lean.png', 'before-03-after-kill.png',
        'proto-01-fire-muzzle.png', 'proto-02-hit-lean.png', 'proto-03-after-kill.png',
      ],
    };
    writeFileSync(join(SHOT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
    if (off.errs.length || on.errs.length) {
      console.error('PAGE_ERRORS', { off: off.errs, on: on.errs });
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
