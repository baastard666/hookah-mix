# ADR-006: Единый orchestration layer анализа

## Status
Accepted

## Context
UI не должен знать порядок вызова независимых аналитических движков.

## Decision
Полный конвейер Profile → Compatibility → Recommendation инкапсулирован в `calculateMixAnalysis`. UI использует эту единую точку; движки не зависят от UI.

## Consequences
Последовательность единообразна и тестируема. Service остаётся тонким и не содержит бизнес-правил.

## Alternatives considered
Прямые вызовы движков из Result page отклонены из-за дублирования orchestration. Объединение движков в один модуль отклонено из-за нарушения границ ответственности.
