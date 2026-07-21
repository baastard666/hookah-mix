import assert from "node:assert/strict";
import { listManufacturerProfiles, listProductLineProfiles, resolveTobaccoProfile } from "../src/lib/tobacco-profile";

const found = (manufacturer: string, productLine?: string) => {
  const result = resolveTobaccoProfile({ manufacturer, productLine });
  assert.equal(result.status, "FOUND", `${manufacturer} ${productLine ?? ""} must be found`);
  if (result.status !== "FOUND") throw new Error("Unreachable profile state");
  return result;
};

const registryBefore = JSON.stringify({ manufacturers: listManufacturerProfiles(), productLines: listProductLineProfiles() });
const darksideCore = found("Darkside", "Core");
assert.equal(darksideCore.strengthLevel?.value, "MEDIUM");
assert.deepEqual(darksideCore.heatResistance && { value: darksideCore.heatResistance.value, inheritedFrom: darksideCore.heatResistance.inheritedFrom }, { value: "HIGH", inheritedFrom: "Darkside" });
assert.equal(found("Darkside", "Rare").strengthLevel?.value, "HIGH");
assert.equal(found("HLGN", "Medium").strengthLevel?.value, "MEDIUM");
assert.equal(found("Hooligan", "Hard").strengthLevel?.value, "HIGH");

const muasselMedium = found("MUASSEL", "Medium");
const muasselExtra = found("MUASSEL", "Extra Strong");
assert.deepEqual(muasselMedium.leafTypes?.value, ["VIRGINIA"]);
assert.deepEqual(muasselExtra.leafTypes?.value, ["CIGAR"]);
assert.equal(muasselMedium.strengthLevel?.evidence[0]?.sourceType, "MANUFACTURER_CLAIM");

const jent = found("Jent");
assert.equal(jent.heatResistance?.confidence, "LOW");
assert.ok(jent.heatResistance?.note?.includes("расходятся"));
const unknown = resolveTobaccoProfile({ manufacturer: "Unknown Tobacco" });
assert.deepEqual(unknown, { status: "NOT_FOUND", missing: "MANUFACTURER", manufacturer: "Unknown Tobacco", productLine: null });
assert.equal(JSON.stringify({ manufacturers: listManufacturerProfiles(), productLines: listProductLineProfiles() }), registryBefore);

console.log({ darksideCore: { strengthLevel: darksideCore.strengthLevel, heatResistance: darksideCore.heatResistance }, hooligan: [found("Хулиган", "Medium").strengthLevel, found("Хулиган", "Hard").strengthLevel], muassel: [muasselMedium.leafTypes, muasselExtra.leafTypes], jentHeatResistance: jent.heatResistance, unknown });
