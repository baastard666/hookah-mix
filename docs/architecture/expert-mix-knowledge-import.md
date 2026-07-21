# Excel Knowledge Import & Audit

## Назначение

Модуль `src/lib/expert-mix-knowledge-import` преобразует внешний XLSX в staging-модели, затем использует существующий Tobacco Product Identity Resolver и Expert Mix Knowledge v1. Excel не является runtime-базой сайта и не читается в браузере.

```text
XLSX (read-only)
  -> workbook inspection
  -> raw rows
  -> normalized staging
  -> exact identity resolution
  -> domain mapping + validation
  -> immutable imported registry
  -> typed audit report + public-safe DTO
```

Доменная схема не знает названий колонок, номеров строк и структуры workbook. `App_Tobacco` и `App_Mixes` только аудируются и игнорируются как первичные источники.

## Workbook reader

Node-only reader использует `exceljs@4.4.0`. Библиотека выбрана потому, что одной операции чтения значений недостаточно: audit проверяет hidden/veryHidden sheets, formulas, merged cells, cell errors и used ranges. Ограничения: импорт загружает workbook в память, не вычисляет формулы самостоятельно и использует сохранённый Excel result; большие файлы требуют будущего streaming-профиля.

Исходный файл не записывается и не экспортируется. Verify при работе с реальным путём сравнивает SHA-256 до и после импорта.

## Типы данных и provenance

Одна строка может породить несколько независимых значений:

- `ImportedCatalogFact` — название, производитель, линейка, описание, заявленная крепость;
- `ImportedObservation` — конкретный реальный опыт с `SOURCE_STATED`;
- `ImportedExternalRating` — исходное значение, шкала и sample size; нормализация до 10 только математическое представление;
- `TAG_CATEGORY` — ограниченный категориальный `DERIVED` вывод;
- `PRELIMINARY_INFERENCE` — только `DERIVED + LOW`.

Каждое значение хранит `source`, `sourceReference`, `confidence`, `importedFrom` и `originalValue`. Количество заполненных колонок не повышает confidence.

## Identity policy

Приоритет: валидный explicit canonical ID, явные manufacturer/productLine/productName, точные registry aliases, exact normalized resolver, manufacturer-only, unresolved/ambiguous. Fuzzy matching, Levenshtein, сравнение только по слову вкуса и «самый похожий» продукт отсутствуют.

`НАШ` зарегистрирован как отдельный manufacturer `nash`. Manufacturer-only ID строится существующей функцией v0.2.9. Поэтому `nash-manufacturer-only-лаванда` не совпадает с `dogma-manufacturer-only-крымская-лаванда`.

Unresolved и ambiguous сохраняются в staging и audit; options могут повысить их severity до error, но никогда не угадывают identity.

## Mix validation

Точные 100% валидны. Отклонение в пределах `percentageTolerance` сохраняется как `APPROXIMATE_PERCENT` и warning. Значения вне tolerance отклоняются domain validator. `PARTS`, `ORDER_ONLY` и `UNKNOWN` не преобразуются в проценты.

Граммы остаются staging/context: проверяются против declared total weight, но не создают выдуманный процент. Конфликт веса не может оставить запись `VERIFIED` — импортированная запись получает `PARTIALLY_VERIFIED`, при этом исходный статус остаётся в staging.

Duplicate candidates только отмечаются; автоматического объединения нет.

## Privacy и immutability

Внутренний результат может содержать source URL, автора, row number и путь. Public output создаётся существующим mapper v0.3.0, затем проходит privacy audit. Он не должен содержать internalLabel, автора, private URL, local path, row number, internal notes, excerpts или references evidence.

Registry, записи, staging и report глубоко клонируются и freeze. Мутация исходного buffer/staging не меняет результат.

## Ограничения v0.3.1

Нет записи в PostgreSQL, Prisma migration, UI, scoring, рекомендаций, совместимости, aggregation и runtime-интеграции. Реальный `hookah_mix_database_v2.xlsx` не хранится в Git и в момент реализации отсутствовал в workspace; `verify:expert-mix-knowledge-import [path]` использует его при наличии, иначе запускает синтетический fixture.
