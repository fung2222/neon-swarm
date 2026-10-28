/**
 * UI-POLISH-001 screenshots (v0.9.125)
 */
import { createServer } from 'http';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SHOT_DIR = join(__dirname, 'screenshots', 'ui-polish');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const VER = '0.9.125';
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
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-home-ui-polish.png'), type: 'png' });

  // Pause chrome
  await page.evaluate(() => {
    document.body.classList.remove('in-menu');
    for (const k of ['start', 'pause', 'over', 'level', 'gfx']) {
      const e = document.getElementById('screen-' + k);
      if (!e) continue;
      const on = k === 'pause';
      e.classList.toggle('hidden', !on);
      if (on) e.style.removeProperty('display');
      else e.style.setProperty('display', 'none', 'important');
    }
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: join(SHOT_DIR, '02-phone-pause-ui-polish.png'), type: 'png' });

  const fail = [...errs.slice(0, 3).map((e) => 'pageerror:' + e)];
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail); process.exit(1); }
  console.log('ui-polish-shots.mjs: PASS');
}
main().catch((e) => { console.error(e); process.exit(1); });
