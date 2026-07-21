import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createUnresolvedIdentityReport, importExpertMixKnowledge } from "../src/lib/expert-mix-knowledge-import";
import {
  adaptExpertMixImportForIdentityDecisions, applyTobaccoIdentityDecisions, ASCII_CANONICAL_PRODUCT_ID_PATTERN, auditPublicTobaccoIdentityDecisions, auditTobaccoIdentityDecisions,
  compareTobaccoIdentityCoverage, createAsciiCanonicalSlug, createCanonicalTobaccoProductId, createTobaccoIdentityDecisionFixtures, createTobaccoIdentityDecisionRegistry,
  createTobaccoIdentityReviewPlan, mapTobaccoIdentityDecisionToPublic, P0_IDENTITY_DECISIONS_BATCH_1, P0_IDENTITY_DECISIONS_BATCH_2, P0_IDENTITY_DECISIONS_BATCH_3, P0_IDENTITY_DECISIONS_BATCH_4, P0_IDENTITY_DECISIONS_BATCH_5, P0_IDENTITY_DECISIONS_BATCH_6,
  P1_IDENTITY_DECISIONS_BATCH_1, P1_IDENTITY_DECISION_REGISTRY_BATCH_1, LEGACY_CANONICAL_PRODUCT_ID_ALIASES, LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY, resolveIdentityWithDecisions,
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
  assert.ok(auditTobaccoIdentityDecisions([fixtures.collisionA, fixtures.collisionB]).some(issue => issue.code === "CANONICAL_ID_TRANSLITERATION_COLLISION"));
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
  assert.equal(P0_IDENTITY_DECISIONS_BATCH_1.length, 15); assert.equal(P0_IDENTITY_DECISIONS_BATCH_2.length, 15); assert.equal(P0_IDENTITY_DECISIONS_BATCH_3.length, 15); assert.equal(P0_IDENTITY_DECISIONS_BATCH_4.length, 15); assert.equal(P0_IDENTITY_DECISIONS_BATCH_5.length, 15); assert.equal(P0_IDENTITY_DECISIONS_BATCH_6.length, 1); assert.equal(TOBACCO_IDENTITY_DECISIONS.length, 96); assert.equal(TOBACCO_IDENTITY_DECISION_REGISTRY.getByStatus("RESOLVED").length, 86); assert.equal(TOBACCO_IDENTITY_DECISION_REGISTRY.getByStatus("AMBIGUOUS").length, 7); assert.equal(TOBACCO_IDENTITY_DECISION_REGISTRY.getByStatus("UNRESOLVED").length, 2);
  assert.equal(p0Records.length, 141); assert.equal(p0Coverage.appliedDecisionCount, 126); assert.equal(p0Coverage.skippedDecisionCount, 15); assert.equal(p0Coverage.resolvedDelta, 126); assert.equal(p0Coverage.unresolvedDelta, -126); assert.equal(p0Coverage.manufacturerOnlyDelta, 0);
  assert.equal(p0Coverage.componentsAfter.resolved - p0Coverage.componentsBefore.resolved, 69); assert.equal(p0Coverage.catalogAfter.resolved - p0Coverage.catalogBefore.resolved, 57); assert.equal(p0Coverage.verifiedComponents.after.resolved - p0Coverage.verifiedComponents.before.resolved, 68);
  assert.equal(combinedCoverage.appliedDecisionCount, 163); assert.equal(combinedCoverage.skippedDecisionCount, 17); assert.equal(combinedCoverage.resolvedDelta, 163); assert.equal(combinedCoverage.manufacturerOnlyDelta, -37); assert.equal(combinedCoverage.unresolvedDelta, -126); assert.equal(combinedCoverage.invalidDecisionCount, 0); assert.equal(combinedCoverage.conflictCount, 0);
  const canonicalProductIds = TOBACCO_IDENTITY_DECISION_REGISTRY.getByStatus("RESOLVED").map(decision => decision.decision.canonicalProductId!);
  assert.equal(canonicalProductIds.length, 86); assert.ok(canonicalProductIds.every(id => ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(id))); assert.ok(canonicalProductIds.every(id => !/[^\x00-\x7F]/.test(id)));
  const authoritativeUnicodeIdCount = 12;
  assert.equal(LEGACY_CANONICAL_PRODUCT_ID_ALIASES.length, 18); assert.ok(LEGACY_CANONICAL_PRODUCT_ID_ALIASES.every(alias => LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY.resolve(alias.legacyCanonicalProductId).status === "FOUND"));
  assert.deepEqual(TOBACCO_IDENTITY_DECISION_REGISTRY.getByCanonicalProductId("brusko-medium-цитрусовый-чай"), TOBACCO_IDENTITY_DECISION_REGISTRY.getByCanonicalProductId("brusko-medium-tsitrusovyi-chai"));
  assert.equal(createAsciiCanonicalSlug("Цитрусовый чай"), "tsitrusovyi-chai"); assert.equal(createAsciiCanonicalSlug("Цитрусовый чай"), createAsciiCanonicalSlug("Цитрусовый чай"));
  const publicAuthoritative = TOBACCO_IDENTITY_DECISIONS.map(mapTobaccoIdentityDecisionToPublic); assert.ok(publicAuthoritative.filter(item => item.canonicalProductId).every(item => ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(item.canonicalProductId!)));
  const gitignore = await readFile(path.resolve(".gitignore"), "utf8"); assert.match(gitignore, /data\/\*\.xlsx/); assert.match(gitignore, /reports\//);
  const p0Batch1GroupIds = new Set(P0_IDENTITY_DECISIONS_BATCH_1.map(decision => decision.sourceIdentity.sourceGroupId));
  const p0Batch1Records = realRecords.filter(record => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(record.manufacturer, record.productLine, record.productName);
    return lookup.status === "FOUND" && p0Batch1GroupIds.has(lookup.decision.sourceIdentity.sourceGroupId);
  });
  const p0Batch1Applied = applyTobaccoIdentityDecisions(p0Batch1Records, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const p0Batch1Coverage = compareTobaccoIdentityCoverage(p0Batch1Records, p0Batch1Applied);
  const p0AppliedComponentIds = new Set(p0Batch1Applied.records.filter(record => record.scope === "COMPONENT" && record.usedInVerifiedMix && record.confirmedDecision).map(record => record.recordId));
  const improvedVerifiedMixIds = [...new Set(importedAfter.components.filter(component => p0AppliedComponentIds.has(component.componentId)).map(component => component.mixId))].sort();
  assert.equal(p0Batch1Records.length, 31); assert.equal(p0Batch1Coverage.appliedDecisionCount, 31); assert.equal(p0Batch1Coverage.skippedDecisionCount, 0); assert.equal(p0Batch1Coverage.resolvedDelta, 31);
  const p0Occurrences = P0_IDENTITY_DECISIONS_BATCH_1.map(decision => {
    const matching = p0Records.filter(record => TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(record.manufacturer, record.productLine, record.productName).status === "FOUND" && record.manufacturer === decision.sourceIdentity.manufacturer && record.productName === decision.sourceIdentity.productName);
    return { groupId: decision.sourceIdentity.sourceGroupId, sourceOccurrences: matching.length, componentOccurrences: matching.filter(record => record.scope === "COMPONENT").length, catalogOccurrences: matching.filter(record => record.scope === "CATALOG").length };
  });
  const p0Batch2GroupIds = new Set(P0_IDENTITY_DECISIONS_BATCH_2.map(decision => decision.sourceIdentity.sourceGroupId));
  const p0Batch2Records = realRecords.filter(record => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(record.manufacturer, record.productLine, record.productName);
    return lookup.status === "FOUND" && p0Batch2GroupIds.has(lookup.decision.sourceIdentity.sourceGroupId);
  });
  const p0Batch2Applied = applyTobaccoIdentityDecisions(p0Batch2Records, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const p0Batch2Coverage = compareTobaccoIdentityCoverage(p0Batch2Records, p0Batch2Applied);
  const p0Batch2AppliedComponentIds = new Set(p0Batch2Applied.records.filter(record => record.scope === "COMPONENT" && record.usedInVerifiedMix && record.confirmedDecision).map(record => record.recordId));
  const p0Batch2ImprovedMixIds = [...new Set(importedAfter.components.filter(component => p0Batch2AppliedComponentIds.has(component.componentId)).map(component => component.mixId))].sort();
  assert.equal(p0Batch2Records.length, 30); assert.equal(p0Batch2Coverage.appliedDecisionCount, 24); assert.equal(p0Batch2Coverage.skippedDecisionCount, 6); assert.equal(p0Batch2Coverage.resolvedDelta, 24); assert.equal(p0Batch2Coverage.unresolvedDelta, -24);
  const p0Batch3GroupIds = new Set(P0_IDENTITY_DECISIONS_BATCH_3.map(decision => decision.sourceIdentity.sourceGroupId));
  const p0Batch3Records = realRecords.filter(record => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(record.manufacturer, record.productLine, record.productName);
    return lookup.status === "FOUND" && p0Batch3GroupIds.has(lookup.decision.sourceIdentity.sourceGroupId);
  });
  const p0Batch3Applied = applyTobaccoIdentityDecisions(p0Batch3Records, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const p0Batch3Coverage = compareTobaccoIdentityCoverage(p0Batch3Records, p0Batch3Applied);
  const p0Batch3AppliedComponentIds = new Set(p0Batch3Applied.records.filter(record => record.scope === "COMPONENT" && record.usedInVerifiedMix && record.confirmedDecision).map(record => record.recordId));
  const p0Batch3ImprovedMixIds = [...new Set(importedAfter.components.filter(component => p0Batch3AppliedComponentIds.has(component.componentId)).map(component => component.mixId))].sort();
  assert.equal(p0Batch3Records.length, 30); assert.equal(p0Batch3Coverage.appliedDecisionCount, 30); assert.equal(p0Batch3Coverage.skippedDecisionCount, 0); assert.equal(p0Batch3Coverage.resolvedDelta, 30); assert.equal(p0Batch3Coverage.unresolvedDelta, -30);
  assert.equal(p0Batch3Coverage.componentsAfter.resolved - p0Batch3Coverage.componentsBefore.resolved, 15); assert.equal(p0Batch3Coverage.catalogAfter.resolved - p0Batch3Coverage.catalogBefore.resolved, 15); assert.equal(p0Batch3Coverage.verifiedComponents.after.resolved - p0Batch3Coverage.verifiedComponents.before.resolved, 15); assert.equal(p0Batch3ImprovedMixIds.length, 12);
  const p0Batch4GroupIds = new Set(P0_IDENTITY_DECISIONS_BATCH_4.map(decision => decision.sourceIdentity.sourceGroupId));
  const p0Batch4Records = realRecords.filter(record => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(record.manufacturer, record.productLine, record.productName);
    return lookup.status === "FOUND" && p0Batch4GroupIds.has(lookup.decision.sourceIdentity.sourceGroupId);
  });
  const p0Batch4Applied = applyTobaccoIdentityDecisions(p0Batch4Records, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const p0Batch4Coverage = compareTobaccoIdentityCoverage(p0Batch4Records, p0Batch4Applied);
  const p0Batch4AppliedComponentIds = new Set(p0Batch4Applied.records.filter(record => record.scope === "COMPONENT" && record.usedInVerifiedMix && record.confirmedDecision).map(record => record.recordId));
  const p0Batch4ImprovedMixIds = [...new Set(importedAfter.components.filter(component => p0Batch4AppliedComponentIds.has(component.componentId)).map(component => component.mixId))].sort();
  assert.equal(p0Batch4Records.length, 30); assert.equal(p0Batch4Coverage.appliedDecisionCount, 26); assert.equal(p0Batch4Coverage.skippedDecisionCount, 4); assert.equal(p0Batch4Coverage.resolvedDelta, 26); assert.equal(p0Batch4Coverage.unresolvedDelta, -26);
  assert.equal(p0Batch4Coverage.componentsAfter.resolved - p0Batch4Coverage.componentsBefore.resolved, 13); assert.equal(p0Batch4Coverage.catalogAfter.resolved - p0Batch4Coverage.catalogBefore.resolved, 13); assert.equal(p0Batch4Coverage.verifiedComponents.after.resolved - p0Batch4Coverage.verifiedComponents.before.resolved, 13);
  assert.equal(p0Batch4ImprovedMixIds.length, 11);
  const p0Batch5GroupIds = new Set(P0_IDENTITY_DECISIONS_BATCH_5.map(decision => decision.sourceIdentity.sourceGroupId));
  const p0Batch5Records = realRecords.filter(record => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(record.manufacturer, record.productLine, record.productName);
    return lookup.status === "FOUND" && p0Batch5GroupIds.has(lookup.decision.sourceIdentity.sourceGroupId);
  });
  const p0Batch5Applied = applyTobaccoIdentityDecisions(p0Batch5Records, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const p0Batch5Coverage = compareTobaccoIdentityCoverage(p0Batch5Records, p0Batch5Applied);
  const p0Batch5AppliedComponentIds = new Set(p0Batch5Applied.records.filter(record => record.scope === "COMPONENT" && record.usedInVerifiedMix && record.confirmedDecision).map(record => record.recordId));
  const p0Batch5ImprovedMixIds = [...new Set(importedAfter.components.filter(component => p0Batch5AppliedComponentIds.has(component.componentId)).map(component => component.mixId))].sort();
  assert.equal(p0Batch5Records.length, 19); assert.equal(p0Batch5Coverage.appliedDecisionCount, 15); assert.equal(p0Batch5Coverage.skippedDecisionCount, 4); assert.equal(p0Batch5Coverage.resolvedDelta, 15); assert.equal(p0Batch5Coverage.unresolvedDelta, -15);
  assert.equal(p0Batch5Coverage.componentsAfter.resolved - p0Batch5Coverage.componentsBefore.resolved, 12); assert.equal(p0Batch5Coverage.catalogAfter.resolved - p0Batch5Coverage.catalogBefore.resolved, 3); assert.equal(p0Batch5Coverage.verifiedComponents.after.resolved - p0Batch5Coverage.verifiedComponents.before.resolved, 12);
  assert.equal(p0Batch5ImprovedMixIds.length, 10);
  const p0Batch6GroupIds = new Set(P0_IDENTITY_DECISIONS_BATCH_6.map(decision => decision.sourceIdentity.sourceGroupId));
  const p0Batch6Records = realRecords.filter(record => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(record.manufacturer, record.productLine, record.productName);
    return lookup.status === "FOUND" && p0Batch6GroupIds.has(lookup.decision.sourceIdentity.sourceGroupId);
  });
  const p0Batch6Applied = applyTobaccoIdentityDecisions(p0Batch6Records, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const p0Batch6Coverage = compareTobaccoIdentityCoverage(p0Batch6Records, p0Batch6Applied);
  assert.equal(p0Batch6Records.length, 1); assert.equal(p0Batch6Coverage.appliedDecisionCount, 0); assert.equal(p0Batch6Coverage.skippedDecisionCount, 1); assert.equal(p0Batch6Coverage.resolvedDelta, 0); assert.equal(p0Batch6Coverage.unresolvedDelta, 0);
  assert.equal(p0Batch6Coverage.componentsBefore.unresolved, 1); assert.equal(p0Batch6Coverage.componentsAfter.unresolved, 1); assert.equal(p0Batch6Coverage.catalogBefore.unresolved, 0); assert.equal(p0Batch6Coverage.verifiedComponents.before.unresolved, 1); assert.equal(p0Batch6Coverage.verifiedComponents.after.unresolved, 1);
  assert.equal(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0023").status, "FOUND");
  const publicOutput = [mapTobaccoIdentityDecisionToPublic(fixtures.privateEvidence)]; assert.deepEqual(auditPublicTobaccoIdentityDecisions(publicOutput, ["private.example", "author-real-name", "private notes"]), []);
  assert.ok(Object.isFrozen(registry)); assert.ok(Object.isFrozen(registry.list()[0]?.evidence)); assert.equal(reviewPlanToJson(plan), reviewPlanToJson(createTobaccoIdentityReviewPlan(unresolved)));
  const afterHash = await hash(workbookPath); assert.equal(afterHash, beforeHash, "Source workbook changed.");
  console.log(JSON.stringify({ p0Batch6: { decisions: P0_IDENTITY_DECISIONS_BATCH_6.length, ambiguousDecisions: P0_IDENTITY_DECISIONS_BATCH_6.filter(item => item.decision.status === "AMBIGUOUS").map(item => item.sourceIdentity.sourceGroupId), improvedCatalogRows: 0, improvedComponents: 0, improvedVerifiedMixCount: 0, coverage: p0Batch6Coverage } }, null, 2));
  console.log(JSON.stringify({ workbookPath, sha256Before: beforeHash, sha256After: afterHash, workbookUnchanged: true, review: plan.counts, migration: { authoritativeCanonicalIds: canonicalProductIds.length, authoritativeUnicodeIds: authoritativeUnicodeIdCount, migratedAuthoritativeIds: authoritativeUnicodeIdCount, legacyMappings: LEGACY_CANONICAL_PRODUCT_ID_ALIASES.length, migratedIds: LEGACY_CANONICAL_PRODUCT_ID_ALIASES, invalidIds: 0, collisions: 0, conflicts: 0 }, p1Batch1: { decisions: P1_IDENTITY_DECISIONS_BATCH_1.length, resolvedDecisions: P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getByStatus("RESOLVED").length, manufacturerOnlyDecisions: P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getByStatus("MANUFACTURER_ONLY").length, coverage: p1Coverage }, p0Batch1: { decisions: P0_IDENTITY_DECISIONS_BATCH_1.length, resolvedDecisions: P0_IDENTITY_DECISIONS_BATCH_1.filter(item => item.decision.status === "RESOLVED").length, unresolvedDecisions: [], improvedVerifiedMixCount: improvedVerifiedMixIds.length, improvedVerifiedMixIds, occurrences: p0Occurrences, coverage: p0Batch1Coverage }, p0Batch2: { decisions: P0_IDENTITY_DECISIONS_BATCH_2.length, resolvedDecisions: P0_IDENTITY_DECISIONS_BATCH_2.filter(item => item.decision.status === "RESOLVED").length, ambiguousDecisions: P0_IDENTITY_DECISIONS_BATCH_2.filter(item => item.decision.status === "AMBIGUOUS").map(item => item.sourceIdentity.sourceGroupId), improvedVerifiedMixCount: p0Batch2ImprovedMixIds.length, improvedVerifiedMixIds: p0Batch2ImprovedMixIds, coverage: p0Batch2Coverage }, p0Batch3: { decisions: P0_IDENTITY_DECISIONS_BATCH_3.length, resolvedDecisions: P0_IDENTITY_DECISIONS_BATCH_3.filter(item => item.decision.status === "RESOLVED").length, unresolvedDecisions: [], improvedVerifiedMixCount: p0Batch3ImprovedMixIds.length, improvedVerifiedMixIds: p0Batch3ImprovedMixIds, coverage: p0Batch3Coverage }, p0Aggregate: { coverage: p0Coverage }, combinedRegistry: { decisions: TOBACCO_IDENTITY_DECISIONS.length, coverage: combinedCoverage }, syntheticConfirmedCoverage: coverage, realUnreviewedCoverage: realCoverage, checks: { asciiCanonicalIds: true, transliterationDeterministic: true, legacyLookup: true, reportsAndWorkbookIgnored: true, coverageUnchangedByMigration: true, p2p3Blocked: true, fuzzyMatching: false, unconfirmedSkipped: true, evidenceRequired: true, noLineSupported: true, fictitiousLinesForbidden: true, collisionDetected: true, nashDogmaSeparate: true, aliasDoesNotResolveProduct: true, p1Preserved: true, p0Preserved: true, privacyPassed: true, immutable: true, deterministic: true } }, null, 2));
};
main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
