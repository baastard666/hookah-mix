import { SENSORY_EVIDENCE_FIELDS, PUBLIC_QUALITY_READINESS_POLICY } from "./constants";
import type { PredictionReadiness, PredictionReadinessInput } from "./types";

const round = (value: number, precision: number): number => {
  const multiplier = 10 ** precision;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
};

export const calculatePredictionReadiness = (input: PredictionReadinessInput): PredictionReadiness => {
  const componentEvidence = input.canonicalMix.components.map(component => {
    const measuredFields = SENSORY_EVIDENCE_FIELDS.filter(field => component.effectiveProfile.parameters[field].value !== null);
    return {
      flavorId: component.flavorId,
      percentage: component.percentage,
      measuredFields,
      measuredFieldCount: measuredFields.length,
      fieldCoverage: round(measuredFields.length / SENSORY_EVIDENCE_FIELDS.length * 100, 1),
    };
  });
  const sensoryEvidenceCoverage = round(componentEvidence.reduce((sum, component) => sum + component.fieldCoverage * component.percentage / 100, 0), 1);
  const missingCriticalScoreDimensions = [
    ...(input.componentQuality === null ? ["componentQuality" as const] : []),
    ...(input.balance === null ? ["balance" as const] : []),
  ];
  const hasMeaningfulSensoryEvidence = sensoryEvidenceCoverage > 0;
  const reasons: string[] = [];
  if (!hasMeaningfulSensoryEvidence) reasons.push("Для компонентов нет измеренных сенсорных характеристик из модели профиля.");
  if (input.componentQuality === null) reasons.push("Потенциал компонентов не рассчитан из-за отсутствующих измерений.");
  if (input.balance === null) reasons.push("Баланс профиля не рассчитан из-за отсутствующих измерений.");
  if (hasMeaningfulSensoryEvidence && sensoryEvidenceCoverage < PUBLIC_QUALITY_READINESS_POLICY.minimumWeightedSensoryFieldCoverage) reasons.push("Сенсорные данные покрывают только часть состава.");
  const status = !hasMeaningfulSensoryEvidence || missingCriticalScoreDimensions.length > 0
    ? "INSUFFICIENT"
    : sensoryEvidenceCoverage >= PUBLIC_QUALITY_READINESS_POLICY.minimumWeightedSensoryFieldCoverage
      ? "READY"
      : "LIMITED";
  return {
    status,
    sensoryEvidenceCoverage,
    scoreEvidenceCoverage: sensoryEvidenceCoverage,
    componentEvidence,
    missingCriticalScoreDimensions,
    hasMeaningfulSensoryEvidence,
    verifiedSmokeAvailable: input.verifiedSmokeAvailable,
    reasons,
  };
};
