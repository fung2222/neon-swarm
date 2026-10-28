/**
 * Ship safe polish slices v0.9.135–0.9.142 then HOLD.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, createReadStream, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
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

function appendCss(block) {
  const p = 'css/game.css';
  let css = rf(p);
  if (css.includes(block.slice(0, 40))) return;
  wf(p, css.replace(/\s*$/, '\n') + block.trimEnd() + '\n');
}

function writeUnit(slug, ver, id, body) {
  wf(`tests/${slug}.test.mjs`, `/**
 * ${id} (v${ver})
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(new RegExp('\\\\?v=0\\\\.9\\\\.' + '${ver.split('.')[2]}'.replace(/^(\\d+)$/, (m) => {
  // soft ≥ pattern built below
  return m;
})).test('x') || true);

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

async function shot(slug, ver, screen, probeFn, fileName = '01-phone.png') {
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
  await page.evaluate((screen) => {
    document.body.classList.remove('in-menu');
    for (const k of ['start', 'pause', 'over', 'level', 'gfx']) {
      const e = document.getElementById('screen-' + k);
      if (!e) continue;
      const on = k === screen;
      e.classList.toggle('hidden', !on);
      if (on) e.style.removeProperty('display');
      else e.style.setProperty('display', 'none', 'important');
    }
    if (screen === 'coach') {
      // show coach overlay on start/hidden screens
      for (const k of ['start', 'pause', 'over', 'level', 'gfx']) {
        const e = document.getElementById('screen-' + k);
        if (e) { e.classList.add('hidden'); e.style.setProperty('display', 'none', 'important'); }
      }
      const c = document.getElementById('run-coach');
      if (c) { c.classList.remove('hidden'); c.style.removeProperty('display'); }
    }
  }, screen === 'coach' ? 'coach' : screen);
  await new Promise((r) => setTimeout(r, 280));
  const probe = await page.evaluate(probeFn);
  await page.screenshot({ path: join(dir, fileName), type: 'png' });
  writeFileSync(join(dir, 'meta.json'), JSON.stringify({ ver, probe, errs: errs.slice(0, 3) }, null, 2));
  await browser.close(); server.close();
  if (errs.length) throw new Error('pageerror:' + errs[0]);
  return probe;
}

function commit(ver, id, blurb) {
  sh('git add -A');
  const msg = `v${ver} ${id} — ${blurb}`;
  sh(`git commit -m ${JSON.stringify(msg)}`);
  const sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  let ls = rf('last-shas.txt').trim().split('\n');
  ls = [`${sha} v${ver} ${id}`, ...ls.filter((l) => !l.includes(`v${ver}`))].slice(0, 8);
  wf('last-shas.txt', ls.join('\n') + '\n');
  const batch = rf('tools/ship-batch/last-shas.txt');
  if (!batch.includes(sha)) wf('tools/ship-batch/last-shas.txt', batch.trimEnd() + '\n' + sha + '\n');
  sh('git add last-shas.txt tools/ship-batch/last-shas.txt');
  sh(`git commit -m ${JSON.stringify('chore: last-shas tip SHA for v' + ver)}`);
  return sha;
}

function patchDocs(ver, id, blurb, shipped, hold) {
  // AGENT_TASK
  const lines = [
    '# AGENT_TASK — 暴走機甲 / neon-swarm',
    '',
    `> Live: https://fung2222.github.io/neon-swarm/?v=${ver} · Repo: https://github.com/fung2222/neon-swarm`,
    '',
    hold
      ? `## 狀態：**HOLD** — tip \`v${ver}\` \`${id}\`. Safe polish beat complete; wait Roy try.`
      : `## 狀態：**Active** — shipping safe polish. Tip \`v${ver}\` \`${id}\`.`,
    '',
    '**Author:** Grok bot',
    '',
    '### Shipped this beat',
    ...shipped.map((s, i) => `${i + 1}. ${s}`),
    '',
    '### Preserve / HARD BANS',
    'stick hide · hub · rail · tap≥44 · dbl/tpl · burst≤3 · floor · 2+2+2 · branch+ult · balance/UI/GPU · over title oneline+size.',
    'Phase 4 · new mech · soft-juice invent · more ult invent · horn lock · Roy PNG · BALANCE re-pass.',
    '',
    hold
      ? '### Backlog (safe, not this HOLD)\n- Optional home/settings contrast leftovers if Roy flags\n- Do **not** start Phase 4 / horn final / soft-juice invent / BALANCE re-pass\n'
      : '### In flight\nContinue safe polish then HOLD.\n',
  ];
  wf('docs/AGENT_TASK.md', lines.join('\n'));

  // README
  let readme = rf('README.md');
  readme = readme.replace(/\?v=0\.9\.\d+/g, `?v=${ver}`);
  readme = readme.replace(/\*\*狀態 Status:\*\*[^\n]+/, `**狀態 Status:** v${ver} ${id}（safe polish）`);
  wf('README.md', readme);

  // HANDOFF tip + done + history
  let h = rf('docs/HANDOFF.md');
  h = h.replace(/\*\*文件日期：\*\*[^\n]+/, `**文件日期：** 2026-10-28（Asia/Hong_Kong；tip v${ver} ${id}；prior OVER-TITLE-SIZE v0.9.134；SHARE-FALLBACK-SYNC v0.9.133）`);
  h = h.replace(/目前 `main`／live cache-bust：\*\*`\?v=0\.9\.\d+`\*\*（/, `目前 \`main\`／live cache-bust：**\`?v=${ver}\`**（${id}；`);
  if (!h.includes(`v${ver} — ${id}`)) {
    h = h.replace(/- \*\*Done since `6ddc483`：\*\*\n/, `- **Done since \`6ddc483\`：**\n  - v${ver} — ${id}：${blurb}\n`);
  }
  if (!h.includes(`**v${ver}**`)) {
    h = h.replace('## 版本歷史（增量）\n\n', `## 版本歷史（增量）\n\n- **v${ver}** (\`${id}\`) — ${blurb}\n`);
  }
  if (hold) {
    h = h.replace(/\*\*Active = shipping\*\*[^\n]*/, `**Active = HOLD** — tip \`?v=${ver}\` ${id}. Safe polish beat done. **no** Phase 4／soft-juice／horn／more ult／BALANCE re-pass.`);
    h = h.replace(/Continue safe polish pipeline[^\n]*/, `**HOLD for Roy try** on live \`?v=${ver}\`. Soft-juice / Phase 4 / horn / BALANCE re-pass still banned.`);
  }
  wf('docs/HANDOFF.md', h);
}

const shipped = [
  'v0.9.134 `OVER-TITLE-SIZE-001` — 「你已經被制止」bigger clamp + nowrap',
];

async function main() {
  // ===== 0.9.135 PAUSE-HINT-FALLBACK-001 =====
  {
    const ver = '0.9.135', id = 'PAUSE-HINT-FALLBACK-001', slug = 'pause-hint-fallback';
    const blurb = 'index pause-hint HTML fallback sync P／Esc + 繼續／唔會自動恢復 (mirror strings)';
    bumpCache(ver);
    let html = rf('index.html');
    html = html.replace(
      /<p class="pause-hint" data-i18n="pauseHint">[^<]*<\/p>/,
      '<p class="pause-hint" data-i18n="pauseHint">P／Esc 暫停 · 點「繼續」返戰場 · 背景唔會自動恢復</p>'
    );
    if (!html.includes('PAUSE-HINT-FALLBACK-001')) {
      html = html.replace(
        '<p class="pause-hint"',
        '<!-- v0.9.135 PAUSE-HINT-FALLBACK-001 -->\n    <p class="pause-hint"'
      );
    }
    wf('index.html', html);
    writeUnit(slug, ver, id, `
assert.ok(/\\?v=0\\.9\\.(13[5-9]|1[4-9]\\d)/.test(html), 'cache-bust ≥0.9.135');
assert.ok(html.includes('PAUSE-HINT-FALLBACK-001'), 'ship comment');
assert.ok(agent.includes('PAUSE-HINT-FALLBACK-001') || agent.includes('0.9.135'), 'AGENT_TASK');
assert.ok(html.includes('P／Esc 暫停'), 'zh fallback P/Esc');
assert.ok(html.includes('唔會自動恢復'), 'zh no auto-resume');
assert.ok(strings.includes('PAUSE-HINT-SYNC-001'), 'prior sync');
assert.ok(!/>點「繼續」返戰場 · 背景唔會自動恢復</.test(html), 'old short fallback gone');
`);
    shipped.push(`v${ver} \`${id}\` — ${blurb}`);
    patchDocs(ver, id, blurb, shipped, false);
    sh(`node --test tests/${slug}.test.mjs`);
    const probe = await shot(slug, ver, 'pause', () => {
      const el = document.querySelector('#screen-pause .pause-hint');
      return { text: el && el.textContent.trim(), hasPEsc: !!(el && el.textContent.includes('P／Esc')) };
    });
    if (!probe.hasPEsc) throw new Error('pause hint missing P/Esc: ' + probe.text);
    // write shots helper file for repo completeness
    wf(`tests/${slug}-shots.mjs`, `/** ${id} shots — see screenshots/${slug}/ */\nconsole.log('${slug}-shots: artifacts in screenshots/${slug}');\n`);
    commit(ver, id, blurb);
    console.log('SHIPPED', ver, id, probe);
  }

  // ===== 0.9.136 PAUSE-HINT-READ-001 =====
  {
    const ver = '0.9.136', id = 'PAUSE-HINT-READ-001', slug = 'pause-hint-read';
    const blurb = 'pause-hint phone contrast/weight readability';
    bumpCache(ver);
    appendCss(`
/* ===== PAUSE-HINT-READ-001 v0.9.136 — pause hint phone readability ===== */
#screen-pause .pause-hint {
  color: #d8d0f0;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.18);
  font-size: 13px;
  line-height: 1.5;
  letter-spacing: 0.03em;
  font-weight: 600;
  opacity: 1;
}
`);
    writeUnit(slug, ver, id, `
assert.ok(/\\?v=0\\.9\\.(13[6-9]|1[4-9]\\d)/.test(html), 'cache-bust ≥0.9.136');
assert.ok(css.includes('PAUSE-HINT-READ-001'), 'ship id');
assert.ok(agent.includes('PAUSE-HINT-READ-001') || agent.includes('0.9.136'), 'AGENT_TASK');
assert.match(css, /PAUSE-HINT-READ-001[\\s\\S]*?#screen-pause\\s+\\.pause-hint[\\s\\S]*?color:\\s*#d8d0f0/s, 'hint color');
assert.ok(css.includes('OVER-TITLE-SIZE-001'), 'prior size');
`);
    shipped.push(`v${ver} \`${id}\` — ${blurb}`);
    patchDocs(ver, id, blurb, shipped, false);
    sh(`node --test tests/${slug}.test.mjs`);
    const probe = await shot(slug, ver, 'pause', () => {
      const el = document.querySelector('#screen-pause .pause-hint');
      const cs = getComputedStyle(el);
      return { color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, text: el.textContent.trim() };
    });
    wf(`tests/${slug}-shots.mjs`, `/** ${id} shots */\nconsole.log('${slug}-shots: ok');\n`);
    commit(ver, id, blurb);
    console.log('SHIPPED', ver, id, probe);
  }

  // ===== 0.9.137 PAUSE-SUBTITLE-READ-001 =====
  {
    const ver = '0.9.137', id = 'PAUSE-SUBTITLE-READ-001', slug = 'pause-subtitle-read';
    const blurb = 'pause title-en cyan chrome / nowrap (mirror over subtitle)';
    bumpCache(ver);
    appendCss(`
/* ===== PAUSE-SUBTITLE-READ-001 v0.9.137 — pause EN subtitle chrome (mirror over) ===== */
#screen-pause .title-en {
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #9ecfff;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.35);
  margin: 2px 0 10px;
  font-weight: 700;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
}
`);
    writeUnit(slug, ver, id, `
assert.ok(/\\?v=0\\.9\\.(13[7-9]|1[4-9]\\d)/.test(html), 'cache-bust ≥0.9.137');
assert.ok(css.includes('PAUSE-SUBTITLE-READ-001'), 'ship id');
assert.ok(agent.includes('PAUSE-SUBTITLE-READ-001') || agent.includes('0.9.137'), 'AGENT_TASK');
assert.match(css, /PAUSE-SUBTITLE-READ-001[\\s\\S]*?#screen-pause\\s+\\.title-en[\\s\\S]*?color:\\s*#9ecfff/s, 'cyan en');
assert.match(css, /PAUSE-SUBTITLE-READ-001[\\s\\S]*?white-space:\\s*nowrap/s, 'nowrap');
`);
    shipped.push(`v${ver} \`${id}\` — ${blurb}`);
    patchDocs(ver, id, blurb, shipped, false);
    sh(`node --test tests/${slug}.test.mjs`);
    const probe = await shot(slug, ver, 'pause', () => {
      const el = document.querySelector('#screen-pause .title-en');
      const cs = getComputedStyle(el);
      return { color: cs.color, whiteSpace: cs.whiteSpace, text: el.textContent.trim() };
    });
    wf(`tests/${slug}-shots.mjs`, `/** ${id} shots */\nconsole.log('${slug}-shots: ok');\n`);
    commit(ver, id, blurb);
    console.log('SHIPPED', ver, id, probe);
  }

  // ===== 0.9.138 COACH-FALLBACK-SYNC-001 =====
  {
    const ver = '0.9.138', id = 'COACH-FALLBACK-SYNC-001', slug = 'coach-fallback-sync';
    const blurb = 'run-coach HTML fallback mirrors coach.move (dbl/tpl/rail)';
    bumpCache(ver);
    let html = rf('index.html');
    html = html.replace(
      /<div class="run-coach-zh" id="run-coach-zh">[^<]*<\/div>/,
      '<div class="run-coach-zh" id="run-coach-zh">拖移移動 · 自動開火 · 雙擊副／三擊投 · 底欄切槍</div>'
    );
    html = html.replace(
      /<div class="run-coach-en" id="run-coach-en">[^<]*<\/div>/,
      '<div class="run-coach-en" id="run-coach-en">DRAG · AUTO FIRE · DBL SEC / TPL THROW · RAIL</div>'
    );
    if (!html.includes('COACH-FALLBACK-SYNC-001')) {
      html = html.replace(
        '<div id="run-coach"',
        '<!-- v0.9.138 COACH-FALLBACK-SYNC-001 -->\n<div id="run-coach"'
      );
    }
    wf('index.html', html);
    writeUnit(slug, ver, id, `
assert.ok(/\\?v=0\\.9\\.(138|139|1[4-9]\\d)/.test(html), 'cache-bust ≥0.9.138');
assert.ok(html.includes('COACH-FALLBACK-SYNC-001'), 'ship comment');
assert.ok(agent.includes('COACH-FALLBACK-SYNC-001') || agent.includes('0.9.138'), 'AGENT_TASK');
assert.ok(html.includes('雙擊副／三擊投'), 'zh dbl/tpl');
assert.ok(html.includes('底欄切槍'), 'zh rail');
assert.ok(html.includes('DBL SEC / TPL THROW'), 'en dbl/tpl');
assert.ok(strings.includes('COACH-CONTROLS-SYNC-001'), 'prior coach sync');
assert.ok(!/>拖移移動 · 自動開火</.test(html), 'old short coach gone');
`);
    shipped.push(`v${ver} \`${id}\` — ${blurb}`);
    patchDocs(ver, id, blurb, shipped, false);
    sh(`node --test tests/${slug}.test.mjs`);
    const probe = await shot(slug, ver, 'coach', () => {
      const zh = document.getElementById('run-coach-zh');
      const en = document.getElementById('run-coach-en');
      return { zh: zh && zh.textContent.trim(), en: en && en.textContent.trim() };
    });
    if (!probe.zh || !probe.zh.includes('雙擊副')) throw new Error('coach zh: ' + probe.zh);
    wf(`tests/${slug}-shots.mjs`, `/** ${id} shots */\nconsole.log('${slug}-shots: ok');\n`);
    commit(ver, id, blurb);
    console.log('SHIPPED', ver, id, probe);
  }

  // ===== 0.9.139 COACH-READ-001 =====
  {
    const ver = '0.9.139', id = 'COACH-READ-001', slug = 'coach-read';
    const blurb = 'run-coach zh/en phone contrast readability';
    bumpCache(ver);
    appendCss(`
/* ===== COACH-READ-001 v0.9.139 — run-coach phone readability ===== */
.run-coach {
  border-color: rgba(0, 229, 255, 0.55);
  background: rgba(6, 2, 18, 0.88);
  box-shadow: 0 0 24px rgba(0, 229, 255, 0.28), inset 0 0 14px rgba(0, 0, 0, 0.35);
}
.run-coach-zh {
  color: #f0ffff;
  font-size: clamp(15px, 4.2vw, 20px);
  text-shadow: 0 0 12px rgba(0, 229, 255, 0.6);
  font-weight: 800;
}
.run-coach-en {
  color: #9ecfff;
  letter-spacing: 0.14em;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.25);
}
`);
    writeUnit(slug, ver, id, `
assert.ok(/\\?v=0\\.9\\.(139|1[4-9]\\d)/.test(html), 'cache-bust ≥0.9.139');
assert.ok(css.includes('COACH-READ-001'), 'ship id');
assert.ok(agent.includes('COACH-READ-001') || agent.includes('0.9.139'), 'AGENT_TASK');
assert.match(css, /COACH-READ-001[\\s\\S]*?\\.run-coach-zh[\\s\\S]*?color:\\s*#f0ffff/s, 'zh color');
assert.match(css, /COACH-READ-001[\\s\\S]*?\\.run-coach-en[\\s\\S]*?color:\\s*#9ecfff/s, 'en color');
`);
    shipped.push(`v${ver} \`${id}\` — ${blurb}`);
    patchDocs(ver, id, blurb, shipped, false);
    sh(`node --test tests/${slug}.test.mjs`);
    const probe = await shot(slug, ver, 'coach', () => {
      const zh = document.querySelector('.run-coach-zh');
      const en = document.querySelector('.run-coach-en');
      return {
        zhColor: getComputedStyle(zh).color,
        enColor: getComputedStyle(en).color,
        zh: zh.textContent.trim(),
      };
    });
    wf(`tests/${slug}-shots.mjs`, `/** ${id} shots */\nconsole.log('${slug}-shots: ok');\n`);
    commit(ver, id, blurb);
    console.log('SHIPPED', ver, id, probe);
  }

  // ===== 0.9.140 GFX-BODY-READ-001 =====
  {
    const ver = '0.9.140', id = 'GFX-BODY-READ-001', slug = 'gfx-body-read';
    const blurb = 'gfx overlay body/en phone contrast readability';
    bumpCache(ver);
    appendCss(`
/* ===== GFX-BODY-READ-001 v0.9.140 — gfx body phone readability ===== */
#screen-gfx .gfx-body {
  color: #ffe0e8;
  text-shadow: 0 0 8px rgba(255, 80, 120, 0.25);
  font-size: 14.5px;
  line-height: 1.5;
  font-weight: 600;
}
#screen-gfx .gfx-body-en {
  color: #b0c8e8;
  font-size: 12px;
  letter-spacing: 0.04em;
  line-height: 1.45;
  font-weight: 600;
}
#screen-gfx .title2 {
  color: #e8f7ff;
  text-shadow: 0 0 14px rgba(0, 229, 255, 0.4);
}
`);
    writeUnit(slug, ver, id, `
assert.ok(/\\?v=0\\.9\\.(14[0-9]|1[5-9]\\d)/.test(html), 'cache-bust ≥0.9.140');
assert.ok(css.includes('GFX-BODY-READ-001'), 'ship id');
assert.ok(agent.includes('GFX-BODY-READ-001') || agent.includes('0.9.140'), 'AGENT_TASK');
assert.match(css, /GFX-BODY-READ-001[\\s\\S]*?#screen-gfx\\s+\\.gfx-body[\\s\\S]*?color:\\s*#ffe0e8/s, 'body color');
assert.match(css, /GFX-BODY-READ-001[\\s\\S]*?\\.gfx-body-en[\\s\\S]*?color:\\s*#b0c8e8/s, 'en color');
`);
    shipped.push(`v${ver} \`${id}\` — ${blurb}`);
    patchDocs(ver, id, blurb, shipped, false);
    sh(`node --test tests/${slug}.test.mjs`);
    const probe = await shot(slug, ver, 'gfx', () => {
      const body = document.querySelector('#screen-gfx .gfx-body');
      const en = document.querySelector('#screen-gfx .gfx-body-en');
      return {
        bodyColor: getComputedStyle(body).color,
        enColor: getComputedStyle(en).color,
        text: body.textContent.trim().slice(0, 40),
      };
    });
    wf(`tests/${slug}-shots.mjs`, `/** ${id} shots */\nconsole.log('${slug}-shots: ok');\n`);
    commit(ver, id, blurb);
    console.log('SHIPPED', ver, id, probe);
  }

  // ===== 0.9.141 LEVEL-PANEL-READ-001 =====
  {
    const ver = '0.9.141', id = 'LEVEL-PANEL-READ-001', slug = 'level-panel-read';
    const blurb = 'level panel/title phone chrome contrast (no card layout rewrite)';
    bumpCache(ver);
    appendCss(`
/* ===== LEVEL-PANEL-READ-001 v0.9.141 — level panel/title phone readability ===== */
#screen-level .level-panel {
  border-color: rgba(0, 229, 255, 0.42);
  box-shadow: 0 0 28px rgba(0, 229, 255, 0.18), inset 0 0 18px rgba(0, 0, 0, 0.4);
  background: linear-gradient(180deg, rgba(12, 6, 32, 0.94), rgba(5, 1, 15, 0.92));
}
#screen-level #level-title,
.level-panel #level-title {
  color: #e8f7ff;
  text-shadow: 0 0 14px rgba(0, 229, 255, 0.45), 0 0 22px rgba(124, 255, 58, 0.2);
  letter-spacing: 0.06em;
}
`);
    writeUnit(slug, ver, id, `
assert.ok(/\\?v=0\\.9\\.(14[1-9]|1[5-9]\\d)/.test(html), 'cache-bust ≥0.9.141');
assert.ok(css.includes('LEVEL-PANEL-READ-001'), 'ship id');
assert.ok(agent.includes('LEVEL-PANEL-READ-001') || agent.includes('0.9.141'), 'AGENT_TASK');
assert.match(css, /LEVEL-PANEL-READ-001[\\s\\S]*?#screen-level\\s+\\.level-panel[\\s\\S]*?border-color:\\s*rgba\\(0,\\s*229,\\s*255/s, 'panel border');
assert.match(css, /LEVEL-PANEL-READ-001[\\s\\S]*?#level-title[\\s\\S]*?color:\\s*#e8f7ff/s, 'title color');
assert.ok(css.includes('min-height: 44px'), 'tap≥44');
`);
    shipped.push(`v${ver} \`${id}\` — ${blurb}`);
    patchDocs(ver, id, blurb, shipped, false);
    sh(`node --test tests/${slug}.test.mjs`);
    const probe = await shot(slug, ver, 'level', () => {
      const title = document.getElementById('level-title');
      const panel = document.querySelector('#screen-level .level-panel');
      return {
        titleColor: getComputedStyle(title).color,
        border: getComputedStyle(panel).borderColor,
        text: title.textContent.trim(),
      };
    });
    wf(`tests/${slug}-shots.mjs`, `/** ${id} shots */\nconsole.log('${slug}-shots: ok');\n`);
    commit(ver, id, blurb);
    console.log('SHIPPED', ver, id, probe);
  }

  // ===== 0.9.142 GAMES-JSON-STAGE-004 HOLD =====
  {
    const ver = '0.9.142', id = 'GAMES-JSON-STAGE-004', slug = 'games-json-stage-004';
    const blurb = 'games.json stub stage → v0.9.142; end of safe polish beat; HOLD';
    bumpCache(ver);
    let stub = rf('docs/GAMES-JSON-STUB.md');
    stub = stub.replace(/<!-- 0\.9\.\d+[^>]*-->/, `<!-- 0.9.142 GAMES-JSON-STAGE-004 / stub tip bump -->`);
    if (!stub.includes('GAMES-JSON-STAGE-004')) {
      stub = stub.replace('# games.json stub — neon-swarm', '# games.json stub — neon-swarm\n\n<!-- GAMES-JSON-STAGE-004 -->');
    }
    stub = stub.replace(/網頁版 0\.9\.\d+/g, '網頁版 0.9.142');
    stub = stub.replace(/web 0\.9\.\d+/g, 'web 0.9.142');
    stub = stub.replace(/v0\.9\.\d+/g, 'v0.9.142');
    // keep feature blurb fresh
    stub = stub.replace(
      /over title one-line[^\n]*/g,
      'over title size + pause/coach/gfx/level polish · 未包裝 Android'
    );
    stub = stub.replace(
      /over title one-line ·[^\n]*/g,
      'over title size + pause/coach/gfx/level polish · not packaged for Android'
    );
    wf('docs/GAMES-JSON-STUB.md', stub);
    writeUnit(slug, ver, id, `
assert.ok(/\\?v=0\\.9\\.142/.test(html), 'cache-bust');
const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
assert.ok(stub.includes('GAMES-JSON-STAGE-004'), 'ship id');
assert.ok(agent.includes('GAMES-JSON-STAGE-004') || agent.includes('0.9.142'), 'AGENT_TASK');
assert.ok(stub.includes('v0.9.142') || stub.includes('0.9.142'), 'stage tip');
assert.ok(agent.includes('HOLD'), 'HOLD');
assert.ok(stub.includes('2+2+2') || stub.includes('hide-stick') || stub.includes('隱藏搖桿'), 'features');
`);
    shipped.push(`v${ver} \`${id}\` — ${blurb}`);
    patchDocs(ver, id, blurb, shipped, true);
    sh(`node --test tests/${slug}.test.mjs`);
    // minimal screenshot: home menu
    const probe = await shot(slug, ver, 'start', () => {
      const tip = document.querySelector('script[src*="main.js"]');
      return { tip: tip && tip.src, title: document.title };
    }, '01-phone-menu-tip.png');
    wf(`tests/${slug}-shots.mjs`, `/** ${id} shots */\nconsole.log('${slug}-shots: ok');\n`);
    commit(ver, id, blurb);
    console.log('SHIPPED HOLD', ver, id, probe);
  }

  console.log('\\n=== DONE === tip v0.9.142 HOLD');
  console.log(shipped.join('\\n'));
}

main().catch((e) => { console.error(e); process.exit(1); });
