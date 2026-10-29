/**
 * PHONE-MENU-BLACK-001 (v0.9.200) — phone menu mech visible (non-black).
 * Run: node tests/menu-mech-phone-fix-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'menu-mech-phone-fix');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.202';
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
      '--window-size=390,844',
    ],
  });
  const shotName = `menu-phone-390x844-v${VER}.png`;
  const shotPath = join(SHOT_DIR, shotName);
  let info = null;
  try {
    const page = await browser.newPage();
    page.on('console', (m) => {
      const t = m.text();
      if (/setMenuMech|q-hero|mixamo|error|Error|warn/i.test(t)) console.log('[page]', m.type(), t.slice(0, 240));
    });
    page.on('pageerror', (e) => console.error('[pageerror]', e.message));
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${base}/index.html?v=${VER}&debug=1&lang=zh`, {
      waitUntil: 'networkidle0',
      timeout: 90000,
    });
    await page.waitForSelector('#btn-play, .mech-card, [data-mech]', WAIT).catch(() => {});
    await page.waitForFunction(() => {
      const v = window.__swarm?.view;
      return !!(v && v.menuMech && v.menuMechModel);
    }, WAIT).catch(() => {});
    await page.evaluate(() => {
      const v = window.__swarm?.view;
      if (!v) return;
      v._menuAutoSpin = false;
      v._menuDragUntil = performance.now() + 600000;
      v._menuYaw = 0.55;
      if (v.setMenuMech) v.setMenuMech('horn');
      v._menuAutoSpin = false;
      if (v.menuMech) v.menuMech.rotation.y = 0.55;
    });
    await new Promise((r) => setTimeout(r, 1200));
    info = await page.evaluate(() => {
      const v = window.__swarm?.view;
      const m = v?.menuMechModel;
      let meshCount = 0;
      if (m) m.traverse((c) => { if (c.isMesh) meshCount += 1; });
      return {
        hasView: !!v,
        hasMenu: !!(v && v.menuMech),
        modelName: m?.name || '',
        isMixamo: !!(m && m.userData && m.userData.isMixamo3d),
        isPlayerMech: !!(m && (!m.userData || !m.userData.isMixamo3d) && meshCount > 0),
        mechId: 'horn',
        childCount: v?.menuMech?.children?.length || 0,
        meshCount,
        hornTrue3d: null,
      };
    });
    // Probe flag if module exposed
    try {
      info.hornTrue3d = await page.evaluate(async () => {
        const mod = await import('./js/q-hero-3d-flag.js');
        return mod.HORN_TRUE_3D;
      });
    } catch (_) {
      info.hornTrue3d = 'unreadable';
    }
    await page.screenshot({ path: shotPath, type: 'png' });
    console.log('shot:', shotPath);
    console.log('info:', info);
  } finally {
    await browser.close();
    server.close();
  }
  const meta = {
    ver: VER,
    mixamoDisabled: true,
    note: 'HORN_TRUE_3D=false; boot graph cuts q-hero-3d/meshopt; menu=buildPlayerMech+stage; combat baked PNG only',
    info,
    shot: shotPath,
  };
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify(meta, null, 2));
  writeFileSync(join(SHOT_DIR, 'NOTE.md'), [
    '# menu-mech-phone-fix',
    '',
    '**Tip:** v0.9.202 PHONE-MENU-CTA-VISIBLE-001',
    '',
    'Phone-viewport home menu (390×844). Mixamo **disabled** (`HORN_TRUE_3D=false`; no boot preload).',
    'Menu model = procedural `buildPlayerMech` + pedestal. Combat = baked PNG only until menu OK.',
    '',
    'SwiftShader box shot — not device-final. Hard-refresh phone if still seeing black.',
    '',
  ].join('\n'));
  if (!info || !info.hasMenu || !info.isPlayerMech || info.childCount < 2) {
    console.error('FAIL: menu mech not visible in scene graph', info);
    process.exit(1);
  }
  console.log('menu-mech-phone-fix-shots.mjs: PASS');
}

main().catch((e) => { console.error(e); process.exit(1); });
