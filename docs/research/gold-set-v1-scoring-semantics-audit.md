# Gold Set v1 + Scoring Semantics Audit

Дата аудита: 2026-11-11. Это исследовательский документ: production-формулы,
веса, Registry, Product Flavor Profiles, рецепты и UI не менялись.

## Scope и воспроизводимость

Команда `pnpm audit:mix-scoring-semantics` читает workbook и создаёт только
ignored-отчёты `reports/gold-set-v1-audit.json` и
`reports/gold-set-v1-simulations.json`. Она не пишет в PostgreSQL и не меняет
workbook. Fixture Gold Set находится в `src/lib/mix-scoring-audit/fixtures.ts`;
это public-safe детерминированные входы для проверки семантики, а не реальные
покуры и не оценки продуктов.

## Текущая семантика score

`predictedQualityScore` — это взвешенное среднее шести блоков:

| Блок | Базовый вес | Что считает сейчас | Чего не доказывает |
| --- | ---: | --- | --- |
| Compatibility | 0.25 | категориальные/нотные правила и риски совместимости | что микс объективно вкусный или понравится человеку |
| Proportions | 0.20 | отсутствие/наличие известных проблем распределения долей | что пропорции проверены покуром |
| Component quality | 0.20 | среднее по heat resistance, juiciness, близости intensity к 7, naturalness, persistence | реальное качество табака или пользовательскую оценку |
| Balance | 0.15 | rule-based баланс профиля и интенсивности | полный sensory-профиль, если его измерений нет |
| Risks | 0.10 | `10 − штраф за известные compatibility risks` | доказанное отсутствие рисков или безопасность |
| Confirmations | 0.10 | baseline 5 + признаки подтверждения пропорций/evidence | число фактических подтверждений при baseline 5 |

Если `componentQuality` или `balance` равны `null`, их веса не превращаются в
ноль: они исключаются, а остальные веса перенормируются. Это честнее, чем
трактовать unknown как low, но делает общий `/10` менее понятным: sparse mix
может получить высокий результат на оставшихся четырёх осях.

## JENT diagnostics и математика

Обе записи имеют exact identity 2/2, numeric sensory profile отсутствует,
`componentQuality = null`, `balance = null`, profile coverage = 15 и data quality
= `(100 + 15) / 2 = 57.5%`. Confidence сейчас равна
`100 × 0.55 + 15 × 0.45 = 61.75`, то есть `61.8` и label «Средняя».
Это объединяет два разных факта: identity известна хорошо, sensory evidence — нет.

При двух excluded blocks активный вес равен `0.65`. Эффективные веса:

| Блок | Базовый | Эффективный |
| --- | ---: | ---: |
| Compatibility | 0.25 | 0.3846 |
| Proportions | 0.20 | 0.3077 |
| Risks | 0.10 | 0.1538 |
| Confirmations | 0.10 | 0.1538 |

### Case A — Настойка Заморская 40% + Currant WOW 60%

| Блок | Значение | Вклад |
| --- | ---: | ---: |
| Compatibility | 8.0 | 3.0768 |
| Proportions | 8.0 | 2.4616 |
| Risks | 10.0 | 1.5380 |
| Confirmations | 5.0 | 0.7690 |
| **Итого** |  | **7.8454 → 7.8** |

`profile.flat` отсутствует после null-correctness patch. Warnings и conflicts
пусты. Это означает «не найдено правило риска», а не «доказано безопасно».

### Case B — Grape Me 40% + Currant WOW 60%

| Блок | Значение | Вклад |
| --- | ---: | ---: |
| Compatibility | 8.1 | 3.1153 |
| Proportions | 8.0 | 2.4616 |
| Risks | 10.0 | 1.5380 |
| Confirmations | 5.0 | 0.7690 |
| **Итого** |  | **7.8839 → 7.9** |

Вывод: пользователь не должен читать `7.8/10` или `7.9/10` как «вероятно
вкусный микс». Сейчас это структурная оценка известной совместимости,
пропорций и отсутствия известных рисков при бедных sensory-данных.

## Confidence и risk audit

Нужно разделить три публичные сущности:

1. **Identity confidence** — насколько точно определены продукты.
2. **Sensory evidence confidence** — насколько измерены их свойства.
3. **Recipe prediction confidence** — достаточно ли этих данных для прогноза
   конкретной смеси.

Текущий `profileCoverage` — средняя reliability источников, не доля измеренных
dimension; `dataQuality` — среднее identity/profile coverage. Поэтому высокая
identity coverage поднимает итог даже при пустом sensory profile. Label «Средняя»
для JENT не противоречит коду, но продуктово конфликтует с сообщением о
fallback для 100% смеси.

`riskScore = 10` означает только `knownRiskCount = 0`. Богато измеренный mix и
полностью пустой sensory mix получают одинаковые 10, если ни одно известное
правило не сработало. Это absence of negative evidence, а не positive evidence
of safety.

## Confirmation semantics

Текущая функция: `5 + 2 × proportionConfirmed + evidenceBonus`, где
`evidenceBonus = 0 / 0.5 / 1` для `0 / 1 / 2+` independent evidence.

| Proportions confirmed | Independent evidence | Score |
| --- | ---: | ---: |
| нет | 0 | 5.0 |
| нет | 1 | 5.5 |
| нет | 2+ | 6.0 |
| да | 0 | 7.0 |
| да | 1 | 7.5 |
| да | 2+ | 8.0 |

`5/10` — математический baseline, не пять подтверждений. Корректная будущая
семантика: отдельный evidence status («нет recipe evidence», «есть одно
независимое свидетельство», «пропорции подтверждены»), а не числовая карточка
«Подтверждения» без пояснения. Это предложение, не изменение runtime.

## Preparation claim audit

Текущая карточка «Приготовление» берёт текст из legacy `analyzeMix`, отдельного
от canonical scoring контура. Для неизвестных heatResistance/bitterness эти
условия пропускаются; при менее чем 4 углях и низком накопленном heat risk
legacy function возвращает generic «Текущий режим жара подходит; переставляйте
угли к краю…». Это не использует доказанную жаростойкость JENT и не является
evidence-backed утверждением о подходящем режиме.

| Claim | Required evidence | Current evidence | Supported? |
| --- | --- | --- | --- |
| «Текущий режим жара подходит» | heat resistance, bowl/packing/session evidence | legacy fallback + выбранные пользователем параметры | Нет, если heatResistance unknown |
| Рекомендация перейти на 3 угля | observed/technical heat evidence или явное heuristic disclosure | 4 угля в UI-опции | Частично: heuristic, не product fact |
| Прогрев | bowl, packing, heat resistance и наблюдение | только указанное пользователем время | Нет как product-specific claim |
| Риск горечи | bitterness/heat data или observed signal | rule only при измеренном значении | Только когда rule реально сработало |
| Перестановка углей | observed preparation evidence | generic fallback | Нет как evidence-backed claim |
| Bowl suitability | product + bowl + packing evidence | bowl type участвует только в legacy heat points | Нет |

## Presentation audit

Current UI уже локализует большинство category pairs; raw
`COMPLEMENTARY_CONTRAST` и `mint-generic` в public result не найдены.
Таблица — recommendation для будущего отдельного wording patch.

| Internal / current wording | Current UI | Recommended human label |
| --- | --- | --- |
| `COMPLEMENTARY_CONTRAST` | скрыт за парой human category labels | «Дополняющие направления» |
| `mint-generic` | не выводится; мята покрыта human label | «Мята» или «Освежающая мята» только при evidence |
| `neutral fallback` | «нейтральный резервный профиль» | «Недостаточно измерений для вкусового профиля» |
| `preliminary profile` | «предварительный профиль» | «Предварительная оценка профиля» |
| `risk resistance` | «Устойчивость к рискам» | «Известные риски» с явным статусом «не найдены / данных недостаточно» |
| `confirmations` | «Подтверждения» | «Данные о подтверждении рецепта» |

## Gold Set v1

18 scenarios покрывают rich compatible/risky, обе JENT-диагностики, sparse
identity with and without category relation, mixed coverage, all-null, measured
low/extreme values, small percentage, dominant/equal-bright components, known
conflict, no-known-conflict и четыре counterfactual варианта одной пары exact
JENT identities. Invariants, а не субъективные «правильные scores»:

- unknown не создаёт `profile.flat` и не становится low;
- measured low values всё ещё создают `profile.flat`;
- exact identity не создаёт sensory measurements;
- real negative rule создаёт negative signal;
- no known conflict не становится доказанной безопасностью;
- удаление evidence не должно создавать новый positive sensory claim;
- JENT cases сохраняют production scores 7.8 / 7.9.

Counterfactual full → partial → categories → identity сохраняет identity 100%;
изменяются profile coverage, active blocks, confidence и public disclosure.
Таким образом benchmark изолирует evidence loss от identity resolution.

## Audit 28 verified recipes

Read-only audit обработал 28 рецептов. Текущая шкала сжата:

| Metric | Min | P25 | Median | Mean | P75 | Max | SD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Predicted score | 7.2 | 7.6 | 7.8 | 7.8 | 8.0 | 8.2 | 0.28 |
| Compatibility | 7.3 | 7.8 | 8.0 | 8.1 | 8.3 | 8.9 | 0.37 |
| Profile coverage | 16.9 | 19.2 | 20.4 | 21.1 | 23.1 | 28.0 | 2.66 |
| Prediction confidence | 44.2 | 61.3 | 61.9 | 61.9 | 64.4 | 66.1 | 4.10 |

27 recipes имеют label «Средняя», один — «Предварительная». 25 рецептов имеют
все score blocks active, 3 — без componentQuality; profile reliability всё же
низкая у всего набора. Причины clustering: высокие base scores 7/8, небольшие
rule impacts, baseline risks=10 и confirmations=5, selection bias verified
recipes и renormalization для nullable blocks.

## Simulation options

Все варианты ниже research-only. Порог 50% — sensitivity probe, не выбранный
production threshold.

| Option | JENT A/B | 28 recipes | Pros | Cons |
| --- | --- | --- | --- | --- |
| A: current score + disclosure | score виден 7.8/7.9 | 28 scores | минимальная миграция | `/10` всё ещё легко прочитать как quality |
| B: suppress overall below profile gate | оба скрыты | 0/28 остаются при probe 50% | честнее при sparse evidence | выбранный порог нельзя принять без review |
| C: separate axes | compatibility/evidence видны, overall скрыт | 0/28 overall при probe | лучше отделяет knowledge от quality, готов к smoke calibration | нужна переработка public semantics |
| D: confidence-aware cap | 6.3/6.4 в симуляции | 5.6–6.7 | наглядно показывает uncertainty | смешивает estimate и confidence; не рекомендуется автоматически |

## Recommended semantic model

Предпочтителен **Concept 3 / Option C**: всегда показывать Compatibility,
Identity confidence, Sensory evidence и «Известные риски» как независимые оси.
Overall predicted quality `/10` следует показывать только после отдельного
утверждённого evidence gate. Gate должен опираться как минимум на
`scoreEvidenceCoverage` (доля исходных score axes с реальными данными),
dimension completeness и observed Gold Set, а не на произвольный один порог.

Option A допустим как краткий wording patch, но не устраняет смешение смысла.
Option D не рекомендован: понижать quality estimate из-за uncertainty — другое
утверждение, а не честное раскрытие неопределённости.

## Future observed smoke foundation

Conceptual, не внедрённая модель `UserSmokeObservation`: recipe/components и
percentages, canonicalProductIds, bowl, grams/packing style (если известны),
coals, warmup, session duration, perceived strength/sweetness/sourness/
freshness-cooling, dominant component, balance, overall rating,
repeatWouldSmoke, notes, timestamp и observation source/type. Поля могут быть
optional. Нужны три раздельных слоя:

`Canonical Product Evidence` ≠ `Expert Smoke Observation` ≠ `User Smoke Observation`.

Одна пользовательская запись не меняет identity, Product Flavor Profile,
compatibility rules или weights; для этого потребуется отдельный aggregation and
review layer. Будущее сравнение: predicted vs observed strength, dominant
component, sensory dimensions и overall rating. Overall rating субъективен и не
становится автоматически product truth.

## Первые JENT smoke tests

| Candidate | Before smoke capture | After smoke capture | Useful discrepancy |
| --- | --- | --- | --- |
| Настойка Заморская 40 + Currant WOW 60 | 7.8 structural score, categories, no numeric profile | strength, sourness, herbal/citrus balance, heat response | sparse score vs actual balance |
| Grape Me 40 + Currant WOW 60 | 7.9 structural score, fruit/mint/berry directions | mint/cooling presence, dominance, perceived freshness | category direction vs sensory intensity |
| Follar 35 + Currant WOW 65 | current prediction before smoking | herbal/floral integration, whether one direction is lost | category compatibility calibration candidate |
| Baba Au Savarin 40 + existing dairy/dessert catalog product 60 | current prediction before smoking | dessert texture, sweetness, heat tolerance | category claim vs actual dessert balance |

No row above is a VERIFIED recipe or an observed result.

## Decision boundary

После review владельца следующий отдельный patch может менять only approved
presentation/semantics. Эта итерация не начинает scoring calibration, Builder UX,
smoke feedback implementation или Batch 1B.
