/**
 * Capture in-game Mixamo true-3D player screenshots.
 * Run: node tests/q-mixamo-ingame-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'q-mixamo');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.198';
const WAIT = { timeout: 90000, polling: 250 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.bin': 'application/octet-stream',
  '.webp': 'image/webp',
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
      res.writeHead(200, {
        'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
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
      '--no-sandbox',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--allow-file-access-from-files',
      '--window-size=1280,800',
    ],
  });
  const meta = { ver: VER, mixamo: null, shots: [] };
  try {
    const page = await browser.newPage();
    page.on('console', (m) => {
      const t = m.text();
      if (/q-hero|mixamo|error|Error|fail/i.test(t)) console.log('[page]', m.type(), t.slice(0, 200));
    });
    page.on('pageerror', (e) => console.error('[pageerror]', e.message));
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await page.goto(`${base}/index.html?v=${VER}&autostart=1&demo=1&debug=1&lang=zh`, {
      waitUntil: 'networkidle0',
      timeout: 90000,
    });

    // Wait for run + Mixamo (or timeout → still shot fallback)
    await page.waitForFunction(() => {
      const S = window.__swarm;
      return S && S.state === 'run' && S.game && S.view && S.view.player;
    }, WAIT).catch(() => {});

    await page.waitForFunction(() => {
      const p = window.__swarm?.view?.player;
      return p && p.userData && (p.userData.isMixamo3d === true || p.userData.isSprite === true);
    }, { timeout: 20000, polling: 250 }).catch(() => {});

    // Extra settle for GLB decode
    await new Promise((r) => setTimeout(r, 2500));

    meta.mixamo = await page.evaluate(() => {
      const p = window.__swarm?.view?.player;
      const ud = p && p.userData;
      return {
        isMixamo3d: !!(ud && ud.isMixamo3d),
        isSprite: !!(ud && ud.isSprite),
        hasMixer: !!(ud && ud.mixer),
        hasWalk: !!(ud && ud.walkAction),
        mechId: ud && ud.mechId,
      };
    });
    console.log('player', meta.mixamo);

    // Force walk briefly via demo velocities already; nudge facing
    await page.evaluate(() => {
      const S = window.__swarm;
      const g = S && S.game;
      if (g) {
        g.vx = 2.2;
        g.vz = 1.1;
        g.aimX = 0.9;
        g.aimZ = 0.4;
        g.visualAimX = 0.9;
        g.visualAimZ = 0.4;
        g.aimHold = 0.5;
      }
    });
    await new Promise((r) => setTimeout(r, 900));
    const walkPath = join(SHOT_DIR, 'in-game-walk-desktop.png');
    await page.screenshot({ path: walkPath, fullPage: false });
    meta.shots.push('in-game-walk-desktop.png');

    await page.evaluate(() => {
      const S = window.__swarm;
      const g = S && S.game;
      if (g) {
        g.vx = 0;
        g.vz = 0;
        g.aimHold = 0;
      }
    });
    await new Promise((r) => setTimeout(r, 600));
    const idlePath = join(SHOT_DIR, 'in-game-idle-desktop.png');
    await page.screenshot({ path: idlePath, fullPage: false });
    meta.shots.push('in-game-idle-desktop.png');

    // Phone viewport
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.evaluate(() => {
      const S = window.__swarm;
      const g = S && S.game;
      if (g) { g.vx = 1.8; g.vz = 0.6; }
      window.dispatchEvent(new Event('resize'));
    });
    await new Promise((r) => setTimeout(r, 800));
    const phonePath = join(SHOT_DIR, 'in-game-walk-phone.png');
    await page.screenshot({ path: phonePath, fullPage: false });
    meta.shots.push('in-game-walk-phone.png');

    writeFileSync(join(SHOT_DIR, 'in-game-meta.json'), JSON.stringify(meta, null, 2));
    console.log('shots ok', meta);
    await page.close();
  } finally {
    await browser.close();
    server.close();
  }
  if (!meta.mixamo || !meta.mixamo.isMixamo3d) {
    console.warn('WARN: Mixamo not active — shots may be billboard fallback');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
