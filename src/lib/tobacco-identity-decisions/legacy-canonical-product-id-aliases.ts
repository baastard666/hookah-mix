import { ASCII_CANONICAL_PRODUCT_ID_PATTERN } from "./canonical-id";
import { TobaccoIdentityDecisionError } from "./errors";
import { deepFreezeClone } from "./normalization";
import type {
  LegacyCanonicalProductIdAlias,
  LegacyCanonicalProductIdAliasRegistry,
  LegacyCanonicalProductIdLookup,
  TobaccoIdentityDecisionIssue,
} from "./types";

const issue = (code: TobaccoIdentityDecisionIssue["code"], message: string): TobaccoIdentityDecisionIssue => ({ code, severity: "ERROR", message });

export const validateLegacyCanonicalProductIdAliases = (aliases: readonly LegacyCanonicalProductIdAlias[]): readonly TobaccoIdentityDecisionIssue[] => {
  const issues: TobaccoIdentityDecisionIssue[] = [];
  const byLegacy = new Map<string, string>();
  for (const alias of aliases) {
    const existing = byLegacy.get(alias.legacyCanonicalProductId);
    if (existing === alias.canonicalProductId) issues.push(issue("LEGACY_CANONICAL_ID_DUPLICATE", `Legacy canonical ID ${alias.legacyCanonicalProductId} is duplicated.`));
    else if (existing) issues.push(issue("LEGACY_CANONICAL_ID_CONFLICT", `Legacy canonical ID ${alias.legacyCanonicalProductId} points to multiple canonical IDs.`));
    if (!alias.legacyCanonicalProductId || alias.legacyCanonicalProductId === alias.canonicalProductId || !ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(alias.canonicalProductId)) issues.push(issue("LEGACY_CANONICAL_ID_CONFLICT", `Legacy mapping ${alias.legacyCanonicalProductId} -> ${alias.canonicalProductId} is invalid.`));
    byLegacy.set(alias.legacyCanonicalProductId, alias.canonicalProductId);
  }
  for (const start of byLegacy.keys()) {
    const visited = new Set<string>();
    let current: string | undefined = start;
    while (current && byLegacy.has(current)) {
      if (visited.has(current)) { issues.push(issue("LEGACY_CANONICAL_ID_CYCLE", `Legacy canonical ID cycle starts at ${start}.`)); break; }
      visited.add(current);
      current = byLegacy.get(current);
    }
  }
  return issues;
};

export const createLegacyCanonicalProductIdAliasRegistry = (source: readonly LegacyCanonicalProductIdAlias[]): LegacyCanonicalProductIdAliasRegistry => {
  const issues = validateLegacyCanonicalProductIdAliases(source);
  if (issues.length) throw new TobaccoIdentityDecisionError("Legacy canonical product ID aliases are invalid.", issues);
  const aliases = deepFreezeClone([...source]) as readonly Readonly<LegacyCanonicalProductIdAlias>[];
  const byLegacy = new Map(aliases.map(alias => [alias.legacyCanonicalProductId, alias.canonicalProductId]));
  return Object.freeze({
    version: "legacy-canonical-product-id-aliases-v1",
    size: aliases.length,
    list: () => aliases,
    resolve: (legacyCanonicalProductId: string): LegacyCanonicalProductIdLookup => {
      const canonicalProductId = byLegacy.get(legacyCanonicalProductId);
      return canonicalProductId ? { status: "FOUND", legacyCanonicalProductId, canonicalProductId } : { status: "NOT_FOUND" };
    },
  });
};

export const LEGACY_CANONICAL_PRODUCT_ID_ALIASES: readonly LegacyCanonicalProductIdAlias[] = Object.freeze([
  { legacyCanonicalProductId: "blackburn-на-расслабоне", canonicalProductId: "blackburn-na-rasslabone", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "blackburn-клюквенный-морс", canonicalProductId: "blackburn-klyukvennyi-mors", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "blackburn-на-чилле", canonicalProductId: "blackburn-na-chille", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "nash-white-line-карамель-цитрус", canonicalProductId: "nash-white-line-karamel-tsitrus", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "nash-black-line-арбуз", canonicalProductId: "nash-black-line-arbuz", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "brusko-medium-цитрусовый-чай", canonicalProductId: "brusko-medium-tsitrusovyi-chai", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "chabacco-mix-апельсин-сливки", canonicalProductId: "chabacco-mix-apelsin-slivki", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "chabacco-mix-банановый-милкшейк", canonicalProductId: "chabacco-mix-bananovyi-milksheik", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "chabacco-mix-гренадин-дропс", canonicalProductId: "chabacco-mix-grenadin-drops", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "chabacco-морозная-мята", canonicalProductId: "chabacco-moroznaya-myata", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "chabacco-mix-фруктовый-лед", canonicalProductId: "chabacco-mix-fruktovyi-led", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "daily-hookah-сливочный-крем", canonicalProductId: "daily-hookah-slivochnyi-krem", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "hooligan-medium-ягодный-микс", canonicalProductId: "hooligan-medium-yagodnyi-miks", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "darkside-core-кокос", canonicalProductId: "darkside-core-kokos", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "darkside-manufacturer-only-кокос", canonicalProductId: "darkside-manufacturer-only-kokos", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "nash-manufacturer-only-лаванда", canonicalProductId: "nash-manufacturer-only-lavanda", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "musthave-manufacturer-only-манго", canonicalProductId: "musthave-manufacturer-only-mango", reason: "ASCII_TRANSLITERATION_POLICY" },
  { legacyCanonicalProductId: "blackburn-manufacturer-only-ваниль", canonicalProductId: "blackburn-manufacturer-only-vanil", reason: "ASCII_TRANSLITERATION_POLICY" },
]);

export const LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY = createLegacyCanonicalProductIdAliasRegistry(LEGACY_CANONICAL_PRODUCT_ID_ALIASES);
