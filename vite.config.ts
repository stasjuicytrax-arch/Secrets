import { defineConfig } from 'vite';

// base: '/Secrets/' — сайт публикуется на GitHub Pages в подпапке репозитория.
// При переезде на собственный домен поменять на '/'.
export default defineConfig({
  base: '/Secrets/',
  build: {
    target: 'es2022',
    cssTarget: 'safari16',
    assetsInlineLimit: 2048,
    rollupOptions: {
      // Многостраничная сборка: главная + страница меню (ТЗ §2).
      input: {
        main: 'index.html',
        menu: 'menu.html',
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
