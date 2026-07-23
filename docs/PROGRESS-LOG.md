# Журнал прогресса проекта

Здесь фиксируется история выполненных задач: дата, что сделано, какие файлы затронуты, статус тестов, что осталось.

## 2026-07-23 — v0.3.5 Product Flavor Profile Registry (первый батч)

**Сделано:** создан независимый read-only модуль `src/lib/product-flavor-profile/` (registry числовых вкусовых характеристик `sweetness`/`sourness`/`freshness`/`richness` для `RESOLVED`-продуктов из Tobacco Identity Decision Registry). Заполнен первый приоритетный батч — 15 продуктов, отобранных по очереди `verifiedMixCount → componentOccurrenceCount → occurrenceCount` (убывание), с evidence (`MANUFACTURER_CLAIM` / `REVIEW_AGGREGATE` / `EDITORIAL_ASSESSMENT`) и confidence на каждое значение. Registry не подключён к scoring/UI — отдельная будущая итерация.

**Файлы:**
- создано: `src/lib/product-flavor-profile/{types,constants,errors,validation,registry,queries,public-mapper,index,product-flavor-profile.test}.ts`, `scripts/verify-product-flavor-profile.ts`, `docs/architecture/product-flavor-profile-registry.md`, `docs/engine-changelog/v0.3.5-product-flavor-profile-registry.md`;
- изменено: `package.json` (регистрация скрипта `verify:product-flavor-profile`, одна строка), `docs/roadmap/README.md` (перенос v0.3.5 в Completed).
- не изменено: Prisma schema/миграции, существующие engines, `TobaccoIdentityDecision`-записи.

**Тесты:** Vitest 933/933 (28 файлов, было 906/27, +27, все 27 — мои); `tsc --noEmit` — чисто; `eslint .` — чисто; `verify:product-flavor-profile` — 15 продуктов, 28 заполненных измерений, 55 evidence, confidence LOW/MEDIUM/HIGH = 6/9/0, HIGH не использован ни разу; `verify:tobacco-identity-decisions` и `verify:canonical-mix-scoring` пройдены без изменений. `verify:mix-profile`, `verify:mix-compatibility`, `verify:canonical-catalog-identity` не проходят в этой сессии из-за отсутствия локального PostgreSQL на `localhost:5432` — причина не связана с изменениями (эти модули не трогались).

**Осталось:** заполнить оставшиеся 71 из 86 `RESOLVED` продуктов (следующие батчи той же очереди); подключение registry к `calculateMixAnalysis`/scoring/UI — отдельная будущая итерация (не в этой сессии); локальный коммит в отдельной ветке/worktree ещё предстоит.
