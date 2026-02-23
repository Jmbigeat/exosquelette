/* ITERATION 6 — Readiness diagnostic */
export function estimateReadiness(cvText, offersText) {
  var cvLower = (cvText || "").toLowerCase();
  var score = 0;
  var details = [];

  // Check for number présence (quantifiable expérience)
  var hasNumbers = /\d+%|\d+k|\d+m|\d+ comptes|\d+ commerciaux|\d+ mois|\d+ clients|\d+ personnes/.test(cvLower);
  if (hasNumbers) { score += 2; details.push({ label: "Chiffres détectés", ok: true }); }
  else { details.push({ label: "Aucun chiffre détecté", ok: false }); }

  // Check for method markers
  var methodMarkers = ["mis en place", "deploye", "structure", "construit", "lance", "cree", "restructure", "implemente", "optimise", "pilote"];
  var hasMethods = methodMarkers.some(function(m) { return cvLower.indexOf(m) !== -1; });
  if (hasMethods) { score += 2; details.push({ label: "Méthodes détectées", ok: true }); }
  else { details.push({ label: "Pas de méthode identifiée", ok: false }); }

  // Check for leadership/decision markers
  var leadershipMarkers = ["équipe", "manage", "dirige", "recrute", "forme", "aligne", "convaincu", "arbitre", "decide"];
  var hasLeadership = leadershipMarkers.some(function(m) { return cvLower.indexOf(m) !== -1; });
  if (hasLeadership) { score += 2; details.push({ label: "Signaux de leadership", ok: true }); }
  else { details.push({ label: "Pas de leadership identifié", ok: false }); }

  // Check CV length (depth of material)
  var cvLen = cvText.trim().length;
  if (cvLen > 500) { score += 1; details.push({ label: "Profil détaillé (" + cvLen + " car.)", ok: true }); }
  else if (cvLen > 100) { details.push({ label: "Profil court — moins de matière", ok: false }); }
  else { details.push({ label: "Profil très court — extraction difficile", ok: false }); }

  // Check for tool/framework names
  var toolMarkers = ["salesforce", "hubspot", "meddic", "crm", "erp", "notion", "jira", "scrum", "agile", "okr", "kpi"];
  var hasTools = toolMarkers.some(function(m) { return cvLower.indexOf(m) !== -1; });
  if (hasTools) { score += 1; details.push({ label: "Outils/méthodes nommés", ok: true }); }

  // Estimate brick count
  var estimatedBricks = Math.min(9, Math.max(2, score + 1));
  var estimatedCicatrices = hasLeadership ? 1 : 0;

  return {
    score: score,
    estimatedBricks: estimatedBricks,
    estimatedCicatrices: estimatedCicatrices,
    details: details,
    readiness: score >= 5 ? "fort" : score >= 3 ? "moyen" : "faible",
  };
}

export function hasNumbers(text) {
  return /\d/.test(text);
}

export function hasExternalization(text) {
  var markers = ["le marché", "mon manager", "la direction", "on m'a", "le produit", "le prix etait", "pas ma faute", "l'équipe n'a pas", "le client n'a pas"];
  var lower = text.toLowerCase();
  var count = 0;
  markers.forEach(function(m) { if (lower.indexOf(m) !== -1) count++; });
  var hasOwnership = lower.indexOf("j'ai") !== -1 || lower.indexOf("j'aurais") !== -1 || lower.indexOf("mon erreur") !== -1 || lower.indexOf("ma responsabilite") !== -1;
  return count >= 2 && !hasOwnership;
}

export function hasBlame(text) {
  var markers = ["le produit", "le prix", "le marché", "le budget", "le timing", "la concurrence", "pas de budget"];
  var lower = text.toLowerCase();
  var count = 0;
  markers.forEach(function(m) { if (lower.indexOf(m) !== -1) count++; });
  return count >= 1 && lower.indexOf("j'") === -1 && lower.indexOf("mon") === -1;
}

export function hasDecisionMarkers(text) {
  var actors = ["le board", "le cto", "le ceo", "la direction", "le directeur", "l'équipe", "le manager", "le vp", "le pm", "le product"];
  var tensions = ["voulait", "poussait", "bloquait", "refusait", "opposait", "contestait", "demandait", "exigeait", "insistait"];
  var résolutions = ["j'ai choisi", "j'ai decide", "j'ai propose", "j'ai arbitre", "j'ai tranche", "on a decide", "j'ai recommande"];
  var lower = text.toLowerCase();
  var actorCount = 0; var tensionCount = 0; var résolutionCount = 0;
  actors.forEach(function(a) { if (lower.indexOf(a) !== -1) actorCount++; });
  tensions.forEach(function(t) { if (lower.indexOf(t) !== -1) tensionCount++; });
  résolutions.forEach(function(r) { if (lower.indexOf(r) !== -1) résolutionCount++; });
  return actorCount >= 1 && tensionCount >= 1 && résolutionCount >= 1;
}

export function hasInfluenceMarkers(text) {
  var alignmentWords = ["aligne", "convaincu", "obtenu l'accord", "debloque", "fait valider", "rallie", "consensus", "accepte"];
  var resistanceWords = ["resistant", "bloquait", "refusait", "opposait", "ne voulait pas", "skeptique", "hostile"];
  var lower = text.toLowerCase();
  var aCount = 0; var rCount = 0;
  alignmentWords.forEach(function(a) { if (lower.indexOf(a) !== -1) aCount++; });
  resistanceWords.forEach(function(r) { if (lower.indexOf(r) !== -1) rCount++; });
  return aCount >= 1 && rCount >= 1;
}

// Cicatrice classification: strategic (high value) vs operational (low value)

// Multi-pass anonymization audit system
export function auditAnonymization(text, paranoMode) {
  var passes = [];

  // === PASS 1: Known entities (companies, tools, products) ===
  var pass1 = { name: "Entités connues", findings: [] };
  var knownEntities = ["Salesforce", "HubSpot", "Notion", "Slack", "Spendesk", "Stripe", "Datadog", "Segment", "Amplitude", "Intercom", "Zendesk", "SAP", "Oracle", "Microsoft", "Google", "Amazon", "Meta", "Apple", "Netflix", "Spotify", "Uber", "Airbnb", "Tesla", "LinkedIn", "Twitter", "Figma", "Miro", "Jira", "Confluence", "Asana", "Monday", "Airtable", "Pipedrive", "Zoho", "Freshworks", "Brevo", "Sendinblue", "Doctolib", "BlaBlaCar", "OVH", "Scaleway", "Contentsquare", "Mirakl", "Payfit", "Alan", "Qonto", "Pennylane", "Swile", "Lydia", "Algolia", "Talend", "Criteo", "Deezer", "Meero", "Back Market", "ManoMano", "Vestiaire Collective", "Ledger", "Ivalua", "ContentSquare", "Workday", "ServiceNow", "Snowflake", "Databricks", "Gong", "Outreach", "Clari", "Chorus", "ZoomInfo", "Apollo", "Lusha", "Lemlist", "Phantombuster", "Clay", "Pigment", "Sifflet", "Watershed"];
  var textLower = text.toLowerCase();
  knownEntities.forEach(function(e) {
    var idx = textLower.indexOf(e.toLowerCase());
    if (idx !== -1) {
      pass1.findings.push({ type: "entreprise", value: text.substring(idx, idx + e.length), start: idx, end: idx + e.length });
    }
  });
  passes.push(pass1);

  // === PASS 2: Structural patterns (amounts, emails, dates, phone numbers) ===
  var pass2 = { name: "Patterns structurels", findings: [] };
  // Amounts — threshold depends on parano mode
  var digitThreshold = paranoMode ? 4 : 5;
  var amountRegex = new RegExp("\\b\\d{" + digitThreshold + ",}\\s*(?:euros?|€|\\$|dollars?)?\\b", "gi");
  var m;
  while ((m = amountRegex.exec(text)) !== null) {
    pass2.findings.push({ type: "montant", value: m[0], start: m.index, end: m.index + m[0].length });
  }
  var bigAmountRegex = /\b\d+[\.,]?\d*\s*(?:M|K|Mds?|milliards?|millions?|milliers?)\s*(?:euros?|€|\$|dollars?)?\b/gi;
  while ((m = bigAmountRegex.exec(text)) !== null) {
    pass2.findings.push({ type: "montant", value: m[0], start: m.index, end: m.index + m[0].length });
  }
  // Emails
  var emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  while ((m = emailRegex.exec(text)) !== null) {
    pass2.findings.push({ type: "email", value: m[0], start: m.index, end: m.index + m[0].length });
  }
  // Phone numbers
  var phoneRegex = /(?:\+\d{1,3}\s?)?(?:0\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}|\(\d{1,4}\)\s?\d[\d\s.-]{6,})/g;
  while ((m = phoneRegex.exec(text)) !== null) {
    pass2.findings.push({ type: "telephone", value: m[0], start: m.index, end: m.index + m[0].length });
  }
  // Specific dates (dd/mm/yyyy or month year)
  if (paranoMode) {
    var dateRegex = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g;
    while ((m = dateRegex.exec(text)) !== null) {
      pass2.findings.push({ type: "date", value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  passes.push(pass2);

  // === PASS 3: Contextual heuristics (capitalized words, city names, sector specifics) ===
  var pass3 = { name: "Heuristique contextuelle", findings: [] };
  var commonWords = ["Le", "La", "Les", "Un", "Une", "Des", "Ce", "Cette", "Mon", "Ma", "Mes", "Ton", "Ta", "Tes", "Son", "Sa", "Ses", "Nous", "Vous", "Ils", "Elles", "En", "Pour", "Par", "Sur", "Dans", "Avec", "Sans", "Sous", "Vers", "Chez", "Depuis", "Pendant", "Avant", "Apres", "Entre", "Comme", "Mais", "Ou", "Et", "Donc", "Or", "Ni", "Car", "Que", "Qui", "Si", "Quand", "Chaque", "Tout", "Tous", "Aucun", "Autre", "Meme", "Notre", "Votre", "Leur", "Quelque", "Plusieurs", "Certains", "Croissance", "Reduction", "Deploiement", "Mise", "Construction", "Arbitrage", "Alignement", "Perte", "Lancement", "Restructuration", "Programme", "Pilotage", "Diagnostic", "Correction", "Transition", "Optimisation", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre", "KPI", "MRR", "ARR", "CRM", "SaaS", "B2B", "ROI", "MEDDIC", "SDR", "AE", "PM", "VP", "CTO", "CEO", "CFO", "COO", "CSM", "NRR", "EBITDA", "Mid", "Market", "Scale"];
  // Capitalized words mid-sentence
  var capRegex = /(?:^|[.!?]\s+)\w+|(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)/g;
  var capMatch;
  var allPrevFindings = pass1.findings.concat(pass2.findings);
  while ((capMatch = capRegex.exec(text)) !== null) {
    if (capMatch[1] && commonWords.indexOf(capMatch[1]) === -1) {
      var alreadyFound = allPrevFindings.some(function(f) { return f.value.toLowerCase() === capMatch[1].toLowerCase(); });
      if (!alreadyFound && capMatch[1].length > 2) {
        pass3.findings.push({ type: "nom_propre", value: capMatch[1], start: capMatch.index, end: capMatch.index + capMatch[0].length });
      }
    }
  }
  // Parano: city/region names
  if (paranoMode) {
    var cities = ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Nantes", "Lille", "Strasbourg", "Nice", "Rennes", "Montpellier", "Grenoble", "London", "Berlin", "Amsterdam", "Barcelona", "Madrid", "Dublin", "Lisbon", "Brussels", "New York", "San Francisco", "Boston", "Chicago", "Singapore", "Shanghai", "Tokyo", "Sydney", "Ile-de-France", "Auvergne", "Occitanie", "Normandie", "Bretagne", "PACA"];
    cities.forEach(function(c) {
      var idx = textLower.indexOf(c.toLowerCase());
      if (idx !== -1) {
        var existsAlready = allPrevFindings.concat(pass3.findings).some(function(f) { return f.value.toLowerCase() === c.toLowerCase(); });
        if (!existsAlready) pass3.findings.push({ type: "localisation", value: text.substring(idx, idx + c.length), start: idx, end: idx + c.length });
      }
    });
    // Sector-specific terms that might identify a company
    var sectorTerms = ["serie A", "série B", "serie C", "serie D", "licorne", "pre-IPO", "post-IPO", "CAC 40", "SBF 120", "Next 40", "French Tech 120"];
    sectorTerms.forEach(function(t) {
      var idx = textLower.indexOf(t.toLowerCase());
      if (idx !== -1) {
        pass3.findings.push({ type: "marqueur_secteur", value: text.substring(idx, idx + t.length), start: idx, end: idx + t.length });
      }
    });
  }
  passes.push(pass3);

  // === AGGREGATE ===
  var allFindings = [];
  var seen = {};
  passes.forEach(function(p) {
    p.findings.forEach(function(f) {
      var key = f.value.toLowerCase() + "_" + f.start;
      if (!seen[key]) { seen[key] = true; allFindings.push(Object.assign({}, f, { pass: p.name })); }
    });
  });

  var passesClean = passes.filter(function(p) { return p.findings.length === 0; }).length;
  var confidence = passesClean === 3 ? "OK" : passesClean >= 2 ? "partiel" : "alerte";
  var confidenceColor = confidence === "OK" ? "#4ecca3" : confidence === "partiel" ? "#ff9800" : "#e94560";

  return {
    passes: passes,
    findings: allFindings,
    totalFindings: allFindings.length,
    passesClean: passesClean,
    passesTotal: 3,
    confidence: confidence,
    confidenceColor: confidenceColor,
    paranoMode: paranoMode || false,
    timestamp: Date.now(),
  };
}

// Legacy wrapper for simple detection
export function detectSensitiveData(text) {
  var audit = auditAnonymization(text, false);
  return audit.findings;
}

export function classifyCicatrice(text) {
  var lower = text.toLowerCase();
  var strategicMarkers = ["choisi", "decide", "arbitre", "option", "alternative", "strategi", "prioris", "sacrifie", "renonce", "pari", "risque", "pivot", "enjeu", "dilemme", "compromis", "tranche"];
  var operationalMarkers = ["oublie", "bug", "erreur technique", "plante", "crash", "pas testé", "manque de temps", "pas vérifié", "negligence", "oubli", "pas vu", "backup", "configuration", "serveur", "déploiement raté", "typo"];
  var sCount = 0; var oCount = 0;
  var foundStrategic = []; var foundOperational = [];
  strategicMarkers.forEach(function(m) { if (lower.indexOf(m) !== -1) { sCount++; foundStrategic.push(m); } });
  operationalMarkers.forEach(function(m) { if (lower.indexOf(m) !== -1) { oCount++; foundOperational.push(m); } });
  var totalMarkers = sCount + oCount;
  var confidence = totalMarkers >= 4 ? "forte" : totalMarkers >= 2 ? "moyenne" : "faible";
  var confidenceColor = confidence === "forte" ? "#4ecca3" : confidence === "moyenne" ? "#ff9800" : "#495670";
  if (sCount > oCount) return { type: "stratégique", label: "Échec d'arbitrage", color: "#9b59b6", msg: "Cet échec révèle un choix difficile entre des options viables. C'est une preuve de jugement sous contrainte. Valeur haute pour un recruteur.", foundMarkers: foundStrategic, confidence: confidence, confidenceColor: confidenceColor, markerCount: totalMarkers };
  if (oCount > sCount) return { type: "opérationnel", label: "Échec opérationnel", color: "#ff9800", msg: "Cet échec vient d'un oubli ou d'une erreur technique. Le recruteur retient la capacité à corriger, pas l'échec lui-même. Valeur modérée : insiste sur le fix, pas sur l'erreur.", foundMarkers: foundOperational, confidence: confidence, confidenceColor: confidenceColor, markerCount: totalMarkers };
  return { type: "indéterminé", label: "À préciser", color: "#495670", msg: "L'IA n'identifie pas clairement si cet échec vient d'un arbitrage ou d'une négligence. Précise : était-ce un choix entre deux options, ou un oubli ?", foundMarkers: [], confidence: "faible", confidenceColor: "#495670", markerCount: 0 };
}

export function analyzeVerbs(text) {
  var resultVerbs = ["atteint", "reduit", "construit", "deploye", "genere", "lance", "cree", "transforme", "triple", "double", "elimine", "restructure", "negocie", "ferme", "signe", "arbitre", "aligne", "tranche"];
  var processVerbs = ["contribue", "participe", "aide", "supporte", "accompagne", "gere", "suivi", "collabore", "travaille", "assiste", "implique", "coordonne"];
  var avoidanceVerbs = ["essaye", "tente", "voulu", "espere", "souhaite", "envisage", "prevu"];
  var lower = text.toLowerCase();
  function matchWord(t, w) { return new RegExp("\\b" + w + "\\b").test(t); }
  var r = 0; var p = 0; var a = 0;
  var foundResult = []; var foundProcess = []; var foundAvoidance = [];
  resultVerbs.forEach(function(v) { if (matchWord(lower, v)) { r++; foundResult.push(v); } });
  processVerbs.forEach(function(v) { if (matchWord(lower, v)) { p++; foundProcess.push(v); } });
  avoidanceVerbs.forEach(function(v) { if (matchWord(lower, v)) { a++; foundAvoidance.push(v); } });
  var total = r + p + a;
  if (total === 0) return null;
  return {
    resultPct: Math.round((r / total) * 100),
    processPct: Math.round((p / total) * 100),
    avoidancePct: Math.round((a / total) * 100),
    foundResult: foundResult,
    foundProcess: foundProcess,
    foundAvoidance: foundAvoidance,
  };
}

export function extractBrickSummary(text) {
  var actionVerbs = /\b(construit|déployé|réduit|créé|formé|instauré|imposé|découpé|éliminé|récupéré|lancé|structuré|négocié|aligné|transformé|restructuré|généré|signé|fermé|triplé|doublé)\b/i;
  var hasNum = /\d/;
  var sentences = text.split(/(?:\.\s|\n\n|[!?]\s?)/).map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 5; });
  var best = sentences.find(function(s) { return hasNum.test(s) && actionVerbs.test(s); });
  if (!best) best = sentences.find(function(s) { return hasNum.test(s); });
  if (!best) best = sentences.find(function(s) { return actionVerbs.test(s); });
  if (!best) {
    var blocks = text.split(/\n\n/).filter(function(b) { return b.trim().length > 5; });
    var lastBlock = blocks.length > 0 ? blocks[blocks.length - 1].trim() : "";
    var firstSentence = lastBlock.split(/[.!?]/).filter(function(s) { return s.trim().length > 5; });
    best = firstSentence.length > 0 ? firstSentence[0].trim() : text;
  }
  return best.length > 80 ? best.slice(0, 77) + "..." : best;
}

export function getMaturityLevel(bricks) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.type !== "mission"; });
  if (validated.length < 2) return null;
  var withNumbers = validated.filter(function(b) { return hasNumbers(b.text); }).length;
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; }).length;
  var decisions = validated.filter(function(b) { return b.brickCategory === "decision" || b.brickCategory === "influence"; }).length;
  var ratio = withNumbers / Math.max(validated.length, 1);
  if (ratio >= 0.6 && cicatrices >= 1 && decisions >= 1) return "architecte";
  if (ratio >= 0.5 || decisions >= 1) return "optimiseur";
  return "executant";
}
