/**
 * OVER-LOADOUT-PST-001 (v0.9.84)
 * formatLoadoutFromGame groups Primary/Secondary/Throw.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { formatLoadoutFromGame } from '../js/run-loop-ux.js';
import { CARDS_BY_ID } from '../js/config.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ux = readFileSync(new URL('../js/run-loop-ux.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(84|[8-9]\d)/.test(html) || /\?v=0\.9\.8[4-9]/.test(html), 'cache-bust ≥0.9.84');
assert.ok(ux.includes('OVER-LOADOUT-PST-001'), 'ship id');
assert.ok(agent.includes('OVER-LOADOUT-PST-001') || agent.includes('0.9.84'), 'AGENT_TASK');

const fromLoadout = formatLoadoutFromGame({
  loadout: {
    primary: ['gatling', 'ion_beam'],
    secondary: ['shotgun', null],
    throw: ['frag', null],
  },
  gatling: 1, ion_beam: 2, shotgun: 1, frag: 1,
}, CARDS_BY_ID, true);
assert.ok(fromLoadout.includes('主:'), fromLoadout);
assert.ok(fromLoadout.includes('副:'), fromLoadout);
assert.ok(fromLoadout.includes('投:'), fromLoadout);
assert.ok(fromLoadout.includes('機關雷射炮'), fromLoadout);
assert.ok(fromLoadout.includes('離子光束 Lv2'), fromLoadout);

const en = formatLoadoutFromGame({
  loadout: { primary: ['gatling'], secondary: [], throw: ['frag'] },
  gatling: 1, frag: 1,
}, CARDS_BY_ID, false);
assert.ok(en.includes('P:'), en);
assert.ok(en.includes('T:'), en);

// Prior name asserts still hold for flat weaponSlots
const flat = formatLoadoutFromGame(
  { weaponSlots: ['gatling', 'ion_beam', null, 'tracking_bomb'], ion_beam: 2, tracking_bomb: 1, gatling: 1 },
  CARDS_BY_ID, true,
);
assert.ok(flat.includes('機關雷射炮'), flat);
assert.ok(flat.includes('離子光束 Lv2'), flat);
assert.ok(flat.includes('追蹤爆彈'), flat);

console.log('over-loadout-pst.test.mjs: PASS');
