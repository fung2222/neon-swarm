# Weapon PNGs — Roy drop path

`WEAPON_ICON_SRC` → `assets/weapons/{id}.png` for each catalog id.

| Status | Note |
|---|---|
| **Path ready** | `js/weapons-icons.js` `WEAPON_ICON_SRC` + `weaponIconHtml(..., { preferSrc: true })` img→SVG fallback |
| **In HUD** | Prefer PNG when file exists (`onerror` → neon SVG placeholder) |
| **Roy art** | Drop your PNGs here named `{id}.png` (see catalog ids in `js/weapons.js`). **Do not** claim Grok-generated art as Roy final. |

Catalog ids: gatling, ion_beam, tracking_bomb, vulcan, zero_laser, acid_gun, shotgun, slow_gun, attack_drone, blackhole, frag, chill, flash, gravity.

No Roy-supplied PNGs in repo at v0.9.191 ship — path+docs only; neon SVG placeholders remain default.
