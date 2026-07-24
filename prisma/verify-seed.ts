import { PrismaClient } from "@prisma/client";
import { FLAVOR_PROFILE_FIELDS } from "../src/lib/flavors/types";

const prisma=new PrismaClient();
const required=["Coffee","Banana Shake","Мята","Манго","Лимон","Ваниль","Сливки","Кокос","Dark Chocolate","Hazelnut","Strawberry","Raspberry","Blueberry","Lime","Cola","Cinnamon","Peach"];
async function main(){
 const flavors=await prisma.flavor.findMany({include:{notes:{include:{flavorNote:true}}}});
 const errors:string[]=[];
 for(const name of required)if(!flavors.some(f=>f.name===name))errors.push(`Отсутствует Flavor: ${name}`);
 for(const flavor of flavors){
  if(flavor.profileStatus!=="DRAFT"||flavor.profileSource!=="MANUAL")errors.push(`${flavor.name}: неверный статус или источник`);
  // Demo/seed Flavor rows are a curated, fully-populated dataset (unlike real evidence-backed data, see ADR-015) - null here means the seed drifted, not "not measured".
  for(const field of FLAVOR_PROFILE_FIELDS)if(flavor[field]===null||flavor[field]<0||flavor[field]>10)errors.push(`${flavor.name}: ${field} вне диапазона`);
  if(!flavor.notes.some(n=>n.noteType==="DOMINANT"))errors.push(`${flavor.name}: нет DOMINANT-ноты`);
  if(flavor.notes.some(n=>n.intensity<1||n.intensity>10))errors.push(`${flavor.name}: intensity ноты вне диапазона`);
  if(new Set(flavor.notes.map(n=>n.flavorNoteId)).size!==flavor.notes.length)errors.push(`${flavor.name}: повторяющиеся назначения нот`);
 }
 const notes=await prisma.flavorNote.findMany();
 if(new Set(notes.map(n=>n.slug)).size!==notes.length)errors.push("Повторяющиеся slug FlavorNote");
 if(errors.length)throw new Error(errors.join("\n"));
 console.log(`Seed verified: ${flavors.length} flavors, ${notes.length} unique notes`);
}
main().finally(()=>prisma.$disconnect());
