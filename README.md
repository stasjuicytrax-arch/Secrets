# Secrets Lounge

Новый сайт взамен secretslounge.ru (Tilda). Vite + TypeScript, нативный CSS,
GSAP + ScrollTrigger + SplitText, Lenis. Публикуется на GitHub Pages.

```
Secrets/
├─ index.html · menu.html         ← страницы
├─ src/
│  ├─ styles/                     ← tokens, reset, base, layout, components/
│  ├─ scripts/                    ← main, lenis, header, preloader, anim/
│  └─ data/                       ← типизированный контент
├─ public/
│  ├─ fonts/                      ← self-hosted woff2, latin + cyrillic
│  └─ img/                        ← AVIF + WebP, собирается npm run images
├─ scripts/
│  ├─ fetch-fonts.mjs             ← шрифты из Google Fonts в public/fonts
│  ├─ build-images.mjs            ← assets/ → public/img
│  ├─ shots.mjs                   ← скриншоты 375/768/1280/1920
│  └─ contrast.mjs                ← контраст текста под глифами
├─ assets/                        ← исходники, в сайт напрямую не подключаются
│  ├─ venue/                      ← настоящие фото зала, кухни, бара, кальянов
│  ├─ menu-scans/                 ← сканы меню (НЕ фото зала)
│  ├─ brand/ · menu-pdf/ · html/
│  └─ MANIFEST.csv · venue/SOURCES.csv
├─ Referens/                      ← референсы 13.jpg, 8.jpg
├─ 01-content/ · 02-design/ · 03-tz/
└─ PRODUCT.md                     ← продуктовый контекст для impeccable
```

## Команды

```
npm run dev       — дев-сервер
npm run build     — типы + прод-сборка
npm run images    — пережать assets/ в public/img
npm run fonts     — перекачать шрифты
```

## Порядок работ

1. Прочитать `03-tz/TZ-secrets-website.md` целиком.
2. Скопировать `02-design/tokens.css` в `src/styles/` нового проекта.
3. Установить скиллы:
   ```
   npx impeccable install
   npx skills add Leonxlnx/taste-skill
   ```
4. Включить хуки `impeccable`, чтобы slop-детектор работал автоматически.
5. Идти по этапам из §9 ТЗ, после каждого блока — `/impeccable audit`.

## Что нужно от клиента до старта

Список в конце ТЗ (§10) и в конце `01-content/site-content.md`. Критичное: исходники фото, лого в векторе, данные меню, куда отправлять заявки с формы.

Карточки коктейлей без реального фото напитка временно показывают одну и ту же заглушку (`public/img/bar/cocktails/_placeholder.webp`) — список нужных от клиента файлов в `docs/photo-requests.md`.
