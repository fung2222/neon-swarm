# COMBAT-FEEL V1 prototype (preview only)

**Not live tip.** Soft-juice invent ban still applies for formal ship. Wait Roy confirm before main tip integrate.

## Base

- Tip: **v0.9.204** `131fc2d` MOBILE-WEBGL-DIAG (unchanged feel when flag OFF)
- Branch: `proto/combat-feel-v1`
- Gate: `?feelProto=1` (also accepts `?feel=1`) — **OFF by default**

## How Roy opens it

### Local / Pages on this branch

```
# Preview ON
...?feelProto=1&autostart=1&ads=0

# Compare OFF (identical to tip feel)
...?autostart=1&ads=0
```

Full example (hub return preserved):

```
https://fung2222.github.io/neon-swarm/?feelProto=1&hub=1&tier=gold&ads=0
```

If preview is served from the branch / a Pages preview URL, use that host instead of the live tip host.

### What changes when flag is ON

| Beat | Effect (gatling + ordinary grunt only) |
|---|---|
| A Fire | Varied short cyan muzzle; stronger 2D-puppet weapon/upper recoil |
| B Hit | Capped hit sparks on **real** hit events; brighter path via recipe |
| C Hurt | Short funny lean/wobble while `e.hit>0` — **no** position knockback |
| D Kill | Short pop + ≤4 scraps; no every-kill shake/white flash |
| E Combo | Existing kill-streak toasts; kick only at milestone ≥10 |

### Knobs

All in `js/combat-feel-proto.js` → `COMBAT_FEEL_V1`.

## How to revert

```bash
git checkout main   # stay on tip v0.9.204
# or play without query:
open '.../neon-swarm/'   # feelProto absent → OFF
```

## Android (Roy must verify)

Box / SwiftShader ≠ phone. Checklist in `docs/COMBAT-FEEL-REVIEW.md` §8.
Do **not** claim phone OK from this preview alone.

## Concept art (optional)

Any generated concepts stay under this folder for review — **not** wired as in-game textures.
