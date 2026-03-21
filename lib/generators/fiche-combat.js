/**
 * Generates a 1-page battle card for the candidate to print before an interview.
 * Assembles data from 8 existing sources. Zero new data. New format.
 *
 * Sources: cauchemars (spécifiques + transversaux), briques blindées,
 * blindage 4 cases, LoC, signature, questions discovery, pitch Duel,
 * comparatif salarial.
 *
 * @param {Array} bricks - validated bricks
 * @param {string} targetRoleId - target role
 * @param {Array} cauchemars - active cauchemars (role-specific + transversal)
 * @param {object|null} signature - candidate signature
 * @param {string|null} seniorityLevel - ic/manager/leader
 * @param {number|null} currentSalary - current salary
 * @param {Array|null} duelResults - Duel results array (question/answer pairs)
 * @param {object|null} offerSignals - parsed offer signals
 * @param {Array|null} hints - correction hints from audit
 * @returns {string} formatted battle card (6 blocs)
 */

import { ROLE_CLUSTERS, SALARY_RANGES_BY_ROLE, ROLE_VALUE_RATIO, SENIORITY_LEVELS, SENIORITY_CALIBRATION } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { extractBrickCore } from "../sprint/brickExtractor.js";
import { hasInternalLocus, hasExternalLocus } from "../sprint/analysis.js";
import { assessBrickArmor } from "../sprint/scoring.js";
import { applyHints } from "./helpers.js";

export function generateFicheCombat(bricks, targetRoleId, cauchemars, signature, seniorityLevel, currentSalary, duelResults, offerSignals, hints) {
  var validated = (bricks || []).filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });

  if (validated.length < 2) {
    return "Forge au moins 2 briques pour activer la fiche de combat.";
  }

  // Role label
  var cluster = ROLE_CLUSTERS.find(function (rc) {
    return rc.id === targetRoleId;
  });
  var roleLabel = cluster ? cluster.label.split(" / ")[0] : "ce rôle";

  // Seniority
  var sLevel = seniorityLevel || "ic";
  var levelInfo = SENIORITY_LEVELS.find(function (l) { return l.id === sLevel; });
  var seniorityShortLabel = levelInfo ? levelInfo.shortLabel : "IC";
  var calibration = SENIORITY_CALIBRATION[sLevel] || SENIORITY_CALIBRATION.ic;

  // Active cauchemars
  var activeCauchemars = cauchemars || [];

  // Armor data per brick
  validated.forEach(function (b) {
    if (b.armorScore === undefined) {
      var armor = assessBrickArmor(b);
      b.armorScore = armor.depth;
      b._armorDetail = armor;
    } else if (!b._armorDetail) {
      b._armorDetail = assessBrickArmor(b);
    }
  });

  // ── BLOC 1 — CAUCHEMARS DU DÉCIDEUR (top 3 par couverture) ──

  var cauchCoverage = activeCauchemars.map(function (c) {
    var coverCount = 0;
    validated.forEach(function (b) {
      var bText = ((b.editText || b.text) + " " + (b.kpi || "")).toLowerCase();
      var matched = false;
      if (c.kpis) {
        c.kpis.forEach(function (kpi) {
          if (bText.indexOf(kpi.toLowerCase().slice(0, 6)) !== -1) matched = true;
        });
      }
      if (!matched && c.kw) {
        c.kw.forEach(function (kw) {
          if (bText.indexOf(kw.toLowerCase()) !== -1) matched = true;
        });
      }
      if (!matched && c.label) {
        var labelWords = c.label.toLowerCase().split(/\s+/);
        var wordHits = 0;
        labelWords.forEach(function (w) {
          if (w.length >= 4 && bText.indexOf(w) !== -1) wordHits++;
        });
        if (wordHits >= 2) matched = true;
      }
      if (matched) coverCount++;
    });
    return { cauchemar: c, coverage: coverCount };
  });

  // Sort by coverage desc, take top 3 with coverage > 0
  cauchCoverage.sort(function (a, b) { return b.coverage - a.coverage; });
  var topCauchemars = cauchCoverage.filter(function (cc) { return cc.coverage > 0; }).slice(0, 3);

  var cauchemarBlock;
  if (topCauchemars.length === 0) {
    cauchemarBlock = "Blinde tes briques pour couvrir au moins 1 cauchemar.";
  } else {
    cauchemarBlock = topCauchemars.map(function (cc) {
      var costLine = "";
      if (cc.cauchemar.cost) {
        var low = cc.cauchemar.cost[0];
        var high = cc.cauchemar.cost[1];
        if (low >= 1000) low = Math.round(low / 1000) + "k€";
        else low = low + "€";
        if (high >= 1000) high = Math.round(high / 1000) + "k€";
        else high = high + "€";
        costLine = "\nCoût si non résolu : " + low + " – " + high + "/an";
      }
      return cc.cauchemar.label + " — " + cc.coverage + " brique" + (cc.coverage > 1 ? "s" : "") + " couvrent ce cauchemar" + costLine;
    }).join("\n\n");
  }

  // ── BLOC 2 — TOP 3 BRIQUES + PARADES ──

  var sortedBricks = validated.slice().sort(function (a, b) {
    return (b.armorScore || 0) - (a.armorScore || 0);
  });
  var top3Bricks = sortedBricks.slice(0, 3);

  var brickBlock = top3Bricks.map(function (b, i) {
    var core = extractBrickCore(b);
    var armor = b._armorDetail || assessBrickArmor(b);
    var score = b.armorScore || armor.depth;
    var bText = b.editText || b.text || "";

    // Compressed summary: actionVerb + resultNumber + context
    var parts = [];
    if (core.actionVerb) parts.push(core.actionVerb);
    if (core.resultNumber) parts.push(core.resultNumber);
    else if (core.mainNumber) parts.push(core.mainNumber);
    if (core.context) parts.push(core.context);
    var summary = parts.length > 0 ? parts.join(" — ") : bText.slice(0, 120);

    // Objection + parade logic
    var objection, parade;
    var isInternal = hasInternalLocus(bText);
    var isExternal = hasExternalLocus(bText);
    var locusWarning = "";

    if (!isInternal && isExternal) {
      objection = "Effort collectif ou contexte favorable.";
      parade = "J'ai initié l'action. Le résultat est mesurable. L'initiative est la mienne.";
      locusWarning = " (reformule le locus)";
    } else if (score < 4) {
      // Identify missing case
      if (!armor.hasNumbers) {
        objection = "Pas de résultat mesurable.";
        parade = "L'indicateur proxy est le volume traité et la satisfaction mesurée.";
      } else if (!armor.hasDecisionMarkers) {
        objection = "Tu as exécuté, pas décidé.";
        parade = "La décision était stratégique. Je l'ai prise quand le contexte l'exigeait.";
      } else if (!armor.hasInfluenceMarkers) {
        objection = "Tu as fait ça seul dans ton coin.";
        parade = "J'ai aligné les parties prenantes sur l'objectif pour obtenir le résultat.";
      } else {
        objection = "Ça marchait là-bas, pas ici.";
        var signalContext = offerSignals && offerSignals.cauchemars && offerSignals.cauchemars[0]
          ? offerSignals.cauchemars[0].label.toLowerCase()
          : "votre contexte";
        parade = "Le mécanisme est reproductible. " + (signalContext !== "votre contexte" ? "Votre enjeu sur " + signalContext + " présente la même condition." : "Il s'applique dès que la condition est réunie.");
      }
    } else {
      // armorScore = 4 AND internal locus
      var cauchRef = topCauchemars.length > 0 ? topCauchemars[0].cauchemar.label.toLowerCase() : "ce type de problème";
      objection = "C'est impressionnant, mais votre secteur est différent.";
      parade = "Le mécanisme se transfère. Votre enjeu sur " + cauchRef + " relève du même pattern.";
    }

    return "PREUVE " + (i + 1) + " [" + score + "/4]\n" +
      summary + "\n" +
      "Objection probable : \"" + objection + "\"\n" +
      "→ Parade : \"" + parade + "\"" + (locusWarning ? " " + locusWarning : "");
  }).join("\n\n");

  // ── BLOC 3 — QUESTIONS DISCOVERY (3 meilleures) ──

  var discoveryBlock;

  // Build 3 questions inline from cauchemars + bricks
  var dQuestions = [];

  // Q1 — terrain: top covered cauchemar
  if (topCauchemars.length > 0) {
    var q1 = topCauchemars[0].cauchemar;
    var q1Label = q1.label;
    dQuestions.push(q1Label + " : \"Comment vous situez-vous sur " + q1Label.toLowerCase() + " aujourd'hui ?\"");
  }

  // Q2 — team/org
  if (activeCauchemars.length > 0) {
    var transversal = activeCauchemars.find(function (c) {
      return c.label && (
        c.label.indexOf("senior") !== -1 ||
        c.label.indexOf("critères") !== -1 ||
        c.label.indexOf("manager junior") !== -1
      );
    });
    if (transversal) {
      dQuestions.push("Équipe : \"Comment l'équipe est-elle structurée aujourd'hui ?\"");
    } else if (activeCauchemars.length > 1) {
      dQuestions.push("Organisation : \"Les rôles sont stabilisés ou en cours de redéfinition ?\"");
    }
  }

  // Q3 — asymmetric proof from best brick
  if (top3Bricks.length > 0) {
    var q3Core = extractBrickCore(top3Bricks[0]);
    var q3Opener = q3Core.context
      ? q3Core.context.split(/\s+/).slice(0, 4).join(" ")
      : (q3Core.actionVerb || "ce sujet");
    dQuestions.push("Preuve : \"Sur " + q3Opener + ", quel est votre niveau actuel ?\"");
  }

  // Fallback if less than 3
  if (dQuestions.length < 3 && sLevel === "leader") {
    dQuestions.push("Mesure : \"Comment le comex mesure-t-il le succès de cette fonction à 12 mois ?\"");
  } else if (dQuestions.length < 3 && sLevel === "manager") {
    dQuestions.push("KPIs : \"Quels sont les KPIs de l'équipe aujourd'hui ?\"");
  } else if (dQuestions.length < 3) {
    dQuestions.push("Ramp-up : \"Comment mesurez-vous la performance les 6 premiers mois ?\"");
  }

  discoveryBlock = dQuestions.slice(0, 3).join("\n");

  // ── BLOC 4 — PITCH 90 SECONDES ──

  var pitchBlock;
  var duelPassed = duelResults && duelResults.length > 0;
  var dominantCauchLabel = topCauchemars.length > 0
    ? topCauchemars[0].cauchemar.label.toLowerCase()
    : (activeCauchemars.length > 0 ? activeCauchemars[0].label.toLowerCase() : "ce sujet");

  if (duelPassed) {
    // Build pitch from duel answers
    var answeredDuel = duelResults.filter(function (r) { return r.answer; });
    var pitchParts = [];

    // Seniority-calibrated opener
    if (sLevel === "leader") {
      pitchParts.push(roleLabel + " orienté transformation et impact organisationnel.");
    } else if (sLevel === "manager") {
      pitchParts.push(roleLabel + " orienté scaling d'équipe et performance collective.");
    } else {
      pitchParts.push(roleLabel + " orienté résultats mesurables.");
    }

    // Best 2 duel answers as compressed proof
    answeredDuel.slice(0, 2).forEach(function (r) {
      var compressed = r.answer.split(/[.!?]/)[0];
      if (compressed.length > 80) compressed = compressed.slice(0, 77) + "...";
      pitchParts.push(compressed + ".");
    });

    // Signature
    if (signature && signature.formulation) {
      pitchParts.push("Mon mode opératoire : " + signature.formulation + ".");
    }

    // Closing question
    pitchParts.push("Quel est votre enjeu principal sur " + dominantCauchLabel + " aujourd'hui ?");

    pitchBlock = pitchParts.join(" ");
  } else {
    // Fallback: build from top 3 bricks
    var fallbackParts = [];
    fallbackParts.push(roleLabel + ".");

    top3Bricks.slice(0, 3).forEach(function (b) {
      var core = extractBrickCore(b);
      var compressed = [];
      if (core.actionVerb) compressed.push(core.actionVerb);
      if (core.resultNumber || core.mainNumber) compressed.push(core.resultNumber || core.mainNumber);
      fallbackParts.push(compressed.length > 0 ? compressed.join(", ") + "." : "");
    });

    if (signature && signature.formulation) {
      fallbackParts.push("Mon mode opératoire : " + signature.formulation + ".");
    }

    fallbackParts.push("Quel est votre enjeu principal sur " + dominantCauchLabel + " aujourd'hui ?");

    pitchBlock = fallbackParts.filter(function (p) { return p; }).join(" ");
    pitchBlock += "\n(Passe le Duel pour un pitch calibré sous pression.)";
  }

  // ── BLOC 5 — POSTURE ──

  var postureBlock = "Le recruteur se tait. Ne remplis pas. Laisse-le revenir. Celui qui parle en premier perd le cadre.";

  var valueRatio = ROLE_VALUE_RATIO[targetRoleId];
  if (currentSalary && valueRatio) {
    var salNum = parseInt(currentSalary);
    if (salNum && !isNaN(salNum)) {
      var costRatioLow = Math.round((salNum / valueRatio.high) * 100);
      var costRatioHigh = Math.round((salNum / valueRatio.low) * 100);
      postureBlock += "\nTu coûtes " + costRatioLow + "-" + costRatioHigh + "% de ce que tu rapportes. Le silence est rationnel.";
    }
  }

  // ── BLOC 6 — POSITION MARCHÉ ──

  var marketBlock = null;
  var salaryRanges = SALARY_RANGES_BY_ROLE[targetRoleId];
  if (currentSalary && salaryRanges) {
    var sal = parseInt(currentSalary);
    if (sal && !isNaN(sal)) {
      var multiplier = calibration.salaryMultiplier || 1.0;
      var p25 = Math.round(salaryRanges.p25 * multiplier);
      var p50 = Math.round(salaryRanges.p50 * multiplier);
      var p75 = Math.round(salaryRanges.p75 * multiplier);

      var percentile;
      if (sal < p25) percentile = "sous le P25";
      else if (sal < p50) percentile = "entre P25 et P50";
      else if (sal < p75) percentile = "entre P50 et P75";
      else percentile = "au-dessus du P75";

      var costLine = "";
      if (valueRatio) {
        var crLow = Math.round((sal / valueRatio.high) * 100);
        var crHigh = Math.round((sal / valueRatio.low) * 100);
        costLine = " Ratio : " + crLow + "-" + crHigh + "%.";
      }

      marketBlock = "Ton salaire : " + sal + "€ — " + percentile + ". Fourchette cible : " + p50 + "-" + p75 + "€." + costLine;
    }
  }

  // ── ASSEMBLAGE ──

  var blocks = [];
  blocks.push("FICHE DE COMBAT — " + roleLabel.toUpperCase() + " (" + seniorityShortLabel + ")");
  blocks.push("");
  blocks.push("CAUCHEMARS DU DÉCIDEUR");
  blocks.push(cauchemarBlock);
  blocks.push("");
  blocks.push("TOP 3 BRIQUES + PARADES");
  blocks.push(brickBlock);
  blocks.push("");
  blocks.push("QUESTIONS DISCOVERY");
  blocks.push(discoveryBlock);
  blocks.push("");
  blocks.push("PITCH 90 SECONDES");
  blocks.push(pitchBlock);
  blocks.push("");
  blocks.push("POSTURE");
  blocks.push(postureBlock);
  if (marketBlock) {
    blocks.push("");
    blocks.push(marketBlock);
  }

  var out = blocks.join("\n");
  out = applyHints(out, hints, { bricks: bricks, cauchemars: cauchemars, type: "fiche_combat" });
  return cleanRedac(out, "livrable");
}
