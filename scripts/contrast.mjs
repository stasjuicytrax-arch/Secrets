/**
 * Меряет реальный контраст текста поверх фотографии.
 *
 * Метод: два снимка одной страницы — с текстом и без. Разница даёт маску
 * пикселей, где действительно стоят глифы. Фон берётся только под ними,
 * поэтому яркое пятно рядом со строкой не портит результат, а яркое
 * пятно под буквой — портит.
 *
 * Использование: node scripts/contrast.mjs index "<css-селектор>" [ширины...]
 */
import sharp from 'sharp';
import { chromium } from 'playwright-core';

const ORIGIN = process.env.SHOT_ORIGIN ?? 'http://localhost:5173/Secrets';
const [page = 'index', selector = '.hero__title', ...rest] = process.argv.slice(2);
const SIZES = { 375: 667, 768: 1024, 1280: 800, 1440: 900, 1920: 1080 };
const widths = rest.length ? rest.map(Number) : [375, 768, 1280, 1920];

const lin = (v) => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const raw = (buf, box) =>
  sharp(buf)
    .extract(box)
    .raw()
    .toBuffer({ resolveWithObject: true });

const run = async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const tab = await context.newPage();

  for (const width of widths) {
    const height = SIZES[width] ?? 800;
    await tab.setViewportSize({ width, height });
    await tab.goto(`${ORIGIN}/${page}.html`, { waitUntil: 'networkidle' });
    await tab.waitForTimeout(2400);

    const box = await tab.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: Math.max(0, Math.floor(r.x)),
        top: Math.max(0, Math.floor(r.y)),
        width: Math.ceil(r.width),
        height: Math.ceil(r.height),
      };
    }, selector);

    if (!box) {
      console.log(`${width}: селектор ${selector} не найден`);
      continue;
    }
    box.width = Math.min(box.width, width - box.left);
    box.height = Math.min(box.height, height - box.top);

    const withText = await tab.screenshot();
    const colours = await tab.evaluate((sel) => {
      const el = document.querySelector(sel);
      const found = new Map();
      const walk = (node) => {
        for (const child of node.childNodes) {
          if (child.nodeType === 3 && child.textContent.trim()) {
            const c = getComputedStyle(child.parentElement).color;
            found.set(c, (found.get(c) ?? 0) + child.textContent.trim().length);
          } else if (child.nodeType === 1) walk(child);
        }
      };
      walk(el);
      el.style.visibility = 'hidden';
      return [...found.entries()];
    }, selector);
    await tab.waitForTimeout(200);
    const withoutText = await tab.screenshot();

    const a = await raw(withText, box);
    const b = await raw(withoutText, box);
    const ch = a.info.channels;

    // Пиксель считаем глифом, если он заметно изменился между снимками,
    // и относим его к тому цвету текста, к которому он ближе всего.
    // Иначе белая буква справа портит оценку оранжевого слова слева.
    const rgb = colours.map(([css]) => css.match(/\d+/g).map(Number));
    const buckets = colours.map(() => []);

    for (let i = 0; i < a.data.length; i += ch) {
      const [r, g, bl] = [a.data[i], a.data[i + 1], a.data[i + 2]];
      const d = Math.abs(r - b.data[i]) + Math.abs(g - b.data[i + 1]) + Math.abs(bl - b.data[i + 2]);
      if (d <= 60) continue;

      let best = 0;
      let bestDist = Infinity;
      rgb.forEach(([cr, cg, cb], k) => {
        const dist = (r - cr) ** 2 + (g - cg) ** 2 + (bl - cb) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = k;
        }
      });
      buckets[best].push(lum(b.data[i], b.data[i + 1], b.data[i + 2]));
    }

    const parts = colours.map(([css, n], k) => {
      const list = buckets[k];
      if (!list.length) return `${css.replace(/\s/g, '')}: глифов нет`;
      list.sort((x, y) => y - x);
      // Верхний процент отбрасываем: это края букв, где идёт сглаживание.
      const worst = list[Math.floor(list.length * 0.01)];
      const [r, g, bl] = rgb[k];
      return `${css.replace(/\s/g, '')} (${n} зн.): ${ratio(lum(r, g, bl), worst).toFixed(2)}:1`;
    });

    console.log(`${String(width).padStart(4)}px  ${parts.join('  |  ')}`);
  }

  await browser.close();
};

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
