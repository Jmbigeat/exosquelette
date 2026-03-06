/**
 * Audit automatique des livrables — Contrôle qualité Établi (chantier 17)
 *
 * 4 principes :
 *   A — Pas générique (testNotGeneric)
 *   B — Contient des preuves (testContainsProof)
 *   C — Parle du destinataire avant le candidat (testRecipientFirst)
 *   D — Calibré pour son canal (testChannelCalibration)
 *
 * @module lib/audit
 */

import { extractBrickSummary } from "./sprint/analysis.js";

/* ── Helpers ────────────────────────────────────────────── */

function tokenize(text) {
  return (text || "").toLowerCase().replace(/[^a-zà-ÿ0-9\s]/gi, " ").split(/\s+/).filter(function(t) { return t.length > 3; });
}

function firstSentence(text) {
  var lines = (text || "").split("\n").filter(function(l) { return l.trim().length > 5; });
  return (lines[0] || "").trim().toLowerCase();
}

/* ── Principe A — Pas générique ─────────────────────────── */

function testNotGeneric(content, bricks) {
  var lower = (content || "").toLowerCase();
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return { passed: false, message: "Ce livrable est trop générique. Il ne contient aucun élément de ton Coffre-Fort. Retourne à la Forge et valide au moins 1 brique avec un chiffre ou un contexte précis.", correctionHint: "Injecte au moins 1 chiffre ou contexte spécifique depuis les briques du candidat." };

  // Check for specific elements from bricks: numbers, segments, identifiable contexts
  var found = false;

  validated.forEach(function(b) {
    if (found) return;
    var bText = (b.text || "");
    // Check for shared specific numbers
    var brickNums = bText.match(/\d[\d\s.,]*\d|\d+/g);
    if (brickNums) {
      brickNums.forEach(function(n) {
        var clean = n.replace(/\s/g, "").replace(",", ".");
        if (clean.length >= 2 && lower.indexOf(clean) !== -1) found = true;
      });
    }
    // Check for significant token overlap (context words)
    var bTokens = tokenize(bText);
    var cTokens = tokenize(content);
    var overlap = 0;
    bTokens.forEach(function(t) {
      if (t.length >= 5 && cTokens.indexOf(t) !== -1) overlap++;
    });
    if (overlap >= 2) found = true;
  });

  return {
    passed: found,
    message: found ? "" : "Ce livrable est trop générique. Il ne contient aucun élément de ton Coffre-Fort. Retourne à la Forge et valide au moins 1 brique avec un chiffre ou un contexte précis.",
    correctionHint: found ? "" : "Injecte au moins 1 chiffre ou contexte spécifique depuis les briques du candidat.",
  };
}

/* ── Principe B — Contient des preuves ──────────────────── */

function testContainsProof(content, bricks) {
  var lower = (content || "").toLowerCase();
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var found = false;

  validated.forEach(function(b) {
    if (found) return;
    var bText = (b.text || "");
    // Look for a specific number from a brick appearing in the content
    var brickNums = bText.match(/\d[\d\s.,]*\d|\d+/g);
    if (brickNums) {
      brickNums.forEach(function(n) {
        var clean = n.replace(/\s/g, "").replace(",", ".");
        if (clean.length >= 2 && lower.indexOf(clean) !== -1) found = true;
      });
    }
    // Also check for brick summary substring (context overlap)
    var summary = extractBrickSummary(bText).toLowerCase();
    if (summary.length >= 15 && lower.indexOf(summary.slice(0, 20).toLowerCase()) !== -1) found = true;
  });

  return {
    passed: found,
    message: found ? "" : "Ce livrable ne contient aucune preuve. Le recruteur lit des affirmations sans fait. Blinde au moins 1 brique dans la Forge.",
    correctionHint: found ? "" : "Référence explicitement au moins 1 brique blindée avec son chiffre d'impact.",
  };
}

/* ── Principe C — Destinataire d'abord ──────────────────── */

function testRecipientFirst(type, content, cauchemars, audience) {
  // CV exception: structural test — "Réalisations" before "Compétences"
  if (type === "cv") {
    var lower = (content || "").toLowerCase();
    var idxRealisations = lower.search(/réalisation|résultat|preuve|impact|\d+\s*%|\d+\s*k€|\d+\s*m€/);
    var idxCompetences = lower.search(/compétence|skill|savoir.faire|expertise|maîtrise/);
    // If competences appears before realisations, fail
    if (idxCompetences !== -1 && idxRealisations !== -1 && idxCompetences < idxRealisations) {
      return {
        passed: false,
        message: "Ton CV place les compétences avant les réalisations. Le recruteur scanne en 6 secondes. Il cherche des résultats, pas des étiquettes. Inverse l'ordre.",
        correctionHint: "Place la section Réalisations avant la section Compétences.",
      };
    }
    return { passed: true, message: "", correctionHint: "" };
  }

  // Interview prep exception: test each version individually
  if (type === "interview_prep") {
    var selfOpeners = /^(je |j'ai |j'|mon parcours|mes compétences|ma carrière|mon expérience)/i;
    // Split by version blocks — look for "Version RH", "Version N+1", "Version Direction" patterns
    var versions = (content || "").split(/version (?:rh|n\+1|direction)|─── version/i);
    var totalVersions = 0;
    var failedVersions = 0;
    versions.forEach(function(v) {
      var trimmed = v.trim();
      if (trimmed.length < 20) return;
      totalVersions++;
      var first = firstSentence(trimmed);
      if (selfOpeners.test(first)) failedVersions++;
    });
    if (totalVersions === 0) return { passed: true, message: "", correctionHint: "" };
    var passed = failedVersions === 0;
    return {
      passed: passed,
      message: passed ? "" : "Une ou plusieurs versions entretien parlent de toi avant de parler du problème. Chaque version ouvre sur le contexte du destinataire.",
      correctionHint: passed ? "" : "Chaque version entretien ouvre sur le contexte du destinataire, pas sur le candidat.",
    };
  }

  var first = firstSentence(content);

  if (audience === "internal") {
    // Internal: first sentence should address cost/risk
    var costWords = /coût|remplacement|vacance|risque|impact|productivité|turnover|départ|perte|budget|charge|recrutement/i;
    var selfWords = /^(je |j'ai |j'|mon parcours|mes compétences|ma carrière)/i;
    if (selfWords.test(first)) {
      return {
        passed: false,
        message: "Ton livrable parle de toi avant de parler du coût pour ton manager. Le risque de ton départ ouvre. Tes preuves suivent.",
        correctionHint: "Commence par le coût du départ pour le manager, pas par le parcours du candidat.",
      };
    }
    var hasCostWord = costWords.test(first);
    return {
      passed: hasCostWord || !selfWords.test(first),
      message: hasCostWord ? "" : "",
      correctionHint: "",
    };
  }

  // External: first sentence targets recipient's problem
  var selfOpeners = /^(je |j'ai |j'|mon parcours|mes compétences|ma carrière)/i;
  if (selfOpeners.test(first)) {
    return {
      passed: false,
      message: "Ton livrable parle de toi avant de parler du recruteur. Inverse. Le cauchemar du recruteur ouvre. Tes preuves suivent.",
      correctionHint: "Commence par le cauchemar du recruteur, pas par le parcours du candidat.",
    };
  }

  // Check for recipient-oriented words
  var recipientWords = /vous|votre|l'équipe|le portefeuille|le marché|le segment|\[prénom\]|\[prenom\]/i;
  var hasCauchRef = false;
  if (cauchemars && cauchemars.length > 0) {
    cauchemars.forEach(function(c) {
      if (c.nightmareShort && first.indexOf(c.nightmareShort.toLowerCase().slice(0, 12)) !== -1) hasCauchRef = true;
      if (c.label && first.indexOf(c.label.toLowerCase().slice(0, 10)) !== -1) hasCauchRef = true;
    });
  }

  var passed = recipientWords.test(first) || hasCauchRef;
  return {
    passed: passed,
    message: passed ? "" : "Ton livrable parle de toi avant de parler du recruteur. Inverse. Le cauchemar du recruteur ouvre. Tes preuves suivent.",
    correctionHint: passed ? "" : "Commence par le cauchemar du recruteur, pas par le parcours du candidat.",
  };
}

/* ── Principe D — Calibré pour son canal ────────────────── */

function testChannelCalibration(type, content) {
  var len = (content || "").length;
  var msg = "";
  var passed = true;

  if (type === "dm") {
    if (len > 300) { passed = false; msg = "DM trop long (" + len + " car.). Maximum 300 caractères."; }
  } else if (type === "email") {
    if (len > 1500) { passed = false; msg = "Email trop long (" + len + " car.). Maximum 1500 caractères."; }
  } else if (type === "cv") {
    // Max 5 bullet lines, each ≤ 2 sentences
    var bulletLines = (content || "").split("\n").filter(function(l) { return /^[•\-\*]\s/.test(l.trim()); });
    if (bulletLines.length > 5) { passed = false; msg = "CV contient " + bulletLines.length + " lignes. Maximum 5 pour un scan en 6 secondes."; }
    var longParas = bulletLines.filter(function(l) { return (l.match(/\./g) || []).length > 2; });
    if (longParas.length > 0) { passed = false; msg = (msg ? msg + " " : "") + "Certaines lignes CV dépassent 2 phrases."; }
  } else if (type === "bio") {
    if (len > 300) { passed = false; msg = "Bio trop longue (" + len + " car.). Maximum 300 caractères."; }
  } else if (type === "plan30j") {
    var weekMarkers = (content || "").match(/S[1-4]|semaine\s*[1-4]/gi) || [];
    if (weekMarkers.length < 4) { passed = false; msg = "Plan 30j ne contient pas les 4 marqueurs de semaine (S1-S4)."; }
  } else if (type === "plan90j") {
    var monthMarkers = (content || "").match(/M[1-3]|mois\s*[1-3]/gi) || [];
    if (monthMarkers.length < 3) { passed = false; msg = "Plan 90j ne contient pas les 3 marqueurs de mois (M1-M3)."; }
  } else if (type === "report") {
    if (!/\d+\s*[K€kM]|\d+\s*€/.test(content || "")) { passed = false; msg = "Le rapport ne contient aucun chiffre de coût en €."; }
  } else if (type === "argument") {
    if (len > 2000) { passed = false; msg = "Argumentaire trop long (" + len + " car.). Maximum 2000 caractères."; }
  } else if (type === "posts") {
    if (len > 1500) { passed = false; msg = "Post trop long (" + len + " car.). Maximum 1500 caractères."; }
    if (/^[•\-]\s/m.test(content || "")) { passed = false; msg = (msg ? msg + " " : "") + "Le post contient des listes à puces. Prose uniquement."; }
  } else if (type === "followup") {
    if (len > 2000) { passed = false; msg = "Message post-entretien trop long (" + len + " car.). Maximum 2000 caractères."; }
  } else if (type === "email_signature") {
    if (len > 80) { passed = false; msg = "Signature email trop longue (" + len + " car.). Maximum 80 caractères."; }
  } else if (type === "questions") {
    var qMatches = (content || "").match(/QUESTION\s+\d+/gi) || [];
    if (qMatches.length < 5 || qMatches.length > 8) { passed = false; msg = "Questions entretien : " + qMatches.length + " questions (attendu 5-8)."; }
    var levelMatches = (content || "").match(/Niveau\s+[3-6]/gi) || [];
    if (levelMatches.length < qMatches.length) { passed = false; msg = (msg ? msg + " " : "") + "Certaines questions n'ont pas de niveau (3-6)."; }
  } else if (type === "interview_prep") {
    // Check each CV line ≤ 150 and each interview version ≤ 800
    // This is a structural check on the formatted output
    passed = true; // Default pass, detailed check below
    var cvLineMatches = (content || "").match(/VERSION CV[^]*?(?=VERSION|$)/gi) || [];
    // Simplified: just check overall length is reasonable
    if (len > 10000) { passed = false; msg = "Préparation entretien trop longue. Condense les versions."; }
  }

  return {
    passed: passed,
    message: passed ? "" : "Ce livrable dépasse le format du canal. " + msg + " Un " + type + " trop long perd le lecteur.",
    correctionHint: passed ? "" : "Réduis à la contrainte du canal : " + msg,
  };
}

/* ── Fonction principale ────────────────────────────────── */

/**
 * Audits a deliverable against 4 quality principles.
 * Called after generation (and after signature filter if active).
 * Returns audit result with score, passed/failed principles, and messages.
 *
 * @param {string} type - deliverable type: 'dm' | 'email' | 'cv' | 'bio' | 'plan30j' | 'plan90j' | 'report' | 'argument' | 'posts' | 'questions' | 'interview_prep'
 * @param {string} content - generated deliverable text
 * @param {Array} bricks - validated bricks from vault
 * @param {Array} cauchemars - active cauchemars
 * @param {string} audience - 'external' | 'internal'
 * @returns {{ score: number, passed: string[], failed: Array<{principle: string, message: string}>, correctionHints: string[] }}
 */
export function auditDeliverable(type, content, bricks, cauchemars, audience) {
  if (!content || content.length < 20) {
    return { score: 0, passed: [], failed: [{ principle: "A", message: "Contenu trop court." }], correctionHints: [] };
  }

  var a = testNotGeneric(content, bricks || []);
  var b = testContainsProof(content, bricks || []);
  var c = testRecipientFirst(type, content, cauchemars || [], audience || "external");
  var d = testChannelCalibration(type, content);

  var passedList = [];
  var failedList = [];
  var hints = [];

  if (a.passed) { passedList.push("A"); } else { failedList.push({ principle: "A", message: a.message }); hints.push(a.correctionHint); }
  if (b.passed) { passedList.push("B"); } else { failedList.push({ principle: "B", message: b.message }); hints.push(b.correctionHint); }
  if (c.passed) { passedList.push("C"); } else { failedList.push({ principle: "C", message: c.message }); hints.push(c.correctionHint); }
  if (d.passed) { passedList.push("D"); } else { failedList.push({ principle: "D", message: d.message }); hints.push(d.correctionHint); }

  return {
    score: passedList.length,
    passed: passedList,
    failed: failedList,
    correctionHints: hints.filter(function(h) { return h && h.length > 0; }),
  };
}
