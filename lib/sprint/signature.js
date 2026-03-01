import { assessBrickArmor } from "./scoring.js";

/* ─── Chantier 7 — Ta signature ─── */

// Verbes de mobilisation (transverse)
var VERBS_TRANSVERSE = ["aligné", "aligne", "coordonné", "coordonne", "réuni", "reuni", "mobilisé", "mobilise", "fédéré", "federe", "convaincu", "négocié", "negocie", "embarqué", "embarque", "sponsorisé", "sponsorise", "influencé", "influence", "rallié", "rallie", "arbitré", "arbitre"];

// Verbes d'exécution (direct)
var VERBS_DIRECT = ["codé", "code", "vendu", "analysé", "analyse", "construit", "livré", "livre", "rédigé", "redige", "déployé", "deploye", "automatisé", "automatise", "implémenté", "implemente", "structuré", "structure", "conçu", "concu", "piloté", "pilote", "exécuté", "execute"];

// Duration patterns
var DURATION_SHORT_RE = /(\d+)\s*(jour|jours|semaine|semaines|h\b|heure|heures|j\b)/i;
var DURATION_LONG_RE = /(\d+)\s*(mois|trimestre|trimestres|an|ans|année|années|semestre|semestres)/i;

/**
 * Vérifie si le candidat a atteint le seuil pour "Ta signature".
 * Seuil : 3 briques blindées (armored) couvrant 2+ cauchemars différents.
 * @param {Array} bricks
 * @returns {boolean}
 */
export function hasReachedSignatureThreshold(bricks) {
  if (!bricks || bricks.length === 0) return false;
  var armored = bricks.filter(function(b) {
    if (b.status !== "validated" || b.type !== "brick") return false;
    return assessBrickArmor(b).status === "armored";
  });
  if (armored.length < 3) return false;
  // Count distinct nightmares covered by armored bricks
  var nightmareIds = {};
  armored.forEach(function(b) {
    if (b.kpiRefMatch && b.kpiRefMatch.name) {
      nightmareIds[b.kpiRefMatch.name] = true;
    }
    if (b.nightmareText) {
      nightmareIds[b.nightmareText] = true;
    }
    if (b.kpi) {
      nightmareIds[b.kpi] = true;
    }
  });
  return Object.keys(nightmareIds).length >= 2;
}

/**
 * Génère 2 hypothèses de signature à partir des briques blindées.
 * Les hypothèses restent masquées jusqu'à l'écran 2 (croisement).
 *
 * Sources :
 * - Mots-clés communs des réponses angle 3 (transférabilité) des briques blindées
 * - Cauchemars couverts : quelle méthode neutralise le plus de cauchemars
 * - Ratio effort/résultat dans les chiffres des briques
 * - Ratio réactif/proactif
 *
 * PAS les piliers. Les piliers sont des prises de position. La signature est une preuve de capacité.
 *
 * @param {Array} bricks - briques blindées uniquement
 * @param {Array} nightmares - cauchemars actifs
 * @returns {Array} 2 hypothèses [{ text, confidence, sources }]
 */
export function generateMaskedHypotheses(bricks, nightmares) {
  var armored = bricks.filter(function(b) {
    return b.status === "validated" && b.type === "brick" && assessBrickArmor(b).status === "armored";
  });
  if (armored.length === 0) return [];

  // Extract transferability keywords from angle 3 stress test responses
  var transferKeywords = {};
  armored.forEach(function(b) {
    if (b.stressTest && b.stressTest.angle3 && b.stressTest.angle3.response) {
      var resp = b.stressTest.angle3.response;
      Object.keys(resp).forEach(function(k) {
        if (resp[k]) {
          var words = resp[k].toLowerCase().split(/\s+/).filter(function(w) { return w.length > 4; });
          words.forEach(function(w) {
            var clean = w.replace(/[.,;:!?'"()]/g, "");
            if (clean.length > 4) transferKeywords[clean] = (transferKeywords[clean] || 0) + 1;
          });
        }
      });
    }
    // Also scan brick text
    if (b.text) {
      var words = b.text.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 5; });
      words.forEach(function(w) {
        var clean = w.replace(/[.,;:!?'"()]/g, "");
        if (clean.length > 5) transferKeywords[clean] = (transferKeywords[clean] || 0) + 1;
      });
    }
  });

  // Sort keywords by frequency
  var sortedKeywords = Object.keys(transferKeywords).sort(function(a, b) {
    return transferKeywords[b] - transferKeywords[a];
  }).slice(0, 10);

  // Identify which nightmares are covered
  var coveredNightmares = [];
  if (nightmares) {
    nightmares.forEach(function(n) {
      var covered = armored.some(function(b) {
        if (!b.kpi) return false;
        return n.kpis && n.kpis.some(function(k) {
          return b.kpi.toLowerCase().indexOf(k.toLowerCase().slice(0, 6)) !== -1;
        });
      });
      if (covered) coveredNightmares.push(n);
    });
  }

  // Compute meta-patterns to feed hypotheses
  var meta = computeMetaPatterns(armored);

  // Build hypothesis 1: based on method/archetype
  var archetypeLabels = {
    "pompier": "résoudre les crises que personne d'autre ne prend en charge",
    "médiateur": "débloquer les situations par la mobilisation des bonnes personnes",
    "bâtisseur": "construire des systèmes qui produisent des résultats durables",
    "catalyseur": "faire produire le résultat par d'autres en alignant les parties prenantes",
  };
  var archetypeDesc = archetypeLabels[meta.archetype] || "produire un résultat mesurable dans un contexte contraint";

  var hyp1Sources = ["archétype: " + meta.archetype, "ratio réactif/proactif: " + Math.round(meta.reactiveRatio * 100) + "/" + Math.round(meta.proactiveRatio * 100)];
  if (coveredNightmares.length > 0) hyp1Sources.push("cauchemars neutralisés: " + coveredNightmares.length);

  var hypothesis1 = {
    text: "Ta capacité distinctive est de " + archetypeDesc + ". " + (meta.tempo === "court" ? "Tu interviens vite — tempo court." : "Tu construis sur la durée — tempo long."),
    confidence: Math.min(90, 50 + armored.length * 10 + coveredNightmares.length * 5),
    sources: hyp1Sources,
  };

  // Build hypothesis 2: based on nightmare coverage + transferability keywords
  var topKeywords = sortedKeywords.slice(0, 3).join(", ");
  var nightmareLabels = coveredNightmares.map(function(n) { return n.label || n.nightmareShort; }).join(" et ");

  var hyp2Text = coveredNightmares.length > 0
    ? "Tu neutralises " + nightmareLabels + " par une approche " + (meta.modifier === "transverse" ? "transverse" : "directe") + (topKeywords ? " centrée sur " + topKeywords : "") + "."
    : "Ta méthode " + (meta.modifier === "transverse" ? "transverse" : "directe") + (topKeywords ? " autour de " + topKeywords : "") + " produit des résultats que les profils classiques ne répliquent pas.";

  var hypothesis2 = {
    text: hyp2Text,
    confidence: Math.min(85, 40 + coveredNightmares.length * 15 + (topKeywords ? 10 : 0)),
    sources: ["cauchemars: " + (nightmareLabels || "aucun"), "mots-clés transférabilité: " + (topKeywords || "aucun"), "modificateur: " + meta.modifier],
  };

  return [hypothesis1, hypothesis2];
}

/**
 * Calcule le ratio réactif/proactif et le modificateur direct/transverse.
 *
 * Pattern réactif : intervention quand ça casse. Urgence, sollicitation externe,
 * delta négatif-vers-zéro, résolution rapide.
 * Pattern proactif : construction avant que ça casse. Anticipation, initiative propre,
 * delta zéro-vers-positif, résultat long terme.
 *
 * Modificateur direct : le candidat produit le résultat lui-même.
 * Modificateur transverse : le candidat fait produire le résultat par d'autres.
 * Détection : verbes de mobilisation vs verbes d'exécution.
 *
 * Troisième axe : tempo (court/long). "Résolu en 48h" vs "déployé sur 18 mois."
 *
 * @param {Array} bricks - briques blindées
 * @returns {object} { reactiveRatio, proactiveRatio, modifier: "direct"|"transverse", tempo: "court"|"long", archetype: "pompier"|"médiateur"|"bâtisseur"|"catalyseur" }
 */
export function computeMetaPatterns(bricks) {
  var reactiveSignals = 0;
  var proactiveSignals = 0;
  var directVerbs = 0;
  var transverseVerbs = 0;
  var shortDurations = 0;
  var longDurations = 0;

  var reactiveMarkers = ["urgence", "urgent", "crise", "problème", "probleme", "incident", "bug", "panne", "chute", "baisse", "perte", "hémorragie", "hemorragie", "fuite", "sollicité", "sollicite", "appelé", "appele", "demandé", "demande", "rattraper", "sauver", "récupéré", "recupere", "corrigé", "corrige", "réparé", "repare", "résolu", "resolu", "stoppé", "stoppe"];
  var proactiveMarkers = ["anticipé", "anticipe", "créé", "cree", "construit", "lancé", "lance", "initié", "initie", "mis en place", "structuré", "structure", "industrialisé", "industrialise", "automatisé", "automatise", "déployé", "deploye", "conçu", "concu", "installé", "installe", "développé", "developpe", "fondé", "fonde", "bâti", "bati", "piloté", "pilote", "programme"];

  bricks.forEach(function(b) {
    var fullText = (b.text || "").toLowerCase();
    // Include stress test responses
    if (b.stressTest) {
      ["angle1", "angle2", "angle3", "angle4", "angle5"].forEach(function(a) {
        var st = b.stressTest[a];
        if (st && st.response) {
          Object.keys(st.response).forEach(function(k) { if (st.response[k]) fullText += " " + st.response[k].toLowerCase(); });
        }
      });
    }

    // Reactive vs proactive
    reactiveMarkers.forEach(function(m) { if (fullText.indexOf(m) !== -1) reactiveSignals++; });
    proactiveMarkers.forEach(function(m) { if (fullText.indexOf(m) !== -1) proactiveSignals++; });

    // Direct vs transverse
    VERBS_DIRECT.forEach(function(v) { if (fullText.indexOf(v) !== -1) directVerbs++; });
    VERBS_TRANSVERSE.forEach(function(v) { if (fullText.indexOf(v) !== -1) transverseVerbs++; });

    // Tempo
    if (DURATION_SHORT_RE.test(fullText)) shortDurations++;
    var longMatch = fullText.match(DURATION_LONG_RE);
    if (longMatch) {
      var num = parseInt(longMatch[1], 10);
      var unit = longMatch[2].toLowerCase();
      if (unit === "mois" && num < 3) shortDurations++;
      else longDurations++;
    }
  });

  var totalReactProact = reactiveSignals + proactiveSignals || 1;
  var reactiveRatio = reactiveSignals / totalReactProact;
  var proactiveRatio = proactiveSignals / totalReactProact;

  var modifier = transverseVerbs > directVerbs ? "transverse" : "direct";
  var tempo = shortDurations > longDurations ? "court" : "long";

  // Archetype
  var archetype;
  if (reactiveRatio >= 0.5 && modifier === "direct") archetype = "pompier";
  else if (reactiveRatio >= 0.5 && modifier === "transverse") archetype = "médiateur";
  else if (proactiveRatio >= 0.5 && modifier === "direct") archetype = "bâtisseur";
  else archetype = "catalyseur";

  return {
    reactiveRatio: reactiveRatio,
    proactiveRatio: proactiveRatio,
    modifier: modifier,
    tempo: tempo,
    archetype: archetype,
  };
}

/**
 * Croise la réponse du candidat (écran 1) avec les hypothèses masquées.
 * 3 résultats possibles : convergence forte, convergence partielle, divergence.
 *
 * @param {string} candidateResponse - réponse à la question comportementale
 * @param {Array} hypotheses - les 2 hypothèses masquées
 * @returns {object} { type: "convergence"|"partial"|"divergence", matchedHypothesis, diagnostic }
 */
export function crossReferenceSignature(candidateResponse, hypotheses) {
  if (!candidateResponse || !hypotheses || hypotheses.length === 0) {
    return { type: "divergence", matchedHypothesis: null, diagnostic: "Réponse insuffisante pour le croisement." };
  }

  var responseLower = candidateResponse.toLowerCase();
  var responseWords = responseLower.split(/\s+/).filter(function(w) { return w.length > 3; }).map(function(w) {
    return w.replace(/[.,;:!?'"()]/g, "");
  });

  // Score each hypothesis against the response
  var scores = hypotheses.map(function(hyp, idx) {
    var hypWords = hyp.text.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 3; }).map(function(w) {
      return w.replace(/[.,;:!?'"()]/g, "");
    });

    var matchCount = 0;
    responseWords.forEach(function(rw) {
      if (hypWords.some(function(hw) { return hw === rw || hw.indexOf(rw) !== -1 || rw.indexOf(hw) !== -1; })) {
        matchCount++;
      }
    });

    // Also check for semantic proximity via key concept overlap
    var conceptMarkers = {
      reactive: ["urgence", "crise", "problème", "probleme", "résolu", "resolu", "réparé", "repare", "sauvé", "sauve", "rattrapé", "rattrape", "bloqué", "bloque", "débloqué", "debloque"],
      proactive: ["construit", "créé", "cree", "lancé", "lance", "anticipé", "anticipe", "structuré", "structure", "déployé", "deploye", "mis en place"],
      transverse: ["équipe", "equipe", "mobilisé", "mobilise", "aligné", "aligne", "coordonné", "coordonne", "fédéré", "federe", "convaincu"],
      direct: ["seul", "moi-même", "personnellement", "j'ai", "codé", "code", "vendu", "livré", "livre", "analysé", "analyse"],
    };

    var conceptScore = 0;
    Object.keys(conceptMarkers).forEach(function(concept) {
      var inResponse = conceptMarkers[concept].some(function(m) { return responseLower.indexOf(m) !== -1; });
      var inHypothesis = conceptMarkers[concept].some(function(m) { return hyp.text.toLowerCase().indexOf(m) !== -1; });
      if (inResponse && inHypothesis) conceptScore += 2;
    });

    return { index: idx, wordMatch: matchCount, conceptMatch: conceptScore, total: matchCount + conceptScore };
  });

  // Sort by total score
  scores.sort(function(a, b) { return b.total - a.total; });

  var bestScore = scores[0].total;
  var secondScore = scores.length > 1 ? scores[1].total : 0;

  // Thresholds
  if (bestScore >= 5) {
    return {
      type: "convergence",
      matchedHypothesis: hypotheses[scores[0].index],
      matchedIndex: scores[0].index,
      diagnostic: "Ce que tu décris converge avec ce que tes briques démontrent. Ta signature se dessine.",
    };
  }
  if (bestScore >= 2) {
    return {
      type: "partial",
      matchedHypothesis: hypotheses[scores[0].index],
      matchedIndex: scores[0].index,
      secondHypothesis: hypotheses.length > 1 ? hypotheses[scores[1] ? scores[1].index : 0] : null,
      diagnostic: "Convergence partielle. Ta réponse croise une partie de ce que tes briques révèlent. L'écart entre ce que tu dis et ce que tes preuves montrent est lui-même un signal.",
    };
  }
  return {
    type: "divergence",
    matchedHypothesis: null,
    hypotheses: hypotheses,
    diagnostic: "Ce que tu décris ne recoupe pas ce que tes briques prouvent. L'écart n'est pas un problème — c'est une information. Choisis la force que tu veux armer.",
  };
}

/**
 * Valide la formulation de la signature par le candidat (écran 3).
 * 3 filtres :
 * - Densité : contient un chiffre OU un contexte spécifique
 * - Cohérence : au moins un mot-clé apparaît dans les briques blindées
 * - Longueur : moins de 25 mots
 *
 * @param {string} formulation - la phrase du candidat
 * @param {Array} bricks - briques blindées
 * @returns {object} { valid, failedFilters: [], suggestion: string|null }
 */
export function validateSignatureFormulation(formulation, bricks) {
  if (!formulation || formulation.trim().length === 0) {
    return { valid: false, failedFilters: ["densité", "cohérence", "longueur"], suggestion: null };
  }

  var text = formulation.trim();
  var textLower = text.toLowerCase();
  var words = text.split(/\s+/);
  var failedFilters = [];

  // Filter 1: Densité — contains a number OR a specific context
  var hasNumber = /\d/.test(text);
  var contextMarkers = ["mois", "semaine", "trimestre", "an", "année", "années", "équipe", "equipe", "clients", "comptes", "collaborateurs", "personnes", "millions", "k€", "m€", "%", "secteur", "marché", "marche", "pipeline", "portefeuille", "budget", "projet", "produit", "croissance", "chiffre", "revenue", "contrat"];
  var hasContext = contextMarkers.some(function(m) { return textLower.indexOf(m) !== -1; });
  if (!hasNumber && !hasContext) failedFilters.push("densité");

  // Filter 2: Cohérence — at least one keyword from armored bricks
  var armoredTexts = "";
  bricks.forEach(function(b) {
    if (b.status === "validated" && b.type === "brick" && assessBrickArmor(b).status === "armored") {
      armoredTexts += " " + (b.text || "").toLowerCase();
    }
  });
  var formulationWords = textLower.split(/\s+/).filter(function(w) { return w.length > 4; }).map(function(w) {
    return w.replace(/[.,;:!?'"()]/g, "");
  });
  var hasCoherence = formulationWords.some(function(fw) {
    return armoredTexts.indexOf(fw) !== -1;
  });
  if (!hasCoherence) failedFilters.push("cohérence");

  // Filter 3: Longueur — less than 25 words
  if (words.length > 25) failedFilters.push("longueur");

  // Generate targeted suggestion for failed filters
  var suggestion = null;
  if (failedFilters.length > 0) {
    var parts = [];
    if (failedFilters.indexOf("densité") !== -1) parts.push("Ajoute un chiffre ou un contexte précis (marché, équipe, durée).");
    if (failedFilters.indexOf("cohérence") !== -1) parts.push("Utilise au moins un terme qui apparaît dans tes briques blindées.");
    if (failedFilters.indexOf("longueur") !== -1) parts.push("Raccourcis : " + words.length + " mots, max 25.");
    suggestion = parts.join(" ");
  }

  return { valid: failedFilters.length === 0, failedFilters: failedFilters, suggestion: suggestion };
}

/**
 * Compute signature armor status.
 * Armored when formulation contains:
 * 1. A number (hasNumbers)
 * 2. A specific context
 * 3. A proof of non-replicability
 *
 * @param {string} formulation
 * @param {Array} bricks - armored bricks
 * @returns {boolean}
 */
export function isSignatureArmored(formulation, bricks) {
  if (!formulation) return false;
  var text = formulation.toLowerCase();

  // 1. Has numbers
  var hasNumbers = /\d/.test(text);

  // 2. Has specific context
  var contextMarkers = ["mois", "semaine", "trimestre", "an", "année", "équipe", "equipe", "clients", "comptes", "personnes", "secteur", "marché", "marche", "pipeline", "portefeuille", "budget", "projet", "produit"];
  var hasContext = contextMarkers.some(function(m) { return text.indexOf(m) !== -1; });

  // 3. Non-replicability — unique combination, personal method, or "seul" indicator
  var nonReplicMarkers = ["seul", "unique", "personne d'autre", "aucun autre", "le premier", "la première", "la seule", "mon approche", "ma méthode", "ma capacité", "ce que je", "ce que personne", "impossible à", "irremplaçable", "non-reproductible", "introuvable"];
  var hasNonReplic = nonReplicMarkers.some(function(m) { return text.indexOf(m) !== -1; });

  return hasNumbers && hasContext && hasNonReplic;
}

/**
 * Filtre post-traitement qui reformule un livrable brut pour intégrer la signature.
 * Ne modifie pas les generators. Se pose dessus.
 * Reformule chaque fait pour exprimer le comment, le tempo, le différentiel.
 *
 * Sans signature : le quoi.
 * Avec signature : le quoi, le comment, et le coût de l'absence.
 *
 * @param {string} rawDeliverable - livrable brut produit par un generator
 * @param {object} signature - { formulation, metaPatterns, armored }
 * @returns {string} livrable filtré
 */
export function applySignatureFilter(rawDeliverable, signature) {
  if (!rawDeliverable || !signature || !signature.formulation) return rawDeliverable;

  var meta = signature.metaPatterns || {};
  var lines = rawDeliverable.split("\n");

  var tempoInsert = meta.tempo === "court" ? "en temps contraint" : "sur la durée";
  var modifierInsert = meta.modifier === "transverse" ? "en mobilisant les parties prenantes" : "par exécution directe";

  // Archetype framing
  var archetypeFrames = {
    "pompier": "quand personne d'autre n'intervient",
    "médiateur": "en débloquant ce qui est enlisé",
    "bâtisseur": "en construisant ce qui n'existait pas",
    "catalyseur": "en faisant produire le résultat par les autres",
  };
  var archetypeFrame = archetypeFrames[meta.archetype] || "";

  var filtered = lines.map(function(line) {
    var trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) return line;

    // Only augment lines that look like achievement bullets (start with - or • or contain numbers)
    var isBullet = /^[-•●▸►]/.test(trimmed) || /^\d/.test(trimmed);
    var hasAchievement = /\d/.test(trimmed) && (trimmed.indexOf("%") !== -1 || trimmed.indexOf("€") !== -1 || trimmed.indexOf("K") !== -1 || trimmed.indexOf("M") !== -1 || trimmed.indexOf("x") !== -1);

    if (isBullet && hasAchievement) {
      // Append the how + tempo
      var suffix = " — " + modifierInsert + ", " + tempoInsert;
      if (archetypeFrame) suffix += " (" + archetypeFrame + ")";
      return line + suffix;
    }

    return line;
  });

  return filtered.join("\n");
}
