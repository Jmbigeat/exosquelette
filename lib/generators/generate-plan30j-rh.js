import { KPI_REFERENCE } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { getActiveCauchemars } from "../sprint/scoring.js";
import { extractBrickCore } from "../sprint/brickExtractor.js";
import { extractBrickSummary } from "../sprint/analysis.js";
import { applyHints } from "./helpers.js";

/* ==============================
   CHANTIER 6 — GENERATORS INTERNES + PLAN 30j RH
   ============================== */

/**
 * Génère un plan 30 jours pour le recruteur/RH.
 * Montre ce que le candidat fera pendant son premier mois.
 * Basé sur les briques et le rôle cible.
 * @param {Array} bricks - briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {object} offerSignals - signaux de l'offre (optionnel)
 * @returns {string} plan formaté
 */
export function generatePlan30jRH(bricks, targetRoleId, offerSignals, hints) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Plan 30 jours produit après validation de tes briques.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "ce poste";
  var cauchemars = getActiveCauchemars();

  // Find strongest brick covering a cauchemar
  var strongestBrick = null;
  var strongestCauch = null;
  cauchemars.forEach(function(c) {
    validated.forEach(function(b) {
      if (b.kpi && c.kpis && c.kpis.some(function(k) { return b.kpi.toLowerCase().indexOf(k.toLowerCase().slice(0, 6)) !== -1; })) {
        if (!strongestBrick || (b.blinded && !strongestBrick.blinded)) {
          strongestBrick = b;
          strongestCauch = c;
        }
      }
    });
  });
  if (!strongestBrick) strongestBrick = validated[0];

  var plan = "PLAN 30 JOURS — " + roleName.toUpperCase() + "\n\n";

  // SEMAINE 1
  plan += "SEMAINE 1 — DIAGNOSTIC\n";
  plan += "• Cartographier les 3 priorités immédiates avec le N+1\n";
  plan += "• Identifier le problème le plus coûteux en cours\n";
  if (strongestCauch) {
    plan += "• Contexte probable : " + strongestCauch.nightmareShort + "\n";
  }
  plan += "\n";

  // SEMAINE 2 (fix 11: compressed brick reference via extractBrickCore)
  plan += "SEMAINE 2 — PREMIER SIGNAL\n";
  plan += "• Livrer un quick win visible sur le problème identifié\n";
  if (strongestBrick) {
    var s2Core = extractBrickCore(strongestBrick);
    var s2Action = s2Core.actionVerb ? (s2Core.actionVerb.charAt(0).toUpperCase() + s2Core.actionVerb.slice(1)) : null;
    var s2Num = s2Core.resultNumber || s2Core.mainNumber || null;
    plan += "• Méthode testée : " + (s2Action ? s2Action : "action ciblée") + (s2Num ? " — résultat obtenu : " + s2Num : "") + "\n";
  }
  plan += "• Documenter le before/after avec une métrique\n";
  plan += "\n";

  // SEMAINE 3
  plan += "SEMAINE 3 — INSTALLATION\n";
  plan += "• Installer un rituel de suivi hebdomadaire avec le N+1\n";
  plan += "• Identifier les 2 prochains chantiers par ordre d'impact\n";
  var decisionBrick = validated.find(function(b) { return b.brickCategory === "decision"; });
  if (decisionBrick) {
    plan += "• Capacité d'arbitrage démontrée : " + extractBrickSummary(decisionBrick.text) + "\n";
  }
  plan += "\n";

  // SEMAINE 4
  plan += "SEMAINE 4 — BILAN J30\n";
  plan += "• Présenter le ROI des 30 premiers jours\n";
  plan += "• Proposer le plan des 60 jours suivants\n";
  if (strongestCauch) {
    plan += "• Objectif : réduire l'impact de \"" + strongestCauch.label + "\" avec preuve mesurable\n";
  }

  plan += "\n---\n";
  plan += validated.length + " brique" + (validated.length > 1 ? "s" : "") + " de preuve disponible" + (validated.length > 1 ? "s" : "") + ". ";
  var blinded = validated.filter(function(b) { return b.blinded; });
  if (blinded.length > 0) {
    plan += blinded.length + " blindée" + (blinded.length > 1 ? "s" : "") + " (preuve chiffrée).";
  }

  plan = applyHints(plan, hints, { bricks: bricks, type: "plan30j" });
  return cleanRedac(plan, "livrable");
}
