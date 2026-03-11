import { cleanRedac } from "../sprint/redac.js";
import { hashCode } from "../sprint/scoring.js";
import { extractBrickCore } from "../sprint/brickExtractor.js";
import { applyHints, BIO_VOCAB_INTERDIT } from "./helpers.js";

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
