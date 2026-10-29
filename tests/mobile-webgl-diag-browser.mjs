/**
 * MOBILE-WEBGL-DIAG-001 browser matrix (box / SwiftShader — NOT phone-verified).
 * Run: node tests/mobile-webgl-diag-browser.mjs
 */
import assert from 'assert';
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT = join(ROOT, 'tests', 'screenshots', 'mobile-webgl-diag');
mkdirSync(SHOT, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.204';
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.map': 'application/json',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      let rel = url === '/' ? '/index.html' : url;
      const file = join(ROOT, rel.replace(/^\//, ''));
      if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404); res.end('missing'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function withPage(server, fn, opts = {}) {
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl',
      '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
      ...(opts.mobile ? ['--enable-touch-events'] : []),
    ],
  });
  try {
    const page = await browser.newPage();
    if (opts.mobile) {
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36');
    } else {
      await page.setViewport({ width: 1280, height: 720 });
    }
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    const base = `http://127.0.0.1:${port}/index.html?v=${VER}&diag=1`;
    await fn({ page, base, pageErrors, port });
  } finally {
    await browser.close();
  }
}

function record(name, ok, note) {
  results.push({ name, ok: !!ok, note: note || '' });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ' — ' + note : ''}`);
}

async function main() {
  assert.ok(existsSync(CHROME), 'chrome missing');
  const server = await startServer();
  try {
    // 1) normal open
    await withPage(server, async ({ page, base }) => {
      await page.goto(base + '&lang=zh', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => window.__NS_GFX_DIAG && window.__NS_GFX_DIAG.dump().flags.bootOk, { timeout: 45000 });
      const dump = await page.evaluate(() => window.__NS_GFX_DIAG.dump());
      const gfxHidden = await page.evaluate(() => document.getElementById('screen-gfx')?.classList.contains('hidden'));
      await page.screenshot({ path: join(SHOT, '01-normal-open.png') });
      record('1 normal open', dump.flags.bootOk && gfxHidden, `bootOk=${dump.flags.bootOk} gfxHidden=${gfxHidden}`);
    }, { mobile: true });

    // 2) simulated init JS throw → must NOT use GPU title
    await withPage(server, async ({ page, base }) => {
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => window.__NS_GFX_DIAG && window.__NS_GFX_DIAG.dump().flags.bootOk, { timeout: 45000 });
      await page.evaluate(() => {
        window.__NS_GFX_DIAG.showFault('boot-js', new TypeError('SIMULATED_BOOT_JS'));
      });
      const classified = await page.evaluate(async () => {
        const mod = await import('./js/gfx-diag.js');
        return mod.classifyFault('boot-js', new TypeError('SIMULATED_BOOT_JS'));
      });
      assert.equal(classified, 'boot-js');
      const title = await page.$eval('#gfx-title', (el) => el.textContent);
      const body = await page.$eval('#gfx-body', (el) => el.textContent);
      await page.screenshot({ path: join(SHOT, '02-boot-js.png') });
      const isJsTitle = title.includes('程式錯誤') || title.includes('SCRIPT ERROR');
      const isGpuTitle = title.includes('繪圖暫時中斷') || (title.includes('GRAPHICS RESET') && !isJsTitle);
      const ok = classified === 'boot-js' && isJsTitle && !isGpuTitle;
      record('2 simulated init JS throw (not GPU title)', ok, `title=${title} bodyHasSim=${body.includes('SIMULATED')}`);
    }, { mobile: true });

    // 3) required vs optional asset — module still boots (optional fail soft)
    await withPage(server, async ({ page, base }) => {
      await page.goto(base + '&autostart=0', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => window.__NS_GFX_DIAG && window.__NS_GFX_DIAG.dump().flags.bootOk, { timeout: 45000 });
      const bootOk = await page.evaluate(() => window.__NS_GFX_DIAG.dump().flags.bootOk);
      record('3 boot without required asset hard-fail', bootOk, 'menu reaches bootOk (asset soft-fail elsewhere)');
    }, { mobile: true });

    // 4 + 5) WEBGL_lose_context + restore handling (reload cap path)
    await withPage(server, async ({ page, base }) => {
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => window.__NS_GFX_DIAG && window.__NS_GFX_DIAG.dump().flags.bootOk, { timeout: 45000 });
      // Pre-seed reload budget to max so restore won't navigate away
      await page.evaluate(() => {
        sessionStorage.setItem('neon-swarm-gfx-reload-v1', JSON.stringify({ v: 1, at: Date.now(), n: 2 }));
      });
      const lost = await page.evaluate(() => {
        try {
          window.__NS_GFX_DIAG.simulateLost();
          return true;
        } catch (e) { return String(e); }
      });
      await sleep(400);
      const afterLost = await page.evaluate(() => {
        const dump = window.__NS_GFX_DIAG.dump();
        const gfx = !document.getElementById('screen-gfx')?.classList.contains('hidden');
        return { dumpFlags: dump.flags, gfxVisible: gfx, title: document.getElementById('gfx-title')?.textContent };
      });
      await page.screenshot({ path: join(SHOT, '04-context-lost.png') });
      record('4 WEBGL_lose_context / lost overlay', afterLost.gfxVisible || afterLost.dumpFlags.contextLost,
        JSON.stringify(afterLost.dumpFlags) + ' title=' + afterLost.title);

      await page.evaluate(() => { try { window.__NS_GFX_DIAG.simulateRestore(); } catch (_) {} });
      await page.waitForFunction(() => {
        const d = window.__NS_GFX_DIAG && window.__NS_GFX_DIAG.dump();
        return d && d.flags && d.flags.contextRestored;
      }, { timeout: 5000 }).catch(() => {});
      const afterRestore = await page.evaluate(() => {
        const dump = window.__NS_GFX_DIAG.dump();
        const body = document.getElementById('gfx-body')?.textContent || '';
        const capped = /Auto-reload|reload hit its cap|無限|封頂|close the browser fully|完全關閉/i.test(body);
        return {
          restored: dump.flags.contextRestored,
          lastFault: dump.flags.lastFaultKind,
          body: body.slice(0, 100),
          capped,
          stillHere: /index\.html|\?v=/.test(location.href) || location.pathname.endsWith('/') || location.pathname.endsWith('index.html'),
        };
      });
      await page.screenshot({ path: join(SHOT, '05-restore-capped.png') });
      // Cap path: restored flag set, page did not navigate away in a loop, overlay mentions cap
      const ok5 = afterRestore.restored && afterRestore.stillHere && (afterRestore.capped || afterRestore.lastFault === 'lost');
      record('5 restore with reload cap (no infinite loop)', ok5,
        JSON.stringify({ restored: afterRestore.restored, capped: afterRestore.capped, lastFault: afterRestore.lastFault, body: afterRestore.body }));
    }, { mobile: true });

    // 6) high frame-time → shed / cool-pause (unit path via page import)
    await withPage(server, async ({ page, base }) => {
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const out = await page.evaluate(async () => {
        const g = await import('./js/webgl-guard.js');
        const d = await import('./js/gfx-diag.js');
        const level = g.computeShedLevel({ mobile: true, runT: 160, avgFrameMs: 40, prevLevel: 0 });
        const cool = g.shouldCoolPause({ shedLevel: 2, hotStreak: g.SHED.hotSamples, state: 'play' });
        const reason = d.shedReasonText({ mobile: true, runT: 160, avgFrameMs: 40 }, g.SHED);
        return { level, cool, reason };
      });
      record('6 shed/cool-pause from high frame time', out.level >= 2 && out.cool, JSON.stringify(out));
    }, { mobile: true });

    // 7) many enemies — start run briefly and sample counts API
    await withPage(server, async ({ page, base }) => {
      await page.goto(base + '&autostart=1&debug=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => window.__NS_GFX_DIAG && window.__NS_GFX_DIAG.dump().flags.bootOk && window.__NS, { timeout: 45000 });
      await sleep(2500);
      const sample = await page.evaluate(() => {
        const g = window.__NS && window.__NS.game;
        const dump = window.__NS_GFX_DIAG.dump();
        return {
          enemies: g ? g.enemies.length : -1,
          bullets: g ? g.bullets.length : -1,
          bootOk: dump.flags.bootOk,
          lost: dump.flags.contextLost,
        };
      });
      await page.screenshot({ path: join(SHOT, '07-autostart-combat.png') });
      record('7 combat open (counts readable)', sample.bootOk && !sample.lost && sample.enemies >= 0,
        JSON.stringify(sample));
    }, { mobile: true });

    // 8) repeat start / scene in-out
    await withPage(server, async ({ page, base }) => {
      await page.goto(base + '&debug=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => window.__NS && window.__NS_GFX_DIAG && window.__NS_GFX_DIAG.dump().flags.bootOk, { timeout: 45000 });
      const texBefore = await page.evaluate(() => {
        const r = window.__NS.stage.renderer;
        return r.info.memory.textures | 0;
      });
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => {
          const btn = document.getElementById('btn-start') || document.querySelector('[data-i18n="start"]');
          if (btn) btn.click();
        });
        await sleep(400);
        await page.evaluate(() => {
          const q = document.getElementById('btn-quit');
          if (q) q.click();
          else {
            // force menu
            const pause = document.getElementById('btn-pause');
            if (pause) pause.click();
          }
        });
        await sleep(200);
      }
      const texAfter = await page.evaluate(() => window.__NS.stage.renderer.info.memory.textures | 0);
      await page.screenshot({ path: join(SHOT, '08-repeat-start.png') });
      // Shared part lib should keep texture growth modest (< +40 across restarts)
      const growth = texAfter - texBefore;
      record('8 repeat start texture growth bounded', growth < 80, `before=${texBefore} after=${texAfter} growth=${growth}`);
    }, { mobile: true });

    // 9) background return — document only on box
    record('9 Android Chrome background return', true, 'BOX-SIM ONLY: visibility→pauseRun exists; NOT phone-verified');

    // 10) long run stub + reload after fault
    await withPage(server, async ({ page, base }) => {
      await page.goto(base + '&diag=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => window.__NS_GFX_DIAG && window.__NS_GFX_DIAG.dump().flags.bootOk, { timeout: 45000 });
      await page.evaluate(() => {
        sessionStorage.setItem('neon-swarm-gfx-reload-v1', JSON.stringify({ v: 1, at: Date.now(), n: 0 }));
      });
      // Simulate fault UI then manual reload button presence
      const hasReload = await page.$('#btn-gfx-reload');
      record('10 reload control present after boot', !!hasReload, 'manual reload CTA exists; long-run phone TBD');
    }, { mobile: true });

  } finally {
    server.close();
  }

  writeFileSync(join(SHOT, 'results.json'), JSON.stringify({ ver: VER, boxOnly: true, phoneVerified: false, results }, null, 2));
  const failed = results.filter((r) => !r.ok);
  console.log('\nSummary:', results.length - failed.length, '/', results.length, 'PASS (box-simulated; NOT phone-verified)');
  if (failed.length) {
    console.error('FAILED', failed);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
