/**
 * PHASE6-ZONE-HUD-CHIP-001 — persistent in-run zone chip.
 * Run: node tests/zone-hud-chip.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ZONE_SHORT, zoneShortLabel, zoneChipInfo, ZONE_CHIP_ACCENT } from '../js/run-loop-ux.js';
import { Game } from '../js/logic.js';
import { MAP_ZONE } from '../js/config.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const css = readFileSync(join(ROOT, 'css/game.css'), 'utf8');
const main = readFileSync(join(ROOT, 'js/main.js'), 'utf8');

assert.match(html, /id="hud-zone"/);
assert.match(html, /id="hud-zone-zh"/);
assert.match(html, /id="hud-zone-en"/);
assert.match(html, /\?v=0\.9\.\d+/);

assert.match(css, /\.hud-zone\s*\{/);
assert.match(css, /--zone-accent/);
assert.ok(css.includes('#hud .hud-zone') || css.includes('#hud .hud-goal, #hud .hud-zone')
  || /#hud \.hud-panel[\s\S]*hud-zone/.test(css)
  || css.includes('#hud .hud-zone { pointer-events: none')
  || css.includes('hud-zone { pointer-events: none')
  || /hud-goal, #hud \.hud-zone/.test(css)
  || /hud-goal, #hud \.hud-zone \{ pointer-events:\s*none/.test(css)
  || css.includes('#hud .hud-goal, #hud .hud-zone'),
  'hud-zone in pointer-events-none list');
assert.ok(css.includes('pointer-events: none') && css.includes('hud-zone'));

assert.ok(main.includes('updateZoneHudChip'), 'wired in main');
assert.ok(main.includes('zoneChipInfo'), 'imports zoneChipInfo');
assert.ok(main.includes("ev.type === 'zoneEnter'") && main.includes('updateZoneHudChip(S.game)'),
  'zoneEnter refreshes chip');

for (const id of Object.keys(ZONE_SHORT)) {
  const info = zoneChipInfo(id);
  assert.equal(info.id, id);
  assert.equal(info.zh, ZONE_SHORT[id].zh);
  assert.equal(info.en, ZONE_SHORT[id].en);
  assert.ok(ZONE_CHIP_ACCENT[id], `accent for ${id}`);
  assert.equal(info.accent, ZONE_CHIP_ACCENT[id]);
  assert.equal(zoneShortLabel(id, true), info.zh);
}
assert.equal(zoneChipInfo('nope').id, 'lab');

// Distinct accents (zone identity without danger red)
const accents = Object.values(ZONE_CHIP_ACCENT);
assert.equal(new Set(accents).size, accents.length, 'unique zone accents');
for (const a of accents) {
  assert.ok(!/^#ff/i.test(a) || a === '#ffe600', `accent not danger-red-ish: ${a}`);
  assert.ok(a !== '#ff2a4a' && a !== '#ff2bd6' && a.toLowerCase() !== '#ff0000');
}

// Logic still emits zoneEnter via step; chip is view-only
{
  const g = new Game({ seed: 3, endless: true });
  g.invuln = 99;
  g.hp = 99;
  g.enemies.length = 0;
  g._spawnPauseUntil = 99999;
  assert.equal(g.mapZone, 'lab');
  g.t = MAP_ZONE.assemblyAt - 0.05;
  let saw = false;
  for (let i = 0; i < 8; i++) {
    const { events } = g.step(0.05);
    if (events.some((e) => e.type === 'zoneEnter' && e.zone === 'assembly')) saw = true;
  }
  assert.ok(saw, 'zoneEnter assembly');
  assert.equal(g.mapZone, 'assembly');
  assert.equal(zoneChipInfo(g.mapZone).zh, '機甲組裝區');
}

console.log('zone-hud-chip.test.mjs: PASS');
