import assert from "node:assert/strict";
import { calculateMixAnalysis } from "../src/lib/mix-analysis";
import type { FlavorProfile } from "../src/lib/flavors/types";
import type { RecommendationComponentInput } from "../src/lib/mix-recommendation";
import { adaptExternalExpertMixInput, createExpertMixKnowledgeRegistry, createExpertMixRecordId, toPublicExpertMixKnowledgeRecord } from "../src/lib/expert-mix-knowledge";
import { SYNTHETIC_EXPERT_MIX_FIXTURES, SYNTHETIC_INVALID_COMPONENT_REFERENCE_INPUT, SYNTHETIC_INVALID_PERCENT_120_INPUT } from "../src/lib/expert-mix-knowledge/fixtures";

const profile: FlavorProfile = { sweetness: 5, acidity: 3, bitterness: 2, creaminess: 3, cooling: 0, strength: 5, intensity: 6, heatResistance: 7, dryness: 3, juiciness: 5, freshness: 5, dessertLevel: 3, spiceLevel: 0, floralLevel: 0, herbalLevel: 0, smokyLevel: 0, naturalness: 6, persistence: 6 };
const analysisComponents: readonly RecommendationComponentInput[] = [
  { flavorId: "verify-a", brandName: "Synthetic", flavorName: "A", flavorSlug: "a", percentage: 60, profile, notes: [{ noteId: 1, noteName: "coffee", noteSlug: "coffee", category: "COFFEE", intensity: 10, noteType: "DOMINANT" }] },
  { flavorId: "verify-b", brandName: "Synthetic", flavorName: "B", flavorSlug: "b", percentage: 40, profile, notes: [{ noteId: 2, noteName: "cream", noteSlug: "cream", category: "DAIRY", intensity: 10, noteType: "DOMINANT" }] },
];

const beforeAnalysis = JSON.stringify(calculateMixAnalysis({ components: analysisComponents }));
const byTitle = (part: string) => { const record = SYNTHETIC_EXPERT_MIX_FIXTURES.find(item => item.title?.includes(part)); assert.ok(record, `fixture ${part} missing`); return record; };

const percent = byTitle("percent-60-40");
assert.equal(percent.proportions.type, "PERCENT");
assert.deepEqual(percent.components.map(item => item.proportion), [{ type: "PERCENT", value: 60 }, { type: "PERCENT", value: 40 }]);
assert.ok(byTitle("partially-resolved").components.some(item => item.identityStatus === "UNRESOLVED"));
assert.equal(byTitle("parts-2-1").proportions.type, "PARTS");
assert.equal(byTitle("unknown-proportions").proportions.type, "UNKNOWN");

const invalidPercent = adaptExternalExpertMixInput(SYNTHETIC_INVALID_PERCENT_120_INPUT);
assert.equal(invalidPercent.valid, false);
if (!invalidPercent.valid) assert.ok(invalidPercent.errors.some(item => item.code === "PERCENT_TOTAL_MISMATCH"));
const invalidReference = adaptExternalExpertMixInput(SYNTHETIC_INVALID_COMPONENT_REFERENCE_INPUT);
assert.equal(invalidReference.valid, false);
if (!invalidReference.valid) assert.ok(invalidReference.errors.some(item => item.code === "UNKNOWN_COMPONENT_REFERENCE"));

const publicRecord = toPublicExpertMixKnowledgeRecord(percent);
const publicJson = JSON.stringify(publicRecord);
assert.ok(!publicJson.includes("Synthetic private author"));
assert.ok(!publicJson.includes("internalLabel"));
assert.ok(!publicJson.includes("invalid.example"));

const registry = createExpertMixKnowledgeRegistry(SYNTHETIC_EXPERT_MIX_FIXTURES);
assert.ok(Object.isFrozen(registry));
assert.ok(Object.isFrozen(registry.list()[0]));
assert.throws(() => createExpertMixKnowledgeRegistry([percent, percent]), /Duplicate/);
assert.equal(createExpertMixRecordId({ source: "источник", values: { b: 2, a: 1 } }), createExpertMixRecordId({ values: { a: 1, b: 2 }, source: "источник" }));

const afterAnalysis = JSON.stringify(calculateMixAnalysis({ components: analysisComponents }));
assert.equal(afterAnalysis, beforeAnalysis, "Mix Analysis output changed during Expert Knowledge verification");

console.log(JSON.stringify({ schema: "expert-mix-knowledge-v1", validSyntheticRecords: registry.list().length, invalidCasesRejected: 2, privacyBoundary: "passed", registryImmutable: true, deterministicIds: true, mixAnalysisUnchanged: true }, null, 2));
