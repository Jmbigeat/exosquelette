import { describe, test, expect } from "vitest";
import { assessBrickArmor } from "../lib/sprint/scoring.js";
import { hasDecisionMarkers as hasDecisionMarkersAnalysis } from "../lib/sprint/analysis.js";

describe("Blindage Déterministe — Invariants de Scoring & Équation d'Armure", function () {
  // Invariant 1 : Brique vide = Profondeur 0, vulnérable, 4 manquants
  test("Brique vide : A = 0, status = vulnerable, 4 dimensions manquantes", function () {
    var res = assessBrickArmor({});
    expect(res.depth).toBe(0);
    expect(res.status).toBe("vulnerable");
    expect(res.missing).toEqual(["chiffres", "décision", "influence", "transférabilité"]);
    expect(res.hasNumbers).toBe(false);
    expect(res.hasDecisionMarkers).toBe(false);
    expect(res.hasInfluenceMarkers).toBe(false);
    expect(res.hasTransferability).toBe(false);
  });

  // Invariant 2 : Détection unitaire des 4 briques élémentaires b1, b2, b3, b4
  test("b1 (Chiffres) : détecté isolément, A = 1, status = vulnerable", function () {
    var res = assessBrickArmor({ text: "Augmentation de 45% du MRR en 6 mois." });
    expect(res.hasNumbers).toBe(true);
    expect(res.hasDecisionMarkers).toBe(false);
    expect(res.hasInfluenceMarkers).toBe(false);
    expect(res.hasTransferability).toBe(false);
    expect(res.depth).toBe(1);
    expect(res.status).toBe("vulnerable");
    expect(res.missing).toEqual(["décision", "influence", "transférabilité"]);
  });

  test("b2 (Décision) : marqueurs d'arbitrage purs (tranché, arbitrage, choix)", function () {
    var res = assessBrickArmor({ text: "Arbitrage strict : j'ai tranché pour couper les fonctionnalités non rentables." });
    expect(res.hasNumbers).toBe(false);
    expect(res.hasDecisionMarkers).toBe(true);
    expect(res.depth).toBe(1);
    expect(res.status).toBe("vulnerable");
  });

  test("b3 (Influence) : marqueurs d'alignement collectif (équipe, board, direction, sponsor)", function () {
    var res = assessBrickArmor({ text: "Mobilisé l'équipe et obtenu l'alignement du board et des stakeholders." });
    expect(res.hasInfluenceMarkers).toBe(true);
    expect(res.hasNumbers).toBe(false);
    expect(res.hasTransferability).toBe(false);
    expect(res.depth).toBe(1);
    expect(res.status).toBe("vulnerable");
  });

  test("b4 (Transférabilité) : marqueurs méthodologiques (process, framework, playbook, scalable)", function () {
    var res = assessBrickArmor({ text: "Création d'un playbook reproductible et d'un framework automatisé." });
    expect(res.hasTransferability).toBe(true);
    expect(res.hasNumbers).toBe(false);
    expect(res.depth).toBe(1);
    expect(res.status).toBe("vulnerable");
  });

  test("b4 (Transférabilité via stress-test) : validation par stressTestAngle3Validated", function () {
    var res = assessBrickArmor({
      text: "Action simple sans mot-clé.",
      stressTestAngle3Validated: true,
    });
    expect(res.hasTransferability).toBe(true);
  });

  // Invariant 3 : Linéarité stricte A = b1 + b2 + b3 + b4 et seuils EU AI Act
  test("Seuil A = 2 : deux briques actives = vulnerable (rejet strict sous A < 3)", function () {
    // Chiffres (12%) + Décision (tranché)
    var res = assessBrickArmor({
      text: "Face au churn de 12%, j'ai tranché pour geler les recrutements.",
    });
    expect(res.hasNumbers).toBe(true);
    expect(res.hasDecisionMarkers).toBe(true);
    expect(res.hasInfluenceMarkers).toBe(false);
    expect(res.hasTransferability).toBe(false);
    expect(res.depth).toBe(2);
    expect(res.status).toBe("vulnerable");
    expect(res.missing).toEqual(["influence", "transférabilité"]);
  });

  test("Seuil A = 3 : trois briques actives = credible (tamis intermédiaire)", function () {
    // Chiffres (15K) + Décision (arbitrage) + Influence (équipe)
    var res = assessBrickArmor({
      text: "Arbitrage budgétaire de 15K€ mené avec l'équipe de développement.",
    });
    expect(res.hasNumbers).toBe(true);
    expect(res.hasDecisionMarkers).toBe(true);
    expect(res.hasInfluenceMarkers).toBe(true);
    expect(res.hasTransferability).toBe(false);
    expect(res.depth).toBe(3);
    expect(res.status).toBe("credible");
    expect(res.missing).toEqual(["transférabilité"]);
  });

  test("Seuil A = 4 : blindage total = armored (les 4 briques validées)", function () {
    // Chiffres (30%) + Décision (choix) + Influence (board) + Transférabilité (framework)
    var res = assessBrickArmor({
      text: "Choix de déployer un framework de qualification. Alignement du board obtenu. +30% d'efficacité mesurée.",
    });
    expect(res.hasNumbers).toBe(true);
    expect(res.hasDecisionMarkers).toBe(true);
    expect(res.hasInfluenceMarkers).toBe(true);
    expect(res.hasTransferability).toBe(true);
    expect(res.depth).toBe(4);
    expect(res.status).toBe("armored");
    expect(res.missing).toEqual([]);
  });

  // Invariant 4 : Indifférence à l'ordre d'apparition des composantes
  test("Indifférence de l'ordre : permutations de texte conservent A = 4 et status = armored", function () {
    var order1 = "Framework scalable déployé (+20% de closing). Arbitrage validé avec l'équipe.";
    var order2 = "Aligné l'équipe sur un arbitrage strict. +20% atteints via ce playbook reproductible.";
    var order3 = "+20% générés. Décision imposée par la méthode et la mobilisation des collaborateurs.";

    expect(assessBrickArmor({ text: order1 }).depth).toBe(4);
    expect(assessBrickArmor({ text: order1 }).status).toBe("armored");

    expect(assessBrickArmor({ text: order2 }).depth).toBe(4);
    expect(assessBrickArmor({ text: order2 }).status).toBe("armored");

    expect(assessBrickArmor({ text: order3 }).depth).toBe(4);
    expect(assessBrickArmor({ text: order3 }).status).toBe("armored");
  });

  // Invariant 5 : Non-compensation de b1=0 ou b2=0
  test("Non-compensation : l'absence de chiffre (b1=0) bloque l'accès au statut armored", function () {
    // Décision + Influence + Transférabilité mais zéro chiffre
    var res = assessBrickArmor({
      text: "J'ai tranché pour instaurer un process strict adopté par toute l'équipe.",
    });
    expect(res.hasNumbers).toBe(false);
    expect(res.depth).toBe(3);
    expect(res.status).toBe("credible");
    expect(res.status).not.toBe("armored");
    expect(res.missing).toContain("chiffres");
  });

  test("Non-compensation : l'absence de décision (b2=0) bloque l'accès au statut armored", function () {
    // Chiffre + Influence + Transférabilité mais verbe mou sans décision
    var res = assessBrickArmor({
      text: "Process déployé avec l'équipe permettant de traiter 500 dossiers.",
    });
    expect(res.hasDecisionMarkers).toBe(false);
    expect(res.depth).toBe(3);
    expect(res.status).toBe("credible");
    expect(res.status).not.toBe("armored");
    expect(res.missing).toContain("décision");
  });

  // Invariant 6 : Agrégation des réponses de stress-test dans le calcul d'armure
  test("Stress-test : les réponses aux angles sont agrégées dans fullText", function () {
    var res = assessBrickArmor({
      text: "Restructuration du pipeline.",
      stressTest: {
        angle1: { response: { q1: "Nous avons gagné 40K€ de marge." } },
        angle2: { response: { q2: "Le CEO et la direction ont validé mon arbitrage." } },
        angle3: { response: { q3: "Méthode et playbook documentés sur Notion." } },
      },
    });
    expect(res.hasNumbers).toBe(true);
    expect(res.hasDecisionMarkers).toBe(true);
    expect(res.hasInfluenceMarkers).toBe(true);
    expect(res.hasTransferability).toBe(true);
    expect(res.depth).toBe(4);
    expect(res.status).toBe("armored");
  });
});

describe("Analyse Décisionnelle Clinique (analysis.js) — Triptyque Acteur + Tension + Résolution", function () {
  test("Valide si Acteur + Tension + Résolution sont présents", function () {
    var text1 = "Le board voulait couper les budgets. J'ai choisi de maintenir la roadmap.";
    var text2 = "La direction refusait d'avancer. J'ai tranché pour un lancement restreint.";
    var text3 = "L'équipe bloquait sur l'architecture. J'ai arbitré en faveur de la simplicité.";

    expect(hasDecisionMarkersAnalysis(text1)).toBe(true);
    expect(hasDecisionMarkersAnalysis(text2)).toBe(true);
    expect(hasDecisionMarkersAnalysis(text3)).toBe(true);
  });

  test("Rejette si la tension manque (décision sans résistance)", function () {
    var noTension = "Le board était d'accord. J'ai choisi de lancer le produit.";
    expect(hasDecisionMarkersAnalysis(noTension)).toBe(false);
  });

  test("Rejette si l'acteur tiers manque (décision solitaire en vase clos)", function () {
    var noActor = "La situation bloquait. J'ai arbitré pour relancer les tests.";
    expect(hasDecisionMarkersAnalysis(noActor)).toBe(false);
  });

  test("Rejette les verbes passifs d'ingénierie et de participation molle", function () {
    expect(hasDecisionMarkersAnalysis("J'ai participé aux réunions de crise")).toBe(false);
    expect(hasDecisionMarkersAnalysis("J'ai contribué aux décisions du comité")).toBe(false);
    expect(hasDecisionMarkersAnalysis("J'ai aidé l'équipe à choisir")).toBe(false);
  });
});
