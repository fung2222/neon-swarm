/**
 * Phase 6 drop readability screenshots (v0.9.30).
 * Run: node tests/phase6-drop-readability-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-drop-readability');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.30';
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

async function placeDrops(page, layout) {
  return page.evaluate((lay) => {
    const S = window.__swarm;
    const g = S.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.gems.length = 0;
    g.bossHazards = [];
    g.invuln = 99;
    g.px = 0; g.pz = 0;
    g.stopMove();
    // Freeze sim (no vacuum / no weapon offer) but keep gems for view sync.
    g.pendingCards = [];
    g.weaponOffer = null;
    g.pausedForLevel = true;
    // Keep drops outside pickup radius (~1.0) but in camera frame around origin.
    g.px = 0; g.pz = 0;
    const specs = {
      xp: [
        { x: -2.2, z: 1.6, kind: 'xp', xp: 2, r: 0.18, letter: 'X' },
        { x: -1.4, z: 2.4, kind: 'xp', xp: 1, r: 0.18, letter: 'X' },
        { x: -2.8, z: 2.2, kind: 'xp', xp: 3, r: 0.18, letter: 'X' },
      ],
      heal: [
        { x: 0.4, z: 2.6, kind: 'heal', xp: 0, r: 0.2, letter: 'H' },
      ],
      magnet: [
        { x: 2.0, z: 2.2, kind: 'magnet', xp: 0, r: 0.22, letter: 'M' },
      ],
      weapon: [
        { x: 2.8, z: 0.8, kind: 'weapon', xp: 0, r: 0.22, letter: 'W', weapon: 'laser', weaponIcon: '═' },
      ],
      all: null,
    };
    let list = [];
    if (lay === 'all') {
      list = [...specs.xp, ...specs.heal, ...specs.magnet, ...specs.weapon];
    } else {
      list = specs[lay] || specs.xp;
    }
    for (const d of list) {
      g.gems.push({ life: 90, pop: 0.12, ...d });
    }
    // Do NOT step — pickup would vacuum nearby gems; view syncs from gem list each frame.
    return { n: g.gems.length, kinds: g.gems.map((x) => x.kind) };
  }, layout);
}

async function shotViewport(browser, base, { width, height, name, layout }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await new Promise((r) => setTimeout(r, 350));
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 400));
  const meta = await placeDrops(page, layout);
  await new Promise((r) => setTimeout(r, 700));
  const out = join(SHOT_DIR, name);
  await page.screenshot({ path: out, type: 'png' });
  console.log('shot:', name, meta);
  if (errs.length) console.warn('pageerrors', errs.slice(0, 5));
  await page.close();
  return out;
}

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader-webgl',
      '--ignore-gpu-blocklist',
    ],
  });
  try {
    await shotViewport(browser, base, { width: 1280, height: 800, name: 'drops-all-1280x800.png', layout: 'all' });
    await shotViewport(browser, base, { width: 390, height: 844, name: 'drops-all-390x844.png', layout: 'all' });
    await shotViewport(browser, base, { width: 1280, height: 800, name: 'xp-shards-1280x800.png', layout: 'xp' });
    await shotViewport(browser, base, { width: 1280, height: 800, name: 'heal-pack-1280x800.png', layout: 'heal' });
    await shotViewport(browser, base, { width: 1280, height: 800, name: 'magnet-disc-1280x800.png', layout: 'magnet' });
    await shotViewport(browser, base, { width: 1280, height: 800, name: 'weapon-crate-1280x800.png', layout: 'weapon' });
  } finally {
    await browser.close();
    server.close();
  }
  console.log('phase6-drop-readability shots done →', SHOT_DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
