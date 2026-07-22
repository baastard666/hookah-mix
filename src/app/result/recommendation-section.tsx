import Link from "next/link";
import type { RecommendationStatus, SuggestedMixVariant } from "@/lib/mix-recommendation";
import type { MixResultPresentation, PublicRecommendation } from "@/lib/mix-result-presentation";
import { categoryLabels, presentationLabel, priorityLabels, reasonLabels, roleLabels, statusLabels, typeLabels } from "./recommendation-presentation";

export default function RecommendationSection({ actions, status, suggestedVariant, componentNames, proposalComparison, currentBuilderHref, proposedBuilderHref }: { actions: readonly PublicRecommendation[]; status: RecommendationStatus; suggestedVariant?: SuggestedMixVariant; componentNames: Readonly<Record<string, string>>; proposalComparison?: MixResultPresentation["proposalComparison"]; currentBuilderHref: string; proposedBuilderHref?: string }) {
  return <section className="card recommendation-section">
    <div className="eyebrow">Рекомендации по пропорциям</div>
    <h2>{presentationLabel(statusLabels, status, "Статус анализа")}</h2>
    {status === "INSUFFICIENT_DATA" && <p className="muted">Для уверенных рекомендаций профилю не хватает подтверждённых данных.</p>}
    <div className="recommendation-list">{actions.map(item => {
      const action = item.action;
      const range = action.type === "DECREASE_COMPONENT" || action.type === "INCREASE_COMPONENT" ? action.suggestedPercentageRange : undefined;
      const role = action.type === "DECREASE_COMPONENT" || action.type === "INCREASE_COMPONENT" ? action.suggestedRole : undefined;
      return <article className="recommendation-item" key={`${item.type}-${item.componentIds.join("-")}-${item.categoryIds.join("-")}`}>
        <div className="recommendation-title"><h3>{presentationLabel(typeLabels, item.type)}</h3><span className={`priority priority-${item.priority.toLowerCase()}`}>{presentationLabel(priorityLabels, item.priority)}</span></div>
        <p className="muted">Уверенность: <b>{item.confidenceScore}%</b></p>
        {item.componentIds.length > 0 && <p><b>Компонент:</b> {item.componentIds.map(id => componentNames[id] ?? "Выбранный компонент").join(", ")}</p>}
        {item.categoryIds.length > 0 && <p><b>Направление:</b> {item.categoryIds.map(id => presentationLabel(categoryLabels, id, "Другое вкусовое направление")).join(", ")}</p>}
        {range && <p><b>Рабочий диапазон:</b> {range.min}–{range.max}%</p>}
        {role && <p><b>Целевая роль после корректировки:</b> {presentationLabel(roleLabels, role)}</p>}
        {action.type === "REBALANCE_COMPONENTS" && action.adjustments.map(adjustment => <p key={adjustment.componentId}><b>{componentNames[adjustment.componentId] ?? "Выбранный компонент"}:</b> {adjustment.suggestedPercentageRange.min}–{adjustment.suggestedPercentageRange.max}% · {presentationLabel(roleLabels, adjustment.suggestedRole)}</p>)}
        <ul>{[...new Set(item.reasons.map(reason => reason.code))].map(code => <li key={code}>{presentationLabel(reasonLabels, code, "Дополнительная причина")}</li>)}</ul>
      </article>;
    })}</div>
    {suggestedVariant && proposalComparison && <div className="suggested-variant"><h3>Пересчитанный вариант</h3>{suggestedVariant.components.map(component => { const delta = component.suggestedPercentage - component.currentPercentage; return <div className="variant-row" key={component.componentId}><span>{componentNames[component.componentId] ?? "Выбранный компонент"}</span><span>{component.currentPercentage}% → <b>{component.suggestedPercentage}%</b>{delta !== 0 && <small> ({delta > 0 ? "+" : "−"}{Math.abs(delta)} п.п.)</small>}</span></div>; })}<div className="variant-total"><span>Итого</span><b>{suggestedVariant.totalPercentage}%</b></div><div className="proposal-compare"><p><b>Текущий прогноз:</b> {proposalComparison.current.predictedQualityScore}/10 · устойчивость к рискам {proposalComparison.current.riskScore}/10</p><p><b>После изменения:</b> {proposalComparison.proposed.predictedQualityScore}/10 · устойчивость к рискам {proposalComparison.proposed.riskScore}/10</p></div></div>}
    <div className="result-actions">{proposedBuilderHref && <Link className="btn btn-primary" href={proposedBuilderHref}>Применить предложенные пропорции</Link>}<Link className="btn" href={currentBuilderHref}>Изменить состав</Link></div>
  </section>;
}
