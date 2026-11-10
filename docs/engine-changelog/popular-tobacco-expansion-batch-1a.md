# Popular Tobacco Expansion — Batch 1A

Дата review: 2026-11-10. Batch добавляет 13 новых exact `RESOLVED` catalog products. Четырнадцатый кандидат, MUSTHAVE Sour Berries, уже был в authoritative registry и Prisma, поэтому не дублируется.

## Review queue

| Brand | Product | Line | Identity evidence | Profile evidence | Duplicate | Status |
|---|---|---|---|---|---|---|
| JENT | Currant WOW | Classic | manufacturer line presentation + current catalog | red/black currant | нет | RESOLVED |
| JENT | Grape Me | Classic | manufacturer line presentation + current catalog | grape, mint | нет | RESOLVED |
| JENT | Настойка Заморская | Alcohol | manufacturer line presentation + current catalog | orange, rosemary, currant | нет | RESOLVED |
| JENT | Лесная Наливка | Alcohol | manufacturer line presentation + current catalog | raspberry, cranberry, juniper | нет | RESOLVED |
| JENT | Забава | Classic | manufacturer line presentation + current catalog | aloe, strawberry, kiwi | нет | RESOLVED |
| JENT | Follar | Herbal | manufacturer line presentation + current catalog | gooseberry, floral-herbal | нет | RESOLVED |
| JENT | Air | Alcohol | manufacturer line presentation + current catalog | gin, juniper, citrus | нет | RESOLVED |
| JENT | Baba Au Savarin | Classic | manufacturer line presentation + current catalog | rum baba | нет | RESOLVED |
| Musthave | Green Tonic | confirmed none | official catalog | pear, lemon, tarragon | нет | RESOLVED |
| Musthave | Greendizer | confirmed none | official product page | kiwi, apple, lime | нет | RESOLVED |
| Musthave | Sour Berries | confirmed none | official product page | existing profile | already present | RESOLVED (existing) |
| Sebero | Амстердам | GID | official release | no exact public flavor description | нет | RESOLVED, no categories |
| Sebero | Лиссабон | GID | official release | no exact public flavor description | нет | RESOLVED, no categories |
| Spectrum | Цветочный микс | Mix Line | official product page | floral | нет | RESOLVED |

All new Product Flavor Profiles are intentionally `LOW` confidence with zero numeric dimensions: a name or retail description never becomes a synthetic `5`. Sebero GID categories remain empty because exact flavor descriptions were not found.

## JENT

| Product | Line | Identity | Categories | Filled dimensions | Confidence | Builder |
|---|---|---|---|---:|---|---|
| Currant WOW | Classic | RESOLVED | BERRY, SOUR | 0/7 | LOW | yes |
| Grape Me | Classic | RESOLVED | FRUIT, MINT | 0/7 | LOW | yes |
| Настойка Заморская | Alcohol | RESOLVED | CITRUS, HERBAL, BERRY, ALCOHOL | 0/7 | LOW | yes |
| Лесная Наливка | Alcohol | RESOLVED | BERRY, WOODY, ALCOHOL | 0/7 | LOW | yes |
| Забава | Classic | RESOLVED | FRUIT, BERRY | 0/7 | LOW | yes |
| Follar | Herbal | RESOLVED | HERBAL, FLORAL, BERRY | 0/7 | LOW | yes |
| Air | Alcohol | RESOLVED | ALCOHOL, WOODY, CITRUS | 0/7 | LOW | yes |
| Baba Au Savarin | Classic | RESOLVED | DESSERT, ALCOHOL, BAKERY | 0/7 | LOW | yes |

Для первых user smoke tests наиболее полезны Currant WOW (кислые ягоды), Grape Me (mint), Настойка Заморская (herbal/alcohol), Air (gin/citrus) и Baba Au Savarin (dessert/alcohol). Candidate Gold Set: Currant WOW + Musthave Vanilla Cream (смягчение кислинки); Grape Me + Element Mint (проверка cooling dominance); Настойка Заморская + Musthave Green Tonic (herbal/citrus); Лесная Наливка + Overdose Coffee (контраст berry/woody); Baba Au Savarin + HIT Banana Shake (dessert bridge). Это только research candidates, не recipes.

Не изменялись engine/scoring, recipes, `/mixes` snapshot, Prisma schema/migrations или workbook. User experience не является identity/profile evidence; отдельный `UserSmokeObservation` остаётся будущей задачей.
