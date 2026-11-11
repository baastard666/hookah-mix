import assert from "node:assert/strict";
import { getMixCatalogSnapshot, listMixCatalogItems } from "../src/lib/mix-catalog";
const privateTokens = ["sourceRecordId", "sourceId", "evidenceId", "reference", "excerpt", "internalLabel", "author", "workbook", "C:\\", "/Users/", "decisionId", "debugReasons", "category.", "Category relation"];
const snapshot = getMixCatalogSnapshot(); const serialized = JSON.stringify(snapshot);
assert.equal(snapshot.schemaVersion, "verified-mix-catalog-v1"); assert.equal(snapshot.items.length, 28);
assert.equal(new Set(snapshot.items.map(item => item.recipeId)).size, 28); assert.equal(new Set(snapshot.items.map(item => item.slug)).size, 28);
assert.deepEqual(privateTokens.filter(token => serialized.includes(token)), []);
snapshot.items.forEach(item => { assert.equal(item.predicted.qualityScore !== null, item.predicted.predictionReadiness.status === "READY"); assert.ok(item.predicted.qualityScore === null || Number.isFinite(item.predicted.qualityScore)); assert.ok(Math.abs(item.components.reduce((sum, component) => sum + component.percentage, 0) - 100) <= 0.0001); });
assert.deepEqual(listMixCatalogItems(), listMixCatalogItems()); console.log(JSON.stringify({ schemaVersion: snapshot.schemaVersion, recipes: snapshot.items.length, publicScores: snapshot.items.filter(item => item.predicted.qualityScore !== null).length, suppressedScores: snapshot.items.filter(item => item.predicted.qualityScore === null).length, privacyPassed: true, deterministicRegistry: true }, null, 2));
