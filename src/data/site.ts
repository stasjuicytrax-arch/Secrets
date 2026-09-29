/**
 * Постоянные данные заведения. Единственный источник для хедера, футера,
 * контактов и разметки Schema.org.
 *
 * Всё взято из 01-content/site-content.md. Ничего не выдумано:
 * поля, которых нет у заказчика (реквизиты юрлица, политика), здесь отсутствуют,
 * а не заполнены заглушками — см. открытые вопросы в ТЗ §10.
 */

export interface NavItem {
  readonly label: string;
  readonly href: string;
}

export interface Phone {
  readonly label: string;
  readonly href: string;
}

export const SITE = {
  name: 'Secrets Lounge',
  legalName: 'Secrets Lounge Bar',
  city: 'Санкт-Петербург',
  street: 'ул. Полтавская, 7',
  addressShort: 'Полтавская, 7',
  addressFull: 'Санкт-Петербург, ул. Полтавская, 7',
  email: 'tsinist@bk.ru',
  emailNote: 'Отдел маркетинга',
} as const;

/** Основной первым: он же стоит в кнопке хедера. */
export const PHONES: readonly Phone[] = [
  { label: '+7 (993) 641-29-86', href: 'tel:+79936412986' },
  { label: '+7 (812) 244-44-60', href: 'tel:+78122444460' },
];

/**
 * Режим работы. На старом сайте он записан двумя разными способами
 * («вс–чт» в одном блоке, «пн-чт, вс» в другом) — ТЗ §6 требует единого вида.
 * Оставлен вариант с явным перечислением дней: он однозначнее.
 */
export const HOURS = [
  { days: 'пн–чт, вс', time: '13:00 – 00:00' },
  { days: 'пт, сб', time: '13:00 – 06:00' },
] as const;

/** Короткая формулировка для первого экрана. */
export const HOURS_SHORT = 'до 06:00 по пятницам и субботам';

/**
 * Навигация. Состав сохраняет IA старого сайта, но без пункта «забронировать»:
 * он дублировал кнопку CTA. Якоря новые, редиректы со старых Tilda-анкоров — этап 12.
 */
export const NAV: readonly NavItem[] = [
  { label: 'О нас', href: '#about' },
  { label: 'Меню', href: '#menu' },
  { label: 'Акции', href: '#promos' },
  { label: 'Контакты', href: '#contacts' },
];

export const SOCIALS = [
  { label: 'VKontakte', short: 'VK', href: 'https://vk.com/secrets.tsinist', icon: 'vk' },
  { label: 'Telegram', short: 'TG', href: 'https://t.me/chanelsecrets', icon: 'telegram' },
] as const;

export const LOYALTY_URL = 'https://tsinist.wallet.open-s.info/';

export const BOOKING_HREF = '#book';
export const MENU_PAGE_HREF = 'menu.html';
