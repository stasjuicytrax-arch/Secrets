/**
 * Забирает вариативные woff2 из Google Fonts и складывает их в public/fonts/,
 * попутно генерируя src/styles/fonts.css с @font-face.
 *
 * Шрифты подключаются локально, а не через <link> на fonts.googleapis.com:
 * ТЗ §7 требует preload двух начертаний первого экрана и subset latin+cyrillic.
 *
 * Запуск: npm run fonts. Результат коммитится, чтобы сборка не зависела от сети.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/fonts');
const CSS_OUT = resolve(ROOT, 'src/styles/fonts.css');

// Chrome UA — иначе Google отдаёт ttf вместо woff2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** Оставляем только те subset'ы, которые реально нужны сайту. */
const KEEP_SUBSETS = new Set(['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext']);

const FAMILIES = [
  {
    // Display: TT Firs Neue / Druk Cyr — платные. Бесплатная замена из дизайн-системы §4.
    css: 'Unbounded:wght@400..800',
    family: 'Unbounded',
    slug: 'unbounded',
    weightRange: '400 800',
  },
  {
    css: 'Onest:wght@300..700',
    family: 'Onest',
    slug: 'onest',
    weightRange: '300 700',
  },
  {
    css: 'JetBrains+Mono:wght@400..600',
    family: 'JetBrains Mono',
    slug: 'jetbrains-mono',
    weightRange: '400 600',
  },
];

/** Вытаскивает пары {subset, url, unicodeRange} из ответа Google Fonts. */
function parseFaces(css) {
  const faces = [];
  let currentSubset = null;

  for (const line of css.split('\n')) {
    const comment = line.match(/^\s*\/\*\s*(\S+)\s*\*\/\s*$/);
    if (comment) {
      currentSubset = comment[1];
      continue;
    }
    const url = line.match(/src:\s*url\((https:\/\/[^)]+\.woff2)\)/);
    if (url) faces.push({ subset: currentSubset, url: url[1], unicodeRange: null });
    const range = line.match(/unicode-range:\s*([^;]+);/);
    if (range && faces.length) faces[faces.length - 1].unicodeRange = range[1].trim();
  }
  return faces;
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const blocks = [];

  for (const font of FAMILIES) {
    const api = `https://fonts.googleapis.com/css2?family=${font.css}&display=swap`;
    const res = await fetch(api, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`${font.family}: Google Fonts ответил ${res.status}`);

    const faces = parseFaces(await res.text()).filter((f) => KEEP_SUBSETS.has(f.subset));
    if (!faces.length) throw new Error(`${font.family}: не нашёл ни одного нужного subset`);

    for (const face of faces) {
      const file = `${font.slug}-${face.subset}.woff2`;
      const bin = await fetch(face.url, { headers: { 'User-Agent': UA } });
      if (!bin.ok) throw new Error(`${file}: скачивание вернуло ${bin.status}`);
      await writeFile(resolve(OUT_DIR, file), Buffer.from(await bin.arrayBuffer()));

      blocks.push(
        [
          '@font-face {',
          `  font-family: "${font.family}";`,
          '  font-style: normal;',
          `  font-weight: ${font.weightRange};`,
          '  font-display: swap;',
          `  src: url("/fonts/${file}") format("woff2");`,
          `  unicode-range: ${face.unicodeRange};`,
          '}',
        ].join('\n'),
      );
      console.log(`✓ ${file}`);
    }
  }

  const header = [
    '/* Сгенерировано scripts/fetch-fonts.mjs — не править руками.',
    '   Вариативные woff2, subset latin + cyrillic, font-display: swap.',
    '   Пути /fonts/* переписываются Vite под base из vite.config.ts. */',
    '',
  ].join('\n');

  await writeFile(CSS_OUT, `${header}${blocks.join('\n\n')}\n`, 'utf8');
  console.log(`\n→ ${blocks.length} @font-face → src/styles/fonts.css`);
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
