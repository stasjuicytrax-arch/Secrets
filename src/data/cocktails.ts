/**
 * Карточки коктейлей в секции «Бар». Разметка в index.html написана
 * статикой (та же причина, что в hookah.ts, menu.ts, menu-pages.ts) —
 * этот файл источник истины и справочник при правке вручную.
 *
 * Источник — барная карта заказчика: assets/menu-scans/scan-05.jpg
 * (Классика) и scan-06.jpg (Новый сезон 25/26, Хиты). Названия, состав
 * и цены сняты дословно — рецепты на сканах полные, на карточки вынесен
 * только их костяк, как и в hookah.ts.
 *
 * Фото, пересмотрено 01.10.2026, второй проход: реальный снимок конкретного
 * коктейля у заказчика РОВНО один — assets/venue/18-DSC08807.jpg (шейкер
 * льёт коктейль в дымящийся бокал, kind:'photo' «Бар Secrets»).
 *
 * assets/venue/20-DSC05123.jpg раньше числился как второй («Цитрусовый
 * хайбол») — ошибка: это кальян (керамическая чаша на стеклянной колбе
 * с цитрусами и льдом внутри), не бокал с напитком. Карточка была нечестной
 * и удалена; кадр переименован в hookah/citrus-base (build-images.mjs).
 *
 * Девять карточек без реального фото напитка получают ОДНУ и ту же
 * нейтральную заглушку — кроп того же кадра pour-hero под 4:3
 * (public/img/bar/cocktails/_placeholder.webp) — вместо прежних атмосферных
 * кадров интерьера: клиент прямо попросил, чтобы на месте заглушки всегда
 * был коктейль, а не стойка или кресла. `photo` ниже — slug для
 * public/img/bar/cocktails/<slug>.webp; сейчас под каждым slug'ом лежит
 * копия того же _placeholder.webp (см. index.html: <img onerror=...>
 * подставляет _placeholder.webp, если файл конкретного коктейля пропадёт).
 * Список файлов на запрос заказчику — docs/photo-requests.md.
 */

export type CocktailCard =
  | { readonly kind: 'photo'; readonly photo: string; readonly caption: string }
  | {
      readonly kind: 'drink';
      readonly name: string;
      readonly notes: readonly string[];
      readonly price: number;
      /** slug для public/img/bar/cocktails/<slug>.webp — см. шапку файла. */
      readonly photo: string;
    };

export const COCKTAIL_CARDS: readonly CocktailCard[] = [
  { kind: 'photo', photo: 'bar/pour-hero', caption: 'Бар Secrets' },
  {
    kind: 'drink',
    name: 'Дайкири',
    notes: ['белый ром', 'сок лимона', 'сахарный сироп'],
    price: 750,
    photo: 'bar/cocktails/daiquiri',
  },
  {
    kind: 'drink',
    name: 'Негрони',
    notes: ['джин', 'красный вермут', 'биттер'],
    price: 850,
    photo: 'bar/cocktails/negroni',
  },
  {
    kind: 'drink',
    name: 'Апероль Спритц',
    notes: ['апероль', 'игристое вино', 'содовая'],
    price: 800,
    photo: 'bar/cocktails/aperol-spritz',
  },
  {
    kind: 'drink',
    name: 'Секрет',
    notes: ['белый ром', 'Мартини Фиеро', 'сок лимона', 'кордиал роза-грейпфрут'],
    price: 800,
    photo: 'bar/cocktails/secret',
  },
  {
    kind: 'drink',
    name: 'Обнажённый',
    notes: ['белый ром', 'пюре маракуйя и манго', 'сироп корица', 'игристое вино'],
    price: 800,
    photo: 'bar/cocktails/obnazhennyy',
  },
  {
    kind: 'drink',
    name: 'Осака',
    notes: ['амаретто', 'персиковый ликёр', 'сахарный сироп', 'сок лимона'],
    price: 700,
    photo: 'bar/cocktails/osaka',
  },
  {
    kind: 'drink',
    name: 'Лимончелло Спритц',
    notes: ['лимончелло', 'игристое вино', 'сок лимона', 'содовая'],
    price: 750,
    photo: 'bar/cocktails/limoncello-spritz',
  },
  {
    kind: 'drink',
    name: 'Электро',
    notes: ['апероль', 'белый вермут', 'сироп жасмин', 'ананасовый сок'],
    price: 800,
    photo: 'bar/cocktails/electro',
  },
  {
    kind: 'drink',
    name: 'Мозаика',
    notes: ['джин', 'красный вермут', 'сироп чёрная смородина', 'сироп бабл-гам'],
    price: 800,
    photo: 'bar/cocktails/mosaic',
  },
] as const;
