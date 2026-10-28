/**
 * WEAPONS-BRANCH-CARD-PATH-001 screenshots (v0.9.69).
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-branch-card-path');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.69';
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
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 300));

  const probe = await page.evaluate(async () => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    // Dynamic import of weapons via already-loaded catalog: build cards manually matching shape
    const cards = [
      { id: '_branch_gatling_A', weaponId: 'gatling', branch: 'A', pickupAction: 'branch', kind: 'weapon',
        zh: 'A · 過熱連射', en: 'A · Overheat', descZh: '測試描述分支 A', descEn: 'test A', icon: '⚡', apply() {} },
      { id: '_branch_gatling_B', weaponId: 'gatling', branch: 'B', pickupAction: 'branch', kind: 'weapon',
        zh: 'B · 穿透', en: 'B · Pierce', descZh: '測試描述分支 B', descEn: 'test B', icon: '⚡', apply() {} },
      { id: '_branch_gatling_C', weaponId: 'gatling', branch: 'C', pickupAction: 'branch', kind: 'weapon',
        zh: 'C · 錐形', en: 'C · Cone', descZh: '測試描述分支 C', descEn: 'test C', icon: '⚡', apply() {} },
    ];
    window.__swarm.showLevelCards(cards, { from: 'branch' });
    await new Promise((r) => setTimeout(r, 80));
    const title = document.getElementById('level-title')?.textContent || '';
    const paths = [...document.querySelectorAll('.level-card .card-path')].map((el) => ({
      text: el.textContent, path: el.dataset.path,
      cardH: el.closest('.level-card')?.getBoundingClientRect().height,
    }));
    const box = document.getElementById('level-cards');
    return {
      title,
      paths,
      branchOffer: box?.classList.contains('branch-offer'),
      count: box?.querySelectorAll('.level-card').length || 0,
    };
  });
  await page.screenshot({ path: join(SHOT_DIR, '01-branch-path-chips.png'), type: 'png' });

  // Ult path chips
  const ultProbe = await page.evaluate(async () => {
    const cards = [
      { id: '_ult_u1', weaponId: 'gatling', branch: 'A', ult: 'U1', pickupAction: 'ult', kind: 'weapon',
        zh: 'U1 · 傷害增幅', en: 'U1 · Damage', descZh: '輕量增幅', descEn: 'light amp', icon: '⚡', apply() {} },
      { id: '_ult_u2', weaponId: 'gatling', branch: 'A', ult: 'U2', pickupAction: 'ult', kind: 'weapon',
        zh: 'U2 · 射速', en: 'U2 · Rate', descZh: '輕量增幅', descEn: 'light amp', icon: '⚡', apply() {} },
    ];
    window.__swarm.showLevelCards(cards, { from: 'ult' });
    await new Promise((r) => setTimeout(r, 80));
    const title = document.getElementById('level-title')?.textContent || '';
    const paths = [...document.querySelectorAll('.level-card .card-path')].map((el) => el.textContent);
    return { title, paths };
  });
  await page.screenshot({ path: join(SHOT_DIR, '02-ult-path-chips.png'), type: 'png' });

  const fail = [];
  if (!probe.branchOffer) fail.push('not-branch-offer');
  if (probe.count < 3) fail.push('missing-cards');
  if (!/分支|BRANCH/.test(probe.title)) fail.push('title:' + probe.title);
  if (!probe.title.includes('機關') && !probe.title.toLowerCase().includes('gatling') && !probe.title.includes('雷射')) {
    // weapon name in title — zh gatling is 機關雷射炮
    if (!/機關|雷射|Gatling|gatling/i.test(probe.title)) fail.push('title-no-weapon:' + probe.title);
  }
  const letters = (probe.paths || []).map((p) => p.text);
  if (!letters.includes('A') || !letters.includes('B')) fail.push('missing-path-letters:' + letters.join(','));
  for (const p of probe.paths || []) {
    if ((p.cardH || 0) < 80) fail.push('card-too-short:' + p.cardH);
  }
  if (!(ultProbe.paths || []).includes('U1')) fail.push('ult-no-U1');
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, probe, ultProbe, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail); process.exit(1); }
  console.log('weapons-branch-card-path-shots.mjs: PASS', { title: probe.title, letters });
}
main().catch((e) => { console.error(e); process.exit(1); });
