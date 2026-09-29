/**
 * Единственный источник правды по prefers-reduced-motion.
 *
 * ТЗ §4: при `reduce` весь GSAP отключается, Lenis не инициализируется,
 * элементы показываются сразу. Без исключений — дизайн-система §9.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(QUERY).matches;

/**
 * Подписка на смену настройки. Пользователь может включить «уменьшить движение»
 * в системе прямо во время сессии — тогда сцены нужно снести, а не оставить висеть.
 */
export const onMotionPreferenceChange = (handler: (reduced: boolean) => void): (() => void) => {
  const mql = window.matchMedia(QUERY);
  const listener = (event: MediaQueryListEvent) => handler(event.matches);
  mql.addEventListener('change', listener);
  return () => mql.removeEventListener('change', listener);
};
