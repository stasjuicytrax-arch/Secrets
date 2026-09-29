/**
 * Плавный скролл. Параметры из ТЗ §4: duration 1.1, easing expoOut,
 * инерция отключена на тач-устройствах.
 */
import Lenis from 'lenis';
import { prefersReducedMotion } from './motion';

let instance: Lenis | null = null;
let rafId = 0;
let onGsapTicker = false;

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

  startOwnRaf();

  return instance;
};

/** Собственный цикл Lenis — работает, пока GSAP ещё не загружен. */
const startOwnRaf = (): void => {
  const raf = (time: number) => {
    instance?.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);
};

/**
 * Переключает Lenis на тикер GSAP, когда тот загрузится.
 *
 * До этого вызова Lenis и ScrollTrigger.update() жили каждый в своём
 * requestAnimationFrame. Два независимых цикла тикали в непредсказуемом
 * порядке относительно друг друга: Lenis мог вызвать 'scroll' (а с ним
 * ScrollTrigger.update()) в середине тика самого GSAP, пока тот ещё
 * дорисовывал текущий кадр твина. На простом scrub-параллаксе гонка не
 * была заметна, а вот gsap.from() со stagger и per-index функциями от неё
 * ломался: анимация стартовала и застывала на промежуточном кадре навсегда
 * (voспроизведено намеренно: scripts/, см. коммит с багфиксом).
 *
 * Официальная интеграция Lenis + GSAP — гнать Lenis из gsap.ticker вместо
 * собственного rAF, тогда апдейт скролла и рендер твинов идут в одном тике
 * в предсказуемом порядке. Вызывается один раз из gsap.ts, как только
 * gsap.ticker становится доступен.
 */
export const driveLenisFromGsapTicker = (gsap: typeof import('gsap').gsap): void => {
  if (!instance || onGsapTicker) return;
  onGsapTicker = true;

  cancelAnimationFrame(rafId);
  gsap.ticker.add((time: number) => instance?.raf(time * 1000));
  // Lenis сам сглаживает инерцию; двойное сглаживание от тикера даёт рывки
  // на длинных вкладках без фокуса.
  gsap.ticker.lagSmoothing(0);
};

export const destroyLenis = (): void => {
  if (!instance) return;
  cancelAnimationFrame(rafId);
  instance.destroy();
  instance = null;
  onGsapTicker = false;
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
