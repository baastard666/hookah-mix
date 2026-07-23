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

## 2026-07-23 — v0.3.5 Product Flavor Profile Registry (второй батч + tie-break для будущих батчей)

**Сделано:** заполнен второй приоритетный батч — ещё 15 продуктов (ранги 16–30 той же очереди), покрытие выросло с 15 до 30 из 86 `RESOLVED`. Данные batch 1/batch 2 вынесены в отдельные версионированные файлы `batch-1.ts`/`batch-2.ts` (по образцу `p0-decisions-batch-N.ts`), общие evidence-хелперы — в `evidence-helpers.ts`; `registry.ts` теперь только объединяет батчи и валидирует результат, публичный контракт `index.ts` не изменился. По отдельному запросу добавлен и явно закодирован вторичный tie-break очереди приоритизации для batch 3+ (manufacturer priority tier: Tier 1 — Darkside/Chabacco/MustHave/Sapphire Crown/Element, Tier 2 — Sebero/Overdose/Husky/Brusko/BlackBurn, Tier 3 — остальные), не меняющий и не пересчитывающий уже отобранные batch 1–2.

**Файлы:**
- создано: `src/lib/product-flavor-profile/{batch-1,batch-2,evidence-helpers,priority-queue,priority-queue.test}.ts`, `docs/engine-changelog/v0.3.5-product-flavor-profile-registry-batch-2.md`;
- изменено: `src/lib/product-flavor-profile/{registry,index,product-flavor-profile.test}.ts`, `scripts/verify-product-flavor-profile.ts` (порог 15 → 30), `docs/architecture/product-flavor-profile-registry.md`, `docs/roadmap/README.md` (30/86 вместо 15/86);
- не изменено: Prisma schema/миграции, существующие engines, `TobaccoIdentityDecision`-записи, batch 1.

**Тесты:** Vitest 956/956 (29 файлов, было 933/28); прирост +23 теста и +1 файл: `product-flavor-profile.test.ts` вырос с 27 до 33 тестов (+6, проверки состава batch 2/отсутствия пересечений/трёх новых sparse-кейсов), плюс новый файл `priority-queue.test.ts` (+17); `tsc --noEmit` — чисто; `eslint .` — чисто; `verify:product-flavor-profile` — 30 продуктов, 50 заполненных измерений, 103 evidence, confidence LOW/MEDIUM/HIGH = 15/15/0, HIGH не использован ни разу.

**Осталось:** заполнить оставшиеся 56 из 86 `RESOLVED` продуктов (batch 3 и далее, с новым manufacturer-tier tie-break); подключение registry к `calculateMixAnalysis`/scoring/UI — отдельная будущая итерация; локальный коммит batch 2 на ветке `feature/v0.3.5-product-flavor-profile-registry` ещё предстоит.

## 2026-07-23 — ADR-014: целевая модель из 7 измерений (по итогам анализа гипотетического Prisma-импорта)

**Сделано:** по запросу пользователя проведена (без кода) оценка гипотетического шага «создать записи `Flavor` в Postgres из decision registry», затем — оценка собираемости evidence по каждому из 18 сенсорных полей Prisma `Flavor`. По итогам оформлен `ADR-014`: целевая модель Product Flavor Profile Registry зафиксирована как 7 измерений (`sweetness`, `sourness`, `freshness`, `intensity`, `strength`, `heatResistance`, `juiciness`) вместо 18; остальные 11 полей (`cooling`, `creaminess`, `bitterness`, `dessertLevel`, `spiceLevel`, `floralLevel`, `herbalLevel`, `smokyLevel`, `dryness`, `naturalness`, `persistence`) явно исключены из типа `FlavorDimensionId`, а не отложены как nullable-опция. Дублирующее измерение `richness` переименовано в `intensity` (тот же концепт «насыщенность вкуса») — переименован только ключ в batch-1.ts/batch-2.ts, значения и evidence не пересчитывались. Prisma schema не менялась. Анализ кода/сравнения миксов в этой сессии не выполнялся — только ADR и типы registry.

**Файлы:**
- создано: `docs/adr/ADR-014-product-flavor-profile-dimension-scope.md`;
- изменено: `src/lib/product-flavor-profile/{types,constants,batch-1,batch-2}.ts` (`richness` → `intensity`, добавлены `strength`/`heatResistance`/`juiciness` в `FlavorDimensionId`/`FLAVOR_DIMENSION_IDS`), `docs/adr/README.md` (индекс), `docs/architecture/product-flavor-profile-registry.md` (ссылка на ADR-014, обновлённая модель данных);
- не изменено: Prisma schema/миграции, значения/evidence уже заполненных измерений batch 1–2, `TobaccoIdentityDecision`-записи.

**Тесты:** Vitest 956/956 без изменения количества (переименование ключа, не новые тесты); `tsc --noEmit` — чисто; `eslint .` — чисто; `verify:product-flavor-profile` — те же 30/50/103/{15,15,0}, что и до переименования (подтверждает: значения не пересчитывались).

**Осталось:** следующий исследовательский проход должен сначала добрать `strength`/`heatResistance`/`juiciness` для уже покрытых 30 продуктов batch 1–2, и только затем расширять на batch 3 (продукты 31+) по очереди с manufacturer-tier tie-break; вопрос фактической персистентности в Postgres остаётся отдельным будущим решением вне ADR-014.

## 2026-07-23 — Добор strength/heatResistance/juiciness для batch 1–2 (без начала batch 3)

**Сделано:** по прямому запросу добраны три новых измерения ADR-014 (`strength`, `heatResistance`, `juiciness`) для всех 30 уже покрытых продуктов batch 1–2, той же методологией evidence/confidence. Введено явное разделение по уровню атрибуции: per-SKU данные (HTReviews «официальная/пользовательская крепость», прямые цитаты про конкретный вкус) — `MEDIUM`; бренд-уровневые данные, перенесённые на конкретный продукт без отдельного подтверждения — `LOW` для `strength` (может отличаться между вкусами бренда) и `MEDIUM` для `heatResistance` (свойство обработки листа, обычно единое для линейки). Для BlackBurn/MustHave переиспользованы уже провалидированные evidence из `tobacco-profile`. `juiciness` заполнен только при прямом слове «сочный»/«juicy» — 5 из 30 продуктов. Для Hook и Husky `heatResistance` не найден и оставлен пустым (не выдуман). Batch 3 не начинался.

**Файлы:**
- изменено: `src/lib/product-flavor-profile/{batch-1,batch-2,product-flavor-profile.test}.ts` (новые dim-записи; обновлены sparse-тесты под уже не пустые `jam-spelaya-marakuiya`/`blackburn-almond-pear`/`husky-kiwano`/`urban-soul-pineapple`), `docs/architecture/product-flavor-profile-registry.md`, создан `docs/engine-changelog/v0.3.5-product-flavor-profile-registry-dimension-backfill.md`;
- не изменено: Prisma schema/миграции, состав batch (те же 30 `canonicalProductId`), `sweetness`/`sourness`/`freshness`/`intensity` — значения этих измерений не пересчитывались, только добавлены новые.

**Тесты:** Vitest 956/956 (без изменения количества — обновлены существующие проверки, новых тестовых файлов не добавлено); `tsc --noEmit` — чисто; `eslint .` — чисто; `verify:product-flavor-profile` — 30 продуктов, 113 заполненных измерений (было 50), 230 evidence (было 103), confidence LOW/MEDIUM/HIGH = 22/8/0 (было 15/15/0 — часть продуктов понижена с MEDIUM до LOW из-за новых низкоуверенных бренд-уровневых значений, `urban-soul-pineapple` и `husky-kiwano` наоборот повышены с LOW до MEDIUM, так как их первые измерения оказались MEDIUM-уверенными).

**Осталось:** batch 3 (продукты 31+) ещё не начат — следующий шаг по очереди с manufacturer-tier tie-break; локальный коммит этого добора ещё предстоит.

## 2026-07-23 — Batch 3 (30→45 из 86 RESOLVED), первый батч с manufacturer-tier tie-break

**Сделано:** посчитан фактический порядок очереди реальным кодом (`sortByPriorityQueue`/`comparePriorityQueueCandidates`) по всем 56 оставшимся `RESOLVED`-продуктам: 46 из 56 имели одинаковые primary-метрики `1/1/2`, и manufacturer-tier tie-break разрешил эту ничью в пользу Tier 1 (`Chabacco`, `Element`, `MustHave`, `Sapphire Crown`) целиком — все 15 позиций batch 3 оказались Tier 1. Заполнены 7 измерений по той же методологии для всех 15 продуктов. Учтена специфика линеек Chabacco Medium (крепость средне-лёгкая/жаростойкость высокая) vs Chabacco Mix (крепость лёгкая/жаростойкость низкая) — не усреднялись. Один явный конфликт источников (`chabacco-mix-fruktovyi-led`, розничное «средняя» против спецификации линейки «лёгкая») сохранён раздельно с LOW confidence и пометкой расхождения.

**Файлы:**
- создано: `src/lib/product-flavor-profile/batch-3.ts`, `docs/engine-changelog/v0.3.5-product-flavor-profile-registry-batch-3.md`;
- изменено: `src/lib/product-flavor-profile/{registry,index,product-flavor-profile.test}.ts`, `scripts/verify-product-flavor-profile.ts` (порог 30 → 45), `docs/architecture/product-flavor-profile-registry.md`, `docs/roadmap/README.md` (45/86 вместо 30/86);
- не изменено: Prisma schema/миграции, batch 1–2, существующие engines, `TobaccoIdentityDecision`-записи.

**Тесты:** Vitest 957/957 (29 файлов, было 956/29, +1 — новая проверка состава batch 3); `tsc --noEmit` — чисто; `eslint .` — чисто; `verify:product-flavor-profile` — 45 продуктов, 166 заполненных измерений (было 113), 336 evidence (было 230), confidence LOW/MEDIUM/HIGH = 32/13/0 (было 22/8/0), HIGH не использован ни разу.

**Осталось:** batch 4 начинается с ранга 16 очереди (`sapphire-crown-mejumi`, Tier 1) — оставшиеся 41 из 86 `RESOLVED` продуктов; подключение registry к `calculateMixAnalysis`/scoring/UI — отдельная будущая итерация; локальный коммит batch 3 ещё предстоит.
