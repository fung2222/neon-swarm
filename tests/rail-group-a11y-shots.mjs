/**
 * RAIL-GROUP-A11Y-001 screenshots (v0.9.90) — rail groups have aria; no visible P/S/T text.
 */
import { createServer } from 'http';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SHOT_DIR = join(__dirname, 'screenshots', 'rail-group-a11y');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const VER = '0.9.90';
const WAIT = { timeout: 60000 };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.md': 'text/markdown' };

function startServer() {
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/index.html';
    const file = join(ROOT, p);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end('missing'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

async function main() {
  mkdirSync(SHOT_DIR, { recursive: true });
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
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    try { localStorage.setItem('neon-swarm-coach-v1', '1'); } catch (_) {}
    const el = document.getElementById('run-coach');
    if (el) el.classList.add('hidden');
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 200));

  const probe = await page.evaluate(() => {
    const rail = document.getElementById('weapon-rail');
    if (!rail) return { missing: true };
    const groups = [...rail.querySelectorAll('.wrail-group')];
    const aria = groups.map((g) => ({ cat: g.dataset.cat, role: g.getAttribute('role'), aria: g.getAttribute('aria-label') }));
    const visibleLabel = [...rail.querySelectorAll('.wrail-label, .wslot-name')].some((el) => {
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && (el.offsetWidth > 0 || el.offsetHeight > 0);
    });
    return { count: groups.length, aria, visibleLabel, built: rail.dataset.built || '' };
  });
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-rail-group-a11y.png'), type: 'png' });
  const fail = [];
  if (probe.missing) fail.push('rail-missing');
  if ((probe.count || 0) < 3) fail.push('groups:' + probe.count);
  const labels = (probe.aria || []).map((a) => a.aria).join('|');
  if (!/主武器/.test(labels)) fail.push('aria:' + labels);
  if (!(probe.aria || []).every((a) => a.role === 'group')) fail.push('role');
  if (probe.visibleLabel) fail.push('visible-label');
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, probe, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail, probe); process.exit(1); }
  console.log('rail-group-a11y-shots.mjs: PASS', probe);
}
main().catch((e) => { console.error(e); process.exit(1); });
