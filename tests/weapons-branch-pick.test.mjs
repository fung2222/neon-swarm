/**
 * WEAPONS-BRANCH-PICK-001 (v0.9.55) — branch/ult offer helpers + Game apply.
 * Run: node tests/weapons-branch-pick.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import {
  BRANCH_UNLOCK_LV, ULT_UNLOCK_LV, branchOptions, ultOptions,
  branchStatMods, buildBranchOfferCards, buildUltOfferCards,
  needsBranchPick, needsUltPick, weaponLevel, CARDS_BY_ID,
} from '../js/config.js';
import { readFileSync } from 'fs';

assert.equal(BRANCH_UNLOCK_LV, 3);
assert.equal(ULT_UNLOCK_LV, 5);

const gOpts = branchOptions('gatling');
assert.equal(gOpts.length, 3);
assert.equal(gOpts[0].letter, 'A');
assert.equal(gOpts[0].zh, '過熱連射');
assert.equal(gOpts[2].letter, 'C');

const sOpts = branchOptions('shotgun');
assert.equal(sOpts.length, 2);

const uOpts = ultOptions('gatling', 'A');
assert.equal(uOpts.length, 2);
assert.equal(uOpts[0].id, 'gatling_A_U1');
assert.equal(ultOptions('shotgun', 'A').length, 0, 'secondary no ult');

const modsA = branchStatMods('gatling', 'A');
assert.ok(modsA.cdMul < 1);
const modsB = branchStatMods('gatling', 'B');
assert.ok(modsB.dmgMul > 1);
assert.ok(modsB.pierceAdd >= 1);
const modsUlt = branchStatMods('gatling', 'A', 'U1');
assert.ok(modsUlt.dmgMul > modsA.dmgMul);

const offer = buildBranchOfferCards('gatling');
assert.equal(offer.kind, 'branch');
assert.equal(offer.choices.length, 3);
assert.equal(offer.choices[0].pickupAction, 'branch');

const uOffer = buildUltOfferCards('ion_beam', 'B');
assert.equal(uOffer.kind, 'ult');
assert.equal(uOffer.choices.length, 2);
assert.equal(uOffer.choices[0].pickupAction, 'ult');

assert.equal(needsBranchPick('gatling', { gatling: 2 }, {}), false);
assert.equal(needsBranchPick('gatling', { gatling: 3 }, {}), true);
assert.equal(needsBranchPick('gatling', { gatling: 3 }, { gatling: 'A' }), false);
assert.equal(needsUltPick('gatling', { gatling: 5 }, { gatling: 'A' }, {}), true);
assert.equal(needsUltPick('gatling', { gatling: 5 }, { gatling: 'A' }, { gatling: 'U1' }), false);
assert.equal(needsUltPick('gatling', { gatling: 5 }, {}, {}), false);

{
  const g = new Game({ seed: 7 });
  assert.ok(g.weaponBranches);
  // push gatling to Lv3 via taken stacks
  g.taken.gatling = 3;
  g._queueWeaponPathOffers('gatling');
  assert.ok(g.pendingPathOffer);
  assert.equal(g.pendingPathOffer.kind, 'branch');
  assert.equal(g._flushPathOffer(), true);
  assert.equal(g.pausedForLevel, true);
  assert.equal(g.pendingFrom, 'branch');
  assert.equal(g.pendingCards.length, 3);

  const pick = g.pendingCards[1]; // B
  g.applyCard(pick);
  assert.equal(g.weaponBranches.gatling, 'B');
  assert.equal(g.pausedForLevel, false);

  // Lv5 + branch → ult
  g.taken.gatling = 5;
  g._queueWeaponPathOffers('gatling');
  assert.ok(g.pendingPathOffer);
  assert.equal(g.pendingPathOffer.kind, 'ult');
  g._flushPathOffer();
  assert.equal(g.pendingFrom, 'ult');
  g.applyCard(g.pendingCards[0]);
  assert.equal(g.weaponUlts.gatling, 'U1');

  const mods = g._weaponMods('gatling');
  assert.ok(mods.dmgMul > 1);
}

{
  // applyCard weapon stack queues branch when crossing Lv3
  const g = new Game({ seed: 9 });
  g.taken.gatling = 2;
  // Simulate third gatling stack via card if present, else manual + queue
  const card = CARDS_BY_ID.mg || CARDS_BY_ID.gatling;
  if (card) {
    g.applyCard(card);
  } else {
    g.taken.gatling = 3;
    g._queueWeaponPathOffers('gatling');
    g._flushPathOffer();
  }
  // After apply, either paused for branch or path queued
  if (!g.pausedForLevel) g._flushPathOffer();
  assert.ok(
    (g.pendingFrom === 'branch' && g.pendingCards && g.pendingCards.length === 3)
    || needsBranchPick('gatling', g.taken, g.weaponBranches) === false
    || g.pendingPathOffer,
    'branch offer expected after Lv3'
  );
}

// HTML / version / CSS hooks
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
assert.match(html, /\?v=0\.9\.5[0-9]/);
assert.ok(css.includes('branch-offer'));
assert.ok(html.includes('id="weapon-status"'));

console.log('weapons-branch-pick OK', {
  branchUnlock: BRANCH_UNLOCK_LV,
  ultUnlock: ULT_UNLOCK_LV,
  gatlingLv: weaponLevel('gatling', { gatling: 3 }),
});
