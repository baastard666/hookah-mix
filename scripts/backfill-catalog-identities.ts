import { prisma } from "../src/lib/prisma";
import { calculateCatalogIdentityCoverage, createPrismaCatalogIdentityStore, runCatalogIdentityBackfill } from "../src/lib/catalog-identity";

const flags = new Set(process.argv.slice(2));
const apply = flags.has("--apply");
if (apply && flags.has("--dry-run")) throw new Error("Use either --apply or --dry-run, not both");
const knownFlags = new Set(["--apply", "--dry-run", "--json", "--include-test", "--only-unresolved", "--force-verified"]);
const unknownFlags = [...flags].filter(flag => !knownFlags.has(flag));
if (unknownFlags.length) throw new Error(`Unknown flags: ${unknownFlags.join(", ")}`);

const main = async (): Promise<void> => {
  const store = createPrismaCatalogIdentityStore(prisma);
  const before = calculateCatalogIdentityCoverage(await store.list());
  const report = await runCatalogIdentityBackfill(store, { apply, includeTest: flags.has("--include-test"), onlyUnresolved: flags.has("--only-unresolved"), forceVerified: flags.has("--force-verified") });
  const after = calculateCatalogIdentityCoverage(await store.list());
  const output = { report, coverage: { before, after } };
  if (flags.has("--json")) console.log(JSON.stringify(output, null, 2));
  else {
    console.log(`Canonical catalog identity backfill: ${report.mode}`);
    console.table(report.counters);
    console.table(report.items.map(item => ({ catalogId: item.catalogId, product: `${item.brand} / ${item.name}`, action: item.action, status: item.proposed.identityStatus, canonicalProductId: item.proposed.canonicalProductId, reasons: item.reasonCodes.join(", "), warnings: item.warnings.join(", ") })));
    console.log("Coverage before:"); console.table(before);
    console.log("Coverage after:"); console.table(after);
  }
};

main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
