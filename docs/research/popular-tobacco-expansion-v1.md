# Popular Tobacco Expansion v1

Дата исследования: 2026-11-10. Это планировочный документ: он не добавляет продукты, не меняет реестры, профили, расчёт или пользовательский интерфейс.

## Граница и метод

Целевой рынок — Россия и русскоязычный кальянный рынок. «Популярность» здесь не означает измеренный национальный объём продаж: доступные публичные материалы не дают единого репрезентативного sales ranking. Приоритет основан на сочетании текущей активности производителя, официального ассортимента, географии присутствия/дилеров, специализированных каталогов и независимых редакционных списков. Один магазинный рейтинг не принят как единственное доказательство.

Источники первого порядка: официальные каталоги производителей. Второй порядок: актуальные отраслевые каталоги и обзоры. Для каждого кандидата перед внесением в production всё ещё нужен отдельный review identity, line, evidence и сенсорного профиля.

## Current state

Read-only audit PostgreSQL, immutable registries и committed snapshot на 2026-11-10:

| Показатель | Значение |
|---|---:|
| Brand в Prisma | 29 |
| Flavor в Prisma, всего | 102 |
| Публичных продуктов каталога | 93 |
| Тестовых продуктов (не каталог) | 9 |
| RESOLVED canonical products | 86 |
| Product Flavor Profiles | 86 |
| Verified recipes | 28 |
| Готовых `/mixes` в snapshot | 28 |

### Матрица representation gap

`Catalog` — число публичных Prisma-позиций; `Canonical` и `Profiles` — число подтверждённых записей; `Products in mixes` — уникальные продукты в snapshot; `Recipes` — число готовых миксов с брендом.

| Brand | Catalog | Canonical | Profiles | Products in mixes | Recipes |
|---|---:|---:|---:|---:|---:|
| Sapphire Crown | 13 | 13 | 13 | 11 | 10 |
| BlackBurn | 9 | 8 | 8 | 8 | 7 |
| Musthave | 10 | 9 | 9 | 6 | 5 |
| Sarma | 6 | 6 | 6 | 6 | 4 |
| Chabacco | 6 | 6 | 6 | 5 | 5 |
| Overdose | 6 | 6 | 6 | 5 | 5 |
| Husky | 5 | 5 | 5 | 4 | 2 |
| JAM | 5 | 5 | 5 | 4 | 3 |
| Element | 3 | 2 | 2 | 2 | 2 |
| Darkside | 1 | 0 | 0 | 0 | 0 |
| Sebero | 1 | 0 | 0 | 0 | 0 |
| Spectrum | 0 | 0 | 0 | 0 | 0 |
| JENT | 0 | 0 | 0 | 0 | 0 |
| НАШ | 2 | 2 | 2 | 2 | 2 |
| Duft | 2 | 2 | 2 | 1 | 1 |

Полный вывод доступен локально через `pnpm audit:popular-tobacco-coverage`; его JSON-отчёт находится в ignored `reports/`.

### Перекосы профилей

Среди 86 Product Flavor Profiles чаще всего представлены `FRUIT` (38), `CREAMY` (16), `SOUR` (14), `BERRY`/`CITRUS`/`TROPICAL` (по 13). Почти не представлены `FLORAL` (1), `SMOKY` (1), `BEVERAGE`/`CHOCOLATE`/`COFFEE`/`VANILLA` (по 2) и `HERBAL` (3). Это аргумент в пользу напиточных, чайных, гастрономических и цветочных позиций в следующих пакетах, а не ещё одного однородного ягодного набора.

По заполненным измерениям: strength — 84 значения, среднее 5,1; sourness — 36, среднее 4,8; sweetness — 58, среднее 6,2; freshness — 20, среднее 5,9. Отсутствующие значения не следует подменять нейтральными числами.

### Mix gaps

Snapshot действительно содержит 28 рецептов. По occurrences лидируют Sapphire Crown (11), BlackBurn (8), Musthave и Sarma (по 6), Chabacco и Overdose (по 5). У Darkside, Sebero, Spectrum и JENT — ноль. Это representation gap, а не доказательство непопулярности уже представленных брендов.

## Рынок и tiering

### Tier A — каталог без этих брендов выглядит неполным

| Brand | Почему Tier A | Текущее покрытие проекта |
|---|---|---|
| BlackBurn | Официальный ассортимент — несколько десятков вкусов и отдельные линейки Shock, KMTM, Something; присутствует в актуальном специализированном обзоре. | 9 / 8 / 8 / 7 recipes |
| MustHave | Официальный каталог показывает широкий действующий ассортимент и точки продаж по России. | 10 / 9 / 9 / 5 recipes |
| Darkside | Официальный живой каталог содержит несколько продуктовых семейств и новые позиции; в проекте только одна неканоническая позиция. | 1 / 0 / 0 / 0 |
| Sebero | Официальный сайт показывает линии Classic, Arctic Mix, GID и Black, а также актуальные 2026 releases. | 1 / 0 / 0 / 0 |
| Spectrum | Официальный сайт показывает Classic, Medium, Hardline, Mix Line и Kitchen Line; есть широкая сеть представителей. | 0 / 0 / 0 / 0 |
| JENT | Официальный производитель выделяет классическую, травяную, алкогольную и сигарную линии; отсутствует в проекте. | 0 / 0 / 0 / 0 |
| Sarma | Уже подтверждена в рабочих миксах, но покрыта лишь шестью продуктами; специализированный каталог показывает широкий ассортимент и актуальные отзывы. | 6 / 6 / 6 / 4 recipes |
| НАШ | В проекте представлены лишь две позиции; бренд вошёл в актуальный отраслевой топ конкретного продавца. | 2 / 2 / 2 / 2 recipes |
| Overdose | Имеет стабильное project/mix presence, но лишь шесть профилей; фигурирует в актуальном обзоре рынка. | 6 / 6 / 6 / 5 recipes |
| Duft | Есть два профиля и один микс; важен как более лёгкий/средний бренд для ширины выбора, но следующий batch не должен обходить крупные gaps. | 2 / 2 / 2 / 1 recipe |

### Tier B

Element, Chabacco, Хулиган, Brusko, JAM, Husky, Bonche, Tangiers, Satyr и Smoke Angels. Это нужные бренды, но в первой волне не важнее отсутствующих Tier A. Для Bonche, Tangiers и Satyr в этой итерации не собрана достаточная официальная product-level evidence, поэтому их не следует вносить «по памяти».

### Tier C / later

Редкие, локальные или не подтверждённые актуальными источниками бренды — после покрытия Tier A/B и после отдельного evidence review.

## Product-level findings

- BlackBurn: официальный сайт подтверждает несколько десятков вкусов и линии Shock/KMTM/Something, но конкретная следующая batch отложена: у бренда уже высокая project coverage (8 профилей, 7 recipes), а нужны новые доказательные product pages.
- MustHave: официальный каталог одновременно даёт точное название, составные ноты и статус наличия; line как отдельная сущность на странице не заявлена. В плане используется `CONFIRMED_NONE` только для proposal и требует повторной проверки перед решением identity.
- Darkside: официальный каталог прямо показывает семейства `DARKSIDE`, `SHOT`, `SABOTAGE`, `Starline`, `XPERIENCE`. Для первых восьми кандидатов line — `SHOT`, а product names — официальные английские.
- Sebero: официальный сайт подтверждает отдельные линии `Classic`, `Arctic Mix`, `GID`, `Black`; для двух кандидатов line — `GID`.
- Spectrum: официальный сайт подтверждает названия линий; product page URL подтверждает конкретный товар и его line.

## Первая implementation batch: 24 продукта

Это **не список добавленных продуктов**. Все строки имеют `NOT_IMPLEMENTED`; отсутствие дубля проверено по current exact canonical ID, normalized source identity, aliases, Prisma и Product Flavor Profile Registry. `Профиль` обозначает основную ожидаемую taxonomy category для будущего review, а не числовое сенсорное значение.

| Brand / manufacturerId | Product line | Official product | Proposed canonicalProductId | Профиль | Evidence | Current status |
|---|---|---|---|---|---|---|
| MustHave / `musthave` | CONFIRMED_NONE | Green Tonic | `musthave-green-tonic` | beverage, citrus, herbal | official catalog | NOT_IMPLEMENTED |
| MustHave / `musthave` | CONFIRMED_NONE | Blue Blast | `musthave-blue-blast` | berry, citrus, mint | official catalog | NOT_IMPLEMENTED |
| MustHave / `musthave` | CONFIRMED_NONE | Red Rush | `musthave-red-rush` | berry, citrus, fruit | official catalog | NOT_IMPLEMENTED |
| MustHave / `musthave` | CONFIRMED_NONE | Greendizer | `musthave-greendizer` | fruit, citrus, sour | official catalog | NOT_IMPLEMENTED |
| MustHave / `musthave` | CONFIRMED_NONE | Black Orange | `musthave-black-orange` | berry, citrus | official catalog | NOT_IMPLEMENTED |
| MustHave / `musthave` | CONFIRMED_NONE | Sour Berries | `musthave-sour-berries` | berry, sour | official catalog | NOT_IMPLEMENTED |
| MustHave / `musthave` | CONFIRMED_NONE | Sour Apple | `musthave-sour-apple` | fruit, sour | official catalog | NOT_IMPLEMENTED |
| MustHave / `musthave` | CONFIRMED_NONE | Yolka | `musthave-yolka` | woody, fresh, herbal | official catalog | NOT_IMPLEMENTED |
| Darkside / `darkside` | SHOT | MOTO MORS | `darkside-shot-moto-mors` | berry, sour | official catalog | NOT_IMPLEMENTED |
| Darkside / `darkside` | SHOT | RONDO RIDE | `darkside-shot-rondo-ride` | berry, cooling | official catalog | NOT_IMPLEMENTED |
| Darkside / `darkside` | SHOT | LIMONCHAMPION | `darkside-shot-limonchampion` | citrus, alcohol | official catalog | NOT_IMPLEMENTED |
| Darkside / `darkside` | SHOT | BLUEBERRY BLAST 2.0 | `darkside-shot-blueberry-blast-2-0` | berry | official catalog | NOT_IMPLEMENTED |
| Darkside / `darkside` | SHOT | ENERGY DRIFT | `darkside-shot-energy-drift` | beverage | official catalog | NOT_IMPLEMENTED |
| Darkside / `darkside` | SHOT | NEED FOR SPIRIT | `darkside-shot-need-for-spirit` | alcohol, citrus | official catalog | NOT_IMPLEMENTED |
| Darkside / `darkside` | SHOT | APEROL SPEED | `darkside-shot-aperol-speed` | alcohol, beverage | official catalog | NOT_IMPLEMENTED |
| Darkside / `darkside` | SHOT | KVASSICA | `darkside-shot-kvassica` | beverage | official catalog | NOT_IMPLEMENTED |
| Spectrum / `spectrum` | Kitchen Line | Брускетта | `spectrum-kitchen-line-brusketta` | herbal, savory | official product page | NOT_IMPLEMENTED |
| Spectrum / `spectrum` | Mix Line | Балийский шейк | `spectrum-mix-line-baliiskii-sheik` | tropical, creamy | official product page | NOT_IMPLEMENTED |
| Spectrum / `spectrum` | Mix Line | Цветочный микс | `spectrum-mix-line-tsvetochnyi-miks` | floral | official product page | NOT_IMPLEMENTED |
| Spectrum / `spectrum` | Mix Line | Пряный чай | `spectrum-mix-line-pryanyi-chai` | tea, spice | official product page | NOT_IMPLEMENTED |
| Spectrum / `spectrum` | Kitchen Line | Пряный карри | `spectrum-kitchen-line-pryanyi-karri` | spice, savory | official product page | NOT_IMPLEMENTED |
| Spectrum / `spectrum` | Mix Line | Завтрак с облепихой | `spectrum-mix-line-zavtrak-s-oblepihoi` | berry, tea | official product page | NOT_IMPLEMENTED |
| Sebero / `sebero` | GID | Амстердам | `sebero-gid-amsterdam` | research required | official release news | NOT_IMPLEMENTED |
| Sebero / `sebero` | GID | Лиссабон | `sebero-gid-lissabon` | research required | official release news | NOT_IMPLEMENTED |

Proposed IDs являются только предложениями. В следующей задаче они должны генерироваться централизованной canonical-ID policy, а не копироваться вручную. Категории для Sebero GID намеренно не угаданы: в доступной новости подтверждены имя, линия и release, но не вкусовое описание.

### Почему именно эта batch

Четыре бренда распределены 8 / 8 / 6 / 2. Она закрывает нулевое coverage Darkside, Sebero и Spectrum, расширяет работающий MustHave без дублей, а также уменьшает дефицит beverage, tea, floral, herbal, spice и cooling. В ней нет более десяти позиций одного бренда и нет автоматического переноса магазинных написаний в aliases.

## Рецепты: следующий research, но не импорт

После product batch первыми изучать recipe evidence для Darkside, Sebero, Spectrum и JENT: сейчас их representation в 28 committed recipes равна нулю. Для каждого найденного рецепта отдельно хранить состав, точность пропорций, тип источника, confidence и независимое подтверждение. Ничего не импортировать в production snapshot без provenance и exact identity.

## Research Agent audit

Связанный research-agent найден только через локальные ignored scratch-артефакты, а не как модуль этого репозитория. Он читает сохранённые transcript JSON, запускает heuristic analyzer и resolver, затем записывает observations, processed-video state, cache и отдельный workbook в своём внешнем рабочем пространстве. В текущем виде он годится для поиска источников и черновых observations, но **не** для автоматического создания canonical facts, aliases, Product Flavor Profiles или scoring.

Перед переиспользованием нужны: относительная конфигурация путей, неизменяемый формат observation с provenance, отделение read-only extraction от записи, privacy audit и явная человеческая review boundary. Локальные scratch-файлы и transcripts не добавлялись в Git.

## Следующая implementation task

1. Подтвердить список 24 продуктов и порядок брендов.
2. Для каждого кандидата собрать отдельную official product page, проверить product line и все naming variants; пометить отсутствующие evidence как `DEFERRED`, не угадывать aliases.
3. Через существующий manual Tobacco Identity Decision pipeline создать только evidence-backed RESOLVED decisions.
4. Добавить Prisma/catalog entries и Product Flavor Profiles небольшими reviewable sub-batches; пустые dimensions оставить пустыми.
5. После exact coverage создать отдельную research iteration для ready mixes, затем — отдельную Builder UX v2: searchable selector, фильтр бренда, product cards и mobile UX. Native `<select>` не рассчитан на целевые 150–250 продуктов.

## Источники

- [Официальный каталог MUSTHAVE](https://musthave.ru/category/tabak-dlya-kalyana/) — текущие product names, notes и наличие.
- [Официальный каталог DARKSIDE](https://darkside-world.com/products/catalog?sort=new) — product families, конкретные SHOT и категории.
- [Официальный сайт SEBERO](https://sebero.ru/) и [новости SEBERO](https://sebero.ru/news) — линии бренда и GID releases.
- [Официальный сайт Spectrum](https://spectrum-tbc.ru/) и [страница представителей](https://spectrum-tbc.ru/partners) — линии и широкая сеть присутствия; official product pages подтверждают Spectrum candidates.
- [HTReviews: Sarma](https://htreviews.org/tobaccos/sarma) — специализированный каталог с актуальными отзывами и ассортиментом.
- [Hookah House 2025–2026](https://hookahhouse.ru/company/news/top_10_luchshikh_tabakov_dlya_kalyana_2025_2026/) — дополнительный редакционный сигнал, не sales ranking всей России.
