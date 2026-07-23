# Roadmap

## Completed
- v0.2.2 Mix Profile Engine
- v0.2.3 Compatibility Engine
- v0.2.4 Knowledge Layer Foundation
- v0.2.5 Recommendation Engine Foundation
- v0.2.6 Mix Analysis Service & Recommendation UI Integration
- v0.2.7 Tobacco Product Profile Registry Foundation
- v0.2.8 Tobacco Product Identity & Catalog Audit
- v0.2.9 Canonical Catalog Identity Persistence
- v0.3.0 Expert Mix Knowledge Schema Foundation
- v0.3.1 Excel Knowledge Import & Audit
- v0.3.2 Canonical Tobacco Catalog Expansion & Identity Decisions
- v0.3.3 Canonical Mix Scoring Integration
- v0.3.5 Product Flavor Profile Registry (батчи 1–6 — 86 из 86 `RESOLVED` продуктов, регистратура полностью заполнена, не подключена к scoring/UI)

## In progress

Финальный аудит feature-ветки v0.3.3 перед отдельным решением о merge.

## Planned directions
- Product Flavor Taxonomy Foundation — номер итерации `unknown`;
- Expert Observation Aggregation — номер итерации `unknown`;
- Product Flavor Profile Registry — подключение к `calculateMixAnalysis`/scoring/UI (данные полностью собраны, интеграция не начата);
- v0.3.6 Tobacco Compatibility Engine;
- v0.3.7 Mix Analysis Integration;
- v0.3.8 UI Analysis Breakdown;
- сохранение и история миксов;
- сравнение вариантов;
- рекомендации конкретных продуктов;
- community и отзывы;
- confidence на основе накопленных данных;
- Tobacco Compatibility Engine на основе технических профилей производителей и линеек;
- AI как дополнительный слой, но не замена детерминированным движкам.

База реальных экспертных миксов собирается и нормализуется параллельно вне кода. Import boundary готов; фактическое сопоставление колонок будет уточнено после передачи и аудита реального `hookah_mix_database_v2.xlsx`.

Сроки намеренно не фиксируются.
