/**
 * Хедер: сжатие в капсулу на скролле вниз, разворот на скролле вверх,
 * линия прогресса чтения, мобильная панель навигации. ТЗ §2 блок 01 и §4.
 */
import { loadGsap } from './gsap';
import { getLenis, scrollToTarget } from './lenis';

const PILL_FROM = 80;

/** Капсула и прогресс чтения. Без scroll-листенера — только ScrollTrigger (ТЗ §4). */
const initScrollState = async (header: HTMLElement): Promise<void> => {
  const bundle = await loadGsap();

  if (!bundle) {
    // prefers-reduced-motion: без ScrollTrigger некому отслеживать
    // позицию, а 'top' (прозрачно) навсегда означало нечитаемый хедер
    // на любой светлой секции ниже героя. 'expanded' — тот же тёмный
    // блюр-фон, что у капсулы, но в полную ширину: статично, без анимации
    // морфинга (которой здесь и не должно быть), и всегда читаемо.
    header.dataset.state = 'expanded';
    return;
  }

  bundle.ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      header.style.setProperty('--read-progress', self.progress.toFixed(4));

      // Три состояния, две независимые оси: компакт/полная ширина (по
      // направлению скролла, ТЗ §4) и прозрачный/с фоном (по позиции —
      // прозрачно только у самой вершины, над героем). 'top' — только
      // там; глубже в странице шапка всегда с тёмным блюром, иначе
      // светлая секция под ней просвечивает и текст нечитаем.
      const y = self.scroll();
      if (y <= PILL_FROM) header.dataset.state = 'top';
      else header.dataset.state = self.direction === 1 ? 'pill' : 'expanded';
    },
  });
};

/** Мобильная панель: блокировка скролла, Esc, возврат фокуса на бургер. */
const initNavPanel = (header: HTMLElement, burger: HTMLButtonElement, panel: HTMLElement): void => {
  const setOpen = (open: boolean): void => {
    panel.dataset.open = String(open);
    header.dataset.above = String(open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';

    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
  };

  burger.addEventListener('click', () => {
    const open = panel.dataset.open !== 'true';
    setOpen(open);
    if (open) panel.querySelector<HTMLAnchorElement>('a')?.focus();
  });

  panel.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href]');
    if (!link) return;

    const hash = link.getAttribute('href');
    setOpen(false);
    burger.focus();

    // Панель закрывается раньше, чем начинается прокрутка,
    // иначе Lenis стартует, пока скролл ещё заблокирован.
    if (hash?.startsWith('#') && hash.length > 1) {
      event.preventDefault();
      requestAnimationFrame(() => scrollToTarget(hash));
      history.replaceState(null, '', hash);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || panel.dataset.open !== 'true') return;
    setOpen(false);
    burger.focus();
  });
};

/** Подсветка активного пункта по секции в кадре. */
const initCurrentLink = (header: HTMLElement): void => {
  const links = [...header.querySelectorAll<HTMLAnchorElement>('.hdr__link[href^="#"]')];
  const map = new Map<Element, HTMLAnchorElement>();

  for (const link of links) {
    const section = document.querySelector(link.getAttribute('href') as string);
    if (section) map.set(section, link);
  }
  if (!map.size) return;

  // Несколько секций могут пересекать полосу одновременно. Берём верхнюю,
  // иначе активным становится та, чей колбэк пришёл последним.
  const visible = new Set<Element>();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }

      const top = [...visible].sort(
        (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
      )[0];

      for (const other of links) other.removeAttribute('aria-current');
      if (top) map.get(top)?.setAttribute('aria-current', 'true');
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );

  for (const section of map.keys()) observer.observe(section);
};

export const initHeader = (): void => {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  header.dataset.state = 'top';
  void initScrollState(header);
  initCurrentLink(header);

  const burger = header.querySelector<HTMLButtonElement>('[data-burger]');
  const panel = document.querySelector<HTMLElement>('[data-nav-panel]');
  if (burger && panel) initNavPanel(header, burger, panel);
};
