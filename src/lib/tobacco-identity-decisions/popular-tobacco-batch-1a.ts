import { createCanonicalTobaccoProductId, normalizeDecisionText } from "./normalization";
import type { ProductLineInterpretation, TobaccoIdentityDecision, TobaccoIdentityEvidence, TobaccoIdentityEvidenceType } from "./types";

const REVIEW_DATE = "2026-11-10";

type EvidenceInput = { readonly sourceType: TobaccoIdentityEvidenceType; readonly sourceReference: string; readonly sourceUrl: string; readonly confidence: "MEDIUM" | "HIGH" };
type Input = {
  readonly key: string; readonly manufacturer: string; readonly manufacturerId: string; readonly line: string | null; readonly productLineId?: string | null;
  readonly product: string; readonly aliases: readonly string[]; readonly evidence: readonly EvidenceInput[];
};

const toEvidence = (item: EvidenceInput): TobaccoIdentityEvidence => ({ ...item, checkedAt: REVIEW_DATE, publicSafe: true });
const resolved = (input: Input): TobaccoIdentityDecision => {
  const productLineId = input.line ? (input.productLineId ?? `${input.manufacturerId}-${normalizeDecisionText(input.line).replace(/\s+/g, "-")}`) : null;
  const canonicalProductId = createCanonicalTobaccoProductId(input.manufacturerId, productLineId, input.product);
  if (!canonicalProductId) throw new Error(`Cannot create canonicalProductId for ${input.key}.`);
  const productLineInterpretation: ProductLineInterpretation = input.line ? "CONFIRMED" : "CONFIRMED_NONE";
  return {
    id: `popular-batch-1a-${input.key}`,
    sourceIdentity: {
      manufacturer: input.manufacturer, productLine: input.line, productName: input.product,
      normalizedManufacturer: normalizeDecisionText(input.manufacturer), normalizedProductLine: normalizeDecisionText(input.line), normalizedProductName: normalizeDecisionText(input.product),
      sourceGroupId: `popular-batch-1a-${input.key}`, sourcePriority: "USER_PRIORITY", sourceSheets: [], sourceRows: [], productLineInterpretation,
    },
    decision: {
      status: "RESOLVED", manufacturerId: input.manufacturerId, productLineId, canonicalProductId,
      canonicalManufacturerName: input.manufacturer, canonicalProductLineName: input.line, canonicalProductName: input.product, aliases: input.aliases,
    },
    evidence: input.evidence.map(toEvidence),
    review: { state: "CONFIRMED", reviewedByType: "INTERNAL_EXPERT", reviewedAt: REVIEW_DATE, reviewerNotes: null },
    metadata: { version: "tobacco-identity-decision-v1", createdAt: REVIEW_DATE, updatedAt: REVIEW_DATE },
  };
};

const jentLine: EvidenceInput = { sourceType: "OFFICIAL_MANUFACTURER_CATALOG", sourceReference: "JENT manufacturer presentation confirms Classic, Herbal, Alcohol and Cigar lines", sourceUrl: "https://cdn.robobill.me/uploads/component/761a98bde8d0a45736659822297af973/160286d4867c14315bc68bf564f5b51e.pdf", confidence: "HIGH" };
const jent = (key: string, line: "Classic" | "Alcohol" | "Herbal", product: string, aliases: readonly string[], sourceReference: string, sourceUrl: string): TobaccoIdentityDecision => resolved({ key, manufacturer: "JENT", manufacturerId: "jent", line, product, aliases, evidence: [jentLine, { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference, sourceUrl, confidence: "MEDIUM" }] });
const musthave = (key: string, product: string, aliases: readonly string[], sourceReference: string, sourceUrl: string): TobaccoIdentityDecision => resolved({ key, manufacturer: "Musthave", manufacturerId: "musthave", line: null, product, aliases, evidence: [{ sourceType: "OFFICIAL_PRODUCT_PAGE", sourceReference, sourceUrl, confidence: "HIGH" }] });

export const POPULAR_TOBACCO_IDENTITY_DECISIONS_BATCH_1A: readonly TobaccoIdentityDecision[] = Object.freeze([
  jent("jent-currant-wow", "Classic", "Currant WOW", ["Кислая смородина"], "JENT Classic Currant WOW / Кислая смородина: red and black currant", "https://hookah-time.shop/catalog/kalyannye-smesi/jent/200graFH/tabak-jent-200gr-classic-line-currant-wow-kislaya-smorodina/"),
  jent("jent-grape-me", "Classic", "Grape Me", ["Виноград и мята"], "JENT Classic Grape Me: grape and mint", "https://xn--80atei4cxafy.xn--p1ai/catalog/tabak/jent/classic-line/"),
  jent("jent-nastoika-zamorskaya", "Alcohol", "Настойка Заморская", [], "JENT Alcohol Настойка Заморская: orange, rosemary and currant", "https://optrf.store/collection/jent-category"),
  jent("jent-lesnaya-nalivka", "Alcohol", "Лесная Наливка", [], "JENT Alcohol Лесная Наливка: raspberry, cranberry and juniper", "https://optrf.store/collection/jent-category"),
  jent("jent-zabava", "Classic", "Забава", [], "JENT Classic Забава: aloe, strawberry and kiwi", "https://ushishashop.com/catalog/tabak/jent"),
  jent("jent-follar", "Herbal", "Follar", [], "JENT Herbal Follar: gooseberry with floral-herbal direction", "https://newtobacco.de/produkt-kategorie/tabak/jent-200g/"),
  jent("jent-air", "Alcohol", "Air", [], "JENT Alcohol Air: gin with juniper and citrus", "https://newtobacco.de/produkt-kategorie/tabak/jent-200g/"),
  jent("jent-baba-au-savarin", "Classic", "Baba Au Savarin", ["Ромовая баба"], "JENT Classic Baba Au Savarin / Ромовая баба", "https://xn--80atei4cxafy.xn--p1ai/catalog/tabak/jent/classic-line/"),
  musthave("musthave-green-tonic", "Green Tonic", ["Груша, лимон и тархун"], "MUSTHAVE Green Tonic: pear, lemon and tarragon", "https://musthave.ru/category/tabak-dlya-kalyana/spetsii/"),
  musthave("musthave-greendizer", "Greendizer", ["Киви, яблоко и лайм"], "MUSTHAVE Greendizer official product page", "https://musthave.ru/tabak-dlya-kalyana-musthave-kiwi-yabloko-laim/"),
  resolved({ key: "sebero-gid-amsterdam", manufacturer: "Sebero", manufacturerId: "sebero", line: "GID", product: "Амстердам", aliases: [], evidence: [{ sourceType: "OFFICIAL_SOCIAL_ANNOUNCEMENT", sourceReference: "SEBERO official GID release announcement: Амстердам", sourceUrl: "https://sebero.ru/news", confidence: "HIGH" }] }),
  resolved({ key: "sebero-gid-lissabon", manufacturer: "Sebero", manufacturerId: "sebero", line: "GID", product: "Лиссабон", aliases: [], evidence: [{ sourceType: "OFFICIAL_SOCIAL_ANNOUNCEMENT", sourceReference: "SEBERO official GID release announcement: Лиссабон", sourceUrl: "https://sebero.ru/news", confidence: "HIGH" }] }),
  resolved({ key: "spectrum-mix-line-tsvetochnyi-miks", manufacturer: "Spectrum", manufacturerId: "spectrum", line: "Mix Line", productLineId: "spectrum-mix-line", product: "Цветочный микс", aliases: [], evidence: [{ sourceType: "OFFICIAL_PRODUCT_PAGE", sourceReference: "Spectrum official Mix Line product page: Цветочный микс", sourceUrl: "https://spectrum-tbc.ru/", confidence: "HIGH" }] }),
]);
