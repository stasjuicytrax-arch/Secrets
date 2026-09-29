/**
 * Прелоадер: счётчик 0→100, лого проявляется из свечения, шторка уходит вверх.
 * ТЗ §2 блок 00.
 *
 * Намеренно не использует GSAP: прелоадер — это и есть первая отрисовка,
 * ждать отложенный чанк ему нечего. Всё на rAF и CSS-переходах.
 *
 * Шторка снимается по window.load или по таймауту — что наступит раньше.
 * Так первый экран не заперт за анимацией дольше, чем нужно (ТЗ §7, LCP < 2.0s).
 */

const COUNT_MS = 700;
const MIN_MS = 900;
const MAX_MS = 1400;
const CURTAIN_MS = 600;

const easeOut = (t: number): number => 1 - (1 - t) ** 3;

export const runPreloader = (onDone: () => void): void => {
  const root = document.documentElement;
  const node = document.querySelector<HTMLElement>('[data-preloader]');

  // Атрибут ставит инлайновый скрипт в <head>. Его нет при reduce и без JS.
  if (!node || root.dataset.boot !== 'pending') {
    root.dataset.boot = 'done';
    onDone();
    return;
  }

  const num = node.querySelector<HTMLElement>('[data-preloader-num]');
  const glow = node.querySelector<HTMLElement>('[data-preloader-glow]');
  const logo = node.querySelector<HTMLElement>('[data-preloader-logo]');

  if (glow) glow.style.transition = `opacity 400ms var(--e-out)`;
  if (logo) {
    logo.style.transition = `opacity 600ms var(--e-out), transform 900ms var(--e-out), filter 900ms var(--e-out)`;
    logo.style.transform = 'scale(1.06)';
    logo.style.filter = 'blur(10px)';
  }

  requestAnimationFrame(() => {
    if (glow) glow.style.opacity = '1';
    if (logo) {
      logo.style.opacity = '1';
      logo.style.transform = 'scale(1)';
      logo.style.filter = 'blur(0)';
    }
  });

  const started = performance.now();
  let loaded = document.readyState === 'complete';
  window.addEventListener('load', () => (loaded = true), { once: true });

  const tick = (now: number): void => {
    const elapsed = now - started;
    const value = Math.round(easeOut(Math.min(elapsed / COUNT_MS, 1)) * 100);

    if (num) num.textContent = String(value);
    node.style.setProperty('--pre-progress', String(value / 100));

    const ready = elapsed >= MIN_MS && (loaded || elapsed >= MAX_MS);
    if (!ready) {
      requestAnimationFrame(tick);
      return;
    }

    if (num) num.textContent = '100';
    node.style.setProperty('--pre-progress', '1');
    leave();
  };

  const leave = (): void => {
    node.style.transition = `transform ${CURTAIN_MS}ms var(--e-out)`;
    node.style.transform = 'translateY(-100%)';

    let finished = false;
    const finish = (): void => {
      if (finished) return;
      finished = true;
      root.dataset.boot = 'done';
      node.remove();
      onDone();
    };
    node.addEventListener('transitionend', finish, { once: true });
    // Страховка: если transitionend не придёт, страница не должна остаться под шторкой.
    setTimeout(finish, CURTAIN_MS + 200);
  };

  requestAnimationFrame(tick);
};
