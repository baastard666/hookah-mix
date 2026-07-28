# ADR-023: NEUTRAL_FALLBACK больше не подменяет значение поля числом — null доходит до конца пайплайна

## Context

Диагностика (без реализации, отдельная сессия) показала: `buildEffectiveTobaccoProfile` при отсутствии измерения подставлял **число `5`** прямо в значение поля профиля (`neutralProfile()`), помечая источник как `NEUTRAL_FALLBACK` только в `reliabilityScore` (15). Это фальшивое «5» текло дальше как настоящее измерение через весь пайплайн: `prepareCanonicalMix` → `calculateMixProfile` → `analyzeProfileBalance`/`analyzeIntensityBalance` (**balance**, 15% веса, и одновременно часть **compatibility**, 25% веса) → `componentQuality()` (**componentQuality**, 20% веса).

Уже существующие `!== null` guard'ы в этих функциях (написанные специально под ADR-015/017 «null≠0») **никогда не срабатывали на живом пути** — к моменту проверки null уже не было нигде, он был заменён числом на предыдущем шаге. Эмпирически на выборке 13 реальных пар: **~48% полей `componentQuality` и ~44% полей `balance`** были фиктивным `5`, а не измерением.

Второй, отдельно обнаруженный эффект: `5` — это ровно «безопасная середина» большинства балансных threshold-правил (`sweetness 4–8 & acidity 3–7`, `freshness/juiciness умеренные` и т.д.), поэтому fallback систематически генерировал **ложные позитивные факторы** (`profile.sweet-sour-balance`, `profile.fresh-juicy`, `profile.dessert-balance`) даже когда оба компонента — чистый fallback, а не совпадение вкусов.

## Decision

### 1–2. NEUTRAL_FALLBACK передаёт `null`, а не число; частичное среднее — уже существующим кодом

`buildEffectiveTobaccoProfile` ([build-effective-tobacco-profile.ts](../../src/lib/canonical-mix-scoring/build-effective-tobacco-profile.ts)): при переборе кандидатов для поля fallback-кандидат исключён из поиска ЗНАЧЕНИЯ (`candidate.type !== "NEUTRAL_FALLBACK"`); если реального кандидата нет — `value: null`, `source: "NEUTRAL_FALLBACK"`, `reliabilityScore: 15` (как и раньше). `EffectiveParameter.value`/`EffectiveTobaccoProfile.strengthLevel5` стали `number | null`.

Никакого нового «частичного среднего» писать не пришлось — `calculateWeightedProfile` (`calculate-weighted-profile.ts`, ADR-015/017) уже корректно исключает `null` из числителя и знаменателя. Баг был не в логике агрегации, а в том, что она никогда не получала настоящий `null`.

### 3. Edge case «0 реальных полей» — компонент/бакет исключается из веса, а не считается нулём

Новый `weightedPartial()` в `calculate-canonical-mix-score.ts`: как `weighted()`, но компонент без единого измеренного поля исключён из числителя И знаменателя взвешенного среднего (а не считается как `0`). Если **ни один** компонент микса ничего не измерил — `componentQuality` возвращает `null` целиком.

Для `balance` (составлен из `profileBalance`/`intensityBalance` — оба построены на пороговых правилах, а не на прямом среднем, поэтому не могут сами сообщить «у меня нет данных») введена `hasAnyProfileField(mix)` — истина, если хотя бы один компонент хотя бы одно из 18 полей реально измерил. Если ложь — `balance: null`.

Когда `componentQuality`/`balance` — `null`, они **исключены из `predictedQualityScore` целиком**, а не заменены нейтральным значением: веса остальных активных компонентов (`compatibility`/`proportions`/`risks`/`confirmations`) перенормированы пропорционально — тот же приём, что ADR-022 уже применил к `calculateMixConfidence`. `confirmations` по явному указанию не тронут (сам никогда не становится `null`, но участвует в перенормировке как получатель освободившегося веса — как и остальные).

### 4. Ложные "Сильные стороны" — устранены автоматически починкой 1–2, без отдельного механизма

Проверено: `analyzeProfileBalance`/`analyzeIntensityBalance` уже требуют `!== null` для каждого читаемого поля (ADR-015/017). Как только `calculateWeightedProfile` реально получает `null` вместо `5` для компонента, у которого поле не измерено, при том что и второй компонент тоже не измерил это поле, — итоговое агрегированное значение становится `null` (не «5»), и правило корректно не срабатывает. Отдельного признака «это реальное значение или fallback» на уровне правил вводить не понадобилось — единственная причина, по которой правила раньше путали fallback с измерением, была устранена в самом источнике данных.

## UI/аудит: обработка nullable `componentQuality`/`balance`

- `src/app/result/[id]/page.tsx`: блок «Из чего складывается оценка» показывает «нет данных» вместо пустого значения.
- `src/lib/mix-result-presentation/index.ts`: `scoreExplanation` возвращает отдельное честное объяснение для `null`, не пытаясь сравнивать его с порогами silne/weak.
- `src/lib/canonical-mix-scoring/workbook-audit.ts`: `null` исключён из `breakdownDistribution`-статистики, а не считается нулём.

## Diagnostic: до/после на 13 реальных парах

| Пара | score до→после | componentQuality до→после | balance до→после | «Сильные стороны» (было → стало) |
|---|---|---|---|---|
| **Chabacco Cider + Vanilla Cream** | 7.6→7.7 | 5.8→7.0 | 9.0→8.4 | dessert-balance, fresh-juicy, sweet-sour-balance → **(нет)** |
| Sarma Лаванда + Daily Сливки | 7.6→7.6 | 5.8→6.0 | 8.6→8.6 | dessert-balance → dessert-balance |
| Overdose Coffee + HIT | 8.1→8.2 | 7.2→7.6 | 8.6→8.6 | dessert-balance → dessert-balance |
| **Sarma Суфле + Лимонад** | 7.6→7.9 | 5.6→**null** | 8.7→8.3 | dessert-balance, fresh-juicy, sweet-sour-balance → **sweet-sour-balance** |
| Element + Sebero (контроль, без fallback) | 7.5→7.5 | 7.3→7.3 | 8.3→8.3 | fresh-juicy → fresh-juicy (не изменилось) |
| Крем + Wildberry Mors | 7.7→7.7 | 5.9→6.5 | 8.7→8.3 | dessert-balance, fresh-juicy, sweet-sour-balance → **sweet-sour-balance** |
| Sarma Персик + Daily Сливки | 7.6→7.6 | 5.8→6.0 | 8.6→8.6 | dessert-balance → dessert-balance |
| Overdose Coffee + Wildberry Mors | 7.6→7.6 | 6.6→6.7 | 8.3→8.3 | sweet-sour-balance → sweet-sour-balance |
| **Лимонад + Daily Крем** | 7.5→7.8 | 5.9→8.0 | 8.7→8.1 | dessert-balance, fresh-juicy, sweet-sour-balance → **(нет)** |
| **Apple + Jelly** | 7.9→8.2 | 6.7→8.8 | 9.0→8.6 | dessert-balance, fresh-juicy, sweet-sour-balance → **sweet-sour-balance** |
| Element + Джин | 7.5→7.5 | 6.3→7.0 | 8.4→8.1 | (нет) → (нет) |
| HIT + Daily Крем | 7.8→⚠️ | 6.5→⚠️ | 8.3→⚠️ | см. «Побочная находка» ниже |
| Sebero + Melon | 7.9→7.9 | 7.0→8.3 | 8.8→8.3 | fresh-juicy, sweet-sour-balance → **fresh-juicy** |

**5 из 13 пар потеряли хотя бы один ложный позитивный фактор** (три из них — сразу все 3 разом: Cider+Vanilla Cream, Лимонад+Daily Крем). `componentQuality` в среднем заметно выросло там, где раньше половина полей была fallback (Apple+Jelly 6.7→8.8, Лимонад+Крем 5.9→8.0) — фальшивая «5» раньше тянула реальные высокие оценки вниз. `Sarma Суфле+Лимонад` — единственная пара, где `componentQuality` стал `null` целиком (у обоих компонентов не было ни одного измеренного из 5 полей); `predictedQualityScore` при этом не упал, а даже немного вырос (7.6→7.9) — перевзвешивание убрало искусственно заниженный вклад несуществующих данных, а не наказало микс за их отсутствие.

## Побочная находка: обнаружен несвязанный, ранее не проявлявшийся баг

Диагностика пары **HIT Banana Shake + Daily Hookah Сливочный крем** после фикса упала с ошибкой валидации `Сумма должна быть 100%, получено 95` — не из-за ADR-023 напрямую, а из-за того, что новые (более честные) `componentQuality`/`balance` изменили набор рекомендаций, и предложенный вариант впервые задел уже существующий баг в `calculate-mix-analysis.ts` (`compareProposal`): `proposedInput` ищет процент по `percentages.get(String(component.flavorId))`, используя СЫРОЙ (до-канонический) `flavorId` исходного компонента, тогда как `variant.components[].componentId` — это КАНОНИЧЕСКИЙ id после `prepareCanonicalMix` (например `"daily-hookah-slivochnyi-krem"`). Для любого `RESOLVED`-товара, чей канонический id отличается от сырого числового `flavorId`, поиск не находит совпадения, доля остаётся старой, и сумма процентов предложенного варианта перестаёт равняться 100.

Это не создано этой сессией — баг был в коде и раньше, просто раньше не было признанного (`accepted`) варианта, который заденет несовпадающий id для ЭТОЙ конкретной пары. Не исправлял — вне объявленного объёма ADR-023 (`calculate-mix-analysis.ts`, не `build-effective-tobacco-profile.ts`). Отмечено отдельной задачей.

## Alternatives considered

- **Оставить `componentQuality`/`balance` = 0 для «нет данных вовсе».** Отклонено: именно эта проблема (ADR-015/017 «null≠0») уже была явно решена для всех прочих осей проекта; ставить компонент в 0/10 из-за отсутствия данных вводит в заблуждение больше, чем сам факт нехватки данных.
- **Не перевзвешивать `predictedQualityScore`, оставить как есть с `null`-полем.** Отклонено технически: `Object.entries(...).reduce(sum + value*weight)` со значением `null` дал бы `NaN`; перевзвешивание — минимальный, уже одобренный (ADR-022) способ корректно исключить бакет без порчи формулы.
- **Отдельный признак "reliable/fallback" на уровне analyzeProfileBalance для проверки п.4.** Отклонено: избыточно — корень проблемы устранён на уровне данных (п.1–2), пороговые правила и так уже написаны с `!== null`.
- **Исправить попутно найденный баг `compareProposal`.** Отклонено в рамках этой сессии — другой модуль, другой класс задачи, риск непредсказуемых побочных эффектов без отдельного анализа.

## Consequences

- `predictedQualityScore`/`componentQuality`/`balance` больше не занижены и не «сглажены» фиктивными данными — диапазон оценок для смесей с частично неизмеренными табаками стал шире и честнее отражает реальную полноту данных.
- Три позитивных фактора (`sweet-sour-balance`/`fresh-juicy`/`dessert-balance`) перестали срабатывать как артефакт двух fallback-значений — теперь требуют хотя бы одного реального измерения с каждой стороны сравнения.
- `MixScoreBreakdown.componentQuality`/`balance` стали `number | null` — публичный тип изменился; UI и аудит-скрипт обновлены под null.
- Обнаружен и задокументирован (не исправлен) отдельный баг в `calculate-mix-analysis.ts`: сопоставление предложенного варианта процентов по сырому `flavorId` вместо канонического id — актуален для любого `RESOLVED`-товара, не только связан с этой ADR.
- Тесты: обновлена 1 существующая проверка, ожидавшая старое значение `5` (`canonical-mix-scoring.test.ts`), добавлено 5 новых тестов (fallback-исключение на уровне компонента/микса, `null` целиком, перевзвешивание `predictedQualityScore`, отсутствие ложных factors на паре из двух `UNRESOLVED` без данных). Vitest **1086/1086 passed, 32 файла**; `tsc --noEmit`/`eslint .` — чисто.
