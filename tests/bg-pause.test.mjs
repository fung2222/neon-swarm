/**
 * v0.9.20 — commute background auto-pause predicates.
 * Run: node tests/bg-pause.test.mjs
 */
import assert from 'assert';
import { shouldAutoPauseOnHidden, stateAfterBackground } from '../js/bg-pause.js';

{
  assert.equal(shouldAutoPauseOnHidden('play'), true);
  assert.equal(shouldAutoPauseOnHidden('pause'), false);
  assert.equal(shouldAutoPauseOnHidden('menu'), false);
  assert.equal(shouldAutoPauseOnHidden('over'), false);
  assert.equal(shouldAutoPauseOnHidden('level'), false);
  assert.equal(shouldAutoPauseOnHidden('gfx'), false);
}

{
  assert.equal(stateAfterBackground('play'), 'pause');
  // Idempotent / no-op for non-play
  for (const s of ['pause', 'menu', 'over', 'level', 'gfx']) {
    assert.equal(stateAfterBackground(s), s, 'must not change ' + s);
  }
}

{
  // Simulate: hidden → pause; visible must NOT auto-resume (caller never calls resume)
  let state = 'play';
  state = stateAfterBackground(state);
  assert.equal(state, 'pause');
  // "visible" again — state stays pause until user taps resume
  assert.equal(state, 'pause');
  assert.equal(stateAfterBackground('pause'), 'pause');
}

console.log('bg-pause.test.mjs: PASS');
