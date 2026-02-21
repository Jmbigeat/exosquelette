import { describe, it, expect } from "vitest";
import { parseOfferSignals } from "../lib/sprint/offers.js";

// ─── Offre avec signaux d'urgence ────────────────────────────────────────────

describe("parseOfferSignals — offre avec signaux d'urgence", () => {
  const urgentOffer =
    "Nous recherchons en URGENT un Enterprise Account Executive pour un grand compte stratégique. " +
    "Contexte de forte croissance et scale-up. Le candidat devra gérer un cycle long avec " +
    "plusieurs stakeholders C-level. Remplacement immédiat suite à un départ critique. " +
    "Processus ASAP, poste prioritaire.";

  const result = parseOfferSignals(urgentOffer, "enterprise_ae");

  it("retourne un objet non-null", () => {
    expect(result).not.toBeNull();
  });

  it("détecte plusieurs signaux d'urgence", () => {
    expect(result.urgencyScore).toBeGreaterThanOrEqual(4);
    expect(result.urgencyHits).toContain("urgent");
    expect(result.urgencyHits).toContain("asap");
    expect(result.urgencyHits).toContain("forte croissance");
    expect(result.urgencyHits).toContain("scale-up");
    expect(result.urgencyHits).toContain("critique");
    expect(result.urgencyHits).toContain("prioritaire");
    expect(result.urgencyHits).toContain("remplacement");
    expect(result.urgencyHits).toContain("depart");
  });

  it("retourne exactement 3 cauchemars", () => {
    expect(result.cauchemars).toHaveLength(3);
  });

  it("le premier cauchemar a des hits (detected: true)", () => {
    const top = result.cauchemars[0];
    expect(top.detected).toBe(true);
    expect(top.hitCount).toBeGreaterThan(0);
    expect(top.matchedKw.length).toBeGreaterThan(0);
  });

  it("les cauchemars sont triés par hitCount décroissant", () => {
    expect(result.cauchemars[0].hitCount).toBeGreaterThanOrEqual(result.cauchemars[1].hitCount);
    expect(result.cauchemars[1].hitCount).toBeGreaterThanOrEqual(result.cauchemars[2].hitCount);
  });

  it("totalSignals reflète le total des hits sur tous les templates", () => {
    expect(result.totalSignals).toBeGreaterThan(0);
  });

  it("chaque cauchemar a la bonne structure", () => {
    for (const c of result.cauchemars) {
      expect(c).toHaveProperty("id");
      expect(c).toHaveProperty("label");
      expect(c).toHaveProperty("kpis");
      expect(c).toHaveProperty("nightmareShort");
      expect(c).toHaveProperty("costRange");
      expect(c).toHaveProperty("costUnit", "an");
      expect(c).toHaveProperty("costContext");
      expect(c).toHaveProperty("negoFrame");
      expect(c).toHaveProperty("costSymbolique");
      expect(c).toHaveProperty("costSystemique");
      expect(c).toHaveProperty("detected");
      expect(c).toHaveProperty("matchedKw");
      expect(c).toHaveProperty("hitCount");
      expect(Array.isArray(c.kpis)).toBe(true);
      expect(Array.isArray(c.costRange)).toBe(true);
      expect(c.costRange).toHaveLength(2);
    }
  });

  it("le cauchemar top matche le template 'Deals bloqués en politique interne'", () => {
    // L'offre contient "grand compte", "c-level", "cycle long", "stakeholder" → template 1
    const top = result.cauchemars[0];
    expect(top.label).toBe("Deals bloqués en politique interne");
    expect(top.matchedKw).toContain("grand compte");
    expect(top.matchedKw).toContain("c-level");
    expect(top.matchedKw).toContain("stakeholder");
    expect(top.matchedKw).toContain("cycle long");
  });

  it("negoFrame contient les coûts formatés", () => {
    const top = result.cauchemars[0];
    expect(top.negoFrame).toContain("200K-800K");
  });
});

// ─── Offre vague sans signaux ────────────────────────────────────────────────

describe("parseOfferSignals — offre vague sans signaux", () => {
  const vagueOffer =
    "Nous sommes une belle entreprise en pleine évolution. " +
    "Nous cherchons quelqu'un de motivé et dynamique pour rejoindre notre aventure. " +
    "Le candidat idéal sera passionné par son métier et aura un bon esprit collectif. " +
    "Nous offrons un environnement stimulant avec beaucoup de possibilités.";

  const result = parseOfferSignals(vagueOffer, "enterprise_ae");

  it("retourne un objet non-null (le texte est assez long)", () => {
    expect(result).not.toBeNull();
  });

  it("urgencyScore est 0", () => {
    expect(result.urgencyScore).toBe(0);
  });

  it("urgencyHits est vide", () => {
    expect(result.urgencyHits).toEqual([]);
  });

  it("aucun cauchemar n'est détecté", () => {
    for (const c of result.cauchemars) {
      expect(c.detected).toBe(false);
      expect(c.hitCount).toBe(0);
      expect(c.matchedKw).toEqual([]);
    }
  });

  it("totalSignals est 0", () => {
    expect(result.totalSignals).toBe(0);
  });

  it("retourne quand même 3 cauchemars (par défaut les 3 premiers templates)", () => {
    expect(result.cauchemars).toHaveLength(3);
    expect(result.cauchemars[0].id).toBe(1);
    expect(result.cauchemars[1].id).toBe(2);
    expect(result.cauchemars[2].id).toBe(3);
  });
});

// ─── Offre technique avec technologies nommées (ai_architect) ────────────────

describe("parseOfferSignals — offre technique ai_architect", () => {
  const techOffer =
    "Recherche AI Architect pour piloter le déploiement de LLM en production. " +
    "Missions : réduire le taux d'hallucination des modèles, concevoir des prompts " +
    "industrialisés avec RAG et embeddings. Gestion du budget cloud et GPU, " +
    "optimisation du coût infrastructure. Expérience en fine-tuning et évaluation " +
    "de la fiabilité des modèles. Accompagnement des équipes internes dans " +
    "l'adoption et le change management de l'IA. Poste urgent et prioritaire.";

  const result = parseOfferSignals(techOffer, "ai_architect");

  it("retourne un objet non-null", () => {
    expect(result).not.toBeNull();
  });

  it("détecte les signaux d'urgence", () => {
    expect(result.urgencyScore).toBeGreaterThanOrEqual(2);
    expect(result.urgencyHits).toContain("urgent");
    expect(result.urgencyHits).toContain("prioritaire");
  });

  it("retourne exactement 3 cauchemars", () => {
    expect(result.cauchemars).toHaveLength(3);
  });

  it("le cauchemar avec le plus de hits est en première position", () => {
    expect(result.cauchemars[0].hitCount).toBeGreaterThanOrEqual(result.cauchemars[1].hitCount);
  });

  it("détecte le cauchemar 'IA qui hallucine en prod' avec les bons mots-clés", () => {
    // Template: kw: ["hallucination", "erreur", "precision", "qualite", "fiabilite", "guardrail", "eval"]
    const hallucination = result.cauchemars.find(c => c.label === "IA qui hallucine en prod");
    expect(hallucination).toBeDefined();
    expect(hallucination.detected).toBe(true);
    expect(hallucination.matchedKw).toContain("hallucination");
    expect(hallucination.matchedKw).toContain("fiabilite");
  });

  it("détecte le cauchemar 'Prompts sans stratégie' avec mots-clés LLM/prompt", () => {
    // Template: kw: ["prompt", "llm", "modele", "fine-tuning", "rag", "embedding", "generation"]
    const prompts = result.cauchemars.find(c => c.label === "Prompts sans stratégie");
    expect(prompts).toBeDefined();
    expect(prompts.detected).toBe(true);
    expect(prompts.matchedKw).toContain("prompt");
    expect(prompts.matchedKw).toContain("llm");
    expect(prompts.matchedKw).toContain("rag");
  });

  it("détecte le cauchemar 'Budget IA sans ROI' avec mots-clés cloud/GPU", () => {
    // Template: kw: ["cout", "infra", "cloud", "gpu", "compute", "budget", "roi", "rentabilite"]
    const budget = result.cauchemars.find(c => c.label === "Budget IA sans ROI");
    expect(budget).toBeDefined();
    expect(budget.detected).toBe(true);
    expect(budget.matchedKw).toContain("cloud");
    expect(budget.matchedKw).toContain("gpu");
    expect(budget.matchedKw).toContain("cout");
    expect(budget.matchedKw).toContain("budget");
  });

  it("totalSignals est élevé grâce aux multiples technologies citées", () => {
    expect(result.totalSignals).toBeGreaterThanOrEqual(10);
  });

  it("les KPIs du cauchemar top correspondent au bon template", () => {
    const top = result.cauchemars[0];
    expect(top.kpis.length).toBeGreaterThan(0);
  });
});

// ─── Robustesse : entrées invalides ──────────────────────────────────────────

describe("parseOfferSignals — robustesse", () => {
  it("retourne null pour null", () => {
    expect(parseOfferSignals(null, "enterprise_ae")).toBeNull();
  });

  it("retourne null pour undefined", () => {
    expect(parseOfferSignals(undefined, "enterprise_ae")).toBeNull();
  });

  it("retourne null pour une chaîne vide", () => {
    expect(parseOfferSignals("", "enterprise_ae")).toBeNull();
  });

  it("retourne null pour un texte de moins de 20 caractères", () => {
    expect(parseOfferSignals("Offre courte.", "enterprise_ae")).toBeNull();
  });

  it("retourne un résultat pour un texte de 20+ caractères", () => {
    const result = parseOfferSignals("Ceci est un texte assez long pour passer la validation minimum", "enterprise_ae");
    expect(result).not.toBeNull();
    expect(result.cauchemars).toHaveLength(3);
  });

  it("fallback sur enterprise_ae pour un roleId inconnu", () => {
    const unknown = parseOfferSignals(
      "Grand compte enterprise avec stakeholders C-level et cycle long complexe",
      "role_inexistant"
    );
    const explicit = parseOfferSignals(
      "Grand compte enterprise avec stakeholders C-level et cycle long complexe",
      "enterprise_ae"
    );
    expect(unknown).toEqual(explicit);
  });

  it("normalise les accents correctement", () => {
    // "immédiat" dans le texte doit matcher "immediat" après normalisation
    const result = parseOfferSignals(
      "Recrutement immédiat pour ce poste critique, création de poste en urgence absolue",
      "enterprise_ae"
    );
    expect(result.urgencyHits).toContain("critique");
    expect(result.urgencyHits).toContain("creation de poste");
  });
});
