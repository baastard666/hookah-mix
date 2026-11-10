import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPrismaCatalogIdentityStore } from "../src/lib/catalog-identity";
import { runCatalogPersistenceReconciliation } from "../src/lib/catalog-identity-reconciliation";
import { prisma } from "../src/lib/prisma";

const main = async (): Promise<void> => {
  const apply = process.argv.includes("--apply");
  const report = await runCatalogPersistenceReconciliation(createPrismaCatalogIdentityStore(prisma), { apply });
  const output = { ...report, generatedAt: null };
  await mkdir(path.resolve("reports"), { recursive: true });
  await writeFile(path.resolve("reports/canonical-catalog-persistence-reconciliation.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ mode: output.mode, summary: output.plan.summary, appliedCatalogIds: output.appliedCatalogIds, reportPath: "reports/canonical-catalog-persistence-reconciliation.json" }, null, 2));
};

main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
