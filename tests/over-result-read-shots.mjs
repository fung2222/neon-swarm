/**
 * OVER-RESULT-READ-001 screenshots (v0.9.132)
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'over-result-read');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.132';
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
    const score = document.getElementById('over-score');
    const best = document.getElementById('over-best');
    const kills = document.getElementById('over-kills');
    const goals = document.getElementById('over-goals');
    if (score) score.textContent = '15022';
    if (best) best.textContent = '32763';
    if (kills) kills.textContent = '117';
    if (goals) goals.textContent = '2';
  });
  await new Promise((r) => setTimeout(r, 200));
  const probe = await page.evaluate(() => {
    const hi = document.querySelector('#screen-over .hi-line');
    const best = document.querySelector('#screen-over .result i');
    const label = document.querySelector('#screen-over .result span');
    if (!hi) return null;
    const hcs = getComputedStyle(hi);
    const bcs = best ? getComputedStyle(best) : null;
    const lcs = label ? getComputedStyle(label) : null;
    return {
      hiColor: hcs.color,
      hiFs: hcs.fontSize,
      bestColor: bcs && bcs.color,
      labelColor: lcs && lcs.color,
      killsText: hi.textContent.replace(/\s+/g, ' ').trim(),
    };
  });
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-over-result-read.png'), type: 'png' });
  const fail = [];
  if (!probe) fail.push('missing');
  else {
    if (!/255,\s*230,\s*0/.test(probe.hiColor)) fail.push('hiColor:' + probe.hiColor);
    if (probe.bestColor && !/255,\s*230,\s*0/.test(probe.bestColor)) fail.push('bestColor:' + probe.bestColor);
  }
  if (errs.length) fail.push(...errs.slice(0, 2).map((e) => 'pageerror:' + e));
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, probe, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail); process.exit(1); }
  console.log('over-result-read-shots.mjs: PASS', probe);
}
main().catch((e) => { console.error(e); process.exit(1); });
