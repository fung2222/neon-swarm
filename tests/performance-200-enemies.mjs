/**
 * PERF-REBASELINE (v0.9.20) — test-only harness.
 * Measures real rAF + render FPS with ~200 active enemies on hardware GPU Chrome.
 * Does NOT modify formal game JS/CSS/assets. Runtime injection only.
 *
 * Run (on hardware GPU machine):
 *   node tests/performance-200-enemies.mjs
 *
 * Env:
 *   CHROME_PATH  — Chrome executable (required on Windows typically)
 *   GAME_URL     — default GH Pages v0.9.20
 *   OUT_DIR      — results directory
 *   RUNS         — default 3
 *   WARMUP_MS    — default 10000
 *   CAPTURE_MS   — default 60000
 *   PROBE_ONLY   — if "1", only WebGL probe then exit
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = process.env.OUT_DIR
  || path.join(ROOT, 'tests', 'performance-results');
const CHROME = process.env.CHROME_PATH
  || (process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : (fs.existsSync('/usr/bin/google-chrome-stable')
      ? '/usr/bin/google-chrome-stable'
      : '/usr/bin/google-chrome'));
const GAME_URL = process.env.GAME_URL
  || 'https://fung2222.github.io/neon-swarm/?v=0.9.20&lang=en&fps=1&mute=1';
const RUNS = Math.max(1, Number(process.env.RUNS || 3));
const WARMUP_MS = Number(process.env.WARMUP_MS || 10000);
const CAPTURE_MS = Number(process.env.CAPTURE_MS || 60000);
const PROBE_ONLY = process.env.PROBE_ONLY === '1';
const VIEWPORT = { width: 1280, height: 800, deviceScaleFactor: 1 };
const FIXED_SEED = 200001;
const TARGET_ENEMIES = 200;
const ENEMY_MIX = [
  ...Array(80).fill('soldier'),
  ...Array(60).fill('drone'),
  ...Array(40).fill('staffer'),
  ...Array(20).fill('walker'),
];

fs.mkdirSync(OUT_DIR, { recursive: true });

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function summarizeFrameTimes(frameMs) {
  if (!frameMs.length) {
    return {
      frames: 0, avgFps: 0, avgFrameMs: 0, p95FrameMs: 0, p99FrameMs: 0,
      worstFrameMs: 0, over33_3: 0, over50: 0,
    };
  }
  const sorted = [...frameMs].sort((a, b) => a - b);
  const sum = frameMs.reduce((a, b) => a + b, 0);
  const avgFrameMs = sum / frameMs.length;
  return {
    frames: frameMs.length,
    avgFps: 1000 / avgFrameMs,
    avgFrameMs,
    p95FrameMs: percentile(sorted, 95),
    p99FrameMs: percentile(sorted, 99),
    worstFrameMs: sorted[sorted.length - 1],
    over33_3: frameMs.filter((x) => x > 33.3).length,
    over50: frameMs.filter((x) => x > 50).length,
  };
}

function isSoftwareRenderer(renderer, vendor) {
  const s = `${renderer || ''} ${vendor || ''}`.toLowerCase();
  return /swiftshader|llvmpipe|softpipe|software|microsoft basic render|gdi generic/.test(s);
}

async function probeWebGL(page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { ok: false, reason: 'no webgl context' };
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const gameCanvas = document.getElementById('scene');
    let gameRenderer = null;
    let gameVendor = null;
    if (gameCanvas) {
      const ggl = gameCanvas.getContext('webgl2') || gameCanvas.getContext('webgl');
      if (ggl) {
        const gd = ggl.getExtension('WEBGL_debug_renderer_info');
        gameVendor = gd ? ggl.getParameter(gd.UNMASKED_VENDOR_WEBGL) : ggl.getParameter(ggl.VENDOR);
        gameRenderer = gd ? ggl.getParameter(gd.UNMASKED_RENDERER_WEBGL) : ggl.getParameter(ggl.RENDERER);
      }
    }
    return {
      ok: true,
      vendor,
      renderer,
      gameVendor,
      gameRenderer,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      dpr: window.devicePixelRatio,
      inner: { w: window.innerWidth, h: window.innerHeight },
    };
  });
}

async function launchBrowser() {
  if (!fs.existsSync(CHROME)) {
    throw new Error(`Chrome not found at ${CHROME}`);
  }
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    defaultViewport: VIEWPORT,
    args: [
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=CalculateNativeWinOcclusion',
      '--autoplay-policy=no-user-gesture-required',
      // Do NOT force SwiftShader — want hardware ANGLE/D3D11/GL
    ],
  });
  return browser;
}

async function setupStressScene(page) {
  // Start run via UI
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', {
    timeout: 60000,
    polling: 250,
  });
  await page.waitForSelector('#btn-play', { timeout: 30000 });
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, {
    timeout: 30000,
    polling: 100,
  });

  const setup = await page.evaluate(async ({ FIXED_SEED, TARGET_ENEMIES, ENEMY_MIX }) => {
    const S = window.__swarm;
    // Prefer reseeding via same-origin Game class when available
    let seedUsed = FIXED_SEED;
    let reseeded = false;
    try {
      const mod = await import(new URL('./js/logic.js', location.href).href);
      if (mod && mod.Game) {
        S.game = new mod.Game({ seed: FIXED_SEED, endless: true, mech: S.mechId || 'horn' });
        reseeded = true;
      }
    } catch (err) {
      seedUsed = 'startRun-random(reseed-failed:' + String(err && err.message || err) + ')';
    }

    const g = S.game;
    // ---- DISCLOSED test-only runtime controls ----
    // 1) Continuous invulnerability + HP top-up so the run never ends mid-measure.
    // 2) Suppress level-up pause (would freeze simulation).
    // 3) Force ~200 active enemies and top-up as weapons kill them.
    // 4) Weapons LEFT ON (real combat/render load). Enemy HP inflated so density holds.
    g.invuln = 1e9;
    g.hp = g.maxHp;
    g.alive = true;
    g.pausedForLevel = false;
    g.pendingCards = null;
    g.xp = 0;
    g.waveT = 1e9;
    g.spawnAcc = 0;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.gems.length = 0;
    g.zones.length = 0;

    for (let i = 0; i < TARGET_ENEMIES; i++) {
      g._spawn(ENEMY_MIX[i % ENEMY_MIX.length]);
    }
    for (const e of g.enemies) {
      e.hp = 1e9;
      e.maxHp = 1e9;
    }

    if (window.__PERF_MAINTAIN_ID) clearInterval(window.__PERF_MAINTAIN_ID);
    window.__PERF_CTRL = {
      invulnerability: true,
      levelUpSuppressed: true,
      enemyHpInflated: true,
      weaponsActive: true,
      targetEnemies: TARGET_ENEMIES,
      seedUsed,
      reseeded,
      enemyMix: {
        soldier: 80, drone: 60, staffer: 40, walker: 20,
      },
      mech: S.mechId || 'horn',
      note: 'Test-only runtime injection. Formal js/*.js untouched.',
    };
    window.__PERF_STATS = {
      enemyMin: g.enemies.length,
      enemyMax: g.enemies.length,
      samples: 0,
    };

    window.__PERF_MAINTAIN_ID = setInterval(() => {
      const game = window.__swarm && window.__swarm.game;
      if (!game || window.__swarm.state !== 'play') return;
      game.invuln = 1e9;
      game.hp = game.maxHp;
      game.alive = true;
      game.pausedForLevel = false;
      game.pendingCards = null;
      if (game.xp >= game.xpNeed) game.xp = Math.max(0, game.xpNeed - 1);
      game.waveT = 1e9;
      // Top up to target; inflate HP so weapons do not instantly clear density
      let guard = 0;
      while (game.enemies.length < TARGET_ENEMIES && guard++ < TARGET_ENEMIES) {
        const type = ENEMY_MIX[game.enemies.length % ENEMY_MIX.length];
        game._spawn(type);
        const e = game.enemies[game.enemies.length - 1];
        if (e) { e.hp = 1e9; e.maxHp = 1e9; }
      }
      const n = game.enemies.length;
      const st = window.__PERF_STATS;
      st.enemyMin = Math.min(st.enemyMin, n);
      st.enemyMax = Math.max(st.enemyMax, n);
      st.samples++;
    }, 100);

    return {
      enemyCount: g.enemies.length,
      ctrl: window.__PERF_CTRL,
      px: g.px,
      pz: g.pz,
    };
  }, { FIXED_SEED, TARGET_ENEMIES, ENEMY_MIX });

  return setup;
}

async function measureRun(page, runIndex) {
  // Reset frame buffer + start rAF sampler AFTER scene is ready
  await page.evaluate(() => {
    window.__PERF_FRAMES = [];
    window.__PERF_SAMPLING = false;
    window.__PERF_PHASE = 'idle';
    if (window.__PERF_RAF) cancelAnimationFrame(window.__PERF_RAF);
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      if (window.__PERF_SAMPLING) {
        // Ignore multi-second stalls (tab switch / GC spike outliers > 1000ms still recorded)
        window.__PERF_FRAMES.push(dt);
      }
      window.__PERF_RAF = requestAnimationFrame(tick);
    };
    window.__PERF_RAF = requestAnimationFrame(tick);
  });

  // Warmup
  await page.evaluate(() => { window.__PERF_PHASE = 'warmup'; window.__PERF_FRAMES = []; window.__PERF_SAMPLING = true; });
  await new Promise((r) => setTimeout(r, WARMUP_MS));

  // Capture window
  await page.evaluate(() => { window.__PERF_PHASE = 'capture'; window.__PERF_FRAMES = []; });
  await new Promise((r) => setTimeout(r, CAPTURE_MS));

  const raw = await page.evaluate(() => {
    window.__PERF_SAMPLING = false;
    window.__PERF_PHASE = 'done';
    return {
      frames: window.__PERF_FRAMES.slice(),
      stats: window.__PERF_STATS,
      ctrl: window.__PERF_CTRL,
      state: window.__swarm && window.__swarm.state,
      enemyCount: window.__swarm && window.__swarm.game && window.__swarm.game.enemies.length,
      dpr: window.devicePixelRatio,
      inner: { w: window.innerWidth, h: window.innerHeight },
    };
  });

  const summary = summarizeFrameTimes(raw.frames);
  return { runIndex, summary, raw };
}

async function pointerDragCheck(page) {
  const before = await page.evaluate(() => {
    const g = window.__swarm.game;
    return { px: g.px, pz: g.pz, state: window.__swarm.state };
  });
  // Playfield center drag — activates virtual stick
  const x0 = Math.floor(VIEWPORT.width * 0.5);
  const y0 = Math.floor(VIEWPORT.height * 0.55);
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  await page.mouse.move(x0 + 120, y0 + 40, { steps: 12 });
  await new Promise((r) => setTimeout(r, 400));
  const mid = await page.evaluate(() => {
    const g = window.__swarm.game;
    const S = window.__swarm;
    return {
      px: g.px, pz: g.pz,
      stick: { active: S.stick.active, dx: S.stick.dx, dy: S.stick.dy },
    };
  });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 100));
  const after = await page.evaluate(() => {
    const g = window.__swarm.game;
    return { px: g.px, pz: g.pz, stickActive: window.__swarm.stick.active };
  });
  const dx = after.px - before.px;
  const dz = after.pz - before.pz;
  const dist = Math.hypot(dx, dz);
  return {
    before, mid, after,
    displacement: { dx, dz, dist },
    reactive: dist > 0.05 || (mid.stick && mid.stick.active && (Math.abs(mid.stick.dx) + Math.abs(mid.stick.dy)) > 0.1),
    qualitative: dist > 0.15
      ? 'Player position moved during pointer drag; stick responded in real time.'
      : (mid.stick && mid.stick.active
        ? 'Stick activated on drag; displacement small (possible crowd pin / short sample).'
        : 'Little or no observed movement — check input path.'),
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  const pageErrors = [];
  const consoleErrors = [];

  console.log('[perf] Chrome:', CHROME);
  console.log('[perf] URL:', GAME_URL);
  console.log('[perf] OUT:', OUT_DIR);
  console.log('[perf] viewport:', VIEWPORT);

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    // Allow WebGL / boot
    await page.waitForFunction(() => window.__swarm && (window.__swarm.state === 'menu' || window.__swarm.state === 'play'), {
      timeout: 60000,
      polling: 250,
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.bringToFront();

    const webgl = await probeWebGL(page);
    const rendererStr = webgl.gameRenderer || webgl.renderer || '';
    const vendorStr = webgl.gameVendor || webgl.vendor || '';
    console.log('[perf] WebGL vendor:', vendorStr);
    console.log('[perf] WebGL renderer:', rendererStr);

    const software = !webgl.ok || isSoftwareRenderer(rendererStr, vendorStr);
    const probePath = path.join(OUT_DIR, 'webgl-probe.json');
    fs.writeFileSync(probePath, JSON.stringify({ startedAt, webgl, software, chrome: CHROME, url: GAME_URL }, null, 2));

    if (software) {
      console.error('[perf] BLOCKED: software/unknown GPU renderer — refusing to emit hardware FPS numbers.');
      const blocked = {
        result: 'blocked',
        reason: 'software_or_unconfirmed_gpu',
        webgl,
        pageErrors,
        consoleErrors,
      };
      fs.writeFileSync(path.join(OUT_DIR, 'blocked.json'), JSON.stringify(blocked, null, 2));
      console.log(JSON.stringify(blocked, null, 2));
      await browser.close();
      process.exit(2);
    }

    if (PROBE_ONLY) {
      console.log('[perf] PROBE_ONLY complete — hardware GPU confirmed.');
      await browser.close();
      process.exit(0);
    }

    const setup = await setupStressScene(page);
    console.log('[perf] stress setup:', JSON.stringify(setup));

    if (setup.enemyCount < 180) {
      throw new Error(`Failed to reach ~200 enemies at setup (got ${setup.enemyCount})`);
    }

    // Screenshot of stress scene
    await new Promise((r) => setTimeout(r, 2000));
    const shotPath = path.join(OUT_DIR, 'stress-200-enemies.png');
    await page.screenshot({ path: shotPath, type: 'png' });
    console.log('[perf] screenshot:', shotPath);

    const inputObs = await pointerDragCheck(page);
    console.log('[perf] pointer:', inputObs.qualitative, 'dist=', inputObs.displacement.dist);

    const runs = [];
    for (let i = 1; i <= RUNS; i++) {
      console.log(`[perf] run ${i}/${RUNS}: warmup ${WARMUP_MS}ms + capture ${CAPTURE_MS}ms`);
      // Ensure still in play with density
      await page.evaluate((TARGET_ENEMIES, ENEMY_MIX) => {
        const g = window.__swarm.game;
        if (!g) return;
        window.__swarm.state = 'play';
        g.invuln = 1e9;
        g.alive = true;
        g.pausedForLevel = false;
        let guard = 0;
        while (g.enemies.length < TARGET_ENEMIES && guard++ < TARGET_ENEMIES) {
          g._spawn(ENEMY_MIX[g.enemies.length % ENEMY_MIX.length]);
          const e = g.enemies[g.enemies.length - 1];
          if (e) { e.hp = 1e9; e.maxHp = 1e9; }
        }
      }, TARGET_ENEMIES, ENEMY_MIX);

      const result = await measureRun(page, i);
      runs.push(result);
      const s = result.summary;
      console.log(
        `[perf] run ${i} avgFps=${s.avgFps.toFixed(2)} avgMs=${s.avgFrameMs.toFixed(2)} ` +
        `p95=${s.p95FrameMs.toFixed(2)} p99=${s.p99FrameMs.toFixed(2)} worst=${s.worstFrameMs.toFixed(2)} ` +
        `>33.3=${s.over33_3} >50=${s.over50} enemies=${result.raw.enemyCount} range=${result.raw.stats.enemyMin}-${result.raw.stats.enemyMax}`
      );

      // Raw CSV per run
      const csv = ['frame_index,frame_ms'].concat(result.raw.frames.map((ms, idx) => `${idx},${ms.toFixed(4)}`)).join('\n');
      fs.writeFileSync(path.join(OUT_DIR, `run-${i}-frames.csv`), csv);
      fs.writeFileSync(path.join(OUT_DIR, `run-${i}.json`), JSON.stringify({
        runIndex: i,
        summary: result.summary,
        enemyStats: result.raw.stats,
        enemyCountEnd: result.raw.enemyCount,
        ctrl: result.raw.ctrl,
        dpr: result.raw.dpr,
        inner: result.raw.inner,
      }, null, 2));
    }

    const report = {
      taskId: 'PERF-REBASELINE (v0.9.20)',
      result: RUNS >= 3 ? 'completed' : 'preliminary',
      startedAt,
      finishedAt: new Date().toISOString(),
      chromePath: CHROME,
      gameUrl: GAME_URL,
      viewport: VIEWPORT,
      webgl,
      harnessControls: setup.ctrl,
      setupEnemyCount: setup.enemyCount,
      warmupMs: WARMUP_MS,
      captureMs: CAPTURE_MS,
      runCount: RUNS,
      runs: runs.map((r) => ({
        runIndex: r.runIndex,
        summary: r.summary,
        enemyMin: r.raw.stats.enemyMin,
        enemyMax: r.raw.stats.enemyMax,
        enemyCountEnd: r.raw.enemyCount,
      })),
      inputObservation: inputObs,
      pageErrors,
      consoleErrors,
      screenshot: shotPath,
      reproduce: [
        `CHROME_PATH="${CHROME}" node tests/performance-200-enemies.mjs`,
        `GAME_URL=${GAME_URL}`,
        'Requires hardware GPU Chrome (not SwiftShader).',
        'Test-only injection: invuln + level-up suppress + HP inflate + maintain 200 enemies.',
      ],
    };

    fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(report, null, 2));
    console.log('[perf] SUMMARY written');
    console.log(JSON.stringify({
      result: report.result,
      renderer: rendererStr,
      runs: report.runs.map((r) => r.summary),
      enemyRanges: report.runs.map((r) => [r.enemyMin, r.enemyMax]),
      pageErrors,
      consoleErrors: consoleErrors.slice(0, 20),
      input: inputObs.qualitative,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[perf] FATAL', err);
  try {
    fs.writeFileSync(path.join(OUT_DIR, 'fatal.json'), JSON.stringify({
      error: String(err && err.stack || err),
      at: new Date().toISOString(),
    }, null, 2));
  } catch (_) {}
  process.exit(1);
});
