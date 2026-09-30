/**
 * Сцена секции «Кальян»: 3D-наклон карточек миксов за курсором и медленный
 * параллакс фото в правой колонке. ТЗ §4/§7: только точный курсор (мышь)
 * и без prefers-reduced-motion — на тач и при reduce карточки просто не
 * наклоняются (нажатие scale 0.98 — чистый CSS, см. hookah.css).
 */
import { loadGsap } from '../gsap';
import { prefersReducedMotion } from '../motion';

const MAX_TILT = 8; // deg
const TILT_DURATION = 0.4;
const SHIFT = 8; // px, встречный сдвиг фото-слоя

const initTiltCard = (
  card: HTMLElement,
  gsap: typeof import('gsap').gsap,
): (() => void) => {
  const media = card.querySelector<HTMLElement>('.blend__media');
  const sheen = card.querySelector<HTMLElement>('.blend__sheen');

  // quickTo не годится для rotateX/rotateY: GSAP 3.15 внутри пишет их через
  // отдельные CSS-свойства (rotate/translate/scale вместо transform), и для
  // этой пары quickTo молча не применяет твин (консоль: «rotateX not
  // eligible for reset») — проверено изолированно, с обычным gsap.to()
  // работает штатно. Обычный .to() с overwrite:'auto' на каждый pointermove
  // безопасен: GSAP сам гасит предыдущий твин на той же паре свойств.
  const setTilt = (rotateX: number, rotateY: number): void => {
    gsap.to(card, { rotateX, rotateY, duration: TILT_DURATION, ease: 'power3.out', overwrite: 'auto' });
  };
  const toMediaX = media
    ? gsap.quickTo(media, 'x', { duration: TILT_DURATION, ease: 'power3.out' })
    : null;
  const toMediaY = media
    ? gsap.quickTo(media, 'y', { duration: TILT_DURATION, ease: 'power3.out' })
    : null;
  const toSheenOpacity = sheen
    ? gsap.quickTo(sheen, 'opacity', { duration: TILT_DURATION, ease: 'power3.out' })
    : null;

  const onMove = (event: PointerEvent): void => {
    const rect = card.getBoundingClientRect();
    // -1 .. 1 от центра карточки по каждой оси.
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const nx = px * 2 - 1;
    const ny = py * 2 - 1;

    card.dataset.tiltActive = 'true';
    // Наклон вниз-к-курсору: курсор сверху карточки — верх наклоняется
    // "от" зрителя (отрицательный rotateX), курсор справа — rotateY
    // положительный.
    setTilt(-ny * MAX_TILT, nx * MAX_TILT);
    toMediaX?.(-nx * SHIFT);
    toMediaY?.(-ny * SHIFT);
    toSheenOpacity?.(1);
    sheen?.style.setProperty('--tilt-x', `${px * 100}%`);
    sheen?.style.setProperty('--tilt-y', `${py * 100}%`);
  };

  const onLeave = (): void => {
    card.dataset.tiltActive = 'false';
    setTilt(0, 0);
    toMediaX?.(0);
    toMediaY?.(0);
    toSheenOpacity?.(0);
  };

  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerleave', onLeave);

  return () => {
    card.removeEventListener('pointermove', onMove);
    card.removeEventListener('pointerleave', onLeave);
    // clearProps не принимает rotateX/rotateY по отдельности (тот же
    // повод, что и у quickTo выше) — целиком transform чистит штатно.
    gsap.set(card, { clearProps: 'transform' });
    if (media) gsap.set(media, { clearProps: 'x,y' });
  };
};

export const initHookah = async (): Promise<(() => void) | void> => {
  const section = document.querySelector<HTMLElement>('[data-hookah]');
  if (!section) return;

  const cleanups: Array<() => void> = [];

  // Параллакс фото в правой колонке — сам по себе не требует точного
  // курсора, только разрешённого движения (скролл, не наведение).
  const side = section.querySelector<HTMLElement>('[data-hookah-side] img');

  if (!prefersReducedMotion() && side) {
    const bundle = await loadGsap();
    if (bundle) {
      const { gsap } = bundle;
      const tween = gsap.fromTo(
        side,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
      cleanups.push(() => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    }
  }

  // 3D-наклон — только точный курсор, без reduce. На тач/reduce карточки
  // остаются как в CSS (нажатие scale 0.98, если попадёт в тот же @media).
  if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) {
    return cleanups.length ? () => cleanups.forEach((fn) => fn()) : undefined;
  }

  const bundle = await loadGsap();
  if (!bundle) return cleanups.length ? () => cleanups.forEach((fn) => fn()) : undefined;
  const { gsap } = bundle;

  gsap.set(section.querySelectorAll('.blend'), { transformPerspective: 900 });

  const cards = [...section.querySelectorAll<HTMLElement>('.blend')];
  for (const card of cards) cleanups.push(initTiltCard(card, gsap));

  return () => {
    for (const fn of cleanups) fn();
  };
};
