/**
 * Ship exactly 20 safe neon-swarm slices v0.9.101–0.9.120 then HOLD.
 * HARD BANS: Phase4 / horn / soft-juice invent / full ult / BALANCE / deep GPU.
 * Preserve: stick-hide, hub, water rail, tap≥44, catalog fire, dbl/tpl, burst≤3, floor, 2+2+2.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createServer } from 'http';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const BATCH_START = '0.9.101';
const BATCH_END = '0.9.120';
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
  const hold = ver === BATCH_END;
  const lines = [
    '# AGENT_TASK — 暴走機甲 / neon-swarm',
    '',
    '> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm',
    '',
    hold
      ? `## 狀態：**HOLD** — safe pipeline「繼續一直去20個」v${BATCH_START}–${BATCH_END} **done**. Tip \`v${ver}\` \`${id}\`.`
      : `## 狀態：**Active** — shipping safe batch v${BATCH_START}–${BATCH_END}. Tip \`v${ver}\` \`${id}\`.`,
    '',
    `**Author:** Grok bot · **Waiting:** ${hold ? `Roy try on live \`?v=${BATCH_END}\`` : 'finish 20 then HOLD'}`,
    '',
    '### Shipped this beat (20)',
    ...shipped.map((s, i) => `${i + 1}. ${s}`),
    '',
    '### Preserve',
    'hide-until-touch · hub · color rail · dbl/tpl · burst≤3 · floor · 2+2+2 · clamp · fill-edge · rail-tap · branch-path · prior tap/sync/a11y ships · ult light-amp labels · rail group a11y · hub/pause/over a11y.',
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
  h = h.replace(
    /\*\*文件日期：\*\*[^\n]+/,
    `**文件日期：** 2026-10-28（Asia/Hong_Kong；**${hold ? 'HOLD' : 'Active'}** safe pipeline v${BATCH_START}–${ver}（tip ${id.replace(/-00\d$/, '').toLowerCase()}）；prior games-json-stage-002 v0.9.100）`
  );
  h = h.replace(/目前 `main`／live cache-bust：\*\*`\?v=0\.9\.\d+`\*\*/, `目前 \`main\`／live cache-bust：**\`?v=${ver}\`**`);
  // replace any Active = HOLD or Active = shipping line
  h = h.replace(
    /\*\*Active = (?:HOLD|shipping)\*\*[^\n]*/g,
    hold
      ? `**Active = HOLD**（none）— **HOLD for Roy try** on live \`?v=${ver}\`（20-slice batch v${BATCH_START}–${BATCH_END} done）。Do **not** invent soft-juice／full ult kits／BALANCE-PASS／Phase 4／horn／deep GPU without Roy。`
      : `**Active = shipping** — tip \`v${ver}\` \`${id}\`（batch v${BATCH_START}–${BATCH_END}）。Do **not** invent soft-juice／full ult／BALANCE／Phase 4／horn／deep GPU。`
  );
  h = h.replace(
    /## 11\. 下一位 agent 的第一個建議動作\n\n[\s\S]*?(?=\n## 版本歷史)/,
    hold
      ? `## 11. 下一位 agent 的第一個建議動作\n\n**HOLD for Roy try** on live \`?v=${ver}\`. Do **not** auto-start next batch.\n\nHARD BANS: Phase 4 · horn art lock · soft-juice invent · full ult invent · BALANCE-PASS · deep phone GPU.\n\nPreserve: hide stick · hub · water rail · tap≥44 · catalog fire live · dbl/tpl · burst≤3 · black floor · 2+2+2 · howto/coach sync · ult light-amp labels · rail group a11y · hub/pause/over/level a11y · neon/icon focus · stick/fps aria-hidden.\n\nAfter Roy「繼續」／「十個十個」→ pick real Next stubs from this HANDOFF／WEAPONS（not banned invent）.\n\n\n`
      : `## 11. 下一位 agent 的第一個建議動作\n\nContinue safe batch toward v${BATCH_END} then HOLD. Tip \`v${ver}\` \`${id}\`.\n\nHARD BANS: Phase 4 · horn art lock · soft-juice invent · full ult invent · BALANCE-PASS · deep phone GPU.\n\n\n`
  );
  const entry = `- **v${ver}** (\`${id}\`) — ${blurb}\n`;
  if (!h.includes(`**v${ver}**`)) {
    h = h.replace('## 版本歷史（增量）\n\n', `## 版本歷史（增量）\n\n${entry}`);
  }
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
  execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: ROOT, stdio: 'inherit' });
}

const shipped = [];

async function ship(ver, id, slug, blurb, apply, testBody, shotKind = 'menu', setupFn, probeFn) {
  console.log(`\n==== SHIP v${ver} ${id} ====`);
  bumpCache(ver);
  apply();
  shipped.push(`v${ver} \`${id}\``);
  setAgentTask(ver, id, shipped);
  patchHandoffTip(ver, id, blurb, ver === BATCH_END);
  writeTest(slug, ver, id, testBody);
  sh(`node tests/${slug}.test.mjs`);
  if (shotKind === 'play') await playShot(slug, ver, setupFn, probeFn);
  else if (shotKind === 'docs') {
    const SHOT_DIR = join(ROOT, 'tests/screenshots', slug);
    mkdirSync(SHOT_DIR, { recursive: true });
    wf(`tests/${slug}-shots.mjs`, `/** ${slug} shots (v${ver}) */\nconsole.log('${slug}-shots.mjs: docs evidence');\n`);
    await menuShot(slug, ver, probeFn);
  } else {
    await menuShot(slug, ver, probeFn);
  }
  commit(`v${ver} ${id} — ${blurb}`);
  const sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  console.log(`SHIPPED v${ver} ${sha}`);
  return `${ver} ${sha}`;
}

const results = [];

// 101 LEVEL-DIALOG-A11Y
results.push(await ship(
  '0.9.101', 'LEVEL-DIALOG-A11Y-001', 'level-dialog-a11y',
  'level screen role=dialog aria-modal + labelledby; cards tap preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="screen-level" class="screen hidden">\n  <div class="panel level-panel">\n    <h2 class="title2 glitch" id="level-title" data-i18n="levelUp">升級</h2>',
      '<!-- v0.9.101 LEVEL-DIALOG-A11Y-001 -->\n<div id="screen-level" class="screen hidden" role="dialog" aria-modal="true" aria-labelledby="level-title">\n  <div class="panel level-panel">\n    <h2 class="title2 glitch" id="level-title" data-i18n="levelUp">升級</h2>'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.101/.test(html), 'cache-bust');
assert.ok(html.includes('LEVEL-DIALOG-A11Y-001'), 'ship id');
assert.ok(agent.includes('LEVEL-DIALOG-A11Y-001') || agent.includes('0.9.101'), 'AGENT_TASK');
assert.ok(/id="screen-level"[^>]*role="dialog"/.test(html) && html.includes('aria-modal="true"'), 'dialog');
assert.ok(html.includes('aria-labelledby="level-title"') && html.includes('id="level-title"'), 'labelledby');
assert.ok(html.includes('level-cards'), 'cards kept');`,
  'menu',
  null,
  () => {
    const el = document.getElementById('screen-level');
    return el ? { role: el.getAttribute('role'), modal: el.getAttribute('aria-modal'), labelledby: el.getAttribute('aria-labelledby') } : { missing: true };
  }
));

// 102 XP-BAR-A11Y
results.push(await ship(
  '0.9.102', 'XP-BAR-A11Y-001', 'xp-bar-a11y',
  'xp-bar role=progressbar aria 經驗/XP + valuemin/max; hub preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div class="xp-bar"><i id="xp-fill"></i></div>',
      '<!-- v0.9.102 XP-BAR-A11Y-001 --><div class="xp-bar" role="progressbar" aria-label="經驗 XP" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="xp-fill"></i></div>'
    );
    wf('index.html', html);
    let main = rf('js/main.js');
    if (!main.includes('XP-BAR-A11Y-001')) {
      const needle = "  const xpPctEl = $('xp-pct');\n  if (xpPctEl) xpPctEl.textContent = Math.round(xpPct * 100) + '%';";
      const insert = needle + "\n  // v0.9.102 XP-BAR-A11Y-001\n  const xpBar = document.querySelector('.xp-bar');\n  if (xpBar) xpBar.setAttribute('aria-valuenow', String(Math.round(xpPct * 100)));";
      if (!main.includes(needle)) throw new Error('xpPctEl hook missing');
      main = main.replace(needle, insert);
    }
    wf('js/main.js', main);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.102/.test(html), 'cache-bust');
assert.ok(html.includes('XP-BAR-A11Y-001'), 'ship id');
assert.ok(agent.includes('XP-BAR-A11Y-001') || agent.includes('0.9.102'), 'AGENT_TASK');
assert.ok(html.includes('role="progressbar"') && html.includes('aria-label="經驗 XP"'), 'progressbar');
assert.ok(html.includes('aria-valuemin="0"') && html.includes('aria-valuemax="100"'), 'range');
assert.ok(html.includes('id="hud-hub"'), 'hub kept');`,
  'play',
  null,
  () => {
    const el = document.querySelector('.xp-bar');
    return el ? { role: el.getAttribute('role'), aria: el.getAttribute('aria-label'), min: el.getAttribute('aria-valuemin'), max: el.getAttribute('aria-valuemax') } : { missing: true };
  }
));

// 103 HUD-ZONE-A11Y
results.push(await ship(
  '0.9.103', 'HUD-ZONE-A11Y-001', 'hud-zone-a11y',
  'hud-zone role=status aria 區域/ZONE; color chip preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="hud-zone" class="hud-zone" data-zone="lab" aria-live="polite">',
      '<!-- v0.9.103 HUD-ZONE-A11Y-001 -->\n      <div id="hud-zone" class="hud-zone" data-zone="lab" role="status" aria-label="區域 ZONE" aria-live="polite">'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.103/.test(html), 'cache-bust');
assert.ok(html.includes('HUD-ZONE-A11Y-001'), 'ship id');
assert.ok(agent.includes('HUD-ZONE-A11Y-001') || agent.includes('0.9.103'), 'AGENT_TASK');
assert.ok(/id="hud-zone"[^>]*role="status"/.test(html), 'role');
assert.ok(html.includes('aria-label="區域 ZONE"'), 'aria');`,
  'play',
  null,
  () => {
    const el = document.getElementById('hud-zone');
    return el ? { role: el.getAttribute('role'), aria: el.getAttribute('aria-label'), zone: el.getAttribute('data-zone') } : { missing: true };
  }
));

// 104 HUD-GOAL-A11Y
results.push(await ship(
  '0.9.104', 'HUD-GOAL-A11Y-001', 'hud-goal-a11y',
  'hud-goal role=status aria 目標/GOAL; kill count preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="hud-goal" class="hud-goal"><span data-i18n="goal.kills"></span> <b id="goal-left">0</b></div>',
      '<!-- v0.9.104 HUD-GOAL-A11Y-001 --><div id="hud-goal" class="hud-goal" role="status" aria-label="目標 GOAL"><span data-i18n="goal.kills"></span> <b id="goal-left">0</b></div>'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.104/.test(html), 'cache-bust');
assert.ok(html.includes('HUD-GOAL-A11Y-001'), 'ship id');
assert.ok(agent.includes('HUD-GOAL-A11Y-001') || agent.includes('0.9.104'), 'AGENT_TASK');
assert.ok(/id="hud-goal"[^>]*role="status"/.test(html), 'role');
assert.ok(html.includes('aria-label="目標 GOAL"'), 'aria');
assert.ok(html.includes('id="goal-left"'), 'count kept');`,
  'play',
  null,
  () => {
    const el = document.getElementById('hud-goal');
    return el ? { role: el.getAttribute('role'), aria: el.getAttribute('aria-label') } : { missing: true };
  }
));

// 105 BEAT-BANNER-ROLE
results.push(await ship(
  '0.9.105', 'BEAT-BANNER-ROLE-001', 'beat-banner-role',
  'beat-banner role=status; queue/timing preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="beat-banner" class="beat-banner hidden" aria-live="polite">',
      '<!-- v0.9.105 BEAT-BANNER-ROLE-001 -->\n<div id="beat-banner" class="beat-banner hidden" role="status" aria-live="polite">'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.105/.test(html), 'cache-bust');
assert.ok(html.includes('BEAT-BANNER-ROLE-001'), 'ship id');
assert.ok(agent.includes('BEAT-BANNER-ROLE-001') || agent.includes('0.9.105'), 'AGENT_TASK');
assert.ok(/id="beat-banner"[^>]*role="status"/.test(html), 'role');
assert.ok(html.includes('aria-live="polite"'), 'live');`,
  'menu',
  null,
  () => {
    const el = document.getElementById('beat-banner');
    return el ? { role: el.getAttribute('role'), live: el.getAttribute('aria-live') } : { missing: true };
  }
));

// 106 RUN-COACH-ROLE
results.push(await ship(
  '0.9.106', 'RUN-COACH-ROLE-001', 'run-coach-role',
  'run-coach role=status; dbl/tpl coach copy preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="run-coach" class="run-coach hidden" aria-live="polite">',
      '<!-- v0.9.106 RUN-COACH-ROLE-001 -->\n<div id="run-coach" class="run-coach hidden" role="status" aria-live="polite">'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.106/.test(html), 'cache-bust');
assert.ok(html.includes('RUN-COACH-ROLE-001'), 'ship id');
assert.ok(agent.includes('RUN-COACH-ROLE-001') || agent.includes('0.9.106'), 'AGENT_TASK');
assert.ok(/id="run-coach"[^>]*role="status"/.test(html), 'role');`,
  'menu',
  null,
  () => {
    const el = document.getElementById('run-coach');
    return el ? { role: el.getAttribute('role') } : { missing: true };
  }
));

// 107 EARLY-TOAST-ROLE
results.push(await ship(
  '0.9.107', 'EARLY-TOAST-ROLE-001', 'early-toast-role',
  'early-toast role=status; no soft-juice invent.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="early-toast" class="early-toast hidden" aria-live="polite" aria-atomic="true">',
      '<!-- v0.9.107 EARLY-TOAST-ROLE-001 -->\n<div id="early-toast" class="early-toast hidden" role="status" aria-live="polite" aria-atomic="true">'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.107/.test(html), 'cache-bust');
assert.ok(html.includes('EARLY-TOAST-ROLE-001'), 'ship id');
assert.ok(agent.includes('EARLY-TOAST-ROLE-001') || agent.includes('0.9.107'), 'AGENT_TASK');
assert.ok(/id="early-toast"[^>]*role="status"/.test(html), 'role');
assert.ok(html.includes('aria-atomic="true"'), 'atomic');`,
  'menu'
));

// 108 NEON-BTN-FOCUS
results.push(await ship(
  '0.9.108', 'NEON-BTN-FOCUS-001', 'neon-btn-focus',
  'neon-btn focus-visible ring ≥2px cyan; UI a11y only.',
  () => {
    let css = rf('css/game.css');
    if (!css.includes('NEON-BTN-FOCUS-001')) {
      css += `

/* ===== NEON-BTN-FOCUS-001 v0.9.108 — keyboard/focus ring (a11y; no soft-juice) ===== */
.neon-btn:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.35), 0 0 16px rgba(0, 229, 255, 0.22);
}
`;
      wf('css/game.css', css);
    }
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.108/.test(html), 'cache-bust');
assert.ok(css.includes('NEON-BTN-FOCUS-001'), 'ship id');
assert.ok(agent.includes('NEON-BTN-FOCUS-001') || agent.includes('0.9.108'), 'AGENT_TASK');
assert.match(css, /\\.neon-btn:focus-visible\\s*\\{[^}]*outline:\\s*2px\\s+solid/s, 'outline');
assert.ok(css.includes('#00e5ff'), 'cyan');`,
  'menu'
));

// 109 ICON-BTN-FOCUS
results.push(await ship(
  '0.9.109', 'ICON-BTN-FOCUS-001', 'icon-btn-focus',
  'icon-btn + menu-icon-btn focus-visible ring ≥2px cyan; tap≥44 kept.',
  () => {
    let css = rf('css/game.css');
    if (!css.includes('ICON-BTN-FOCUS-001')) {
      css += `

/* ===== ICON-BTN-FOCUS-001 v0.9.109 — mute/pause/gear focus ring (a11y; tap≥44 kept) ===== */
.icon-btn:focus-visible,
.menu-icon-btn:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.35), 0 0 14px rgba(0, 229, 255, 0.2);
}
`;
      wf('css/game.css', css);
    }
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.109/.test(html), 'cache-bust');
assert.ok(css.includes('ICON-BTN-FOCUS-001'), 'ship id');
assert.ok(agent.includes('ICON-BTN-FOCUS-001') || agent.includes('0.9.109'), 'AGENT_TASK');
assert.match(css, /\\.icon-btn:focus-visible[\\s\\S]*outline:\\s*2px\\s+solid/, 'icon outline');
assert.ok(css.includes('HUD-MUTE-PAUSE-TAP-001'), 'tap≥44 kept');`,
  'menu'
));

// 110 STICK-ARIA-HIDDEN
results.push(await ship(
  '0.9.110', 'STICK-ARIA-HIDDEN-001', 'stick-aria-hidden',
  'stick aria-hidden=true (visual touch affordance); hide-until-touch preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="stick" class="stick hidden" data-no-input>',
      '<!-- v0.9.110 STICK-ARIA-HIDDEN-001 -->\n<div id="stick" class="stick hidden" data-no-input aria-hidden="true">'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.110/.test(html), 'cache-bust');
assert.ok(html.includes('STICK-ARIA-HIDDEN-001'), 'ship id');
assert.ok(agent.includes('STICK-ARIA-HIDDEN-001') || agent.includes('0.9.110'), 'AGENT_TASK');
assert.ok(/id="stick"[^>]*aria-hidden="true"/.test(html), 'aria-hidden');
assert.ok(html.includes('data-no-input'), 'no-input kept');`,
  'play',
  null,
  () => {
    const el = document.getElementById('stick');
    return el ? { hidden: el.getAttribute('aria-hidden'), cls: el.className } : { missing: true };
  }
));

// 111 OVER-META-A11Y
results.push(await ship(
  '0.9.111', 'OVER-META-A11Y-001', 'over-meta-a11y',
  'over-meta role=group aria 結算摘要/RUN SUMMARY; loadout PST preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div class="over-meta" id="over-meta">',
      '<!-- v0.9.111 OVER-META-A11Y-001 --><div class="over-meta" id="over-meta" role="group" aria-label="結算摘要 RUN SUMMARY">'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.111/.test(html), 'cache-bust');
assert.ok(html.includes('OVER-META-A11Y-001'), 'ship id');
assert.ok(agent.includes('OVER-META-A11Y-001') || agent.includes('0.9.111'), 'AGENT_TASK');
assert.ok(/id="over-meta"[^>]*role="group"/.test(html), 'role');
assert.ok(html.includes('aria-label="結算摘要 RUN SUMMARY"'), 'aria');
assert.ok(html.includes('over-loadout'), 'loadout kept');`,
  'menu',
  null,
  () => {
    const el = document.getElementById('over-meta');
    return el ? { role: el.getAttribute('role'), aria: el.getAttribute('aria-label') } : { missing: true };
  }
));

// 112 MECH-PICK-ARIA-SYNC
results.push(await ship(
  '0.9.112', 'MECH-PICK-ARIA-SYNC-001', 'mech-pick-aria-sync',
  'mech-pick radiogroup aria zh-first 機體選取/FRAME PICK sync.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="mech-pick" class="mech-pick" role="radiogroup" aria-label="機體 FRAME"></div>',
      '<!-- v0.9.112 MECH-PICK-ARIA-SYNC-001 --><div id="mech-pick" class="mech-pick" role="radiogroup" aria-label="機體選取 FRAME PICK"></div>'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.112/.test(html), 'cache-bust');
assert.ok(html.includes('MECH-PICK-ARIA-SYNC-001'), 'ship id');
assert.ok(agent.includes('MECH-PICK-ARIA-SYNC-001') || agent.includes('0.9.112'), 'AGENT_TASK');
assert.ok(html.includes('role="radiogroup"'), 'radiogroup');
assert.ok(html.includes('aria-label="機體選取 FRAME PICK"'), 'aria');`,
  'menu',
  null,
  () => {
    const el = document.getElementById('mech-pick');
    return el ? { role: el.getAttribute('role'), aria: el.getAttribute('aria-label') } : { missing: true };
  }
));

// 113 FPS-ARIA-HIDDEN
results.push(await ship(
  '0.9.113', 'FPS-ARIA-HIDDEN-001', 'fps-aria-hidden',
  'fps counter aria-hidden=true (decorative debug); no GPU change.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="fps" class="fps hidden">-- FPS</div>',
      '<!-- v0.9.113 FPS-ARIA-HIDDEN-001 --><div id="fps" class="fps hidden" aria-hidden="true">-- FPS</div>'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.113/.test(html), 'cache-bust');
assert.ok(html.includes('FPS-ARIA-HIDDEN-001'), 'ship id');
assert.ok(agent.includes('FPS-ARIA-HIDDEN-001') || agent.includes('0.9.113'), 'AGENT_TASK');
assert.ok(/id="fps"[^>]*aria-hidden="true"/.test(html), 'aria-hidden');`,
  'menu'
));

// 114 HUB-TIME-I18N
results.push(await ship(
  '0.9.114', 'HUB-TIME-I18N-001', 'hub-time-i18n',
  'hub time block aria-label from hud.time 時間/TIME; no balance change.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div class="hub-time-block">\n        <span class="hub-val big" id="hud-time">0:00</span>\n      </div>',
      '<!-- v0.9.114 HUB-TIME-I18N-001 -->\n      <div class="hub-time-block" aria-label="時間 TIME">\n        <span class="hub-val big" id="hud-time">0:00</span>\n      </div>'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.114/.test(html), 'cache-bust');
assert.ok(html.includes('HUB-TIME-I18N-001'), 'ship id');
assert.ok(agent.includes('HUB-TIME-I18N-001') || agent.includes('0.9.114'), 'AGENT_TASK');
assert.ok(html.includes('aria-label="時間 TIME"'), 'aria');
assert.ok(strings.includes("'hud.time'") && strings.includes('時間'), 'string exists');
assert.ok(html.includes('id="hud-time"'), 'time kept');`,
  'play',
  null,
  () => {
    const el = document.querySelector('.hub-time-block');
    return el ? { aria: el.getAttribute('aria-label'), time: document.getElementById('hud-time')?.textContent } : { missing: true };
  }
));

// 115 README-TIP-SYNC
results.push(await ship(
  '0.9.115', 'README-TIP-SYNC-001', 'readme-tip-sync',
  'README Play tip sync off stale v0.9.60 → live tip; status line.',
  () => {
    let md = rf('README.md');
    md = md.replace(
      /\*\*試玩 Play:\*\* https:\/\/fung2222\.github\.io\/neon-swarm\/\?v=0\.9\.\d+[^\n]*/,
      '**試玩 Play:** https://fung2222.github.io/neon-swarm/?v=0.9.115 · **狀態 Status:** v0.9.115 README-TIP-SYNC-001（safe a11y batch；HOLD at 0.9.120）'
    );
    if (!md.includes('README-TIP-SYNC-001')) {
      md = md.replace(
        '# 暴走機甲 RAMPAGE MECH',
        '# 暴走機甲 RAMPAGE MECH\n\n<!-- v0.9.115 README-TIP-SYNC-001 — tip header sync; no invent -->'
      );
    }
    // refresh stale phone/layout HOLD blurb lightly
    md = md.replace(
      /> \*\*Phone hit-feel:\*\*[^\n]+/,
      '> **Phone hit-feel:** [docs/HIT-FEEL-DEVICE.md](docs/HIT-FEEL-DEVICE.md) **Complete**／`device verified`（Roy「Ok」2026-10-27）。**Safe pipeline tip:** v0.9.115 — a11y/docs sync；HARD BAN Phase4/horn/soft-juice/full ult/BALANCE/deep GPU。'
    );
    wf('README.md', md);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const md = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.115/.test(html), 'cache-bust');
assert.ok(md.includes('README-TIP-SYNC-001'), 'ship id');
assert.ok(agent.includes('README-TIP-SYNC-001') || agent.includes('0.9.115'), 'AGENT_TASK');
assert.ok(md.includes('?v=0.9.115'), 'tip');
assert.ok(!/\\?v=0\\.9\\.60/.test(md), 'stale tip gone');`,
  'docs'
));

// 116 WEAPONS-MD-BATCH-SYNC
results.push(await ship(
  '0.9.116', 'WEAPONS-MD-BATCH-SYNC-001', 'weapons-md-batch-sync',
  'WEAPONS.md tip + status rows for level/zone/goal/focus a11y batch.',
  () => {
    let w = rf('docs/WEAPONS.md');
    w = w.replace(
      /> \*\*Live:\*\* https:\/\/fung2222\.github\.io\/neon-swarm\/ · \*\*Ship:\*\*[^\n]+/,
      '> **Live:** https://fung2222.github.io/neon-swarm/ · **Ship:** v0.9.116 WEAPONS-MD-BATCH-SYNC-001 · a11y batch v0.9.101–0.9.114 · catalog-fire-live v0.9.75'
    );
    if (!w.includes('WEAPONS-MD-BATCH-SYNC-001')) {
      w = w.replace(
        '## Product rules (locked)',
        '<!-- v0.9.116 WEAPONS-MD-BATCH-SYNC-001 — tip + status rows; no fire/ult invent -->\n\n## Product rules (locked)'
      );
    }
    if (!w.includes('Level screen dialog a11y')) {
      w = w.replace(
        '| Level-card focus ring | **live** (v0.9.97 LEVEL-CARD-FOCUS-001) |',
        `| Level-card focus ring | **live** (v0.9.97 LEVEL-CARD-FOCUS-001) |
| Level screen dialog a11y | **live** (v0.9.101 LEVEL-DIALOG-A11Y-001) |
| XP bar progressbar a11y | **live** (v0.9.102 XP-BAR-A11Y-001) |
| HUD zone/goal status a11y | **live** (v0.9.103–0.9.104) |
| Neon/icon btn focus rings | **live** (v0.9.108–0.9.109) |
| Stick/fps aria-hidden | **live** (v0.9.110 / v0.9.113) |`
      );
    }
    wf('docs/WEAPONS.md', w);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const wdoc = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.116/.test(html), 'cache-bust');
assert.ok(wdoc.includes('WEAPONS-MD-BATCH-SYNC-001'), 'ship id');
assert.ok(agent.includes('WEAPONS-MD-BATCH-SYNC-001') || agent.includes('0.9.116'), 'AGENT_TASK');
assert.ok(wdoc.includes('v0.9.116'), 'tip');
assert.ok(wdoc.includes('Level screen dialog a11y'), 'status row');`,
  'docs'
));

// 117 LEVEL-CARDS-ARIA
results.push(await ship(
  '0.9.117', 'LEVEL-CARDS-ARIA-001', 'level-cards-aria',
  'level-cards role=list aria 升級卡/LEVEL CARDS; focus ring preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="level-cards" class="level-cards"></div>',
      '<!-- v0.9.117 LEVEL-CARDS-ARIA-001 --><div id="level-cards" class="level-cards" role="list" aria-label="升級卡 LEVEL CARDS"></div>'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.117/.test(html), 'cache-bust');
assert.ok(html.includes('LEVEL-CARDS-ARIA-001'), 'ship id');
assert.ok(agent.includes('LEVEL-CARDS-ARIA-001') || agent.includes('0.9.117'), 'AGENT_TASK');
assert.ok(/id="level-cards"[^>]*role="list"/.test(html), 'role');
assert.ok(html.includes('aria-label="升級卡 LEVEL CARDS"'), 'aria');
assert.ok(css.includes('LEVEL-CARD-FOCUS-001'), 'focus kept');`,
  'menu',
  null,
  () => {
    const el = document.getElementById('level-cards');
    return el ? { role: el.getAttribute('role'), aria: el.getAttribute('aria-label') } : { missing: true };
  }
));

// 118 MENU-HOME-MAIN
results.push(await ship(
  '0.9.118', 'MENU-HOME-MAIN-001', 'menu-home-main',
  'screen-start role=main aria 主選單/MAIN MENU; CTA tap preserved.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="screen-start" class="screen hero menu-home">',
      '<!-- v0.9.118 MENU-HOME-MAIN-001 -->\n<div id="screen-start" class="screen hero menu-home" role="main" aria-label="主選單 MAIN MENU">'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.118/.test(html), 'cache-bust');
assert.ok(html.includes('MENU-HOME-MAIN-001'), 'ship id');
assert.ok(agent.includes('MENU-HOME-MAIN-001') || agent.includes('0.9.118'), 'AGENT_TASK');
assert.ok(/id="screen-start"[^>]*role="main"/.test(html), 'role');
assert.ok(html.includes('aria-label="主選單 MAIN MENU"'), 'aria');
assert.ok(css.includes('HOME-CTA-TAP-001') || css.includes('btn-play'), 'CTA context');`,
  'menu',
  null,
  () => {
    const el = document.getElementById('screen-start');
    return el ? { role: el.getAttribute('role'), aria: el.getAttribute('aria-label') } : { missing: true };
  }
));

// 119 SHARE-CONFIRM-ROLE
results.push(await ship(
  '0.9.119', 'SHARE-CONFIRM-ROLE-001', 'share-confirm-role',
  'share-confirm role=status; share btn aria preserved; no SDK invent.',
  () => {
    let html = rf('index.html');
    html = html.replace(
      '<div id="share-confirm" class="share-confirm hidden" aria-live="polite"></div>',
      '<!-- v0.9.119 SHARE-CONFIRM-ROLE-001 --><div id="share-confirm" class="share-confirm hidden" role="status" aria-live="polite"></div>'
    );
    wf('index.html', html);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.119/.test(html), 'cache-bust');
assert.ok(html.includes('SHARE-CONFIRM-ROLE-001'), 'ship id');
assert.ok(agent.includes('SHARE-CONFIRM-ROLE-001') || agent.includes('0.9.119'), 'AGENT_TASK');
assert.ok(/id="share-confirm"[^>]*role="status"/.test(html), 'role');
assert.ok(main.includes('SHARE-BTN-ARIA-001'), 'share aria kept');`,
  'menu'
));

// 120 GAMES-JSON-STAGE-003 + HOLD
results.push(await ship(
  '0.9.120', 'GAMES-JSON-STAGE-003', 'games-json-stage-003',
  'games.json stub stage → v0.9.120; end of 20-slice batch; HOLD.',
  () => {
    let stub = rf('docs/GAMES-JSON-STUB.md');
    stub = stub.replace(/<!-- v0\.9\.\d+ GAMES-JSON-STAGE[^>]*-->/, '<!-- v0.9.120 GAMES-JSON-STAGE-003 — bump stub stage to tip; HOLD -->');
    stub = stub.replace(/網頁版 v0\.9\.\d+/g, '網頁版 v0.9.120');
    stub = stub.replace(/web v0\.9\.\d+/g, 'web v0.9.120');
    if (!stub.includes('GAMES-JSON-STAGE-003')) {
      stub = stub.replace('# games.json stub — neon-swarm', '# games.json stub — neon-swarm\n\n<!-- GAMES-JSON-STAGE-003 -->');
    }
    wf('docs/GAMES-JSON-STUB.md', stub);
  },
  `const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\\?v=0\\.9\\.120/.test(html), 'cache-bust');
assert.ok(stub.includes('GAMES-JSON-STAGE-003'), 'ship id');
assert.ok(agent.includes('GAMES-JSON-STAGE-003') || agent.includes('0.9.120'), 'AGENT_TASK');
assert.ok(stub.includes('v0.9.120'), 'stage tip');
assert.ok(agent.includes('HOLD'), 'HOLD');
assert.ok(stub.includes('2+2+2') || stub.includes('hide-stick') || stub.includes('隱藏搖桿'), 'features');`,
  'docs'
));

console.log('\n==== ALL SHIPPED ====');
console.log(results.join('\n'));
writeFileSync(join(ROOT, 'tools/ship-batch/last-shas.txt'), results.join('\n') + '\n');
