import Link from "next/link";
import { notFound } from "next/navigation";
import { calculateMixAnalysis } from "@/lib/mix-analysis";
import { analyzeMix, type BowlType } from "@/lib/mix-analyzer";
import { fromPrismaFlavor } from "@/lib/mix-profile";
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
  const metrics = Object.keys(labels) as Array<keyof typeof labels>;
  const componentNames = Object.fromEntries(analysis.canonicalMix.components.map(component => [String(component.flavorId), `${component.brandName} ${component.flavorName}`]));
  const conflicts = [...new Set([...analysis.compatibility.conflicts.map(item => item.description), ...legacyAnalysis.conflicts])];
  return <main className="container section">
    <Link className="muted" href="/builder">← Новый микс</Link>
    <div className="result-head"><div><div className="eyebrow">Прогнозный анализ</div><h1>{mix.title}</h1><p className="lead">{mix.components.map(component => `${component.flavor.brand.name} ${component.flavor.name} — ${component.percentage}%`).join(" · ")}</p><p className="muted">Уверенность: <b>{analysis.scoring.predictionConfidence.finalConfidenceLabel}</b> · качество данных {analysis.scoring.dataQuality}%</p></div><div className="big-score">{analysis.scoring.predictedQualityScore}<small style={{ fontSize: 18 }}>/10</small></div></div>
    <div className="builder section"><div>
      <section className="card"><div className="eyebrow">Предполагаемый профиль</div><h2>{legacyAnalysis.description}</h2><h3>Доминирующий табак</h3><p>{analysis.mixProfile.dominantComponent.brandName} {analysis.mixProfile.dominantComponent.flavorName}</p><h3>Доминирующие ноты</h3><div className="chips">{analysis.mixProfile.dominantNotes.map(note => <span className="tag" key={note.noteSlug}>{note.noteName}</span>)}</div><h3>Фоновые ноты</h3><div className="chips">{analysis.mixProfile.backgroundNotes.map(note => <span className="tag" key={note.noteSlug}>{note.noteName}</span>)}</div></section>
      <section className="card" style={{ marginTop: 20 }}><h2>Баланс профиля</h2><div className="scales">{metrics.map(key => <div key={key}><div style={{ display: "flex", justifyContent: "space-between" }}><span>{labels[key]}</span><b>{analysis.mixProfile.profile[key]}/10</b></div><div className="scale-line"><div className="scale-fill" style={{ width: `${analysis.mixProfile.profile[key] * 10}%` }}/></div></div>)}</div></section>
      <div style={{ marginTop: 20 }}><RecommendationSection result={analysis.recommendations} componentNames={componentNames}/></div>
    </div><aside>
      <section className="card"><div className="eyebrow">Риск перегрева</div><h2 style={{ textTransform: "capitalize" }}>{legacyAnalysis.overheatingRisk}</h2><p className="muted">{mix.bowlType} · {mix.coalCount} угля · прогрев {mix.warmupMinutes} мин.</p></section>
      <section className="card" style={{ marginTop: 20 }}><h2>Возможные конфликты</h2>{conflicts.length ? <ul>{conflicts.map(item => <li key={item}>{item}</li>)}</ul> : <p className="ok">Явных конфликтов не обнаружено</p>}</section>
      <section className="card" style={{ marginTop: 20 }}><h2>Рекомендации по жару</h2>{legacyAnalysis.heatRecommendations.map(item => <p key={item}>→ {item}</p>)}</section>
    </aside></div>
  </main>;
}
