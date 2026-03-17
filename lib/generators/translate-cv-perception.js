export function translateCVPerception(cvText, cauchemars) {
  var cvLower = (cvText || "").toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
  var perceptions = [];
  cauchemars.forEach(function (c) {
    var kwFound = [];
    var kwMissing = [];
    (c.kpis || []).forEach(function (kpi) {
      var words = kpi
        .toLowerCase()
        .split(/[\s\/\(\)]+/)
        .filter(function (w) {
          return w.length > 3;
        });
      words.forEach(function (w) {
        var wNorm = w.replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
        if (cvLower.indexOf(wNorm) !== -1) {
          if (kwFound.indexOf(w) === -1) kwFound.push(w);
        } else {
          if (kwMissing.indexOf(w) === -1) kwMissing.push(w);
        }
      });
    });
    (c.matchedKw || c.kw || []).forEach(function (kw) {
      var kwNorm = kw.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
      if (cvLower.indexOf(kwNorm) !== -1 && kwFound.indexOf(kw) === -1) kwFound.push(kw);
    });
    var hasActivity = kwFound.length > 0;
    var hasProof = /\d+\s*[%kKmM€]/.test(cvText);
    var status = "silence";
    var perception = "";
    if (hasActivity && hasProof) {
      status = "activite_chiffree";
      perception =
        "Tu mentionnes " +
        kwFound.slice(0, 2).join(", ") +
        " avec un chiffre. Le recruteur lit : piste. Pas encore preuve blindée.";
    } else if (hasActivity && !hasProof) {
      status = "activite_sans_preuve";
      perception =
        "Tu mentionnes " + kwFound.slice(0, 2).join(", ") + ". Le recruteur lit : activité. Pas résultat. Il passe.";
    } else {
      status = "silence";
      perception = 'Le recruteur cherche un remède à "' + c.label + '." Ton CV : silence.';
    }
    perceptions.push({
      cauchemar: c.label,
      cauchemarId: c.id,
      status: status,
      perception: perception,
      kwFound: kwFound,
      kwMissing: kwMissing,
      costRange: c.costRange,
    });
  });
  return perceptions;
}
