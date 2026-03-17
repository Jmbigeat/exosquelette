import { test, expect } from "vitest";
import { auditExternalCV } from "../lib/eclaireur/audit-cv.js";

// detectEnglish is private — tested via auditExternalCV which calls it internally.
// English CV → { score: null, isEnglish: true }
// French CV → { score: number, tests: [...] }

var minOffer = { revealedKpi: { name: "churn rate", elasticity: "élastique" }, detectedRoleId: "ae", detectedRoleLabel: "Account Executive" };
var minCauchemars = [{ id: "c1", label: "Churn", kpis: ["churn"], kw: ["churn", "rétention"], matchedKw: [] }];

// Test 7 — French text not detected as English
test("auditExternalCV does not flag French text as English", function() {
  var text = "J'ai dirigé une équipe de 12 personnes et restructuré le pipeline commercial pour augmenter le MRR de 18K€ à 45K€ en 6 mois malgré un budget gelé.";
  var result = auditExternalCV(text, minOffer, minCauchemars);
  expect(result.isEnglish).toBeFalsy();
  expect(result.score).not.toBeNull();
});

// Test 8 — English text detected
test("auditExternalCV flags English text", function() {
  var text = "I led a team of 12 engineers and restructured the sales pipeline, increasing MRR from 18K to 45K despite a frozen budget over 6 months. The team was responsible for driving growth and retention across the enterprise segment with quarterly business reviews.";
  var result = auditExternalCV(text, minOffer, minCauchemars);
  expect(result.isEnglish).toBe(true);
  expect(result.score).toBeNull();
});

// Test 9 — Mixed text with French majority not flagged
test("auditExternalCV does not flag mixed text with French majority", function() {
  var text = "J'ai utilisé le framework React pour construire une application de gestion des leads avec un dashboard analytics et du machine learning pour le scoring des prospects dans un contexte de transformation digitale.";
  var result = auditExternalCV(text, minOffer, minCauchemars);
  expect(result.isEnglish).toBeFalsy();
  expect(result.score).not.toBeNull();
});
