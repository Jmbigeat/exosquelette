import { CAUCHEMARS_CIBLES, EFFORT_WEIGHTS } from "./references.js";

/* Global active cauchemars — set by Sprint component, used by all utility functions */
var _activeCauchemars = null;
export function getActiveCauchemars() { return _activeCauchemars || CAUCHEMARS_CIBLES; }
export function setActiveCauchemarsGlobal(c) { _activeCauchemars = c; }

/**
 * assessBrickArmor — V2 Blindage 4 cases
 * Checks brick text + stress test results for armor status.
 * hasTransferability also reads brick.stressTestAngle3Validated (chantier 4).
 * @param {object} brick
 * @returns {{ status: string, depth: number, missing: string[], hasNumbers: boolean, hasDecisionMarkers: boolean, hasInfluenceMarkers: boolean, hasTransferability: boolean }}
 */
export function assessBrickArmor(brick) {
  if (!brick || !brick.text) return { status: "vulnerable", depth: 0, missing: ["chiffres", "décision", "influence", "transférabilité"] };
  var text = (brick.text || "").toLowerCase();
  // Also include stress test responses in analysis
  var stResponses = "";
  if (brick.stressTest) {
    ["angle1", "angle2", "angle3", "angle4", "angle5"].forEach(function(a) {
      var st = brick.stressTest[a];
      if (st && st.response) {
        Object.keys(st.response).forEach(function(k) { if (st.response[k]) stResponses += " " + st.response[k]; });
      }
    });
  }
  var fullText = text + stResponses.toLowerCase();
  var hasNumbers = /\d/.test(fullText);
  var hasDecisionMarkers = ["décision", "decision", "arbitrage", "choix", "priorisé", "priorise", "tranché", "tranche", "recommandé", "recommande", "imposé", "impose", "validé", "valide", "convaincu", "négocié", "negocie"].some(function(m) { return fullText.indexOf(m) !== -1; });
  var hasInfluenceMarkers = ["équipe", "equipe", "collaborat", "mobilisé", "mobilise", "fédéré", "federe", "embarqué", "embarque", "aligné", "aligne", "convaincu", "présenté", "presente", "pitch", "sponsor", "stakeholder", "direction", "comité", "comite", "board"].some(function(m) { return fullText.indexOf(m) !== -1; });
  var hasTransferability = brick.stressTestAngle3Validated || ["process", "méthode", "methode", "framework", "système", "systeme", "outil", "template", "playbook", "reproductible", "scalable", "structuré", "structure", "automatisé", "automatise", "industrialisé", "industrialise", "déployé", "deploye"].some(function(m) { return fullText.indexOf(m) !== -1; });
  var depth = (hasNumbers ? 1 : 0) + (hasDecisionMarkers ? 1 : 0) + (hasInfluenceMarkers ? 1 : 0) + (hasTransferability ? 1 : 0);
  var missing = [];
  if (!hasNumbers) missing.push("chiffres");
  if (!hasDecisionMarkers) missing.push("décision");
  if (!hasInfluenceMarkers) missing.push("influence");
  if (!hasTransferability) missing.push("transférabilité");
  var status = depth >= 4 ? "armored" : depth >= 3 ? "credible" : "vulnerable";
  return { status: status, depth: depth, missing: missing, hasNumbers: hasNumbers, hasDecisionMarkers: hasDecisionMarkers, hasInfluenceMarkers: hasInfluenceMarkers, hasTransferability: hasTransferability };
}

/* ─── V2 Axe helpers ─── */

// Axe 1 — Matériau brut (15%) : interpolation par paliers
function axeMateriauBrut(validated) {
  var n = validated.length;
  if (n <= 0) return 0;
  if (n >= 10) return 100;
  if (n >= 8) return 80 + (n - 8) * 10; // 8→80, 9→90, 10→100
  if (n >= 5) return 50 + (n - 5) * 10; // 5→50, 6→60, 7→70
  return n * 10; // 1→10, 2→20, 3→30, 4→40
}

// Axe 2 — Blindage (25%) : ratio armored/total
function axeBlindage(validated) {
  if (validated.length === 0) return { pct: 0, armoredCount: 0, credibleCount: 0, vulnerableCount: 0, armors: [] };
  var armoredCount = 0;
  var credibleCount = 0;
  var vulnerableCount = 0;
  var armors = [];
  validated.forEach(function(b) {
    var armor = assessBrickArmor(b);
    armors.push({ id: b.id, armor: armor });
    if (armor.status === "armored") armoredCount++;
    else if (armor.status === "credible") credibleCount++;
    else vulnerableCount++;
  });
  var pct = validated.length > 0 ? Math.round((armoredCount / validated.length) * 100) : 0;
  return { pct: pct, armoredCount: armoredCount, credibleCount: credibleCount, vulnerableCount: vulnerableCount, armors: armors };
}

// Axe 3 — Couverture cauchemars (20%) : covered/total + diversity bonus
function axeCouvertureCauchemars(validated, nightmares) {
  if (!nightmares || nightmares.length === 0) return { pct: 0, coveredCount: 0, totalCount: 0, diversityBonus: false };
  var coveredKpis = {};
  validated.forEach(function(b) { if (b.kpi) coveredKpis[b.kpi] = true; });
  var coveredCount = 0;
  nightmares.forEach(function(c) {
    if (c.kpis && c.kpis.some(function(k) { return coveredKpis[k]; })) coveredCount++;
  });
  // Diversity bonus: if 2+ brick types cover nightmares, cap at 120%
  var coveringTypes = {};
  validated.forEach(function(b) {
    if (b.kpi && coveredKpis[b.kpi] && b.brickType) coveringTypes[b.brickType] = true;
  });
  var diversityBonus = Object.keys(coveringTypes).length >= 2;
  var totalCount = nightmares.length;
  var rawPct = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0;
  if (diversityBonus) rawPct = Math.min(120, Math.round(rawPct * 1.2));
  return { pct: Math.min(120, rawPct), coveredCount: coveredCount, totalCount: totalCount, diversityBonus: diversityBonus };
}

// Axe 4 — Singularité (15%) : cicatrices(30%) + elastic armored(25%) + pillars(25%) + unfair advantage(20%)
function axeSingularite(validated, pillars) {
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  var cicatricePct = cicatrices.length > 0 ? Math.min(100, cicatrices.length * 50) : 0; // 1→50, 2→100

  var elasticArmored = validated.filter(function(b) {
    return b.kpiRefMatch && b.kpiRefMatch.elasticity === "élastique" && assessBrickArmor(b).status === "armored";
  });
  var elasticPct = elasticArmored.length > 0 ? Math.min(100, elasticArmored.length * 50) : 0;

  var selectedPillars = (pillars && pillars.selectedPillars) ? pillars.selectedPillars : [];
  var pillarPct = selectedPillars.length > 0 ? Math.min(100, selectedPillars.length * 25) : 0; // 4→100

  var unfairAdvantage = validated.filter(function(b) { return b.brickType === "unfair_advantage"; });
  var unfairPct = unfairAdvantage.length > 0 ? 100 : 0; // placeholder binary

  var total = Math.round(cicatricePct * 0.30 + elasticPct * 0.25 + pillarPct * 0.25 + unfairPct * 0.20);
  return { pct: total, cicatrices: cicatrices.length, elasticArmored: elasticArmored.length, pillars: selectedPillars.length, unfairAdvantage: unfairAdvantage.length };
}

// Axe 5 — Duel (10%) : palier 0→0%, 1→30%, 2→50%, 3+→100%
function axeDuel(duelResults) {
  if (!duelResults || duelResults.length === 0) return { pct: 0, count: 0 };
  var count = duelResults.length;
  var pct = count >= 3 ? 100 : count === 2 ? 50 : count === 1 ? 30 : 0;
  return { pct: pct, count: count };
}

// Axe 6 — CV prêt (15%) : selected=50%, selected+armored=75%, 3+ types=100%
function axeCVPret(validated, cvBricks) {
  // cvBricks = explicitly selected bricks for CV. If not provided, use validated with cvVersion.
  var selected = cvBricks && cvBricks.length > 0 ? cvBricks : validated.filter(function(b) { return b.cvVersion; });
  if (selected.length < 5) return { pct: 0, selectedCount: selected.length, armoredSelected: 0, typeCount: 0 };

  // All selected have armor?
  var allArmored = selected.every(function(b) { return assessBrickArmor(b).status === "armored"; });

  // Type diversity among selected
  var types = {};
  selected.forEach(function(b) {
    var t = b.brickType || b.brickCategory || "preuve";
    types[t] = true;
  });
  var typeCount = Object.keys(types).length;

  var pct = 50; // 5 selected
  if (allArmored) pct = 75; // 5 selected + all armored
  if (typeCount >= 3) pct = 100; // 3+ types

  return { pct: pct, selectedCount: selected.length, armoredSelected: allArmored, typeCount: typeCount };
}

/* ─── V2 Warnings ─── */
function generateDensityWarnings(axes, validated, duelResults) {
  var warnings = [];
  if (axes[0].pct < 50) warnings.push("Matériau insuffisant : " + validated.length + " briques forgées. Minimum recommandé : 5.");
  if (axes[1].detail.armoredCount === 0 && validated.length > 0) warnings.push("Aucune brique blindée. Un recruteur teste chaque affirmation. Ajoute chiffres, décision, influence et transférabilité.");
  if (axes[1].detail.vulnerableCount > 0) warnings.push(axes[1].detail.vulnerableCount + " brique" + (axes[1].detail.vulnerableCount > 1 ? "s" : "") + " vulnérable" + (axes[1].detail.vulnerableCount > 1 ? "s" : "") + ". Chaque brique non blindée est un angle d'attaque en entretien.");
  if (axes[2].detail.coveredCount === 0 && axes[2].detail.totalCount > 0) warnings.push("Aucun cauchemar couvert. Tu parles de toi mais pas de leur problème.");
  if (axes[3].pct < 30) warnings.push("Singularité faible. Ajoute une cicatrice, une prise de position ou un avantage injuste pour te séparer des autres profils.");
  if (!duelResults || duelResults.length === 0) warnings.push("Aucun duel complété. Score plafonné à 90%. Passe au Duel pour débloquer les derniers points.");
  return warnings;
}

// Density Score V2 — 6 axes, backwards compatible
// Accepts EITHER old (bricks, cauchemars) OR new ({ bricks, nightmares, pillars, signature, duelResults, cvBricks })
export function computeDensityScore(bricksOrParams, cauchemarsLegacy) {
  var bricks, nightmares, pillars, duelResults, cvBricks;

  // Detect calling convention
  if (bricksOrParams && !Array.isArray(bricksOrParams) && typeof bricksOrParams === "object" && bricksOrParams.bricks) {
    // New params object
    bricks = bricksOrParams.bricks;
    nightmares = bricksOrParams.nightmares || getActiveCauchemars();
    pillars = bricksOrParams.pillars || null;
    duelResults = bricksOrParams.duelResults || [];
    cvBricks = bricksOrParams.cvBricks || [];
  } else {
    // Legacy (bricks, cauchemars)
    bricks = bricksOrParams || [];
    nightmares = cauchemarsLegacy || getActiveCauchemars();
    pillars = null;
    duelResults = [];
    cvBricks = [];
  }

  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  if (validated.length === 0) return {
    score: 0, total: 0,
    axes: [
      { name: "Matériau brut", weight: 15, pct: 0, weighted: 0, detail: {} },
      { name: "Blindage", weight: 25, pct: 0, weighted: 0, detail: { armoredCount: 0, credibleCount: 0, vulnerableCount: 0, armors: [] } },
      { name: "Couverture cauchemars", weight: 20, pct: 0, weighted: 0, detail: { coveredCount: 0, totalCount: 0, diversityBonus: false } },
      { name: "Singularité", weight: 15, pct: 0, weighted: 0, detail: {} },
      { name: "Duel", weight: 10, pct: 0, weighted: 0, detail: { count: 0 } },
      { name: "CV prêt", weight: 15, pct: 0, weighted: 0, detail: {} },
    ],
    warnings: ["Aucune brique validée. Commence par forger ton premier matériau."],
    details: { brickCount: 0, blindedCount: 0, credibleCount: 0, blindedRatio: 0, cauchemarCoverage: 0, hasCicatrice: false, hasDecision: false, hasInfluence: false, correctedCount: 0 },
    unlocks: { forge: false, affutage: false, armement: true, sortie: false },
  };

  // Compute each axis
  var a1 = axeMateriauBrut(validated);
  var a2 = axeBlindage(validated);
  var a3 = axeCouvertureCauchemars(validated, nightmares);
  var a4 = axeSingularite(validated, pillars);
  var a5 = axeDuel(duelResults);
  var a6 = axeCVPret(validated, cvBricks);

  var axes = [
    { name: "Matériau brut", weight: 15, pct: a1, weighted: Math.round(a1 * 0.15), detail: { count: validated.length } },
    { name: "Blindage", weight: 25, pct: a2.pct, weighted: Math.round(a2.pct * 0.25), detail: a2 },
    { name: "Couverture cauchemars", weight: 20, pct: Math.min(100, a3.pct), weighted: Math.round(Math.min(120, a3.pct) * 0.20), detail: a3 },
    { name: "Singularité", weight: 15, pct: a4.pct, weighted: Math.round(a4.pct * 0.15), detail: a4 },
    { name: "Duel", weight: 10, pct: a5.pct, weighted: Math.round(a5.pct * 0.10), detail: a5 },
    { name: "CV prêt", weight: 15, pct: a6.pct, weighted: Math.round(a6.pct * 0.15), detail: a6 },
  ];

  var total = axes.reduce(function(sum, ax) { return sum + ax.weighted; }, 0);

  // Cap without duel
  if (!duelResults || duelResults.length === 0) total = Math.min(90, total);

  var score = Math.min(100, total);
  var warnings = generateDensityWarnings(axes, validated, duelResults);

  // V1 compat fields
  var hasCicatrice = validated.some(function(b) { return b.brickType === "cicatrice"; });
  var hasDecision = validated.some(function(b) { return b.brickCategory === "decision"; });
  var hasInfluence = validated.some(function(b) { return b.brickCategory === "influence"; });
  var correctedCount = validated.filter(function(b) { return b.corrected; }).length;

  return {
    score: score,
    total: total,
    axes: axes,
    warnings: warnings,
    details: {
      brickCount: validated.length,
      blindedCount: a2.armoredCount,
      credibleCount: a2.credibleCount,
      blindedRatio: a2.pct,
      cauchemarCoverage: a3.coveredCount,
      hasCicatrice: hasCicatrice,
      hasDecision: hasDecision,
      hasInfluence: hasInfluence,
      correctedCount: correctedCount,
    },
    unlocks: {
      forge: validated.length >= 3,
      affutage: true,
      armement: true,
      sortie: score >= 70,
    },
  };
}

export function computeCauchemarCoverage(bricks) {
  function normKpi(s) { return s.trim().replace(/\.$/, ""); }
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var coveredKpis = {};
  var kpiBricks = {};
  validated.forEach(function(b) {
    if (b.kpi) {
      var nk = normKpi(b.kpi);
      coveredKpis[nk] = true;
      if (!kpiBricks[nk]) kpiBricks[nk] = [];
      kpiBricks[nk].push(b);
    }
  });
  return getActiveCauchemars().map(function(c) {
    var covered = c.kpis.some(function(k) { return coveredKpis[normKpi(k)]; });
    var coveringBricks = [];
    c.kpis.forEach(function(k) { var nk = normKpi(k); if (kpiBricks[nk]) coveringBricks = coveringBricks.concat(kpiBricks[nk]); });
    var hasElasticCovering = coveringBricks.some(function(b) { return b.kpiRefMatch && b.kpiRefMatch.elasticity === "élastique"; });
    return { id: c.id, label: c.label, nightmareShort: c.nightmareShort, covered: covered, costRange: c.costRange, costUnit: c.costUnit, costContext: c.costContext, coveringBricks: coveringBricks, hasElasticCovering: hasElasticCovering };
  });
}

export function computeNegotiationBrief(bricks, cauchemars) {
  var activeCauch = cauchemars || CAUCHEMARS_CIBLES;
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var coverage = computeCauchemarCoverage(bricks, cauchemars);
  var coveredCauchemars = coverage.filter(function(c) { return c.covered; });
  if (coveredCauchemars.length === 0) return null;

  var totalCostLow = 0;
  var totalCostHigh = 0;
  var lines = [];

  coveredCauchemars.forEach(function(cc) {
    var cauch = getActiveCauchemars().find(function(c) { return c.id === cc.id; });
    if (!cauch) return;
    totalCostLow += cauch.costRange[0];
    totalCostHigh += cauch.costRange[1];
    var coveringBricks = validated.filter(function(b) {
      return cauch.kpis.some(function(kpi) {
        return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
      });
    });
    var hasCicatrice = coveringBricks.some(function(b) { return b.brickType === "cicatrice"; });
    var hasDecision = coveringBricks.some(function(b) { return b.brickCategory === "decision"; });
    var hasChiffre = coveringBricks.some(function(b) { return b.brickCategory === "chiffre"; });
    var strength = "faible";
    if (hasChiffre && (hasDecision || hasCicatrice)) strength = "fort";
    else if (hasChiffre || hasDecision) strength = "moyen";
    var costStr = formatCost(cauch.costRange[0]) + "-" + formatCost(cauch.costRange[1]);
    lines.push({
      cauchemar: cauch.label,
      costLow: cauch.costRange[0], costHigh: cauch.costRange[1],
      costLogic: cauch.costContext,
      negoFrame: cauch.negoFrame.replace("{cost}", costStr),
      brickCount: coveringBricks.length, strength: strength, hasCicatrice: hasCicatrice,
    });
  });
  return {
    totalCostLow: totalCostLow, totalCostHigh: totalCostHigh, lines: lines, coveredCount: coveredCauchemars.length, totalCount: getActiveCauchemars().length,
    marketContext: {
      pctNegocient: MARKET_DATA.nego.cherchent_a_negocier,
      pctFemmesFrein: MARKET_DATA.nego.femmes_pensent_pas_assez_atouts,
      pctHommesFrein: MARKET_DATA.nego.hommes_pensent_pas_assez_atouts,
      pctRisquePercu: MARKET_DATA.nego.risque_percu_changement,
      ancrage: "Le candidat moyen arrive sans chiffre. " + MARKET_DATA.nego.cherchent_a_negocier + "% tentent de négocier. Toi tu arrives avec le coût du problème. Tu es dans les " + (100 - MARKET_DATA.nego.cherchent_a_negocier) + "% qui cadrent la discussion.",
    },
  };
}

export function formatCost(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return n + "";
}

export function detectBluffRisk(bricks) {
  var coverage = computeCauchemarCoverage(bricks);
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var risks = [];
  coverage.forEach(function(cc) {
    if (!cc.covered) return;
    var cauch = getActiveCauchemars().find(function(c) { return c.id === cc.id; });
    if (!cauch) return;
    var coveringBricks = validated.filter(function(b) {
      return cauch.kpis.some(function(kpi) {
        return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
      });
    });
    var allSousPression = coveringBricks.length > 0 && coveringBricks.every(function(b) {
      return b.kpiRefMatch && b.kpiRefMatch.elasticity === "sous_pression";
    });
    var singleBrick = coveringBricks.length === 1;
    var noChiffre = !coveringBricks.some(function(b) { return b.brickCategory === "chiffre"; });
    if (allSousPression) {
      risks.push({ cauchemar: cauch.label, severity: "critique",
        reason: "Ta preuve repose sur un KPI automatisable. Le recruteur sait que l'IA fait ce travail. Tu te positionnes comme le remède avec un outil que tout le monde a."
      });
    } else if (singleBrick && noChiffre) {
      risks.push({ cauchemar: cauch.label, severity: "alerte",
        reason: "Un seul indice. Pas de chiffre. Si le problème persiste après ton arrivée, tu es le fusible. Renforce cette preuve ou change de terrain."
      });
    }
  });
  return risks;
}

export function computeEffort(bricks) {
  var total = 0;
  var breakdown = { briques: 0, corrections: 0, missions: 0, cicatrices: 0 };
  bricks.forEach(function(b) {
    if (b.status === "validated") {
      if (b.brickType === "cicatrice") { total += EFFORT_WEIGHTS.brick_cicatrice; breakdown.cicatrices++; }
      else if (b.brickCategory === "decision" || b.brickCategory === "influence") { total += EFFORT_WEIGHTS.brick_decision; breakdown.briques++; }
      else { total += EFFORT_WEIGHTS.brick_chiffre; breakdown.briques++; }
      if (b.corrected) { total += EFFORT_WEIGHTS.correction; breakdown.corrections++; }
    }
    if (b.type === "mission") { total += EFFORT_WEIGHTS.mission_assigned; breakdown.missions++; }
  });
  // Percentile estimate based on effort
  var percentile = total <= 4 ? 60 : total <= 10 ? 75 : total <= 20 ? 85 : total <= 30 ? 92 : 96;
  return { total: total, percentile: percentile, breakdown: breakdown };
}

export function hashCode(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

export function computeCauchemarCoverageDetailed(bricks, nightmareCosts) {
  function normKpi(s) { return s.trim().replace(/\.$/, ""); }
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var coveredKpis = {};
  var bricksByKpi = {};
  validated.forEach(function(b) {
    if (b.kpi) {
      var nk = normKpi(b.kpi);
      coveredKpis[nk] = true;
      if (!bricksByKpi[nk]) bricksByKpi[nk] = [];
      bricksByKpi[nk].push(b);
    }
  });
  return getActiveCauchemars().map(function(c) {
    var covered = c.kpis.some(function(k) { return coveredKpis[normKpi(k)]; });
    var coveringBricks = [];
    c.kpis.forEach(function(k) { var nk = normKpi(k); if (bricksByKpi[nk]) coveringBricks = coveringBricks.concat(bricksByKpi[nk]); });
    // Vulnerability of covering bricks
    var vulnerabilities = coveringBricks.map(function(b) { return auditBrickVulnerability(b); });
    var worstVuln = vulnerabilities.reduce(function(worst, v) {
      if (!v) return worst;
      if (!worst) return v;
      if (v.level === "vulnerable") return v;
      if (v.level === "credible" && worst.level !== "vulnerable") return v;
      return worst;
    }, null);
    var cost = nightmareCosts && nightmareCosts[c.id] ? nightmareCosts[c.id] : null;
    return { id: c.id, label: c.label, nightmareShort: c.nightmareShort, covered: covered, cost: cost, vulnerability: worstVuln, brickCount: coveringBricks.length };
  });
}

export function auditBrickVulnerability(brick) {
  if (!brick || !brick.text) return null;
  var text = brick.text.toLowerCase();
  var hasNumber = /\d/.test(text);
  var hasMethod = ["via", "grace a", "méthode", "process", "programme", "plan", "stratégie", "structure", "deploye", "mis en place", "construit", "installe"].some(function(m) { return text.indexOf(m) !== -1; });
  var hasContext = ["mois", "semaine", "trimestre", "jours", "équipe", "comptes", "commerciaux", "clients", "personnes"].some(function(m) { return text.indexOf(m) !== -1; });
  var hasResult = ["%", "reduction", "croissance", "augmente", "diminue", "multiplie", "atteint", "genere", "ameliore"].some(function(m) { return text.indexOf(m) !== -1; });
  var depth = 0;
  if (hasNumber) depth++;
  if (hasMethod) depth++;
  if (hasContext) depth++;
  if (hasResult) depth++;
  if (brick.corrected) depth++;
  if (depth >= 4) return { level: "blindee", color: "#4ecca3", msg: "Brique blindée. Chiffre, méthode, contexte et résultat." };
  if (depth >= 2) return { level: "credible", color: "#3498db", msg: "Brique crédible mais pas blindée." + (!hasNumber ? " Il manque un chiffre." : "") + (!hasMethod ? " Il manque une méthode." : "") + (!hasContext ? " Il manque un contexte." : "") + " Si tu te positionnes comme le remède, blinde cette brique." };
  return { level: "vulnerable", color: "#e94560", msg: "Brique vulnérable. Si le problème persiste après ton embauche, tu deviens la cible. Ajoute un chiffre, une méthode et un contexte." };
}

export var MARKET_DATA = {
  source: "APEC 2022-2023 / Baromètres recrutement IA 2025-2026",
  lastUpdate: "2026",
  fosse: {
    salaire_median_cadre: 52000,
    ecart_salaire_marche: { min: 10, max: 20, unit: "%" },
    gain_changement_employeur: 6,
    gain_sans_changement: 3,
    part_estiment_gagner_plus: { pct: 44, seuil: "5%" },
    part_augmentes_changement: 74,
    part_augmentes_interne: 72,
    part_augmentes_meme_poste: 55,
  },
  friction: {
    ghosting: 62,
    duree_chomage_jours: { min: 328, max: 350 },
    candidatures_pour_offre: "30-80 candidatures → 5-10 entretiens → 0-1 offre en 6 mois",
    refus_si_process_long: 57,
    delai_recrutement_semaines: 12,
    hausse_candidatures_ia: 239,
    cout_par_embauche_ia: { min: 1800, max: 2400, unit: "€" },
  },
  ia_recrutement: {
    candidats_utilisent_ia_france: 52,
    candidats_utilisent_ia_global: 65,
    entreprises_integrent_ia: 87,
    tri_cv_par_ia: 83,
    projection_adoption_fin_2026: 95,
    precision_tri_ia: { min: 87, max: 89, unit: "%" },
    reduction_temps_traitement: { min: 70, max: 82, unit: "%" },
    entreprises_reconnaissent_biais: 67,
  },
  linkedin: {
    posts_par_jour: 2000000,
    impressions_par_semaine: 9000000000,
    taux_engagement_moyen: { min: 3, max: 4, unit: "%" },
    pct_publient_regulierement: 5.2,
    frequence_optimale: { min: 2, max: 5, unit: "posts/semaine" },
    offres_par_seconde: 140,
    candidatures_par_seconde: 77,
  },
  nego: {
    cherchent_a_negocier: 60,
    femmes_pensent_pas_assez_atouts: 20,
    hommes_pensent_pas_assez_atouts: 7,
    motivation_salaire: 48,
    motivation_missions: 27,
    risque_percu_changement: 49,
    pensent_plus_dur_quavant: 58,
  },
  reconversion: {
    projet_reconversion: 31,
    demarches_entamees: 8,
    ecart_intention_action: 23,
    acceptent_remuneration_plus_faible: 42,
    cherchent_sens: 37,
    cherchent_conditions: 35,
    ennui_lassitude: 34,
  },
};
