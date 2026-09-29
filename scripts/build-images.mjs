/**
 * Пережимает исходники из assets/ в public/img/ — AVIF + WebP в нескольких размерах.
 * Исходники не трогаются (BUILD-PROMPT §4).
 *
 * Запуск: npm run images. Результат коммитится, чтобы сборка не зависела от sharp.
 */
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/img');

/** Ширины по назначению кадра. Больше исходника не апскейлим. */
const WIDTHS = {
  hero: [768, 1280, 1600, 1920, 2560],
  wide: [640, 1024, 1600],
  card: [420, 720, 1080],
  thumb: [280, 560],
};

/**
 * Карта кадров. Пересобрана вручную после разбора assets/venue/:
 * скачанная ранее папка (теперь assets/menu-scans/) содержит не интерьер, а сканы меню.
 * Роли проставлены по содержимому кадра, а не по имени файла.
 */
const SOURCES = [
  // Интерьер зала
  // Герой — единственный ландшафтный кадр бара в полном разрешении.
  { src: 'assets/venue/27-DSC01833.jpg', out: 'venue/bar-counter', preset: 'hero' },
  { src: 'assets/venue/25-DSC01834.jpg', out: 'venue/bar-portrait', preset: 'card' },
  { src: 'assets/venue/22-DSC01744.jpg', out: 'venue/hall-neon', preset: 'wide' },
  { src: 'assets/venue/24-DSC01770.jpg', out: 'venue/hall-tables', preset: 'wide' },
  { src: 'assets/venue/21-DSC01729.jpg', out: 'venue/velvet-sofas', preset: 'wide' },
  { src: 'assets/venue/23-DSC01750.jpg', out: 'venue/wreath-glow', preset: 'wide' },
  { src: 'assets/venue/26-DSC02022.jpg', out: 'venue/graffiti-wall', preset: 'wide' },
  { src: 'assets/venue/05-DSC01935.jpg', out: 'venue/terrazzo-nook', preset: 'wide' },
  { src: 'assets/venue/02-DSC01743.jpg', out: 'venue/hall-dark', preset: 'wide' },
  { src: 'assets/venue/03-DSC01744.jpg', out: 'venue/hall-portrait', preset: 'card' },

  // Кухня
  { src: 'assets/venue/06-DSC02642.jpg', out: 'food/sushi-platter', preset: 'card' },
  { src: 'assets/venue/09-DSC02685.jpg', out: 'food/tartare-set', preset: 'card' },
  { src: 'assets/venue/13-____2.jpg', out: 'food/roast-beef', preset: 'card' },
  { src: 'assets/venue/10-___.jpg', out: 'food/burger', preset: 'card' },
  { src: 'assets/venue/11-__1.jpg', out: 'food/poke-bowl', preset: 'card' },
  { src: 'assets/venue/08-_____2.jpg', out: 'food/pasta', preset: 'card' },
  { src: 'assets/venue/12-__2.jpg', out: 'food/salad', preset: 'card' },

  // Бар
  { src: 'assets/venue/20-DSC05123.jpg', out: 'bar/citrus-highball', preset: 'card' },

  // Кальян и гости
  { src: 'assets/venue/15-DSC02430_1.jpg', out: 'hookah/guests-smoke', preset: 'card' },
  { src: 'assets/venue/16-DSC02369.jpg', out: 'hookah/guest-table', preset: 'card' },

  // Бренд. Исходный PNG — 1000×1000 с широкими прозрачными полями,
  // в хедере такой не отмасштабировать: trim обрезает его по границам вордмарка.
  { src: 'assets/brand/logo.png', out: 'brand/logo', preset: 'thumb', keepAlpha: true, trim: true },
  { src: 'assets/brand/og.jpg', out: 'brand/og', preset: 'wide' },
];

const manifest = {};

/** Обрезает прозрачные поля и возвращает буфер + его метаданные. */
async function source(entry) {
  const abs = resolve(ROOT, entry.src);
  if (!entry.trim) return { data: abs, meta: await sharp(abs, { failOn: 'none' }).metadata() };

  const data = await sharp(abs, { failOn: 'none' }).trim({ threshold: 1 }).toBuffer();
  return { data, meta: await sharp(data).metadata() };
}

async function emit(entry) {
  const { data, meta } = await source(entry);
  const widths = WIDTHS[entry.preset].filter((w) => w <= meta.width);
  if (!widths.length) widths.push(meta.width);

  await mkdir(resolve(OUT, dirname(entry.out)), { recursive: true });

  const sizes = [];
  for (const w of widths) {
    const base = `${entry.out}-${w}`;
    const pipeline = sharp(data, { failOn: 'none' }).resize({ width: w, withoutEnlargement: true });

    await pipeline
      .clone()
      .avif({ quality: entry.keepAlpha ? 60 : 52, effort: 6 })
      .toFile(resolve(OUT, `${base}.avif`));
    await pipeline
      .clone()
      .webp({ quality: entry.keepAlpha ? 88 : 76, effort: 5 })
      .toFile(resolve(OUT, `${base}.webp`));

    sizes.push(w);
  }

  manifest[entry.out] = {
    widths: sizes,
    ratio: Number((meta.width / meta.height).toFixed(4)),
    width: meta.width,
    height: meta.height,
  };
  console.log(`✓ ${entry.out}  ${sizes.join('/')}  (${meta.width}×${meta.height})`);
}

async function run() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  for (const entry of SOURCES) await emit(entry);

  // icon.svg отдаётся как есть — вектор пережимать нечем.
  await mkdir(resolve(OUT, 'brand'), { recursive: true });
  await writeFile(
    resolve(OUT, 'brand/icon.svg'),
    await readFile(resolve(ROOT, 'assets/brand/icon.svg')),
  );

  await writeFile(
    resolve(ROOT, 'src/data/images.generated.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  console.log(`\n→ ${Object.keys(manifest).length} кадров → public/img/`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
