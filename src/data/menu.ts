/**
 * Категории кухни для светлой секции «Меню» на главной.
 *
 * Разметка в index.html написана статикой (см. комментарий в hookah.ts —
 * та же причина). Этот файл — типизированный источник истины и справочник
 * при правке markup вручную.
 *
 * Источник — печатное меню заказчика: `assets/menu-scans/scan-01..04.jpg`.
 * Карточка — это КАТЕГОРИЯ меню (не одно блюдо): название и минимальная
 * цена по категории сняты дословно со сканов. Фото подобраны по смыслу
 * категории из assets/venue/, а не как фото конкретной строчки прайса —
 * пары «фото ↔ категория» подтверждены визуально, но фото не обязано быть
 * именно тем блюдом, что дало минимальную цену.
 *
 * Полный прайс каждой категории на сайт не переносится (ТЗ §2 блок 04:
 * «категории, 4–6 карточек-блюд») — карточка обещает диапазон и вкус
 * категории, а не заменяет собой страницу /menu.
 */

export interface MenuCategory {
  readonly name: string;
  readonly fromPrice: number;
  readonly photo: string;
}

export const MENU_CATEGORIES: readonly MenuCategory[] = [
  { name: 'Стартеры', fromPrice: 550, photo: 'food/tartare-set' },
  { name: 'Горячее', fromPrice: 790, photo: 'food/roast-beef' },
  { name: 'Паста', fromPrice: 790, photo: 'food/pasta' },
  { name: 'Салаты', fromPrice: 690, photo: 'food/salad' },
  { name: 'Япония', fromPrice: 240, photo: 'food/poke-bowl' },
  { name: 'Стрит-фуд', fromPrice: 550, photo: 'food/burger' },
] as const;
