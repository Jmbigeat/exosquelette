import { KPI_REFERENCE } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { getActiveCauchemars, computeCauchemarCoverage } from "../sprint/scoring.js";
import { extractBrickCore, formatCVLine as _formatCVLine } from "../sprint/brickExtractor.js";
import { parseOfferSignals } from "../sprint/offers.js";
import { analyzeDiltsProgression } from "../sprint/dilts.js";
import { applyHints } from "./helpers.js";

/**
 * Generates 4 contact script variants (email, dm, n1, rh).
 *
 * @param {Array} bricks - validated bricks
 * @param {string} targetRoleId - target role ID
 * @param {object|null} targetOffer - offer object with parsedSignals
 * @param {Array|null} hints - correction hints
 * @param {object|null} pillarContext - { pillarId, pillarTitle, pillarTheme } from Brew (optional)
 * @param {number|null} diltsClosingLevel - Dilts level 1-6 for closing calibration (optional)
 * @returns {{ email: string, dm: string, n1: string, rh: string, diltsProgression: object } | null}
 */
export function generateContactScripts(bricks, targetRoleId, targetOffer, hints, pillarContext, diltsClosingLevel) {
  var validated = bricks.filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });
  if (validated.length === 0) return null;

  // If targetOffer provided, parse its signals and use those cauchemars
  var offerCauchemars = null;
  if (targetOffer && targetOffer.parsedSignals && targetOffer.parsedSignals.cauchemars) {
    offerCauchemars = targetOffer.parsedSignals.cauchemars;
  } else if (targetOffer && targetOffer.text && targetOffer.text.trim().length > 20) {
    var parsed = parseOfferSignals(targetOffer.text, targetRoleId);
    if (parsed) offerCauchemars = parsed.cauchemars;
  }
  var activeCauchs = offerCauchemars || getActiveCauchemars();

  var coverage = computeCauchemarCoverage(bricks);
  var covered = coverage.filter(function (c) {
    return c.covered;
  });
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role : "ce poste";

  // Scoring specific to this generator, not extracted (offer-aware cauchemar selection by costRange)
  var strongestCauchemar = null;
  var strongestBrick = null;
  covered.forEach(function (cc) {
    var cauch = activeCauchs.find(function (c) {
      return c.id === cc.id;
    });
    if (!cauch) {
      // Try matching by label/kpi for offer-specific cauchemars
      cauch = activeCauchs.find(function (c) {
        return (
          c.kpis &&
          c.kpis.some(function (kpi) {
            return cc.kpi && cc.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
          })
        );
      });
    }
    if (!cauch) return;
    if (!strongestCauchemar || cauch.costRange[1] > strongestCauchemar.costRange[1]) {
      var coveringBrick = validated.find(function (b) {
        return cauch.kpis.some(function (kpi) {
          return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
        });
      });
      if (coveringBrick) {
        strongestCauchemar = cauch;
        strongestBrick = coveringBrick;
      }
    }
  });
  if (!strongestBrick) strongestBrick = validated[0];

  var cauchText = strongestCauchemar ? strongestCauchemar.nightmareShort : "";
  // Fix 6+7: compress brick reference via extractBrickCore
  var brickCore = strongestBrick ? extractBrickCore(strongestBrick) : null;
  var brickCompressed = brickCore ? _formatCVLine(brickCore, strongestBrick.brickType || "proof") : "";
  var brickText = strongestBrick ? strongestBrick.text : "";
  var brickCv = brickCompressed || (strongestBrick && strongestBrick.cvVersion ? strongestBrick.cvVersion : brickText);
  if (strongestBrick && strongestBrick.transferStatement && strongestBrick.transferStatement.length >= 20) {
    brickCv += " → " + strongestBrick.transferStatement;
  }

  var closeQuestions = {
    enterprise_ae: "Qu'est-ce qui rend ce recrutement difficile aujourd'hui ?",
    head_of_growth: "Quel canal d'acquisition vous préoccupe le plus en ce moment ?",
    strategic_csm: "Quel est le compte qui vous empêche de dormir ?",
    senior_pm: "Quel arbitrage produit personne ne veut trancher en ce moment ?",
    ai_architect: "Quel cas d'usage IA est bloqué depuis plus de 3 mois ?",
    engineering_manager: "Quel est le frein technique que l'équipe n'arrive pas à débloquer ?",
    management_consultant: "Quel problème a déclenché ce recrutement ?",
    strategy_associate: "Quelle décision stratégique attend des données que personne ne produit ?",
    operations_manager: "Quelle friction inter-équipes consomme le plus de temps ?",
    fractional_coo: "Qu'est-ce que le CEO ne devrait plus faire lui-même dans 6 mois ?",
  };
  var closeQ = closeQuestions[targetRoleId] || "Qu'est-ce qui rend ce recrutement difficile aujourd'hui ?";
  var triggerQ = "Qu'est-ce qui a déclenché ce recrutement ?";
  var antiProfileQ = "Quel profil ne voulez-vous surtout pas reproduire ?";

  // Brew integration: pillar context + Dilts closing calibration
  var pillarBridge = "";
  if (pillarContext && pillarContext.pillarTheme) {
    pillarBridge = "J'ai publié récemment sur " + pillarContext.pillarTheme + ". ";
  }
  var diltsClosing = "";
  if (diltsClosingLevel && diltsClosingLevel >= 4) {
    diltsClosing = "Je suis convaincu que ce sujet est structurel pour votre équipe. ";
  } else if (diltsClosingLevel && diltsClosingLevel <= 2) {
    diltsClosing = "Les faits sont là. ";
  }

  // HOOK DIFFÉRENCIÉ PAR CANAL :
  // - DM = douleur du recruteur (question directe)
  // - Email = coût financier chiffré (arithmétique visible)
  // - Bio = prise de position du candidat
  // Interdiction d'utiliser le même hook sur deux canaux.

  // A. EMAIL — cauchemar + preuve compressée. Pas de coût sectoriel en opener.
  var email = "Bonjour [Prénom],\n\n";
  if (cauchText) {
    email += cauchText + "\n\n";
  } else {
    email += "Votre offre " + roleLabel + " m'a fait réagir sur un point précis.\n\n";
  }
  email += pillarBridge + "J'ai vécu ce problème. " + brickCompressed + "\n\n";
  email +=
    diltsClosing +
    "Je ne sais pas si c'est pertinent pour votre contexte. Mais si ce sujet résonne, j'ai une question :\n\n";
  email += closeQ + "\n\n";
  email += "Bonne journée,\n[Prénom Nom]\n\n";
  email += "PS : Deux questions que je pose systématiquement en début d'échange :\n";
  email += "1. " + triggerQ + "\n";
  email += "2. " + antiProfileQ;

  // B. DM LINKEDIN — douleur du recruteur, question directe, ≤ 300 chars. Pas de coût chiffré.
  var dmHook = closeQ;
  var dm = "[Prénom], " + dmHook + " ";
  dm += pillarBridge + brickCv + " ";
  dm += diltsClosing + triggerQ;
  // Fix 7: enforce 300 char limit
  if (dm.length > 300) {
    dm = "[Prénom], " + dmHook + " " + brickCv;
    if (dm.length > 300) {
      var dmCut = dm.lastIndexOf(".", 297);
      dm = dmCut > 100 ? dm.slice(0, dmCut + 1) : dm.slice(0, 297) + "...";
    }
  }

  // C. N+1 OPÉRATIONNEL — terrain, problème concret
  var n1 = "Bonjour [Prénom],\n\n";
  n1 += cauchText
    ? cauchText + " C'est un problème que j'ai résolu concrètement.\n\n"
    : "Votre équipe recrute sur un sujet que j'ai vécu de l'intérieur.\n\n";
  n1 += brickText + "\n\n";
  n1 += "La méthode est reproductible. " + triggerQ + " " + closeQ + "\n\n";
  n1 += "[Prénom Nom]";

  // D. RH — parcours, trajectoire, culture fit
  var rh = "Bonjour [Prénom],\n\n";
  rh += cauchText ? cauchText + " " : "";
  rh += brickCv + "\n\n";
  if (strongestBrick && strongestBrick.interviewVersions) {
    rh +=
      strongestBrick.interviewVersions.rh.length > 200
        ? strongestBrick.interviewVersions.rh.slice(0, 200) + "..."
        : strongestBrick.interviewVersions.rh;
    rh += "\n\n";
  }
  rh += antiProfileQ + " Je préfère calibrer mon discours sur ce que vous cherchez à éviter.\n\n";
  rh += "[Prénom Nom]";

  email = applyHints(email, hints, { bricks: bricks, cauchemars: activeCauchs, type: "email" });
  dm = applyHints(dm, hints, { bricks: bricks, cauchemars: activeCauchs, type: "dm" });

  var cleanEmail = cleanRedac(email, "livrable");
  var cleanDm = cleanRedac(dm, "livrable");
  var cleanN1 = cleanRedac(n1, "livrable");
  var cleanRh = cleanRedac(rh, "livrable");

  // Chantier 19 — Dilts progression analysis on each script
  var emailProgression = analyzeDiltsProgression(cleanEmail);
  var dmProgression = analyzeDiltsProgression(cleanDm);

  return {
    email: cleanEmail,
    dm: cleanDm,
    n1: cleanN1,
    rh: cleanRh,
    diltsProgression: {
      dm: { opening: dmProgression.opens, closing: dmProgression.closes, delta: dmProgression.progression },
      email: { opening: emailProgression.opens, closing: emailProgression.closes, delta: emailProgression.progression },
    },
  };
}
