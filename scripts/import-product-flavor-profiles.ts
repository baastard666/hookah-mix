// ADR-016 importer: loads the 86 RESOLVED canonical products from TOBACCO_IDENTITY_DECISION_REGISTRY,
// pulls their evidence-backed 7 ADR-014 dimensions from PRODUCT_FLAVOR_PROFILE_REGISTRY, and
// upserts/creates the corresponding Prisma Flavor rows. All planning/mapping logic is pure and lives in
// src/lib/product-flavor-profile-import (see its own tests); this script is only I/O: reading existing
// rows, calling the planner, printing the report, and - only with --apply - writing.
//
// Usage:
//   npx tsx scripts/import-product-flavor-profiles.ts              (dry-run, default, no writes)
//   npx tsx scripts/import-product-flavor-profiles.ts --dry-run     (explicit dry-run, same as above)
//   npx tsx scripts/import-product-flavor-profiles.ts --apply       (writes for real)
//   add --json to either mode for machine-readable output instead of console.table
import { FLAVOR_PROFILE_CORE_FIELDS } from "../src/lib/flavors/types";
import { prisma } from "../src/lib/prisma";
import { getProductFlavorProfile } from "../src/lib/product-flavor-profile";
import { buildBrandSlug, buildFlavorSlug, planFlavorImport } from "../src/lib/product-flavor-profile-import";
import type { ExistingFlavorForImport, FlavorImportPlanItem, ResolvedDecisionForImport } from "../src/lib/product-flavor-profile-import";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../src/lib/tobacco-identity-decisions";
import type { TobaccoIdentityDecision } from "../src/lib/tobacco-identity-decisions";

const flags = new Set(process.argv.slice(2));
const apply = flags.has("--apply");
if (apply && flags.has("--dry-run")) throw new Error("Use either --apply or --dry-run, not both");
const knownFlags = new Set(["--apply", "--dry-run", "--json"]);
const unknownFlags = [...flags].filter(flag => !knownFlags.has(flag));
if (unknownFlags.length) throw new Error(`Unknown flags: ${unknownFlags.join(", ")}`);

const coreFieldSelect = Object.fromEntries(FLAVOR_PROFILE_CORE_FIELDS.map(field => [field, true])) as Record<(typeof FLAVOR_PROFILE_CORE_FIELDS)[number], true>;

const findExistingFlavor = async (canonicalProductId: string, brandSlug: string, flavorSlug: string): Promise<ExistingFlavorForImport | null> => {
  const select = { id: true, canonicalProductId: true, catalogEntryType: true, ...coreFieldSelect } as const;
  const byCanonicalId = await prisma.flavor.findUnique({ where: { canonicalProductId }, select });
  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
  const bySlug = brand ? await prisma.flavor.findUnique({ where: { brandId_slug: { brandId: brand.id, slug: flavorSlug } }, select }) : null;
  if (byCanonicalId && bySlug && byCanonicalId.id !== bySlug.id) {
    throw new Error(`Anomaly: canonicalProductId ${canonicalProductId} matches row id=${byCanonicalId.id}, but brand+slug (${brandSlug}/${flavorSlug}) matches a different row id=${bySlug.id}. Resolve manually before importing.`);
  }
  return byCanonicalId ?? bySlug;
};

const toResolvedDecision = (decisionRecord: Readonly<TobaccoIdentityDecision>): ResolvedDecisionForImport | null => {
  const { canonicalProductId, canonicalManufacturerName, canonicalProductLineName, canonicalProductName, manufacturerId, productLineId } = decisionRecord.decision;
  if (!canonicalProductId || !canonicalManufacturerName || !canonicalProductName) return null;
  return { canonicalProductId, canonicalManufacturerName, canonicalProductLineName, canonicalProductName, manufacturerId, productLineId };
};

const resolvedDecisions = TOBACCO_IDENTITY_DECISION_REGISTRY.getByStatus("RESOLVED");

const buildPlan = async (): Promise<FlavorImportPlanItem[]> => {
  const plan: FlavorImportPlanItem[] = [];
  for (const decisionRecord of resolvedDecisions) {
    const decision = toResolvedDecision(decisionRecord);
    if (!decision) throw new Error(`RESOLVED decision ${decisionRecord.id} is missing a required identity field - this should be impossible for a RESOLVED status.`);
    const profile = getProductFlavorProfile(decision.canonicalProductId);
    if (!profile) throw new Error(`No Product Flavor Profile Registry entry for RESOLVED canonicalProductId "${decision.canonicalProductId}" - the registries have diverged since verify:product-flavor-profile last passed.`);
    const brandSlug = buildBrandSlug(decision.canonicalManufacturerName);
    const flavorSlug = buildFlavorSlug(decision.canonicalProductLineName, decision.canonicalProductName);
    const existingFlavor = await findExistingFlavor(decision.canonicalProductId, brandSlug, flavorSlug);
    plan.push(planFlavorImport({ decision, profile, existingFlavor }));
  }
  return plan;
};

const applyPlan = async (plan: readonly FlavorImportPlanItem[]): Promise<void> => {
  for (const item of plan) {
    if (item.action === "SKIPPED_TEST") continue;
    const brand = await prisma.brand.upsert({ where: { slug: item.brandSlug }, update: {}, create: { name: item.manufacturer, slug: item.brandSlug } });
    if (item.action === "CREATE") {
      await prisma.flavor.create({
        data: {
          brandId: brand.id, name: item.displayName, slug: item.flavorSlug, description: item.description,
          ...item.dimensionValues,
          cooling: null, creaminess: null, bitterness: null, dryness: null, dessertLevel: null, spiceLevel: null, floralLevel: null, herbalLevel: null, smokyLevel: null, naturalness: null, persistence: null,
          profileStatus: "DRAFT", profileSource: "MIXED",
          manufacturerId: item.manufacturerId, productLineId: item.productLineId, canonicalProductName: item.productName, canonicalProductId: item.canonicalProductId,
          identityStatus: "RESOLVED", identityVerified: true, catalogEntryType: "REAL",
        },
      });
    } else if (item.action === "UPDATE" && item.existingFlavorId !== null) {
      // ADR-016 п.2: only the 7 core fields + identity linkage are touched. name/description/profileStatus/
      // profileSource/catalogEntryType and all 11 secondary fields on the existing row are left untouched.
      await prisma.flavor.update({
        where: { id: item.existingFlavorId },
        data: {
          ...item.dimensionValues,
          manufacturerId: item.manufacturerId, productLineId: item.productLineId, canonicalProductName: item.productName, canonicalProductId: item.canonicalProductId,
          identityStatus: "RESOLVED", identityVerified: true,
        },
      });
    }
  }
};

const summarize = (plan: readonly FlavorImportPlanItem[]) => {
  const counters = { CREATE: 0, UPDATE: 0, SKIPPED_TEST: 0 };
  const completeness = { DETAILED: 0, GOOD: 0, BASIC: 0, MINIMAL: 0 };
  for (const item of plan) { counters[item.action] += 1; completeness[item.dataCompleteness] += 1; }
  const collisions = plan.filter(item => item.action === "UPDATE" && item.changedFields.length > 0);
  const warnings = plan.filter(item => item.warnings.length > 0);
  return { counters, completeness, collisions, warnings, totalFilledDimensions: plan.reduce((sum, item) => sum + item.filledDimensionCount, 0) };
};

const main = async (): Promise<void> => {
  const plan = await buildPlan();
  const summary = summarize(plan);
  const output = { mode: apply ? "APPLY" : "DRY_RUN", totalDecisions: resolvedDecisions.length, ...summary, plan };
  if (apply) await applyPlan(plan);

  if (flags.has("--json")) { console.log(JSON.stringify(output, null, 2)); return; }

  console.log(`Product Flavor Profile Registry import: ${output.mode}`);
  console.log(`RESOLVED decisions found: ${resolvedDecisions.length}`);
  console.table(summary.counters);
  console.log("Разбивка по dataCompleteness (ADR-016 п.1):");
  console.table(summary.completeness);
  console.log(`Суммарно заполненных измерений: ${summary.totalFilledDimensions} из ${resolvedDecisions.length * FLAVOR_PROFILE_CORE_FIELDS.length} возможных.`);

  if (summary.collisions.length) {
    console.log(`\nКоллизии с существующими данными (${summary.collisions.length}) - будет перезаписано при --apply:`);
    console.table(summary.collisions.map(item => ({
      canonicalProductId: item.canonicalProductId,
      product: `${item.manufacturer} / ${item.displayName}`,
      existingFlavorId: item.existingFlavorId,
      changes: item.changedFields.map(change => `${change.field}: ${change.from ?? "null"} → ${change.to ?? "null"}`).join("; "),
    })));
  } else {
    console.log("\nКоллизий с существующими данными не найдено.");
  }

  if (summary.warnings.length) {
    console.log(`\nПредупреждения (${summary.warnings.length}), включая почти-дубли (ADR-016 п.4):`);
    console.table(summary.warnings.map(item => ({ canonicalProductId: item.canonicalProductId, action: item.action, warnings: item.warnings.join(" | ") })));
  } else {
    console.log("\nПредупреждений нет.");
  }

  console.log("\nПолный план (первые 20 строк; используйте --json для полного вывода):");
  console.table(plan.slice(0, 20).map(item => ({
    canonicalProductId: item.canonicalProductId,
    product: `${item.manufacturer} / ${item.displayName}`,
    action: item.action,
    dataCompleteness: item.dataCompleteness,
    filled: `${item.filledDimensionCount}/7`,
  })));

  if (!apply) console.log("\nЭто dry-run: в базу ничего не записано. Запустите с --apply для реальной записи (только после явного подтверждения).");
};

main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
