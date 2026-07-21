import assert from "node:assert/strict";
import { createCatalogIdentityBackfillPlan, createManufacturerOnlyCanonicalProductId, createPrismaCatalogIdentityStore, mapIdentityResolutionToPersistedIdentity, readCatalogTobaccoIdentities, runCatalogIdentityBackfill, updateCatalogTobaccoIdentity, verifyPersistedCatalogIdentities } from "../src/lib/catalog-identity";
import { prisma } from "../src/lib/prisma";
import { resolveCatalogTobaccoIdentity } from "../src/lib/tobacco-product-identity";

const main = async (): Promise<void> => {
  const records = await readCatalogTobaccoIdentities(prisma);
  const get = (brand: string, name: string) => { const record = records.find(item => item.brand === brand && item.name === name); assert.ok(record, `${brand} / ${name} missing`); return record; };
  for (const [brand, name] of [["Darkside", "Кокос"], ["Musthave", "Манго"], ["BlackBurn", "Ваниль"]]) {
    const proposal = mapIdentityResolutionToPersistedIdentity(resolveCatalogTobaccoIdentity({ brand, name }));
    assert.equal(proposal.identity.identityStatus, "MANUFACTURER_ONLY");
    assert.ok(proposal.identity.canonicalProductId?.includes("-manufacturer-only-"));
  }
  assert.equal(mapIdentityResolutionToPersistedIdentity(resolveCatalogTobaccoIdentity({ brand: "Unknown", name: "Mint" })).identity.identityStatus, "UNRESOLVED");
  assert.equal(createManufacturerOnlyCanonicalProductId("darkside", " Кокос "), createManufacturerOnlyCanonicalProductId("DARKSIDE", "Кокос"));

  const store = createPrismaCatalogIdentityStore(prisma);
  const before = JSON.stringify(await store.list());
  const dryRun = await runCatalogIdentityBackfill(store);
  assert.equal(dryRun.mode, "DRY_RUN");
  assert.equal(JSON.stringify(await store.list()), before);

  const verified = { ...get("Darkside", "Кокос"), identityVerified: true };
  assert.equal(createCatalogIdentityBackfillPlan([verified])[0].action, "SKIPPED_VERIFIED");
  const invalidLine = await updateCatalogTobaccoIdentity({ catalogId: verified.catalogId, manufacturerId: "darkside", productLineId: "hooligan-medium", canonicalProductName: "Кокос", identityVerified: true }, { list: async () => [], transaction: async () => { throw new Error("transaction must not start"); } });
  assert.deepEqual(invalidLine, { success: false, errors: [{ code: "PRODUCT_LINE_DOES_NOT_BELONG_TO_MANUFACTURER", message: "hooligan-medium does not belong to darkside" }] });

  const consistency = verifyPersistedCatalogIdentities(records);
  assert.equal(consistency.valid, true, JSON.stringify(consistency.issues));
  console.log(JSON.stringify({ checked: records.length, dryRun: dryRun.counters, consistency }, null, 2));
};

main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
