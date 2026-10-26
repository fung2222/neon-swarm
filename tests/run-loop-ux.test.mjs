/**
 * Run-loop UX helpers (v0.9.33 / PHASE6-RUN-LOOP-UX-001).
 * Run: node tests/run-loop-ux.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import {
  shouldShowCoach, markCoachSeen, zoneShortLabel, formatLoadoutFromGame,
  COACH_STORAGE_KEY, COACH_MS, HURT_VIGNETTE_MS, ZONE_SHORT,
} from '../js/run-loop-ux.js';
import { CARDS_BY_ID } from '../js/config.js';

{
  const mem = {
    data: Object.create(null),
    getItem(k) { return this.data[k] ?? null; },
    setItem(k, v) { this.data[k] = String(v); },
  };
  assert.equal(shouldShowCoach(mem, {}), true);
  assert.equal(shouldShowCoach(mem, { sessionShown: true }), false);
  markCoachSeen(mem);
  assert.equal(mem.getItem(COACH_STORAGE_KEY), '1');
  assert.equal(shouldShowCoach(mem, {}), false);
}

assert.equal(zoneShortLabel('lab', true), '實驗室');
assert.equal(zoneShortLabel('rooftop', false), 'ROOFTOP');
assert.equal(zoneShortLabel('nope', true), ZONE_SHORT.lab.zh);
assert.ok(COACH_MS >= 2500 && COACH_MS <= 3500);
assert.ok(HURT_VIGNETTE_MS >= 120 && HURT_VIGNETTE_MS <= 280);

{
  const line = formatLoadoutFromGame(
    { weaponSlots: ['mg', 'laser', null, 'rocket'], laser: 2, rocket: 1 },
    CARDS_BY_ID,
    true,
  );
  assert.ok(line.includes('機槍'), line);
  assert.ok(line.includes('鐳射炮 Lv2'), line);
  assert.ok(line.includes('火箭炮'), line);
}

{
  const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  assert.ok(main.includes('maybeShowRunCoach'), 'coach wired');
  assert.ok(main.includes('flashHurtVignette'), 'hurt vignette');
  assert.ok(main.includes('formatLoadoutFromGame'), 'over loadout');
  assert.ok(main.includes('zoneShortLabel'), 'over zone');
  assert.ok(main.includes('hint-pulse') || main.includes('pulseStickHint'), 'stick hint');
  const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
  assert.ok(css.includes('.fx-hurt'), 'hurt css');
  assert.ok(css.includes('.run-coach'), 'coach css');
  assert.ok(css.includes('#xp-fill') || css.includes('.xp-bar'), 'xp punch');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('id="run-coach"'), 'coach markup');
  assert.ok(html.includes('id="fx-hurt"'), 'hurt markup');
  assert.ok(html.includes('id="over-zone"'), 'over zone');
  assert.ok(html.includes('id="over-loadout"'), 'over loadout');
  assert.ok(html.includes('?v=0.9.33'), 'cache-bust');
}

console.log('run-loop-ux.test.mjs: PASS');
