import { KPI_REFERENCE } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { getActiveCauchemars } from "../sprint/scoring.js";
import { applyHints } from "./helpers.js";
import { generateCVLine } from "./generate-cv-line.js";

export function generateCV(bricks, targetRoleId, trajectoryToggle, hints) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Aucune brique validée. Le CV se construit à partir de tes preuves.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleTitle = roleData ? roleData.role.toUpperCase() : "PROFESSIONNEL";

  // Score + greedy select (same logic as CVPreview)
  var cauchemars = getActiveCauchemars();
  var TARGET_BRICKS = 5;
  var scored = validated.map(function(b) {
    var score = 0;
    if (b.kpi && cauchemars.some(function(c) { return c.kpis.some(function(k) { return b.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf((b.kpi || "").slice(0, 6)) !== -1; }); })) score += 10;
    if (/\d/.test(b.text)) score += 5;
    if (/via|grâce à|méthode|process|déployé|mis en place|construit|structuré/i.test(b.text)) score += 3;
    if (b.elasticity === "élastique") score += 2;
    return { brick: b, score: score };
  });
  scored.sort(function(a, b) { return b.score - a.score; });

  var selected = [];
  var coveredCauchIds = {};
  scored.forEach(function(s) {
    if (selected.length >= TARGET_BRICKS) return;
    var coversNew = s.brick.kpi && cauchemars.some(function(c) {
      if (coveredCauchIds[c.id]) return false;
      return c.kpis.some(function(k) { return s.brick.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf(s.brick.kpi.slice(0, 6)) !== -1; });
    });
    if (coversNew) {
      selected.push(s);
      cauchemars.forEach(function(c) {
        if (c.kpis.some(function(k) { return s.brick.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf(s.brick.kpi.slice(0, 6)) !== -1; })) coveredCauchIds[c.id] = true;
      });
    }
  });
  scored.forEach(function(s) {
    if (selected.length >= TARGET_BRICKS) return;
    if (selected.indexOf(s) === -1) selected.push(s);
  });

  var cvBricks = selected.map(function(s) { return s.brick; });
  var coveredCount = Object.keys(coveredCauchIds).length;

  // Séparer briques side project / expérience pro.
  // Ne jamais mélanger les briques side project et les briques d'expérience salariée dans le même bloc.
  var proBricks = cvBricks.filter(function(b) { return !b.sideProject; });
  var sideBricks = cvBricks.filter(function(b) { return b.sideProject; });

  // Header
  var cv = roleTitle + "\n";
  cv += cvBricks.length + " preuves \u00B7 " + coveredCount + "/" + cauchemars.length + " cauchemars couverts\n";
  cv += "\n[Poste] \u2014 [Entreprise] ([Dates])\n\n";

  // Bricks pro via generateCVLine (source unique CV + Préparation entretien)
  proBricks.forEach(function(b) {
    cv += "\u2022 " + generateCVLine(b, targetRoleId) + "\n";
  });

  // Bloc side project séparé
  if (sideBricks.length > 0) {
    cv += "\nSIDE PROJECT \u2014 [Nom] ([Dates])\n\n";
    sideBricks.forEach(function(b) {
      cv += "\u2022 " + generateCVLine(b, targetRoleId) + "\n";
    });
  }

  cv += "\nFormation\n[Diplôme] \u2014 [École] ([Année])";
  cv = applyHints(cv, hints, { bricks: bricks, type: "cv" });
  return cleanRedac(cv, "livrable");
}
