/**
 * WEAPONS-ICON-PLACEHOLDERS-001 screenshots (v0.9.57).
 * Run: node tests/weapons-icon-placeholders-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-icon-placeholders');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.57';
const WAIT = { timeout: 45000, polling: 250 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'application/svg+xml',
  '.woff2': 'font/woff2',
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

async function main() {
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
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 400));

  const meta = await page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    g.loadout = {
      primary: ['gatling', 'vulcan'],
      secondary: ['acid_gun', 'shotgun'],
      throw: ['frag', null],
    };
    g.weaponSlots = ['gatling', 'vulcan', 'acid_gun', 'shotgun', 'frag', null];
    g.weaponBranches = { gatling: 'A' };
    g.fireMode = 'primary';
    const rail = document.getElementById('weapon-rail');
    if (rail) delete rail.dataset.built;
    window.__swarm.syncWeaponHud();
    return {
      hasIconSrc: !!(window.__swarm.WEAPON_ICON_SRC && window.__swarm.WEAPON_ICON_SRC.gatling),
      svgCount: document.querySelectorAll('#weapon-rail .wico-svg').length,
      statusHasSvg: !!document.querySelector('#wstat-ico .wico-svg'),
      emptyCount: document.querySelectorAll('#weapon-rail .wrail-tile.empty').length,
      filledCount: document.querySelectorAll('#weapon-rail .wrail-tile:not(.empty)').length,
      emojiLeft: [...document.querySelectorAll('#weapon-rail .wslot-ico')].some((el) => {
        const t = el.textContent || '';
        return /[⚡═🚀☢❄☣✴🕸🛸◉💣✦◎]/.test(t) && !el.querySelector('svg');
      }),
    };
  });

  await page.screenshot({ path: join(SHOT_DIR, '01-rail-placeholders.png'), type: 'png' });

  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'icon-strip';
    host.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#05010f;display:flex;flex-wrap:wrap;gap:8px;align-content:center;justify-content:center;padding:24px;';
    const ids = [
      'gatling', 'ion_beam', 'tracking_bomb', 'vulcan', 'zero_laser',
      'acid_gun', 'shotgun', 'slow_gun', 'attack_drone', 'blackhole',
      'frag', 'chill', 'flash', 'gravity',
    ];
    for (const id of ids) {
      const cell = document.createElement('div');
      cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;color:#7aa8b8;font:10px monospace;';
      cell.innerHTML = window.__swarm.weaponIconHtml(id, { size: 48 }) + `<span>${id}</span>`;
      host.appendChild(cell);
    }
    document.body.appendChild(host);
  });
  await page.screenshot({ path: join(SHOT_DIR, '02-catalog-14.png'), type: 'png' });
  await page.evaluate(() => document.getElementById('icon-strip')?.remove());

  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'icon-states';
    host.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#05010f;display:flex;gap:24px;align-items:center;justify-content:center;';
    host.innerHTML =
      `<div style="text-align:center;color:#7aa8b8;font:12px monospace">${window.__swarm.weaponIconHtml('ion_beam', { size: 64 })}<div>live</div></div>` +
      `<div style="text-align:center;color:#7aa8b8;font:12px monospace">${window.__swarm.weaponIconHtml('ion_beam', { size: 64, muted: true })}<div>muted</div></div>` +
      `<div style="text-align:center;color:#7aa8b8;font:12px monospace">${window.__swarm.weaponIconHtml(null, { empty: true, size: 64 })}<div>empty</div></div>`;
    document.body.appendChild(host);
  });
  await page.screenshot({ path: join(SHOT_DIR, '03-muted-empty.png'), type: 'png' });

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({
    ver: VER, task: 'WEAPONS-ICON-PLACEHOLDERS-001', meta, errs, at: new Date().toISOString(),
  }, null, 2));

  await browser.close();
  server.close();
  if (errs.length) {
    console.error('pageerrors', errs);
    process.exit(1);
  }
  if (meta.emojiLeft) {
    console.error('bare emoji still on rail', meta);
    process.exit(1);
  }
  if (meta.svgCount < 5 || !meta.statusHasSvg) {
    console.error('expected SVG tiles on rail+status', meta);
    process.exit(1);
  }
  console.log('weapons-icon-placeholders shots OK', SHOT_DIR, meta);
}

main().catch((e) => { console.error(e); process.exit(1); });
