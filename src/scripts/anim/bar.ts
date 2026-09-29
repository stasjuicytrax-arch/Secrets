/**
 * Сцена секции «Бар». ТЗ §4: pinned-секция — вертикальный скролл
 * прокручивает карточки коктейлей горизонтально. Самая тяжёлая сцена
 * по ТЗ §9 (этап 6).
 *
 * ТЗ §7: «тач-версия... pinned-секции заменяются вертикальным листанием».
 * Здесь это не запасной путь на случай сбоя GSAP, а осознанный дефолт:
 * .bar__track в разметке уже overflow-x:auto со scroll-snap — секция
 * работает и без единой строчки JS. Этот модуль ТОЛЬКО ДОБАВЛЯЕТ pin
 * поверх рабочего дефолта, и только когда есть точный курсор (мышь,
 * не палец) и разрешено движение — с pointer:coarse или
 * prefers-reduced-motion модуль не делает ничего, secция остаётся
 * в исходном, уже рабочем режиме прокрутки.
 */
import { loadGsap } from '../gsap';
import { prefersReducedMotion } from '../motion';

export const initBar = async (): Promise<(() => void) | void> => {
  const section = document.querySelector<HTMLElement>('[data-bar]');
  const wrap = section?.querySelector<HTMLElement>('[data-bar-wrap]');
  const track = section?.querySelector<HTMLElement>('[data-bar-track]');
  if (!section || !wrap || !track) return;

  // Только точный курсор и разрешённое движение — иначе секция остаётся
  // обычной горизontальной прокруткой, как в разметке по умолчанию.
  if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;

  const bundle = await loadGsap();
  if (!bundle) return;
  const { gsap, ScrollTrigger } = bundle;

  wrap.dataset.barMode = 'pinned';

  // Дистанция хода — на кадр меньше, чтобы последняя карточка доезжала
  // точно до правого края, а не улетала за него с зазором.
  const distance = (): number => track.scrollWidth - wrap.clientWidth;

  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: wrap,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    ScrollTrigger.refresh();
    wrap.removeAttribute('data-bar-mode');
    gsap.set(track, { clearProps: 'transform' });
  };
};
