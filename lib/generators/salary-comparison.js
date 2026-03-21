/**
 * Génère un comparatif salarial avec position marché, OTE, et recommandation.
 * Croise salaire × fourchettes marché × coût de remplacement × cauchemars couverts.
 *
 * @param {number} currentSalary - salaire actuel brut annuel
 * @param {string} targetRoleId - rôle cible
 * @param {Array} bricks - briques validées
 * @param {Array} cauchemars - cauchemars actifs
 * @param {number|null} acvTarget - ACV cible (rôles sales)
 * @param {object|null} replacementData - REPLACEMENT_DATA_BY_ROLE[targetRoleId]
 * @returns {string} comparatif formaté (4 blocs)
 */

import { SALARY_RANGES_BY_ROLE, OTE_SPLIT_BY_ROLE, ROLE_CLUSTERS, ROLE_VALUE_RATIO } from "../sprint/references.js";
import { computeCauchemarCoverage } from "../sprint/scoring.js";

export function generateSalaryComparison(currentSalary, targetRoleId, bricks, cauchemars, acvTarget, replacementData) {
  if (!currentSalary || currentSalary <= 0) {
    return "Renseigne ton salaire actuel dans l'onglet Interne pour activer le comparatif salarial.";
  }

  var ranges = SALARY_RANGES_BY_ROLE[targetRoleId];
  if (!ranges) {
    return "Données salariales indisponibles pour ce rôle.";
  }

  var cluster = ROLE_CLUSTERS.find(function (rc) {
    return rc.id === targetRoleId;
  });
  var roleLabel = cluster ? cluster.label.split(" / ")[0] : "ce rôle";

  var percentile;
  if (currentSalary <= ranges.p25) percentile = "sous le P25";
  else if (currentSalary <= ranges.p50) percentile = "entre le P25 et le P50";
  else if (currentSalary <= ranges.p75) percentile = "entre le P50 et le P75";
  else percentile = "au-dessus du P75";

  var deltaP50 = currentSalary - ranges.p50;
  var deltaPercent = Math.round((deltaP50 / ranges.p50) * 100);
  var deltaLabel = deltaPercent >= 0 ? deltaPercent + "% au-dessus de" : Math.abs(deltaPercent) + "% sous";

  var lines = [];

  // Bloc 1 — Position marché
  lines.push("POSITION MARCHÉ");
  lines.push("—");
  lines.push(
    "Ton salaire (" +
      formatK(currentSalary) +
      "€) se situe " +
      percentile +
      " (" +
      deltaLabel +
      " la médiane) pour un " +
      roleLabel +
      " en France."
  );
  lines.push("P25 : " + formatK(ranges.p25) + "€ | P50 : " + formatK(ranges.p50) + "€ | P75 : " + formatK(ranges.p75) + "€.");
  lines.push("Sources : Robert Half, Hays, Michael Page — études 2025.");
  lines.push("");

  // Bloc 2 — Décomposition OTE (conditionnel)
  var oteSplit = OTE_SPLIT_BY_ROLE[targetRoleId];
  if (oteSplit && acvTarget && acvTarget > 0) {
    var fixe = Math.round(currentSalary * oteSplit.fixeRatio);
    var variable = Math.round(currentSalary * oteSplit.variableRatio);
    var ratio = Math.round((currentSalary / acvTarget) * 100);

    lines.push("DÉCOMPOSITION OTE");
    lines.push("—");
    lines.push(
      "Fixe estimé : " +
        formatK(fixe) +
        "€ (" +
        Math.round(oteSplit.fixeRatio * 100) +
        "%). Variable estimé : " +
        formatK(variable) +
        "€ (" +
        Math.round(oteSplit.variableRatio * 100) +
        "%)."
    );
    lines.push("Ratio OTE/ACV : " + ratio + "%.");
    if (ratio > 35) {
      var multiplier = (acvTarget / currentSalary).toFixed(1);
      lines.push(
        "Ce ratio dépasse le seuil de 35%. Ta variable est structurellement inatteignable. L'entreprise te demande de générer " +
          multiplier +
          "× ton salaire en contrats."
      );
    } else {
      lines.push("Ce ratio est dans la norme. Ta variable est réaliste.");
    }
    lines.push("");
  }

  // Bloc 3 — Recommandation calibrée
  var coverage = computeCauchemarCoverage(bricks || []);
  var totalCauch = coverage.length;
  var coveredCount = coverage.filter(function (c) {
    return c.covered;
  }).length;

  lines.push("RECOMMANDATION");
  lines.push("—");
  lines.push("Fourchette de négociation : " + formatK(ranges.p50) + "€ — " + formatK(ranges.p75) + "€.");
  if (replacementData) {
    var replacementCost =
      replacementData.recruitmentCost +
      Math.round((currentSalary / 52) * replacementData.vacancyWeeks) +
      Math.round((currentSalary / 12) * replacementData.rampUpMonths * 0.5);
    lines.push(
      "Ton coût de remplacement est estimé à " +
        formatK(replacementCost) +
        "€ (recrutement + vacance + montée compétence). Cette fourchette est rationnelle."
    );
  }
  var valueRatio = ROLE_VALUE_RATIO[targetRoleId] || null;
  if (valueRatio) {
    var costRatioLow = Math.round((currentSalary / valueRatio.high) * 100);
    var costRatioHigh = Math.round((currentSalary / valueRatio.low) * 100);
    var newRatioLow = Math.round((ranges.p50 / valueRatio.high) * 100);
    var newRatioHigh = Math.round((ranges.p75 / valueRatio.low) * 100);
    var delta = ranges.p50 - currentSalary;
    lines.push(
      "Un " + roleLabel + " produit entre " + formatK(valueRatio.low) + "€ et " + formatK(valueRatio.high) +
        "€ de " + valueRatio.label + " par an. Ton salaire représente " +
        costRatioLow + "-" + costRatioHigh + "% de cette valeur." +
        (delta > 0
          ? " Une augmentation de " + formatK(delta) + "€ porte ce ratio à " + newRatioLow + "-" + newRatioHigh + "% — toujours rentable."
          : "")
    );
  }
  if (totalCauch > 0) {
    lines.push(
      "Tu couvres " +
        coveredCount +
        "/" +
        totalCauch +
        " cauchemars critiques. Chaque cauchemar non couvert par ton remplaçant allonge la vacance."
    );
  }
  lines.push("");

  // Bloc 4 — Argument prêt à l'emploi
  lines.push("ARGUMENT PRÊT À L'EMPLOI");
  lines.push("—");
  var argLines = [];
  argLines.push(
    "Mon salaire actuel (" +
      formatK(currentSalary) +
      "€) se situe " +
      deltaLabel +
      " la médiane marché pour ce rôle (" +
      formatK(ranges.p50) +
      "€)."
  );
  if (replacementData) {
    var replCost =
      replacementData.recruitmentCost +
      Math.round((currentSalary / 52) * replacementData.vacancyWeeks) +
      Math.round((currentSalary / 12) * replacementData.rampUpMonths * 0.5);
    argLines.push("Mon coût de remplacement est estimé à " + formatK(replCost) + "€.");
  }
  if (totalCauch > 0) {
    argLines.push(
      "Ma couverture de " +
        coveredCount +
        "/" +
        totalCauch +
        " cauchemars réduit le risque de vacance de " +
        (replacementData ? replacementData.vacancyWeeks : "8") +
        " semaines."
    );
  }
  argLines.push(
    "La fourchette " +
      formatK(ranges.p50) +
      "–" +
      formatK(ranges.p75) +
      "€ est un rééquilibrage, pas une demande agressive."
  );
  lines.push(argLines.join("\n"));

  return lines.join("\n");
}

function formatK(n) {
  if (n >= 1000) return Math.round(n / 1000) + " 000";
  return String(n);
}
