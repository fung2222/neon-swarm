/**
 * WEAPONS-ULT-LABELS-001 screenshots (v0.9.122)
 */
import { createServer } from 'http';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SHOT_DIR = join(__dirname, 'screenshots', 'weapons-ult-labels');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const VER = '0.9.122';
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
    const samples = [
      mod.buildUltOfferCards('gatling', 'A'),
      mod.buildUltOfferCards('ion_beam', 'B'),
      mod.buildUltOfferCards('zero_laser', 'C'),
    ];
    const level = document.getElementById('screen-level');
    document.body.classList.remove('in-menu');
    for (const k of ['start', 'pause', 'over', 'level', 'gfx']) {
      const e = document.getElementById('screen-' + k);
      if (!e) continue;
      const on = k === 'level';
      e.classList.toggle('hidden', !on);
      if (on) e.style.removeProperty('display');
      else e.style.setProperty('display', 'none', 'important');
    }
    const host = document.getElementById('level-cards') || level;
    host.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'level-cards branch-offer';
    for (const cards of samples) {
      for (const c of cards.choices) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'level-card';
        btn.innerHTML = `<div class="lc-title">${c.zh}</div><div class="lc-en">${c.en}</div><div class="lc-desc">${c.descZh}</div>`;
        wrap.appendChild(btn);
      }
    }
    host.appendChild(wrap);
    const g = samples[0].choices;
    return {
      u1en: g[0].en, u2en: g[1].en, u1zh: g[0].zh,
      hasStubLater: JSON.stringify(samples).includes('完整招式後續') || JSON.stringify(samples).includes('full kit later'),
      hasPowerAmp: JSON.stringify(g).includes('POWER AMP'),
    };
  });
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-ult-unique-labels.png'), type: 'png' });

  const fail = [];
  if (!probe.u1en.includes('OVERCLOCK BURST')) fail.push('u1en:' + probe.u1en);
  if (!probe.u2en.includes('COOLANT JET')) fail.push('u2en:' + probe.u2en);
  if (probe.hasStubLater) fail.push('stub-later');
  if (probe.hasPowerAmp) fail.push('still-POWER-AMP');
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, probe, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail); process.exit(1); }
  console.log('weapons-ult-labels-shots.mjs: PASS', probe);
}
main().catch((e) => { console.error(e); process.exit(1); });
