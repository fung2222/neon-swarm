/**
 * SHARE-FALLBACK-SOFTPIN-003 (v0.9.177)
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

assert.ok((() => {
  const m = html.match(/\?v=0\.9\.(\d+)/);
  return m && Number(m[1]) >= 177;
})(), 'soft-pin ≥0.9.177');
assert.ok(agent.includes('SHARE-FALLBACK-SOFTPIN-003') || agent.includes('0.9.177') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


const soft = readFileSync(new URL('./share-fallback-softpin.test.mjs', import.meta.url), 'utf8');
assert.ok(soft.includes('Number(m[1]) >= 151'), 'softpin numeric ≥151');
assert.ok(html.includes('btn-share') || html.includes('分享戰績'), 'over share fallback kept');
assert.ok(html.includes('SHARE-FALLBACK-SYNC-001') || html.includes('分享戰績'), 'share fallback sync prior');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');

console.log('share-fallback-softpin-003.test.mjs: PASS');
