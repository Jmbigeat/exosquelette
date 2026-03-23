/**
 * Generates a One-Pager: 5-block proof document organized by problem solved.
 * Designed to leave the platform — zero Abneg@tion vocabulary.
 * Read in 30 seconds by a recruiter, DRH, or hiring manager.
 *
 * @param {Array} bricks - validated bricks
 * @param {string} targetRoleId - target role
 * @param {Array} cauchemars - active cauchemars
 * @param {object|null} signature - candidate signature if exists
 * @param {object|null} offerSignals - parsed offer signals
 * @param {string|null} candidateName - candidate name (from profile)
 * @param {string|null} candidateEmail - candidate email
 * @returns {string} formatted One-Pager (5 blocks)
 */

import { ROLE_CLUSTERS } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { extractBrickCore } from "../sprint/brickExtractor.js";
import { scoreBricksByCauchemar, selectGreedyCoverage } from "./selectors.js";

export function generateOnePager(
  bricks,
  targetRoleId,
  cauchemars,
  signature,
  offerSignals,
  candidateName,
  candidateEmail
) {
  var validated = (bricks || []).filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });

  if (validated.length < 2) {
    return "Forge au moins 2 briques pour générer ton One-Pager. L'outil a besoin de matériau.";
  }

  var armored = validated.filter(function (b) {
    return (b.armorScore || 0) >= 3;
  });
  var useArmored = armored.length >= 2;
  var pool = useArmored ? armored : validated;

  // Sort by armorScore descending
  pool.sort(function (a, b) {
    return (b.armorScore || 0) - (a.armorScore || 0);
  });
  var selected = pool.slice(0, 5);

  // Role label
  var cluster = ROLE_CLUSTERS.find(function (rc) {
    return rc.id === targetRoleId;
  });
  var roleLabel = cluster ? cluster.label.split(" / ")[0].toUpperCase() : "PROFESSIONNEL";

  // ── BLOC 1 — EN-TÊTE ──
  var headerBlock = roleLabel;
  if (signature && signature.formulation) {
    var sigWords = signature.formulation.split(/\s+/);
    if (sigWords.length <= 25) {
      headerBlock += "\n" + signature.formulation;
    }
  }

  // ── BLOC 2 — PREUVES D'IMPACT ──
  var impactLines = [];
  selected.forEach(function (b) {
    var core = extractBrickCore(b);
    var line = formatImpactLine(b, core, cauchemars);
    impactLines.push(line);
  });
  var impactBlock = impactLines.join("\n\n");

  // ── BLOC 3 — POURQUOI CE POSTE ──
  var whyBlock = buildWhyBlock(selected, targetRoleId, offerSignals, cluster, signature);

  // ── BLOC 4 — PARCOURS COMPRESSÉ ──
  var parcourBlock = buildParcourBlock(selected);

  // ── BLOC 5 — CONTACT ──
  var contactName = candidateName || "Prénom Nom";
  var contactEmail = candidateEmail || "email@domaine.com";
  var contactBlock = contactName + "\n" + contactEmail;

  // Assemblage
  var blocks = [];
  blocks.push(headerBlock);
  blocks.push("");
  blocks.push("— Preuves d'impact —");
  blocks.push(impactBlock);
  blocks.push("");
  blocks.push("— Pourquoi ce poste —");
  blocks.push(whyBlock);
  blocks.push("");
  blocks.push("— Parcours —");
  blocks.push(parcourBlock);
  blocks.push("");
  blocks.push(contactBlock);

  var result = cleanRedac(blocks.join("\n"), "livrable");

  if (!useArmored) {
    result += "\n\n[Blinde tes briques (3/4 minimum) pour un One-Pager calibré.]";
  }

  return result;
}

/**
 * Formats a single brick into a positive factual impact line.
 * Zero Abneg@tion vocabulary.
 */
function formatImpactLine(brick, core, cauchemars) {
  var type = brick.brickType || "preuve";
  var verb = core.actionVerb || "Obtenu";
  var number = core.resultNumber || core.mainNumber || "";
  var context = core.context || "";
  var constraint = core.constraint || "";

  // Find matching cauchemar for orientation
  var cauchContext = "";
  if (brick.kpi && cauchemars && cauchemars.length > 0) {
    var bKpi = (brick.kpi || "").toLowerCase();
    cauchemars.forEach(function (c) {
      if (cauchContext) return;
      var kpis = c.kpis || [];
      kpis.forEach(function (k) {
        if (cauchContext) return;
        if (bKpi.indexOf(k.toLowerCase().slice(0, 6)) !== -1 || k.toLowerCase().indexOf(bKpi.slice(0, 6)) !== -1) {
          cauchContext = c.label || "";
        }
      });
    });
  }

  if (type === "cicatrice" || type === "scar") {
    // Scar: lesson + corrective
    var scarLine = capitalizeFirst(verb);
    if (constraint) scarLine += " " + constraint.toLowerCase();
    if (number) scarLine += ". Résultat : " + number;
    if (context) scarLine += " (" + truncWords(context, 8) + ")";
    return scarLine + ".";
  }

  if (type === "élastique" || type === "elastic") {
    // Elastic: transferability
    var elastLine = "Méthode " + (verb ? verb.toLowerCase() : "appliquée");
    if (context) elastLine += " sur " + truncWords(context, 8);
    if (number) elastLine += ". Impact : " + number;
    return elastLine + ".";
  }

  // Default (proof): number + context + method
  var line = capitalizeFirst(verb);
  if (number) line += " " + number;
  if (context) line += " sur " + truncWords(context, 10);
  if (constraint) line += ", " + constraint.toLowerCase();
  return line + ".";
}

function buildWhyBlock(selected, targetRoleId, offerSignals, cluster, signature) {
  var roleLabel = cluster ? cluster.label.split(" / ")[0] : "ce rôle";

  // Candidate's own motivation overrides auto-generated text
  if (signature && signature.whyThisRole) {
    return signature.whyThisRole;
  }

  if (offerSignals && offerSignals.detected) {
    var signals = offerSignals.signals || [];
    var signalLabels = signals
      .slice(0, 3)
      .map(function (s) {
        return s.label || s.id;
      })
      .join(", ");
    var bestBrick = selected[0];
    var bestCore = extractBrickCore(bestBrick);
    var bestVerb = bestCore.actionVerb || "travaillé";
    var bestContext = bestCore.context || "";
    return (
      "Les enjeux identifiés (" +
      signalLabels +
      ") correspondent à mon terrain des dernières années. J'ai " +
      bestVerb.toLowerCase() +
      (bestContext ? " dans un contexte " + truncWords(bestContext, 8) : "") +
      ". Ce poste de " +
      roleLabel +
      " est la suite logique de ce parcours."
    );
  }

  // Generic transfer based on bricks
  var topBricks = selected.slice(0, 2);
  var verbs = topBricks
    .map(function (b) {
      var c = extractBrickCore(b);
      return c.actionVerb || "";
    })
    .filter(function (v) {
      return v;
    });
  var verbStr = verbs.length > 0 ? verbs.join(", ").toLowerCase() : "construit et piloté";
  return (
    "Le poste de " +
    roleLabel +
    " demande de prouver un impact mesurable. Les " +
    selected.length +
    " dernières années, j'ai " +
    verbStr +
    " avec des résultats chiffrés. Ce parcours prépare directement à ce rôle."
  );
}

function buildParcourBlock(selected) {
  // Try to extract company/context from bricks
  var lines = [];
  var seen = {};
  selected.forEach(function (b) {
    if (lines.length >= 3) return;
    var core = extractBrickCore(b);
    var context = core.context || "";
    var number = core.resultNumber || core.mainNumber || "";
    var verb = core.actionVerb || "";
    // Deduplicate by context
    var contextKey = context.toLowerCase().slice(0, 10);
    if (contextKey && seen[contextKey]) return;
    if (contextKey) seen[contextKey] = true;
    var parcourLine = verb ? capitalizeFirst(verb) : "Contribution";
    if (context) parcourLine += " — " + truncWords(context, 6);
    if (number) parcourLine += " — " + number;
    lines.push(parcourLine);
  });

  if (lines.length === 0) {
    return "Complète tes briques avec le contexte (entreprise, dates) pour que le parcours s'affiche.";
  }

  return lines.join("\n");
}

function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncWords(text, maxWords) {
  var words = text.split(/\s+/).slice(0, maxWords);
  return words.join(" ");
}
