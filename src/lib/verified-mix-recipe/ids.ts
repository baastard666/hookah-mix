import { stableSerializeExpertKnowledge } from "../expert-mix-knowledge";

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

export const createVerifiedMixRecipeId = (input: unknown): string => `vmr.${hash(stableSerializeExpertKnowledge(input))}`;
