import assert from "node:assert/strict";
import { getProductFlavorProfile, hasProductFlavorProfile, listProductFlavorProfiles, mapProductFlavorProfileToPublic, validateProductFlavorProfiles } from "../src/lib/product-flavor-profile";
import { PRODUCT_FLAVOR_PROFILE_REGISTRY } from "../src/lib/product-flavor-profile/registry";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../src/lib/tobacco-identity-decisions";

const registryBefore = JSON.stringify(listProductFlavorProfiles());

assert.equal(validateProductFlavorProfiles(PRODUCT_FLAVOR_PROFILE_REGISTRY).length, 0, "shipped registry must have zero validation issues");
assert.equal(PRODUCT_FLAVOR_PROFILE_REGISTRY.length, 15, "batch 1 must cover exactly 15 canonical products");

const confidenceCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
let filledDimensionCount = 0;
let evidenceCount = 0;

PRODUCT_FLAVOR_PROFILE_REGISTRY.forEach(profile => {
  const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getByCanonicalProductId(profile.canonicalProductId);
  assert.equal(lookup.status, "FOUND", `${profile.canonicalProductId} must exist in the Tobacco Identity Decision Registry`);
  if (lookup.status === "FOUND") assert.equal(lookup.decision.decision.status, "RESOLVED", `${profile.canonicalProductId} must be RESOLVED`);

  confidenceCounts[profile.overallConfidence] += 1;
  Object.values(profile.dimensions).forEach(value => {
    if (!value) return;
    filledDimensionCount += 1;
    evidenceCount += value.evidence.length;
    assert.ok(value.value >= 0 && value.value <= 10, `${profile.canonicalProductId} dimension value must be in 0-10`);
    assert.notEqual(value.confidence, "HIGH", `${profile.canonicalProductId} must not claim HIGH confidence for a subjective taste dimension`);
  });

  const publicProfile = mapProductFlavorProfileToPublic(profile);
  Object.values(publicProfile.dimensions).forEach(value => {
    value?.evidence.forEach(item => assert.ok(!("reference" in item), `${profile.canonicalProductId} public mapper must strip evidence reference URLs`));
  });
});

assert.equal(hasProductFlavorProfile("musthave-sorbetto"), true);
assert.equal(hasProductFlavorProfile("MustHave Sorbetto"), false, "lookup must not fuzzy-match on display names");
assert.equal(getProductFlavorProfile("unknown-canonical-product"), null);

assert.equal(JSON.stringify(listProductFlavorProfiles()), registryBefore, "queries must not mutate the registry");

console.log({
  version: "product-flavor-profile-v1",
  coveredProducts: PRODUCT_FLAVOR_PROFILE_REGISTRY.length,
  filledDimensionCount,
  evidenceCount,
  overallConfidenceDistribution: confidenceCounts,
});
