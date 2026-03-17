import { KPI_REFERENCE } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { getActiveCauchemars, formatCost, computeCauchemarCoverage } from "../sprint/scoring.js";
import { extractBrickSummary } from "../sprint/analysis.js";
import { applyHints } from "./helpers.js";

/**
 * Génère un argumentaire pour demander une augmentation.
 * Structure : valeur prouvée → coût du départ → demande calibrée.
 * @param {Array} bricks - briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {number|null} currentSalary - salaire actuel (optionnel)
 * @returns {string} argumentaire formaté
 */
export function generateRaiseArgument(bricks, targetRoleId, currentSalary, hints) {
  var validated = bricks.filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });
  if (validated.length === 0) return "[Argumentaire produit après validation de tes briques.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "ce poste";
  var cauchemars = getActiveCauchemars();

  var arg = "ARGUMENTAIRE D'AUGMENTATION\n";
  arg += roleName.toUpperCase() + "\n\n";

  // PARTIE 1 — Valeur prouvée
  // Scoring specific to this generator, not extracted (trivial: blinded first, then all)
  arg += "1. VALEUR PROUVÉE\n";
  var blindedBricks = validated.filter(function (b) {
    return b.blinded;
  });
  var topBricks = blindedBricks.length > 0 ? blindedBricks : validated;
  topBricks.slice(0, 3).forEach(function (b) {
    arg += "• " + extractBrickSummary(b.text) + "\n";
  });

  // Coverage
  var coverage = computeCauchemarCoverage(bricks);
  var covered = coverage.filter(function (c) {
    return c.covered;
  });
  if (covered.length > 0) {
    var totalCostLow = 0;
    var totalCostHigh = 0;
    covered.forEach(function (cc) {
      var cauch = cauchemars.find(function (c) {
        return c.id === cc.id;
      });
      if (cauch) {
        totalCostLow += cauch.costRange[0];
        totalCostHigh += cauch.costRange[1];
      }
    });
    arg +=
      "\nJe résous " +
      covered.length +
      " problème" +
      (covered.length > 1 ? "s" : "") +
      " dont le coût cumulé est estimé entre " +
      formatCost(totalCostLow) +
      " et " +
      formatCost(totalCostHigh) +
      " par an.\n";
  }
  arg += "\n";

  // PARTIE 2 — Coût du départ
  arg += "2. COÛT DE MON DÉPART\n";
  var salaryBase = currentSalary || 55000;
  var replacementCost = Math.round(salaryBase * 0.2);
  var rampCost = Math.round(salaryBase * 0.4);
  arg += "• Recrutement de remplacement : ~" + formatCost(replacementCost) + "€\n";
  arg += "• Perte de productivité pendant la transition : ~" + formatCost(rampCost) + "€\n";
  arg += "• Total : ~" + formatCost(replacementCost + rampCost) + "€\n";
  if (!currentSalary) {
    arg += "• (Estimation basée sur la médiane cadre. Renseigne ton salaire pour affiner.)\n";
  }
  arg += "\n";

  // PARTIE 3 — Demande calibrée (fix 10: calculated range based on replacement cost)
  arg += "3. DEMANDE\n";
  var totalReplacement = replacementCost + rampCost;
  if (covered.length > 0) totalReplacement += Math.round((totalCostLow + totalCostHigh) / 2);
  var raiseRatio = totalReplacement / salaryBase;
  var raiseLowPct = raiseRatio > 1.5 ? 8 : raiseRatio > 0.8 ? 5 : 3;
  var raiseHighPct = raiseRatio > 1.5 ? 12 : raiseRatio > 0.8 ? 8 : 5;
  var raisePercent = raiseLowPct + "-" + raiseHighPct;
  if (currentSalary) {
    var raiseLow = Math.round((currentSalary * raiseLowPct) / 100);
    var raiseHigh = Math.round((currentSalary * raiseHighPct) / 100);
    arg +=
      "• Fourchette demandée : +" +
      raisePercent +
      "% soit " +
      formatCost(raiseLow) +
      "-" +
      formatCost(raiseHigh) +
      "€ brut/an\n";
  } else {
    arg += "• Fourchette suggérée : +" + raisePercent + "% de ton salaire actuel\n";
  }
  arg +=
    "• Justification : le coût de ton remplacement (" +
    formatCost(totalReplacement) +
    "€) dépasse largement cette demande\n";
  arg +=
    "• Ratio demande / coût de remplacement : " +
    Math.round((raiseHighPct / (raiseRatio * 100)) * 100) +
    "% — le manager gagne à retenir\n";

  arg += "\n---\n";
  arg +=
    "Cet argumentaire repose sur " +
    validated.length +
    " preuve" +
    (validated.length > 1 ? "s" : "") +
    " documentée" +
    (validated.length > 1 ? "s" : "") +
    ". ";
  arg += "Le manager ne négocie pas un salaire. Il arbitre entre le coût de ta demande et le coût de ton départ.";

  arg = applyHints(arg, hints, { bricks: bricks, cauchemars: cauchemars, type: "argument" });
  return cleanRedac(arg, "livrable");
}
