# ADR-026: Verified Mix Recipe — runtime-проекция поверх ExpertMixKnowledge

## Контекст

`ExpertMixKnowledgeRecord` уже хранит source-specific знания о миксах, включая неполные пропорции, unresolved identity, source/evidence и privacy boundary. Одновременно ADR-021 показал, что `proportionConfirmed` и `independentEvidenceCount` нельзя честно подставлять в scoring без отдельного строго отфильтрованного слоя.

Создание второй вручную поддерживаемой базы «готовых рецептов» раздвоило бы provenance и создало риск расхождения с импортом Excel и identity decisions.

## Решение

1. `VerifiedMixRecipe` является immutable runtime-проекцией `ExpertMixKnowledgeRecord`, а не самостоятельной source-of-truth базой.
2. Eligibility намеренно строгая: только `MIX + VERIFIED`, минимум два компонента, exact `PERCENT` total 100, all `RESOLVED canonicalProductId`, каждый из которых подтверждён `TobaccoIdentityDecisionRegistry`; duplicate canonical components исключаются typed issue.
3. Approximate percentages, parts, order-only и unknown не превращаются в точные доли. Unresolved/ambiguous/manufacturer-only products также не угадываются.
4. Импортная identity может быть дополнена только отдельным exact decision adapter. Fuzzy matching отсутствует.
5. `VERIFIED` означает статус исходной записи, а не независимое подтверждение несколькими источниками. Нынешняя модель привязывает evidence к одному top-level source, поэтому `independentEvidenceCount` не получает фиктивную единицу и остаётся 0, пока не доказана независимость источников.
6. Rating нормализуется только при реально заданной числовой шкале 5/10/100. Qualitative verdict не получает число.
7. Public mapper удаляет provenance/internal fields. `sourceRecordId` допустим только во внутренней модели.
8. В этой итерации registry не влияет на scoring, confidence, recommendations и UI. Такое wiring требует отдельного решения на основе audit фактического покрытия.

## Последствия

- будущие consumers получают безопасный exact-only список рецептов и query API;
- data gaps остаются измеримыми в audit, а не скрываются дефолтами;
- Excel остаётся read-only import boundary;
- для публичного `/mixes` уже есть достаточный public-safe DTO, но сам UI не создан;
- ADR-024 уже занят explainability категориальных совпадений, поэтому этой архитектурной записи присвоен следующий свободный номер ADR-026.

## Альтернативы

- вручную скопировать 37 рецептов в новый batch — отклонено: потеря единого source/provenance;
- принимать approximate или parts и нормализовать — отклонено: это создало бы недоказанную математическую точность;
- считать один internal source независимым evidence — отклонено: это смешивает факт записи и внешнее подтверждение;
- сразу подключить метаданные к scoring — отклонено: до audit это стало бы фиктивным сигналом.
