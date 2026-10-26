/**
 * Damage numbers lite helpers (v0.9.34 / PHASE6-DAMAGE-NUMBERS-LITE-001).
 * Run: node tests/damage-numbers.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import {
  formatFloatText, floatCssClass, shouldEmitFloat, ndcToCss,
  createDamageFloatPool,
  DMG_FLOAT_LIFE_MS, DMG_FLOAT_MAX_DESKTOP, DMG_FLOAT_MAX_MOBILE, DMG_THROTTLE_MS,
} from '../js/damage-numbers.js';

assert.equal(formatFloatText('hit', 3.2), '3');
assert.equal(formatFloatText('hit', 12.6, false), '13');
assert.equal(formatFloatText('hit', 0.2, true), '擋');
assert.equal(formatFloatText('hit', 1.2, true), '1');
assert.equal(formatFloatText('heal', 2), '+2');
assert.equal(formatFloatText('hurt', 3), '-3');

assert.ok(floatCssClass('hit', {}).includes('dmg-hit'));
assert.ok(floatCssClass('hit', { heavy: true }).includes('dmg-heavy'));
assert.ok(floatCssClass('hit', { frontBlock: true }).includes('dmg-block'));
assert.ok(floatCssClass('heal').includes('dmg-heal'));
assert.ok(floatCssClass('hurt').includes('dmg-hurt'));

{
  const m = new Map();
  assert.equal(shouldEmitFloat(m, 'e1', 1000, 100), true);
  assert.equal(shouldEmitFloat(m, 'e1', 1050, 100), false);
  assert.equal(shouldEmitFloat(m, 'e1', 1100, 100), true);
  assert.equal(shouldEmitFloat(m, 'e2', 1050, 100), true);
  assert.equal(shouldEmitFloat(m, null, 1000, 100), true);
}

{
  const p = ndcToCss(0, 0, 200, 100);
  assert.equal(p.left, 100);
  assert.equal(p.top, 50);
  const q = ndcToCss(1, -1, 200, 100);
  assert.equal(q.left, 200);
  assert.equal(q.top, 100);
}

assert.ok(DMG_FLOAT_LIFE_MS >= 450 && DMG_FLOAT_LIFE_MS <= 700);
assert.ok(DMG_THROTTLE_MS >= 80 && DMG_THROTTLE_MS <= 120);
assert.equal(DMG_FLOAT_MAX_DESKTOP, 16);
assert.equal(DMG_FLOAT_MAX_MOBILE, 10);

// Minimal DOM pool via stub
{
  const kids = [];
  const root = {
    appendChild(el) { kids.push(el); return el; },
  };
  // jsdom-free stub elements
  globalThis.performance = globalThis.performance || { now: () => 0 };
  const makeEl = () => {
    const el = {
      className: '',
      style: { display: 'none', left: '', top: '', animation: '' },
      textContent: '',
      setAttribute() {},
      offsetWidth: 1,
    };
    return el;
  };
  // Monkey-patch document.createElement if needed — pool uses document.createElement
  const prevDoc = globalThis.document;
  globalThis.document = {
    createElement: () => makeEl(),
  };
  const pool = createDamageFloatPool(root, { max: 3, lifeMs: 50, throttleMs: 100 });
  assert.equal(kids.length, 3);
  const a = pool.spawn({ kind: 'hit', amount: 4, left: 10, top: 20, key: 'e1', now: 0 });
  assert.ok(a);
  assert.equal(a.textContent, '4');
  assert.ok(a.className.includes('dmg-hit'));
  const skip = pool.spawn({ kind: 'hit', amount: 5, left: 10, top: 20, key: 'e1', now: 40 });
  assert.equal(skip, null, 'throttled');
  const heal = pool.spawn({ kind: 'heal', amount: 2, left: 30, top: 40, now: 40 });
  assert.ok(heal);
  assert.equal(heal.textContent, '+2');
  const block = pool.spawn({ kind: 'hit', amount: 0.1, left: 1, top: 1, frontBlock: true, key: 'sh', now: 200 });
  assert.ok(block);
  assert.equal(block.textContent, '擋');
  pool.clear();
  assert.equal(pool.active.length, 0);
  globalThis.document = prevDoc;
}

{
  const logic = readFileSync(new URL('../js/logic.js', import.meta.url), 'utf8');
  assert.ok(logic.includes('dmg: applied'), 'hit pushHit carries dmg');
  assert.ok(logic.includes('dmg: b.dmg * hitMul'), 'projectile hit carries dmg');
  assert.ok(logic.includes("amount: taken"), 'hurt carries amount');
  const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  assert.ok(main.includes('spawnCombatFloat'), 'wired spawn');
  assert.ok(main.includes('createDamageFloatPool'), 'pool import');
  assert.ok(main.includes("kind: 'heal'"), 'heal float');
  assert.ok(main.includes("kind: 'hurt'"), 'hurt float');
  const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
  assert.ok(css.includes('.dmg-floats'), 'css layer');
  assert.ok(css.includes('dmg-float-rise'), 'css anim');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('id="dmg-floats"'), 'markup');
  assert.ok(/\?v=0\.9\.\d+/.test(html), 'cache-bust');
}

console.log('damage-numbers.test.mjs: PASS');
