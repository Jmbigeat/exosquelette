import { CAUCHEMARS_CIBLES, EFFORT_WEIGHTS } from "./references.js";

/* Global active cauchemars — set by Sprint component, used by all utility functions */
var _activeCauchemars = null;
export function getActiveCauchemars() { return _activeCauchemars || CAUCHEMARS_CIBLES; }
export function setActiveCauchemarsGlobal(c) { _activeCauchemars = c; }

// Density Lock — global quality score that gates progression
export function computeDensityScore(bricks, cauchemars) {
  var activeCauch = cauchemars || CAUCHEMARS_CIBLES;
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  if (validated.length === 0) return { score: 0, details: { brickCount: 0, blindedRatio: 0, cauchemarCoverage: 0, hasCicatrice: false, hasDecision: false }, unlocks: { forge: false, affutage: false, armement: false, sortie: false } };

  // 1. Brick count (0-20 points)
  var brickPoints = Math.min(20, validated.length * 4);

  // 2. Blinded ratio (0-30 points)
  var blindedCount = 0;
  var credibleCount = 0;
  validated.forEach(function(b) {
    var text = (b.text || "").toLowerCase();
    var hasNumber = /\d/.test(text);
    var hasMethod = ["via", "grace a", "méthode", "process", "programme", "plan", "stratégie", "structure", "deploye", "mis en place", "construit", "installe"].some(function(m) { return text.indexOf(m) !== -1; });
    var hasContext = ["mois", "semaine", "trimestre", "jours", "équipe", "comptes", "commerciaux", "clients", "personnes"].some(function(m) { return text.indexOf(m) !== -1; });
    var hasResult = ["%", "reduction", "croissance", "augmente", "diminue", "multiplie", "atteint", "genere", "ameliore"].some(function(m) { return text.indexOf(m) !== -1; });
    var depth = (hasNumber ? 1 : 0) + (hasMethod ? 1 : 0) + (hasContext ? 1 : 0) + (hasResult ? 1 : 0) + (b.corrected ? 1 : 0);
    if (depth >= 4) blindedCount++;
    else if (depth >= 2) credibleCount++;
  });
  var blindedRatio = validated.length > 0 ? blindedCount / validated.length : 0;
  var blindedPoints = Math.round(blindedRatio * 30);

  // 3. Cauchemar coverage (0-25 points)
  var coveredKpis = {};
  validated.forEach(function(b) { if (b.kpi) coveredKpis[b.kpi] = true; });
  var coveredCauchemars = 0;
  activeCauch.forEach(function(c) {
    if (c.kpis && c.kpis.some(function(k) { return coveredKpis[k]; })) coveredCauchemars++;
  });
  var cauchemarPoints = Math.round((coveredCauchemars / 3) * 25);

  // 4. Category diversity (0-15 points) — decision/influence/cicatrice
  var hasCicatrice = validated.some(function(b) { return b.brickType === "cicatrice"; });
  var hasDecision = validated.some(function(b) { return b.brickCategory === "decision"; });
  var hasInfluence = validated.some(function(b) { return b.brickCategory === "influence"; });
  var diversityPoints = (hasCicatrice ? 5 : 0) + (hasDecision ? 5 : 0) + (hasInfluence ? 5 : 0);

  // 5. Corrections bonus (0-10 points)
  var correctedCount = validated.filter(function(b) { return b.corrected; }).length;
  var correctionPoints = Math.min(10, correctedCount * 3);

  var score = Math.min(100, brickPoints + blindedPoints + cauchemarPoints + diversityPoints + correctionPoints);

  return {
    score: score,
    details: {
      brickCount: validated.length,
      blindedCount: blindedCount,
      credibleCount: credibleCount,
      blindedRatio: Math.round(blindedRatio * 100),
      cauchemarCoverage: coveredCauchemars,
      hasCicatrice: hasCicatrice,
      hasDecision: hasDecision,
      hasInfluence: hasInfluence,
      correctedCount: correctedCount,
    },
    unlocks: {
      forge: validated.length >= 3,
      affutage: score >= 50,
      armement: score >= 70,
      sortie: score >= 70 && blindedRatio >= 0.5,
    }
  };
}

export function computeCauchemarCoverage(bricks) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var coveredKpis = {};
  var kpiBricks = {};
  validated.forEach(function(b) {
    if (b.kpi) {
      coveredKpis[b.kpi] = true;
      if (!kpiBricks[b.kpi]) kpiBricks[b.kpi] = [];
      kpiBricks[b.kpi].push(b);
    }
  });
  return getActiveCauchemars().map(function(c) {
    var covered = c.kpis.some(function(k) { return coveredKpis[k]; });
    var coveringBricks = [];
    c.kpis.forEach(function(k) { if (kpiBricks[k]) coveringBricks = coveringBricks.concat(kpiBricks[k]); });
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
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var coveredKpis = {};
  var bricksByKpi = {};
  validated.forEach(function(b) {
    if (b.kpi) {
      coveredKpis[b.kpi] = true;
      if (!bricksByKpi[b.kpi]) bricksByKpi[b.kpi] = [];
      bricksByKpi[b.kpi].push(b);
    }
  });
  return getActiveCauchemars().map(function(c) {
    var covered = c.kpis.some(function(k) { return coveredKpis[k]; });
    var coveringBricks = [];
    c.kpis.forEach(function(k) { if (bricksByKpi[k]) coveringBricks = coveringBricks.concat(bricksByKpi[k]); });
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
