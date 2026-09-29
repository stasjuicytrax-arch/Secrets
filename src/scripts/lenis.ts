/**
 * Плавный скролл. Параметры из ТЗ §4: duration 1.1, easing expoOut,
 * инерция отключена на тач-устройствах.
 */
import Lenis from 'lenis';
import { prefersReducedMotion } from './motion';

let instance: Lenis | null = null;
let rafId = 0;

/** expoOut — тот же характер, что у --e-out в токенах. */
const expoOut = (t: number): number => (t === 1 ? 1 : 1 - 2 ** (-10 * t));

export const getLenis = (): Lenis | null => instance;

export const initLenis = (): Lenis | null => {
  if (instance || prefersReducedMotion()) return instance;

  instance = new Lenis({
    duration: 1.1,
    easing: expoOut,
    // На тач-устройствах нативный скролл ощущается лучше перехваченного,
    // и Lenis ломает pull-to-refresh. ТЗ §4.
    syncTouch: false,
    smoothWheel: true,
    touchMultiplier: 1,
  });

  const raf = (time: number) => {
    instance?.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);

  return instance;
};

export const destroyLenis = (): void => {
  if (!instance) return;
  cancelAnimationFrame(rafId);
  instance.destroy();
  instance = null;
};

/**
 * Якорные переходы внутри страницы. Учитывает высоту хедера через
 * --header-offset, чтобы заголовок секции не уезжал под шапку.
 */
export const scrollToTarget = (target: string | HTMLElement): void => {
  const node = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!node) return;

  const offset = -Number.parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-offset') || '0',
    10,
  );

  if (instance) {
    instance.scrollTo(node, { offset });
    return;
  }
  // Режим reduce: мгновенный переход, без анимации прокрутки.
  window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY + offset });
};
