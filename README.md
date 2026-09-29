# Secrets Lounge — рабочая папка

Подготовка к вёрстке нового сайта взамен secretslounge.ru (Tilda).

```
Secrets/
├─ README.md                        ← этот файл
├─ Referens/                        ← исходные референсы (13.jpg, 8.jpg)
├─ 01-content/
│  ├─ site-content.md               ← весь текст со старого сайта, дословно
│  └─ links-and-media.md            ← ссылки, PDF меню, файлы с Tilda CDN
├─ 02-design/
│  ├─ design-system.md              ← разбор референсов, палитра, типографика,
│  │                                  сетка, ритм блоков, компоненты, запреты
│  └─ tokens.css                    ← готовые CSS-переменные для проекта
└─ 03-tz/
   └─ TZ-secrets-website.md         ← техническое задание
```

## С чего начинать вёрстку

1. Прочитать `03-tz/TZ-secrets-website.md` целиком.
2. Скопировать `02-design/tokens.css` в `src/styles/` нового проекта.
3. Установить скиллы:
   ```
   npx impeccable install
   npx skills add Leonxlnx/taste-skill
   ```
4. Включить хуки `impeccable`, чтобы slop-детектор работал автоматически.
5. Идти по этапам из §9 ТЗ, после каждого блока — `/impeccable audit`.

## Что нужно от клиента до старта

Список в конце ТЗ (§10) и в конце `01-content/site-content.md`. Критичное: исходники фото, лого в векторе, данные меню, куда отправлять заявки с формы.
