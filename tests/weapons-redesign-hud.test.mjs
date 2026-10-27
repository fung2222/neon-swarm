/**
 * WEAPONS-REDESIGN-001 HUD hooks (v0.9.54).
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const weapons = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');

assert.match(html, /\?v=0\.9\.5[0-9]/);
assert.ok(html.includes('id="weapon-status"'));
assert.ok(html.includes('id="weapon-rail"'));
assert.ok(html.includes('id="wstat-mode"'));
assert.ok(css.includes('.weapon-rail'));
assert.ok(css.includes('.wrail-tile'));
assert.ok(weapons.includes('## Feel specs'));
assert.ok(weapons.includes('charge → fire → charge'));
assert.ok(weapons.includes('10 continuous dissolving shots'));
assert.ok(weapons.includes('deploy 2 small drones'));

console.log('weapons-redesign-hud OK');
