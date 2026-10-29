/**
 * COMBAT-FEEL V1 proto unit tests — presentation knobs + gate only.
 * No damage / RoF / HP / hit-test assertions (those must stay unchanged).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isFeelProtoEnabled,
  COMBAT_FEEL_V1,
  isFeelProtoWeapon,
  isFeelProtoGrunt,
  protoGatlingMuzzleSteps,
  protoHitSparkSteps,
  protoGruntKillSteps,
  protoRecoilMul,
  protoHurtLean,
} from '../js/combat-feel-proto.js';

describe('feelProto gate', () => {
  it('OFF by default / empty / feelProto=0', () => {
    assert.equal(isFeelProtoEnabled(''), false);
    assert.equal(isFeelProtoEnabled('?ads=0'), false);
    assert.equal(isFeelProtoEnabled('?feelProto=0'), false);
  });
  it('ON for feelProto=1 / feel=1 / true / on', () => {
    assert.equal(isFeelProtoEnabled('?feelProto=1'), true);
    assert.equal(isFeelProtoEnabled('?feel=1'), true);
    assert.equal(isFeelProtoEnabled('?feelProto=true'), true);
    assert.equal(isFeelProtoEnabled('?feel=on&ads=0'), true);
  });
});

describe('scope gates', () => {
  it('weapon: gatling + aliases only', () => {
    assert.equal(isFeelProtoWeapon('gatling'), true);
    assert.equal(isFeelProtoWeapon('mg'), true);
    assert.equal(isFeelProtoWeapon('rocket'), false);
    assert.equal(isFeelProtoWeapon('laser'), false);
  });
  it('grunt: ordinary human family; rejects elite/boss', () => {
    assert.equal(isFeelProtoGrunt({ kind: 'soldier' }), true);
    assert.equal(isFeelProtoGrunt({ kind: 'human', family: 'human' }), true);
    assert.equal(isFeelProtoGrunt({ kind: 'soldier', elite: true }), false);
    assert.equal(isFeelProtoGrunt({ kind: 'human', boss: true }), false);
    assert.equal(isFeelProtoGrunt({ kind: 'human', family: 'human', sniper: true }), false);
  });
});

describe('recipes capped', () => {
  it('muzzle steps have no ring/wave; variety changes color', () => {
    const a = protoGatlingMuzzleSteps(COMBAT_FEEL_V1, { variety: 0 });
    const b = protoGatlingMuzzleSteps(COMBAT_FEEL_V1, { variety: 1 });
    assert.ok(a.length >= 1);
    assert.equal(a[0].ring, false);
    assert.equal(a[0].wave, false);
    assert.notEqual(a[0].color, b[0].color);
    const mob = protoGatlingMuzzleSteps(COMBAT_FEEL_V1, { mobile: true });
    assert.ok(mob[0].n <= a[0].n);
  });
  it('hit / kill particle counts ≤ effectMaxCount', () => {
    const hit = protoHitSparkSteps(COMBAT_FEEL_V1);
    const kill = protoGruntKillSteps(COMBAT_FEEL_V1);
    const max = COMBAT_FEEL_V1.effectMaxCount;
    for (const s of [...hit, ...kill]) {
      assert.ok(s.n <= max, `n=${s.n} > max=${max}`);
      assert.equal(s.ring, false);
      assert.equal(s.wave, false);
    }
  });
  it('deathScrapCount ≤ 4', () => {
    assert.ok(COMBAT_FEEL_V1.deathScrapCount <= 4);
  });
});

describe('presentation helpers', () => {
  it('recoilMul > 1 when recoilStrength set', () => {
    assert.ok(protoRecoilMul(COMBAT_FEEL_V1) > 1);
  });
  it('hurt lean 0 when hitT=0; nonzero when hit', () => {
    assert.equal(protoHurtLean(0, 1.0), 0);
    assert.notEqual(protoHurtLean(0.12, 1.0), 0);
  });
});

describe('balance untouched contract (knobs are presentation-only keys)', () => {
  it('config has no damage / firerate / hp / drop keys', () => {
    const forbidden = ['damage', 'dmg', 'firerate', 'fireRate', 'hp', 'maxHp', 'drop', 'drops', 'pierce'];
    for (const k of forbidden) {
      assert.equal(Object.prototype.hasOwnProperty.call(COMBAT_FEEL_V1, k), false);
    }
  });
});
