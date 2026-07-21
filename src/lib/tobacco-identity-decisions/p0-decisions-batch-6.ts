import { normalizeDecisionText } from "./normalization";
import type { TobaccoIdentityDecision, TobaccoIdentityEvidence } from "./types";

const REVIEW_DATE = "2026-07-21";

const evidence: readonly TobaccoIdentityEvidence[] = Object.freeze([
  {
    sourceType: "VERIFIED_RETAIL_CATALOG",
    sourceReference: "Official distributor catalog identifies Sebero Classic Bilberry as Черника",
    sourceUrl: "https://oshisha.net/catalog/product/sebero_bilberry_25gr/",
    confidence: "HIGH",
    checkedAt: REVIEW_DATE,
    publicSafe: true,
  },
  {
    sourceType: "OFFICIAL_SOCIAL_ANNOUNCEMENT",
    sourceReference: "Official Sebero announcement identifies Limited Edition Blueberry",
    sourceUrl: "https://t.me/s/sebero/106",
    confidence: "HIGH",
    checkedAt: REVIEW_DATE,
    publicSafe: true,
  },
  {
    sourceType: "VERIFIED_REVIEW_DATABASE",
    sourceReference: "Review catalog maps Sebero Limited Edition Blueberry to Черника",
    sourceUrl: "https://htreviews.org/tobaccos/sebero/sebero-limited-edition",
    confidence: "MEDIUM",
    checkedAt: REVIEW_DATE,
    publicSafe: true,
  },
]);

export const P0_IDENTITY_DECISIONS_BATCH_6: readonly TobaccoIdentityDecision[] = Object.freeze([
  {
    id: "p0-batch-6-identity-group-0023",
    sourceIdentity: {
      manufacturer: "Sebero",
      productLine: null,
      productName: "Черника",
      normalizedManufacturer: normalizeDecisionText("Sebero"),
      normalizedProductLine: normalizeDecisionText(null),
      normalizedProductName: normalizeDecisionText("Черника"),
      sourceGroupId: "identity-group-0023",
      sourcePriority: "P0",
      sourceSheets: ["Mix_Components"],
      sourceRows: [],
      productLineInterpretation: "AMBIGUOUS",
    },
    decision: {
      status: "AMBIGUOUS",
      manufacturerId: "sebero",
      productLineId: null,
      canonicalProductId: null,
      canonicalManufacturerName: "Sebero",
      canonicalProductLineName: null,
      canonicalProductName: null,
      aliases: [],
    },
    evidence,
    review: {
      state: "AMBIGUOUS",
      reviewedByType: "INTERNAL_EXPERT",
      reviewedAt: REVIEW_DATE,
      reviewerNotes: null,
    },
    metadata: {
      version: "tobacco-identity-decision-v1",
      createdAt: REVIEW_DATE,
      updatedAt: REVIEW_DATE,
    },
  },
]);
