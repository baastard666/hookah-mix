import type { MixRecommendationResult } from "@/lib/mix-recommendation";
import { categoryLabels, presentationLabel, priorityLabels, reasonLabels, roleLabels, statusLabels, typeLabels } from "./recommendation-presentation";

export default function RecommendationSection({ result, componentNames }: { result: MixRecommendationResult; componentNames: Readonly<Record<string, string>> }) {
  const variant = result.summary.suggestedMixVariant;
  return <section className="card recommendation-section">
    <div className="eyebrow">Рекомендации по миксу</div>
    <h2>{presentationLabel(statusLabels, result.status, "Статус анализа")}</h2>
    {result.status === "NO_CHANGES_NEEDED" && <p className="ok">Текущие пропорции можно сохранить: значимых проблем не обнаружено.</p>}
    {result.status === "INSUFFICIENT_DATA" && <p className="muted">Для уверенных рекомендаций профилю не хватает подтверждённых данных.</p>}
    <div className="recommendation-list">{result.recommendations.filter(item => !["PRESERVE_CURRENT_MIX", "INSUFFICIENT_DATA"].includes(item.type)).map(item => {
      const action = item.action;
      const range = action.type === "DECREASE_COMPONENT" || action.type === "INCREASE_COMPONENT" ? action.suggestedPercentageRange : undefined;
      const role = action.type === "DECREASE_COMPONENT" || action.type === "INCREASE_COMPONENT" ? action.suggestedRole : undefined;
      return <article className="recommendation-item" key={item.id}>
        <div className="recommendation-title"><h3>{presentationLabel(typeLabels, item.type)}</h3><span className={`priority priority-${item.priority.toLowerCase()}`}>{presentationLabel(priorityLabels, item.priority)}</span></div>
        <p className="muted">Уверенность: <b>{item.confidenceScore}%</b></p>
        {item.componentIds.length > 0 && <p><b>Компонент:</b> {item.componentIds.map(id => componentNames[id] ?? `Компонент ${id}`).join(", ")}</p>}
        {item.categoryIds.length > 0 && <p><b>Направление:</b> {item.categoryIds.map(id => presentationLabel(categoryLabels, id, id)).join(", ")}</p>}
        {range && <p><b>Рекомендуемая доля:</b> {range.min}–{range.max}%</p>}
        {role && <p><b>Роль:</b> {presentationLabel(roleLabels, role)}</p>}
        {action.type === "REBALANCE_COMPONENTS" && action.adjustments.map(adjustment => <p key={adjustment.componentId}><b>{componentNames[adjustment.componentId] ?? adjustment.componentId}:</b> {adjustment.suggestedPercentageRange.min}–{adjustment.suggestedPercentageRange.max}% · {presentationLabel(roleLabels, adjustment.suggestedRole)}</p>)}
        <ul>{item.reasons.map((reason, index) => <li key={`${reason.code}-${index}`}>{presentationLabel(reasonLabels, reason.code, "Дополнительная причина")}</li>)}</ul>
        {item.sourceRuleIds.length > 0 && <p className="rule-ids"><b>Основание:</b> {item.sourceRuleIds.map(id => <code key={id}>{id}</code>)}</p>}
      </article>;
    })}</div>
    {variant && <div className="suggested-variant"><h3>Предлагаемый вариант</h3>{variant.components.map(component => <div className="variant-row" key={component.componentId}><span>{componentNames[component.componentId] ?? `Компонент ${component.componentId}`}</span><span>{component.currentPercentage}% → <b>{component.suggestedPercentage}%</b></span></div>)}<div className="variant-total"><span>Итого</span><b>{variant.totalPercentage}%</b></div></div>}
  </section>;
}
