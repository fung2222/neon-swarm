/**
 * OVER-TITLE-ONELINE-001 screenshots (v0.9.127) — over title one line @390px.
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'over-title-oneline');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.127';
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

  await page.evaluate(() => {
    document.body.classList.remove('in-menu');
    for (const k of ['start', 'pause', 'over', 'level', 'gfx']) {
      const e = document.getElementById('screen-' + k);
      if (!e) continue;
      const on = k === 'over';
      e.classList.toggle('hidden', !on);
      if (on) e.style.removeProperty('display');
      else e.style.setProperty('display', 'none', 'important');
    }
  });
  await new Promise((r) => setTimeout(r, 250));

  const probe = await page.evaluate(() => {
    const el = document.getElementById('over-title');
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    // Detect wrap: clientHeight vs single-line expectation via range / scroll
    const range = document.createRange();
    range.selectNodeContents(el);
    const rr = range.getBoundingClientRect();
    return {
      text: el.textContent.trim(),
      whiteSpace: cs.whiteSpace,
      fontSize: cs.fontSize,
      letterSpacing: cs.letterSpacing,
      width: Math.round(r.width * 10) / 10,
      height: Math.round(r.height * 10) / 10,
      rangeHeight: Math.round(rr.height * 10) / 10,
      lineHeight: cs.lineHeight,
      overflow: cs.overflow,
      dataText: el.dataset.text || '',
    };
  });
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-over-title-oneline.png'), type: 'png' });

  // Narrow phone ~360 CSS px (common Android)
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 150));
  const probe360 = await page.evaluate(() => {
    const el = document.getElementById('over-title');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(el);
    const rr = range.getBoundingClientRect();
    return {
      text: el.textContent.trim(),
      height: Math.round(r.height * 10) / 10,
      rangeHeight: Math.round(rr.height * 10) / 10,
      whiteSpace: getComputedStyle(el).whiteSpace,
    };
  });
  await page.screenshot({ path: join(SHOT_DIR, '02-phone-360-over-title-oneline.png'), type: 'png' });

  const fail = [];
  if (!probe) fail.push('missing-title');
  else {
    if (probe.text !== '你已經被制止') fail.push('text:' + probe.text);
    if (probe.whiteSpace !== 'nowrap') fail.push('ws:' + probe.whiteSpace);
    // Single line: height should stay near one line (~fontSize*1.2); reject tall wrap
    if (probe.height > 56) fail.push('tall-wrap-h:' + probe.height);
    if (probe.rangeHeight > 56) fail.push('tall-range:' + probe.rangeHeight);
  }
  if (!probe360 || probe360.text !== '你已經被制止') fail.push('360-text');
  if (probe360 && probe360.whiteSpace !== 'nowrap') fail.push('360-ws');
  if (probe360 && probe360.height > 56) fail.push('360-tall:' + probe360.height);
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, probe, probe360, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail); process.exit(1); }
  console.log('over-title-oneline-shots.mjs: PASS', { probe, probe360 });
}
main().catch((e) => { console.error(e); process.exit(1); });
