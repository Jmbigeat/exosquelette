import { KPI_REFERENCE, BRICK_FIELDS, SEED_TEMPLATES, ROLE_PILLARS } from "./references.js";
import { cleanRedac } from "./redac.js";
import { getActiveCauchemars } from "./scoring.js";

// Helper — format cost for P&L framing
function formatCost(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return n + "";
}

// Match a brick's KPI text against the référence for a given role
export function matchKpiToReference(kpiText, roleId) {
  if (!roleId || !KPI_REFERENCE[roleId]) return null;
  var roleKpis = KPI_REFERENCE[roleId].kpis;
  var lower = kpiText.toLowerCase();
  var bestMatch = null;
  var bestScore = 0;
  roleKpis.forEach(function(ref) {
    var refLower = ref.name.toLowerCase();
    var words = refLower.split(/[\s\/\(\)]+/).filter(function(w) { return w.length > 3; });
    var score = 0;
    words.forEach(function(w) { if (lower.indexOf(w) !== -1) score++; });
    var aliases = {
      "nrr": "net revenue retention",
      "mrr": "croissance mrr",
      "arr": "valeur contractuelle",
      "churn": "churn predictif",
      "cycle de vente": "vitesse du cycle",
      "pipeline": "volume de prospection",
      "adoption": "adoption rate",
      "retention": "retention",
      "upsell": "expansion revenue",
      "win rate": "taux de conquete",
      "acv": "valeur contractuelle",
      "ltv": "ltv / cac",
      "cac": "ltv / cac",
      "nps": "nps / csat",
      "csat": "nps / csat",
    };
    Object.keys(aliases).forEach(function(alias) {
      if (lower.indexOf(alias) !== -1 && refLower.indexOf(aliases[alias].toLowerCase()) !== -1) score += 2;
    });
    if (score > bestScore) { bestScore = score; bestMatch = ref; }
  });
  return bestScore >= 1 ? bestMatch : null;
}

/* ==============================
   CROSS-ROLE MATCHING — runs bricks against all 10 roles
   Detects alternative paths the client hasn't considered
   ============================== */

export function computeCrossRoleMatching(bricks, currentRoleId, trajectoryToggle) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.kpi; });
  if (validated.length < 3) return null;

  var roleIds = Object.keys(KPI_REFERENCE);
  var results = [];

  roleIds.forEach(function(roleId) {
    if (roleId === currentRoleId) return;
    var roleData = KPI_REFERENCE[roleId];
    var elasticMatches = 0;
    var stableMatches = 0;
    var totalMatches = 0;
    var matchedKpis = [];

    validated.forEach(function(b) {
      var match = matchKpiToReference(b.kpi, roleId);
      if (match) {
        totalMatches++;
        if (match.elasticity === "élastique") { elasticMatches++; matchedKpis.push({ kpi: match.name, elasticity: match.elasticity, brick: b.text.length > 50 ? b.text.slice(0, 50) + "..." : b.text }); }
        else if (match.elasticity === "stable") { stableMatches++; }
      }
    });

    if (elasticMatches >= 2 || totalMatches >= 3) {
      results.push({
        roleId: roleId,
        role: roleData.role,
        sector: roleData.sector,
        elasticMatches: elasticMatches,
        stableMatches: stableMatches,
        totalMatches: totalMatches,
        coverage: Math.round((totalMatches / 5) * 100),
        matchedKpis: matchedKpis,
      });
    }
  });

  // Sort by elastic matches, then total
  results.sort(function(a, b) {
    if (b.elasticMatches !== a.elasticMatches) return b.elasticMatches - a.elasticMatches;
    return b.totalMatches - a.totalMatches;
  });

  // Get current role coverage for comparison
  var currentElastic = 0;
  var currentTotal = 0;
  validated.forEach(function(b) {
    var match = matchKpiToReference(b.kpi, currentRoleId);
    if (match) {
      currentTotal++;
      if (match.elasticity === "élastique") currentElastic++;
    }
  });

  // Only return results that match better than current role or reveal something new
  var meaningful = results.filter(function(r) {
    return r.elasticMatches >= currentElastic || (r.elasticMatches >= 2 && r.coverage >= 40);
  });

  if (meaningful.length === 0) return null;

  return {
    currentRole: KPI_REFERENCE[currentRoleId] ? KPI_REFERENCE[currentRoleId].role : "",
    currentElastic: currentElastic,
    currentTotal: currentTotal,
    currentCoverage: Math.round((currentTotal / 5) * 100),
    alternatives: meaningful.slice(0, 3),
    trajectory: trajectoryToggle,
  };
}

export function getBrickFields(seed) {
  if (seed.type === "unfair_advantage") return BRICK_FIELDS.unfair;
  if (seed.type === "take") return BRICK_FIELDS.take;
  if (seed.type === "cicatrice") return BRICK_FIELDS.cicatrice;
  if (seed.brickCategory === "decision") return BRICK_FIELDS.decision;
  if (seed.brickCategory === "influence") return BRICK_FIELDS.influence;
  return BRICK_FIELDS.chiffre;
}

export function assembleFieldsToText(fields, fieldDefs) {
  return fieldDefs.map(function(f) {
    var val = fields[f.key] || "";
    return val.trim() ? f.label + " : " + val.trim() : "";
  }).filter(function(l) { return l.length > 0; }).join(". ") + ".";
}

export function generateAdaptiveSeeds(roleId) {
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;
  if (!roleData) {
    // Fallback: generic seeds if no role
    roleData = KPI_REFERENCE["enterprise_ae"];
  }

  var kpis = roleData.kpis;
  var elasticKpis = kpis.filter(function(k) { return k.elasticity === "élastique"; });
  var stableKpis = kpis.filter(function(k) { return k.elasticity === "stable"; });

  // Map KPIs to cauchemars for nightmare text
  function findCauchemar(kpi) {
    return getActiveCauchemars().find(function(c) {
      return c.kpis.some(function(ck) { return kpi.name.toLowerCase().indexOf(ck.toLowerCase().slice(0, 6)) !== -1 || ck.toLowerCase().indexOf(kpi.name.toLowerCase().slice(0, 6)) !== -1; });
    }) || null;
  }

  var seeds = [];
  var id = 1;

  // 5 chiffre seeds — one per KPI (elastic first)
  var orderedKpis = elasticKpis.concat(stableKpis).concat(kpis.filter(function(k) { return k.elasticity === "sous_pression"; }));
  var chiffreTemplates = ["chiffre_1", "chiffre_2", "chiffre_3", "chiffre_4", "chiffre_5"];

  orderedKpis.slice(0, 5).forEach(function(kpi, i) {
    var tpl = SEED_TEMPLATES[chiffreTemplates[i]] || SEED_TEMPLATES.chiffre_1;
    var cauch = findCauchemar(kpi);
    seeds.push({
      id: id++, type: "preuve", brickCategory: tpl.brickCategory,
      question: tpl.question(kpi, false),
      context: tpl.context(kpi),
      hint: tpl.hint(kpi),
      generatedText: null, // Will be forged from client answer
      advocacyText: null,
      internalAdvocacy: null,
      controlRisk: kpi.elasticity === "sous_pression" ? "Ce KPI est automatisable. Si c'est ta meilleure preuve, le recruteur doute. Trouve un angle élastique." : null,
      sectoralNote: null,
      verbNote: null,
      omegaNote: null,
      missionText: tpl.missionText ? tpl.missionText(kpi) : null,
      nightmareText: tpl.nightmareGen ? tpl.nightmareGen(kpi, cauch) : null,
      anonymizedText: null,
      kpi: kpi.name,
      elasticity: kpi.elasticity,
      elasticityNote: kpi.why,
      skills: [],
      usedIn: ["CV", "Simulateur", "Posts LinkedIn"],
    });
  });

  // 1 decision seed
  var dTpl = SEED_TEMPLATES.decision;
  seeds.push({
    id: id++, type: "preuve", brickCategory: "decision",
    question: dTpl.question(), context: dTpl.context(), hint: dTpl.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null, missionText: null,
    nightmareText: dTpl.nightmareGen(), anonymizedText: null,
    kpi: "Jugement stratégique", elasticity: "élastique",
    elasticityNote: "L'IA accélère l'exécution. La prise de décision sous contrainte reste humaine.",
    skills: [], usedIn: ["CV", "Simulateur", "Duel"],
  });

  // 1 influence seed
  var iTpl = SEED_TEMPLATES.influence;
  seeds.push({
    id: id++, type: "preuve", brickCategory: "influence",
    question: iTpl.question(), context: iTpl.context(), hint: iTpl.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null, missionText: null,
    nightmareText: iTpl.nightmareGen(), anonymizedText: null,
    kpi: "Influence transverse", elasticity: "élastique",
    elasticityNote: "Plus les organisations deviennent matricielles, plus l'influence sans autorité devient critique.",
    skills: [], usedIn: ["CV", "Simulateur", "Duel"],
  });

  // 2 cicatrice seeds
  var c1 = SEED_TEMPLATES.cicatrice_1;
  seeds.push({
    id: id++, type: "cicatrice", brickCategory: "chiffre",
    question: c1.question(), context: c1.context(), hint: c1.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null,
    missionText: c1.missionText(), nightmareText: null, anonymizedText: null,
    kpi: "Lecture client", elasticity: null, elasticityNote: null,
    skills: [], usedIn: ["Simulateur", "Duel", "Posts LinkedIn"],
    blameDetection: true,
  });

  var c2 = SEED_TEMPLATES.cicatrice_2;
  seeds.push({
    id: id++, type: "cicatrice", brickCategory: "chiffre",
    question: c2.question(), context: c2.context(), hint: c2.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null,
    missionText: c2.missionText(), nightmareText: null, anonymizedText: null,
    kpi: "Capacité d'adaptation", elasticity: null, elasticityNote: null,
    skills: [], usedIn: ["Simulateur", "Duel", "CV"],
    externalizeDetection: true,
  });

  // 2 take seeds
  var t1 = SEED_TEMPLATES.take_1;
  seeds.push({
    id: id++, type: "take",
    question: t1.question(), context: t1.context(), hint: t1.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null, missionText: null,
    nightmareText: null, anonymizedText: null,
    kpi: null, elasticity: null, elasticityNote: null,
    skills: [], usedIn: ["Piliers de Singularité", "Posts LinkedIn", "Commentaires LinkedIn"],
    surfacePatterns: t1.surfacePatterns,
  });

  var t2 = SEED_TEMPLATES.take_2;
  seeds.push({
    id: id++, type: "take",
    question: t2.question(), context: t2.context(), hint: t2.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null, missionText: null,
    nightmareText: null, anonymizedText: null,
    kpi: null, elasticity: null, elasticityNote: null,
    skills: [], usedIn: ["Piliers de Singularité", "Posts LinkedIn", "Script de contact"],
    surfacePatterns: t2.surfacePatterns,
  });

  // UNFAIR ADVANTAGE SEED — Item 4
  var ua = SEED_TEMPLATES.unfair_advantage;
  seeds.push({
    id: id++, type: "unfair_advantage", brickCategory: "chiffre",
    question: ua.question(), context: ua.context(), hint: ua.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null, missionText: null,
    nightmareText: ua.nightmareGen ? ua.nightmareGen() : null, anonymizedText: null,
    kpi: "Avantage injuste", elasticity: null, elasticityNote: null,
    skills: [], usedIn: ["Rapport d'impact", "CV header", "Bio LinkedIn", "Script de contact"],
  });

  return seeds;
}

/* ==============================
   TAKE DEPTH ANALYSIS — surface vs deep
   ============================== */

export function analyzeTakeDepth(text, surfacePatterns) {
  var lower = text.toLowerCase();
  var words = text.split(/\s+/).length;

  // Check surface patterns
  var surfaceHits = [];
  if (surfacePatterns) {
    surfacePatterns.forEach(function(p) {
      if (lower.indexOf(p) !== -1) surfaceHits.push(p);
    });
  }

  // Check depth markers
  var depthMarkers = {
    contrarian: ["en réalité", "en fait", "le vrai problème", "ce qu'on ne dit pas", "ce que personne", "a tort", "faux", "incomplet", "illusion", "mythe", "erreur", "contresens"],
    specific: ["%", "x", "fois", "mois", "semaines", "clients", "deals", "équipes", "euros", "budget"],
    causal: ["parce que", "car", "la raison", "le problème c'est", "la conséquence", "résultat", "donc", "ce qui fait que"],
    personal: ["j'ai vu", "j'ai testé", "j'ai mesuré", "mon expérience", "dans ma pratique", "concrètement", "quand j'ai", "chez nous", "sur mon segment"],
  };

  var depthScore = 0;
  var foundDepth = [];
  Object.keys(depthMarkers).forEach(function(cat) {
    depthMarkers[cat].forEach(function(m) {
      if (lower.indexOf(m) !== -1) {
        depthScore++;
        if (foundDepth.indexOf(cat) === -1) foundDepth.push(cat);
      }
    });
  });

  var isSurface = (surfaceHits.length >= 2 && depthScore < 2) || (words < 15 && depthScore === 0);
  var isDeep = depthScore >= 3 && foundDepth.length >= 2;

  return {
    level: isDeep ? "deep" : isSurface ? "surface" : "partial",
    surfaceHits: surfaceHits,
    depthScore: depthScore,
    foundDepth: foundDepth,
    words: words,
  };
}

/* ==============================
   TAKE TO PILLAR — transforms raw take into structured pillar
   ============================== */

export function takeToiPillar(takeText, takeAnalysis) {
  // Extract the contrarian core
  var lower = takeText.toLowerCase();
  var title = "";
  var desc = takeText.length > 120 ? takeText.slice(0, 120) + "..." : takeText;

  // Try to extract the "what everyone thinks vs reality" structure
  var contrarianMarkers = ["en réalité", "en fait", "le vrai problème", "mais", "pourtant", "alors que"];
  var splitPoint = -1;
  contrarianMarkers.forEach(function(m) {
    var idx = lower.indexOf(m);
    if (idx > 10 && (splitPoint === -1 || idx < splitPoint)) splitPoint = idx;
  });

  if (splitPoint > 0) {
    var consensus = takeText.slice(0, splitPoint).trim();
    if (consensus.length > 60) consensus = consensus.slice(0, 60) + "...";
    title = consensus;
  } else {
    // Use first sentence or first 60 chars
    var firstDot = takeText.indexOf(".");
    title = firstDot > 0 && firstDot < 80 ? takeText.slice(0, firstDot) : takeText.slice(0, 60) + "...";
  }

  return { title: title, desc: desc, source: "take", depth: takeAnalysis.level };
}

export function getAdaptivePillars(roleId) {
  return ROLE_PILLARS[roleId] || ROLE_PILLARS["enterprise_ae"];
}

/* ==============================
   ITEM 2 — TRIPLE SORTIE PAR BRIQUE
   CV 6sec + Entretien 3 interlocuteurs + Discovery
   ============================== */

export function generateBrickVersions(brick, targetRoleId) {
  var text = brick.text || "";
  var kpi = brick.kpi || "";
  var category = brick.brickCategory || brick.brickType || "chiffre";
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role : "ce poste";

  // === VERSION CV (6 secondes) ===
  // Extract: action verb + number + minimal context
  var cvVersion = text;
  if (text.length > 120) {
    // Compress: keep first sentence or strongest clause
    var firstDot = text.indexOf(".");
    if (firstDot > 20 && firstDot < 120) {
      cvVersion = text.slice(0, firstDot + 1);
    } else {
      cvVersion = text.slice(0, 120).replace(/\s\S*$/, "") + ".";
    }
  }
  // Ensure starts with action verb if possible
  var actionStarters = ["croissance", "réduction", "déploiement", "lancement", "création", "restructuration", "mise en place", "pilotage", "optimisation", "négociation", "alignement", "construction", "transformation", "accélération", "conception"];
  var startsWithAction = actionStarters.some(function(a) { return cvVersion.toLowerCase().indexOf(a) < 15 && cvVersion.toLowerCase().indexOf(a) !== -1; });
  if (!startsWithAction && /[\+\-]?\d/.test(cvVersion)) {
    // Has numbers but no action start — try to restructure
    var numMatch = cvVersion.match(/([\+\-]?\d[\d.,]*\s*[%KM€]*)/);
    if (numMatch) {
      var numPart = numMatch[1];
      var rest = cvVersion.replace(numPart, "").replace(/^\s*[,:.\-]\s*/, "").trim();
      if (rest.length > 10) {
        cvVersion = rest.charAt(0).toUpperCase() + rest.slice(1);
        if (cvVersion.indexOf(numPart) === -1) cvVersion = cvVersion.replace(/\.$/, "") + " (" + numPart.trim() + ").";
      }
    }
  }

  // === VERSION ENTRETIEN (3 interlocuteurs) ===
  var interviewBase = text;

  // RH — parcours + soft skills
  var rhVersion = "";
  if (category === "cicatrice") {
    rhVersion = "J'ai traversé une situation difficile. " + interviewBase + " Cette expérience m'a appris à prendre du recul et à ajuster ma méthode. C'est ce type de moment qui structure un parcours.";
  } else if (category === "decision") {
    rhVersion = "J'ai été confronté à un choix stratégique. " + interviewBase + " Ce que j'en retiens, c'est ma capacité à trancher sous pression et à assumer les conséquences.";
  } else if (category === "influence") {
    rhVersion = "J'ai dû aligner des personnes aux intérêts divergents. " + interviewBase + " Ce qui m'a marqué, c'est l'importance de la lecture politique dans l'exécution.";
  } else {
    rhVersion = "Dans mon parcours, un moment clé a été quand " + interviewBase.charAt(0).toLowerCase() + interviewBase.slice(1) + " Ce résultat illustre ma façon de travailler : je mesure et j'ajuste jusqu'au résultat.";
  }

  // N+1 — terrain + méthode
  var n1Version = "";
  if (category === "cicatrice") {
    n1Version = "Le problème était concret. " + interviewBase + " La correction que j'ai appliquée ensuite a fonctionné parce que j'avais compris la cause racine, pas juste le symptôme.";
  } else if (category === "decision") {
    n1Version = "Deux options s'opposaient. " + interviewBase + " J'ai chiffré les risques et tranché. La méthode compte autant que le résultat.";
  } else if (category === "influence") {
    n1Version = "Le blocage venait des personnes, pas du process. " + interviewBase + " J'ai résolu ça en travaillant les objections une par une, en commençant par le plus résistant.";
  } else {
    n1Version = "Sur le terrain, voici ce qui s'est passé. " + interviewBase + " La méthode est reproductible. Je l'ai testée sur ce contexte, elle s'adapte à d'autres.";
  }

  // Direction — impact business + P&L
  var dirVersion = "";
  var cauchemar = getActiveCauchemars().find(function(c) {
    return c.kpis && c.kpis.some(function(k) { return kpi.toLowerCase().indexOf(k.toLowerCase().slice(0, 6)) !== -1; });
  });
  var costFrame = cauchemar ? " Ce type de problème coûte entre " + formatCost(cauchemar.costRange[0]) + " et " + formatCost(cauchemar.costRange[1]) + " par an quand il n'est pas résolu." : "";
  if (category === "cicatrice") {
    dirVersion = "L'enjeu business était réel. " + interviewBase + costFrame + " L'échec m'a coûté du temps mais m'a donné un cadre d'analyse que j'applique systématiquement.";
  } else if (category === "decision") {
    dirVersion = "En termes d'impact P&L, voici l'arbitrage. " + interviewBase + costFrame + " La décision a protégé la marge et accéléré l'exécution.";
  } else if (category === "influence") {
    dirVersion = "Le sujet était politique avant d'être opérationnel. " + interviewBase + costFrame + " L'alignement a débloqué l'exécution sur tout le périmètre.";
  } else {
    dirVersion = "L'impact business est mesurable. " + interviewBase + costFrame + " Ce delta se traduit directement en valeur pour l'organisation.";
  }

  // === VERSION DISCOVERY (questions à poser) ===
  var discoveryQuestions = [];
  if (kpi) {
    discoveryQuestions.push("Quel est votre indicateur actuel sur " + kpi + " ? Où en étiez-vous il y a 12 mois ?");
  }
  if (cauchemar) {
    discoveryQuestions.push(cauchemar.nightmareShort.replace(/\.$/, "") + " — c'est une situation que vous rencontrez aujourd'hui ?");
  }
  if (discoveryQuestions.length === 0) {
    discoveryQuestions.push("Quel est le problème le plus coûteux que personne n'a encore résolu dans votre équipe ?");
  }
  discoveryQuestions.push("Qu'est-ce qui a déclenché ce recrutement ?");
  discoveryQuestions.push("Quel profil ne voulez-vous surtout pas reproduire ?");

  return {
    cvVersion: cleanRedac(cvVersion, "livrable"),
    interviewVersions: {
      rh: cleanRedac(rhVersion, "livrable"),
      n1: cleanRedac(n1Version, "livrable"),
      direction: cleanRedac(dirVersion, "livrable"),
    },
    discoveryQuestions: discoveryQuestions.map(function(q) { return cleanRedac(q, "livrable"); }),
  };
}

// Vulnerability audit — assess brick depth when positioned as remedy
export function auditBrickVulnerability(brick) {
  if (!brick || !brick.text) return null;
  var text = brick.text.toLowerCase();
  var hasNumber = /\d/.test(text);
  var hasMethod = ["via", "grace a", "méthode", "process", "programme", "plan", "stratégie", "structure", "deploye", "mis en place", "construit", "installe"].some(function(m) { return text.indexOf(m) !== -1; });
  var hasContext = ["mois", "semaine", "trimestre", "jours", "équipe", "comptes", "commerciaux", "clients", "personnes"].some(function(m) { return text.indexOf(m) !== -1; });
  var hasResult = ["%", "reduction", "croissance", "augmente", "diminue", "multiplie", "atteint", "genere", "ameliore"].some(function(m) { return text.indexOf(m) !== -1; });
  var depth = 0;
  if (hasNumber) depth++;
  if (hasMethod) depth++;
  if (hasContext) depth++;
  if (hasResult) depth++;
  if (brick.corrected) depth++;
  if (depth >= 4) return { level: "blindee", color: "#4ecca3", msg: "Brique blindée. Chiffre, méthode, contexte et résultat." };
  if (depth >= 2) return { level: "credible", color: "#3498db", msg: "Brique crédible mais pas blindée." + (!hasNumber ? " Il manque un chiffre." : "") + (!hasMethod ? " Il manque une méthode." : "") + (!hasContext ? " Il manque un contexte." : "") + " Si tu te positionnes comme le remède, blinde cette brique." };
  return { level: "vulnerable", color: "#e94560", msg: "Brique vulnérable. Si le problème persiste après ton embauche, tu deviens la cible. Ajoute un chiffre, une méthode et un contexte." };
}
