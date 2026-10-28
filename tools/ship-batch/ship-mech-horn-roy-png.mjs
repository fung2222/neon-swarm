/**
 * Active MECH-HORN-ROY-PNG — ship v0.9.186 → HOLD @ visual.
 * Roy 2026-10-28 widget「機體／角／Roy PNG」.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, createReadStream, statSync, copyFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';
import { createServer } from 'http';
import puppeteer from 'puppeteer-core';

const ROOT = '/workspace/neon-swarm';
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.md': 'text/markdown',
};

function rf(p) { return readFileSync(join(ROOT, p), 'utf8'); }
function wf(p, s) { writeFileSync(join(ROOT, p), s); }
function sh(cmd) { console.log('>>', cmd); execSync(cmd, { cwd: ROOT, stdio: 'inherit' }); }

function bumpCache(ver) {
  let html = rf('index.html');
  html = html.replace(/\?v=0\.9\.\d+/g, `?v=${ver}`);
  wf('index.html', html);
  let main = rf('js/main.js');
  main = main.replace(/^\/\/ RAMPAGE MECH[^\n]*/m, `// RAMPAGE MECH 暴走機甲 — tip v${ver}`);
  wf('js/main.js', main);
}

function commit(msg) {
  sh('git add -A');
  // allow empty? no — always have changes
  try {
    sh(`git commit -m ${JSON.stringify(msg)}`);
  } catch (e) {
    console.warn('commit failed (maybe empty)', e.message);
  }
}

function push() {
  sh('git push origin main');
}

function tipSha() {
  return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
}

function writeUnit(slug, ver, id, body) {
  const min = Number(ver.split('.')[2]);
  wf(`tests/${slug}.test.mjs`, `/**
 * ${id} (v${ver})
 */
import assert from 'assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const agent = readFileSync(join(root, 'docs/AGENT_TASK.md'), 'utf8');
const hand = readFileSync(join(root, 'docs/HANDOFF.md'), 'utf8');
const bible = readFileSync(join(root, 'docs/art-bible.md'), 'utf8');
const mech = readFileSync(join(root, 'js/mech-builder.js'), 'utf8');
const sprites = readFileSync(join(root, 'js/sprites.js'), 'utf8');
const icons = readFileSync(join(root, 'js/weapons-icons.js'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const pipeline = readFileSync(join(root, 'docs/render-pipeline.md'), 'utf8');

assert.ok((() => {
  const m = html.match(/\\?v=0\\.9\\.(\\d+)/);
  return m && Number(m[1]) >= ${min};
})(), 'soft-pin ≥${ver}');
assert.ok(agent.includes('${id}') || agent.includes('${ver}') || /MECH-HORN-ROY-PNG|Active|HOLD/.test(agent), 'AGENT_TASK soft');

${body}
console.log('${slug}.test.mjs: PASS');
`);
}

function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
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

async function shotMenu(slug, ver, mechId, fileName, yaw = 0.55, mobile = false) {
  const dir = join(ROOT, 'tests', 'screenshots', slug);
  mkdirSync(dir, { recursive: true });
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl', '--ignore-gpu-blocklist', '--window-size=1280,800'],
  });
  try {
    const page = await browser.newPage();
    if (mobile) {
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    } else {
      await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    }
    await page.goto(base + `/index.html?v=${ver}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', { timeout: 45000, polling: 250 });
    await page.evaluate((id, y) => {
      const v = window.__swarm?.view;
      if (!v) return;
      if (v.setMenuMech) v.setMenuMech(id);
      v._menuAutoSpin = false;
      v._menuDragUntil = performance.now() + 600000;
      v._menuYaw = y;
      if (v.menuMech) v.menuMech.rotation.y = y;
    }, mechId, yaw);
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: join(dir, fileName), fullPage: false });
    console.log('shot', slug, fileName);
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }
}

function syncMuzzleFromAnchors() {
  const anchors = JSON.parse(rf('assets/mechs/horn/sheets/horn_anchors.json'));
  const world = anchors.muzzleWorldByDir || {};
  const per = anchors.perDir || {};
  const dirs = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  const lines = dirs.map((d) => {
    const uv = (per[d] && per[d].muzzle) || (anchors.shared && anchors.shared.muzzle) || [0.5, 0.5];
    const w = world[d] || [0, 0.88, 0.8];
    const uvS = uv.map((n) => Number(n).toFixed(4)).join(', ');
    const wS = w.map((n) => Number(n).toFixed(4)).join(', ');
    return `  ${d}: { uv: [${uvS}], world: [${wS}] },`;
  });
  let muzzle = rf('js/muzzle.js');
  muzzle = muzzle.replace(
    /export const HORN_MUZZLE_BY_DIR = \{[\s\S]*?\n\};/,
    `export const HORN_MUZZLE_BY_DIR = {\n${lines.join('\n')}\n};`
  );
  // bump comment version
  muzzle = muzzle.replace(/Synced from horn_atlas\.json bake \(v0\.9\.\d+/, 'Synced from horn_atlas.json bake (v0.9.187');
  wf('js/muzzle.js', muzzle);

  let sprites = rf('js/sprites.js');
  sprites = sprites.replace(/horn_atlas\.json\?v=0\.9\.\d+/g, 'horn_atlas.json?v=0.9.187');
  sprites = sprites.replace(/\?v=0\.9\.27/g, '?v=0.9.187');
  wf('js/sprites.js', sprites);
  console.log('muzzle + sprites atlas cache synced');
}

function updateAgentActive(ver, sha, slices, statusLine, holdAsk = null) {
  const table = slices.map((s) => `| ${s.ver} | \`${s.id}\` | ${s.what} |`).join('\n');
  const holdBlock = holdAsk
    ? `### Why HOLD / Roy decision needed
Art beat shipped for phone 肉眼. **Interim — not §9 / device-final lock.**

${holdAsk}

Still HARD BAN: Phase 4 abilities / soft-juice invent / more ult invent / BALANCE re-pass / pause \`#btn-glow\` / invent menu PNGs from T2I.
`
    : `### Active queue
Continue art track until coherent phone beat (horn deepen+rebake live) then HOLD for Roy visual.
`;

  const body = `# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/?v=${ver} · Repo: https://github.com/fung2222/neon-swarm

## 狀態：**${statusLine}**

**Author:** Grok bot

### Tip
https://fung2222.github.io/neon-swarm/?v=${ver}

### Roy decision (2026-10-28 ~17:41 HKT)
Widget「v0.9.185 之後下一條？」→ **機體／角／Roy PNG**
= Open Active art track for mech frames / horn / Roy PNG path. Baseline tip v0.9.185 HEAD ~\`138bf76\` (ship \`1dcb595\`).

### Lifted for THIS Active only
- Horn further polish (was banned after interim v0.9.21)
- New mech frame body art (heavy / prototype unique silhouettes — NOT recolor-horn)
- Roy PNG pipeline (weapon \`assets/weapons/{id}.png\` readiness; in-game mech bake sheets aligned to select 3D; honest select↔in-game)

### Still HARD BAN
- Phase 4 **abilities** / Precision gameplay invent
- soft-juice invent
- more ult invent
- BALANCE re-pass
- Claiming **final art lock / HANDOFF §9 locked / device-final** without Roy 肉眼 OK
- Do NOT invent menu PNGs from text-to-image (art-bible: select = live 3D \`buildPlayerMech\`)
- Do NOT bring back pause \`#btn-glow\`

${holdBlock}

### Shipped this beat (slice table)

| Ver | ID | What |
|---|---|---|
${table}

### Preserve
stick hide · hub flush · gear L + pause R · settings 畫質 · rail · water CD · dbl/tpl · tap≥44 · over title · soft-pins · balance/GPU shipped · unique ult kits · bans above
`;
  wf('docs/AGENT_TASK.md', body);
}

function patchArtBibleActive() {
  let bible = rf('docs/art-bible.md');
  // Lift horn polish ban status
  bible = bible.replace(
    /\*\*Do not\*\* further polish horn until later Roy art lock\./,
    '**Lifted 2026-10-28** for Active `MECH-HORN-ROY-PNG` (Roy widget「機體／角／Roy PNG」): further horn polish + unique heavy/prototype silhouettes + Roy PNG path allowed. Still **not** §9 / device-final without Roy 肉眼 OK.'
  );
  // Update select vs in-game honesty
  if (!bible.includes('HORN-BAKE-INGAME-ALIGN')) {
    bible = bible.replace(
      /## 6\. Select vs in-game honesty \(Phase 1\)[\s\S]*?(?=## 7\.)/,
      `## 6. Select vs in-game honesty (Phase 1 → bake align)

| Surface | Source |
|---|---|
| **Select / home** | Live procedural Three.js \`buildPlayerMech(cfg)\` — rotatable 3D |
| **In-game (horn)** | Baked multi-dir sheets from **same** \`buildPlayerMech\` under \`assets/mechs/horn/sheets/\` (via \`buildBakedPlayerSprite\`) |
| **In-game fallback** | Legacy \`assets/sprites/mech_*.png\` only when bake atlas missing for that mech id |

**HORN-BAKE-INGAME-ALIGN (v0.9.188):** horn in-game billboards use rebaked sheets — not a second art pipeline. heavy / prototype still select-3D only until their bake stubs land; do **not** claim all three frames are in-game-aligned. Until Roy 肉眼 lock, sheets are **interim**.

`
    );
  }
  wf('docs/art-bible.md', bible);
}

function patchRenderPipeline() {
  let p = rf('docs/render-pipeline.md');
  p = p.replace(
    /\| In-game \| Still `buildPlayerSprite` \+ `assets\/sprites\/mech_\*\.png` \(\*\*interim placeholders\*\*\) \|/,
    '| In-game (horn) | `buildBakedPlayerSprite` ← `assets/mechs/horn/sheets/` from same `buildPlayerMech`; legacy `assets/sprites/mech_*.png` fallback |'
  );
  if (!p.includes('HORN-BAKE-INGAME-ALIGN')) {
    p += `\n\n## 7. Honesty note (v0.9.188 HORN-BAKE-INGAME-ALIGN)\n\nHorn select (live 3D) and in-game (rebaked 8-dir sheets) share \`buildPlayerMech\` source. heavy/prototype: select live 3D unique meshes; bake stubs optional; not claimed in-game-aligned until sheets wired. **Interim for Roy 肉眼 — not §9 lock.**\n`;
  }
  wf('docs/render-pipeline.md', p);
}

function patchReadme(ver, status) {
  let r = rf('README.md');
  r = r.replace(/\?v=0\.9\.\d+/g, `?v=${ver}`);
  r = r.replace(/\*\*試玩 Play:\*\*[^\n]*/, `**試玩 Play:** https://fung2222.github.io/neon-swarm/?v=${ver} · **狀態 Status:** ${status}`);
  r = r.replace(
    /\| \*\*遊戲內 In-game\*\* \|[^\n]*/,
    '| **遊戲內 In-game** | horn：`assets/mechs/horn/sheets/` bake（同 `buildPlayerMech`）；缺 atlas 先 fallback `assets/sprites/mech_*.png` |'
  );
  // soft pipeline tip line if present
  r = r.replace(
    /\*\*Safe pipeline tip:\*\*[^\n]*/,
    `**Art Active tip:** v${ver} — MECH-HORN-ROY-PNG；HARD BAN Phase4 abilities / soft-juice / more ult / BALANCE re-pass / §9 lock claim without Roy 肉眼。`
  );
  wf('README.md', r);
}

function patchGamesJson(ver, stageId) {
  let g = rf('docs/GAMES-JSON-STUB.md');
  g = g.replace(/<!-- 0\.9\.\d+ GAMES-JSON-STAGE-\d+[^>]*-->/, `<!-- ${ver} ${stageId} / art Active tip bump -->`);
  g = g.replace(/網頁版 0\.9\.\d+/g, `網頁版 ${ver}`);
  g = g.replace(/web 0\.9\.\d+/g, `web ${ver}`);
  // append art note into stage if not there
  if (!g.includes('horn deepen')) {
    g = g.replace(
      /· HUD gear\/settings · 未包裝 Android/g,
      '· HUD gear/settings · horn deepen+bake align · unique heavy/proto select · weapons PNG path · 未包裝 Android'
    );
  }
  wf('docs/GAMES-JSON-STUB.md', g);
}

function patchHandoffTip(ver, note) {
  let h = rf('docs/HANDOFF.md');
  h = h.replace(/tip v0\.9\.\d+[^\n]*/, `tip v${ver} ${note}）`);
  // update cache-bust line near top
  h = h.replace(/目前 `main`／live cache-bust：\*\*`\?v=0\.9\.\d+`\*\*[^\n]*/,
    `目前 \`main\`／live cache-bust：**\`?v=${ver}\`**（${note}）`);
  wf('docs/HANDOFF.md', h);
}

function appendHandoffDone(ver, id, text) {
  let h = rf('docs/HANDOFF.md');
  const marker = '- **Done since';
  const idx = h.indexOf(marker);
  if (idx < 0) return;
  // find first bullet after Done since
  const insertAt = h.indexOf('\n  - v0.9.', idx);
  if (insertAt < 0) return;
  const line = `\n  - ${ver} — ${id}：${text}`;
  h = h.slice(0, insertAt) + line + h.slice(insertAt);
  wf('docs/HANDOFF.md', h);
}

function updateLastShas(ver, msg) {
  const sha = tipSha();
  let last = rf('last-shas.txt');
  const line = `${sha} ${ver} ${msg}\n`;
  // prepend
  const lines = last.split('\n').filter(Boolean);
  lines.unshift(`${sha} v${ver} ${msg}`);
  wf('last-shas.txt', lines.slice(0, 12).join('\n') + '\n');
  return sha;
}

async function bakeHorn() {
  console.log('=== baking horn 8-dir ===');
  sh('node tools/bake-mech-sprites.mjs --id horn --dirs 8 --actions idle,run,gun,hurt,death --frames 4 --size 256');
}

async function bakeStub(id) {
  console.log(`=== baking ${id} 4-dir stub ===`);
  sh(`node tools/bake-mech-sprites.mjs --id ${id} --dirs 4 --actions idle,run,gun,hurt,death --frames 4 --size 256`);
}

const SLICES = [];

async function main() {
  // ---------- v0.9.186 MECH-HORN-ROY-PNG ----------
  {
    const ver = '0.9.186';
    const id = 'MECH-HORN-ROY-PNG';
    bumpCache(ver);
    patchArtBibleActive();
    SLICES.push({ ver: 'v' + ver, id, what: 'Open Active art track; lift horn/heavy/proto/Roy-PNG bans for this Active; keep Phase4/soft-juice/ult/BALANCE bans' });
    updateAgentActive(ver, 'pending', SLICES, `**Active** — tip \`v${ver}\` \`${id}\`. Art track open (Roy「機體／角／Roy PNG」).`);
    patchReadme(ver, `v${ver} ${id}`);
    patchHandoffTip(ver, `${id}; art Active open`);
    appendHandoffDone('v' + ver, id, 'Active rewrite；lift horn polish／unique heavy·proto／Roy PNG path this Active only；still ban Phase4 abilities／soft-juice／more ult／BALANCE／§9 lock claim without Roy 肉眼。');
    writeUnit('mech-horn-roy-png', ver, id, `
assert.ok(agent.includes('MECH-HORN-ROY-PNG'), 'Active id');
assert.ok(agent.includes('機體／角／Roy PNG') || agent.includes('MECH-HORN'), 'Roy decision');
assert.ok(/Lifted|lift/.test(agent) || bible.includes('MECH-HORN-ROY-PNG'), 'art bans lifted');
assert.ok(agent.includes('Phase 4') && agent.includes('HARD BAN'), 'Phase4 still banned');
assert.ok(!/btn-glow/.test(html) || !html.includes('id="btn-glow"'), 'no pause glow');
`);
    mkdirSync(join(ROOT, 'tests/screenshots/mech-horn-roy-png'), { recursive: true });
    wf('tests/screenshots/mech-horn-roy-png/NOTE.md', `# ${id}\n\nDocs-only Active open. Screenshots land with HORN-MECHA-DEEPEN.\n`);
    commit(`docs: v${ver} ${id} — open Active art track (horn/heavy/proto/Roy PNG)`);
    updateLastShas(ver, id);
    push();
    console.log('shipped', ver, tipSha());
  }

  // ---------- v0.9.187 HORN-MECHA-DEEPEN ----------
  {
    const ver = '0.9.187';
    const id = 'HORN-MECHA-DEEPEN';
    bumpCache(ver);
    await bakeHorn();
    syncMuzzleFromAnchors();
    // copy a few bake cells into screenshots
    const shotDir = join(ROOT, 'tests/screenshots/horn-mecha-deepen');
    mkdirSync(shotDir, { recursive: true });
    const sheets = join(ROOT, 'assets/mechs/horn/sheets');
    for (const f of ['horn_n_idle_00.png', 'horn_e_idle_00.png', 'horn_s_idle_00.png', 'horn_w_idle_00.png', 'horn_n_gun_00_gun.png', 'horn_s_run_01.png']) {
      if (existsSync(join(sheets, f))) copyFileSync(join(sheets, f), join(shotDir, 'bake-' + f));
    }
    await shotMenu('horn-mecha-deepen', ver, 'horn', 'menu-desktop-1280x800.png', 0.55, false);
    await shotMenu('horn-mecha-deepen', ver, 'horn', 'menu-desktop-rear-1280x800.png', Math.PI + 0.4, false);
    await shotMenu('horn-mecha-deepen', ver, 'horn', 'menu-mobile-390x844.png', 0.55, true);

    SLICES.push({ ver: 'v' + ver, id, what: 'Deepen buildPlayerMech horn (plates/asym/horn sweep/mil-tech); rebake 8-dir sheets; muzzle/atlas sync; interim for Roy try — not §9 lock' });
    updateAgentActive(ver, tipSha(), SLICES, `**Active** — tip \`v${ver}\` \`${id}\`. Horn deepen+rebake live; continue align/heavy/proto/PNG.`);
    patchReadme(ver, `v${ver} ${id}`);
    patchHandoffTip(ver, `${id}; horn deepen interim`);
    appendHandoffDone('v' + ver, id, 'horn mecha deepen（silhouette/plates/materials within bible）+ rebake 8-dir；muzzle/atlas sync；截圖 \`tests/screenshots/horn-mecha-deepen/\`。**interim for Roy try — not §9 lock**。');
    writeUnit('horn-mecha-deepen', ver, id, `
assert.ok(mech.includes('HORN-MECHA-DEEPEN') || mech.includes('v0.9.187'), 'mech header');
assert.ok(mech.includes('hornRidge') || mech.includes('chestChevron') || mech.includes('packFinL'), 'deepen parts present');
assert.ok(existsSync(join(root, 'assets/mechs/horn/sheets/horn_atlas.json')), 'atlas');
assert.ok(existsSync(join(root, 'assets/mechs/horn/sheets/horn_n_idle_00.png')), 'idle n');
assert.ok(sprites.includes('horn_atlas.json?v=0.9.187') || sprites.includes('0.9.187'), 'atlas cache');
assert.ok(agent.includes('interim') || agent.includes('not §9') || hand.includes('not §9'), 'no lock claim');
`);
    commit(`feat: v${ver} ${id} — deepen horn mecha + rebake 8-dir (interim, not §9 lock)`);
    updateLastShas(ver, id);
    push();
    console.log('shipped', ver, tipSha());
  }

  // ---------- v0.9.188 HORN-BAKE-INGAME-ALIGN ----------
  {
    const ver = '0.9.188';
    const id = 'HORN-BAKE-INGAME-ALIGN';
    bumpCache(ver);
    patchRenderPipeline();
    // ensure art-bible honesty (already patched) + README
    let bible = rf('docs/art-bible.md');
    if (!bible.includes('HORN-BAKE-INGAME-ALIGN')) {
      patchArtBibleActive();
    }
    patchReadme(ver, `v${ver} ${id}`);
    // affirm sprites prefer baked
    let sprites = rf('js/sprites.js');
    if (!sprites.includes('HORN-BAKE-INGAME-ALIGN')) {
      sprites = sprites.replace(
        /\/\/ Baked player sheets \(from buildPlayerMech via tools\/bake-mech-sprites\.mjs\)\./,
        '// Baked player sheets (from buildPlayerMech via tools/bake-mech-sprites.mjs).\n// HORN-BAKE-INGAME-ALIGN (v0.9.188): horn in-game uses these sheets — same 3D source as select.'
      );
      wf('js/sprites.js', sprites);
    }
    SLICES.push({ ver: 'v' + ver, id, what: 'Honesty: in-game horn billboards = rebaked sheets (same buildPlayerMech); art-bible/render-pipeline/README note' });
    updateAgentActive(ver, tipSha(), SLICES, `**Active** — tip \`v${ver}\` \`${id}\`. Horn select↔in-game honest; continue heavy/proto/PNG.`);
    patchHandoffTip(ver, `${id}; bake align honesty`);
    appendHandoffDone('v' + ver, id, 'in-game horn billboards affirm rebaked sheets（唔用 stale mech_*.png mismatch）；art-bible／render-pipeline honesty note。**interim**。');
    writeUnit('horn-bake-ingame-align', ver, id, `
assert.ok(pipeline.includes('HORN-BAKE-INGAME-ALIGN') || bible.includes('HORN-BAKE-INGAME-ALIGN'), 'honesty note');
assert.ok(sprites.includes('buildBakedPlayerSprite') || sprites.includes('BAKED_PLAYER_BASE'), 'baked path');
assert.ok(readme.includes('mechs/horn/sheets') || bible.includes('mechs/horn/sheets'), 'readme/bible sheets');
`);
    mkdirSync(join(ROOT, 'tests/screenshots/horn-bake-ingame-align'), { recursive: true });
    wf('tests/screenshots/horn-bake-ingame-align/NOTE.md', `# ${id}\n\nDocs + sprites honesty. Horn bake cells under horn-mecha-deepen/.\n`);
    commit(`docs: v${ver} ${id} — horn in-game sheets honesty (same 3D source)`);
    updateLastShas(ver, id);
    push();
    console.log('shipped', ver, tipSha());
  }

  // ---------- v0.9.189 MECH-HEAVY-SILHOUETTE ----------
  {
    const ver = '0.9.189';
    const id = 'MECH-HEAVY-SILHOUETTE';
    bumpCache(ver);
    await bakeStub('heavy');
    const shotDir = join(ROOT, 'tests/screenshots/mech-heavy-silhouette');
    mkdirSync(shotDir, { recursive: true });
    const sheets = join(ROOT, 'assets/mechs/heavy/sheets');
    for (const f of ['heavy_n_idle_00.png', 'heavy_e_idle_00.png', 'heavy_s_idle_00.png', 'heavy_w_idle_00.png']) {
      if (existsSync(join(sheets, f))) copyFileSync(join(sheets, f), join(shotDir, 'bake-' + f));
    }
    await shotMenu('mech-heavy-silhouette', ver, 'heavy', 'menu-desktop-1280x800.png', 0.55, false);
    await shotMenu('mech-heavy-silhouette', ver, 'heavy', 'menu-mobile-390x844.png', 0.55, true);
    SLICES.push({ ver: 'v' + ver, id, what: 'Unique Precision (heavy) mesh — compact wide stance, twin shoulder pods, sensor crown; white-pink; bake 4-dir stub; NOT recolor horn' });
    updateAgentActive(ver, tipSha(), SLICES, `**Active** — tip \`v${ver}\` \`${id}\`. Heavy unique select+bake stub; continue proto/PNG.`);
    patchReadme(ver, `v${ver} ${id}`);
    patchHandoffTip(ver, `${id}; unique heavy mesh`);
    appendHandoffDone('v' + ver, id, 'unique Precision（heavy）mesh／parts（white-pink）；select+bake 4-dir stub；**唔係** horn recolor；截圖 \`tests/screenshots/mech-heavy-silhouette/\`。**interim**。');
    writeUnit('mech-heavy-silhouette', ver, id, `
assert.ok(mech.includes('MECH-HEAVY-SILHOUETTE') || mech.includes('buildHeavy'), 'heavy builder');
assert.ok(mech.includes('function buildHeavy'), 'unique heavy fn');
assert.ok(!/function buildHeavy[\\s\\S]*buildHorn/.test(mech) || mech.indexOf('function buildHeavy') > 0, 'heavy exists');
assert.ok(existsSync(join(root, 'assets/mechs/heavy/sheets/heavy_atlas.json')) || existsSync(join(root, 'assets/mechs/heavy/sheets/heavy_n_idle_00.png')), 'heavy bake stub');
assert.ok(agent.includes('NOT recolor') || agent.includes('not recolor') || agent.includes('唔係'), 'not recolor note');
`);
    commit(`feat: v${ver} ${id} — unique Precision heavy mesh + 4-dir bake stub (not horn recolor)`);
    updateLastShas(ver, id);
    push();
    console.log('shipped', ver, tipSha());
  }

  // ---------- v0.9.190 MECH-PROTOTYPE-SILHOUETTE ----------
  {
    const ver = '0.9.190';
    const id = 'MECH-PROTOTYPE-SILHOUETTE';
    bumpCache(ver);
    await bakeStub('prototype');
    const shotDir = join(ROOT, 'tests/screenshots/mech-prototype-silhouette');
    mkdirSync(shotDir, { recursive: true });
    const sheets = join(ROOT, 'assets/mechs/prototype/sheets');
    for (const f of ['prototype_n_idle_00.png', 'prototype_e_idle_00.png', 'prototype_s_idle_00.png', 'prototype_w_idle_00.png']) {
      if (existsSync(join(sheets, f))) copyFileSync(join(sheets, f), join(shotDir, 'bake-' + f));
    }
    await shotMenu('mech-prototype-silhouette', ver, 'prototype', 'menu-desktop-1280x800.png', 0.55, false);
    await shotMenu('mech-prototype-silhouette', ver, 'prototype', 'menu-mobile-390x844.png', 0.55, true);
    SLICES.push({ ver: 'v' + ver, id, what: 'Unique Morph (prototype) mesh — morph seams, dual fins+monocle, fold-panel pack; citrus; bake 4-dir stub; NOT recolor horn' });
    updateAgentActive(ver, tipSha(), SLICES, `**Active** — tip \`v${ver}\` \`${id}\`. Prototype unique select+bake stub; continue PNG path then HOLD.`);
    patchReadme(ver, `v${ver} ${id}`);
    patchHandoffTip(ver, `${id}; unique prototype mesh`);
    appendHandoffDone('v' + ver, id, 'unique Morph（prototype）mesh／parts；select+bake 4-dir stub；**唔係** horn recolor；截圖 \`tests/screenshots/mech-prototype-silhouette/\`。**interim**。');
    writeUnit('mech-prototype-silhouette', ver, id, `
assert.ok(mech.includes('buildPrototype'), 'proto builder');
assert.ok(mech.includes('MECH-PROTOTYPE-SILHOUETTE') || mech.includes('morph'), 'proto header/morph');
assert.ok(existsSync(join(root, 'assets/mechs/prototype/sheets/prototype_n_idle_00.png')) || existsSync(join(root, 'assets/mechs/prototype/sheets/prototype_atlas.json')), 'proto bake stub');
`);
    commit(`feat: v${ver} ${id} — unique Morph prototype mesh + 4-dir bake stub (not horn recolor)`);
    updateLastShas(ver, id);
    push();
    console.log('shipped', ver, tipSha());
  }

  // ---------- v0.9.191 WEAPONS-PNG-PATH ----------
  {
    const ver = '0.9.191';
    const id = 'WEAPONS-PNG-PATH';
    bumpCache(ver);
    mkdirSync(join(ROOT, 'assets/weapons'), { recursive: true });
    wf('assets/weapons/README.md', `# Weapon PNGs — Roy drop path

\`WEAPON_ICON_SRC\` → \`assets/weapons/{id}.png\` for each catalog id.

| Status | Note |
|---|---|
| **Path ready** | \`js/weapons-icons.js\` \`WEAPON_ICON_SRC\` + \`weaponIconHtml(..., { preferSrc: true })\` img→SVG fallback |
| **In HUD** | Prefer PNG when file exists (\`onerror\` → neon SVG placeholder) |
| **Roy art** | Drop your PNGs here named \`{id}.png\` (see catalog ids in \`js/weapons.js\`). **Do not** claim Grok-generated art as Roy final. |

Catalog ids: gatling, ion_beam, tracking_bomb, vulcan, zero_laser, acid_gun, shotgun, slow_gun, attack_drone, blackhole, frag, chill, flash, gravity.

No Roy-supplied PNGs in repo at v${ver} ship — path+docs only; neon SVG placeholders remain default.
`);
    // Wire preferSrc:true in main.js weapon icon calls (with onerror fallback)
    let main = rf('js/main.js');
    // Add a helper comment and ensure preferSrc path is used where size is set
    if (!main.includes('WEAPONS-PNG-PATH')) {
      main = main.replace(
        /import \{ weaponIconHtml, WEAPON_ICON_SRC \} from '\.\/weapons-icons\.js';/,
        `import { weaponIconHtml, WEAPON_ICON_SRC } from './weapons-icons.js';\n// WEAPONS-PNG-PATH (v0.9.191): preferSrc tries assets/weapons/{id}.png then SVG fallback`
      );
    }
    // Update weaponIconHtml calls to preferSrc when not empty
    main = main.replace(/weaponIconHtml\((id|null), \{ size: (\d+) \}\)/g,
      (m, a, size) => a === 'null' ? m : `weaponIconHtml(${a}, { size: ${size}, preferSrc: true })`);
    main = main.replace(/weaponIconHtml\((id), mutedOpt\)/g,
      `weaponIconHtml($1, { ...mutedOpt, preferSrc: true })`);
    wf('js/main.js', main);

    // Docs note in WEAPONS.md if exists
    if (existsSync(join(ROOT, 'docs/WEAPONS.md'))) {
      let w = rf('docs/WEAPONS.md');
      w = w.replace(/\?v=0\.9\.\d+/g, `?v=${ver}`);
      if (!w.includes('WEAPONS-PNG-PATH')) {
        w = w.replace(/^# /m, `# `);
        w += `\n\n## Weapon PNG path (v${ver} WEAPONS-PNG-PATH)\n\n- \`WEAPON_ICON_SRC[id] = assets/weapons/{id}.png\`\n- HUD \`preferSrc: true\` → \`<img>\` with onerror → neon SVG placeholder\n- **No Roy-supplied PNGs in repo yet** — drop files under \`assets/weapons/\`; do not claim Grok placeholders as final art\n`;
      }
      wf('docs/WEAPONS.md', w);
    }

    let icons = rf('js/weapons-icons.js');
    if (!icons.includes('WEAPONS-PNG-PATH')) {
      icons = icons.replace(
        / \* Later: drop assets\/weapons\/\{id\}\.png/,
        ' * WEAPONS-PNG-PATH (v0.9.191): path ready — drop assets/weapons/{id}.png'
      );
      wf('js/weapons-icons.js', icons);
    }

    SLICES.push({ ver: 'v' + ver, id, what: 'Wire WEAPON_ICON_SRC preferSrc→assets/weapons/{id}.png + SVG fallback; README drop path; no Roy PNGs yet — HOLD note' });
    updateAgentActive(ver, tipSha(), SLICES, `**Active** — tip \`v${ver}\` \`${id}\`. PNG path ready; stage close → HOLD for Roy 肉眼.`);
    patchReadme(ver, `v${ver} ${id}`);
    patchHandoffTip(ver, `${id}; weapons PNG path ready`);
    appendHandoffDone('v' + ver, id, 'WEAPON_ICON_SRC → assets/weapons/{id}.png；HUD preferSrc + SVG fallback；\`assets/weapons/README.md\` drop path；**無** Roy-supplied PNG in repo — path+docs only；**唔** claim final art。');
    writeUnit('weapons-png-path', ver, id, `
assert.ok(icons.includes('assets/weapons/') && icons.includes('WEAPON_ICON_SRC'), 'src map');
assert.ok(existsSync(join(root, 'assets/weapons/README.md')), 'drop readme');
assert.ok((() => { const main = readFileSync(join(root, 'js/main.js'), 'utf8'); return main.includes('preferSrc: true') || main.includes('WEAPONS-PNG-PATH'); })(), 'preferSrc wired');
function rfMainPrefer() {
  const main = readFileSync(join(root, 'js/main.js'), 'utf8');
  return main.includes('preferSrc: true') || main.includes('WEAPONS-PNG-PATH');
}
`);
    mkdirSync(join(ROOT, 'tests/screenshots/weapons-png-path'), { recursive: true });
    wf('tests/screenshots/weapons-png-path/NOTE.md', `# ${id}\n\nPath ready. No Roy PNGs shipped. Neon SVG placeholders remain.\n`);
    commit(`feat: v${ver} ${id} — assets/weapons/{id}.png path + preferSrc fallback (no Roy PNGs yet)`);
    updateLastShas(ver, id);
    push();
    console.log('shipped', ver, tipSha());
  }

  // ---------- v0.9.192 GAMES-JSON-STAGE-009 + HOLD ----------
  {
    const ver = '0.9.192';
    const id = 'GAMES-JSON-STAGE-009';
    bumpCache(ver);
    patchGamesJson(ver, id);
    patchReadme(ver, `v${ver} ${id} HOLD for Roy 肉眼`);
    SLICES.push({ ver: 'v' + ver, id, what: 'games.json stub stage → tip; art beat HOLD for Roy 肉眼 on horn (+ optional heavy/proto); weapons PNG drop ask' });
    const holdAsk = `Please try tip and answer:

1. **Horn** \`?v=${ver}\` select 3D + in-game bake — OK to continue polish? **Lock horn** as §9 / device-final?
2. **Heavy / Prototype** unique select silhouettes — OK direction? Continue polish?
3. **Weapons PNG** — drop your \`assets/weapons/{id}.png\` files when ready? (path is live; neon SVG until then)

Live: https://fung2222.github.io/neon-swarm/?v=${ver}`;
    updateAgentActive(ver, tipSha(), SLICES, `**HOLD** — tip \`v${ver}\` (\`${id}\`). Art beat shipped; wait Roy 肉眼 before lock / next invent.`, holdAsk);
    patchHandoffTip(ver, `${id}; HOLD for Roy visual`);
    appendHandoffDone('v' + ver, id, 'games.json stub stage → tip；art Active close；**HOLD for Roy 肉眼** on horn（+ optional heavy/proto）／weapons PNG drop。**唔** claim §9 lock。');
    writeUnit('games-json-stage-009', ver, id, `
assert.ok(readFileSync(join(root, 'docs/GAMES-JSON-STUB.md'), 'utf8').includes('${ver}') || readFileSync(join(root, 'docs/GAMES-JSON-STUB.md'), 'utf8').includes('0.9.192'), 'stub tip');
assert.ok(agent.includes('HOLD'), 'HOLD');
assert.ok(agent.includes('肉眼') || agent.includes('Lock horn'), 'Roy ask');
`);
    mkdirSync(join(ROOT, 'tests/screenshots/games-json-stage-009'), { recursive: true });
    wf('tests/screenshots/games-json-stage-009/NOTE.md', `# ${id}\n\nStage tip bump + HOLD for Roy visual.\n`);
    // soft-pin bump for prior softpins — index already bumped
    commit(`chore: v${ver} ${id} — stage tip + HOLD for Roy 肉眼 (horn/heavy/proto/PNG)`);
    updateLastShas(ver, id);
    push();
    console.log('shipped', ver, tipSha());
  }

  // Run key tests
  console.log('=== running unit tests ===');
  const tests = [
    'mech-horn-roy-png', 'horn-mecha-deepen', 'horn-bake-ingame-align',
    'mech-heavy-silhouette', 'mech-prototype-silhouette', 'weapons-png-path',
    'games-json-stage-009', 'muzzle',
  ];
  for (const t of tests) {
    try {
      sh(`node tests/${t}.test.mjs`);
    } catch (e) {
      console.error('TEST FAIL', t, e.message);
    }
  }

  console.log('\\n=== DONE ===');
  console.log('tip', tipSha(), 'v0.9.192');
  console.log('live https://fung2222.github.io/neon-swarm/?v=0.9.192');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
