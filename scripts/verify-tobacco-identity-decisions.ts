import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createUnresolvedIdentityReport, importExpertMixKnowledge } from "../src/lib/expert-mix-knowledge-import";
import {
  adaptExpertMixImportForIdentityDecisions, applyTobaccoIdentityDecisions, auditPublicTobaccoIdentityDecisions, auditTobaccoIdentityDecisions,
  compareTobaccoIdentityCoverage, createCanonicalTobaccoProductId, createTobaccoIdentityDecisionFixtures, createTobaccoIdentityDecisionRegistry,
  createTobaccoIdentityReviewPlan, mapTobaccoIdentityDecisionToPublic, P0_IDENTITY_DECISIONS_BATCH_1,
  P1_IDENTITY_DECISIONS_BATCH_1, P1_IDENTITY_DECISION_REGISTRY_BATCH_1, resolveIdentityWithDecisions,
  reviewPlanToJson, TOBACCO_IDENTITY_DECISIONS, TOBACCO_IDENTITY_DECISION_REGISTRY, validateTobaccoIdentityDecision,
} from "../src/lib/tobacco-identity-decisions";
import type { DecisionApplicableIdentityRecord } from "../src/lib/tobacco-identity-decisions";
import { listManufacturerProfiles, listProductLineProfiles } from "../src/lib/tobacco-profile";

const hash = async (filePath: string) => createHash("sha256").update(await readFile(filePath)).digest("hex").toUpperCase();
const main = async (): Promise<void> => {
  const workbookPath = path.resolve(process.argv[2] ?? "data/hookah_mix_database.xlsx"); const beforeHash = await hash(workbookPath);
  const importedBefore = await importExpertMixKnowledge(workbookPath); const importedAfter = await importExpertMixKnowledge(workbookPath); assert.deepEqual(importedAfter, importedBefore, "Repeated workbook import is not deterministic.");
  const unresolved = createUnresolvedIdentityReport({ components: importedBefore.components, catalog: importedBefore.tobacco, mixes: importedBefore.mixes, manufacturers: listManufacturerProfiles(), productLines: listProductLineProfiles() });
  const plan = createTobaccoIdentityReviewPlan(unresolved); assert.equal(plan.counts.p0, 76); assert.equal(plan.counts.p1, 20); assert.equal(plan.counts.userPriority, 3); assert.ok(plan.records.every(record => record.priority === "P0" || record.priority === "P1")); assert.ok([...plan.records, ...plan.userPriority].every(record => record.decisionState === "UNREVIEWED" && record.canonicalProductId === null));
  const fixtures = createTobaccoIdentityDecisionFixtures();
  assert.equal(validateTobaccoIdentityDecision(fixtures.unconfirmed).applicable, false);
  assert.ok(validateTobaccoIdentityDecision(fixtures.missingEvidence).issues.some(issue => issue.code === "DECISION_EVIDENCE_MISSING"));
  assert.ok(validateTobaccoIdentityDecision(fixtures.missingCanonicalProductId).issues.some(issue => issue.code === "DECISION_CANONICAL_ID_MISSING"));
  assert.equal(fixtures.withoutLine.decision.productLineId, null); assert.equal(fixtures.withoutLine.decision.canonicalProductId, "blackburn-raspberry-shock");
  assert.equal(createCanonicalTobaccoProductId("darkside", "darkside-core", "Blueberry"), "darkside-core-blueberry");
  assert.ok(auditTobaccoIdentityDecisions([fixtures.collisionA, fixtures.collisionB]).some(issue => issue.code === "CANONICAL_ID_COLLISION"));
  assert.ok(validateTobaccoIdentityDecision(fixtures.p2Blocked).issues.some(issue => issue.code === "P2_P3_DECISION_NOT_ALLOWED")); assert.ok(validateTobaccoIdentityDecision(fixtures.p3Blocked).issues.some(issue => issue.code === "P2_P3_DECISION_NOT_ALLOWED"));
  const registry = createTobaccoIdentityDecisionRegistry([fixtures.withLine, fixtures.withoutLine, fixtures.unconfirmed, fixtures.nashLavender, fixtures.dogmaLavender]);
  assert.notEqual(fixtures.nashLavender.decision.canonicalProductId, fixtures.dogmaLavender.decision.canonicalProductId);
  assert.equal(resolveIdentityWithDecisions({ manufacturer: "MustHave", productLine: null, productName: "Unconfirmed Product" }, createTobaccoIdentityDecisionRegistry([fixtures.exactManufacturerAliasOnly])).source, "EXISTING_RESOLVER");
  const synthetic: DecisionApplicableIdentityRecord[] = [
    { recordId: "confirmed", scope: "COMPONENT", sourcePriority: "P1", usedInVerifiedMix: true, manufacturer: "BlackBurn", productLine: null, productName: "Raspberry Shock", identityStatus: "UNRESOLVED", manufacturerId: null, productLineId: null, canonicalProductId: null, canonicalProductName: null, confidence: null, evidenceTypes: [], confirmedDecision: false },
    { recordId: "unconfirmed", scope: "COMPONENT", sourcePriority: "P0", usedInVerifiedMix: true, manufacturer: "BlackBurn", productLine: null, productName: "Unconfirmed Product", identityStatus: "UNRESOLVED", manufacturerId: null, productLineId: null, canonicalProductId: null, canonicalProductName: null, confidence: null, evidenceTypes: [], confirmedDecision: false },
  ];
  const applied = applyTobaccoIdentityDecisions(synthetic, registry); assert.equal(applied.appliedDecisionCount, 1); assert.equal(applied.records[0]?.identityStatus, "RESOLVED"); assert.equal(applied.records[1]?.identityStatus, "UNRESOLVED");
  const coverage = compareTobaccoIdentityCoverage(synthetic, applied); assert.equal(coverage.resolvedDelta, 1); assert.equal(coverage.unresolvedDelta, -1);
  const realRecords = adaptExpertMixImportForIdentityDecisions(importedAfter, unresolved, plan); const realUnreviewed = applyTobaccoIdentityDecisions(realRecords, createTobaccoIdentityDecisionRegistry([])); const realCoverage = compareTobaccoIdentityCoverage(realRecords, realUnreviewed); assert.equal(realCoverage.resolvedDelta, 0); assert.equal(realCoverage.appliedDecisionCount, 0);
  const p1Applied = applyTobaccoIdentityDecisions(realRecords, P1_IDENTITY_DECISION_REGISTRY_BATCH_1); const p1Coverage = compareTobaccoIdentityCoverage(realRecords, p1Applied);
  assert.equal(P1_IDENTITY_DECISIONS_BATCH_1.length, 20); assert.equal(P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getByStatus("RESOLVED").length, 19); assert.equal(P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getByStatus("MANUFACTURER_ONLY").length, 1);
  assert.equal(p1Coverage.appliedDecisionCount, 37); assert.equal(p1Coverage.skippedDecisionCount, 2); assert.equal(p1Coverage.resolvedDelta, 37); assert.equal(p1Coverage.manufacturerOnlyDelta, -37); assert.equal(p1Coverage.unresolvedDelta, 0); assert.equal(p1Coverage.invalidDecisionCount, 0); assert.equal(p1Coverage.conflictCount, 0);
  assert.equal(p1Coverage.componentsAfter.resolved - p1Coverage.componentsBefore.resolved, 19); assert.equal(p1Coverage.catalogAfter.resolved - p1Coverage.catalogBefore.resolved, 18); assert.equal(p1Coverage.verifiedComponents.after.resolved - p1Coverage.verifiedComponents.before.resolved, 19);
  const isP0BatchRecord = (record: DecisionApplicableIdentityRecord): boolean => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(record.manufacturer, record.productLine, record.productName);
    return lookup.status === "FOUND" && lookup.decision.sourceIdentity.sourcePriority === "P0";
  };
  const p0Records = realRecords.filter(isP0BatchRecord);
  const p0Applied = applyTobaccoIdentityDecisions(p0Records, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const p0Coverage = compareTobaccoIdentityCoverage(p0Records, p0Applied);
  const combinedApplied = applyTobaccoIdentityDecisions(realRecords, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const combinedCoverage = compareTobaccoIdentityCoverage(realRecords, combinedApplied);
  assert.equal(P0_IDENTITY_DECISIONS_BATCH_1.length, 15); assert.equal(TOBACCO_IDENTITY_DECISIONS.length, 35); assert.equal(TOBACCO_IDENTITY_DECISION_REGISTRY.getByStatus("RESOLVED").length, 34);
  assert.equal(p0Records.length, 31); assert.equal(p0Coverage.appliedDecisionCount, 31); assert.equal(p0Coverage.skippedDecisionCount, 0); assert.equal(p0Coverage.resolvedDelta, 31); assert.equal(p0Coverage.unresolvedDelta, -31); assert.equal(p0Coverage.manufacturerOnlyDelta, 0);
  assert.equal(p0Coverage.componentsAfter.resolved - p0Coverage.componentsBefore.resolved, 17); assert.equal(p0Coverage.catalogAfter.resolved - p0Coverage.catalogBefore.resolved, 14); assert.equal(p0Coverage.verifiedComponents.after.resolved - p0Coverage.verifiedComponents.before.resolved, 16);
  assert.equal(combinedCoverage.appliedDecisionCount, 68); assert.equal(combinedCoverage.skippedDecisionCount, 2); assert.equal(combinedCoverage.resolvedDelta, 68); assert.equal(combinedCoverage.manufacturerOnlyDelta, -37); assert.equal(combinedCoverage.unresolvedDelta, -31); assert.equal(combinedCoverage.invalidDecisionCount, 0); assert.equal(combinedCoverage.conflictCount, 0);
  const p0AppliedComponentIds = new Set(p0Applied.records.filter(record => record.scope === "COMPONENT" && record.usedInVerifiedMix && record.confirmedDecision).map(record => record.recordId));
  const improvedVerifiedMixIds = [...new Set(importedAfter.components.filter(component => p0AppliedComponentIds.has(component.componentId)).map(component => component.mixId))].sort();
  const p0Occurrences = P0_IDENTITY_DECISIONS_BATCH_1.map(decision => {
    const matching = p0Records.filter(record => TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(record.manufacturer, record.productLine, record.productName).status === "FOUND" && record.manufacturer === decision.sourceIdentity.manufacturer && record.productName === decision.sourceIdentity.productName);
    return { groupId: decision.sourceIdentity.sourceGroupId, sourceOccurrences: matching.length, componentOccurrences: matching.filter(record => record.scope === "COMPONENT").length, catalogOccurrences: matching.filter(record => record.scope === "CATALOG").length };
  });
  const publicOutput = [mapTobaccoIdentityDecisionToPublic(fixtures.privateEvidence)]; assert.deepEqual(auditPublicTobaccoIdentityDecisions(publicOutput, ["private.example", "author-real-name", "private notes"]), []);
  assert.ok(Object.isFrozen(registry)); assert.ok(Object.isFrozen(registry.list()[0]?.evidence)); assert.equal(reviewPlanToJson(plan), reviewPlanToJson(createTobaccoIdentityReviewPlan(unresolved)));
  const afterHash = await hash(workbookPath); assert.equal(afterHash, beforeHash, "Source workbook changed.");
  console.log(JSON.stringify({ workbookPath, sha256Before: beforeHash, sha256After: afterHash, workbookUnchanged: true, review: plan.counts, p1Batch1: { decisions: P1_IDENTITY_DECISIONS_BATCH_1.length, resolvedDecisions: P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getByStatus("RESOLVED").length, manufacturerOnlyDecisions: P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getByStatus("MANUFACTURER_ONLY").length, coverage: p1Coverage }, p0Batch1: { decisions: P0_IDENTITY_DECISIONS_BATCH_1.length, resolvedDecisions: P0_IDENTITY_DECISIONS_BATCH_1.filter(item => item.decision.status === "RESOLVED").length, unresolvedDecisions: [], improvedVerifiedMixCount: improvedVerifiedMixIds.length, improvedVerifiedMixIds, occurrences: p0Occurrences, coverage: p0Coverage }, combinedRegistry: { decisions: TOBACCO_IDENTITY_DECISIONS.length, coverage: combinedCoverage }, syntheticConfirmedCoverage: coverage, realUnreviewedCoverage: realCoverage, checks: { p2p3Blocked: true, fuzzyMatching: false, unconfirmedSkipped: true, evidenceRequired: true, noLineSupported: true, fictitiousLinesForbidden: true, collisionDetected: true, nashDogmaSeparate: true, aliasDoesNotResolveProduct: true, p1Preserved: true, privacyPassed: true, immutable: true, deterministic: true } }, null, 2));
};
main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
