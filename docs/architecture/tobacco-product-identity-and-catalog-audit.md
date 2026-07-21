# Tobacco Product Identity Resolver and Catalog Audit

## Назначение

Слой v0.2.8 сопоставляет минимальную запись каталога с каноническими производителем и продуктовой линейкой из публичного API Tobacco Product Profile Registry v0.2.7. Identity resolver отвечает за идентичность товара, а registry — за его технический профиль. Разделение не позволяет диагностике каталога скрыто менять характеристики, scoring или рекомендации.

Поток данных:

```text
Prisma Flavor + Brand
  -> plain-object catalog adapter
  -> Tobacco Product Identity Resolver
  -> typed resolution
  -> read-only Catalog Audit
```

## Вход и приоритеты

Resolver принимает только `catalogId`, `brand`, `productLine` и `name`. Адаптер преобразует текущую Prisma-модель `Flavor`, в которой есть бренд и название, но нет отдельного поля линейки.

Приоритет разрешения:

1. явный `brand`;
2. явный `productLine`;
3. точное каноническое имя;
4. зарегистрированный alias;
5. известный boundary-aware префикс в начале `name`;
6. известный производитель без линейки;
7. типизированный нерешённый результат.

Явная линейка имеет приоритет над префиксом названия. Конфликт возвращается как warning `EXPLICIT_PRODUCT_LINE_CONFLICTS_WITH_NAME_PREFIX`, а явное значение не заменяется.

## Безопасное сопоставление

Нормализация ограничена Unicode NFKC, trim, свёртыванием пробелов, приведением регистра и унификацией тире. Fuzzy matching, Levenshtein, автоматическая транслитерация и исправление опечаток запрещены: неверное «похожее» совпадение опаснее явного статуса `NOT_FOUND`.

Контролируемый разбор проверяет только начало имени и только канонические имена и aliases из публичных `listManufacturerProfiles` и `listProductLineProfiles`. Неизвестные и неоднозначные значения не угадываются; они возвращаются как `MANUFACTURER_NOT_FOUND`, `PRODUCT_LINE_NOT_FOUND` или `AMBIGUOUS` с typed reason codes и кандидатами.

## Каноническая идентичность

Успешный результат содержит вычисляемый `productId` вида `<productLineId>-<ascii-product-slug>`. Начиная с ADR-013 slug создаётся общим deterministic ASCII builder: official English имеет приоритет, иначе используется русская транслитерация без смыслового перевода. ID не использует дату или случайность и в v0.2.8 не сохраняется в базе.

## Catalog Audit

`auditTobaccoCatalogEntries` агрегирует статусы, формирует список проблем и группирует только успешно разрешённые записи по `productId` для диагностики возможных дублей. Он не удаляет, не объединяет и не обновляет данные. CLI `audit:tobacco-catalog` читает все `Flavor`, поддерживает детерминированный `--json` и всегда остаётся read-only.

## Границы версии

Модуль не подключён к Mix Analysis Service, Compatibility Engine, Recommendation Engine или UI. Prisma schema, seed, scoring и пользовательские результаты не изменяются.
