import { normalizeExpertKnowledgeText } from "./normalizer";

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, stableValue(child)]));
  return typeof value === "string" ? normalizeExpertKnowledgeText(value) : value;
};

export const stableSerializeExpertKnowledge = (value: unknown): string => JSON.stringify(stableValue(value));

const hash = (value: string): string => {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (const character of value.normalize("NFC")) {
    const codePoint = character.codePointAt(0) ?? 0;
    first = Math.imul(first ^ codePoint, 0x01000193) >>> 0;
    second = Math.imul(second ^ codePoint, 0x85ebca6b) >>> 0;
  }
  return `${first.toString(36).padStart(7, "0")}${second.toString(36).padStart(7, "0")}`;
};

const id = (namespace: string, semanticInput: unknown): string => `${namespace}.${hash(stableSerializeExpertKnowledge(semanticInput))}`;
export const createExpertMixRecordId = (semanticInput: unknown): string => id("emkr", semanticInput);
export const createExpertMixComponentId = (semanticInput: unknown): string => id("emkc", semanticInput);
export const createExpertMixObservationId = (semanticInput: unknown): string => id("emko", semanticInput);
export const createExpertKnowledgeEvidenceId = (semanticInput: unknown): string => id("emke", semanticInput);
export const createExpertKnowledgeSourceId = (semanticInput: unknown): string => id("emks", semanticInput);
