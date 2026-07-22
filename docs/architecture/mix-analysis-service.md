# Mix Analysis Service

Application-layer модуль принимает `CanonicalMixComponentInput[]`, разрешает identity и effective profile, затем возвращает canonical mix, `MixProfileResult`, `MixCompatibilityResult`, `MixRecommendationResult`, scoring result и компактный UI summary.

```text
Builder / Result data
        ↓
Mix Analysis Service
        ↓
Canonical identity + effective profile + duplicate aggregation
        ↓
Mix Profile Engine
        ↓
Compatibility Engine
        ↓
Recommendation Engine
        ↓
Result UI
```

Публичный API: `calculateMixAnalysis({ components, verifiedSmokeScore? }): MixAnalysisResult`. Canonical layer применяет только authoritative exact decisions, exact aliases внутри manufacturer и persisted canonical ID. `AMBIGUOUS`/`UNRESOLVED` не угадываются. Затем вызовы выполняются последовательно через публичные exports. Service не мутирует вход, не сохраняет данные и не зависит от React/Next.js.

Result page загружает существующий Mix, преобразует Prisma Flavor адаптером и вызывает Service один раз. `predictedQualityScore`, `predictionConfidence`, `dataQuality` и `verifiedSmokeScore` разделены. Подробности effective profile и scoring описаны в [Canonical Mix Scoring Integration](canonical-mix-scoring-integration.md). Ограничение: старый анализатор временно сохраняется отдельно для описания и рекомендаций по жару, которых новые движки пока не моделируют.
