# Tobacco Identity Decisions

## Проблема

Real-workbook audit выявил 403 exact-normalized identity-группы: P0 — unresolved-компоненты VERIFIED-миксов, P1 — manufacturer-only компоненты VERIFIED-миксов, P2 — остальные компоненты, P3 — каталог вне миксов. v0.3.2 обрабатывает P0/P1 как очередь ручной проверки; P2/P3 не применяются.

## Pipeline

```text
unresolved report -> P0/P1 review plan -> manual evidence + CONFIRMED
  -> validation -> immutable decision registry -> exact decision resolver
  -> existing resolver fallback -> coverage comparison
```

Decision layer является authoritative только для `CONFIRMED` решений с evidence и confidence. Он расположен перед существующим Tobacco Product Identity Resolver, но не скрывает его ошибки и не изменяет основной профильный Registry.

## Product line policy

`ProductLineInterpretation` различает подтверждённое отсутствие линии, подтверждённую линию, embedded-значение, unknown и ambiguous. Значения вроде `Element Earth`, `Deus Perfume`, `Mr Brew Напиточный`, `Chabacco Mix`, `Muassel Medium` и `Sarma 360` не разделяются автоматически.

Продукт может быть `RESOLVED` без линии при `CONFIRMED_NONE`. В этом случае `productLineId = null`; фиктивные `default`, `unknown`, `main`, `base` запрещены. Prisma schema не меняется: nullable line уже поддерживается persistence-моделью.

## Canonical ID

- с линией: `<manufacturerId>-<line-segment>-<productSlug>`;
- без линии: `<manufacturerId>-<productSlug>`.

ID строится exact-normalized Unicode-safe функцией, не зависит от display aliases, регистра, пробелов, evidence или source row. Если существующий `productLineId` уже содержит manufacturer prefix (`darkside-core`), prefix не дублируется. Registry выявляет collision, duplicate и conflict и не выбирает победителя.

## Evidence и review

Каждое подтверждённое решение имеет хотя бы одно evidence с типом, reference, checkedAt и confidence. `RESOLVED` не означает автоматически HIGH. Review-файлы JSON/CSV/Markdown предназначены для ручного заполнения; генератор не назначает canonical ID. Порядок: P1, P0 с несколькими VERIFIED-миксами, частые P0, остальные P0. Три USER_PRIORITY записи хранятся отдельно.

## Registry, application и coverage

Immutable registry индексирует решение по id, sourceGroupId, exact normalized identity, canonicalProductId и status. Применение разрешено только для CONFIRMED P0/P1/USER_PRIORITY. Coverage отдельно считает весь набор, каталог, компоненты, VERIFIED-компоненты и USER_PRIORITY. Domain filter поддерживает manufacturer, line, canonical ID, status, confidence, evidence, priority и VERIFIED usage.

## Privacy

Public mapper возвращает только canonical identity, public-safe aliases, общий evidence type, confidence и status. Локальные пути, workbook hash, source rows, reviewer notes, private URL/reference и internal notes не экспортируются.

## Ограничения v0.3.2

Нет fuzzy matching, web research, массового auto-resolution, вкусовых характеристик, рекомендаций, scoring, UI, Prisma migration или сохранения решений в PostgreSQL. Реальные P0/P1 остаются UNREVIEWED до ручного evidence.
