import {
  FLAVOR_KNOWLEDGE_REGISTRY,
  calculateKnowledgeConfidenceForClaim,
  findNoteByAlias,
  getCategoryDefinition,
  getCategoryRelation,
  getNoteCategories,
  validateKnowledgeRegistry,
} from "../src/lib/flavor-knowledge";

const validation = validateKnowledgeRegistry(FLAVOR_KNOWLEDGE_REGISTRY);
if (!validation.success) {
  console.error("Flavor Knowledge registry validation failed", validation.errors);
  process.exitCode = 1;
} else {
  const lavender = findNoteByAlias("  LAVENDER  ");
  if (!lavender) {
    console.error("Lavender alias was not found");
    process.exitCode = 1;
  } else {
    console.log({
      registry: "valid",
      categories: ["FRUIT", "BERRY", "COFFEE", "BEVERAGE"].map(id => getCategoryDefinition(id as "FRUIT" | "BERRY" | "COFFEE" | "BEVERAGE")),
      relations: [
        getCategoryRelation("BERRY", "FLORAL"),
        getCategoryRelation("COFFEE", "CREAMY"),
        getCategoryRelation("COFFEE", "CITRUS"),
        getCategoryRelation("CANDY", "SMOKY"),
      ],
      lavender: { note: lavender, categories: getNoteCategories(lavender.noteId) },
      confidence: [
        "claim.note.lavender-category",
        "claim.relation.berry-floral",
        "claim.relation.coffee-creamy",
        "claim.relation.coffee-citrus",
      ].map(claimId => ({ claimId, ...calculateKnowledgeConfidenceForClaim(claimId) })),
    });
  }
}
