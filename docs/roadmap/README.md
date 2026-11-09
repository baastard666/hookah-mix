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
- Verified Mix Recipe Registry — exact-only runtime-проекция 28 реальных VERIFIED рецептов поверх ExpertMixKnowledge; без UI и без scoring wiring

## In progress

Следующий приоритет: отдельное Verified recipe → Mix Analysis wiring на основании аудита registry; до этого реестр не влияет на score/confidence.

## Planned directions
- Verified recipe → Mix Analysis wiring (после отдельного решения о качестве evidence);
- Mix Flavor Analysis v2;
- каталог готовых миксов `/mixes` и страницы `/mixes/[slug]`;
- страницы продуктов, похожие миксы и замены компонентов;
- feedback / smoke observations;
- Product Flavor Taxonomy Foundation — номер итерации `unknown`;
- Expert Observation Aggregation — номер итерации `unknown`;
- Product Flavor Profile Registry — подключение к `calculateMixAnalysis`/scoring/UI (данные полностью собраны, интеграция не начата);
- v0.3.6 Tobacco Compatibility Engine (исторически запланированное направление, не переименовано);
- v0.3.7 Mix Analysis Integration (исторически запланированное направление, не переименовано);
- v0.3.8 UI Analysis Breakdown (исторически запланированное направление, не переименовано);
- сохранение и история миксов;
- сравнение вариантов;
- рекомендации конкретных продуктов;
- community и отзывы;
- confidence на основе накопленных данных;
- Tobacco Compatibility Engine на основе технических профилей производителей и линеек;
- AI как дополнительный слой, но не замена детерминированным движкам.

База реальных экспертных миксов собирается и нормализуется параллельно вне кода. Import boundary готов; фактическое сопоставление колонок будет уточнено после передачи и аудита реального `hookah_mix_database_v2.xlsx`.

Сроки намеренно не фиксируются.
