# menu-mech-phone-fix

**Tip:** v0.9.202 PHONE-MENU-CTA-VISIBLE-001

## Causes
- **Black canvas:** cyber-kit `#screen-start` phone radial (45%→85% near-black) crushed charcoal WebGL (mid avg ~15) on OLED.
- **Dead Start:** `#mech-stage` full-screen `inset:0` + `touch-action:none` + preventDefault could steal taps from `#btn-play` on some Android WebViews.

## Fix
- Punch transparent mid-band on `#screen-start.menu-home` @max-760.
- Clip `#mech-stage` to mid-band (top 16% / bottom 28%).
- Brighter plate + menu `scene.background`; startRun try/catch; Start pointerup+click.

## Shot
`menu-phone-390x844-v0.9.202.png` — box Puppeteer 390×844; **not** Roy real-phone verify.
