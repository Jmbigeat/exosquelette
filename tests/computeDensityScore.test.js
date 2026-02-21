import { describe, it, expect } from "vitest";
import { computeDensityScore } from "../lib/sprint/scoring.js";

var cauchemars = [
  { id: 1, label: "C1", kpis: ["Croissance MRR", "Pipeline généré"] },
  { id: 2, label: "C2", kpis: ["Taux de retention"] },
  { id: 3, label: "C3", kpis: ["Cycle de vente", "Adoption outil"] },
];

describe("computeDensityScore", function () {
  it("retourne score 0 quand aucune brick n'est validée", function () {
    var bricks = [
      { status: "draft", text: "une brick" },
      { status: "rejected", text: "autre brick" },
    ];
    var result = computeDensityScore(bricks, cauchemars);

    expect(result.score).toBe(0);
    expect(result.details.brickCount).toBe(0);
    expect(result.unlocks.forge).toBe(false);
    expect(result.unlocks.affutage).toBe(false);
    expect(result.unlocks.armement).toBe(false);
    expect(result.unlocks.sortie).toBe(false);
  });

  it("compte les brickPoints sans blinded quand le texte est simple", function () {
    var bricks = [
      { status: "validated", text: "Je suis bon commercial" },
      { status: "validated", text: "Résultat intéressant" },
    ];
    var result = computeDensityScore(bricks, cauchemars);

    // 2 bricks * 4 = 8 brickPoints, pas de blinded/credible, pas de cauchemar, pas de diversité
    expect(result.score).toBe(8);
    expect(result.details.brickCount).toBe(2);
    expect(result.details.blindedCount).toBe(0);
    expect(result.details.blindedRatio).toBe(0);
    expect(result.unlocks.forge).toBe(false); // < 3 bricks
  });

  it("détecte les bricks blinded quand le texte contient chiffres, méthode, contexte et résultat", function () {
    var bricks = [
      {
        status: "validated",
        text: "J'ai deploye un programme sur 6 mois qui a genere 30% de croissance",
        corrected: false,
      },
      {
        status: "validated",
        text: "Via un plan structuré sur 3 mois avec l'équipe, augmente le pipeline de 25%",
        corrected: false,
      },
    ];
    var result = computeDensityScore(bricks, cauchemars);

    // Chaque brick a: hasNumber, hasMethod, hasContext, hasResult = depth 4 → blinded
    expect(result.details.blindedCount).toBe(2);
    expect(result.details.blindedRatio).toBe(100);
    // brickPoints=8, blindedPoints=30, cauchemarPoints=0, diversity=0, correction=0 = 38
    expect(result.score).toBe(38);
  });

  it("calcule la couverture cauchemars et la diversité catégories", function () {
    var bricks = [
      { status: "validated", text: "brick simple", kpi: "Croissance MRR", brickType: "cicatrice", brickCategory: "decision" },
      { status: "validated", text: "brick simple", kpi: "Taux de retention", brickCategory: "influence" },
      { status: "validated", text: "brick simple", kpi: "Cycle de vente" },
    ];
    var result = computeDensityScore(bricks, cauchemars);

    // 3 cauchemars couverts → cauchemarPoints = round((3/3)*25) = 25
    expect(result.details.cauchemarCoverage).toBe(3);
    // diversity: cicatrice=5, decision=5, influence=5 = 15
    expect(result.details.hasCicatrice).toBe(true);
    expect(result.details.hasDecision).toBe(true);
    expect(result.details.hasInfluence).toBe(true);
    // brickPoints = min(20, 3*4) = 12; total = 12 + 0 + 25 + 15 + 0 = 52
    expect(result.score).toBe(52);
    expect(result.unlocks.forge).toBe(true); // 3 bricks
    expect(result.unlocks.affutage).toBe(true); // score >= 50
  });

  it("débloque tous les unlocks avec un score élevé et un blindedRatio >= 50%", function () {
    var bricks = [
      { status: "validated", text: "J'ai deploye un process sur 3 mois avec l'équipe, augmente le pipeline de 40%", kpi: "Croissance MRR", brickType: "cicatrice", brickCategory: "decision", corrected: true },
      { status: "validated", text: "Via un programme structuré sur 6 semaine avec 10 clients, genere une croissance de 25%", kpi: "Taux de retention", brickCategory: "influence", corrected: true },
      { status: "validated", text: "Mis en place un plan sur 2 trimestre avec 5 commerciaux, atteint 150% de l'objectif", kpi: "Cycle de vente", corrected: true },
      { status: "validated", text: "Construit une stratégie sur 4 mois avec l'équipe, ameliore la reduction du churn de 35%", corrected: true },
    ];
    var result = computeDensityScore(bricks, cauchemars);

    // 4 bricks blinded (depth >= 4 chacune grâce à number+method+context+result+corrected)
    expect(result.details.blindedCount).toBe(4);
    expect(result.details.blindedRatio).toBe(100);
    // brickPoints=16, blindedPoints=30, cauchemarPoints=25, diversity=15, correction=min(10,4*3)=10 → 96
    expect(result.score).toBe(96);
    expect(result.unlocks.forge).toBe(true);
    expect(result.unlocks.affutage).toBe(true);
    expect(result.unlocks.armement).toBe(true);
    expect(result.unlocks.sortie).toBe(true);
  });
});
