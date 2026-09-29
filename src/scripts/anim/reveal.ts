/**
 * Появление элементов при входе в кадр. ТЗ §4:
 * — заголовки: SplitText по строкам, маска снизу, стагер 0.06–0.1s;
 * — параграфы: fade + подъём 24px;
 * — карточки: стагер 0.08s, подъём 40px, scale 0.96 → 1;
 * — изображения: раскрытие маской снизу вверх 0.9s, внутри кадр едет 1.12 → 1;
 * — старт при 80% вьюпорта, once: true.
 *
 * Разметка объявляет тип через data-reveal, скрипт ничего не знает о секциях.
 * Один ScrollTrigger на элемент, все уничтожаются в возвращённой функции.
 */
import { loadGsap } from '../gsap';
import { prefersReducedMotion } from '../motion';

type Kind = 'title' | 'text' | 'cards' | 'image';

const START = 'top 80%';

/** Разделитель разрядов — узкий неразрывный пробел, как принято в русском наборе. */
const formatNumber = (value: number): string =>
  value >= 1000 ? value.toLocaleString('ru-RU').replace(/ /g, ' ') : String(value);

export const initReveal = async (root: ParentNode = document): Promise<(() => void) | void> => {
  const nodes = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
  const counters = [...root.querySelectorAll<HTMLElement>('[data-count]')];
  if (!nodes.length && !counters.length) return;

  if (prefersReducedMotion()) {
    // Ничего не анимируем, но счётчики обязаны показать конечное значение.
    for (const node of counters) {
      node.textContent = formatNumber(Number(node.dataset.count));
    }
    return;
  }

  const bundle = await loadGsap();
  if (!bundle) return;
  const { gsap, ScrollTrigger } = bundle;

  // Строки считаются по метрикам шрифта — до его загрузки перенос будет не там.
  await document.fonts.ready;
  const { SplitText } = await import('gsap/SplitText');
  gsap.registerPlugin(SplitText);

  const cleanups: Array<() => void> = [];
  const track = (tween: gsap.core.Tween | gsap.core.Timeline): void => {
    cleanups.push(() => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
  };

  for (const node of nodes) {
    const kind = (node.dataset.reveal || 'text') as Kind;
    const trigger = { trigger: node, start: START, once: true };

    if (kind === 'title') {
      const split = new SplitText(node, { type: 'lines', mask: 'lines' });
      cleanups.push(() => split.revert());
      track(
        gsap.from(split.lines, {
          yPercent: 110,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: trigger,
        }),
      );
      continue;
    }

    if (kind === 'cards') {
      track(
        gsap.from(node.children, {
          y: 40,
          scale: 0.96,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: trigger,
        }),
      );
      continue;
    }

    if (kind === 'image') {
      const frame = node.querySelector('img') ?? node;
      const tl = gsap.timeline({ scrollTrigger: trigger });
      // inset(100% 0 0 0) — видимая полоса нулевой высоты у нижнего края.
      // Уменьшая верхний отступ, раскрываем кадр снизу вверх.
      tl.from(node, {
        clipPath: 'inset(100% 0 0 0)',
        duration: 0.9,
        ease: 'expo.out',
      }).from(frame, { scale: 1.12, duration: 1.4, ease: 'expo.out' }, 0);
      track(tl);
      continue;
    }

    track(
      gsap.from(node, {
        y: 24,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        scrollTrigger: trigger,
      }),
    );
  }

  // Цифры-факты отсчитываются от нуля при входе в кадр (ТЗ §4).
  for (const node of counters) {
    const target = Number(node.dataset.count);
    const state = { value: 0 };
    node.textContent = formatNumber(0);

    track(
      gsap.to(state, {
        value: target,
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: node, start: START, once: true },
        onUpdate: () => {
          node.textContent = formatNumber(Math.round(state.value));
        },
      }),
    );
  }

  ScrollTrigger.refresh();

  return () => {
    for (const fn of cleanups) fn();
  };
};
