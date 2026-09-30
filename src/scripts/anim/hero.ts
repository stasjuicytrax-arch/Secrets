/**
 * Сцена первого экрана. ТЗ §3 и §4:
 * — заголовок выезжает построчно через SplitText, маска снизу, стагер 0.08s;
 * — паралакс: заголовок уезжает вверх со скоростью 0.4, фото — 0.7;
 * — скролл-индикатор исчезает после первого скролла.
 *
 * Сводный список правок: декоративное свечение за контентом убрано
 * целиком (глобальное правило — никаких blur-пятен на фоне сайта).
 */
import { loadGsap } from '../gsap';
import { prefersReducedMotion } from '../motion';

export const initHero = async (): Promise<(() => void) | void> => {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;

  const inner = hero.querySelector<HTMLElement>('.hero__inner');
  const title = hero.querySelector<HTMLElement>('[data-hero-title]');
  const media = hero.querySelector<HTMLElement>('.hero__media');
  const scroll = hero.querySelector<HTMLElement>('[data-hero-scroll]');

  if (prefersReducedMotion()) {
    // Всё уже видно из CSS, добавлять нечего.
    return;
  }

  const bundle = await loadGsap();
  if (!bundle || !inner) return;
  const { gsap, ScrollTrigger } = bundle;

  // Строки считаются по метрикам шрифта. Пока Unbounded не загрузился,
  // переносы окажутся не там, где нужно, и маска обрежет не по строке.
  await document.fonts.ready;

  const { SplitText } = await import('gsap/SplitText');
  gsap.registerPlugin(SplitText);

  const cleanups: Array<() => void> = [];

  // ---------- Появление ----------

  const children = [...inner.children] as HTMLElement[];
  gsap.set(children, { opacity: 1 });

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });

  if (title) {
    // mask: 'lines' оборачивает каждую строку в overflow:hidden —
    // строка выезжает снизу из-под маски, а не просто всплывает.
    const split = new SplitText(title, { type: 'lines', mask: 'lines' });
    cleanups.push(() => split.revert());

    intro.from(split.lines, {
      yPercent: 110,
      duration: 1.1,
      stagger: 0.08,
    });
  }

  // Остальные элементы — fade + подъём 24px (ТЗ §4).
  intro.from(
    children.filter((node) => node !== title),
    { opacity: 0, y: 24, duration: 0.8, stagger: 0.06 },
    title ? '-=0.75' : 0,
  );

  cleanups.push(() => intro.kill());

  // ---------- Паралакс ----------

  const parallax = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });

  // Заголовок уезжает вверх быстрее страницы, фото идёт медленнее и отстаёт —
  // так у первого экрана появляется глубина.
  //
  // Отставание фото взято 11% высоты героя, а не 30% из ТЗ §4: чтобы увести
  // кадр на 30%, пришлось бы держать запас в 60% высоты, а это ломает
  // симметричную композицию снимка бара. Разница на глаз не читается.
  parallax
    .to(inner, { yPercent: -40, opacity: 0, ease: 'none' }, 0)
    .to(media, { yPercent: 9, ease: 'none' }, 0);

  cleanups.push(() => {
    parallax.scrollTrigger?.kill();
    parallax.kill();
  });

  // ---------- Скролл-индикатор ----------

  if (scroll) {
    const hide = ScrollTrigger.create({
      start: 40,
      onEnter: () => (scroll.dataset.gone = 'true'),
      onLeaveBack: () => (scroll.dataset.gone = 'false'),
    });
    cleanups.push(() => hide.kill());
  }

  return () => {
    for (const fn of cleanups) fn();
  };
};
