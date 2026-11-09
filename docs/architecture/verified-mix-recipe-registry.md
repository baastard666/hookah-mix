# Verified Mix Recipe Registry

## Назначение

`src/lib/verified-mix-recipe/` — read-only runtime-проекция готовых рецептов поверх существующего `ExpertMixKnowledgeRecord`. Это не вторая база рецептов и не замена import pipeline: исходная knowledge record остаётся source-of-truth для provenance, source privacy, observations и evidence.

```text
Excel (read-only)
  -> ExpertMixKnowledge import
  -> exact Tobacco Identity Decisions adapter
  -> strict eligibility
  -> VerifiedMixRecipeRegistry
  -> Verified Mix Analysis composition layer
  -> будущие /mixes UI consumers
```

Реестр подключён к существующему `calculateMixAnalysis` только через отдельный read-only composition layer `src/lib/verified-mix-analysis/` (ADR-027). Он не меняет ни оценок, ни весов, ни существующих compatibility relations и не подключён к интерфейсу.

## Строгая пригодность

В runtime-реестр попадает только запись, одновременно удовлетворяющая всем условиям:

1. `recordKind === "MIX"` и `status === "VERIFIED"`;
2. есть не менее двух компонентов;
3. каждый компонент имеет `identityStatus === "RESOLVED"` и `canonicalProductId`;
4. каждый ID существует в `TobaccoIdentityDecisionRegistry` и его decision status — `RESOLVED`;
5. `proportions.type === "PERCENT"`, у каждого компонента точный `PERCENT`, а сумма равна 100 с существующим `PERCENT_EPSILON`;
6. один `canonicalProductId` не повторяется внутри рецепта.

`APPROXIMATE_PERCENT`, `PARTS`, `ORDER_ONLY`, `UNKNOWN`, unresolved/ambiguous/manufacturer-only identity и повтор canonical product не нормализуются «для удобства». Они остаются в исходном `ExpertMixKnowledge` и получают typed skip reason в audit.

## Exact identity adapter

Импортёр не переписывается: он по-прежнему создаёт `ExpertMixKnowledgeRecord` из staging. `applyIdentityDecisionsToExpertMixKnowledge` сопоставляет импортный компонент по исходной точной тройке manufacturer/product line/product name и накладывает только подтверждённое решение из `TobaccoIdentityDecisionRegistry`. Без fuzzy matching, без alias guessing и без изменения Excel.

## Модель и честные метаданные

`VerifiedMixRecipe` содержит только нужные runtime-полю:

- внутренний `sourceRecordId`, стабильный непубличный `recipeId`, title, exact components и tags;
- подтверждённые preparation/evaluation, если они есть;
- `verification`: `proportionsConfirmed`, `proportionEvidenceCount`, `independentEvidenceCount`, признаки internal test и observed reaction.

`proportionsConfirmed` становится true только для точной PERCENT-записи с evidence `PROPORTION_STATEMENT` или `INTERNAL_TEST_RESULT`. Несколько evidence от одного top-level source не являются независимыми подтверждениями: текущая schema разрешает evidence только того же `sourceId`, поэтому `independentEvidenceCount` честно остаётся 0, пока не появится модель нескольких независимых источников.

Числовой rating нормализуется только из фактических шкал: 5 → ×2, 10 → без изменения, 100 → ÷10. Qualitative verdict хранится отдельно и не превращается в выдуманную оценку.

Отсутствующие bowl/HMD/угли/warmup не заменяются дефолтами.

## API и неизменяемость

`createVerifiedMixRecipeRegistry(records, decisions)` валидирует и глубоко замораживает внутренние данные. Query API возвращает новые deeply frozen copies:

- `getVerifiedMixRecipe`, `hasVerifiedMixRecipe`, `listVerifiedMixRecipes`;
- поиск по exact canonical product ID и normalized tag;
- `findVerifiedMixRecipesContainingProducts`: все переданные exact ID должны быть в рецепте; порядок не важен, повторы нормализуются, пустой список возвращает `[]`.

## Public boundary

`mapVerifiedMixRecipeToPublic` удаляет `sourceRecordId`. Public DTO не содержит source/evidence IDs, excerpts, internal labels, private URLs, workbook rows или локальные пути. `auditPublicVerifiedMixRecipes` служит regression-проверкой этого контракта.

## Реальный audit

`pnpm verify:verified-mix-recipes "data/hookah_mix_database.xlsx"` использует существующий read-only import, дважды проверяет детерминизм, сверяет SHA-256/размер workbook до и после и создаёт только ignored локальные файлы:

- `reports/verified-mix-recipe-audit.json`;
- `reports/verified-mix-recipe-audit.md`.

Последний audit исходного workbook дал: 41 ExpertMix records, 37 VERIFIED MIX candidates, 28 eligible runtime recipes и 9 skipped. Skip reasons: 7 ambiguous components, 2 unresolved, 1 manufacturer-only, 3 approximate proportions и 1 percent-total mismatch (одна запись может иметь несколько причин). У 28 eligible recipes 71 component и 71 unique canonical product. В текущих imported records нет preparation, evaluation, numerical/qualitative rating, exact proportion evidence, independent evidence, internal test evidence и observed reaction evidence — это наблюдение о данных, не повод подставлять значения.

## Границы

Реестр не создаёт Prisma model/migration, не меняет seed, каталог, Tobacco Identity Decisions, Excel или UI. Product Flavor Profile Registry используется новым analysis adapter как canonical sensory source; сам registry не переписывается. Future work: каталог `/mixes`, страницы рецептов, similar mixes и feedback.
