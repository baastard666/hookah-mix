# Canonical Mix Scoring Integration

## Назначение

Модуль `src/lib/canonical-mix-scoring/` проводит authoritative Tobacco Identity Decision Registry через существующий pipeline анализа микса. Он не заменяет Mix Profile, Compatibility и Recommendation Engine: передаёт им разрешённые identity и effective-профили, затем формирует отдельный прогноз качества и оценку уверенности.

```text
Prisma Flavor / workbook component
  -> exact canonical resolution
  -> effective tobacco profile
  -> duplicate canonical aggregation
  -> Mix Profile Engine
  -> Compatibility Engine
  -> Recommendation Engine
  -> predicted quality + confidence + data quality
```

## Identity resolution

- `RESOLVED`: используется authoritative canonical product ID; raw identity и source component ID остаются во внутреннем результате.
- `MANUFACTURER_ONLY`: используется только подтверждённый производитель; конкретный продукт и product line не назначаются.
- `AMBIGUOUS`: кандидат не выбирается автоматически; используется source profile либо нейтральный fallback.
- `UNRESOLVED`: manufacturer/product не угадываются; используется source profile либо нейтральный fallback.

Разрешение выполняется по exact source identity, canonical ID или exact alias внутри подтверждённого manufacturer. Fuzzy matching отсутствует. Старый технический resolver не может самостоятельно создать authoritative product-level resolution.

## Effective profile

Приоритет источников по убыванию:

1. пользовательский покур;
2. подтверждённый внутренний тест;
3. canonical product profile;
4. агрегированные внешние данные;
5. каталожный/предварительный технический профиль;
6. source-row profile;
7. нейтральный fallback.

Выбор выполняется отдельно для каждого параметра, без усреднения разных источников. Для каждого значения сохраняются `source`, `profileId` и reliability. Категориальный technical profile применяется только к `RESOLVED` identity и не превращает `MANUFACTURER_ONLY` в профиль товара. Подтверждённый диапазон процентов не создаётся без отдельного источника.

## Duplicate canonical components

Компоненты объединяются только при одинаковом `RESOLVED canonicalProductId`. Доли суммируются, source component IDs сохраняются, а результат получает warning `DUPLICATE_CANONICAL_COMPONENT`. Совпадающие названия без общего canonical ID, разные manufacturers и разные product lines не объединяются.

## Scoring contract

`predictedQualityScore` находится в диапазоне 0–10 и использует централизованные веса:

| Часть | Вес |
| --- | ---: |
| compatibility | 25% |
| proportion logic | 20% |
| component quality | 20% |
| balance | 15% |
| risks | 10% |
| confirmations | 10% |

`predictionConfidence`, `dataQuality` и `verifiedSmokeScore` не входят в одно число с прогнозом качества. Неразрешённая доля снижает confidence пропорционально своему весу, но не делает смесь автоматически плохой. Реальная оценка покура хранится отдельно и никогда не заменяется прогнозом.

## Public boundary

Public mapper исключает raw identity, source row, decision ID, debug reasons, evidence, URL, авторов и внутренние заметки. API создания микса сохраняет прежний `id` и добавляет public-safe canonical components, predicted score, confidence label, data quality, score breakdown, risk flags и признак verified smoke score.

## Ограничения

- Canonical product sensory registry пока пуст; для Prisma-вкусов основным sensory source остаётся проверенный source profile.
- Workbook не содержит product sensory profiles и smoke scores для 37 VERIFIED-миксов, поэтому diagnostic использует нейтральный fallback и показывает только predicted scores.
- Категориальные manufacturer/product-line profiles заполняют только доступные технические поля.
- Старый анализатор временно остаётся источником описания и heat recommendations.
