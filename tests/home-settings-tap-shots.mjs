/**
 * HOME-SETTINGS-TAP-001 screenshots (v0.9.70) — measure gear + settings controls on phone.
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'home-settings-tap');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.70';
const WAIT = { timeout: 45000, polling: 250 };
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'application/svg+xml', '.woff2': 'font/woff2',
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
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

function box(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, id: el.id || el.className };
}

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl', '--ignore-gpu-blocklist', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await new Promise((r) => setTimeout(r, 200));

  const homeProbe = await page.evaluate(() => {
    const gear = document.querySelector('#btn-settings-home, .menu-settings');
    const howto = document.querySelector('#btn-howto, .menu-howto');
    const measure = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
        minW: cs.minWidth, minH: cs.minHeight,
        id: el.id || '', cls: el.className,
      };
    };
    return { gear: measure(gear), howto: measure(howto) };
  });
  await page.screenshot({ path: join(SHOT_DIR, '01-home-gear.png'), type: 'png' });

  // Open settings
  await page.evaluate(() => {
    const gear = document.querySelector('#btn-settings-home, .menu-settings');
    if (gear) gear.click();
  });
  await page.waitForFunction(() => document.querySelector('.ck-settings:not(.hidden), .ck-settings .ck-settings-panel'), WAIT).catch(() => {});
  await new Promise((r) => setTimeout(r, 200));

  const setProbe = await page.evaluate(() => {
    const measure = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, tag: el.tagName, cls: el.className };
    };
    const rows = [...document.querySelectorAll('.ck-set-row')].map(measure);
    const toggles = [...document.querySelectorAll('.ck-toggle')].map(measure);
    const segs = [...document.querySelectorAll('.ck-seg button')].map(measure);
    const visible = !!document.querySelector('.ck-settings') &&
      getComputedStyle(document.querySelector('.ck-settings')).display !== 'none';
    return { rows, toggles, segs, visible };
  });
  await page.screenshot({ path: join(SHOT_DIR, '02-settings-rows.png'), type: 'png' });

  const fail = [];
  if (!homeProbe.gear) fail.push('no-gear');
  else {
    if (homeProbe.gear.w < 43.5) fail.push('gear-w:' + homeProbe.gear.w);
    if (homeProbe.gear.h < 43.5) fail.push('gear-h:' + homeProbe.gear.h);
  }
  if (homeProbe.howto) {
    if (homeProbe.howto.w < 43.5) fail.push('howto-w:' + homeProbe.howto.w);
    if (homeProbe.howto.h < 43.5) fail.push('howto-h:' + homeProbe.howto.h);
  }
  if (!setProbe.visible && !(setProbe.rows || []).length) fail.push('settings-not-open');
  for (const r of setProbe.rows || []) {
    if (r.h < 43.5) fail.push('row-h:' + r.h);
  }
  for (const t of setProbe.toggles || []) {
    if (t.h < 43.5) fail.push('toggle-h:' + t.h);
  }
  for (const s of setProbe.segs || []) {
    if (s.h < 43.5) fail.push('seg-h:' + s.h);
  }
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, homeProbe, setProbe, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail); process.exit(1); }
  console.log('home-settings-tap-shots.mjs: PASS', { gear: homeProbe.gear, rows: (setProbe.rows || []).length });
}
main().catch((e) => { console.error(e); process.exit(1); });
