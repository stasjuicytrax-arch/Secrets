/**
 * Сцена секции «Кальян». ТЗ §4: сетка вкусов собирается из разлёта,
 * бетонный фон проявляется.
 *
 * Разлёт детерминированный, а не случайный: карточки всегда собираются
 * одинаково, и повторный проход по странице выглядит так же, как первый.
 */
import { loadGsap } from '../gsap';
import { prefersReducedMotion } from '../motion';

/** Стартовое смещение карточек: сдвиг по x, по y и поворот. */
const SCATTER = [
  { x: -70, y: 40, rotate: -5 },
  { x: 80, y: -30, rotate: 4 },
  { x: -50, y: -50, rotate: 3 },
  { x: 60, y: 55, rotate: -4 },
] as const;

export const initHookah = async (): Promise<(() => void) | void> => {
  const section = document.querySelector<HTMLElement>('[data-hookah]');
  if (!section || prefersReducedMotion()) return;

  const bundle = await loadGsap();
  if (!bundle) return;
  const { gsap } = bundle;

  const cleanups: Array<() => void> = [];
  const track = (tween: gsap.core.Tween | gsap.core.Timeline): void => {
    cleanups.push(() => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
  };

  // Бетон проявляется, пока секция входит в кадр.
  const concrete = section.querySelector<HTMLElement>('[data-hookah-concrete]');
  if (concrete) {
    track(
      gsap.fromTo(
        concrete,
        { opacity: 0 },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'top 45%',
            scrub: true,
          },
        },
      ),
    );
  }

  const cards = [...section.querySelectorAll<HTMLElement>('.blend')];
  if (cards.length) {
    track(
      gsap.from(cards, {
        // Критично: без этого gsap.from() рендерит стартовые x/y/rotate
        // в DOM сразу при создании твина (immediateRender по умолчанию
        // включён у .from()), задолго до того, как ScrollTrigger вообще
        // разрешит проигрывание. Если после этого где-то в другом месте
        // вызывается ScrollTrigger.refresh() (а reveal.ts вызывает его
        // безусловно) — он форсирует reflow, пока карточки ещё стоят
        // в разлётных координатах, и GSAP кеширует эти координаты как
        // «естественное» состояние transform. Тогда твин анимирует
        // от разлёта к разлёту: таймлайн честно доигрывает до конца
        // (onStart/onComplete стреляют по расписанию), а x/y/rotate
        // весь показ стоят колом. opacity этой болезнью не болеет —
        // это простое число, а не декомпозированная матрица трансформа,
        // так что баг был не виден, пока не измерили сами карточки.
        // immediateRender: false убирает ранний коммит в DOM целиком:
        // GSAP берёт «естественные» 0/0/0 только в момент реального
        // старта анимации, когда с версткой уже ничего не происходит.
        immediateRender: false,
        x: (i: number) => SCATTER[i % SCATTER.length].x,
        y: (i: number) => SCATTER[i % SCATTER.length].y,
        rotate: (i: number) => SCATTER[i % SCATTER.length].rotate,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.07,
        scrollTrigger: { trigger: cards[0], start: 'top 85%', once: true },
        // Снимаем инлайновый transform после отыгровки: карточка возвращается
        // к обычному потоку разметки, и никакой более поздний refresh() уже
        // не может прочитать «неправильное» кешированное состояние с неё.
        onComplete: () => gsap.set(cards, { clearProps: 'transform' }),
      }),
    );
  }

  return () => {
    for (const fn of cleanups) fn();
  };
};
