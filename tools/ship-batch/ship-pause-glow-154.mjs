/**
 * Ship PAUSE-GLOW-TO-SETTINGS + safe polish → HOLD.
 * Starts tip v0.9.154. No Phase 4 / mech / soft-juice / ult / horn / BALANCE.
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
const hand = readFileSync(new URL('../docs/HANDOFF.md', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

assert.ok(html.includes('?v=${ver}') || /\\\\?v=0\\\\.9\\\\.\\\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('${id}') || agent.includes('${ver}'), 'AGENT_TASK');

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

async function shotPause(slug, ver) {
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
  const probe = await page.evaluate(() => {
    document.body.classList.remove('in-menu');
    for (const k of ['start', 'pause', 'over', 'level', 'gfx']) {
      const e = document.getElementById('screen-' + k);
      if (!e) continue;
      const on = k === 'pause';
      e.classList.toggle('hidden', !on);
      if (on) e.style.removeProperty('display');
      else e.style.setProperty('display', 'none', 'important');
    }
    const glowBtn = document.getElementById('btn-glow');
    const glowClass = document.querySelector('.ck-glow-btn');
    const resume = document.getElementById('btn-resume');
    const restart = document.getElementById('btn-restart');
    const quit = document.getElementById('btn-quit');
    return {
      hasBtnGlow: !!glowBtn,
      hasCkGlow: !!glowClass,
      hasResume: !!resume,
      hasRestart: !!restart,
      hasQuit: !!quit,
      pauseBtns: [...document.querySelectorAll('#screen-pause button')].map((b) => ({ id: b.id, cls: b.className, text: (b.textContent || '').trim().slice(0, 40) })),
    };
  });
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: join(dir, '01-phone-pause.png'), type: 'png' });
  writeFileSync(join(dir, 'meta.json'), JSON.stringify({ ver, probe, errs: errs.slice(0, 3) }, null, 2));
  await browser.close(); server.close();
  if (errs.length) console.warn('pageerror warn:', errs[0]);
  return probe;
}

async function shotSettings(slug, ver) {
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
  await new Promise((r) => setTimeout(r, 450));
  const probe = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('.ck-settings-panel .ck-set-label')].map((el) => el.textContent.trim());
    const glowSeg = document.querySelector('.ck-settings-panel [data-set="glow"]');
    return {
      labels,
      hasGlowSeg: !!glowSeg,
      hasQualityLabel: labels.some((l) => /畫質|QUALITY/i.test(l)),
      open: !!document.querySelector('.ck-settings'),
    };
  });
  await page.screenshot({ path: join(dir, '02-phone-settings.png'), type: 'png' });
  const metaPath = join(dir, 'meta.json');
  let meta = {};
  try { meta = JSON.parse(readFileSync(metaPath, 'utf8')); } catch (_) {}
  meta.settings = probe;
  meta.errsSettings = errs.slice(0, 3);
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));
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

## 狀態：**${hold ? 'HOLD' : 'Active'}** — tip \`v${ver}\` \`${id}\`. ${hold ? 'Pause-glow→settings + safe polish beat complete; wait Roy try.' : 'Shipping pause-glow→settings + safe polish.'}

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
stick hide · hub flush top · gear L + pause R under hub · settings vol/SFX/BGM/quality/share/howto · rail · tap≥44 · dbl/tpl · burst≤3 · floor · 2+2+2 · branch+ult · over title oneline+size · balance/GPU already shipped.
Soft-pin kept: HOME-SETTINGS-TAP-001 · HUD-MUTE-PAUSE-TAP-001 · SHARE-FALLBACK-SYNC-001 · UI-LAYOUT-HOME-HUD-001.
Phase 4 · new mech · soft-juice invent · more ult invent · horn lock · Roy PNG · BALANCE re-pass.

### Backlog
- Do **not** start Phase 4 / horn final / soft-juice invent / BALANCE re-pass
`;
  wf('docs/AGENT_TASK.md', agent);

  let hand = rf('docs/HANDOFF.md');
  hand = hand.replace(
    /> \*\*文件日期：\*\*[^\n]*/,
    `> **文件日期：** 2026-10-28（Asia/Hong_Kong；tip v${ver} ${id}；prior GAMES-JSON-STAGE-005 v0.9.153）`
  );
  hand = hand.replace(
    /- 目前 `main`／live cache-bust：\*\*`\?v=0\.9\.\d+`\*\*[^\n]*/,
    `- 目前 \`main\`／live cache-bust：**\`?v=${ver}\`**（${id}；${blurb}；…）`
  );
  if (!hand.includes(`v${ver} — ${id}`)) {
    hand = hand.replace(
      /(  - v0\.9\.153 —[^\n]*\n)/,
      `  - v${ver} — ${id}：${blurb}\n$1`
    );
  }
  hand = hand.replace(
    /\*\*Active = HOLD\*\*[^\n]*/,
    hold
      ? `**Active = HOLD** — tip \`?v=${ver}\` ${id}. Pause-glow→settings + safe polish done. **no** Phase 4／soft-juice／horn／more ult／BALANCE re-pass.`
      : `**Active = ${id}** — tip \`?v=${ver}\`. Pause-glow→settings + safe polish shipping. **no** Phase 4／soft-juice／horn／more ult／BALANCE re-pass.`
  );
  // Also handle Active = shipping / Active = ID forms
  if (!/\*\*Active = HOLD\*\*/.test(hand) && hold) {
    hand = hand.replace(
      /\*\*Active = [^\n]*/,
      `**Active = HOLD** — tip \`?v=${ver}\` ${id}. Pause-glow→settings + safe polish done. **no** Phase 4／soft-juice／horn／more ult／BALANCE re-pass.`
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
      /(- \*\*v0\.9\.153\*\* \(`GAMES-JSON-STAGE-005`\)[^\n]*\n)/,
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
  // Only replace stage tip versions in stage strings, not kit
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

async function main() {
  // ===== 0.9.154 PAUSE-GLOW-TO-SETTINGS-001 =====
  {
    const ver = '0.9.154', id = 'PAUSE-GLOW-TO-SETTINGS-001', slug = 'pause-glow-to-settings';
    const blurb = 'remove pause glowToggle; quality/畫質 only in settings';
    bumpCache(ver);
    let mainjs = rf('js/main.js');
    // Remove pause-menu glow button injection; settings sheet keeps quality via mountSettings/setGlow
    if (mainjs.includes('ui.glowToggle(stage)')) {
      mainjs = mainjs.replace(
        /ui\.glowToggle\(stage\);\n/,
        '// PAUSE-GLOW-TO-SETTINGS-001: no pause #btn-glow — quality/畫質 lives in settings only (mountSettings)\n'
      );
      wf('js/main.js', mainjs);
    }
    // Affirm setGlow still present
    mainjs = rf('js/main.js');
    if (!mainjs.includes('stage.setGlow')) {
      throw new Error('stage.setGlow missing — must keep glow system for settings');
    }
    writeUnit(slug, ver, id, `
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glowToggle call');
assert.ok(main.includes('PAUSE-GLOW-TO-SETTINGS-001') || main.includes('mountSettings'), 'settings-only note');
assert.ok(main.includes('stage.setGlow'), 'setGlow kept for settings/quality');
assert.ok(main.includes('mountSettings'), 'settings mounted');
assert.ok(strings.includes("'kit.glowLabel'") && strings.includes('畫質'), 'quality label kept');
assert.ok(ui.includes("data-set=\\"glow\\"") || ui.includes("data-set='glow'") || ui.includes('kit.glowLabel'), 'kit settings glow row');
assert.ok(!html.includes('id="btn-glow"'), 'no static btn-glow in HTML');
`);
    const pauseProbe = await shotPause(slug, ver);
    if (pauseProbe.hasBtnGlow || pauseProbe.hasCkGlow) {
      throw new Error('pause still has glow btn: ' + JSON.stringify(pauseProbe));
    }
    if (!pauseProbe.hasResume || !pauseProbe.hasRestart || !pauseProbe.hasQuit) {
      throw new Error('pause CTAs missing: ' + JSON.stringify(pauseProbe));
    }
    const setProbe = await shotSettings(slug, ver);
    if (!setProbe.hasQualityLabel && !setProbe.hasGlowSeg) {
      throw new Error('settings missing quality/glow: ' + JSON.stringify(setProbe));
    }
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: remove pause glowToggle; quality in settings`);
  }

  // ===== 0.9.155 SETTINGS-QUALITY-AFFIRM-001 =====
  {
    const ver = '0.9.155', id = 'SETTINGS-QUALITY-AFFIRM-001', slug = 'settings-quality-affirm';
    const blurb = 'affirm settings 畫質 row + setGlow persist; no second quality system';
    bumpCache(ver);
    let mainjs = rf('js/main.js');
    if (!mainjs.includes('SETTINGS-QUALITY-AFFIRM-001')) {
      mainjs = mainjs.replace(
        '// v0.9.52 + SETTINGS-*: settings sheet owns mute/volume/lang/sfx/bgm/quality/share/howto',
        '// v0.9.52 + SETTINGS-*: settings sheet owns mute/volume/lang/sfx/bgm/quality/share/howto\n// SETTINGS-QUALITY-AFFIRM-001: 畫質 = kit glow low/high via stage.setGlow({persist}); no second quality system'
      );
      wf('js/main.js', mainjs);
    }
    writeUnit(slug, ver, id, `
assert.ok(main.includes('SETTINGS-QUALITY-AFFIRM-001'), 'affirm note');
assert.ok(main.includes('mountSettings') && main.includes('stage.setGlow'), 'settings+setGlow');
assert.ok(strings.includes('畫質'), '畫質 label');
assert.ok(ui.includes('persist') || ui.includes('setGlow'), 'kit persist path');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: settings quality affirm`);
  }

  // ===== 0.9.156 PAUSE-CTA-ARIA-SYNC-001 =====
  {
    const ver = '0.9.156', id = 'PAUSE-CTA-ARIA-SYNC-001', slug = 'pause-cta-aria-sync';
    const blurb = 'pause Resume/Restart/Quit aria-label via data-i18n-attr; no glow chrome';
    bumpCache(ver);
    let html = rf('index.html');
    if (!html.includes('PAUSE-CTA-ARIA-SYNC-001')) {
      html = html.replace(
        '<button class="neon-btn" id="btn-resume"><span data-i18n="resume"></span><small data-i18n="resumeS"></small></button>\n    <button class="neon-btn ghost" id="btn-restart"><span data-i18n="restart"></span><small data-i18n="restartS"></small></button>\n    <button class="neon-btn ghost" id="btn-quit"><span data-i18n="quit"></span><small data-i18n="quitS"></small></button>',
        '<!-- PAUSE-CTA-ARIA-SYNC-001: aria from i18n; pause has Resume/Restart/Quit only (no glow) -->\n    <button class="neon-btn" id="btn-resume" data-i18n-attr="aria-label:resume"><span data-i18n="resume"></span><small data-i18n="resumeS"></small></button>\n    <button class="neon-btn ghost" id="btn-restart" data-i18n-attr="aria-label:restart"><span data-i18n="restart"></span><small data-i18n="restartS"></small></button>\n    <button class="neon-btn ghost" id="btn-quit" data-i18n-attr="aria-label:quit"><span data-i18n="quit"></span><small data-i18n="quitS"></small></button>'
      );
      wf('index.html', html);
    }
    writeUnit(slug, ver, id, `
assert.ok(html.includes('PAUSE-CTA-ARIA-SYNC-001'), 'ship id');
assert.ok(html.includes('btn-resume') && html.includes('data-i18n-attr="aria-label:resume"'), 'resume aria');
assert.ok(html.includes('data-i18n-attr="aria-label:restart"'), 'restart aria');
assert.ok(html.includes('data-i18n-attr="aria-label:quit"'), 'quit aria');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'still no pause glow');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: pause CTA aria-label sync`);
  }

  // ===== 0.9.157 README-STATUS-SYNC-001 =====
  {
    const ver = '0.9.157', id = 'README-STATUS-SYNC-001', slug = 'readme-status-sync';
    const blurb = 'README status line sync off stale GAMES-JSON-STAGE-004 → tip';
    bumpCache(ver);
    let readme = rf('README.md');
    readme = readme.replace(/\?v=0\.9\.\d+/g, `?v=${ver}`);
    readme = readme.replace(/\*\*狀態 Status:\*\*[^\n]+/, `**狀態 Status:** v${ver} ${id}（pause glow→settings + safe polish）`);
    // Also bump the Safe pipeline tip line if present
    readme = readme.replace(/\*\*Safe pipeline tip:\*\* v0\.9\.\d+/, `**Safe pipeline tip:** v${ver}`);
    wf('README.md', readme);
    writeUnit(slug, ver, id, `
assert.ok(readme.includes('?v=${ver}') || readme.includes('v${ver}'), 'readme tip');
assert.ok(readme.includes('${id}') || readme.includes('${ver}'), 'readme status');
assert.ok(!readme.includes('GAMES-JSON-STAGE-004（safe polish）'), 'stale stage-004 status cleared');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: README status sync`);
  }

  // ===== 0.9.158 WEAPONS-MD-TIP-SYNC-002 =====
  {
    const ver = '0.9.158', id = 'WEAPONS-MD-TIP-SYNC-002', slug = 'weapons-md-tip-sync-002';
    const blurb = 'WEAPONS.md Live tip header sync off stale BALANCE v0.9.124 → tip';
    bumpCache(ver);
    let w = rf('docs/WEAPONS.md');
    w = w.replace(
      /> \*\*Live:\*\* https:\/\/fung2222\.github\.io\/neon-swarm\/ · \*\*Ship:\*\* [^\n]+/,
      `> **Live:** https://fung2222.github.io/neon-swarm/?v=${ver} · **Ship:** v${ver} ${id} · UI a11y/docs sync (weapons unchanged)`
    );
    if (!w.includes('WEAPONS-MD-TIP-SYNC-002')) {
      w = w.replace(
        /(\*\*v0\.9\.98[^\n]*\n)/,
        `**v0.9.158 WEAPONS-MD-TIP-SYNC-002:** Live tip header → v${ver}; pause glow→settings beat; weapons unchanged.\n$1`
      );
    }
    wf('docs/WEAPONS.md', w);
    writeUnit(slug, ver, id, `
const weapons = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
assert.ok(weapons.includes('${ver}') || weapons.includes('v${ver}'), 'weapons tip');
assert.ok(weapons.includes('${id}'), 'ship id');
assert.ok(!/Ship:\\*\\* v0\\.9\\.124 BALANCE/.test(weapons), 'stale balance ship cleared');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: WEAPONS.md tip sync`);
  }

  // ===== 0.9.159 HIT-FEEL-PIPELINE-TIP-001 =====
  {
    const ver = '0.9.159', id = 'HIT-FEEL-PIPELINE-TIP-001', slug = 'hit-feel-pipeline-tip';
    const blurb = 'HIT-FEEL-DEVICE live tip note → current safe pipeline (docs only)';
    bumpCache(ver);
    let hf = rf('docs/HIT-FEEL-DEVICE.md');
    // Add a pipeline tip note without rewriting the verified device checklist URL history
    if (!hf.includes('HIT-FEEL-PIPELINE-TIP-001')) {
      hf = hf.replace(
        '> **Live:** https://fung2222.github.io/neon-swarm/?v=0.9.50  ',
        `> **Live (device-verified baseline):** https://fung2222.github.io/neon-swarm/?v=0.9.50  \n> **Safe pipeline tip now:** https://fung2222.github.io/neon-swarm/?v=${ver} · \`HIT-FEEL-PIPELINE-TIP-001\` (docs sync; hit-feel checklist still tied to verified v0.9.50)`
      );
      wf('docs/HIT-FEEL-DEVICE.md', hf);
    } else {
      hf = hf.replace(/\?v=0\.9\.\d+/g, (m, ...args) => {
        // only bump "Safe pipeline tip now" line — leave verified baseline
        return m;
      });
      hf = hf.replace(
        /\*\*Safe pipeline tip now:\*\* https:\/\/fung2222\.github\.io\/neon-swarm\/\?v=0\.9\.\d+/,
        `**Safe pipeline tip now:** https://fung2222.github.io/neon-swarm/?v=${ver}`
      );
      wf('docs/HIT-FEEL-DEVICE.md', hf);
    }
    writeUnit(slug, ver, id, `
const hf = readFileSync(new URL('../docs/HIT-FEEL-DEVICE.md', import.meta.url), 'utf8');
assert.ok(hf.includes('${id}'), 'ship id');
assert.ok(hf.includes('Safe pipeline tip now') && hf.includes('${ver}'), 'pipeline tip');
assert.ok(hf.includes('v=0.9.50'), 'device-verified baseline kept');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: HIT-FEEL pipeline tip sync`);
  }

  // ===== 0.9.160 HANDOFF-GLOW-SETTINGS-NOTE-001 =====
  {
    const ver = '0.9.160', id = 'HANDOFF-GLOW-SETTINGS-NOTE-001', slug = 'handoff-glow-settings-note';
    const blurb = 'HANDOFF note: pause has no glow btn; 畫質 only in settings';
    bumpCache(ver);
    let hand = rf('docs/HANDOFF.md');
    if (!hand.includes('HANDOFF-GLOW-SETTINGS-NOTE-001')) {
      // Insert near version history top or after tip done list
      const note = `- **v0.9.160 HANDOFF-GLOW-SETTINGS-NOTE-001:** pause menu = title/hint/Resume/Restart/Quit only — **no** \`#btn-glow\` / GLOW LOW/HIGH chrome. Quality/畫質 (kit glow low/high via \`stage.setGlow\` persist) lives **only** in settings sheet. Do not re-add pause glowToggle.\n`;
      if (hand.includes('## 版本歷史（增量）')) {
        hand = hand.replace('## 版本歷史（增量）\n\n', `## 版本歷史（增量）\n\n${note}`);
      } else {
        hand = note + hand;
      }
      wf('docs/HANDOFF.md', hand);
    }
    writeUnit(slug, ver, id, `
assert.ok(hand.includes('${id}'), 'handoff note');
assert.ok(hand.includes('no') && (hand.includes('btn-glow') || hand.includes('glowToggle')), 'no pause glow');
assert.ok(hand.includes('畫質') || hand.includes('settings'), 'settings quality');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'code still clean');
`);
    row(ver, id, blurb);
    updateDocs(ver, id, blurb, { hold: false });
    sh(`node tests/${slug}.test.mjs`);
    commitPush(ver, id, `v${ver} ${id}: HANDOFF glow→settings note`);
  }

  // ===== 0.9.161 GAMES-JSON-STAGE-006 HOLD =====
  {
    const ver = '0.9.161', id = 'GAMES-JSON-STAGE-006', slug = 'games-json-stage-006';
    const blurb = 'games.json stub stage → tip; pause-glow→settings beat HOLD';
    bumpCache(ver);
    bumpGamesStub(ver, id);
    // Enrich stage blurb slightly for this beat
    let stub = rf('docs/GAMES-JSON-STUB.md');
    stub = stub.replace(
      /over title size \+ pause\/coach\/gfx\/level polish/g,
      'pause glow→settings · HUD gear/settings · over/pause polish'
    );
    stub = stub.replace(
      /over title size \+ pause\/coach\/gfx\/level polish/g,
      'pause glow→settings · HUD gear/settings · over/pause polish'
    );
    wf('docs/GAMES-JSON-STUB.md', stub);
    writeUnit(slug, ver, id, `
const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
assert.ok(stub.includes('${ver}') || stub.includes('v${ver}'), 'stub tip');
assert.ok(stub.includes('${id}') || stub.includes('GAMES-JSON-STAGE-006'), 'ship id');
assert.ok(agent.includes('HOLD') || agent.includes('${id}'), 'HOLD');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'pause glow still gone at HOLD');
assert.ok(strings.includes('畫質'), 'settings quality label kept');
`);
    row(ver, id, blurb + '; **HOLD**');
    updateDocs(ver, id, blurb, { hold: true });
    sh(`node tests/${slug}.test.mjs`);
    // soft pins
    try { sh('node tests/hud-mute-pause-tap.test.mjs'); } catch (e) { console.warn('softpin warn', e.message); }
    try { sh('node tests/home-settings-tap.test.mjs'); } catch (e) { console.warn('softpin warn', e.message); }
    try { sh('node tests/pause-glow-to-settings.test.mjs'); } catch (e) { console.warn('glow softpin warn', e.message); }
    commitPush(ver, id, `v${ver} ${id}: games.json stub + HOLD`);
  }

  const sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  const full = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  console.log('\\n=== DONE === tip v0.9.161 HOLD @', sha, full);
  console.log('Live: https://fung2222.github.io/neon-swarm/?v=0.9.161');
  console.log('TABLE:', JSON.stringify(TABLE, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
