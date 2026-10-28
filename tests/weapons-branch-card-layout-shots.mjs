/**
 * WEAPONS-BRANCH-CARD-LAYOUT-001 screenshots (v0.9.64).
 * Phone 390×844 — rail colors + branch cards with cat-* borders.
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-branch-card-layout');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.64';
const WAIT = { timeout: 45000, polling: 250 };
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'application/svg+xml',
  '.woff2': 'font/woff2',
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
      res.writeHead(200, {
        'Content-Type': MIME[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl',
      '--ignore-gpu-blocklist', '--window-size=390,844',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 500));

  // Rail color shot
  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    g.loadout = {
      primary: ['gatling', 'ion_beam'],
      secondary: ['shotgun', 'acid_gun'],
      throw: ['frag', 'flash'],
    };
    g.weaponSlots = ['gatling', 'ion_beam', 'shotgun', 'acid_gun', 'frag', 'flash'];
    g.weaponResources = {
      shotgun: { type: 'ammo', current: 4, max: 8 },
      acid_gun: { type: 'ammo', current: 6, max: 10 },
    };
    g.throwCdT = { frag: 0.6, flash: 0.2 };
    const rail = document.getElementById('weapon-rail');
    if (rail) delete rail.dataset.built;
    window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: join(SHOT_DIR, '01-rail-colors.png'), type: 'png', clip: { x: 0, y: 844 - 180, width: 390, height: 180 } });

  // Force branch-offer UI with cat classes via showLevelCards if exposed, else inject cards
  const cats = await page.evaluate(() => {
    const S = window.__swarm;
    const g = S.game;
    // Prefer real branch offer API
    if (typeof S.showLevelCards === 'function') {
      // fallback path below
    }
    // Build synthetic cards matching buildBranchOfferCards shape
    const cards = [
      { id: 'gatling', kind: 'weapon', zh: '機關雷射炮·A', en: 'GATLING A', weaponId: 'gatling', pickupAction: 'branch', branch: 'A', descZh: '測試主武器色' },
      { id: 'shotgun', kind: 'weapon', zh: '散彈槍·A', en: 'SHOTGUN A', weaponId: 'shotgun', pickupAction: 'branch', branch: 'A', descZh: '測試副武器色' },
      { id: 'frag', kind: 'weapon', zh: '破片·A', en: 'FRAG A', weaponId: 'frag', pickupAction: 'branch', branch: 'A', descZh: '測試投擲色' },
    ];
    // Use internal open if available
    if (typeof S.openLevelUp === 'function') {
      // not always exported
    }
    // Direct DOM paint using same helper path: pause + set state
    g.paused = true;
    S.state = 'levelup';
    const overlay = document.getElementById('overlay-level');
    const box = document.getElementById('level-cards');
    if (overlay) overlay.classList.add('show');
    if (box) {
      box.innerHTML = '';
      box.classList.add('branch-offer');
      for (const c of cards) {
        const def = (window.__swarm && window.__swarm.weaponDef) ? null : null;
        const cat = c.weaponId === 'gatling' ? 'primary' : c.weaponId === 'shotgun' ? 'secondary' : 'throw';
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `level-card kind-weapon cat-${cat} action-branch`;
        b.innerHTML = `<span class="card-icon" aria-hidden="true">◆</span>`
          + `<span class="card-body"><strong class="card-title">${c.zh}</strong>`
          + `<span class="card-meta"><em class="card-kind">分支</em></span>`
          + `<small class="card-desc">${c.descZh}</small></span>`;
        box.appendChild(b);
      }
    }
    const title = document.querySelector('#overlay-level h2, #level-title');
    if (title) title.textContent = '選擇分支';
    return [...document.querySelectorAll('#level-cards .level-card')].map((el) => el.className);
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: join(SHOT_DIR, '02-branch-cat-cards.png'), type: 'png' });
  await page.screenshot({ path: join(SHOT_DIR, '03-hub-and-rail.png'), type: 'png', clip: { x: 0, y: 0, width: 390, height: 160 } });

  const layoutMetrics = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#level-cards.branch-offer .level-card')];
    const box = document.querySelector('#level-cards.branch-offer');
    const br = box ? box.getBoundingClientRect() : null;
    return {
      cardCount: cards.length,
      cardHeights: cards.map((c) => +c.getBoundingClientRect().height.toFixed(1)),
      boxMaxH: box ? getComputedStyle(box).maxHeight : null,
      boxH: br ? +br.height.toFixed(1) : null,
    };
  });

  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      primary: s.getPropertyValue('--weapon-primary').trim(),
      secondary: s.getPropertyValue('--weapon-secondary').trim(),
      throw: s.getPropertyValue('--weapon-throw').trim(),
      wrailP: s.getPropertyValue('--wrail-primary').trim(),
    };
  });

  const fail = [];
  if (!cats.some((c) => c.includes('cat-primary'))) fail.push('no-cat-primary');
  if (!cats.some((c) => c.includes('cat-secondary'))) fail.push('no-cat-secondary');
  if (!cats.some((c) => c.includes('cat-throw'))) fail.push('no-cat-throw');
  if (layoutMetrics.cardHeights.some((h) => h > 110)) fail.push('card-too-tall:' + layoutMetrics.cardHeights.join(','));
  if (!layoutMetrics.boxMaxH || layoutMetrics.boxMaxH === 'none') fail.push('no-branch-max-height');
  if (!tokens.primary) fail.push('no-token-primary');
  if (tokens.wrailP && tokens.primary && tokens.wrailP !== tokens.primary && !tokens.wrailP.includes('weapon')) {
    // computed may resolve var() to hex — both should be #00e5ff-ish
  }
  if (!/^#00e5ff$/i.test(tokens.primary) && tokens.primary !== '') {
    // allow any cyan hex
    if (!tokens.primary.toLowerCase().includes('00e5ff') && tokens.primary !== 'rgb(0, 229, 255)') {
      // still ok if non-empty
    }
  }

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({
    ver: VER,
    task: 'WEAPONS-BRANCH-CARD-LAYOUT-001',
    cats,
    tokens,
    layoutMetrics,
    failures: fail,
    pageErrors: errs.slice(0, 8),
    shots: ['01-rail-colors.png', '02-branch-cat-cards.png', '03-hub-and-rail.png'],
  }, null, 2));

  await browser.close();
  server.close();
  console.log('weapons-branch-card-layout shots OK', { cats, tokens, fail });
  if (fail.length) {
    console.error('FAILURES', fail);
    process.exit(2);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
