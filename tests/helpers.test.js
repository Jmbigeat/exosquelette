import { test, expect } from "vitest";
import { extractBrickCore } from "../lib/sprint/brickExtractor.js";

// Test 1 — extractBrickCore fast path (fields.result available)
// Bug 10 mars: resultNumber must come from result field, not situation context
test("extractBrickCore uses brick.fields.result when available", function() {
  var brick = {
    text: "Équipe de 12 personnes\n\nRestructuré le pipeline\n\nMRR passé de 18K€ à 45K€\n\nBudget gelé",
    fields: {
      situation: "Équipe de 12 personnes",
      action: "Restructuré le pipeline",
      result: "MRR passé de 18K€ à 45K€",
      constraint: "Budget gelé",
    },
  };
  var core = extractBrickCore(brick);
  // resultNumber must be 45K€ or 18K€, NOT 12 (team size from situation)
  expect(core.resultNumber).toMatch(/18K€|45K€/i);
});

// Test 2 — extractBrickCore fallback (no fields)
// Legacy bricks without .fields must not crash
test("extractBrickCore falls back to heuristic when fields missing", function() {
  var brick = {
    text: "Équipe de 12 personnes\n\nRestructuré le pipeline\n\nMRR passé de 18K€ à 45K€\n\nBudget gelé",
  };
  var core = extractBrickCore(brick);
  expect(core).not.toBeNull();
  expect(core.resultNumber).toBeDefined();
});

// Test 3 — extractBrickCore brick with no numbers
// Must not crash, return valid object
test("extractBrickCore handles brick with no numbers", function() {
  var brick = {
    text: "Lancé le produit avec succès\n\nMise en place du process\n\nAdoption par l'équipe\n\nSans budget",
  };
  var core = extractBrickCore(brick);
  expect(core).not.toBeNull();
  expect(typeof core).toBe("object");
  expect(core.actionVerb).toBe("lancé");
});
