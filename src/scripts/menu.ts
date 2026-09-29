/**
 * Точка входа страницы /menu.
 * ТЗ §9 этап 5: категории слева (sticky), позиции справа, ленивые фото.
 */
import '../styles/main.css';
import { initLenis, scrollToTarget } from './lenis';
import { onMotionPreferenceChange, prefersReducedMotion } from './motion';
import { initHeader } from './header';

/** Подсвечивает в сайдбаре группу, которая сейчас в кадре — тот же приём,
 * что и активная ссылка в хедере (src/scripts/header.ts), но локально:
 * переиспекать общий модуль ради одной страницы не стоило. */
const initSidebarSpy = (): void => {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.menu-page__nav-link')];
  const map = new Map<Element, HTMLAnchorElement>();

  for (const link of links) {
    const target = document.querySelector(link.getAttribute('href') as string);
    if (target) map.set(target, link);
  }
  if (!map.size) return;

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
      for (const link of links) link.removeAttribute('aria-current');
      if (top) map.get(top)?.setAttribute('aria-current', 'true');
    },
    { rootMargin: '-20% 0px -70% 0px' },
  );

  for (const target of map.keys()) observer.observe(target);
};

const bootstrap = (): void => {
  document.documentElement.classList.toggle('is-reduced', prefersReducedMotion());
  onMotionPreferenceChange((reduced) => {
    document.documentElement.classList.toggle('is-reduced', reduced);
  });

  initHeader();
  initLenis();
  initSidebarSpy();

  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = link?.getAttribute('href');
    if (!link || !hash || hash === '#') return;
    const node = document.querySelector<HTMLElement>(hash);
    if (!node) return;
    event.preventDefault();
    scrollToTarget(node);
    history.replaceState(null, '', hash);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
