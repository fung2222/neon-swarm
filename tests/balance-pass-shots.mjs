/**
 * BALANCE-PASS-001 screenshots (v0.9.124)
 */
import { createServer } from 'http';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SHOT_DIR = join(__dirname, 'screenshots', 'balance-pass');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const VER = '0.9.124';
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

  const probe = await page.evaluate(async () => {
    const mod = await import('./js/weapons.js');
    const cats = {};
    for (const id of ['gatling', 'ion_beam', 'tracking_bomb', 'vulcan', 'zero_laser']) {
      cats[id] = { hit: mod.WEAPON_CATALOG[id].base.hit, cd: mod.WEAPON_CATALOG[id].base.cd };
    }
    const stacked = {
      ionAU1: mod.branchStatMods('ion_beam', 'A', 'U1').dmgMul,
      gatBU1: mod.branchStatMods('gatling', 'B', 'U1').dmgMul,
      vulCU1: mod.branchStatMods('vulcan', 'C', 'U1').dmgMul,
    };
    // Show home for evidence shot
    document.body.classList.add('in-menu');
    for (const k of ['start', 'pause', 'over', 'level', 'gfx']) {
      const e = document.getElementById('screen-' + k);
      if (!e) continue;
      const on = k === 'start';
      e.classList.toggle('hidden', !on);
      if (on) e.style.removeProperty('display');
      else e.style.setProperty('display', 'none', 'important');
    }
    return { cats, stacked, ship: 'BALANCE-PASS-001' };
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-home-balance-pass.png'), type: 'png' });

  const fail = [];
  if (probe.cats.gatling.hit !== 0.95) fail.push('gatling');
  if (probe.cats.ion_beam.hit !== 3.3) fail.push('ion');
  if (probe.stacked.ionAU1 >= 1.38 * 1.22) fail.push('ion stack');
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, probe, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail); process.exit(1); }
  console.log('balance-pass-shots.mjs: PASS', probe.cats, probe.stacked);
}
main().catch((e) => { console.error(e); process.exit(1); });
