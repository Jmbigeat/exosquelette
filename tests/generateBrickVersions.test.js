import { vi, describe, it, expect } from "vitest";

// ── Mocks ────────────────────────────────────────────────

vi.mock("../lib/sprint/redac.js", () => ({
  cleanRedac: (text) => text,
}));

vi.mock("../lib/sprint/scoring.js", () => ({
  getActiveCauchemars: () => [
    {
      id: 1,
      label: "Portefeuille en stagnation",
      kpis: ["Croissance MRR", "Pipeline généré"],
      nightmareShort: "Le VP Sales ne dort plus : son portefeuille stagne.",
      costRange: [200000, 800000],
    },
  ],
}));

vi.mock("../lib/sprint/references.js", () => ({
  KPI_REFERENCE: {
    test_role: {
      role: "Enterprise AE",
      kpis: [
        { name: "Croissance MRR", elasticity: "élastique", why: "Raison test" },
      ],
      cadence: 30,
      cadenceLabel: "Mensuel",
    },
  },
  BRICK_FIELDS: [],
  SEED_TEMPLATES: [],
  ROLE_PILLARS: {},
}));

import { generateBrickVersions } from "../lib/sprint/bricks.js";

// ── Fixtures ─────────────────────────────────────────────

var CHIFFRE_BRICK = {
  text: "Croissance +22% du portefeuille Mid-Market en 12 mois.",
  kpi: "Croissance MRR",
  brickCategory: "chiffre",
};

var CICATRICE_BRICK = {
  text: "J'ai sous-estimé la résistance interne et le projet a pris 4 mois de retard.",
  kpi: "Croissance MRR",
  brickType: "cicatrice",
};

// ── Tests ────────────────────────────────────────────────

describe("generateBrickVersions", function () {

  // ── Structure de retour ──────────────────────────────

  describe("structure de retour", function () {
    it("retourne un objet avec cvVersion, interviewVersions et discoveryQuestions", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(result).toHaveProperty("cvVersion");
      expect(result).toHaveProperty("interviewVersions");
      expect(result).toHaveProperty("discoveryQuestions");
    });

    it("interviewVersions contient rh, n1 et direction", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(result.interviewVersions).toHaveProperty("rh");
      expect(result.interviewVersions).toHaveProperty("n1");
      expect(result.interviewVersions).toHaveProperty("direction");
    });

    it("discoveryQuestions est un tableau non vide", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(Array.isArray(result.discoveryQuestions)).toBe(true);
      expect(result.discoveryQuestions.length).toBeGreaterThanOrEqual(2);
    });

    it("toutes les valeurs string sont non vides", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(result.cvVersion.length).toBeGreaterThan(0);
      expect(result.interviewVersions.rh.length).toBeGreaterThan(0);
      expect(result.interviewVersions.n1.length).toBeGreaterThan(0);
      expect(result.interviewVersions.direction.length).toBeGreaterThan(0);
    });
  });

  // ── Brique chiffre ──────────────────────────────────

  describe("brique chiffre", function () {
    it("cvVersion contient le texte de la brique", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(result.cvVersion).toContain("+22%");
    });

    it("rhVersion commence par le framing parcours", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(result.interviewVersions.rh).toMatch(/^Dans mon parcours, un moment clé a été quand/);
    });

    it("rhVersion contient le texte de la brique", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(result.interviewVersions.rh).toContain("portefeuille Mid-Market");
    });

    it("n1Version commence par le framing terrain", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(result.interviewVersions.n1).toMatch(/^Sur le terrain, voici ce qui s'est passé\./);
    });

    it("n1Version mentionne la reproductibilité", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(result.interviewVersions.n1).toContain("La méthode est reproductible");
    });

    it("dirVersion commence par le framing business", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(result.interviewVersions.direction).toMatch(/^L'impact business est mesurable\./);
    });

    it("dirVersion inclut le cost frame du cauchemar matché", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(result.interviewVersions.direction).toContain("Ce type de problème coûte entre");
      expect(result.interviewVersions.direction).toContain("200K");
      expect(result.interviewVersions.direction).toContain("800K");
    });
  });

  // ── Brique cicatrice ────────────────────────────────

  describe("brique cicatrice", function () {
    it("rhVersion commence par le framing situation difficile", function () {
      var result = generateBrickVersions(CICATRICE_BRICK, "test_role");
      expect(result.interviewVersions.rh).toMatch(/^J'ai traversé une situation difficile\./);
    });

    it("rhVersion contient le texte de la brique", function () {
      var result = generateBrickVersions(CICATRICE_BRICK, "test_role");
      expect(result.interviewVersions.rh).toContain("résistance interne");
    });

    it("n1Version commence par le framing problème concret", function () {
      var result = generateBrickVersions(CICATRICE_BRICK, "test_role");
      expect(result.interviewVersions.n1).toMatch(/^Le problème était concret\./);
    });

    it("n1Version mentionne la cause racine", function () {
      var result = generateBrickVersions(CICATRICE_BRICK, "test_role");
      expect(result.interviewVersions.n1).toContain("cause racine");
    });

    it("dirVersion commence par le framing enjeu business", function () {
      var result = generateBrickVersions(CICATRICE_BRICK, "test_role");
      expect(result.interviewVersions.direction).toMatch(/^L'enjeu business était réel\./);
    });

    it("dirVersion contient le texte original", function () {
      var result = generateBrickVersions(CICATRICE_BRICK, "test_role");
      expect(result.interviewVersions.direction).toContain("4 mois de retard");
    });

    it("les 5 clés sont présentes", function () {
      var result = generateBrickVersions(CICATRICE_BRICK, "test_role");
      expect(result.cvVersion).toBeDefined();
      expect(result.interviewVersions.rh).toBeDefined();
      expect(result.interviewVersions.n1).toBeDefined();
      expect(result.interviewVersions.direction).toBeDefined();
      expect(result.discoveryQuestions).toBeDefined();
    });
  });

  // ── discoveryQuestions ──────────────────────────────

  describe("discoveryQuestions", function () {
    it("contient la question KPI quand kpi est fourni", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      var kpiQ = result.discoveryQuestions.find(function (q) {
        return q.indexOf("indicateur actuel sur") !== -1;
      });
      expect(kpiQ).toBeDefined();
      expect(kpiQ).toContain("croissance mrr");
    });

    it("contient la question cauchemar quand il y a un match", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      var cauchQ = result.discoveryQuestions.find(function (q) {
        return q.indexOf("portefeuille stagne") !== -1;
      });
      expect(cauchQ).toBeDefined();
    });

    it("se termine toujours par les 2 questions universelles", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      var len = result.discoveryQuestions.length;
      expect(result.discoveryQuestions[len - 2]).toContain("déclenché ce recrutement");
      expect(result.discoveryQuestions[len - 1]).toContain("profil ne voulez-vous surtout pas reproduire");
    });

    it("contient au moins 4 questions avec kpi + cauchemar matché", function () {
      var result = generateBrickVersions(CHIFFRE_BRICK, "test_role");
      expect(result.discoveryQuestions.length).toBeGreaterThanOrEqual(4);
    });
  });

});
