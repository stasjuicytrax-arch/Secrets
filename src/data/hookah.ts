/**
 * Кальянная карта.
 *
 * Разметка секции в index.html написана статикой, а не рендером из этого файла:
 * страница без фреймворка, и генерация HTML из TS потребовала бы отдельного
 * build-шага ради четырёх карточек. Этот модуль — типизированный источник
 * истины для будущих потребителей (JSON-LD, страница /menu, повторное
 * использование цен) и справочник при правке markup вручную: значения
 * в index.html и здесь обязаны совпадать.
 *
 * Источник — сканы кальянного меню заказчика: `assets/menu-scans/scan-15.jpg`,
 * `scan-17..20.jpg`. Названия, описания вкусов и цены сняты с них дословно.
 * Описания на сканах длинные и рекламные; на сайт вынесен только состав вкуса,
 * то есть та часть, ради которой гость и читает карту. Ничего не дописано.
 *
 * ⚠ У заказчика есть только эти сканы, не данные. Если в карте больше миксов,
 * чем пять страниц скана, список нужно дополнить — см. ТЗ §10, пункт 2.
 */

export interface BlendStats {
  /** 1-5. */
  readonly taste: number;
  /** 1-5. */
  readonly strength: number;
  /** 1-5. */
  readonly smoke: number;
}

export interface Blend {
  readonly name: string;
  readonly notes: readonly string[];
  readonly price: number;
  /**
   * Шкалы «Вкус/Крепость/Дымность» под карточкой миксов (index.html,
   * .hookah__params + data-taste/data-strength/data-smoke на .blend).
   *
   * TODO: confirm values with client — подобраны редакционно по составу
   * чаши (фруктовые легче и мягче, «Флэш-рояль» с крепким мартини —
   * плотнее и крепче), у заказчика точных цифр нет. См.
   * docs/client-questions.md.
   */
  readonly stats: BlendStats;
}

export interface BaseBowl {
  readonly name: string;
  readonly price: number;
  /** true — цена «от», на сканe так и написано. */
  readonly from?: boolean;
}

export const BLENDS: readonly Blend[] = [
  {
    name: 'Тайны древней Греции',
    notes: ['сливочный сыр', 'креплёное вино', 'олива'],
    price: 4300,
    stats: { taste: 4, strength: 3, smoke: 3 },
  },
  {
    name: 'Хранитель леса',
    notes: ['ананас', 'смородина', 'тархун', 'имбирный лимонад'],
    price: 4300,
    stats: { taste: 5, strength: 2, smoke: 2 },
  },
  {
    name: 'Сады Японии',
    notes: ['сакура', 'егермейстер', 'пралине'],
    price: 3900,
    stats: { taste: 4, strength: 3, smoke: 4 },
  },
  {
    name: 'Флэш-рояль',
    notes: ['малиновый мартини'],
    price: 3900,
    stats: { taste: 3, strength: 5, smoke: 5 },
  },
];

export const BASE_BOWLS: readonly BaseBowl[] = [
  { name: 'Классическая чаша', price: 1800 },
  { name: 'На сигарном листе', price: 2200 },
  { name: 'Фруктовая чаша, грейпфрут или ананас', price: 2500, from: true },
];

/** Критерии подбора — из текста заказчика в 01-content/site-content.md. */
export const PICK_BY = ['вкусу', 'крепости', 'дымности'] as const;
