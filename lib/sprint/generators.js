import { KPI_REFERENCE, MARKET_DATA, STRESS_ANGLES, SCRIPT_CHANNELS, REPLACEMENT_DATA_BY_ROLE } from "./references.js";
import { cleanRedac } from "./redac.js";
import { getActiveCauchemars, formatCost, computeCauchemarCoverage, hashCode } from "./scoring.js";
import { hasNumbers, hasExternalization, hasDecisionMarkers, hasInfluenceMarkers, classifyCicatrice, extractBrickSummary } from "./analysis.js";
import { extractBrickCore, formatAnchorLine, formatCVLine as _formatCVLine, hasMentoringMarkers } from "./brickExtractor.js";
import { matchKpiToReference } from "./bricks.js";
import { parseOfferSignals, parseInternalSignals } from "./offers.js";
import { analyzeDiltsProgression } from "./dilts.js";

/**
 * Applies correction hints to generated text.
 * Hints are string instructions from the audit system.
 * @param {string} text - generated text
 * @param {string[]} hints - correction instructions
 * @param {object} ctx - context: { bricks, cauchemars, type }
 * @returns {string} adjusted text
 */
function applyHints(text, hints, ctx) {
  if (!hints || !Array.isArray(hints) || hints.length === 0) return text;
  var result = text;
  var bricks = (ctx && ctx.bricks) || [];
  var cauchemars = (ctx && ctx.cauchemars) || [];
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });

  hints.forEach(function(hint) {
    if (!hint) return;
    var h = hint.toLowerCase();

    // Hint: inject a specific number from bricks
    if (h.indexOf("chiffre") !== -1 || h.indexOf("contexte spécifique") !== -1) {
      var numBrick = validated.find(function(b) { return /\d/.test(b.text); });
      if (numBrick) {
        var num = extractBestNum(numBrick.text);
        if (num && result.indexOf(num) === -1) {
          // Insert the number reference before the last paragraph
          var lastBreak = result.lastIndexOf("\n\n");
          if (lastBreak > 0) {
            result = result.slice(0, lastBreak) + "\nPreuve : " + num + " — " + extractBrickSummary(numBrick.text) + result.slice(lastBreak);
          }
        }
      }
    }

    // Hint: start with cauchemar
    if (h.indexOf("cauchemar") !== -1 && h.indexOf("commence") !== -1) {
      var cauch = cauchemars.length > 0 ? cauchemars[0] : null;
      if (cauch && cauch.nightmareShort) {
        var lines = result.split("\n");
        var firstContent = -1;
        for (var i = 0; i < lines.length; i++) {
          if (lines[i].trim().length > 5 && !/^[A-ZÀ-Ú\s\-—]+$/.test(lines[i].trim())) { firstContent = i; break; }
        }
        if (firstContent >= 0 && lines[firstContent].toLowerCase().indexOf(cauch.nightmareShort.toLowerCase().slice(0, 10)) === -1) {
          lines.splice(firstContent, 0, cauch.nightmareShort);
          result = lines.join("\n");
        }
      }
    }

    // Hint: reduce length
    if (h.indexOf("réduis") !== -1 || h.indexOf("caractères") !== -1) {
      var limitMatch = hint.match(/(\d+)\s*car/);
      if (limitMatch) {
        var limit = parseInt(limitMatch[1]);
        if (result.length > limit) {
          var cut = result.lastIndexOf(".", limit - 3);
          if (cut > limit * 0.5) { result = result.slice(0, cut + 1); }
          else { result = result.slice(0, limit - 3) + "..."; }
        }
      }
    }

    // Hint: reorder CV sections (réalisations before compétences)
    if (h.indexOf("réalisations") !== -1 && h.indexOf("compétences") !== -1) {
      // Already handled by generator structure — CV puts bricks (results) first
    }

    // Hint: interview versions open on context
    if (h.indexOf("version entretien") !== -1 && h.indexOf("contexte") !== -1) {
      // Signal to restructure — handled at generation time
    }
  });

  return result;
}

export function extractBestNum(text) {
  var withSuffix = text.match(/([\+\-]?\d[\d\s.,]*\s*(?:K€|M€|k€|€|%|lignes?|modules?|mois|couverts?|tests?|sessions?|users?|clients?|projets?|tickets?|sprints?|jours?|heures?|semaines?))/i);
  if (withSuffix) return withSuffix[1].replace(/\s+/g, " ").trim();
  var all = text.match(/[\+\-]?\d[\d\s.,]*/g);
  if (!all) return null;
  var best = null;
  var bestVal = 0;
  all.forEach(function(m) {
    var v = parseFloat(m.replace(/\s/g, "").replace(",", "."));
    if (!isNaN(v) && v > bestVal) { bestVal = v; best = m.trim(); }
  });
  return best;
}

/* Génère un résumé Fossé chiffré pour le diagnostic */
export function computeFosseMarket(salaire) {
  var sal = salaire || MARKET_DATA.fosse.salaire_median_cadre;
  var minPerte = Math.round(sal * MARKET_DATA.fosse.ecart_salaire_marche.min / 100);
  var maxPerte = Math.round(sal * MARKET_DATA.fosse.ecart_salaire_marche.max / 100);
  return {
    salaire: sal,
    perteMensuelleMin: Math.round(minPerte / 12),
    perteMensuelleMax: Math.round(maxPerte / 12),
    perteAnnuelleMin: minPerte,
    perteAnnuelleMax: maxPerte,
    contexte: MARKET_DATA.fosse.part_augmentes_changement + "% des cadres qui changent sont augmentés. " + MARKET_DATA.fosse.part_augmentes_meme_poste + "% de ceux qui restent.",
    ecartGain: "+" + MARKET_DATA.fosse.gain_changement_employeur + "% en changeant vs +" + MARKET_DATA.fosse.gain_sans_changement + "% en restant.",
    intentionVsAction: MARKET_DATA.reconversion.projet_reconversion + "% veulent bouger. " + MARKET_DATA.reconversion.demarches_entamees + "% bougent. Le Fossé est là.",
  };
}



export function generateCV(bricks, targetRoleId, trajectoryToggle, hints) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Aucune brique validée. Le CV se construit à partir de tes preuves.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleTitle = roleData ? roleData.role.toUpperCase() : "PROFESSIONNEL";

  // Score + greedy select (same logic as CVPreview)
  var cauchemars = getActiveCauchemars();
  var TARGET_BRICKS = 5;
  var scored = validated.map(function(b) {
    var score = 0;
    if (b.kpi && cauchemars.some(function(c) { return c.kpis.some(function(k) { return b.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf((b.kpi || "").slice(0, 6)) !== -1; }); })) score += 10;
    if (/\d/.test(b.text)) score += 5;
    if (/via|grâce à|méthode|process|déployé|mis en place|construit|structuré/i.test(b.text)) score += 3;
    if (b.elasticity === "élastique") score += 2;
    return { brick: b, score: score };
  });
  scored.sort(function(a, b) { return b.score - a.score; });

  var selected = [];
  var coveredCauchIds = {};
  scored.forEach(function(s) {
    if (selected.length >= TARGET_BRICKS) return;
    var coversNew = s.brick.kpi && cauchemars.some(function(c) {
      if (coveredCauchIds[c.id]) return false;
      return c.kpis.some(function(k) { return s.brick.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf(s.brick.kpi.slice(0, 6)) !== -1; });
    });
    if (coversNew) {
      selected.push(s);
      cauchemars.forEach(function(c) {
        if (c.kpis.some(function(k) { return s.brick.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf(s.brick.kpi.slice(0, 6)) !== -1; })) coveredCauchIds[c.id] = true;
      });
    }
  });
  scored.forEach(function(s) {
    if (selected.length >= TARGET_BRICKS) return;
    if (selected.indexOf(s) === -1) selected.push(s);
  });

  var cvBricks = selected.map(function(s) { return s.brick; });
  var coveredCount = Object.keys(coveredCauchIds).length;

  // Séparer briques side project / expérience pro.
  // Ne jamais mélanger les briques side project et les briques d'expérience salariée dans le même bloc.
  var proBricks = cvBricks.filter(function(b) { return !b.sideProject; });
  var sideBricks = cvBricks.filter(function(b) { return b.sideProject; });

  // Header
  var cv = roleTitle + "\n";
  cv += cvBricks.length + " preuves \u00B7 " + coveredCount + "/" + cauchemars.length + " cauchemars couverts\n";
  cv += "\n[Poste] \u2014 [Entreprise] ([Dates])\n\n";

  // Bricks pro via generateCVLine (source unique CV + Préparation entretien)
  proBricks.forEach(function(b) {
    cv += "\u2022 " + generateCVLine(b, targetRoleId) + "\n";
  });

  // Bloc side project séparé
  if (sideBricks.length > 0) {
    cv += "\nSIDE PROJECT \u2014 [Nom] ([Dates])\n\n";
    sideBricks.forEach(function(b) {
      cv += "\u2022 " + generateCVLine(b, targetRoleId) + "\n";
    });
  }

  cv += "\nFormation\n[Diplôme] \u2014 [École] ([Année])";
  cv = applyHints(cv, hints, { bricks: bricks, type: "cv" });
  return cleanRedac(cv, "livrable");
}


/* ── Bio helpers — Framework D (Fait Anchor) ── */

var BIO_NIGHTMARE_NARRATIVES = [
  { match: /stagnation|portefeuille/i, text: "Le portefeuille stagnait trimestre après trimestre. L'équipe compensait par du volume. Le problème était ailleurs." },
  { match: /churn|rétention|retention/i, text: "Le churn montait. Les relances se multipliaient. Les comptes partaient quand même." },
  { match: /deals|cycle|outils/i, text: "Les deals traînaient. Le pipe affiché ne matchait plus le closing réel. Personne ne creusait le décalage." },
];

var BIO_PATTERN_CATEGORIES = {
  reduction: { verbs: ["réduit", "simplifié", "éliminé", "concentré", "resserré", "ciblé"], text: "Mon réflexe : réduire avant de scaler. Identifier le levier bloqué avant de multiplier les actions." },
  construction: { verbs: ["construit", "lancé", "créé", "déployé", "mis en place", "structuré"], text: "Mon réflexe : structurer avant d'exécuter. Le process précède le volume." },
  recuperation: { verbs: ["rattrapé", "relancé", "reconquis", "redressé", "rétabli"], text: "Mon réflexe : isoler la cause avant de traiter le symptôme. Le pipe gelé a toujours une raison." },
  optimisation: { verbs: ["amélioré", "augmenté", "accéléré", "porté"], text: "Mon réflexe : mesurer le bon indicateur. Le volume masque souvent le vrai problème." },
};

var BIO_VOCAB_INTERDIT = [
  /\bpassionn[ée]e?s?\b/gi, /\bpassion\b/gi, /\bdynamiques?\b/gi,
  /\bproactifs?\b/gi, /\bproactives?\b/gi,
  /\borient[ée]e?s? r[ée]sultats\b/gi,
  /\bforte? de\b/gi, /\bdot[ée]e?s? de\b/gi,
  /\briche exp[ée]rience\b/gi, /\breconnue? pour\b/gi,
  /\bexperte? en\b/gi, /\bn'h[ée]sitez pas\b/gi,
  /\bouvert(e|es)? aux opportunit[ée]s\b/gi,
  /\b[àa] l'[ée]coute du march[ée]\b/gi,
  /\ben qu[êe]te de nouveaux d[ée]fis\b/gi,
];

function bioStripVocabInterdit(text) {
  var r = text;
  BIO_VOCAB_INTERDIT.forEach(function(re) { r = r.replace(re, ""); });
  return r.replace(/  +/g, " ").replace(/\s+\./g, ".").replace(/\.\s*\./g, ".").trim();
}

function bioBuildAnchorText(brick) {
  var core = extractBrickCore(brick);
  return formatAnchorLine(core);
}

function bioBuildNightmareNarrative(cauchemar) {
  for (var i = 0; i < BIO_NIGHTMARE_NARRATIVES.length; i++) {
    if (BIO_NIGHTMARE_NARRATIVES[i].match.test(cauchemar.label)) return BIO_NIGHTMARE_NARRATIVES[i].text;
  }
  return cauchemar.nightmareShort || null;
}

function bioDetectPattern(validated) {
  var keys = Object.keys(BIO_PATTERN_CATEGORIES);
  var bestKey = null;
  var bestCount = 0;
  keys.forEach(function(key) {
    var cat = BIO_PATTERN_CATEGORIES[key];
    var count = 0;
    validated.forEach(function(b) {
      var t = (b.text || "").toLowerCase();
      if (cat.verbs.some(function(v) { return t.indexOf(v) !== -1; })) count++;
    });
    if (count >= 2 && count > bestCount) { bestCount = count; bestKey = key; }
  });
  return bestKey ? BIO_PATTERN_CATEGORIES[bestKey].text : null;
}

/**
 * generateBio — Framework D (Fait Anchor)
 * Produces a LinkedIn bio optimized for recruiter validation.
 * 4 blocks: anchor fact (≤ 210 chars), nightmare context (≤ 400 chars),
 * pattern (≤ 300 chars), CTA.
 * @param {Array} bricks - brick array (text, status, armorScore, hasNumbers, brickType, kpi, elasticity)
 * @param {object} vault - contains selectedPillars (unused in Framework D)
 * @param {boolean} trajectoryToggle - unused, preserved for signature compatibility
 * @returns {string} bio text via cleanRedac
 */
export function generateBio(bricks, vault, trajectoryToggle, hints) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return cleanRedac("Profil en cours de construction.", "livrable");

  // BLOC 1 — ANCRAGE (≤ 210 car.)
  var anchor = validated.slice().sort(function(a, b) {
    var armorDiff = (b.armorScore || 0) - (a.armorScore || 0);
    if (armorDiff !== 0) return armorDiff;
    if (b.hasNumbers && !a.hasNumbers) return 1;
    if (a.hasNumbers && !b.hasNumbers) return -1;
    return 0;
  })[0];
  var anchorText = bioBuildAnchorText(anchor);

  // BLOC 2 — CAUCHEMAR IMPLICITE (≤ 400 car.)
  var nightmareText = null;
  var strongestCauchemar = null;
  var strongestCount = 0;
  getActiveCauchemars().forEach(function(c) {
    var count = validated.filter(function(b) {
      return c.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
    }).length;
    if (count > 0 && count > strongestCount) { strongestCount = count; strongestCauchemar = c; }
  });
  if (strongestCauchemar) nightmareText = bioBuildNightmareNarrative(strongestCauchemar);

  // BLOC 3 — PATTERN (≤ 300 car.)
  var patternText = validated.length >= 3 ? bioDetectPattern(validated) : null;

  // BLOC 4 — CTA (fixe) + assemblage
  var blocks = [anchorText];
  if (nightmareText) blocks.push(nightmareText);
  if (patternText) blocks.push(patternText);
  blocks.push("Un message suffit.");

  var bioRaw = bioStripVocabInterdit(blocks.join("\n\n"));
  bioRaw = applyHints(bioRaw, hints, { bricks: bricks, cauchemars: getActiveCauchemars(), type: "bio" });
  return cleanRedac(bioRaw, "livrable");
}

/* ==============================
   ITEM 2 — DOUBLE SORTIE PAR BRIQUE
   CV 6sec + Entretien 3 interlocuteurs
   ============================== */

var CV_SCAR_VERBS = ["Restructuré", "Corrigé", "Renforcé", "Redressé", "Repensé"];
var CV_ELASTIC_VERBS = ["Transposé", "Adapté", "Répliqué", "Étendu", "Appliqué"];
var CV_ACTION_VERBS = ["Rattrapé", "Réduit", "Construit", "Lancé", "Restructuré", "Négocié", "Piloté", "Déployé", "Porté", "Augmenté"];

/**
 * Generates a CV-optimized line for a single validated brick.
 * Format: action verb + number + minimal context. ≤ 150 characters.
 * Adapts verb by brickType (proof, scar, elastic, manual).
 * @param {object} brick - a single validated brick
 * @param {string} targetRoleId - target role
 * @returns {string} CV line (≤ 150 characters)
 */
export function generateCVLine(brick, targetRoleId, hints) {
  var core = extractBrickCore(brick);
  return _formatCVLine(core, brick.brickType || "proof");
}

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
      matchedCauch = cauchemars.find(function(c) {
        return c.label && /montée|management|équipe|ramp|onboard|formation/i.test(c.label);
      });
    }
    if (!matchedCauch) {
      matchedCauch = cauchemars.find(function(c) {
        return c.kpis && c.kpis.some(function(kpi) {
          return brick.kpi && brick.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
        });
      });
    }
  }
  var cauchLabel = matchedCauch ? matchedCauch.label.toLowerCase() : "un enjeu terrain";
  var costRef = matchedCauch && matchedCauch.costRange ? formatCost(matchedCauch.costRange[0]) + " - " + formatCost(matchedCauch.costRange[1]) + " / an" : null;

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
    direction += "Le delta est réplicable sur votre périmètre" + (costRef ? ". Coût sectoriel si non résolu : " + costRef : "") + ".\n";
    direction += "Mon approche : appliquer le même cadre, calibré au contexte, avec un ROI mesurable en 90 jours.";
  } else {
    direction += "L'enjeu P&L : " + cauchLabel + (costRef ? " — coût sectoriel : " + costRef : "") + ".\n";
    direction += "Décision prise : " + actionVerb + (context ? " — " + context : "") + ".\n";
    direction += "Impact mesuré : " + delta + ".\n";
    direction += "Ce résultat se reproduit quand on applique la même rigueur de mesure au bon périmètre.";
  }

  rh = applyHints(rh, hints, { bricks: [brick], cauchemars: cauchemars, type: "interview_prep" });
  n1 = applyHints(n1, hints, { bricks: [brick], cauchemars: cauchemars, type: "interview_prep" });
  direction = applyHints(direction, hints, { bricks: [brick], cauchemars: cauchemars, type: "interview_prep" });
  return { rh: rh, n1: n1, direction: direction };
}


export function generateScript(bricks, targetRoleId) {
  var result = generateContactScripts(bricks, targetRoleId);
  return result ? result.email : "[Script produit après validation de tes briques.]";
}

/* ==============================
   ITEM 6 — SCRIPT 4 VARIANTES + GRILLE 6 TESTS
   ============================== */


export function generatePlan90(bricks, targetRoleId, offersArray) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return null;

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  if (!roleData) return null;

  var cadence = roleData.cadence; // 30, 90, or 180
  var roleName = roleData.role;

  // Get cauchemars from offer or defaults
  var activeCauchs = getActiveCauchemars();
  if (offersArray && offersArray.length > 0) {
    var parsed = parseOfferSignals(offersArray[0].text, targetRoleId);
    if (parsed && parsed.cauchemars && parsed.cauchemars.length >= 3) activeCauchs = parsed.cauchemars;
  }

  // Match cauchemars to bricks (sorted by cost descending)
  var sortedCauchs = activeCauchs.slice().sort(function(a, b) { return (b.costRange[1] || 0) - (a.costRange[1] || 0); });
  var cauchWithBrick = [];
  sortedCauchs.forEach(function(c) {
    var matchBrick = validated.find(function(b) {
      return c.kpis && c.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
    });
    cauchWithBrick.push({ cauchemar: c, brick: matchBrick || null });
  });

  // Get Take
  var takeBrick = bricks.find(function(b) { return b.brickType === "take" && b.status === "validated"; });
  var takeText = takeBrick ? takeBrick.text : null;

  // Phase structure depends on cadence
  var phases = [];

  if (cadence <= 30) {
    // MENSUEL: 3 rendez-vous de souveraineté en 90 jours
    phases = [
      { label: "Semaines 1-4", tag: "DIAGNOSTIC + QUICK WIN", rdvSouverainete: "1er Rendez-vous de Souveraineté (J30)", color: "#e94560" },
      { label: "Semaines 5-8", tag: "EXECUTION + PREUVE", rdvSouverainete: "2e Rendez-vous de Souveraineté (J60)", color: "#ff9800" },
      { label: "Semaines 9-12", tag: "SYSTEME + MESURE", rdvSouverainete: "3e Rendez-vous de Souveraineté (J90)", color: "#4ecca3" },
    ];
  } else if (cadence <= 90) {
    // TRIMESTRIEL: 1 rendez-vous de souveraineté à J90
    phases = [
      { label: "Semaines 1-4", tag: "IMMERSION + DIAGNOSTIC", rdvSouverainete: null, color: "#e94560" },
      { label: "Semaines 5-8", tag: "PREMIERS ARBITRAGES", rdvSouverainete: null, color: "#ff9800" },
      { label: "Semaines 9-12", tag: "LIVRAISON + BILAN", rdvSouverainete: "Rendez-vous de Souveraineté (J90)", color: "#4ecca3" },
    ];
  } else {
    // SEMESTRIEL: J90 = mi-parcours
    phases = [
      { label: "Semaines 1-4", tag: "CARTOGRAPHIE POLITIQUE", rdvSouverainete: null, color: "#e94560" },
      { label: "Semaines 5-8", tag: "PREMIERS SIGNAUX", rdvSouverainete: null, color: "#ff9800" },
      { label: "Semaines 9-12", tag: "POINT MI-CYCLE", rdvSouverainete: "Mi-parcours vers le 1er Rendez-vous de Souveraineté (J180)", color: "#4ecca3" },
    ];
  }

  // Role-specific action templates
  var roleActions = {
    enterprise_ae: {
      phase1: ["Cartographier les 5 comptes stratégiques et leur cycle de décision", "Identifier le deal bloqué le plus coûteux et diagnostiquer le blocage", "Poser la question discovery au N+1 : ''{Q}''"],
      phase2: ["Débloquer 1 deal en appliquant la méthode multi-décideurs", "Documenter le before/after avec chiffre de pipeline", "Installer le rituel de revue hebdo avec le VP Sales"],
      phase3: ["Mesurer le delta de win rate depuis l'arrivée", "Présenter le ROI des 90 jours au COMEX", "Définir les 3 prochains comptes cibles avec le même playbook"],
    },
    head_of_growth: {
      phase1: ["Auditer les 3 canaux principaux et leur CAC réel", "Identifier l'expérimentation la plus rentable en cours", "Poser la question : quel canal a été abandonné trop tôt ?"],
      phase2: ["Lancer 2 expérimentations ciblées sur le canal sous-exploité", "Mesurer LTV/CAC par cohorte, pas en moyenne", "Couper 1 canal qui consomme du budget sans preuve de conversion"],
      phase3: ["Présenter le delta de CAC et les cohortes avant/après", "Proposer le plan Q2 avec budget et hypothèses testables", "Documenter la méthode pour qu'elle survive sans toi"],
    },
    strategic_csm: {
      phase1: ["Lister les 10 comptes à risque de churn avec date de renouvellement", "Identifier le compte le plus rentable avec le NRR le plus faible", "Poser la question au client : quel problème personne ne résout ?"],
      phase2: ["Sauver 1 compte à risque avec un plan d'action documenté", "Déclencher 1 upsell sur un besoin détecté (pas sur un pitch produit)", "Mesurer le NRR avant/après intervention"],
      phase3: ["Présenter le delta de churn sauvé en euros", "Créer le playbook de détection précoce pour l'équipe", "Identifier les 3 comptes d'expansion pour Q2"],
    },
    senior_pm: {
      phase1: ["Cartographier les 3 arbitrages produit en attente depuis plus de 2 mois", "Identifier la feature en production qui n'a bougé aucune métrique", "Poser la question à l'engineering : quel chantier est en cours sans sponsor ?"],
      phase2: ["Tuer 1 feature ou 1 projet sans impact mesurable", "Aligner engineering et business sur 1 métrique north star", "Livrer 1 quick win visible avec adoption mesurée"],
      phase3: ["Présenter le ROI des décisions prises (features tuées + livrées)", "Documenter les 3 prochains arbitrages du Q2", "Mesurer l'adoption du quick win à J90"],
    },
    ai_architect: {
      phase1: ["Auditer les projets IA en cours : combien en production vs POC", "Identifier le cas d'usage bloqué depuis plus de 3 mois", "Mesurer le coût d'infra actuel vs le ROI réel de chaque déploiement"],
      phase2: ["Débloquer 1 cas d'usage avec un périmètre réduit et mesurable", "Proposer 1 arbitrage build vs buy sur un modèle", "Former 1 équipe métier à l'usage autonome de l'outil IA"],
      phase3: ["Présenter le ROI du cas d'usage débloqué", "Documenter l'architecture de décision pour les prochains projets", "Mesurer le taux d'adoption interne avant/après intervention"],
    },
    engineering_manager: {
      phase1: ["Mesurer le cycle time réel (commit to deploy) sur les 3 derniers mois", "Identifier le dev le plus à risque de départ (signaux faibles)", "Cartographier la dette technique par impact business"],
      phase2: ["Réduire 1 friction dans le pipeline de livraison", "Conduire 1 entretien de rétention avec le talent à risque", "Arbitrer 1 décision build vs buy bloquée"],
      phase3: ["Présenter le delta de cycle time", "Documenter la décision build vs buy et son résultat", "Proposer le plan de rétention Q2 avec métriques"],
    },
    management_consultant: {
      phase1: ["Livrer le diagnostic en 2 semaines, pas en 6", "Identifier la recommandation que le COMEX refuse d'entendre", "Chiffrer le coût de l'inaction sur le problème principal"],
      phase2: ["Faire accepter 1 recommandation difficile avec données à l'appui", "Accompagner l'implémentation (pas juste livrer le slide deck)", "Mesurer le premier indicateur d'impact"],
      phase3: ["Présenter l'impact EBITDA de l'intervention", "Laisser un playbook utilisable sans consultant", "Poser la question : quel problème adjacent émerge ?"],
    },
    strategy_associate: {
      phase1: ["Cartographier les 3 dossiers stratégiques ouverts et leur sponsor", "Identifier le signal faible que personne n'a encore formalisé", "Comprendre l'alignement politique du COMEX sur chaque dossier"],
      phase2: ["Produire 1 analyse qui change la décision sur un dossier", "Aligner 2 membres du COMEX sur une position commune", "Documenter le raisonnement, pas juste la conclusion"],
      phase3: ["Présenter le delta de décision : qu'est-ce qui a changé grâce à l'analyse", "Préparer le cadrage du prochain cycle semestriel", "Identifier les 2 signaux faibles pour le S2"],
    },
    operations_manager: {
      phase1: ["Cartographier les 3 frictions inter-services les plus coûteuses en temps", "Mesurer la charge cognitive de l'équipe (nombre d'outils, étapes manuelles)", "Poser la question à chaque service : quel process vous fait perdre le plus de temps ?"],
      phase2: ["Éliminer 1 friction inter-services avec un process documenté", "Automatiser 1 tâche répétitive avec ROI mesurable", "Mesurer le temps gagné en heures par semaine"],
      phase3: ["Présenter le delta de friction et le temps libéré", "Documenter le process pour qu'il survive sans toi", "Identifier les 3 prochaines frictions à traiter en Q2"],
    },
    fractional_coo: {
      phase1: ["Diagnostiquer où le CEO passe son temps vs où il devrait le passer", "Identifier le process manquant qui coûte le plus cher", "Aligner les N-1 sur les 3 priorités du trimestre"],
      phase2: ["Installer 1 process de gouvernance qui libère le CEO de 5h/semaine", "Mesurer le runway impact de chaque décision opérationnelle", "Conduire le premier comité de pilotage structuré"],
      phase3: ["Présenter le ROI du temps libéré pour le CEO", "Documenter la gouvernance pour qu'elle fonctionne sans présence quotidienne", "Proposer le plan Q2 avec jalons et métriques"],
    },
  };

  var actions = roleActions[targetRoleId] || roleActions.enterprise_ae;

  // Inject cauchemar-specific content into phase 1
  var cauch1 = cauchWithBrick[0] || null;
  var cauch2 = cauchWithBrick[1] || null;
  var cauch3 = cauchWithBrick[2] || null;

  var plan = {
    role: roleName,
    cadence: cadence,
    cadenceLabel: roleData.cadenceLabel,
    phases: phases.map(function(p, i) {
      var phaseActions = i === 0 ? actions.phase1 : i === 1 ? actions.phase2 : actions.phase3;
      var targetCauch = i === 0 ? cauch1 : i === 1 ? cauch2 : cauch3;
      return {
        label: p.label,
        tag: p.tag,
        rdvSouverainete: p.rdvSouverainete,
        color: p.color,
        actions: phaseActions,
        cauchemar: targetCauch ? targetCauch.cauchemar.label : null,
        cauchemarCost: targetCauch ? formatCost(targetCauch.cauchemar.costRange[0]) + "-" + formatCost(targetCauch.cauchemar.costRange[1]) : null,
        brick: targetCauch && targetCauch.brick ? targetCauch.brick.cvVersion || targetCauch.brick.text : null,
      };
    }),
    take: takeText,
    ouverture: cauch1 ? "Le cauchemar le plus coûteux (" + cauch1.cauchemar.label + ", " + formatCost(cauch1.cauchemar.costRange[0]) + "-" + formatCost(cauch1.cauchemar.costRange[1]) + "/an) est votre priorité semaine 1." : null,
  };

  return plan;
}


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
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
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
  var covered = coverage.filter(function(c) { return c.covered; });
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role : "ce poste";

  var strongestCauchemar = null;
  var strongestBrick = null;
  covered.forEach(function(cc) {
    var cauch = activeCauchs.find(function(c) { return c.id === cc.id; });
    if (!cauch) {
      // Try matching by label/kpi for offer-specific cauchemars
      cauch = activeCauchs.find(function(c) {
        return c.kpis && c.kpis.some(function(kpi) { return cc.kpi && cc.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
      });
    }
    if (!cauch) return;
    if (!strongestCauchemar || cauch.costRange[1] > strongestCauchemar.costRange[1]) {
      var coveringBrick = validated.find(function(b) {
        return cauch.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
      });
      if (coveringBrick) { strongestCauchemar = cauch; strongestBrick = coveringBrick; }
    }
  });
  if (!strongestBrick) strongestBrick = validated[0];

  var cauchText = strongestCauchemar ? strongestCauchemar.nightmareShort : "";
  // Fix 6+7: compress brick reference via extractBrickCore
  var brickCore = strongestBrick ? extractBrickCore(strongestBrick) : null;
  var brickCompressed = brickCore ? _formatCVLine(brickCore, strongestBrick.brickType || "proof") : "";
  var brickText = strongestBrick ? strongestBrick.text : "";
  var brickCv = brickCompressed || (strongestBrick && strongestBrick.cvVersion ? strongestBrick.cvVersion : brickText);

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
  email += diltsClosing + "Je ne sais pas si c'est pertinent pour votre contexte. Mais si ce sujet résonne, j'ai une question :\n\n";
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
  n1 += cauchText ? cauchText + " C'est un problème que j'ai résolu concrètement.\n\n" : "Votre équipe recrute sur un sujet que j'ai vécu de l'intérieur.\n\n";
  n1 += brickText + "\n\n";
  n1 += "La méthode est reproductible. " + triggerQ + " " + closeQ + "\n\n";
  n1 += "[Prénom Nom]";

  // D. RH — parcours, trajectoire, culture fit
  var rh = "Bonjour [Prénom],\n\n";
  rh += cauchText ? cauchText + " " : "";
  rh += brickCv + "\n\n";
  if (strongestBrick && strongestBrick.interviewVersions) {
    rh += strongestBrick.interviewVersions.rh.length > 200 ? strongestBrick.interviewVersions.rh.slice(0, 200) + "..." : strongestBrick.interviewVersions.rh;
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
    email: cleanEmail, dm: cleanDm, n1: cleanN1, rh: cleanRh,
    diltsProgression: {
      dm: { opening: dmProgression.opens, closing: dmProgression.closes, delta: dmProgression.progression },
      email: { opening: emailProgression.opens, closing: emailProgression.closes, delta: emailProgression.progression },
    },
  };
}



export function scoreContactScript(text, bricks, cauchemars) {
  if (!text || text.length < 20) return { score: 0, tests: [] };
  var lower = text.toLowerCase();

  // 1. MIROIR — première phrase parle du destinataire
  var firstLine = text.split("\n").filter(function(l) { return l.trim().length > 5; })[0] || "";
  var firstLower = firstLine.toLowerCase();
  var miroir = firstLower.indexOf("vous") !== -1 || firstLower.indexOf("votre") !== -1 || firstLower.indexOf("[prénom]") !== -1 || firstLower.indexOf("[prenom]") !== -1;
  var miroirFail = firstLower.indexOf("je ") < 3 && firstLower.indexOf("je ") !== -1 && !miroir;

  // 2. CAUCHEMAR — nomme un cauchemar spécifique
  var activeCauch = cauchemars || getActiveCauchemars();
  var hasCauchemar = activeCauch.some(function(c) {
    return c.nightmareShort && lower.indexOf(c.nightmareShort.toLowerCase().slice(0, 20)) !== -1;
  });
  if (!hasCauchemar) {
    hasCauchemar = lower.indexOf("cauchemar") !== -1 || lower.indexOf("problème") !== -1 || lower.indexOf("coûte") !== -1 || lower.indexOf("coute") !== -1;
  }

  // 3. PREUVE ASYMÉTRIQUE — ouvre une question au lieu de fermer
  var hasQuestion = text.indexOf("?") !== -1;
  var hasProof = bricks.some(function(b) {
    return b.status === "validated" && b.text && lower.indexOf(b.text.toLowerCase().slice(0, 20)) !== -1;
  });
  var preuveAsym = hasQuestion && hasProof;

  // 4. COÛT DU NON — coût de ne pas répondre
  var coutDuNon = lower.indexOf("coûte") !== -1 || lower.indexOf("coute") !== -1 || lower.indexOf("perd") !== -1 || lower.indexOf("trimestre") !== -1 || lower.indexOf("par an") !== -1 || lower.indexOf("chaque mois") !== -1 || lower.indexOf("manque") !== -1;

  // 5. SORTIE FACILE — question de fin légère
  var lastLines = text.split("\n").filter(function(l) { return l.trim().length > 3; });
  var lastMeaningful = "";
  for (var i = lastLines.length - 1; i >= 0; i--) {
    if (lastLines[i].indexOf("?") !== -1) { lastMeaningful = lastLines[i]; break; }
  }
  var sortieFacile = lastMeaningful.length > 0 && lastMeaningful.length < 120;

  // 6. DILTS — monte d'au moins 1 niveau
  var diltsP = analyzeDiltsProgression(text);
  var diltsOk = diltsP.progression >= 1;

  var tests = [
    { id: "miroir", label: "Miroir", desc: "La première phrase parle du destinataire", passed: miroir && !miroirFail, fix: "Commence par 'vous' ou par le problème du destinataire, pas par 'je'." },
    { id: "cauchemar", label: "Cauchemar", desc: "Nomme un problème spécifique", passed: hasCauchemar, fix: "Ajoute le cauchemar du décideur issu de l'offre." },
    { id: "preuve", label: "Preuve asymétrique", desc: "Ouvre une question au lieu de la fermer", passed: preuveAsym, fix: "Inclus une preuve chiffrée ET termine par une question." },
    { id: "cout", label: "Coût du non", desc: "Le coût de ne pas répondre est visible", passed: coutDuNon, fix: "Ajoute le coût en euros ou en temps du problème non résolu." },
    { id: "sortie", label: "Sortie facile", desc: "La question de fin est légère", passed: sortieFacile, fix: "Termine par une question courte, facile à répondre." },
    { id: "dilts", label: "Registre", desc: "Monte d'au moins 1 niveau logique", passed: diltsOk, fix: "Ouvre sur du concret (fait, chiffre) et ferme sur de la vision (conviction, identité)." },
  ];

  var passed = tests.filter(function(t) { return t.passed; }).length;
  var score = Math.round(passed * 1.67);
  if (score > 10) score = 10;

  return { score: score, tests: tests, passedCount: passed };
}




export function generateTransitionScript(bricks, sourceRoleId, targetAlt) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0 || !targetAlt) return null;

  // Find strongest elastic brick that matches the alternative role
  var bestBrick = null;
  validated.forEach(function(b) {
    if (b.elasticity === "élastique" && !bestBrick) bestBrick = b;
  });
  if (!bestBrick) bestBrick = validated[0];

  var altRoleData = KPI_REFERENCE[targetAlt.roleId] ? KPI_REFERENCE[targetAlt.roleId] : null;
  var altRoleLabel = altRoleData ? altRoleData.role : "ce poste";
  var sourceRoleData = sourceRoleId && KPI_REFERENCE[sourceRoleId] ? KPI_REFERENCE[sourceRoleId] : null;
  var sourceRoleLabel = sourceRoleData ? sourceRoleData.role : "mon poste actuel";

  var script = "Bonjour [Prénom],\n\n";
  script += "Mon titre actuel ne matche pas votre offre " + altRoleLabel + ". Je viens de " + sourceRoleLabel + ".\n\n";
  script += "Mais votre besoin m'a interpellé. " + bestBrick.text + "\n\n";
  script += "Ce résultat s'est produit dans un autre contexte. Je suis convaincu qu'il se transpose chez vous.\n\n";
  script += "Je propose 30 minutes pour vous montrer comment. Si ça ne colle pas, vous n'avez rien perdu.\n\n";
  script += "[Prénom]";
  return script;
}


export function generateImpactReport(bricks, vault, targetRoleId, trajectoryToggle, density) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var takes = bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; });
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;

  var chiffreBricks = validated.filter(function(b) { return b.brickCategory === "chiffre"; });
  var decisionBricks = validated.filter(function(b) { return b.brickCategory === "decision"; });
  var influenceBricks = validated.filter(function(b) { return b.brickCategory === "influence"; });
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });

  var coverage = computeCauchemarCoverage(bricks);
  var coveredCount = coverage.filter(function(c) { return c.covered; }).length;

  var report = "RAPPORT D'IMPACT -- Forge #1\n\n";
  report += "Profil : " + (roleData ? roleData.role : "Non défini") + "\n";
  report += "Mode : " + (trajectoryToggle === "j_y_suis" ? "J'y suis" : trajectoryToggle === "j_y_vais" ? "J'y vais" : "Non défini") + "\n";
  report += "Densité atteinte : " + (density ? density.score : 0) + "%\n\n";

  report += "BRIQUES FORGÉES : " + validated.length + "\n";
  if (chiffreBricks.length > 0) report += "- " + chiffreBricks.length + " brique" + (chiffreBricks.length > 1 ? "s" : "") + " chiffre\n";
  if (decisionBricks.length > 0) report += "- " + decisionBricks.length + " brique" + (decisionBricks.length > 1 ? "s" : "") + " décision\n";
  if (influenceBricks.length > 0) report += "- " + influenceBricks.length + " brique" + (influenceBricks.length > 1 ? "s" : "") + " influence\n";
  if (cicatrices.length > 0) report += "- " + cicatrices.length + " cicatrice" + (cicatrices.length > 1 ? "s" : "") + "\n";

  report += "\nCAUCHEMARS COUVERTS : " + coveredCount + "/" + getActiveCauchemars().length + "\n";

  coverage.forEach(function(c) {
    var cauch = getActiveCauchemars().find(function(cc) { return cc.id === c.id; });
    report += "- " + c.label + " -- " + (c.covered ? "couvert" : "NON COUVERT") + "\n";
    if (c.covered && cauch) {
      report += "  Coût direct : " + formatCost(cauch.costRange[0]) + "-" + formatCost(cauch.costRange[1]) + "/an\n";
      if (cauch.costSymbolique) report += "  Coût symbolique : " + cauch.costSymbolique + "\n";
      if (cauch.costSystemique) report += "  Coût systémique : " + cauch.costSystemique + "\n";
    }
  });

  report += "\nKPIS ÉLASTIQUES DOCUMENTÉS : " + elasticBricks.length + "\n";
  elasticBricks.forEach(function(b) {
    report += "- " + (b.kpi || "Non classé") + " (élastique)\n";
  });

  var unfairBrick = bricks.find(function(b) { return b.type === "unfair_advantage" && b.status === "validated"; });
  if (unfairBrick) {
    report += "\nAVANTAGE INJUSTE IDENTIFIÉ\n";
    report += "- " + unfairBrick.text + "\n";
    var matchingElastic = elasticBricks.find(function(eb) {
      return eb.text && unfairBrick.text && eb.kpi === unfairBrick.kpi;
    });
    if (matchingElastic) {
      report += "  Confirmé par brique chiffre + signal collègues. Non-rattrapable par la formation.\n";
    }
  }

  var zones = computeZones(bricks, targetRoleId);
  if (zones) {
    if (zones.excellence.length > 0) {
      report += "\nZONE D'EXCELLENCE\n";
      zones.excellence.forEach(function(z) {
        report += "- " + z.kpi + " -- " + z.brickCount + " preuve" + (z.brickCount > 1 ? "s" : "") + " (" + z.types.join(", ") + ")\n";
      });
    }
    if (zones.rupture.length > 0) {
      report += "\nZONE DE RUPTURE\n";
      zones.rupture.forEach(function(z) {
        report += "- " + z.kpi + " -- " + z.reason + "\n";
      });
    }

    if (zones.profileGrid.length > 0) {
      report += "\nPROFIL DE VALEUR\n";
      zones.profileGrid.forEach(function(p) {
        report += (p.checked ? "[x] " : "[ ] ") + p.label + (p.checked ? " -- " + p.proof : "") + "\n";
      });
    }
  }

  report += "\nPRISES DE POSITION : " + takes.length + "\n";
  if (takes.length === 0) report += "- Aucune take formulée. Le prochain Rendez-vous reposera la question.\n";
  takes.forEach(function(t) { report += "- " + (t.text.length > 60 ? t.text.slice(0, 60) + "..." : t.text) + "\n"; });

  report += "\nPROCHAIN RENDEZ-VOUS : " + (roleData ? roleData.cadenceLabel : "dans 30 jours") + "\n";
  report += "Ce rapport s'épaissit à chaque Rendez-vous de Souveraineté. Les briques s'accumulent. Le levier grandit.";
  return cleanRedac(report);
}

/* ==============================
   ZONE D'EXCELLENCE / RUPTURE — Item 8
   ============================== */


export function computeZones(bricks, roleId) {
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;
  if (!roleData) return null;
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take" && b.brickType !== "unfair_advantage"; });
  if (validated.length < 2) return null;

  var kpis = roleData.kpis;
  var excellence = [];
  var rupture = [];

  kpis.forEach(function(kpi) {
    var matchingBricks = validated.filter(function(b) {
      return b.kpi && b.kpi.toLowerCase().indexOf(kpi.name.toLowerCase().slice(0, 6)) !== -1;
    });
    if (matchingBricks.length >= 2) {
      var types = [];
      matchingBricks.forEach(function(b) {
        var t = b.brickCategory || b.brickType || "chiffre";
        if (types.indexOf(t) === -1) types.push(t);
      });
      var hasDepth = types.length >= 2 || matchingBricks.some(function(b) { return b.brickCategory === "decision" || b.brickType === "cicatrice"; });
      if (hasDepth) {
        excellence.push({ kpi: kpi.name, brickCount: matchingBricks.length, types: types, elasticity: kpi.elasticity });
      }
    } else if (matchingBricks.length === 0) {
      rupture.push({ kpi: kpi.name, reason: "Aucune preuve documentée", elasticity: kpi.elasticity });
    } else if (matchingBricks.length === 1 && !matchingBricks[0].brickCategory !== "decision") {
      rupture.push({ kpi: kpi.name, reason: "1 preuve fragile (sans arbitrage ni cicatrice)", elasticity: kpi.elasticity });
    }
  });

  // 9-PROFILE GRID
  var profileGrid = [
    { id: "hunter", label: "Chasseur", check: function() { return bricks.some(function(b) { return b.status === "validated" && b.kpi && (b.kpi.toLowerCase().indexOf("pipeline") !== -1 || b.kpi.toLowerCase().indexOf("prospection") !== -1); }); }, proofFn: function() { return "Brique pipeline/prospection validée"; } },
    { id: "zero_to_one", label: "Créateur 0-to-1", check: function() { return validated.some(function(b) { return b.text && (b.text.toLowerCase().indexOf("from scratch") !== -1 || b.text.toLowerCase().indexOf("de zero") !== -1 || b.text.toLowerCase().indexOf("cree") !== -1 || b.text.toLowerCase().indexOf("lance") !== -1 || b.text.toLowerCase().indexOf("construit") !== -1); }); }, proofFn: function() { return "Contexte de création identifié dans une brique"; } },
    { id: "regular", label: "Régulier", check: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre"; }).length >= 3; }, proofFn: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre"; }).length + " briques chiffre (indice de régularité)"; } },
    { id: "track_record", label: "Track record blindé", check: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre" && hasNumbers(b.text); }).length >= 2; }, proofFn: function() { return "2+ briques chiffrées avec données quantifiées"; } },
    { id: "builder", label: "Constructeur", check: function() { return validated.some(function(b) { return b.brickCategory === "influence"; }) && validated.some(function(b) { return b.brickCategory === "decision"; }); }, proofFn: function() { return "Briques influence + décision (structure, pas juste exécute)"; } },
    { id: "specialist", label: "Spécialiste vertical", check: function() {
      var kpiNames = validated.map(function(b) { return b.kpi; }).filter(function(k) { return k; });
      var unique = []; kpiNames.forEach(function(k) { if (unique.indexOf(k) === -1) unique.push(k); });
      return unique.length <= 3 && validated.length >= 3;
    }, proofFn: function() { return "Toutes les preuves concentrées sur le même segment"; } },
    { id: "cicatrice", label: "Maturité (cicatrices)", check: function() { return bricks.filter(function(b) { return b.brickType === "cicatrice" && b.status === "validated"; }).length >= 1; }, proofFn: function() { return bricks.filter(function(b) { return b.brickType === "cicatrice" && b.status === "validated"; }).length + " échec(s) assumé(s)"; } },
    { id: "terrain", label: "Terrain (non-remote)", check: function() { return validated.some(function(b) { return b.text && (b.text.toLowerCase().indexOf("terrain") !== -1 || b.text.toLowerCase().indexOf("salon") !== -1 || b.text.toLowerCase().indexOf("face") !== -1 || b.text.toLowerCase().indexOf("deplacement") !== -1); }); }, proofFn: function() { return "Mentions de terrain dans les briques"; } },
    { id: "takes", label: "Voix (prises de position)", check: function() { return bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; }).length >= 1; }, proofFn: function() { return bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; }).length + " take(s) formulée(s)"; } },
  ];

  var grid = profileGrid.map(function(p) {
    var checked = p.check();
    return { label: p.label, checked: checked, proof: checked ? p.proofFn() : "" };
  });

  return { excellence: excellence, rupture: rupture, profileGrid: grid };
}

/* ==============================
   POST LINKEDIN GENERATOR — cauchemar + these + situation + question
   ============================== */


export function generateDiagnosticQuestions(bricks, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  if (validated.length < 2) return [];

  var questions = [];

  // Find strongest decision brick
  var decisionBricks = validated.filter(function(b) { return b.brickCategory === "decision"; });
  if (decisionBricks.length > 0) {
    var db = decisionBricks[0];
    questions.push({
      type: "arbitrage",
      color: "#9b59b6",
      level1: "Comment les arbitrages stratégiques sont-ils pris ici ? Qui tranche quand les équipes ne s'alignent pas ?",
      level2: "J'ai dû arbitrer entre " + (db.text.length > 50 ? db.text.slice(0, 50) + "..." : db.text) + ". Ici, quelle est la décision difficile que personne ne veut prendre pour atteindre les objectifs du prochain trimestre ?",
      logic: "Basée sur ta brique décision la plus forte. Tu as la crédibilité de poser cette question parce que tu as déjà traversé un arbitrage similaire.",
      brickRef: db.text.length > 60 ? db.text.slice(0, 60) + "..." : db.text,
    });
  }

  // Find strongest influence brick
  var influenceBricks = validated.filter(function(b) { return b.brickCategory === "influence"; });
  if (influenceBricks.length > 0) {
    var ib = influenceBricks[0];
    questions.push({
      type: "friction",
      color: "#3498db",
      level1: "Comment l'alignement entre les équipes fonctionne-t-il au quotidien ? Quels sont les points de friction les plus fréquents ?",
      level2: "J'ai aligné des équipes qui ne reportaient pas à moi sur des sujets similaires. Ici, comment gérez-vous le conflit d'intérêt entre la vision produit et la réalité commerciale ?",
      logic: "Basée sur ta brique influence. Tu montres que tu penses en dynamique politique, pas en organigramme.",
      brickRef: ib.text.length > 60 ? ib.text.slice(0, 60) + "..." : ib.text,
    });
  }

  // Cauchemar-based question (always)
  if (getActiveCauchemars().length > 0) {
    var cauchemar = getActiveCauchemars()[0];
    var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
    questions.push({
      type: "efficience",
      color: "#e94560",
      level1: "L'offre mentionne " + cauchemar.label.toLowerCase() + ". Qu'est-ce qui a été tenté avant pour résoudre ce problème ?",
      level2: "Ce type de problème coûte entre " + formatCost(cauchemar.costRange[0]) + " et " + formatCost(cauchemar.costRange[1]) + " par an dans la plupart des structures que je connais. Si rien ne change dans les 6 prochains mois, quel est l'impact sur vos objectifs ?",
      logic: "Basée sur le cauchemar principal de l'offre. Tu montres que tu penses en coût du problème, pas en coût salarial.",
      brickRef: cauchemar.label,
    });
  }

  // Cicatrice-based question (if exists)
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  if (cicatrices.length > 0) {
    questions.push({
      type: "saillance",
      color: "#ff9800",
      level1: "Quel a été le dernier échec marquant de l'équipe et qu'est-ce qui a changé après ?",
      level2: "J'ai moi-même perdu un deal majeur en sous-estimant la politique interne. Ça m'a forcé à changer de méthode. Ici, comment la culture de l'équipe traite-t-elle les échecs ? Est-ce qu'on en parle ou est-ce qu'on les enterre ?",
      logic: "Basée sur ta cicatrice. Tu as la crédibilité de parler d'échec parce que tu as assumé le tien. Le recruteur mesure ta maturité et la culture de l'entreprise en même temps.",
      brickRef: cicatrices[0].text.length > 60 ? cicatrices[0].text.slice(0, 60) + "..." : cicatrices[0].text,
    });
  }

  return questions.slice(0, 4);
}



export function translateCVPerception(cvText, cauchemars) {
  var cvLower = (cvText || "").toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
  var perceptions = [];
  cauchemars.forEach(function(c) {
    var kwFound = [];
    var kwMissing = [];
    (c.kpis || []).forEach(function(kpi) {
      var words = kpi.toLowerCase().split(/[\s\/\(\)]+/).filter(function(w) { return w.length > 3; });
      words.forEach(function(w) {
        var wNorm = w.replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
        if (cvLower.indexOf(wNorm) !== -1) { if (kwFound.indexOf(w) === -1) kwFound.push(w); }
        else { if (kwMissing.indexOf(w) === -1) kwMissing.push(w); }
      });
    });
    (c.matchedKw || c.kw || []).forEach(function(kw) {
      var kwNorm = kw.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
      if (cvLower.indexOf(kwNorm) !== -1 && kwFound.indexOf(kw) === -1) kwFound.push(kw);
    });
    var hasActivity = kwFound.length > 0;
    var hasProof = /\d+\s*[%kKmM€]/.test(cvText);
    var status = "silence";
    var perception = "";
    if (hasActivity && hasProof) {
      status = "activite_chiffree";
      perception = "Tu mentionnes " + kwFound.slice(0, 2).join(", ") + " avec un chiffre. Le recruteur lit : piste. Pas encore preuve blindée.";
    } else if (hasActivity && !hasProof) {
      status = "activite_sans_preuve";
      perception = "Tu mentionnes " + kwFound.slice(0, 2).join(", ") + ". Le recruteur lit : activité. Pas résultat. Il passe.";
    } else {
      status = "silence";
      perception = "Le recruteur cherche un remède à \"" + c.label + ".\" Ton CV : silence.";
    }
    perceptions.push({
      cauchemar: c.label,
      cauchemarId: c.id,
      status: status,
      perception: perception,
      kwFound: kwFound,
      kwMissing: kwMissing,
      costRange: c.costRange,
    });
  });
  return perceptions;
}


export function generateSampleTransformation(cvText, cauchemars, roleId) {
  if (!cvText || cvText.trim().length < 20) return null;
  var lines = cvText.split(/[\n\r]+/).filter(function(l) { return l.trim().length > 15; });
  if (lines.length === 0) return null;
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;
  var bestLine = null;
  var bestScore = 0;
  var bestCauch = null;
  lines.forEach(function(line) {
    var lineLow = line.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
    cauchemars.forEach(function(c) {
      var score = 0;
      (c.matchedKw || []).forEach(function(kw) {
        if (lineLow.indexOf(kw.toLowerCase().replace(/[éèê]/g, "e")) !== -1) score += 2;
      });
      (c.kpis || []).forEach(function(kpi) {
        kpi.toLowerCase().split(/[\s\/]+/).filter(function(w) { return w.length > 3; }).forEach(function(w) {
          if (lineLow.indexOf(w.replace(/[éèê]/g, "e")) !== -1) score++;
        });
      });
      var hasNumber = /\d/.test(line);
      if (!hasNumber) score += 1;
      if (score > bestScore) { bestScore = score; bestLine = line.trim(); bestCauch = c; }
    });
  });
  if (!bestLine || bestScore < 1) {
    bestLine = lines.reduce(function(a, b) { return a.length > b.length ? a : b; }).trim();
    bestCauch = cauchemars[0];
  }
  var cleanLine = bestLine.replace(/^[\-\•\*\u2022\u2013\u2014]\s*/, "").trim();
  var kpiLabel = bestCauch && bestCauch.kpis ? bestCauch.kpis[0] : "";
  var elasticTag = roleData ? roleData.kpis.find(function(k) { return k.name === kpiLabel && k.elasticity === "élastique"; }) : null;
  var afterLine = cleanLine;
  if (!/\d+\s*%/.test(cleanLine)) {
    afterLine = cleanLine.replace(/gestion d[eu']/gi, "Réduction de 22% à 4% du churn sur").replace(/pilotage d[eu']/gi, "Accélération de +35% du").replace(/mise en place/gi, "Déploiement en 3 mois de").replace(/responsable d[eu']/gi, "Restructuration complète de").replace(/suivi d[eu']/gi, "Amélioration de +28% de");
    if (afterLine === cleanLine) {
      afterLine = cleanLine + " — résultat : [chiffre à extraire pendant la Forge]";
    }
  } else {
    afterLine = cleanLine;
  }
  return {
    before: cleanLine,
    after: afterLine,
    cauchemar: bestCauch ? bestCauch.label : "",
    kpi: kpiLabel,
    isElastic: !!elasticTag,
    isSimulated: afterLine.indexOf("[chiffre a extraire") !== -1 || afterLine !== cleanLine,
  };
}


export function generateDiagnostic(cvText, offerText, roleId) {
  var signals = parseOfferSignals(offerText, roleId);
  if (!signals) return null;
  var cauchemars = signals.cauchemars;
  var perceptions = translateCVPerception(cvText, cauchemars);
  var transformation = generateSampleTransformation(cvText, cauchemars, roleId);
  var coveredCount = perceptions.filter(function(p) { return p.status !== "silence"; }).length;
  var proofCount = perceptions.filter(function(p) { return p.status === "activite_chiffree"; }).length;
  var totalCauchemars = cauchemars.length;
  var fossePct = totalCauchemars > 0 ? Math.round(((totalCauchemars - proofCount) / totalCauchemars) * 100) : 100;
  return {
    bloc1: { cauchemars: cauchemars, urgency: signals.urgencyScore, urgencyHits: signals.urgencyHits },
    bloc2: { perceptions: perceptions },
    bloc3: { coveredCount: coveredCount, proofCount: proofCount, totalCauchemars: totalCauchemars, fossePct: fossePct },
    bloc4: { transformation: transformation },
    signals: signals,
  };
}


export function generateAdvocacyText(text, category, type, nightmareText) {
  if (!text || text.length < 20) return null;
  var num = extractBestNum(text);

  if (type === "cicatrice") {
    if (nightmareText && num) return "Il a déjà vécu exactement le scénario qu'on redoute. Son échec lui a coûté " + num + ". Il sait ce qui casse et comment corriger. On ne trouvera pas quelqu'un qui connaît mieux ce piège.";
    if (nightmareText) return "Il a traversé le même type de crise que celle qu'on essaie d'éviter. Il l'assume et il sait ce qu'il ne refera pas. C'est une assurance qu'aucun autre candidat ne peut offrir.";
    return num
      ? "Il a assumé un échec qui a coûté " + num + ". Il a corrigé le tir. C'est rare à ce niveau. La plupart des candidats mentent ou esquivent."
      : "Il a traversé une situation difficile et il l'assume sans détour. Il sait ce qu'il ne refera pas. C'est un profil qui apprend de ses erreurs, pas quelqu'un qui les cache.";
  }
  if (category === "decision") {
    if (nightmareText && num) return "Il a tranché un arbitrage à " + num + " sur un sujet qui ressemble au nôtre. Il sait ce qu'on sacrifie et ce qu'on gagne. Il ne découvrira pas le problème — il l'a déjà résolu.";
    if (nightmareText) return "Il a pris une décision difficile sur un problème similaire au nôtre. Il connaît les pièges. Il ne va pas tâtonner pendant 6 mois — il sait déjà où aller.";
    return num
      ? "Il a tranché un arbitrage à " + num + ". Il explique pourquoi il a choisi cette option et ce qu'il a sacrifié. Ce n'est pas un exécutant. Il décide sous pression."
      : "Il a pris une décision difficile et il assume les conséquences. Il ne cherche pas le consensus. Il tranche et il avance.";
  }
  if (category === "influence") {
    if (nightmareText && num) return "Il a débloqué des résistances sur un sujet comparable au nôtre. Résultat : " + num + ". Il sait naviguer la politique sur ce type de problème. C'est exactement ce qu'on cherche.";
    if (nightmareText) return "Il a aligné des gens sur un sujet similaire au nôtre. Il connaît les résistances qu'on va rencontrer parce qu'il les a déjà retournées.";
    return num
      ? "Il a aligné des gens qui ne voulaient pas s'aligner. Le résultat : " + num + ". Ce n'est pas un manager de process. Il sait naviguer la politique."
      : "Il a débloqué une situation humaine. Il sait lire les résistances et les retourner. C'est le genre de personne qu'on met sur les sujets bloqués.";
  }
  // Default: chiffre brick
  if (nightmareText && num) {
    return "Il a résolu exactement le problème qu'on a en ce moment. Son chiffre : " + num + ". Il sait de quoi il parle parce qu'il l'a déjà fait.";
  }
  if (nightmareText) {
    return "Il a déjà travaillé sur le même type de problème que le nôtre. Il ne part pas de zéro. C'est un avantage qu'on ne retrouvera pas chez les autres candidats.";
  }
  if (num) {
    return "Son résultat clé : " + num + ". Il mesure ce qu'il fait. Il ne parle pas en impressions. Il y a un avant et un après son passage.";
  }
  return "Il a un parcours concret. Il parle de ce qu'il a fait, pas de ce qu'il ferait. C'est un profil opérationnel qui produit des résultats mesurables.";
}



export function generateInternalAdvocacy(text, category, type, elasticity) {
  if (!text || text.length < 20) return null;
  var num = extractBestNum(text);
  var isElastic = elasticity === "élastique";

  if (type === "cicatrice") {
    return "Tu es la mémoire de ce qui a échoué et pourquoi. Si tu pars, l'équipe refait les mêmes erreurs. Personne d'autre n'a vécu cette correction.";
  }
  if (category === "decision") {
    var base = "Tu es celui qui tranche quand tout le monde hésite.";
    if (num) base += " Ton dernier arbitrage a pesé " + num + ".";
    base += isElastic
      ? " Cette capacité n'est pas remplaçable par un outil ou un process. Elle part avec toi."
      : " Le remplacement prendra 6 mois minimum. Le coût de l'indécision en attendant est invisible mais réel.";
    return base;
  }
  if (category === "influence") {
    return "Tu es la personne qui débloque les situations humaines. Les alignements que tu as construits tiennent parce que tu les maintiens. Si tu pars, les frictions reviennent en 3 mois."
      + (num ? " Impact documenté : " + num + "." : "");
  }
  // Default: chiffre
  if (num && isElastic) {
    return "Ton résultat de " + num + " repose sur ta méthode. Pas sur un outil qu'on peut transférer. Si tu pars, le résultat part avec toi. Le recrutement de ton remplacement coûtera 6-9 mois de salaire. Le trou de production entre les deux n'a pas de prix.";
  }
  if (num) {
    return "Tu produis " + num + ". Ton remplacement coûtera du temps (6-9 mois de recrutement + intégration) et de l'argent (cabinet + formation). Pendant ce temps, ce résultat disparaît.";
  }
  return "Tu portes un savoir opérationnel que l'entreprise n'a pas documenté. Si tu pars, il faut 6 mois pour que ton remplacement atteigne ta vitesse actuelle. C'est un coût que ton N+1 ne voit pas aujourd'hui.";
}


export function generateStressTest(brick, targetRoleId, offersArray) {
  if (!brick || !brick.text) return null;
  var text = brick.text.toLowerCase();
  var angles = [];

  // ===== SOURCE 1: ANGLES GÉNÉRIQUES (toujours présents) =====

  // Angle 1 : Contexte vs mérite (toujours pertinent)
  var ctxPool = STRESS_ANGLES.contexte;
  angles.push({
    type: "contexte",
    label: "Contexte favorable ?",
    attack: ctxPool[Math.abs(hashCode(brick.id + "ctx")) % ctxPool.length],
    defense: "Isole ton action du contexte. Cite la mesure avant/après TON intervention. Si le marché aidait tout le monde, pourquoi tes collègues n'ont pas le même résultat ?",
    source: "generique",
  });

  // Angle 2 : Selon le type de brique
  if (brick.brickType === "cicatrice") {
    var echPool = STRESS_ANGLES.echec;
    angles.push({
      type: "echec",
      label: "Échec assumé ou subi ?",
      attack: echPool[Math.abs(hashCode(brick.id + "ech")) % echPool.length],
      defense: "Montre ce que l'échec t'a appris. La cicatrice vaut par la décision que tu prends APRÈS. Pas par la douleur.",
      source: "generique",
    });
  } else if (brick.brickCategory === "decision" || brick.brickCategory === "influence") {
    var colPool = STRESS_ANGLES.collectif;
    angles.push({
      type: "collectif",
      label: "Contribution individuelle ?",
      attack: colPool[Math.abs(hashCode(brick.id + "col")) % colPool.length],
      defense: "Identifie TA décision. Pas le résultat collectif. La décision que TU as prise et que personne d'autre n'aurait prise de la même façon.",

      source: "generique",
    });
  } else {
    var cauPool = STRESS_ANGLES.causalite;
    angles.push({
      type: "causalite",
      label: "Causalité prouvée ?",
      attack: cauPool[Math.abs(hashCode(brick.id + "cau")) % cauPool.length],
      defense: "Montre la méthode. Avant X, après Y. Ce qui a changé entre les deux, c'est ton action. Chiffre + périmètre + timeline.",
      source: "generique",
    });
  }

  // Angle 3 : Reproductibilité (toujours pertinent)
  var repPool = STRESS_ANGLES.reproductibilite;
  angles.push({
    type: "reproductibilite",
    label: "Reproductible ici ?",
    attack: repPool[Math.abs(hashCode(brick.id + "rep")) % repPool.length],
    defense: "Identifie le principe transférable. Pas le contexte spécifique. Ce que tu feras chez eux, c'est appliquer la même logique à LEUR problème.",

    source: "generique",
  });

  // ===== SOURCE 2: ATTAQUES TIRÉES DE L'OFFRE =====
  if (offersArray && offersArray.length > 0) {
    var offerText = offersArray[0].text || "";
    var offerLower = offerText.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u");
    var offerAttack = null;

    // Detect signals in offer and build specific attacks
    var hasAutonomie = offerLower.indexOf("autonomi") !== -1 || offerLower.indexOf("seul") !== -1 || offerLower.indexOf("independan") !== -1;
    var hasHyperCroissance = offerLower.indexOf("forte croissance") !== -1 || offerLower.indexOf("hyper") !== -1 || offerLower.indexOf("scale") !== -1;
    var hasRestructuration = offerLower.indexOf("restructur") !== -1 || offerLower.indexOf("transformation") !== -1 || offerLower.indexOf("reorganis") !== -1;
    var hasExigeant = offerLower.indexOf("exigean") !== -1 || offerLower.indexOf("pression") !== -1 || offerLower.indexOf("rythme soutenu") !== -1 || offerLower.indexOf("fast-paced") !== -1;
    var hasCreationPoste = offerLower.indexOf("creation de poste") !== -1 || offerLower.indexOf("nouveau poste") !== -1 || offerLower.indexOf("premiere recrue") !== -1;
    var hasInternational = offerLower.indexOf("international") !== -1 || offerLower.indexOf("multi-pays") !== -1 || offerLower.indexOf("emea") !== -1 || offerLower.indexOf("global") !== -1;
    var hasRemplacement = offerLower.indexOf("remplace") !== -1 || offerLower.indexOf("succession") !== -1 || offerLower.indexOf("depart") !== -1;

    if (hasAutonomie) {
      offerAttack = {
        type: "offre_autonomie",
        label: "Autonomie ou isolement ?",
        attack: "Le recruteur dira : 'L'offre mentionne une forte autonomie. Votre dernier poste incluait une équipe structurée. Donnez-moi un exemple où vous avez délivré un résultat seul, sans support.'",
        defense: "Cite un projet où tu as porté le résultat de A à Z sans équipe. Si tu n'en as pas, sois honnête : ton atout est de structurer là où rien n'existe. C'est un atout d'autonomie.",
        source: "offre",
      };
    } else if (hasHyperCroissance) {
      offerAttack = {
        type: "offre_croissance",
        label: "Rythme de croissance ?",
        attack: "Le recruteur dira : 'On double chaque année. Votre expérience est dans une structure stable. Qu'est-ce qui prouve que vous tiendrez le rythme quand les process changent tous les 3 mois ?'",
        defense: "Montre un moment où tout a changé autour de toi et où tu as produit un résultat malgré le chaos. La croissance casse les process. Ton atout c'est de livrer sans process.",
        source: "offre",
      };
    } else if (hasRestructuration) {
      offerAttack = {
        type: "offre_restructuration",
        label: "Gestion de crise ?",
        attack: "Le recruteur dira : 'Le contexte ici est une restructuration. Les gens partent. Le moral est bas. Qu'est-ce que vous faites les 90 premiers jours quand personne ne veut coopérer ?'",
        defense: "Cite une situation de tension où tu as obtenu un résultat malgré la résistance. Le recruteur cherche quelqu'un qui avance quand les autres freinent.",
        source: "offre",
      };
    } else if (hasExigeant) {
      offerAttack = {
        type: "offre_pression",
        label: "Résistance à la pression ?",
        attack: "Le recruteur dira : 'L'environnement ici est exigeant. Le dernier sur ce poste n'a pas tenu 8 mois. Qu'est-ce qui vous rend différent ?'",
        defense: "Ne dis pas 'je gère le stress.' Cite un trimestre où tout a déraillé et montre le résultat que tu as quand même sorti. Le chiffre parle. Pas l'adjectif.",
        source: "offre",
      };
    } else if (hasCreationPoste) {
      offerAttack = {
        type: "offre_creation",
        label: "Poste sans précédent ?",
        attack: "Le recruteur dira : 'C'est une création de poste. Il n'y a pas de fiche de poste claire. Pas de prédécesseur. Comment vous définissez vos priorités quand personne ne sait ce qu'on attend de vous ?'",
        defense: "Montre un moment où tu as défini le périmètre toi-même. Le recruteur cherche quelqu'un qui structure le flou. Cite ta méthode pour identifier les 3 premiers quick wins.",
        source: "offre",
      };
    } else if (hasInternational) {
      offerAttack = {
        type: "offre_international",
        label: "Contexte international ?",
        attack: "Le recruteur dira : 'Le poste couvre plusieurs pays. Les fuseaux horaires, les cultures, les réglementations diffèrent. Votre expérience est franco-française. Comment vous gérez ?'",
        defense: "Cite une collaboration cross-country, un projet multi-fuseaux ou une négociation interculturelle. Si tu n'en as pas, montre ta capacité d'adaptation sur un changement de contexte radical.",
        source: "offre",
      };
    } else if (hasRemplacement) {
      offerAttack = {
        type: "offre_remplacement",
        label: "Comparaison au prédécesseur ?",
        attack: "Le recruteur dira : 'Vous remplacez quelqu'un qui avait 8 ans d'ancienneté. L'équipe lui était loyale. Comment vous gagnez la confiance d'une équipe qui ne vous a pas choisi ?'",
        defense: "Ne critique jamais le prédécesseur. Cite un moment où tu as pris un poste après quelqu'un et où tu as gagné la confiance par un résultat rapide. Le premier quick win efface la comparaison.",
        source: "offre",
      };
    }

    if (offerAttack) angles.push(offerAttack);
  }

  // ===== SOURCE 3: ATTAQUES TIRÉES DU MARCHÉ / RÔLE =====
  if (targetRoleId) {
    var roleData = KPI_REFERENCE[targetRoleId];
    var marketAttack = null;

    // Extract numbers from brick text to compare with market benchmarks
    var numbers = text.match(/\d+/g);
    var hasSmallNumbers = numbers && numbers.some(function(n) { return parseInt(n) < 20; });
    var hasPercentage = text.indexOf("%") !== -1;

    if (targetRoleId === "enterprise_ae" && (text.indexOf("cycle") !== -1 || text.indexOf("deal") !== -1 || text.indexOf("vente") !== -1)) {
      marketAttack = {
        type: "marche_cycle",
        label: "Benchmark marché ?",
        attack: "Le recruteur dira : 'Le cycle de vente moyen dans notre secteur est de 6 à 9 mois. Vos chiffres viennent d'un cycle transactionnel beaucoup plus court. Comment vous transférez cette compétence sur du enterprise long ?'",
        defense: "Sépare la méthode du cycle. Ta méthode de qualification, de multi-threading, de gestion du champion fonctionne quel que soit le cycle. Cite l'étape du process que tu as améliorée, pas le résultat final.",
        source: "marche",
      };
    } else if (targetRoleId === "head_of_growth" && (text.indexOf("acquisition") !== -1 || text.indexOf("lead") !== -1 || text.indexOf("canal") !== -1 || text.indexOf("cac") !== -1)) {
      marketAttack = {
        type: "marche_cac",
        label: "CAC et scalabilité ?",
        attack: "Le recruteur dira : 'Votre CAC était bas parce que votre marché n'était pas saturé. Ici la concurrence a fait exploser les coûts d'acquisition. Votre méthode tient encore quand le CPM triple ?'",
        defense: "Montre que ta méthode a fonctionné PENDANT une hausse des coûts, pas juste dans un marché vierge. Si tu as diversifié les canaux quand un s'est fermé, c'est la preuve.",
        source: "marche",
      };
    } else if (targetRoleId === "strategic_csm" && (text.indexOf("churn") !== -1 || text.indexOf("retention") !== -1 || text.indexOf("nrr") !== -1 || text.indexOf("upsell") !== -1)) {
      marketAttack = {
        type: "marche_churn",
        label: "Churn structurel ?",
        attack: "Le recruteur dira : 'Le churn moyen SaaS est de 5-7% annuel. Votre taux était déjà en dessous avant votre arrivée. Qu'avez-vous réellement changé ?'",
        defense: "Isole le segment que tu as traité. Le churn global masque les segments. Montre le segment le plus risqué et ce que tu as fait dessus. Le delta est ta preuve.",
        source: "marche",
      };
    } else if (targetRoleId === "senior_pm" && (text.indexOf("feature") !== -1 || text.indexOf("roadmap") !== -1 || text.indexOf("produit") !== -1 || text.indexOf("discovery") !== -1)) {
      marketAttack = {
        type: "marche_feature",
        label: "Impact produit réel ?",
        attack: "Le recruteur dira : 'En moyenne, 80% des features lancées n'ont pas d'impact mesurable. Comment vous mesurez que votre feature a réellement bougé une métrique, et pas juste fait plaisir à un stakeholder ?'",
        defense: "Cite la métrique AVANT et APRÈS le lancement. Si tu n'as pas mesuré l'impact post-lancement, sois honnête et montre comment tu structurerais la mesure ici.",
        source: "marche",
      };
    } else if (targetRoleId === "engineering_manager" && (text.indexOf("equipe") !== -1 || text.indexOf("recrutement") !== -1 || text.indexOf("turnover") !== -1 || text.indexOf("delivery") !== -1)) {
      marketAttack = {
        type: "marche_retention",
        label: "Rétention tech ?",
        attack: "Le recruteur dira : 'Le turnover moyen en engineering est de 15-20%. Le marché est tendu. Votre équipe restait peut-être parce que le marché était fermé, pas parce que votre management était bon. Comment vous prouvez le contraire ?'",
        defense: "Cite les départs évités. Un membre qui a reçu une offre et est resté, c'est ta preuve. Le taux de rétention seul ne suffit pas. La raison de la rétention si.",
        source: "marche",
      };
    } else if (targetRoleId === "ai_architect") {
      marketAttack = {
        type: "marche_ia",
        label: "Production vs POC ?",
        attack: "Le recruteur dira : '85% des projets IA ne passent jamais en production. Votre projet était-il un POC qui a impressionné un COMEX ou un système qui tourne encore aujourd'hui ?'",
        defense: "Cite le nombre d'utilisateurs actifs, le volume de requêtes, ou la durée en production. Un POC en production depuis 18 mois vaut plus qu'un projet flagship arrêté après 3 mois.",
        source: "marche",
      };
    } else if (targetRoleId === "management_consultant") {
      marketAttack = {
        type: "marche_conseil",
        label: "Impact post-mission ?",
        attack: "Le recruteur dira : 'Les consultants partent, les recommandations restent dans un tiroir. Votre livrable a-t-il été implémenté ? Quel résultat 6 mois après votre départ ?'",
        defense: "Cite le résultat post-mission. Si tu as un chiffre du client 6 mois après, c'est ta meilleure preuve. Si tu n'en as pas, cite la décision concrète que le client a prise grâce à toi.",
        source: "marche",
      };
    } else if (hasPercentage || hasSmallNumbers) {
      marketAttack = {
        type: "marche_benchmark",
        label: "Chiffre vs benchmark ?",
        attack: "Le recruteur dira : 'Ce chiffre est correct, mais c'est la moyenne du secteur. Qu'est-ce qui prouve que c'est exceptionnel et pas juste normal ?'",
        defense: "Situe ton chiffre. Compare-le au benchmark de ton secteur, de ton équipe précédente, ou de ton prédécesseur. Un chiffre sans référence est un chiffre sans poids.",
        source: "marche",
      };
    }

    if (marketAttack) angles.push(marketAttack);
  }

  return angles;
}


export function auditDeliverable(type, content, bricks, cauchemars) {
  if (!content || content.length < 30) return { score: 0, passed: [], failed: [] };
  var lower = content.toLowerCase();
  var validated = bricks ? bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; }) : [];
  var activeCauch = cauchemars || getActiveCauchemars();

  // A. NON-GÉNÉRIQUE — contient des éléments du Coffre-Fort
  var hasSpecific = validated.some(function(b) {
    if (!b.text || b.text.length < 15) return false;
    var fragment = b.text.toLowerCase().slice(0, 30);
    return lower.indexOf(fragment) !== -1;
  });
  var hasCvVersion = validated.some(function(b) {
    if (!b.cvVersion || b.cvVersion.length < 10) return false;
    return lower.indexOf(b.cvVersion.toLowerCase().slice(0, 25)) !== -1;
  });
  var nonGenerique = hasSpecific || hasCvVersion;

  // B. PREUVE — au moins 1 brique référencée avec données
  var hasProof = validated.some(function(b) {
    if (!b.text) return false;
    var brickLow = b.text.toLowerCase();
    return lower.indexOf(brickLow.slice(0, 20)) !== -1 && /\d/.test(b.text);
  });
  if (!hasProof) hasProof = hasCvVersion && validated.some(function(b) { return b.cvVersion && /\d/.test(b.cvVersion); });

  // C. DESTINATAIRE D'ABORD — première phrase orientée recruteur/cauchemar
  var firstLines = content.split("\n").filter(function(l) { return l.trim().length > 5; });
  var firstLine = (firstLines[0] || "").toLowerCase();
  var destFirst = firstLine.indexOf("vous") !== -1 || firstLine.indexOf("votre") !== -1 || firstLine.indexOf("[prénom]") !== -1 || firstLine.indexOf("[prenom]") !== -1;
  if (!destFirst) {
    destFirst = activeCauch.some(function(c) {
      return c.nightmareShort && firstLine.indexOf(c.nightmareShort.toLowerCase().slice(0, 15)) !== -1;
    });
  }
  // CV exception: header with role title counts as reader-oriented
  if (type === "cv") {
    var roleInFirst = firstLine.indexOf("enterprise") !== -1 || firstLine.indexOf("head") !== -1 || firstLine.indexOf("senior") !== -1 || firstLine.indexOf("manager") !== -1 || firstLine.indexOf("csm") !== -1 || firstLine.indexOf("consultant") !== -1;
    if (roleInFirst) destFirst = true;
  }

  // D. CALIBRAGE CANAL
  var calibreOk = false;
  if (type === "cv") {
    // 6 secondes scannable — lignes courtes, pas de pavés
    var lines = content.split("\n").filter(function(l) { return l.trim().length > 0; });
    var longLines = lines.filter(function(l) { return l.length > 150; });
    calibreOk = longLines.length <= 1 && content.length < 2000;
  } else if (type === "dm") {
    var lineCount = content.split("\n").filter(function(l) { return l.trim().length > 3; }).length;
    calibreOk = lineCount <= 5 && content.length < 400;
  } else if (type === "email") {
    var emailLines = content.split("\n").filter(function(l) { return l.trim().length > 3; }).length;
    calibreOk = emailLines <= 12 && content.length < 1200;
  } else if (type === "post") {
    calibreOk = content.length <= 1500 && !/^[\-\*•]\s/m.test(content);
  } else if (type === "bio") {
    calibreOk = content.length <= 500;
  } else {
    calibreOk = true;
  }

  var tests = [
    { id: "generique", label: "Non-générique", desc: "Contient des éléments du Score", passed: nonGenerique, fix: "Le livrable ne référence aucune brique. Il ressemble à un template." },
    { id: "preuve", label: "Preuve", desc: "Au moins 1 brique chiffrée", passed: hasProof, fix: "Aucune donnée chiffrée. Ajoute une brique avec un résultat mesurable." },
    { id: "destinataire", label: "Destinataire d'abord", desc: "Première phrase orientée recruteur", passed: destFirst, fix: "La première phrase parle de toi. Commence par le problème du recruteur." },
    { id: "calibrage", label: "Calibrage canal", desc: "Format adapté au support", passed: calibreOk, fix: type === "cv" ? "CV trop dense. Raccourcis les lignes pour un scan en 6 secondes." : type === "dm" ? "DM trop long. Maximum 3-4 lignes." : type === "email" ? "Email trop long. Maximum 10 lignes." : type === "post" ? "Post trop long ou contient des listes. Prose brute, max 1500 car." : "Format non calibré pour ce canal." },
  ];

  var passed = tests.filter(function(t) { return t.passed; });
  var failed = tests.filter(function(t) { return !t.passed; });
  return { score: passed.length, tests: tests, passed: passed, failed: failed };
}


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

  // Component 4 — Risque cauchemars couverts par le candidat (fix 9: weighted by coverage strength)
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
  report += "• Cabinet + process interne : " + formatCost(comp1) + "\u20AC";
  if (replData) report += " (moyenne marché " + roleName + ")";
  report += "\n\n";

  // SECTION 2 — Coût de vacance
  report += "2. COÛT DE VACANCE\n";
  report += "• " + vacancyWeeks + " semaines de poste vacant : " + formatCost(vacancyCost) + "\u20AC\n";
  report += "• Calcul : salaire " + formatCost(salaryBase) + "\u20AC \u00D7 " + vacancyWeeks + "/52\n";
  if (!currentSalary) report += "• Base : estimation m\u00E9diane cadre (55K\u20AC). Renseigne ton salaire pour affiner.\n";
  report += "\n";

  // SECTION 3 — Coût de montée en compétence
  report += "3. COÛT DE MONTÉE EN COMPÉTENCE\n";
  report += "• " + rampUpMonths + " mois \u00D7 40% de perte de productivit\u00E9 : " + formatCost(rampUpCost) + "\u20AC\n";
  report += "• D\u00E9lai avant autonomie totale du rempla\u00E7ant\n\n";

  // SECTION 4 — Risque cauchemars
  report += "4. RISQUE CAUCHEMARS\n";
  if (coveredCauchs.length > 0) {
    coveredCauchs.forEach(function(cc) {
      report += "• " + cc.label + " : " + formatCost(cc.cost) + "\u20AC (co\u00FBt moyen sectoriel)\n";
    });
    report += "• Total cauchemars couverts par ton profil : " + formatCost(cauchCost) + "\u20AC\n";
  } else {
    report += "• Aucun cauchemar couvert. Le risque n'est pas chiffr\u00E9.\n";
  }
  report += "\n";

  // SECTION 5 — Total
  report += "TOTAL ESTIMÉ : " + formatCost(totalCost) + "\u20AC\n\n";

  // SECTION 6 — Valeur opérationnelle
  report += "5. VALEUR OPÉRATIONNELLE EN JEU\n";
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
  var blindedBricks = validated.filter(function(b) { return b.blinded; });
  report += "• " + validated.length + " comp\u00E9tence" + (validated.length > 1 ? "s" : "") + " document\u00E9e" + (validated.length > 1 ? "s" : "") + "\n";
  if (elasticBricks.length > 0) {
    report += "• " + elasticBricks.length + " comp\u00E9tence" + (elasticBricks.length > 1 ? "s" : "") + " \u00E9lastique" + (elasticBricks.length > 1 ? "s" : "") + " (non rempla\u00E7able par l'IA)\n";
  }
  if (blindedBricks.length > 0) {
    report += "• " + blindedBricks.length + " r\u00E9sultat" + (blindedBricks.length > 1 ? "s" : "") + " chiffr\u00E9" + (blindedBricks.length > 1 ? "s" : "") + " :\n";
    blindedBricks.slice(0, 3).forEach(function(b) {
      report += "  \u2014 " + extractBrickSummary(b.text) + "\n";
    });
  }
  report += "\n";

  // SECTION 7 — Coûts invisibles
  report += "6. COÛTS INVISIBLES\n";
  report += "• Perte de m\u00E9moire institutionnelle (process, relations, contexte)\n";
  report += "• Signal n\u00E9gatif pour l'\u00E9quipe (si le meilleur \u00E9l\u00E9ment part, les autres se posent la question)\n";
  report += "• D\u00E9lai incompressible : " + rampUpMonths + " mois avant que le rempla\u00E7ant soit autonome\n";

  // SECTION 8 — Signaux internes détectés
  if (internalSignals && internalSignals.detected) {
    report += "\n7. CONTEXTE INTERNE DÉTECTÉ\n";
    internalSignals.signals.forEach(function(s) {
      report += "• " + s.label + " (" + s.strength + ") \u2014 " + s.leverage + "\n";
    });
  }

  report += "\n---\n";
  report += "Ce rapport n'est pas une menace. C'est une cartographie. Le manager qui retient co\u00FBte moins cher que le manager qui remplace.";

  report = applyHints(report, hints, { bricks: bricks, cauchemars: cauchemars, type: "report" });
  return cleanRedac(report, "livrable");
}


/**
 * Génère un argumentaire pour demander une augmentation.
 * Structure : valeur prouvée → coût du départ → demande calibrée.
 * @param {Array} bricks - briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {number|null} currentSalary - salaire actuel (optionnel)
 * @returns {string} argumentaire formaté
 */
export function generateRaiseArgument(bricks, targetRoleId, currentSalary, hints) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Argumentaire produit après validation de tes briques.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "ce poste";
  var cauchemars = getActiveCauchemars();

  var arg = "ARGUMENTAIRE D'AUGMENTATION\n";
  arg += roleName.toUpperCase() + "\n\n";

  // PARTIE 1 — Valeur prouvée
  arg += "1. VALEUR PROUVÉE\n";
  var blindedBricks = validated.filter(function(b) { return b.blinded; });
  var topBricks = blindedBricks.length > 0 ? blindedBricks : validated;
  topBricks.slice(0, 3).forEach(function(b) {
    arg += "• " + extractBrickSummary(b.text) + "\n";
  });

  // Coverage
  var coverage = computeCauchemarCoverage(bricks);
  var covered = coverage.filter(function(c) { return c.covered; });
  if (covered.length > 0) {
    var totalCostLow = 0;
    var totalCostHigh = 0;
    covered.forEach(function(cc) {
      var cauch = cauchemars.find(function(c) { return c.id === cc.id; });
      if (cauch) { totalCostLow += cauch.costRange[0]; totalCostHigh += cauch.costRange[1]; }
    });
    arg += "\nJe résous " + covered.length + " problème" + (covered.length > 1 ? "s" : "") + " dont le coût cumulé est estimé entre " + formatCost(totalCostLow) + " et " + formatCost(totalCostHigh) + " par an.\n";
  }
  arg += "\n";

  // PARTIE 2 — Coût du départ
  arg += "2. COÛT DE MON DÉPART\n";
  var salaryBase = currentSalary || 55000;
  var replacementCost = Math.round(salaryBase * 0.2);
  var rampCost = Math.round(salaryBase * 0.4);
  arg += "• Recrutement de remplacement : ~" + formatCost(replacementCost) + "\u20AC\n";
  arg += "• Perte de productivité pendant la transition : ~" + formatCost(rampCost) + "\u20AC\n";
  arg += "• Total : ~" + formatCost(replacementCost + rampCost) + "\u20AC\n";
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
    var raiseLow = Math.round(currentSalary * raiseLowPct / 100);
    var raiseHigh = Math.round(currentSalary * raiseHighPct / 100);
    arg += "• Fourchette demandée : +" + raisePercent + "% soit " + formatCost(raiseLow) + "-" + formatCost(raiseHigh) + "\u20AC brut/an\n";
  } else {
    arg += "• Fourchette suggérée : +" + raisePercent + "% de ton salaire actuel\n";
  }
  arg += "• Justification : le coût de ton remplacement (" + formatCost(totalReplacement) + "\u20AC) dépasse largement cette demande\n";
  arg += "• Ratio demande / coût de remplacement : " + Math.round(raiseHighPct / (raiseRatio * 100) * 100) + "% — le manager gagne à retenir\n";

  arg += "\n---\n";
  arg += "Cet argumentaire repose sur " + validated.length + " preuve" + (validated.length > 1 ? "s" : "") + " documentée" + (validated.length > 1 ? "s" : "") + ". ";
  arg += "Le manager ne négocie pas un salaire. Il arbitre entre le coût de ta demande et le coût de ton départ.";

  arg = applyHints(arg, hints, { bricks: bricks, cauchemars: cauchemars, type: "argument" });
  return cleanRedac(arg, "livrable");
}


/**
 * Génère un plan 90 jours pour le manager actuel.
 * Montre l'évolution proposée : 30j stabilisation, 30j expansion, 30j transformation.
 * @param {Array} bricks - briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {object} internalSignals - résultat de parseInternalSignals (optionnel)
 * @returns {string} plan formaté
 */
export function generatePlan90jN1(bricks, targetRoleId, internalSignals, hints) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Plan 90 jours produit après validation de tes briques.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "ce poste";

  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
  var decisionBricks = validated.filter(function(b) { return b.brickCategory === "decision"; });
  var influenceBricks = validated.filter(function(b) { return b.brickCategory === "influence"; });

  var plan = "PLAN 90 JOURS — ÉVOLUTION INTERNE\n";
  plan += roleName.toUpperCase() + "\n\n";

  // Fix 12: use extractBrickCore for compressed refs + deduplicate across phases
  var usedBrickIds = {};
  function pickDistinctBrick(pool) {
    for (var pi = 0; pi < pool.length; pi++) {
      if (!usedBrickIds[pool[pi].id]) { usedBrickIds[pool[pi].id] = true; return pool[pi]; }
    }
    return pool[0] || null;
  }
  function compressRef(b) {
    if (!b) return null;
    var bc = extractBrickCore(b);
    var verb = bc.actionVerb ? (bc.actionVerb.charAt(0).toUpperCase() + bc.actionVerb.slice(1)) : null;
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
  plan += "• Poser la question au N+1 : \"Quel est le problème que personne ne prend en charge et qui coûte le plus cher à l'équipe ?\"\n";

  // Signaux internes
  if (internalSignals && internalSignals.detected && internalSignals.signals.length > 1) {
    plan += "\n---\nSIGNAUX INTERNES DÉTECTÉS\n";
    internalSignals.signals.forEach(function(s) {
      plan += "• " + s.label + " — " + s.leverage + "\n";
    });
  }

  plan += "\n---\n";
  plan += "Ce plan transforme une demande d'augmentation en proposition de valeur. Le N+1 n'évalue pas ton salaire. Il évalue le ROI de ton évolution.";

  plan = applyHints(plan, hints, { bricks: bricks, type: "plan90j" });
  return cleanRedac(plan, "livrable");
}


/**
 * Génère des questions que le candidat pose au recruteur.
 * Croise briques blindées × cauchemars × signaux d'offre.
 * Chaque question démontre implicitement une compétence sans la nommer.
 * @param {Array} bricks - briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {Array} nightmares - cauchemars actifs (getActiveCauchemars)
 * @param {object|null} offerSignals - signaux de l'offre (optionnel)
 * @param {string|null} signature - signature comportementale du candidat (optionnel)
 * @returns {string} questions formatées avec notes de coaching
 */
export function generateInterviewQuestions(bricks, targetRoleId, nightmares, offerSignals, signature, hints) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length < 2) {
    return "Pas assez de matériau pour calibrer tes questions. Forge au moins 2 briques pour que l'outil croise tes faits avec les cauchemars du recruteur.";
  }

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role : "ce poste";

  // Briques blindées (chiffrées)
  var armored = validated.filter(function(b) { return /\d/.test(b.text); });

  // Match briques to cauchemars
  var cauchWithBrick = [];
  nightmares.forEach(function(c) {
    var match = validated.find(function(b) {
      return c.kpis && c.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
    });
    cauchWithBrick.push({ cauchemar: c, brick: match || null });
  });

  var questions = [];

  // ── NIVEAU 3 — Contextuelles (minimum 2) ──
  if (offerSignals && offerSignals.cauchemars) {
    var detectedSignals = offerSignals.cauchemars.filter(function(c) { return c.detected; });
    var signalSource = detectedSignals.length > 0 ? detectedSignals : offerSignals.cauchemars;
    signalSource.slice(0, 2).forEach(function(sig) {
      var matchBrick = validated.find(function(b) {
        return sig.kpis && sig.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
      });
      var brickRef = matchBrick ? extractBrickSummary(matchBrick.text) : "expérience terrain";
      var questionText = "J'ai noté que le poste mentionne " + sig.label.toLowerCase() + " comme enjeu. Concrètement, comment votre équipe mesure-t-elle la progression sur ce sujet aujourd'hui ?";
      questions.push({
        level: 3,
        text: questionText,
        demonstrates: "Tu montres que tu lis l'offre au second degré et que tu cherches la métrique, pas le discours.",
        brickRef: brickRef,
        cauchRef: sig.label,
      });
    });
  }
  // Compléter avec cauchemars si pas assez de signaux — 4 templates distincts
  if (questions.length < 2) {
    var used = questions.map(function(q) { return q.cauchRef; });
    var contextualPatterns = [
      function(role, label) { return "Sur un rôle " + role + ", " + label + " est souvent un enjeu. Comment votre équipe le gère aujourd'hui ?"; },
      function(role, label) { return "J'ai vu que " + label + " revient dans beaucoup d'organisations. Quel mécanisme avez-vous mis en place pour le contenir ?"; },
      function(role, label) { return "Si je comprends bien le poste, " + label + " fait partie des chantiers prioritaires. Qu'est-ce qui a été tenté jusqu'ici ?"; },
      function(role, label) { return "En étudiant votre secteur, " + label + " semble structurel. Comment vous situez-vous par rapport au marché sur ce point ?"; },
    ];
    var patIdx = 0;
    cauchWithBrick.forEach(function(cw) {
      if (questions.length >= 2) return;
      if (used.indexOf(cw.cauchemar.label) !== -1) return;
      var brickRef = cw.brick ? extractBrickSummary(cw.brick.text) : "expérience terrain";
      var questionText = contextualPatterns[patIdx % contextualPatterns.length](roleLabel, cw.cauchemar.label.toLowerCase());
      patIdx++;
      questions.push({
        level: 3,
        text: questionText,
        demonstrates: "Tu poses la question du terrain. Le recruteur comprend que tu connais le métier avant même d'avoir commencé.",
        brickRef: brickRef,
        cauchRef: cw.cauchemar.label,
      });
    });
  }

  // ── NIVEAU 4 — Miroir (minimum 1) ──
  var mirrorVariants = [
    "Quel est le profil type de " + roleLabel + " qui échoue ici dans les 6 premiers mois ?",
    "Qu'est-ce qui distingue vos meilleurs " + roleLabel + " de ceux qui n'atteignent pas les objectifs ?",
  ];
  var mirrorIdx = Math.abs(hashCode(targetRoleId || "default")) % mirrorVariants.length;
  var mirrorCauch = cauchWithBrick.length > 0 ? cauchWithBrick[0] : null;
  questions.push({
    level: 4,
    text: mirrorVariants[mirrorIdx],
    demonstrates: "Tu forces le recruteur à décrire la réalité. Sa réponse te donne les vrais critères de sélection.",
    brickRef: mirrorCauch && mirrorCauch.brick ? extractBrickSummary(mirrorCauch.brick.text) : "ton profil global",
    cauchRef: mirrorCauch ? mirrorCauch.cauchemar.label : "échec en poste",
  });
  // Deuxième miroir si matériau suffisant
  if (cauchWithBrick.length >= 2 && cauchWithBrick[1].brick) {
    var cw1 = cauchWithBrick[1];
    questions.push({
      level: 4,
      text: "Quand " + cw1.cauchemar.label.toLowerCase() + " devient critique, c'est généralement un problème de process, de compétence, ou de contexte ?",
      demonstrates: "Tu cadres le problème en 3 dimensions. Le recruteur voit que tu diagnostiques avant d'agir.",
      brickRef: extractBrickSummary(cw1.brick.text),
      cauchRef: cw1.cauchemar.label,
    });
  }

  // ── NIVEAU 5 — Révélatrice (1-2 si >= 3 briques blindées) ──
  if (armored.length >= 3) {
    var bestArmored = armored[0];
    var bestCore = extractBrickCore(bestArmored);
    var bestNum = bestCore.resultNumber || extractBestNum(bestArmored.text);
    var costCauch = cauchWithBrick.find(function(cw) { return cw.cauchemar.costRange && cw.cauchemar.costRange[1] > 0; });
    if (costCauch) {
      questions.push({
        level: 5,
        text: "Si " + costCauch.cauchemar.label.toLowerCase() + " reste un sujet ouvert chez vous, quelle serait votre attente vis-à-vis du poste sur ce point ? Ou c'est déjà résolu ?",
        demonstrates: "Tu cadres le problème sans le chiffrer. Le recruteur comprend que tu connais l'enjeu business, pas juste le poste.",
        brickRef: bestNum ? bestNum + " — " + extractBrickSummary(bestArmored.text) : extractBrickSummary(bestArmored.text),
        cauchRef: costCauch.cauchemar.label,
      });
    }
    // Deuxième révélatrice si assez de matériau
    if (armored.length >= 5 && cauchWithBrick.length >= 3) {
      var cw2 = cauchWithBrick[2];
      if (cw2 && cw2.brick) {
        questions.push({
          level: 5,
          text: "Entre " + cauchWithBrick[0].cauchemar.label.toLowerCase() + " et " + cw2.cauchemar.label.toLowerCase() + ", lequel a le plus d'impact sur vos résultats actuels ? Je demande parce que l'approche serait très différente.",
          demonstrates: "Tu mets deux problèmes en tension. Le recruteur est obligé de prioriser — et te donne la hiérarchie réelle des enjeux.",
          brickRef: extractBrickSummary(cw2.brick.text),
          cauchRef: cw2.cauchemar.label,
        });
      }
    }
  }

  // ── NIVEAU 6 — Inconfortable (max 1, optionnelle, >= 5 briques blindées ET signature) ──
  if (armored.length >= 5 && signature) {
    var uncoveredCauch = cauchWithBrick.find(function(cw) { return !cw.brick; });
    if (uncoveredCauch) {
      questions.push({
        level: 6,
        text: "En étudiant le marché, j'ai compris que " + uncoveredCauch.cauchemar.label.toLowerCase() + " est un enjeu structurel pour beaucoup d'équipes. Est-ce un problème résolu chez vous, ou une contrainte avec laquelle le poste compose ?",
        demonstrates: "Tu poses la question que personne ne pose. Le recruteur sait que tu fais ta due diligence — comme un investisseur évalue un deal.",
        brickRef: "due diligence candidat",
        cauchRef: uncoveredCauch.cauchemar.label,
      });
    } else if (nightmares.length > 0) {
      var lastCauch = nightmares[nightmares.length - 1];
      questions.push({
        level: 6,
        text: "Si je regarde les signaux du marché sur " + lastCauch.label.toLowerCase() + ", les entreprises qui performent ont résolu ce point en amont. Comment vous situez-vous sur ce sujet — en avance, au niveau, ou en rattrapage ?",
        demonstrates: "Tu benchmarkes l'employeur. Il se retrouve en position de se vendre à toi. L'asymétrie s'inverse.",
        brickRef: "positionnement marché",
        cauchRef: lastCauch.label,
      });
    }
  }

  // Trier par niveau croissant
  questions.sort(function(a, b) { return a.level - b.level; });

  // Limiter à 8 max
  if (questions.length > 8) questions = questions.slice(0, 8);

  // Formater la sortie
  var levelNames = { 3: "Contextuelle", 4: "Miroir", 5: "Révélatrice", 6: "Inconfortable" };
  var out = "QUESTIONS POUR L'ENTRETIEN — " + roleLabel.toUpperCase() + "\n";
  out += questions.length + " questions calibrées sur tes preuves\n\n";

  questions.forEach(function(q, i) {
    out += "QUESTION " + (i + 1) + " — Niveau " + q.level + " (" + levelNames[q.level] + ")\n";
    out += "\"" + q.text + "\"\n\n";
    out += "↳ Ce que tu démontres : " + q.demonstrates + "\n";
    out += "↳ Brique mobilisée : " + q.brickRef + "\n";
    out += "↳ Cauchemar visé : " + q.cauchRef + "\n";
    if (q.level <= 4) out += "↳ Pour ton message post-entretien : note la réponse du recruteur à cette question.\n";
    if (i < questions.length - 1) out += "\n";
  });

  out += "\n---\n";
  out += "COMMENT UTILISER CES QUESTIONS\n\n";
  out += "Pose 2-3 questions maximum en entretien. Pas les " + questions.length + ".\n";
  out += "Commence par une contextuelle (niveau 3) pour ouvrir.\n";
  out += "Place la miroir (niveau 4) quand le recruteur est en confiance.\n";
  out += "La révélatrice (niveau 5) ne se pose que si l'échange est devenu une conversation, pas un interrogatoire.\n";
  out += "L'inconfortable (niveau 6) se garde pour un deuxième entretien ou un échange informel.\n\n";
  out += "Écoute la réponse. Ta question suivante doit intégrer ce que le recruteur vient de dire.\n";
  out += "Si tu déroules ta liste sans écouter, tu fais exactement ce que font les mauvais commerciaux.";
  out += "\n";
  out += "Ces questions ne te rendront pas sympathique. Elles te rendront mémorable. Le recruteur qui réagit mal à une question niveau 4 te donne une information gratuite : cette entreprise ne recrute pas, elle remplit des cases.";

  out = applyHints(out, hints, { bricks: bricks, cauchemars: nightmares, type: "questions" });
  return cleanRedac(out, "livrable");
}


/**
 * Generates a post-interview follow-up message.
 * Framework Miroir: mirrors what the recruiter shared, crosses with candidate bricks.
 * 5 blocks: Opening mirror, Structured listening, Action hypothesis, Proof deposit, Next step.
 *
 * @param {object} followUpInput - candidate input after interview
 * @param {string} followUpInput.shared - what the recruiter shared (free text)
 * @param {string} followUpInput.ambition - team ambition (free text)
 * @param {Array<string>} followUpInput.challenges - 3 challenges identified (array of strings)
 * @param {string} followUpInput.interviewerName - first name of interviewer (optional)
 * @param {string} followUpInput.timing - "ce matin" | "hier" | "la semaine dernière" (optional, default "")
 * @param {Array} bricks - validated bricks
 * @param {string} targetRoleId - target role
 * @param {Array} cauchemars - active cauchemars
 * @param {object|null} vault - vault with selectedPillars and posts
 * @param {Array|undefined} hints - optional correction hints from audit (ch17)
 * @returns {string} formatted follow-up message
 */
export function generateFollowUp(followUpInput, bricks, targetRoleId, cauchemars, vault, hints) {
  if (!followUpInput) return "";
  var input = followUpInput;

  // Fallbacks
  if (!input.shared || input.shared.trim().length < 5) {
    return "Décris ce que le recruteur a partagé pour que l'outil structure ton miroir.";
  }
  var challenges = (input.challenges || []).filter(function(c) { return c && c.trim().length >= 5; });
  if (challenges.length === 0) {
    return "Remplis au moins 1 défi identifié pendant l'entretien pour que l'outil calibre ton message.";
  }

  var validated = (bricks || []).filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var timing = input.timing ? " " + input.timing : "";
  var name = input.interviewerName ? ", " + input.interviewerName.trim() : "";

  // ── Helper: token overlap between text and brick ──
  function overlapTokens(textA, textB) {
    var tokA = (textA || "").toLowerCase().replace(/[^a-zà-ÿ0-9\s]/gi, " ").split(/\s+/).filter(function(t) { return t.length > 4; });
    var tokB = (textB || "").toLowerCase().replace(/[^a-zà-ÿ0-9\s]/gi, " ").split(/\s+/).filter(function(t) { return t.length > 4; });
    var count = 0;
    tokA.forEach(function(t) { if (tokB.indexOf(t) !== -1) count++; });
    return count;
  }

  // ── Helper: find best matching brick for a challenge ──
  function findBestBrick(challenge, usedIds) {
    var best = null;
    var bestScore = 0;
    validated.forEach(function(b) {
      if (usedIds[b.id]) return;
      var score = overlapTokens(challenge, b.text);
      if (b.kpi) score += overlapTokens(challenge, b.kpi);
      if (score > bestScore) { bestScore = score; best = b; }
    });
    return bestScore >= 2 ? best : null;
  }

  // ── BLOC 1 — Ouverture miroir ──
  var shared = input.shared.trim();
  // Ensure doesn't start with "je"
  var sharedLower = shared.toLowerCase();
  var sharedReform = shared;
  if (/^(je |j')/i.test(sharedReform)) {
    sharedReform = "Ce qui ressort de l'échange : " + sharedReform.charAt(0).toLowerCase() + sharedReform.slice(1);
  }
  if (sharedReform.length > 200) {
    var sCut = sharedReform.lastIndexOf(".", 200);
    sharedReform = sCut > 50 ? sharedReform.slice(0, sCut + 1) : sharedReform.slice(0, 197) + "...";
  }
  var opening = "Merci pour l'échange" + timing + name + ". " + sharedReform;
  if (!/[.!?]$/.test(opening)) opening += ".";

  // ── BLOC 2 — Écoute structurée ──
  var ambitionText = (input.ambition || "").trim();
  if (ambitionText.length > 120) {
    var aCut = ambitionText.lastIndexOf(".", 120);
    ambitionText = aCut > 30 ? ambitionText.slice(0, aCut + 1) : ambitionText.slice(0, 117) + "...";
  }
  var listening = "Ce que j'ai retenu :\n\nAmbition : " + (ambitionText || "faire progresser l'équipe") + "\n\nTrois enjeux :";
  challenges.slice(0, 3).forEach(function(ch) {
    var reformulated = ch.trim();
    if (reformulated.length > 100) reformulated = reformulated.slice(0, 97) + "...";
    listening += "\n— " + reformulated;
  });

  // ── BLOC 3 — Hypothèse d'action ──
  var usedBrickIds = {};
  var hypothesisLines = [];
  var genericReflexes = [
    "cartographier les cas actuels pour identifier le levier bloqué",
    "auditer les 10 derniers cas pour isoler la cause racine",
    "installer un diagnostic structuré avant d'agir sur le volume",
    "mesurer le before/after sur 1 métrique avant d'élargir",
  ];
  challenges.slice(0, 3).forEach(function(ch, idx) {
    var brick = findBestBrick(ch, usedBrickIds);
    var line = ch.trim();
    if (line.length > 60) line = line.slice(0, 57) + "...";
    if (brick) {
      usedBrickIds[brick.id] = true;
      var core = extractBrickCore(brick);
      var verb = core.actionVerb || "agi";
      var num = core.resultNumber || core.mainNumber || null;
      var anchor = "C'est ce que j'ai fait quand j'ai " + verb;
      if (num) anchor += " — résultat : " + num;
      anchor += ".";
      hypothesisLines.push(line + " → Mon réflexe : " + anchor);
    } else {
      hypothesisLines.push(line + " → Mon réflexe : " + genericReflexes[idx % genericReflexes.length] + ".");
    }
  });
  var hypothesis = "Ce que je ferais en priorité :\n\n" + hypothesisLines.join("\n");

  // ── BLOC 4 — Proof deposit ──
  var proofText = null;
  if (validated.length >= 2) {
    // Try vault posts first
    var hasPosts = vault && vault.selectedPillars && vault.selectedPillars.length > 0;
    var linkedInPosts = null;
    if (hasPosts && vault.posts && vault.posts.length > 0) {
      // Find most relevant post
      var allChallengeText = challenges.join(" ");
      var bestPost = null;
      var bestPostScore = 0;
      vault.posts.forEach(function(p) {
        var content = p.content || p.text || p.title || "";
        var score = overlapTokens(allChallengeText, content);
        if (score > bestPostScore) { bestPostScore = score; bestPost = p; }
      });
      if (bestPost && bestPostScore >= 2) {
        var postSummary = (bestPost.title || bestPost.content || "").trim();
        if (postSummary.length > 120) postSummary = postSummary.slice(0, 117) + "...";
        proofText = "Un élément qui peut être utile : " + postSummary;
      }
    }
    // Fallback: micro-case from best armored brick
    if (!proofText) {
      var armoredBricks = validated.filter(function(b) { return b.blinded || (b.armorScore && b.armorScore >= 3); });
      var caseBrick = armoredBricks.length > 0 ? armoredBricks[0] : validated[0];
      var caseCore = extractBrickCore(caseBrick);
      var situation = caseCore.constraint || caseCore.context || "Un contexte opérationnel tendu";
      var action = caseCore.actionVerb ? (caseCore.actionVerb.charAt(0).toUpperCase() + caseCore.actionVerb.slice(1)) : "Action ciblée";
      var result = caseCore.resultNumber || caseCore.mainNumber || "résultat mesurable";
      proofText = "Un élément qui peut être utile :\nSituation : " + situation + ".\nAction : " + action + ".\nRésultat : " + result + ".";
    }
  }

  // ── BLOC 5 — Prochaine étape ──
  var firstChallenge = challenges[0].trim().toLowerCase();
  var closingQuestions = [
    "Ai-je bien cerné les priorités ?",
    "Y a-t-il un point que je devrais creuser en attendant ?",
  ];
  var closingQ = closingQuestions[Math.abs(hashCode(firstChallenge)) % closingQuestions.length];
  var nextStep = "Prochaine étape : je suis disponible pour approfondir le sujet " + (firstChallenge.length > 50 ? firstChallenge.slice(0, 47) + "..." : firstChallenge) + " si c'est pertinent.\n" + closingQ;

  // ── Assemblage ──
  var blocks = [opening, listening, hypothesis];
  if (proofText) blocks.push(proofText);
  blocks.push(nextStep);

  var message = blocks.join("\n\n");

  // Strip vocabulaire interdit (same list as bio)
  BIO_VOCAB_INTERDIT.forEach(function(re) { message = message.replace(re, ""); });
  message = message.replace(/  +/g, " ").replace(/\s+\./g, ".").replace(/\.\s*\./g, ".");

  // Enforce 2000 char limit
  if (message.length > 2000) {
    // Cut proof deposit first
    if (proofText) {
      blocks = [opening, listening, hypothesis, nextStep];
      message = blocks.join("\n\n");
      BIO_VOCAB_INTERDIT.forEach(function(re) { message = message.replace(re, ""); });
      message = message.replace(/  +/g, " ").replace(/\s+\./g, ".").replace(/\.\s*\./g, ".");
    }
    if (message.length > 2000) {
      var mCut = message.lastIndexOf(".", 1997);
      message = mCut > 500 ? message.slice(0, mCut + 1) : message.slice(0, 1997) + "...";
    }
  }

  message = applyHints(message, hints, { bricks: bricks, cauchemars: cauchemars, type: "followup" });
  return cleanRedac(message, "livrable");
}


/**
 * Generates a compressed email signature line from the strongest brick.
 * Format: "{fact} — {role}"
 * Maximum 80 characters.
 *
 * @param {Array} bricks - validated bricks
 * @param {string} targetRoleId - target role
 * @returns {string} signature line ≤ 80 chars
 */
export function generateEmailSignature(bricks, targetRoleId) {
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "Professionnel";
  var validated = (bricks || []).filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return roleName;

  // Pick strongest brick (armorScore, then hasNumbers)
  var best = validated.slice().sort(function(a, b) {
    var d = (b.armorScore || 0) - (a.armorScore || 0);
    if (d !== 0) return d;
    if (/\d/.test(b.text || "") && !/\d/.test(a.text || "")) return 1;
    if (/\d/.test(a.text || "") && !/\d/.test(b.text || "")) return -1;
    return 0;
  })[0];

  var core = extractBrickCore(best);
  var parts = [];
  if (core.actionVerb) parts.push(core.actionVerb.charAt(0).toUpperCase() + core.actionVerb.slice(1));
  if (core.problemNumber && core.resultNumber && core.problemNumber !== core.resultNumber) {
    parts.push("de " + core.problemNumber + " à " + core.resultNumber);
  } else if (core.mainNumber) {
    parts.push(core.mainNumber);
  }
  if (core.context) parts.push(core.context);

  var fact = parts.join(" ").replace(/\s+/g, " ").trim();
  var suffix = " — " + roleName;
  var maxFact = 80 - suffix.length;

  if (fact.length > maxFact) {
    // Cut context, keep verb + number
    var shortParts = [];
    if (core.actionVerb) shortParts.push(core.actionVerb.charAt(0).toUpperCase() + core.actionVerb.slice(1));
    if (core.problemNumber && core.resultNumber && core.problemNumber !== core.resultNumber) {
      shortParts.push("de " + core.problemNumber + " à " + core.resultNumber);
    } else if (core.mainNumber) {
      shortParts.push(core.mainNumber);
    }
    fact = shortParts.join(" ").trim();
    if (fact.length > maxFact) fact = fact.slice(0, maxFact - 3) + "...";
  }

  var line = fact ? fact + suffix : roleName;
  // Strip vocab interdit
  BIO_VOCAB_INTERDIT.forEach(function(re) { line = line.replace(re, ""); });
  return line.replace(/  +/g, " ").trim();
}
