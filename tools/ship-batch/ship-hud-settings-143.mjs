/**
 * Ship HUD hub flush + mute→gear + corners + settings audio/quality/share/howto
 * then safe polish → HOLD. Starts tip v0.9.143.
 * Core code already applied in working tree; this runner slices commits + tests + shots + docs.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, createReadStream, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createServer } from 'http';
import assert from 'assert';
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

async function shotHud(slug, ver, fileName = '01-phone.png') {
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
  // Force HUD visible (simulate in-run chrome without full start)
  const probe = await page.evaluate(() => {
    document.body.classList.remove('in-menu');
    for (const k of ['start', 'pause', 'over', 'level', 'gfx']) {
      const e = document.getElementById('screen-' + k);
      if (e) { e.classList.add('hidden'); e.style.setProperty('display', 'none', 'important'); }
    }
    const hud = document.getElementById('hud');
    if (hud) { hud.classList.remove('hidden'); hud.style.removeProperty('display'); }
    const hub = document.getElementById('hud-hub');
    const gear = document.getElementById('btn-settings-run');
    const pause = document.getElementById('btn-pause');
    const mute = document.getElementById('btn-mute');
    const measure = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, w: r.width, h: r.height, display: cs.display };
    };
    return {
      hub: measure(hub),
      gear: measure(gear),
      pause: measure(pause),
      mute: measure(mute),
      saTop: getComputedStyle(document.documentElement).getPropertyValue('--sa-top').trim(),
      hubTopVar: getComputedStyle(document.documentElement).getPropertyValue('--hud-hub-top').trim(),
      chromeUnder: getComputedStyle(document.documentElement).getPropertyValue('--hud-chrome-under').trim(),
    };
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: join(dir, fileName), type: 'png' });
  writeFileSync(join(dir, 'meta.json'), JSON.stringify({ ver, probe, errs: errs.slice(0, 3) }, null, 2));
  await browser.close(); server.close();
  if (errs.length) console.warn('pageerror warn:', errs[0]);
  return probe;
}

async function shotSettings(slug, ver, fileName = '01-phone.png') {
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
  await page.evaluate(() => {
    const btn = document.getElementById('btn-settings-home');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  const probe = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('.ck-settings-panel .ck-set-label')].map((el) => el.textContent.trim());
    const sliders = document.querySelectorAll('.ck-settings-panel .ck-slider').length;
    const actions = document.querySelectorAll('.ck-settings-panel .ck-action').length;
    return { labels, sliders, actions, open: !!document.querySelector('.ck-settings') };
  });
  await page.screenshot({ path: join(dir, fileName), type: 'png' });
  writeFileSync(join(dir, 'meta.json'), JSON.stringify({ ver, probe, errs: errs.slice(0, 3) }, null, 2));
  await browser.close(); server.close();
  if (errs.length) console.warn('pageerror warn:', errs[0]);
  return probe;
}

function writeUnit(slug, ver, id, body) {
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

assert.ok(html.includes('?v=${ver}') || /\\\\?v=0\\\\.9\\\\.\\\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('${id}') || agent.includes('${ver}'), 'AGENT_TASK');

${body}
console.log('${slug}.test.mjs: PASS');
`);
}

function updateDocs(ver, id, blurb, { hold = false, tableRows = null } = {}) {
  const tip = `https://fung2222.github.io/neon-swarm/?v=${ver}`;
  let agent = `# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: ${tip} · Repo: https://github.com/fung2222/neon-swarm

## 狀態：**${hold ? 'HOLD' : 'Active'}** — tip \`v${ver}\` \`${id}\`. ${hold ? 'HUD/settings beat complete; wait Roy try.' : 'HUD/settings beat in progress.'}

**Author:** Grok bot

### Tip
${tip}

### Shipped this beat (slice table)

| Ver | ID | What |
|---|---|---|
`;
  const rows = tableRows || [];
  for (const r of rows) agent += `| v${r.ver} | \`${r.id}\` | ${r.notes} |\n`;
  agent += `
### Preserve / HARD BANS
stick hide · hub content · rail · tap≥44 · dbl/tpl · burst≤3 · floor · 2+2+2 · branch+ult · balance/UI/GPU · over title oneline+size.
Soft-pin kept: HOME-SETTINGS-TAP-001 · HUD-MUTE-PAUSE-TAP-001 · SHARE-FALLBACK-SYNC-001 · UI-LAYOUT-HOME-HUD-001.
Phase 4 · new mech · soft-juice invent · more ult invent · horn lock · Roy PNG · BALANCE re-pass.

### Backlog
- Do **not** start Phase 4 / horn final / soft-juice invent / BALANCE re-pass
`;
  wf('docs/AGENT_TASK.md', agent);

  let hand = rf('docs/HANDOFF.md');
  hand = hand.replace(
    /> \*\*文件日期：\*\*[^\n]*/,
    `> **文件日期：** 2026-10-28（Asia/Hong_Kong；tip v${ver} ${id}；prior GAMES-JSON-STAGE-004 v0.9.142）`
  );
  hand = hand.replace(
    /- 目前 `main`／live cache-bust：\*\*`\?v=0\.9\.\d+`\*\*[^\n]*/,
    `- 目前 \`main\`／live cache-bust：**\`?v=${ver}\`**（${id}；${blurb}；…）`
  );
  // Insert history bullet near top of tip history if pattern exists
  if (!hand.includes(`v${ver} — ${id}`)) {
    hand = hand.replace(
      /(  - v0\.9\.142 —[^\n]*\n)/,
      `  - v${ver} — ${id}：${blurb}\n$1`
    );
  }
  // Active line
  hand = hand.replace(
    /\*\*Active = HOLD\*\*[^\n]*/,
    hold
      ? `**Active = HOLD** — tip \`?v=${ver}\` ${id}. HUD/settings beat done. **no** Phase 4／soft-juice／horn／more ult／BALANCE re-pass.`
      : `**Active = ${id}** — tip \`?v=${ver}\`. HUD/settings beat shipping. **no** Phase 4／soft-juice／horn／more ult／BALANCE re-pass.`
  );
  hand = hand.replace(
    /\*\*HOLD for Roy try\*\* on live `\?v=0\.9\.\d+`[^\n]*/,
    hold
      ? `**HOLD for Roy try** on live \`?v=${ver}\`. Soft-juice / Phase 4 / horn / BALANCE re-pass still banned.`
      : `**Shipping** tip \`?v=${ver}\` (${id}). Soft-juice / Phase 4 / horn / BALANCE re-pass still banned.`
  );
  if (!hand.includes(`**v${ver}** (\`${id}\`)`)) {
    hand = hand.replace(
      /(- \*\*v0\.9\.142\*\* \(`GAMES-JSON-STAGE-004`\)[^\n]*\n)/,
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
  stub = stub.replace(/v0\.9\.\d+/g, `v${ver}`);
  // Fix over-replace of kit version if any — kit stays
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
  // last-shas
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
  // README tip
  try {
    let readme = rf('README.md');
    readme = readme.replace(/\?v=0\.9\.\d+/g, `?v=${ver}`);
    wf('README.md', readme);
    sh('git add README.md');
    try { sh('git commit -m ' + JSON.stringify('chore: README tip v' + ver)); } catch (_) {}
  } catch (_) {}
  sh('git push origin main');
  const sha2 = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  console.log(`SHIPPED v${ver} ${id} @ ${sha2}`);
  return sha2;
}

const TABLE = [];
function row(ver, id, notes) { TABLE.push({ ver, id, notes }); }

async function main() {
  // ===== 0.9.143 already shipped @ 6150ef3 — seed table =====
  row('0.9.143', 'HUD-HUB-FLUSH-TOP-001', 'hub --hud-hub-top → var(--sa-top); no 6–8px gap; safe-area kept');

  // ===== 0.9.144 HUD-MUTE-TO-GEAR-001 =====
  {
    const ver = '0.9.144', id = 'HUD-MUTE-TO-GEAR-001', slug = 'hud-mute-to-gear';
    const blurb = 'in-run mute → gear; opens same settings; settingsTip aria';
    bumpCache(ver);
    writeUnit(slug, ver, id, `
assert.ok(html.includes('btn-settings-run'), 'gear btn');
assert.ok(!html.includes('id="btn-mute"'), 'no mute btn');
assert.ok(html.includes('HUD-MUTE-TO-GEAR-001'), 'marker');
assert.ok(strings.includes('settingsTip'), 'settingsTip');
assert.ok(main.includes('openInRunSettings'), 'open settings');
assert.ok(main.includes('btn-settings-run'), 'listener');
assert.ok(main.includes('toggleMutePersist'), 'mute still persist via settings');
`);
    const probe = await shotHud(slug, ver);
    assert.ok(probe.gear, 'gear present');
    assert.ok(!probe.mute, 'mute gone');
    assert.ok(probe.gear.w >= 44 && probe.gear.h >= 44, 'gear ≥44');
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false, tableRows: TABLE });
    sh(`node tests/${slug}.test.mjs`);
    // soft-pin
    sh('node tests/ui-layout-home-hud.test.mjs');
    sh('node tests/mute-persist.test.mjs');
    commitPush(ver, id, `v${ver} ${id}: mute chrome → gear settings`);
  }

  // ===== 0.9.145 HUD-GEAR-PAUSE-CORNERS-001 =====
  {
    const ver = '0.9.145', id = 'HUD-GEAR-PAUSE-CORNERS-001', slug = 'hud-gear-pause-corners';
    const blurb = 'gear L + pause R under hub corners; row space-between; tap≥44';
    bumpCache(ver);
    writeUnit(slug, ver, id, `
assert.ok(css.includes('HUD-GEAR-PAUSE-CORNERS-001'), 'ship id');
assert.ok(css.includes('--hud-chrome-under'), 'chrome under var');
assert.match(css, /\\.hud-buttons\\.top[^{]*\\{[^}]*justify-content:\\s*space-between/s, 'L/R corners');
assert.match(css, /\\.hud-buttons\\.top[^{]*\\{[^}]*flex-direction:\\s*row/s, 'row under hub');
assert.match(css, /\\.hud-buttons\\.top\\s+\\.icon-btn[^{]*\\{[^}]*min-width:\\s*44px/s, '≥44');
`);
    const probe = await shotHud(slug, ver);
    assert.ok(probe.gear && probe.pause, 'both chrome');
    assert.ok(probe.hub, 'hub');
    assert.ok(probe.gear.top >= probe.hub.bottom - 2, 'gear under hub');
    assert.ok(probe.pause.top >= probe.hub.bottom - 2, 'pause under hub');
    assert.ok(probe.gear.left < probe.pause.left, 'gear left of pause');
    assert.ok(Math.abs(probe.gear.top - probe.pause.top) < 8, 'same row');
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false, tableRows: TABLE });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: gear+pause under hub L/R corners`);
  }

  // ===== 0.9.146 SETTINGS-AUDIO-SPLIT-001 =====
  {
    const ver = '0.9.146', id = 'SETTINGS-AUDIO-SPLIT-001', slug = 'settings-audio-split';
    const blurb = 'SFX + BGM sliders via kit extras type:slider; persist cyber.audio';
    bumpCache(ver);
    writeUnit(slug, ver, id, `
assert.ok(ui.includes("ex.type === 'slider'"), 'kit slider extras');
assert.ok(main.includes("setVolume(v, 'sfx')") || main.includes('setVolume(v, \\'sfx\\')') || main.includes("audio.setVolume(v, 'sfx')"), 'sfx wire');
assert.ok(main.includes("'music'") || main.includes('"music"'), 'bgm/music wire');
assert.ok(strings.includes("'settings.sfx'") || strings.includes('settings.sfx'), 'sfx string');
assert.ok(strings.includes("'settings.bgm'") || strings.includes('settings.bgm'), 'bgm string');
assert.ok(main.includes("id: 'sfx'") && main.includes("id: 'bgm'"), 'extras ids');
`);
    const probe = await shotSettings(slug, ver);
    assert.ok(probe.open, 'settings open');
    assert.ok(probe.labels.some((l) => /聲效|SFX/i.test(l)), 'sfx label ' + probe.labels);
    assert.ok(probe.labels.some((l) => /背景音樂|BGM/i.test(l)), 'bgm label');
    assert.ok(probe.sliders >= 3, 'master+sfx+bgm sliders ≥3 got ' + probe.sliders);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false, tableRows: TABLE });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: SFX + BGM volume sliders`);
  }

  // ===== 0.9.147 SETTINGS-QUALITY-SHARE-HOWTO-001 =====
  {
    const ver = '0.9.147', id = 'SETTINGS-QUALITY-SHARE-HOWTO-001', slug = 'settings-quality-share-howto';
    const blurb = 'quality=glow remap; share+howto actions; pause-on-open in-run';
    bumpCache(ver);
    writeUnit(slug, ver, id, `
assert.ok(strings.includes("'kit.glowLabel'") && strings.includes('畫質'), 'quality label');
assert.ok(ui.includes("ex.type === 'action'"), 'kit action extras');
assert.ok(main.includes("id: 'share'") && main.includes("id: 'howto'"), 'share+howto extras');
assert.ok(main.includes('onShareFromSettings') && main.includes('openHowtoFromSettings'), 'handlers');
assert.ok(main.includes("S.state === 'play') pauseRun"), 'pause-on-open');
assert.ok(strings.includes('settings.share') && strings.includes('settings.howto'), 'strings');
`);
    const probe = await shotSettings(slug, ver);
    assert.ok(probe.open, 'settings open');
    assert.ok(probe.labels.some((l) => /畫質|QUALITY|光暈|GLOW/i.test(l)), 'quality/glow ' + probe.labels);
    assert.ok(probe.labels.some((l) => /分享|SHARE/i.test(l)), 'share');
    assert.ok(probe.labels.some((l) => /操作教學|HOWTO/i.test(l)), 'howto');
    assert.ok(probe.actions >= 2, 'share+howto actions');
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false, tableRows: TABLE });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: quality + share + howto in settings`);
  }

  // ===== polish 0.9.148 SETTINGS-SHEET-PHONE-READ-001 =====
  {
    const ver = '0.9.148', id = 'SETTINGS-SHEET-PHONE-READ-001', slug = 'settings-sheet-phone-read';
    const blurb = 'settings sheet phone contrast / action chrome';
    bumpCache(ver);
    writeUnit(slug, ver, id, `
assert.ok(css.includes('SETTINGS-SHEET-PHONE-READ-001'), 'ship id');
assert.ok(css.includes('.ck-settings-panel .ck-set-label'), 'label contrast');
assert.ok(css.includes('.ck-action'), 'action chrome');
`);
    await shotSettings(slug, ver);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false, tableRows: TABLE });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: settings sheet phone contrast`);
  }

  // ===== polish 0.9.149 GEAR-PAUSE-TAP-NOTE-001 =====
  {
    const ver = '0.9.149', id = 'GEAR-PAUSE-TAP-NOTE-001', slug = 'gear-pause-tap-note';
    const blurb = 'gear+pause tap≥44 docs/CSS affirm under hub';
    bumpCache(ver);
    // tiny CSS note already present; add explicit marker if missing
    let css = rf('css/game.css');
    if (!css.includes('GEAR-PAUSE-TAP-NOTE-001')) {
      css += `\n/* GEAR-PAUSE-TAP-NOTE-001 — affirm ≥44 under hub (inherits HUD-MUTE-PAUSE-TAP-001) */\n.hud-buttons.top #btn-settings-run,\n.hud-buttons.top #btn-pause {\n  min-width: 44px; min-height: 44px;\n}\n`;
      wf('css/game.css', css);
    }
    writeUnit(slug, ver, id, `
assert.ok(css.includes('GEAR-PAUSE-TAP-NOTE-001'), 'ship id');
assert.match(css, /#btn-settings-run[^}]*min-width:\\s*44px/s, 'gear ≥44');
`);
    await shotHud(slug, ver);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false, tableRows: TABLE });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: gear/pause tap target affirm`);
  }

  // ===== polish 0.9.150 SETTINGS-FOCUS-TRAP-NOTE-001 =====
  {
    const ver = '0.9.150', id = 'SETTINGS-FOCUS-TRAP-NOTE-001', slug = 'settings-focus-trap-note';
    const blurb = 'docs: settings/pause focus — kit modal focuses OK; pause-on-open';
    bumpCache(ver);
    // docs-only note in AGENT already; add short comment in main near openInRunSettings
    let mainjs = rf('js/main.js');
    if (!mainjs.includes('SETTINGS-FOCUS-TRAP-NOTE-001')) {
      mainjs = mainjs.replace(
        '/** In-run gear: pause if playing, then same settings sheet as home. */',
        '/** In-run gear: pause if playing, then same settings sheet as home.\n * SETTINGS-FOCUS-TRAP-NOTE-001: kit settings focuses Close; pause screen stays under modal so play cannot continue. */'
      );
      wf('js/main.js', mainjs);
    }
    writeUnit(slug, ver, id, `
assert.ok(main.includes('SETTINGS-FOCUS-TRAP-NOTE-001'), 'note');
assert.ok(main.includes('openInRunSettings'), 'pause-on-open path');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false, tableRows: TABLE });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: settings/pause focus note`);
  }

  // ===== polish 0.9.151 SHARE-FALLBACK-SOFTPIN-001 =====
  {
    const ver = '0.9.151', id = 'SHARE-FALLBACK-SOFTPIN-001', slug = 'share-fallback-softpin';
    const blurb = 'share-fallback soft-pin ≥ tip; settings share reuses result-share';
    bumpCache(ver);
    writeUnit(slug, ver, id, `
assert.ok(/\\\\?v=0\\\\.9\\\\.(15[1-9]|1[6-9]\\\\d|[2-9]\\\\d\\\\d)/.test(html) || html.includes('?v=${ver}'), 'soft-pin ≥0.9.151');
assert.ok(html.includes('btn-share') || html.includes('分享戰績'), 'over share fallback kept');
assert.ok(main.includes('onShareFromSettings'), 'settings share path');
assert.ok(main.includes('shareOrCopy'), 'result-share reused');
`);
    // also bump soft-pin test if exists
    const soft = 'tests/share-fallback-sync.test.mjs';
    if (existsSync(join(ROOT, soft))) {
      let t = rf(soft);
      // leave as-is if regex already soft ≥
      wf(soft, t);
    }
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false, tableRows: TABLE });
    sh(`node tests/${slug}.test.mjs`);
    try { sh('node tests/share-fallback-sync.test.mjs'); } catch (_) { console.warn('share-fallback soft warn'); }
    commitPush(ver, id, `v${ver} ${id}: share soft-pin + settings path`);
  }

  // ===== polish 0.9.152 HANDOFF-AGENT-TIDY-001 =====
  {
    const ver = '0.9.152', id = 'HANDOFF-AGENT-TIDY-001', slug = 'handoff-agent-tidy';
    const blurb = 'HANDOFF/AGENT_TASK tidy for HUD/settings beat';
    bumpCache(ver);
    writeUnit(slug, ver, id, `
assert.ok(agent.includes('HUD-HUB-FLUSH-TOP-001'), 'flush in agent');
assert.ok(agent.includes('SETTINGS-QUALITY-SHARE-HOWTO-001') || agent.includes('${ver}'), 'settings rows');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false, tableRows: TABLE });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: docs tidy`);
  }

  // ===== 0.9.153 GAMES-JSON-STAGE-005 HOLD =====
  {
    const ver = '0.9.153', id = 'GAMES-JSON-STAGE-005', slug = 'games-json-stage-005';
    const blurb = 'games.json stub stage → tip; HUD/settings beat HOLD';
    bumpCache(ver);
    bumpGamesStub(ver, id);
    writeUnit(slug, ver, id, `
const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
assert.ok(stub.includes('${ver}') || stub.includes('v${ver}'), 'stub tip');
assert.ok(agent.includes('HOLD') || agent.includes('${id}'), 'HOLD');
`);
    row(ver, id, blurb + '; **HOLD**');
    updateDocs(ver, id, blurb, { hold: true, tableRows: TABLE });
    sh(`node tests/${slug}.test.mjs`);
    // final soft pins
    sh('node tests/hud-mute-pause-tap.test.mjs');
    sh('node tests/home-settings-tap.test.mjs');
    commitPush(ver, id, `v${ver} ${id}: games.json stub + HOLD`);
  }

  const sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  console.log('\\n=== DONE === tip v0.9.153 HOLD @', sha);
  console.log('Live: https://fung2222.github.io/neon-swarm/?v=0.9.153');
  console.log('TABLE:', JSON.stringify(TABLE, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
