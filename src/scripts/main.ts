/**
 * Точка входа главной страницы.
 * Этап 1 (ТЗ §9): каркас, токены, шрифты, сетка, Lenis.
 */
import '../styles/main.css';
import { initLenis, destroyLenis, scrollToTarget } from './lenis';
import { onMotionPreferenceChange, prefersReducedMotion } from './motion';

const bootstrap = (): void => {
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.toggle('is-reduced', prefersReducedMotion());

  initLenis();

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
