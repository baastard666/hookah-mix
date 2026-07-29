# ADR-024: показать пару категорий, через которую сработала связь

## Context

Диагностика (без изменений в коде) показала: `dominantNoteIds` не несёт веса/приоритета — любая назначенная продукту категория может дать срабатывание `category.*`-правила, и пользователь не видит, через какую именно пару категорий это произошло (пример: Belgian Cider + Vanilla Cream → `COMPLEMENTARY_CONTRAST` через `category.creamy-fruit`, то есть DAIRY(Vanilla Cream)+FRUIT(Belgian Cider), а не что-то более «очевидное»). Отдельный масштабный прогон (все 93×92/2 пары живого каталога) показал: **87.4% пар дают хотя бы одно категориальное совпадение, и 98.3% таких пар неоднозначны** (хотя бы у одного из двух товаров есть другая категория, через которую тоже могло бы сработать что-то). Решение зафиксировано отдельно — нужен явный UI-механизм объяснения «сработало через X+Y», без изменения самого Compatibility Engine.

## Decision

Не менять `category-relations.ts`/`knowledge-adapter.ts`/scoring — `ruleId` и категории уже корректно вычисляются. Добавить только presentation-слой: новое поле `matchedCategoryPairs` в `buildMixResultPresentation` + tooltip в `page.tsx`, по паттерну ADR-022 (CSS-only, `role="tooltip"`, hover/focus).

### Находка при разведке (Шаг 1), важная для реализации

1. **`presentation.strengths` уже дедуплицирует и режет до 3.** `mix-result-presentation/index.ts:250` (до правки): `[...new Map(analysis.compatibility.positiveFactors.map(item => [item.category, item.description])).values()].slice(0, 3)` — группировка идёт по `item.category` (это `AnalysisCategory`: `"NOTE_COMPATIBILITY"|"PROFILE_BALANCE"|...`, а не вкусовая категория!). Все `category.*`-правила живут в ОДНОМ ведре `"NOTE_COMPATIBILITY"`, поэтому если сработало 2+ таких правила, до `page.tsx` доезжает только ОДНО (последнее по порядку). Это значит: `matchedCategoryPairs` нельзя строить поверх уже готового `strengths` — нужно независимо сканировать полный `analysis.compatibility.positiveFactors` заново, иначе часть сработавших пар останется невидимой даже для нового механизма.
2. **Категории в `NOTE_COMPATIBILITY_RULES` — в legacy-пространстве, не knowledge.** `createKnowledgeCategoryRule("DAIRY", "FRUIT")` (не `"CREAMY"`) — это подтверждено прямо в файле для `category.creamy-fruit`. А `categoryLabels` (Шаг 3) типизирован под knowledge-`FlavorNoteCategory` (`CREAMY`, не `DAIRY`). Прямой `categoryLabels[rule.left.categories[0]]` дал бы `undefined` для DAIRY/DRINK-пар. Нужна конвертация через уже существующий `toKnowledgeCategory()` (`flavor-knowledge` модуль) — маппинг DAIRY→CREAMY/DRINK→BEVERAGE, остальные identity-названы.
3. **`ruleId` нигде не доходит до `page.tsx` до этой правки** (`findstr "ruleId" src\app\result\[id]\page.tsx` — 0 совпадений) — подтверждено, требовалось расширение возвращаемого типа, как и предполагалось в постановке.
4. **`docs/adr/`, `types.ts` в `mix-result-presentation` не существовали** на момент начала работы — ADR-024 создаётся этим же изменением; типы `mix-result-presentation` объявлены прямо в `index.ts` (отдельного `types.ts` в модуле нет).

### Реализация

- **`src/lib/flavor-knowledge/category-labels.ts`** (новый файл) — `categoryLabels: Record<FlavorNoteCategory, string>`, перенесён без изменений из `src/app/result/recommendation-presentation.ts`. Причина переноса: `src/app/result/recommendation-presentation.ts` — файл уровня `app` (не `lib`), и импорт из `src/lib/mix-result-presentation` в `src/app/*` инвертировал бы принятую в проекте слоистость (`lib` не должен зависеть от `app`), даже не будучи формальным циклом. `src/app/result/recommendation-presentation.ts` теперь ре-экспортирует `categoryLabels` из нового модуля — существующие импортёры (включая тест) не менялись.
- **`src/lib/flavor-knowledge/index.ts`** — добавлен экспорт `categoryLabels` из нового файла.
- **`src/lib/mix-result-presentation/index.ts`**:
  - Новый тип `MatchedCategoryPair = { left: FlavorNoteCategory; right: FlavorNoteCategory; ruleId: string }` (knowledge-пространство).
  - Модульного уровня `ruleCategoryPair: Map<ruleId, {left,right}>` — построена один раз из `NOTE_COMPATIBILITY_RULES`, с конвертацией `toKnowledgeCategory` на обеих категориях.
  - Внутри `buildMixResultPresentation`: `matchedCategoryPairs` — независимый скан **полного** `analysis.compatibility.positiveFactors` (не через `strengths`) по `ruleId.startsWith("category.")`, без ограничения на одно «доминирующее» правило (п.2 ADR-024).
  - Добавлено в возвращаемый объект как `matchedCategoryPairs`.
- **`src/app/result/[id]/page.tsx`**: в секции «Сильные стороны» — если `presentation.matchedCategoryPairs.length > 0`, добавлен CSS-only tooltip-бейдж (паттерн один в один с `confidence-tooltip` из ADR-022): при наведении/фокусе показывает список `"{categoryLabels[left]} + {categoryLabels[right]}"` по одному на каждый элемент `matchedCategoryPairs`, включая все сработавшие правила разом (не только одно). Confidence самого правила (HIGH/MEDIUM/LOW/SINGLE_PRODUCT_MARKETING) не показывается — это про качество evidence-подтверждения связи, а не про то, какие категории совпали (вне вопроса, который решает эта ADR).
- **`globals.css`**: классы `.category-match-tooltip`/`.category-match-badge`/`.category-match-tooltip-content`, скопированы из `.confidence-tooltip`-блока.

### Дизайн-решение по неоднозначной формулировке спецификации

Спецификация допускала два прочтения: (а) один общий tooltip на весь список «Сильные стороны», либо (б) отдельный tooltip на каждый конкретный пункт списка. Выбран вариант (а) — один общий tooltip, показывающий ВСЕ сработавшие категориальные пары сразу, а не привязанный к конкретному `<li>`. Причина: `strengths` (сам список пунктов) уже дедуплицирован (см. находку №1) и не находится в взаимно-однозначном соответствии с полным списком сработавших правил — привязка tooltip к конкретному `<li>` создала бы иллюзию точности там, где сам список уже нечестно свёрнут. Тест из Шага 5 (`matchedCategoryPairs` как отдельное, плоское поле верхнего уровня) также согласуется именно с этим прочтением.

## Alternatives considered

- **Отдельный tooltip на каждый `<li>` в «Сильные стороны».** Отклонено: `strengths` уже теряет часть сработавших правил через дедупликацию по `AnalysisCategory`; привязка к конкретному пункту списка либо потребовала бы менять существующую (рабочую, вне скоупа) логику дедупликации, либо создала бы несоответствие между тем, что видно в списке, и тем, что в tooltip.
- **Показывать RISKY/CONFLICT-категориальные срабатывания тем же механизмом.** Отклонено для этой итерации — вне заявленного скоупа (только `COMPLEMENTARY_CONTRAST`-подобные позитивные бейджи), они уже показываются отдельно через «Риски».
- **Показывать confidence-тир правила (HIGH/MEDIUM/LOW/SINGLE_PRODUCT_MARKETING) в tooltip.** Отклонено — явно исключено постановкой (п.1 ADR-024).

## Consequences

- Presentation-модель `mix-result-presentation` получила новое публичное поле `matchedCategoryPairs`; тип `MixResultPresentation` (`ReturnType<typeof buildMixResultPresentation>`) обновился автоматически.
- `categoryLabels` теперь имеет единственный источник правды (`src/lib/flavor-knowledge/category-labels.ts`); `recommendation-presentation.ts` — тонкий ре-экспорт, существующие импорты не потребовали правок.
- Compatibility Engine (`category-relations.ts`, `knowledge-adapter.ts`, `compatibility-rules.ts`, scoring) не изменён.
- Не добавлено новых risky-правил, не тронут каталог.
