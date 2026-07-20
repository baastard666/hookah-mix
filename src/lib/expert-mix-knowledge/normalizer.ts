export const normalizeExpertKnowledgeText = (value: string): string => value.normalize("NFKC").trim().replace(/\s+/g, " ");

export const normalizeExpertKnowledgeTag = (value: string): string => normalizeExpertKnowledgeText(value).toLocaleLowerCase("ru-RU");

export const deepCloneAndFreeze = <T>(value: T): T => {
  const clone = structuredClone(value);
  const freeze = (item: unknown): void => {
    if (!item || typeof item !== "object" || Object.isFrozen(item)) return;
    Object.freeze(item);
    for (const child of Object.values(item)) freeze(child);
  };
  freeze(clone);
  return clone;
};
