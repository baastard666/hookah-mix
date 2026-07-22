# CODEX HANDOFF — hookah-mix

## 1. Назначение и текущее состояние

`hookah-mix` — MVP веб-приложения для составления и детерминированного анализа кальянных миксов. Пользователь выбирает 2–5 табаков, задаёт проценты, чашу, угли и прогрев; приложение показывает рассчитанный профиль, совместимость, конфликты, риск перегрева и рекомендации.

Технологии: Next.js App Router, TypeScript strict, Tailwind CSS, Prisma ORM, PostgreSQL, Docker Compose и Vitest. Интерфейс русский.

Текущее состояние:

- пользовательский MVP и доменные движки работают;
- v0.2.7–v0.3.2 реализованы отдельными доменными модулями;
- real-workbook импортируется read-only и проходит audit;
- создан ручной identity-decision pipeline для P0/P1;
- добавлен первый versioned batch из 20 рассмотренных P1 identity decisions: 19 `CONFIRMED`/`RESOLVED` и 1 безопасный `MANUFACTURER_ONLY`/`NEEDS_MORE_EVIDENCE`;
- добавлен первый deterministic P0 batch: 15 `CONFIRMED`/`RESOLVED` identity-групп, покрывающих 31 occurrence и улучшающих распознавание 21 VERIFIED-микса;
- добавлен второй deterministic P0 batch: рассмотрено 15 групп, 12 `CONFIRMED`/`RESOLVED`, 3 безопасно сохранены как `AMBIGUOUS`; применено 24 из 30 occurrences и улучшено 9 VERIFIED-миксов;
- добавлен третий deterministic P0 batch: 15/15 групп подтверждены как `CONFIRMED`/`RESOLVED`; применено 30 occurrences и улучшено 12 уникальных VERIFIED-миксов;
- добавлен четвёртый deterministic P0 batch: рассмотрено 15 групп, 13 `CONFIRMED`/`RESOLVED`, 2 Spectrum identities безопасно сохранены как `AMBIGUOUS`; применено 26 из 30 occurrences и улучшено 11 VERIFIED-миксов;
- добавлен пятый deterministic P0 batch: рассмотрено 15 групп, 12 `CONFIRMED`/`RESOLVED`, Sebero / Vanilla сохранён как `AMBIGUOUS`, а Sapphire Crown / Kiwi Fruit и «не указан / Освежающий мохито» — как `UNRESOLVED`/`DEFERRED`; применено 15 из 19 occurrences и улучшено 10 VERIFIED-миксов;
- добавлен финальный P0 batch 6: `Sebero / Черника` сохранён как `AMBIGUOUS` из-за подтверждённых кандидатов Classic/Bilberry и Limited Edition/Blueberry; все 76 исходных P0-групп теперь имеют versioned outcome;
- финальный интеграционный аудит v0.3.2 зафиксирован в `docs/engine-changelog/v0.3.2-canonical-tobacco-catalog-expansion-release-summary.md`;
- canonicalProductId стандартизирован как ASCII-only: 12 authoritative Unicode ID мигрированы, а immutable legacy registry содержит 18 compatibility mappings;
- v0.3.3 подключает authoritative decision Registry к `calculateMixAnalysis`, API создания микса и Result UI;
- predicted quality, confidence, data quality и verified smoke score теперь разделены;
- decision Registry по-прежнему не сохраняется как отдельная PostgreSQL-модель; Prisma schema не менялась.

## 2. Git baseline

- Репозиторий: `https://github.com/baastard666/hookah-mix`.
- Текущая feature-ветка: `feature/v0.3.3-canonical-mix-scoring-integration`.
- Начальный HEAD v0.3.3: `4186ae8ef1e7b994ed25f62885f4043969f6b192` (`main`).
- Release source branch: `feature/v0.3.2-canonical-tobacco-catalog-expansion`; после интеграции рабочей веткой становится `main`.
- Baseline перед ASCII-стандартизацией: `8b727298c9470bda73ba9e0e2b6133dc2434e675`.
- Фактический HEAD после получения репозитория: commit, содержащий этот файл; проверить командой `git rev-parse HEAD`. Хеш handoff-коммита нельзя самоссылочно зафиксировать внутри его содержимого.
- Ветка основана на `c09494ba4ec9bfff2f64e05f44b1ad4b24e9f53c`.
- Pre-merge baseline `origin/main`: `86a1eb0554b773d0b0a5d1b3d537e4e42c6a6dfe`. После release merge v0.2.7–v0.3.2 должны быть доступны из `main`; фактический merge commit проверять через `git log -1`.

Важные commits:

| Итерация | Commit | Смысл |
|---|---|---|
| v0.2.7 | `d803e5a5` | Tobacco Product Profile Registry |
| v0.2.8 | `1ac5602c` | Tobacco Product Identity audit |
| v0.2.9 | `1f02446e` | Canonical catalog identity persistence |
| v0.3.0 | `c12dc3ee` | Expert Mix Knowledge schema |
| v0.3.1 | `471819ca` | Excel import/audit foundation |
| v0.3.1 audit fix | `051510fe` | Real-workbook parsing/audit corrections |
| unresolved report | `c09494ba` | Deterministic unresolved identity report |
| v0.3.2 | `25c01f62` | Canonical identity decisions |

## 3. Завершённые итерации

### v0.2.7 — Tobacco Product Profile Registry Foundation

- `src/lib/tobacco-profile/`;
- immutable Manufacturer/Product Line Registry;
- категориальные strength, heat resistance и leaf types с evidence/confidence;
- `НАШ` и `Dogma` зарегистрированы как разные manufacturers.

### v0.2.8 — Tobacco Product Identity & Catalog Audit

- `src/lib/tobacco-product-identity/`;
- exact canonical/alias и controlled-prefix resolution;
- typed `RESOLVED`, `MANUFACTURER_ONLY`, unresolved/ambiguous statuses;
- fuzzy matching отсутствует.

### v0.2.9 — Canonical Catalog Identity Persistence

- `src/lib/catalog-identity/`;
- persisted canonical identity mapper, consistency checks, coverage, backfill и Prisma store;
- backfill защищает verified/test records;
- `productLineId` nullable в persistence/domain contract.

### v0.3.0 — Expert Mix Knowledge Schema Foundation

- `src/lib/expert-mix-knowledge/`;
- source-specific expert records, proportions, preparation, observations, evaluation;
- immutable registry и public-safe mapping;
- private evidence отделено от публичного DTO.

### v0.3.1 — Excel Knowledge Import & Audit

- `src/lib/expert-mix-knowledge-import/`;
- Node-only XLSX reader, header mapping, normalization, staging, identity mapping, validation и audit;
- catalog facts, real observations, ratings, tag-derived data и preliminary inference разделены по provenance;
- `src/lib/expert-mix-knowledge-import/unresolved-identity-report.ts` создаёт exact-normalized P0–P3 report.

## 4. v0.3.2 — фактический статус и следующий шаг

v0.3.2 уже реализована в `src/lib/tobacco-identity-decisions/` и commit `25c01f62…`.

Реализовано:

- typed `TobaccoIdentityDecision`, evidence, review states и `ProductLineInterpretation`;
- deterministic canonical ID с nullable product line;
- immutable multi-index Decision Registry;
- exact-only resolver перед существующим resolver;
- validation, duplicate/conflict/collision detection;
- decision application, coverage comparison и domain filtering;
- P0/P1 review generator с отдельным `USER_PRIORITY`;
- privacy-safe mapping, fixtures, 54 unit tests и verify script;
- ADR-012 и архитектурная документация.

ASCII-представление canonical ID дополнительно закреплено ADR-013. Все новые ID соответствуют `^[a-z0-9]+(?:-[a-z0-9]+)*$`; official English canonical name имеет приоритет, иначе применяется фиксированная русская транслитерация без смыслового перевода. Старые Unicode ID разрешаются только immutable legacy mapping, public-safe output возвращает новый ASCII ID.

Первый operational batch P1 завершён в `src/lib/tobacco-identity-decisions/p1-decisions-batch-1.ts`: рассмотрены все 20 P1 group IDs, 19 продуктов получили canonical identity, а `MustHave / Ананас` сохранён как `MANUFACTURER_ONLY` без guessed alias к отдельному `Pineapple Rings`. P0 batches 1–6 хранятся в одноимённых versioned файлах. Batch 1 содержит 15 resolved identities, batch 2 — 12 resolved и 3 ambiguous, batch 3 — 15 resolved, batch 4 — 13 resolved и 2 ambiguous, batch 5 — 12 resolved, 1 ambiguous и 2 unresolved/deferred, batch 6 — 1 ambiguous. Authoritative aggregate объединяет P1 и все шесть P0 batch; все 76 P0-групп рассмотрены. P2/P3 по-прежнему не применять. Следующая продуктовая итерация после v0.3.3 — `unknown`.

### v0.3.3 — Canonical Mix Scoring Integration

Фактическая v0.3.3 использована для интеграции canonical identity в действующий расчёт, а прежнее направление Product Flavor Taxonomy перенесено без номера (`unknown`). Новый слой находится в `src/lib/canonical-mix-scoring/` и выполняется перед Mix Profile, Compatibility и Recommendation Engine. Он сохраняет `AMBIGUOUS`/`UNRESOLVED`, строит effective profile с provenance, объединяет только одинаковый `RESOLVED canonicalProductId` и разделяет predicted score/confidence/data quality/verified score.

Реальный workbook diagnostic обработал 37 VERIFIED-миксов и 97 компонентов: 87 `RESOLVED`, 1 `MANUFACTURER_ONLY`, 7 `AMBIGUOUS`, 2 `UNRESOLVED`; coverage 89,7% по количеству и 90,5% по весу. Scoring/privacy errors = 0. Подробности: `docs/engine-changelog/v0.3.3-canonical-mix-scoring-integration.md`.

## 5. Архитектура и основные модули

| Модуль | Путь | Назначение |
|---|---|---|
| Tobacco Product Profile Registry | `src/lib/tobacco-profile/` | Manufacturer и Product Line technical profiles |
| Product Line Registry | `src/lib/tobacco-profile/registry.ts` | Canonical manufacturers/lines и aliases |
| Tobacco Product Identity Resolver | `src/lib/tobacco-product-identity/` | Exact identity resolution без fuzzy |
| Canonical Catalog Identity Persistence | `src/lib/catalog-identity/` | Persisted identity, validation, coverage, backfill |
| Expert Mix Knowledge Schema | `src/lib/expert-mix-knowledge/` | Typed expert mix records и privacy boundary |
| Excel Knowledge Import | `src/lib/expert-mix-knowledge-import/` | Read-only XLSX → staging → audit |
| Unresolved Identity Report | `src/lib/expert-mix-knowledge-import/unresolved-identity-report.ts` | Exact grouping и P0–P3 |
| Identity Decisions | `src/lib/tobacco-identity-decisions/` | Manual review, immutable decisions, apply/coverage/filter |
| Canonical Mix Scoring | `src/lib/canonical-mix-scoring/` | Resolution, effective profile, duplicate aggregation, confidence и scoring |
| Public-safe mapping | `src/lib/expert-mix-knowledge/public-mapper.ts`, `src/lib/tobacco-identity-decisions/public-safe-mapper.ts` | Удаление private/internal полей |
| Privacy audit | `src/lib/expert-mix-knowledge-import/privacy-auditor.ts`, decision public audit | Проверка утечек |

Registries возвращают readonly/deep-frozen данные. React-компоненты не содержат доменные формулы.

## 6. Data pipeline

Реализованный pipeline:

```text
data/hookah_mix_database.xlsx (read-only)
  -> XLSX reader
  -> sheet/header inspection
  -> raw rows
  -> normalization
  -> typed staging
  -> existing exact identity resolution
  -> validation
  -> immutable imported registries
  -> audit + public-safe output
  -> deterministic unresolved identity report
```

Реализованный как библиотечный API, но ещё не подключённый к UI/persistence pipeline:

```text
unresolved report
  -> P0/P1 review plan
  -> manual evidence + CONFIRMED
  -> decision validation
  -> immutable Decision Registry
  -> exact decision resolution/application
  -> existing resolver fallback
  -> coverage comparison + domain filters
```

Фактический decision layer содержит P1 batch 1 и P0 batches 1–6. После применения aggregate к real-workbook: 206 resolved, 58 manufacturer-only и 233 unresolved записей суммарно; components — 88/2/23, VERIFIED components — 87/1/9. Девять ambiguous/unresolved решений P0 batches 2, 4, 5 и 6 остаются неприменимыми. Import остаётся неизменным; решения применяются поверх staging по exact source identity. Canonical scoring integration выполнена в v0.3.3; номер следующей persistence/taxonomy итерации — `unknown`.

Действующий runtime pipeline v0.3.3:

```text
Prisma Flavor / workbook component
  -> exact authoritative identity resolution
  -> effective profile + provenance
  -> duplicate canonical aggregation
  -> Mix Profile -> Compatibility -> Recommendations
  -> predicted quality + confidence + data quality
```

Decision layer подключён к анализу и Result UI, но не записывается отдельными строками в PostgreSQL. Product sensory registry пока отсутствует; source profile/fallback остаётся основным числовым источником.

## 7. Workbook

- Локальный путь: `data/hookah_mix_database.xlsx`.
- Файл исключён из Git правилом `data/*.xlsx`.
- Workbook нельзя исправлять, пересохранять или нормализовать in-place.
- Последний подтверждённый SHA-256: `AFBEB062EF5B23AC0340E8D5F15AD9E20FF41A6892146915E8FC8BB1008E2E8B`.

Команды read-only проверки:

```bash
pnpm verify:expert-mix-knowledge-import "data/hookah_mix_database.xlsx"
pnpm report:unresolved-identities "data/hookah_mix_database.xlsx"
pnpm generate:tobacco-identity-review "data/hookah_mix_database.xlsx"
pnpm verify:tobacco-identity-decisions "data/hookah_mix_database.xlsx"
```

Verify scripts сравнивают SHA-256 до и после.

## 8. Последний real-workbook audit

Подтверждённые показатели:

### Tobacco (`ОСНОВНАЯ_БАЗА`)

- rows/imported: 384/384;
- `RESOLVED`: 43;
- `MANUFACTURER_ONLY`: 74;
- `UNRESOLVED`: 267;
- `AMBIGUOUS`: 0;
- invalid: 0.

### Mixes (`Mixes_Internal`)

- rows read: 42;
- imported: 41;
- `VERIFIED`: 37;
- `PARTIALLY_VERIFIED`: 2;
- `DISPUTED`: 2;
- invalid: 1.

### Components (`Mix_Components`)

- rows/imported: 113/113;
- `RESOLVED`: 0;
- `MANUFACTURER_ONLY`: 21;
- `UNRESOLVED`: 92;
- `AMBIGUOUS`: 0.

Наблюдавшиеся validation issue codes:

- `IDENTITY_NOT_FOUND`;
- `IDENTITY_MANUFACTURER_ONLY`;
- `DOMAIN_VALIDATION_FAILED` — одна invalid mix row;
- `PERCENT_SUM_ROUNDING` — известен warning для округления;
- `WEIGHT_SUM_MISMATCH` — известны противоречивые source weights.

Точные количества остальных duplicate/source/identity warning codes в handoff не подтверждены: `unknown`; при необходимости получить их повторным verify, не переписывая workbook.

Privacy audit: public privacy issues = 0; ratings не превращаются в observations, tag-derived values остаются категориальными, preliminary inference остаётся `LOW`.

## 9. Unresolved identity report

Последний подтверждённый report:

- components: 113;
- catalog: 384;
- exact-normalized groups: 403;
- P0: 76;
- P1: 20;
- P2: 15;
- P3: 292;
- manufacturer известен Registry: 152 groups;
- product line известна: 43 groups;
- exact alias candidates: 148 groups;
- missing `productLine`: 208 groups.

Группировка: exact normalized `manufacturer + productLine + productName`. Fuzzy matching отключён. Report не создаёт и не назначает canonical ID.

## 10. Identity и provenance rules

Обязательно сохранять:

1. `НАШ` и `Dogma` — разные manufacturers.
2. `НАШ / Лаванда` нельзя объединять с `Dogma / Крымская лаванда`.
3. Совпадение вкусового слова не является identity evidence.
4. `UNRESOLVED`/`AMBIGUOUS` не получают guessed canonical ID.
5. Exact manufacturer alias подтверждает только manufacturer, не product.
6. `productLine` нельзя придумывать или автоматически выделять из составных значений.
7. Фиктивные lines `default`, `unknown`, `main`, `base` запрещены.
8. Confirmed product может иметь `productLineId = null` только при доказанном `CONFIRMED_NONE`.
9. `RESOLVED` требует `CONFIRMED`, evidence, confidence, canonical manufacturer/product и корректный deterministic ID.
10. P2/P3 нельзя применять в v0.3.2.
11. Catalog facts, real observations и external ratings — разные provenance types.
12. Tag-derived data остаётся категориальной и не создаёт точные sensory values.
13. Preliminary inference всегда `LOW`.
14. Collision/duplicate/conflict не разрешаются выбором «лучшего» кандидата.
15. `canonicalProductId` является ASCII-only; Unicode допустим только как ключ legacy lookup, не как публичный или новый canonical ID.

## 11. Privacy rules

Public output не должен содержать:

- авторов, блогеров, reviewer names, каналы;
- private URLs и private evidence references;
- internal notes, reviewer notes, evidence excerpts/IDs;
- локальные пути и содержимое `.env`;
- workbook row numbers или workbook SHA;
- внутренние source IDs.

Публично допустимы canonical identity, общий evidence type, confidence, status и public-safe aliases.

## 12. Локальные файлы вне Git

Перенести отдельно безопасным приватным способом:

- `data/hookah_mix_database.xlsx`;
- `reports/unresolved-identity-report.md`;
- `reports/unresolved-identity-report.json`;
- `reports/tobacco-identity-review-p0-p1.md`;
- `reports/tobacco-identity-review-p0-p1.json`;
- `reports/tobacco-identity-review-p0-p1.csv`;
- `reports/v0.3.3-canonical-mix-scoring-audit.json`;
- будущие review/audit reports;
- `.env` — только приватно, содержимое не публиковать.

`reports/`, `data/*.xlsx` и `.env` исключены из Git. Зависимости, `.next` и generated Prisma Client переносить не нужно.

## 13. Подключение другого аккаунта Codex

```bash
git clone https://github.com/baastard666/hookah-mix.git
cd hookah-mix
git fetch --all
git switch feature/v0.3.3-canonical-mix-scoring-integration
git pull --ff-only
git rev-parse HEAD
git status
pnpm install
```

Затем:

1. Приватно поместить workbook в `data/hookah_mix_database.xlsx`.
2. Создать `.env` по `.env.example`, не копируя его в Git.
3. Запустить PostgreSQL: `docker compose up -d`.
4. Выполнить:

```bash
pnpm exec prisma validate
pnpm prisma:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify:expert-mix-knowledge-import "data/hookah_mix_database.xlsx"
pnpm verify:tobacco-identity-decisions "data/hookah_mix_database.xlsx"
```

5. Прочитать `docs/handoff/CODEX_HANDOFF.md`, `docs/architecture/`, `docs/adr/README.md`, `docs/engine-changelog/README.md` и `docs/roadmap/README.md`.

Если `node`, `pnpm` или Docker отсутствуют, окружение нового аккаунта/машины — `unknown`; настроить их отдельно, не добавляя runtime paths в репозиторий.

## 14. Next Task — готовый блок

Актуальный блок:

```text
Проект: hookah-mix
Ветка: feature/v0.3.3-canonical-mix-scoring-integration
Начальный HEAD: 4186ae8ef1e7b994ed25f62885f4043969f6b192

Задача: провести отдельный финальный review v0.3.3 и решить, готова ли feature-ветка к merge.

Проверить:
- authoritative Registry остался 96 решений со статусами 86/1/7/2;
- exact-only resolution, profile precedence и duplicate aggregation;
- predicted score/confidence/data quality/verified score не смешиваются;
- real-workbook diagnostic и SHA;
- 838 tests, build, 12 verify scripts и HTTP smoke baseline;
- public privacy и отсутствие workbook/reports в Git.

Не менять identity decisions, Prisma schema и workbook без отдельного задания.
Не выполнять merge в main без явного подтверждения владельца.
Следующая продуктовая итерация после review: unknown.
```

Исторический блок v0.3.2 ниже оставлен только для трассировки и не является текущим заданием:

```text
Проект: hookah-mix
Ветка: feature/v0.3.2-canonical-tobacco-catalog-expansion
Implementation baseline до ASCII-миграции: 8b727298c9470bda73ba9e0e2b6133dc2434e675
Фактический HEAD: проверить git rev-parse HEAD (должен включать CODEX_HANDOFF.md).

Задача: начать v0.3.3 — Product Flavor Taxonomy Foundation.

Цель:
- сначала найти и полностью прочитать отдельное ТЗ v0.3.3;
- сохранить exact-only identity, privacy и provenance contracts v0.2.7–v0.3.2;
- не подключать taxonomy к UI/persistence без прямого требования;
- не переоткрывать завершённые P0/P1 decisions без отдельного evidence-backed задания.

Перед началом:
- проверить branch, HEAD и clean status;
- проверить SHA-256 workbook;
- подтвердить исходный review plan P0=76, P1=20, USER_PRIORITY=3 и versioned decisions P1=20, P0 batches 1–5 по 15 и batch 6 из 1 решения;
- прочитать ADR-012 и architecture document;
- не выполнять web research без отдельного явного разрешения.

Запрещено:
- fuzzy/Levenshtein/AI guessing;
- auto-resolution по вкусовому слову или manufacturer alias;
- массовое подтверждение P0/P1;
- изменение P2/P3;
- придумывание productLine или sensory properties;
- изменение Prisma/UI/workbook/main.

Финальный отчёт должен включать:
- branch, commit, push и clean status;
- рассмотренные groupIds без private evidence details;
- confirmed/unresolved/ambiguous/rejected counts;
- coverage before/after и deltas;
- conflicts/collisions/invalid decisions;
- privacy, determinism, immutability и validation results;
- подтверждение неизменности workbook и отсутствия merge в main.
```

## 15. Validation baseline

Последний подтверждённый baseline v0.3.3:

- 838/838 tests, 24 files; из них 26 новых canonical scoring tests;
- Prisma validate/generate, lint, typecheck и production build: passed;
- все 12 `verify:*`: passed;
- HTTP smoke `/`, `/catalog`, `/builder`, `/result/20`: 200;
- Registry/collision/exact alias/ASCII/transliteration/legacy/privacy audits: passed;
- conflicts/collisions/invalid decisions/Unicode IDs/transliteration collisions: 0;
- real-workbook scoring: 37 mixes, 97 components, scoring/privacy errors 0;
- workbook SHA до/после совпал: `AFBEB062EF5B23AC0340E8D5F15AD9E20FF41A6892146915E8FC8BB1008E2E8B`.

Последний подтверждённый baseline текущей ветки v0.3.2 после P0 batch 6:

- 812 tests passed, 23 test files;
- новых ASCII policy tests: 50;
- новых P0 batch 1 tests: 38;
- новых P0 batch 2 tests: 25;
- новых P0 batch 3 tests: 26;
- новых P0 batch 4 tests: 27;
- новых P0 batch 5 tests: 32;
- новых P0 batch 6 tests: 13;
- Prisma validate: passed;
- Prisma generate: passed;
- lint: passed;
- typecheck: passed;
- production build: passed;
- real-workbook import verify: passed;
- unresolved identity report verify: passed;
- `verify:tobacco-identity-decisions`: passed;
- targeted Tobacco Identity Decisions Vitest: 312/312, 9 files;
- все 11 `verify:*` scripts: passed;
- Registry: 96 decisions, 86 resolved, 7 ambiguous, 1 manufacturer-only, 2 unresolved; applied/skipped = 163/17;
- workbook SHA до/после verify совпал;
- privacy, immutability и deterministic checks: passed.

ASCII migration baseline после успешной проверки следует читать в `docs/engine-changelog/v0.3.2-ascii-canonical-product-ids.md`: 34 authoritative ID проверены, 12 Unicode ID мигрированы, 18 legacy mappings, collisions/conflicts/invalid IDs = 0. Фактическое итоговое число тестов и commit необходимо сверять по последнему отчёту/HEAD.

Исторический baseline после unresolved report в v0.3.1: 500 tests. Baseline после ASCII-стандартизации: 689 tests; после P0 batch 2: 714 tests; после P0 batch 3: 740 tests; после P0 batch 4: 767 tests; после P0 batch 5: 799 tests; после P0 batch 6: 812 tests.

## 16. Known issues

- Без decision layer исходная coverage остаётся низкой: components имеют 0 resolved, 21 manufacturer-only, 92 unresolved.
- После aggregate P1 + P0 batches 1–6: components 88 resolved, 2 manufacturer-only, 23 unresolved; VERIFIED components 87/1/9. Batch 6 не меняет coverage, поскольку решение `AMBIGUOUS`.
- В 208 exact groups отсутствует `productLine`; отсутствие линии не всегда ошибка.
- Исходный review plan по-прежнему генерируется как 99 `UNREVIEWED`; отдельно в versioned registry сохранены 20 P1 decisions, по 15 decisions в P0 batches 1–5 и 1 ambiguous decision в batch 6. Все 76 P0-групп имеют authoritative outcome.
- Есть одна invalid mix row (`DOMAIN_VALIDATION_FAILED`).
- Есть `PERCENT_SUM_ROUNDING` warning.
- Есть contradictory source weights (`WEIGHT_SUM_MISMATCH`).
- Точные количества части warning codes: `unknown` без нового audit run.
- Workbook и reports существуют только локально.
- Decision layer подключён к scoring/API/Result UI, но отдельная persistence-модель Registry отсутствует.
- Canonical product sensory registry пуст; для многих входов используется source profile или нейтральный fallback.
- В 37 VERIFIED workbook-миксах отсутствуют verified smoke scores; все 37 оценок diagnostic являются predicted-only.
- Runtime environment нового аккаунта и его локальные credentials: `unknown`.

## 17. Non-goals без отдельного задания

- Prisma schema и migrations;
- PostgreSQL structure и seed;
- полный редизайн UI или конструктора;
- переписывание Recommendation/Compatibility Engine;
- изменение identity decisions ради score distribution;
- изменение workbook;
- fuzzy resolution;
- выдумывание sensory characteristics;
- web research;
- merge в `main`.

## 18. Glossary

- **Manufacturer** — канонический производитель с `manufacturerId`.
- **Product Line** — отдельная подтверждённая линейка производителя; может отсутствовать.
- **Canonical Product ID** — стабильный ASCII-only ID продукта по ADR-013.
- **Legacy Canonical Product ID** — прежний Unicode ID, разрешённый только для lookup/migration compatibility.
- **Source identity** — исходная тройка manufacturer/productLine/productName.
- **Decision** — ручное решение по source identity.
- **Evidence** — проверяемое основание решения с type/confidence.
- **CONFIRMED** — review state, разрешающий применение валидного decision.
- **MANUFACTURER_ONLY** — известен производитель, конкретный продукт не подтверждён.
- **UNRESOLVED** — данных недостаточно.
- **AMBIGUOUS** — есть несколько допустимых точных вариантов.
- **P0** — unresolved-компоненты VERIFIED-миксов.
- **P1** — manufacturer-only компоненты VERIFIED-миксов.
- **P2** — остальные компоненты.
- **P3** — каталог, не встречающийся в миксах.
- **USER_PRIORITY** — отдельная ручная очередь трёх приоритетных продуктов.
- **Public-safe** — DTO без private/internal provenance.

## 19. Handoff checklist

- [ ] Репозиторий клонирован из правильного remote.
- [ ] Выполнены `git fetch --all` и checkout актуальной feature-ветки.
- [ ] HEAD и implementation baseline сверены.
- [ ] `git status` чистый.
- [ ] `.env` настроен приватно.
- [ ] Workbook помещён в `data/` и его SHA-256 проверен.
- [ ] Workbook и reports подтверждены как ignored.
- [ ] Dependencies установлены.
- [ ] Prisma validate/generate проходят.
- [ ] Lint, typecheck, tests и build проходят.
- [ ] Real-workbook verify проходит без изменения SHA.
- [ ] ADR-012, ADR-013, architecture, changelog и roadmap прочитаны.
- [ ] P0/P1/USER_PRIORITY counts сверены.
- [ ] Никакие identity не подтверждаются без evidence.
- [ ] Privacy audit проходит.
- [ ] P2/P3, Prisma, UI, workbook и `main` не изменены без отдельного задания.
