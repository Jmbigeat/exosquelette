import { KPI_REFERENCE, REPLACEMENT_DATA_BY_ROLE } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { getActiveCauchemars, formatCost } from "../sprint/scoring.js";
import { extractBrickSummary } from "../sprint/analysis.js";
import { applyHints } from "./helpers.js";

/**
 * Génère un rapport de coût de remplacement basé sur 4 composantes.
 * Utilise REPLACEMENT_DATA_BY_ROLE pour les données marché par rôle.
 * @param {Array} bricks - briques du candidat
 * @param {string} targetRoleId - identifiant du rôle cible
 * @param {number|null} currentSalary - salaire actuel (optionnel)
 * @param {object|null} internalSignals - signaux internes détectés
 * @returns {string} rapport formaté
 */
export function generateReplacementReport(bricks, targetRoleId, currentSalary, internalSignals, hints) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Rapport produit après validation de tes briques.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "ce poste";
  var replData = targetRoleId && REPLACEMENT_DATA_BY_ROLE[targetRoleId] ? REPLACEMENT_DATA_BY_ROLE[targetRoleId] : null;

  // Salary-based costs with role-specific data
  var salaryBase = currentSalary || 55000;
  var recruitmentCost = replData ? replData.recruitmentCost : Math.round(salaryBase * 0.20);
  var vacancyWeeks = replData ? replData.vacancyWeeks : 8;
  var rampUpMonths = replData ? replData.rampUpMonths : (roleData && roleData.cadence >= 90 ? 6 : 4);

  // Component 1 — Recrutement
  var comp1 = recruitmentCost;

  // Component 2 — Coût de vacance (salaire × vacancyWeeks / 52)
  var vacancyCost = Math.round(salaryBase * vacancyWeeks / 52);

  // Component 3 — Montée en compétence (rampUpMonths × perte productivité 40%)
  var rampUpCost = Math.round(salaryBase * rampUpMonths / 12 * 0.40);

  // Scoring specific to this generator, not extracted (cauchemar cost weighting by coverage depth)
  var cauchemars = getActiveCauchemars();
  var cauchCost = 0;
  var coveredCauchs = [];
  cauchemars.forEach(function(c) {
    var covers = validated.filter(function(b) {
      return c.kpis && c.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
    });
    if (covers.length > 0) {
      var avgCost = Math.round((c.costRange[0] + c.costRange[1]) / 2);
      // Weight by coverage depth: 1 brick = 50%, 2+ = 100%
      var coverageWeight = Math.min(1, covers.length / 2);
      var weightedCost = Math.round(avgCost * coverageWeight);
      cauchCost += weightedCost;
      coveredCauchs.push({ label: c.label, cost: weightedCost, brickCount: covers.length });
    }
  });

  var totalCost = comp1 + vacancyCost + rampUpCost + cauchCost;

  var report = "RAPPORT DE COÛT DE REMPLACEMENT\n";
  report += roleName.toUpperCase() + "\n\n";

  // SECTION 1 — Coût de recrutement
  report += "1. COÛT DE RECRUTEMENT\n";
  report += "• Cabinet + process interne : " + formatCost(comp1) + "€";
  if (replData) report += " (moyenne marché " + roleName + ")";
  report += "\n\n";

  // SECTION 2 — Coût de vacance
  report += "2. COÛT DE VACANCE\n";
  report += "• " + vacancyWeeks + " semaines de poste vacant : " + formatCost(vacancyCost) + "€\n";
  report += "• Calcul : salaire " + formatCost(salaryBase) + "€ × " + vacancyWeeks + "/52\n";
  if (!currentSalary) report += "• Base : estimation médiane cadre (55K€). Renseigne ton salaire pour affiner.\n";
  report += "\n";

  // SECTION 3 — Coût de montée en compétence
  report += "3. COÛT DE MONTÉE EN COMPÉTENCE\n";
  report += "• " + rampUpMonths + " mois × 40% de perte de productivité : " + formatCost(rampUpCost) + "€\n";
  report += "• Délai avant autonomie totale du remplaçant\n\n";

  // SECTION 4 — Risque cauchemars
  report += "4. RISQUE CAUCHEMARS\n";
  if (coveredCauchs.length > 0) {
    coveredCauchs.forEach(function(cc) {
      report += "• " + cc.label + " : " + formatCost(cc.cost) + "€ (coût moyen sectoriel)\n";
    });
    report += "• Total cauchemars couverts par ton profil : " + formatCost(cauchCost) + "€\n";
  } else {
    report += "• Aucun cauchemar couvert. Le risque n'est pas chiffré.\n";
  }
  report += "\n";

  // SECTION 5 — Total
  report += "TOTAL ESTIMÉ : " + formatCost(totalCost) + "€\n\n";

  // SECTION 6 — Valeur opérationnelle
  report += "5. VALEUR OPÉRATIONNELLE EN JEU\n";
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
  var blindedBricks = validated.filter(function(b) { return b.blinded; });
  report += "• " + validated.length + " compétence" + (validated.length > 1 ? "s" : "") + " documentée" + (validated.length > 1 ? "s" : "") + "\n";
  if (elasticBricks.length > 0) {
    report += "• " + elasticBricks.length + " compétence" + (elasticBricks.length > 1 ? "s" : "") + " élastique" + (elasticBricks.length > 1 ? "s" : "") + " (non remplaçable par l'IA)\n";
  }
  if (blindedBricks.length > 0) {
    report += "• " + blindedBricks.length + " résultat" + (blindedBricks.length > 1 ? "s" : "") + " chiffré" + (blindedBricks.length > 1 ? "s" : "") + " :\n";
    blindedBricks.slice(0, 3).forEach(function(b) {
      report += "  — " + extractBrickSummary(b.text) + "\n";
    });
  }
  report += "\n";

  // SECTION 7 — Coûts invisibles
  report += "6. COÛTS INVISIBLES\n";
  report += "• Perte de mémoire institutionnelle (process, relations, contexte)\n";
  report += "• Signal négatif pour l'équipe (si le meilleur élément part, les autres se posent la question)\n";
  report += "• Délai incompressible : " + rampUpMonths + " mois avant que le remplaçant soit autonome\n";

  // SECTION 8 — Signaux internes détectés
  if (internalSignals && internalSignals.detected) {
    report += "\n7. CONTEXTE INTERNE DÉTECTÉ\n";
    internalSignals.signals.forEach(function(s) {
      report += "• " + s.label + " (" + s.strength + ") — " + s.leverage + "\n";
    });
  }

  report += "\n---\n";
  report += "Ce rapport n'est pas une menace. C'est une cartographie. Le manager qui retient coûte moins cher que le manager qui remplace.";

  report = applyHints(report, hints, { bricks: bricks, cauchemars: cauchemars, type: "report" });
  return cleanRedac(report, "livrable");
}
