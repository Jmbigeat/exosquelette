/**
 * Post LinkedIn scoring — 4 filtres + variantes (chantier 21)
 *
 * Fonctions :
 *   scoreHook — 4 tests automatiques sur l'accroche (So What, Ennemi, Consensus, Aliénation)
 *   analyzeBodyRetention — détection listes, longueur, paragraphes
 *   marieHookFullPost — 2 tests auto post entier + 2 questions qualitatives
 *   meroeAudit — Phase Miroir (2 auto + 2 quali) + Phase Luis Enrique (3 quali)
 *   generateHookVariants — 2 variantes améliorées si score < 7
 *
 * @module lib/postScore
 */

/* ── Helpers ──────────────────────────────────────────── */

function extractHook(text) {
  if (!text) return "";
  var lines = text.split("\n").filter(function(l) { return l.trim().length > 5; });
  return (lines[0] || "").trim();
}

function wordCount(str) {
  return (str || "").split(/\s+/).filter(function(w) { return w.length > 0; }).length;
}

function normalize(str) {
  return (str || "").toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u").replace(/[ôö]/g, "o").replace(/[îï]/g, "i").replace(/[ç]/g, "c");
}

/* ── SCORE HOOK — 4 tests automatiques Marie Hook ────── */

/**
 * Scores a LinkedIn post hook against 4 automated Marie Hook tests.
 * Tests 5 (Authenticité) and 6 (Mémorabilité) are qualitative → checklist only.
 * @param {string} hook - first sentence of the post (before first line break or period)
 * @param {string} fullContent - entire post content
 * @returns {{ score: number, tests: Array<{ name: string, passed: boolean, message: string }>, maxScore: number }}
 */
export function scoreHook(hook, fullContent) {
  if (!hook && fullContent) hook = extractHook(fullContent);
  if (!hook || hook.length < 5) return { score: 0, tests: [], maxScore: 10 };
  var lower = normalize(hook);

  // Test 1 — SO WHAT
  var genericPatterns = [
    "je suis ravi", "je suis heureux", "je suis fier",
    "aujourd'hui je voudrais", "aujourd'hui je partage",
    "dans cet article", "dans ce post",
    "saviez-vous que", "le saviez-vous",
  ];
  var lowerNorm = normalize(hook);
  var isGeneric = genericPatterns.some(function(p) { return lowerNorm.indexOf(normalize(p)) !== -1; });
  // "Il y a X ans" / "Ça fait X ans" sauf si suivi d'un fait tranchant
  var ilYaMatch = lowerNorm.match(/il y a \d+ ans|ca fait \d+ ans/);
  if (ilYaMatch) {
    var afterMatch = lowerNorm.slice(lowerNorm.indexOf(ilYaMatch[0]) + ilYaMatch[0].length);
    var hasTrenchant = afterMatch.indexOf("j'ai") !== -1 || afterMatch.indexOf("j'étais") !== -1 || afterMatch.indexOf("tout a") !== -1;
    if (!hasTrenchant) isGeneric = true;
  }
  var tooLong = wordCount(hook) > 25;
  var soWhatPassed = !isGeneric && !tooLong;

  // Test 2 — ENNEMI
  var ennemiMarkers = [
    "ne pas", "ne jamais", "ne plus", "n'est pas", "n'a rien a voir",
    "contrairement a", "le probleme c'est", "le vrai sujet", "on se trompe",
    "arretez de", "stop",
    "le mythe de", "la verite sur", "personne ne dit", "tout le monde repete",
  ];
  var provocMarkers = ["vraiment", "serieusement", "encore"];
  var hasEnnemi = ennemiMarkers.some(function(m) { return lowerNorm.indexOf(normalize(m)) !== -1; });
  if (!hasEnnemi && lower.indexOf("?") !== -1) {
    hasEnnemi = provocMarkers.some(function(m) { return lowerNorm.indexOf(normalize(m)) !== -1; });
  }

  // Test 3 — CONSENSUS
  var consensusMarkers = ["et pourtant", "et si", "sauf que", "le probleme", "mais"];
  var hasConsensus = consensusMarkers.some(function(m) { return lowerNorm.indexOf(normalize(m)) !== -1; });
  // "c'est" suivi d'un mot négatif
  if (!hasConsensus) {
    var cestMatch = lowerNorm.match(/c'est\s+(\w+)/);
    if (cestMatch) {
      var negWords = ["faux", "inutile", "mort", "vide", "dangereux", "toxique", "impossible", "absurde"];
      hasConsensus = negWords.indexOf(cestMatch[1]) !== -1;
    }
  }
  // Juxtaposition positif/négatif
  if (!hasConsensus) {
    var juxtapositions = [
      ["bon", "mauvais"], ["reussite", "echec"], ["fort", "faible"],
      ["meilleur", "pire"], ["succes", "echec"], ["gagnant", "perdant"],
    ];
    hasConsensus = juxtapositions.some(function(pair) {
      return lowerNorm.indexOf(pair[0]) !== -1 && lowerNorm.indexOf(pair[1]) !== -1;
    });
  }
  // Pattern "Ton X est Y"
  if (!hasConsensus) {
    hasConsensus = /^ton\s/.test(lowerNorm) || /^ta\s/.test(lowerNorm) || /^tes\s/.test(lowerNorm);
  }

  // Test 4 — ALIÉNATION
  var alienMarkers = ["ton ", "ta ", "tes ", "tu ", "toi"];
  var judgmentWords = ["mauvais", "mediocre", "vide", "faux", "inutile", "mort"];
  var imperatives = ["arrete", "oublie", "refuse", "choisis", "stop"];
  var provoc = ["tant pis", "c'est comme ca", "deal with it"];
  var hasAlienation = alienMarkers.some(function(m) { return lowerNorm.indexOf(normalize(m)) !== -1; });
  if (!hasAlienation) hasAlienation = judgmentWords.some(function(m) { return lowerNorm.indexOf(normalize(m)) !== -1; });
  if (!hasAlienation) hasAlienation = imperatives.some(function(m) { return lowerNorm.indexOf(normalize(m)) !== -1; });
  if (!hasAlienation) hasAlienation = provoc.some(function(m) { return lowerNorm.indexOf(normalize(m)) !== -1; });

  var tests = [
    { name: "soWhat", label: "So What", passed: soWhatPassed, message: soWhatPassed ? "L'accroche sort du lot." : "Ton accroche est générique. Elle ne provoque aucune réaction." },
    { name: "ennemi", label: "Ennemi", passed: hasEnnemi, message: hasEnnemi ? "Antagoniste détecté. Le hook prend position." : "Aucun adversaire. Ton hook est trop consensuel." },
    { name: "consensus", label: "Consensus", passed: hasConsensus, message: hasConsensus ? "Le hook est contre-intuitif." : "Tout le monde serait d'accord avec cette phrase. Casse le consensus." },
    { name: "alienation", label: "Aliénation", passed: hasAlienation, message: hasAlienation ? "Le hook filtre. Il attire ta cible et repousse le reste." : "Ton hook ne filtre personne. Il plaît à tout le monde, donc à personne." },
  ];

  var passedCount = tests.filter(function(t) { return t.passed; }).length;
  var score = Math.round(passedCount * 2.5);

  return { score: score, tests: tests, maxScore: 10 };
}

/* ── ANALYSE RÉTENTION CORPS ─────────────────────────── */

/**
 * Analyzes body retention paragraph by paragraph.
 * Checks for bullets, excessive length, and paragraph structure.
 * @param {string} content - full post content (without hook)
 * @returns {{ issues: Array<{ type: string, message: string }>, clean: boolean }}
 */
export function analyzeBodyRetention(content) {
  if (!content || content.length < 20) return { issues: [], clean: true };
  var paragraphs = content.split("\n\n").filter(function(p) { return p.trim().length > 5; });
  var issues = [];

  // Listes à puces
  if (/^[\-\*•]\s/m.test(content) || /^\d+\.\s/m.test(content)) {
    issues.push({ type: "bullets", message: "Prose brute uniquement. Supprime les listes à puces. LinkedIn n'est pas un PowerPoint." });
  }

  // Longueur > 1500
  if (content.length > 1500) {
    issues.push({ type: "length", message: "Ton post dépasse 1500 caractères. Coupe. Chaque phrase qui n'apporte rien affaiblit celles qui apportent." });
  }

  // Paragraphe > 250 caractères
  paragraphs.forEach(function(p, i) {
    if (p.length > 250) {
      issues.push({ type: "longParagraph", message: "Un paragraphe trop long perd le lecteur. Coupe en blocs de 2-3 lignes." });
    }
  });

  // Moins de 3 paragraphes
  if (paragraphs.length < 3) {
    issues.push({ type: "fewParagraphs", message: "Ton post est un bloc. Aère. Un paragraphe = une idée." });
  }

  return { issues: issues, clean: issues.length === 0 };
}

/* ── MARIE HOOK — POST COMPLET ───────────────────────── */

/**
 * Applies Marie Hook tests to the full post (not just the hook).
 * 2 automated body-level tests + 2 qualitative questions.
 * @param {string} fullContent - entire post content
 * @param {string} hook - first sentence (already scored separately)
 * @returns {{ autoTests: Array<{ name: string, passed: boolean, message: string }>, qualitative: Array<{ id: string, label: string, question: string }> }}
 */
export function marieHookFullPost(fullContent, hook) {
  if (!fullContent || fullContent.length < 40) return { autoTests: [], qualitative: [] };
  if (!hook) hook = extractHook(fullContent);
  var body = fullContent.replace(hook, "").trim();
  var lowerBody = normalize(body);
  var lowerHook = normalize(hook);

  // Test ENNEMI DÉVELOPPÉ
  var ennemiMarkersBody = [
    "ne pas", "ne jamais", "ne plus", "n'est pas",
    "contrairement", "le probleme", "le vrai sujet", "on se trompe",
    "arretez", "stop", "le mythe", "personne ne dit", "tout le monde",
    "erreur", "faux", "a tort",
  ];
  // Check if hook has ennemi
  var hookHasEnnemi = ennemiMarkersBody.some(function(m) { return lowerHook.indexOf(normalize(m)) !== -1; });
  var bodyHasEnnemi = ennemiMarkersBody.some(function(m) { return lowerBody.indexOf(normalize(m)) !== -1; });
  var ennemiDev = !hookHasEnnemi || bodyHasEnnemi; // pass if no ennemi in hook OR body develops it

  // Test DENSITÉ D'INFORMATION
  var paragraphs = fullContent.split("\n\n").filter(function(p) { return p.trim().length > 5; });
  var lower = normalize(fullContent);
  // Count facts: numbers, proper nouns (capitalized words mid-sentence), passé composé
  var numberCount = (fullContent.match(/\d+/g) || []).length;
  var passeCompose = (lower.match(/j'ai |j'etais |j'avais |on a |nous avons |ils ont |elle a |il a /g) || []).length;
  var factsCount = numberCount + passeCompose;
  var ratio = paragraphs.length > 0 ? factsCount / paragraphs.length : 0;
  var densiteOk = ratio >= 0.5;

  var autoTests = [
    { name: "ennemiDev", label: "Ennemi développé", passed: ennemiDev, message: ennemiDev ? "L'antagoniste est développé dans le corps." : "Tu nommes un ennemi en accroche mais tu ne le développes pas. Le lecteur attend le combat." },
    { name: "densite", label: "Densité d'information", passed: densiteOk, message: densiteOk ? "Chaque paragraphe porte du contenu." : paragraphs.length + " paragraphes pour " + factsCount + " fait(s). Densifie ou coupe." },
  ];

  var qualitative = [
    { id: "authenticity", label: "Authenticité", question: "En lisant ce post à voix haute, est-ce que ça sonne comme toi ou comme un template ?" },
    { id: "memorability", label: "Mémorabilité", question: "Ferme les yeux. Quelle phrase reste ? Si aucune ne reste, le post est oubliable." },
  ];

  return { autoTests: autoTests, qualitative: qualitative };
}

/* ── MÉROÉ — EXPERT ÉCRITURE ─────────────────────────── */

/**
 * Returns the Méroé expert writing framework.
 * Phase 1: Miroir (2 auto + 2 qualitative).
 * Phase 2: Luis Enrique (3 confrontational questions, qualitative only).
 * @param {string} fullContent - entire post
 * @param {string} hook - first sentence
 * @returns {{ miroir: { autoTests: Array<{...}>, qualitative: Array<{...}> }, luisEnrique: Array<{ id: string, label: string, question: string }> }}
 */
export function meroeAudit(fullContent, hook) {
  if (!fullContent || fullContent.length < 40) return { miroir: { autoTests: [], qualitative: [] }, luisEnrique: [] };
  if (!hook) hook = extractHook(fullContent);
  var paragraphs = fullContent.split("\n\n").filter(function(p) { return p.trim().length > 5; });

  // Test ANGLE UNIQUE
  var hookKeywords = hook.split(/\s+/).filter(function(w) {
    return w.length > 4 && ["dans", "avec", "pour", "mais", "plus", "cette", "votre", "c'est", "qu'il", "qu'on", "tout", "comme"].indexOf(w.toLowerCase().replace(/[^a-zà-ÿ]/gi, "")) === -1;
  }).map(function(w) { return normalize(w.replace(/[^a-zà-ÿ]/gi, "")); });
  var lastParagraph = paragraphs.length > 0 ? normalize(paragraphs[paragraphs.length - 1]) : "";
  var keywordsInLast = hookKeywords.filter(function(k) { return k.length > 4 && lastParagraph.indexOf(k) !== -1; });
  var angleUnique = hookKeywords.length === 0 || keywordsInLast.length > 0;

  // Test STRUCTURE
  var maxSentences = 0;
  var worstParaIdx = 0;
  paragraphs.forEach(function(p, i) {
    // Count sentences by counting periods (excluding abbreviations)
    var sentences = p.split(/\.\s/).filter(function(s) { return s.trim().length > 10; }).length;
    if (p.trim().endsWith(".")) sentences = Math.max(sentences, 1);
    if (sentences > maxSentences) { maxSentences = sentences; worstParaIdx = i; }
  });
  var structureOk = maxSentences <= 2;

  var miroirAutoTests = [
    { name: "angleUnique", label: "Angle unique", passed: angleUnique, message: angleUnique ? "Le post reste sur son axe." : "Ton post commence sur un sujet et finit sur un autre. Une idée. Un post." },
    { name: "structure", label: "Structure", passed: structureOk, message: structureOk ? "Structure propre. Chaque paragraphe porte une idée." : "Un paragraphe contient " + maxSentences + " phrases. Coupe. 1 paragraphe = 1 idée = 2 phrases max." },
  ];

  var miroirQualitative = [
    { id: "hook_force", label: "Force du hook", question: "Le hook est-il fort parce qu'il est incarné (vécu), ou fort parce qu'il est malin (technique) ? Le premier tient. Le second lasse." },
    { id: "incarnation", label: "Incarnation", question: "Vois-tu une image en lisant ce post (un lieu, un moment, un visage) ? Si non, le post est abstrait. Le concret ancre." },
  ];

  var luisEnrique = [
    { id: "utility_vs_noise", label: "Utilité vs bruit", question: "Ce post apporte-t-il une utilité réelle au lecteur ou est-ce du bruit de plus sur son fil ?" },
    { id: "clarity_vs_ego", label: "Clarté vs ego", question: "Es-tu clair ou est-ce que tu te regardes écrire ?" },
    { id: "reader_vs_self", label: "Lecteur vs auteur", question: "Ce post parle-t-il à ceux que tu veux aider ou à ton propre ego ?" },
  ];

  return { miroir: { autoTests: miroirAutoTests, qualitative: miroirQualitative }, luisEnrique: luisEnrique };
}

/* ── VARIANTES DE HOOK AMÉLIORÉES ────────────────────── */

/**
 * Generates 2 improved hook variants based on failed tests.
 * @param {string} originalHook - the original hook
 * @param {Array} failedTests - array of failed test names
 * @param {object} post - the full post object (for context)
 * @returns {string[]} 2 variant hooks
 */
export function generateHookVariants(originalHook, failedTests, post) {
  if (!originalHook || failedTests.length === 0) return [];
  var variants = [];
  var hookClean = originalHook.replace(/\.$/, "").trim();
  var words = hookClean.split(/\s+/);

  // Transformation par test échoué
  failedTests.forEach(function(testName) {
    if (testName === "ennemi" && variants.length < 2) {
      // Préfixer par une négation
      variants.push(hookClean.replace(/^(.{1})/, function(m) { return m.toUpperCase(); }) + " ? Non. " + (words.length > 5 ? words.slice(0, 5).join(" ") + " n'est pas la solution." : "C'est le problème, pas la solution."));
    }
    if (testName === "consensus" && variants.length < 2) {
      // Inverser l'affirmation
      variants.push("Tout le monde dit : " + hookClean.charAt(0).toLowerCase() + hookClean.slice(1) + ". Et pourtant.");
    }
    if (testName === "alienation" && variants.length < 2) {
      // Adresser directement le lecteur
      variants.push("Ton " + (words.length > 3 ? words.slice(1, 4).join(" ") : hookClean.toLowerCase()) + " est vide. Et tu le sais.");
    }
    if (testName === "soWhat" && variants.length < 2) {
      // Raccourcir + rendre plus tranchant
      var short = words.length > 8 ? words.slice(0, 6).join(" ") + "." : hookClean + ".";
      variants.push(short);
    }
  });

  // S'assurer d'avoir exactement 2
  if (variants.length === 0) {
    variants.push("Personne ne parle de ça. " + hookClean + ".");
    variants.push("Ton " + (words.length > 2 ? words[words.length - 1] : "post") + " ne sert à rien. Voilà pourquoi.");
  }
  while (variants.length < 2) {
    variants.push("Sauf que " + hookClean.charAt(0).toLowerCase() + hookClean.slice(1) + ". Et ça change tout.");
  }

  return variants.slice(0, 2);
}
