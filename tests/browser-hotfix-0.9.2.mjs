/**
 * Real browser integration tests for neon-swarm v0.9.2 hotfix.
 * Drives Chromium via puppeteer-core against a local static server.
 * Run: node tests/browser-hotfix-0.9.2.mjs
 */
import assert from 'assert';
import http from 'http';
import { createReadStream, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
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
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

async function withPage(base, viewport, fn) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader-webgl',
      '--window-size=' + viewport.width + ',' + viewport.height,
    ],
    defaultViewport: viewport,
  });
  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrs = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrs.push(msg.text());
  });
  try {
    await page.goto(base + '/index.html?v=0.9.2&lang=en', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', { timeout: 30000 });
    // Give WebGL / sprites a beat
    await new Promise((r) => setTimeout(r, 800));
    const result = await fn(page, { pageErrors, consoleErrs });
    return { ...result, pageErrors, consoleErrs };
  } finally {
    await browser.close();
  }
}

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (detail ? ' — ' + detail : ''));
}

const { server, base } = await startServer();
console.log('serving', base);

try {
  // ========== Desktop 1280×800: select polish + Start lock ==========
  {
    const vp = { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false };
    await withPage(base, vp, async (page, logs) => {
      // Precision (heavy) → Start disabled
      await page.click('.mech-card.mech-heavy');
      await new Promise((r) => setTimeout(r, 200));
      let disabled = await page.$eval('#btn-play', (el) => el.disabled || el.classList.contains('locked'));
      record('desktop: Precision → Start disabled', disabled);

      // Morph (prototype) → still disabled
      await page.click('.mech-card.mech-prototype');
      await new Promise((r) => setTimeout(r, 200));
      disabled = await page.$eval('#btn-play', (el) => el.disabled || el.classList.contains('locked'));
      record('desktop: Morph → Start disabled', disabled);

      // horn again → enabled
      await page.click('.mech-card.mech-horn');
      await new Promise((r) => setTimeout(r, 200));
      const enabled = await page.$eval('#btn-play', (el) => !el.disabled && !el.classList.contains('locked'));
      record('desktop: horn → Start enabled', enabled);

      // EN play / playS dedupe
      const labels = await page.$eval('#btn-play', (el) => ({
        play: (el.querySelector('[data-i18n="play"]') || el.querySelector('span'))?.textContent?.trim(),
        playS: (el.querySelector('[data-i18n="playS"]') || el.querySelector('small'))?.textContent?.trim(),
      }));
      record('desktop: EN play≠playS', labels.play !== labels.playS, JSON.stringify(labels));

      // Layout: Start button and menu-meta should not overlap heavily
      const layout = await page.evaluate(() => {
        const btn = document.getElementById('btn-play').getBoundingClientRect();
        const meta = document.querySelector('.menu-meta').getBoundingClientRect();
        const title = document.querySelector('#screen-start .title').getBoundingClientRect();
        const cards = document.getElementById('mech-pick').getBoundingClientRect();
        // Approximate mech body band (center of viewport)
        const bodyBand = { top: 220, bottom: 560, left: 480, right: 1000 };
        const covers = (r) => !(r.bottom < bodyBand.top || r.top > bodyBand.bottom || r.right < bodyBand.left || r.left > bodyBand.right);
        return {
          btnBottom: btn.bottom,
          metaTop: meta.top,
          gap: meta.top - btn.bottom,
          titleCoversBody: covers(title) && title.height > 40,
          cardsCoversBody: covers(cards) && cards.left > 400,
          btnCoversBody: covers(btn) && btn.left > 400,
          menuHidden: {
            doctor: !window.__swarm.view.doctor?.visible,
            enemies: !window.__swarm.view.enemyG?.visible,
            player: !window.__swarm.view.player?.visible,
            menuMech: !!window.__swarm.view.menuMech,
            lights: !!(window.__swarm.view._menuLights && window.__swarm.view._menuLights.length),
          },
        };
      });
      record('desktop 1280×800: Start/meta gap ≥ 4px', layout.gap >= 4, `gap=${layout.gap.toFixed(1)}`);
      record('desktop: menu hides doctor/enemies/player', layout.menuHidden.doctor && layout.menuHidden.enemies && layout.menuHidden.player, JSON.stringify(layout.menuHidden));
      record('desktop: menu mech + key/fill/rim lights present', layout.menuHidden.menuMech && layout.menuHidden.lights, JSON.stringify(layout.menuHidden));
      // Title/cards on left column should not sit on mech body band (x>480)
      record('desktop: title/cards/Start clear of mech body band', !layout.titleCoversBody && !layout.cardsCoversBody && !layout.btnCoversBody,
        JSON.stringify({ titleCoversBody: layout.titleCoversBody, cardsCoversBody: layout.cardsCoversBody, btnCoversBody: layout.btnCoversBody }));

      record('desktop menu: no pageerror', logs.pageErrors.length === 0, logs.pageErrors.join(' | '));
      return {};
    });
  }

  // ========== Mobile 390×844 touch layout + tap/drag ==========
  {
    const vp = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: false };
    await withPage(base, vp, async (page, logs) => {
      const layout = await page.evaluate(() => {
        const btn = document.getElementById('btn-play').getBoundingClientRect();
        const meta = document.querySelector('.menu-meta').getBoundingClientRect();
        const title = document.querySelector('#screen-start .title').getBoundingClientRect();
        const cards = document.getElementById('mech-pick').getBoundingClientRect();
        // Torso band roughly mid-screen
        const mid = { top: 280, bottom: 520 };
        const overlapsMid = (r) => r.top < mid.bottom && r.bottom > mid.top && r.height > 30;
        return {
          gap: meta.top - btn.bottom,
          titleBottom: title.bottom,
          cardsTop: cards.top,
          btnTop: btn.top,
          titleInMid: overlapsMid(title),
          cardsInMid: overlapsMid(cards),
          btnInMid: overlapsMid(btn),
        };
      });
      record('mobile 390×844: Start/meta gap ≥ 2px', layout.gap >= 2, `gap=${layout.gap.toFixed(1)}`);
      record('mobile 390×844: title above torso band', layout.titleBottom <= 300 || !layout.titleInMid, `titleBottom=${layout.titleBottom}`);
      record('mobile 390×844: Start below torso band', layout.btnTop >= 500 || !layout.btnInMid, `btnTop=${layout.btnTop}`);

      // Start horn run
      await page.click('.mech-card.mech-horn');
      await page.click('#btn-play');
      await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play', { timeout: 20000 });
      await new Promise((r) => setTimeout(r, 600));

      // Horn enter uses baked body/gun layers
      const baked = await page.evaluate(() => {
        const p = window.__swarm.view.player;
        const ud = p && p.userData;
        return {
          baked: !!(ud && ud.baked),
          body: !!(ud && ud.bodyMat && ud.bodyMat.map),
          gun: !!(ud && ud.gunMat && ud.gunMat.map),
          layers: !!(ud && ud.bodyPlane && ud.gunPlane),
        };
      });
      record('mobile: horn enter baked body/gun layers', baked.baked && baked.body && baked.gun && baked.layers, JSON.stringify(baked));

      // Light tap — must not throw this.h.tap
      const tapErrorsBefore = logs.pageErrors.length;
      await page.touchscreen.tap(200, 500);
      await new Promise((r) => setTimeout(r, 200));
      record('mobile: light tap no pageerror', logs.pageErrors.length === tapErrorsBefore, logs.pageErrors.slice(tapErrorsBefore).join(' | '));

      // Press-drag stick
      const cdp = await page.createCDPSession();
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: 180, y: 600, id: 1 }],
      });
      await new Promise((r) => setTimeout(r, 50));
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 260, y: 600, id: 1 }],
      });
      await new Promise((r) => setTimeout(r, 80));
      const during = await page.evaluate(() => ({
        active: window.__swarm.stick.active,
        dx: window.__swarm.stick.dx,
        dy: window.__swarm.stick.dy,
      }));
      record('mobile: drag stick.active===true', during.active === true, JSON.stringify(during));
      record('mobile: drag direction values change', Math.abs(during.dx) > 0.05 || Math.abs(during.dy) > 0.05, JSON.stringify(during));

      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await new Promise((r) => setTimeout(r, 80));
      const after = await page.evaluate(() => ({
        active: window.__swarm.stick.active,
        dx: window.__swarm.stick.dx,
        dy: window.__swarm.stick.dy,
      }));
      record('mobile: release stick returns to zero', after.active === false && after.dx === 0 && after.dy === 0, JSON.stringify(after));
      record('mobile play: no pageerror', logs.pageErrors.length === 0, logs.pageErrors.join(' | '));
      return {};
    });
  }

  // ========== Desktop play: reverse aim + visualAim + muzzle ==========
  {
    const vp = { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false };
    await withPage(base, vp, async (page, logs) => {
      await page.click('.mech-card.mech-horn');
      await page.click('#btn-play');
      await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, { timeout: 20000 });
      await new Promise((r) => setTimeout(r, 700));

      const baked = await page.evaluate(() => {
        const ud = window.__swarm.view.player?.userData;
        return { baked: !!ud?.baked, body: !!ud?.bodyPlane, gun: !!ud?.gunPlane };
      });
      record('desktop: horn enter baked body/gun', baked.baked && baked.body && baked.gun, JSON.stringify(baked));

      // Run right + aim left → bodyDir=e, gunDir=w, run frame advances
      const reverse = await page.evaluate(async () => {
        const S = window.__swarm;
        const g = S.game;
        g.enemies.length = 0;
        // Place foe to the WEST so primary aims left (−X)
        g._spawn('soldier');
        const e = g.enemies[g.enemies.length - 1];
        e.x = g.px - 4; e.z = g.pz; e.hp = 9999; e.vx = 0; e.vz = 0;
        // Force move east
        g.moveDir(1, 0);
        const frames = [];
        let lastRun = -1;
        for (let i = 0; i < 45; i++) {
          g.step(1 / 60);
          S.view.sync(g, 1 / 60);
          const ud = S.view.player.userData;
          frames.push({ bodyDir: ud.bodyDir, gunDir: ud.gunDir, runFrame: ud.runFrame, moving: ud.playerState });
          if (ud.runFrame !== lastRun && lastRun >= 0) {/* advanced */}
          lastRun = ud.runFrame;
        }
        const mid = frames[Math.floor(frames.length / 2)];
        const runSet = new Set(frames.map((f) => f.runFrame));
        return {
          bodyDir: mid.bodyDir,
          gunDir: mid.gunDir,
          runAdvanced: runSet.size >= 2,
          sample: mid,
        };
      });
      record('desktop: run right + aim left bodyDir=e', reverse.bodyDir === 'e', JSON.stringify(reverse.sample));
      record('desktop: run right + aim left gunDir=w', reverse.gunDir === 'w', JSON.stringify(reverse.sample));
      record('desktop: run frame advances', reverse.runAdvanced, JSON.stringify(reverse));

      // Same frame MG+rocket+grenade → visualAim not overwritten by secondaries
      const aim = await page.evaluate(() => {
        const g = window.__swarm.game;
        g.enemies.length = 0;
        g._spawn('soldier');
        const e = g.enemies[g.enemies.length - 1];
        e.x = g.px + 5; e.z = g.pz; e.hp = 9999; // east
        g.taken = g.taken || {};
        g.taken.mg = 1;
        g.taken.rocket = 1;
        g.taken.grenade = 1;
        g.rocket = 1;
        g.grenade = 1;
        g.rocketT = 0;
        g.grenadeT = 0;
        // Seed visual aim north first
        g.visualAimX = 0; g.visualAimZ = 1;
        const events = [];
        g._fireMg(events);
        const afterMg = { x: g.visualAimX, z: g.visualAimZ };
        g._fireRocket(events);
        const afterRocket = { x: g.visualAimX, z: g.visualAimZ };
        g._fireGrenade(events);
        const afterGrenade = { x: g.visualAimX, z: g.visualAimZ };
        const fireEv = events.filter((ev) => ev.type === 'fire');
        const weapons = fireEv.map((ev) => ev.weapon);
        // visualAim should match primary (mg) east aim, not flipped by grenade/rocket
        const primary = fireEv.find((ev) => ev.weapon === 'mg');
        return {
          weapons,
          afterMg, afterRocket, afterGrenade,
          visualMatchesPrimary: primary
            && Math.abs(g.visualAimX - primary.aimX) < 1e-6
            && Math.abs(g.visualAimZ - primary.aimZ) < 1e-6,
          rocketUpdate: fireEv.find((ev) => ev.weapon === 'rocket')?.updateVisual === false,
          grenadeUpdate: fireEv.find((ev) => ev.weapon === 'grenade')?.updateVisual === false,
          muzzleShared: primary && primary.muzzleX != null,
        };
      });
      record('desktop: same-frame multi-weapon fires', (aim.weapons || []).length >= 2, JSON.stringify(aim.weapons));
      record('desktop: visualAim not overwritten by secondaries', aim.visualMatchesPrimary === true
        && aim.afterMg.x === aim.afterRocket.x && aim.afterRocket.x === aim.afterGrenade.x, JSON.stringify(aim));
      record('desktop: rocket/grenade updateVisual false', aim.rocketUpdate && aim.grenadeUpdate, JSON.stringify(aim));

      // Muzzle N/E/S/W + diagonal via shared helper path on bullets
      const muzzle = await page.evaluate(async () => {
        const { muzzleWorld, HORN_MUZZLE_BY_DIR } = await import('./js/muzzle.js');
        const g = window.__swarm.game;
        const checks = {};
        for (const [name, aim] of [['n', [0, 1]], ['e', [1, 0]], ['s', [0, -1]], ['w', [-1, 0]], ['diag', [0.7, 0.7]]]) {
          g.bullets.length = 0;
          const b = g._emitBullet(aim[0], aim[1], { weapon: 'mg' });
          const mw = muzzleWorld(g.px, g.pz, aim[0], aim[1]);
          checks[name] = {
            match: Math.abs(b.x - mw.x) < 1e-9 && Math.abs(b.z - mw.z) < 1e-9 && Math.abs(b.y - mw.y) < 1e-9,
            dir: mw.dir,
            bullet: [b.x, b.y, b.z],
            helper: [mw.x, mw.y, mw.z],
          };
        }
        // uniqueness of cardinal worlds
        const uniq = new Set(['n', 'e', 's', 'w'].map((d) => HORN_MUZZLE_BY_DIR[d].world.join(','))).size === 4;
        return { checks, uniq };
      });
      record('desktop: bullet spawn == muzzleWorld helper', Object.values(muzzle.checks).every((c) => c.match), JSON.stringify(muzzle.checks));
      record('desktop: per-dir muzzle worlds unique', muzzle.uniq === true);

      // Move-while-firing muzzle follows player
      const moveFire = await page.evaluate(async () => {
        const { muzzleWorld } = await import('./js/muzzle.js');
        const g = window.__swarm.game;
        g.px = 2.5; g.pz = -1.5;
        g.bullets.length = 0;
        const b = g._emitBullet(0, 1, { weapon: 'mg' });
        const mw = muzzleWorld(2.5, -1.5, 0, 1);
        return Math.abs(b.x - mw.x) < 1e-9 && Math.abs(b.z - mw.z) < 1e-9;
      });
      record('desktop: move-while-firing muzzle follows player', moveFire === true);

      record('desktop play: no pageerror', logs.pageErrors.length === 0, logs.pageErrors.join(' | '));
      return {};
    });
  }
} finally {
  server.close();
}

const failed = results.filter((r) => !r.pass);
console.log('\n==== SUMMARY ====');
console.log('passed', results.filter((r) => r.pass).length, '/', results.length);
if (failed.length) {
  console.log('FAILED:');
  for (const f of failed) console.log(' -', f.name, f.detail);
  process.exit(1);
}
console.log('all browser hotfix tests passed');
