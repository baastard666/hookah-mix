# Tobacco Product Profile Registry

## Назначение

Tobacco Product Profile Registry — независимый read-only справочник технических характеристик производителей и линеек. Он хранит категориальные значения крепости, жаростойкости и типа листа вместе с confidence, evidence и ограничениями. В v0.2.7 эти данные не участвуют в расчётах приложения.

## Иерархия

```text
Manufacturer
  └─ Product Line
       └─ Specific Tobacco Product (зарезервировано для будущего)
```

Производитель задаёт общие defaults. Линейка может переопределить свойство или унаследовать его. Тип `TobaccoProductProfile` и пустая коллекция `products` оставляют явную точку расширения для исключений конкретных продуктов без изменения текущего API.

`resolveTobaccoProfile` возвращает для каждого свойства итоговое значение, confidence, evidence, `origin`, флаг `inherited` и `inheritedFrom`. Отсутствующее свойство остаётся `null` или категориальным `UNKNOWN`; реестр не выводит значение из похожего названия.

## Evidence и confidence

Каждое значимое значение содержит список evidence: тип источника, заголовок, необязательную reference и дату проверки. `MANUFACTURER_CLAIM` означает заявление производителя и не приравнивается к независимому измерению. `LOW`, `MEDIUM` и `HIGH` описывают надёжность данных, а не качество продукта.

Стартовый набор использует официальные страницы там, где они доступны, осторожные рабочие категории и вторичные материалы с пониженным confidence. Точные числовые claims MUASSEL сохранены только в пояснениях evidence; публичный профиль остаётся категориальным.

## Имена и aliases

Нормализация учитывает регистр и повторные пробелы. Поддерживаются только явно перечисленные aliases, например `Хулиган`/`Hooligan`/`HLGN`, `Musthave`/`Must Have` и `Jent`/`JENT`. Fuzzy matching отсутствует. Неизвестный производитель или линейка возвращает `NOT_FOUND` с указанием отсутствующего уровня.

## Публичный API

- `getManufacturerProfile`;
- `getProductLineProfile`;
- `resolveTobaccoProfile`;
- `listManufacturerProfiles`;
- `listProductLineProfiles`;
- `hasManufacturerProfile`;
- `hasProductLineProfile`;
- `resolveProfileForTobacco` — адаптер plain object с `brand.name` и необязательной линейкой.

Exports доступны только через `src/lib/tobacco-profile/index.ts`. Внутренний registry глубоко заморожен и не экспортируется из public index; query API возвращает отдельные глубоко замороженные копии. Модуль не зависит от React, Next.js, Prisma Client, HTTP или PostgreSQL и не выполняет сетевых запросов.

## Границы v0.2.7

Registry не подключён к Mix Profile, Compatibility, Recommendation или Mix Analysis Service, не меняет UI и не создаёт рекомендации по жару. Он охватывает семь производителей и девять линеек; конкретные вкусы не профилируются. Части данных требуют дальнейшей независимой проверки. Интеграция относится к будущему Tobacco Compatibility Engine.
