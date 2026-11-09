# ADR-027: Mix Analysis v2 — canonical wiring для Verified Mix Recipes

## Контекст

ADR-026 создал exact-only `VerifiedMixRecipeRegistry`, но намеренно не подключал его к анализу. Runtime `calculateMixAnalysis` исторически получал `CanonicalMixComponentInput` из Prisma Flavor. Для проверенных recipes это неверный source-of-truth: recipe уже имеет exact canonical identity, а Product Flavor Profile Registry может быть заполнен без физического импорта профиля в PostgreSQL.

## Решение

1. Создать `src/lib/verified-mix-analysis/` как composition layer вокруг существующего `calculateMixAnalysis`, не новый engine.
2. Для каждого recipe component брать identity только из exact `TobaccoIdentityDecisionRegistry`; отсутствие RESOLVED canonical decision — hard failure.
3. Передавать Product Flavor Profile как `CANONICAL_PRODUCT_PROFILE` candidate с `canonical:<canonicalProductId>`. Source Prisma profile отключён.
4. Маппить только семь evidence-backed dimensions ADR-014; остальные 11 оставлять `null`, без neutral fallback `5`.
5. Использовать `dominantNoteIds` только как generic category notes. Не выводить конкретную ноту, которой registry не утверждает.
6. Передавать verification/evidence/rating только из recipe. VERIFIED status сам по себе не создаёт quality/confidence bonus и не является smoke rating.
7. Публичный result отделяет predicted analysis от observed evaluation и не раскрывает provenance/private fields.

## Последствия

- 28 eligible recipes анализируются детерминированно без PostgreSQL;
- технический manufacturer/line profile остаётся существующим дополнительным candidate для измерений, отсутствующих у product profile;
- отсутствие измерения видно как `null`, поэтому coverage и confidence могут быть ниже, но не становятся фиктивно нейтральными;
- audit фиксирует distribution как finding, но не меняет score/compatibility weights в этой же итерации;
- следующий consumer — `/mixes` и `/mixes/[slug]`, а не отдельный Mix Analysis V2 Engine.

## Отклонённые альтернативы

- отдельный scoring/compatibility/recommendation engine — дублирует существующую доменную логику;
- Prisma как обязательный source-of-truth — ломает DB-independent recipe analysis;
- заполнение отсутствующих 11 полей средним значением — нарушает ADR-023;
- VERIFIED как proof качества/пропорций — создаёт синтетическое evidence.
