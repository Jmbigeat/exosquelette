import { getActiveCauchemars } from "../sprint/scoring.js";
import { analyzeDiltsProgression } from "../sprint/dilts.js";

export function scoreContactScript(text, bricks, cauchemars) {
  if (!text || text.length < 20) return { score: 0, tests: [] };
  var lower = text.toLowerCase();

  // 1. MIROIR — première phrase parle du destinataire
  var firstLine = text.split("\n").filter(function(l) { return l.trim().length > 5; })[0] || "";
  var firstLower = firstLine.toLowerCase();
  var miroir = firstLower.indexOf("vous") !== -1 || firstLower.indexOf("votre") !== -1 || firstLower.indexOf("[prénom]") !== -1 || firstLower.indexOf("[prenom]") !== -1;
  var miroirFail = firstLower.indexOf("je ") < 3 && firstLower.indexOf("je ") !== -1 && !miroir;

  // 2. CAUCHEMAR — nomme un cauchemar spécifique
  var activeCauch = cauchemars || getActiveCauchemars();
  var hasCauchemar = activeCauch.some(function(c) {
    return c.nightmareShort && lower.indexOf(c.nightmareShort.toLowerCase().slice(0, 20)) !== -1;
  });
  if (!hasCauchemar) {
    hasCauchemar = lower.indexOf("cauchemar") !== -1 || lower.indexOf("problème") !== -1 || lower.indexOf("coûte") !== -1 || lower.indexOf("coute") !== -1;
  }

  // 3. PREUVE ASYMÉTRIQUE — ouvre une question au lieu de fermer
  var hasQuestion = text.indexOf("?") !== -1;
  var hasProof = bricks.some(function(b) {
    return b.status === "validated" && b.text && lower.indexOf(b.text.toLowerCase().slice(0, 20)) !== -1;
  });
  var preuveAsym = hasQuestion && hasProof;

  // 4. COÛT DU NON — coût de ne pas répondre
  var coutDuNon = lower.indexOf("coûte") !== -1 || lower.indexOf("coute") !== -1 || lower.indexOf("perd") !== -1 || lower.indexOf("trimestre") !== -1 || lower.indexOf("par an") !== -1 || lower.indexOf("chaque mois") !== -1 || lower.indexOf("manque") !== -1;

  // 5. SORTIE FACILE — question de fin légère
  var lastLines = text.split("\n").filter(function(l) { return l.trim().length > 3; });
  var lastMeaningful = "";
  for (var i = lastLines.length - 1; i >= 0; i--) {
    if (lastLines[i].indexOf("?") !== -1) { lastMeaningful = lastLines[i]; break; }
  }
  var sortieFacile = lastMeaningful.length > 0 && lastMeaningful.length < 120;

  // 6. DILTS — monte d'au moins 1 niveau
  var diltsP = analyzeDiltsProgression(text);
  var diltsOk = diltsP.progression >= 1;

  var tests = [
    { id: "miroir", label: "Miroir", desc: "La première phrase parle du destinataire", passed: miroir && !miroirFail, fix: "Commence par 'vous' ou par le problème du destinataire, pas par 'je'." },
    { id: "cauchemar", label: "Cauchemar", desc: "Nomme un problème spécifique", passed: hasCauchemar, fix: "Ajoute le cauchemar du décideur issu de l'offre." },
    { id: "preuve", label: "Preuve asymétrique", desc: "Ouvre une question au lieu de la fermer", passed: preuveAsym, fix: "Inclus une preuve chiffrée ET termine par une question." },
    { id: "cout", label: "Coût du non", desc: "Le coût de ne pas répondre est visible", passed: coutDuNon, fix: "Ajoute le coût en euros ou en temps du problème non résolu." },
    { id: "sortie", label: "Sortie facile", desc: "La question de fin est légère", passed: sortieFacile, fix: "Termine par une question courte, facile à répondre." },
    { id: "dilts", label: "Registre", desc: "Monte d'au moins 1 niveau logique", passed: diltsOk, fix: "Ouvre sur du concret (fait, chiffre) et ferme sur de la vision (conviction, identité)." },
  ];

  var passed = tests.filter(function(t) { return t.passed; }).length;
  var score = Math.round(passed * 1.67);
  if (score > 10) score = 10;

  return { score: score, tests: tests, passedCount: passed };
}
