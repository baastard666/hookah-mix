import Link from "next/link";
import { notFound } from "next/navigation";
import { calculateMixAnalysis } from "@/lib/mix-analysis";
import { analyzeMix, type BowlType } from "@/lib/mix-analyzer";
import { fromPrismaFlavor } from "@/lib/mix-profile";
import { categoryLabels } from "@/lib/flavor-knowledge";
import { buildMixResultPresentation } from "@/lib/mix-result-presentation";
import { prisma } from "@/lib/prisma";
import RecommendationSection from "../recommendation-section";

export const dynamic = "force-dynamic";
const labels = { strength: "Крепость", sweetness: "Сладость", acidity: "Кислотность", freshness: "Свежесть", creaminess: "Сливочность", bitterness: "Горечь" } as const;
// ADR-025: human-readable phrasing for the numeric-risk tooltip - "Жаростойкость сильно различается: 9
// vs 3", not the raw field name/Δ, per the ADR's explicit explainability requirement.
const numericRiskPhrase = { heatResistance: "Жаростойкость сильно различается", strength: "Крепость сильно различается" } as const;

export default async function Result({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mix = await prisma.mix.findUnique({ where: { id: Number(id) }, include: { components: { include: { flavor: { include: { brand: true, notes: { include: { flavorNote: true } } } } } } } });
  if (!mix) notFound();
  const components = mix.components.map(component => fromPrismaFlavor(component.flavor, component.percentage));
  const analysis = calculateMixAnalysis({ components });
  const legacyAnalysis = analyzeMix(mix.components.map(component => ({ flavor: { ...component.flavor, notes: component.flavor.notes.map(note => ({ name: note.flavorNote.name, slug: note.flavorNote.slug, category: note.flavorNote.category, intensity: note.intensity, noteType: note.noteType })) }, percentage: component.percentage })), { bowlType: mix.bowlType as BowlType, coalCount: mix.coalCount as 2 | 3 | 4, warmupMinutes: mix.warmupMinutes });
  const presentation = buildMixResultPresentation({ analysis, legacyAnalysis, preparation: { bowlType: mix.bowlType, coalCount: mix.coalCount, warmupMinutes: mix.warmupMinutes } });
  const metrics = Object.keys(labels) as Array<keyof typeof labels>;
  const componentNames = Object.fromEntries(analysis.canonicalMix.components.map(component => [String(component.flavorId), `${component.brandName} ${component.flavorName}`]));
  const builderHref = (rows: readonly { flavorId: number; percentage: number }[]) => {
    const query = new URLSearchParams({ components: rows.map(row => `${row.flavorId}:${row.percentage}`).join(","), bowl: mix.bowlType, coals: String(mix.coalCount), warmup: String(mix.warmupMinutes) });
    return `/builder?${query.toString()}`;
  };
  const currentRows = mix.components.map(component => ({ flavorId: component.flavorId, percentage: component.percentage }));
  const currentBuilderHref = builderHref(currentRows);
  const proposedRows = presentation.suggestedVariant?.components.map(component => {
    const canonical = analysis.canonicalMix.components.find(item => String(item.flavorId) === component.componentId);
    return { flavorId: Number(canonical?.sourceComponentIds[0]), percentage: component.suggestedPercentage };
  }).filter(row => Number.isInteger(row.flavorId));
  const proposedBuilderHref = proposedRows?.length === mix.components.length ? builderHref(proposedRows) : undefined;
  const metricPresentation = Object.fromEntries(presentation.profile.metrics.map(metric => [metric.key, metric]));

  return <main className="container section result-page">
    <Link className="muted" href={currentBuilderHref}>← Изменить состав</Link>
    <section className="result-composition">
      <div className="eyebrow">Состав</div>
      <h1>{presentation.profile.title}</h1>
      <p className="lead result-components">{mix.components.map(component => `${component.flavor.brand.name} ${component.flavor.name} — ${component.percentage}%`).join(" · ")}</p>
    </section>

    <section className="card result-summary"><div className="eyebrow">Коротко о результате</div><h2>{presentation.summary.text}</h2><p>{presentation.summary.primaryAction}</p></section>

    <section className="card score-panel">
      <div><div className="eyebrow">{presentation.predictedScore.title}</div><p className="score-explanation">{presentation.predictedScore.description}</p></div>
      <div className="big-score" aria-label={presentation.predictedScore.value === null ? `${presentation.predictedScore.title}: недостаточно данных` : `${presentation.predictedScore.title}: ${presentation.predictedScore.value} из 10`}>{presentation.predictedScore.value === null ? <span className="score-unavailable">Недостаточно данных</span> : <>{presentation.predictedScore.value}<small>/10</small></>}</div>
      <div className="smoke-score"><b>{presentation.verifiedSmoke.title}</b>{presentation.verifiedSmoke.value !== null && <strong>{presentation.verifiedSmoke.value}/10</strong>}<span className="muted">{presentation.verifiedSmoke.description}</span></div>
    </section>

    <section className="card reliability-panel"><div><div className="eyebrow">Совместимость вкусовых направлений</div><b className="compatibility-score">{presentation.compatibility.value}/10</b><p className="muted">{presentation.compatibility.description}</p></div><div><div className="eyebrow">Что система знает</div><p><b>Распознавание продуктов:</b> {presentation.evidence.recognition.summary}</p><p><b>Данные о характеристиках:</b> {presentation.evidence.sensory.summary}</p><p><b>Подтверждения:</b> {presentation.evidence.confirmations.verifiedSmokeAvailable ? "есть реальный покур" : "реальный покур пока не подтверждён"}{presentation.evidence.confirmations.proportionsConfirmed ? "; пропорции подтверждены" : ""}.</p></div></section>

    <section className="card"><div className="eyebrow">Статус компонентов</div><h2>{presentation.resolution.summary}</h2><div className="resolution-list">{presentation.resolution.components.map((component, index) => <div className="resolution-item" key={`${component.name}-${index}`}><span><b>{component.name}</b><small>{component.percentage}% · {component.catalogStatus}</small><small>{component.status}</small><small>{component.profileStatus}</small><small><b>Роль в этом миксе:</b> {component.actualMixRole}</small>{component.recommendedCatalogRole && <small>Обычная роль продукта в миксах: {component.recommendedCatalogRole}</small>}</span></div>)}</div></section>

    <section className="card"><div className="eyebrow">Расчётные ориентиры</div><div className="breakdown-grid">{presentation.breakdown.map(item => <article className="breakdown-item" key={item.key}><div><h3>{item.label}</h3><strong>{item.value === null ? "нет данных" : item.value}</strong></div><p>{item.explanation}</p></article>)}</div></section>

    <div className="result-main-grid">
      <div className="result-column">
        <section className="card"><div className="eyebrow">Предполагаемый профиль</div><h2>{presentation.profile.summary}</h2><h3>Доминирующие ноты</h3><div className="chips">{presentation.profile.dominantNotes.map(note => <span className="tag" key={note}>{note}</span>)}</div>{presentation.profile.backgroundNotes.length > 0 && <><h3>Фоновые ноты</h3><div className="chips">{presentation.profile.backgroundNotes.map(note => <span className="tag" key={note}>{note}</span>)}</div></>}</section>
        {/* ADR-015: creaminess/bitterness may be null ("не измерено") - the fill stays at 0% width, but the label above already says "нет данных" so an unmeasured metric is never shown as if it were a real low reading. */}
        <section className="card"><h2>Баланс профиля</h2><div className="scales">{metrics.map(key => <div key={key}><div className="scale-label"><span>{labels[key]}</span><b>{metricPresentation[key].displayValue}</b></div><div className="scale-line"><div className="scale-fill" style={{ width: `${(metricPresentation[key].value ?? 0) * 10}%` }}/></div></div>)}</div></section>
        {presentation.strengths.length > 0 && <section className="card"><div className="eyebrow">Сильные стороны</div><ul>{presentation.strengths.map(item => <li key={item}>{item}</li>)}</ul>{presentation.matchedCategoryPairs.length > 0 && <div className="category-match-tooltip" tabIndex={0} aria-describedby="category-match-explanation"><span className="category-match-badge">Через какие категории сработало ⓘ</span><div className="category-match-tooltip-content" role="tooltip" id="category-match-explanation"><ul className="compact-list">{presentation.matchedCategoryPairs.map(pair => <li key={pair.ruleId}>{categoryLabels[pair.left]} + {categoryLabels[pair.right]}</li>)}</ul></div></div>}</section>}
        <RecommendationSection actions={presentation.actions} status={presentation.recommendationStatus} suggestedVariant={presentation.suggestedVariant} componentNames={componentNames} proposalComparison={presentation.proposalComparison} currentBuilderHref={currentBuilderHref} proposedBuilderHref={proposedBuilderHref}/>
      </div>
      <aside className="result-column">
        <section className="card"><div className="eyebrow">Известные риски</div><p>{presentation.evidence.knownRisks.summary}</p>{presentation.risks.length > 0 && <div className="risk-list">{presentation.risks.map(risk => <article className="risk-item" key={risk.id}><div className="recommendation-title"><h3>{risk.title}</h3><span className={`priority priority-${risk.level.toLocaleLowerCase("ru-RU")}`}>{risk.level}</span></div><p><b>Причина:</b> {risk.reason}</p><p><b>Что делать:</b> {risk.recommendation}</p></article>)}</div>}{presentation.matchedNumericRisks.length > 0 && <div className="numeric-risk-tooltip" tabIndex={0} aria-describedby="numeric-risk-explanation"><span className="numeric-risk-badge">Через какие числовые значения сработало ⓘ</span><div className="numeric-risk-tooltip-content" role="tooltip" id="numeric-risk-explanation"><ul className="compact-list">{presentation.matchedNumericRisks.map(risk => <li key={risk.ruleId}>{numericRiskPhrase[risk.field]}: {risk.componentAValue} vs {risk.componentBValue}</li>)}</ul></div></div>}</section>
        <section className="card"><div className="eyebrow">Приготовление</div><h3>{presentation.preparation.sourceLabel}</h3><p className="preparation-line">{mix.bowlType} · {mix.coalCount} угля · прогрев&nbsp;{mix.warmupMinutes}&nbsp;мин.</p><p className="muted">{presentation.preparation.evidenceLabel}</p>{presentation.preparation.recommendations.map(item => <p key={item}>→ {item}</p>)}</section>
      </aside>
    </div>
  </main>;
}
