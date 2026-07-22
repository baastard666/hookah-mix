import { prisma } from "@/lib/prisma"; import { flavorInclude,mapFlavor } from "@/lib/flavor-mapper"; import Builder from "./builder";
import { parseBuilderInitialState } from "./builder-initial-state";
export const dynamic = "force-dynamic";
export default async function BuilderPage({searchParams}:{searchParams:Promise<{add?:string;components?:string;bowl?:string;coals?:string;warmup?:string}>}){const query=await searchParams;const raw=await prisma.flavor.findMany({include:flavorInclude,orderBy:{name:"asc"}});const initialState=parseBuilderInitialState(query,new Set(raw.map(flavor=>flavor.id)));return <Builder flavors={raw.map(mapFlavor)} initialId={Number(query.add)||undefined} initialState={initialState}/>}
