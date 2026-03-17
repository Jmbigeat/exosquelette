import { test, expect } from "vitest";
import { scoreBricksByCauchemar, selectGreedyCoverage, selectBestBrick } from "../lib/generators/selectors.js";

// Test 4 — scoreBricksByCauchemar sort order
// Brick matching cauchemar KPI must score higher
test("scoreBricksByCauchemar returns highest scoring brick first", function() {
  var bricks = [
    { status: "validated", brickType: "proof", text: "Pas de chiffre", kpi: "" },
    { status: "validated", brickType: "proof", text: "Réduit le churn de 12% à 4%", kpi: "churn" },
  ];
  var cauchemars = [{ id: "c1", kpis: ["churn", "rétention"], label: "Churn" }];
  var scored = scoreBricksByCauchemar(bricks, cauchemars);
  expect(scored[0].brick.text).toContain("churn");
  expect(scored[0].score).toBeGreaterThan(scored[1].score);
});

// Test 5 — selectGreedyCoverage maximizes coverage
// Greedy must pick bricks covering different cauchemars
test("selectGreedyCoverage maximizes cauchemar coverage", function() {
  var scored = [
    { brick: { kpi: "churn" }, score: 10 },
    { brick: { kpi: "churn" }, score: 8 },
    { brick: { kpi: "pipeline" }, score: 6 },
  ];
  var cauchemars = [
    { id: "c1", kpis: ["churn"] },
    { id: "c2", kpis: ["pipeline"] },
  ];
  var result = selectGreedyCoverage(scored, cauchemars, 2);
  expect(Object.keys(result.coveredCauchIds).length).toBe(2);
  expect(result.selected.length).toBe(2);
});

// Test 6 — selectBestBrick tiebreaker: numbers win
// Equal armorScore, brick with number wins tiebreaker
test("selectBestBrick prefers brick with numbers on equal armorScore", function() {
  var bricks = [
    { status: "validated", armorScore: 3, text: "Lancé un produit" },
    { status: "validated", armorScore: 3, text: "Réduit le churn de 12%" },
  ];
  var best = selectBestBrick(bricks);
  expect(best.text).toContain("12%");
});
