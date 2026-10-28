#!/usr/bin/env node
/**
 * Convert Mixamo FBX (+ sibling .fbm textures) → GLB via headless Chrome + FBXLoader.
 * Usage: node tools/fbx-to-glb.mjs [--fbx path] [--out path] [--fit-h 1.76]
 */
import http from 'node:http';
import { createReadStream, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const { values } = parseArgs({
  options: {
    fbx: { type: 'string', default: 'assets/q-hero-tripo-mixamo-walking.fbx' },
    out: { type: 'string', default: 'assets/mechs/horn/q-hero-mixamo-walk.glb' },
    'fit-h': { type: 'string', default: '1.76' },
    resourcePath: { type: 'string' },
  },
  strict: false,
});

const fbxRel = values.fbx;
const outRel = values.out;
const fitH = values['fit-h'];
const fbxAbs = resolve(ROOT, fbxRel);
const outAbs = resolve(ROOT, outRel);
const resourcePath = values.resourcePath
  || ('../' + fbxRel.replace(/\.fbx$/i, '.fbm/'));

if (!existsSync(fbxAbs)) {
  console.error('missing fbx', fbxAbs);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.fbx': 'application/octet-stream',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.glb': 'model/gltf-binary', '.css': 'text/css',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const path = join(ROOT, url.replace(/^\//, ''));
  if (!path.startsWith(ROOT) || !existsSync(path) || !statSync(path).isFile()) {
    console.warn('404', url, '->', path);
    res.writeHead(404); res.end('nf'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(path).toLowerCase()] || 'application/octet-stream' });
  createReadStream(path).pipe(res);
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

let puppeteer;
try {
  puppeteer = await import('puppeteer-core');
} catch {
  console.error('need puppeteer-core');
  process.exit(1);
}

const candidates = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
const exe = candidates.find((p) => existsSync(p));
if (!exe) { console.error('no chrome'); process.exit(1); }

const browser = await puppeteer.default.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-webgl'],
});

const page = await browser.newPage();
page.on('console', (m) => console.log('[page]', m.type(), m.text()));
page.on('pageerror', (e) => console.error('[pageerror]', e.message));

const qs = new URLSearchParams({
  fbx: '../' + fbxRel,
  fitH: String(fitH),
  resourcePath,
});
const url = `http://127.0.0.1:${port}/tools/fbx-to-glb-capture.html?${qs}`;
console.log('open', url);
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });

const deadline = Date.now() + 180000;
let meta = null, b64 = null, err = null;
while (Date.now() < deadline) {
  const st = await page.evaluate(() => ({
    err: window.__fbxError,
    meta: window.__fbxMeta,
    ready: !!window.__fbxResult,
  }));
  if (st.err) { err = st.err; break; }
  if (st.ready) {
    meta = st.meta;
    b64 = await page.evaluate(() => window.__fbxResult);
    break;
  }
  await new Promise((r) => setTimeout(r, 500));
}

await browser.close();
server.close();

if (err) { console.error('convert failed', err); process.exit(1); }
if (!b64) { console.error('timeout'); process.exit(1); }

mkdirSync(dirname(outAbs), { recursive: true });
const buf = Buffer.from(b64, 'base64');
writeFileSync(outAbs, buf);
console.log('wrote', outRel, buf.length, 'bytes');
console.log('meta', JSON.stringify(meta, null, 2));
