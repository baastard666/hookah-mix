# Mix Catalog

`/mixes` и `/mixes/[slug]` используют только закоммиченный `src/data/verified-mix-catalog.generated.json`. Production runtime не открывает локальный workbook и не строит registry из Excel.

Генерация выполняется локально: `pnpm generate:verified-mix-catalog "data/hookah_mix_database.xlsx"`. Она импортирует workbook read-only, строит exact Verified Mix Recipe Registry, рассчитывает Mix Analysis v2 и сохраняет только public-safe projection. SHA и размер workbook проверяются до и после, но не попадают в runtime snapshot.

Snapshot детерминирован: не содержит timestamp, случайных ID, абсолютных путей или OS-specific полей. При изменении workbook, identity decisions, Product Flavor Profiles, Mix Analysis либо Verified Recipe Registry его нужно регенерировать и проверить `pnpm verify:mix-catalog`.

Slug — URL-идентификатор, не identity продукта: ASCII kebab-case из title с deterministic suffix recipeId. Predicted score всегда подписан как прогноз системы; observed layer не подменяется данными recipe status.
