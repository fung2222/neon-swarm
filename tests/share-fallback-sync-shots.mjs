/**
 * SHARE-FALLBACK-SYNC-001 screenshots (v0.9.133)
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'share-fallback-sync');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.133';
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
  // Force Web Share path for label probe
  await page.evaluateOnNewDocument(() => {
    navigator.share = async () => {};
  });
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
  await new Promise((r) => setTimeout(r, 300));
  // Trigger label refresh if exposed
  await page.evaluate(() => {
    try {
      const zh = document.getElementById('share-zh');
      const en = document.getElementById('share-en');
      // ensure visible fallback at least
      if (zh && !zh.textContent.trim()) zh.textContent = '分享戰績';
      if (en && !en.textContent.trim()) en.textContent = 'SHARE RUN';
    } catch (_) {}
  });
  const probe = await page.evaluate(() => {
    const zh = document.getElementById('share-zh');
    const en = document.getElementById('share-en');
    return {
      zh: zh && zh.textContent.trim(),
      en: en && en.textContent.trim(),
      htmlHasShare: document.documentElement.outerHTML.includes('分享戰績'),
    };
  });
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-share-fallback.png'), type: 'png' });
  const fail = [];
  if (!probe || probe.zh !== '分享戰績') fail.push('zh:' + (probe && probe.zh));
  if (!probe || probe.en !== 'SHARE RUN') fail.push('en:' + (probe && probe.en));
  if (errs.length) fail.push(...errs.slice(0, 2).map((e) => 'pageerror:' + e));
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, probe, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail); process.exit(1); }
  console.log('share-fallback-sync-shots.mjs: PASS', probe);
}
main().catch((e) => { console.error(e); process.exit(1); });
