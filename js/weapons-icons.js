/**
 * WEAPONS-ICON-PLACEHOLDERS-001 (v0.9.57)
 * Neon SVG / CSS square tiles for all catalog weapons.
 * WEAPONS-PNG-PATH (v0.9.191): path ready — drop assets/weapons/{id}.png — WEAPON_ICON_SRC already points there;
 * weaponIconHtml prefers <img> when the PNG is present (data-src swap).
 * Do NOT invent Roy final art — placeholders only.
 */
import { ALL_WEAPON_IDS, WEAPON_CATALOG, normalizeWeaponId, weaponDef } from './weapons.js';

/** Future PNG swap map — stable per catalog id. */
export const WEAPON_ICON_SRC = Object.fromEntries(
  ALL_WEAPON_IDS.map((id) => [id, `assets/weapons/${id}.png`]),
);

/** Art-bible accents: cyan / violet-magenta / amber by category. */
export const ICON_ACCENT = {
  primary: '#00e5ff',
  secondary: '#ff2bd6',
  throw: '#ffc21a',
};

/** Short glyph letter shown on the dark plate (stable per id). */
export const ICON_GLYPH = {
  gatling: 'G',
  ion_beam: 'I',
  tracking_bomb: 'T',
  vulcan: 'V',
  zero_laser: 'Z',
  acid_gun: 'A',
  shotgun: 'S',
  slow_gun: 'W',
  attack_drone: 'D',
  blackhole: 'B',
  frag: 'F',
  chill: 'C',
  flash: '✦',
  gravity: '◎',
};

/** Simple geometric motif per weapon (SVG path fragments, viewBox 0 0 64 64). */
const MOTIF = {
  gatling: '<rect x="18" y="14" width="8" height="36" rx="2"/><rect x="30" y="18" width="8" height="28" rx="2"/><rect x="42" y="22" width="8" height="20" rx="2"/>',
  ion_beam: '<rect x="10" y="28" width="44" height="8" rx="2"/><polygon points="54,24 62,32 54,40"/>',
  tracking_bomb: '<circle cx="32" cy="30" r="12"/><path d="M32 18 L36 10 M32 18 L28 10" fill="none" stroke-width="3"/>',
  vulcan: '<circle cx="32" cy="32" r="16" fill="none" stroke-width="4"/><circle cx="32" cy="32" r="4"/><path d="M32 16 L32 10 M48 32 L54 32 M32 48 L32 54 M16 32 L10 32" fill="none" stroke-width="3"/>',
  zero_laser: '<path d="M12 40 L32 12 L52 40 Z" fill="none" stroke-width="3"/><circle cx="32" cy="36" r="4"/>',
  acid_gun: '<path d="M20 18 Q32 8 44 18 L40 48 Q32 56 24 48 Z"/><circle cx="28" cy="30" r="3"/><circle cx="36" cy="38" r="2"/>',
  shotgun: '<path d="M14 28 L50 20 L50 28 L14 36 Z"/><path d="M14 36 L50 44 L50 36" fill="none" stroke-width="3"/>',
  slow_gun: '<circle cx="32" cy="32" r="18" fill="none" stroke-width="3" stroke-dasharray="6 4"/><circle cx="32" cy="32" r="6"/>',
  attack_drone: '<rect x="22" y="26" width="20" height="12" rx="3"/><path d="M16 32 L22 28 M48 32 L42 28 M16 32 L22 36 M48 32 L42 36" fill="none" stroke-width="3"/>',
  blackhole: '<circle cx="32" cy="32" r="16" fill="none" stroke-width="3"/><circle cx="32" cy="32" r="8" fill="none" stroke-width="2"/><circle cx="32" cy="32" r="3"/>',
  frag: '<circle cx="32" cy="30" r="14"/><path d="M32 16 L34 8 M24 20 L18 12 M40 20 L46 12" fill="none" stroke-width="2.5"/>',
  chill: '<path d="M32 12 L32 52 M18 20 L46 44 M46 20 L18 44" fill="none" stroke-width="3"/>',
  flash: '<polygon points="32,10 38,26 56,26 42,36 48,52 32,42 16,52 22,36 8,26 26,26"/>',
  gravity: '<ellipse cx="32" cy="32" rx="18" ry="10" fill="none" stroke-width="3"/><ellipse cx="32" cy="32" rx="10" ry="18" fill="none" stroke-width="3"/>',
};

function accentFor(id) {
  const def = weaponDef(id);
  const cat = def ? def.category : 'primary';
  return ICON_ACCENT[cat] || ICON_ACCENT.primary;
}

function resolveId(id) {
  if (!id) return null;
  const nid = normalizeWeaponId(id);
  return nid && WEAPON_CATALOG[nid] ? nid : (WEAPON_CATALOG[id] ? id : null);
}

/** Build neon SVG markup (inline) for a weapon id. */
export function weaponIconSvg(id, { size = 40, muted = false } = {}) {
  const nid = resolveId(id);
  if (!nid) return emptyIconSvg(size);
  const accent = muted ? '#5a6a78' : accentFor(nid);
  const soft = muted ? '#2a3340' : '#0a0618';
  const glyph = ICON_GLYPH[nid] || '?';
  const motif = MOTIF[nid] || '';
  const op = muted ? '0.55' : '1';
  return (
    `<svg class="wico-svg" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">` +
    `<rect x="2" y="2" width="60" height="60" rx="10" fill="${soft}" stroke="${accent}" stroke-width="2.5" opacity="${op}"/>` +
    `<g fill="${accent}" stroke="${accent}" opacity="${op}">${motif}</g>` +
    `<text x="50" y="54" text-anchor="end" font-size="11" font-weight="700" font-family="ui-monospace,monospace" fill="${accent}" opacity="0.85">${glyph}</text>` +
    `</svg>`
  );
}

export function emptyIconSvg(size = 40) {
  return (
    `<svg class="wico-svg wico-empty" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">` +
    `<rect x="4" y="4" width="56" height="56" rx="10" fill="#0a0618" stroke="#4a5560" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.7"/>` +
    `<text x="32" y="38" text-anchor="middle" font-size="18" fill="#4a5560">·</text>` +
    `</svg>`
  );
}

/**
 * HUD tile HTML. Prefer WEAPON_ICON_SRC <img> when caller marks data-has-png;
 * default = neon SVG placeholder (no network probe here — keep HUD sync sync).
 */
export function weaponIconHtml(id, opts = {}) {
  const { size = 40, muted = false, empty = false, preferSrc = false } = opts;
  if (empty || !id) {
    return `<span class="wico wico--empty">${emptyIconSvg(size)}</span>`;
  }
  const nid = resolveId(id);
  if (!nid) {
    return `<span class="wico wico--empty">${emptyIconSvg(size)}</span>`;
  }
  const src = WEAPON_ICON_SRC[nid];
  const svg = weaponIconSvg(nid, { size, muted });
  if (preferSrc && src) {
    return (
      `<span class="wico wico--${nid}${muted ? ' wico--muted' : ''}" data-weapon="${nid}">` +
      `<img class="wico-img" src="${src}" alt="" width="${size}" height="${size}" ` +
      `onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/>` +
      `<span class="wico-fallback" style="display:none">${svg}</span>` +
      `</span>`
    );
  }
  return (
    `<span class="wico wico--${nid}${muted ? ' wico--muted' : ''}" data-weapon="${nid}" data-icon-src="${src || ''}">` +
    svg +
    `</span>`
  );
}

/** All 14 catalog ids have a distinct glyph + motif. */
export function iconCoverage() {
  return ALL_WEAPON_IDS.map((id) => ({
    id,
    glyph: ICON_GLYPH[id] || null,
    src: WEAPON_ICON_SRC[id],
    accent: accentFor(id),
    hasMotif: !!MOTIF[id],
  }));
}
