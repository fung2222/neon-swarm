import { Game } from '../js/logic.js';
import { xpToLevel, pickCards } from '../js/config.js';
import assert from 'assert';

const g = new Game({ seed: 42 });
g.moveDir(1, 0);
for (let i = 0; i < 120; i++) g.step(1 / 30);
assert.ok(g.t > 3);
assert.ok(g.enemies.length > 0, 'enemies spawn');
assert.equal(xpToLevel(1) > 0, true);
const cards = pickCards(() => 0.2, 3);
assert.equal(cards.length, 3);
console.log('logic OK', { t: g.t.toFixed(1), enemies: g.enemies.length, level: g.level });
