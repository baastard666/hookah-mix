import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createUnresolvedIdentityReport, importExpertMixKnowledge, type UnresolvedIdentityGroup, type UnresolvedIdentityPriority } from "../src/lib/expert-mix-knowledge-import";
import { listManufacturerProfiles, listProductLineProfiles } from "../src/lib/tobacco-profile";

const sha256 = async (filePath: string): Promise<string> => createHash("sha256").update(await readFile(filePath)).digest("hex").toUpperCase();
const escapeCell = (value: string): string => value.replaceAll("|", "\\|").replaceAll("\n", " ");
const shown = (value: string | null): string => value?.trim() || "—";
const row = (group: UnresolvedIdentityGroup): string => {
  const aliases = group.exactAliasCandidates.length ? group.exactAliasCandidates.map(candidate => `${candidate.kind}: ${candidate.matchedAlias} → ${candidate.canonicalValue}`).join("; ") : "—";
  return `| ${group.groupId} | ${escapeCell(shown(group.displayIdentity.manufacturer))} | ${escapeCell(shown(group.displayIdentity.productLine))} | ${escapeCell(shown(group.displayIdentity.productName))} | ${group.occurrenceCount} | ${group.verifiedMixCount} | ${group.currentStatus} | ${group.manufacturerKnown ? "да" : "нет"} | ${group.productLineKnown ? "да" : "нет"} | ${escapeCell(aliases)} | ${group.missingFields.join(", ") || "—"} |`;
};
const toMarkdown = (workbookName: string, workbookHash: string, report: ReturnType<typeof createUnresolvedIdentityReport>): string => {
  const priorities: UnresolvedIdentityPriority[] = ["P0", "P1", "P2", "P3"];
  const definitions: Record<UnresolvedIdentityPriority, string> = { P0: "unresolved-компоненты VERIFIED-миксов", P1: "manufacturer-only компоненты VERIFIED-миксов", P2: "остальные компоненты", P3: "каталог, не встречающийся в миксах" };
  const sections = priorities.map(priority => {
    const ids = new Set(report.priorityList[priority]);
    const groups = report.groups.filter(group => ids.has(group.groupId));
    return [`## ${priority} — ${definitions[priority]} (${groups.length})`, "", "| ID | Производитель | Линейка | Продукт | Появлений | VERIFIED-миксов | Статус | Производитель Registry | Линейка Registry | Exact alias-кандидаты | Отсутствуют поля |", "|---|---|---|---|---:|---:|---|---|---|---|---|", ...groups.map(row)].join("\n");
  });
  return ["# Deterministic unresolved identity report", "", `- Workbook: \`${workbookName}\``, `- SHA-256: \`${workbookHash}\``, `- Версия: \`${report.reportVersion}\``, "- Порядок источников: `Mix_Components`, затем `ОСНОВНАЯ_БАЗА`.", "- Группировка: exact normalized `manufacturer + productLine + productName`.", "- Статус: для групп с компонентами учитываются статусы компонентов; иначе — каталога. Консервативный порядок: `AMBIGUOUS`, `UNRESOLVED`, `MANUFACTURER_ONLY`, `NOT_CHECKED`, `RESOLVED`.", "- Registry: только exact normalized canonical/alias-проверка.", "- Fuzzy matching: не выполнялся.", "- Canonical product ID: не создавались и не назначались.", "", `Компонентов: **${report.summary.componentRows}**; позиций каталога: **${report.summary.catalogRows}**; групп: **${report.summary.groupCount}**.`, "", ...sections, ""].join("\n");
};

const main = async (): Promise<void> => {
  const requestedPath = process.argv[2];
  assert.ok(requestedPath, "Передайте полный путь к workbook первым аргументом.");
  const workbookPath = path.resolve(requestedPath);
  const beforeHash = await sha256(workbookPath);
  const imported = await importExpertMixKnowledge(workbookPath);
  const report = createUnresolvedIdentityReport({ components: imported.components, catalog: imported.tobacco, mixes: imported.mixes, manufacturers: listManufacturerProfiles(), productLines: listProductLineProfiles() });
  const afterHash = await sha256(workbookPath);
  assert.equal(afterHash, beforeHash, "Исходный workbook изменился во время построения отчёта.");
  const outputDirectory = path.resolve("reports");
  await mkdir(outputDirectory, { recursive: true });
  const jsonPath = path.join(outputDirectory, "unresolved-identity-report.json");
  const markdownPath = path.join(outputDirectory, "unresolved-identity-report.md");
  await writeFile(jsonPath, `${JSON.stringify({ workbook: { name: path.basename(workbookPath), sha256: beforeHash, unchanged: true }, ...report }, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, toMarkdown(path.basename(workbookPath), beforeHash, report), "utf8");
  console.log(JSON.stringify({ workbookPath, sha256Before: beforeHash, sha256After: afterHash, sourceWorkbookUnchanged: true, jsonPath, markdownPath, summary: report.summary }, null, 2));
};
main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
