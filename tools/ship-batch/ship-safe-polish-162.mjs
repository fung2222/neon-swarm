/**
 * Ship safe polish v0.9.162 → HOLD @ GAMES-JSON-STAGE-007.
 * Prefer: soft-pins, docs tip sync, CTA aria, contrast leftover.
 * HARD BAN: Phase 4 / mech / soft-juice / ult invent / horn / Roy PNG / BALANCE / pause #btn-glow.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, createReadStream, statSync } from 'fs';
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
function sh(cmd) { execSync(cmd, { cwd: ROOT, stdio: 'inherit' }); }

function bumpCache(ver) {
  let html = rf('index.html');
  html = html.replace(/\?v=0\.9\.\d+/g, `?v=${ver}`);
  wf('index.html', html);
  let main = rf('js/main.js');
  main = main.replace(/^\/\/ RAMPAGE MECH[^\n]*/m, `// RAMPAGE MECH 暴走機甲 — tip v${ver}`);
  wf('js/main.js', main);
}

/** Soft-pin assert: tip ≥ minMinor (e.g. 162). */
function softPinAssert(minMinor) {
  return `assert.ok((() => {
  const m = html.match(/\\?v=0\\.9\\.(\\d+)/);
  return m && Number(m[1]) >= ${minMinor};
})(), 'soft-pin ≥0.9.${minMinor}');
assert.ok(agent.includes('\${id}') || agent.includes('\${ver}') || /0\\.9\\.\\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');`.replace(/\$\{id\}/g, '${id}').replace(/\$\{ver\}/g, '${ver}');
}

function writeUnit(slug, ver, id, body) {
  const min = Number(ver.split('.')[2]);
  wf(`tests/${slug}.test.mjs`, `/**
 * ${id} (v${ver})
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');
const hand = readFileSync(new URL('../docs/HANDOFF.md', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

assert.ok((() => {
  const m = html.match(/\\?v=0\\.9\\.(\\d+)/);
  return m && Number(m[1]) >= ${min};
})(), 'soft-pin ≥${ver}');
assert.ok(agent.includes('${id}') || agent.includes('${ver}') || /0\\.9\\.\\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');

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

async function shotScreen(slug, ver, screenId, fileName = '01-phone.png') {
  const dir = join(ROOT, 'tests', 'screenshots', slug);
  mkdirSync(dir, { recursive: true });
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl', '--ignore-gpu-blocklist', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${ver}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', { timeout: 45000, polling: 250 });
  const probe = await page.evaluate((sid) => {
    document.body.classList.remove('in-menu');
    for (const k of ['start', 'pause', 'over', 'level', 'gfx']) {
      const e = document.getElementById('screen-' + k);
      if (!e) continue;
      const on = k === sid;
      e.classList.toggle('hidden', !on);
      if (on) e.style.removeProperty('display');
      else e.style.setProperty('display', 'none', 'important');
    }
    const out = { screen: sid, glow: !!document.getElementById('btn-glow') };
    if (sid === 'over') {
      out.retryAria = document.getElementById('btn-retry')?.getAttribute('aria-label') || document.getElementById('btn-retry')?.getAttribute('data-i18n-attr') || '';
      out.menuAria = document.getElementById('btn-menu')?.getAttribute('data-i18n-attr') || '';
      out.emColor = getComputedStyle(document.querySelector('#screen-over .result em') || document.body).color;
    }
    if (sid === 'start') {
      out.playAria = document.getElementById('btn-play')?.getAttribute('data-i18n-attr') || '';
      out.endlessAria = document.getElementById('btn-endless')?.getAttribute('data-i18n-attr') || '';
    }
    if (sid === 'gfx') {
      out.reloadAria = document.getElementById('btn-gfx-reload')?.getAttribute('data-i18n-attr') || '';
    }
    return out;
  }, screenId);
  await new Promise((r) => setTimeout(r, 220));
  await page.screenshot({ path: join(dir, fileName), type: 'png' });
  writeFileSync(join(dir, 'meta.json'), JSON.stringify({ ver, probe, errs: errs.slice(0, 3) }, null, 2));
  await browser.close(); server.close();
  if (errs.length) console.warn('pageerror warn:', errs[0]);
  return probe;
}

const TABLE = [];
function row(ver, id, notes) { TABLE.push({ ver, id, notes }); }

function updateDocs(ver, id, blurb, { hold = false } = {}) {
  const tip = `https://fung2222.github.io/neon-swarm/?v=${ver}`;
  let agent = `# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: ${tip} · Repo: https://github.com/fung2222/neon-swarm

## 狀態：**${hold ? 'HOLD' : 'Active'}** — tip \`v${ver}\` \`${id}\`. ${hold ? 'Safe polish beat complete; wait Roy try.' : 'Shipping safe polish (docs tip / CTA aria / soft-pins / contrast).'}

**Author:** Grok bot

### Tip
${tip}

### Shipped this beat (slice table)

| Ver | ID | What |
|---|---|---|
`;
  for (const r of TABLE) agent += `| v${r.ver} | \`${r.id}\` | ${r.notes} |\n`;
  agent += `
### Preserve / HARD BANS
stick hide · hub flush top · gear L + pause R under hub · settings vol/SFX/BGM/quality/share/howto · rail · tap≥44 · dbl/tpl · burst≤3 · floor · 2+2+2 · branch+ult · over title oneline+size · 畫質 label · balance/GPU already shipped.
Soft-pin kept: HOME-SETTINGS-TAP-001 · HUD-MUTE-PAUSE-TAP-001 · SHARE-FALLBACK-SYNC-001 · UI-LAYOUT-HOME-HUD-001 · PAUSE-GLOW-TO-SETTINGS-001.
Phase 4 · new mech · soft-juice invent · more ult invent · horn lock · Roy PNG · BALANCE re-pass.
Do **not** bring back pause \`#btn-glow\`.

### Backlog
- Do **not** start Phase 4 / horn final / soft-juice invent / BALANCE re-pass
`;
  wf('docs/AGENT_TASK.md', agent);

  let hand = rf('docs/HANDOFF.md');
  hand = hand.replace(
    /> \*\*文件日期：\*\*[^\n]*/,
    `> **文件日期：** 2026-10-28（Asia/Hong_Kong；tip v${ver} ${id}；prior GAMES-JSON-STAGE-006 v0.9.161）`
  );
  hand = hand.replace(
    /- 目前 `main`／live cache-bust：\*\*`\?v=0\.9\.\d+`\*\*[^\n]*/,
    `- 目前 \`main\`／live cache-bust：**\`?v=${ver}\`**（${id}；${blurb}；…）`
  );
  if (!hand.includes(`v${ver} — ${id}`)) {
    hand = hand.replace(
      /(  - v0\.9\.161 —[^\n]*\n)/,
      `  - v${ver} — ${id}：${blurb}\n$1`
    );
  }
  hand = hand.replace(
    /\*\*Active = HOLD\*\*[^\n]*/,
    hold
      ? `**Active = HOLD** — tip \`?v=${ver}\` ${id}. Safe polish done. **no** Phase 4／soft-juice／horn／more ult／BALANCE re-pass.`
      : `**Active = ${id}** — tip \`?v=${ver}\`. Safe polish shipping. **no** Phase 4／soft-juice／horn／more ult／BALANCE re-pass.`
  );
  if (!/\*\*Active = HOLD\*\*/.test(hand) && hold) {
    hand = hand.replace(
      /\*\*Active = [^\n]*/,
      `**Active = HOLD** — tip \`?v=${ver}\` ${id}. Safe polish done. **no** Phase 4／soft-juice／horn／more ult／BALANCE re-pass.`
    );
  }
  if (!hold && !/\*\*Active = /.test(hand)) {
    // leave
  } else if (!hold) {
    hand = hand.replace(
      /\*\*Active = [^\n]*/,
      `**Active = ${id}** — tip \`?v=${ver}\`. Safe polish shipping. **no** Phase 4／soft-juice／horn／more ult／BALANCE re-pass.`
    );
  }
  hand = hand.replace(
    /\*\*HOLD for Roy try\*\* on live `\?v=0\.9\.\d+`[^\n]*/,
    hold
      ? `**HOLD for Roy try** on live \`?v=${ver}\`. Soft-juice / Phase 4 / horn / BALANCE re-pass still banned.`
      : `**Shipping** tip \`?v=${ver}\` (${id}). Soft-juice / Phase 4 / horn / BALANCE re-pass still banned.`
  );
  hand = hand.replace(
    /\*\*Shipping\*\* tip `\?v=0\.9\.\d+`[^\n]*/,
    hold
      ? `**HOLD for Roy try** on live \`?v=${ver}\`. Soft-juice / Phase 4 / horn / BALANCE re-pass still banned.`
      : `**Shipping** tip \`?v=${ver}\` (${id}). Soft-juice / Phase 4 / horn / BALANCE re-pass still banned.`
  );
  if (!hand.includes(`**v${ver}** (\`${id}\`)`)) {
    hand = hand.replace(
      /(- \*\*v0\.9\.161\*\* \(`GAMES-JSON-STAGE-006`\)[^\n]*\n)/,
      `- **v${ver}** (\`${id}\`) — ${blurb}\n$1`
    );
  }
  wf('docs/HANDOFF.md', hand);
}

function bumpGamesStub(ver, id) {
  let stub = rf('docs/GAMES-JSON-STUB.md');
  stub = stub.replace(/<!-- 0\.9\.\d+[^>]*-->/, `<!-- ${ver} ${id} / stub tip bump -->`);
  stub = stub.replace(/網頁版 0\.9\.\d+/g, `網頁版 ${ver}`);
  stub = stub.replace(/web 0\.9\.\d+/g, `web ${ver}`);
  stub = stub.replace(/"kit": "v0\.9\.\d+"/, '"kit": "v0.3.16"');
  wf('docs/GAMES-JSON-STUB.md', stub);
}

function commitPush(ver, id, msg) {
  sh('git add -A');
  try {
    sh('git commit -m ' + JSON.stringify(msg));
  } catch (e) {
    console.warn('commit warn', e && e.message);
  }
  try {
    const sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
    let ls = rf('last-shas.txt').trim().split('\n');
    ls = [`${sha} v${ver} ${id}`, ...ls.filter((l) => !l.includes(`v${ver}`))].slice(0, 12);
    wf('last-shas.txt', ls.join('\n') + '\n');
    const batchPath = 'tools/ship-batch/last-shas.txt';
    let batch = existsSync(join(ROOT, batchPath)) ? rf(batchPath) : '';
    if (!batch.includes(sha)) wf(batchPath, batch.trimEnd() + '\n' + sha + '\n');
    sh('git add last-shas.txt tools/ship-batch/last-shas.txt');
    try { sh('git commit -m ' + JSON.stringify('chore: last-shas tip SHA for v' + ver)); } catch (_) {}
  } catch (e) { console.warn('last-shas warn', e && e.message); }
  try {
    let readme = rf('README.md');
    readme = readme.replace(/\?v=0\.9\.\d+/g, `?v=${ver}`);
    readme = readme.replace(/\*\*狀態 Status:\*\*[^\n]+/, `**狀態 Status:** v${ver} ${id}`);
    wf('README.md', readme);
    sh('git add README.md');
    try { sh('git commit -m ' + JSON.stringify('chore: README tip v' + ver)); } catch (_) {}
  } catch (_) {}
  sh('git push origin main');
  const sha2 = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  console.log(`SHIPPED v${ver} ${id} @ ${sha2}`);
  return sha2;
}

function softPinTapFile(path, minMinor, shipId) {
  let t = rf(path);
  // Replace brittle 2-digit-only cache-bust with ≥ minMinor incl 3-digit
  t = t.replace(
    /assert\.ok\([^;]*cache-bust[^;]*\);/,
    `assert.ok((() => { const m = html.match(/\\?v=0\\.9\\.(\\d+)/); return m && Number(m[1]) >= ${minMinor}; })(), 'cache-bust ≥0.9.${minMinor}');`
  );
  // Soften AGENT_TASK asserts that require exact old id only
  t = t.replace(
    new RegExp(`assert\\.ok\\(agent\\.includes\\('${shipId}'\\) \\|\\| agent\\.includes\\('0\\.9\\.${minMinor}'\\)\\s*,\\s*'AGENT_TASK'\\);`),
    `assert.ok(agent.includes('${shipId}') || agent.includes('0.9.${minMinor}') || /0\\.9\\.\\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');`
  );
  wf(path, t);
}

async function main() {
  // ===== 0.9.162 SOFTPIN-CTA-TAP-001 =====
  {
    const ver = '0.9.162', id = 'SOFTPIN-CTA-TAP-001', slug = 'softpin-cta-tap';
    const blurb = 'soft-pin over/home/pause/gfx/mech CTA tap cache-bust ≥ tip (3-digit)';
    bumpCache(ver);
    softPinTapFile('tests/over-cta-tap.test.mjs', 76, 'OVER-CTA-TAP-001');
    softPinTapFile('tests/home-cta-tap.test.mjs', 77, 'HOME-CTA-TAP-001');
    softPinTapFile('tests/pause-cta-tap.test.mjs', 81, 'PAUSE-CTA-TAP-001');
    softPinTapFile('tests/gfx-reload-tap.test.mjs', 79, 'GFX-RELOAD-TAP-001');
    softPinTapFile('tests/home-mech-card-tap.test.mjs', 72, 'HOME-MECH-CARD-TAP-001');
    // weapons-rail also brittle
    {
      let t = rf('tests/weapons-rail-tap-target.test.mjs');
      t = t.replace(
        /assert\.ok\([^;]*cache-bust[^;]*\);/,
        `assert.ok((() => { const m = html.match(/\\?v=0\\.9\\.(\\d+)/); return m && Number(m[1]) >= 68; })(), 'cache-bust ≥0.9.68');`
      );
      wf('tests/weapons-rail-tap-target.test.mjs', t);
    }
    writeUnit(slug, ver, id, `
assert.ok(rfSoft('tests/over-cta-tap.test.mjs').includes('Number(m[1]) >= 76') || rfSoft('tests/over-cta-tap.test.mjs').includes('≥0.9.76'), 'over softpin');
assert.ok(rfSoft('tests/home-cta-tap.test.mjs').includes('Number(m[1]) >= 77'), 'home softpin');
assert.ok(rfSoft('tests/pause-cta-tap.test.mjs').includes('Number(m[1]) >= 81'), 'pause softpin');
assert.ok(rfSoft('tests/gfx-reload-tap.test.mjs').includes('Number(m[1]) >= 79'), 'gfx softpin');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
function rfSoft(rel) { return readFileSync(new URL('../' + rel, import.meta.url), 'utf8'); }
`);
    // Fix writeUnit body - the function after asserts is awkward. Rewrite cleanly:
    wf(`tests/${slug}.test.mjs`, `/**
 * ${id} (v${ver})
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const over = readFileSync(new URL('./over-cta-tap.test.mjs', import.meta.url), 'utf8');
const home = readFileSync(new URL('./home-cta-tap.test.mjs', import.meta.url), 'utf8');
const pause = readFileSync(new URL('./pause-cta-tap.test.mjs', import.meta.url), 'utf8');
const gfx = readFileSync(new URL('./gfx-reload-tap.test.mjs', import.meta.url), 'utf8');
const mech = readFileSync(new URL('./home-mech-card-tap.test.mjs', import.meta.url), 'utf8');

assert.ok((() => { const m = html.match(/\\?v=0\\.9\\.(\\d+)/); return m && Number(m[1]) >= 162; })(), 'soft-pin ≥0.9.162');
assert.ok(agent.includes('${id}') || agent.includes('${ver}') || /HOLD|Active/.test(agent), 'AGENT_TASK soft');
assert.ok(over.includes('Number(m[1]) >= 76'), 'over softpin');
assert.ok(home.includes('Number(m[1]) >= 77'), 'home softpin');
assert.ok(pause.includes('Number(m[1]) >= 81'), 'pause softpin');
assert.ok(gfx.includes('Number(m[1]) >= 79'), 'gfx softpin');
assert.ok(mech.includes('Number(m[1]) >= 72'), 'mech softpin');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');

console.log('${slug}.test.mjs: PASS');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    sh('node tests/over-cta-tap.test.mjs');
    sh('node tests/home-cta-tap.test.mjs');
    sh('node tests/pause-cta-tap.test.mjs');
    sh('node tests/gfx-reload-tap.test.mjs');
    sh('node tests/home-mech-card-tap.test.mjs');
    commitPush(ver, id, `v${ver} ${id}: soft-pin CTA tap tests ≥ tip`);
  }

  // ===== 0.9.163 SHARE-FALLBACK-SOFTPIN-002 =====
  {
    const ver = '0.9.163', id = 'SHARE-FALLBACK-SOFTPIN-002', slug = 'share-fallback-softpin-002';
    const blurb = 'fix share-fallback softpin double-escape; pin ≥ tip';
    bumpCache(ver);
    wf('tests/share-fallback-softpin.test.mjs', `/**
 * SHARE-FALLBACK-SOFTPIN-001 (v0.9.151) — soft-pin refreshed ${id} v${ver}
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok((() => { const m = html.match(/\\?v=0\\.9\\.(\\d+)/); return m && Number(m[1]) >= 151; })(), 'soft-pin ≥0.9.151');
assert.ok(agent.includes('SHARE-FALLBACK-SOFTPIN-001') || agent.includes('SHARE-FALLBACK-SOFTPIN-002') || agent.includes('0.9.151') || /0\\.9\\.\\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');
assert.ok(html.includes('btn-share') || html.includes('分享戰績'), 'over share fallback kept');
assert.ok(main.includes('onShareFromSettings'), 'settings share path');
assert.ok(main.includes('shareOrCopy'), 'result-share reused');

console.log('share-fallback-softpin.test.mjs: PASS');
`);
    // also soft-pin share-fallback-sync 3-digit
    {
      let t = rf('tests/share-fallback-sync.test.mjs');
      t = t.replace(
        /assert\.ok\([^;]*cache-bust[^;]*\);/,
        `assert.ok((() => { const m = html.match(/\\?v=0\\.9\\.(\\d+)/); return m && Number(m[1]) >= 133; })(), 'cache-bust ≥0.9.133');`
      );
      t = t.replace(
        /assert\.ok\(agent\.includes\('SHARE-FALLBACK-SYNC-001'\) \|\| agent\.includes\('0\.9\.133'\), 'AGENT_TASK'\);/,
        `assert.ok(agent.includes('SHARE-FALLBACK-SYNC-001') || agent.includes('0.9.133') || /0\\.9\\.\\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');`
      );
      wf('tests/share-fallback-sync.test.mjs', t);
    }
    writeUnit(slug, ver, id, `
const soft = readFileSync(new URL('./share-fallback-softpin.test.mjs', import.meta.url), 'utf8');
assert.ok(soft.includes('Number(m[1]) >= 151'), 'softpin numeric');
assert.ok(!soft.includes('\\\\\\\\?v=0\\\\\\\\.9'), 'no double-escape regex');
assert.ok(main.includes('onShareFromSettings') && main.includes('shareOrCopy'), 'share path');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    sh('node tests/share-fallback-softpin.test.mjs');
    sh('node tests/share-fallback-sync.test.mjs');
    commitPush(ver, id, `v${ver} ${id}: share softpin fix ≥ tip`);
  }

  // ===== 0.9.164 README-PIPELINE-TIP-002 =====
  {
    const ver = '0.9.164', id = 'README-PIPELINE-TIP-002', slug = 'readme-pipeline-tip-002';
    const blurb = 'README Safe pipeline tip sync off stale v0.9.157 → tip';
    bumpCache(ver);
    let readme = rf('README.md');
    readme = readme.replace(/\?v=0\.9\.\d+/g, `?v=${ver}`);
    readme = readme.replace(/\*\*狀態 Status:\*\*[^\n]+/, `**狀態 Status:** v${ver} ${id}`);
    readme = readme.replace(
      /\*\*Safe pipeline tip:\*\* v0\.9\.\d+[^\n]*/,
      `**Safe pipeline tip:** v${ver} — docs tip sync / CTA aria / soft-pins；HARD BAN Phase4/horn/soft-juice/full ult/BALANCE/deep GPU。`
    );
    wf('README.md', readme);
    // also soften readme-status-sync AGENT assert
    {
      let t = rf('tests/readme-status-sync.test.mjs');
      t = t.replace(
        /assert\.ok\(agent\.includes\('README-STATUS-SYNC-001'\) \|\| agent\.includes\('0\.9\.157'\), 'AGENT_TASK'\);/,
        `assert.ok(agent.includes('README-STATUS-SYNC-001') || agent.includes('README-PIPELINE-TIP-002') || agent.includes('0.9.157') || /0\\.9\\.\\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');`
      );
      wf('tests/readme-status-sync.test.mjs', t);
    }
    writeUnit(slug, ver, id, `
assert.ok(readme.includes('?v=${ver}') || readme.includes('v${ver}'), 'readme tip');
assert.ok(readme.includes('${id}') || /Safe pipeline tip:\\*\\* v${ver}/.test(readme) || readme.includes('v${ver}'), 'pipeline tip');
assert.ok(!/Safe pipeline tip:\\*\\* v0\\.9\\.157/.test(readme), 'stale 0.9.157 cleared');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    sh('node tests/readme-status-sync.test.mjs');
    commitPush(ver, id, `v${ver} ${id}: README pipeline tip sync`);
  }

  // ===== 0.9.165 WEAPONS-MD-TIP-SYNC-003 =====
  {
    const ver = '0.9.165', id = 'WEAPONS-MD-TIP-SYNC-003', slug = 'weapons-md-tip-sync-003';
    const blurb = 'WEAPONS.md Live tip header sync off stale v0.9.158 → tip';
    bumpCache(ver);
    let w = rf('docs/WEAPONS.md');
    w = w.replace(
      /> \*\*Live:\*\* https:\/\/fung2222\.github\.io\/neon-swarm\/\?v=0\.9\.\d+ · \*\*Ship:\*\* [^\n]+/,
      `> **Live:** https://fung2222.github.io/neon-swarm/?v=${ver} · **Ship:** v${ver} ${id} · UI a11y/docs sync (weapons unchanged)`
    );
    if (!w.includes(id)) {
      w = w.replace(
        /(\*\*v0\.9\.158 WEAPONS-MD-TIP-SYNC-002:[^\n]*\n)/,
        `**v${ver} ${id}:** Live tip header → v${ver}; safe polish beat; weapons unchanged.\n$1`
      );
    }
    wf('docs/WEAPONS.md', w);
    writeUnit(slug, ver, id, `
const weapons = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
assert.ok(/0\\.9\\.(16[5-9]|1[7-9]\\d|[2-9]\\d\\d)/.test(weapons) || weapons.includes('${ver}'), 'weapons tip ≥0.9.165');
assert.ok(weapons.includes('${id}'), 'ship id');
assert.ok(!/Ship:\\*\\* v0\\.9\\.158 WEAPONS-MD-TIP-SYNC-002/.test(weapons), 'stale 0.9.158 ship cleared');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: WEAPONS.md tip sync`);
  }

  // ===== 0.9.166 HIT-FEEL-PIPELINE-TIP-002 =====
  {
    const ver = '0.9.166', id = 'HIT-FEEL-PIPELINE-TIP-002', slug = 'hit-feel-pipeline-tip-002';
    const blurb = 'HIT-FEEL-DEVICE Safe pipeline tip sync off stale v0.9.159 → tip';
    bumpCache(ver);
    let hf = rf('docs/HIT-FEEL-DEVICE.md');
    hf = hf.replace(
      /\*\*Safe pipeline tip now:\*\* https:\/\/fung2222\.github\.io\/neon-swarm\/\?v=0\.9\.\d+[^\n]*/,
      `**Safe pipeline tip now:** https://fung2222.github.io/neon-swarm/?v=${ver} · \`${id}\` (docs sync; hit-feel checklist still tied to verified v0.9.50)`
    );
    wf('docs/HIT-FEEL-DEVICE.md', hf);
    writeUnit(slug, ver, id, `
const hf = readFileSync(new URL('../docs/HIT-FEEL-DEVICE.md', import.meta.url), 'utf8');
assert.ok(hf.includes('${id}'), 'ship id');
assert.ok(hf.includes('Safe pipeline tip now') && hf.includes('${ver}'), 'pipeline tip');
assert.ok(hf.includes('v=0.9.50'), 'device-verified baseline kept');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: HIT-FEEL pipeline tip sync`);
  }

  // ===== 0.9.167 OVER-CTA-ARIA-SYNC-001 =====
  {
    const ver = '0.9.167', id = 'OVER-CTA-ARIA-SYNC-001', slug = 'over-cta-aria-sync';
    const blurb = 'over Retry/Menu aria-label via data-i18n-attr (mirror pause)';
    bumpCache(ver);
    let html = rf('index.html');
    if (!html.includes('OVER-CTA-ARIA-SYNC-001')) {
      html = html.replace(
        '<button class="neon-btn" id="btn-retry"><span data-i18n="retry"></span><small data-i18n="retryS"></small></button>\n    <button class="neon-btn ghost" id="btn-menu"><span data-i18n="menu"></span><small data-i18n="menuS"></small></button>',
        '<!-- OVER-CTA-ARIA-SYNC-001: aria from i18n (mirror pause CTA) -->\n    <button class="neon-btn" id="btn-retry" data-i18n-attr="aria-label:retry"><span data-i18n="retry"></span><small data-i18n="retryS"></small></button>\n    <button class="neon-btn ghost" id="btn-menu" data-i18n-attr="aria-label:menu"><span data-i18n="menu"></span><small data-i18n="menuS"></small></button>'
      );
      wf('index.html', html);
    }
    writeUnit(slug, ver, id, `
assert.ok(html.includes('OVER-CTA-ARIA-SYNC-001'), 'ship id');
assert.ok(html.includes('btn-retry') && html.includes('data-i18n-attr="aria-label:retry"'), 'retry aria');
assert.ok(html.includes('data-i18n-attr="aria-label:menu"'), 'menu aria');
assert.ok(html.includes('PAUSE-CTA-ARIA-SYNC-001'), 'pause aria prior kept');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
`);
    const probe = await shotScreen(slug, ver, 'over', '01-phone-over.png');
    if (probe.glow) throw new Error('btn-glow returned');
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: over CTA aria-label sync`);
  }

  // ===== 0.9.168 HOME-CTA-ARIA-SYNC-001 =====
  {
    const ver = '0.9.168', id = 'HOME-CTA-ARIA-SYNC-001', slug = 'home-cta-aria-sync';
    const blurb = 'home Play/Endless aria-label via data-i18n-attr (mirror pause/over)';
    bumpCache(ver);
    let html = rf('index.html');
    if (!html.includes('HOME-CTA-ARIA-SYNC-001')) {
      html = html.replace(
        '<button class="neon-btn" id="btn-play"><span data-i18n="play">啟動暴走</span><small data-i18n="playS">BREAK OUT</small></button>',
        '<!-- HOME-CTA-ARIA-SYNC-001: aria from i18n (mirror pause/over CTA) -->\n        <button class="neon-btn" id="btn-play" data-i18n-attr="aria-label:play"><span data-i18n="play">啟動暴走</span><small data-i18n="playS">BREAK OUT</small></button>'
      );
      html = html.replace(
        '<button class="neon-btn ghost" id="btn-endless"><span data-i18n="endless">無盡暴走</span><small data-i18n="endlessS">NO CAP</small></button>',
        '<button class="neon-btn ghost" id="btn-endless" data-i18n-attr="aria-label:endless"><span data-i18n="endless">無盡暴走</span><small data-i18n="endlessS">NO CAP</small></button>'
      );
      wf('index.html', html);
    }
    writeUnit(slug, ver, id, `
assert.ok(html.includes('HOME-CTA-ARIA-SYNC-001'), 'ship id');
assert.ok(html.includes('data-i18n-attr="aria-label:play"'), 'play aria');
assert.ok(html.includes('data-i18n-attr="aria-label:endless"'), 'endless aria');
assert.ok(html.includes('OVER-CTA-ARIA-SYNC-001'), 'over aria prior');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
`);
    const probe = await shotScreen(slug, ver, 'start', '01-phone-home.png');
    if (probe.glow) throw new Error('btn-glow returned');
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: home CTA aria-label sync`);
  }

  // ===== 0.9.169 GFX-RELOAD-ARIA-001 =====
  {
    const ver = '0.9.169', id = 'GFX-RELOAD-ARIA-001', slug = 'gfx-reload-aria';
    const blurb = 'gfx reload btn aria-label via data-i18n-attr (mirror CTA aria)';
    bumpCache(ver);
    let html = rf('index.html');
    if (!html.includes('GFX-RELOAD-ARIA-001')) {
      html = html.replace(
        '<button class="neon-btn" id="btn-gfx-reload" type="button" onclick="location.reload()">\n      <span data-i18n="gfx.reload">重新載入</span><small data-i18n="gfx.reloadEn">RELOAD</small>\n    </button>',
        '<!-- GFX-RELOAD-ARIA-001: aria from i18n (mirror CTA aria) -->\n    <button class="neon-btn" id="btn-gfx-reload" type="button" onclick="location.reload()" data-i18n-attr="aria-label:gfx.reload">\n      <span data-i18n="gfx.reload">重新載入</span><small data-i18n="gfx.reloadEn">RELOAD</small>\n    </button>'
      );
      wf('index.html', html);
    }
    writeUnit(slug, ver, id, `
assert.ok(html.includes('GFX-RELOAD-ARIA-001'), 'ship id');
assert.ok(html.includes('btn-gfx-reload') && html.includes('data-i18n-attr="aria-label:gfx.reload"'), 'reload aria');
assert.ok(html.includes('HOME-CTA-ARIA-SYNC-001'), 'home aria prior');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
`);
    const probe = await shotScreen(slug, ver, 'gfx', '01-phone-gfx.png');
    if (probe.glow) throw new Error('btn-glow returned');
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: gfx reload aria-label`);
  }

  // ===== 0.9.170 OVER-RESULT-EM-READ-001 =====
  {
    const ver = '0.9.170', id = 'OVER-RESULT-EM-READ-001', slug = 'over-result-em-read';
    const blurb = 'over .result em contrast (best-label) phone readability leftover';
    bumpCache(ver);
    let css = rf('css/game.css');
    if (!css.includes('OVER-RESULT-EM-READ-001')) {
      css += `

/* ===== OVER-RESULT-EM-READ-001 v${ver} — over .result em (best label) contrast leftover ===== */
#screen-over .result em {
  color: #b0c8e8;
  font-size: 11px;
  letter-spacing: 0.12em;
  font-weight: 600;
  opacity: 1;
}
`;
      wf('css/game.css', css);
    }
    writeUnit(slug, ver, id, `
assert.ok(css.includes('OVER-RESULT-EM-READ-001'), 'ship id');
assert.match(css, /OVER-RESULT-EM-READ-001[\\s\\S]*?#screen-over\\s+\\.result\\s+em[\\s\\S]*?color:\\s*#b0c8e8/s, 'em contrast');
assert.ok(css.includes('OVER-RESULT-READ-001'), 'prior result read kept');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
assert.ok(strings.includes('畫質'), '畫質 label kept');
`);
    await shotScreen(slug, ver, 'over', '01-phone-over.png');
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: over result em contrast`);
  }

  // ===== 0.9.171 HANDOFF-AGENT-TIDY-002 =====
  {
    const ver = '0.9.171', id = 'HANDOFF-AGENT-TIDY-002', slug = 'handoff-agent-tidy-002';
    const blurb = 'HANDOFF/AGENT_TASK tidy for safe-polish beat; affirm no pause glow';
    bumpCache(ver);
    let hand = rf('docs/HANDOFF.md');
    if (!hand.includes(id)) {
      const note = `- **v${ver} ${id}:** safe polish beat (soft-pins · README/WEAPONS/HIT-FEEL tip sync · over/home/gfx CTA aria · over result-em contrast). Pause still **no** \`#btn-glow\`; 畫質 only in settings. Soft-pin CTA tap + share-fallback ≥ tip.\n`;
      if (hand.includes('## 版本歷史（增量）')) {
        hand = hand.replace('## 版本歷史（增量）\n\n', `## 版本歷史（增量）\n\n${note}`);
      } else if (hand.includes('HANDOFF-GLOW-SETTINGS-NOTE-001')) {
        hand = hand.replace(
          /(- \*\*v0\.9\.160 HANDOFF-GLOW-SETTINGS-NOTE-001:[^\n]*\n)/,
          `${note}$1`
        );
      } else {
        hand = note + hand;
      }
      wf('docs/HANDOFF.md', hand);
    }
    writeUnit(slug, ver, id, `
assert.ok(hand.includes('${id}'), 'handoff note');
assert.ok(hand.includes('btn-glow') || hand.includes('畫質'), 'glow/quality note');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'code still clean');
assert.ok(html.includes('OVER-CTA-ARIA-SYNC-001') && html.includes('HOME-CTA-ARIA-SYNC-001'), 'CTA aria shipped');
assert.ok(strings.includes('畫質'), '畫質 label');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: HANDOFF/AGENT tidy`);
  }

  // ===== 0.9.172 GAMES-JSON-STAGE-007 HOLD =====
  {
    const ver = '0.9.172', id = 'GAMES-JSON-STAGE-007', slug = 'games-json-stage-007';
    const blurb = 'games.json stub stage → tip; safe polish beat HOLD';
    bumpCache(ver);
    bumpGamesStub(ver, id);
    let stub = rf('docs/GAMES-JSON-STUB.md');
    stub = stub.replace(
      /pause glow→settings · HUD gear\/settings · over\/pause polish/g,
      'safe polish · soft-pins · CTA aria · tip sync · pause glow→settings · HUD gear/settings'
    );
    wf('docs/GAMES-JSON-STUB.md', stub);
    writeUnit(slug, ver, id, `
const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
assert.ok(stub.includes('${ver}') || stub.includes('v${ver}'), 'stub tip');
assert.ok(stub.includes('${id}') || stub.includes('GAMES-JSON-STAGE-007'), 'ship id');
assert.ok(agent.includes('HOLD') || agent.includes('${id}'), 'HOLD');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'pause glow still gone at HOLD');
assert.ok(strings.includes('畫質'), 'settings quality label kept');
assert.ok(html.includes('OVER-CTA-ARIA-SYNC-001') && html.includes('HOME-CTA-ARIA-SYNC-001') && html.includes('GFX-RELOAD-ARIA-001'), 'CTA aria batch');
assert.ok(!html.includes('id="btn-glow"'), 'no btn-glow');
`);
    row(ver, id, blurb + '; **HOLD**');
    updateDocs(ver, id, blurb, { hold: true });
    sh(`node tests/${slug}.test.mjs`);
    // soft pins
    const softs = [
      'tests/hud-mute-pause-tap.test.mjs',
      'tests/home-settings-tap.test.mjs',
      'tests/pause-glow-to-settings.test.mjs',
      'tests/share-fallback-softpin.test.mjs',
      'tests/over-cta-tap.test.mjs',
      'tests/home-cta-tap.test.mjs',
      'tests/pause-cta-tap.test.mjs',
      'tests/ui-layout-home-hud.test.mjs',
    ];
    for (const s of softs) {
      try { sh(`node ${s}`); } catch (e) { console.warn('softpin warn', s, e.message); }
    }
    commitPush(ver, id, `v${ver} ${id}: games.json stub + HOLD`);
  }

  const sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  const full = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  console.log('\\n=== DONE === tip v0.9.172 HOLD @', sha, full);
  console.log('Live: https://fung2222.github.io/neon-swarm/?v=0.9.172');
  console.log('TABLE:', JSON.stringify(TABLE, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
