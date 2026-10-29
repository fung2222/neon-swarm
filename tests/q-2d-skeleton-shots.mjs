/**
 * Q-2D-SKELETON-DEMO combat screenshot (SwiftShader).
 * Run: node tests/q-2d-skeleton-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'q-2d-skeleton');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.203';
const WAIT = { timeout: 60000, polling: 250 };

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
  '.glb': 'model/gltf-binary',
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
  const pageErrors = [];
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader-webgl',
      '--window-size=1280,800',
    ],
    defaultViewport: { width: 1280, height: 800 },
  });
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') pageErrors.push('console:' + msg.text());
    });
    await page.goto(`${base}/index.html?v=${VER}&lang=en`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__swarm && (window.__swarm.ready || window.__swarm.state === 'menu' || window.__swarm.game), WAIT);
    await new Promise((r) => setTimeout(r, 1000));

    // Start run
    await page.evaluate(() => {
      const btn = document.getElementById('btn-play');
      if (btn) btn.click();
      else if (window.__swarm && typeof window.__swarm.startRun === 'function') window.__swarm.startRun();
    });
    await page.waitForFunction(() => {
      const s = window.__swarm;
      if (!s) return false;
      if (s.state === 'run' || s.state === 'playing') return true;
      if (s.game && s.game.alive) return true;
      const hud = document.getElementById('hud');
      return hud && !hud.classList.contains('hidden');
    }, WAIT);
    await new Promise((r) => setTimeout(r, 600));

    // Probe puppet flags + nudge motion
    const info = await page.evaluate(() => {
      const s = window.__swarm;
      const view = s && (s.view || s.View || (s.game && s.game.view));
      let player = null;
      if (view && view.player) player = view.player;
      else if (s && s.player) player = s.player;
      // walk the scene graph for puppet
      let found = null;
      const stage = view && view.stage;
      const root = (view && view.group) || (stage && stage.scene);
      if (root && root.traverse) {
        root.traverse((o) => {
          if (o.userData && o.userData.isPuppet2d) found = o;
        });
      }
      if (!found && player && player.userData) found = player;
      const ud = found && found.userData;
      return {
        hasPlayer: !!player,
        isPuppet2d: !!(ud && ud.isPuppet2d),
        mechId: ud && ud.mechId,
        state: ud && ud.playerState,
        swarmState: s && s.state,
      };
    });
    console.log('puppet probe', info);

    // Simulate movement + fire for a few frames
    await page.evaluate(() => {
      const g = window.__swarm && window.__swarm.game;
      if (g) {
        g.vx = 2.2;
        g.vz = 1.1;
        g.aimHold = 1;
        g.visualAimX = 1;
        g.visualAimZ = 0;
      }
    });
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: join(SHOT_DIR, 'combat-walk-1280x800.png'), type: 'png' });

    await page.evaluate(() => {
      const g = window.__swarm && window.__swarm.game;
      if (g) {
        g.vx = 0;
        g.vz = 0;
        g.aimHold = 1;
        // poke fire kick via common fields
        if (g.fireKick != null) g.fireKick = 1;
        if (g.muzzleKick != null) g.muzzleKick = 1;
      }
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: join(SHOT_DIR, 'combat-attack-1280x800.png'), type: 'png' });

    // idle
    await page.evaluate(() => {
      const g = window.__swarm && window.__swarm.game;
      if (g) {
        g.vx = 0; g.vz = 0; g.aimHold = 0;
      }
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'combat-idle-1280x800.png'), type: 'png' });

    const critical = pageErrors.filter((e) => !/favicon|AudioContext|resizeobserver/i.test(e));
    if (critical.length) {
      console.warn('page errors (non-fatal log):', critical.slice(0, 8));
    }
    if (!info.isPuppet2d) {
      console.warn('WARN: isPuppet2d not detected via probe — check __swarm shape; screenshots still saved');
    }
    console.log('shots written to', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
