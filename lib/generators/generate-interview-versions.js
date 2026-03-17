import { KPI_REFERENCE } from "../sprint/references.js";
import { formatCost } from "../sprint/scoring.js";
import { extractBrickCore, hasMentoringMarkers } from "../sprint/brickExtractor.js";
import { applyHints } from "./helpers.js";

/**
 * Generates 3 interview versions of a brick, one per audience.
 * Same fact, 3 angles: RH (trajectory), N+1 (operational), Direction (business impact).
 * @param {object} brick - a single validated brick
 * @param {string} targetRoleId - target role
 * @param {Array} cauchemars - active cauchemars for context
 * @returns {{ rh: string, n1: string, direction: string }}
 */
export function generateInterviewVersions(brick, targetRoleId, cauchemars, hints) {
  var core = extractBrickCore(brick);
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role : "ce poste";
  var isScar = brick.brickType === "scar";
  var isElastic = brick.brickType === "elastic";

  var actionVerb = core.actionVerb || "agi";
  var resultNum = core.resultNumber || core.mainNumber || "un résultat mesurable";
  var problemNum = core.problemNumber || null;
  var context = core.context || "";
  var constraint = core.constraint || "";
  var delta = problemNum && resultNum && problemNum !== resultNum ? "de " + problemNum + " à " + resultNum : resultNum;

  // Find matching cauchemar — fix 4: prioritize management cauchemars for mentoring bricks
  var matchedCauch = null;
  if (cauchemars && cauchemars.length > 0) {
    if (hasMentoringMarkers(brick.text)) {
      matchedCauch = cauchemars.find(function (c) {
        return c.label && /montée|management|équipe|ramp|onboard|formation/i.test(c.label);
      });
    }
    if (!matchedCauch) {
      matchedCauch = cauchemars.find(function (c) {
        return (
          c.kpis &&
          c.kpis.some(function (kpi) {
            return brick.kpi && brick.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
          })
        );
      });
    }
  }
  var cauchLabel = matchedCauch ? matchedCauch.label.toLowerCase() : "un enjeu terrain";
  var costRef =
    matchedCauch && matchedCauch.costRange
      ? formatCost(matchedCauch.costRange[0]) + " - " + formatCost(matchedCauch.costRange[1]) + " / an"
      : null;

  // ── VERSION RH — Narrative trajectoire ──
  var rh = "";
  if (isScar) {
    rh += "J'ai traversé une situation difficile" + (constraint ? " : " + constraint : "") + ".\n";
    rh += "Ce qui m'a le plus marqué, c'est ce que j'ai compris après coup.\n";
    rh += "Le réflexe que j'ai développé : vérifier les signaux faibles avant qu'ils ne deviennent des crises.\n";
    rh += "Ce que j'en retiens pour " + roleLabel + " : la maturité vient des erreurs qu'on ne répète pas.";
  } else if (isElastic) {
    rh += "Cette expérience vient d'un autre contexte" + (context ? " — " + context : "") + ".\n";
    rh += "La mécanique se transpose : j'ai " + actionVerb + " et obtenu " + resultNum + ".\n";
    rh += "J'ai appris à isoler ce qui est spécifique au contexte de ce qui est réplicable.\n";
    rh += "Ce que j'en retiens pour " + roleLabel + " : la méthode voyage, pas le secteur.";
  } else {
    rh += "Quand je suis arrivé sur ce sujet, la situation était claire : " + cauchLabel + ".\n";
    rh += "J'ai " + actionVerb + " " + delta + ".\n";
    rh += "Ce qui a fait la différence, c'est la méthode plus que l'intuition.\n";
    rh += "Ce que j'en retiens pour " + roleLabel + " : " + resultNum + " de résultat prouvé sur ce type d'enjeu.";
  }

  // ── VERSION N+1 — Opérationnel terrain ──
  var n1 = "";
  if (isScar) {
    n1 += "Le process en place ne fonctionnait pas" + (constraint ? " — " + constraint : "") + ".\n";
    n1 += "Diagnostic : le problème était structurel, pas conjoncturel.\n";
    n1 += "Correctif appliqué : " + actionVerb + (context ? " sur " + context : "") + ".\n";
    n1 += "Résultat après correction : le même scénario ne s'est pas reproduit.";
  } else if (isElastic) {
    n1 += "Contexte initial différent du vôtre, mais le problème est le même : " + cauchLabel + ".\n";
    n1 += "Méthode appliquée : " + actionVerb + (context ? " — " + context : "") + ".\n";
    n1 += "Résultat : " + resultNum + ".\n";
    n1 += "Le mécanisme est transposable parce que le levier est le même.";
  } else {
    n1 += "Le problème : " + cauchLabel + ".\n";
    n1 += "Action : " + actionVerb + (context ? " — " + context : "") + ".\n";
    n1 += "Résultat : " + delta + ".\n";
    n1 += "La méthode est reproductible. Voici comment je procéderais sur votre périmètre.";
  }

  // ── VERSION DIRECTION — Impact P&L ──
  var direction = "";
  if (isScar) {
    direction += "L'erreur initiale avait un coût business" + (costRef ? " estimé à " + costRef : "") + ".\n";
    direction += "Le correctif a permis d'éviter la récurrence.\n";
    direction += "Impact : protection du P&L sur ce segment.\n";
    direction += "Je structure désormais un contrôle en amont pour anticiper ce type de risque.";
  } else if (isElastic) {
    direction += "L'enjeu business est transverse : " + cauchLabel + ".\n";
    direction += "La méthode testée dans un autre contexte a produit " + resultNum + ".\n";
    direction +=
      "Le delta est réplicable sur votre périmètre" +
      (costRef ? ". Coût sectoriel si non résolu : " + costRef : "") +
      ".\n";
    direction += "Mon approche : appliquer le même cadre, calibré au contexte, avec un ROI mesurable en 90 jours.";
  } else {
    direction += "L'enjeu P&L : " + cauchLabel + (costRef ? " — coût sectoriel : " + costRef : "") + ".\n";
    direction += "Décision prise : " + actionVerb + (context ? " — " + context : "") + ".\n";
    direction += "Impact mesuré : " + delta + ".\n";
    direction += "Ce résultat se reproduit quand on applique la même rigueur de mesure au bon périmètre.";
  }

  var transferClose = brick.transferStatement || "";
  if (transferClose.length >= 20) {
    rh += "\n\nCe que cette expérience prouve pour " + roleLabel + " : " + transferClose;
    n1 += "\n\nTransfert : " + transferClose;
    direction += "\n\nPont : " + transferClose;
  }
  rh = applyHints(rh, hints, { bricks: [brick], cauchemars: cauchemars, type: "interview_prep" });
  n1 = applyHints(n1, hints, { bricks: [brick], cauchemars: cauchemars, type: "interview_prep" });
  direction = applyHints(direction, hints, { bricks: [brick], cauchemars: cauchemars, type: "interview_prep" });
  return { rh: rh, n1: n1, direction: direction };
}
