# Mix Analysis v2 для Verified Mix Recipes

## Назначение

`src/lib/verified-mix-analysis/` — read-only composition layer между `VerifiedMixRecipe` и существующим `calculateMixAnalysis`. Он не создаёт второй scoring, compatibility или recommendation engine.

```text
VerifiedMixRecipe
  -> buildCanonicalMixInputFromVerifiedRecipe
  -> Tobacco Identity Decision Registry + Product Flavor Profile Registry
  -> CanonicalMixComponentInput[]
  -> calculateMixAnalysis
  -> VerifiedRecipeAnalysis (public-safe DTO)
```

Главный source-of-truth числовых свойств для recipe analysis — `ProductFlavorProfileRegistry`, а не demo/source `Prisma Flavor`. Код не использует Prisma Client и работает без PostgreSQL.

## Adapter

Для каждого exact `canonicalProductId` adapter требует `RESOLVED` решение в `TobaccoIdentityDecisionRegistry`. Из него берутся canonical manufacturer, line и product name. Повторный fuzzy resolution и display-name identity не используются.

`ProductFlavorProfile.dimensions` преобразуется только в семь существующих полей `FlavorProfile`:

- `sweetness -> sweetness`;
- `sourness -> acidity`;
- `freshness -> freshness`;
- `intensity -> intensity`;
- `strength -> strength`;
- `heatResistance -> heatResistance`;
- `juiciness -> juiciness`.

Остальные 11 полей остаются `null`. Adapter не подставляет `5`. Canonical product candidate имеет стабильный `profileId` вида `canonical:<canonicalProductId>` и source `CANONICAL_PRODUCT_PROFILE`. LOW/MEDIUM/HIGH confidence преобразуется общей таблицей reliability 35/65/90; VERIFIED recipe не повышает reliability.

`dominantNoteIds` создают только generic category notes (`BERRY`, `MINT` и подобные): это не утверждение о конкретной ягоде или вкусе. Source profile отключён (`sourceProfileAvailable: false`), поэтому Prisma profile не может случайно победить registry. Технический manufacturer/line profile по-прежнему подключается через существующий `buildEffectiveTobaccoProfile` как дополнение для отсутствующих product dimensions.

## Честность evidence

`proportionConfirmed` и `independentEvidenceCount` передаются из recipe без изменений. Наличие статуса VERIFIED не создаёт independent evidence, bonus к quality или confidence. `verifiedSmokeScore` передаётся только при фактическом нормализованном numeric rating; в текущих 28 recipes такого значения нет.

Result разделяет:

- `predicted`: score, confidence, compatibility, risks и predicted recommendations;
- `observed`: реальный smoke score/evaluation, если они фактически есть.

Source-stated component role, recorded role и engine-inferred role не смешиваются. Движок сейчас не вычисляет подтверждённую текущую роль компонента, поэтому `inferredRole` остаётся `null`.

## Public DTO и audit

`calculateVerifiedRecipeAnalysis(recipe)` возвращает public-safe recipe, существующие результаты движков, компактный flavor summary, component contributions, coverage и explainability. Из него исключены `sourceRecordId`, evidence IDs, source rows, workbook paths, private URL, decision IDs и debug data.

`createVerifiedMixAnalysisAudit(recipes)` и `pnpm verify:verified-mix-analysis` проверяют все eligible recipes, детерминизм, сумму процентов, privacy boundary, NaN/Infinity и SHA-256/размер workbook до и после. Локальные `reports/verified-mix-analysis-audit.{json,md}` ignored.

## Результаты текущего audit

На текущем real workbook: 28 recipes, 71 компонент, 100% exact identity и Product Flavor Profile coverage. Во всех recipes часть из 18 полей отсутствует и остаётся `null`; это ожидаемо, так как registry хранит evidence-backed только 7 измерений. Все результаты predicted-only: `proportionsConfirmed = 0`, independent evidence = 0, verified smoke score = 0.

Распределение score и рисков диагностируется, но не меняет weights, compatibility relations или confidence weights в этой итерации. Следующий продуктовый шаг при отсутствии отдельного blocker — каталог `/mixes` и `/mixes/[slug]` поверх этого DTO.
