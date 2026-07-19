# Flavor Knowledge Layer

## Назначение

Flavor Knowledge Layer — независимый доменный справочник категорий, связей, утверждений и качества их подтверждения. Он предоставляет детерминированный query API для других движков, но не рассчитывает профиль смеси и не выставляет пользовательскую оценку.

## Границы слоёв

- Flavor Database хранит конкретные бренды, вкусы, числовые профили и назначенные им ноты.
- Mix Profile Engine рассчитывает средневзвешенный профиль и вклад компонентов.
- Knowledge Layer отвечает на вопросы о таксономии, родстве и известных связях.
- Compatibility Engine применяет знания к конкретному рассчитанному миксу и формирует технические факторы.
- Будущий Recommendation Engine сможет использовать профиль, совместимость и знания, но остаётся отдельным слоем.

Knowledge Layer не знает о React, Next.js, HTTP и Prisma Client. Registry является read-only TypeScript-конфигурацией. Это первая внутренняя версия модели, а не утверждение объективной истины о вкусе.

## Поток данных

```text
Flavor Database -> Mix Profile Engine -> Compatibility Engine -> Result/Explanation
                         |                       ^
                         +---- Knowledge Layer--+
                                      |
                  future recommendations / similar mixes / reviews
```

Существующий Prisma enum уже использует `DRINK` и `DAIRY`. Каноническая таксономия использует `BEVERAGE` и `CREAMY`; явный адаптер выполняет преобразование. `OTHER` намеренно не превращается в выдуманную каноническую категорию.

## Примеры

Категория:

```ts
{ id: "BERRY", parentId: "FRUIT", relatedCategoryIds: ["FLORAL", "CREAMY"], tags: ["berry", "fruit"] }
```

Связь:

```ts
{ left: "BERRY", right: "FLORAL", type: "GOOD_MATCH", baseScore: 0.4, ruleId: "category.berry-floral" }
```

Evidence:

```ts
{ id: "evidence.verified.core-pairs", type: "VERIFIED_TEST", weight: 0.9 }
```

Claim:

```ts
{ id: "claim.note.lavender-category", subjectType: "NOTE", subjectIds: ["lavender"], claimType: "HAS_CATEGORY", value: "FLORAL" }
```

Confidence агрегирует независимые evidence, их веса и разнообразие типов. `VERIFIED_TEST` даёт бонус; повтор одного источника учитывается один раз. Confidence оценивает подтверждённость утверждения, а не качество вкуса или совместимость микса.

## Ограничения первой версии

- Registry небольшой и хранится в коде, а не в Prisma.
- Нет внешних источников, scraping, отзывов и временного затухания evidence.
- Нет fuzzy search и локализованных UI-текстов.
- Умеренность кислотности остаётся числовым правилом Compatibility Engine.
- Интеграция v0.2.4 ограничена безопасными категориальными правилами, отсутствовавшими в v0.2.3.
