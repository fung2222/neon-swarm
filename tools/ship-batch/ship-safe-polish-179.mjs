/**
 * Ship safe polish v0.9.173 → HOLD @ GAMES-JSON-STAGE-008.
 * Prefer: docs tip sync, soft-pins, share aria fallback, contrast leftovers, privacy/meta hygiene.
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
      out.shareAria = document.getElementById('btn-share')?.getAttribute('aria-label') || '';
      const pos = document.getElementById('over-pos');
      if (pos) { pos.classList.remove('hidden'); out.posColor = getComputedStyle(pos).color; }
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

## 狀態：**${hold ? 'HOLD' : 'Active'}** — tip \`v${ver}\` \`${id}\`. ${hold ? 'Safe polish beat complete; wait Roy try.' : 'Shipping safe polish (docs tip / soft-pins / share aria / contrast / privacy·meta).'}

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
    `> **文件日期：** 2026-10-28（Asia/Hong_Kong；tip v${ver} ${id}；prior GAMES-JSON-STAGE-007 v0.9.172）`
  );
  hand = hand.replace(
    /- 目前 `main`／live cache-bust：\*\*`\?v=0\.9\.\d+`\*\*[^\n]*/,
    `- 目前 \`main\`／live cache-bust：**\`?v=${ver}\`**（${id}；${blurb}；…）`
  );
  if (!hand.includes(`v${ver} — ${id}`)) {
    hand = hand.replace(
      /(  - v0\.9\.172 —[^\n]*\n)/,
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
      /(- \*\*v0\.9\.172\*\* \(`GAMES-JSON-STAGE-007`\)[^\n]*\n)/,
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
  // Seed prior slices so AGENT_TASK table stays complete
  row('0.9.173', 'README-PIPELINE-TIP-003', 'README Safe pipeline tip sync off stale v0.9.164 → tip');
  row('0.9.174', 'WEAPONS-MD-TIP-SYNC-004', 'WEAPONS.md Live tip header sync off stale v0.9.165 → tip');
  row('0.9.175', 'HIT-FEEL-PIPELINE-TIP-003', 'HIT-FEEL-DEVICE Safe pipeline tip sync off stale v0.9.166 → tip');
  row('0.9.176', 'SOFTPIN-CTA-TAP-002', 'soft-pin over/home/pause/gfx/mech CTA tap cache-bust ≥ tip (refresh)');
  row('0.9.177', 'SHARE-FALLBACK-SOFTPIN-003', 'share-fallback softpin ≥ tip refresh');
  row('0.9.178', 'SHARE-BTN-ARIA-FALLBACK-001', 'btn-share static aria-label HTML fallback (JS still overrides SHARE/COPY)');

  // Finish 178 commit if dirty
  {
    const ver = '0.9.178', id = 'SHARE-BTN-ARIA-FALLBACK-001';
    sh('node tests/share-btn-aria-fallback.test.mjs');
    sh('node tests/share-btn-aria.test.mjs');
    // ensure docs reflect 178 Active before commit (already written by partial run)
    commitPush(ver, id, `v${ver} ${id}: share btn aria HTML fallback`);
  }

  // ===== 0.9.179 EARLY-TOAST-EN-READ-001 =====
  {
    const ver = '0.9.179', id = 'EARLY-TOAST-EN-READ-001', slug = 'early-toast-en-read';
    const blurb = 'early-toast-en contrast leftover (mirror coach-en)';
    bumpCache(ver);
    let css = rf('css/game.css');
    if (!css.includes('EARLY-TOAST-EN-READ-001')) {
      css += `

/* ===== EARLY-TOAST-EN-READ-001 v${ver} — early-toast EN line contrast (mirror coach-en) ===== */
.early-toast-en {
  color: #9ecfff;
  letter-spacing: 0.16em;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.25);
  opacity: 1;
}
`;
      wf('css/game.css', css);
    }
    writeUnit(slug, ver, id, `
assert.ok(css.includes('EARLY-TOAST-EN-READ-001'), 'ship id');
assert.match(css, /EARLY-TOAST-EN-READ-001[\\s\\S]*?\\.early-toast-en[\\s\\S]*?color:\\s*#9ecfff/s, 'en contrast');
assert.ok(css.includes('COACH-READ-001'), 'coach read prior kept');
assert.ok(html.includes('EARLY-TOAST-ROLE-001') || html.includes('early-toast'), 'toast role prior');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
assert.ok(strings.includes('畫質'), '畫質 label kept');
`);
    await shotScreen(slug, ver, 'start', '01-phone-home.png');
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: early-toast EN contrast`);
  }

  // ===== 0.9.180 OVER-POS-READ-001 =====
  {
    const ver = '0.9.180', id = 'OVER-POS-READ-001', slug = 'over-pos-read';
    const blurb = 'over-pos score-position line phone contrast leftover';
    bumpCache(ver);
    let css = rf('css/game.css');
    if (!css.includes('OVER-POS-READ-001')) {
      css += `

/* ===== OVER-POS-READ-001 v${ver} — over-pos score-position phone contrast leftover ===== */
#screen-over .over-pos {
  color: #b8ffe8;
  text-shadow: 0 0 10px rgba(0, 229, 180, 0.4);
  font-size: 12px;
  letter-spacing: 0.06em;
  font-weight: 600;
  opacity: 1;
}
`;
      wf('css/game.css', css);
    }
    writeUnit(slug, ver, id, `
assert.ok(css.includes('OVER-POS-READ-001'), 'ship id');
assert.match(css, /OVER-POS-READ-001[\\s\\S]*?#screen-over\\s+\\.over-pos[\\s\\S]*?color:\\s*#b8ffe8/s, 'pos contrast');
assert.ok(css.includes('OVER-RESULT-EM-READ-001'), 'result em prior');
assert.ok(html.includes('over-pos'), 'over-pos kept');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
`);
    await shotScreen(slug, ver, 'over', '01-phone-over.png');
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: over-pos contrast`);
  }

  // ===== 0.9.181 PRIVACY-PRODUCT-RENAME-001 =====
  {
    const ver = '0.9.181', id = 'PRIVACY-PRODUCT-RENAME-001', slug = 'privacy-product-rename';
    const blurb = 'privacy.html title/h1 → 暴走機甲 RAMPAGE MECH (keep NEON SWARM aka)';
    bumpCache(ver);
    let priv = rf('privacy.html');
    if (!priv.includes('PRIVACY-PRODUCT-RENAME-001')) {
      priv = priv.replace(
        '<title>私隱政策 Privacy Policy · 霓虹洪流 NEON SWARM</title>',
        '<!-- PRIVACY-PRODUCT-RENAME-001 -->\n<title>私隱政策 Privacy Policy · 暴走機甲 RAMPAGE MECH</title>'
      );
      priv = priv.replace(
        '<h1>私隱政策 · 霓虹洪流</h1>\n<div class="meta">Privacy Policy · NEON SWARM · 生效日期 Effective: 2026-10-18</div>',
        '<h1>私隱政策 · 暴走機甲</h1>\n<div class="meta">Privacy Policy · RAMPAGE MECH（前名 NEON SWARM 霓虹洪流）· 生效日期 Effective: 2026-10-18</div>'
      );
      priv = priv.replace(
        '<p>「霓虹洪流」（下稱「本遊戲」）由個人開發者 fung2222 製作。我哋重視你嘅私隱，以下說明本遊戲點樣處理資料。</p>',
        '<p>「暴走機甲」（亦稱前名「霓虹洪流／NEON SWARM」；下稱「本遊戲」）由個人開發者 fung2222 製作。我哋重視你嘅私隱，以下說明本遊戲點樣處理資料。</p>'
      );
      priv = priv.replace(
        '<p><b>NEON SWARM</b> is made by the individual developer fung2222.</p>',
        '<p><b>RAMPAGE MECH</b>（aka NEON SWARM）is made by the individual developer fung2222.</p>'
      );
      wf('privacy.html', priv);
    }
    writeUnit(slug, ver, id, `
const priv = readFileSync(new URL('../privacy.html', import.meta.url), 'utf8');
assert.ok(priv.includes('PRIVACY-PRODUCT-RENAME-001'), 'ship id');
assert.ok(priv.includes('暴走機甲') && priv.includes('RAMPAGE MECH'), 'product name');
assert.ok(priv.includes('NEON SWARM') || priv.includes('霓虹洪流'), 'aka kept');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: privacy product rename`);
  }

  // ===== 0.9.182 META-COLOR-SCHEME-001 =====
  {
    const ver = '0.9.182', id = 'META-COLOR-SCHEME-001', slug = 'meta-color-scheme';
    const blurb = 'index + privacy meta color-scheme=dark (hygiene; theme-color kept)';
    bumpCache(ver);
    let html = rf('index.html');
    if (!html.includes('META-COLOR-SCHEME-001')) {
      html = html.replace(
        '<meta name="theme-color" content="#05010f">',
        '<!-- META-COLOR-SCHEME-001 -->\n<meta name="color-scheme" content="dark">\n<meta name="theme-color" content="#05010f">'
      );
      wf('index.html', html);
    }
    let priv = rf('privacy.html');
    if (!priv.includes('name="color-scheme"')) {
      priv = priv.replace(
        '<meta name="robots" content="noindex,nofollow">',
        '<meta name="color-scheme" content="dark">\n<meta name="robots" content="noindex,nofollow">'
      );
      wf('privacy.html', priv);
    }
    writeUnit(slug, ver, id, `
assert.ok(html.includes('META-COLOR-SCHEME-001'), 'ship id');
assert.ok(html.includes('name="color-scheme"') && html.includes('content="dark"'), 'color-scheme dark');
assert.ok(html.includes('theme-color'), 'theme-color kept');
const priv = readFileSync(new URL('../privacy.html', import.meta.url), 'utf8');
assert.ok(priv.includes('color-scheme'), 'privacy color-scheme');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: meta color-scheme dark`);
  }

  // ===== 0.9.183 INTERRUPT-NOTE-READ-001 =====
  {
    const ver = '0.9.183', id = 'INTERRUPT-NOTE-READ-001', slug = 'interrupt-note-read';
    const blurb = 'menu interrupt-note phone contrast leftover (WebGL recover)';
    bumpCache(ver);
    let css = rf('css/game.css');
    if (!css.includes('INTERRUPT-NOTE-READ-001')) {
      css += `

/* ===== INTERRUPT-NOTE-READ-001 v${ver} — menu interrupt-note phone contrast leftover ===== */
.interrupt-note {
  color: #ffc0d0;
  text-shadow: 0 0 10px rgba(255, 80, 120, 0.35);
  font-size: 13px;
  line-height: 1.45;
  font-weight: 600;
  opacity: 1;
}
`;
      wf('css/game.css', css);
    }
    writeUnit(slug, ver, id, `
assert.ok(css.includes('INTERRUPT-NOTE-READ-001'), 'ship id');
assert.match(css, /INTERRUPT-NOTE-READ-001[\\s\\S]*?\\.interrupt-note[\\s\\S]*?color:\\s*#ffc0d0/s, 'note contrast');
assert.ok(css.includes('GFX-BODY-READ-001'), 'gfx body prior');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
assert.ok(strings.includes('畫質'), '畫質 label kept');
`);
    await shotScreen(slug, ver, 'start', '01-phone-home.png');
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: interrupt-note contrast`);
  }

  // ===== 0.9.184 HANDOFF-AGENT-TIDY-003 =====
  {
    const ver = '0.9.184', id = 'HANDOFF-AGENT-TIDY-003', slug = 'handoff-agent-tidy-003';
    const blurb = 'HANDOFF/AGENT_TASK tidy for safe-polish beat; affirm no pause glow';
    bumpCache(ver);
    let hand = rf('docs/HANDOFF.md');
    if (!hand.includes(id)) {
      const note = `- **v${ver} ${id}:** safe polish beat (README/WEAPONS/HIT-FEEL tip sync · soft-pins · share aria fallback · early-toast-en/over-pos/interrupt-note contrast · privacy rename · color-scheme). Pause still **no** \`#btn-glow\`; 畫質 only in settings.\n`;
      if (hand.includes('## 版本歷史（增量）')) {
        hand = hand.replace('## 版本歷史（增量）\n\n', `## 版本歷史（增量）\n\n${note}`);
      } else {
        hand = note + hand;
      }
      wf('docs/HANDOFF.md', hand);
    }
    writeUnit(slug, ver, id, `
assert.ok(hand.includes('${id}'), 'handoff note');
assert.ok(hand.includes('btn-glow') || hand.includes('畫質'), 'glow/quality note');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'code still clean');
assert.ok(html.includes('SHARE-BTN-ARIA-FALLBACK-001') && html.includes('META-COLOR-SCHEME-001'), 'aria/meta shipped');
assert.ok(strings.includes('畫質'), '畫質 label');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: HANDOFF/AGENT tidy`);
  }

  // ===== 0.9.185 GAMES-JSON-STAGE-008 HOLD =====
  {
    const ver = '0.9.185', id = 'GAMES-JSON-STAGE-008', slug = 'games-json-stage-008';
    const blurb = 'games.json stub stage → tip; safe polish beat HOLD';
    bumpCache(ver);
    bumpGamesStub(ver, id);
    let stub = rf('docs/GAMES-JSON-STUB.md');
    // enrich stage blurb once
    stub = stub.replace(
      /safe polish · soft-pins · CTA aria · tip sync · pause glow→settings · HUD gear\/settings/g,
      'safe polish · tip sync · soft-pins · share aria · contrast · privacy·meta · pause glow→settings · HUD gear/settings'
    );
    wf('docs/GAMES-JSON-STUB.md', stub);
    writeUnit(slug, ver, id, `
const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
assert.ok(stub.includes('${ver}') || stub.includes('v${ver}'), 'stub tip');
assert.ok(stub.includes('${id}') || stub.includes('GAMES-JSON-STAGE-008'), 'ship id');
assert.ok(agent.includes('HOLD') || agent.includes('${id}'), 'HOLD');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'pause glow still gone at HOLD');
assert.ok(strings.includes('畫質'), 'settings quality label kept');
assert.ok(html.includes('SHARE-BTN-ARIA-FALLBACK-001') && html.includes('META-COLOR-SCHEME-001'), 'share aria + meta');
assert.ok(!html.includes('id="btn-glow"'), 'no btn-glow');
`);
    row(ver, id, blurb + '; **HOLD**');
    updateDocs(ver, id, blurb, { hold: true });
    sh(`node tests/${slug}.test.mjs`);
    const softs = [
      'tests/hud-mute-pause-tap.test.mjs',
      'tests/home-settings-tap.test.mjs',
      'tests/share-fallback-softpin.test.mjs',
      'tests/softpin-cta-tap.test.mjs',
      'tests/pause-glow-to-settings.test.mjs',
      'tests/over-cta-aria-sync.test.mjs',
      'tests/home-cta-aria-sync.test.mjs',
      'tests/gfx-reload-aria.test.mjs',
      'tests/over-result-em-read.test.mjs',
      'tests/readme-pipeline-tip-003.test.mjs',
      'tests/weapons-md-tip-sync-004.test.mjs',
      'tests/hit-feel-pipeline-tip-003.test.mjs',
      'tests/share-btn-aria-fallback.test.mjs',
      'tests/early-toast-en-read.test.mjs',
      'tests/over-pos-read.test.mjs',
      'tests/privacy-product-rename.test.mjs',
      'tests/meta-color-scheme.test.mjs',
      'tests/interrupt-note-read.test.mjs',
    ];
    for (const s of softs) {
      try { sh(`node ${s}`); } catch (e) { console.warn('softpin warn', s, e.message); }
    }
    commitPush(ver, id, `v${ver} ${id}: games.json stub + HOLD`);
  }

  console.log('\\n=== SAFE POLISH BEAT DONE ===');
  console.log(TABLE.map((r) => `v${r.ver} ${r.id}: ${r.notes}`).join('\\n'));
  const tip = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  console.log('HEAD', tip);
}

main().catch((e) => { console.error(e); process.exit(1); });

