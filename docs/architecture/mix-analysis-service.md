# Mix Analysis Service

Application-layer модуль принимает нормализованные `RecommendationComponentInput[]` и возвращает `MixProfileResult`, `MixCompatibilityResult`, `MixRecommendationResult` и компактный UI summary.

```text
Builder / Result data
        ↓
Mix Analysis Service
        ↓
Mix Profile Engine
        ↓
Compatibility Engine
        ↓
Recommendation Engine
        ↓
Result UI
```

Публичный API: `calculateMixAnalysis({ components }): MixAnalysisResult`. Вызовы выполняются последовательно через публичные exports. Ошибки валидации движков не скрываются. Service не содержит правил, не мутирует вход, не сохраняет данные и не зависит от React/Next.js.

Result page загружает существующий Mix, преобразует Prisma Flavor публичным адаптером и вызывает Service один раз. Knowledge Layer используется Recommendation Engine через его API; Service его напрямую не обходит. Ограничение: старый анализатор временно сохраняется отдельно для описания и рекомендаций по жару, которых новые движки пока не моделируют.
