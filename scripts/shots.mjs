/**
 * Снимает страницу в системном Chrome на ширинах из ТЗ §7.
 * Инструмент разработки: в сайт не попадает, на CI не запускается.
 *
 * Использование:
 *   node scripts/shots.mjs                       — index, все ширины
 *   node scripts/shots.mjs menu 375 1280         — своя страница и ширины
 *   node scripts/shots.mjs index 1280 --reduced  — с prefers-reduced-motion
 *   node scripts/shots.mjs index 1280 --at 1800  — прокрутить до 1800px
 */
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.SHOT_DIR ?? resolve(ROOT, '.shots');
const ORIGIN = process.env.SHOT_ORIGIN ?? 'http://localhost:5173/Secrets';

const DEFAULT_WIDTHS = [375, 768, 1280, 1920];

/** Реальные высоты устройств: герой — 100svh, на выдуманной высоте он врёт. */
const HEIGHTS = { 375: 667, 390: 844, 768: 1024, 1024: 768, 1280: 800, 1440: 900, 1920: 1080 };

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const at = argv.includes('--at') ? Number(argv[argv.indexOf('--at') + 1]) : 0;
const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--at');

const page = positional.find((a) => Number.isNaN(Number(a))) ?? 'index';
const widths = positional.filter((a) => !Number.isNaN(Number(a))).map(Number);
const targets = widths.length ? widths : DEFAULT_WIDTHS;

const full = flags.has('--full');
const reduced = flags.has('--reduced');

const run = async () => {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    deviceScaleFactor: 1,
  });

  for (const width of targets) {
    const tab = await context.newPage();
    await tab.setViewportSize({ width, height: HEIGHTS[width] ?? Math.round(width * 0.62) });
    await tab.goto(`${ORIGIN}/${page}.html`, { waitUntil: 'networkidle' });
    // Прелоадер уходит по window.load или таймауту — даём ему закончить.
    await tab.waitForTimeout(reduced ? 300 : 1900);
    if (at) {
      await tab.evaluate((y) => window.scrollTo(0, y), at);
      await tab.waitForTimeout(1200);
    }

    const suffix = [page, width, reduced && 'reduced', at && `at${at}`, full && 'full']
      .filter(Boolean)
      .join('-');
    const file = resolve(OUT, `${suffix}.png`);
    await tab.screenshot({ path: file, fullPage: full });
    console.log(`✓ ${file}`);

    const errors = await tab.evaluate(() => (window.__shotErrors ?? []).join('\n'));
    if (errors) console.log(`  консоль: ${errors}`);
    await tab.close();
  }

  await browser.close();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
