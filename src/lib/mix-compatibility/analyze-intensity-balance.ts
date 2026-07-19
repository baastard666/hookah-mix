import { BASE_SCORES } from "./constants";
import { applied,block,factor } from "./helpers";
import type { AnalysisBlock,AnalysisFactor,AppliedRule,MixCompatibilityInput,RuleType } from "./types";

export function analyzeIntensityBalance(input:MixCompatibilityInput):AnalysisBlock{
  const components=[input.mixProfile.dominantComponent,...input.mixProfile.secondaryComponents];const intensity=new Map(input.componentIntensities.map(item=>[String(item.flavorId),item.intensity]));const positives:AnalysisFactor[]=[],warnings:AnalysisFactor[]=[],rules:AppliedRule[]=[];let total=0;
  const add=(id:string,type:RuleType,impact:number,title:string,description:string,ids:Array<number|string>)=>{total+=impact;rules.push(applied(id,type,impact,description));(type==="positive"?positives:warnings).push(factor(id,"INTENSITY_BALANCE",title,description,impact,[],ids))};
  const dominant=components[0];
  if(dominant.influenceShare>=70)add("intensity.overdominant","caution",-.8,"Сильное доминирование","Один компонент может почти полностью перекрыть остальные",[dominant.flavorId]);
  if(components.length>=2&&Math.abs(components[0].influenceShare-components[1].influenceShare)<=5&&(intensity.get(String(components[0].flavorId))??0)>=8&&(intensity.get(String(components[1].flavorId))??0)>=8)add("intensity.bright-competition","caution",-.6,"Конкуренция ярких компонентов","Два очень ярких компонента могут конкурировать друг с другом",[components[0].flavorId,components[1].flavorId]);
  for(const component of components)if(component.percentage<=10&&(intensity.get(String(component.flavorId))??0)<=4&&component.influenceShare<=8)add(`intensity.lost.${component.flavorId}`,"caution",-.5,"Слабый компонент","Один из компонентов может практически потеряться в миксе",[component.flavorId]);
  const leading=input.mixProfile.dominantNotes.slice(0,3);if(leading.length>=3&&Math.max(...leading.map(n=>n.sharePercent))-Math.min(...leading.map(n=>n.sharePercent))<=7)add("intensity.note-competition","caution",-.5,"Конкуренция ведущих нот","Несколько ведущих нот могут бороться за внимание",[]);
  if(dominant.influenceShare>=40&&dominant.influenceShare<70&&components.slice(1).every(component=>component.influenceShare>=8))add("intensity.clear-foundation","positive",.4,"Различимая основа","Один компонент задаёт основу, а дополнительные компоненты должны оставаться различимыми",components.map(c=>c.flavorId));
  const shares=components.map(c=>c.influenceShare);if(shares.every((share,index)=>index===0||shares[index-1]>=share)&&Math.max(...shares)-Math.min(...shares)<=40)add("intensity.smooth-distribution","positive",.3,"Плавное распределение влияния","Влияние компонентов убывает без резкого провала",components.map(c=>c.flavorId));
  return block(BASE_SCORES.intensityBalance,total,positives,warnings,rules);
}
