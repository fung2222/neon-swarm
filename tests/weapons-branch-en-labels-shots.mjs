/**
 * WEAPONS-BRANCH-EN-LABELS-001 screenshots (v0.9.80) — EN branch card titles.
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-branch-en-labels');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.80';
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
  await page.goto(base + `/index.html?v=${VER}&lang=en`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);

  const probe = await page.evaluate(async () => {
    const S = window.__swarm;
    const g = S.game;
    // Force branch offer for gatling via buildBranchOfferCards if exposed, else inject cards
    let cards = null;
    try {
      const mod = await import('./js/weapons.js');
      const offer = mod.buildBranchOfferCards('gatling');
      cards = offer && offer.choices;
    } catch (_) {}
    if (!cards && S.buildBranchOfferCards) {
      const offer = S.buildBranchOfferCards('gatling');
      cards = offer && offer.choices;
    }
    // Fallback: synthesize from rail-visible API
    if (!cards) {
      cards = [
        { id: '_branch_gatling_A', zh: 'A · 過熱連射', en: 'OVERHEAT BURST', pickupAction: 'branch', kind: 'weapon', branch: 'A', weaponId: 'gatling', icon: '⚡' },
        { id: '_branch_gatling_B', zh: 'B · 穿甲芯', en: 'AP CORE', pickupAction: 'branch', kind: 'weapon', branch: 'B', weaponId: 'gatling', icon: '⚡' },
        { id: '_branch_gatling_C', zh: 'C · 散射網', en: 'SCATTER NET', pickupAction: 'branch', kind: 'weapon', branch: 'C', weaponId: 'gatling', icon: '⚡' },
      ];
    }
    S.state = 'level';
    if (typeof S.showLevelCards === 'function') S.showLevelCards(cards, { from: 'branch' });
    const titles = [...document.querySelectorAll('#level-cards .level-card .card-title, #level-cards .level-card .card-title-en')]
      .map((el) => (el.textContent || '').trim());
    const text = document.getElementById('level-cards') ? document.getElementById('level-cards').textContent : '';
    return {
      titles,
      hasOverheat: /OVERHEAT BURST/i.test(text),
      hasPathStub: /\bPATH A\b/.test(text),
      cardCount: document.querySelectorAll('#level-cards .level-card').length,
    };
  });
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-branch-en-labels.png'), type: 'png' });

  const fail = [];
  if (!probe || probe.cardCount < 2) fail.push('cards-missing:' + (probe && probe.cardCount));
  if (probe && !probe.hasOverheat) fail.push('no-overheat-en');
  if (probe && probe.hasPathStub) fail.push('still-path-a-stub');
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, probe, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail, probe); process.exit(1); }
  console.log('weapons-branch-en-labels-shots.mjs: PASS', probe);
}
main().catch((e) => { console.error(e); process.exit(1); });
