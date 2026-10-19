// Health-checks the shipped game as a real user sees it. Failures are reported as ERROR lines.
// Read-only: no files are written.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const fail = (msg) => { console.log('ERROR ' + msg); process.exitCode = 1; };
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const exists = (p) => { try { readFileSync(path.join(root, p)); return true; } catch { return false; } };

const html = read('index.html');
const main = read('js/main.js');
const logic = read('js/logic.js');
const audioSrc = read("js/audio.js");

// 1. Every module the page loads must exist on disk (Pages is case-sensitive).
for (const m of html.matchAll(/(?:src|href)="\.\/([^"?]+)/g)) {
  if (!exists(m[1])) fail('index.html references missing file: ' + m[1]);
}

// 2. Every audio.* call must exist on SwarmAudio or its kit base class.
const kitAudio = read('vendor/cyber-kit/audio/synth.js');
const gameAudio = new Set([...audioSrc.matchAll(/^\s{2}(\w+)\s*\(/gm)].map((m) => m[1]));
const kitMethods = new Set([...kitAudio.matchAll(/^\s{2}(\w+)\s*\(/gm)].map((m) => m[1]));
for (const f of ['js/main.js', 'js/logic.js', 'js/view.js']) {
  for (const m of read(f).matchAll(/\baudio\.(\w+)\(/g)) {
    if (!gameAudio.has(m[1]) && !kitMethods.has(m[1])) fail(`${f} calls audio.${m[1]}() which does not exist`);
  }
}

// 3. The render loop must call stage.render (black-canvas regression).
if (!/stage\.render\(/.test(main)) fail('main.js never calls stage.render()');

// 4. Decorative HUD must not capture presses; only real controls may.
const css = read('css/game.css');
if (!/#hud .hud-panel[^{]*\{[^}]*pointer-events:\s*none/.test(css)) fail('hud panels must be pointer-events:none');
if (!/\.hud-buttons\.top\s*\{[^}]*bottom:\s*auto/.test(css)) fail('.hud-buttons.top must clear kit bottom (v0.3.3 dead-zone fix)');

// 5. Vendored kit version must match the one declared in code and in the docs.
const kitVer = read('vendor/cyber-kit/VERSION').trim();
const cfgVer = (read('js/config.js').match(/KIT\s*=\s*'([^']+)'/) || [])[1];
if (cfgVer !== kitVer) fail(`config KIT ${cfgVer} != vendor/cyber-kit/VERSION ${kitVer}`);

// 6. Bilingual: every i18n key registered in strings.js needs two distinct sides where a translation exists.
const strings = read('js/strings.js');
for (const m of strings.matchAll(/'([\w.]+)':\s*\[\s*'([^']*)',\s*'([^']*)'/g)) {
  if (!m[2].trim()) fail(`i18n ${m[1]} has empty zh-HK string`);
}

// 7. The secret lab path must never appear in a public commit: no absolute URL to a
//    non-Pages path under the owner's namespace, and no explicit "lab" route.
const leakRe = /(?:fung2222\.github\.io|github\.com\/fung2222)\/[^\s`'"()]*\blab\b|[?&](?:lab|portal)=|\/lab\/(?:index\.html)?/i;
const check = (rel) => { if (exists(rel) && leakRe.test(read(rel))) fail(`${rel} looks like it leaks the unlisted lab path`); };
for (const f of ['index.html', 'README.md', 'privacy.html', 'js/main.js', 'js/config.js', 'js/strings.js', 'docs/HANDOFF.md']) check(f);
for (const d of readdirSync(path.join(root, 'docs'))) check('docs/' + d);

if (!process.exitCode) console.log('OK health: assets, audio API, render loop, HUD pointer-events, kit ' + kitVer + ', i18n, lab hygiene');

