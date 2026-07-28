# ADR index

- [ADR-023](ADR-023-neutral-fallback-null-propagation.md) — `NEUTRAL_FALLBACK` в `buildEffectiveTobaccoProfile` больше не подставляет фиктивное число `5` в значение поля (только раньше пропадавший `null` доходит до уже существующей null-исключающей логики ADR-015/017); `componentQuality`/`balance` становятся `number|null` и исключаются из веса `predictedQualityScore` (перевзвешивание как в ADR-022), когда данных нет вовсе; устранены ложные "Сильные стороны" (sweet-sour-balance/fresh-juicy/dessert-balance), срабатывавшие на паре из двух fallback-значений.
- [ADR-022](ADR-022-mix-confidence-weight-recalibration.md) — минимальная правка презентации: веса `calculateMixConfidence` перевешены с `proportionCoverage`(0.15)/`externalEvidenceCoverage`(0.1) на `identityCoverage`(0.55)/`profileCoverage`(0.45) (обе оси сегодня — зафиксированные константы для всех миксов, ADR-021); плюс постоянный поясняющий пункт в `confidenceReasons`; изменение помечено как временное, до реализации `VerifiedMixRecipeRegistry`.
- [ADR-021](ADR-021-proportion-confirmation-and-independent-evidence-analysis.md) — анализ (без реализации): `confirmations` всегда `5.0` для любого микса в живом API из-за незаполненных `proportionConfirmed`/`independentEvidenceCount`; требует нового `VerifiedMixRecipeRegistry`, а не просто подключения — узкий охват, рекомендован низкий-средний приоритет.
- [ADR-020](ADR-020-wiring-audit-and-verified-mix-history-evidence.md) — Step A: подключены 17 ранее несвязанных записей `CATEGORY_RELATIONS` (значения не менялись); Step B: новый evidence type `VERIFIED_MIX_HISTORY` (внутренняя статистика 37 verified-миксов), 13 из 15 непокрытых пар подключены как `COMPLEMENTARY_CONTRAST`, 2 — `NEUTRAL`.
- [ADR-019](ADR-019-aggregated-research-category-compatibility-rules.md) — импорт 22 из 29 пар совместимости категорий из внешнего агрегированного исследования (новый evidence type `AGGREGATED_RESEARCH`), подключены через `createKnowledgeCategoryRule`; 5 конфликтующих пар и 2 дубля с существующими записями — не импортированы, вынесены в review-список.
- [ADR-018](ADR-018-product-flavor-profile-note-category-backfill.md) — перенос `dominantNoteIds` 86 продуктов в `FlavorNoteAssignment` отдельным скриптом, расширение `FlavorNoteCategory` на 9 недостающих категорий, `CATEGORY_RELATIONS` (FLORAL+CREAMY и др.) — вынесено в отдельную будущую задачу.
- [ADR-017](ADR-017-flavor-profile-nullable-core-dimensions.md) — расширение политики ADR-015 «null ≠ 0» на оставшиеся 7 core-полей `FlavorProfile`; `FlavorProfile` упрощён до единого `Record<Field, number|null>`.
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
