import assert from "node:assert/strict";
import { auditTobaccoCatalogEntries, resolveCatalogTobaccoIdentity } from "../src/lib/tobacco-product-identity";

const resolved = (input: Parameters<typeof resolveCatalogTobaccoIdentity>[0]) => {
  const result = resolveCatalogTobaccoIdentity(input);
  assert.equal(result.status, "RESOLVED");
  if (result.status !== "RESOLVED") throw new Error("Expected resolved identity");
  return result;
};

assert.deepEqual(resolved({ brand: "Darkside", productLine: "Core", name: "Lemon" }), resolved({ brand: "Darkside", productLine: "Core", name: "Lemon" }));
assert.equal(resolved({ brand: "Darkside", name: "Core Lemon" }).productId, "darkside-core-lemon");
assert.equal(resolved({ brand: "HLGN", name: "Medium Peach" }).productLine, "Medium");
assert.equal(resolved({ brand: "MUASSEL", productLine: "Strong", name: "Cola" }).productId, "muassel-strong-cola");
assert.equal(resolveCatalogTobaccoIdentity({ brand: "Darkside", name: "Coconut" }).status, "MANUFACTURER_ONLY");
assert.equal(resolveCatalogTobaccoIdentity({ brand: "Unknown", name: "Mint" }).status, "MANUFACTURER_NOT_FOUND");
assert.deepEqual(resolved({ brand: "Darkside", productLine: "Core", name: "Rare Pear" }).warnings, ["EXPLICIT_PRODUCT_LINE_CONFLICTS_WITH_NAME_PREFIX"]);

const duplicateAudit = auditTobaccoCatalogEntries([{ catalogId: 2, brand: "Darkside", productLine: "Core", name: "Lemon" }, { catalogId: 1, brand: "DARKSIDE", productLine: "Core", name: "Lemon" }]);
assert.equal(duplicateAudit.counters.duplicateCandidates, 1);
assert.deepEqual(duplicateAudit.duplicateCandidates[0].catalogIds, [1, 2]);

console.log({ darksideCore: resolved({ brand: "Darkside", name: "Core Lemon" }), hooliganMedium: resolved({ brand: "Хулиган", name: "Medium Peach" }), muasselStrong: resolved({ brand: "MUASSEL", productLine: "Strong", name: "Cola" }), manufacturerOnly: resolveCatalogTobaccoIdentity({ brand: "Darkside", name: "Coconut" }), unknown: resolveCatalogTobaccoIdentity({ brand: "Unknown", name: "Mint" }), conflict: resolved({ brand: "Darkside", productLine: "Core", name: "Rare Pear" }), duplicateCandidates: duplicateAudit.duplicateCandidates });
