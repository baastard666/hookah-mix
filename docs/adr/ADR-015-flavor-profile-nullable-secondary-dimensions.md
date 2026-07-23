# ADR-015: nullable вторичные измерения `FlavorProfile` — `null` означает «не измерено», не `0`

## Context

ADR-014 зафиксировал целевую модель Product Flavor Profile Registry в 7 измерениях (`sweetness`, `sourness`, `freshness`, `intensity`, `strength`, `heatResistance`, `juiciness`) из 18 обязательных числовых полей Prisma `Flavor` (`strength`, `heatResistance`, `intensity`, `sweetness`, `acidity`, `cooling`, `creaminess`, `bitterness`, `dryness`, `juiciness`, `freshness`, `dessertLevel`, `spiceLevel`, `floralLevel`, `herbalLevel`, `smokyLevel`, `naturalness`, `persistence`), обосновав, что для остальных 11 полей у большинства товаров реального источника нет и не будет.

Последующая переоценка вопроса «импортировать ли 86 из 86 `RESOLVED`-продуктов в Postgres» подтвердила это эмпирически: во всём Product Flavor Profile Registry (86 продуктов, 271 заполненное измерение из 602 возможных) **нет ни одного значения ни по одному из этих 11 полей** — не «мало», а буквально ноль подтверждённых значений, и структурно это не изменится (ADR-014 уже объяснил почему: часть полей категорийно-узкие, `naturalness`/`persistence` вообще не вкусовые оси по существу). При этом сама Prisma-схема и тип `FlavorProfile` в `src/lib/flavors/types.ts` (`Record<FlavorProfileField, number>`) требуют для всех 18 полей обязательное число — вставить строку `Flavor` без выдумывания значений для этих 11 полей сегодня технически невозможно.

Эта переоценка также обнаружила: сколько реально модулей проекта читают эти 11 полей напрямую, и что именно в каждом из них молча ломается при появлении `null`, если разрешить `null` в схеме без аудита потребителей.

### Что окажется реальным потребителем, а что — нет

Полнотекстовый поиск по именам всех 11 полей дал 14 файлов-кандидатов вне тестов. После построчного чтения каждого подтвердились ровно **9 реальных потребителей** плюс сам тип. Пять кандидатов оказались ложными срабатываниями и не требуют никаких изменений:

- `src/lib/mix-compatibility/compatibility-rules.ts` — совпадение на локальной переменной `cooling`, которая на самом деле является селектором ноты (`{slugs:["mint"],categories:["COOLING"]}`), а не числовым полем профиля;
- `src/lib/flavor-knowledge/{category-relations,evidence,note-relations,note-taxonomy}.ts` — совпадение на именах категорий вкусовых нот (`COOLING`, `DESSERT`, `SPICE`, `HERBAL` и т.д. как строковые id категорий Flavor Knowledge Layer), которые не пересекаются с числовыми Prisma-полями ни по типу, ни по смыслу.

Отдельно **обнаружен один реальный потребитель, изначально не учтённый** в переоценке импорта: `src/lib/flavors/validate-flavor.ts`. Это не второстепенная деталь — это жёсткий валидатор (`Number.isFinite(value[field])` для всех 18 полей), который сегодня гарантированно отклонит любую запись с `null` в одном из 11 полей как невалидную («должен быть числом от 0 до 10»). Без изменения этого файла разрешить `null` в схеме бессмысленно: любой upsert (в том числе существующий `prisma/seed.ts`, который вызывает `validateFlavor` перед каждым upsert) немедленно упадёт.

### Почему нельзя просто разрешить `null` в схеме без аудита

JavaScript/TypeScript молча приводит `null` к `0` в арифметике и сравнениях: `null + 5 === 5`, `null * x === 0`, `null >= 6 === false`, но **`null < 3 === true`**. Это значит, что просто сделать поля `number | null` без правки потребителей не даст ошибку компиляции в большинстве мест (`number | null` не арифметический тип, но фактический JS-рантайм всё равно проглотит `null` в бинарных операторах без explicit-приведения TypeScript в нестрогом контексте, а часть выражений ниже и так не типизирована через строгий `FlavorProfile`, а читает поля Prisma-модели напрямую) — и превратит «не измерено» в «измерено и равно нулю/ниже порога» без единого сигнала об этом. Конкретные, уже найденные в текущем коде точки, где это произойдёт молча:

- `calculate-canonical-mix-score.ts` → `componentQuality()`: `(profile.naturalness + profile.persistence + profile.heatResistance + profile.juiciness + (10 - Math.abs(profile.intensity - 7))) / 5` — если `naturalness`/`persistence` станут `null`, сумма молча просядет, а формула по-прежнему поделит на фиксированные `5`, как будто оба слагаемых были измерены и равны нулю.
- `analyze-profile-balance.ts`, правило «плоский профиль»: `[sweetness,acidity,bitterness,creaminess,cooling,freshness,juiciness].every(value=>value<3)` — неизмеренные `bitterness`/`creaminess`/`cooling` (`null`) удовлетворяют `null < 3` и могут молча создать ложное предупреждение «профиль может получиться недостаточно выраженным» для микса, где эти оси просто не были измерены.
- `mix-result-presentation/index.ts`, публичная карточка `profile.metrics`: `metrics: (["strength","sweetness","acidity","freshness","creaminess","bitterness"] as const).map(key => ({ key, value: analysis.mixProfile.profile[key], displayValue: displayMetric(...) }))` — рендерит `creaminess`/`bitterness` пользователю как готовое число («5/10» или «ориентировочно 5/10») без единой проверки на `null`. Это самый заметный внешне риск: пользователь увидит выдуманную оценку там, где данных не было вовсе.
- `mix-analyzer.ts` (устаревший, но всё ещё используемый как `legacyAnalysis` внутри presentation) повторяет тот же паттерн независимо в своём `weighted()` и в `hasStrongCooling`/`hasStrongCream`/`bitterness`-проверках — то есть уязвимость дублирована в двух параллельных поколениях движка анализа, а не в одном месте.

Это и есть причина, по которой недостаточно просто снять `NOT NULL` в миграции — нужна явная, обязательная для каждого потребителя политика.

## Decision

1. **Схема.** Поля `Flavor.{cooling, creaminess, bitterness, dryness, dessertLevel, spiceLevel, floralLevel, herbalLevel, smokyLevel, naturalness, persistence}` становятся `Float?` (nullable) отдельной будущей миграцией. Семь полей ADR-014 (`strength`, `heatResistance`, `intensity`, `sweetness`, `acidity`, `juiciness`, `freshness`) остаются обязательными `Float` без изменений.

2. **Тип.** `FlavorProfileField` в `src/lib/flavors/types.ts` разделяется на два набора констант: `FLAVOR_PROFILE_CORE_FIELDS` (те же 7, что и в ADR-014, но под Prisma-именами: `strength`, `heatResistance`, `intensity`, `sweetness`, `acidity`, `juiciness`, `freshness`) и `FLAVOR_PROFILE_SECONDARY_FIELDS` (остальные 11). Итоговый тип: `FlavorProfile = Record<CoreField, number> & Record<SecondaryField, number | null>`. Важно: секондари-поля остаются **обязательными ключами** объекта со значением `number | null`, а не опциональными (`field?: number`). Опциональный ключ означает «поле может отсутствовать в объекте» — это молча ломает любой код, использующий `Object.keys`/`Object.entries`/`Object.values` по всему профилю (такой код уже есть в `analyze-profile-balance.ts` и `profile-recommendations.ts`, см. ниже), потому что отсутствующий ключ просто не появится в переборе. Явный `null` как значение — единственный вариант, который одинаково виден и точечному доступу (`profile.creaminess`), и generic-переборам.

3. **Политика `null`, обязательная для всех перечисленных ниже модулей без исключений:** `null` означает «для этого товара измерение не проводилось», и никогда не может быть подставлен, приведён или проинтерпретирован как `0`. Конкретно:
   - в суммах и взвешенных средних — `null`-слагаемые исключаются и из числителя, и из знаменателя (частичное среднее по фактически измеренным термам), а не заменяются нулём;
   - в пороговых правилах (`value >= X`, `value < X`) — при `null` правило не оценивается вообще («неприменимо/неизвестно»), а не «сработало false»;
   - в generic-переборе профиля (`Object.values`/`Object.entries`) — `null` отфильтровывается до применения любого числового предиката;
   - на любой презентационной поверхности, где значение одного из 11 полей должно быть показано пользователю как число — вместо числа явно рендерится состояние «не измерено» (конкретный текст/UI — на усмотрение реализации, но состояние обязано быть explicit, а не результатом арифметики над `null`).

4. **Существующие demo/seed-строки `Flavor` не трогаются.** Nullable ≠ обязан быть null — все текущие 16 demo-строк как имели значения по всем 18 полям, так и продолжают их иметь; `prisma/seed.ts` не требует изменений данных, только `validate-flavor.ts` должен продолжать пропускать их без ошибок (см. план по модулям).

5. **Эта ADR не решает** ни вопрос «импортировать ли 86 продуктов Product Flavor Profile Registry в Postgres сейчас», ни политику разрешения конкретно найденной коллизии `overdose-coffee` и почти-дубля `daily-hookah-slivochnyi-krem`. Она снимает только архитектурный блокер уровня схемы/типов, чтобы то решение впоследствии принималось отдельно, без необходимости одновременно решать вопрос nullability.

## План изменений по модулям (9 файлов + сам тип)

### 1. `src/lib/flavors/types.ts` — источник истины
Разделить `FLAVOR_PROFILE_FIELDS` на `FLAVOR_PROFILE_CORE_FIELDS` (7) и `FLAVOR_PROFILE_SECONDARY_FIELDS` (11); пересобрать `FlavorProfile` как пересечение двух `Record` с разными типами значений (см. п.2 решения). `FlavorProfileInput` наследует новую форму автоматически, изменений в его определении не требуется.

### 2. `src/lib/flavors/validate-flavor.ts` — жёсткий блокер, менять первым
Текущий цикл `for (const field of FLAVOR_PROFILE_FIELDS) if (!Number.isFinite(value[field]) || value[field] < 0 || value[field] > 10)` должен разделиться на два прохода: по core-полям — правило без изменений (обязательное конечное число 0–10); по secondary-полям — валидно, если значение `null`, **или** конечное число 0–10; ошибка — только если значение не `null` и не входит в диапазон (например, `NaN`, строка, отрицательное). Без этого изменения ни один upsert с `null` в одном из 11 полей не пройдёт валидацию ни сейчас, ни после миграции схемы.

### 3. `src/lib/mix-profile/from-prisma.ts` — маппер Prisma → `CanonicalMixComponentInput`
Чисто типовое следствие: `profile: {...}` уже перечисляет все 18 полей по одному (`cooling: flavor.cooling` и т.д.) — как только тип Prisma-клиента для этих 11 полей станет `number | null`, присвоение останется корректным без структурных правок самого маппера. Задача этого файла — не потерять `null` (не подставлять `?? 0` или любой другой дефолт при маппинге, что было бы прямым нарушением политики п.3).

### 4. `src/lib/canonical-mix-scoring/calculate-canonical-mix-score.ts` — `componentQuality()`
Переписать сумму `naturalness + persistence + heatResistance + juiciness + (10 - |intensity-7|)) / 5` на партиальное среднее: собрать список фактически применимых термов (среди которых `heatResistance`, `intensity` — всегда core, всегда числа; `naturalness`, `persistence` — потенциально `null`), исключить отсутствующие, делить на фактическое количество слагаемых, а не на константу `5`. Если после исключения `null` не осталось ни одного слагаемого (крайний случай — оба secondary-поля не измерены) — нужно явное решение, чем заменить пустое среднее (кандидат: опираться только на core-часть формулы; это отдельная деталь реализации, не решаемая в рамках ADR).

### 5. `src/lib/mix-compatibility/summary-tags.ts` — 7 пороговых тегов
`p.creaminess>=6`, `p.cooling>=6`, `p.dessertLevel>=6`, `p.spiceLevel>=6`, `p.herbalLevel>=6`, `p.floralLevel>=6`, `p.smokyLevel>=6` — каждая проверка должна получить explicit-guard `p.field !== null && p.field >= 6`. Тег не добавляется, если поле не измерено — то есть по факту то же поведение, что и сегодня, но результатом явной проверки, а не побочным эффектом приведения типов.

### 6. `src/lib/mix-compatibility/analyze-profile-balance.ts` — самый нагруженный модуль
Три группы изменений:
- десяток точечных пороговых правил (`bitterness>=T.highBitterness&&dryness>=...`, `dessertLevel>=T.high&&sweetness>=T.high&&creaminess>=...`, `cooling>=T.high`, `floralLevel>=8&&spiceLevel>=8`, `smokyLevel>=8&&freshness>=8`, `dryness>=7&&bitterness>=7` и т.д.) — каждое обращение к одному из 11 полей получает `!== null` guard по тому же принципу, что и summary-tags;
- generic-правило «много ярких направлений» (`Object.values(p).filter(value=>value>=8).length>=4`) — заменить на явный `Object.entries(p).filter(([,value]) => value !== null && value >= 8)`, чтобы фильтрация `null` была видимой строкой кода, а не побочным эффектом сравнения;
- generic-правило «плоский профиль» (`[sweetness,acidity,bitterness,creaminess,cooling,freshness,juiciness].every(value=>value<3)`) — это единственное место, где сегодняшнее поведение `null` реально опасно (`null < 3` истинно), а не просто неточно. Нужно явно разделить массив на core (всегда участвует) и secondary-элементы (участвуют только если не `null`) и решить, должно ли отсутствие данных вообще позволять сработать этому правилу — вероятно, нет, то есть при любом `null` среди перечисленных полей правило должно считаться неприменимым, а не автоматически "true".

### 7. `src/lib/mix-recommendation/profile-recommendations.ts`
`weightedContribution: source.profile[key] * source.percentage / 100` в `decreaseSource` — `key` ограничен объединением `"sweetness"|"cooling"|"bitterness"|"acidity"|"dryness"`, из которых `cooling`, `bitterness`, `dryness` — secondary. Нужен guard перед вычислением: если `source.profile[key] === null`, компонент не может быть выбран источником по этой характеристике (сегодня функция предполагает, что источник для `decreaseSource` уже гарантированно имеет числовое значение — `sourceComponentForCharacteristic`, судя по названию, ищет компонент именно по этой характеристике, так что при повсеместном `null` для конкретной характеристики во всём миксе вызывающий код тоже должен обработать этот случай, а не звать `decreaseSource` вслепую). Отдельно: `Object.entries(input.mixProfile.profile).filter(([, value]) => value >= 8)` (дважды, для `characteristicKeys` и для `action`) — та же правка, что и в п.6: explicit `value !== null && value >= 8`.

### 8. `src/lib/mix-recommendation/dominance-recommendations.ts` — минимальные изменения
Единственное упоминание secondary-поля — `characteristicKeys: accent ? ["floralLevel", "intensity"] : ["intensity"]` — это строковый идентификатор ключа для отчётности/локализации, а не числовое чтение `profile.floralLevel`. Функционально этот файл `floralLevel` не читает и не сравнивает — изменений в логике не требуется, только подтверждение (например, тестом), что строковый литерал `"floralLevel"` остаётся валидным ключом типа после разделения на core/secondary.

### 9. `src/lib/mix-result-presentation/index.ts` — самый заметный пользователю модуль
Два независимых места:
- `actualMixRoleFor`: `const cooling = component.profile.cooling >= 7` — определяет роль `SUPPORT_COOLING`/`ACCENT_COOLING` для UI. Нужен guard `component.profile.cooling !== null && component.profile.cooling >= 7`; при `null` компонент просто не получает холодящую роль (это соответствует текущему семантическому итогу, но должно стать explicit).
- `effectiveDirectionLabels`: `mix.mixProfile.profile.cooling >= 2 || ...component.profile.cooling >= 7` — та же правка.
- **Карточка `profile.metrics`** (строка с `["strength","sweetness","acidity","freshness","creaminess","bitterness"]`) — единственное место, где `creaminess`/`bitterness` уходят напрямую в пользовательский интерфейс как число. Здесь нужно продуктовое решение, а не только код: либо не включать secondary-поля в этот список метрик вовсе (тогда карточка показывает только core-измерения — самый простой и однозначно безопасный вариант), либо оставить их, но добавить в `displayMetric`/саму карточку explicit-состояние «нет данных» при `null` вместо вызова `displayMetric(null, ...)`, которая сегодня без всякой проверки на `null` посчитает `Math.round(null*2)/2` и покажет «0/10».

### 10. `src/lib/mix-analyzer.ts` — устаревший параллельный движок
`weighted()` типизирован по объединению `"strength"|"heatResistance"|"intensity"|"sweetness"|"acidity"|"cooling"|"creaminess"|"bitterness"`, из которых `cooling`, `creaminess`, `bitterness` — secondary. Внутри `weighted` — `items.reduce((sum, item) => sum + item.flavor[key] * item.percentage / 100, 0)` — тот же паттерн частичного среднего, что и в п.4/7: исключать `null`-компоненты из суммы и пересчитывать эффективный знаменатель (сумму процентов только измеренных компонентов), а не делить на общий вес микса. Отдельно точечные проверки `c.flavor.cooling >= 8`, `c.flavor.creaminess >= 8`, `bitterness >= 5` (для риска перегрева) — те же explicit-guards, что и везде выше. Поскольку это дублирующий, более старый движок, при аудите стоит явно зафиксировать (не обязательно в рамках этой ADR), не пора ли вывести его из эксплуатации, раз одна и та же логика требует одинаковой правки в двух местах независимо.

## Consequences

- Registry (`src/lib/product-flavor-profile/*`) не меняется этой ADR вообще — она про Prisma/`FlavorProfile`, не про registry-модель ADR-014.
- Любой код, который сегодня предполагает `FlavorProfile` как плоский `Record<string, number>` без различения core/secondary (например, будущие новые агрегации, если их писать по аналогии со старыми не глядя на этот документ), обязан явно решить вопрос `null` — тип это гарантирует на уровне компиляции для точечного доступа (`profile.cooling` будет иметь тип `number | null`, и `profile.cooling >= 6` без сужения типа не пройдёт строгую проверку TypeScript, если она включена для сравнений с `null`), но не гарантирует для generic-переборов (`Object.values`) — там дисциплину обеспечивает только явный код ревью и тесты, а не компилятор.
- 9 файлов из п. «План изменений» требуют реальной правки логики; ещё 1 (`dominance-recommendations.ts`) — не требует правки логики, но должен быть покрыт тестом, что ничего не сломалось.
- Демо-данные (`prisma/seed.ts`, 16 строк) остаются валидными без изменений после правки `validate-flavor.ts`.
- Открывает (но не решает) возможность в будущем частично импортировать Product Flavor Profile Registry в Postgres с честными `null` вместо выдуманных значений по 11 полям — отдельное будущее решение.

## Alternatives considered

- **Синтезировать нейтральные значения (например, midpoint 5) для 11 полей вместо `null`.** Отклонено: прямо нарушает принцип evidence-and-confidence (ADR-003) и саму мотивацию ADR-014 — выдуманная пятёрка неотличима ниже по стеку от реально измеренной пятёрки, то есть догадка навсегда превращается в предъявляемый факт.
- **Отдельная таблица/боковая структура «confidence по полю» вместо nullable-колонок.** Отклонено как избыточное усложнение: `null` уже означает ровно «нет данных», отдельный булев/enum-флаг на каждое из 11 полей не добавляет информации, которой не даёт сам факт `null`.
- **Вынести 11 полей в отдельную модель `FlavorSecondaryProfile` (join вместо nullable-колонок в той же таблице).** Отклонено на данном этапе: это больше по объёму схемного изменения, чем необходимо, а каждому из 9 модулей всё равно пришлось бы реализовывать ту же null-политику, только через join вместо прямого доступа к полю. Стоит пересмотреть отдельно, если появится реальная потребность эффективно выбирать «все товары с полными вторичными данными» именно на уровне SQL.
- **Не трогать схему до появления конкретного importer-скрипта, который в этом нуждается.** Рассмотрено и отклонено в рамках этой задачи: цель — решить схемный вопрос как самостоятельное, рецензируемое решение, отдельно от ещё не принятого решения об объёме импорта и политике коллизий с demo-данными (для которого нужен свой, отдельный ADR).

## Not covered by this ADR (explicitly out of scope)

- Решение «делать ли импорт 86 продуктов Product Flavor Profile Registry сейчас» и в каком объёме.
- Политика реконсиляции для уже найденной коллизии `overdose-coffee` (demo: `sweetness=3, heatResistance=7`; registry: `sweetness=6, heatResistance=9`) и смыслового почти-дубля `daily-hookah-slivochnyi-krem` (registry) против demo `Daily Hookah / Сливки`.
- Собственно применение этой ADR (написание кода, миграция Prisma, обновление 9 модулей) — эта сессия ограничена только документом-решением.
