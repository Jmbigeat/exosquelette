/**
 * Generates 5 calibrated questions for a discovery call.
 * Each question is a breadcrumb: it contains an implicit proof reformulated as an open question.
 * The candidate qualifies the role without affirming anything about themselves.
 *
 * @param {Array} bricks - validated bricks
 * @param {string} targetRoleId - target role
 * @param {Array} cauchemars - active cauchemars (role-specific + transversal)
 * @param {object|null} offerSignals - parsed offer signals
 * @param {string|null} seniorityLevel - ic/manager/leader
 * @param {object|null} signature - candidate signature
 * @param {Array|null} hints - correction hints from audit
 * @returns {string} formatted discovery call guide (5 questions + briefing)
 */

import { ROLE_CLUSTERS, SENIORITY_LEVELS, SENIORITY_CALIBRATION } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { extractBrickCore } from "../sprint/brickExtractor.js";
import { applyHints, extractBestNum } from "./helpers.js";

export function generateDiscoveryCall(bricks, targetRoleId, cauchemars, offerSignals, seniorityLevel, signature, hints) {
  var validated = (bricks || []).filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });

  if (validated.length < 2) {
    return "Forge au moins 2 briques pour activer l'appel découverte. L'outil a besoin de matériau pour calibrer tes questions.";
  }

  // Role label
  var cluster = ROLE_CLUSTERS.find(function (rc) {
    return rc.id === targetRoleId;
  });
  var roleLabel = cluster ? cluster.label.split(" / ")[0] : "ce rôle";

  // Seniority
  var sLevel = seniorityLevel || "ic";
  var levelInfo = SENIORITY_LEVELS.find(function (l) { return l.id === sLevel; });
  var seniorityShortLabel = levelInfo ? levelInfo.shortLabel : "IC";
  var calibration = SENIORITY_CALIBRATION[sLevel] || SENIORITY_CALIBRATION.ic;

  // Armored bricks (with numbers)
  var armored = validated.filter(function (b) {
    return (b.armorScore || 0) >= 3;
  });
  if (armored.length < 2) {
    armored = validated.filter(function (b) { return /\d/.test(b.text); });
  }
  armored.sort(function (a, b) { return (b.armorScore || 0) - (a.armorScore || 0); });

  // Active cauchemars
  var activeCauchemars = cauchemars || [];

  // Match cauchemars with bricks
  var cauchWithBrick = [];
  activeCauchemars.forEach(function (c) {
    var match = validated.find(function (b) {
      return c.kpis && c.kpis.some(function (kpi) {
        return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
      });
    });
    cauchWithBrick.push({ cauchemar: c, brick: match || null });
  });

  // Find transversal cauchemars
  var transversals = activeCauchemars.filter(function (c) {
    return c.label && (
      c.label.indexOf("senior") !== -1 ||
      c.label.indexOf("critères") !== -1 ||
      c.label.indexOf("variable") !== -1 ||
      c.label.indexOf("manager junior") !== -1
    );
  });

  // Best covered cauchemar (for Q1)
  var bestCovered = cauchWithBrick.filter(function (cw) { return cw.brick; });
  bestCovered.sort(function (a, b) { return (b.brick.armorScore || 0) - (a.brick.armorScore || 0); });

  // ── BRIEFING ──
  var briefing = "Appel de 15-20 minutes. Objectif : qualifier le poste, pas te vendre.";
  if (offerSignals && offerSignals.cauchemars && offerSignals.cauchemars.length > 0) {
    var topSignal = offerSignals.cauchemars[0];
    briefing = "L'offre signale " + topSignal.label.toLowerCase() + " comme enjeu principal. " +
      "Ton objectif : confirmer que c'est le vrai problème, pas le problème affiché. 15-20 minutes, 5 questions maximum.";
  }

  var questions = [];

  // ── Q1 — TERRAIN (cauchemar opérationnel le plus couvert) ──
  var q1Cauch = bestCovered.length > 0 ? bestCovered[0] : (cauchWithBrick.length > 0 ? cauchWithBrick[0] : null);
  if (q1Cauch) {
    var q1Core = q1Cauch.brick ? extractBrickCore(q1Cauch.brick) : null;
    var q1Verb = q1Core ? (q1Core.actionVerb || "").toLowerCase() : "";
    var q1Context = q1Core ? (q1Core.context || "") : "";
    var q1Label = q1Cauch.cauchemar.label.toLowerCase();

    var q1Text = offerSignals && offerSignals.totalSignals > 0
      ? "L'offre mentionne " + q1Label + ". Concrètement, c'est un chantier en cours chez vous ou un problème résolu que vous voulez maintenir ?"
      : "Sur un poste " + roleLabel + ", " + q1Label + " est souvent un enjeu structurel. Comment vous situez-vous sur ce point aujourd'hui ?";

    var q1Breadcrumb = q1Verb
      ? "Le mot « " + (q1Context ? q1Context.split(/\s+/).slice(0, 3).join(" ") : q1Verb) + " » montre que tu connais le terrain sans rien affirmer."
      : "La précision de la question montre que tu connais le sujet.";

    questions.push({
      label: q1Cauch.cauchemar.label,
      text: q1Text,
      breadcrumb: q1Breadcrumb,
      signalPositif: "Le recruteur détaille le problème. Il te parle comme un pair, pas comme un candidat.",
      signalAlerte: "Le recruteur minimise ou élude. Le poste est peut-être mal défini.",
    });
  }

  // ── Q2 — ÉQUIPE (cauchemar transversal ou organisationnel) ──
  var q2Cauch = transversals.length > 0
    ? transversals[0]
    : (activeCauchemars.length > 1 ? activeCauchemars[1] : activeCauchemars[0]);
  if (q2Cauch) {
    var q2IsTransversal = transversals.indexOf(q2Cauch) !== -1;
    var q2Text = q2IsTransversal && q2Cauch.label.indexOf("senior") !== -1
      ? "Quelle est l'ancienneté moyenne de l'équipe que je rejoindrais ? Le manager pilote depuis combien de temps ?"
      : q2IsTransversal && q2Cauch.label.indexOf("critères") !== -1
        ? "Le périmètre du poste a-t-il évolué depuis l'ouverture ? Certaines entreprises ajustent en cours de process."
        : "Comment l'équipe est-elle structurée aujourd'hui ? Les rôles sont stabilisés ou en cours de redéfinition ?";

    questions.push({
      label: q2Cauch.label,
      text: q2Text,
      breadcrumb: "La question sur la structure montre que tu anticipes la dynamique d'équipe avant d'accepter.",
      signalPositif: "Le recruteur décrit une organisation claire avec des rôles définis.",
      signalAlerte: "Le recruteur hésite ou décrit une organisation en « transformation permanente ».",
    });
  }

  // ── Q3 — MESURE (calibrée par séniorité) ──
  var q3Text, q3Breadcrumb;
  if (sLevel === "leader") {
    q3Text = "Comment le comex mesure-t-il le succès de cette fonction à 12 mois ? Quels indicateurs remontent au board ?";
    q3Breadcrumb = "Tu parles au niveau du board. Le recruteur sent que tu es calibré pour un rôle de direction.";
  } else if (sLevel === "manager") {
    q3Text = "Quels sont les KPIs de l'équipe aujourd'hui ? Le premier défi du manager est de les stabiliser ou de les transformer ?";
    q3Breadcrumb = "Tu poses la question du manager opérationnel. Le recruteur comprend ton niveau de maturité.";
  } else {
    q3Text = "Comment mesurez-vous la performance individuelle sur ce rôle les 6 premiers mois ? Y a-t-il un ramp-up formalisé ?";
    q3Breadcrumb = "Tu demandes la règle du jeu. Le recruteur voit un professionnel qui planifie, pas un candidat qui espère.";
  }
  questions.push({
    label: "Mesure de performance (" + seniorityShortLabel + ")",
    text: q3Text,
    breadcrumb: q3Breadcrumb,
    signalPositif: "Le recruteur décrit des métriques claires et un processus d'évaluation structuré.",
    signalAlerte: "Le recruteur n'a pas de réponse précise. Les objectifs seront définis « en arrivant ».",
  });

  // ── Q4 — PREUVE ASYMÉTRIQUE (brique en question ouverte) ──
  var q4Brick = armored.length >= 2 ? armored[1] : (armored.length > 0 ? armored[0] : validated[0]);
  var q4Core = extractBrickCore(q4Brick);
  var q4Num = q4Core.resultNumber || q4Core.mainNumber || extractBestNum(q4Brick.text);
  var q4Verb = (q4Core.actionVerb || "").toLowerCase();
  var q4Context = q4Core.context || "";

  var q4CauchMatch = cauchWithBrick.find(function (cw) {
    return cw.brick && cw.brick.id === q4Brick.id;
  });
  var q4Label = q4CauchMatch ? q4CauchMatch.cauchemar.label : "Performance opérationnelle";

  var q4Opener = q4Context
    ? q4Context.split(/\s+/).slice(0, 4).join(" ")
    : (q4Verb || "ce sujet");

  var q4Text = q4Num
    ? "Sur " + q4Opener + ", quel est votre niveau actuel ? Dans mon expérience, c'est un levier qui change significativement les résultats quand on le travaille."
    : "Comment abordez-vous " + q4Opener + " dans votre organisation ? C'est un sujet que je connais bien.";

  if (signature && signature.formulation) {
    var sigWords = signature.formulation.split(/\s+/).slice(0, 5).join(" ").toLowerCase();
    q4Text = "Sur " + q4Opener + ", quelle approche fonctionne chez vous ? J'ai constaté que " + sigWords + " change la donne sur ce type de sujet.";
  }

  questions.push({
    label: q4Label,
    text: q4Text,
    breadcrumb: "Le « j'ai constaté » sans détailler crée la curiosité. Le recruteur veut en savoir plus — c'est toi qui mènes.",
    signalPositif: "Le recruteur rebondit et te demande des détails. La conversation devient un échange, pas un interrogatoire.",
    signalAlerte: "Le recruteur ne relève pas. Le poste n'est peut-être pas au bon niveau pour toi.",
  });

  // ── Q5 — SORTIE (qualification du process) ──
  questions.push({
    label: "Prochaines étapes",
    text: "Quel est le calendrier du process ? Y a-t-il d'autres candidats en lice que vous rencontrez cette semaine ?",
    breadcrumb: "Pas de breadcrumb. Question de cadrage. Tu montres que tu gères ton temps.",
    signalPositif: "Le recruteur te donne un calendrier précis et mentionne peu de candidats. Tu es bien positionné.",
    signalAlerte: "Le recruteur est vague sur le timing ou mentionne beaucoup de candidats. Process long en vue.",
  });

  // ── FORMAT OUTPUT ──
  var out = "APPEL DÉCOUVERTE — " + roleLabel.toUpperCase() + " (" + seniorityShortLabel + ")\n\n";
  out += "BRIEFING\n";
  out += briefing + "\n\n";
  out += "---\n\n";

  questions.forEach(function (q, i) {
    out += "QUESTION " + (i + 1) + " — " + q.label + "\n";
    out += "\"" + q.text + "\"\n\n";
    out += "↳ Ce que tu démontres sans le dire : " + q.breadcrumb + "\n";
    out += "↳ Si le recruteur détaille : " + q.signalPositif + "\n";
    out += "↳ Si le recruteur élude : " + q.signalAlerte + "\n";
    if (i < questions.length - 1) out += "\n";
  });

  out += "\n---\n\n";
  out += "APRÈS L'APPEL\n";
  out += "Note les réponses du recruteur. L'outil les croise avec tes briques dans le message post-entretien.";

  out = applyHints(out, hints, { bricks: bricks, cauchemars: cauchemars, type: "discovery_call" });
  return cleanRedac(out, "livrable");
}
