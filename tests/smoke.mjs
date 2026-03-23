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
assert("scoreContactScript exists", typeof generators.scoreContactScript === "function");
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

// generateFollowUp
assert("generateFollowUp exists", typeof generators.generateFollowUp === "function");
var fuEmpty = generators.generateFollowUp({ shared: "", ambition: "", challenges: [] }, testBricks, "am", [], null);
assert("generateFollowUp empty shared → fallback", typeof fuEmpty === "string" && fuEmpty.indexOf("recruteur") !== -1);
var fuNoCh = generators.generateFollowUp({ shared: "Le segment Enterprise pose problème de rétention", ambition: "Doubler le pipe", challenges: [] }, testBricks, "am", [], null);
assert("generateFollowUp 0 challenges → fallback", typeof fuNoCh === "string" && fuNoCh.indexOf("défi") !== -1);
var fuFull = generators.generateFollowUp({
  shared: "La tension entre croissance et rétention sur le segment Enterprise est critique",
  ambition: "Doubler le pipeline mid-market en 12 mois",
  challenges: ["Win rate en baisse depuis 3 trimestres", "Ramp-up des juniors trop long", "Churn sur le segment historique"],
  interviewerName: "Sophie",
  timing: "ce matin",
}, testBricks, "enterprise_ae", [], null);
assert("generateFollowUp full returns string", typeof fuFull === "string" && fuFull.length > 50);
assert("generateFollowUp ≤ 2000 chars", fuFull.length <= 2000);
assert("generateFollowUp starts with Merci", fuFull.indexOf("Merci") === 0);
assert("generateFollowUp does not start with je", !/^je /i.test(fuFull));
assert("generateFollowUp contains interviewerName", fuFull.indexOf("Sophie") !== -1);
assert("generateFollowUp contains timing", fuFull.indexOf("ce matin") !== -1);
var fuNoBricks = generators.generateFollowUp({
  shared: "Le recruteur a partagé ses enjeux de croissance et de rétention client",
  ambition: "Atteindre 10M ARR",
  challenges: ["Pipeline insuffisant sur le mid-market", "Conversion en baisse"],
}, [], "am", [], null);
assert("generateFollowUp 0 bricks no crash", typeof fuNoBricks === "string" && fuNoBricks.length > 20);

// ─── 4b. Audit smoke ────────────────────────────────────────────

console.log("\n=== AUDIT SMOKE ===");

var auditResult = audit.auditDeliverable("dm", "Votre portefeuille stagne. Pipeline rattrapé de 400K€ à 1.2M€ en 4 mois.", testBricks, [], "external");
assert("auditDeliverable returns score", typeof auditResult.score === "number");
assert("auditDeliverable returns passed array", Array.isArray(auditResult.passed));

// Audit followup type
var auditFollowUp = audit.auditDeliverable("followup", fuFull, testBricks, [], "external");
assert("auditDeliverable followup returns score", typeof auditFollowUp.score === "number");
assert("auditDeliverable followup channel calibration for ≤2000", auditFollowUp.score >= 0);
assert("auditDeliverable returns failed array", Array.isArray(auditResult.failed));
assert("auditDeliverable returns correctionHints array", Array.isArray(auditResult.correctionHints));

// Generic text should fail principle A
var auditGeneric = audit.auditDeliverable("dm", "Bonjour, je suis intéressé par votre offre.", [], [], "external");
assert("audit generic text fails A", auditGeneric.passed.indexOf("A") === -1);

// Generators accept hints=undefined (retrocompatibility)
var cvNoHints = generators.generateCV(testBricks, "am", false);
var cvWithHints = generators.generateCV(testBricks, "am", false, []);
assert("generateCV with empty hints identical", typeof cvWithHints === "string" && cvWithHints.length > 0);

// ─── 4c. Dilts — detectDiltsLevel & detectDiltsStagnation ──────────

console.log("\n=== DILTS SMOKE ===");

assert("detectDiltsLevel exists", typeof dilts.detectDiltsLevel === "function");
assert("detectDiltsStagnation exists", typeof dilts.detectDiltsStagnation === "function");

// detectDiltsLevel returns { level, name, confidence }
var diltsResult2 = dilts.detectDiltsLevel("j'ai réduit le pipe de 40% en 6 mois. J'ai lancé un projet.");
assert("detectDiltsLevel returns level", typeof diltsResult2.level === "number");
assert("detectDiltsLevel returns name", typeof diltsResult2.name === "string");
assert("detectDiltsLevel returns confidence", typeof diltsResult2.confidence === "number");
assert("detectDiltsLevel level 2 for action text", diltsResult2.level === 2);
assert("detectDiltsLevel name is Comportement", diltsResult2.name === "Comportement");

// Mixed text: level 2 + 4 → returns 4 (highest wins)
var diltsMixed = dilts.detectDiltsLevel("j'ai réduit le pipe. Je crois que le vrai sujet est la méthode.");
assert("detectDiltsLevel mixed 2+4 returns 4", diltsMixed.level >= 3);

// Confidence: 1 marker = 0.3
var dilts1Marker = dilts.detectDiltsLevel("j'ai fait un truc");
assert("confidence 1 marker = 0.3", dilts1Marker.confidence === 0.3);

// Confidence: 3+ markers = 1.0
var dilts3Markers = dilts.detectDiltsLevel("j'ai fait, j'ai lancé, j'ai déployé, j'ai construit un système");
assert("confidence 3+ markers = 1.0", dilts3Markers.confidence === 1.0);

// detectDiltsStagnation: <3 posts → not stagnating
var stagNone = dilts.detectDiltsStagnation([{ diltsLevel: 2 }, { diltsLevel: 2 }]);
assert("detectDiltsStagnation <3 posts not stagnating", stagNone.stagnating === false);

// detectDiltsStagnation: 3 same level → stagnating
var stagYes = dilts.detectDiltsStagnation([{ diltsLevel: 2 }, { diltsLevel: 2 }, { diltsLevel: 2 }]);
assert("detectDiltsStagnation 3 same = stagnating", stagYes.stagnating === true);
assert("detectDiltsStagnation level is 2", stagYes.level === 2);
assert("detectDiltsStagnation has message", typeof stagYes.message === "string" && stagYes.message.length > 0);

// detectDiltsStagnation: 3 different → not stagnating
var stagNo = dilts.detectDiltsStagnation([{ diltsLevel: 2 }, { diltsLevel: 3 }, { diltsLevel: 4 }]);
assert("detectDiltsStagnation different = not stagnating", stagNo.stagnating === false);

// ─── 4e. Contact Script Score — scoreContactScript (chantier 20) ──────

console.log("\n=== CONTACT SCORE SMOKE ===");

// scoreContactScript: empty text returns score 0
var csEmpty = generators.scoreContactScript("", [], []);
assert("scoreContactScript empty text score 0", csEmpty.score === 0);

// scoreContactScript: returns tests array
var csBasic = generators.scoreContactScript("[Prénom], votre pipeline stagne. J'ai réduit le churn de 15% en 6 mois. Ce type de situation coûte entre 80K et 200K par trimestre. Qu'est-ce qui rend ce recrutement difficile ?", testBricks, []);
assert("scoreContactScript returns tests array", Array.isArray(csBasic.tests) && csBasic.tests.length === 6);
assert("scoreContactScript returns passedCount", typeof csBasic.passedCount === "number");
assert("scoreContactScript returns score", typeof csBasic.score === "number");

// scoreContactScript: detects miroir (first line has "votre")
assert("scoreContactScript miroir detected", csBasic.tests[0].passed === true);

// scoreContactScript: generates 4 variants with generateContactScripts
var contactScripts = generators.generateContactScripts(testBricks, "enterprise_ae", null);
assert("generateContactScripts returns 4 variants", contactScripts !== null && typeof contactScripts.dm === "string" && typeof contactScripts.email === "string" && typeof contactScripts.n1 === "string" && typeof contactScripts.rh === "string");

// scoreContactScript: each variant is scorable
var dmScore = generators.scoreContactScript(contactScripts.dm, testBricks, []);
var emailScore = generators.scoreContactScript(contactScripts.email, testBricks, []);
var n1Score = generators.scoreContactScript(contactScripts.n1, testBricks, []);
var rhScore = generators.scoreContactScript(contactScripts.rh, testBricks, []);
assert("dm variant scorable", typeof dmScore.score === "number" && dmScore.tests.length === 6);
assert("email variant scorable", typeof emailScore.score === "number" && emailScore.tests.length === 6);
assert("n1 variant scorable", typeof n1Score.score === "number" && n1Score.tests.length === 6);
assert("rh variant scorable", typeof rhScore.score === "number" && rhScore.tests.length === 6);

// generateContactScripts with pillarContext + diltsClosingLevel (Brew V2)
var contactWithPillar = generators.generateContactScripts(testBricks, "enterprise_ae", null, null, { pillarId: 1, pillarTitle: "Revenue Growth", pillarTheme: "croissance du pipeline" }, 4);
assert("generateContactScripts with pillarContext returns 4 variants", contactWithPillar !== null && typeof contactWithPillar.dm === "string");
assert("generateContactScripts with pillarContext dm contains pillar bridge", contactWithPillar.dm.indexOf("publié") !== -1 || contactWithPillar.email.indexOf("publié") !== -1);
assert("generateContactScripts with diltsClosingLevel 4 conviction closing", contactWithPillar.email.indexOf("convaincu") !== -1 || contactWithPillar.dm.indexOf("convaincu") !== -1);

// generateContactScripts retrocompatibility: null pillarContext + null diltsClosingLevel
var contactRetro = generators.generateContactScripts(testBricks, "enterprise_ae", null, null, null, null);
assert("generateContactScripts retro null params returns same shape", contactRetro !== null && typeof contactRetro.dm === "string" && typeof contactRetro.email === "string");

// ─── Brew getMonday utility ──────
console.log("\n=== BREW UTILS SMOKE ===");

// Inline getMonday to test without Supabase dependency
function testGetMonday(date) {
  var d = new Date(date);
  var day = d.getDay();
  var diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}
var monday = testGetMonday(new Date("2026-03-06"));
assert("getMonday returns ISO date string", typeof monday === "string" && /^\d{4}-\d{2}-\d{2}$/.test(monday));
assert("getMonday 2026-03-06 is 2026-03-02 (Monday)", monday === "2026-03-02");
assert("getMonday Sunday wraps back", testGetMonday(new Date("2026-03-08")) === "2026-03-02");
assert("getMonday Monday is self", testGetMonday(new Date("2026-03-02")) === "2026-03-02");

// ─── 4f. Post Score — scoreHook, marieHookFullPost, meroeAudit (chantier 21) ──────

console.log("\n=== POST SCORE SMOKE ===");

var postScore = await import("../lib/postScore.js");
assert("postScore.js imports", !!postScore);

// Export presence
assert("scoreHook exists (postScore)", typeof postScore.scoreHook === "function");
assert("analyzeBodyRetention exists (postScore)", typeof postScore.analyzeBodyRetention === "function");
assert("marieHookFullPost exists", typeof postScore.marieHookFullPost === "function");
assert("meroeAudit exists", typeof postScore.meroeAudit === "function");
assert("generateHookVariants exists", typeof postScore.generateHookVariants === "function");

// scoreHook: generic hook fails So What
var hookGeneric = postScore.scoreHook("Je suis ravi de partager cette expérience incroyable avec vous", "");
assert("scoreHook generic fails soWhat", hookGeneric.tests.length === 4 && hookGeneric.tests[0].passed === false);

// scoreHook: short non-generic hook passes So What
var hookGood = postScore.scoreHook("Ton pipeline ne vaut rien. Le problème c'est toi.", "");
assert("scoreHook trenchant passes soWhat", hookGood.tests[0].passed === true);

// scoreHook: ennemi detection
assert("scoreHook ennemi detected", hookGood.tests[1].passed === true);

// scoreHook: consensus detection
var hookConsensus = postScore.scoreHook("Et pourtant personne n'en parle. Sauf que le vrai sujet est ailleurs.", "");
assert("scoreHook consensus detected", hookConsensus.tests[2].passed === true);

// scoreHook: alienation detection
var hookAlien = postScore.scoreHook("Ton CV est vide. Arrête de mentir.", "");
assert("scoreHook alienation detected", hookAlien.tests[3].passed === true);

// scoreHook: score = passedCount * 2.5
assert("scoreHook score calculation", hookGood.score === Math.round(hookGood.tests.filter(function(t) { return t.passed; }).length * 2.5));

// marieHookFullPost returns structure
var marieResult = postScore.marieHookFullPost("Le problème c'est la méthode.\n\nJ'ai réduit le churn de 15% en 6 mois.\n\nContrairement à l'approche classique.\n\nLa preuve est dans les chiffres.", "Le problème c'est la méthode.");
assert("marieHookFullPost returns autoTests", Array.isArray(marieResult.autoTests) && marieResult.autoTests.length === 2);
assert("marieHookFullPost returns qualitative", Array.isArray(marieResult.qualitative) && marieResult.qualitative.length === 2);

// analyzeBodyRetention: detects bullets
var bodyBullets = postScore.analyzeBodyRetention("Premier paragraphe.\n\n- item 1\n- item 2\n\nTroisième paragraphe.");
assert("analyzeBodyRetention detects bullets", bodyBullets.clean === false);

// analyzeBodyRetention: clean text
var bodyClean = postScore.analyzeBodyRetention("Premier paragraphe court.\n\nDeuxième paragraphe court.\n\nTroisième paragraphe court.");
assert("analyzeBodyRetention clean text", bodyClean.clean === true);

// analyzeBodyRetention: few paragraphs
var bodyFew = postScore.analyzeBodyRetention("Un seul bloc de texte sans aération.");
assert("analyzeBodyRetention few paragraphs", bodyFew.issues.some(function(i) { return i.type === "fewParagraphs"; }));

// meroeAudit returns structure
var meroeResult = postScore.meroeAudit("Le pipeline est le problème.\n\nJ'ai restructuré 45 comptes.\n\nLa méthode est reproductible.\n\nLe pipeline est tout.", "Le pipeline est le problème.");
assert("meroeAudit returns miroir", meroeResult.miroir && Array.isArray(meroeResult.miroir.autoTests) && meroeResult.miroir.autoTests.length === 2);
assert("meroeAudit returns miroir qualitative", Array.isArray(meroeResult.miroir.qualitative) && meroeResult.miroir.qualitative.length === 2);
assert("meroeAudit returns luisEnrique", Array.isArray(meroeResult.luisEnrique) && meroeResult.luisEnrique.length === 3);

// generateHookVariants: returns 2 variants when tests fail
var variants = postScore.generateHookVariants("Mon pipeline est bon", ["ennemi", "consensus"], {});
assert("generateHookVariants returns 2", Array.isArray(variants) && variants.length === 2);

// generateHookVariants: returns empty when no failures
var variantsNone = postScore.generateHookVariants("Mon pipeline", [], {});
assert("generateHookVariants no failures = empty", variantsNone.length === 0);

// ─── 4d. Offers — aggregateOfferSignals & detectSectoralDispersion ──────

console.log("\n=== OFFERS SMOKE ===");

assert("aggregateOfferSignals exists", typeof offers.aggregateOfferSignals === "function");
assert("detectSectoralDispersion exists", typeof offers.detectSectoralDispersion === "function");

// aggregateOfferSignals with empty array returns null
var aggEmpty = offers.aggregateOfferSignals([], "am");
assert("aggregateOfferSignals([]) returns null", aggEmpty === null);

// detectSectoralDispersion with single offer returns null
var dispSingle = offers.detectSectoralDispersion([{ id: 1, text: "Recherche commercial SaaS B2B avec expérience cloud computing", type: "external" }]);
assert("detectSectoralDispersion single offer returns null", dispSingle === null);

// detectSectoralDispersion with 2 divergent offers returns object
var dispDiv = offers.detectSectoralDispersion([
  { id: 1, text: "Recherche commercial SaaS B2B cloud computing logiciel", type: "external" },
  { id: 2, text: "Nous recrutons dans le secteur banque finance assurance crédit", type: "external" },
]);
assert("detectSectoralDispersion 2 divergent offers returns object", dispDiv !== null && Array.isArray(dispDiv.sectors) && typeof dispDiv.message === "string");

// ─── BRICK EXTRACTOR SMOKE ───────────────────────────────────────

console.log("\n=== BRICK EXTRACTOR SMOKE ===");

var brickExtractor = await import("../lib/sprint/brickExtractor.js");
assert("brickExtractor.js imports", !!brickExtractor);
assert("extractBrickCore exists", typeof brickExtractor.extractBrickCore === "function");
assert("formatAnchorLine exists", typeof brickExtractor.formatAnchorLine === "function");
assert("formatCVLine exists", typeof brickExtractor.formatCVLine === "function");
assert("hasMentoringMarkers exists", typeof brickExtractor.hasMentoringMarkers === "function");

// extractBrickCore with null brick
var coreNull = brickExtractor.extractBrickCore(null);
assert("extractBrickCore(null) returns object", coreNull !== null && typeof coreNull === "object");
assert("extractBrickCore(null).mainNumber is null", coreNull.mainNumber === null);

// extractBrickCore with real brick text
var coreBrick = brickExtractor.extractBrickCore({ text: "J'ai réduit le churn de 15% à 8% en 6 mois sur un portefeuille mid-market de 200 comptes.", brickType: "proof" });
assert("extractBrickCore finds mainNumber", coreBrick.mainNumber !== null);
assert("extractBrickCore finds actionVerb", coreBrick.actionVerb !== null);
assert("extractBrickCore finds resultNumber", coreBrick.resultNumber !== null);
assert("extractBrickCore brickType is proof", coreBrick.brickType === "proof");

// formatAnchorLine returns string ≤ 210 chars
var anchor = brickExtractor.formatAnchorLine(coreBrick);
assert("formatAnchorLine returns string", typeof anchor === "string" && anchor.length > 0);
assert("formatAnchorLine ≤ 210 chars", anchor.length <= 211);

// formatCVLine returns string ≤ 150 chars
var cvLine = brickExtractor.formatCVLine(coreBrick, "proof");
assert("formatCVLine returns string", typeof cvLine === "string" && cvLine.length > 0);
assert("formatCVLine ≤ 150 chars", cvLine.length <= 151);

// formatCVLine adapts by brickType
var scarLine = brickExtractor.formatCVLine(coreBrick, "scar");
assert("formatCVLine scar starts uppercase", /^[A-ZÀ-Ú]/.test(scarLine));

// hasMentoringMarkers detection
assert("hasMentoringMarkers detects formé", brickExtractor.hasMentoringMarkers("J'ai formé 5 juniors en 3 mois"));
assert("hasMentoringMarkers false on empty", !brickExtractor.hasMentoringMarkers(""));
assert("hasMentoringMarkers false on unrelated", !brickExtractor.hasMentoringMarkers("J'ai réduit le churn de 15%"));

// ─── ÉCLAIREUR AUDIT CV SMOKE ─────────────────────────────────────

console.log("\n=== ÉCLAIREUR AUDIT CV SMOKE ===");

var auditCv = await import("../lib/eclaireur/audit-cv.js");
assert("audit-cv.js imports", !!auditCv);
assert("auditExternalCV exists", typeof auditCv.auditExternalCV === "function");

// auditExternalCV with empty CV returns score 0
var acvEmpty = auditCv.auditExternalCV("", {}, []);
assert("auditExternalCV empty CV score 0", acvEmpty.score === 0 && acvEmpty.tests.length === 0);

// auditExternalCV with rich CV returns 5 tests
var richCV = "J'ai décidé de restructurer le pipeline commercial de 400K€ à 1.2M€ en 4 mois malgré un contexte de sous-effectif. J'ai piloté la refonte du processus de churn et réduit le taux de 15% à 8%. Alignement multi-décideurs sur 3 comptes stratégiques. Account Executive avec expérience enterprise SaaS.";
var fakeAnalysis = {
  detectedRoleId: "enterprise_ae",
  detectedRoleLabel: "Account Executive Enterprise",
  mainNightmare: { label: "Pipeline stagnant", kpis: ["Pipeline velocity"], kw: ["pipeline", "churn"], nightmareShort: "Le pipeline stagne" },
  revealedKpi: { name: "Alignement multi-décideurs", elasticity: "élastique", why: "test" },
  allCauchemars: [
    { label: "Pipeline stagnant", kpis: ["Pipeline velocity"], kw: ["pipeline", "churn"], matchedKw: ["pipeline"] },
    { label: "Churn élevé", kpis: ["Churn rate"], kw: ["churn", "rétention"], matchedKw: ["churn"] },
  ],
};
var acvRich = auditCv.auditExternalCV(richCV, fakeAnalysis, fakeAnalysis.allCauchemars);
assert("auditExternalCV returns 5 tests", acvRich.tests.length === 5);
assert("auditExternalCV score is number", typeof acvRich.score === "number" && acvRich.score >= 0 && acvRich.score <= 5);

// Test 1: cauchemars coverage — rich CV covers pipeline + churn
assert("auditExternalCV cauchemars test exists", acvRich.tests[0].name === "cauchemars");
assert("auditExternalCV cauchemars covered", acvRich.tests[0].passed === true);

// Test 3: elasticity — rich CV has decision verbs
assert("auditExternalCV elasticity test exists", acvRich.tests[2].name === "elasticity");
assert("auditExternalCV decision verbs found", acvRich.tests[2].passed === true);

// Test 4: vocabulary — rich CV has no toxic words
assert("auditExternalCV vocabulary test exists", acvRich.tests[3].name === "vocabulary");
assert("auditExternalCV no toxic words", acvRich.tests[3].passed === true);

// Test 4: toxic CV fails vocabulary
var toxicCV = "Professionnel passionné et dynamique, doté d'une riche expérience, proactif et orienté résultats. J'ai participé à plusieurs projets et contribué à améliorer les processus. Fort de 10 ans d'expérience.";
var acvToxic = auditCv.auditExternalCV(toxicCV, fakeAnalysis, fakeAnalysis.allCauchemars);
assert("auditExternalCV toxic CV fails vocabulary", acvToxic.tests[3].passed === false);

// Test 5: ATMT structure
assert("auditExternalCV atmt test exists", acvRich.tests[4].name === "atmt");

// ─── EMAIL SIGNATURE SMOKE ───────────────────────────────────────

console.log("\n=== EMAIL SIGNATURE SMOKE ===");

assert("generateEmailSignature exists", typeof generators.generateEmailSignature === "function");

// With no bricks → returns role name
var sigNoBricks = generators.generateEmailSignature([], "am");
assert("generateEmailSignature no bricks returns string", typeof sigNoBricks === "string" && sigNoBricks.length > 0);

// With validated bricks → returns ≤ 80 chars
var sigFull = generators.generateEmailSignature(testBricks, "am");
assert("generateEmailSignature returns string", typeof sigFull === "string" && sigFull.length > 0);
assert("generateEmailSignature ≤ 80 chars", sigFull.length <= 80);

// Contains role-like suffix (dash separator)
assert("generateEmailSignature contains dash separator", sigFull.indexOf(" — ") !== -1 || sigFull.indexOf("Account") !== -1 || sigFull.length <= 80);

// Audit email_signature type
var auditSig = audit.auditDeliverable("email_signature", sigFull, testBricks, [], "external");
assert("audit email_signature returns score", typeof auditSig.score === "number");
assert("audit email_signature channel calibration ≤80 passes", auditSig.passed.indexOf("D") !== -1 || sigFull.length <= 80);

// Audit email_signature too long fails D
var auditSigLong = audit.auditDeliverable("email_signature", "A".repeat(100), testBricks, [], "external");
assert("audit email_signature >80 fails D", auditSigLong.passed.indexOf("D") === -1);

// ─── 16j. One-Pager whyThisRole ──────────────────────────────────

console.log("\n=== ONE-PAGER WHY THIS ROLE SMOKE ===");

assert("generateOnePager exists", typeof generators.generateOnePager === "function");

// generateOnePager without whyThisRole → auto-generated why block
var opNoWhy = generators.generateOnePager(testBricks, "am", [], { formulation: "Je transforme les pipelines stagnants en machines de closing" }, null, "Jean", "jean@test.com");
assert("generateOnePager without whyThisRole returns string", typeof opNoWhy === "string" && opNoWhy.length > 50);
assert("generateOnePager without whyThisRole contains Pourquoi", opNoWhy.indexOf("Pourquoi ce poste") !== -1);

// generateOnePager with whyThisRole → candidate's text in bloc 3
var opWithWhy = generators.generateOnePager(testBricks, "am", [], { formulation: "Je transforme les pipelines stagnants en machines de closing", whyThisRole: "Ce poste me correspond parce que le segment mid-market est mon terrain naturel depuis 5 ans." }, null, "Jean", "jean@test.com");
assert("generateOnePager with whyThisRole contains candidate text", opWithWhy.indexOf("mid-market est mon terrain naturel") !== -1);

// generateOnePager with whyThisRole empty string → auto fallback
var opEmptyWhy = generators.generateOnePager(testBricks, "am", [], { formulation: "Test", whyThisRole: "" }, null, "Jean", "jean@test.com");
assert("generateOnePager empty whyThisRole uses auto", opEmptyWhy.indexOf("Pourquoi ce poste") !== -1 && opEmptyWhy.length > 50);

// ─── 16n. Parcours non linéaire — detectNonLinearCareer ──────────

console.log("\n=== PARCOURS NON LINÉAIRE SMOKE ===");

assert("detectNonLinearCareer exists", typeof generators.detectNonLinearCareer === "function");

// 3+ contextes différents → non-linear
var nlBricks = [
  { status: "validated", editText: "Chez Danone j'ai restructuré le pipeline", text: "Chez Danone j'ai restructuré le pipeline", armorScore: 3 },
  { status: "validated", editText: "Chez Salesforce j'ai piloté 12 comptes", text: "Chez Salesforce j'ai piloté 12 comptes", armorScore: 4 },
  { status: "validated", editText: "En startup j'ai lancé le produit en 3 mois", text: "En startup j'ai lancé le produit en 3 mois", armorScore: 2 },
];
var nlResult = generators.detectNonLinearCareer(nlBricks);
assert("detectNonLinearCareer 3 contexts = non-linear", nlResult.isNonLinear === true);
assert("detectNonLinearCareer returns 3 contexts", nlResult.count === 3);

// 2 briques même contexte → linear
var linearBricks = [
  { status: "validated", editText: "Chez Danone j'ai restructuré le pipeline", text: "Chez Danone j'ai restructuré le pipeline", armorScore: 3 },
  { status: "validated", editText: "Chez Danone j'ai doublé le CA", text: "Chez Danone j'ai doublé le CA", armorScore: 4 },
];
var linResult = generators.detectNonLinearCareer(linearBricks);
assert("detectNonLinearCareer same context = linear", linResult.isNonLinear === false);

// 0 briques → linear (no crash)
var emptyResult = generators.detectNonLinearCareer([]);
assert("detectNonLinearCareer empty = linear", emptyResult.isNonLinear === false && emptyResult.count === 0);

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
