/**
 * Сцена секции «Кальян»: заголовок по словам, clip-path раскрытие фото,
 * интерактивные шкалы вкуса/крепости/дымности активного микса, параллакс
 * ±30px у круглого фото, 3D-наклон карточек миксов за курсором.
 *
 * Клик по карточке (initHookahStats) — единственная часть сцены, которая
 * работает и при prefers-reduced-motion: карточки должны быть кликабельны
 * всегда, только без анимации заливки делений (мгновенная смена атрибута
 * вместо gsap.to). Всё остальное (заголовок, раскрытие фото, параллакс,
 * 3D-наклон) выключено при reduced motion без исключений, как раньше.
 */
import { loadGsap } from '../gsap';
import { prefersReducedMotion } from '../motion';

const CIRCLE_PARALLAX = 30; // px

const MAX_TILT = 8; // deg
const TILT_DURATION = 0.4;
const SHIFT = 8; // px, встречный сдвиг фото-слоя

const PARAM_KEYS = ['taste', 'strength', 'smoke'] as const;
type ParamKey = (typeof PARAM_KEYS)[number];

const PARAM_LABELS: Record<ParamKey, string> = {
  taste: 'Вкус',
  strength: 'Крепость',
  smoke: 'Дымность',
};

/**
 * Клик/Enter/Space по карточке миксa делает её активной и перерисовывает
 * шкалы .hookah__params под текущие data-taste/-strength/-smoke.
 * Работает независимо от GSAP: getGsap() до загрузки бандла (или при
 * reduced motion, когда он не грузится вовсе) отдаёт null, и заливка
 * делений меняется мгновенно атрибутом [data-filled], без анимации —
 * то же самое требование, что и у остальных сцен при reduced motion,
 * но эта часть обязана продолжать работать, поэтому вынесена отдельно
 * и запускается до любых проверок prefers-reduced-motion в initHookah.
 */
const initHookahStats = (
  section: HTMLElement,
  getGsap: () => typeof import('gsap').gsap | null,
): (() => void) => {
  const cards = [...section.querySelectorAll<HTMLElement>('[data-blend-card]')];
  if (!cards.length) return () => {};

  const scales = new Map<ParamKey, HTMLElement>();
  const liveTexts = new Map<ParamKey, HTMLElement>();
  for (const key of PARAM_KEYS) {
    const scale = section.querySelector<HTMLElement>(`[data-param-scale="${key}"]`);
    const live = section.querySelector<HTMLElement>(`[data-param-live="${key}"]`);
    if (scale) scales.set(key, scale);
    if (live) liveTexts.set(key, live);
  }

  // GSAP парсит цвет по regex (hex/rgb/hsl/именованный) — сырой var(...)
  // под этот разбор не подходит и твин молча не сработает, поэтому
  // берём уже посчитанные браузером значения токенов один раз.
  const rootStyle = getComputedStyle(document.documentElement);
  const orange = rootStyle.getPropertyValue('--c-orange').trim();
  const concrete = rootStyle.getPropertyValue('--c-concrete').trim();

  const applyValue = (key: ParamKey, value: number, animate: boolean): void => {
    const scale = scales.get(key);
    if (scale) {
      const dots = [...scale.querySelectorAll<HTMLElement>('span')];
      for (const [i, dot] of dots.entries()) dot.dataset.filled = i < value ? 'true' : 'false';

      const gsap = animate ? getGsap() : null;
      if (gsap) {
        gsap.to(dots, {
          backgroundColor: (i: number) => (i < value ? orange : concrete),
          duration: 0.35,
          ease: 'power2.out',
          stagger: 0.05,
          overwrite: 'auto',
        });
      } else {
        // Без анимации (reduced motion или GSAP ещё не загрузился) —
        // очищаем инлайн-стиль от прошлых твинов, цвет берёт CSS
        // из [data-filled] мгновенно, без transition.
        for (const dot of dots) dot.style.backgroundColor = '';
      }
    }

    const live = liveTexts.get(key);
    if (live) live.textContent = `${PARAM_LABELS[key]}: ${value} из 5`;
  };

  let active: HTMLElement | null = null;

  const setActive = (card: HTMLElement, animate: boolean): void => {
    if (card === active) return; // повторный клик по активной — no-op
    active = card;

    for (const c of cards) {
      const isActive = c === card;
      c.dataset.active = String(isActive);
      c.setAttribute('aria-pressed', String(isActive));
    }

    for (const key of PARAM_KEYS) {
      const raw = card.dataset[key];
      applyValue(key, raw ? Number(raw) : 0, animate);
    }
  };

  const cleanups: Array<() => void> = [];
  for (const card of cards) {
    const onClick = (): void => setActive(card, true);
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      setActive(card, true);
    };
    card.addEventListener('click', onClick);
    card.addEventListener('keydown', onKeydown);
    cleanups.push(() => {
      card.removeEventListener('click', onClick);
      card.removeEventListener('keydown', onKeydown);
    });
  }

  // Активна первая карточка сразу, без анимации и без ScrollTrigger —
  // до этой строчки шкалы не должны ни на кадр показывать чужие значения.
  setActive(cards[0], false);

  return () => {
    for (const fn of cleanups) fn();
  };
};

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

  // Клик по карточке обязан работать даже при reduced motion — заводим
  // раньше проверки ниже. До того как GSAP (если вообще будет) загрузится,
  // getGsap() отдаёт null и applyValue() внутри меняет заливку мгновенно.
  let statsGsap: typeof import('gsap').gsap | null = null;
  const cleanupStats = initHookahStats(section, () => statsGsap);

  if (prefersReducedMotion()) return cleanupStats;

  const bundle = await loadGsap();
  if (!bundle) return cleanupStats;
  const { gsap, ScrollTrigger } = bundle;
  statsGsap = gsap;

  const cleanups: Array<() => void> = [cleanupStats];
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

  // Заполнение шкал — не scroll-triggered реveal, а initHookahStats() выше:
  // деления перерисовываются по клику карточки, а не один раз при входе
  // в кадр.

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
