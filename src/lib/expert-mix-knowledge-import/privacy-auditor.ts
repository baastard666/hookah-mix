import type { PublicExpertMixKnowledgeRecord } from "../expert-mix-knowledge";
import type { ExpertMixImportIssue } from "./types";

export const auditImportedKnowledgePrivacy = (records: readonly PublicExpertMixKnowledgeRecord[], privateTokens: readonly string[] = []): readonly ExpertMixImportIssue[] => {
  const json = JSON.stringify(records); const issues: ExpertMixImportIssue[] = [];
  for (const forbidden of ["internalLabel", "sourceId", "rowNumber", "Imported from", "\"notes\":", "\"evidence\":", "evidenceIds", "\"excerpt\":", "\"reference\":", ...privateTokens].filter(Boolean)) if (json.toLocaleLowerCase("ru-RU").includes(forbidden.toLocaleLowerCase("ru-RU"))) issues.push({ code: "PUBLIC_PRIVACY_LEAK", severity: "ERROR", field: forbidden, message: `Public output содержит приватный token: ${forbidden}.` });
  if (/file:\/\/|[a-z]:\\/iu.test(json)) issues.push({ code: "PUBLIC_PRIVACY_LEAK", severity: "ERROR", field: "localPath", message: "Public output содержит локальный путь." });
  return issues;
};
