import { parseOfferSignals } from "../sprint/offers.js";
import { translateCVPerception } from "./translate-cv-perception.js";
import { generateSampleTransformation } from "./generate-sample-transformation.js";

export function generateDiagnostic(cvText, offerText, roleId) {
  var signals = parseOfferSignals(offerText, roleId);
  if (!signals) return null;
  var cauchemars = signals.cauchemars;
  var perceptions = translateCVPerception(cvText, cauchemars);
  var transformation = generateSampleTransformation(cvText, cauchemars, roleId);
  var coveredCount = perceptions.filter(function(p) { return p.status !== "silence"; }).length;
  var proofCount = perceptions.filter(function(p) { return p.status === "activite_chiffree"; }).length;
  var totalCauchemars = cauchemars.length;
  var fossePct = totalCauchemars > 0 ? Math.round(((totalCauchemars - proofCount) / totalCauchemars) * 100) : 100;
  return {
    bloc1: { cauchemars: cauchemars, urgency: signals.urgencyScore, urgencyHits: signals.urgencyHits },
    bloc2: { perceptions: perceptions },
    bloc3: { coveredCount: coveredCount, proofCount: proofCount, totalCauchemars: totalCauchemars, fossePct: fossePct },
    bloc4: { transformation: transformation },
    signals: signals,
  };
}
