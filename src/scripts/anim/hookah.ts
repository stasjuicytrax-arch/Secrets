/**
 * Сцена секции «Кальян»: заголовок по словам, clip-path раскрытие фото,
 * stagger-заполнение декоративных шкал, параллакс ±30px у круглого фото,
 * 3D-наклон карточек миксов за курсором. Всё, кроме CSS-заглушки
 * (scale 0.98 на тач/reduce для карточек), выключено при
 * prefers-reduced-motion — без исключений.
 */
import { loadGsap } from '../gsap';
import { prefersReducedMotion } from '../motion';

const CIRCLE_PARALLAX = 30; // px

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

  if (prefersReducedMotion()) return;

  const bundle = await loadGsap();
  if (!bundle) return;
  const { gsap, ScrollTrigger } = bundle;

  const cleanups: Array<() => void> = [];
  const track = (tween: gsap.core.Tween | gsap.core.Timeline): void => {
    cleanups.push(() => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
  };

  // ---------- Заголовок по словам ----------

  const title = section.querySelector<HTMLElement>('[data-hookah-title]');
  if (title) {
    await document.fonts.ready;
    const { SplitText } = await import('gsap/SplitText');
    gsap.registerPlugin(SplitText);

    const split = new SplitText(title, { type: 'words', mask: 'words' });
    cleanups.push(() => split.revert());

    track(
      gsap.from(split.words, {
        yPercent: 110,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.06,
        immediateRender: false,
        scrollTrigger: { trigger: title, start: 'top 80%', once: true },
      }),
    );
  }

  // ---------- Раскрытие фото ----------

  const side = section.querySelector<HTMLElement>('[data-hookah-side]');
  const sideImg = side?.querySelector('img');
  if (side && sideImg) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: side, start: 'top 85%', once: true } });
    tl.from(side, { clipPath: 'inset(100% 0 0 0)', duration: 0.9, ease: 'expo.out', immediateRender: false }).from(
      sideImg,
      { scale: 1.15, duration: 1.4, ease: 'expo.out', immediateRender: false },
      0,
    );
    track(tl);
  }

  // ---------- Параллакс круглого фото ----------

  const circle = section.querySelector<HTMLElement>('[data-hookah-circle]');
  if (circle) {
    track(
      gsap.fromTo(
        circle,
        { y: -CIRCLE_PARALLAX },
        {
          y: CIRCLE_PARALLAX,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      ),
    );
  }

  // ---------- Заполнение шкал ----------

  const scales = [...section.querySelectorAll<HTMLElement>('.param__scale')];
  if (scales.length) {
    track(
      gsap.to(scales, {
        scaleX: 1,
        duration: 0.6,
        ease: 'expo.out',
        stagger: 0.15,
        immediateRender: false,
        scrollTrigger: { trigger: '[data-hookah-params]', start: 'top 85%', once: true },
      }),
    );
  }

  // 3D-наклон — только точный курсор. На тач/reduce карточки остаются как
  // в CSS (нажатие scale 0.98, тот же @media перехватывает и reduce —
  // досюда в этой ветке уже не дойти, но проверка pointer:fine своя).
  if (window.matchMedia('(pointer: fine)').matches) {
    gsap.set(section.querySelectorAll('.blend'), { transformPerspective: 900 });
    const cards = [...section.querySelectorAll<HTMLElement>('.blend')];
    for (const card of cards) cleanups.push(initTiltCard(card, gsap));
  }

  ScrollTrigger.refresh();

  return () => {
    for (const fn of cleanups) fn();
  };
};
