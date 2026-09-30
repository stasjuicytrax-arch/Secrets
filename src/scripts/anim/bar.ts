/**
 * Сцена секции «Бар». ТЗ §4: pinned-секция — вертикальный скролл
 * прокручивает карточки коктейлей горизонтально. Самая тяжёлая сцена
 * по ТЗ §9 (этап 6).
 *
 * ТЗ §7: «тач-версия... pinned-секции заменяются вертикальным листанием».
 * Здесь это не запасной путь на случай сбоя GSAP, а осознанный дефолт:
 * .bar__track в разметке уже overflow-x:auto со scroll-snap — секция
 * работает и без единой строчки JS. Этот модуль ТОЛЬКО ДОБАВЛЯЕТ pin
 * и курсор-drag поверх рабочего дефолта, и только когда есть точный
 * курсор (мышь, не палец) и разрешено движение.
 */
import { loadGsap } from '../gsap';
import { prefersReducedMotion } from '../motion';

export const initBar = async (): Promise<(() => void) | void> => {
  const section = document.querySelector<HTMLElement>('[data-bar]');
  const wrap = section?.querySelector<HTMLElement>('[data-bar-wrap]');
  const track = section?.querySelector<HTMLElement>('[data-bar-track]');
  const progress = section?.querySelector<HTMLElement>('[data-bar-progress]');
  if (!section || !wrap || !track) return;

  // Индикатор прогресса живёт независимо от pin-режима: обычный scroll на
  // треке уже даёт честный прогресс без единой строчки GSAP — работает и
  // на тач, и при prefers-reduced-motion, где pin ниже не включится.
  const updateProgressFromScroll = (): void => {
    const max = track.scrollWidth - track.clientWidth;
    const value = max > 0 ? track.scrollLeft / max : 0;
    section.style.setProperty('--bar-progress', value.toFixed(4));
  };

  if (progress) {
    track.addEventListener('scroll', updateProgressFromScroll, { passive: true });
    updateProgressFromScroll();
  }

  // Только точный курсор и разрешённое движение — иначе секция остаётся
  // обычной горизонтальной прокруткой, как в разметке по умолчанию.
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
      // В pinned-режиме у трека нет нативного scroll (overflow:visible) —
      // прогресс дальше ведёт сам твин, тот же --bar-progress.
      onUpdate: (self) => section.style.setProperty('--bar-progress', self.progress.toFixed(4)),
    },
  });

  // Курсор-drag: горизонтальное перетаскивание ленты двигает саму карточную
  // трансформацию НАПРЯМУЮ (gsap.set на track.x), а не скролл страницы.
  // Первая версия дёргала window.scrollTo на каждый pointermove — и почти
  // сразу ловила pointercancel от браузера: пока трек pinned (position:fixed
  // по факту), скролл страницы посреди активного pointer-жеста заставляет
  // Chromium решить, что жест «отжат» скроллом, и он обрывает поток
  // pointermove (проверено: pointercancel после первого же move, с
  // setPointerCapture и touch-action:none — тоже). Прямой transform этого
  // не вызывает: скролл вообще не трогается, пока идёт перетаскивание.
  // Реальную позицию скролла синхронизируем только один раз, на pointerup —
  // тем же ScrollTrigger.scroll(), чтобы дальнейший скролл продолжился
  // именно с того места, где отпустили карточку.
  const st = tween.scrollTrigger;
  let dragging = false;
  let startX = 0;
  let startTrackX = 0;
  let currentTrackX = 0;

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || !st) return;
    dragging = true;
    startX = event.clientX;
    startTrackX = currentTrackX = (gsap.getProperty(track, 'x') as number) || 0;
    track.dataset.dragging = 'true';
    track.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    currentTrackX = Math.min(0, Math.max(-distance(), startTrackX + dx));
    gsap.set(track, { x: currentTrackX });
  };

  const endDrag = (): void => {
    if (dragging && st) {
      const progress = distance() > 0 ? -currentTrackX / distance() : 0;
      st.scroll(st.start + progress * (st.end - st.start));
    }
    dragging = false;
    track.dataset.dragging = 'false';
  };

  track.addEventListener('pointerdown', onPointerDown);
  track.addEventListener('pointermove', onPointerMove);
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    ScrollTrigger.refresh();
    wrap.removeAttribute('data-bar-mode');
    gsap.set(track, { clearProps: 'transform' });
    track.removeEventListener('pointerdown', onPointerDown);
    track.removeEventListener('pointermove', onPointerMove);
    track.removeEventListener('pointerup', endDrag);
    track.removeEventListener('pointercancel', endDrag);
    if (progress) track.removeEventListener('scroll', updateProgressFromScroll);
  };
};
