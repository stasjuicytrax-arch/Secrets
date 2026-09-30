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
 * Фото, пересмотрено 30.09.2026: реальных снимков конкретных коктейлей
 * у заказчика два — assets/venue/18-DSC08807.jpg (шейкер льёт коктейль
 * в дымящийся бокал, kind:'photo' «Бар Secrets») и assets/venue/20-DSC05123.jpg
 * (бокал с цитрусовым хайболом, «Цитрусовый хайбол») — оба честные, ничего
 * конкретного не утверждают сверх того, что на них видно.
 *
 * Остальные девять карточек раньше были текстовой картой-«бархат» без
 * фото; теперь у них тоже есть фото — но это НЕ фото самих напитков
 * (выдавать снимок стойки за «Дайкири» было бы неточностью), а атмосферные
 * кадры зала/бара из public/img/venue (стойка, тёплый свет, кресла).
 * Placeholder на время, до реальной фотосъёмки каждого напитка — помечен
 * в разметке комментарием TODO и в docs/photo-requests.md.
 *
 * В доступном пуле только 3 самостоятельных сюжета (стойка бара, кресла
 * у ТВ, декор-венок с зеркалом — у последнего 3 разных кропа с одной и той
 * же вещи). Чтобы у соседних карточек в ленте не повторялся сюжет, они
 * идут по кругу A/B/C — некоторые файлы встречаются по 2-3 раза, но
 * никогда подряд и каждый раз с новым object-position (см. bar.css).
 */

export type CocktailCard =
  | { readonly kind: 'photo'; readonly photo: string; readonly caption: string }
  | {
      readonly kind: 'drink';
      readonly name: string;
      readonly notes: readonly string[];
      readonly price: number;
      /** Атмосферный плейсхолдер (не фото напитка) — см. шапку файла. */
      readonly placeholderPhoto: string;
    };

export const COCKTAIL_CARDS: readonly CocktailCard[] = [
  { kind: 'photo', photo: 'bar/pour-hero', caption: 'Бар Secrets' },
  {
    kind: 'drink',
    name: 'Дайкири',
    notes: ['белый ром', 'сок лимона', 'сахарный сироп'],
    price: 750,
    placeholderPhoto: 'venue/bar-portrait',
  },
  {
    kind: 'drink',
    name: 'Негрони',
    notes: ['джин', 'красный вермут', 'биттер'],
    price: 850,
    placeholderPhoto: 'venue/hall-tables',
  },
  {
    kind: 'drink',
    name: 'Апероль Спритц',
    notes: ['апероль', 'игристое вино', 'содовая'],
    price: 800,
    placeholderPhoto: 'venue/hall-neon',
  },
  { kind: 'photo', photo: 'bar/citrus-highball', caption: 'Цитрусовый хайбол' },
  {
    kind: 'drink',
    name: 'Секрет',
    notes: ['белый ром', 'Мартини Фиеро', 'сок лимона', 'кордиал роза-грейпфрут'],
    price: 800,
    placeholderPhoto: 'venue/bar-counter',
  },
  {
    kind: 'drink',
    name: 'Обнажённый',
    notes: ['белый ром', 'пюре маракуйя и манго', 'сироп корица', 'игристое вино'],
    price: 800,
    placeholderPhoto: 'venue/hall-tables',
  },
  {
    kind: 'drink',
    name: 'Осака',
    notes: ['амаретто', 'персиковый ликёр', 'сахарный сироп', 'сок лимона'],
    price: 700,
    placeholderPhoto: 'venue/hall-portrait',
  },
  {
    kind: 'drink',
    name: 'Лимончелло Спритц',
    notes: ['лимончелло', 'игристое вино', 'сок лимона', 'содовая'],
    price: 750,
    placeholderPhoto: 'venue/bar-portrait',
  },
  {
    kind: 'drink',
    name: 'Электро',
    notes: ['апероль', 'белый вермут', 'сироп жасмин', 'ананасовый сок'],
    price: 800,
    placeholderPhoto: 'venue/hall-tables',
  },
  {
    kind: 'drink',
    name: 'Мозаика',
    notes: ['джин', 'красный вермут', 'сироп чёрная смородина', 'сироп бабл-гам'],
    price: 800,
    placeholderPhoto: 'venue/wreath-glow',
  },
] as const;
