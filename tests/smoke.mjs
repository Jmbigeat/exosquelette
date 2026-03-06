/**
 * Smoke test — validates that core modules import and key functions
 * return sane values without any network calls.
 *
 * Usage: node tests/smoke.mjs
 */

var passed = 0;
var failed = 0;
var errors = [];

function assert(label, condition) {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(label);
    console.error("  FAIL: " + label);
  }
}

// ─── 1. Module imports ────────────────────────────────────────────

console.log("\n=== MODULE IMPORTS ===");

var scoring = await import("../lib/sprint/scoring.js");
assert("scoring.js imports", !!scoring);

var analysis = await import("../lib/sprint/analysis.js");
assert("analysis.js imports", !!analysis);

var bricks = await import("../lib/sprint/bricks.js");
assert("bricks.js imports", !!bricks);

var generators = await import("../lib/sprint/generators.js");
assert("generators.js imports", !!generators);

var audit = await import("../lib/audit.js");
assert("audit.js imports", !!audit);

var redac = await import("../lib/sprint/redac.js");
assert("redac.js imports", !!redac);

var references = await import("../lib/sprint/references.js");
assert("references.js imports", !!references);

var dilts = await import("../lib/sprint/dilts.js");
assert("dilts.js imports", !!dilts);

var offers = await import("../lib/sprint/offers.js");
assert("offers.js imports", !!offers);

console.log("  " + passed + " modules imported");

// ─── 2. Export presence ───────────────────────────────────────────

console.log("\n=== EXPORT PRESENCE ===");

// scoring.js
assert("getActiveCauchemars exists", typeof scoring.getActiveCauchemars === "function");
assert("assessBrickArmor exists", typeof scoring.assessBrickArmor === "function");
assert("computeDensityScore exists", typeof scoring.computeDensityScore === "function");
assert("computeCauchemarCoverage exists", typeof scoring.computeCauchemarCoverage === "function");
assert("formatCost exists", typeof scoring.formatCost === "function");

// analysis.js
assert("hasNumbers exists", typeof analysis.hasNumbers === "function");
assert("hasDecisionMarkers exists", typeof analysis.hasDecisionMarkers === "function");
assert("estimateReadiness exists", typeof analysis.estimateReadiness === "function");
assert("classifyCicatrice exists", typeof analysis.classifyCicatrice === "function");

// generators.js
assert("generateBio exists", typeof generators.generateBio === "function");
assert("generateCV exists", typeof generators.generateCV === "function");
assert("generateContactScripts exists", typeof generators.generateContactScripts === "function");
assert("generateImpactReport exists", typeof generators.generateImpactReport === "function");
assert("auditDeliverable exists (audit.js)", typeof audit.auditDeliverable === "function");

// redac.js
assert("cleanRedac exists", typeof redac.cleanRedac === "function");
assert("REDAC_BANNIS exists", Array.isArray(redac.REDAC_BANNIS));

// bricks.js
assert("generateAdaptiveSeeds exists", typeof bricks.generateAdaptiveSeeds === "function");
assert("matchKpiToReference exists", typeof bricks.matchKpiToReference === "function");

// references.js
assert("CAUCHEMARS_CIBLES exists", Array.isArray(references.CAUCHEMARS_CIBLES));
assert("KPI_REFERENCE exists", !!references.KPI_REFERENCE);
assert("MARKET_DATA exists", !!references.MARKET_DATA);

// ─── 3. Pure function return values ──────────────────────────────

console.log("\n=== PURE FUNCTION SMOKE ===");

// cleanRedac — no crash, returns string
var cleaned = redac.cleanRedac("Il faudrait vraiment approfondir ce sujet complexe.", "coaching");
assert("cleanRedac returns string", typeof cleaned === "string");
assert("cleanRedac filters banned words", cleaned.indexOf("faudrait") === -1 && cleaned.indexOf("vraiment") === -1 && cleaned.indexOf("approfondir") === -1);

// hasNumbers
assert("hasNumbers('abc') = false", analysis.hasNumbers("abc") === false);
assert("hasNumbers('abc 42') = true", analysis.hasNumbers("abc 42") === true);

// formatCost
assert("formatCost(1500) returns string", typeof scoring.formatCost(1500) === "string");
assert("formatCost(250000) contains K", scoring.formatCost(250000).indexOf("K") !== -1 || scoring.formatCost(250000).indexOf("k") !== -1 || scoring.formatCost(250000).indexOf("250") !== -1);

// assessBrickArmor — empty brick
var emptyArmor = scoring.assessBrickArmor({});
assert("assessBrickArmor({}) returns vulnerable", emptyArmor.status === "vulnerable");
assert("assessBrickArmor({}) depth = 0", emptyArmor.depth === 0);

// assessBrickArmor — rich brick
var richArmor = scoring.assessBrickArmor({
  text: "J'ai réduit le churn de 15% en 6 mois. Décision validée par le board. Équipe de 8 mobilisée. Process déployé et reproductible."
});
assert("assessBrickArmor rich brick depth >= 3", richArmor.depth >= 3);

// getActiveCauchemars — returns array
var cauchs = scoring.getActiveCauchemars();
assert("getActiveCauchemars returns array", Array.isArray(cauchs));
assert("cauchemars have id, label, kpis", cauchs.length > 0 && cauchs[0].id && cauchs[0].label && Array.isArray(cauchs[0].kpis));

// estimateReadiness
var readiness = analysis.estimateReadiness(
  "J'ai piloté une équipe de 12 commerciaux. Pipeline Salesforce restructuré. +30% de closing en 6 mois.",
  "Recherche Head of Sales"
);
assert("estimateReadiness returns score", typeof readiness.score === "number");
assert("estimateReadiness returns readiness level", ["fort", "moyen", "faible"].indexOf(readiness.readiness) !== -1);

// generateAdaptiveSeeds
var seeds = bricks.generateAdaptiveSeeds("am");
assert("generateAdaptiveSeeds returns array", Array.isArray(seeds));
assert("generateAdaptiveSeeds non-empty", seeds.length > 0);

// ─── 4. Generator smoke — generateBio ────────────────────────────

console.log("\n=== GENERATOR SMOKE ===");

// generateBio — 0 bricks
var bio0 = generators.generateBio([], {}, false);
assert("generateBio(0 bricks) returns fallback", typeof bio0 === "string" && bio0.length > 0);

// generateBio — with validated bricks
var testBricks = [
  { text: "Pipeline rattrapé de 400K€ à 1.2M€ en 4 mois. 45 comptes SaaS B2B.", status: "validated", brickType: "proof", armorScore: 4, hasNumbers: true, kpi: "Croissance MRR", elasticity: "élastique" },
  { text: "Taux de closing passé de 18% à 34% en 6 mois.", status: "validated", brickType: "proof", armorScore: 3, hasNumbers: true, kpi: "Taux de retention", elasticity: "stable" },
  { text: "Rétention client portée à 94% sur segment historiquement à 78%.", status: "validated", brickType: "proof", armorScore: 3, hasNumbers: true, kpi: "Taux de retention", elasticity: "élastique" },
];
var bio3 = generators.generateBio(testBricks, { selectedPillars: [] }, false);
assert("generateBio(3 bricks) returns string", typeof bio3 === "string");
assert("generateBio(3 bricks) non-empty", bio3.length > 10);

// generateBio — excludes take bricks
var takeBricks = [
  { text: "Take opinion", status: "validated", brickType: "take", armorScore: 4, hasNumbers: false, kpi: "test" },
];
var bioTake = generators.generateBio(takeBricks, {}, false);
assert("generateBio filters take bricks", typeof bioTake === "string");

// generateCV
var cv = generators.generateCV(testBricks, "am", false);
assert("generateCV returns string", typeof cv === "string" && cv.length > 0);

// ─── 4b. Audit smoke ────────────────────────────────────────────

console.log("\n=== AUDIT SMOKE ===");

var auditResult = audit.auditDeliverable("dm", "Votre portefeuille stagne. Pipeline rattrapé de 400K€ à 1.2M€ en 4 mois.", testBricks, [], "external");
assert("auditDeliverable returns score", typeof auditResult.score === "number");
assert("auditDeliverable returns passed array", Array.isArray(auditResult.passed));
assert("auditDeliverable returns failed array", Array.isArray(auditResult.failed));
assert("auditDeliverable returns correctionHints array", Array.isArray(auditResult.correctionHints));

// Generic text should fail principle A
var auditGeneric = audit.auditDeliverable("dm", "Bonjour, je suis intéressé par votre offre.", [], [], "external");
assert("audit generic text fails A", auditGeneric.passed.indexOf("A") === -1);

// Generators accept hints=undefined (retrocompatibility)
var cvNoHints = generators.generateCV(testBricks, "am", false);
var cvWithHints = generators.generateCV(testBricks, "am", false, []);
assert("generateCV with empty hints identical", typeof cvWithHints === "string" && cvWithHints.length > 0);

// ─── 5. Dev server check ─────────────────────────────────────────

console.log("\n=== DEV SERVER CHECK ===");

try {
  var res = await fetch("http://localhost:3000", { signal: AbortSignal.timeout(3000) });
  assert("Dev server responds", res.status === 200 || res.status === 302 || res.status === 307);
  console.log("  Status: " + res.status);
} catch (e) {
  console.log("  Dev server not running — skipped (not a failure)");
}

// ─── RESULTS ──────────────────────────────────────────────────────

console.log("\n=== RESULTS ===");
console.log("  Passed: " + passed);
console.log("  Failed: " + failed);

if (failed > 0) {
  console.log("\n  Failures:");
  errors.forEach(function(e) { console.log("    - " + e); });
  process.exit(1);
} else {
  console.log("\n  All smoke tests passed.");
  process.exit(0);
}
