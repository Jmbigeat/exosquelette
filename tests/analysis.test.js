import { test, expect } from "vitest";
import { hasDecisionMarkers } from "../lib/sprint/analysis.js";

// Test 10 — hasDecisionMarkers requires actor + tension + résolution
// Full decision context: actor opposing + tension verb + resolution verb
test("hasDecisionMarkers returns true for decision verbs", function() {
  expect(hasDecisionMarkers("Le board voulait couper le budget. J'ai choisi de restructurer le pipeline pour tenir les objectifs.")).toBe(true);
  expect(hasDecisionMarkers("J'ai participé à la réunion")).toBe(false);
});
