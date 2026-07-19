import { PrismaClient } from "@prisma/client";
import { calculateMixProfile, fromPrismaFlavor } from "../src/lib/mix-profile";

const prisma=new PrismaClient();
async function main(){
  const flavors=await prisma.flavor.findMany({where:{OR:[{brand:{name:"Overdose"},name:"Coffee"},{brand:{name:"HIT"},name:"Banana Shake"}]},include:{brand:true,notes:{include:{flavorNote:true}}}});
  const coffee=flavors.find(flavor=>flavor.brand.name==="Overdose"&&flavor.name==="Coffee");
  const banana=flavors.find(flavor=>flavor.brand.name==="HIT"&&flavor.name==="Banana Shake");
  if(!coffee||!banana)throw new Error("Не найдены Overdose Coffee и/или HIT Banana Shake");
  const result=calculateMixProfile([fromPrismaFlavor(coffee,40),fromPrismaFlavor(banana,60)]);
  console.dir({profile:result.profile,dominantComponent:result.dominantComponent,secondaryComponents:result.secondaryComponents,dominanceLevel:result.dominanceLevel,dominantNotes:result.dominantNotes,secondaryNotes:result.secondaryNotes,backgroundNotes:result.backgroundNotes},{depth:null});
}
main().finally(()=>prisma.$disconnect());
