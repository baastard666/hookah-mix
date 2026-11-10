# ADR-028: generated public Mix Catalog snapshot

Private workbook не доступен в production runtime и не должен читаться Next.js страницами. Поэтому локальный generator создаёт детерминированный public-safe JSON snapshot из exact recipes и Mix Analysis v2. Snapshot можно коммитить: он не содержит source/evidence/provenance, локальных путей, hash workbook или private URL. `/mixes` читает только snapshot; workbook остаётся локальным source-of-truth. Regeneration обязательна после изменения входных registry или анализа.
