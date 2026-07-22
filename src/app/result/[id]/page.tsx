import Link from "next/link";
import { notFound } from "next/navigation";
import { calculateMixAnalysis } from "@/lib/mix-analysis";
import { analyzeMix, type BowlType } from "@/lib/mix-analyzer";
import { fromPrismaFlavor } from "@/lib/mix-profile";
import { buildMixResultPresentation } from "@/lib/mix-result-presentation";
import { prisma } from "@/lib/prisma";
import RecommendationSection from "../recommendation-section";

export const dynamic = "force-dynamic";
const labels = { strength: "Крепость", sweetness: "Сладость", acidity: "Кислотность", freshness: "Свежесть", creaminess: "Сливочность", bitterness: "Горечь" } as const;

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

  return <main className="container section result-page">
    <Link className="muted" href="/builder">← Новый микс</Link>
    <section className="result-composition">
      <div className="eyebrow">Состав</div>
      <h1>{mix.title}</h1>
      <p className="lead result-components">{mix.components.map(component => `${component.flavor.brand.name} ${component.flavor.name} — ${component.percentage}%`).join(" · ")}</p>
    </section>

    <section className="card score-panel">
      <div><div className="eyebrow">{presentation.predictedScore.title}</div><p className="score-explanation">{presentation.predictedScore.description}</p></div>
      <div className="big-score" aria-label={`${presentation.predictedScore.title}: ${presentation.predictedScore.value} из 10`}>{presentation.predictedScore.value}<small>/10</small></div>
      <div className="smoke-score"><b>{presentation.verifiedSmoke.title}</b>{presentation.verifiedSmoke.value !== null && <strong>{presentation.verifiedSmoke.value}/10</strong>}<span className="muted">{presentation.verifiedSmoke.description}</span></div>
    </section>

    <section className="result-info-grid">
      <article className="card"><div className="eyebrow">Уверенность прогноза</div><h2>{presentation.confidence.label} · {presentation.confidence.score}%</h2><p>{presentation.confidence.summary}</p></article>
      <article className="card"><div className="eyebrow">Качество данных</div><h2>{presentation.dataQuality.value}%</h2><ul className="compact-list">{presentation.dataQuality.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></article>
    </section>

    <section className="card"><div className="eyebrow">Распознавание компонентов</div><h2>{presentation.resolution.summary}</h2><div className="resolution-list">{presentation.resolution.components.map((component, index) => <div className="resolution-item" key={`${component.name}-${index}`}><span><b>{component.name}</b><small>{component.percentage}% · {component.profileReliability}</small></span><span className="status-pill">{component.status}</span></div>)}</div></section>

    <section className="card"><div className="eyebrow">Из чего складывается оценка</div><div className="breakdown-grid">{presentation.breakdown.map(item => <article className="breakdown-item" key={item.key}><div><h3>{item.label}</h3><strong>{item.value}</strong></div><p>{item.explanation}</p></article>)}</div></section>

    <div className="result-main-grid">
      <div className="result-column">
        <section className="card"><div className="eyebrow">Предполагаемый профиль</div><h2>{presentation.profile.summary}</h2><h3>Доминирующие ноты</h3><div className="chips">{presentation.profile.dominantNotes.map(note => <span className="tag" key={note}>{note}</span>)}</div>{presentation.profile.backgroundNotes.length > 0 && <><h3>Фоновые ноты</h3><div className="chips">{presentation.profile.backgroundNotes.map(note => <span className="tag" key={note}>{note}</span>)}</div></>}</section>
        <section className="card"><h2>Баланс профиля</h2><div className="scales">{metrics.map(key => <div key={key}><div className="scale-label"><span>{labels[key]}</span><b>{analysis.mixProfile.profile[key]}/10</b></div><div className="scale-line"><div className="scale-fill" style={{ width: `${analysis.mixProfile.profile[key] * 10}%` }}/></div></div>)}</div></section>
        {presentation.strengths.length > 0 && <section className="card"><div className="eyebrow">Сильные стороны</div><ul>{presentation.strengths.map(item => <li key={item}>{item}</li>)}</ul></section>}
        <RecommendationSection actions={presentation.actions} status={presentation.recommendationStatus} suggestedVariant={presentation.suggestedVariant} componentNames={componentNames}/>
      </div>
      <aside className="result-column">
        {presentation.risks.length > 0 && <section className="card"><div className="eyebrow">Риски</div><div className="risk-list">{presentation.risks.map(risk => <article className="risk-item" key={risk.id}><div className="recommendation-title"><h3>{risk.title}</h3><span className={`priority priority-${risk.level.toLocaleLowerCase("ru-RU")}`}>{risk.level}</span></div><p><b>Причина:</b> {risk.reason}</p><p><b>Что делать:</b> {risk.recommendation}</p></article>)}</div></section>}
        <section className="card"><div className="eyebrow">Приготовление</div><p className="preparation-line">{mix.bowlType} · {mix.coalCount} угля · прогрев&nbsp;{mix.warmupMinutes}&nbsp;мин.</p>{presentation.preparationRecommendations.map(item => <p key={item}>→ {item}</p>)}</section>
      </aside>
    </div>
  </main>;
}
