#!/usr/bin/env node
/**
 * Bake mech sprite sheets from buildPlayerMech (js/mech-builder.js).
 *
 * Usage:
 *   node tools/bake-mech-sprites.mjs --id horn --dirs 4 --actions idle,run,gun,hurt,death
 *   node tools/bake-mech-sprites.mjs --id horn --dry-run
 *
 * Output:
 *   assets/mechs/{id}/sheets/{id}_{dir}_{action}_{frame}.png
 *   assets/mechs/{id}/sheets/{id}_atlas.json
 *   assets/mechs/{id}/sheets/{id}_anchors.json
 */
import { parseArgs } from 'node:util';
import { mkdirSync, writeFileSync, existsSync, createWriteStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DIRS4 = ['n', 'e', 's', 'w'];
const DIRS8 = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

function help() {
  console.log(`bake-mech-sprites — render buildPlayerMech → sprite sheets

  --id <horn|heavy|prototype>   Mech id (default: horn)
  --dirs <4|8>                  Direction count (default: 4)
  --actions <csv>               idle,run,gun,hurt,death (informational; bake captures all)
  --frames <n>                  Frames per run cycle (default: 4)
  --size <px>                   Cell size (default: 256)
  --out <dir>                   Output root (default: assets/mechs/<id>/sheets)
  --dry-run                     Print plan only; write manifest under tools/.cache
  --help                        This text

Requires system Chrome (puppeteer-core). Source: js/mech-builder.js buildPlayerMech.
`);
}

const { values } = parseArgs({
  options: {
    id: { type: 'string', default: 'horn' },
    dirs: { type: 'string', default: '4' },
    actions: { type: 'string', default: 'idle,run,gun,hurt,death' },
    frames: { type: 'string', default: '4' },
    size: { type: 'string', default: '256' },
    out: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
  strict: false,
});

if (values.help) {
  help();
  process.exit(0);
}

const id = values.id || 'horn';
const dirCount = Number(values.dirs) === 8 ? 8 : 4;
const dirs = dirCount === 8 ? DIRS8 : DIRS4;
const actions = String(values.actions || 'idle,run,gun,hurt,death').split(',').map((s) => s.trim()).filter(Boolean);
const frames = Math.max(1, Number(values.frames) || 4);
const size = Math.max(64, Number(values.size) || 256);
const outDir = values.out || join(ROOT, 'assets', 'mechs', id, 'sheets');
const dry = !!values['dry-run'];

function mime(p) {
  switch (extname(p)) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.mjs': return 'text/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/tools/bake-capture.html';
      const filePath = join(ROOT, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(ROOT) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': mime(filePath), 'Cache-Control': 'no-store' });
      createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

function dataUrlToBuffer(dataUrl) {
  const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error('bad data url');
  return Buffer.from(m[1], 'base64');
}

async function realBake() {
  let puppeteer;
  try {
    puppeteer = await import('puppeteer-core');
  } catch (e) {
    console.error('[bake] puppeteer-core missing. Run: npm install puppeteer-core');
    process.exit(2);
  }
  const chromePaths = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  const { server, port } = await startStaticServer();
  const url = `http://127.0.0.1:${port}/tools/bake-capture.html?id=${encodeURIComponent(id)}&size=${size}&frames=${frames}&dirs=${dirCount}`;
  console.error(`[bake] serve ${url}`);

  let browser;
  try {
    let lastErr;
    for (const exe of chromePaths) {
      try {
        browser = await puppeteer.default.launch({
          executablePath: exe,
          headless: 'new',
          args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files'],
        });
        console.error(`[bake] chrome: ${exe}`);
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!browser) throw lastErr || new Error('no chrome');

    const page = await browser.newPage();
    page.setDefaultTimeout(120000);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForFunction(
      () => document.title === 'BAKE_READY' || document.title === 'BAKE_ERROR',
      { timeout: 90000 }
    );
    const err = await page.evaluate(() => window.__BAKE_ERROR__ || null);
    if (err) throw new Error('bake-capture failed: ' + err);

    const result = await page.evaluate(() => {
      const r = window.__BAKE_RESULT__;
      return {
        meta: {
          version: r.version,
          implemented: r.implemented,
          source: r.source,
          id: r.id,
          size: r.size,
          dirs: r.dirs,
          frames: r.frames,
          characterHeightFrac: r.characterHeightFrac,
          camera: r.camera,
          anchors: r.anchors,
          anchorsByDir: r.anchorsByDir || null,
          muzzleWorldByDir: r.muzzleWorldByDir || null,
          cells: r.cells,
        },
        dataUrls: r._dataUrls,
      };
    });

    mkdirSync(outDir, { recursive: true });
    const written = [];
    for (let i = 0; i < result.meta.cells.length; i++) {
      const cell = result.meta.cells[i];
      const buf = dataUrlToBuffer(result.dataUrls[i]);
      const fp = join(outDir, cell.file);
      writeFileSync(fp, buf);
      written.push(cell.file);
    }

    const atlas = {
      ...result.meta,
      outDir: outDir.replace(ROOT + '/', ''),
      generatedAt: new Date().toISOString(),
      fallbackPng: true,
      layers: {
        body: 'lower+torso locomotion / idle / hurt / death',
        gun: 'independent aim layer (upper+rifle)',
      },
      usage: {
        moveDir: 'select body run/idle by movement yaw → n/ne/e/se/s/sw/w/nw (8-dir)',
        aimDir: 'select gun layer by visualAim yaw → n/ne/e/se/s/sw/w/nw (8-dir snap; not continuous 360°)',
        hurt: 'overlay hurt cell OR tint; do not cancel run',
        muzzle: 'anchors.muzzle normalized; scale by sprite world size',
      },
    };
    writeFileSync(join(outDir, `${id}_atlas.json`), JSON.stringify(atlas, null, 2));
    const dirsOut = result.meta.dirs || DIRS4;
    const byDir = result.meta.anchorsByDir || {};
    const worldByDir = result.meta.muzzleWorldByDir || {};
    writeFileSync(join(outDir, `${id}_anchors.json`), JSON.stringify({
      id,
      units: 'normalized',
      version: result.meta.version || '0.9.2',
      note: 'Per-dir muzzle UV/world from bake tip projection (gun pose). 8-dir sector snap — not continuous 360° turret.',
      shared: {
        ...(result.meta.anchors || {}),
        muzzle: (byDir.n && byDir.n.muzzle) || (result.meta.anchors && result.meta.anchors.muzzle),
      },
      muzzleWorldByDir: worldByDir,
      perDir: Object.fromEntries(dirsOut.map((d) => [d, {
        ...(byDir[d] || result.meta.anchors || {}),
        muzzleWorld: worldByDir[d] || null,
      }])),
    }, null, 2));

    console.log(JSON.stringify({
      ok: true,
      id,
      cells: written.length,
      outDir: atlas.outDir,
      atlas: `${atlas.outDir}/${id}_atlas.json`,
    }, null, 2));
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.close();
  }
}

// dry-run plan
const plan = [];
for (const action of actions) {
  const nFrames = action === 'run' || action === 'runfire' ? frames : 1;
  for (const dir of dirs) {
    for (let f = 0; f < nFrames; f++) {
      const layer = action === 'gun' ? 'gun' : 'body';
      const name = `${id}_${dir}_${action}_${String(f).padStart(2, '0')}${layer !== 'body' ? '_' + layer : ''}.png`;
      plan.push({ file: join(outDir, name).replace(ROOT + '/', ''), dir, action, frame: f, layer });
    }
  }
}

if (dry) {
  const manifest = {
    version: '0.9.1',
    implemented: true,
    dryRun: true,
    source: 'buildPlayerMech (js/mech-builder.js)',
    id, dirCount, actions, frames, size, outDir: outDir.replace(ROOT + '/', ''),
    cells: plan.length,
    plan,
  };
  const cacheDir = join(ROOT, 'tools', '.cache');
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(join(cacheDir, `bake-plan-${id}.json`), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
  process.exit(0);
}

realBake().catch((e) => {
  console.error('[bake-mech-sprites]', e);
  process.exit(2);
});
