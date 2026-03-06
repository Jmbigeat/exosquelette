/**
 * Brick structural extraction — compression layer (fix groupé generators)
 *
 * extractBrickCore extracts the key elements from a brick's raw text:
 * mainNumber, resultNumber, problemNumber, actionVerb, context, constraint.
 * Used by all generators to compress brick content instead of pasting raw text.
 *
 * @module lib/sprint/brickExtractor
 */

var ACTION_VERBS_PRIORITY = [
  "rattrapé", "réduit", "construit", "lancé", "restructuré", "négocié",
  "piloté", "déployé", "porté", "signé", "augmenté", "amélioré",
  "simplifié", "éliminé", "créé", "formé", "transposé", "adapté",
  "accéléré", "redressé", "reconquis", "relancé", "sécurisé",
];

var CONTEXT_MARKERS = [
  "mid-market", "enterprise", "b2b", "b2c", "saas", "smb", "pme", "eti",
  "startup", "scale-up", "grand compte", "comptes", "ae", "commerciaux",
  "personnes", "équipe", "mois", "semaines", "trimestres", "ans",
];

var CONSTRAINT_MARKERS = [
  "malgré", "alors que", "face à", "sans budget", "pas de", "le problème",
  "en pleine crise", "sous pression", "avec zéro", "aucun outil",
  "en l'absence de", "sans support",
];

/**
 * Extracts structural elements from a brick's raw text.
 * Used by all generators to compress brick content.
 *
 * @param {object} brick - validated brick
 * @returns {{
 *   mainNumber: string|null,
 *   resultNumber: string|null,
 *   problemNumber: string|null,
 *   actionVerb: string|null,
 *   context: string|null,
 *   constraint: string|null,
 *   kpiLabel: string|null,
 *   brickType: string
 * }}
 */
export function extractBrickCore(brick) {
  if (!brick || !brick.text) return {
    mainNumber: null, resultNumber: null, problemNumber: null,
    actionVerb: null, context: null, constraint: null,
    kpiLabel: null, brickType: brick ? (brick.brickType || "proof") : "proof",
  };

  var text = brick.text;
  var lower = text.toLowerCase();

  // 1. NUMBERS — find resultNumber vs problemNumber
  var resultNumber = null;
  var problemNumber = null;
  var mainNumber = null;

  // Pattern "passé de X à Y" or "de X à Y"
  var deAMatch = text.match(/(?:passé|porté|réduit|augmenté|amélioré)\s+de\s+([\d,.\s]+[%K€M]*)\s+[àa]\s+([\d,.\s]+[%K€M]*)/i);
  if (deAMatch) {
    problemNumber = deAMatch[1].trim();
    resultNumber = deAMatch[2].trim();
    mainNumber = resultNumber;
  }

  // Pattern "+X%" or "-X%"
  if (!mainNumber) {
    var deltaMatch = text.match(/([+\-]\d[\d,.\s]*%)/);
    if (deltaMatch) mainNumber = deltaMatch[1].trim();
  }

  // All numbers with suffixes
  var allNums = text.match(/([\d][\d\s.,]*\s*(?:K€|M€|k€|€|%|mois|semaines|comptes|AE|commerciaux|personnes|clients|projets|jours))/gi) || [];
  if (!mainNumber && allNums.length > 0) {
    // Last significant number = likely result
    mainNumber = allNums[allNums.length - 1].trim();
    if (allNums.length >= 2) {
      problemNumber = allNums[0].trim();
      resultNumber = allNums[allNums.length - 1].trim();
    } else {
      resultNumber = mainNumber;
    }
  }

  // Fallback: largest number
  if (!mainNumber) {
    var rawNums = text.match(/\d[\d\s.,]*/g) || [];
    var best = null;
    var bestVal = 0;
    rawNums.forEach(function(n) {
      var v = parseFloat(n.replace(/\s/g, "").replace(",", "."));
      if (!isNaN(v) && v > bestVal) { bestVal = v; best = n.trim(); }
    });
    if (best) mainNumber = best;
  }

  // 2. ACTION VERB
  var actionVerb = null;
  var lowerNorm = lower.replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
  for (var i = 0; i < ACTION_VERBS_PRIORITY.length; i++) {
    var verbNorm = ACTION_VERBS_PRIORITY[i].replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
    if (lowerNorm.indexOf(verbNorm) !== -1) {
      actionVerb = ACTION_VERBS_PRIORITY[i];
      break;
    }
  }
  // Fallback: first passé composé "j'ai ..."
  if (!actionVerb) {
    var pcMatch = lower.match(/j'ai\s+(\w+)/);
    if (pcMatch) actionVerb = pcMatch[1];
  }

  // 3. CONTEXT — segment, team size, duration (max 15 words)
  var context = null;
  var contextParts = [];
  CONTEXT_MARKERS.forEach(function(marker) {
    var idx = lower.indexOf(marker);
    if (idx !== -1) {
      // Extract surrounding words
      var start = Math.max(0, idx - 20);
      var end = Math.min(text.length, idx + marker.length + 30);
      var snippet = text.slice(start, end).replace(/[.,;:!?]+$/, "").trim();
      if (snippet.length > 3 && contextParts.length < 3) contextParts.push(snippet);
    }
  });
  if (contextParts.length > 0) {
    context = contextParts.join(". ");
    var words = context.split(/\s+/);
    if (words.length > 15) context = words.slice(0, 15).join(" ");
  }

  // 4. CONSTRAINT
  var constraint = null;
  for (var ci = 0; ci < CONSTRAINT_MARKERS.length; ci++) {
    var cIdx = lower.indexOf(CONSTRAINT_MARKERS[ci]);
    if (cIdx !== -1) {
      var cEnd = Math.min(text.length, cIdx + 80);
      var cSnippet = text.slice(cIdx, cEnd);
      var dotIdx = cSnippet.indexOf(".");
      if (dotIdx > 0) cSnippet = cSnippet.slice(0, dotIdx);
      var cWords = cSnippet.split(/\s+/);
      constraint = cWords.length > 15 ? cWords.slice(0, 15).join(" ") : cSnippet.trim();
      break;
    }
  }

  return {
    mainNumber: mainNumber,
    resultNumber: resultNumber || mainNumber,
    problemNumber: problemNumber,
    actionVerb: actionVerb,
    context: context,
    constraint: constraint,
    kpiLabel: brick.kpi || null,
    brickType: brick.brickType || "proof",
  };
}

/**
 * Formats the anchor line for bio bloc 1 using extractBrickCore.
 * Format: "{ActionVerb} {context} {mainNumber}." ≤ 210 chars.
 * @param {object} core - result of extractBrickCore
 * @returns {string}
 */
export function formatAnchorLine(core) {
  var parts = [];
  if (core.actionVerb) {
    parts.push(core.actionVerb.charAt(0).toUpperCase() + core.actionVerb.slice(1));
  }
  if (core.problemNumber && core.resultNumber && core.problemNumber !== core.resultNumber) {
    parts.push("de " + core.problemNumber + " à " + core.resultNumber);
  } else if (core.mainNumber) {
    parts.push(core.mainNumber);
  }
  if (core.context) parts.push(core.context);

  var line = parts.join(" ").replace(/\s+/g, " ").trim();
  if (line.length > 210) {
    // Prioritize: verb + number, cut context
    var shortParts = [];
    if (core.actionVerb) shortParts.push(core.actionVerb.charAt(0).toUpperCase() + core.actionVerb.slice(1));
    if (core.mainNumber) shortParts.push(core.mainNumber);
    line = shortParts.join(" ").trim();
    if (line.length > 210) line = line.slice(0, 207) + "...";
  }
  if (line.length > 0 && !/[.!]$/.test(line)) line += ".";
  return line || "Résultat prouvé sur le terrain.";
}

/**
 * Formats a compressed CV line using extractBrickCore.
 * Adapts format by brickType. ≤ 150 chars.
 * @param {object} core - result of extractBrickCore
 * @param {string} brickType - proof, scar, elastic, manual
 * @returns {string}
 */
export function formatCVLine(core, brickType) {
  var line = "";

  if (brickType === "scar" || brickType === "cicatrice") {
    // Scar: lesson verb + context + constraint
    var scarVerb = core.actionVerb || "Restructuré";
    scarVerb = scarVerb.charAt(0).toUpperCase() + scarVerb.slice(1);
    line = scarVerb;
    if (core.context) line += " " + core.context;
    if (core.constraint) line += " après " + core.constraint;
    else if (core.resultNumber) line += " — résultat : " + core.resultNumber;
  } else if (brickType === "elastic") {
    // Elastic: transferability verb
    var eVerb = core.actionVerb || "Transposé";
    eVerb = eVerb.charAt(0).toUpperCase() + eVerb.slice(1);
    line = eVerb;
    if (core.context) line += " " + core.context;
    if (core.resultNumber) line += " (" + core.resultNumber + ")";
  } else {
    // Proof/manual: action verb + number + context
    var verb = core.actionVerb || "Délivré";
    verb = verb.charAt(0).toUpperCase() + verb.slice(1);
    line = verb;
    if (core.problemNumber && core.resultNumber && core.problemNumber !== core.resultNumber) {
      line += " de " + core.problemNumber + " à " + core.resultNumber;
    } else if (core.mainNumber) {
      line += " " + core.mainNumber;
    }
    if (core.context) line += ", " + core.context;
  }

  line = line.replace(/\s+/g, " ").trim();
  if (line.length > 150) {
    // Cut context, keep verb + number
    var parts = [];
    var v = core.actionVerb || "Délivré";
    parts.push(v.charAt(0).toUpperCase() + v.slice(1));
    if (core.mainNumber) parts.push(core.mainNumber);
    line = parts.join(" ").trim();
    if (line.length > 150) line = line.slice(0, 147) + "...";
  }
  if (line.length > 0 && !/[.!]$/.test(line)) line += ".";
  return line;
}

/**
 * Checks if a brick text contains mentoring/training markers.
 * Used to improve cauchemar mapping (fix 4).
 * @param {string} text
 * @returns {boolean}
 */
export function hasMentoringMarkers(text) {
  if (!text) return false;
  var lower = text.toLowerCase();
  var markers = ["formé", "encadré", "mentoré", "ramp-up", "ramp up", "juniors", "shadowing", "coaching", "onboarding", "accompagné", "monté en compétence"];
  return markers.some(function(m) { return lower.indexOf(m) !== -1; });
}
