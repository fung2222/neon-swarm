/**
 * Ship exactly 10 safe neon-swarm slices v0.9.91–0.9.100 then HOLD.
 * HARD BANS: Phase4 / horn / soft-juice invent / full ult / BALANCE / deep GPU.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { extname } from 'path';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.md': 'text/markdown', '.webp': 'image/webp' };

function rf(p) { return readFileSync(join(ROOT, p), 'utf8'); }
function wf(p, s) { writeFileSync(join(ROOT, p), s); }
function sh(cmd) { execSync(cmd, { cwd: ROOT, stdio: 'inherit' }); }

function bumpCache(ver) {
  let html = rf('index.html');
  html = html.replace(/\?v=0\.9\.\d+/g, `?v=${ver}`);
  wf('index.html', html);
}

function setAgentTask(ver, id, shipped) {
  const lines = [
    '# AGENT_TASK — 暴走機甲 / neon-swarm',
    '',
    '> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm',
    '',
    ver === '0.9.100'
      ? `## 狀態：**HOLD** — safe pipeline「十個十個」v0.9.91–0.9.100 **done**. Tip \`v${ver}\` \`${id}\`.`
      : `## 狀態：**Active** — shipping safe batch v0.9.91–0.9.100. Tip \`v${ver}\` \`${id}\`.`,
    '',
    `**Author:** Grok bot · **Waiting:** ${ver === '0.9.100' ? 'Roy try on live `?v=0.9.100`' : 'finish 10 then HOLD'}`,
    '',
    '### Shipped this beat (10)',
    ...shipped.map((s, i) => `${i + 1}. ${s}`),
    '',
    '### Preserve',
    'hide-until-touch · hub · color rail · dbl/tpl · burst≤3 · floor · 2+2+2 · clamp · fill-edge · rail-tap · branch-path · prior tap/sync/a11y ships · ult light-amp labels · rail group a11y.',
    '',
    '### Out of scope / HARD BANS（下輪仍禁）',
    'Phase 4 · horn lock · soft-juice invent · full ult invent · BALANCE-PASS · deep GPU · Roy PNG.',
    '',
    `Live: https://fung2222.github.io/neon-swarm/?v=${ver}`,
    '',
  ];
  wf('docs/AGENT_TASK.md', lines.join('\n'));
}

function patchHandoffTip(ver, id, blurb, hold) {
  let h = rf('docs/HANDOFF.md');
  // date/status line tip
  h = h.replace(
    /\*\*文件日期：\*\*[^\n]+/,
    `**文件日期：** 2026-10-28（Asia/Hong_Kong；**${hold ? 'HOLD' : 'Active'}** safe pipeline v0.9.91–${ver}（tip ${id.replace(/-001$/, '').toLowerCase()}）；prior rail-group-a11y v0.9.90）`
  );
  h = h.replace(/目前 `main`／live cache-bust：\*\*`\?v=0\.9\.\d+`\*\*/, `目前 \`main\`／live cache-bust：**\`?v=${ver}\`**`);
  // Active HOLD line near end of §10
  h = h.replace(
    /\*\*Active = HOLD\*\*[^\n]*/,
    hold
      ? `**Active = HOLD**（none）— **HOLD for Roy try** on live \`?v=${ver}\`（10-slice batch v0.9.91–0.9.100 done）。Do **not** invent soft-juice／full ult kits／BALANCE-PASS／Phase 4／horn／deep GPU without Roy。`
      : `**Active = shipping** — tip \`v${ver}\` \`${id}\`（batch v0.9.91–0.9.100）。Do **not** invent soft-juice／full ult／BALANCE／Phase 4／horn／deep GPU。`
  );
  h = h.replace(
    /## 11\. 下一位 agent 的第一個建議動作\n\n[\s\S]*?(?=\n## 版本歷史)/,
    hold
      ? `## 11. 下一位 agent 的第一個建議動作\n\n**HOLD for Roy try** on live \`?v=${ver}\`. Do **not** auto-start next batch.\n\nHARD BANS: Phase 4 · horn art lock · soft-juice invent · full ult invent · BALANCE-PASS · deep phone GPU.\n\nPreserve: hide stick · hub · water rail · tap≥44 · catalog fire live · dbl/tpl · burst≤3 · black floor · 2+2+2 · howto/coach sync · ult light-amp labels · rail group a11y · hub/pause/over a11y.\n\nAfter Roy「繼續」／「十個十個」→ pick real Next stubs from this HANDOFF／WEAPONS（not banned invent）.\n\n\n`
      : `## 11. 下一位 agent 的第一個建議動作\n\nContinue safe batch toward v0.9.100 then HOLD. Tip \`v${ver}\` \`${id}\`.\n\nHARD BANS: Phase 4 · horn art lock · soft-juice invent · full ult invent · BALANCE-PASS · deep phone GPU.\n\n\n`
  );
  // prepend version history entry
  const entry = `- **v${ver}** (\`${id}\`) — ${blurb}\n`;
  if (!h.includes(`**v${ver}**`)) {
    h = h.replace('## 版本歷史（增量）\n\n', `## 版本歷史（增量）\n\n${entry}`);
  }
  // prepend Done bullet under 已核對
  const done = `  - v${ver} — ${id}：${blurb}\n`;
  if (!h.includes(`v${ver} — ${id}`)) {
    h = h.replace(
      /- \*\*Done since `6ddc483`：\*\*\n/,
      `- **Done since \`6ddc483\`：**\n${done}`
    );
  }
  wf('docs/HANDOFF.md', h);
}

function writeTest(slug, ver, id, body) {
  wf(`tests/${slug}.test.mjs`, `/**\n * ${id} (v${ver})\n */\nimport assert from 'assert';\nimport { readFileSync } from 'fs';\n\n${body}\nconsole.log('${slug}.test.mjs: PASS');\n`);
}

function startServer() {
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/index.html';
    const file = join(ROOT, p);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end('missing'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

async function menuShot(slug, ver, probeFn) {
  const SHOT_DIR = join(ROOT, 'tests/screenshots', slug);
  mkdirSync(SHOT_DIR, { recursive: true });
  // also write a tiny shots.mjs for repo consistency
  wf(`tests/${slug}-shots.mjs`, `/** ${slug} shots (v${ver}) — evidence captured by ship batch */\nconsole.log('${slug}-shots.mjs: SKIP (evidence in screenshots/${slug}/)');\n`);
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl', '--ignore-gpu-blocklist', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(base + `/index.html?v=${ver}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', { timeout: 60000 });
  let probe = {};
  if (probeFn) probe = await page.evaluate(probeFn);
  await page.screenshot({ path: join(SHOT_DIR, `01-phone-${slug}.png`), type: 'png' });
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver, probe }, null, 2));
  await browser.close();
  server.close();
  return probe;
}

async function playShot(slug, ver, setupFn, probeFn) {
  const SHOT_DIR = join(ROOT, 'tests/screenshots', slug);
  mkdirSync(SHOT_DIR, { recursive: true });
  wf(`tests/${slug}-shots.mjs`, `/** ${slug} shots (v${ver}) — evidence captured by ship batch */\nconsole.log('${slug}-shots.mjs: SKIP (evidence in screenshots/${slug}/)');\n`);
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl', '--ignore-gpu-blocklist', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(base + `/index.html?v=${ver}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', { timeout: 60000 });
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, { timeout: 60000 });
  await page.evaluate(() => {
    try { localStorage.setItem('neon-swarm-coach-v1', '1'); } catch (_) {}
    const el = document.getElementById('run-coach');
    if (el) el.classList.add('hidden');
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
  });
  if (setupFn) await page.evaluate(setupFn);
  await new Promise((r) => setTimeout(r, 250));
  let probe = {};
  if (probeFn) probe = await page.evaluate(probeFn);
  await page.screenshot({ path: join(SHOT_DIR, `01-phone-${slug}.png`), type: 'png' });
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver, probe }, null, 2));
  await browser.close();
  server.close();
  return probe;
}

function commit(msg) {
  sh('git add -A');
  // avoid hooks issues
  execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: ROOT, stdio: 'inherit' });
}

const shipped = [];

async function ship(ver, id, slug, blurb, apply, testBody, shotKind = 'menu', setupFn, probeFn) {
  console.log(`\n==== SHIP v${ver} ${id} ====`);
  bumpCache(ver);
  apply();
  shipped.push(`v${ver} \`${id}\``);
  setAgentTask(ver, id, shipped);
  patchHandoffTip(ver, id, blurb, ver === '0.9.100');
  writeTest(slug, ver, id, testBody);
  sh(`node tests/${slug}.test.mjs`);
  if (shotKind === 'play') await playShot(slug, ver, setupFn, probeFn);
  else if (shotKind === 'docs') {
    const SHOT_DIR = join(ROOT, 'tests/screenshots', slug);
    mkdirSync(SHOT_DIR, { recursive: true });
    wf(`tests/${slug}-shots.mjs`, `/** ${slug} shots (v${ver}) */\nconsole.log('${slug}-shots.mjs: docs evidence');\n`);
    // still take a menu shot for visual tip proof
    await menuShot(slug, ver, probeFn);
  } else {
    await menuShot(slug, ver, probeFn);
  }
  commit(`v${ver} ${id} — ${blurb}`);
  const sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  console.log(`SHIPPED v${ver} ${sha}`);
  return sha;
}

// ========== SLICES ==========

const results = [];

// 91 HUD-HUB-A11Y
results.push(await ship(
  '0.9.91', 'HUD-HUB-A11Y-001', 'hud-hub-a11y',
  'hud-hub role=region + aria 戰況/RUN STATUS; preserve hub layout.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="hud-hub" class="hud-hub" aria-live="polite">',
      '<!-- v0.9.91 HUD-HUB-A11Y-001 -->\n  <div id="hud-hub" class="hud-hub" role="region" aria-label="戰況 RUN STATUS" aria-live="polite">'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.91/.test(html), 'cache-bust');
assert.ok(html.includes('HUD-HUB-A11Y-001'), 'ship id');
assert.ok(agent.includes('HUD-HUB-A11Y-001') || agent.includes('0.9.91'), 'AGENT_TASK');
assert.ok(html.includes('id="hud-hub"') && html.includes('role="region"'), 'role');
assert.ok(html.includes('aria-label="戰況 RUN STATUS"'), 'aria');
assert.ok(html.includes('class="hud-hub"'), 'hub kept');`,
  'play',
  null,
  () => {
    const el = document.getElementById('hud-hub');
    return el ? { role: el.getAttribute('role'), aria: el.getAttribute('aria-label') } : { missing: true };
  }
));

// 92 PAUSE-DIALOG-A11Y
results.push(await ship(
  '0.9.92', 'PAUSE-DIALOG-A11Y-001', 'pause-dialog-a11y',
  'pause screen role=dialog aria-modal + labelledby; CTA tap preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="screen-pause" class="screen hidden">\n  <div class="panel small">\n    <h2 class="title2 glitch" data-i18n="paused">已暫停</h2>',
      '<!-- v0.9.92 PAUSE-DIALOG-A11Y-001 -->\n<div id="screen-pause" class="screen hidden" role="dialog" aria-modal="true" aria-labelledby="pause-title">\n  <div class="panel small">\n    <h2 class="title2 glitch" id="pause-title" data-i18n="paused">已暫停</h2>'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.92/.test(html), 'cache-bust');
assert.ok(html.includes('PAUSE-DIALOG-A11Y-001'), 'ship id');
assert.ok(agent.includes('PAUSE-DIALOG-A11Y-001') || agent.includes('0.9.92'), 'AGENT_TASK');
assert.ok(html.includes('id="screen-pause"') && html.includes('role="dialog"') && html.includes('aria-modal="true"'), 'dialog');
assert.ok(html.includes('aria-labelledby="pause-title"') && html.includes('id="pause-title"'), 'labelledby');
assert.ok(css.includes('PAUSE-CTA-TAP-001'), 'prior pause CTA kept');`,
  'menu',
  null,
  () => {
    const el = document.getElementById('screen-pause');
    return el ? { role: el.getAttribute('role'), modal: el.getAttribute('aria-modal'), labelledby: el.getAttribute('aria-labelledby') } : { missing: true };
  }
));

// 93 OVER-DIALOG-A11Y
results.push(await ship(
  '0.9.93', 'OVER-DIALOG-A11Y-001', 'over-dialog-a11y',
  'over screen role=dialog aria-modal + labelledby; share/retry preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="screen-over" class="screen hidden">\n  <div class="panel">\n    <h2 class="title2 glitch" data-i18n="over">完局</h2>',
      '<!-- v0.9.93 OVER-DIALOG-A11Y-001 -->\n<div id="screen-over" class="screen hidden" role="dialog" aria-modal="true" aria-labelledby="over-title">\n  <div class="panel">\n    <h2 class="title2 glitch" id="over-title" data-i18n="over">完局</h2>'
    );
    // also fix if title text differs
    if (!html.includes('OVER-DIALOG-A11Y-001')) {
      html = html.replace(
        /<div id="screen-over" class="screen hidden">/,
        '<!-- v0.9.93 OVER-DIALOG-A11Y-001 -->\n<div id="screen-over" class="screen hidden" role="dialog" aria-modal="true" aria-labelledby="over-title">'
      );
      html = html.replace(
        /(<div id="screen-over"[^>]*>[\s\S]*?<h2 class="title2 glitch")( data-i18n="over")/,
        '$1 id="over-title"$2'
      );
    }
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.93/.test(html), 'cache-bust');
assert.ok(html.includes('OVER-DIALOG-A11Y-001'), 'ship id');
assert.ok(agent.includes('OVER-DIALOG-A11Y-001') || agent.includes('0.9.93'), 'AGENT_TASK');
assert.ok(/id="screen-over"[^>]*role="dialog"/.test(html) && html.includes('aria-modal="true"'), 'dialog');
assert.ok(html.includes('aria-labelledby="over-title"') && html.includes('id="over-title"'), 'labelledby');
assert.ok(html.includes('btn-share'), 'share kept');`,
  'menu',
  null,
  () => {
    const el = document.getElementById('screen-over');
    return el ? { role: el.getAttribute('role'), modal: el.getAttribute('aria-modal'), labelledby: el.getAttribute('aria-labelledby') } : { missing: true };
  }
));

// 94 SHARE-BTN-ARIA
results.push(await ship(
  '0.9.94', 'SHARE-BTN-ARIA-001', 'share-btn-aria',
  'btn-share aria-label from shareButtonLabels; no SDK invent.',
  () => {
    let main = rf('js/main.js');
    if (!main.includes('SHARE-BTN-ARIA-001')) {
      main = main.replace(
        `function refreshShareButton() {
  const useShare = canNativeShare();
  const labels = shareButtonLabels(useShare);
  const zhEl = $('share-zh');
  const enEl = $('share-en');
  if (zhEl) zhEl.textContent = labels.zh;
  if (enEl) enEl.textContent = labels.en;
  const btn = $('btn-share');
  if (btn) btn.dataset.mode = useShare ? 'share' : 'copy';
}`,
        `function refreshShareButton() {
  // v0.9.94 SHARE-BTN-ARIA-001 — aria-label mirrors visible zh/en labels
  const useShare = canNativeShare();
  const labels = shareButtonLabels(useShare);
  const zhEl = $('share-zh');
  const enEl = $('share-en');
  if (zhEl) zhEl.textContent = labels.zh;
  if (enEl) enEl.textContent = labels.en;
  const btn = $('btn-share');
  if (btn) {
    btn.dataset.mode = useShare ? 'share' : 'copy';
    btn.setAttribute('aria-label', labels.zh + ' ' + labels.en);
  }
}`
      );
    }
    wf('js/main.js', main);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.94/.test(html), 'cache-bust');
assert.ok(main.includes('SHARE-BTN-ARIA-001'), 'ship id');
assert.ok(agent.includes('SHARE-BTN-ARIA-001') || agent.includes('0.9.94'), 'AGENT_TASK');
assert.ok(main.includes("setAttribute('aria-label'") && main.includes('labels.zh'), 'aria set');
assert.ok(main.includes('shareButtonLabels'), 'labels helper');`,
  'menu'
));

// 95 BOSS-HP-A11Y
results.push(await ship(
  '0.9.95', 'BOSS-HP-A11Y-001', 'boss-hp-a11y',
  'boss-hp role=region aria 首領血量/BOSS HP; strip chrome only.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="boss-hp" class="boss-hp hidden" aria-live="polite">',
      '<!-- v0.9.95 BOSS-HP-A11Y-001 -->\n  <div id="boss-hp" class="boss-hp hidden" role="region" aria-label="首領血量 BOSS HP" aria-live="polite">'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.95/.test(html), 'cache-bust');
assert.ok(html.includes('BOSS-HP-A11Y-001'), 'ship id');
assert.ok(agent.includes('BOSS-HP-A11Y-001') || agent.includes('0.9.95'), 'AGENT_TASK');
assert.ok(/id="boss-hp"[^>]*role="region"/.test(html), 'role');
assert.ok(html.includes('aria-label="首領血量 BOSS HP"'), 'aria');`,
  'play',
  () => {
    const el = document.getElementById('boss-hp');
    if (el) el.classList.remove('hidden');
  },
  () => {
    const el = document.getElementById('boss-hp');
    return el ? { role: el.getAttribute('role'), aria: el.getAttribute('aria-label'), hidden: el.classList.contains('hidden') } : { missing: true };
  }
));

// 96 HUB-ARMOR-I18N
results.push(await ship(
  '0.9.96', 'HUB-ARMOR-I18N-001', 'hub-armor-i18n',
  'hub ARM label → data-i18n hud.arm 裝甲/ARM; no balance change.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<span class="hub-label">ARM</span>',
      '<!-- v0.9.96 HUB-ARMOR-I18N-001 --><span class="hub-label" data-i18n="hud.arm">裝甲</span>'
    );
    wf('index.html', html);
    let strings = rf('js/strings.js');
    if (!strings.includes("'hud.arm'")) {
      strings = strings.replace(
        "  'hud.hp': ['護盾', 'HP'],",
        "  'hud.hp': ['護盾', 'HP'],\n  // v0.9.96 HUB-ARMOR-I18N-001\n  'hud.arm': ['裝甲', 'ARM'],"
      );
    }
    wf('js/strings.js', strings);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.96/.test(html), 'cache-bust');
assert.ok(html.includes('HUB-ARMOR-I18N-001') || html.includes('data-i18n="hud.arm"'), 'ship');
assert.ok(agent.includes('HUB-ARMOR-I18N-001') || agent.includes('0.9.96'), 'AGENT_TASK');
assert.ok(html.includes('data-i18n="hud.arm"'), 'i18n attr');
assert.ok(strings.includes("'hud.arm'") && strings.includes('裝甲'), 'string');
assert.ok(!/>ARM</.test(html.replace(/data-i18n="hud.arm">裝甲</, '')), 'no bare ARM');`,
  'play',
  () => {
    const b = document.getElementById('hub-armor-block');
    if (b) b.hidden = false;
    const g = window.__swarm.game;
    if (g) g.armor = 2;
    if (window.__swarm.syncHud) window.__swarm.syncHud();
  },
  () => {
    const lab = document.querySelector('#hub-armor-block .hub-label');
    return lab ? { text: lab.textContent, i18n: lab.getAttribute('data-i18n') } : { missing: true };
  }
));

// 97 LEVEL-CARD-FOCUS
results.push(await ship(
  '0.9.97', 'LEVEL-CARD-FOCUS-001', 'level-card-focus',
  'level-card focus-visible ring ≥2px cyan; UI a11y only.',
  () => {
    let css = rf('css/game.css');
    if (!css.includes('LEVEL-CARD-FOCUS-001')) {
      css += `

/* ===== LEVEL-CARD-FOCUS-001 v0.9.97 — keyboard/focus ring (a11y; no soft-juice) ===== */
.level-card:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.35), 0 0 18px rgba(0, 229, 255, 0.22);
}
`;
      wf('css/game.css', css);
    }
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.97/.test(html), 'cache-bust');
assert.ok(css.includes('LEVEL-CARD-FOCUS-001'), 'ship id');
assert.ok(agent.includes('LEVEL-CARD-FOCUS-001') || agent.includes('0.9.97'), 'AGENT_TASK');
assert.match(css, /\\.level-card:focus-visible\\s*\\{[^}]*outline:\\s*2px\\s+solid/s, 'outline');
assert.ok(css.includes('#00e5ff'), 'cyan');`,
  'menu'
));

// 98 WEAPONS-MD-TIP-SYNC
results.push(await ship(
  '0.9.98', 'WEAPONS-MD-TIP-SYNC-001', 'weapons-md-tip-sync',
  'WEAPONS.md Live tip header sync off stale v0.9.75; status a11y rows.',
  () => {
    let w = rf('docs/WEAPONS.md');
    w = w.replace(
      /> \*\*Live:\*\* https:\/\/fung2222\.github\.io\/neon-swarm\/ · \*\*Ship:\*\*[^\n]+/,
      '> **Live:** https://fung2222.github.io/neon-swarm/ · **Ship:** v0.9.98 WEAPONS-MD-TIP-SYNC-001 · hub/pause/over a11y v0.9.91–0.9.95 · catalog-fire-live v0.9.75'
    );
    if (!w.includes('WEAPONS-MD-TIP-SYNC-001')) {
      w = w.replace(
        '## Product rules (locked)',
        '<!-- v0.9.98 WEAPONS-MD-TIP-SYNC-001 — tip header sync; no fire/ult invent -->\n\n## Product rules (locked)'
      );
    }
    // status rows
    if (!w.includes('HUD hub region a11y')) {
      w = w.replace(
        '| Ult light-amp multipliers documented (×1.2 / ×0.85) | **live** (v0.9.88 WEAPONS-ULT-LIGHT-AMP-DOCS-001) |',
        `| Ult light-amp multipliers documented (×1.2 / ×0.85) | **live** (v0.9.88 WEAPONS-ULT-LIGHT-AMP-DOCS-001) |
| HUD hub region a11y | **live** (v0.9.91 HUD-HUB-A11Y-001) |
| Pause/over dialog a11y | **live** (v0.9.92–0.9.93) |
| Share btn aria-label | **live** (v0.9.94 SHARE-BTN-ARIA-001) |
| Boss HP region a11y | **live** (v0.9.95 BOSS-HP-A11Y-001) |
| Hub armor i18n | **live** (v0.9.96 HUB-ARMOR-I18N-001) |
| Level-card focus ring | **live** (v0.9.97 LEVEL-CARD-FOCUS-001) |`
      );
    }
    wf('docs/WEAPONS.md', w);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const wdoc = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.98/.test(html), 'cache-bust');
assert.ok(wdoc.includes('WEAPONS-MD-TIP-SYNC-001'), 'ship id');
assert.ok(agent.includes('WEAPONS-MD-TIP-SYNC-001') || agent.includes('0.9.98'), 'AGENT_TASK');
assert.ok(wdoc.includes('v0.9.98'), 'tip');
assert.ok(!/Ship:\\*\\* v0\\.9\\.75 catalog-fire-live · howto-controls-sync/.test(wdoc), 'stale tip gone');
assert.ok(wdoc.includes('HUD hub region a11y'), 'status row');`,
  'docs'
));

// 99 SLOT-RAIL-ARIA-SYNC
results.push(await ship(
  '0.9.99', 'SLOT-RAIL-ARIA-SYNC-001', 'slot-rail-aria-sync',
  'weapon-slots/rail static aria zh-first sync; color-only rail preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="weapon-slots" class="weapon-slots" aria-label="武器狀態 WEAPONS"></div>\n  <div id="weapon-rail" class="weapon-rail" aria-label="武器選擇 LOADOUT"></div>',
      '<!-- v0.9.99 SLOT-RAIL-ARIA-SYNC-001 -->\n  <div id="weapon-slots" class="weapon-slots" aria-label="武器狀態 WEAPON STATUS"></div>\n  <div id="weapon-rail" class="weapon-rail" aria-label="武器欄 LOADOUT"></div>'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.99/.test(html), 'cache-bust');
assert.ok(html.includes('SLOT-RAIL-ARIA-SYNC-001'), 'ship id');
assert.ok(agent.includes('SLOT-RAIL-ARIA-SYNC-001') || agent.includes('0.9.99'), 'AGENT_TASK');
assert.ok(html.includes('aria-label="武器狀態 WEAPON STATUS"'), 'slots aria');
assert.ok(html.includes('aria-label="武器欄 LOADOUT"'), 'rail aria');
assert.match(css, /\\.weapon-rail\\s+\\.wrail-label[\\s\\S]{0,80}display:\\s*none/, 'no visible labels');`,
  'play',
  null,
  () => {
    const slots = document.getElementById('weapon-slots');
    const rail = document.getElementById('weapon-rail');
    return {
      slots: slots && slots.getAttribute('aria-label'),
      rail: rail && rail.getAttribute('aria-label'),
    };
  }
));

// 100 GAMES-JSON-STAGE + HOLD
results.push(await ship(
  '0.9.100', 'GAMES-JSON-STAGE-002', 'games-json-stage-002',
  'games.json stub stage → v0.9.100; end of 10-slice batch; HOLD.',
  () => {
    let stub = rf('docs/GAMES-JSON-STUB.md');
    stub = stub.replace(/<!-- v0\.9\.\d+ GAMES-JSON-STAGE[^>]*-->/, '<!-- v0.9.100 GAMES-JSON-STAGE-002 — bump stub stage to tip; HOLD -->');
    stub = stub.replace(/網頁版 v0\.9\.\d+/g, '網頁版 v0.9.100');
    stub = stub.replace(/web v0\.9\.\d+/g, 'web v0.9.100');
    // ensure ship id present
    if (!stub.includes('GAMES-JSON-STAGE-002')) {
      stub = stub.replace('# games.json stub — neon-swarm', '# games.json stub — neon-swarm\n\n<!-- GAMES-JSON-STAGE-002 -->');
    }
    wf('docs/GAMES-JSON-STUB.md', stub);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.100/.test(html), 'cache-bust');
assert.ok(stub.includes('GAMES-JSON-STAGE-002'), 'ship id');
assert.ok(agent.includes('GAMES-JSON-STAGE-002') || agent.includes('0.9.100'), 'AGENT_TASK');
assert.ok(stub.includes('v0.9.100'), 'stage tip');
assert.ok(agent.includes('HOLD'), 'HOLD');
assert.ok(stub.includes('2+2+2') || stub.includes('hide-stick') || stub.includes('隱藏搖桿'), 'features');`,
  'docs'
));

console.log('\n==== ALL SHIPPED ====');
console.log(results.join('\n'));
writeFileSync(join(ROOT, 'tools/ship-batch/last-shas.txt'), results.join('\n') + '\n');
