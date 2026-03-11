import { getActiveCauchemars } from "../sprint/scoring.js";

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
