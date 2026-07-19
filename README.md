# ЧАША — MVP конструктора кальянных миксов

Веб-приложение на Next.js App Router, TypeScript, Tailwind CSS, Prisma и PostgreSQL. Анализ полностью детерминированный и не обращается к внешним API.

## Запуск

1. Установите Node.js 20+ и Docker Desktop.
2. Установите зависимости: `npm install`
3. Запустите PostgreSQL: `docker compose up -d`
4. Скопируйте `.env.example` в `.env`: `Copy-Item .env.example .env` (Windows) или `cp .env.example .env` (macOS/Linux).
5. Создайте клиент Prisma: `npx prisma generate`
6. Примените миграции: `npx prisma migrate dev`
7. Заполните базу: `npx prisma db seed`
8. Запустите приложение: `npm run dev` и откройте `http://localhost:3000`.

## Проверки

- Тесты: `npm test`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Production build: `npm run build`

## Структура

- `src/app` — страницы, компоненты и API route
- `src/lib/mix-analyzer.ts` — независимый алгоритм анализа
- `prisma/schema.prisma` — модель данных
- `prisma/seed.ts` — восемь тестовых вкусов

Оценки вкусов являются расчётной подсказкой, а не гарантией результата: реальный профиль зависит от забивки, жара и оборудования.
