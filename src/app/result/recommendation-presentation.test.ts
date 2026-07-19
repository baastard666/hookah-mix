import { describe, expect, it } from "vitest";
import { categoryLabels, presentationLabel, priorityLabels, reasonLabels, roleLabels, statusLabels, typeLabels } from "./recommendation-presentation";

describe("Recommendation presentation mappings", () => {
  it("maps recommendation status", () => expect(statusLabels.NO_CHANGES_NEEDED).toBe("Микс уже сбалансирован"));
  it("maps significant status", () => expect(statusLabels.SIGNIFICANT_ADJUSTMENTS).not.toContain("SIGNIFICANT"));
  it("maps action type", () => expect(typeLabels.DECREASE_COMPONENT).toBe("Уменьшить компонент"));
  it("maps preserve action", () => expect(typeLabels.PRESERVE_CURRENT_MIX).not.toContain("PRESERVE"));
  it("maps priority", () => expect(priorityLabels.CRITICAL).toBe("Критический"));
  it("maps component role", () => expect(roleLabels.ACCENT).toBe("Акцент"));
  it("maps reason code", () => expect(reasonLabels.EXCESSIVE_COOLING).toBe("Слишком сильный холод"));
  it("maps knowledge category", () => expect(categoryLabels.CITRUS).toBe("Цитрус"));
  it("uses safe fallback", () => expect(presentationLabel(typeLabels, "UNKNOWN")).toBe("Другое действие"));
  it("does not return undefined", () => expect(presentationLabel(statusLabels, "FUTURE", "Неизвестный статус")).toBe("Неизвестный статус"));
});
