# ADR-026: readiness публичного прогноза качества

## Контекст

`predictedQualityScore` детерминированно рассчитывается даже тогда, когда части его блоков исключены из среднего из-за отсутствующих измерений. Gold Set v1 показал, что точное распознавание JENT и совместимость его категорий могут существовать при нулевой сенсорной информации. Это не является достаточным основанием показывать число качества пользователю.

## Решение

Введён отдельный чистый слой `prediction-readiness`. Он не меняет scoring и не использует identity coverage как сенсорное доказательство.

`sensoryEvidenceCoverage` (также `scoreEvidenceCoverage` для диагностик) — средневзвешенная по доле компонентов полнота семи Registry-полей: strength, heatResistance, intensity, sweetness, acidity, juiciness, freshness. У компонента это `measured fields / 7`, затем значения взвешиваются его процентом.

- `INSUFFICIENT`: нет осмысленных сенсорных измерений либо отсутствует один из критических scoring-блоков `componentQuality`/`balance`.
- `LIMITED`: критические блоки есть, но покрытие ниже policy-порога.
- `READY`: критические блоки есть и взвешенное покрытие не меньше 50%.

Порог определён константой `PUBLIC_QUALITY_READINESS_POLICY.minimumWeightedSensoryFieldCoverage`. Он означает минимум эквивалента четырёх из семи полей на взвешенном составе, а не скрытый UI-threshold. Тесты фиксируют sparse JENT, identity-only, partial и fully measured случаи.

При `READY` public quality равен internal `predictedQualityScore`; в других состояниях public quality равен `null`. Совместимость вкусовых направлений, распознавание, известные риски и реальный покур выводятся отдельными осями. Будущая реальная smoke observation может быть передана в readiness без новой БД-схемы, но в этой итерации не создаётся.

## Последствия

Внутренние формулы, веса, recommendation/risk logic и Registry не меняются. В sparse случаях UI честно показывает доступную совместимость, но не подменяет её числом качества.
