/**
 * Сцена секции «Меню». ТЗ §4: фон перекрашивается из --c-ink в --c-sand
 * по мере входа секции. Дизайн-система §6: единственная светлая секция —
 * переход должен ощущаться как «выдох», а не мгновенная смена темы.
 *
 * Ведёт единственную переменную --mix (0 → 1) скрабом по скроллу.
 * Всё остальное — производные color-mix() в menu.css: не трогаем ни один
 * hex ни здесь, ни там.
 */
import { loadGsap } from '../gsap';
import { prefersReducedMotion } from '../motion';

export const initMenu = async (): Promise<(() => void) | void> => {
  const section = document.querySelector<HTMLElement>('[data-menu]');
  if (!section) return;

  if (prefersReducedMotion()) {
    // Без анимации фон обязан быть уже песочным — иначе текст читается
    // светлым по светлому, потому что base.css не знает про --mix.
    section.style.setProperty('--mix', '1');
    return;
  }

  const bundle = await loadGsap();
  if (!bundle) {
    section.style.setProperty('--mix', '1');
    return;
  }
  const { gsap } = bundle;

  const state = { mix: 0 };
  const tween = gsap.to(state, {
    mix: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top 85%',
      end: 'top 25%',
      scrub: true,
    },
    onUpdate: () => section.style.setProperty('--mix', state.mix.toFixed(3)),
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
};
