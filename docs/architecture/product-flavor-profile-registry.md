# Product Flavor Profile Registry

## Назначение

Product Flavor Profile Registry — независимый read-only справочник числовых вкусовых характеристик для уже разрешённых (`RESOLVED`) канонических продуктов из Tobacco Identity Decision Registry. Он не заменяет и не расширяет Flavor Knowledge Layer: там хранится таксономия категорий и нот, здесь — числовые измерения `sweetness`, `sourness`, `freshness`, `richness` конкретного товара с evidence и confidence. В v0.3.5 registry не подключён к `calculateMixAnalysis`, scoring или UI.

## Область охвата

Профиль создаётся только для `canonicalProductId`, у которого решение в Tobacco Identity Decision Registry имеет статус `RESOLVED`. Для `AMBIGUOUS`, `MANUFACTURER_ONLY` и `UNRESOLVED` профиль отсутствует по определению — по ним нет уверенности, что это тот же физический товар. Ссылки на `canonicalProductId` только точные; fuzzy matching, Levenshtein и сопоставление по похожести названий отсутствуют.

Первый батч (15 продуктов) выбран той же очередью приоритизации, что использовалась для P0/P1 identity decisions: сортировка по `verifiedMixCount` → `componentOccurrenceCount` → `occurrenceCount`, по убыванию; при полном совпадении всех трёх метрик — по возрастанию `sourceGroupId` для детерминированности.

## Модель данных

```text
ProductFlavorProfile
  canonicalProductId  — точная ссылка на RESOLVED-решение
  dimensions          — Partial<Record<sweetness | sourness | freshness | richness, FlavorDimensionValue>>
  dominantNoteIds     — ссылки на существующие категории Flavor Knowledge Layer
  overallConfidence   — не выше минимального confidence среди заполненных dimensions
```

Каждое заполненное измерение — это `{ value: 0..10, confidence, evidence[] }`. Отсутствующее измерение не получает выдуманное среднее значение: оно просто не включается в `dimensions`. Пустой объект `dimensions` — легитимное состояние для продукта без независимого вкусового описания; в этом случае `overallConfidence` равен `LOW`.

## Evidence и confidence

Каждый источник помечен явным происхождением:

- `MANUFACTURER_CLAIM` — заявление производителя, прочитанное непосредственно с официального домена бренда;
- `REVIEW_AGGREGATE` — независимые обзоры и агрегаторы рейтингов (HTReviews, отзывы ритейлеров);
- `EDITORIAL_ASSESSMENT` — собственная числовая интерпретация доступного текстового описания, либо (в единичных случаях полного отсутствия независимого источника) осторожная оценка на основе самого подтверждённого названия продукта.

`HIGH` confidence не используется ни разу в этом батче: вкусовые измерения по своей природе субъективны, а не прямым однозначным заявлением производителя о составе или типе продукта, поэтому потолок — `MEDIUM` (правило подтверждено `verify:product-flavor-profile`). `LOW` присваивается там, где независимый источник отсутствует или найден только через агрегированный поиск без прямой проверки страницы.

## Публичная граница

`mapProductFlavorProfileToPublic` возвращает копию профиля без поля `reference` внутри evidence — наружу уходят только `type`, `title` и `checkedAt`. Raw registry (`PRODUCT_FLAVOR_PROFILE_REGISTRY`) не экспортируется из `src/lib/product-flavor-profile/index.ts`; публичный доступ — только через `getProductFlavorProfile`, `listProductFlavorProfiles`, `hasProductFlavorProfile` и `mapProductFlavorProfileToPublic`. Внутренний registry глубоко заморожен; query-функции возвращают отдельные глубоко замороженные копии.

## Валидация

При построении registry (`registry.ts`) весь набор профилей проходит `validateProductFlavorProfiles`, которая проверяет:

- существование и статус `RESOLVED` каждого `canonicalProductId` в `TOBACCO_IDENTITY_DECISION_REGISTRY`;
- диапазон `0..10` и непустой `evidence` для каждого заполненного измерения;
- `overallConfidence` не выше минимального confidence среди заполненных измерений (при их отсутствии — `LOW`);
- принадлежность каждого `dominantNoteId` к реальным категориям `FLAVOR_KNOWLEDGE_REGISTRY.categories`;
- отсутствие дублей `canonicalProductId` в самом registry.

Любое нарушение выбрасывает типизированную `ProductFlavorProfileError` при загрузке модуля — невалидный registry не может быть импортирован.

## Границы v0.3.5

- Покрыты только 15 из 86-87 `RESOLVED` продуктов (первый приоритетный батч); остальные — предмет будущих итераций.
- Registry не подключён к Mix Profile, Compatibility, Recommendation, Canonical Mix Scoring или UI — это отдельная будущая интеграция.
- Flavor Knowledge Layer не расширен новыми категориями; `dominantNoteIds` используют только существующий список.
- Prisma schema, миграции и Tobacco Identity Decision Registry не изменены.
