import { resolveIntensity } from "./flavors/types";
import type { MixInput } from "./types";

export const BOWL_TYPES = ["Cosmo Bowl Turkish", "классическая турка", "фанел", "прямоточная глина", "силиконовая чаша"] as const;
export type BowlType = (typeof BOWL_TYPES)[number];
export type AnalysisOptions = { bowlType: BowlType; coalCount: 2 | 3 | 4; warmupMinutes: number };
export type ValidationResult = { valid: boolean; errors: string[]; total: number };
// ADR-015/ADR-017: this legacy engine reads raw Prisma Flavor data directly (via mapFlavor), with no
// resolver in front of it - unlike the canonical-mix-scoring pipeline, any of these fields can genuinely
// be null here at runtime. Every weighted value below may be null when no component in the mix has that
// field measured.
export type MixAnalysis = { compatibilityScore: number; strength: number | null; sweetness: number | null; acidity: number | null; freshness: number | null; creaminess: number | null; bitterness: number | null; dominantFlavor: string; dominantNotes: string[]; backgroundNotes: string[]; conflicts: string[]; overheatingRisk: "низкий" | "средний" | "высокий"; description: string; proportionRecommendations: string[]; heatRecommendations: string[] };

function round(n: number): number;
function round(n: number | null): number | null;
function round(n: number | null): number | null { return n === null ? null : Math.round(n * 10) / 10; }
export function validateMix(components: MixInput[]): ValidationResult {
  const total = components.reduce((sum, item) => sum + item.percentage, 0);
  const errors: string[] = [];
  if (components.length < 2) errors.push("Добавьте минимум два табака");
  if (components.length > 5) errors.push("Можно использовать не более пяти табаков");
  if (components.some((item) => item.percentage <= 0)) errors.push("Доля каждого компонента должна быть больше нуля");
  if (total !== 100) errors.push(`Сумма пропорций должна быть 100%, сейчас ${total}%`);
  return { valid: errors.length === 0, errors, total };
}

// ADR-015/ADR-017: null means "not measured" for any of these fields. Excluded from both the numerator
// and denominator (partial average over measured components), never treated as 0. If no component
// measured this field at all, the mix-level value is null too.
const weighted = (items: MixInput[], key: keyof Pick<MixInput["flavor"], "strength"|"heatResistance"|"sweetness"|"acidity"|"cooling"|"creaminess"|"bitterness">): number | null => {
  const measured = items.filter(item => item.flavor[key] !== null);
  const measuredPercentage = measured.reduce((sum, item) => sum + item.percentage, 0);
  if (!measured.length || measuredPercentage <= 0) return null;
  return measured.reduce((sum, item) => sum + item.flavor[key]! * item.percentage, 0) / measuredPercentage;
};
const hasNote = (items: MixInput[], note: string) => items.some((item) => item.flavor.notes.some((n) => n.name.toLowerCase() === note));
const pair = (items: MixInput[], a: string, b: string) => hasNote(items, a) && hasNote(items, b);

export function analyzeMix(components: MixInput[], options: AnalysisOptions): MixAnalysis {
  const validation = validateMix(components);
  if (!validation.valid) throw new Error(validation.errors.join("; "));
  const strength = weighted(components, "strength"), sweetness = weighted(components, "sweetness"), acidity = weighted(components, "acidity"), freshness = weighted(components, "cooling"), creaminess = weighted(components, "creaminess"), bitterness = weighted(components, "bitterness"), heatResistance = weighted(components, "heatResistance");
  let score = 6.5;
  const goodPairs = [["coffee","cream"],["coffee","vanilla"],["coffee","banana"],["coffee","dark chocolate"],["coffee","chocolate"],["banana","cream"],["banana","vanilla"],["mango","citrus"],["lemon","mint"],["coconut","cream"],["coconut","chocolate"]];
  score += Math.min(2.5, goodPairs.filter(([a,b]) => pair(components,a,b)).length * 0.7);
  const conflicts: string[] = [];
  // ADR-015/ADR-017: any of these fields may be null ("not measured") - an unmeasured component/mix never satisfies these thresholds.
  const hasStrongCooling = components.some(c => c.flavor.cooling !== null && c.flavor.cooling >= 8);
  const hasStrongCream = components.some(c => (c.flavor.creaminess !== null && c.flavor.creaminess >= 8) || c.flavor.notes.some(n => n.name === "cream" && n.intensity >= 7));
  if (hasStrongCooling && hasStrongCream) { score -= 1.5; conflicts.push("Сильный холод может приглушить сливочный профиль"); }
  if (hasStrongCooling && hasNote(components,"coffee")) { score -= 1.3; conflicts.push("Сильный холод конфликтует с кофейной основой"); }
  if (acidity !== null && acidity >= 6 && creaminess !== null && creaminess >= 6) { score -= 1.4; conflicts.push("Высокая кислотность может спорить со сливочными нотами"); }
  if (bitterness !== null && bitterness >= 6 && acidity !== null && acidity >= 6) { score -= 1.2; conflicts.push("Горечь и кислотность одновременно делают профиль резким"); }
  const intense = components.filter((c) => resolveIntensity(c.flavor.intensity) >= 8);
  if (intense.length >= 2 && Math.max(...intense.map(c=>c.percentage))-Math.min(...intense.map(c=>c.percentage)) <= 10) { score -= 1.2; conflicts.push("Несколько интенсивных вкусов конкурируют в равных долях"); }
  const noteScores = new Map<string, number>();
  components.forEach(c => c.flavor.notes.forEach(n => noteScores.set(n.name, (noteScores.get(n.name) ?? 0) + n.intensity * c.percentage / 100)));
  const notes = [...noteScores.entries()].sort((a,b)=>b[1]-a[1]);
  const dominant = [...components].sort((a,b)=>(b.percentage*resolveIntensity(b.flavor.intensity))-(a.percentage*resolveIntensity(a.flavor.intensity)))[0];
  let heatRisk = 0;
  if (options.coalCount === 4) heatRisk += 3;
  if (options.warmupMinutes > 6) heatRisk += 2;
  if (heatResistance !== null && heatResistance < 7) heatRisk += 2;
  if (bitterness !== null && bitterness >= 5) heatRisk += 1;
  if (options.bowlType === "классическая турка" || options.bowlType === "Cosmo Bowl Turkish") heatRisk += 1;
  const overheatingRisk = heatRisk >= 6 ? "высокий" : heatRisk >= 3 ? "средний" : "низкий";
  const profile = pair(components,"coffee","banana") && (hasNote(components,"cream") || hasNote(components,"vanilla")) ? "банановый латте" : notes.slice(0,3).map(n=>n[0]).join(", ");
  const sweetnessNote = sweetness === null ? "Сладость этого сочетания не измерена." : sweetness >= 6 ? "Сладкие и мягкие ноты округляют композицию." : "Композиция остаётся умеренно сухой.";
  const description = `Профиль напоминает ${profile}. ${dominant.flavor.brand.name} ${dominant.flavor.name} задаёт ${dominant.percentage >= 50 ? "главное направление" : "выраженную основу"}. ${sweetnessNote}${pair(components,"coffee","banana") ? " Банан, ваниль и сливки смягчают кофейную горечь." : ""}`;
  const proportionRecommendations = conflicts.length ? ["Снизьте долю самого интенсивного компонента на 5–10% и отдайте её более мягкому вкусу."] : [score >= 8 ? "Пропорции сбалансированы; для более яркой основы изменяйте доли не более чем на 5%." : "Попробуйте увеличить связующий сливочный или ванильный компонент на 5–10%."];
  const heatRecommendations = options.coalCount === 4 ? ["После прогрева перейдите на три угля и контролируйте горечь."] : overheatingRisk === "высокий" ? ["Сократите прогрев и снимите один уголь."] : ["Текущий режим жара подходит; переставляйте угли к краю при появлении горечи."];
  return { compatibilityScore: round(Math.max(0,Math.min(10,score))), strength: round(strength), sweetness: round(sweetness), acidity: round(acidity), freshness: round(freshness), creaminess: round(creaminess), bitterness: round(bitterness), dominantFlavor: `${dominant.flavor.brand.name} ${dominant.flavor.name}`, dominantNotes: notes.slice(0,3).map(n=>n[0]), backgroundNotes: notes.slice(3,7).map(n=>n[0]), conflicts, overheatingRisk, description, proportionRecommendations, heatRecommendations };
}
