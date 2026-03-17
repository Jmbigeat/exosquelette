import { KPI_REFERENCE } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { extractBrickCore } from "../sprint/brickExtractor.js";
import { extractBrickSummary } from "../sprint/analysis.js";
import { applyHints } from "./helpers.js";

/**
 * Génère un plan 90 jours pour le manager actuel.
 * Montre l'évolution proposée : 30j stabilisation, 30j expansion, 30j transformation.
 * @param {Array} bricks - briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {object} internalSignals - résultat de parseInternalSignals (optionnel)
 * @returns {string} plan formaté
 */
export function generatePlan90jN1(bricks, targetRoleId, internalSignals, hints) {
  var validated = bricks.filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });
  if (validated.length === 0) return "[Plan 90 jours produit après validation de tes briques.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "ce poste";

  var elasticBricks = validated.filter(function (b) {
    return b.elasticity === "élastique";
  });
  var decisionBricks = validated.filter(function (b) {
    return b.brickCategory === "decision";
  });
  var influenceBricks = validated.filter(function (b) {
    return b.brickCategory === "influence";
  });

  var plan = "PLAN 90 JOURS — ÉVOLUTION INTERNE\n";
  plan += roleName.toUpperCase() + "\n\n";

  // Fix 12: use extractBrickCore for compressed refs + deduplicate across phases
  var usedBrickIds = {};
  function pickDistinctBrick(pool) {
    for (var pi = 0; pi < pool.length; pi++) {
      if (!usedBrickIds[pool[pi].id]) {
        usedBrickIds[pool[pi].id] = true;
        return pool[pi];
      }
    }
    return pool[0] || null;
  }
  function compressRef(b) {
    if (!b) return null;
    var bc = extractBrickCore(b);
    var verb = bc.actionVerb ? bc.actionVerb.charAt(0).toUpperCase() + bc.actionVerb.slice(1) : null;
    var num = bc.resultNumber || bc.mainNumber || null;
    if (verb && num) return verb + " — " + num;
    if (verb) return verb;
    return extractBrickSummary(b.text);
  }

  // PHASE 1 — Stabilisation (J1-J30)
  plan += "PHASE 1 — STABILISATION (J1-J30)\n";
  plan += "Objectif : sécuriser la valeur actuelle et identifier les leviers d'expansion.\n\n";
  plan += "• Documenter les 3 résultats clés des 6 derniers mois\n";
  var p1Brick = pickDistinctBrick(validated);
  if (p1Brick) {
    plan += "• Résultat principal : " + compressRef(p1Brick) + "\n";
  }
  plan += "• Identifier les 2 problèmes non résolus les plus coûteux pour l'équipe\n";
  if (internalSignals && internalSignals.detected) {
    var firstSignal = internalSignals.signals[0];
    plan += "• Signal détecté : " + firstSignal.label + " — " + firstSignal.leverage + "\n";
  }
  plan += "\n";

  // PHASE 2 — Expansion (J31-J60)
  plan += "PHASE 2 — EXPANSION (J31-J60)\n";
  plan += "Objectif : élargir le périmètre d'impact mesurable.\n\n";
  plan += "• Prendre en charge 1 chantier adjacent au périmètre actuel\n";
  var p2Decision = pickDistinctBrick(decisionBricks);
  if (p2Decision) {
    plan += "• Capacité d'arbitrage prouvée : " + compressRef(p2Decision) + "\n";
  }
  var p2Influence = pickDistinctBrick(influenceBricks);
  if (p2Influence) {
    plan += "• Alignement inter-équipes : " + compressRef(p2Influence) + "\n";
  }
  plan += "• Mesurer le ROI de l'expansion (avant/après sur 1 métrique)\n";
  plan += "\n";

  // PHASE 3 — Transformation (J61-J90)
  plan += "PHASE 3 — TRANSFORMATION (J61-J90)\n";
  plan += "Objectif : proposer une évolution de périmètre formalisée.\n\n";
  plan += "• Présenter le bilan des 90 jours avec métriques\n";
  var p3Elastic = pickDistinctBrick(elasticBricks);
  if (p3Elastic) {
    plan += "• Compétences élastiques documentées : " + elasticBricks.length + " (non remplaçables par l'IA)\n";
    plan += "  — " + compressRef(p3Elastic) + "\n";
  }
  plan += "• Proposer le nouveau périmètre avec objectifs chiffrés\n";
  plan +=
    '• Poser la question au N+1 : "Quel est le problème que personne ne prend en charge et qui coûte le plus cher à l\'équipe ?"\n';

  // Signaux internes
  if (internalSignals && internalSignals.detected && internalSignals.signals.length > 1) {
    plan += "\n---\nSIGNAUX INTERNES DÉTECTÉS\n";
    internalSignals.signals.forEach(function (s) {
      plan += "• " + s.label + " — " + s.leverage + "\n";
    });
  }

  plan += "\n---\n";
  plan +=
    "Ce plan transforme une demande d'augmentation en proposition de valeur. Le N+1 n'évalue pas ton salaire. Il évalue le ROI de ton évolution.";

  plan = applyHints(plan, hints, { bricks: bricks, type: "plan90j" });
  return cleanRedac(plan, "livrable");
}
