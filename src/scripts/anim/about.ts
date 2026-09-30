/**
 * Сцена секции «О нас»: заголовок по словам, коллаж из трёх фото
 * (раскрытие маской + параллакс), не покрытые generic-обработчиком
 * reveal.ts (там для заголовков — только сплит по строкам, для фото —
 * только один тип раскрытия и без параллакса).
 *
 * Числа-факты и вступительные абзацы остаются на data-reveal (reveal.ts) —
 * им не нужно ничего специфичного для этой секции.
 */
import { loadGsap } from '../gsap';
import { prefersReducedMotion } from '../motion';

interface PhotoConfig {
  readonly selector: string;
  /** Направление раскрытия маской: слева-направо у главного, снизу-вверх у остальных. */
  readonly direction: 'ltr' | 'btt';
  /** Амплитуда параллакса в px (ТЗ: ±40 / ±70 / ±20). */
  readonly parallax: number;
}

const PHOTOS: readonly PhotoConfig[] = [
  { selector: '[data-about-photo="main"]', direction: 'ltr', parallax: 40 },
  { selector: '[data-about-photo="second"]', direction: 'btt', parallax: 70 },
  { selector: '[data-about-photo="third"]', direction: 'btt', parallax: 20 },
];

export const initAbout = async (): Promise<(() => void) | void> => {
  const section = document.querySelector<HTMLElement>('[data-about]');
  const title = section?.querySelector<HTMLElement>('[data-about-title]');
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

  // Заголовок: сплит по словам, маска снизу, а не по строкам (общий
  // reveal.ts делает только построчный сплит — здесь своё требование).
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

  for (const { selector, direction, parallax } of PHOTOS) {
    const photo = section.querySelector<HTMLElement>(selector);
    const frame = photo?.querySelector<HTMLElement>('img');
    if (!photo || !frame) continue;

    // Раскрытие маской (once) + внутренний масштаб кадра — тот же приём,
    // что в reveal.ts для kind="image", но с выбором направления клипа.
    const from = direction === 'ltr' ? 'inset(0 100% 0 0)' : 'inset(100% 0 0 0)';
    const tl = gsap.timeline({
      scrollTrigger: { trigger: photo, start: 'top 85%', once: true },
    });
    tl.from(photo, { clipPath: from, duration: 0.9, ease: 'expo.out', immediateRender: false }).from(
      frame,
      { scale: 1.15, duration: 1.4, ease: 'expo.out', immediateRender: false },
      0,
    );
    track(tl);

    // Параллакс — независимая ось (transform на самой фигуре), скраб
    // на всю длину секции, разная амплитуда у каждого фото.
    track(
      gsap.fromTo(
        photo,
        { y: -parallax },
        {
          y: parallax,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      ),
    );
  }

  ScrollTrigger.refresh();

  return () => {
    for (const fn of cleanups) fn();
  };
};
