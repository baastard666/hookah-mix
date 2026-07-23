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

## 2026-07-23 — Batch 4 (45→60 из 86 RESOLVED), первый батч, пересекающий границу Tier 1/2/3

**Сделано:** посчитан фактический порядок очереди по всем 41 оставшимся `RESOLVED`-продуктам. Batch 4 содержит последний оставшийся продукт Tier 1 (`sapphire-crown-mejumi`), весь Tier 2 (`Brusko`, `Husky` ×4, `Overdose` ×2) и начало Tier 3 (`Banger`, `Dozaj`, `Duft` ×2, `Endorphin` ×2, `FAKE`). Заполнены 7 измерений той же методологией. Дважды явно исключены чужие evidence при риске ложной атрибуции: для `husky-passion-fruit` не использованы описания вкуса «Passion Fruit» других марок (Fumari, Serbetli, Spectrum, Bonche), встретившиеся в том же поиске; для `dozaj-mint` не использованы материалы о вкусе «Mint» другого бренда (Rave Tobacco) — итог для Dozaj остался без единого заполненного измерения. Один явный конфликт источников (`brusko-medium-tsitrusovyi-chai`: общее позиционирование бренда «средняя крепость» против спецификации позиции «лёгкая крепость») сохранён раздельно с LOW confidence.

**Файлы:**
- создано: `src/lib/product-flavor-profile/batch-4.ts`, `docs/engine-changelog/v0.3.5-product-flavor-profile-registry-batch-4.md`;
- изменено: `src/lib/product-flavor-profile/{registry,index,product-flavor-profile.test}.ts` (проверка отсутствия пересечений обобщена на все батчи, новый sparse-тест для `dozaj-mint`), `scripts/verify-product-flavor-profile.ts` (порог 45 → 60), `docs/architecture/product-flavor-profile-registry.md`, `docs/roadmap/README.md` (60/86 вместо 45/86);
- не изменено: Prisma schema/миграции, batch 1–3, существующие engines, `TobaccoIdentityDecision`-записи.

**Тесты:** Vitest 959/959 (29 файлов, было 957/29, +2 — новая проверка состава batch 4 и sparse-тест `dozaj-mint`); `tsc --noEmit` — чисто; `eslint .` — чисто; `verify:product-flavor-profile` — 60 продуктов, 208 заполненных измерений (было 166), 420 evidence (было 336), confidence LOW/MEDIUM/HIGH = 39/21/0 (было 32/13/0), HIGH не использован ни разу.

**Осталось:** batch 5 начинается с ранга 16 очереди (`hook-granatovyi`, Tier 3) — оставшиеся 26 из 86 `RESOLVED` продуктов; для линейки Husky по-прежнему нет данных по `heatResistance` ни для одного продукта; подключение registry к `calculateMixAnalysis`/scoring/UI — отдельная будущая итерация; локальный коммит batch 4 ещё предстоит.

## 2026-07-23 — v0.3.5 Product Flavor Profile Registry (пятый батч)

**Сделано:** заполнен пятый приоритетный батч — ещё 15 продуктов (ранги 1–15 среди 26 оставшихся `RESOLVED`), покрытие выросло с 60 до 75 из 86. Весь батч состоит из Tier 3 — среди оставшихся продуктов не осталось производителей Tier 1/2 с той же primary-метрикой `1/1/2`; 4 формально Tier 1-продукта (`MustHave`, `Sapphire Crown`) остались за пределами batch 5 из-за более низкого `occurrenceCount`. При подготовке очереди обнаружена и исправлена ошибка в служебном скрипте вычисления очереди (сопоставление с отчётом шло по несуществующему полю `sourceGroupId` вместо `groupId`) — на состав и порядок продуктов уже отгруженных батчей 3–4 это не повлияло, но справочная фраза «ранг 16 = `hook-granatovyi`» в changelog batch 4 была неверной; исправлена на `fake-mumbai-tea`. Дважды применено правило кросс-брендового исключения (evidence для `fake-mumbai-tea` не спутано с одноимённым вкусом бренда Chabacco). Для `take-pineapple` не найдено ни одного независимого описания вкуса — заполнен только `strength` на уровне бренда, с обоснованным отступлением от стандартного правила `LOW` для brand-level reuse (источник явно утверждает единую крепость по всей линейке).

**Файлы:**
- создано: `src/lib/product-flavor-profile/batch-5.ts`, `docs/engine-changelog/v0.3.5-product-flavor-profile-registry-batch-5.md`;
- изменено: `src/lib/product-flavor-profile/{registry,index,product-flavor-profile.test}.ts`, `scripts/verify-product-flavor-profile.ts`, `docs/architecture/product-flavor-profile-registry.md`, `docs/roadmap/README.md`, `docs/engine-changelog/v0.3.5-product-flavor-profile-registry-batch-4.md` (исправление ошибочной справочной фразы про ранг 16);
- не изменено: Prisma schema/миграции, batch 1–4, существующие engines, `TobaccoIdentityDecision`-записи.

**Тесты:** Vitest 961/961 (29 файлов, было 959/29, +2 — новая проверка состава batch 5 и sparse-тест `take-pineapple`); `tsc --noEmit` — чисто; `eslint .` — чисто; `verify:product-flavor-profile` — 75 продуктов, 243 заполненных измерения (было 208), 490 evidence (было 420), confidence LOW/MEDIUM/HIGH = 45/30/0 (было 39/21/0), HIGH не использован ни разу — все числа сверены вручную по каждому из 15 новых продуктов и совпали в точности.

**Осталось:** batch 6 (последний) начинается с ранга 16 очереди (`urban-soul-strawberry`, Tier 3) — оставшиеся 11 из 86 `RESOLVED` продуктов; для линейки Husky по-прежнему нет данных по `heatResistance` ни для одного продукта; подключение registry к `calculateMixAnalysis`/scoring/UI — отдельная будущая итерация; локальный коммит batch 5 ещё предстоит.

## 2026-07-23 — v0.3.5 Product Flavor Profile Registry (шестой батч, финальный — 86/86)

**Сделано:** заполнен шестой, последний батч — 11 оставшихся продуктов (ранги 1–11 очереди), покрытие выросло с 75 до **86 из 86** `RESOLVED` продуктов. Регистратура полностью заполнена: очередь приоритизации пуста, `scripts/verify-product-flavor-profile.ts` дополнен прямой сверкой (`assert.deepEqual`) множества `canonicalProductId` в registry с полным списком `RESOLVED`-решений Tobacco Identity Decision Registry — подтверждено, что ни один продукт не пропущен и ни один не выдуман. Этот батч впервые показал реальный эффект tier-tie-break внутри группы с полностью равными primary-метриками: 4 формально Tier 1-продукта (`MustHave`, `Sapphire Crown`), отложенные из batch 5 из-за более низкого `occurrenceCount`, встали впереди всех Tier 3-продуктов этой группы. Дважды исключено кросс-товарное смешение источников (`urban-soul-strawberry` — не спутан с миксом «Strawberry Kiwi Grapefruit»; `sarma-360-persik` — не спутан с розничным вариантом «Персик-Молоко»); один раз явное указание источника «не сочный профиль» использовано как обоснование не заполнять `juiciness`, а не как пропуск.

**Файлы:**
- создано: `src/lib/product-flavor-profile/batch-6.ts`, `docs/engine-changelog/v0.3.5-product-flavor-profile-registry-batch-6.md`;
- изменено: `src/lib/product-flavor-profile/{registry,index,product-flavor-profile.test}.ts`, `scripts/verify-product-flavor-profile.ts` (длина 86 + финальная сверка полноты покрытия), `docs/architecture/product-flavor-profile-registry.md` (регистратура отмечена завершённой), `docs/roadmap/README.md` (v0.3.5 обновлён на 86/86, «оставшиеся батчи» заменены на «подключение к scoring/UI»);
- не изменено: Prisma schema/миграции, batch 1–5, существующие engines, `TobaccoIdentityDecision`-записи.

**Тесты:** Vitest 962/962 (29 файлов, было 961/29, +1 — новая проверка состава batch 6); `tsc --noEmit` — чисто; `eslint .` — чисто; `verify:product-flavor-profile` — 86 продуктов, 271 заполненное измерение (было 243), 546 evidence (было 490), confidence LOW/MEDIUM/HIGH = 47/39/0 (было 45/30/0), HIGH не использован ни разу, множество canonicalProductId в registry совпадает один в один с полным списком RESOLVED-решений — все числа сверены вручную по каждому из 11 новых продуктов и совпали в точности.

**Осталось:** заполнение данными завершено (86/86). Дальнейшие шаги — отдельные будущие итерации, требующие собственного решения о приоритизации: подключение registry к `calculateMixAnalysis`/scoring/UI; возможное расширение evidence там, где источников пока не нашлось (например, `heatResistance` для всей линейки Husky); импорт данных в Postgres `Flavor` — ранее оценено как отдельная задача, требующая своего ADR из-за разрыва 7 vs 18 полей.

## 2026-07-23 — переоценка вопроса импорта в Postgres + ADR-015 (nullable secondary-поля)

**Сделано:** по запросу переоценён (только анализ, без кода) вопрос «импортировать ли 86/86 RESOLVED-продуктов Product Flavor Profile Registry в Prisma `Flavor`» — ранее (при охвате 15–30 продуктов) вывод был «не делать, слишком много обязательных полей без evidence». С полным охватом 86/86 обнаружено: точное распределение — ни один продукт не имеет всех 7 целевых измерений заполненными (медиана 3 из 7), только `strength` покрыт почти универсально (84/86); найдена конкретная, а не гипотетическая коллизия с demo-данными (`overdose-coffee`: demo `sweetness=3/heatResistance=7` против evidence-backed `sweetness=6/heatResistance=9`) и смысловой почти-дубль (`daily-hookah-slivochnyi-krem` vs demo `Сливки`). По итогу — оформлен **ADR-015**: сделать 11 «несобираемых» полей `FlavorProfile`/Prisma `Flavor` (`cooling`, `creaminess`, `bitterness`, `dryness`, `dessertLevel`, `spiceLevel`, `floralLevel`, `herbalLevel`, `smokyLevel`, `naturalness`, `persistence`) nullable, с явной политикой «`null` = не измерено, никогда не 0», обязательной для каждого потребляющего модуля. Аудитом реальных потребителей (не по памяти, построчным чтением) уточнён список: 2 модуля из первоначальной оценки оказались ложными срабатываниями (`compatibility-rules.ts`, 4 файла `flavor-knowledge/*` — совпадение по именам категорий нот, а не по числовым Prisma-полям), но обнаружен один пропущенный ранее реальный и критичный потребитель — `src/lib/flavors/validate-flavor.ts` (сегодня гарантированно отклоняет `null` как невалидное значение через `Number.isFinite`). Итоговый план по 9 реальным модулям (+ сам тип `FlavorProfile`) включает конкретные, уже найденные во время аудита точки риска молчаливого приведения `null` к `0` в JS-арифметике — включая одну потенциальную порчу пользовательского результата (`mix-result-presentation/index.ts` рисует `creaminess`/`bitterness` как готовое число без проверки на `null`) и одну потенциальную логическую ошибку (`analyze-profile-balance.ts`, правило «плоский профиль»: `null < 3` истинно в JS).

**Файлы:**
- создано: `docs/adr/ADR-015-flavor-profile-nullable-secondary-dimensions.md`;
- изменено: `docs/adr/README.md` (ADR-015 добавлен в индекс);
- не изменено: Prisma schema/миграции, `src/lib/flavors/*`, все 9 модулей из плана ADR-015, `src/lib/product-flavor-profile/*` — как и было явно запрошено, эта сессия ограничена только документом-решением, без кода.

**Тесты:** не запускались — изменений в коде нет.

**Осталось:** реализация ADR-015 (миграция схемы, правка `validate-flavor.ts` и 9 модулей) — отдельная будущая задача; отдельная будущая ADR/решение по объёму импорта 86 продуктов и политике реконсиляции для `overdose-coffee`/`daily-hookah-slivochnyi-krem` — явно вне рамок ADR-015.

## 2026-07-23 — реализация ADR-015: nullable secondary-поля FlavorProfile

**Сделано:** 11 полей (`cooling`, `creaminess`, `bitterness`, `dryness`, `dessertLevel`, `spiceLevel`, `floralLevel`, `herbalLevel`, `smokyLevel`, `naturalness`, `persistence`) сделаны nullable в Prisma `Flavor` (миграция `20260723120000_flavor_secondary_dimensions_nullable`) и в типе `FlavorProfile` (`src/lib/flavors/types.ts`: `FLAVOR_PROFILE_CORE_FIELDS`/`FLAVOR_PROFILE_SECONDARY_FIELDS`, `FlavorProfile = Record<Core,number> & Record<Secondary,number|null>`). Политика «`null` = не измерено, никогда не 0» применена явно во всех реальных потребителях.

**Важные технические находки при реализации (расходятся с первоначальной оценкой в самой ADR-015):**
- Аудит через `tsc --noEmit` (а не через grep) дал более точный список реальных потребителей: 2 файла из первоначального списка ADR-015 оказались ложными срабатываниями (`mix-compatibility/compatibility-rules.ts`, 4 файла `flavor-knowledge/*`), зато нашлись 4 ранее не замеченных реальных потребителя: `mix-profile/calculate-weighted-profile.ts`, `mix-profile/validate-input.ts`, `mix-recommendation/calculate-recommendations.ts`, `mix-recommendation/helpers.ts` (`sourceComponentForCharacteristic`), плюс `prisma/verify-seed.ts` и `src/app/result/[id]/page.tsx`.
- Обнаружено, что `canonical-mix-scoring/build-effective-tobacco-profile.ts` уже содержит каскадный резолвер (`Number.isFinite` correctly исключает `null`, откатываясь на `CANONICAL_TECHNICAL_PROFILE` → `NEUTRAL_FALLBACK=5`), который резолвит `null` в реальное число **до** того, как профиль доходит до `calculateMixProfile`/`analyze-profile-balance`/`summary-tags`/`mix-result-presentation`. Из-за этого большинство добавленных guard'ов в этих модулях — правки уровня типов/явного самодокументирования, а не исправление живого рантайм-бага в основном пайплайне `calculateMixAnalysis`. Реальный, никем не резолвимый риск был сосредоточен в устаревшем `mix-analyzer.ts` (получает «сырые» Prisma-данные напрямую через `mapFlavor`, без каскада) и на валидационных границах (`validate-flavor.ts`, `validate-input.ts`, `calculate-recommendations.ts`).
- Найдено и исправлено 2 реальных поведенческих бага (не просто type-safety): `mix-compatibility/analyze-profile-balance.ts` — `dessert-balance` (`bitterness<=6`) и `fresh-juicy` (`dryness<=T.maxComfortableDryness`) — здесь `null` коэрсится в `0`, что тривиально удовлетворяет `<=`, то есть без explicit-guard'а неизмеренное поле молча «проходило» бы порог как заведомо низкое.
- Правило `profile.flat` (`every(value<3)`), заранее названное в самой ADR-015 «опасным», при точном разборе оказалось математически эквивалентно корректной обработке: `null<3` в JS всегда `true`, что даёт тот же итог, что и явное исключение `null` из проверки. Guard добавлен для явности и на случай будущего рефакторинга, но заявленный риск для этого конкретного правила не подтвердился — исправлено в понимании, задокументировано в коммите.
- В `mix-recommendation/helpers.ts` `sourceComponentForCharacteristic` найден настоящий edge-case: без explicit-исключения `null` компонент с реальным измеренным `0` и компонент с `null` получали одинаковый «счёт» (оба ноль) и могли перепутаться местами в выборе «источника» характеристики для рекомендации.

**Файлы:**
- создано: `prisma/migrations/20260723120000_flavor_secondary_dimensions_nullable/migration.sql`, `src/lib/canonical-mix-scoring/calculate-canonical-mix-score.test.ts`;
- изменено: `prisma/schema.prisma`, `prisma/verify-seed.ts`, `src/app/result/[id]/page.tsx`, `src/lib/flavors/{types,validate-flavor,validate-flavor.test}.ts`, `src/lib/mix-profile/{calculate-weighted-profile,validate-input,mix-profile.test}.ts`, `src/lib/canonical-mix-scoring/calculate-canonical-mix-score.ts`, `src/lib/mix-compatibility/{analyze-profile-balance,summary-tags,compatibility.test}.ts`, `src/lib/mix-recommendation/{calculate-recommendations,helpers,profile-recommendations,recommendation.test}.ts`, `src/lib/mix-result-presentation/{index,mix-result-presentation.test}.ts`, `src/lib/mix-analyzer.ts`, `src/lib/mix-analyzer.test.ts`;
- не изменено: `src/lib/product-flavor-profile/*` (7-полевая модель ADR-014 не связана с этой ADR), `prisma/seed.ts` (демо-данные остаются полностью заполненными, nullable ≠ обязан быть null).

**Тесты:** Vitest **999/999 passed, 30 файлов** (было 962/29, +37 новых тестов на null-случаи во всех затронутых модулях); `tsc --noEmit` — чисто; `eslint .` — чисто; `npx prisma validate` — схема валидна; миграция применена к локальному Postgres в Docker (`npx prisma migrate deploy` + `npx prisma generate`) в момент реализации — на момент финальной проверки Docker Desktop оказался недоступен на машине (не связано с изменениями кода).

**Осталось:** объём импорта 86 продуктов Product Flavor Profile Registry в Postgres и политика реконсиляции для `overdose-coffee`/`daily-hookah-slivochnyi-krem` — по-прежнему отдельное будущее решение, вне рамок ADR-015.
