/**
 * STICK-RAIL-CLAMP-001 (v0.9.66)
 * Stick placeAt clamps above #weapon-rail; idle hide preserved; rail z > stick.
 * Run: node tests/stick-rail-clamp.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(6[6-9]|[7-9]\d)/.test(html), 'cache-bust ≥0.9.66');
assert.ok(main.includes('STICK-RAIL-CLAMP-001'), 'ship id in main');
assert.ok(css.includes('STICK-RAIL-CLAMP-001'), 'ship id in CSS');
assert.ok(agent.includes('STICK-RAIL-CLAMP-001') || agent.includes('0.9.66'), 'AGENT_TASK mentions ship');

// Clamp logic present — measures rail top / keeps air gap
assert.ok(main.includes("getBoundingClientRect()"), 'measures rail box');
assert.ok(main.includes('weapon-rail'), 'references weapon-rail');
assert.ok(main.includes('maxBottom'), 'clamps max bottom');
assert.ok(/rail\.top\s*-\s*10/.test(main) || main.includes('rr.top - 10'), '10px air gap above rail');

// Preserve hide-until-touch contract
assert.match(css, /\.stick\s*\{[^}]*opacity:\s*0/s, 'default stick opacity 0');
assert.match(css, /\.stick\s*\{[^}]*visibility:\s*hidden/s, 'default stick visibility hidden');
assert.match(css, /\.stick\.ready\s*\{[^}]*opacity:\s*0/s, 'ready still invisible');
assert.ok(!/if \(touch\) pulseStickHint\(\)/.test(main), 'no idle hint pulse');
assert.ok(main.includes("root.classList.add('hidden')"), 'release re-hides');
assert.ok(main.includes('TAP_WINDOW_MS'), 'multi-tap kept');
assert.ok(main.includes('secondaryBurstMax') || main.includes('activateSecondaryFromTap'), 'dbl-tap path kept');

// Rail above stick for readability
assert.match(css, /\.weapon-rail\s*\{[^}]*z-index:\s*9/s, 'rail z-index 9');
assert.match(css, /\.stick\s*\{[^}]*z-index:\s*8/s, 'stick z-index 8');

console.log('stick-rail-clamp.test.mjs: PASS');
