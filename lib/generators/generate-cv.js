import { KPI_REFERENCE } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { getActiveCauchemars } from "../sprint/scoring.js";
import { applyHints } from "./helpers.js";
import { generateCVLine } from "./generate-cv-line.js";
import { scoreBricksByCauchemar, selectGreedyCoverage } from "./selectors.js";

export function generateCV(bricks, targetRoleId, trajectoryToggle, hints) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Aucune brique validée. Le CV se construit à partir de tes preuves.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleTitle = roleData ? roleData.role.toUpperCase() : "PROFESSIONNEL";

  // Score + greedy select (selection logic in selectors.js)
  var cauchemars = getActiveCauchemars();
  var scored = scoreBricksByCauchemar(validated, cauchemars);
  var result = selectGreedyCoverage(scored, cauchemars, 5);
  var selected = result.selected;
  var coveredCauchIds = result.coveredCauchIds;

  var cvBricks = selected.map(function(s) { return s.brick; });
  var coveredCount = Object.keys(coveredCauchIds).length;

  // Séparer briques side project / expérience pro.
  // Ne jamais mélanger les briques side project et les briques d'expérience salariée dans le même bloc.
  var proBricks = cvBricks.filter(function(b) { return !b.sideProject; });
  var sideBricks = cvBricks.filter(function(b) { return b.sideProject; });

  // Header
  var cv = roleTitle + "\n";
  cv += cvBricks.length + " preuves · " + coveredCount + "/" + cauchemars.length + " cauchemars couverts\n";
  cv += "\n[Poste] — [Entreprise] ([Dates])\n\n";

  // Bricks pro via generateCVLine (source unique CV + Préparation entretien)
  proBricks.forEach(function(b) {
    cv += "• " + generateCVLine(b, targetRoleId) + "\n";
  });

  // Bloc side project séparé
  if (sideBricks.length > 0) {
    cv += "\nSIDE PROJECT — [Nom] ([Dates])\n\n";
    sideBricks.forEach(function(b) {
      cv += "• " + generateCVLine(b, targetRoleId) + "\n";
    });
  }

  cv += "\nFormation\n[Diplôme] — [École] ([Année])";
  cv = applyHints(cv, hints, { bricks: bricks, type: "cv" });
  return cleanRedac(cv, "livrable");
}
