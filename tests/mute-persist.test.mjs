/**
 * Mute persist helpers (v0.9.35 / PHASE6-MUTE-PERSIST-001).
 * Run: node tests/mute-persist.test.mjs
 *
 * Honest note: SynthAudio already persisted cyber.<game>.muted via createStore.
 * This task hardens cold-load UI sync, alias mirror, aria tips, menu button, round-trip test.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import {
  MUTE_STORE_KEY, MUTE_LS_KEY, MUTE_ALIAS_KEY,
  readMutedFromStore, writeMutedToStore, readMutedFromLocalStorage,
  muteTipFor, applyMuteUi, applyMutePreference,
} from '../js/mute-persist.js';

assert.equal(MUTE_STORE_KEY, 'muted');
assert.equal(MUTE_LS_KEY, 'cyber.neon-swarm.muted');
assert.equal(MUTE_ALIAS_KEY, 'neon-swarm-mute');

assert.equal(muteTipFor(false, true), '靜音');
assert.equal(muteTipFor(true, true), '取消靜音');
assert.equal(muteTipFor(false, false), 'Mute');
assert.equal(muteTipFor(true, false), 'Unmute');

{
  const mem = Object.create(null);
  const store = {
    getBool(k, def = false) {
      const v = mem[k];
      return v == null ? def : v === '1';
    },
    setBool(k, b) { mem[k] = b ? '1' : '0'; },
  };
  // fake localStorage for alias
  const lsData = Object.create(null);
  globalThis.localStorage = {
    getItem(k) { return lsData[k] ?? null; },
    setItem(k, v) { lsData[k] = String(v); },
  };

  assert.equal(readMutedFromStore(store, false), false);
  writeMutedToStore(store, true);
  assert.equal(mem.muted, '1');
  assert.equal(lsData[MUTE_ALIAS_KEY], '1');
  assert.equal(readMutedFromStore(store, false), true);

  writeMutedToStore(store, false);
  assert.equal(readMutedFromStore(store, false), false);
  assert.equal(lsData[MUTE_ALIAS_KEY], '0');

  // Round-trip kit LS key
  lsData[MUTE_LS_KEY] = '1';
  assert.equal(readMutedFromLocalStorage(globalThis.localStorage, false), true);
  lsData[MUTE_LS_KEY] = '0';
  assert.equal(readMutedFromLocalStorage(globalThis.localStorage, false), false);
  delete lsData[MUTE_LS_KEY];
  lsData[MUTE_ALIAS_KEY] = '1';
  assert.equal(readMutedFromLocalStorage(globalThis.localStorage, false), true);
}

{
  const btn = {
    classList: {
      _on: false,
      toggle(name, on) { if (name === 'muted') this._on = !!on; },
      contains(name) { return name === 'muted' && this._on; },
    },
    attrs: Object.create(null),
    setAttribute(k, v) { this.attrs[k] = String(v); },
  };
  applyMuteUi(true, [btn], { isZh: true });
  assert.equal(btn.classList._on, true);
  assert.equal(btn.attrs['aria-label'], '取消靜音');
  assert.equal(btn.attrs['aria-pressed'], 'true');
  applyMuteUi(false, [btn], { isZh: false });
  assert.equal(btn.classList._on, false);
  assert.equal(btn.attrs.title, 'Mute');
}

{
  const audio = {
    muted: false,
    store: {
      data: Object.create(null),
      getBool(k, d = false) { const v = this.data[k]; return v == null ? d : v === '1'; },
      setBool(k, b) { this.data[k] = b ? '1' : '0'; },
    },
    setMuted(m) { this.muted = !!m; this.store.setBool('muted', this.muted); },
  };
  const btn = {
    classList: { _on: false, toggle(n, on) { if (n === 'muted') this._on = !!on; } },
    attrs: {},
    setAttribute(k, v) { this.attrs[k] = String(v); },
  };
  applyMutePreference(audio, [btn], true, { persist: true, isZh: true });
  assert.equal(audio.muted, true);
  assert.equal(audio.store.data.muted, '1');
  assert.equal(btn.classList._on, true);
  // session override does not call setMuted
  audio.muted = false;
  audio.store.data.muted = '0';
  applyMutePreference(audio, [btn], true, { persist: false, isZh: true });
  assert.equal(audio.muted, true);
  assert.equal(audio.store.data.muted, '0', 'session override must not rewrite store');
}

{
  const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  assert.ok(main.includes('toggleMutePersist'), 'toggle wired');
  assert.ok(main.includes('syncMuteChrome'), 'sync wired');
  assert.ok(main.includes('writeMutedToStore'), 'alias mirror');
  assert.ok(main.includes('btn-mute-menu'), 'menu mute');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('id="btn-mute-menu"'), 'menu markup');
  assert.ok(html.includes('cyber.neon-swarm.muted'), 'early paint');
  assert.ok(/\?v=0\.9\.\d+/.test(html), 'cache-bust');
  const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
  assert.ok(css.includes('.menu-mute'), 'menu mute css');
  const audio = readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8');
  assert.ok(audio.includes('SynthAudio'), 'still uses kit SynthAudio persist');
  const synth = readFileSync(new URL('../vendor/cyber-kit/audio/synth.js', import.meta.url), 'utf8');
  assert.ok(synth.includes("store.getBool('muted'"), 'kit loads muted');
  assert.ok(synth.includes("store.setBool('muted'"), 'kit saves muted');
}

console.log('mute-persist.test.mjs: PASS');
console.log('NOTE: kit SynthAudio already persisted cyber.neon-swarm.muted; this ship hardens UI/early-paint/aria/menu + tests.');
