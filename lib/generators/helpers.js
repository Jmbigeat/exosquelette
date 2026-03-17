import { KPI_REFERENCE, MARKET_DATA } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { getActiveCauchemars, formatCost, computeCauchemarCoverage, hashCode } from "../sprint/scoring.js";
import {
  hasNumbers,
  hasExternalization,
  hasDecisionMarkers,
  hasInfluenceMarkers,
  classifyCicatrice,
  extractBrickSummary,
} from "../sprint/analysis.js";
import {
  extractBrickCore,
  formatAnchorLine,
  formatCVLine as _formatCVLine,
  hasMentoringMarkers,
} from "../sprint/brickExtractor.js";
import { matchKpiToReference } from "../sprint/bricks.js";
import { parseOfferSignals, parseInternalSignals } from "../sprint/offers.js";
import { analyzeDiltsProgression } from "../sprint/dilts.js";

/**
 * Applies correction hints to generated text.
 * Hints are string instructions from the audit system.
 * @param {string} text - generated text
 * @param {string[]} hints - correction instructions
 * @param {object} ctx - context: { bricks, cauchemars, type }
 * @returns {string} adjusted text
 */
export function applyHints(text, hints, ctx) {
  if (!hints || !Array.isArray(hints) || hints.length === 0) return text;
  var result = text;
  var bricks = (ctx && ctx.bricks) || [];
  var cauchemars = (ctx && ctx.cauchemars) || [];
  var validated = bricks.filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });

  hints.forEach(function (hint) {
    if (!hint) return;
    var h = hint.toLowerCase();

    // Hint: inject a specific number from bricks
    if (h.indexOf("chiffre") !== -1 || h.indexOf("contexte spécifique") !== -1) {
      var numBrick = validated.find(function (b) {
        return /\d/.test(b.text);
      });
      if (numBrick) {
        var num = extractBestNum(numBrick.text);
        if (num && result.indexOf(num) === -1) {
          // Insert the number reference before the last paragraph
          var lastBreak = result.lastIndexOf("\n\n");
          if (lastBreak > 0) {
            result =
              result.slice(0, lastBreak) +
              "\nPreuve : " +
              num +
              " — " +
              extractBrickSummary(numBrick.text) +
              result.slice(lastBreak);
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
          if (lines[i].trim().length > 5 && !/^[A-ZÀ-Ú\s\-—]+$/.test(lines[i].trim())) {
            firstContent = i;
            break;
          }
        }
        if (
          firstContent >= 0 &&
          lines[firstContent].toLowerCase().indexOf(cauch.nightmareShort.toLowerCase().slice(0, 10)) === -1
        ) {
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
          if (cut > limit * 0.5) {
            result = result.slice(0, cut + 1);
          } else {
            result = result.slice(0, limit - 3) + "...";
          }
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
  var withSuffix = text.match(
    /([\+\-]?\d[\d\s.,]*\s*(?:K€|M€|k€|€|%|lignes?|modules?|mois|couverts?|tests?|sessions?|users?|clients?|projets?|tickets?|sprints?|jours?|heures?|semaines?))/i
  );
  if (withSuffix) return withSuffix[1].replace(/\s+/g, " ").trim();
  var all = text.match(/[\+\-]?\d[\d\s.,]*/g);
  if (!all) return null;
  var best = null;
  var bestVal = 0;
  all.forEach(function (m) {
    var v = parseFloat(m.replace(/\s/g, "").replace(",", "."));
    if (!isNaN(v) && v > bestVal) {
      bestVal = v;
      best = m.trim();
    }
  });
  return best;
}

/* Génère un résumé Fossé chiffré pour le diagnostic */
export function computeFosseMarket(salaire) {
  var sal = salaire || MARKET_DATA.fosse.salaire_median_cadre;
  var minPerte = Math.round((sal * MARKET_DATA.fosse.ecart_salaire_marche.min) / 100);
  var maxPerte = Math.round((sal * MARKET_DATA.fosse.ecart_salaire_marche.max) / 100);
  return {
    salaire: sal,
    perteMensuelleMin: Math.round(minPerte / 12),
    perteMensuelleMax: Math.round(maxPerte / 12),
    perteAnnuelleMin: minPerte,
    perteAnnuelleMax: maxPerte,
    contexte:
      MARKET_DATA.fosse.part_augmentes_changement +
      "% des cadres qui changent sont augmentés. " +
      MARKET_DATA.fosse.part_augmentes_meme_poste +
      "% de ceux qui restent.",
    ecartGain:
      "+" +
      MARKET_DATA.fosse.gain_changement_employeur +
      "% en changeant vs +" +
      MARKET_DATA.fosse.gain_sans_changement +
      "% en restant.",
    intentionVsAction:
      MARKET_DATA.reconversion.projet_reconversion +
      "% veulent bouger. " +
      MARKET_DATA.reconversion.demarches_entamees +
      "% bougent. Le Fossé est là.",
  };
}

/* ── Bio helpers — Framework D (Fait Anchor) ── */

export var BIO_NIGHTMARE_NARRATIVES = [
  {
    match: /stagnation|portefeuille/i,
    text: "Le portefeuille stagnait trimestre après trimestre. L'équipe compensait par du volume. Le problème était ailleurs.",
  },
  {
    match: /churn|rétention|retention/i,
    text: "Le churn montait. Les relances se multipliaient. Les comptes partaient quand même.",
  },
  {
    match: /deals|cycle|outils/i,
    text: "Les deals traînaient. Le pipe affiché ne matchait plus le closing réel. Personne ne creusait le décalage.",
  },
];

export var BIO_PATTERN_CATEGORIES = {
  reduction: {
    verbs: ["réduit", "simplifié", "éliminé", "concentré", "resserré", "ciblé"],
    text: "Mon réflexe : réduire avant de scaler. Identifier le levier bloqué avant de multiplier les actions.",
  },
  construction: {
    verbs: ["construit", "lancé", "créé", "déployé", "mis en place", "structuré"],
    text: "Mon réflexe : structurer avant d'exécuter. Le process précède le volume.",
  },
  recuperation: {
    verbs: ["rattrapé", "relancé", "reconquis", "redressé", "rétabli"],
    text: "Mon réflexe : isoler la cause avant de traiter le symptôme. Le pipe gelé a toujours une raison.",
  },
  optimisation: {
    verbs: ["amélioré", "augmenté", "accéléré", "porté"],
    text: "Mon réflexe : mesurer le bon indicateur. Le volume masque souvent le vrai problème.",
  },
};

export var BIO_VOCAB_INTERDIT = [
  /\bpassionn[ée]e?s?\b/gi,
  /\bpassion\b/gi,
  /\bdynamiques?\b/gi,
  /\bproactifs?\b/gi,
  /\bproactives?\b/gi,
  /\borient[ée]e?s? r[ée]sultats\b/gi,
  /\bforte? de\b/gi,
  /\bdot[ée]e?s? de\b/gi,
  /\briche exp[ée]rience\b/gi,
  /\breconnue? pour\b/gi,
  /\bexperte? en\b/gi,
  /\bn'h[ée]sitez pas\b/gi,
  /\bouvert(e|es)? aux opportunit[ée]s\b/gi,
  /\b[àa] l'[ée]coute du march[ée]\b/gi,
  /\ben qu[êe]te de nouveaux d[ée]fis\b/gi,
];

export function bioStripVocabInterdit(text) {
  var r = text;
  BIO_VOCAB_INTERDIT.forEach(function (re) {
    r = r.replace(re, "");
  });
  return r
    .replace(/  +/g, " ")
    .replace(/\s+\./g, ".")
    .replace(/\.\s*\./g, ".")
    .trim();
}

export function bioBuildAnchorText(brick) {
  var core = extractBrickCore(brick);
  return formatAnchorLine(core);
}

export function bioBuildNightmareNarrative(cauchemar) {
  for (var i = 0; i < BIO_NIGHTMARE_NARRATIVES.length; i++) {
    if (BIO_NIGHTMARE_NARRATIVES[i].match.test(cauchemar.label)) return BIO_NIGHTMARE_NARRATIVES[i].text;
  }
  return cauchemar.nightmareShort || null;
}

export function bioDetectPattern(validated) {
  var keys = Object.keys(BIO_PATTERN_CATEGORIES);
  var bestKey = null;
  var bestCount = 0;
  keys.forEach(function (key) {
    var cat = BIO_PATTERN_CATEGORIES[key];
    var count = 0;
    validated.forEach(function (b) {
      var t = (b.text || "").toLowerCase();
      if (
        cat.verbs.some(function (v) {
          return t.indexOf(v) !== -1;
        })
      )
        count++;
    });
    if (count >= 2 && count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  });
  return bestKey ? BIO_PATTERN_CATEGORIES[bestKey].text : null;
}

/* ==============================
   ITEM 2 — DOUBLE SORTIE PAR BRIQUE
   CV 6sec + Entretien 3 interlocuteurs
   ============================== */

export var CV_SCAR_VERBS = ["Restructuré", "Corrigé", "Renforcé", "Redressé", "Repensé"];
export var CV_ELASTIC_VERBS = ["Transposé", "Adapté", "Répliqué", "Étendu", "Appliqué"];
export var CV_ACTION_VERBS = [
  "Rattrapé",
  "Réduit",
  "Construit",
  "Lancé",
  "Restructuré",
  "Négocié",
  "Piloté",
  "Déployé",
  "Porté",
  "Augmenté",
];
