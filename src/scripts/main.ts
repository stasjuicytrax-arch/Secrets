/**
 * Точка входа главной страницы.
 * Этап 1: каркас и Lenis. Этап 2: прелоадер, хедер, футер (ТЗ §9).
 */
import '../styles/main.css';
import { initLenis, destroyLenis, scrollToTarget } from './lenis';
import { onMotionPreferenceChange, prefersReducedMotion } from './motion';
import { runPreloader } from './preloader';
import { initHeader } from './header';
import { initHero } from './anim/hero';
import { initReveal } from './anim/reveal';
import { initHookah } from './anim/hookah';

const bootstrap = (): void => {
  document.documentElement.classList.toggle('is-reduced', prefersReducedMotion());

  onMotionPreferenceChange((reduced) => {
    document.documentElement.classList.toggle('is-reduced', reduced);
    if (reduced) destroyLenis();
    else initLenis();
  });

  // Якоря внутри страницы едут через Lenis, иначе он не знает о смене позиции.
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = link?.getAttribute('href');
    if (!link || !hash || hash === '#') return;
    if (link.closest('[data-nav-panel]')) return; // панель обрабатывает клики сама

    const node = document.querySelector<HTMLElement>(hash);
    if (!node) return;

    event.preventDefault();
    scrollToTarget(node);
    history.replaceState(null, '', hash);
  });

  initHeader();

  // Скролл включается только после того, как шторка ушла:
  // иначе страница успевает уехать, пока её ещё не видно.
  runPreloader(() => {
    initLenis();
    void initHero();
    void initReveal();
    void initHookah();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
