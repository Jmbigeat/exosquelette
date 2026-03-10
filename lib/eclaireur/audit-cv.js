/**
 * Audits an external CV/bio against the offer analysis.
 * Crosses CV text with cauchemars, KPI, elasticity from analyzeOffer.
 * No account needed. No briques needed. Pure text × offer analysis.
 *
 * @param {string} cvText - candidate's pasted CV/bio
 * @param {object} offerAnalysis - result of analyzeOffer
 * @param {Array} cauchemars - cauchemars for the detected role
 * @returns {{ score: number, tests: Array<{name: string, passed: boolean, label: string, message: string}> }}
 */
var FR_WORDS = ["le", "la", "les", "des", "une", "un", "dans", "pour", "avec", "sur", "qui", "que", "est", "sont", "nous", "vous", "cette", "ces", "mais", "son", "ses", "aux", "par", "entre", "leur", "dont", "aussi", "comme", "après", "avant", "chez", "lors", "puis", "donc", "ainsi"];
var EN_WORDS = ["the", "and", "for", "with", "that", "this", "from", "have", "has", "was", "were", "been", "are", "our", "their", "which", "will", "would", "can", "into", "also", "more", "about", "when", "than", "over", "such", "each", "through", "between", "after", "before", "then"];

/**
 * Detects if text is predominantly English vs French.
 * Uses high-frequency word lists as markers.
 * @param {string} text
 * @returns {boolean} true if text appears to be in English
 */
function detectEnglish(text) {
  if (!text || text.length < 50) return false;
  var tokens = text.toLowerCase().replace(/[^a-zà-ÿ\s]/gi, " ").split(/\s+/);
  var fr = 0;
  var en = 0;
  tokens.forEach(function(t) {
    if (FR_WORDS.indexOf(t) !== -1) fr++;
    if (EN_WORDS.indexOf(t) !== -1) en++;
  });
  if (fr === 0 && en === 0) return false;
  return en > fr;
}

export function auditExternalCV(cvText, offerAnalysis, cauchemars) {
  if (!cvText || cvText.length < 20) {
    return { score: 0, tests: [] };
  }

  // Detect English CV before running French-language tests
  if (detectEnglish(cvText)) {
    return {
      score: null,
      isEnglish: true,
      tests: [],
      message: "Ton CV semble rédigé en anglais. L'outil analyse les marqueurs français. Colle la version française de ton CV pour un diagnostic fiable.",
    };
  }

  var lower = (cvText || "").toLowerCase();
  var tokens = lower.replace(/[^a-zà-ÿ0-9\s]/gi, " ").split(/\s+/).filter(function(t) { return t.length > 2; });

  var tests = [];

  // ── Test 1 — Couverture cauchemars ──
  var activeCauchemars = cauchemars || [];
  if (activeCauchemars.length === 0 && offerAnalysis && offerAnalysis.allCauchemars) {
    activeCauchemars = offerAnalysis.allCauchemars;
  }
  var totalCauch = activeCauchemars.length;
  var coveredCauch = 0;
  var mainCauchLabel = "";
  activeCauchemars.forEach(function(c) {
    if (!mainCauchLabel && c.label) mainCauchLabel = c.label;
    var keywords = (c.kw || []).concat(c.kpis || []).concat(c.matchedKw || []);
    var found = false;
    keywords.forEach(function(kw) {
      if (found) return;
      var kwLower = (kw || "").toLowerCase();
      if (kwLower.length >= 3 && lower.indexOf(kwLower) !== -1) found = true;
    });
    // Also check label words
    if (!found && c.label) {
      var labelWords = c.label.toLowerCase().split(/\s+/).filter(function(w) { return w.length >= 4; });
      labelWords.forEach(function(w) {
        if (found) return;
        if (lower.indexOf(w) !== -1) found = true;
      });
    }
    if (found) coveredCauch++;
  });
  var t1Passed = coveredCauch >= 1;
  tests.push({
    name: "cauchemars",
    passed: t1Passed,
    label: t1Passed ? "Ton CV couvre " + coveredCauch + "/" + totalCauch + " cauchemars du recruteur" : "Ton CV ne répond à aucun cauchemar du recruteur",
    message: t1Passed ? "" : "Le recruteur cherche quelqu'un qui résout " + (mainCauchLabel || "le problème principal") + ". Ton CV n'en parle pas.",
  });

  // ── Test 2 — Présence du KPI caché ──
  var kpi = offerAnalysis && offerAnalysis.revealedKpi ? offerAnalysis.revealedKpi : null;
  var kpiName = kpi ? kpi.name : "";
  var kpiKeywords = kpiName.toLowerCase().split(/\s+/).filter(function(w) { return w.length >= 4; });
  var numbers = cvText.match(/\d+/g) || [];
  var kpiLinked = false;
  numbers.forEach(function(num) {
    if (kpiLinked) return;
    var numIdx = lower.indexOf(num);
    if (numIdx === -1) return;
    // Check if any KPI keyword is within ±30 tokens (approx ±200 chars)
    var window = lower.slice(Math.max(0, numIdx - 200), Math.min(lower.length, numIdx + 200));
    kpiKeywords.forEach(function(kw) {
      if (kpiLinked) return;
      if (window.indexOf(kw) !== -1) kpiLinked = true;
    });
  });
  tests.push({
    name: "kpi",
    passed: kpiLinked,
    label: kpiLinked ? "Ton CV contient un chiffre lié au KPI caché" : "Aucun chiffre sur le KPI caché du recruteur",
    message: kpiLinked ? "" : "Le recruteur cherche un chiffre sur " + (kpiName || "le KPI principal") + ". Ton CV ne contient aucune donnée sur ce sujet.",
  });

  // ── Test 3 — Élasticité (décision vs exécution) ──
  var decisionRegexes = [/d[ée]cid[éeés]/gi, /arbitr[éeés]/gi, /tranch[éeés]/gi, /n[ée]goci[éeés]/gi, /convaincu[eés]?/gi, /restructur[éeés]/gi, /constru[a-z]*/gi, /lanc[éeés]/gi, /pilot[éeés]/gi, /con[çc]u[eés]?/gi, /impos[éeés]/gi, /transform[éeés]/gi];
  var executionRegexes = [/particip[éeés]/gi, /contribu[éeés]/gi, /aid[éeés]/gi, /assist[éeés]/gi, /g[ée]r[éeés]/gi, /support[éeés]/gi, /intervenu[eés]?/gi];
  var decisionCount = 0;
  var executionCount = 0;
  decisionRegexes.forEach(function(re) {
    var matches = lower.match(re);
    if (matches) decisionCount += matches.length;
  });
  executionRegexes.forEach(function(re) {
    var matches = lower.match(re);
    if (matches) executionCount += matches.length;
  });
  var t3Passed = decisionCount >= 2;
  var eLabel = kpi && kpi.elasticity ? kpi.elasticity : "";
  tests.push({
    name: "elasticity",
    passed: t3Passed,
    label: t3Passed ? "Ton CV montre des décisions, pas juste de l'exécution" : "Ton CV liste des tâches, pas des décisions",
    message: t3Passed ? "" : "Le recruteur cherche " + (eLabel === "élastique" ? "de l'influence pure" : eLabel === "sous_pression" ? "de la résistance sous pression" : "des décisions") + ". Ton CV dit 'participé à' et 'contribué à'. Il ne dit pas ce que TU as décidé.",
  });

  // ── Test 4 — Vocabulaire toxique ──
  var toxicWords = ["passionné", "dynamique", "proactif", "orienté résultats", "fort de", "doté de", "riche expérience", "reconnu pour", "expert en", "n'hésitez pas", "ouvert aux opportunités", "à l'écoute du marché", "en quête de nouveaux défis"];
  var weakVerbs = ["participer à", "contribuer à", "être en charge de", "aider à", "assister", "supporter", "intervenir sur"];
  var foundToxic = [];
  toxicWords.forEach(function(tw) {
    if (lower.indexOf(tw.toLowerCase()) !== -1) foundToxic.push(tw);
  });
  var weakCount = 0;
  weakVerbs.forEach(function(wv) {
    if (lower.indexOf(wv.toLowerCase()) !== -1) weakCount++;
  });
  var t4Passed = foundToxic.length === 0 && weakCount <= 2;
  var totalGeneric = foundToxic.length + weakCount;
  tests.push({
    name: "vocabulary",
    passed: t4Passed,
    label: t4Passed ? "Aucun mot générique détecté" : totalGeneric + " mots génériques détectés",
    message: t4Passed ? "" : "Ton CV dit '" + (foundToxic[0] || weakVerbs.find(function(wv) { return lower.indexOf(wv.toLowerCase()) !== -1; }) || "") + "'. " + totalGeneric + " candidats sur 10 utilisent ce mot. Le recruteur l'ignore.",
  });

  // ── Test 5 — Calibration ATMT ──
  var hasAccroche = /\d+/.test(cvText);
  var hasTension = /malgré|alors que|face à|sous contrainte|en dépit de|dans un contexte|bug|bugs|problème|problèmes|racine commune|dette|régression|en urgence|à froid|sans budget|pas de budget|zéro budget|en retard|retard|bloqué|cassé|perdu|échoué|crise|panne|incident/i.test(cvText);
  var hasMethode = /rattrapé|réduit|construit|lancé|restructuré|négocié|piloté|déployé|transformé|doublé|triplé|multiplié/i.test(cvText);
  var detectedRole = offerAnalysis ? offerAnalysis.detectedRoleId : "";
  var roleLabel = offerAnalysis ? offerAnalysis.detectedRoleLabel : "";
  var roleKeywords = (roleLabel || "").toLowerCase().split(/[\s\/\(\)—,]+/).filter(function(w) { return w.length > 3; });
  var hasTransfert = false;
  roleKeywords.forEach(function(rk) {
    if (lower.indexOf(rk) !== -1) hasTransfert = true;
  });

  var layers = [];
  var missingLayers = [];
  if (hasAccroche) layers.push("Accroche"); else missingLayers.push("Accroche");
  if (hasTension) layers.push("Tension"); else missingLayers.push("Tension");
  if (hasMethode) layers.push("Méthode"); else missingLayers.push("Méthode");
  if (hasTransfert) layers.push("Transfert"); else missingLayers.push("Transfert");
  var t5Passed = layers.length >= 3;
  tests.push({
    name: "atmt",
    passed: t5Passed,
    label: t5Passed ? "Structure Fait-Contexte-Action présente" : "Ton CV manque de structure",
    message: t5Passed ? "" : "Ton CV a " + layers.join(" et ") + " mais pas " + missingLayers.join(" ni ") + ".",
  });

  var score = tests.filter(function(t) { return t.passed; }).length;
  return { score: score, tests: tests };
}
