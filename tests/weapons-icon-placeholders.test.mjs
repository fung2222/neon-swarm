/**
 * WEAPONS-ICON-PLACEHOLDERS-001 unit checks (v0.9.57).
 */
import assert from 'assert';
import {
  WEAPON_ICON_SRC, ICON_GLYPH, ICON_ACCENT, weaponIconSvg, weaponIconHtml,
  emptyIconSvg, iconCoverage,
} from '../js/weapons-icons.js';
import { ALL_WEAPON_IDS, PRIMARY_IDS, SECONDARY_IDS, THROW_IDS } from '../js/weapons.js';

assert.equal(ALL_WEAPON_IDS.length, 14);
const cov = iconCoverage();
assert.equal(cov.length, 14);
for (const row of cov) {
  assert.ok(row.glyph, `glyph ${row.id}`);
  assert.ok(row.hasMotif, `motif ${row.id}`);
  assert.equal(row.src, `assets/weapons/${row.id}.png`);
  assert.equal(WEAPON_ICON_SRC[row.id], row.src);
}

for (const id of PRIMARY_IDS) assert.equal(ICON_ACCENT.primary, '#00e5ff');
for (const id of SECONDARY_IDS) {
  const html = weaponIconHtml(id, { size: 40 });
  assert.ok(html.includes('#ff2bd6') || html.includes('ff2bd6'), `sec accent ${id}`);
  assert.ok(html.includes('wico--' + id));
}
for (const id of THROW_IDS) {
  const html = weaponIconHtml(id);
  assert.ok(html.includes('#ffc21a') || html.includes('ffc21a'), `throw accent ${id}`);
}

const g = weaponIconSvg('gatling');
assert.ok(g.includes('<svg'));
assert.ok(g.includes(ICON_GLYPH.gatling));
assert.ok(weaponIconHtml('mg').includes('wico--gatling'), 'alias mg→gatling');

const empty = weaponIconHtml(null, { empty: true });
assert.ok(empty.includes('wico--empty') || empty.includes('wico-empty'));
assert.ok(emptyIconSvg().includes('stroke-dasharray'));

const muted = weaponIconHtml('vulcan', { muted: true });
assert.ok(muted.includes('wico--muted') || muted.includes('#5a6a78'));

const glyphs = new Set(ALL_WEAPON_IDS.map((id) => ICON_GLYPH[id]));
assert.ok(glyphs.size >= 12, 'glyphs mostly unique');

console.log('weapons-icon-placeholders OK', { ids: ALL_WEAPON_IDS.length, glyphs: glyphs.size });
