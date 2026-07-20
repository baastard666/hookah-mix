import { prisma } from "../src/lib/prisma";
import { adaptCatalogTobaccoForIdentity, auditTobaccoCatalogEntries } from "../src/lib/tobacco-product-identity";

const main = async (): Promise<void> => {
  const rows = await prisma.flavor.findMany({ select: { id: true, name: true, brand: { select: { name: true } } }, orderBy: [{ brand: { name: "asc" } }, { name: "asc" }] });
  const entries = rows.map(adaptCatalogTobaccoForIdentity);
  const audit = auditTobaccoCatalogEntries(entries);

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(audit, null, 2));
    return;
  }

  console.log("Tobacco Catalog Identity Audit");
  console.table(audit.counters);
  if (audit.problems.length) {
    console.log("Problem records:");
    console.table(audit.problems.map(result => ({ catalogId: result.catalogId ?? null, brand: result.originalInput.brand, productLine: result.originalInput.productLine, name: result.originalInput.name, status: result.status, reasons: result.reasonCodes.join(", "), candidates: result.candidates.join(", ") })));
  }
  if (audit.duplicateCandidates.length) console.table(audit.duplicateCandidates);
  else console.log("Duplicate candidates: none");
};

main()
  .catch(error => {
    console.error("Catalog audit failed:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
