# ADR index

- [ADR-016](ADR-016-catalog-import-and-demo-reconciliation-policy.md) — политика импорта Product Flavor Profile Registry: без порога отсечения (`dataCompleteness` отдельной осью), evidence всегда побеждает demo-данные, `Test Kitchen` скрыт из публичной выдачи, почти-дубли — в review-список.
- [ADR-015](ADR-015-flavor-profile-nullable-secondary-dimensions.md) — nullable для 11 вторичных полей `FlavorProfile`, явная политика «null ≠ 0» для всех потребляющих модулей.
- [ADR-014](ADR-014-product-flavor-profile-dimension-scope.md) — целевая модель из 7 измерений Product Flavor Profile Registry, явное исключение остальных 11 Prisma-полей.
- [ADR-013](ADR-013-canonical-product-id-ascii-transliteration.md) — ASCII-only canonicalProductId, детерминированная транслитерация и legacy lookup.
- [ADR-012](ADR-012-canonical-tobacco-identity-decisions.md) — подтверждённые identity decisions, nullable productLine и запрет fuzzy matching.

- [ADR-001](ADR-001-domain-engines-separation.md) — разделение доменных движков.
- [ADR-002](ADR-002-rule-based-knowledge-layer.md) — rule-based Knowledge Layer.
- [ADR-003](ADR-003-evidence-and-confidence.md) — evidence и confidence.
- [ADR-004](ADR-004-recommendations-over-analysis.md) — рекомендации поверх анализа.
- [ADR-005](ADR-005-recommendation-ranges.md) — диапазоны процентов.
- [ADR-006](ADR-006-mix-analysis-orchestration-layer.md) — единая точка оркестрации.
- [ADR-007](ADR-007-tobacco-product-profile-registry.md) — отдельный технический реестр производителей и линеек.
- [ADR-008](ADR-008-deterministic-tobacco-product-identity.md) — детерминированная идентификация товаров и read-only аудит каталога.
- [ADR-009](ADR-009-canonical-catalog-identity-persistence.md) — постоянная canonical identity, защищённый backfill и registry ID без SQL foreign keys.
- [ADR-010](ADR-010-expert-mix-knowledge-records-and-source-privacy.md) — source-specific expert records, unresolved identity и граница приватности источника.
- [ADR-011](ADR-011-excel-knowledge-import-and-fact-provenance.md) — read-only Excel staging, provenance каждого факта и запрет fuzzy identity.
