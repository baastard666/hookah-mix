# Canonical Catalog Identity Persistence

## Назначение

Начиная с v0.2.9 каталог хранит явную каноническую идентичность товара. Resolver v0.2.8 остаётся детерминированным источником предложений и диагностики, но анализу не потребуется постоянно заново разбирать строки `brand/name`.

```text
Flavor display fields
  -> Identity Resolver v0.2.8
  -> mapper / dry-run diff
  -> persisted canonical identity
  -> Tobacco Product Profile Registry
  -> future Product Flavor Profiles and Expert Mix Knowledge
```

## Хранение

Существующая модель `Flavor` расширена полями:

- `manufacturerId` — ID производителя статического registry;
- `productLineId` — подтверждённый ID линейки или `null`;
- `canonicalProductName` — имя конкретного продукта;
- `canonicalProductId` — nullable global unique ID;
- `identityStatus`;
- `identityVerified`;
- `catalogEntryType`.

Database primary key `Flavor.id`, display-поля, связи и технические вкусовые характеристики остаются прежними. `manufacturerId` и `productLineId` не являются SQL foreign keys: их владельцем остаётся versioned read-only registry, а согласованность проверяет application layer.

Технические strength, heat resistance, leaf type, evidence и confidence в Prisma не копируются.

## Product ID

Подтверждённая линейка:

```text
<productLineId>-<unicode-safe-product-slug>
darkside-core-supernova
```

Известный производитель без подтверждённой линейки:

```text
<manufacturerId>-manufacturer-only-<unicode-safe-product-slug>
darkside-manufacturer-only-кокос
```

Маркер `manufacturer-only` не позволяет line-less ID совпасть с ID подтверждённой линейки. Неизвестный производитель не получает `canonicalProductId`. ID детерминирован и не использует UUID, дату, случайность или fuzzy matching. Начиная с ADR-013 единый ASCII builder использует фиксированную транслитерацию, если официальное английское canonical name не подтверждено.

## Состояния и верификация

`MANUFACTURER_ONLY` — допустимое состояние: производитель известен, а линия намеренно остаётся `null`, пока не подтверждена. Resolver и backfill никогда не выставляют `identityVerified=true`. Флаг означает ручную проверку или доверенный импорт; обычный backfill возвращает `SKIPPED_VERIFIED` и не перезаписывает такую запись.

Explicit update service проверяет registry IDs, принадлежность линейки производителю, уникальность ID и выполняет изменение транзакционно. Он не меняет исходные `brand/name`.

## Backfill и coverage

`backfill:catalog-identities` по умолчанию работает как dry-run и показывает старые и предлагаемые значения, reasons и warnings. Запись разрешена только через `--apply`, внутри одной транзакции. Поддерживаются `--json`, `--include-test`, `--only-unresolved` и опасный явный `--force-verified`.

Примеры:

```bash
pnpm backfill:catalog-identities --dry-run
pnpm backfill:catalog-identities --dry-run --json
pnpm backfill:catalog-identities --apply
pnpm verify:canonical-catalog-identity
```

`Test Kitchen` помечен `TEST`: это подтверждено самим seed (девять записей с описанием «Тестовый профиль») и использованием в контролируемых verify-наборах. Тестовые записи исключены из production coverage и backfill по умолчанию.

## Границы v0.2.9

UI, scoring, Mix Analysis Service, Recommendation Engine и технический registry не изменяются. Экспертная база миксов будет привязана по `canonicalProductId` только после стабилизации Product Identity и Knowledge Schema.
