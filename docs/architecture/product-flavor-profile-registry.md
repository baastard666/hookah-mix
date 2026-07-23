# Product Flavor Profile Registry

## Назначение

Product Flavor Profile Registry — независимый read-only справочник числовых вкусовых характеристик для уже разрешённых (`RESOLVED`) канонических продуктов из Tobacco Identity Decision Registry. Он не заменяет и не расширяет Flavor Knowledge Layer: там хранится таксономия категорий и нот, здесь — числовые измерения конкретного товара с evidence и confidence. В v0.3.5 registry не подключён к `calculateMixAnalysis`, scoring или UI.

Целевая модель измерений зафиксирована [ADR-014](../adr/ADR-014-product-flavor-profile-dimension-scope.md): ровно 7 измерений (`sweetness`, `sourness`, `freshness`, `intensity`, `strength`, `heatResistance`, `juiciness`) из 18 числовых полей будущей модели Prisma `Flavor` — только те, для которых существует реальный класс evidence (официальные страницы производителей, HTReviews, независимые обзоры). Остальные 11 Prisma-полей (`cooling`, `creaminess`, `bitterness`, `dessertLevel`, `spiceLevel`, `floralLevel`, `herbalLevel`, `smokyLevel`, `dryness`, `naturalness`, `persistence`) намеренно не входят в `FlavorDimensionId` — не как временно неиспользуемая опция, а как явно исключённые: при молчании источника присвоение им значения было бы угадыванием.

## Область охвата

Профиль создаётся только для `canonicalProductId`, у которого решение в Tobacco Identity Decision Registry имеет статус `RESOLVED`. Для `AMBIGUOUS`, `MANUFACTURER_ONLY` и `UNRESOLVED` профиль отсутствует по определению — по ним нет уверенности, что это тот же физический товар. Ссылки на `canonicalProductId` только точные; fuzzy matching, Levenshtein и сопоставление по похожести названий отсутствуют.

Продукты выбираются той же очередью приоритизации, что использовалась для P0/P1 identity decisions: сортировка по `verifiedMixCount` → `componentOccurrenceCount` → `occurrenceCount`, по убыванию. Эта тройка остаётся неизменным первичным критерием во всех батчах.

Батчи 1–2 (30 продуктов) при полном совпадении всех трёх метрик использовали tie-break по возрастанию `sourceGroupId`/`canonicalProductId`. Начиная с батча 3 вторичный tie-break явно кодифицирован в `src/lib/product-flavor-profile/priority-queue.ts` (`comparePriorityQueueCandidates`): при равенстве primary-метрик предпочтение отдаётся производителям с более богатыми официальными источниками — Tier 1 (`Darkside`, `Chabacco`, `MustHave`, `Sapphire Crown`, `Element`), затем Tier 2 (`Sebero`, `Overdose`, `Husky`, `Brusko`, `BlackBurn`), затем Tier 3 (все остальные, не исключаются); финальный tie-break — по возрастанию `canonicalProductId`. Сопоставление manufacturer → tier — точное нормализованное совпадение без fuzzy matching. Батчи 1–2 предшествуют этому правилу и не пересчитываются задним числом. Batch 3 полностью состоит из Tier 1 (`Chabacco`, `Element`, `MustHave`, `Sapphire Crown`) — среди 56 оставшихся `RESOLVED`-продуктов 46 имели одинаковые primary-метрики `1/1/2`, и tier-tie-break разрешил эту массовую ничью в пользу Tier 1 целиком. Batch 4 содержит последний оставшийся продукт Tier 1 (`sapphire-crown-mejumi`), весь Tier 2 (`Brusko`, `Husky`, `Overdose`) и начало Tier 3 (`Banger`, `Dozaj`, `Duft`, `Endorphin`, `FAKE`).

## Модель данных

```text
ProductFlavorProfile
  canonicalProductId  — точная ссылка на RESOLVED-решение
  dimensions          — Partial<Record<sweetness | sourness | freshness | intensity | strength | heatResistance | juiciness, FlavorDimensionValue>>
  dominantNoteIds     — ссылки на существующие категории Flavor Knowledge Layer
  overallConfidence   — не выше минимального confidence среди заполненных dimensions
```

Каждое заполненное измерение — это `{ value: 0..10, confidence, evidence[] }`. Отсутствующее измерение не получает выдуманное среднее значение: оно просто не включается в `dimensions`. Пустой объект `dimensions` — легитимное состояние для продукта без независимого вкусового описания; в этом случае `overallConfidence` равен `LOW`.

`richness` из исходной версии v0.3.5 переименован в `intensity` (ADR-014) — это было дублирующее имя одного и того же понятия «насыщенность вкуса»; переименование затронуло только ключ, значения и evidence не пересчитывались. `strength` и `heatResistance` добираются на уровне бренда/линейки там, где нет отдельного подтверждения для конкретного вкуса (жаростойкость — свойство обработки листа, обычно единое для линейки, поэтому такое переиспользование получает `MEDIUM`; крепость может отличаться между вкусами одного бренда, поэтому переиспользование на уровне бренда получает только `LOW`). `juiciness` заполняется только при прямом слове «сочный»/«juicy» в источнике — фруктовая нота сама по себе не считается доказательством.

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

- Покрыты 60 из 86-87 `RESOLVED` продуктов (батчи 1–4 по 15); остальные — предмет будущих итераций (batch 5+).
- Целевая модель — 7 из 18 будущих Prisma-полей `Flavor` (ADR-014); остальные 11 явно исключены из registry, а не отложены. Все 60 уже покрытых продуктов доведены до полной 7-полевой модели (208 из 420 возможных значений заполнено); для Hook и Husky `heatResistance` не найден ни для одного продукта во всех батчах, `juiciness` заполнен только там, где источник явно использует слово «сочный».
- Registry не подключён к Mix Profile, Compatibility, Recommendation, Canonical Mix Scoring или UI — это отдельная будущая интеграция.
- Flavor Knowledge Layer не расширен новыми категориями; `dominantNoteIds` используют только существующий список.
- Prisma schema, миграции и Tobacco Identity Decision Registry не изменены.
