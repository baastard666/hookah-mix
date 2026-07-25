# ADR-020: аудит подключения `CATEGORY_RELATIONS` (Step A) + evidence type для внутренней истории verified-миксов (Step B)

## Context

После ADR-019 пользователь запросил приоритизацию поиска новых правил совместимости на основе двух источников, уже присутствующих в проекте: (1) частота категорий среди 86 импортированных продуктов, (2) реальные пары категорий из 37 `status=VERIFIED` миксов `Mixes_Internal`/`Mix_Components` (исходный workbook), сопоставленные с полем `reaction_class`.

Диагностика вскрыла два отдельных, независимых вывода:

1. **Топ непокрытых пар по `freq(A)×freq(B)` включал пары, которые на самом деле уже ИМЕЮТ значение в `CATEGORY_RELATIONS`**, но никогда не были подключены через `createKnowledgeCategoryRule` — тот же класс проблемы, что уже был явно назван и исправлен для 21 пары ADR-019 и для 3 пар review-резолюции ADR-019 («запись в `CATEGORY_RELATIONS` без `createKnowledgeCategoryRule` не влияет на scoring вообще»). Программный аудит всех 46 записей `CATEGORY_RELATIONS` против фактически подключённых 26 пар нашёл **19 несвязанных non-NEUTRAL записей** — не 5, как в изначально данных примерах.
2. **37 verified-миксов дают реальную эмпирическую статистику** по 120 уникальным парам категорий (292 пары-вхождения), но 83 из 120 пар статистически слишком слабы (n=1-2). Для оставшихся пар — важная оговорка: **ни разу за всю историю `reaction_class` не был `negative`** (только `very_positive`/`positive`/`mixed`/`unknown`). Это ограничение выборки (37 миксов — это внутренние протестированные авторами рецепты, не репрезентативная случайная выборка всех возможных сочетаний), а не доказательство, что плохих сочетаний не бывает.

## Decision

### Step A — подключить 17 из 19 найденных несвязанных pre-existing записей (реализовано в этой сессии)

Значения и типы **не менялись** — только добавлены вызовы `createKnowledgeCategoryRule` в `src/lib/mix-compatibility/compatibility-rules.ts` для: `FRUIT+CITRUS`, `DESSERT+CREAMY`(→`DAIRY`), `COFFEE+CREAMY`(→`DAIRY`), `CHOCOLATE+NUT`, `BAKERY+VANILLA`, `TROPICAL+COOLING`, `FRUIT+FRESH`, `ALCOHOL+FRUIT`, `VANILLA+COFFEE`, `DESSERT+SOUR`, `FRUIT+SPICE`, `FLORAL+SMOKY`, `FLORAL+COOLING`, `SOUR+CREAMY`(→`DAIRY`), `HERBAL+DESSERT`, `MINT+CREAMY`(→`DAIRY`), `CANDY+SMOKY`.

**2 пары не могут быть подключены технически**: `TOBACCO+WOODY` и `TOBACCO+FRUIT`. `TOBACCO` — категория, существующая только в словаре `flavor-knowledge` (25 значений), но никогда не добавленная в legacy Prisma-enum `FlavorNoteCategory` (`toLegacyCategory("TOBACCO")` возвращает `undefined`) — потому что ни один продукт реестра никогда не использовал её в `dominantNoteIds`. `createKnowledgeCategoryRule` принимает аргументы именно в legacy-словаре (так они приходят из `MixProfileNoteResult.category` в реальном пайплайне), поэтому вызов физически невозможен без добавления `TOBACCO` в Prisma-enum — а расширять enum ради категории с нулевым текущим использованием не обосновано (тот же принцип, по которому ADR-018 расширяла enum только под реально используемые в registry категории).

Важно: среди 19 найденных были и уже существующие `RISKY`/`CONFLICT`-записи (`FLORAL+SMOKY`, `FLORAL+COOLING`, `SOUR+CREAMY`, `HERBAL+DESSERT`, `MINT+CREAMY`, `CANDY+SMOKY`) — они тоже подключены, поскольку это чисто механическая правка (значение не менялось, включая единственную во всей системе запись `CONFLICT` — `CANDY+SMOKY`, которая до этой сессии ни разу не влияла на реальный scoring).

### Step B — новый evidence type `VERIFIED_MIX_HISTORY` и 15 значений (реализовано — методология одобрена пользователем без изменений)

Добавлен `VERIFIED_MIX_HISTORY` в `KnowledgeEvidenceType` (`src/lib/flavor-knowledge/types.ts`/`constants.ts`) — отдельно от `AGGREGATED_RESEARCH` (внешние источники) и от `VERIFIED_TEST` (единственная контролируемая fixture-запись): это **собственная эмпирическая статистика** по 37 протестированным авторами миксам.

Три evidence-записи по уровню выборки (`src/lib/flavor-knowledge/evidence.ts`):

| Уровень | `evidenceId` | `weight` | n (число вхождений пары) |
|---|---|---|---|
| HIGH | `evidence.verified-mix-history.high` | `0.75` | n ≥ 10 |
| MEDIUM | `evidence.verified-mix-history.medium` | `0.55` | n = 5–9 |
| LOW | `evidence.verified-mix-history.low` | `0.35` | n = 3–4 |

Пары с n < 3 (83 из 120 найденных) исключены из рассмотрения полностью — статистически ненадёжны.

**Явная оговорка, зафиксированная в комментариях evidence-записей**: отсутствие `negative` в 37 миксах — свойство выборки (только внутренние тестовые рецепты авторов), а не доказательство отсутствия плохих сочетаний. Ни один порог в предложенной ниже методологии не присваивает `STRONG_MATCH` или `RISKY`/`CONFLICT` только на основании этой истории — максимум по типу связи, достижимый из `VERIFIED_MIX_HISTORY` в одиночку, это `GOOD_MATCH`, и только при самой высокой выборке и доле positive.

#### Методология (одобрена пользователем как есть)

Confidence-уровень (evidence weight) — по `n`, как в таблице выше. Тип связи — по уровню выборки И доле `positive` среди определённых реакций (`positiveRatio = positive / (positive + mixed)`, `unknown` исключён из расчёта доли, но не из `n`):

| Условие | Предлагаемый тип | `baseScore` |
|---|---|---|
| HIGH tier (n≥10) И `positiveRatio` ≥ 85% | `GOOD_MATCH` | `0.4` |
| HIGH tier И `positiveRatio` < 85% | `COMPLEMENTARY_CONTRAST` | `0.25` |
| MEDIUM tier (n=5–9) И `positiveRatio` ≥ 85% | `COMPLEMENTARY_CONTRAST` | `0.25` |
| MEDIUM tier И `positiveRatio` < 85% | `NEUTRAL` (не подключать) | — |
| LOW tier (n=3–4) И `positiveRatio` = 100% | `COMPLEMENTARY_CONTRAST` | `0.25` |
| LOW tier И `positiveRatio` < 100% | `NEUTRAL` (не подключать) | — |

Принципы: `GOOD_MATCH` доступен только при HIGH-выборке; ни при каких условиях эта методология не предлагает `STRONG_MATCH` (что не помешает пользователю решить иначе для конкретной пары) и никогда не предлагает `RISKY`/`CONFLICT` (в выборке физически нет отрицательного сигнала).

#### Таблица применённых значений для топ-15 непокрытых пар (n≥3, после Step A)

| Пара | n | positive/mixed/unknown | positiveRatio | Confidence | Предлагаемый тип |
|---|---|---|---|---|---|
| FRUIT+SOUR | 9 | 7/2/0 | 78% | MEDIUM | `NEUTRAL` (не подключать) |
| BERRY+FRUIT | 7 | 7/0/0 | 100% | MEDIUM | `COMPLEMENTARY_CONTRAST` (0.25) |
| FRUIT+TROPICAL | 9 | 9/0/0 | 100% | MEDIUM | `COMPLEMENTARY_CONTRAST` (0.25) |
| DESSERT+FRUIT | 10 | 7/2/1 | 78% | HIGH | `COMPLEMENTARY_CONTRAST` (0.25) |
| CANDY+FRUIT | 7 | 6/0/1 | 100% | MEDIUM | `COMPLEMENTARY_CONTRAST` (0.25) |
| COOLING+FRUIT | 3 | 3/0/0 | 100% | LOW | `COMPLEMENTARY_CONTRAST` (0.25) |
| CITRUS+CREAMY | 3 | 3/0/0 | 100% | LOW | `COMPLEMENTARY_CONTRAST` (0.25) |
| FRUIT+NUT | 7 | 4/2/1 | 67% | MEDIUM | `NEUTRAL` (не подключать) |
| CITRUS+SOUR | 4 | 4/0/0 | 100% | LOW | `COMPLEMENTARY_CONTRAST` (0.25) |
| BERRY+SOUR | 4 | 4/0/0 | 100% | LOW | `COMPLEMENTARY_CONTRAST` (0.25) |
| CANDY+CREAMY | 4 | 4/0/0 | 100% | LOW | `COMPLEMENTARY_CONTRAST` (0.25) |
| BERRY+TROPICAL | 5 | 5/0/0 | 100% | MEDIUM | `COMPLEMENTARY_CONTRAST` (0.25) |
| CITRUS+DESSERT | 4 | 3/0/1 | 100% | LOW | `COMPLEMENTARY_CONTRAST` (0.25) |
| BERRY+DESSERT | 3 | 3/0/0 | 100% | LOW | `COMPLEMENTARY_CONTRAST` (0.25) |
| CANDY+SOUR | 5 | 5/0/0 | 100% | MEDIUM | `COMPLEMENTARY_CONTRAST` (0.25) |

При этой методологии ни одна пара не достигает `GOOD_MATCH` (порог HIGH+85% не набирает ни одна из 15 — ближе всех `DESSERT+FRUIT` с n=10, но `positiveRatio` всего 78%). Это ожидаемый эффект намеренно консервативных порогов, а не ошибка — пороги можно и нужно обсудить и подстроить.

## Addendum: применение Step B (методология одобрена без изменений)

Пользователь одобрил таблицу и пороги как есть. Реализовано: 13 из 15 пар подключены через новый helper `verifiedHistory()` (`src/lib/flavor-knowledge/category-relations.ts`) и `createKnowledgeCategoryRule` (`src/lib/mix-compatibility/compatibility-rules.ts`), все с типом `COMPLEMENTARY_CONTRAST` (`0.25`) — ни одна пара не набрала HIGH-confidence + `positiveRatio`≥85%, необходимые для `GOOD_MATCH` по согласованной методологии. `FRUIT+SOUR` и `FRUIT+NUT` записаны как `NEUTRAL` (заметная доля `mixed` при `MEDIUM`-выборке) — по той же схеме, что и `CITRUS+SPICE` в ADR-019: сохранены для provenance, не подключены (`createKnowledgeCategoryRule` бросает исключение для `NEUTRAL`).

## Consequences

- Все 17 подключённых в Step A пар (включая единственную `CONFLICT`-запись `CANDY+SMOKY`) начинают реально влиять на `predictedQualityScore` — это может видимо изменить диапазон скоринга для миксов, где эти категории встречаются, без единой новой строчки данных.
- `VERIFIED_MIX_HISTORY` создаёт прецедент для будущего использования этой же выборки (37 миксов сейчас; вырастет по мере роста истории), не требуя заново решать вопрос типа evidence.
- 13 новых `COMPLEMENTARY_CONTRAST`-правил (`FRUIT` фигурирует в 6 из 13 — ожидаемо, доминирующая категория) теперь реально подключены к scoring; `FRUIT+SOUR` и `FRUIT+NUT` остались нейтральными и наблюдаемыми в реестре, но без эффекта.

## Alternatives considered

- **Присваивать `STRONG_MATCH` при 100% positive и достаточном n.** Отклонено явно по указанию пользователя: отсутствие `negative`-примеров — свойство ограниченной выборки, а не сильное доказательство; `STRONG_MATCH` зарезервирован для случаев, где есть либо очень большая выборка, либо независимое подтверждение из другого evidence type.
- **Понижать тип до `RISKY` при высокой доле `mixed`.** Отклонено: `mixed` — не то же самое, что `negative`; понижение до простого `NEUTRAL` (то есть «недостаточно уверенно, чтобы формулировать правило») честнее, чем изобретать риск, которого нет ни в одном примере.
- **Считать `unknown` как `negative` или `positive` для расчёта доли.** Отклонено: `unknown` буквально означает «реакция не классифицирована», у него нет содержательного знака; корректно исключать из `positiveRatio`, но учитывать в `n` (это часть подтверждённой, реально протестированной выборки, просто без итоговой оценки).
