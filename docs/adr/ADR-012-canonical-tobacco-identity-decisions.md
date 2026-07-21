# ADR-012: Canonical Tobacco Identity Decisions

> Представление `canonicalProductId` уточнено ADR-013: новые ID являются ASCII-only, а прежние Unicode ID поддерживаются только через legacy lookup.

## Context

Excel audit содержит unresolved и manufacturer-only identity, включая продукты без явной productLine. Exact alias производителя недостаточен для подтверждения продукта, а существующий resolver создаёт RESOLVED только через известную line.

## Decision

1. Использовать отдельный authoritative decision layer перед существующим Registry/resolver.
2. Ручное решение authoritative только при `review.state = CONFIRMED`, наличии evidence и confidence.
3. Fuzzy matching, Levenshtein и выбор похожего продукта запрещены.
4. Canonical product может существовать без productLine; `productLineId` остаётся null.
5. Фиктивные линии `default`, `unknown`, `main`, `base` запрещены.
6. Canonical ID детерминирован; collision блокирует Registry и требует ручного решения.
7. Decision layer проверяет конфликты с известными manufacturer/productLine Registry и не скрывает ошибки основного resolver.
8. P0/P1 имеют приоритет; P2/P3 не применяются в v0.3.2.
9. `НАШ` и `Dogma` остаются разными производителями.
10. Итерация не добавляет вкусовые свойства, совместимость, scoring или рекомендации.

## Consequences

- подтверждённые продукты без линии разрешимы без Prisma migration;
- реальный review остаётся ручным и проверяемым;
- coverage меняется только подтверждёнными решениями;
- основной Registry не дублируется и остаётся источником технических профилей;
- persistence решений и UI отложены.
