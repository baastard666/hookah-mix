# Expert Mix Knowledge Schema

## Назначение

Модуль `src/lib/expert-mix-knowledge` хранит форму отдельного экспертного свидетельства о миксе или сессии с одним продуктом. Это независимый domain layer без React, Next.js, Prisma, файлового формата и внешних сервисов.

```text
будущий внешний источник
  -> нейтральный adapter
  -> domain schema + runtime validation
  -> read-only in-memory registry
  -> будущая агрегация Mix Pattern
  -> будущая интеграция Mix Analysis
```

В v0.3.0 последние два перехода не реализованы. Реальные миксы, Excel/CSV и PostgreSQL не подключены.

## Knowledge Record и Mix Pattern

`ExpertMixKnowledgeRecord` — свидетельство конкретного источника. Один и тот же состав из двух источников образует две записи с разными ID. Будущий `Mix Pattern` будет агрегировать несколько свидетельств отдельным слоем и не является частью этой версии.

Record поддерживает `MIX` и `SINGLE_PRODUCT_SESSION`. Один компонент допустим с warning; технический предел импорта — 20 компонентов. Он защищает от ошибочного payload и не является продуктовым ограничением конструктора.

## Компоненты и identity

Компонент всегда сохраняет `rawProductName`. Canonical identity необязательна: допустимы `RESOLVED`, `MANUFACTURER_ONLY`, `UNRESOLVED`, `AMBIGUOUS`, `NOT_CHECKED`. Неразрешённые продукты остаются валидными с warning и не получают придуманного `canonicalProductId`.

Отдельная функция identity использует только публичный API Product Identity. Универсальный adapter не выполняет fuzzy matching. Точная связь может появиться через canonical ID, ручную проверку или контролируемый resolver.

## Пропорции

Поддерживаются `PERCENT`, `PARTS`, `ORDER_ONLY`, `UNKNOWN`, а у компонента — точный процент, приблизительный процент с явной tolerance, части или unknown. Точные проценты должны давать 100 с epsilon `0.0001`. Значения не нормализуются, parts не переводятся в проценты, unknown не превращается в равные доли.

## Source, evidence и privacy

Evidence принадлежит source своей записи, имеет собственный confidence и может хранить таймкоды. Observation ссылается на evidence по ID. Public mapper исключает `internalLabel`, скрытые URL, ссылки и excerpts evidence, editorial evidence, внутренние notes и приватные имена; источник получает нейтральную метку.

Fixtures полностью синтетические: в них нет реальных авторов, каналов, URL или собранных миксов.

## Facts и interpretations

`origin` разделяет `SOURCE_STATED`, `EDITOR_INTERPRETED`, `DERIVED`, `INTERNAL_TEST`. Проценты не создают автоматически dominance. `CompatibilityObservation` — только наблюдение источника, а не результат Compatibility Engine. Наблюдения о жаре не меняют Tobacco Product Profile Registry.

## Preparation и evaluation

Preparation полностью опциональна; отсутствующие значения не получают defaults. Rating хранится в исходной шкале 5, 10, 100 или qualitative и не конвертируется автоматически.

## Deterministic IDs

ID строится из canonical stable serialization семантического input и детерминированного Unicode-safe hash. Ключи объектов сортируются, массивы сохраняют порядок. Порядок компонентов значим через position и может менять record ID. Record ID включает source identity и внешний ключ записи, поэтому разные источники не схлопываются.

## Публичный API

Public barrel экспортирует validators, adapter boundary, identity attachment, ID-функции, public-safe mapper и read-only registry queries. Mutable map, Prisma client и synthetic fixtures через основной barrel не экспортируются.
