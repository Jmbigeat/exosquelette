import { KPI_REFERENCE } from "../sprint/references.js";

export function generateSampleTransformation(cvText, cauchemars, roleId) {
  if (!cvText || cvText.trim().length < 20) return null;
  var lines = cvText.split(/[\n\r]+/).filter(function (l) {
    return l.trim().length > 15;
  });
  if (lines.length === 0) return null;
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;
  var bestLine = null;
  var bestScore = 0;
  var bestCauch = null;
  lines.forEach(function (line) {
    var lineLow = line.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
    cauchemars.forEach(function (c) {
      var score = 0;
      (c.matchedKw || []).forEach(function (kw) {
        if (lineLow.indexOf(kw.toLowerCase().replace(/[éèê]/g, "e")) !== -1) score += 2;
      });
      (c.kpis || []).forEach(function (kpi) {
        kpi
          .toLowerCase()
          .split(/[\s\/]+/)
          .filter(function (w) {
            return w.length > 3;
          })
          .forEach(function (w) {
            if (lineLow.indexOf(w.replace(/[éèê]/g, "e")) !== -1) score++;
          });
      });
      var hasNumber = /\d/.test(line);
      if (!hasNumber) score += 1;
      if (score > bestScore) {
        bestScore = score;
        bestLine = line.trim();
        bestCauch = c;
      }
    });
  });
  if (!bestLine || bestScore < 1) {
    bestLine = lines
      .reduce(function (a, b) {
        return a.length > b.length ? a : b;
      })
      .trim();
    bestCauch = cauchemars[0];
  }
  var cleanLine = bestLine.replace(/^[\-\•\*•–—]\s*/, "").trim();
  var kpiLabel = bestCauch && bestCauch.kpis ? bestCauch.kpis[0] : "";
  var elasticTag = roleData
    ? roleData.kpis.find(function (k) {
        return k.name === kpiLabel && k.elasticity === "élastique";
      })
    : null;
  var afterLine = cleanLine;
  if (!/\d+\s*%/.test(cleanLine)) {
    afterLine = cleanLine
      .replace(/gestion d[eu']/gi, "Réduction de 22% à 4% du churn sur")
      .replace(/pilotage d[eu']/gi, "Accélération de +35% du")
      .replace(/mise en place/gi, "Déploiement en 3 mois de")
      .replace(/responsable d[eu']/gi, "Restructuration complète de")
      .replace(/suivi d[eu']/gi, "Amélioration de +28% de");
    if (afterLine === cleanLine) {
      afterLine = cleanLine + " — résultat : [chiffre à extraire pendant la Forge]";
    }
  } else {
    afterLine = cleanLine;
  }
  return {
    before: cleanLine,
    after: afterLine,
    cauchemar: bestCauch ? bestCauch.label : "",
    kpi: kpiLabel,
    isElastic: !!elasticTag,
    isSimulated: afterLine.indexOf("[chiffre a extraire") !== -1 || afterLine !== cleanLine,
  };
}
