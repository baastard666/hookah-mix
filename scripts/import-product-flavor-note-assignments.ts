// ADR-018: transfers dominantNoteIds from PRODUCT_FLAVOR_PROFILE_REGISTRY into Prisma
// FlavorNoteAssignment for the 86 RESOLVED products already imported by
// scripts/import-product-flavor-profiles.ts (ADR-016). All planning/mapping logic is pure and
// lives in src/lib/product-flavor-profile-note-import (see its own tests); this script is only
// I/O: reading existing rows, calling the planner, printing the report, and - only with --apply -
// writing. Deliberately does NOT touch CATEGORY_RELATIONS/NOTE_COMPATIBILITY_RULES - wiring new
// content-level relations (e.g. FLORAL+CREAMY) is a separate future task per ADR-018 п.4.
//
// Usage:
//   npx tsx scripts/import-product-flavor-note-assignments.ts              (dry-run, default, no writes)
//   npx tsx scripts/import-product-flavor-note-assignments.ts --dry-run     (explicit dry-run, same as above)
//   npx tsx scripts/import-product-flavor-note-assignments.ts --apply       (writes for real)
//   add --json to either mode for machine-readable output instead of console.table
import { buildDisplayName } from "../src/lib/product-flavor-profile-import";
import { getProductFlavorProfile } from "../src/lib/product-flavor-profile";
import { buildNoteImportPlan } from "../src/lib/product-flavor-profile-note-import";
import type { ExistingFlavorForNoteImport, NoteImportPlan, NoteImportSkipReason, ProductForNoteImport } from "../src/lib/product-flavor-profile-note-import";
import { prisma } from "../src/lib/prisma";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../src/lib/tobacco-identity-decisions";
import type { TobaccoIdentityDecision } from "../src/lib/tobacco-identity-decisions";

const flags = new Set(process.argv.slice(2));
const apply = flags.has("--apply");
if (apply && flags.has("--dry-run")) throw new Error("Use either --apply or --dry-run, not both");
const knownFlags = new Set(["--apply", "--dry-run", "--json"]);
const unknownFlags = [...flags].filter(flag => !knownFlags.has(flag));
if (unknownFlags.length) throw new Error(`Unknown flags: ${unknownFlags.join(", ")}`);

const toProduct = (decisionRecord: Readonly<TobaccoIdentityDecision>): ProductForNoteImport => {
  const { canonicalProductId, canonicalManufacturerName, canonicalProductLineName, canonicalProductName } = decisionRecord.decision;
  if (!canonicalProductId || !canonicalManufacturerName || !canonicalProductName) throw new Error(`RESOLVED decision ${decisionRecord.id} is missing a required identity field - this should be impossible for a RESOLVED status.`);
  const profile = getProductFlavorProfile(canonicalProductId);
  if (!profile) throw new Error(`No Product Flavor Profile Registry entry for RESOLVED canonicalProductId "${canonicalProductId}" - the registries have diverged since verify:product-flavor-profile last passed.`);
  return { canonicalProductId, manufacturer: canonicalManufacturerName, displayName: buildDisplayName(canonicalProductLineName, canonicalProductName), dominantNoteIds: profile.dominantNoteIds };
};

const resolvedDecisions = TOBACCO_IDENTITY_DECISION_REGISTRY.getByStatus("RESOLVED");
const products = resolvedDecisions.map(toProduct);

const buildExistingFlavorMap = async (canonicalProductIds: readonly string[]): Promise<Map<string, ExistingFlavorForNoteImport>> => {
  const rows = await prisma.flavor.findMany({
    where: { canonicalProductId: { in: [...canonicalProductIds] } },
    select: { id: true, canonicalProductId: true, catalogEntryType: true, notes: { select: { flavorNoteId: true } } },
  });
  const map = new Map<string, ExistingFlavorForNoteImport>();
  for (const row of rows) {
    if (!row.canonicalProductId) continue;
    map.set(row.canonicalProductId, { flavorId: row.id, catalogEntryType: row.catalogEntryType, assignedNoteIds: row.notes.map(note => note.flavorNoteId) });
  }
  return map;
};

const buildExistingNoteIdBySlug = async (): Promise<Map<string, number>> => {
  const rows = await prisma.flavorNote.findMany({ select: { id: true, slug: true } });
  return new Map(rows.map(row => [row.slug, row.id]));
};

const applyPlan = async (plan: NoteImportPlan, existingNoteIdBySlug: ReadonlyMap<string, number>): Promise<void> => {
  const noteIdBySlug = new Map(existingNoteIdBySlug);
  for (const note of plan.notesToCreate) {
    const created = await prisma.flavorNote.upsert({ where: { slug: note.slug }, update: {}, create: { name: note.name, slug: note.slug, category: note.category } });
    noteIdBySlug.set(note.slug, created.id);
  }
  for (const assignment of plan.assignmentsToCreate) {
    const flavorNoteId = noteIdBySlug.get(assignment.noteSlug);
    if (flavorNoteId === undefined) throw new Error(`Internal error: no note id resolved for slug "${assignment.noteSlug}" (${assignment.canonicalProductId}) - a planned note creation must have failed silently.`);
    await prisma.flavorNoteAssignment.upsert({
      where: { flavorId_flavorNoteId: { flavorId: assignment.flavorId, flavorNoteId } },
      update: {},
      create: { flavorId: assignment.flavorId, flavorNoteId, intensity: assignment.intensity, noteType: assignment.noteType },
    });
  }
};

const summarize = (plan: NoteImportPlan) => {
  const skippedByReason: Record<NoteImportSkipReason, number> = { NO_FLAVOR_FOUND: 0, TEST_ENTRY: 0, NO_DOMINANT_NOTES: 0 };
  for (const item of plan.skipped) skippedByReason[item.reason] += 1;
  const assignmentsByCategory: Record<string, number> = {};
  for (const item of plan.assignmentsToCreate) assignmentsByCategory[item.knowledgeCategory] = (assignmentsByCategory[item.knowledgeCategory] ?? 0) + 1;
  return { skippedByReason, assignmentsByCategory };
};

const main = async (): Promise<void> => {
  const existingFlavorByCanonicalProductId = await buildExistingFlavorMap(products.map(item => item.canonicalProductId));
  const existingNoteIdBySlug = await buildExistingNoteIdBySlug();
  const plan = buildNoteImportPlan({ products, existingFlavorByCanonicalProductId, existingNoteIdBySlug });
  const summary = summarize(plan);
  const output = { mode: apply ? "APPLY" : "DRY_RUN", totalProducts: products.length, notesToCreate: plan.notesToCreate.length, assignmentsToCreate: plan.assignmentsToCreate.length, alreadyAssignedCount: plan.alreadyAssignedCount, ...summary, plan };
  if (apply) await applyPlan(plan, existingNoteIdBySlug);

  if (flags.has("--json")) { console.log(JSON.stringify(output, null, 2)); return; }

  console.log(`Перенос dominantNoteIds в FlavorNoteAssignment (ADR-018): ${output.mode}`);
  console.log(`RESOLVED продуктов: ${products.length}`);

  console.log(`\nНовых generic-нот к созданию (${plan.notesToCreate.length}):`);
  if (plan.notesToCreate.length) console.table(plan.notesToCreate); else console.log("нет - все нужные категории уже представлены существующими нотами.");

  console.log(`\nНовых назначений FlavorNoteAssignment: ${plan.assignmentsToCreate.length}`);
  console.log(`Уже назначено ранее (идемпотентно пропущено): ${plan.alreadyAssignedCount}`);
  console.log("Назначения по категориям:");
  console.table(summary.assignmentsByCategory);

  console.log("\nПропущено по причинам:");
  console.table(summary.skippedByReason);

  if (plan.warnings.length) {
    console.log(`\nПредупреждения (${plan.warnings.length}):`);
    console.table(plan.warnings);
  } else {
    console.log("\nПредупреждений нет.");
  }

  console.log("\nПервые 20 планируемых назначений (используйте --json для полного вывода):");
  console.table(plan.assignmentsToCreate.slice(0, 20).map(item => ({
    canonicalProductId: item.canonicalProductId,
    product: `${item.manufacturer} / ${item.displayName}`,
    category: item.knowledgeCategory,
    noteSlug: item.noteSlug,
  })));

  if (!apply) console.log("\nЭто dry-run: в базу ничего не записано. Запустите с --apply для реальной записи (только после явного подтверждения). CATEGORY_RELATIONS/NOTE_COMPATIBILITY_RULES этим скриптом не затрагиваются (ADR-018 п.4).");
};

main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
