/**
 * Real browser integration tests for neon-swarm v0.9.3 hotfix.
 * Responsive menu framing (Box3→screen projection) + prior 0.9.2 suites.
 * Run: node tests/browser-hotfix-0.9.3.mjs
 */
import assert from 'assert';
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.3';
const WAIT_OPTS = { timeout: 30000, polling: 250 };

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
    await page.goto(base + `/index.html?v=${VER}&lang=en`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT_OPTS);
    // Give WebGL / sprites a beat (SwiftShader)
    await new Promise((r) => setTimeout(r, 800));
    const result = await fn(page, { pageErrors, consoleErrs });
    return { ...result, pageErrors, consoleErrs };
  } finally {
    await browser.close();
  }
}

/** Project menuMechModel Box3 corners through the live camera → CSS pixel bounds. */
async function projectMenuMech(page) {
  return page.evaluate(async () => {
    const THREE = await import('three');
    const S = window.__swarm;
    const view = S.view;
    const cam = view.stage.camera;
    const model = view.menuMechModel;
    if (!model) return { ok: false, reason: 'no menuMechModel' };
    // Apply current menu camera framing (same as the menu frame loop) then project.
    const mc = view._menuCam || { pos: [0.15, 3.15, 5.4], lookAt: [0, 1.15, 0] };
    cam.position.set(mc.pos[0], mc.pos[1], mc.pos[2]);
    cam.lookAt(mc.lookAt[0], mc.lookAt[1], mc.lookAt[2]);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    view.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    if (box.isEmpty()) return { ok: false, reason: 'empty box' };
    const corners = [
      new THREE.Vector3(box.min.x, box.min.y, box.min.z),
      new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      new THREE.Vector3(box.min.x, box.max.y, box.min.z),
      new THREE.Vector3(box.min.x, box.max.y, box.max.z),
      new THREE.Vector3(box.max.x, box.min.y, box.min.z),
      new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      new THREE.Vector3(box.max.x, box.max.y, box.min.z),
      new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    ];
    const w = window.innerWidth;
    const h = window.innerHeight;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const ndc = [];
    for (const c of corners) {
      const v = c.clone().project(cam);
      const sx = (v.x * 0.5 + 0.5) * w;
      const sy = (-v.y * 0.5 + 0.5) * h;
      minX = Math.min(minX, sx); maxX = Math.max(maxX, sx);
      minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
      ndc.push({ x: v.x, y: v.y, z: v.z, sx, sy });
    }
    const wrap = view.menuMech;
    return {
      ok: true,
      w, h,
      minX, maxX, minY, maxY,
      width: maxX - minX,
      height: maxY - minY,
      wrapPos: wrap ? { x: wrap.position.x, y: wrap.position.y, z: wrap.position.z } : null,
      wrapScale: wrap ? wrap.scale.x : null,
      menuCam: view._menuCam || null,
      boxSize: {
        x: box.max.x - box.min.x,
        y: box.max.y - box.min.y,
        z: box.max.z - box.min.z,
      },
    };
  });
}

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (detail ? ' — ' + detail : ''));
}

const { server, base } = await startServer();
console.log('serving', base);

try {
  // ========== Desktop 1280×800: select polish + Start lock + projection ==========
  {
    const vp = { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false };
    await withPage(base, vp, async (page, logs) => {
      await page.click('.mech-card.mech-heavy');
      await new Promise((r) => setTimeout(r, 200));
      let disabled = await page.$eval('#btn-play', (el) => el.disabled || el.classList.contains('locked'));
      record('desktop: Precision → Start disabled', disabled);

      await page.click('.mech-card.mech-prototype');
      await new Promise((r) => setTimeout(r, 200));
      disabled = await page.$eval('#btn-play', (el) => el.disabled || el.classList.contains('locked'));
      record('desktop: Morph → Start disabled', disabled);

      await page.click('.mech-card.mech-horn');
      await new Promise((r) => setTimeout(r, 200));
      const enabled = await page.$eval('#btn-play', (el) => !el.disabled && !el.classList.contains('locked'));
      record('desktop: horn → Start enabled', enabled);

      const labels = await page.$eval('#btn-play', (el) => ({
        play: (el.querySelector('[data-i18n="play"]') || el.querySelector('span'))?.textContent?.trim(),
        playS: (el.querySelector('[data-i18n="playS"]') || el.querySelector('small'))?.textContent?.trim(),
      }));
      record('desktop: EN play≠playS', labels.play !== labels.playS, JSON.stringify(labels));

      const layout = await page.evaluate(() => {
        const btn = document.getElementById('btn-play').getBoundingClientRect();
        const meta = document.querySelector('.menu-meta').getBoundingClientRect();
        const title = document.querySelector('#screen-start .title').getBoundingClientRect();
        const cards = document.getElementById('mech-pick').getBoundingClientRect();
        const bodyBand = { top: 220, bottom: 560, left: 480, right: 1000 };
        const covers = (r) => !(r.bottom < bodyBand.top || r.top > bodyBand.bottom || r.right < bodyBand.left || r.left > bodyBand.right);
        return {
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
      record('desktop: title/cards/Start clear of mech body band', !layout.titleCoversBody && !layout.cardsCoversBody && !layout.btnCoversBody,
        JSON.stringify({ titleCoversBody: layout.titleCoversBody, cardsCoversBody: layout.cardsCoversBody, btnCoversBody: layout.btnCoversBody }));

      // Real WebGL projection — desktop right-column still fully on-screen
      await new Promise((r) => setTimeout(r, 400));
      const proj = await projectMenuMech(page);
      const pad = 8;
      const fullyVisible = proj.ok
        && proj.minX >= pad && proj.maxX <= proj.w - pad
        && proj.minY >= pad && proj.maxY <= proj.h - pad;
      const rightColumn = proj.ok && proj.wrapPos && proj.wrapPos.x >= 0.9;
      const midX = proj.ok ? (proj.minX + proj.maxX) / 2 : 0;
      record('desktop 1280×800: Box3 projection fully on-screen', fullyVisible,
        JSON.stringify({ minX: proj.minX, maxX: proj.maxX, minY: proj.minY, maxY: proj.maxY, wrap: proj.wrapPos }));
      record('desktop 1280×800: right-column framing (wrap.x≥0.9)', rightColumn,
        JSON.stringify({ wrap: proj.wrapPos, midX }));
      record('desktop 1280×800: model midX in right half', midX > 640,
        `midX=${midX.toFixed(1)}`);

      await page.screenshot({ path: join(SHOT_DIR, 'menu-desktop-1280x800.png'), fullPage: false });
      record('desktop menu: no pageerror', logs.pageErrors.length === 0, logs.pageErrors.join(' | '));
      return {};
    });
  }

  // ========== Mobile 390×844: projection + layout + tap/drag ==========
  {
    const vp = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: false };
    await withPage(base, vp, async (page, logs) => {
      await page.click('.mech-card.mech-horn');
      await new Promise((r) => setTimeout(r, 400));

      const proj = await projectMenuMech(page);
      const pad = 8;
      const fullyVisible = proj.ok
        && proj.minX >= pad && proj.maxX <= proj.w - pad
        && proj.minY >= pad && proj.maxY <= proj.h - pad;
      const notDesktopX = proj.ok && proj.wrapPos && Math.abs(proj.wrapPos.x ?? 99) < 0.5;
      const midX = proj.ok ? (proj.minX + proj.maxX) / 2 : 0;
      const centered = Math.abs(midX - 195) < 80;

      // UI band: title bottom / cards top — mech vertical mid should sit between them
      const ui = await page.evaluate(() => {
        const title = document.querySelector('#screen-start .title').getBoundingClientRect();
        const brand = document.querySelector('#screen-start .menu-brand')?.getBoundingClientRect();
        const cards = document.getElementById('mech-pick').getBoundingClientRect();
        const btn = document.getElementById('btn-play').getBoundingClientRect();
        const meta = document.querySelector('.menu-meta').getBoundingClientRect();
        return {
          titleBottom: title.bottom,
          brandBottom: brand ? brand.bottom : title.bottom,
          cardsTop: cards.top,
          btnTop: btn.top,
          gap: meta.top - btn.bottom,
        };
      });
      const midY = proj.ok ? (proj.minY + proj.maxY) / 2 : 0;
      // Visible band between title bottom and cards top — model should mostly live there
      // (not only fix X then sit under the card stack).
      const bandTop = ui.brandBottom ?? ui.titleBottom;
      const bandBot = ui.cardsTop;
      const overlap = proj.ok ? Math.max(0, Math.min(proj.maxY, bandBot) - Math.max(proj.minY, bandTop)) : 0;
      const modelH = proj.ok ? (proj.maxY - proj.minY) : 0;
      const mostlyInBand = modelH > 0 && overlap / modelH >= 0.5;
      const headBelowTitle = proj.ok && proj.minY >= bandTop - 12;
      const feetAboveCards = proj.ok && proj.maxY <= bandBot + 140; // pedestal may sit near card tops

      record('mobile 390×844: Box3 projection fully on-screen', fullyVisible,
        JSON.stringify({ minX: proj.minX, maxX: proj.maxX, minY: proj.minY, maxY: proj.maxY, wrap: proj.wrapPos, scale: proj.wrapScale }));
      record('mobile 390×844: not using desktop x=1.15', notDesktopX, JSON.stringify(proj.wrapPos));
      record('mobile 390×844: model horizontally centered', centered, `midX=${midX.toFixed(1)}`);
      record('mobile 390×844: mech sits in title→cards band', mostlyInBand && headBelowTitle && feetAboveCards,
        JSON.stringify({ midY, minY: proj.minY, maxY: proj.maxY, bandTop, bandBot, overlap, frac: modelH ? overlap / modelH : 0 }));
      record('mobile 390×844: Start/meta gap ≥ 2px', ui.gap >= 2, `gap=${ui.gap.toFixed(1)}`);

      await page.screenshot({ path: join(SHOT_DIR, 'menu-mobile-390x844.png'), fullPage: false });

      // Resize / orientation-style change: 390×844 → 844×390 then back
      await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true });
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
        const v = window.__swarm.view;
        if (v?.stage?.resize) v.stage.resize();
        if (v?.menuMech) v.updateMenuLayout(window.innerWidth, window.innerHeight);
      });
      await new Promise((r) => setTimeout(r, 500));
      const land = await projectMenuMech(page);
      const landOk = land.ok
        && land.minX >= pad && land.maxX <= land.w - pad
        && land.minY >= pad && land.maxY <= land.h - pad
        && Math.abs(land.wrapPos?.x ?? 99) < 0.5;
      record('mobile landscape after resize: Box3 on-screen + centered', landOk,
        JSON.stringify({ minX: land.minX, maxX: land.maxX, minY: land.minY, maxY: land.maxY, wrap: land.wrapPos }));
      await page.screenshot({ path: join(SHOT_DIR, 'menu-mobile-844x390-landscape.png'), fullPage: false });

      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: false });
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
        const v = window.__swarm.view;
        if (v?.stage?.resize) v.stage.resize();
        if (v?.menuMech) v.updateMenuLayout(window.innerWidth, window.innerHeight);
      });
      await new Promise((r) => setTimeout(r, 500));
      const back = await projectMenuMech(page);
      const backOk = back.ok
        && back.minX >= pad && back.maxX <= back.w - pad
        && back.minY >= pad && back.maxY <= back.h - pad
        && Math.abs(back.wrapPos?.x ?? 99) < 0.5;
      record('mobile portrait after re-resize: Box3 on-screen + centered', backOk,
        JSON.stringify({ minX: back.minX, maxX: back.maxX, minY: back.minY, maxY: back.maxY, wrap: back.wrapPos }));

      // Start horn run — tap/drag suite
      await page.click('#btn-play');
      await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play', WAIT_OPTS);
      await new Promise((r) => setTimeout(r, 600));

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

      const tapErrorsBefore = logs.pageErrors.length;
      await page.touchscreen.tap(200, 500);
      await new Promise((r) => setTimeout(r, 200));
      record('mobile: light tap no pageerror', logs.pageErrors.length === tapErrorsBefore, logs.pageErrors.slice(tapErrorsBefore).join(' | '));

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
      await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT_OPTS);
      await new Promise((r) => setTimeout(r, 700));

      const baked = await page.evaluate(() => {
        const ud = window.__swarm.view.player?.userData;
        return { baked: !!ud?.baked, body: !!ud?.bodyPlane, gun: !!ud?.gunPlane };
      });
      record('desktop: horn enter baked body/gun', baked.baked && baked.body && baked.gun, JSON.stringify(baked));

      const reverse = await page.evaluate(async () => {
        const S = window.__swarm;
        const g = S.game;
        g.enemies.length = 0;
        g._spawn('soldier');
        const e = g.enemies[g.enemies.length - 1];
        e.x = g.px - 4; e.z = g.pz; e.hp = 9999; e.vx = 0; e.vz = 0;
        g.moveDir(1, 0);
        const frames = [];
        for (let i = 0; i < 45; i++) {
          g.step(1 / 60);
          S.view.sync(g, 1 / 60);
          const ud = S.view.player.userData;
          frames.push({ bodyDir: ud.bodyDir, gunDir: ud.gunDir, runFrame: ud.runFrame, moving: ud.playerState });
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

      const aim = await page.evaluate(() => {
        const g = window.__swarm.game;
        g.enemies.length = 0;
        g._spawn('soldier');
        const e = g.enemies[g.enemies.length - 1];
        e.x = g.px + 5; e.z = g.pz; e.hp = 9999;
        g.taken = g.taken || {};
        g.taken.mg = 1;
        g.taken.rocket = 1;
        g.taken.grenade = 1;
        g.rocket = 1;
        g.grenade = 1;
        g.rocketT = 0;
        g.grenadeT = 0;
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
        const uniq = new Set(['n', 'e', 's', 'w'].map((d) => HORN_MUZZLE_BY_DIR[d].world.join(','))).size === 4;
        return { checks, uniq };
      });
      record('desktop: bullet spawn == muzzleWorld helper', Object.values(muzzle.checks).every((c) => c.match), JSON.stringify(muzzle.checks));
      record('desktop: per-dir muzzle worlds unique', muzzle.uniq === true);

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
console.log('screenshots:', SHOT_DIR);
if (failed.length) {
  console.log('FAILED:');
  for (const f of failed) console.log(' -', f.name, f.detail);
  process.exit(1);
}
console.log('all browser hotfix 0.9.3 tests passed');
