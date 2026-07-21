# ADR-011: Excel Knowledge Import and Fact Provenance

## Context

Исследовательская база развивается в Excel, но workbook содержит первичные, производные и архивные листы, неполные identity и значения разной доказательной силы. Прямое использование строк Excel в анализе смешало бы каталог, опыт, рейтинги и предположения.

## Decision

1. Excel — внешний read-only staging source, а не runtime database.
2. Domain schema не зависит от листов и колонок: pipeline всегда `raw -> staging -> identity -> domain`.
3. Одна строка может создать несколько фактов; каждый получает собственные provenance и confidence.
4. Реальный опыт, каталог, внешний агрегированный рейтинг, derived tag и preliminary inference — разные типы.
5. Preliminary inference допустим только с LOW confidence.
6. Fuzzy matching и угадывание identity запрещены; unresolved/ambiguous сохраняются.
7. `НАШ` и `Dogma` — разные manufacturer IDs и manufacturer-only canonical IDs независимо от совпадения слова «лаванда».
8. `App_Tobacco` и `App_Mixes` не являются источниками истины.
9. Импорт выполняется только в Node.js через ExcelJS; клиентский bundle и browser не читают workbook.
10. Public output проходит существующий privacy mapper и дополнительный audit.
11. Импорт не сохраняется в PostgreSQL и не меняет source workbook.

## Consequences

- audit воспроизводим и сериализуем;
- исходные значения и проблемы не исправляются молча;
- доменные записи можно использовать позже без зависимости от Excel;
- реальные авторы и локальные детали остаются во внутреннем слое;
- memory-based ExcelJS reader требует отдельного streaming-решения для очень больших workbook;
- фактическая статистика реального файла доступна только после передачи пути к нему.
