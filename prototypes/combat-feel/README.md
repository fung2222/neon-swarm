# COMBAT-FEEL V1 (formal tip — default ON)

Shipped on live tip **v0.9.205** `COMBAT-FEEL-V1`. Presentation only (gatling + ordinary grunt). Soft-juice invent ban still applies for *new* juice beyond this V1 set.

## Tip
- Live: https://fung2222.github.io/neon-swarm/?v=0.9.205
- Gate: **ON by default**. Force OFF with `?feelProto=0` (also `?feel=0` / `off` / `false`) for A/B debug.
- Keeps v0.9.204 MOBILE-WEBGL-DIAG fixes.

## Open

```text
# Formal tip (feel ON)
...?v=0.9.205&autostart=1&ads=0

# Compare OFF (pre-V1 feel)
...?v=0.9.205&feelProto=0&autostart=1&ads=0

# Hub / arcade
https://fung2222.github.io/neon-swarm/?v=0.9.205&hub=1&tier=gold&ads=0
```

### What is ON (default)
- Gatling: varied short muzzle + recoilMul on puppet attackKick
- Ordinary grunt hit: capped hit sparks + visual lean/wobble (no e.x/e.z move)
- Ordinary grunt kill: short pop + ≤4 scraps (combo streak reuse unchanged)
- Caps / pools / shared textures preserved; no damage/RoF/HP/hit-test/drop edits

### Knobs
All in `js/combat-feel-proto.js` → `COMBAT_FEEL_V1`.

## Limits
Box / SwiftShader ≠ phone. Checklist in `docs/COMBAT-FEEL-REVIEW.md` §8. Phone not claimed verified for this tip.
