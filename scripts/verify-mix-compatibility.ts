import { PrismaClient } from "@prisma/client";
import { calculateMixCompatibility, resolveComponentIntensity } from "../src/lib/mix-compatibility";
import { calculateMixProfile,fromPrismaFlavor,type MixProfileComponentInput } from "../src/lib/mix-profile";

const prisma=new PrismaClient();
async function main(){
  const flavors=await prisma.flavor.findMany({where:{OR:[{brand:{name:"Overdose"},name:"Coffee"},{brand:{name:"HIT"},name:"Banana Shake"},{brand:{name:"Element"},name:"Мята"},{brand:{name:"Test Kitchen"},name:"Cola"},{brand:{name:"Sebero"},name:"Лимон"}]},include:{brand:true,notes:{include:{flavorNote:true}}}});
  const get=(brand:string,name:string)=>{const value=flavors.find(flavor=>flavor.brand.name===brand&&flavor.name===name);if(!value)throw new Error(`Не найден ${brand} ${name}`);return value};
  const mixes:MixProfileComponentInput[][]=[
    [fromPrismaFlavor(get("Overdose","Coffee"),40),fromPrismaFlavor(get("HIT","Banana Shake"),60)],
    [fromPrismaFlavor(get("Element","Мята"),20),fromPrismaFlavor(get("Test Kitchen","Cola"),40),fromPrismaFlavor(get("Sebero","Лимон"),40)]
  ];
  for(const components of mixes){const mixProfile=calculateMixProfile(components);const compatibility=calculateMixCompatibility({mixProfile,componentIntensities:components.map(component=>({flavorId:component.flavorId,intensity:resolveComponentIntensity(component.profile.intensity)}))});console.dir({mix:components.map(component=>`${component.brandName} ${component.flavorName} — ${component.percentage}%`),profile:mixProfile.profile,compatibilityScore:compatibility.compatibilityScore,noteCompatibility:compatibility.noteCompatibility.score,profileBalance:compatibility.profileBalance.score,intensityBalance:compatibility.intensityBalance.score,proportionBalance:compatibility.proportionBalance.score,positiveFactors:compatibility.positiveFactors,warnings:compatibility.warnings,conflicts:compatibility.conflicts,summaryTags:compatibility.summaryTags},{depth:null})}
}
main().finally(()=>prisma.$disconnect());
