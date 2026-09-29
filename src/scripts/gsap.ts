/**
 * Отложенная загрузка GSAP. ТЗ §7: GSAP грузится после первой отрисовки,
 * чтобы не утяжелять первый экран.
 *
 * Все сцены обращаются сюда, а не импортируют gsap напрямую — иначе он
 * попадёт в основной бандл.
 */
import type { gsap as Gsap } from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import { getLenis, driveLenisFromGsapTicker } from './lenis';
import { prefersReducedMotion } from './motion';

export interface GsapBundle {
  gsap: typeof Gsap;
  ScrollTrigger: typeof ScrollTriggerType;
}

let pending: Promise<GsapBundle | null> | null = null;

const idle = (): Promise<void> =>
  new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => resolve(), { timeout: 600 });
    } else {
      setTimeout(resolve, 120);
    }
  });

/**
 * Возвращает gsap и ScrollTrigger, либо null при prefers-reduced-motion:
  * в этом режиме сцены не создаются вообще (ТЗ §4).
 */
export const loadGsap = (): Promise<GsapBundle | null> => {
  if (prefersReducedMotion()) return Promise.resolve(null);

  pending ??= (async () => {
    await idle();
    const [core, scrollTrigger] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    const { gsap } = core;
    const { ScrollTrigger } = scrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    // Lenis крутит настоящий window, поэтому scrollerProxy не нужен —
    // хватает того, чтобы ScrollTrigger пересчитывался на каждый кадр Lenis.
    getLenis()?.on('scroll', ScrollTrigger.update);

    // Критично для порядка кадров: Lenis до этого жил в собственном rAF,
    // отдельном от тикера GSAP. Два несинхронизированных цикла гонялись
    // друг за другом — ScrollTrigger.update() мог прийти в середине рендера
    // твина GSAP, и stagger-анимации с function-based значениями (сцена
    // «Кальян») застывали на промежуточном кадре навсегда. Подробности —
    // в комментарии над driveLenisFromGsapTicker в lenis.ts.
    driveLenisFromGsapTicker(gsap);

    return { gsap, ScrollTrigger };
  })();

  return pending;
};
