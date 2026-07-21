import { deepCloneAndFreeze, normalizeExpertKnowledgeText } from "../expert-mix-knowledge/normalizer";
import type { ExcelCellValue } from "./types";

export const normalizeImportText = (value: ExcelCellValue | undefined): string | null => value === null || value === undefined ? null : normalizeExpertKnowledgeText(String(value)) || null;
export const normalizeHeader = (value: ExcelCellValue | undefined): string => (normalizeImportText(value) ?? "").toLocaleLowerCase("ru-RU").replace(/[\s-]+/g, "_");
export const parseImportNumber = (value: ExcelCellValue): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.trim().replace(/\s+/g, "").replace(",", ".").replace(/%$/, ""));
  return Number.isFinite(parsed) ? parsed : null;
};
export const splitImportTags = (value: ExcelCellValue | undefined): readonly string[] => [...new Set((normalizeImportText(value) ?? "").split(/[,;|]/).map(item => normalizeExpertKnowledgeText(item)).filter(Boolean).map(item => item.toLocaleLowerCase("ru-RU")))];
export { deepCloneAndFreeze };
