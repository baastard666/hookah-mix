# ADR-013: Canonical Product ID ASCII Transliteration Policy

## Статус

Принято для v0.3.2.

## Контекст

Часть подтверждённых tobacco identity decisions и генераторов каталога создавала `canonicalProductId` с кириллицей. Такие ID зависели от поддержки Unicode во внешних системах и нарушали единый формат ссылок. При этом display names, aliases и исходный workbook должны оставаться без изменений.

## Решение

`canonicalProductId` должен соответствовать:

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

Product slug выбирается так:

1. Используется подтверждённое официальное английское canonical name, если оно явно передано.
2. Иначе canonical display name транслитерируется централизованной детерминированной функцией.
3. Смысловой перевод, guessed English name и locale-dependent библиотеки запрещены.

Русская транслитерация фиксирована в коде: `ё → e`, `й → i`, `х → kh`, `ц → ts`, `ч → ch`, `ш → sh`, `щ → shch`, `ъ/ь` удаляются, `ы → y`, `ю → yu`, `я → ya`; остальные русские буквы имеют однозначное латинское соответствие. После транслитерации значение приводится к lowercase, неподдерживаемые последовательности заменяются одним дефисом, повторные и крайние дефисы удаляются.

Canonical display names и aliases не меняются. После создания ID остаётся стабильным и не пересчитывается из нового alias.

## Обратная совместимость

Unicode ID, уже попавшие в Git, перечислены в immutable `legacyCanonicalProductIdAliases`. Mapping содержит только старый ID, новый ID и техническую причину. Старый ID допустим только для lookup/migration compatibility; public-safe output возвращает новый ASCII ID.

Validator запрещает duplicate, conflict, self-reference и cycle. Transliteration collision не получает автоматический suffix и требует явного решения.

## Последствия

- Все новые decision, catalog и resolver ID создаются одним ASCII builder.
- Identity resolution semantics, решения, evidence, confidence и coverage не меняются.
- Prisma migration не требуется: схема не меняется, а текущая итерация мигрирует versioned fixtures и lookup mapping.
- Возможны явные collision issues, которые нельзя разрешать угадыванием.

## Примеры

```text
brusko-medium-цитрусовый-чай  -> brusko-medium-tsitrusovyi-chai
chabacco-mix-апельсин-сливки -> chabacco-mix-apelsin-slivki
daily-hookah-сливочный-крем   -> daily-hookah-slivochnyi-krem
```

`brusko-medium-citrus-tea` не используется без подтверждённого официального английского названия.
