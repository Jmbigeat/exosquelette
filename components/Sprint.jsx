"use client";
import { useState, useEffect, useCallback, useRef } from "react";

var SCAN_STEPS_ACTIF = [
  "Analyse du profil en cours...",
  "Extraction des competences cles...",
  "Scan des offres cibles...",
  "Identification des KPIs caches...",
  "Extraction des cauchemars du decideur...",
  "Cartographie de l'elasticite marche...",
  "Simulation de l'entonnoir recruteur...",
  "Croisement profil et marche...",
  "Detection des terrains adjacents...",
  "Preparation des questions de prise de position...",
  "Calcul du Score de Lucidite...",
  "Coffre-Fort initialise.",
];

var SCAN_STEPS_PASSIF = [
  "Analyse du profil en cours...",
  "Extraction des competences cles...",
  "Scan de visibilite sectorielle...",
  "Identification des signaux faibles...",
  "Cartographie de l'elasticite marche...",
  "Croisement profil et marche...",
  "Calcul du Score de Visibilite...",
  "Coffre-Fort initialise.",
];

var STEPS = [
  { gate: "OUVERT", title: "Extraction", icon: "\u26CF\uFE0F", desc: "Valide tes briques" },
  { gate: "3+ BRIQUES", title: "Forge", icon: "\uD83D\uDD28", desc: "Forge et blinde" },
  { gate: "DENSITE 50%", title: "Affutage", icon: "\uD83D\uDD2A", desc: "Audit et positions" },
  { gate: "DENSITE 70%", title: "Armement", icon: "\uD83C\uDFAF", desc: "Duel et scripts" },
];

// Density Lock — global quality score that gates progression
function computeDensityScore(bricks) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  if (validated.length === 0) return { score: 0, details: { brickCount: 0, blindedRatio: 0, cauchemarCoverage: 0, hasCicatrice: false, hasDecision: false }, unlocks: { forge: false, affutage: false, armement: false, sortie: false } };

  // 1. Brick count (0-20 points)
  var brickPoints = Math.min(20, validated.length * 4);

  // 2. Blinded ratio (0-30 points)
  var blindedCount = 0;
  var credibleCount = 0;
  validated.forEach(function(b) {
    var text = (b.text || "").toLowerCase();
    var hasNumber = /\d/.test(text);
    var hasMethod = ["via", "grace a", "methode", "process", "programme", "plan", "strategie", "structure", "deploye", "mis en place", "construit", "installe"].some(function(m) { return text.indexOf(m) !== -1; });
    var hasContext = ["mois", "semaine", "trimestre", "jours", "equipe", "comptes", "commerciaux", "clients", "personnes"].some(function(m) { return text.indexOf(m) !== -1; });
    var hasResult = ["%", "reduction", "croissance", "augmente", "diminue", "multiplie", "atteint", "genere", "ameliore"].some(function(m) { return text.indexOf(m) !== -1; });
    var depth = (hasNumber ? 1 : 0) + (hasMethod ? 1 : 0) + (hasContext ? 1 : 0) + (hasResult ? 1 : 0) + (b.corrected ? 1 : 0);
    if (depth >= 4) blindedCount++;
    else if (depth >= 2) credibleCount++;
  });
  var blindedRatio = validated.length > 0 ? blindedCount / validated.length : 0;
  var blindedPoints = Math.round(blindedRatio * 30);

  // 3. Cauchemar coverage (0-25 points)
  var coveredKpis = {};
  validated.forEach(function(b) { if (b.kpi) coveredKpis[b.kpi] = true; });
  var coveredCauchemars = 0;
  CAUCHEMARS_CIBLES.forEach(function(c) {
    if (c.kpis.some(function(k) { return coveredKpis[k]; })) coveredCauchemars++;
  });
  var cauchemarPoints = Math.round((coveredCauchemars / 3) * 25);

  // 4. Category diversity (0-15 points) — decision/influence/cicatrice
  var hasCicatrice = validated.some(function(b) { return b.brickType === "cicatrice"; });
  var hasDecision = validated.some(function(b) { return b.brickCategory === "decision"; });
  var hasInfluence = validated.some(function(b) { return b.brickCategory === "influence"; });
  var diversityPoints = (hasCicatrice ? 5 : 0) + (hasDecision ? 5 : 0) + (hasInfluence ? 5 : 0);

  // 5. Corrections bonus (0-10 points)
  var correctedCount = validated.filter(function(b) { return b.corrected; }).length;
  var correctionPoints = Math.min(10, correctedCount * 3);

  var score = Math.min(100, brickPoints + blindedPoints + cauchemarPoints + diversityPoints + correctionPoints);

  return {
    score: score,
    details: {
      brickCount: validated.length,
      blindedCount: blindedCount,
      credibleCount: credibleCount,
      blindedRatio: Math.round(blindedRatio * 100),
      cauchemarCoverage: coveredCauchemars,
      hasCicatrice: hasCicatrice,
      hasDecision: hasDecision,
      hasInfluence: hasInfluence,
      correctedCount: correctedCount,
    },
    unlocks: {
      forge: validated.length >= 3,
      affutage: score >= 50,
      armement: score >= 70,
      sortie: score >= 70 && blindedRatio >= 0.5,
    }
  };
}

/* ==============================
   REFERENTIEL MAITRE — 50 KPIs x 10 POSTES
   Elasticite: elastique / stable / sous_pression
   ============================== */

var KPI_REFERENCE = {
  "enterprise_ae": {
    role: "Enterprise Account Executive",
    sector: "SaaS/Tech", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Cycles de deals courts, pipeline en mouvement constant. Chaque mois sans mise a jour est un mois de negotiation a l'aveugle.",
    kpis: [
      { name: "Alignement Multi-decideurs", elasticity: "elastique", why: "L'IA ne gere pas la politique interne d'un grand compte. C'est de l'influence pure." },
      { name: "Valeur Contractuelle (ACV)", elasticity: "stable", why: "Mesure la taille du deal. Standard, mais necessaire pour prouver l'echelle." },
      { name: "Taux de Conquete (Win Rate)", elasticity: "elastique", why: "Prouve la capacite a battre la concurrence par la strategie, pas par le prix." },
      { name: "Vitesse du Cycle de Vente", elasticity: "elastique", why: "Reduire le temps de decision dans le flou est un levier de cash massif." },
      { name: "Volume de Prospection", elasticity: "sous_pression", why: "L'IA genere deja des sequences de mails. Zero valeur ajoutee humaine ici." },
    ]
  },
  "head_of_growth": {
    role: "Head of Growth",
    sector: "Growth/Marketing", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Cycles de tests courts. Les metriques bougent chaque semaine. Cristalliser les apprentissages chaque mois empeche l'amnesie.",
    kpis: [
      { name: "LTV / CAC Ratio", elasticity: "elastique", why: "L'arbitrage final entre cout d'acquisition et valeur long-terme est une decision d'Architecte." },
      { name: "Taux d'Experimentation Reussie", elasticity: "elastique", why: "L'IA propose 100 tests, l'humain choisit les 2 qui vont scaler." },
      { name: "Retention (Cohortes)", elasticity: "stable", why: "Indicateur de sante du produit. Moins elastique que la strategie d'acquisition." },
      { name: "CPA (Cout par Acquisition)", elasticity: "sous_pression", why: "L'IA optimise les encheres publicitaires mieux que n'importe quel humain." },
      { name: "Viralite / K-Factor", elasticity: "elastique", why: "Creer un desir organique demande une comprehension profonde de la psychologie humaine." },
    ]
  },
  "strategic_csm": {
    role: "Strategic Customer Success Manager",
    sector: "Customer Success", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Churn et expansion se jouent au mois. Chaque renouvellement est un arbitrage. Le documenter en temps reel est le seul filet.",
    kpis: [
      { name: "Net Revenue Retention (NRR)", elasticity: "elastique", why: "Faire croitre un compte existant demande une influence politique constante." },
      { name: "Expansion Revenue (Upsell)", elasticity: "elastique", why: "Identifier le besoin metier avant le client est un acte de pure lucidite." },
      { name: "Taux de Churn Predictif", elasticity: "stable", why: "L'IA detecte les signaux de depart, l'humain doit agir sur les causes profondes." },
      { name: "Nombre de Tickets Support", elasticity: "sous_pression", why: "La gestion du flux de problemes est automatisable via Chatbots/IA." },
      { name: "NPS / CSAT", elasticity: "sous_pression", why: "La satisfaction declaree est souvent un bruit de fond inelastique." },
    ]
  },
  "senior_pm": {
    role: "Senior Product Manager",
    sector: "Product", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Les arbitrages produit se cristallisent par quarter. Trop frequent tue la profondeur. Trop rare efface les decisions.",
    kpis: [
      { name: "ROI des Fonctionnalites", elasticity: "elastique", why: "Decider de tuer une feature pour sauver le produit est un arbitrage critique." },
      { name: "Time-to-Market (Velocite)", elasticity: "elastique", why: "Orchestrer les equipes pour livrer vite dans le chaos est un levier majeur." },
      { name: "Adoption Rate (Usage)", elasticity: "stable", why: "Mesure si le produit est utile. C'est la base, pas forcement le levier." },
      { name: "Redaction de User Stories", elasticity: "sous_pression", why: "Claude ecrit deja des specs parfaites. Zero levier pour un PM Senior." },
      { name: "Priorisation du Backlog", elasticity: "elastique", why: "Dire non a 99% des demandes demande un courage politique non-substituable." },
    ]
  },
  "ai_architect": {
    role: "AI Solution Architect",
    sector: "AI/Tech", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Projets de fond, arbitrages infra lourds. Le rythme trimestriel aligne sur les cycles budgetaires.",
    kpis: [
      { name: "Reduction de la Latence Decisionnelle", elasticity: "elastique", why: "Son role est de faire gagner des semaines a l'entreprise via l'IA." },
      { name: "Cout d'Infra / ROI IA", elasticity: "elastique", why: "Arbitrer entre puissance de modele et rentabilite est une brique de Decision pure." },
      { name: "Taux d'Erreur (Hallucination)", elasticity: "stable", why: "Technique. Indispensable mais c'est de l'optimisation, pas de la strategie." },
      { name: "Nombre de Prompts Crees", elasticity: "sous_pression", why: "Quantite vs Qualite. La generation de prompts devient une commodite." },
      { name: "Adoption Interne des Outils IA", elasticity: "elastique", why: "L'IA ne s'implemente pas seule, il faut vaincre la resistance humaine." },
    ]
  },
  "engineering_manager": {
    role: "Engineering Manager",
    sector: "Engineering", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Les decisions techniques structurantes se prennent par quarter. Build vs Buy, dette technique, retention talent.",
    kpis: [
      { name: "Densite de Talent (Retention)", elasticity: "elastique", why: "Garder les meilleurs devs en 2026 demande un cadre d'execution exceptionnel." },
      { name: "Cycle Time (Commit to Deploy)", elasticity: "elastique", why: "Fluidifier le passage a l'acte technique est l'actif principal du manager." },
      { name: "Qualite du Code (Bugs/Dette)", elasticity: "stable", why: "L'IA aide a nettoyer le code. C'est de l'hygiene de base." },
      { name: "Lignes de Code Produites", elasticity: "sous_pression", why: "L'IA produit des milliers de lignes. C'est une metrique de vanite." },
      { name: "Arbitrage Build vs Buy", elasticity: "elastique", why: "Decider d'acheter une solution plutot que de la coder est une decision de survie." },
    ]
  },
  "management_consultant": {
    role: "Management Consultant",
    sector: "Conseil", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Les missions durent 2-6 mois. Le rythme trimestriel capture un cycle complet de livraison.",
    kpis: [
      { name: "Taux d'Acceptation des Recommandations", elasticity: "elastique", why: "Vendre une idee difficile a un comite de direction est l'apogee de l'influence." },
      { name: "Impact sur l'EBITDA", elasticity: "elastique", why: "Prouver un gain financier direct apres intervention est la brique ultime." },
      { name: "Clarte du Diagnostic", elasticity: "stable", why: "L'IA synthetise les donnees. L'expert en extrait le sens cache." },
      { name: "Nombre de Slides Produites", elasticity: "sous_pression", why: "Le Slide-making est mort. L'IA fait des decks en 2 minutes." },
      { name: "Vitesse de Resolution de Crise", elasticity: "elastique", why: "Agir vite quand tout brule est ce qui justifie le TJM eleve." },
    ]
  },
  "strategy_associate": {
    role: "Strategy & Corporate Associate",
    sector: "Strategy/Finance", cadence: 180, cadenceLabel: "Semestrielle", cadenceReason: "Evolution lente. Les arbitrages strategiques se comptent par semestre. Focus sur l'alignement politique et les jalons annuels.",
    kpis: [
      { name: "Precision des Signaux Faibles", elasticity: "elastique", why: "Voir une menace dans un rapport SEC avant les autres est un levier pur." },
      { name: "Fiabilite des Modeles Financiers", elasticity: "stable", why: "C'est de l'ingenierie financiere. L'IA ne doit pas faire d'erreur ici." },
      { name: "Alignement du Comex", elasticity: "elastique", why: "Transformer une analyse en decision collective est de l'influence de haut vol." },
      { name: "Synthese de Rapports Annuels", elasticity: "sous_pression", why: "N'importe quel LLM resume 200 pages en 5 secondes. Zero valeur." },
      { name: "Impact M&A (Synergies)", elasticity: "elastique", why: "Evaluer si deux cultures peuvent fusionner demande une intuition humaine." },
    ]
  },
  "operations_manager": {
    role: "Operations Manager / BizOps",
    sector: "Operations", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "L'Ops vit au rythme des process. Chaque mois amene de nouvelles frictions inter-services a documenter.",
    kpis: [
      { name: "Reduction de la Charge Cognitive", elasticity: "elastique", why: "Simplifier le travail des autres pour qu'ils se concentrent sur le levier." },
      { name: "Taux de Passage a l'Acte (Output)", elasticity: "elastique", why: "Transformer une idee en processus fluide est le coeur de l'Ops." },
      { name: "Cout Operationnel Unitaire", elasticity: "stable", why: "Mesure l'efficience. Important pour la rentabilite." },
      { name: "Maintenance des Outils (SaaS)", elasticity: "sous_pression", why: "L'IA gere l'interoperabilite des outils. Tache administrative a faible valeur." },
      { name: "Indice de Friction Inter-services", elasticity: "elastique", why: "Resoudre les conflits entre Sales et Produit est un arbitrage humain." },
    ]
  },
  "fractional_coo": {
    role: "Fractional COO",
    sector: "Scale & Performance", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Flux de decisions rapide, multiplicite des clients. Justifier le ROI chaque mois est une question de survie.",
    kpis: [
      { name: "Acceleration du Runway", elasticity: "elastique", why: "Faire gagner 6 mois de survie a une boite est l'actif le plus cher du marche." },
      { name: "Alignement des Equipes N-1", elasticity: "elastique", why: "S'assurer que tout le monde court dans la meme direction sans etre la 24/7." },
      { name: "Mise en Place du Cadre (Governance)", elasticity: "stable", why: "Indispensable pour scaler, mais c'est de la structure, pas encore du pivot." },
      { name: "Reporting Hebdomadaire", elasticity: "sous_pression", why: "L'automatisation du reporting est totale en 2026." },
      { name: "ROI du Temps de Direction", elasticity: "elastique", why: "Maximiser chaque minute du CEO est le levier de saillance ultime du COO." },
    ]
  },
};

var TARGET_ROLES = Object.keys(KPI_REFERENCE).map(function(key) {
  return { id: key, role: KPI_REFERENCE[key].role, sector: KPI_REFERENCE[key].sector };
});

/* ==============================
   ROLE CLUSTERS — 10 grouped buttons
   Labels: client-facing titles (not reference names)
   Subtitles: questions (not descriptions)
   ============================== */

var ROLE_CLUSTERS = [
  { id: "enterprise_ae", bloc: "Croissance", label: "Commercial / Account Executive / Business Developer", subtitle: "Tu geres un cycle de vente ou un portefeuille ?", sectorLabel: "Vente" },
  { id: "head_of_growth", bloc: "Croissance", label: "Growth / Marketing Manager / Acquisition", subtitle: "Tu mesures un cout d'acquisition ou un taux de conversion ?", sectorLabel: "Marketing" },
  { id: "strategic_csm", bloc: "Croissance", label: "Customer Success / Account Manager / Support Lead", subtitle: "Tu geres la retention ou l'upsell ?", sectorLabel: "Relation client" },
  { id: "senior_pm", bloc: "Produit & Tech", label: "Chef de Projet / Product Manager / Product Owner", subtitle: "Tu arbitres entre le besoin, la faisabilite et le budget ?", sectorLabel: "Produit" },
  { id: "engineering_manager", bloc: "Produit & Tech", label: "Tech Lead / Engineering Manager / CTO adjoint", subtitle: "Tu decides de l'architecture ou tu geres des developpeurs ?", sectorLabel: "Tech" },
  { id: "ai_architect", bloc: "Produit & Tech", label: "Data / IA / Solution Architect", subtitle: "Tu construis ou tu arbitres des systemes de donnees ?", sectorLabel: "Data & IA" },
  { id: "management_consultant", bloc: "Strategie & Ops", label: "Consultant / Manager en cabinet", subtitle: "Tu vends des recommandations et tu mesures ton impact ?", sectorLabel: "Conseil" },
  { id: "strategy_associate", bloc: "Strategie & Ops", label: "Strategie / Finance / M&A", subtitle: "Tu produis des modeles financiers ou tu influences un comite de direction ?", sectorLabel: "Strategie" },
  { id: "operations_manager", bloc: "Strategie & Ops", label: "Operations / Chef de Projet transverse / BizOps", subtitle: "Tu fluidifies les process entre les equipes ?", sectorLabel: "Operations" },
  { id: "fractional_coo", bloc: "Strategie & Ops", label: "Direction / COO / Directeur de BU", subtitle: "Tu alignes des equipes, tu geres un P&L ou tu optimises le temps de la direction ?", sectorLabel: "Direction" },
];

// Match a brick's KPI text against the reference for a given role
function matchKpiToReference(kpiText, roleId) {
  if (!roleId || !KPI_REFERENCE[roleId]) return null;
  var roleKpis = KPI_REFERENCE[roleId].kpis;
  var lower = kpiText.toLowerCase();
  var bestMatch = null;
  var bestScore = 0;
  roleKpis.forEach(function(ref) {
    var refLower = ref.name.toLowerCase();
    var words = refLower.split(/[\s\/\(\)]+/).filter(function(w) { return w.length > 3; });
    var score = 0;
    words.forEach(function(w) { if (lower.indexOf(w) !== -1) score++; });
    var aliases = {
      "nrr": "net revenue retention",
      "mrr": "croissance mrr",
      "arr": "valeur contractuelle",
      "churn": "churn predictif",
      "cycle de vente": "vitesse du cycle",
      "pipeline": "volume de prospection",
      "adoption": "adoption rate",
      "retention": "retention",
      "upsell": "expansion revenue",
      "win rate": "taux de conquete",
      "acv": "valeur contractuelle",
      "ltv": "ltv / cac",
      "cac": "ltv / cac",
      "nps": "nps / csat",
      "csat": "nps / csat",
    };
    Object.keys(aliases).forEach(function(alias) {
      if (lower.indexOf(alias) !== -1 && refLower.indexOf(aliases[alias].toLowerCase()) !== -1) score += 2;
    });
    if (score > bestScore) { bestScore = score; bestMatch = ref; }
  });
  return bestScore >= 1 ? bestMatch : null;
}

/* ==============================
   CROSS-ROLE MATCHING — runs bricks against all 10 roles
   Detects alternative paths the client hasn't considered
   ============================== */

function computeCrossRoleMatching(bricks, currentRoleId, trajectoryToggle) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.kpi; });
  if (validated.length < 3) return null;

  var roleIds = Object.keys(KPI_REFERENCE);
  var results = [];

  roleIds.forEach(function(roleId) {
    if (roleId === currentRoleId) return;
    var roleData = KPI_REFERENCE[roleId];
    var elasticMatches = 0;
    var stableMatches = 0;
    var totalMatches = 0;
    var matchedKpis = [];

    validated.forEach(function(b) {
      var match = matchKpiToReference(b.kpi, roleId);
      if (match) {
        totalMatches++;
        if (match.elasticity === "elastique") { elasticMatches++; matchedKpis.push({ kpi: match.name, elasticity: match.elasticity, brick: b.text.length > 50 ? b.text.slice(0, 50) + "..." : b.text }); }
        else if (match.elasticity === "stable") { stableMatches++; }
      }
    });

    if (elasticMatches >= 2 || totalMatches >= 3) {
      results.push({
        roleId: roleId,
        role: roleData.role,
        sector: roleData.sector,
        elasticMatches: elasticMatches,
        stableMatches: stableMatches,
        totalMatches: totalMatches,
        coverage: Math.round((totalMatches / 5) * 100),
        matchedKpis: matchedKpis,
      });
    }
  });

  // Sort by elastic matches, then total
  results.sort(function(a, b) {
    if (b.elasticMatches !== a.elasticMatches) return b.elasticMatches - a.elasticMatches;
    return b.totalMatches - a.totalMatches;
  });

  // Get current role coverage for comparison
  var currentElastic = 0;
  var currentTotal = 0;
  validated.forEach(function(b) {
    var match = matchKpiToReference(b.kpi, currentRoleId);
    if (match) {
      currentTotal++;
      if (match.elasticity === "elastique") currentElastic++;
    }
  });

  // Only return results that match better than current role or reveal something new
  var meaningful = results.filter(function(r) {
    return r.elasticMatches >= currentElastic || (r.elasticMatches >= 2 && r.coverage >= 40);
  });

  if (meaningful.length === 0) return null;

  return {
    currentRole: KPI_REFERENCE[currentRoleId] ? KPI_REFERENCE[currentRoleId].role : "",
    currentElastic: currentElastic,
    currentTotal: currentTotal,
    currentCoverage: Math.round((currentTotal / 5) * 100),
    alternatives: meaningful.slice(0, 3),
    trajectory: trajectoryToggle,
  };
}

/* ==============================
   INTERROGATOIRE SEEDS — 3 brick types: chiffre, decision, influence
   + cicatrices + mission fallbacks + elasticity + advocacy framing
   ============================== */

var CAUCHEMARS_CIBLES = [
  { id: 1, label: "Portefeuille en stagnation", kpis: ["Croissance MRR", "Pipeline genere"], nightmareShort: "Le VP Sales ne dort plus : son portefeuille stagne.", costRange: [200000, 800000], costUnit: "an", costContext: "Cout de stagnation Mid-Market : pipeline non-converti, renouvellements flat, opportunites d'upsell manquees.", negoFrame: "La discussion ne porte pas sur ton salaire. Elle porte sur les {cost} que ce portefeuille en stagnation leur coute chaque annee.", costSymbolique: "Le board voit un segment flat. La confiance dans l'equipe commerciale s'erode. Les talents partent vers des equipes qui grandissent.", costSystemique: "Pas de reference client dans le segment. Les autres AE n'ont pas de precedent pour ouvrir des deals similaires. Le pipeline indirect n'existe pas." },
  { id: 2, label: "Hemorragie de churn", kpis: ["Taux de retention"], nightmareShort: "Le churn bouffe la croissance. Chaque client perdu coute 5x.", costRange: [150000, 600000], costUnit: "an", costContext: "Cout du churn : chaque point de churn dans un portefeuille Mid-Market represente 5x le cout d'acquisition en revenus perdus.", negoFrame: "Tu ne negocies pas une augmentation. Tu negocies le prix de l'arret de l'hemorragie. {cost} par an partent en fumee.", costSymbolique: "Un client qui part parle. Les prospects du meme secteur entendent. La reputation du produit se degrade.", costSystemique: "Chaque client perdu est une reference en moins. Les deals en cours perdent un point d'appui. Le marketing perd un cas client." },
  { id: 3, label: "Deals qui trainent / outils morts", kpis: ["Cycle de vente", "Adoption outil"], nightmareShort: "Les deals trainent 6 mois. Le CRM coute 200K et personne ne l'utilise.", costRange: [100000, 500000], costUnit: "an", costContext: "Cout du cycle long : cash immobilise dans des deals non-clos + licence CRM sans adoption = destruction de valeur silencieuse.", negoFrame: "Le CFO calcule le cout du cash immobilise. {cost} par an disparaissent dans des deals qui auraient du closer 3 mois plus tot.", costSymbolique: "L'equipe perd confiance dans les outils. Le management perd visibilite sur le pipeline. Les previsions deviennent fiction.", costSystemique: "Sans donnees fiables, chaque decision d'allocation de ressources est un pari. Les recrutements sont retardes. La croissance est freinee par l'absence de visibilite." },
];

// Negotiation script generator
function computeNegotiationBrief(bricks) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var coverage = computeCauchemarCoverage(bricks);
  var coveredCauchemars = coverage.filter(function(c) { return c.covered; });
  if (coveredCauchemars.length === 0) return null;

  var totalCostLow = 0;
  var totalCostHigh = 0;
  var lines = [];

  coveredCauchemars.forEach(function(cc) {
    var cauch = CAUCHEMARS_CIBLES.find(function(c) { return c.id === cc.id; });
    if (!cauch) return;
    totalCostLow += cauch.costRange[0];
    totalCostHigh += cauch.costRange[1];
    var coveringBricks = validated.filter(function(b) {
      return cauch.kpis.some(function(kpi) {
        return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
      });
    });
    var hasCicatrice = coveringBricks.some(function(b) { return b.brickType === "cicatrice"; });
    var hasDecision = coveringBricks.some(function(b) { return b.brickCategory === "decision"; });
    var hasChiffre = coveringBricks.some(function(b) { return b.brickCategory === "chiffre"; });
    var strength = "faible";
    if (hasChiffre && (hasDecision || hasCicatrice)) strength = "fort";
    else if (hasChiffre || hasDecision) strength = "moyen";
    var costStr = formatCost(cauch.costRange[0]) + "-" + formatCost(cauch.costRange[1]);
    lines.push({
      cauchemar: cauch.label,
      costLow: cauch.costRange[0], costHigh: cauch.costRange[1],
      costLogic: cauch.costContext,
      negoFrame: cauch.negoFrame.replace("{cost}", costStr),
      brickCount: coveringBricks.length, strength: strength, hasCicatrice: hasCicatrice,
    });
  });
  return { totalCostLow: totalCostLow, totalCostHigh: totalCostHigh, lines: lines, coveredCount: coveredCauchemars.length, totalCount: CAUCHEMARS_CIBLES.length };
}

function formatCost(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return n + "";
}

// Bluff detection — weak positioning on a covered cauchemar
function detectBluffRisk(bricks) {
  var coverage = computeCauchemarCoverage(bricks);
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var risks = [];
  coverage.forEach(function(cc) {
    if (!cc.covered) return;
    var cauch = CAUCHEMARS_CIBLES.find(function(c) { return c.id === cc.id; });
    if (!cauch) return;
    var coveringBricks = validated.filter(function(b) {
      return cauch.kpis.some(function(kpi) {
        return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
      });
    });
    var allSousPression = coveringBricks.length > 0 && coveringBricks.every(function(b) {
      return b.kpiRefMatch && b.kpiRefMatch.elasticity === "sous_pression";
    });
    var singleBrick = coveringBricks.length === 1;
    var noChiffre = !coveringBricks.some(function(b) { return b.brickCategory === "chiffre"; });
    if (allSousPression) {
      risks.push({ cauchemar: cauch.label, severity: "critique",
        reason: "Ta preuve repose sur un KPI automatisable. Le recruteur sait que l'IA fait ce travail. Tu te positionnes comme le remede avec un outil que tout le monde a."
      });
    } else if (singleBrick && noChiffre) {
      risks.push({ cauchemar: cauch.label, severity: "alerte",
        reason: "Un seul indice. Pas de chiffre. Si le probleme persiste apres ton arrivee, tu es le fusible. Renforce cette preuve ou change de terrain."
      });
    }
  });
  return risks;
}

/* ==============================
   ADAPTIVE INTERROGATION SEEDS — generated per role from KPI_REFERENCE
   Keeps same structure, adapts vocabulary and context per role
   ============================== */

/* ==============================
   BRICK FIELDS — 4-field structure per brick type
   ============================== */

var BRICK_FIELDS = {
  chiffre: [
    { key: "situation", label: "La situation qu'on m'a confiee", placeholder: "Le probleme ou la mission" },
    { key: "action", label: "Ce que j'ai fait concretement", placeholder: "L'action, la methode" },
    { key: "result", label: "Le resultat mesure", placeholder: "Le chiffre, le delta, le delai" },
    { key: "constraint", label: "Ce qui compliquait les choses", placeholder: "La contrainte, le risque, le blocage" },
  ],
  decision: [
    { key: "options", label: "Les deux options qui s'opposaient", placeholder: "Option A vs Option B" },
    { key: "choice", label: "Mon choix et pourquoi", placeholder: "Ce que j'ai tranche" },
    { key: "result", label: "Le resultat", placeholder: "Ce qui s'est passe apres" },
    { key: "hindsight", label: "Ce que j'aurais fait differemment", placeholder: "Le recul" },
  ],
  influence: [
    { key: "resistance", label: "Qui resistait et pourquoi", placeholder: "Les acteurs, leurs positions" },
    { key: "stakes", label: "Ce qui etait bloque", placeholder: "L'enjeu, le cout du blocage" },
    { key: "method", label: "Comment j'ai debloque", placeholder: "Ma methode, mon levier" },
    { key: "insight", label: "Ce que j'ai appris sur cette organisation", placeholder: "La lecture politique" },
  ],
  cicatrice: [
    { key: "action", label: "Ce que j'ai fait", placeholder: "L'action qui a echoue" },
    { key: "damage", label: "Ce qui a rate", placeholder: "Le resultat negatif, les degats" },
    { key: "mypart", label: "Ma part dans cet echec", placeholder: "Ce qui dependait de moi" },
    { key: "change", label: "Ce que j'ai change apres", placeholder: "La correction appliquee" },
  ],
  take: [
    { key: "consensus", label: "Ce que tout le monde pense vrai", placeholder: "Le consensus de ton secteur" },
    { key: "counter", label: "Pourquoi c'est faux ou incomplet", placeholder: "Ton contrepoint" },
    { key: "proof", label: "Ce que j'ai vu ou mesure", placeholder: "L'experience personnelle" },
    { key: "consequence", label: "La consequence pour ceux qui suivent", placeholder: "Le risque du consensus" },
  ],
  unfair: [
    { key: "asked", label: "Ce qu'on me demande souvent", placeholder: "Ce que tes collegues te demandent de montrer, expliquer, ou faire" },
    { key: "easy", label: "Pourquoi ca me parait facile", placeholder: "Ce qui rend ca naturel pour toi" },
    { key: "others", label: "Ce que ca coute aux autres", placeholder: "Le temps ou l'effort que les autres y mettent" },
    { key: "proof", label: "Une preuve concrete", placeholder: "Un moment ou ce decalage etait visible" },
  ],
};

function getBrickFields(seed) {
  if (seed.type === "unfair_advantage") return BRICK_FIELDS.unfair;
  if (seed.type === "take") return BRICK_FIELDS.take;
  if (seed.type === "cicatrice") return BRICK_FIELDS.cicatrice;
  if (seed.brickCategory === "decision") return BRICK_FIELDS.decision;
  if (seed.brickCategory === "influence") return BRICK_FIELDS.influence;
  return BRICK_FIELDS.chiffre;
}

function assembleFieldsToText(fields, fieldDefs) {
  return fieldDefs.map(function(f) {
    var val = fields[f.key] || "";
    return val.trim() ? f.label + " : " + val.trim() : "";
  }).filter(function(l) { return l.length > 0; }).join(". ") + ".";
}

var SEED_TEMPLATES = {
  chiffre_1: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Tu mentionnes une activite liee a " + kpi.name.toLowerCase() + ". Quel indicateur a bouge ? De combien ? En combien de temps ?"; },
    context: function(kpi) { return "Le recruteur cherche un chiffre sur " + kpi.name + ". " + kpi.why; },
    hint: function(kpi) { return "Ex : donne le chiffre avant, le chiffre apres, et la methode."; },
    missionText: function(kpi) { return "Tu n'as pas de chiffre sur " + kpi.name.toLowerCase() + ". Verifie tes anciens outils (CRM, reporting, dashboard). Cherche le delta avant/apres ton intervention. Reviens avec le chiffre."; },
    nightmareGen: function(kpi, cauch) { return cauch ? cauch.nightmareShort : "Le decideur cherche quelqu'un qui a fait bouger " + kpi.name.toLowerCase() + ". Tu as le remede mais tu ne le formules pas."; },
  },
  chiffre_2: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Quel processus as-tu change ou construit qui a eu un impact mesurable sur " + kpi.name.toLowerCase() + " ?"; },
    context: function(kpi) { return "L'offre cache un besoin de structuration. " + kpi.why; },
    hint: function(kpi) { return "Ex : methode deployee, nombre de personnes impactees, resultat mesure."; },
    missionText: function(kpi) { return "Tu decris une activite sans mesure. Retrouve l'indicateur que ton action a fait bouger. Reviens avec le delta."; },
    nightmareGen: function(kpi, cauch) { return cauch ? cauch.nightmareShort : "Personne ne structure " + kpi.name.toLowerCase() + ". Tu sais le faire mais ton CV ne le dit pas."; },
  },
  chiffre_3: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Tu as encadre ou forme des gens. Combien ? Quel resultat mesurable ont-ils obtenu grace a toi ?"; },
    context: function(kpi) { return "Signal implicite : le poste evolue vers du leadership. Prouve que tu sais faire grandir une equipe."; },
    hint: function() { return "Ex : nombre de personnes, resultat de l'equipe, promotions obtenues."; },
    missionText: function() { return "Tu ne connais pas le resultat de ton equipe. Demande le reporting a ton manager ou calcule-le. Reviens avec le chiffre."; },
    nightmareGen: function() { return "Le manager recrute mais l'equipe ne produit pas. Il cherche quelqu'un qui sait former et faire grandir."; },
  },
  chiffre_4: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Quel outil ou systeme as-tu deploye ? Combien de personnes concernees ? Quel taux d'adoption ?"; },
    context: function(kpi) { return "Le recruteur cherche quelqu'un qui sait faire adopter, pas juste utiliser. " + kpi.why; },
    hint: function() { return "Ex : outil deploye, nombre d'utilisateurs, taux d'adoption, delai."; },
    missionText: function() { return "Tu ne connais pas le taux d'adoption. Verifie les logs de connexion ou demande a ton ops. Reviens avec le chiffre."; },
    nightmareGen: function() { return "L'outil coute une fortune et personne ne l'utilise. Le board demande des comptes."; },
  },
  chiffre_5: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Quel indicateur as-tu ameliore qui etait directement lie a " + kpi.name.toLowerCase() + " ? Chiffre avant, chiffre apres."; },
    context: function(kpi) { return kpi.why; },
    hint: function(kpi) { return "Ex : indicateur specifique, avant/apres, methode utilisee."; },
    missionText: function(kpi) { return "Pas de chiffre sur " + kpi.name.toLowerCase() + ". C'est un KPI " + kpi.elasticity + ". Trouve la donnee."; },
    nightmareGen: function(kpi) { return "L'offre mentionne " + kpi.name.toLowerCase() + ". Le decideur veut voir un impact prouve."; },
  },
  decision: {
    brickCategory: "decision", type: "preuve",
    question: function() { return "Decris un moment ou deux directions s'opposaient et ou tu as du trancher. Qui voulait quoi ? Qu'as-tu choisi et pourquoi ?"; },
    context: function() { return "Le recruteur cherche un arbitrage documente, pas un chiffre. La prise de decision sous contrainte est le KPI le plus rare."; },
    hint: function() { return "Ex : deux options, les arguments de chaque camp, ton choix, le resultat."; },
    missionText: null,
    nightmareGen: function() { return "Personne ne tranche. Le projet est paralyse. Ton remede : tu sais decider quand les autres hesitent."; },
  },
  influence: {
    brickCategory: "influence", type: "preuve",
    question: function() { return "Raconte un moment ou tu as du obtenir l'accord de gens qui n'etaient pas d'accord entre eux. Qui resistait ? Comment tu as debloque ?"; },
    context: function() { return "L'influence sans autorite est la competence la plus elastique du marche. L'IA ne remplace pas la politique interne."; },
    hint: function() { return "Ex : acteurs en conflit, ta methode pour debloquer, le resultat obtenu."; },
    missionText: null,
    nightmareGen: function() { return "Les equipes ne s'alignent pas. Les decisions trainent. Ton remede : tu sais debloquer les situations politiques."; },
  },
  cicatrice_1: {
    brickCategory: "chiffre", type: "cicatrice",
    question: function() { return "Raconte-moi un echec professionnel. Pas un echec complique. Un echec que tu aurais du eviter. Qu'est-ce qui s'est passe ?"; },
    context: function() { return "Le recruteur teste ta maturite. Un profil sans echec analyse est un profil a risque."; },
    hint: function() { return "Ex : la situation, ce que tu as mal fait (pas le contexte), la lecon apprise."; },
    missionText: function() { return "Tu ne trouves pas d'echec precis. Prends 10 minutes. Revois tes projets du dernier semestre. Identifie celui ou tu as le plus de regret."; },
    nightmareGen: null,
    blameDetection: true,
  },
  cicatrice_2: {
    brickCategory: "chiffre", type: "cicatrice",
    question: function() { return "Decris un projet qui a echoue. Qu'est-ce qui dependait de toi dans cet echec ? Pas du marche. Pas de ton manager. De toi."; },
    context: function() { return "Le recruteur distingue ceux qui assument de ceux qui externalisent."; },
    hint: function() { return "Ex : ce que tu as lance sans tester, les 2 mois perdus, ta correction."; },
    missionText: function() { return "Tu externalises l'echec. Identifie un facteur sous ton controle. Reviens avec cette part de responsabilite."; },
    nightmareGen: null,
    externalizeDetection: true,
  },
  take_1: {
    type: "take",
    question: function() { return "Quelle evolution de ton secteur te semble sous-estimee ou mal comprise par la majorite des professionnels autour de toi ?"; },
    context: function() { return "Cette question revele si tu vis ton marche en surface ou en profondeur. Un expert sait dire : 'Voila ce que tout le monde pense et voila pourquoi c'est faux ou incomplet.'"; },
    hint: function() { return "Ex : Tout le monde pense que X. En realite, Y. Parce que Z."; },
    surfacePatterns: ["ia va tout changer", "le marche evolue", "faut s'adapter", "c'est en train de bouger", "on verra", "ca depend", "je sais pas trop", "intelligence artificielle", "digital", "transformation", "agilite", "innovation"],
  },
  take_2: {
    type: "take",
    question: function() { return "Qu'est-ce que la majorite des gens de ton metier font par habitude et qui ne fonctionne plus selon toi ? Qu'est-ce que tu fais differemment ?"; },
    context: function() { return "La premiere reponse teste ta vision du secteur. Celle-ci teste ta pratique. Un expert ne se contente pas d'observer. Il fait autrement."; },
    hint: function() { return "Ex : La majorite fait X. Moi je fais Y. Le resultat est Z."; },
    surfacePatterns: ["je fais comme tout le monde", "je suis les process", "on fait ce qu'on peut", "c'est comme ca", "pas le choix", "tout le monde fait pareil"],
  },
  unfair_advantage: {
    type: "unfair_advantage", brickCategory: "chiffre",
    question: function() { return "Qu'est-ce que tes collegues ou ton manager te demandent regulierement de leur montrer, de leur expliquer, ou de faire a leur place ?"; },
    context: function() { return "Ce qui te parait facile te parait facile parce que tu le fais depuis longtemps. Les autres y passent 3x plus de temps. C'est la que se cache ton avantage structurel."; },
    hint: function() { return "Ex : on me demande toujours comment je fais mes cold calls, comment je qualifie, comment je structure mes meetings."; },
    missionText: null,
    nightmareGen: function() { return "Ton avantage injuste est invisible pour toi. L'outil te le revele."; },
  },
};

function generateAdaptiveSeeds(roleId) {
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;
  if (!roleData) {
    // Fallback: generic seeds if no role
    roleData = KPI_REFERENCE["enterprise_ae"];
  }

  var kpis = roleData.kpis;
  var elasticKpis = kpis.filter(function(k) { return k.elasticity === "elastique"; });
  var stableKpis = kpis.filter(function(k) { return k.elasticity === "stable"; });

  // Map KPIs to cauchemars for nightmare text
  function findCauchemar(kpi) {
    return CAUCHEMARS_CIBLES.find(function(c) {
      return c.kpis.some(function(ck) { return kpi.name.toLowerCase().indexOf(ck.toLowerCase().slice(0, 6)) !== -1 || ck.toLowerCase().indexOf(kpi.name.toLowerCase().slice(0, 6)) !== -1; });
    }) || null;
  }

  var seeds = [];
  var id = 1;

  // 5 chiffre seeds — one per KPI (elastic first)
  var orderedKpis = elasticKpis.concat(stableKpis).concat(kpis.filter(function(k) { return k.elasticity === "sous_pression"; }));
  var chiffreTemplates = ["chiffre_1", "chiffre_2", "chiffre_3", "chiffre_4", "chiffre_5"];

  orderedKpis.slice(0, 5).forEach(function(kpi, i) {
    var tpl = SEED_TEMPLATES[chiffreTemplates[i]] || SEED_TEMPLATES.chiffre_1;
    var cauch = findCauchemar(kpi);
    seeds.push({
      id: id++, type: "preuve", brickCategory: tpl.brickCategory,
      question: tpl.question(kpi),
      context: tpl.context(kpi),
      hint: tpl.hint(kpi),
      generatedText: null, // Will be forged from client answer
      advocacyText: null,
      internalAdvocacy: null,
      controlRisk: kpi.elasticity === "sous_pression" ? "Ce KPI est automatisable. Si c'est ta meilleure preuve, le recruteur doute. Trouve un angle elastique." : null,
      sectoralNote: null,
      verbNote: null,
      omegaNote: null,
      missionText: tpl.missionText ? tpl.missionText(kpi) : null,
      nightmareText: tpl.nightmareGen ? tpl.nightmareGen(kpi, cauch) : null,
      anonymizedText: null,
      kpi: kpi.name,
      elasticity: kpi.elasticity,
      elasticityNote: kpi.why,
      skills: [],
      usedIn: ["CV", "Simulateur", "Posts LinkedIn"],
    });
  });

  // 1 decision seed
  var dTpl = SEED_TEMPLATES.decision;
  seeds.push({
    id: id++, type: "preuve", brickCategory: "decision",
    question: dTpl.question(), context: dTpl.context(), hint: dTpl.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null, missionText: null,
    nightmareText: dTpl.nightmareGen(), anonymizedText: null,
    kpi: "Jugement strategique", elasticity: "elastique",
    elasticityNote: "L'IA accelere l'execution. La prise de decision sous contrainte reste humaine.",
    skills: [], usedIn: ["CV", "Simulateur", "Duel"],
  });

  // 1 influence seed
  var iTpl = SEED_TEMPLATES.influence;
  seeds.push({
    id: id++, type: "preuve", brickCategory: "influence",
    question: iTpl.question(), context: iTpl.context(), hint: iTpl.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null, missionText: null,
    nightmareText: iTpl.nightmareGen(), anonymizedText: null,
    kpi: "Influence transverse", elasticity: "elastique",
    elasticityNote: "Plus les organisations deviennent matricielles, plus l'influence sans autorite devient critique.",
    skills: [], usedIn: ["CV", "Simulateur", "Duel"],
  });

  // 2 cicatrice seeds
  var c1 = SEED_TEMPLATES.cicatrice_1;
  seeds.push({
    id: id++, type: "cicatrice", brickCategory: "chiffre",
    question: c1.question(), context: c1.context(), hint: c1.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null,
    missionText: c1.missionText(), nightmareText: null, anonymizedText: null,
    kpi: "Lecture client", elasticity: null, elasticityNote: null,
    skills: [], usedIn: ["Simulateur", "Duel", "Posts LinkedIn"],
    blameDetection: true,
  });

  var c2 = SEED_TEMPLATES.cicatrice_2;
  seeds.push({
    id: id++, type: "cicatrice", brickCategory: "chiffre",
    question: c2.question(), context: c2.context(), hint: c2.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null,
    missionText: c2.missionText(), nightmareText: null, anonymizedText: null,
    kpi: "Capacite d'adaptation", elasticity: null, elasticityNote: null,
    skills: [], usedIn: ["Simulateur", "Duel", "CV"],
    externalizeDetection: true,
  });

  // 2 take seeds
  var t1 = SEED_TEMPLATES.take_1;
  seeds.push({
    id: id++, type: "take",
    question: t1.question(), context: t1.context(), hint: t1.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null, missionText: null,
    nightmareText: null, anonymizedText: null,
    kpi: null, elasticity: null, elasticityNote: null,
    skills: [], usedIn: ["Piliers de Singularite", "Posts LinkedIn", "Commentaires LinkedIn"],
    surfacePatterns: t1.surfacePatterns,
  });

  var t2 = SEED_TEMPLATES.take_2;
  seeds.push({
    id: id++, type: "take",
    question: t2.question(), context: t2.context(), hint: t2.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null, missionText: null,
    nightmareText: null, anonymizedText: null,
    kpi: null, elasticity: null, elasticityNote: null,
    skills: [], usedIn: ["Piliers de Singularite", "Posts LinkedIn", "Script de contact"],
    surfacePatterns: t2.surfacePatterns,
  });

  // UNFAIR ADVANTAGE SEED — Item 4
  var ua = SEED_TEMPLATES.unfair_advantage;
  seeds.push({
    id: id++, type: "unfair_advantage", brickCategory: "chiffre",
    question: ua.question(), context: ua.context(), hint: ua.hint(),
    generatedText: null, advocacyText: null, internalAdvocacy: null, controlRisk: null,
    sectoralNote: null, verbNote: null, omegaNote: null, missionText: null,
    nightmareText: ua.nightmareGen ? ua.nightmareGen() : null, anonymizedText: null,
    kpi: "Avantage injuste", elasticity: null, elasticityNote: null,
    skills: [], usedIn: ["Rapport d'impact", "CV header", "Bio LinkedIn", "Script de contact"],
  });

  return seeds;
}

/* ==============================
   TAKE DEPTH ANALYSIS — surface vs deep
   ============================== */

function analyzeTakeDepth(text, surfacePatterns) {
  var lower = text.toLowerCase();
  var words = text.split(/\s+/).length;

  // Check surface patterns
  var surfaceHits = [];
  if (surfacePatterns) {
    surfacePatterns.forEach(function(p) {
      if (lower.indexOf(p) !== -1) surfaceHits.push(p);
    });
  }

  // Check depth markers
  var depthMarkers = {
    contrarian: ["en realite", "en fait", "le vrai probleme", "ce qu'on ne dit pas", "ce que personne", "a tort", "faux", "incomplet", "illusion", "mythe", "erreur", "contresens"],
    specific: ["%", "x", "fois", "mois", "semaines", "clients", "deals", "equipes", "euros", "budget"],
    causal: ["parce que", "car", "la raison", "le probleme c'est", "la consequence", "resultat", "donc", "ce qui fait que"],
    personal: ["j'ai vu", "j'ai teste", "j'ai mesure", "mon experience", "dans ma pratique", "concretement", "quand j'ai", "chez nous", "sur mon segment"],
  };

  var depthScore = 0;
  var foundDepth = [];
  Object.keys(depthMarkers).forEach(function(cat) {
    depthMarkers[cat].forEach(function(m) {
      if (lower.indexOf(m) !== -1) {
        depthScore++;
        if (foundDepth.indexOf(cat) === -1) foundDepth.push(cat);
      }
    });
  });

  var isSurface = (surfaceHits.length >= 2 && depthScore < 2) || (words < 15 && depthScore === 0);
  var isDeep = depthScore >= 3 && foundDepth.length >= 2;

  return {
    level: isDeep ? "deep" : isSurface ? "surface" : "partial",
    surfaceHits: surfaceHits,
    depthScore: depthScore,
    foundDepth: foundDepth,
    words: words,
  };
}

/* ==============================
   TAKE TO PILLAR — transforms raw take into structured pillar
   ============================== */

function takeToiPillar(takeText, takeAnalysis) {
  // Extract the contrarian core
  var lower = takeText.toLowerCase();
  var title = "";
  var desc = takeText.length > 120 ? takeText.slice(0, 120) + "..." : takeText;

  // Try to extract the "what everyone thinks vs reality" structure
  var contrarianMarkers = ["en realite", "en fait", "le vrai probleme", "mais", "pourtant", "alors que"];
  var splitPoint = -1;
  contrarianMarkers.forEach(function(m) {
    var idx = lower.indexOf(m);
    if (idx > 10 && (splitPoint === -1 || idx < splitPoint)) splitPoint = idx;
  });

  if (splitPoint > 0) {
    var consensus = takeText.slice(0, splitPoint).trim();
    if (consensus.length > 60) consensus = consensus.slice(0, 60) + "...";
    title = consensus;
  } else {
    // Use first sentence or first 60 chars
    var firstDot = takeText.indexOf(".");
    title = firstDot > 0 && firstDot < 80 ? takeText.slice(0, firstDot) : takeText.slice(0, 60) + "...";
  }

  return { title: title, desc: desc, source: "take", depth: takeAnalysis.level };
}

var ROLE_PILLARS = {
  enterprise_ae: [
    { id: 1, title: "Le terrain contre la tour d'ivoire", desc: "Pourquoi l'experience operationnelle bat la theorie dans la vente grands comptes." },
    { id: 2, title: "Les metriques qui mentent", desc: "Ce que les KPIs cachent sur la vraie performance commerciale." },
    { id: 3, title: "Le client comme partenaire", desc: "Pourquoi closer est un echec si le client ne renouvelle pas." },
    { id: 4, title: "L'anti-script", desc: "Pourquoi les meilleurs commerciaux n'ont pas de pitch." },
  ],
  head_of_growth: [
    { id: 1, title: "Le growth hack est mort", desc: "Pourquoi les tactiques virales sans retention tuent plus de boites qu'elles n'en sauvent." },
    { id: 2, title: "Le CAC ment", desc: "Ce que le cout d'acquisition cache quand on oublie de mesurer la qualite du client acquis." },
    { id: 3, title: "L'experimentation sans these", desc: "Pourquoi lancer 50 tests sans hypothese forte est du bruit, pas de la methode." },
    { id: 4, title: "La retention est le vrai moteur", desc: "Pourquoi 1% de churn en moins bat 10% d'acquisition en plus." },
  ],
  strategic_csm: [
    { id: 1, title: "Le NPS est un placebo", desc: "Pourquoi un client satisfait part quand meme et ce que ca revele sur la mesure." },
    { id: 2, title: "L'upsell invisible", desc: "Pourquoi le meilleur commercial du compte est le CSM qui n'a pas le titre." },
    { id: 3, title: "Le silence tue le renouvellement", desc: "Pourquoi un client silencieux est un client en danger, pas un client satisfait." },
    { id: 4, title: "La politique interne du client", desc: "Pourquoi comprendre l'organigramme du client vaut plus que comprendre son produit." },
  ],
  senior_pm: [
    { id: 1, title: "La feature que personne ne veut tuer", desc: "Pourquoi le courage produit est de dire non a 99% des demandes." },
    { id: 2, title: "Le backlog est un mensonge collectif", desc: "Pourquoi prioriser sans arbitrage politique est une illusion." },
    { id: 3, title: "La velocite n'est pas la vitesse", desc: "Pourquoi livrer vite n'est pas livrer bien et ce que ca coute." },
    { id: 4, title: "Le PM n'est pas un chef de projet", desc: "Pourquoi la difference entre orchestrer et decider separe les PM juniors des seniors." },
  ],
  ai_architect: [
    { id: 1, title: "L'IA n'est pas une strategie", desc: "Pourquoi deployer un modele sans cas d'usage mesurable est du theatre technologique." },
    { id: 2, title: "Le modele parfait est un piege", desc: "Pourquoi 90% de precision suffit quand l'alternative est 0% d'adoption." },
    { id: 3, title: "La resistance humaine bat la dette technique", desc: "Pourquoi le vrai obstacle de l'IA en entreprise n'est pas technique." },
    { id: 4, title: "Le cout cache de l'infra", desc: "Pourquoi un GPU qui tourne a vide coute plus cher qu'un consultant qui ne fait rien." },
  ],
  engineering_manager: [
    { id: 1, title: "Les meilleurs devs partent en silence", desc: "Pourquoi la retention de talent est le KPI que personne ne mesure avant qu'il soit trop tard." },
    { id: 2, title: "Build vs Buy est une question de survie", desc: "Pourquoi construire en interne par fierte detruit plus de valeur que d'en creer." },
    { id: 3, title: "La dette technique est un choix politique", desc: "Pourquoi chaque bug non-fixe est une decision de management, pas un oubli technique." },
    { id: 4, title: "Le code ne ment pas, les roadmaps si", desc: "Pourquoi le cycle time revele plus sur l'equipe que n'importe quel standup." },
  ],
  management_consultant: [
    { id: 1, title: "Le slide deck est mort", desc: "Pourquoi un diagnostic de 3 pages bat un PowerPoint de 80 slides." },
    { id: 2, title: "Le client ne veut pas la verite", desc: "Pourquoi vendre une recommandation difficile est le vrai metier du conseil." },
    { id: 3, title: "L'impact se mesure apres le depart", desc: "Pourquoi un consultant qui laisse une trace bat celui qui facture plus d'heures." },
    { id: 4, title: "La crise revele le vrai conseil", desc: "Pourquoi le TJM se justifie dans les 48h ou tout brule, pas dans les 6 mois de routine." },
  ],
  strategy_associate: [
    { id: 1, title: "Le signal faible vaut plus que le rapport annuel", desc: "Pourquoi une ligne dans un 10-K bat 200 pages de synthese." },
    { id: 2, title: "Le Comex ne decide pas avec des chiffres", desc: "Pourquoi l'alignement politique pese plus que le modele financier." },
    { id: 3, title: "La synergie M&A est un mythe mesurable", desc: "Pourquoi 70% des fusions detruisent de la valeur et ce que ca revele sur l'analyse." },
    { id: 4, title: "L'IA commodifie l'analyse, pas le jugement", desc: "Pourquoi le strategiste qui pense bat celui qui synthetise." },
  ],
  operations_manager: [
    { id: 1, title: "Le process parfait n'existe pas", desc: "Pourquoi la friction inter-services est un signal, pas un probleme a eliminer." },
    { id: 2, title: "Simplifier est plus dur que construire", desc: "Pourquoi reduire la charge cognitive de 10 personnes vaut plus qu'optimiser 1 workflow." },
    { id: 3, title: "L'outil n'est pas le process", desc: "Pourquoi acheter un SaaS sans changer les habitudes est du gaspillage organise." },
    { id: 4, title: "L'Ops invisible est le meilleur Ops", desc: "Pourquoi le signe de reussite est que personne ne remarque que tu es la." },
  ],
  fractional_coo: [
    { id: 1, title: "Le CEO n'a pas besoin d'un bras droit", desc: "Pourquoi un COO fractionne vend de la clarte, pas de la presence." },
    { id: 2, title: "Le runway se gagne en decisions, pas en levees", desc: "Pourquoi 6 mois de survie gagnes par l'execution battent 6 mois gagnes par la dilution." },
    { id: 3, title: "L'alignement N-1 est le seul KPI du COO", desc: "Pourquoi faire courir tout le monde dans la meme direction est le levier le plus cher du marche." },
    { id: 4, title: "Le reporting est mort, le cadre est vivant", desc: "Pourquoi un dashboard que personne ne lit coute plus cher qu'une conversation de 15 minutes." },
  ],
};

function getAdaptivePillars(roleId) {
  return ROLE_PILLARS[roleId] || ROLE_PILLARS["enterprise_ae"];
}

/* ==============================
   DUEL QUESTIONS — includes decision/influence brick targets
   ============================== */

var DUEL_CRISES = [
  {
    id: 1,
    trigger: "Le recruteur regarde son telephone. Il revient vers toi.",
    scenario: "On vient de m'informer que votre ancien employeur annonce un plan de restructuration. 15% des effectifs. Votre equipe est impactee. Qu'est-ce que ca change a ce que vous venez de me dire ?",
    diagnostic: {
      externalize: ["c'etait previsible", "je le savais", "rien a voir avec moi", "la direction"],
      recadre: ["mon impact reste", "mes resultats", "la methode fonctionne", "independamment", "reproductible"],
    },
  },
  {
    id: 2,
    trigger: "Le recruteur s'arrete au milieu de sa prise de notes.",
    scenario: "J'ai un autre candidat en face cet apres-midi. Plus senior que vous, 12 ans d'experience. Dites-moi en une phrase pourquoi je devrais continuer cet entretien au lieu de le raccourcir.",
    diagnostic: {
      externalize: ["je suis mieux", "il ne peut pas", "plus motive", "plus jeune"],
      recadre: ["mes resultats parlent", "voici ce que je resous", "la question n'est pas l'experience", "le probleme que vous avez"],
    },
  },
  {
    id: 3,
    trigger: "Le recruteur pose son stylo et croise les bras.",
    scenario: "Soyons honnetes. Votre CV est bon mais pas exceptionnel. J'en vois dix comme ca par semaine. Qu'est-ce qui fait que je vais me souvenir de vous demain ?",
    diagnostic: {
      externalize: ["je suis unique", "je travaille dur", "je suis passionne", "j'aime"],
      recadre: ["trois cauchemars", "voici le probleme que je resous", "la preuve", "mesurable", "reproductible", "mon arbitrage"],
    },
  },
];

var DUEL_CONTRADICTIONS = [
  "Votre ancien manager m'a donne une version differente. Que repondez-vous ?",
  "J'ai parle a quelqu'un dans votre ancienne equipe. Il dit que c'etait un effort collectif, pas individuel. Votre reaction ?",
  "Un de vos ex-collegues m'a dit que le contexte etait favorable et que n'importe qui aurait obtenu ces resultats. Comment repondez-vous ?",
  "Les chiffres que vous annoncez ne correspondent pas a ce que j'ai vu dans le marche. Vous etes sur de vos donnees ?",
];

var DUEL_QUESTIONS = [
  {
    id: 1,
    question: "Votre portefeuille a grandi de 22%. Pourquoi avez-vous quitte Spendesk si les resultats etaient bons ?",
    intent: "Tester la coherence de la narrative. Cherche une faille dans la motivation.",
    brickRef: "Croissance +22% portefeuille",
    danger: "Si tu reponds 'je cherchais autre chose', tu parais instable. Si tu reponds 'on m'a pousse', tu parais fragile.",
    idealAngle: "Repondre par l'ambition de scope. 'J'ai atteint le plafond du segment Mid-Market chez [Entreprise SaaS]. Je cherche un terrain Enterprise pour appliquer la meme methode a une echelle superieure.'",
  },
  {
    id: 2,
    question: "Vous parlez de reduction du churn. Comment vous assurez-vous que ce n'etait pas juste un cycle favorable du marche ?",
    intent: "Tester la rigueur analytique. Le recruteur veut savoir si tu controles tes variables.",
    brickRef: "Reduction churn -18%",
    danger: "Si tu ne peux pas isoler ton impact du contexte, ta brique s'effondre.",
    idealAngle: "Montrer la methode. 'J'ai compare les cohortes avant/apres restructuration. Les clients passes par le nouveau parcours avaient un NRR de 108% vs 89% pour l'ancien.'",
  },
  {
    id: 3,
    question: "Vous avez arbitre entre refonte et migration. Le CTO voulait la refonte. Comment avez-vous gere le desaccord ?",
    intent: "Tester la capacite a gerer un conflit avec un superieur hierarchique. Le recruteur veut voir du courage, pas de la soumission.",
    brickRef: "Arbitrage refonte vs migration",
    danger: "Si tu dis 'j'ai convaincu le CTO', tu parais arrogant. Si tu dis 'on a trouve un compromis', tu parais mou.",
    idealAngle: "Montrer la methode d'arbitrage. 'J'ai pose les deux scenarios avec couts et risques. Le CTO a vu que la refonte exposait la prod pendant 4 mois. La decision s'est faite sur les faits, pas sur les opinions.'",
  },
  {
    id: 4,
    question: "Vous dites avoir aligne 4 directeurs. Concretement, lequel etait le plus difficile a convaincre et pourquoi ?",
    intent: "Tester la profondeur de la lecture politique. Le recruteur veut savoir si tu comprends les jeux de pouvoir.",
    brickRef: "Alignement 4 directeurs",
    danger: "Si tu restes generique ('c'etait un travail d'equipe'), le recruteur lit 'cette personne n'a pas vraiment mene le sujet'.",
    idealAngle: "Nommer le blocage. 'Le directeur produit avait investi 2 ans sur le projet. Abandonner revenait a reconnaitre un echec. J'ai reframe : pas un echec, un pivot strategique. Il a accepte quand j'ai montre le cout d'opportunite en termes de roadmap.'",
  },
];

/* ==============================
   MOCK DELIVERABLES
   ============================== */

/* ==============================
   LIVRABLE GENERATORS — replace all mocks with real generation from Coffre-Fort
   ============================== */

function generateCV(bricks, targetRoleId, trajectoryToggle) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Aucune brique validee. Le CV se construit a partir de tes preuves.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleTitle = roleData ? roleData.role.toUpperCase() : "PROFESSIONNEL";

  // Sort bricks: elastic first, then by category weight (decision > influence > cicatrice > chiffre)
  var catWeight = { decision: 4, influence: 3, cicatrice: 2, chiffre: 1 };
  var sorted = validated.slice().sort(function(a, b) {
    var ea = a.elasticity === "elastique" ? 10 : 0;
    var eb = b.elasticity === "elastique" ? 10 : 0;
    var ca = catWeight[a.brickCategory] || catWeight[a.brickType] || 0;
    var cb = catWeight[b.brickCategory] || catWeight[b.brickType] || 0;
    return (eb + cb) - (ea + ca);
  });

  // Header: title + top 3 elastic indicators compressed
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "elastique"; });
  var headerStats = elasticBricks.slice(0, 3).map(function(b) {
    // Extract numbers from brick text
    var nums = b.text.match(/[\+\-]?\d+[%KM€]?/g);
    return nums ? nums[0] + " " + (b.kpi || "").toLowerCase() : (b.kpi || "");
  }).join(". ");

  var cv = roleTitle + "\n";
  cv += headerStats ? headerStats + ".\n" : "";
  cv += "\n[Poste] \u2014 [Entreprise] ([Dates])\n\n";

  // Bricks as lines — no job description
  sorted.forEach(function(b) {
    cv += b.text + "\n\n";
  });

  cv += "Formation\n[Diplome] \u2014 [Ecole] ([Annee])";
  return cv;
}

function generateBio(bricks, vault, trajectoryToggle) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Bio generee apres validation de tes briques.]";

  // LINE 1 — Cauchemar du decideur
  var strongestCauchemar = null;
  CAUCHEMARS_CIBLES.forEach(function(c) {
    var covers = validated.filter(function(b) {
      return c.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
    });
    if (covers.length > 0 && (!strongestCauchemar || covers.length > strongestCauchemar.count)) {
      strongestCauchemar = { text: c.nightmareShort, count: covers.length };
    }
  });
  var line1 = strongestCauchemar ? strongestCauchemar.text : "Les resultats existent. Personne ne les formule.";

  // LINE 2 — Top 3 elastic bricks, numbers only
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "elastique"; });
  var proofBricks = elasticBricks.length >= 2 ? elasticBricks : validated;
  var line2parts = proofBricks.slice(0, 3).map(function(b) {
    var nums = b.text.match(/[\+\-]?\d+[%KM€]?[^\.\,]*/g);
    return nums ? nums[0].trim() : b.kpi || "";
  });
  var line2 = line2parts.join(". ") + ".";

  // LINE 3 — Pillar (take preferred)
  var line3 = "J'ecris ici sur ce que l'experience revele quand on creuse sous les metriques.";
  if (vault && vault.selectedPillars && vault.selectedPillars.length > 0) {
    var takePillar = vault.selectedPillars.find(function(p) { return p.source === "take"; });
    var pillar = takePillar || vault.selectedPillars[0];
    if (pillar && pillar.title) {
      line3 = "J'ecris ici sur " + pillar.title.toLowerCase().replace(/^pourquoi /, "pourquoi ").replace(/\.$/, "") + ".";
    }
  }

  return line1 + "\n\n" + line2 + "\n\n" + line3;
}

function generateScript(bricks, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Script genere apres validation de tes briques.]";

  var coverage = computeCauchemarCoverage(bricks);
  var covered = coverage.filter(function(c) { return c.covered; });

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role : "ce poste";

  // Find strongest cauchemar with cost
  var strongestCauchemar = null;
  var strongestBrick = null;
  covered.forEach(function(cc) {
    var cauch = CAUCHEMARS_CIBLES.find(function(c) { return c.id === cc.id; });
    if (!cauch) return;
    if (!strongestCauchemar || cauch.costRange[1] > strongestCauchemar.costRange[1]) {
      var coveringBrick = validated.find(function(b) {
        return cauch.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
      });
      if (coveringBrick) { strongestCauchemar = cauch; strongestBrick = coveringBrick; }
    }
  });

  var script = "Bonjour [Prenom],\n\n";

  // OPENER — curiosity, not certainty
  script += "Je ne sais pas si c'est pertinent pour votre contexte, mais votre offre " + roleLabel + " m'a fait reagir sur un point precis.\n\n";

  // ANCHOR — cost of inaction
  if (strongestCauchemar) {
    var quarterlyCostLow = Math.round(strongestCauchemar.costRange[0] / 4);
    var quarterlyCostHigh = Math.round(strongestCauchemar.costRange[1] / 4);
    script += strongestCauchemar.nightmareShort + " Ce type de situation coute entre " + formatCost(quarterlyCostLow) + " et " + formatCost(quarterlyCostHigh) + " par trimestre de poste vacant.\n\n";
    script += "J'ai vecu ce probleme. Je l'ai resolu. " + strongestBrick.text + "\n\n";
  } else {
    var topBricks = validated.slice(0, 2);
    topBricks.forEach(function(b) { script += b.text + "\n\n"; });
  }

  // CLOSE — pain question, not time request
  var discoveryQuestions = {
    enterprise_ae: "Qu'est-ce qui rend ce recrutement difficile aujourd'hui ?",
    head_of_growth: "Quel canal d'acquisition vous preoccupe le plus en ce moment ?",
    strategic_csm: "Quel est le compte qui vous empeche de dormir ?",
    senior_pm: "Quel arbitrage produit personne ne veut trancher en ce moment ?",
    ai_architect: "Quel cas d'usage IA est bloque depuis plus de 3 mois ?",
    engineering_manager: "Quel est le frein technique que l'equipe n'arrive pas a debloquer ?",
    management_consultant: "Quel probleme a declenche ce recrutement ?",
    strategy_associate: "Quelle decision strategique attend des donnees que personne ne produit ?",
    operations_manager: "Quelle friction inter-equipes consomme le plus de temps ?",
    fractional_coo: "Qu'est-ce que le CEO ne devrait plus faire lui-meme dans 6 mois ?",
  };
  var closeQuestion = discoveryQuestions[targetRoleId] || "Qu'est-ce qui rend ce recrutement difficile aujourd'hui ?";
  script += closeQuestion + "\n\n[Prenom]";

  return script;
}

/* Item 6 — Transition script for outsiders detected via cross-role matching */
function generateTransitionScript(bricks, sourceRoleId, targetAlt) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0 || !targetAlt) return null;

  // Find strongest elastic brick that matches the alternative role
  var bestBrick = null;
  validated.forEach(function(b) {
    if (b.elasticity === "elastique" && !bestBrick) bestBrick = b;
  });
  if (!bestBrick) bestBrick = validated[0];

  var altRoleData = KPI_REFERENCE[targetAlt.roleId] ? KPI_REFERENCE[targetAlt.roleId] : null;
  var altRoleLabel = altRoleData ? altRoleData.role : "ce poste";
  var sourceRoleData = sourceRoleId && KPI_REFERENCE[sourceRoleId] ? KPI_REFERENCE[sourceRoleId] : null;
  var sourceRoleLabel = sourceRoleData ? sourceRoleData.role : "mon poste actuel";

  var script = "Bonjour [Prenom],\n\n";
  script += "Mon titre actuel ne matche pas votre offre " + altRoleLabel + ". Je viens de " + sourceRoleLabel + ".\n\n";
  script += "Mais votre besoin m'a interpelle. " + bestBrick.text + "\n\n";
  script += "Ce resultat s'est produit dans un autre contexte. Je suis convaincu qu'il se transpose chez vous.\n\n";
  script += "Je propose 30 minutes pour vous montrer comment. Si ca ne colle pas, vous n'avez rien perdu.\n\n";
  script += "[Prenom]";
  return script;
}

function generateImpactReport(bricks, vault, targetRoleId, trajectoryToggle, density) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var takes = bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; });
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;

  var chiffreBricks = validated.filter(function(b) { return b.brickCategory === "chiffre"; });
  var decisionBricks = validated.filter(function(b) { return b.brickCategory === "decision"; });
  var influenceBricks = validated.filter(function(b) { return b.brickCategory === "influence"; });
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "elastique"; });

  var coverage = computeCauchemarCoverage(bricks);
  var coveredCount = coverage.filter(function(c) { return c.covered; }).length;

  var report = "RAPPORT D'IMPACT -- Sprint #1\n\n";
  report += "Profil : " + (roleData ? roleData.role : "Non defini") + "\n";
  report += "Mode : " + (trajectoryToggle === "j_y_suis" ? "J'y suis" : trajectoryToggle === "j_y_vais" ? "J'y vais" : "Non defini") + "\n";
  report += "Densite atteinte : " + (density ? density.score : 0) + "%\n\n";

  report += "BRIQUES FORGEES : " + validated.length + "\n";
  if (chiffreBricks.length > 0) report += "- " + chiffreBricks.length + " brique" + (chiffreBricks.length > 1 ? "s" : "") + " chiffre\n";
  if (decisionBricks.length > 0) report += "- " + decisionBricks.length + " brique" + (decisionBricks.length > 1 ? "s" : "") + " decision\n";
  if (influenceBricks.length > 0) report += "- " + influenceBricks.length + " brique" + (influenceBricks.length > 1 ? "s" : "") + " influence\n";
  if (cicatrices.length > 0) report += "- " + cicatrices.length + " cicatrice" + (cicatrices.length > 1 ? "s" : "") + "\n";

  report += "\nCAUCHEMARS COUVERTS : " + coveredCount + "/" + CAUCHEMARS_CIBLES.length + "\n";
  coverage.forEach(function(c) {
    var cauch = CAUCHEMARS_CIBLES.find(function(cc) { return cc.id === c.id; });
    report += "- " + c.label + " -- " + (c.covered ? "couvert" : "NON COUVERT") + "\n";
    if (c.covered && cauch) {
      report += "  Cout direct : " + formatCost(cauch.costRange[0]) + "-" + formatCost(cauch.costRange[1]) + "/an\n";
      if (cauch.costSymbolique) report += "  Cout symbolique : " + cauch.costSymbolique + "\n";
      if (cauch.costSystemique) report += "  Cout systemique : " + cauch.costSystemique + "\n";
    }
  });

  report += "\nKPIS ELASTIQUES DOCUMENTES : " + elasticBricks.length + "\n";
  elasticBricks.forEach(function(b) {
    report += "- " + (b.kpi || "Non classe") + " (elastique)\n";
  });

  var unfairBrick = bricks.find(function(b) { return b.type === "unfair_advantage" && b.status === "validated"; });
  if (unfairBrick) {
    report += "\nAVANTAGE INJUSTE IDENTIFIE\n";
    report += "- " + unfairBrick.text + "\n";
    var matchingElastic = elasticBricks.find(function(eb) {
      return eb.text && unfairBrick.text && eb.kpi === unfairBrick.kpi;
    });
    if (matchingElastic) {
      report += "  Confirme par brique chiffre + signal collegues. Non-rattrapable par la formation.\n";
    }
  }

  var zones = computeZones(bricks, targetRoleId);
  if (zones) {
    if (zones.excellence.length > 0) {
      report += "\nZONE D'EXCELLENCE\n";
      zones.excellence.forEach(function(z) {
        report += "- " + z.kpi + " -- " + z.brickCount + " preuve" + (z.brickCount > 1 ? "s" : "") + " (" + z.types.join(", ") + ")\n";
      });
    }
    if (zones.rupture.length > 0) {
      report += "\nZONE DE RUPTURE\n";
      zones.rupture.forEach(function(z) {
        report += "- " + z.kpi + " -- " + z.reason + "\n";
      });
    }

    if (zones.profileGrid.length > 0) {
      report += "\nPROFIL DE VALEUR\n";
      zones.profileGrid.forEach(function(p) {
        report += (p.checked ? "[x] " : "[ ] ") + p.label + (p.checked ? " -- " + p.proof : "") + "\n";
      });
    }
  }

  report += "\nPRISES DE POSITION : " + takes.length + "\n";
  if (takes.length === 0) report += "- Aucune take formulee. Le prochain Rendez-vous reposera la question.\n";
  takes.forEach(function(t) { report += "- " + (t.text.length > 60 ? t.text.slice(0, 60) + "..." : t.text) + "\n"; });

  report += "\nPROCHAIN RENDEZ-VOUS : " + (roleData ? roleData.cadenceLabel : "dans 30 jours") + "\n";
  report += "Ce rapport s'epaissit a chaque Rendez-vous de Souverainete. Les briques s'accumulent. Le levier grandit.";
  return report;
}

/* ==============================
   ZONE D'EXCELLENCE / RUPTURE — Item 8
   ============================== */

function computeZones(bricks, roleId) {
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;
  if (!roleData) return null;
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take" && b.brickType !== "unfair_advantage"; });
  if (validated.length < 2) return null;

  var kpis = roleData.kpis;
  var excellence = [];
  var rupture = [];

  kpis.forEach(function(kpi) {
    var matchingBricks = validated.filter(function(b) {
      return b.kpi && b.kpi.toLowerCase().indexOf(kpi.name.toLowerCase().slice(0, 6)) !== -1;
    });
    if (matchingBricks.length >= 2) {
      var types = [];
      matchingBricks.forEach(function(b) {
        var t = b.brickCategory || b.brickType || "chiffre";
        if (types.indexOf(t) === -1) types.push(t);
      });
      var hasDepth = types.length >= 2 || matchingBricks.some(function(b) { return b.brickCategory === "decision" || b.brickType === "cicatrice"; });
      if (hasDepth) {
        excellence.push({ kpi: kpi.name, brickCount: matchingBricks.length, types: types, elasticity: kpi.elasticity });
      }
    } else if (matchingBricks.length === 0) {
      rupture.push({ kpi: kpi.name, reason: "Aucune preuve documentee", elasticity: kpi.elasticity });
    } else if (matchingBricks.length === 1 && !matchingBricks[0].brickCategory !== "decision") {
      rupture.push({ kpi: kpi.name, reason: "1 preuve fragile (sans arbitrage ni cicatrice)", elasticity: kpi.elasticity });
    }
  });

  // 9-PROFILE GRID
  var profileGrid = [
    { id: "hunter", label: "Chasseur", check: function() { return bricks.some(function(b) { return b.status === "validated" && b.kpi && (b.kpi.toLowerCase().indexOf("pipeline") !== -1 || b.kpi.toLowerCase().indexOf("prospection") !== -1); }); }, proofFn: function() { return "Brique pipeline/prospection validee"; } },
    { id: "zero_to_one", label: "Createur 0-to-1", check: function() { return validated.some(function(b) { return b.text && (b.text.toLowerCase().indexOf("from scratch") !== -1 || b.text.toLowerCase().indexOf("de zero") !== -1 || b.text.toLowerCase().indexOf("cree") !== -1 || b.text.toLowerCase().indexOf("lance") !== -1 || b.text.toLowerCase().indexOf("construit") !== -1); }); }, proofFn: function() { return "Contexte de creation identifie dans une brique"; } },
    { id: "regular", label: "Regulier", check: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre"; }).length >= 3; }, proofFn: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre"; }).length + " briques chiffre (indice de regularite)"; } },
    { id: "track_record", label: "Track record blinde", check: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre" && hasNumbers(b.text); }).length >= 2; }, proofFn: function() { return "2+ briques chiffrees avec donnees quantifiees"; } },
    { id: "builder", label: "Constructeur", check: function() { return validated.some(function(b) { return b.brickCategory === "influence"; }) && validated.some(function(b) { return b.brickCategory === "decision"; }); }, proofFn: function() { return "Briques influence + decision (structure, pas juste execute)"; } },
    { id: "specialist", label: "Specialiste vertical", check: function() {
      var kpiNames = validated.map(function(b) { return b.kpi; }).filter(function(k) { return k; });
      var unique = []; kpiNames.forEach(function(k) { if (unique.indexOf(k) === -1) unique.push(k); });
      return unique.length <= 3 && validated.length >= 3;
    }, proofFn: function() { return "Toutes les preuves concentrees sur le meme segment"; } },
    { id: "cicatrice", label: "Maturite (cicatrices)", check: function() { return bricks.filter(function(b) { return b.brickType === "cicatrice" && b.status === "validated"; }).length >= 1; }, proofFn: function() { return bricks.filter(function(b) { return b.brickType === "cicatrice" && b.status === "validated"; }).length + " echec(s) assume(s)"; } },
    { id: "terrain", label: "Terrain (non-remote)", check: function() { return validated.some(function(b) { return b.text && (b.text.toLowerCase().indexOf("terrain") !== -1 || b.text.toLowerCase().indexOf("salon") !== -1 || b.text.toLowerCase().indexOf("face") !== -1 || b.text.toLowerCase().indexOf("deplacement") !== -1); }); }, proofFn: function() { return "Mentions de terrain dans les briques"; } },
    { id: "takes", label: "Voix (prises de position)", check: function() { return bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; }).length >= 1; }, proofFn: function() { return bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; }).length + " take(s) formulee(s)"; } },
  ];

  var grid = profileGrid.map(function(p) {
    var checked = p.check();
    return { label: p.label, checked: checked, proof: checked ? p.proofFn() : "" };
  });

  return { excellence: excellence, rupture: rupture, profileGrid: grid };
}

/* ==============================
   POST LINKEDIN GENERATOR — cauchemar + these + situation + question
   ============================== */

function generateLinkedInPosts(bricks, vault, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length < 2) return [];

  var pillars = vault && vault.selectedPillars ? vault.selectedPillars : [];
  if (pillars.length === 0) return [];

  var usedBrickIds = [];
  var posts = [];

  // Sort pillars: takes first
  var sortedPillars = pillars.slice().sort(function(a, b) {
    return (a.source === "take" ? 0 : 1) - (b.source === "take" ? 0 : 1);
  });

  sortedPillars.slice(0, 2).forEach(function(pillar) {
    // Find best brick for this pillar (not already used)
    var available = validated.filter(function(b) { return usedBrickIds.indexOf(b.id) === -1; });
    if (available.length === 0) available = validated;

    // Prefer decision > influence > cicatrice > chiffre
    var catPriority = { decision: 4, influence: 3, cicatrice: 2, chiffre: 1 };
    available.sort(function(a, b) {
      var ca = catPriority[a.brickCategory] || catPriority[a.brickType] || 0;
      var cb = catPriority[b.brickCategory] || catPriority[b.brickType] || 0;
      return cb - ca;
    });

    var brick = available[0];
    usedBrickIds.push(brick.id);

    // LINE 1 — Cauchemar
    var cauchemar = "";
    CAUCHEMARS_CIBLES.forEach(function(c) {
      if (cauchemar) return;
      if (c.kpis.some(function(kpi) { return brick.kpi && brick.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; })) {
        cauchemar = c.nightmareShort;
      }
    });
    if (!cauchemar) cauchemar = "Le probleme existe. Personne ne le formule.";

    // LINES 2-5 — These from pillar
    var these = "";
    if (pillar.source === "take" && pillar.desc) {
      these = pillar.desc;
    } else {
      these = pillar.title + ". " + (pillar.desc || "C'est une realite que l'experience revele, pas les articles de blog.");
    }
    if (these.length > 250) these = these.slice(0, 250) + "...";

    // LINES 6-8 — Situation (brick without numbers)
    var situation = brick.text;
    situation = situation.replace(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]*/g, "").replace(/\d+[\.,]?\d*\s*(mois|semaines|jours|ans|comptes|commerciaux|personnes|equipes|EUR|euros|millions?)/gi, "$1").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trim();
    if (situation.length > 200) situation = situation.slice(0, 200) + "...";

    // Framing by brick type
    if (brick.brickType === "cicatrice") {
      situation = "J'ai appris ca a mes depens. " + situation;
    } else if (brick.brickCategory === "decision") {
      situation = "J'ai du trancher dans ce contexte. " + situation;
    } else if (brick.brickCategory === "influence") {
      situation = "Le plus dur n'etait pas la methode. " + situation;
    }

    // LINE 9 — Question ouverte
    var question = "Et vous, quel est le consensus de votre secteur que votre experience contredit ?";
    if (pillar.title && pillar.title.length < 60) {
      question = "Quelle est votre experience sur " + pillar.title.toLowerCase().replace(/\.$/, "") + " ?";
    }

    var post = cauchemar + "\n\n" + these + "\n\n" + situation + "\n\n" + question;

    posts.push({
      pillar: pillar.title,
      pillarSource: pillar.source,
      brickUsed: brick.text.length > 60 ? brick.text.slice(0, 60) + "..." : brick.text,
      brickType: brick.brickType === "cicatrice" ? "cicatrice" : brick.brickCategory,
      text: post,
      charCount: post.length,
    });
  });

  return posts;
}

/* ==============================
   POSITION GENERATOR — long-form from pillars + bricks
   ============================== */

function generatePositions(bricks, vault) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var pillars = vault && vault.selectedPillars ? vault.selectedPillars : [];
  if (pillars.length === 0 || validated.length === 0) return [];

  // Sort: takes first
  var sorted = pillars.slice().sort(function(a, b) {
    return (a.source === "take" ? 0 : 1) - (b.source === "take" ? 0 : 1);
  });

  var usedBrickIds = [];
  var positions = [];

  sorted.slice(0, 2).forEach(function(pillar) {
    // Find best brick match
    var available = validated.filter(function(b) { return usedBrickIds.indexOf(b.id) === -1; });
    if (available.length === 0) available = validated;

    var catPriority = { decision: 4, influence: 3, cicatrice: 2, chiffre: 1 };
    available.sort(function(a, b) {
      var ca = catPriority[a.brickCategory] || catPriority[a.brickType] || 0;
      var cb = catPriority[b.brickCategory] || catPriority[b.brickType] || 0;
      return cb - ca;
    });
    var brick = available[0];
    usedBrickIds.push(brick.id);

    // Build the argument
    var title = pillar.title || "Position sans titre";
    var text = "";

    // Opening: the consensus (what everyone thinks)
    if (pillar.source === "take" && pillar.desc) {
      text = pillar.desc;
    } else {
      text = pillar.desc || title + ". C'est une realite que l'experience revele.";
    }

    // Bridge to proof
    text += "\n\n";
    if (brick.brickType === "cicatrice") {
      text += "J'ai appris ca a mes depens. " + brick.text + " L'echec m'a oblige a changer de methode. Depuis, je mesure autrement.";
    } else if (brick.brickCategory === "decision") {
      text += "J'ai du trancher dans ce contexte. " + brick.text + " L'arbitrage n'etait pas evident. Mais c'est la que se construit la credibilite.";
    } else if (brick.brickCategory === "influence") {
      text += "Le plus dur n'etait pas la methode. C'etait l'alignement. " + brick.text + " Quand tout le monde tire dans la meme direction, le resultat suit.";
    } else {
      text += "Les chiffres parlent. " + brick.text + " Ce n'est pas une opinion. C'est un fait mesure.";
    }

    // Closing
    text += "\n\nLe vrai KPI n'est pas celui qu'on affiche. C'est celui qu'on decouvre quand on creuse sous la surface.";

    positions.push({ title: title, text: text, pillarSource: pillar.source });
  });

  return positions;
}

/* ==============================
   UTILITY FUNCTIONS
   ============================== */

/* ITERATION 7 — Diagnostic Questions (generated post-Duel from strongest bricks + cauchemars) */
function generateDiagnosticQuestions(bricks, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  if (validated.length < 2) return [];

  var questions = [];

  // Find strongest decision brick
  var decisionBricks = validated.filter(function(b) { return b.brickCategory === "decision"; });
  if (decisionBricks.length > 0) {
    var db = decisionBricks[0];
    questions.push({
      type: "arbitrage",
      color: "#9b59b6",
      level1: "Comment les arbitrages strategiques sont-ils pris ici ? Qui tranche quand les equipes ne s'alignent pas ?",
      level2: "J'ai du arbitrer entre " + (db.text.length > 50 ? db.text.slice(0, 50) + "..." : db.text) + ". Ici, quelle est la decision difficile que personne ne veut prendre pour atteindre les objectifs du prochain trimestre ?",
      logic: "Basee sur ta brique decision la plus forte. Tu as la credibilite de poser cette question parce que tu as deja traverse un arbitrage similaire.",
      brickRef: db.text.length > 60 ? db.text.slice(0, 60) + "..." : db.text,
    });
  }

  // Find strongest influence brick
  var influenceBricks = validated.filter(function(b) { return b.brickCategory === "influence"; });
  if (influenceBricks.length > 0) {
    var ib = influenceBricks[0];
    questions.push({
      type: "friction",
      color: "#3498db",
      level1: "Comment l'alignement entre les equipes fonctionne-t-il au quotidien ? Quels sont les points de friction les plus frequents ?",
      level2: "J'ai aligne des equipes qui ne reportaient pas a moi sur des sujets similaires. Ici, comment gerez-vous le conflit d'interet entre la vision produit et la realite commerciale ?",
      logic: "Basee sur ta brique influence. Tu montres que tu penses en dynamique politique, pas en organigramme.",
      brickRef: ib.text.length > 60 ? ib.text.slice(0, 60) + "..." : ib.text,
    });
  }

  // Cauchemar-based question (always)
  if (CAUCHEMARS_CIBLES.length > 0) {
    var cauchemar = CAUCHEMARS_CIBLES[0];
    var elasticBricks = validated.filter(function(b) { return b.elasticity === "elastique"; });
    questions.push({
      type: "efficience",
      color: "#e94560",
      level1: "L'offre mentionne " + cauchemar.label.toLowerCase() + ". Qu'est-ce qui a ete tente avant pour resoudre ce probleme ?",
      level2: "Ce type de probleme coute entre " + formatCost(cauchemar.costRange[0]) + " et " + formatCost(cauchemar.costRange[1]) + " par an dans la plupart des structures que je connais. Si rien ne change dans les 6 prochains mois, quel est l'impact sur vos objectifs ?",
      logic: "Basee sur le cauchemar principal de l'offre. Tu montres que tu penses en cout du probleme, pas en cout salarial.",
      brickRef: cauchemar.label,
    });
  }

  // Cicatrice-based question (if exists)
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  if (cicatrices.length > 0) {
    questions.push({
      type: "saillance",
      color: "#ff9800",
      level1: "Quel a ete le dernier echec marquant de l'equipe et qu'est-ce qui a change apres ?",
      level2: "J'ai moi-meme perdu un deal majeur en sous-estimant la politique interne. Ca m'a force a changer de methode. Ici, comment la culture de l'equipe traite-t-elle les echecs ? Est-ce qu'on en parle ou est-ce qu'on les enterre ?",
      logic: "Basee sur ta cicatrice. Tu as la credibilite de parler d'echec parce que tu as assume le tien. Le recruteur mesure ta maturite et la culture de l'entreprise en meme temps.",
      brickRef: cicatrices[0].text.length > 60 ? cicatrices[0].text.slice(0, 60) + "..." : cicatrices[0].text,
    });
  }

  return questions.slice(0, 4);
}

/* ITERATION 4 — Signal-to-Script generator */
var SIGNAL_TYPES = [
  { keywords: ["leve", "levee", "serie", "fonds", "millions", "financement", "fundraise"], type: "levee_fonds", label: "Levee de fonds" },
  { keywords: ["recrute", "recrutement", "embauche", "poste ouvert", "CDI", "cherche"], type: "recrutement", label: "Recrutement" },
  { keywords: ["part", "quitte", "depart", "nomme", "nomination", "remplace", "arrive"], type: "mouvement", label: "Mouvement de direction" },
  { keywords: ["ouvre", "expansion", "bureau", "lancement", "nouveau marche", "nouvelle offre"], type: "expansion", label: "Expansion" },
  { keywords: ["restructur", "licencie", "plan social", "reorganis", "ferme", "reduc"], type: "reorganisation", label: "Reorganisation" },
];

function detectSignalType(text) {
  var lower = text.toLowerCase();
  for (var i = 0; i < SIGNAL_TYPES.length; i++) {
    var match = SIGNAL_TYPES[i].keywords.some(function(k) { return lower.indexOf(k) !== -1; });
    if (match) return SIGNAL_TYPES[i];
  }
  return { type: "autre", label: "Signal detecte" };
}

function generateSignalScript(signalText, signalType, bricks, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "elastique"; });
  var bestBrick = elasticBricks.length > 0 ? elasticBricks[0] : (validated.length > 0 ? validated[0] : null);
  var cauchemar = CAUCHEMARS_CIBLES.length > 0 ? CAUCHEMARS_CIBLES[0] : null;

  var opener = "";
  if (signalType.type === "levee_fonds") opener = "Vous venez de lever des fonds. Dans les 6 prochains mois, vous allez structurer une equipe qui n'existe pas encore.";
  else if (signalType.type === "recrutement") opener = "J'ai vu que vous recrutez. Ce type de poste signale un probleme que je connais bien.";
  else if (signalType.type === "mouvement") opener = "J'ai note un changement dans votre equipe de direction. Les 90 premiers jours vont definir la trajectoire.";
  else if (signalType.type === "expansion") opener = "Vous ouvrez un nouveau terrain. Les erreurs des 6 premiers mois coutent cher.";
  else if (signalType.type === "reorganisation") opener = "Une reorganisation cree toujours un besoin que l'organigramme ne montre pas encore.";
  else opener = "J'ai identifie un signal dans votre actualite recente.";

  var proof = bestBrick ? "J'ai resolu un probleme similaire : " + (bestBrick.text.length > 80 ? bestBrick.text.slice(0, 80) + "..." : bestBrick.text) : "";
  var cost = cauchemar ? "Ce type de probleme coute entre " + formatCost(cauchemar.costRange[0]) + " et " + formatCost(cauchemar.costRange[1]) + " par an." : "";
  var close = "3 minutes cette semaine pour en parler ?";

  return opener + "\n\n" + proof + (cost ? "\n\n" + cost : "") + "\n\n" + close;
}

/* ==============================
   LINKEDIN COMMENT GENERATOR — crosses post content with Coffre-Fort
   ============================== */

var COMMENT_TOPICS = [
  { keywords: ["vente", "commercial", "closing", "pipeline", "prospection", "deal", "quota", "revenue"], topic: "vente" },
  { keywords: ["produit", "product", "feature", "roadmap", "backlog", "user", "adoption", "ux"], topic: "produit" },
  { keywords: ["management", "equipe", "leader", "manager", "culture", "recrutement", "talent", "rh"], topic: "management" },
  { keywords: ["ia", "ai", "intelligence artificielle", "chatgpt", "llm", "automatisation", "prompt"], topic: "ia" },
  { keywords: ["process", "operations", "efficacite", "productivite", "workflow", "outil", "crm", "saas"], topic: "operations" },
  { keywords: ["strategie", "croissance", "scale", "levee", "fundraise", "startup", "serie"], topic: "strategie" },
  { keywords: ["data", "kpi", "metrique", "mesure", "analytics", "dashboard", "reporting"], topic: "data" },
  { keywords: ["client", "customer", "satisfaction", "churn", "retention", "onboarding", "nps"], topic: "client" },
];

function detectPostTopic(text) {
  var lower = text.toLowerCase();
  var bestTopic = null;
  var bestCount = 0;
  COMMENT_TOPICS.forEach(function(t) {
    var count = 0;
    t.keywords.forEach(function(k) { if (lower.indexOf(k) !== -1) count++; });
    if (count > bestCount) { bestCount = count; bestTopic = t; }
  });
  return bestTopic || { topic: "general" };
}

function generateLinkedInComment(postText, bricks, vault) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return { comment: "Coffre-Fort vide. Valide des briques d'abord.", topic: "general" };

  var topic = detectPostTopic(postText);
  var postLower = postText.toLowerCase();

  // Find the brick most relevant to this post — for situation context
  var bestBrick = null;
  var bestRelevance = 0;
  validated.forEach(function(b) {
    var bLower = (b.text + " " + (b.kpi || "")).toLowerCase();
    var relevance = 0;
    if (topic.topic !== "general") {
      var topicEntry = COMMENT_TOPICS.find(function(t) { return t.topic === topic.topic; });
      if (topicEntry) {
        topicEntry.keywords.forEach(function(k) { if (bLower.indexOf(k) !== -1) relevance += 2; });
      }
    }
    var postWords = postLower.split(/\s+/).filter(function(w) { return w.length > 4; });
    postWords.forEach(function(w) { if (bLower.indexOf(w) !== -1) relevance++; });
    if (b.brickCategory === "decision" || b.brickCategory === "influence") relevance += 2;
    if (b.brickType === "cicatrice") relevance += 3;
    if (relevance > bestRelevance) { bestRelevance = relevance; bestBrick = b; }
  });

  if (!bestBrick) bestBrick = validated[0];

  // Extract SITUATION from brick (strip numbers, keep context)
  var situation = bestBrick.text;
  // Remove numbers, percentages, and amounts to keep only the situation
  situation = situation.replace(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]*/g, "").replace(/\d+[\.,]?\d*\s*(mois|semaines|jours|ans|comptes|commerciaux|personnes|equipes)/g, "$1").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trim();
  if (situation.length > 120) situation = situation.slice(0, 120) + "...";

  // Find relevant pillar from vault
  var pillarAngle = null;
  if (vault && vault.selectedPillars && vault.selectedPillars.length > 0) {
    // Prefer take-sourced pillars
    var takePillar = vault.selectedPillars.find(function(p) { return p.source === "take"; });
    pillarAngle = takePillar || vault.selectedPillars[0];
  }

  // BUILD COMMENT — 4 steps: acknowledge, pillar angle, situation, opening
  var acknowledge = "Point cle.";
  var angle = "";
  var situationText = "";
  var opening = "";

  // ANGLE — from pillar if available, otherwise from brick category
  if (pillarAngle) {
    angle = "Mon experience montre le contraire de ce que beaucoup pensent. " + pillarAngle.title + ".";
  } else if (bestBrick.brickType === "cicatrice") {
    angle = "J'ai appris ca a mes depens.";
  } else if (bestBrick.brickCategory === "decision") {
    angle = "La theorie dit une chose. La realite en dit une autre.";
  } else if (bestBrick.brickCategory === "influence") {
    angle = "Le vrai sujet n'est pas le process. C'est l'alignement.";
  } else {
    angle = "Ca merite d'etre nuance.";
  }

  // SITUATION — context without numbers
  if (bestBrick.brickType === "cicatrice") {
    situationText = "J'ai vecu l'inverse. " + situation + " L'echec m'a force a changer de methode.";
  } else if (bestBrick.brickCategory === "decision") {
    situationText = "J'ai du trancher dans un contexte similaire. " + situation + " L'arbitrage etait loin d'etre evident.";
  } else if (bestBrick.brickCategory === "influence") {
    situationText = "Le plus dur n'etait pas la methode. C'etait d'aligner les gens. " + situation;
  } else {
    situationText = "J'ai restructure un processus dans le meme contexte. " + situation;
  }

  opening = "Curieux de savoir comment ca se passe chez vous.";

  var comment = acknowledge + " " + angle + " " + situationText + " " + opening;

  return {
    comment: comment,
    topic: topic.topic,
    brickUsed: bestBrick.text.length > 60 ? bestBrick.text.slice(0, 60) + "..." : bestBrick.text,
    pillarUsed: pillarAngle ? pillarAngle.title : null,
    brickSource: bestBrick.brickType === "cicatrice" ? "cicatrice" : bestBrick.brickCategory,
  };
}

/* ITERATION 6 — Readiness diagnostic */
function estimateReadiness(cvText, offersText) {
  var cvLower = (cvText || "").toLowerCase();
  var score = 0;
  var details = [];

  // Check for number presence (quantifiable experience)
  var hasNumbers = /\d+%|\d+k|\d+m|\d+ comptes|\d+ commerciaux|\d+ mois|\d+ clients|\d+ personnes/.test(cvLower);
  if (hasNumbers) { score += 2; details.push({ label: "Chiffres detectes", ok: true }); }
  else { details.push({ label: "Aucun chiffre detecte", ok: false }); }

  // Check for method markers
  var methodMarkers = ["mis en place", "deploye", "structure", "construit", "lance", "cree", "restructure", "implemente", "optimise", "pilote"];
  var hasMethods = methodMarkers.some(function(m) { return cvLower.indexOf(m) !== -1; });
  if (hasMethods) { score += 2; details.push({ label: "Methodes detectees", ok: true }); }
  else { details.push({ label: "Pas de methode identifiee", ok: false }); }

  // Check for leadership/decision markers
  var leadershipMarkers = ["equipe", "manage", "dirige", "recrute", "forme", "aligne", "convaincu", "arbitre", "decide"];
  var hasLeadership = leadershipMarkers.some(function(m) { return cvLower.indexOf(m) !== -1; });
  if (hasLeadership) { score += 2; details.push({ label: "Signaux de leadership", ok: true }); }
  else { details.push({ label: "Pas de leadership identifie", ok: false }); }

  // Check CV length (depth of material)
  var cvLen = cvText.trim().length;
  if (cvLen > 500) { score += 1; details.push({ label: "Profil detaille (" + cvLen + " car.)", ok: true }); }
  else if (cvLen > 100) { details.push({ label: "Profil court — moins de matiere", ok: false }); }
  else { details.push({ label: "Profil tres court — extraction difficile", ok: false }); }

  // Check for tool/framework names
  var toolMarkers = ["salesforce", "hubspot", "meddic", "crm", "erp", "notion", "jira", "scrum", "agile", "okr", "kpi"];
  var hasTools = toolMarkers.some(function(m) { return cvLower.indexOf(m) !== -1; });
  if (hasTools) { score += 1; details.push({ label: "Outils/methodes nommes", ok: true }); }

  // Estimate brick count
  var estimatedBricks = Math.min(9, Math.max(2, score + 1));
  var estimatedCicatrices = hasLeadership ? 1 : 0;

  return {
    score: score,
    estimatedBricks: estimatedBricks,
    estimatedCicatrices: estimatedCicatrices,
    details: details,
    readiness: score >= 5 ? "fort" : score >= 3 ? "moyen" : "faible",
  };
}

function hasNumbers(text) {
  return /\d/.test(text);
}

// Compute cauchemar coverage from validated bricks
function computeCauchemarCoverage(bricks) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var coveredKpis = {};
  var kpiBricks = {};
  validated.forEach(function(b) {
    if (b.kpi) {
      coveredKpis[b.kpi] = true;
      if (!kpiBricks[b.kpi]) kpiBricks[b.kpi] = [];
      kpiBricks[b.kpi].push(b);
    }
  });
  return CAUCHEMARS_CIBLES.map(function(c) {
    var covered = c.kpis.some(function(k) { return coveredKpis[k]; });
    var coveringBricks = [];
    c.kpis.forEach(function(k) { if (kpiBricks[k]) coveringBricks = coveringBricks.concat(kpiBricks[k]); });
    var hasElasticCovering = coveringBricks.some(function(b) { return b.kpiRefMatch && b.kpiRefMatch.elasticity === "elastique"; });
    return { id: c.id, label: c.label, nightmareShort: c.nightmareShort, covered: covered, costRange: c.costRange, costUnit: c.costUnit, costContext: c.costContext, coveringBricks: coveringBricks, hasElasticCovering: hasElasticCovering };
  });
}

function hasExternalization(text) {
  var markers = ["le marche", "mon manager", "la direction", "on m'a", "le produit", "le prix etait", "pas ma faute", "l'equipe n'a pas", "le client n'a pas"];
  var lower = text.toLowerCase();
  var count = 0;
  markers.forEach(function(m) { if (lower.indexOf(m) !== -1) count++; });
  var hasOwnership = lower.indexOf("j'ai") !== -1 || lower.indexOf("j'aurais") !== -1 || lower.indexOf("mon erreur") !== -1 || lower.indexOf("ma responsabilite") !== -1;
  return count >= 2 && !hasOwnership;
}

function hasBlame(text) {
  var markers = ["le produit", "le prix", "le marche", "le budget", "le timing", "la concurrence", "pas de budget"];
  var lower = text.toLowerCase();
  var count = 0;
  markers.forEach(function(m) { if (lower.indexOf(m) !== -1) count++; });
  return count >= 1 && lower.indexOf("j'") === -1 && lower.indexOf("mon") === -1;
}

// Detect decision/influence language markers
function hasDecisionMarkers(text) {
  var actors = ["le board", "le cto", "le ceo", "la direction", "le directeur", "l'equipe", "le manager", "le vp", "le pm", "le product"];
  var tensions = ["voulait", "poussait", "bloquait", "refusait", "opposait", "contestait", "demandait", "exigeait", "insistait"];
  var resolutions = ["j'ai choisi", "j'ai decide", "j'ai propose", "j'ai arbitre", "j'ai tranche", "on a decide", "j'ai recommande"];
  var lower = text.toLowerCase();
  var actorCount = 0; var tensionCount = 0; var resolutionCount = 0;
  actors.forEach(function(a) { if (lower.indexOf(a) !== -1) actorCount++; });
  tensions.forEach(function(t) { if (lower.indexOf(t) !== -1) tensionCount++; });
  resolutions.forEach(function(r) { if (lower.indexOf(r) !== -1) resolutionCount++; });
  return actorCount >= 1 && tensionCount >= 1 && resolutionCount >= 1;
}

function hasInfluenceMarkers(text) {
  var alignmentWords = ["aligne", "convaincu", "obtenu l'accord", "debloque", "fait valider", "rallie", "consensus", "accepte"];
  var resistanceWords = ["resistant", "bloquait", "refusait", "opposait", "ne voulait pas", "skeptique", "hostile"];
  var lower = text.toLowerCase();
  var aCount = 0; var rCount = 0;
  alignmentWords.forEach(function(a) { if (lower.indexOf(a) !== -1) aCount++; });
  resistanceWords.forEach(function(r) { if (lower.indexOf(r) !== -1) rCount++; });
  return aCount >= 1 && rCount >= 1;
}

// Cicatrice classification: strategic (high value) vs operational (low value)

// Multi-pass anonymization audit system
function auditAnonymization(text, paranoMode) {
  var passes = [];

  // === PASS 1: Known entities (companies, tools, products) ===
  var pass1 = { name: "Entites connues", findings: [] };
  var knownEntities = ["Salesforce", "HubSpot", "Notion", "Slack", "Spendesk", "Stripe", "Datadog", "Segment", "Amplitude", "Intercom", "Zendesk", "SAP", "Oracle", "Microsoft", "Google", "Amazon", "Meta", "Apple", "Netflix", "Spotify", "Uber", "Airbnb", "Tesla", "LinkedIn", "Twitter", "Figma", "Miro", "Jira", "Confluence", "Asana", "Monday", "Airtable", "Pipedrive", "Zoho", "Freshworks", "Brevo", "Sendinblue", "Doctolib", "BlaBlaCar", "OVH", "Scaleway", "Contentsquare", "Mirakl", "Payfit", "Alan", "Qonto", "Pennylane", "Swile", "Lydia", "Algolia", "Talend", "Criteo", "Deezer", "Meero", "Back Market", "ManoMano", "Vestiaire Collective", "Ledger", "Ivalua", "ContentSquare", "Workday", "ServiceNow", "Snowflake", "Databricks", "Gong", "Outreach", "Clari", "Chorus", "ZoomInfo", "Apollo", "Lusha", "Lemlist", "Phantombuster", "Clay", "Pigment", "Sifflet", "Watershed"];
  var textLower = text.toLowerCase();
  knownEntities.forEach(function(e) {
    var idx = textLower.indexOf(e.toLowerCase());
    if (idx !== -1) {
      pass1.findings.push({ type: "entreprise", value: text.substring(idx, idx + e.length), start: idx, end: idx + e.length });
    }
  });
  passes.push(pass1);

  // === PASS 2: Structural patterns (amounts, emails, dates, phone numbers) ===
  var pass2 = { name: "Patterns structurels", findings: [] };
  // Amounts — threshold depends on parano mode
  var digitThreshold = paranoMode ? 4 : 5;
  var amountRegex = new RegExp("\\b\\d{" + digitThreshold + ",}\\s*(?:euros?|€|\\$|dollars?)?\\b", "gi");
  var m;
  while ((m = amountRegex.exec(text)) !== null) {
    pass2.findings.push({ type: "montant", value: m[0], start: m.index, end: m.index + m[0].length });
  }
  var bigAmountRegex = /\b\d+[\.,]?\d*\s*(?:M|K|Mds?|milliards?|millions?|milliers?)\s*(?:euros?|€|\$|dollars?)?\b/gi;
  while ((m = bigAmountRegex.exec(text)) !== null) {
    pass2.findings.push({ type: "montant", value: m[0], start: m.index, end: m.index + m[0].length });
  }
  // Emails
  var emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  while ((m = emailRegex.exec(text)) !== null) {
    pass2.findings.push({ type: "email", value: m[0], start: m.index, end: m.index + m[0].length });
  }
  // Phone numbers
  var phoneRegex = /(?:\+\d{1,3}\s?)?(?:0\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}|\(\d{1,4}\)\s?\d[\d\s.-]{6,})/g;
  while ((m = phoneRegex.exec(text)) !== null) {
    pass2.findings.push({ type: "telephone", value: m[0], start: m.index, end: m.index + m[0].length });
  }
  // Specific dates (dd/mm/yyyy or month year)
  if (paranoMode) {
    var dateRegex = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g;
    while ((m = dateRegex.exec(text)) !== null) {
      pass2.findings.push({ type: "date", value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  passes.push(pass2);

  // === PASS 3: Contextual heuristics (capitalized words, city names, sector specifics) ===
  var pass3 = { name: "Heuristique contextuelle", findings: [] };
  var commonWords = ["Le", "La", "Les", "Un", "Une", "Des", "Ce", "Cette", "Mon", "Ma", "Mes", "Ton", "Ta", "Tes", "Son", "Sa", "Ses", "Nous", "Vous", "Ils", "Elles", "En", "Pour", "Par", "Sur", "Dans", "Avec", "Sans", "Sous", "Vers", "Chez", "Depuis", "Pendant", "Avant", "Apres", "Entre", "Comme", "Mais", "Ou", "Et", "Donc", "Or", "Ni", "Car", "Que", "Qui", "Si", "Quand", "Chaque", "Tout", "Tous", "Aucun", "Autre", "Meme", "Notre", "Votre", "Leur", "Quelque", "Plusieurs", "Certains", "Croissance", "Reduction", "Deploiement", "Mise", "Construction", "Arbitrage", "Alignement", "Perte", "Lancement", "Restructuration", "Programme", "Pilotage", "Diagnostic", "Correction", "Transition", "Optimisation", "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre", "KPI", "MRR", "ARR", "CRM", "SaaS", "B2B", "ROI", "MEDDIC", "SDR", "AE", "PM", "VP", "CTO", "CEO", "CFO", "COO", "CSM", "NRR", "EBITDA", "Mid", "Market", "Scale"];
  // Capitalized words mid-sentence
  var capRegex = /(?:^|[.!?]\s+)\w+|(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)/g;
  var capMatch;
  var allPrevFindings = pass1.findings.concat(pass2.findings);
  while ((capMatch = capRegex.exec(text)) !== null) {
    if (capMatch[1] && commonWords.indexOf(capMatch[1]) === -1) {
      var alreadyFound = allPrevFindings.some(function(f) { return f.value.toLowerCase() === capMatch[1].toLowerCase(); });
      if (!alreadyFound && capMatch[1].length > 2) {
        pass3.findings.push({ type: "nom_propre", value: capMatch[1], start: capMatch.index, end: capMatch.index + capMatch[0].length });
      }
    }
  }
  // Parano: city/region names
  if (paranoMode) {
    var cities = ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Nantes", "Lille", "Strasbourg", "Nice", "Rennes", "Montpellier", "Grenoble", "London", "Berlin", "Amsterdam", "Barcelona", "Madrid", "Dublin", "Lisbon", "Brussels", "New York", "San Francisco", "Boston", "Chicago", "Singapore", "Shanghai", "Tokyo", "Sydney", "Ile-de-France", "Auvergne", "Occitanie", "Normandie", "Bretagne", "PACA"];
    cities.forEach(function(c) {
      var idx = textLower.indexOf(c.toLowerCase());
      if (idx !== -1) {
        var existsAlready = allPrevFindings.concat(pass3.findings).some(function(f) { return f.value.toLowerCase() === c.toLowerCase(); });
        if (!existsAlready) pass3.findings.push({ type: "localisation", value: text.substring(idx, idx + c.length), start: idx, end: idx + c.length });
      }
    });
    // Sector-specific terms that might identify a company
    var sectorTerms = ["serie A", "serie B", "serie C", "serie D", "licorne", "pre-IPO", "post-IPO", "CAC 40", "SBF 120", "Next 40", "French Tech 120"];
    sectorTerms.forEach(function(t) {
      var idx = textLower.indexOf(t.toLowerCase());
      if (idx !== -1) {
        pass3.findings.push({ type: "marqueur_secteur", value: text.substring(idx, idx + t.length), start: idx, end: idx + t.length });
      }
    });
  }
  passes.push(pass3);

  // === AGGREGATE ===
  var allFindings = [];
  var seen = {};
  passes.forEach(function(p) {
    p.findings.forEach(function(f) {
      var key = f.value.toLowerCase() + "_" + f.start;
      if (!seen[key]) { seen[key] = true; allFindings.push(Object.assign({}, f, { pass: p.name })); }
    });
  });

  var passesClean = passes.filter(function(p) { return p.findings.length === 0; }).length;
  var confidence = passesClean === 3 ? "OK" : passesClean >= 2 ? "partiel" : "alerte";
  var confidenceColor = confidence === "OK" ? "#4ecca3" : confidence === "partiel" ? "#ff9800" : "#e94560";

  return {
    passes: passes,
    findings: allFindings,
    totalFindings: allFindings.length,
    passesClean: passesClean,
    passesTotal: 3,
    confidence: confidence,
    confidenceColor: confidenceColor,
    paranoMode: paranoMode || false,
    timestamp: Date.now(),
  };
}

// Legacy wrapper for simple detection
function detectSensitiveData(text) {
  var audit = auditAnonymization(text, false);
  return audit.findings;
}

function classifyCicatrice(text) {
  var lower = text.toLowerCase();
  var strategicMarkers = ["choisi", "decide", "arbitre", "option", "alternative", "strategi", "prioris", "sacrifie", "renonce", "pari", "risque", "pivot", "enjeu", "dilemme", "compromis", "tranche"];
  var operationalMarkers = ["oublie", "bug", "erreur technique", "plante", "crash", "pas teste", "manque de temps", "pas verifie", "negligence", "oubli", "pas vu", "backup", "configuration", "serveur", "deploiement rate", "typo"];
  var sCount = 0; var oCount = 0;
  var foundStrategic = []; var foundOperational = [];
  strategicMarkers.forEach(function(m) { if (lower.indexOf(m) !== -1) { sCount++; foundStrategic.push(m); } });
  operationalMarkers.forEach(function(m) { if (lower.indexOf(m) !== -1) { oCount++; foundOperational.push(m); } });
  var totalMarkers = sCount + oCount;
  var confidence = totalMarkers >= 4 ? "forte" : totalMarkers >= 2 ? "moyenne" : "faible";
  var confidenceColor = confidence === "forte" ? "#4ecca3" : confidence === "moyenne" ? "#ff9800" : "#495670";
  if (sCount > oCount) return { type: "strategique", label: "Echec d'arbitrage", color: "#9b59b6", msg: "Cet echec revele un choix difficile entre des options viables. C'est une preuve de jugement sous contrainte. Valeur haute pour un recruteur.", foundMarkers: foundStrategic, confidence: confidence, confidenceColor: confidenceColor, markerCount: totalMarkers };
  if (oCount > sCount) return { type: "operationnel", label: "Echec operationnel", color: "#ff9800", msg: "Cet echec vient d'un oubli ou d'une erreur technique. Le recruteur retient la capacite a corriger, pas l'echec lui-meme. Valeur moderee : insiste sur le fix, pas sur l'erreur.", foundMarkers: foundOperational, confidence: confidence, confidenceColor: confidenceColor, markerCount: totalMarkers };
  return { type: "indetermine", label: "A preciser", color: "#495670", msg: "L'IA n'identifie pas clairement si cet echec vient d'un arbitrage ou d'une negligence. Precise : etait-ce un choix entre deux options, ou un oubli ?", foundMarkers: [], confidence: "faible", confidenceColor: "#495670", markerCount: 0 };
}

function analyzeVerbs(text) {
  var resultVerbs = ["atteint", "reduit", "construit", "deploye", "genere", "lance", "cree", "transforme", "triple", "double", "elimine", "restructure", "negocie", "ferme", "signe", "arbitre", "aligne", "tranche"];
  var processVerbs = ["contribue", "participe", "aide", "supporte", "accompagne", "gere", "suivi", "collabore", "travaille", "assiste", "implique", "coordonne"];
  var avoidanceVerbs = ["essaye", "tente", "voulu", "espere", "souhaite", "envisage", "prevu"];
  var lower = text.toLowerCase();
  var r = 0; var p = 0; var a = 0;
  var foundResult = []; var foundProcess = []; var foundAvoidance = [];
  resultVerbs.forEach(function(v) { if (lower.indexOf(v) !== -1) { r++; foundResult.push(v); } });
  processVerbs.forEach(function(v) { if (lower.indexOf(v) !== -1) { p++; foundProcess.push(v); } });
  avoidanceVerbs.forEach(function(v) { if (lower.indexOf(v) !== -1) { a++; foundAvoidance.push(v); } });
  var total = r + p + a;
  if (total === 0) return null;
  return {
    resultPct: Math.round((r / total) * 100),
    processPct: Math.round((p / total) * 100),
    avoidancePct: Math.round((a / total) * 100),
    foundResult: foundResult,
    foundProcess: foundProcess,
    foundAvoidance: foundAvoidance,
  };
}

function getMaturityLevel(bricks) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.type !== "mission"; });
  if (validated.length < 2) return null;
  var withNumbers = validated.filter(function(b) { return hasNumbers(b.text); }).length;
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; }).length;
  var decisions = validated.filter(function(b) { return b.brickCategory === "decision" || b.brickCategory === "influence"; }).length;
  var ratio = withNumbers / Math.max(validated.length, 1);
  if (ratio >= 0.6 && cicatrices >= 1 && decisions >= 1) return "architecte";
  if (ratio >= 0.5 || decisions >= 1) return "optimiseur";
  return "executant";
}

/* ==============================
   SHARED COMPONENTS
   ============================== */

function Bar({ pct }) {
  return (
    <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 8, height: 8, overflow: "hidden" }}>
      <div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg, #e94560, #ff6b6b)", borderRadius: 8, transition: "width 0.5s ease" }} />
    </div>
  );
}

var ELASTICITY_LABELS = { elastique: { label: "Marche elastique", color: "#4ecca3", icon: "\u2197\uFE0F" }, stable: { label: "Marche stable", color: "#8892b0", icon: "\u2194\uFE0F" }, sous_pression: { label: "Marche sous pression", color: "#e94560", icon: "\u2198\uFE0F" } };
var CATEGORY_LABELS = { chiffre: { label: "Chiffre", color: "#e94560" }, decision: { label: "Decision", color: "#9b59b6" }, influence: { label: "Influence", color: "#3498db" } };

// Effort calculation — weighted investment score
var EFFORT_WEIGHTS = {
  brick_chiffre: 2,
  brick_decision: 4,
  brick_influence: 4,
  brick_cicatrice: 5,
  correction: 3,
  mission_assigned: 1,
  mission_completed: 6,
};

function computeEffort(bricks) {
  var total = 0;
  var breakdown = { briques: 0, corrections: 0, missions: 0, cicatrices: 0 };
  bricks.forEach(function(b) {
    if (b.status === "validated") {
      if (b.brickType === "cicatrice") { total += EFFORT_WEIGHTS.brick_cicatrice; breakdown.cicatrices++; }
      else if (b.brickCategory === "decision" || b.brickCategory === "influence") { total += EFFORT_WEIGHTS.brick_decision; breakdown.briques++; }
      else { total += EFFORT_WEIGHTS.brick_chiffre; breakdown.briques++; }
      if (b.corrected) { total += EFFORT_WEIGHTS.correction; breakdown.corrections++; }
    }
    if (b.type === "mission") { total += EFFORT_WEIGHTS.mission_assigned; breakdown.missions++; }
  });
  // Percentile estimate based on effort
  var percentile = total <= 4 ? 60 : total <= 10 ? 75 : total <= 20 ? 85 : total <= 30 ? 92 : 96;
  return { total: total, percentile: percentile, breakdown: breakdown };
}

// Vulnerability audit — assess brick depth when positioned as remedy
function auditBrickVulnerability(brick) {
  if (!brick || !brick.text) return null;
  var text = brick.text.toLowerCase();
  var hasNumber = /\d/.test(text);
  var hasMethod = ["via", "grace a", "methode", "process", "programme", "plan", "strategie", "structure", "deploye", "mis en place", "construit", "installe"].some(function(m) { return text.indexOf(m) !== -1; });
  var hasContext = ["mois", "semaine", "trimestre", "jours", "equipe", "comptes", "commerciaux", "clients", "personnes"].some(function(m) { return text.indexOf(m) !== -1; });
  var hasResult = ["%", "reduction", "croissance", "augmente", "diminue", "multiplie", "atteint", "genere", "ameliore"].some(function(m) { return text.indexOf(m) !== -1; });
  var depth = 0;
  if (hasNumber) depth++;
  if (hasMethod) depth++;
  if (hasContext) depth++;
  if (hasResult) depth++;
  if (brick.corrected) depth++;
  if (depth >= 4) return { level: "blindee", color: "#4ecca3", msg: "Brique blindee. Chiffre, methode, contexte et resultat." };
  if (depth >= 2) return { level: "credible", color: "#3498db", msg: "Brique credible mais pas blindee." + (!hasNumber ? " Il manque un chiffre." : "") + (!hasMethod ? " Il manque une methode." : "") + (!hasContext ? " Il manque un contexte." : "") + " Si tu te positionnes comme le remede, blinde cette brique." };
  return { level: "vulnerable", color: "#e94560", msg: "Brique vulnerable. Si le probleme persiste apres ton embauche, tu deviens la cible. Ajoute un chiffre, une methode et un contexte." };
}

// Enhanced cauchemar coverage with costs and vulnerability
function computeCauchemarCoverageDetailed(bricks, nightmareCosts) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var coveredKpis = {};
  var bricksByKpi = {};
  validated.forEach(function(b) {
    if (b.kpi) {
      coveredKpis[b.kpi] = true;
      if (!bricksByKpi[b.kpi]) bricksByKpi[b.kpi] = [];
      bricksByKpi[b.kpi].push(b);
    }
  });
  return CAUCHEMARS_CIBLES.map(function(c) {
    var covered = c.kpis.some(function(k) { return coveredKpis[k]; });
    var coveringBricks = [];
    c.kpis.forEach(function(k) { if (bricksByKpi[k]) coveringBricks = coveringBricks.concat(bricksByKpi[k]); });
    // Vulnerability of covering bricks
    var vulnerabilities = coveringBricks.map(function(b) { return auditBrickVulnerability(b); });
    var worstVuln = vulnerabilities.reduce(function(worst, v) {
      if (!v) return worst;
      if (!worst) return v;
      if (v.level === "vulnerable") return v;
      if (v.level === "credible" && worst.level !== "vulnerable") return v;
      return worst;
    }, null);
    var cost = nightmareCosts && nightmareCosts[c.id] ? nightmareCosts[c.id] : null;
    return { id: c.id, label: c.label, nightmareShort: c.nightmareShort, covered: covered, cost: cost, vulnerability: worstVuln, brickCount: coveringBricks.length };
  });
}

function InvestmentIndex({ bricks }) {
  var effort = computeEffort(bricks || []);
  if (effort.total === 0) return null;
  var hasCicatrices = effort.breakdown.cicatrices > 0;
  var exState = useState(false);
  var expanded = exState[0];
  var setExpanded = exState[1];

  var level = effort.total >= 30 ? "dense" : effort.total >= 15 ? "solide" : effort.total >= 6 ? "en cours" : "debut";
  var levelColor = level === "dense" ? "#4ecca3" : level === "solide" ? "#3498db" : level === "en cours" ? "#ff9800" : "#495670";

  return (
    <div style={{ background: "#16213e", borderRadius: 12, padding: 16, marginBottom: 24 }}>
      <button onClick={function() { setExpanded(!expanded); }} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{"\u26A1"}</span>
            <span style={{ color: "#ccd6f6", fontWeight: 700, fontSize: 13 }}>TON INVESTISSEMENT</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: levelColor, fontWeight: 700 }}>{level}</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{expanded ? "\u25B2" : "\u25BC"}</span>
          </div>
        </div>
      </button>
      {expanded && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            {level === "dense"
              ? "Tu as fait un travail que la majorite des candidats ne fera jamais. Le recruteur verra la difference entre quelqu'un qui a prepare et quelqu'un qui a genere."
              : level === "solide"
              ? "Investissement solide. Chaque brique supplementaire creuse l'ecart avec les candidats qui arrivent les mains vides."
              : level === "en cours"
              ? "Debut d'investissement. Continue. La valeur arrive quand le travail devient inconfortable."
              : "Premier pas. Le Sprint demarre. Chaque reponse construit ton arsenal."
            }
          </div>
          {hasCicatrices && (
            <div style={{ fontSize: 11, color: "#ff9800", marginTop: 6 }}>Tu as assume tes echecs. C'est le signal le plus rare en entretien.</div>
          )}
        </div>
      )}
    </div>
  );
}

function Vault({ v, maturity, bricks, nightmareCosts, onCostChange }) {
  var coverage = nightmareCosts ? computeCauchemarCoverageDetailed(bricks || [], nightmareCosts) : computeCauchemarCoverage(bricks || []);
  var coveredCount = coverage.filter(function(c) { return c.covered; }).length;
  var items = [
    { l: "Briques de Preuve", val: v.bricks, mx: 9, e: "\uD83E\uDDF1" },
    { l: "Missions en cours", val: v.missions, mx: 5, e: "\uD83D\uDCCB" },
    { l: "Piliers Singularite", val: v.pillars, mx: 4, e: "\uD83C\uDFDB\uFE0F" },
  ];
  var matLabels = { executant: "Executant", optimiseur: "Optimiseur", architecte: "Architecte" };
  var matColors = { executant: "#495670", optimiseur: "#e94560", architecte: "#4ecca3" };
  return (
    <div style={{ background: "#16213e", borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{"\uD83D\uDD10"}</span>
          <span style={{ color: "#e94560", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>COFFRE-FORT</span>
        </div>
        {maturity && (
          <span style={{ fontSize: 10, color: matColors[maturity] || "#495670", background: "#1a1a2e", padding: "4px 10px", borderRadius: 10, fontWeight: 700, letterSpacing: 1 }}>
            {matLabels[maturity] || ""}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {items.map(function(it) {
          return (
            <div key={it.l} style={{ background: "#1a1a2e", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 4 }}>{it.e} {it.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6" }}>
                {it.val}{it.u || ""} <span style={{ fontSize: 12, color: "#495670", fontWeight: 400 }}>/ {it.mx}{it.u || ""}</span>
              </div>
            </div>
          );
        })}
      </div>
      {/* CAUCHEMAR COVERAGE — with costs and vulnerability */}
      {bricks && bricks.length > 0 && (
        <div style={{ marginTop: 12, background: "#1a1a2e", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 6 }}>{"\uD83D\uDCA2"} Cauchemars couverts</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: coveredCount === 3 ? "#4ecca3" : "#e94560", marginBottom: 8 }}>
            {coveredCount} <span style={{ fontSize: 12, color: "#495670", fontWeight: 400 }}>/ 3</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {coverage.map(function(c) {
              var vuln = c.vulnerability || null;
              return (
                <div key={c.id} style={{ background: "#16213e", borderRadius: 6, padding: 8 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: c.covered ? "#4ecca3" : "#e94560" }}>{c.covered ? "\u2705" : "\u274C"}</span>
                    <span style={{ fontSize: 11, color: c.covered ? "#4ecca3" : "#8892b0", flex: 1 }}>{c.label}</span>
                    {c.covered && vuln && (
                      <span style={{ fontSize: 9, color: vuln.color, background: "#1a1a2e", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                        {vuln.level === "blindee" ? "\uD83D\uDEE1\uFE0F" : vuln.level === "credible" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"} {vuln.level}
                      </span>
                    )}
                  </div>
                  {/* Reference cost range */}
                  {c.costRange && (
                    <div style={{ fontSize: 10, color: "#e94560", marginBottom: 3 }}>
                      {"\uD83D\uDCB0"} Cout sectoriel : {(c.costRange[0] / 1000).toFixed(0)}K - {(c.costRange[1] / 1000).toFixed(0)}K\u20AC/{c.costUnit}
                    </div>
                  )}
                  {/* Negotiation framing for covered cauchemars */}
                  {c.covered && c.costRange && c.hasElasticCovering && (
                    <div style={{ background: "#4ecca3" + "15", borderRadius: 4, padding: 6, marginBottom: 3 }}>
                      <div style={{ fontSize: 10, color: "#4ecca3", lineHeight: 1.4 }}>
                        {"\u2197\uFE0F"} Levier de negociation : ta brique couvre un cauchemar elastique a {(c.costRange[0] / 1000).toFixed(0)}-{(c.costRange[1] / 1000).toFixed(0)}K\u20AC. Ta negociation commence par ce chiffre.
                      </div>
                    </div>
                  )}
                  {/* Bluff alert for elastic coverage */}
                  {c.covered && c.hasElasticCovering && (
                    <div style={{ background: "#ff9800" + "15", borderRadius: 4, padding: 6, marginBottom: 3 }}>
                      <div style={{ fontSize: 10, color: "#ff9800", lineHeight: 1.4 }}>
                        {"\u26A0\uFE0F"} Alerte bluff : tu te positionnes comme le remede. Si le probleme persiste apres ton arrivee, tu es la cible. Ta preuve est-elle reproductible ?
                      </div>
                    </div>
                  )}
                  {/* Cost input */}
                  {onCostChange && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "#495670" }}>{"\uD83D\uDCB0"}</span>
                      <input
                        type="text"
                        placeholder="Cout estime (ex: 180K/trimestre)"
                        value={c.cost || ""}
                        onChange={function(e) { onCostChange(c.id, e.target.value); }}
                        style={{ flex: 1, background: "#0a0a1a", border: "1px solid #16213e", borderRadius: 4, padding: "4px 8px", color: "#ccd6f6", fontSize: 11, outline: "none", fontFamily: "inherit" }}
                      />
                    </div>
                  )}
                  {c.cost && (
                    <div style={{ fontSize: 10, color: "#e94560", marginTop: 3 }}>Impact : {c.cost}</div>
                  )}
                  {/* Vulnerability warning */}
                  {c.covered && vuln && vuln.level !== "blindee" && (
                    <div style={{ fontSize: 10, color: vuln.color, marginTop: 4, lineHeight: 1.4 }}>{vuln.msg}</div>
                  )}
                </div>
              );
            })}
          </div>
          {coveredCount < 3 && (
            <div style={{ fontSize: 11, color: "#e94560", marginTop: 6 }}>{3 - coveredCount} cauchemar{3 - coveredCount > 1 ? "s" : ""} sans remede. Le recruteur le verra.</div>
          )}
          {coverage.some(function(c) { return c.covered && c.vulnerability && c.vulnerability.level === "vulnerable"; }) && (
            <div style={{ background: "#e94560" + "22", borderRadius: 6, padding: 8, marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5, fontWeight: 600 }}>Tu te positionnes comme le remede. Si tes briques sont faibles et que le probleme persiste apres ton embauche, tu deviens la cible. Blinde tes briques ou baisse tes pretentions.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Nav({ steps, active, onSelect, density }) {
  var unlockStates = density ? [true, density.unlocks.forge, density.unlocks.affutage, density.unlocks.armement] : [true, false, false, false];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      {steps.map(function(s, i) {
        var isAct = i === active;
        var isDone = i < active;
        var isLocked = !unlockStates[i] && !isDone;
        return (
          <button key={i} onClick={function() { if (unlockStates[i] && i <= active) onSelect(i); }} style={{
            flex: 1, background: isAct ? "#e94560" : isDone ? "#0f3460" : "#1a1a2e",
            border: isAct ? "2px solid #e94560" : isLocked ? "2px solid #e94560" + "33" : "2px solid #16213e",
            borderRadius: 10, padding: "12px 6px", cursor: unlockStates[i] && i <= active ? "pointer" : "default",
            transition: "all 0.3s", opacity: isLocked ? 0.3 : !isAct && !isDone ? 0.5 : 1,
          }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{isDone ? "\u2705" : isLocked ? "\uD83D\uDD12" : s.icon}</div>
            <div style={{ fontSize: 9, color: isLocked ? "#e94560" : "#8892b0", fontWeight: 600 }}>{s.gate}</div>
            <div style={{ fontSize: 12, color: isAct ? "#fff" : "#ccd6f6", fontWeight: 700 }}>{s.title}</div>
          </button>
        );
      })}
    </div>
  );
}

function FeedbackToast({ brick, onDone }) {
  var opState = useState(0);
  var opacity = opState[0];
  var setOpacity = opState[1];
  useState(function() {
    var t1 = setTimeout(function() { setOpacity(1); }, 50);
    var t2 = setTimeout(function() { setOpacity(0); }, 3200);
    var t3 = setTimeout(function() { onDone(); }, 3800);
    return function() { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  });
  var catLabel = brick.brickCategory && CATEGORY_LABELS[brick.brickCategory] ? CATEGORY_LABELS[brick.brickCategory].label : "";
  var isHard = brick.brickCategory === "decision" || brick.brickCategory === "influence" || brick.brickType === "cicatrice";
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: isHard ? "#0f3460" : "#0f3460", border: isHard ? "2px solid #4ecca3" : "1px solid #e94560", borderRadius: 12,
      padding: "16px 20px", maxWidth: 420, width: "90%", zIndex: 999,
      opacity: opacity, transition: "opacity 0.4s ease",
      boxShadow: isHard ? "0 8px 32px rgba(78,204,163,0.3)" : "0 8px 32px rgba(233,69,96,0.25)",
    }}>
      <div style={{ fontSize: 11, color: isHard ? "#4ecca3" : "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
        {brick.type === "mission" ? "\uD83D\uDCCB MISSION ASSIGNEE" : brick.corrected ? "\u270D\uFE0F BRIQUE CORRIGEE" : "\u2705 BRIQUE FORGEE"}
        {catLabel && brick.type !== "mission" ? " \u2014 " + catLabel.toUpperCase() : ""}
      </div>
      <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 10 }}>
        "{brick.text.length > 70 ? brick.text.slice(0, 70) + "..." : brick.text}"
      </div>
      {brick.type !== "mission" && brick.usedIn && (
        <div>
          <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 4 }}>ALIMENTE MAINTENANT :</div>
          {brick.usedIn.map(function(u, i) {
            return <div key={i} style={{ fontSize: 12, color: "#8892b0", paddingLeft: 8, marginBottom: 2 }}>{"\u2192"} {u}</div>;
          })}
        </div>
      )}
      {isHard && brick.type !== "mission" && (
        <div style={{ fontSize: 11, color: "#4ecca3", marginTop: 8, borderTop: "1px solid #16213e", paddingTop: 6 }}>
          {brick.brickType === "cicatrice" ? "Echec assume. C'est la brique la plus rare de ton Coffre-Fort." : brick.brickCategory === "decision" ? "Arbitrage documente. Aucun generateur de CV ne produit ca." : "Influence prouvee. Le recruteur ne peut pas tester ca autrement qu'en entretien."}
        </div>
      )}
    </div>
  );
}

function CVPreview({ bricks }) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  if (validated.length === 0) return null;
  var TARGET_BRICKS = 5;
  var cvSlots = [];
  for (var i = 0; i < TARGET_BRICKS; i++) {
    if (i < validated.length) {
      cvSlots.push({ filled: true, text: validated[i].text, category: validated[i].brickCategory });
    } else {
      cvSlots.push({ filled: false, text: "", category: null });
    }
  }
  var pct = Math.round((validated.length / TARGET_BRICKS) * 100);
  var cvState = useState(false);
  var expanded = cvState[0];
  var setExpanded = cvState[1];
  return (
    <div style={{ background: "#16213e", borderRadius: 12, padding: 16, marginBottom: 24 }}>
      <button onClick={function() { setExpanded(!expanded); }} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: expanded ? 12 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{"\uD83D\uDCC4"}</span>
            <span style={{ color: "#ccd6f6", fontWeight: 700, fontSize: 13 }}>TON CV EN CONSTRUCTION</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: pct >= 100 ? "#4ecca3" : "#e94560", fontWeight: 700 }}>{validated.length}/{TARGET_BRICKS}</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{expanded ? "\u25B2" : "\u25BC"}</span>
          </div>
        </div>
      </button>
      {expanded && (
        <div>
          {/* Mini progress bar */}
          <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 6, height: 4, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ width: Math.min(pct, 100) + "%", height: "100%", background: pct >= 100 ? "#4ecca3" : "linear-gradient(90deg, #e94560, #ff6b6b)", borderRadius: 6, transition: "width 0.5s ease" }} />
          </div>
          {/* CV Slots */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cvSlots.map(function(slot, idx) {
              var catColor = slot.category && CATEGORY_LABELS[slot.category] ? CATEGORY_LABELS[slot.category].color : "#495670";
              if (slot.filled) {
                return (
                  <div key={idx} style={{ background: "#1a1a2e", borderRadius: 8, padding: "8px 12px", borderLeft: "3px solid " + catColor }}>
                    <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.4 }}>
                      {slot.text.length > 80 ? slot.text.slice(0, 80) + "..." : slot.text}
                    </div>
                  </div>
                );
              }
              return (
                <div key={idx} style={{ background: "#1a1a2e", borderRadius: 8, padding: "8px 12px", borderLeft: "3px solid #1a1a2e", opacity: 0.3 }}>
                  <div style={{ fontSize: 12, color: "#495670", lineHeight: 1.4 }}>
                    {"\u2588\u2588\u2588\u2588 \u2588\u2588\u2588\u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588\u2588\u2588 \u2588\u2588\u2588\u2588\u2588\u2588\u2588 \u2588\u2588\u2588"}
                  </div>
                </div>
              );
            })}
          </div>
          {validated.length < TARGET_BRICKS && (
            <div style={{ fontSize: 11, color: "#e94560", marginTop: 8, textAlign: "center" }}>
              {TARGET_BRICKS - validated.length} ligne{TARGET_BRICKS - validated.length > 1 ? "s" : ""} vide{TARGET_BRICKS - validated.length > 1 ? "s" : ""}. Le recruteur voit les trous.
            </div>
          )}
          {validated.length >= TARGET_BRICKS && (
            <div style={{ fontSize: 11, color: "#4ecca3", marginTop: 8, textAlign: "center" }}>
              CV complet. Chaque ligne est une preuve. Le recruteur n'a rien a deviner.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CopyBtn({ text, label }) {
  var st = useState(false);
  var copied = st[0];
  var setCopied = st[1];
  function go() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() { setCopied(true); setTimeout(function() { setCopied(false); }, 1500); });
    } else { setCopied(true); setTimeout(function() { setCopied(false); }, 1500); }
  }
  return (
    <button onClick={go} style={{
      padding: "5px 12px", background: copied ? "#0f3460" : "#1a1a2e",
      color: copied ? "#e94560" : "#8892b0", border: copied ? "1px solid #e94560" : "1px solid #495670",
      borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11, transition: "all 0.2s", whiteSpace: "nowrap",
    }}>{copied ? "\u2713 Copie" : label || "Copier"}</button>
  );
}

function BricksRecap({ bricks }) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var missions = bricks.filter(function(b) { return b.type === "mission"; });
  if (validated.length === 0 && missions.length === 0) return null;
  return (
    <div style={{ marginTop: 16 }}>
      {validated.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>{"\uD83E\uDDF1"} BRIQUES ({validated.length})</div>
          {validated.map(function(b) {
            var cat = b.brickCategory && CATEGORY_LABELS[b.brickCategory];
            return (
              <div key={b.id} style={{ background: "#0f3460", borderRadius: 8, padding: "8px 12px", marginBottom: 6, borderLeft: "3px solid " + (cat ? cat.color : "#e94560"), display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, fontSize: 12, color: "#8892b0", lineHeight: 1.4 }}>
                  {b.text.length > 80 ? b.text.slice(0, 80) + "..." : b.text}
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: cat ? cat.color : "#e94560", background: "#1a1a2e", padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>
                    {b.brickType === "cicatrice" ? "cicatrice" : cat ? cat.label.toLowerCase() : "preuve"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {missions.length > 0 && (
        <div style={{ marginTop: validated.length > 0 ? 12 : 0 }}>
          <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>{"\uD83D\uDCCB"} MISSIONS ({missions.length})</div>
          {missions.map(function(m) {
            return (
              <div key={m.id} style={{ background: "#1a1a2e", borderRadius: 8, padding: "8px 12px", marginBottom: 6, borderLeft: "3px solid #495670" }}>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.4 }}>
                  {m.text.length > 80 ? m.text.slice(0, 80) + "..." : m.text}
                </div>
                <span style={{ fontSize: 10, color: "#495670", marginTop: 4, display: "inline-block" }}>en attente de preuve</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddBrick({ onAdd }) {
  var openState = useState(false);
  var isOpen = openState[0];
  var setIsOpen = openState[1];
  var txtState = useState("");
  var text = txtState[0];
  var setText = txtState[1];
  var kpiState = useState("");
  var kpi = kpiState[0];
  var setKpi = kpiState[1];
  var catState = useState("chiffre");
  var category = catState[0];
  var setCategory = catState[1];
  var doneState = useState(false);
  var justAdded = doneState[0];
  var setJustAdded = doneState[1];
  function handleAdd() {
    if (text.trim().length < 10) return;
    onAdd(text.trim(), kpi.trim() || "A definir", category);
    setText(""); setKpi("");
    setJustAdded(true);
    setTimeout(function() { setJustAdded(false); setIsOpen(false); }, 1800);
  }
  if (justAdded) {
    return (
      <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, textAlign: "center", marginTop: 16 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>{"\u2705"}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Brique ajoutee et structuree.</div>
      </div>
    );
  }
  if (!isOpen) {
    return (
      <button onClick={function() { setIsOpen(true); }} style={{
        width: "100%", marginTop: 16, padding: 14, background: "#1a1a2e",
        border: "2px dashed #495670", borderRadius: 10, cursor: "pointer",
        color: "#8892b0", fontSize: 13, fontWeight: 600, textAlign: "center",
      }}>{"\u2795"} L'IA a rate quelque chose ? Ajoute ta brique.</button>
    );
  }
  return (
    <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginTop: 16 }}>
      <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>AJOUTER UNE BRIQUE</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["chiffre", "decision", "influence"].map(function(c) {
          var cat = CATEGORY_LABELS[c];
          var act = category === c;
          return (
            <button key={c} onClick={function() { setCategory(c); }} style={{
              flex: 1, padding: "6px 4px", fontSize: 11, fontWeight: 700,
              background: act ? cat.color + "22" : "#1a1a2e", color: act ? cat.color : "#495670",
              border: act ? "1px solid " + cat.color : "1px solid #16213e",
              borderRadius: 6, cursor: "pointer",
            }}>{cat.label}</button>
          );
        })}
      </div>
      <textarea value={text} onChange={function(e) { setText(e.target.value); }}
        placeholder={category === "chiffre" ? "Ex : J'ai forme 12 commerciaux, 8 ont atteint leur quota en 4 mois." : category === "decision" ? "Ex : Le board voulait X, j'ai choisi Y parce que Z." : "Ex : 3 directeurs bloquaient, j'ai aligne tout le monde en montrant le cout d'opportunite."}
        style={{ width: "100%", minHeight: 70, padding: 12, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, lineHeight: 1.5, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }}
      />
      <input value={kpi} onChange={function(e) { setKpi(e.target.value); }}
        placeholder="KPI associe (optionnel)"
        style={{ width: "100%", padding: 10, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleAdd} disabled={text.trim().length < 10} style={{
          flex: 1, padding: 12,
          background: text.trim().length >= 10 ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
          color: text.trim().length >= 10 ? "#fff" : "#495670",
          border: "none", borderRadius: 8, cursor: text.trim().length >= 10 ? "pointer" : "default", fontWeight: 700, fontSize: 13,
        }}>Ajouter au Coffre-Fort</button>
        <button onClick={function() { setIsOpen(false); setText(""); setKpi(""); }} style={{
          padding: "12px 16px", background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
        }}>Annuler</button>
      </div>
    </div>
  );
}

/* ==============================
   INTERROGATOIRE — 3 brick types + correction flow + verb analysis + sectoral codes
   ============================== */

function Interrogation({ seeds, bricks, onForge, onCorrect, onMission, onSkip, onAddBrick, paranoMode, targetRoleId }) {
  var ansState = useState("");
  var answer = ansState[0];
  var setAnswer = ansState[1];
  var fieldsState = useState({ f1: "", f2: "", f3: "", f4: "" });
  var fields = fieldsState[0];
  var setFields = fieldsState[1];
  var phaseState = useState("question");
  var phase = phaseState[0];
  var setPhase = phaseState[1];
  var missionTriggered = useState(false);
  var isMission = missionTriggered[0];
  var setIsMission = missionTriggered[1];
  var confrontState = useState(null);
  var confrontMsg = confrontState[0];
  var setConfrontMsg = confrontState[1];
  var editState = useState("");
  var editText = editState[0];
  var setEditText = editState[1];
  var verbState = useState(null);
  var verbData = verbState[0];
  var setVerbData = verbState[1];
  var verbDismissedState = useState(false);
  var verbDismissed = verbDismissedState[0];
  var setVerbDismissed = verbDismissedState[1];
  var cicOverrideState = useState(null);
  var cicOverride = cicOverrideState[0];
  var setCicOverride = cicOverrideState[1];
  var anonEditState = useState("");
  var anonEdit = anonEditState[0];
  var setAnonEdit = anonEditState[1];
  var anonAuditState = useState(null);
  var anonAudit = anonAuditState[0];
  var setAnonAudit = anonAuditState[1];

  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var missionItems = bricks.filter(function(b) { return b.type === "mission"; });
  var processed = seeds.filter(function(s) { return bricks.some(function(b) { return b.id === s.id; }); });
  var pending = seeds.filter(function(s) { return !bricks.some(function(b) { return b.id === s.id; }); });

  if (pending.length === 0) {
    return (
      <div>
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{"\u2705"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>
            {validated.length} brique{validated.length > 1 ? "s" : ""} + {missionItems.length} mission{missionItems.length > 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>
            {missionItems.length > 0 ? "Les missions deviennent des briques quand tu apportes la preuve." : "Forgees a partir de tes reponses. Tu les incarnes. Tu les defendras."}
          </div>
        </div>
        <BricksRecap bricks={bricks} />
        <AddBrick onAdd={onAddBrick} />
      </div>
    );
  }

  var seed = pending[0];
  var effectiveText = seed.generatedText || answer;

  if (phase === "forging") {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>{"\u2699\uFE0F"}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>L'IA analyse ta reponse...</div>
        <div style={{ fontSize: 12, color: "#8892b0" }}>Croisement avec le contexte marche.</div>
      </div>
    );
  }

  // TRIAGE — client chooses instead of automatic mission
  if (phase === "triage") {
    var hasDecision = hasDecisionMarkers(answer);
    var hasInfluence = hasInfluenceMarkers(answer);
    var hasRichContent = answer.trim().split(" ").length >= 15;
    return (
      <div>
        <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #3498db" }}>
          <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>TRIAGE</div>
          <div style={{ fontSize: 14, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 12 }}>
            Ta reponse ne contient pas de chiffre.
            {hasDecision || hasInfluence ? " Mais l'IA detecte des marqueurs de " + (hasDecision ? "decision" : "") + (hasDecision && hasInfluence ? " et d'" : "") + (hasInfluence ? "influence" : "") + "." : ""}
            {!hasDecision && !hasInfluence && hasRichContent ? " Mais ta reponse est riche (" + answer.trim().split(" ").length + " mots)." : ""}
            {!hasDecision && !hasInfluence && !hasRichContent ? " L'IA n'a pas detecte de marqueurs de decision ou d'influence." : ""}
          </div>
          <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 4 }}>CE QUE L'IA A DETECTE DANS TA REPONSE</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
              Chiffres : <span style={{ color: "#e94560" }}>aucun</span>
              {hasDecision && <span> {"\u00B7"} Marqueurs de decision : <span style={{ color: "#9b59b6" }}>oui</span></span>}
              {hasInfluence && <span> {"\u00B7"} Marqueurs d'influence : <span style={{ color: "#3498db" }}>oui</span></span>}
              {!hasDecision && <span> {"\u00B7"} Marqueurs de decision : <span style={{ color: "#495670" }}>non</span></span>}
              {!hasInfluence && <span> {"\u00B7"} Marqueurs d'influence : <span style={{ color: "#495670" }}>non</span></span>}
              {" "}{"\u00B7"} Longueur : {answer.trim().split(" ").length} mots
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, marginBottom: 10 }}>Que veux-tu faire ?</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={function() { setPhase("forging"); setTimeout(function() { setPhase("review"); }, 1200); }} style={{
            padding: 14, background: "#0f3460", color: "#ccd6f6", border: "2px solid #4ecca3", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, textAlign: "left",
          }}>
            <span style={{ color: "#4ecca3" }}>{"\u2192"}</span> Forge une brique avec ce que j'ai donne
            <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 400, marginTop: 2 }}>L'IA structure ta reponse sans chiffre. La brique sera moins precise mais existera.</div>
          </button>
          <button onClick={function() { setPhase("mission"); setIsMission(true); }} style={{
            padding: 14, background: "#0f3460", color: "#ccd6f6", border: "2px solid #ff9800", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, textAlign: "left",
          }}>
            <span style={{ color: "#ff9800" }}>{"\u2192"}</span> Assigne la mission, je reviendrai avec le chiffre
            <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 400, marginTop: 2 }}>L'IA te donne les etapes pour recuperer la preuve. La brique sera forgee quand tu reviendras.</div>
          </button>
          <button onClick={function() { setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); }} style={{
            padding: 14, background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, textAlign: "left",
          }}>
            <span style={{ color: "#495670" }}>{"\u2192"}</span> Je reformule ma reponse
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 400, marginTop: 2 }}>Tu repars de zero sur cette question.</div>
          </button>
        </div>
      </div>
    );
  }

  // MISSION REVIEW
  if (phase === "mission") {
    var totalProcessed = bricks.length;
    var missionCount = bricks.filter(function(b) { return b.type === "mission"; }).length + 1; // +1 for current
    var brickCount = bricks.filter(function(b) { return b.status === "validated"; }).length;
    var missionRatio = totalProcessed > 0 ? Math.round((missionCount / (missionCount + brickCount)) * 100) : 100;
    var isHighMissions = missionCount >= 3;

    return (
      <div>
        <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #ff9800" }}>
          <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>MISSION ASSIGNEE</div>
          <div style={{ fontSize: 14, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 12 }}>{seed.missionText}</div>
          <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 4 }}>POURQUOI UNE MISSION ET PAS UNE BRIQUE</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Ta reponse ne contient pas de chiffre. Sans chiffre, l'IA forge du vent. Un recruteur detecte la difference entre une preuve et une impression.</div>
          </div>
          {isHighMissions && (
            <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, borderLeft: "3px solid #e94560" }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>DIAGNOSTIC DE MESURE</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                C'est ta {missionCount}e mission sur {missionCount + brickCount} questions. {missionRatio}% de tes reponses n'ont pas de chiffre. Ce n'est pas un probleme de memoire. C'est un mode de fonctionnement : tu operes sans mesurer l'impact de ce que tu fais.
              </div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginTop: 6 }}>
                Chaque mission que tu completes ne remplit pas seulement ton arsenal. Elle installe un reflexe : mesurer ce que tu fais pendant que tu le fais. Le professionnel qui negocie avec des preuves fixe son prix. Celui qui negocie avec des impressions accepte celui qu'on lui donne.
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() { onMission(seed); setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setIsMission(false); }} style={{
            flex: 1, padding: 14, background: "#0f3460", color: "#ccd6f6", border: "2px solid #ff9800", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Archiver la mission</button>
          <button onClick={function() { setPhase("question"); setIsMission(false); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); }} style={{
            padding: "14px 16px", background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Reessayer</button>
        </div>
      </div>
    );
  }

  // CONFRONTATION
  if (phase === "confront") {
    return (
      <div>
        <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #e94560" }}>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>CONFRONTATION</div>
          <div style={{ fontSize: 14, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 12 }}>{confrontMsg}</div>
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Reformule ta reponse en incluant ta part de responsabilite.</div>
        </div>
        <button onClick={function() { setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setConfrontMsg(null); }} style={{
          width: "100%", padding: 14, background: "#0f3460", color: "#ccd6f6", border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>Reformuler ma reponse</button>
      </div>
    );
  }

  // CORRECTION MODE — editing the generated brick text
  if (phase === "correcting") {
    return (
      <div>
        <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>CORRECTION DE LA BRIQUE</div>
        <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 12 }}>
          Modifie le texte. Chaque correction enseigne ta voix a l'IA. Le Style Engine apprend de tes choix, pas de tes validations.
        </div>
        <textarea value={editText} onChange={function(e) { setEditText(e.target.value); }}
          style={{ width: "100%", minHeight: 90, padding: 14, background: "#1a1a2e", border: "2px solid #9b59b6", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() {
            if (editText.trim().length >= 10) {
              if (seed.anonymizedText) {
                setAnonEdit(seed.anonymizedText);
                // Store corrected text temporarily — we'll need it after anon review
                seed._correctedText = editText.trim();
                setPhase("anon_review_correct");
              } else {
                onCorrect(seed, editText.trim());
                setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setEditText(""); setVerbData(null); setVerbDismissed(false); setCicOverride(null);
              }
            }
          }} disabled={editText.trim().length < 10} style={{
            flex: 1, padding: 14, background: editText.trim().length >= 10 ? "linear-gradient(135deg, #9b59b6, #8e44ad)" : "#1a1a2e",
            color: editText.trim().length >= 10 ? "#fff" : "#495670",
            border: "none", borderRadius: 10, cursor: editText.trim().length >= 10 ? "pointer" : "default", fontWeight: 700, fontSize: 14,
          }}>Archiver la correction</button>
          <button onClick={function() { setPhase("review"); setEditText(""); }} style={{
            padding: "14px 16px", background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Annuler</button>
        </div>
      </div>
    );
  }

  // ANONYMIZATION REVIEW — multi-pass audit with defense in depth
  if (phase === "anon_review" || phase === "anon_review_correct") {
    var isCorrection = phase === "anon_review_correct";
    var audit = auditAnonymization(anonEdit, paranoMode);
    var hasSensitive = audit.totalFindings > 0;
    // Build highlighted text
    var highlightedParts = [];
    if (hasSensitive) {
      var sorted = audit.findings.slice().sort(function(a, b) { return a.start - b.start; });
      var lastEnd = 0;
      sorted.forEach(function(f) {
        if (f.start > lastEnd) highlightedParts.push({ text: anonEdit.substring(lastEnd, f.start), sensitive: false });
        highlightedParts.push({ text: f.value, sensitive: true, type: f.type, pass: f.pass });
        lastEnd = f.end;
      });
      if (lastEnd < anonEdit.length) highlightedParts.push({ text: anonEdit.substring(lastEnd), sensitive: false });
    }
    var typeLabels = { entreprise: "Entreprise", montant: "Montant", email: "Email", telephone: "Telephone", date: "Date", nom_propre: "Nom propre", localisation: "Localisation", marqueur_secteur: "Marqueur secteur" };

    function handleAnonConfirm() {
      // Re-scan final text before archiving (defense layer 5)
      var finalAudit = auditAnonymization(anonEdit.trim(), paranoMode);
      var auditTrail = {
        initialAudit: audit,
        finalAudit: finalAudit,
        paranoMode: paranoMode,
        userConfirmed: true,
        confirmedAt: Date.now(),
        findingsAtConfirm: finalAudit.totalFindings,
      };
      var reviewedSeed = Object.assign({}, seed, { generatedText: effectiveText, anonymizedText: anonEdit.trim(), anonAuditTrail: auditTrail });
      if (isCorrection) {
        onCorrect(reviewedSeed, editText.trim());
        setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setEditText(""); setAnonEdit(""); setAnonAudit(null); setVerbData(null); setVerbDismissed(false); setCicOverride(null);
      } else {
        onForge(reviewedSeed);
        setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setAnonEdit(""); setAnonAudit(null); setVerbData(null); setVerbDismissed(false); setCicOverride(null);
      }
    }

    return (
      <div>
        {/* AUDIT HEADER */}
        <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid " + audit.confidenceColor }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: audit.confidenceColor, fontWeight: 600, letterSpacing: 1 }}>
              {hasSensitive ? "\u26A0\uFE0F VERIFICATION REQUISE" : "\uD83D\uDD12 AUDIT ANONYMISATION"}
              {isCorrection ? " (BRIQUE CORRIGEE)" : ""}
            </div>
          </div>

          {/* PASS-BY-PASS RESULTS */}
          <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 6 }}>RAPPORT D'AUDIT — {audit.passesClean}/{audit.passesTotal} PASSES PROPRES</div>
            {audit.passes.map(function(p, i) {
              var clean = p.findings.length === 0;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: clean ? "#4ecca3" : "#e94560" }}>{clean ? "\u2705" : "\u274C"}</span>
                  <span style={{ fontSize: 11, color: "#8892b0" }}>Passe {i + 1} : {p.name}</span>
                  {!clean && <span style={{ fontSize: 10, color: "#e94560" }}>({p.findings.length} element{p.findings.length > 1 ? "s" : ""})</span>}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 12 }}>
            {hasSensitive
              ? audit.totalFindings + " element" + (audit.totalFindings > 1 ? "s" : "") + " detecte" + (audit.totalFindings > 1 ? "s" : "") + " sur 3 passes. Verifie et corrige avant d'archiver."
              : "3 passes executees. 0 element detecte. Verifie quand meme : l'IA peut rater des elements."
            }
          </div>

          {/* Highlighted preview */}
          {hasSensitive && (
            <div style={{ background: "#0f3460", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: "#ccd6f6", lineHeight: 1.6 }}>
              {highlightedParts.map(function(p, i) {
                if (p.sensitive) {
                  return <span key={i} style={{ background: "#e94560", color: "#fff", padding: "1px 4px", borderRadius: 3, fontSize: 12 }} title={p.type + " (" + p.pass + ")"}>{p.text}</span>;
                }
                return <span key={i}>{p.text}</span>;
              })}
            </div>
          )}

          {/* Detected items grouped by pass */}
          {hasSensitive && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 6 }}>DETAILS PAR PASSE</div>
              {audit.passes.filter(function(p) { return p.findings.length > 0; }).map(function(p, pi) {
                return (
                  <div key={pi} style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 10, color: "#8892b0", marginBottom: 3 }}>{p.name} :</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.findings.map(function(f, fi) {
                        return (
                          <span key={fi} style={{ fontSize: 10, color: "#e94560", background: "#0f3460", padding: "2px 8px", borderRadius: 8, border: "1px solid #e94560" }}>
                            {typeLabels[f.type] || f.type} : {f.value}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Editable textarea */}
          <div style={{ fontSize: 11, color: "#8892b0", marginBottom: 6 }}>Edite la version transportable ci-dessous :</div>
          <textarea value={anonEdit} onChange={function(e) { setAnonEdit(e.target.value); }}
            style={{ width: "100%", minHeight: 80, padding: 12, background: "#0f3460", border: "2px solid " + audit.confidenceColor, borderRadius: 10, color: "#ccd6f6", fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: "#495670", marginTop: 4 }}>
            Supprime les noms d'entreprise, montants absolus, donnees specifiques. Garde la logique et les ratios.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleAnonConfirm} style={{
            flex: 1, padding: 14, background: isCorrection ? "linear-gradient(135deg, #9b59b6, #8e44ad)" : "linear-gradient(135deg, #e94560, #c81d4e)",
            color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}>
            {hasSensitive ? "J'ai verifie — Archiver" : "Confirmer et archiver"}
            {isCorrection ? " la correction" : ""}
          </button>
          <button onClick={function() { setPhase(isCorrection ? "correcting" : "review"); setAnonEdit(""); setAnonAudit(null); }} style={{
            padding: "14px 16px", background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Retour</button>
        </div>
      </div>
    );
  }

  // BRICK REVIEW — with verb analysis + sectoral code + advocacy + elasticity + correction option + KPI reference
  if (phase === "review") {
    // TAKE TYPE — special review showing depth analysis + pillar preview
    if (seed.type === "take") {
      var takeAnalysis = verbData && verbData.takeAnalysis ? verbData.takeAnalysis : analyzeTakeDepth(answer, seed.surfacePatterns);
      var pillarPreview = takeToiPillar(answer, takeAnalysis);
      return (
        <div>
          <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#3498db", fontWeight: 600, letterSpacing: 1 }}>PRISE DE POSITION {takeAnalysis.level === "deep" ? "FORGEE" : "DETECTEE"}</span>
              <span style={{ fontSize: 10, color: takeAnalysis.level === "deep" ? "#4ecca3" : takeAnalysis.level === "partial" ? "#ff9800" : "#e94560", background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>
                {takeAnalysis.level === "deep" ? "profonde" : takeAnalysis.level === "partial" ? "partielle" : "surface"}
              </span>
            </div>
            <div style={{ fontSize: 14, color: "#ccd6f6", lineHeight: 1.7, marginBottom: 14, fontStyle: "italic" }}>"{answer}"</div>

            {/* Depth diagnostic */}
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid " + (takeAnalysis.level === "deep" ? "#4ecca3" : "#ff9800") }}>
              <div style={{ fontSize: 11, color: takeAnalysis.level === "deep" ? "#4ecca3" : "#ff9800", fontWeight: 600, marginBottom: 4 }}>
                {takeAnalysis.level === "deep" ? "VISION CONTRARIANTE DETECTEE" : "VISION PARTIELLE"}
              </div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
                {takeAnalysis.level === "deep"
                  ? "Tu as un angle personnel, des exemples concrets et un raisonnement causal. C'est une these, pas une opinion. Elle deviendra un pilier de ta singularite."
                  : "Ta position est la. Mais elle manque de " + (
                    takeAnalysis.foundDepth.indexOf("contrarian") === -1 ? "contrepoint (qu'est-ce que les autres pensent a tort ?)" :
                    takeAnalysis.foundDepth.indexOf("personal") === -1 ? "vecu (qu'est-ce que TU as vu que les autres n'ont pas vu ?)" :
                    takeAnalysis.foundDepth.indexOf("causal") === -1 ? "logique causale (pourquoi c'est vrai ?)" :
                    "specificite (donne un exemple concret)."
                  )
                }
              </div>
              {takeAnalysis.foundDepth.length > 0 && (
                <div style={{ fontSize: 10, color: "#495670", marginTop: 4 }}>Marqueurs detectes : {takeAnalysis.foundDepth.join(", ")}</div>
              )}
            </div>

            {/* Pillar preview */}
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #3498db" }}>
              <div style={{ fontSize: 10, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>PILIER CANDIDAT</div>
              <div style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 700, marginBottom: 2 }}>{pillarPreview.title}</div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>{pillarPreview.desc}</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: "#8892b0", textAlign: "center", marginBottom: 12 }}>
            Cette prise de position alimentera tes piliers, tes posts et tes commentaires LinkedIn.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={function() { onForge(Object.assign({}, seed, { takeText: answer, takeAnalysis: takeAnalysis, pillarPreview: pillarPreview })); setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); setVerbDismissed(false); setCicOverride(null); }} style={{
              flex: 1, padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
            }}>Valider</button>
            <button onClick={function() { setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); }} style={{
              flex: 1, padding: 14, background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
            }}>Reformuler</button>
          </div>
        </div>
      );
    }

    var cat = CATEGORY_LABELS[seed.brickCategory];
    var elast = seed.elasticity && ELASTICITY_LABELS[seed.elasticity];
    var kpiMatch = targetRoleId ? matchKpiToReference(seed.kpi || "", targetRoleId) : null;
    var isSousPression = kpiMatch && kpiMatch.elasticity === "sous_pression";
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: seed.type === "cicatrice" ? "#ff9800" : cat ? cat.color : "#e94560", fontWeight: 600, letterSpacing: 1 }}>
              {seed.type === "cicatrice" ? "CICATRICE FORGEE" : "BRIQUE FORGEE"}
            </span>
            {cat && <span style={{ fontSize: 10, color: cat.color, background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>{cat.label}</span>}
            {elast && <span style={{ fontSize: 10, color: elast.color, background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>{elast.icon} {elast.label}</span>}
          </div>
          <div style={{ fontSize: 15, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 14 }}>&quot;{effectiveText}&quot;</div>

          {/* KPI REFERENCE MATCH — authoritative classification */}
          {kpiMatch && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid " + (isSousPression ? "#e94560" : kpiMatch.elasticity === "elastique" ? "#4ecca3" : "#8892b0") }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: isSousPression ? "#e94560" : kpiMatch.elasticity === "elastique" ? "#4ecca3" : "#8892b0", fontWeight: 600 }}>
                  {isSousPression ? "\uD83D\uDEA8 KPI SOUS PRESSION" : kpiMatch.elasticity === "elastique" ? "\u2197\uFE0F KPI ELASTIQUE" : "\u2194\uFE0F KPI STABLE"}
                </span>
                <span style={{ fontSize: 10, color: "#495670", background: "#0f3460", padding: "2px 8px", borderRadius: 8 }}>
                  {kpiMatch.name}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 4 }}>{kpiMatch.why}</div>
              {isSousPression && (
                <div style={{ background: "#e94560" + "22", borderRadius: 6, padding: 8, marginTop: 6 }}>
                  <div style={{ fontSize: 12, color: "#e94560", fontWeight: 600, lineHeight: 1.5 }}>
                    Ce KPI est automatisable. L'IA fait ca pour 0,01 euros. Si c'est ta meilleure preuve, tu negocies a la baisse. Trouve un angle elastique ou accepte que cette brique est faible.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BLUFF ALERT — elastic KPI covering a quantified cauchemar */}
          {kpiMatch && seed.kpi && (function() {
            var matchedCauchemar = CAUCHEMARS_CIBLES.filter(function(c) {
              return c.kpis.some(function(k) { return seed.kpi.indexOf(k) !== -1 || k.indexOf(seed.kpi) !== -1; });
            })[0];
            if (!matchedCauchemar) return null;
            var costStr = formatCost(matchedCauchemar.costRange[0]) + "-" + formatCost(matchedCauchemar.costRange[1]);
            var negoText = matchedCauchemar.negoFrame ? matchedCauchemar.negoFrame.replace("{cost}", costStr) : null;
            return (
              <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid " + (isSousPression ? "#e94560" : "#ff9800") }}>
                <div style={{ fontSize: 11, color: isSousPression ? "#e94560" : "#ff9800", fontWeight: 600, marginBottom: 4 }}>
                  {isSousPression ? "\uD83D\uDEA8 BLUFF CRITIQUE" : "\u26A0\uFE0F LEVIER DE NEGOCIATION"} — {matchedCauchemar.label.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 6 }}>
                  Ce cauchemar coute {costStr}{"\u20AC"}/{matchedCauchemar.costUnit} dans le secteur. {matchedCauchemar.costContext}
                </div>
                {isSousPression ? (
                  <div style={{ fontSize: 12, color: "#e94560", lineHeight: 1.5, fontWeight: 600 }}>
                    Tu couvres ce cauchemar avec un KPI automatisable. Le recruteur sait que l'IA fait ce travail. Tu es le remede avec un outil que tout le monde a. Trouve un angle elastique.
                  </div>
                ) : (
                  <div>
                    {negoText && (
                      <div style={{ fontSize: 12, color: "#4ecca3", lineHeight: 1.5, fontStyle: "italic", marginBottom: 4 }}>"{negoText}"</div>
                    )}
                    <div style={{ fontSize: 11, color: "#ff9800", lineHeight: 1.5 }}>
                      Si tu revendiques cette solution et que le probleme persiste apres ton arrivee, tu deviens la cible. Ta preuve doit etre reproductible.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* VULNERABILITY AUDIT — warns if positioned as remedy with weak proof */}
          {seed.generatedText && (function() {
            var vuln = auditBrickVulnerability({ text: seed.generatedText, corrected: false });
            if (!vuln || vuln.level === "blindee") return null;
            return (
              <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid " + vuln.color }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: vuln.color, fontWeight: 600 }}>
                    {vuln.level === "vulnerable" ? "\uD83D\uDEA8 BRIQUE VULNERABLE" : "\u26A0\uFE0F BRIQUE A BLINDER"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{vuln.msg}</div>
                {vuln.level === "vulnerable" && (
                  <div style={{ fontSize: 11, color: "#e94560", marginTop: 6, lineHeight: 1.4 }}>Corrige cette brique avant de l'archiver. Le bouton "Presque" te permet de l'enrichir.</div>
                )}
              </div>
            );
          })()}

          {/* CICATRICE — valorization without classification */}
          {seed.type === "cicatrice" && answer && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #ff9800", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>CICATRICE ASSUMEE</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Tu viens de raconter un echec. Le systeme le transforme en preuve de maturite. 95% des candidats mentent ou esquivent. Tu te separes d'eux.</div>
            </div>
          )}

          {/* ADVOCACY FRAMING — enhanced for hard questions */}
          {seed.advocacyText && (function() {
            var isHard = seed.brickCategory === "decision" || seed.brickCategory === "influence" || seed.type === "cicatrice";
            return (
              <div style={{ background: isHard ? "#0f3460" : "#1a1a2e", borderRadius: isHard ? 10 : 8, padding: isHard ? 16 : 10, borderLeft: "3px solid #4ecca3", marginBottom: 10, boxShadow: isHard ? "0 2px 12px rgba(78,204,163,0.15)" : "none" }}>
                <div style={{ fontSize: isHard ? 12 : 11, color: "#4ecca3", fontWeight: 600, marginBottom: isHard ? 8 : 4 }}>
                  {isHard ? "\uD83C\uDFAF CE QUE TON INTERVIEWEUR DIRA A SON DIRECTEUR" : "CE QUE TON INTERVIEWEUR DIRA A SON DIRECTEUR"}
                </div>
                <div style={{ fontSize: isHard ? 14 : 12, color: "#ccd6f6", lineHeight: 1.6, fontStyle: "italic" }}>"{seed.advocacyText}"</div>
                {isHard && (
                  <div style={{ background: "#4ecca3" + "15", borderRadius: 6, padding: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#4ecca3", lineHeight: 1.5 }}>
                      {seed.type === "cicatrice"
                        ? "Tu viens d'assumer un echec et de le transformer en preuve de maturite. 95% des candidats mentent ou esquivent. Tu viens de te separer d'eux."
                        : seed.brickCategory === "decision"
                        ? "Tu viens de documenter un arbitrage. C'est la preuve la plus rare en entretien. N'importe qui cite un chiffre. Personne ne montre comment il decide sous pression."
                        : "Tu viens de montrer comment tu alignes des gens qui ne veulent pas s'aligner. C'est le genre de preuve que les recruteurs n'arrivent pas a extraire en entretien. Tu l'as ecrite."
                      }
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* CADRAGE INTERNE — what your N+1 loses if you leave */}
          {seed.internalAdvocacy && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #3498db", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>CE QUE TON N+1 PERD SI TU PARS</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>{seed.internalAdvocacy}</div>
            </div>
          )}

          {/* AUDIT DE CONTROLE — bluff de l'expert */}
          {seed.controlRisk && (
            <div style={{ background: "#e94560" + "15", borderRadius: 8, padding: 10, borderLeft: "3px solid #ff9800", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>{"\u26A0\uFE0F"} AUDIT DE CONTROLE</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>{seed.controlRisk}</div>
              <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5, marginTop: 6 }}>Si tu te positionnes comme le remede et que le probleme persiste, tu deviens la cible. Ta brique doit decrire ce que TU controles, pas ce que ton equipe a fait.</div>
            </div>
          )}

          {/* CAUCHEMAR DU DECIDEUR — le probleme que tu resous */}
          {seed.nightmareText && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #e74c3c", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#e74c3c", fontWeight: 600, marginBottom: 4 }}>LE CAUCHEMAR QUE TU RESOUS</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>{seed.nightmareText}</div>
            </div>
          )}

          {/* VERB ANALYSIS — linguistic mirror with override */}
          {verbData && !verbDismissed && (verbData.foundProcess.length > 0 || verbData.foundAvoidance.length > 0) && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #9b59b6", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600 }}>TON LANGAGE</span>
                <span style={{ fontSize: 10, color: "#495670", background: "#0f3460", padding: "2px 8px", borderRadius: 8 }}>
                  {verbData.foundProcess.length + verbData.foundAvoidance.length} verbe{verbData.foundProcess.length + verbData.foundAvoidance.length > 1 ? "s" : ""} signale{verbData.foundProcess.length + verbData.foundAvoidance.length > 1 ? "s" : ""}
                </span>
              </div>
              {verbData.foundProcess.length > 0 && (
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>
                  Verbes de processus detectes : <span style={{ color: "#e94560" }}>{verbData.foundProcess.join(", ")}</span>. Le recruteur lit : role secondaire.
                </div>
              )}
              {verbData.foundAvoidance.length > 0 && (
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>
                  Verbes d'evitement detectes : <span style={{ color: "#e94560" }}>{verbData.foundAvoidance.join(", ")}</span>. Le recruteur lit : pas d'engagement.
                </div>
              )}
              {verbData.foundResult.length > 0 && (
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>
                  Verbes de resultat : <span style={{ color: "#4ecca3" }}>{verbData.foundResult.join(", ")}</span>. Le recruteur lit : acteur.
                </div>
              )}
              <button onClick={function() { setVerbDismissed(true); }} style={{
                padding: "4px 10px", fontSize: 11, background: "#0f3460", color: "#495670", border: "1px solid #495670", borderRadius: 6, cursor: "pointer", fontWeight: 600, marginTop: 4,
              }}>Ces verbes sont justifies ici</button>
            </div>
          )}
          {verbDismissed && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #495670", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#495670", fontWeight: 600 }}>LANGAGE : alerte ecartee par toi. L'IA en prend note.</div>
            </div>
          )}

          {/* SECTORAL CODE CONTRAST */}
          {seed.sectoralNote && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #3498db", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>TRADUCTION SECTORIELLE</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{seed.sectoralNote}</div>
            </div>
          )}

          {/* ELASTICITY NOTE */}
          {seed.elasticityNote && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid " + (elast ? elast.color : "#8892b0"), marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: elast ? elast.color : "#8892b0", fontWeight: 600, marginBottom: 4 }}>ELASTICITE DU MARCHE</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{seed.elasticityNote}</div>
            </div>
          )}

          {/* OMEGA NOTE */}
          {seed.omegaNote && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #ff9800", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>ATTENTION : IMPACT PERSONNEL</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{seed.omegaNote}</div>
            </div>
          )}

          {/* VERSION ANONYMISEE — transportable sans risque */}
          {seed.anonymizedText && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #95a5a6", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#95a5a6", fontWeight: 600, marginBottom: 4 }}>APERCU — VERSION TRANSPORTABLE</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>"{seed.anonymizedText}"</div>
              <div style={{ fontSize: 11, color: "#495670", marginTop: 6 }}>Tu pourras verifier et editer cette version avant archivage. L'IA detecte les elements sensibles. C'est toi qui valides.</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ background: "#1a1a2e", color: seed.type === "cicatrice" ? "#ff9800" : "#e94560", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>KPI : {seed.kpi}</span>
            {seed.skills.map(function(s) {
              return <span key={s} style={{ background: "#1a1a2e", color: "#8892b0", fontSize: 11, padding: "4px 10px", borderRadius: 20 }}>{s}</span>;
            })}
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #e94560" }}>
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 6 }}>CETTE BRIQUE ALIMENTERA :</div>
            {seed.usedIn.map(function(u, i) { return <div key={i} style={{ fontSize: 12, color: "#8892b0", marginBottom: 2 }}>{"\u2192"} {u}</div>; })}
          </div>
        </div>

        {/* THREE-WAY ACTION: Archiver / Corriger / Rejeter */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() {
            var forgedSeed = Object.assign({}, seed, { generatedText: effectiveText });
            if (seed.anonymizedText) { setAnonEdit(seed.anonymizedText); setPhase("anon_review"); }
            else { onForge(forgedSeed); setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); setVerbDismissed(false); setCicOverride(null); }
          }} style={{
            flex: 1, padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}>Archiver</button>
          <button onClick={function() { setEditText(effectiveText); setPhase("correcting"); }} style={{
            flex: 1, padding: 14, background: "#0f3460", color: "#9b59b6", border: "2px solid #9b59b6", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Corriger</button>
          <button onClick={function() { setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); setVerbDismissed(false); setCicOverride(null); }} style={{
            padding: "14px 12px", background: "#1a1a2e", color: "#495670", border: "2px solid #1a1a2e", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12,
          }}>Rejeter</button>
        </div>
      </div>
    );
  }

  var canSubmit = answer.trim().length >= 10;

  function handleSubmit() {
    if (!canSubmit) return;
    var text = answer.trim();

    // UNFAIR ADVANTAGE — straight to review, no confrontation
    if (seed.type === "unfair_advantage") {
      var verbs = analyzeVerbs(text);
      setVerbData(verbs);
      setPhase("forging");
      setTimeout(function() { setPhase("review"); }, 1500);
      return;
    }

    // TAKE TYPE — analyze depth, not numbers
    if (seed.type === "take") {
      var takeDepth = analyzeTakeDepth(text, seed.surfacePatterns);
      if (takeDepth.level === "surface") {
        setConfrontMsg("Ta reponse est celle de 90% des professionnels de ton secteur. C'est un recit dominant, pas une prise de position. Un recruteur qui lit ca ne retient rien. Creuse. Qu'est-ce que ton experience t'a montre que les articles de blog ne disent pas ?");
        setPhase("confront");
        return;
      }
      setVerbData({ takeAnalysis: takeDepth });
      setPhase("forging");
      setTimeout(function() { setPhase("review"); }, 1500);
      return;
    }

    // Blame detection for cicatrice seeds
    if (seed.blameDetection && hasBlame(text)) {
      setConfrontMsg("Tu blames le produit ou le prix. Quel etait le budget reel du prospect ? Quelle etape de qualification as-tu sautee ? C'est la que le deal s'est perdu.");
      setPhase("confront");
      return;
    }
    // Externalization detection
    if (seed.externalizeDetection && hasExternalization(text)) {
      setConfrontMsg("Tu n'as cite aucun facteur sous ton controle. Le recruteur entend : cette personne ne prend pas de responsabilite. Trouve ta part dans cet echec.");
      setPhase("confront");
      return;
    }
    // Verb analysis on the client's raw answer
    var verbs = analyzeVerbs(text);
    setVerbData(verbs);
    // Decision/influence detection — skip mission mode if markers found
    if (seed.brickCategory === "decision" || seed.brickCategory === "influence") {
      setPhase("forging");
      setTimeout(function() { setPhase("review"); }, 1500);
      return;
    }
    // For chiffre type: if answer has decision/influence markers, also forge (not mission)
    if (!hasNumbers(text) && seed.type === "preuve" && seed.brickCategory === "chiffre") {
      if (hasDecisionMarkers(text) || hasInfluenceMarkers(text)) {
        setPhase("forging");
        setTimeout(function() { setPhase("review"); }, 1500);
        return;
      }
      if (seed.missionText) {
        setPhase("forging");
        setTimeout(function() { setPhase("triage"); }, 1200);
        return;
      }
    }
    setPhase("forging");
    setTimeout(function() { setPhase("review"); }, 1500);
  }

  // Determine question label based on brick category
  var categoryLabels = { chiffre: "CHIFFRE", decision: "DECISION", influence: "INFLUENCE" };
  var qLabel = seed.type === "take" ? "PRISE DE POSITION" : seed.type === "cicatrice" ? "CICATRICE" : categoryLabels[seed.brickCategory] || "INTERROGATOIRE";

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#495670", marginBottom: 4 }}>
          <span>Question {processed.length + 1} / {seeds.length}</span>
          <span>{validated.length} brique{validated.length > 1 ? "s" : ""} {missionItems.length > 0 ? ("+ " + missionItems.length + " mission" + (missionItems.length > 1 ? "s" : "")) : ""}</span>
        </div>
        <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 6, height: 4, overflow: "hidden" }}>
          <div style={{ width: ((processed.length / seeds.length) * 100) + "%", height: "100%", background: "#e94560", borderRadius: 6, transition: "width 0.4s ease" }} />
        </div>
      </div>
      <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: seed.type === "take" ? "#3498db" : seed.type === "cicatrice" ? "#ff9800" : CATEGORY_LABELS[seed.brickCategory] ? CATEGORY_LABELS[seed.brickCategory].color : "#e94560", fontWeight: 600, letterSpacing: 1 }}>
            {qLabel} #{seed.id}
          </span>
          {seed.elasticity && ELASTICITY_LABELS[seed.elasticity] && (
            <span style={{ fontSize: 10, color: ELASTICITY_LABELS[seed.elasticity].color, background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>
              {ELASTICITY_LABELS[seed.elasticity].icon} {ELASTICITY_LABELS[seed.elasticity].label}
            </span>
          )}
        </div>
        <div style={{ fontSize: 16, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 14, fontWeight: 600 }}>{seed.question}</div>
        <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #495670" }}>
          <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 4 }}>POURQUOI CETTE QUESTION</div>
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{seed.context}</div>
        </div>
      </div>
      {/* 4-FIELD STRUCTURED INPUT — Item 1 */}
      {(function() {
        var fieldDefs = getBrickFields(seed);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
            {fieldDefs.map(function(f, i) {
              var fKey = "f" + (i + 1);
              return (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 600, marginBottom: 3 }}>{f.label}</div>
                  <input
                    value={fields[fKey] || ""}
                    onChange={function(e) {
                      var upd = Object.assign({}, fields);
                      upd[fKey] = e.target.value;
                      setFields(upd);
                      // Assemble all fields into answer for downstream compat
                      var assembled = fieldDefs.map(function(fd, j) { return upd["f" + (j + 1)] || ""; }).filter(function(v) { return v.trim().length > 0; }).join(". ") + ".";
                      setAnswer(assembled);
                    }}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: 10, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, lineHeight: 1.4, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>
              );
            })}
          </div>
        );
      })()}
      <div style={{ fontSize: 11, color: canSubmit ? "#495670" : "#e94560", marginBottom: 12, textAlign: "right" }}>
        {canSubmit ? (seed.type === "take" ? "L'IA analyse la profondeur de ta position" : seed.type === "unfair_advantage" ? "L'IA croise avec tes briques" : seed.brickCategory === "chiffre" && seed.type === "preuve" && !hasNumbers(answer) ? "Attention : pas de chiffre detecte" : "L'IA structure ta reponse") : "Remplis au moins 2 champs"}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSubmit} disabled={!canSubmit} style={{
          flex: 2, padding: 14,
          background: canSubmit ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
          color: canSubmit ? "#fff" : "#495670",
          border: "none", borderRadius: 10, cursor: canSubmit ? "pointer" : "default", fontWeight: 700, fontSize: 14,
        }}>Forger</button>
        <button onClick={function() { onSkip(seed.id); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); }} style={{
          flex: 1, padding: 14, background: "#1a1a2e", color: "#495670",
          border: "2px solid #1a1a2e", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12,
        }}>Passer</button>
      </div>
      <BricksRecap bricks={bricks} />
    </div>
  );
}

/* ==============================
   PILLARS + LOCKED
   ============================== */

function Pillars({ pillars, takes, onVal }) {
  var sel = useState([]);
  var selected = sel[0];
  var setSelected = sel[1];

  // Takes become primary pillars, AI pillars are complement
  var takePillars = takes.filter(function(t) { return t.status === "validated" && t.pillar; }).map(function(t, i) {
    return { id: "take_" + t.id, title: t.pillar.title, desc: t.pillar.desc, source: "take", depth: t.analysis ? t.analysis.level : "partial" };
  });
  var aiPillars = pillars.map(function(p) {
    return { id: "ai_" + p.id, title: p.title, desc: p.desc, source: "ai" };
  });

  function toggle(id) {
    setSelected(function(prev) {
      if (prev.includes(id)) return prev.filter(function(x) { return x !== id; });
      if (prev.length < 4) return prev.concat([id]);
      return prev;
    });
  }

  var hasTakes = takePillars.length > 0;

  return (
    <div>
      {/* TAKES — primary, from the client */}
      {hasTakes && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>TES PRISES DE POSITION</div>
          <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 12, lineHeight: 1.5 }}>
            Extraites de tes reponses. Ces piliers viennent de toi. L'IA les a structures, pas inventes. Ils pesent plus lourd que les piliers generes.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {takePillars.map(function(p) {
              var isSel = selected.includes(p.id);
              return (
                <button key={p.id} onClick={function() { toggle(p.id); }} style={{
                  background: isSel ? "#0f3460" : "#1a1a2e", border: isSel ? "2px solid #3498db" : "2px solid #16213e",
                  borderRadius: 10, padding: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isSel ? "#3498db" : "#ccd6f6" }}>{isSel ? "\u2713 " : ""}{p.title}</div>
                    <span style={{ fontSize: 9, color: p.depth === "deep" ? "#4ecca3" : "#ff9800", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>
                      {p.depth === "deep" ? "profonde" : "partielle"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#8892b0" }}>{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* AI PILLARS — complement */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>
          {hasTakes ? "PILIERS COMPLEMENTAIRES — GENERES PAR L'IA" : "PILIERS DETECTES PAR L'IA"}
        </div>
        <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 12, lineHeight: 1.5 }}>
          {hasTakes
            ? "L'IA a croise tes briques et ton secteur pour proposer des angles complementaires. Selectionne ceux qui refletent ta vision."
            : "J'ai croise tes briques et ton secteur. Tu n'as pas formule de prise de position pendant l'interrogatoire. Ces piliers sont generes. Ils servent de base, mais ils ne viennent pas de toi. Le Sprint suivant te posera la question."
          }
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {aiPillars.map(function(p) {
            var isSel = selected.includes(p.id);
            return (
              <button key={p.id} onClick={function() { toggle(p.id); }} style={{
                background: isSel ? "#0f3460" : "#1a1a2e", border: isSel ? "2px solid #e94560" : "2px solid #16213e",
                borderRadius: 10, padding: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isSel ? "#e94560" : "#ccd6f6", marginBottom: 3 }}>{isSel ? "\u2713 " : ""}{p.title}</div>
                <div style={{ fontSize: 12, color: "#8892b0" }}>{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* NO TAKES WARNING */}
      {!hasTakes && (
        <div style={{ background: "#e94560" + "15", borderRadius: 8, padding: 12, marginBottom: 16, borderLeft: "3px solid #e94560" }}>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>DIAGNOSTIC : AUCUNE PRISE DE POSITION FORMULEE</div>
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
            Tu n'as formule aucune these contrariante sur ton secteur. Les piliers ci-dessus sont generes. Ils fonctionnent, mais ils ne te separent pas des autres candidats qui utilisent l'IA pour ecrire. Au prochain Rendez-vous, le systeme te reposera la question.
          </div>
        </div>
      )}

      {selected.length >= 2 && (
        <button onClick={function() { onVal(selected.length, selected, takePillars, aiPillars); }} style={{
          width: "100%", padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>Valider {selected.length} pilier{selected.length > 1 ? "s" : ""}</button>
      )}
    </div>
  );
}

function Locked({ title, desc }) {
  return (
    <div style={{ textAlign: "center", padding: 36, opacity: 0.5 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{"\uD83D\uDD12"}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#8892b0" }}>{desc}</div>
    </div>
  );
}

/* ==============================
   SIMULATEUR DE DUEL — with word count feedback
   ============================== */

function Duel({ questions, bricks, onComplete, targetRoleId }) {
  var idxState = useState(0);
  var idx = idxState[0];
  var setIdx = idxState[1];
  var ansState = useState("");
  var answer = ansState[0];
  var setAnswer = ansState[1];
  var phState = useState("setup");
  var phase = phState[0];
  var setPhase = phState[1];
  var resultsState = useState([]);
  var results = resultsState[0];
  var setResults = resultsState[1];
  var ctxState = useState({ role: "", company: "" });
  var ctx = ctxState[0];
  var setCtx = ctxState[1];

  // Entropy states
  var crisisUsedState = useState(false);
  var crisisUsed = crisisUsedState[0];
  var setCrisisUsed = crisisUsedState[1];
  var contradictUsedState = useState(false);
  var contradictUsed = contradictUsedState[0];
  var setContradictUsed = contradictUsedState[1];
  var silenceUsedState = useState(false);
  var silenceUsed = silenceUsedState[0];
  var setSilenceUsed = silenceUsedState[1];
  var crisisAnswerState = useState("");
  var crisisAnswer = crisisAnswerState[0];
  var setCrisisAnswer = crisisAnswerState[1];
  var contradictAnswerState = useState("");
  var contradictAnswer = contradictAnswerState[0];
  var setContradictAnswer = contradictAnswerState[1];
  var silenceAnswerState = useState("");
  var silenceAnswer = silenceAnswerState[0];
  var setSilenceAnswer = silenceAnswerState[1];
  var activeCrisisState = useState(null);
  var activeCrisis = activeCrisisState[0];
  var setActiveCrisis = activeCrisisState[1];
  var activeContradictState = useState("");
  var activeContradict = activeContradictState[0];
  var setActiveContradict = activeContradictState[1];
  var entropyLogState = useState([]);
  var entropyLog = entropyLogState[0];
  var setEntropyLog = entropyLogState[1];

  // Determine which entropy event fires after a given question index
  function shouldFireCrisis() { return !crisisUsed && idx >= 1 && idx <= 3 && Math.random() < 0.5; }
  function shouldFireContradict() { return !contradictUsed && idx >= 0 && idx <= 3 && Math.random() < 0.4; }
  function shouldFireSilence() { return !silenceUsed && idx >= 1 && idx <= 3 && Math.random() < 0.35; }

  function analyzeCrisisResponse(text, crisis) {
    var lower = text.toLowerCase();
    var extCount = 0; var recCount = 0;
    crisis.diagnostic.externalize.forEach(function(m) { if (lower.indexOf(m) !== -1) extCount++; });
    crisis.diagnostic.recadre.forEach(function(m) { if (lower.indexOf(m) !== -1) recCount++; });
    if (recCount > extCount) return { verdict: "recadrage", color: "#4ecca3", msg: "Tu as recadre sur ta valeur. Reflexe de positionnement." };
    if (extCount > recCount) return { verdict: "externalisation", color: "#ff9800", msg: "Tu as externalise. Le recruteur lit : cette personne subit les evenements au lieu de les cadrer." };
    return { verdict: "neutre", color: "#8892b0", msg: "Reponse neutre. Ni externalisation ni recadrage clair. En entretien, l'absence de positionnement est un positionnement : celui du suiveur." };
  }

  if (phase === "setup") {
    var canBegin = ctx.role.trim().length > 2 && ctx.company.trim().length > 2;
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{"\u2694\uFE0F"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>Simulateur de Duel</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>
            Les questions qui te feront tomber si tu n'es pas prepare. Avec des surprises.
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>Ton interlocuteur</div>
          <input value={ctx.role} onChange={function(e) { setCtx(Object.assign({}, ctx, { role: e.target.value })); }}
            placeholder="Ex : VP Sales, Head of Revenue, DRH..."
            style={{ width: "100%", padding: 12, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }}
          />
          <input value={ctx.company} onChange={function(e) { setCtx(Object.assign({}, ctx, { company: e.target.value })); }}
            placeholder="Ex : Pennylane, Payfit, Qonto..."
            style={{ width: "100%", padding: 12, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>
        <button onClick={function() { if (canBegin) setPhase("discovery"); }} disabled={!canBegin} style={{
          width: "100%", padding: 14,
          background: canBegin ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
          color: canBegin ? "#fff" : "#495670",
          border: canBegin ? "none" : "2px solid #16213e",
          borderRadius: 10, cursor: canBegin ? "pointer" : "default", fontWeight: 700, fontSize: 14,
        }}>Lancer le Duel</button>
      </div>
    );
  }

  // DISCOVERY PHASE — Item 3: teach the client to ask before answering
  if (phase === "discovery") {
    var discoveryQs = {
      enterprise_ae: "Quels sont les enjeux de croissance principaux de votre equipe cette annee ?",
      head_of_growth: "Quel canal d'acquisition vous preoccupe le plus en ce moment ?",
      strategic_csm: "Quel est le segment de clients qui genere le plus de friction aujourd'hui ?",
      senior_pm: "Quel est l'arbitrage produit le plus difficile que l'equipe n'a pas encore tranche ?",
      ai_architect: "Quel cas d'usage IA est bloque depuis le plus longtemps ?",
      engineering_manager: "Quel est le frein technique que l'equipe n'arrive pas a debloquer ?",
      management_consultant: "Quel est le probleme qui a declenche ce recrutement ?",
      strategy_associate: "Quelle decision strategique attend des donnees que personne ne produit ?",
      operations_manager: "Quelle friction inter-equipes consomme le plus de temps ?",
      fractional_coo: "Qu'est-ce que le CEO ne devrait plus faire lui-meme dans 6 mois ?",
    };
    var roleDiscovery = discoveryQs[targetRoleId] || "Avant que je deroule mon parcours, quels sont vos enjeux cles sur ce poste ?";
    var altDiscovery = "Quelle partie de mon parcours voulez-vous que je developpe en priorite ?";
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #3498db" }}>
          <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>COACHING PRE-DUEL</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#ccd6f6", marginBottom: 12 }}>Avant de repondre, pose une question.</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.7, marginBottom: 16 }}>
            Le piege le plus courant des profils seniors : le monologue. Tu racontes pendant 6 minutes. Le recruteur decroche apres 90 secondes. Pas parce que tu es mauvais. Parce que tu n'as pas calibre.
          </div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.7, marginBottom: 16 }}>
            Avant chaque reponse, pose une de ces questions au recruteur. Il te donnera la cible. Tu reponds avec la brique qui matche. Chaque mot que tu prononces est pertinent parce qu'il l'a demande.
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>QUESTION DISCOVERY (adaptee a ton role)</div>
            <div style={{ fontSize: 14, color: "#ccd6f6", fontStyle: "italic", lineHeight: 1.5 }}>"{roleDiscovery}"</div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>CADRAGE D'ATTENTION</div>
            <div style={{ fontSize: 14, color: "#ccd6f6", fontStyle: "italic", lineHeight: 1.5 }}>"{altDiscovery}"</div>
          </div>
          <div style={{ fontSize: 12, color: "#495670", lineHeight: 1.5, marginTop: 12 }}>
            Un vrai senior n'est pas celui qui en dit le plus. C'est celui qui ecoute, cible, et articule son vecu autour du probleme de l'autre.
          </div>
        </div>
        <button onClick={function() { setPhase("question"); }} style={{
          width: "100%", padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)",
          color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>J'ai compris. Lancer le Duel {"\u2192"}</button>
      </div>
    );
  }

  if (phase === "done") {
    var answered = results.filter(function(r) { return r.answer; });
    var crisisEvents = entropyLog.filter(function(e) { return e.type === "crisis"; });
    var contradictEvents = entropyLog.filter(function(e) { return e.type === "contradiction"; });
    var silenceEvents = entropyLog.filter(function(e) { return e.type === "silence"; });
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{"\uD83D\uDEE1\uFE0F"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>Duel termine.</div>
          <div style={{ fontSize: 13, color: "#8892b0" }}>{answered.length} reponse{answered.length > 1 ? "s" : ""} forgee{answered.length > 1 ? "s" : ""}. {entropyLog.length} evenement{entropyLog.length > 1 ? "s" : ""} imprevu{entropyLog.length > 1 ? "s" : ""}.</div>
        </div>
        {results.map(function(r, i) {
          return (
            <div key={i} style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginBottom: 8, borderLeft: r.answer ? "3px solid #e94560" : "3px solid #495670" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>{r.answer ? "\uD83D\uDEE1\uFE0F" : "\u26A0\uFE0F"} {r.question}</div>
              {r.answer && <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{r.answer}</div>}
              {!r.answer && <div style={{ fontSize: 12, color: "#e94560" }}>Faille ouverte.</div>}
              {r.wordWarning && <div style={{ fontSize: 11, color: "#ff9800", marginTop: 4 }}>{r.wordWarning}</div>}
            </div>
          );
        })}
        {/* ENTROPY EVENTS RECAP */}
        {entropyLog.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>{"\u26A1"} EVENEMENTS IMPREVUS ({entropyLog.length})</div>
            {entropyLog.map(function(ev, i) {
              var typeLabel = ev.type === "crisis" ? "\uD83D\uDEA8 Crise" : ev.type === "contradiction" ? "\u2694\uFE0F Contradiction" : "\uD83E\uDD10 Silence";
              return (
                <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: "3px solid " + ev.color }}>
                  <div style={{ fontSize: 11, color: ev.color, fontWeight: 600, marginBottom: 4 }}>{typeLabel}</div>
                  <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.4, marginBottom: 4 }}>{ev.scenario}</div>
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.4, marginBottom: 4 }}>Ta reponse : "{ev.answer}"</div>
                  <div style={{ fontSize: 11, color: ev.color, lineHeight: 1.4 }}>{ev.diagnostic}</div>
                </div>
              );
            })}
          </div>
        )}
        <button onClick={function() { onComplete(results); }} style={{
          width: "100%", marginTop: 16, padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)",
          color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>Terminer le Sprint</button>
      </div>
    );
  }

  var q = questions[idx];

  if (phase === "analyzing") {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>{"\uD83E\uDDE0"}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>Confrontation brique vs reponse...</div>
      </div>
    );
  }

  // === CRISIS INTERRUPTION ===
  if (phase === "crisis_intro") {
    return (
      <div style={{ textAlign: "center", padding: "30px 10px" }}>
        <div style={{ fontSize: 40, marginBottom: 16, animation: "pulse 1s infinite" }}>{"\uD83D\uDEA8"}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e94560", marginBottom: 8 }}>INTERRUPTION</div>
        <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, marginBottom: 16 }}>{activeCrisis.trigger}</div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, borderLeft: "3px solid #e94560" }}>
          <div style={{ fontSize: 15, color: "#ccd6f6", lineHeight: 1.6, fontStyle: "italic" }}>"{activeCrisis.scenario}"</div>
        </div>
        <textarea value={crisisAnswer} onChange={function(e) { setCrisisAnswer(e.target.value); }}
          placeholder="Tu n'as pas prepare ca. Reponds."
          style={{ width: "100%", minHeight: 80, padding: 14, background: "#1a1a2e", border: "2px solid #e94560", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginTop: 16, marginBottom: 4 }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={function() {
            if (crisisAnswer.trim().length < 10) return;
            var diag = analyzeCrisisResponse(crisisAnswer, activeCrisis);
            setEntropyLog(function(prev) { return prev.concat([{ type: "crisis", scenario: activeCrisis.scenario, answer: crisisAnswer.trim(), diagnostic: diag.msg, color: diag.color }]); });
            setPhase("crisis_debrief");
          }} disabled={crisisAnswer.trim().length < 10} style={{
            flex: 1, padding: 14,
            background: crisisAnswer.trim().length >= 10 ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
            color: crisisAnswer.trim().length >= 10 ? "#fff" : "#495670",
            border: "none", borderRadius: 10, cursor: crisisAnswer.trim().length >= 10 ? "pointer" : "default", fontWeight: 700, fontSize: 14,
          }}>Soumettre</button>
        </div>
      </div>
    );
  }

  if (phase === "crisis_debrief") {
    var lastCrisisLog = entropyLog[entropyLog.length - 1];
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid " + (lastCrisisLog ? lastCrisisLog.color : "#8892b0") }}>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>{"\uD83D\uDEA8"} DIAGNOSTIC DE CRISE</div>
          <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 10 }}>{lastCrisisLog ? lastCrisisLog.diagnostic : ""}</div>
          <div style={{ fontSize: 12, color: "#495670", lineHeight: 1.5 }}>En entretien, les crises arrivent. Le recruteur pose une mine pour voir comment tu reagis sous pression. Ce n'etait pas prevu. C'est le point.</div>
        </div>
        <button onClick={function() { setCrisisAnswer(""); setPhase("feedback"); }} style={{
          width: "100%", padding: 14, background: "#0f3460", color: "#ccd6f6",
          border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>Retour a la question {"\u2192"}</button>
      </div>
    );
  }

  // === CONTRADICTORY FOLLOW-UP ===
  if (phase === "contradiction") {
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #9b59b6" }}>
          <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>{"\u2694\uFE0F"} RELANCE CONTRADICTOIRE</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.5, marginBottom: 12 }}>Le recruteur ne passe pas a la question suivante. Il te regarde et dit :</div>
          <div style={{ fontSize: 15, color: "#ccd6f6", lineHeight: 1.6, fontStyle: "italic" }}>"{activeContradict}"</div>
        </div>
        <textarea value={contradictAnswer} onChange={function(e) { setContradictAnswer(e.target.value); }}
          placeholder="Defends ta position ou nuance-la."
          style={{ width: "100%", minHeight: 80, padding: 14, background: "#1a1a2e", border: "2px solid #9b59b6", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 4 }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={function() {
            if (contradictAnswer.trim().length < 10) return;
            var lower = contradictAnswer.trim().toLowerCase();
            var defends = lower.indexOf("je maintiens") !== -1 || lower.indexOf("les chiffres") !== -1 || lower.indexOf("la preuve") !== -1 || lower.indexOf("je confirme") !== -1 || lower.indexOf("mesurable") !== -1;
            var nuances = lower.indexOf("c'est vrai que") !== -1 || lower.indexOf("effectivement") !== -1 || lower.indexOf("je reconnais") !== -1 || lower.indexOf("en partie") !== -1;
            var folds = lower.indexOf("vous avez raison") !== -1 || lower.indexOf("je comprends") !== -1 || lower.indexOf("peut-etre") !== -1;
            var diagMsg = defends ? "Tu as tenu ta position avec des faits. Le recruteur respecte la solidite." : nuances ? "Tu as nuance intelligemment. Le recruteur voit de la maturite." : folds ? "Tu as plie. Le recruteur lit : cette personne doute de ses propres resultats." : "Reponse lue. En entretien, la contradiction teste si tu crois a tes propres chiffres.";
            var diagColor = defends ? "#4ecca3" : nuances ? "#3498db" : folds ? "#e94560" : "#8892b0";
            setEntropyLog(function(prev) { return prev.concat([{ type: "contradiction", scenario: activeContradict, answer: contradictAnswer.trim(), diagnostic: diagMsg, color: diagColor }]); });
            setContradictAnswer("");
            setPhase("feedback");
          }} disabled={contradictAnswer.trim().length < 10} style={{
            flex: 1, padding: 14,
            background: contradictAnswer.trim().length >= 10 ? "linear-gradient(135deg, #9b59b6, #8e44ad)" : "#1a1a2e",
            color: contradictAnswer.trim().length >= 10 ? "#fff" : "#495670",
            border: "none", borderRadius: 10, cursor: contradictAnswer.trim().length >= 10 ? "pointer" : "default", fontWeight: 700, fontSize: 14,
          }}>Repondre</button>
        </div>
      </div>
    );
  }

  // === TACTICAL SILENCE ===
  if (phase === "silence_wait") {
    setTimeout(function() { setPhase("silence_challenge"); }, 4000);
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 24 }}>{"\uD83E\uDD10"}</div>
        <div style={{ fontSize: 24, color: "#495670", letterSpacing: 4 }}>...</div>
      </div>
    );
  }

  if (phase === "silence_challenge") {
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #ff9800" }}>
          <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>{"\uD83E\uDD10"} SILENCE TACTIQUE</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.5, marginBottom: 12 }}>Le recruteur te regarde. Pause de 4 secondes. Puis :</div>
          <div style={{ fontSize: 16, color: "#ccd6f6", fontWeight: 600 }}>"C'est tout ?"</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() {
            setEntropyLog(function(prev) { return prev.concat([{ type: "silence", scenario: "C'est tout ?", answer: "J'ai tenu ma position.", diagnostic: "Tu as tenu ta reponse. Conviction affichee. Le recruteur note : cette personne ne doute pas de ce qu'elle dit.", color: "#4ecca3" }]); });
            setSilenceUsed(true);
            setPhase("feedback");
          }} style={{
            flex: 1, padding: 14, background: "#0f3460", color: "#4ecca3",
            border: "2px solid #4ecca3", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Oui. C'est ma reponse.</button>
          <button onClick={function() { setPhase("silence_complete"); }} style={{
            flex: 1, padding: 14, background: "#0f3460", color: "#ff9800",
            border: "2px solid #ff9800", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Non, je complete...</button>
        </div>
      </div>
    );
  }

  if (phase === "silence_complete") {
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, borderLeft: "3px solid #ff9800" }}>
          <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>TU COMPLETES</div>
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Tu as choisi de completer. Le recruteur ecoute. Mais il a note que tu as doute de ta premiere reponse.</div>
        </div>
        <textarea value={silenceAnswer} onChange={function(e) { setSilenceAnswer(e.target.value); }}
          placeholder="Ce que tu ajoutes..."
          style={{ width: "100%", minHeight: 70, padding: 14, background: "#1a1a2e", border: "2px solid #ff9800", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }}
        />
        <button onClick={function() {
          if (silenceAnswer.trim().length < 5) return;
          var hasNewInfo = silenceAnswer.trim().split(/\s+/).length > 10;
          var diagMsg = hasNewInfo ? "Tu as ajoute du contenu substantiel. Le recruteur lit : cette personne approfondit sous pression. Positif." : "Tu as ajoute peu. Le recruteur lit : doute sur la premiere reponse, mais rien de neuf. Negatif.";
          var diagColor = hasNewInfo ? "#3498db" : "#ff9800";
          setEntropyLog(function(prev) { return prev.concat([{ type: "silence", scenario: "C'est tout ? (complete)", answer: silenceAnswer.trim(), diagnostic: diagMsg, color: diagColor }]); });
          setSilenceUsed(true);
          setSilenceAnswer("");
          setPhase("feedback");
        }} disabled={silenceAnswer.trim().length < 5} style={{
          width: "100%", padding: 14,
          background: silenceAnswer.trim().length >= 5 ? "#0f3460" : "#1a1a2e",
          color: silenceAnswer.trim().length >= 5 ? "#ccd6f6" : "#495670",
          border: "2px solid #ff9800", borderRadius: 10, cursor: silenceAnswer.trim().length >= 5 ? "pointer" : "default", fontWeight: 700, fontSize: 14,
        }}>Soumettre le complement</button>
      </div>
    );
  }

  if (phase === "feedback") {
    var lastResult = results[results.length - 1];
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>ANALYSE DE TA REPONSE</div>
          {lastResult && lastResult.wordWarning && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid #ff9800" }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>LONGUEUR</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{lastResult.wordWarning}</div>
            </div>
          )}
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 12, borderLeft: "3px solid #e94560" }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>LE PIEGE</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{q.danger}</div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, borderLeft: "3px solid #4ecca3" }}>
            <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 600, marginBottom: 4 }}>L'ANGLE RECOMMANDE</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{q.idealAngle}</div>
          </div>

          {/* ROLE MIRROR FEEDBACK — Item 3 */}
          {lastResult && lastResult.wordWarning && (function() {
            var roleMirrors = {
              enterprise_ae: "En poste, tu laisserais le client driver le deal. Le prospect decroche apres 90 secondes.",
              head_of_growth: "En poste, tu noierais le board dans les metriques au lieu de montrer le levier.",
              strategic_csm: "En poste, ton QBR durerait 45 minutes au lieu de 15. Le client decroche.",
              senior_pm: "En poste, tu presenterais une roadmap sans hierarchie. L'equipe ne sait pas par ou commencer.",
              ai_architect: "En poste, tu expliquerais le modele pendant 20 minutes. Le CPO veut le cas d'usage en 2.",
              engineering_manager: "En poste, ton equipe attendrait 3 minutes de contexte avant chaque decision.",
              management_consultant: "En poste, ton slide deck ferait 80 pages au lieu de 3.",
              strategy_associate: "En poste, ton memo serait un rapport. Le Comex veut une recommandation en 1 page.",
              operations_manager: "En poste, tes meetings dureraient le double. L'equipe perdrait confiance.",
              fractional_coo: "En poste, le CEO te demanderait de synthetiser et tu donnerais un audit.",
            };
            var mirror = roleMirrors[targetRoleId] || "En poste, tu prendrais trop de temps a arriver au point. Le decideur decroche.";
            return (
              <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginTop: 10, borderLeft: "3px solid #9b59b6" }}>
                <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600, marginBottom: 4 }}>MIROIR DE POSTE</div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{mirror}</div>
              </div>
            );
          })()}
        </div>
        <button onClick={function() {
          var next = idx + 1;
          if (next >= questions.length) { setPhase("done"); }
          else { setIdx(next); setPhase("question"); setAnswer(""); }
        }} style={{
          width: "100%", padding: 14, background: "#0f3460", color: "#ccd6f6",
          border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>{idx + 1 >= questions.length ? "Voir le bilan" : "Question suivante"} {"\u2192"}</button>
      </div>
    );
  }

  var canAnswer = answer.trim().length >= 10;
  var wordCount = answer.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;

  function handleDuelSubmit() {
    if (!canAnswer) return;
    var warning = null;
    if (wordCount > 80) warning = "Ta reponse fait " + wordCount + " mots. En entretien, tu perds ton interlocuteur apres 60. Condense.";
    setResults(function(prev) { return prev.concat([{ question: q.question, answer: answer.trim(), brickRef: q.brickRef, wordWarning: warning }]); });

    // Entropy roll — only one event per submission, priority: crisis > silence > contradiction
    if (shouldFireCrisis()) {
      var crisis = DUEL_CRISES[Math.floor(Math.random() * DUEL_CRISES.length)];
      setActiveCrisis(crisis);
      setCrisisUsed(true);
      setPhase("crisis_intro");
      return;
    }
    if (shouldFireSilence()) {
      setSilenceUsed(true);
      setPhase("silence_wait");
      return;
    }
    if (shouldFireContradict()) {
      var contradict = DUEL_CONTRADICTIONS[Math.floor(Math.random() * DUEL_CONTRADICTIONS.length)];
      setActiveContradict(contradict);
      setContradictUsed(true);
      setPhase("contradiction");
      return;
    }

    setPhase("analyzing");
    setTimeout(function() { setPhase("feedback"); }, 1200);
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#495670", marginBottom: 4 }}>
          <span>Duel : {ctx.role} @ {ctx.company}</span>
          <span>Question {idx + 1}/{questions.length}</span>
        </div>
        <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 6, height: 4, overflow: "hidden" }}>
          <div style={{ width: ((idx / questions.length) * 100) + "%", height: "100%", background: "#e94560", borderRadius: 6, transition: "width 0.4s ease" }} />
        </div>
      </div>
      <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#e94560", background: "#1a1a2e", padding: "3px 8px", borderRadius: 10, fontWeight: 600, display: "inline-block", marginBottom: 10 }}>{q.intent}</div>
        <div style={{ fontSize: 16, color: "#ccd6f6", lineHeight: 1.6, fontWeight: 600, marginBottom: 10 }}>&quot;{q.question}&quot;</div>
        <div style={{ fontSize: 11, color: "#495670" }}>Brique visee : {q.brickRef}</div>
      </div>
      <textarea value={answer} onChange={function(e) { setAnswer(e.target.value); }}
        placeholder="Reponds comme en entretien."
        style={{ width: "100%", minHeight: 90, padding: 14, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 4 }}
      />
      <div style={{ fontSize: 11, color: wordCount > 80 ? "#ff9800" : "#495670", marginBottom: 12, textAlign: "right" }}>
        {wordCount} mot{wordCount > 1 ? "s" : ""}{wordCount > 80 ? " \u2014 trop long pour un entretien" : ""}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleDuelSubmit} disabled={!canAnswer} style={{
          flex: 2, padding: 14,
          background: canAnswer ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
          color: canAnswer ? "#fff" : "#495670",
          border: "none", borderRadius: 10, cursor: canAnswer ? "pointer" : "default", fontWeight: 700, fontSize: 14,
        }}>Soumettre</button>
        <button onClick={function() {
          setResults(function(prev) { return prev.concat([{ question: q.question, answer: null, brickRef: q.brickRef, wordWarning: null }]); });
          var next = idx + 1;
          if (next >= questions.length) { setPhase("done"); }
          else { setIdx(next); setAnswer(""); }
        }} style={{
          flex: 1, padding: 14, background: "#1a1a2e", color: "#495670",
          border: "2px solid #1a1a2e", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12,
        }}>Passer</button>
      </div>
    </div>
  );
}

/* ==============================
   IMPACT REPORT PANEL — visual component (Option 1)
   ============================== */

function ImpactReportPanel({ bricks, vault, targetRoleId, trajectoryToggle }) {
  var sectionSt = useState(null);
  var openSection = sectionSt[0];
  var setOpenSection = sectionSt[1];

  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var takes = bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; });
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var density = computeDensityScore(bricks);

  var chiffreBricks = validated.filter(function(b) { return b.brickCategory === "chiffre"; });
  var decisionBricks = validated.filter(function(b) { return b.brickCategory === "decision"; });
  var influenceBricks = validated.filter(function(b) { return b.brickCategory === "influence"; });
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "elastique"; });
  var missions = bricks.filter(function(b) { return b.type === "mission"; });

  var coverage = computeCauchemarCoverage(bricks);
  var coveredCount = coverage.filter(function(c) { return c.covered; }).length;
  var zones = computeZones(bricks, targetRoleId);
  var unfairBrick = bricks.find(function(b) { return b.type === "unfair_advantage" && b.status === "validated"; });

  var copyText = generateImpactReport(bricks, vault, targetRoleId, trajectoryToggle, density);

  var sBox = { background: "#1a1a2e", borderRadius: 8, padding: "10px 12px", marginBottom: 8 };
  var sHead = { fontSize: 10, color: "#495670", fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" };

  function toggle(id) { setOpenSection(openSection === id ? null : id); }

  return (
    <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 14 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Rapport d'impact</div>
          <div style={{ fontSize: 11, color: "#495670", marginTop: 2 }}>
            {roleData ? roleData.role : "Non defini"} {"\u00B7"} {trajectoryToggle === "j_y_suis" ? "J'y suis" : "J'y vais"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6" }}>{density ? density.score : 0}%</div>
          <div style={{ fontSize: 10, color: "#495670" }}>densite</div>
        </div>
      </div>

      {/* DENSITY BAR */}
      <div style={{ width: "100%", background: "#16213e", borderRadius: 4, height: 4, marginBottom: 16 }}>
        <div style={{ width: Math.min(100, density ? density.score : 0) + "%", height: "100%", background: "#ccd6f6", borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>

      {/* ARSENAL COMPACT */}
      <div style={sBox}>
        <div style={sHead}>Arsenal</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {chiffreBricks.length > 0 && <div style={{ fontSize: 12, color: "#ccd6f6" }}>{chiffreBricks.length} chiffre{chiffreBricks.length > 1 ? "s" : ""}</div>}
          {decisionBricks.length > 0 && <div style={{ fontSize: 12, color: "#ccd6f6" }}>{decisionBricks.length} decision{decisionBricks.length > 1 ? "s" : ""}</div>}
          {influenceBricks.length > 0 && <div style={{ fontSize: 12, color: "#ccd6f6" }}>{influenceBricks.length} influence{influenceBricks.length > 1 ? "s" : ""}</div>}
          {cicatrices.length > 0 && <div style={{ fontSize: 12, color: "#ccd6f6" }}>{cicatrices.length} cicatrice{cicatrices.length > 1 ? "s" : ""}</div>}
          {takes.length > 0 && <div style={{ fontSize: 12, color: "#ccd6f6" }}>{takes.length} take{takes.length > 1 ? "s" : ""}</div>}
          {missions.length > 0 && <div style={{ fontSize: 12, color: "#e94560" }}>{missions.length} mission{missions.length > 1 ? "s" : ""}</div>}
        </div>
        {elasticBricks.length > 0 && (
          <div style={{ fontSize: 11, color: "#8892b0", marginTop: 6 }}>{elasticBricks.length} brique{elasticBricks.length > 1 ? "s" : ""} sur marche elastique</div>
        )}
      </div>

      {/* CAUCHEMARS */}
      <div style={sBox}>
        <button onClick={function() { toggle("cauchemars"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={sHead}>Cauchemars couverts</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>{coveredCount}/{CAUCHEMARS_CIBLES.length}</span>
          </div>
        </button>
        {coverage.map(function(c) {
          var cauch = CAUCHEMARS_CIBLES.find(function(cc) { return cc.id === c.id; });
          var isOpen = openSection === "cauchemars";
          return (
            <div key={c.id} style={{ marginBottom: 6, paddingLeft: 8, borderLeft: c.covered ? "2px solid #495670" : "2px solid #e94560" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: c.covered ? "#ccd6f6" : "#e94560" }}>{c.label}</div>
                <div style={{ fontSize: 10, color: c.covered ? "#495670" : "#e94560" }}>{c.covered ? "couvert" : "trou"}</div>
              </div>
              {isOpen && c.covered && cauch && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: "#8892b0" }}>Direct : {formatCost(cauch.costRange[0])}-{formatCost(cauch.costRange[1])}/an</div>
                  {cauch.costSymbolique && <div style={{ fontSize: 11, color: "#495670", marginTop: 2 }}>Symbolique : {cauch.costSymbolique}</div>}
                  {cauch.costSystemique && <div style={{ fontSize: 11, color: "#495670", marginTop: 2 }}>Systemique : {cauch.costSystemique}</div>}
                </div>
              )}
              {isOpen && !c.covered && (
                <div style={{ fontSize: 11, color: "#e94560", marginTop: 2 }}>Aucune brique ne couvre ce cauchemar. Le recruteur controlera cette zone.</div>
              )}
            </div>
          );
        })}
        {openSection !== "cauchemars" && <div style={{ fontSize: 10, color: "#495670", marginTop: 4 }}>Appuie pour voir le detail des couts</div>}
      </div>

      {/* ZONES */}
      {zones && (zones.excellence.length > 0 || zones.rupture.length > 0) && (
        <div style={sBox}>
          <div style={sHead}>Cartographie</div>
          {zones.excellence.length > 0 && (
            <div style={{ marginBottom: zones.rupture.length > 0 ? 10 : 0 }}>
              <div style={{ fontSize: 11, color: "#8892b0", marginBottom: 4 }}>EXCELLENCE</div>
              {zones.excellence.map(function(z) {
                return (
                  <div key={z.kpi} style={{ paddingLeft: 8, borderLeft: "2px solid #495670", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: "#ccd6f6" }}>{z.kpi}</div>
                    <div style={{ fontSize: 10, color: "#495670" }}>{z.brickCount} preuves ({z.types.join(" + ")})</div>
                  </div>
                );
              })}
            </div>
          )}
          {zones.rupture.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "#e94560", marginBottom: 4 }}>RUPTURE</div>
              {zones.rupture.map(function(z) {
                return (
                  <div key={z.kpi} style={{ paddingLeft: 8, borderLeft: "2px solid #e94560", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: "#e94560" }}>{z.kpi}</div>
                    <div style={{ fontSize: 10, color: "#495670" }}>{z.reason}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PROFIL DE VALEUR — 9 GRID */}
      {zones && zones.profileGrid.length > 0 && (
        <div style={sBox}>
          <button onClick={function() { toggle("profil"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={sHead}>Profil de valeur</div>
              <span style={{ fontSize: 12, color: "#ccd6f6" }}>
                {zones.profileGrid.filter(function(p) { return p.checked; }).length}/{zones.profileGrid.length}
              </span>
            </div>
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {zones.profileGrid.map(function(p) {
              return (
                <div key={p.label} style={{ display: "flex", gap: 6, alignItems: "flex-start", padding: "4px 0" }}>
                  <span style={{ fontSize: 11, color: p.checked ? "#ccd6f6" : "#e94560", flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{p.checked ? "\u25CF" : "\u25CB"}</span>
                  <div>
                    <div style={{ fontSize: 11, color: p.checked ? "#ccd6f6" : "#495670" }}>{p.label}</div>
                    {openSection === "profil" && p.checked && p.proof && (
                      <div style={{ fontSize: 10, color: "#495670" }}>{p.proof}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {openSection !== "profil" && (
            <div style={{ fontSize: 10, color: "#495670", marginTop: 4 }}>Appuie pour voir les preuves</div>
          )}
        </div>
      )}

      {/* AVANTAGE INJUSTE */}
      {unfairBrick && (
        <div style={sBox}>
          <div style={sHead}>Avantage injuste</div>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>{unfairBrick.text}</div>
          {elasticBricks.some(function(eb) { return eb.kpi === unfairBrick.kpi; }) && (
            <div style={{ fontSize: 10, color: "#8892b0", marginTop: 4 }}>Confirme par brique chiffre + signal collegues. Non-rattrapable par la formation.</div>
          )}
        </div>
      )}

      {/* TAKES */}
      {takes.length > 0 && (
        <div style={sBox}>
          <div style={sHead}>Prises de position ({takes.length})</div>
          {takes.map(function(t, i) {
            return <div key={i} style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.4, marginBottom: 4 }}>{t.text.length > 80 ? t.text.slice(0, 80) + "..." : t.text}</div>;
          })}
        </div>
      )}

      {/* NEXT RDV */}
      <div style={{ fontSize: 11, color: "#495670", marginTop: 8, marginBottom: 12 }}>
        Prochain Rendez-vous : {roleData ? roleData.cadenceLabel : "dans 30 jours"}. Ce rapport s'epaissit a chaque iteration.
      </div>

      {/* COPY — Option 2 structured text */}
      <CopyBtn text={copyText} label="Copier le rapport complet" />
    </div>
  );
}

/* ==============================
   DELIVERABLE COMPONENTS
   ============================== */

function Deliverable({ emoji, title, content, lines }) {
  var st = useState(false);
  var open = st[0];
  var setOpen = st[1];
  var rows = content.split("\n");
  var preview = rows.slice(0, lines || 3).join("\n");
  var hasMore = rows.length > (lines || 3);
  return (
    <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 10, border: "1px solid #16213e" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>{title}</span>
        </div>
        <CopyBtn text={content} />
      </div>
      <div style={{
        background: "#1a1a2e", borderRadius: 8, padding: 12, fontSize: 12, color: "#8892b0", lineHeight: 1.6,
        whiteSpace: "pre-wrap", fontFamily: "inherit", maxHeight: open ? "none" : 100, overflow: "hidden", position: "relative",
      }}>
        {open ? content : preview}
        {!open && hasMore && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(transparent, #1a1a2e)" }} />}
      </div>
      {hasMore && (
        <button onClick={function() { setOpen(!open); }} style={{
          background: "none", border: "none", color: "#e94560", fontSize: 11, fontWeight: 600, cursor: "pointer", marginTop: 6, padding: 0,
        }}>{open ? "\u25B2 Reduire" : "\u25BC Voir tout"}</button>
      )}
    </div>
  );
}

function PositionCard({ pos, idx }) {
  return (
    <div style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginBottom: 8, border: "1px solid #16213e", borderLeft: "3px solid " + (pos.pillarSource === "take" ? "#3498db" : "#e94560") }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6" }}>{"\u270D\uFE0F"} Prise de position #{idx + 1}</div>
          {pos.pillarSource && <span style={{ fontSize: 9, color: pos.pillarSource === "take" ? "#3498db" : "#e94560", background: "#1a1a2e", padding: "2px 6px", borderRadius: 6 }}>{pos.pillarSource === "take" ? "take" : "IA"}</span>}
        </div>
        <CopyBtn text={pos.title + "\n\n" + pos.text} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: pos.pillarSource === "take" ? "#3498db" : "#e94560", marginBottom: 6 }}>{pos.title}</div>
      <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-line" }}>{pos.text}</div>
    </div>
  );
}

/* ==============================
   END SCREEN
   ============================== */

/* ITERATION 4 — Signal Field Component */
function SignalField({ bricks, targetRoleId }) {
  var inputSt = useState("");
  var signalInput = inputSt[0];
  var setSignalInput = inputSt[1];
  var resultSt = useState(null);
  var result = resultSt[0];
  var setResult = resultSt[1];

  function handleGenerate() {
    if (signalInput.trim().length < 10) return;
    var sigType = detectSignalType(signalInput);
    var script = generateSignalScript(signalInput, sigType, bricks, targetRoleId);
    setResult({ type: sigType, script: script });
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 10 }}>
        Tu as repere un signal ? Levee de fonds, recrutement, depart d'un dirigeant, expansion. Colle-le ici. Le systeme croise avec ton Coffre-Fort et genere un script d'approche.
      </div>
      <textarea
        value={signalInput}
        onChange={function(e) { setSignalInput(e.target.value); }}
        placeholder="Ex : L'entreprise X vient de lever 15M en Serie B et recrute 3 AE..."
        style={{
          width: "100%", minHeight: 80, padding: 12, background: "#1a1a2e", border: "2px solid #16213e",
          borderRadius: 8, color: "#ccd6f6", fontSize: 12, lineHeight: 1.5, resize: "vertical",
          outline: "none", fontFamily: "inherit", boxSizing: "border-box",
        }}
      />
      <button
        onClick={handleGenerate}
        disabled={signalInput.trim().length < 10}
        style={{
          width: "100%", marginTop: 8, padding: 12,
          background: signalInput.trim().length >= 10 ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
          color: signalInput.trim().length >= 10 ? "#fff" : "#495670",
          border: signalInput.trim().length >= 10 ? "none" : "2px solid #16213e",
          borderRadius: 8, cursor: signalInput.trim().length >= 10 ? "pointer" : "not-allowed",
          fontWeight: 700, fontSize: 13, transition: "all 0.3s",
        }}
      >Generer le script d'approche</button>

      {result && (
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginTop: 12, borderLeft: "3px solid #4ecca3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, letterSpacing: 1 }}>{result.type.label.toUpperCase()}</span>
              <span style={{ fontSize: 10, color: "#495670", marginLeft: 8 }}>Script contextualise</span>
            </div>
            <CopyBtn text={result.script} label="Copier" />
          </div>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-line" }}>{result.script}</div>
          <div style={{ fontSize: 10, color: "#8892b0", marginTop: 8, lineHeight: 1.4 }}>
            Ce script est genere depuis ton Coffre-Fort. Il cite tes briques les plus fortes et le cauchemar probable de l'entreprise. Ajuste le ton et envoie.
          </div>
        </div>
      )}
    </div>
  );
}

/* LINKEDIN COMMENT FIELD Component */
function CommentField({ bricks, vault }) {
  var inputSt = useState("");
  var postInput = inputSt[0];
  var setPostInput = inputSt[1];
  var resultSt = useState(null);
  var result = resultSt[0];
  var setResult = resultSt[1];

  function handleGenerate() {
    if (postInput.trim().length < 20) return;
    var gen = generateLinkedInComment(postInput, bricks, vault);
    setResult(gen);
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 10 }}>
        Tu tombes sur un post pertinent dans ton fil. Colle-le ici. Le systeme croise avec ton Coffre-Fort et genere un commentaire qui montre ta competence.
      </div>
      <textarea
        value={postInput}
        onChange={function(e) { setPostInput(e.target.value); }}
        placeholder="Colle ici un post LinkedIn que tu veux commenter..."
        style={{
          width: "100%", minHeight: 80, padding: 12, background: "#1a1a2e", border: "2px solid #16213e",
          borderRadius: 8, color: "#ccd6f6", fontSize: 12, lineHeight: 1.5, resize: "vertical",
          outline: "none", fontFamily: "inherit", boxSizing: "border-box",
        }}
      />
      <button
        onClick={handleGenerate}
        disabled={postInput.trim().length < 20}
        style={{
          width: "100%", marginTop: 8, padding: 12,
          background: postInput.trim().length >= 20 ? "#0f3460" : "#1a1a2e",
          color: postInput.trim().length >= 20 ? "#ccd6f6" : "#495670",
          border: postInput.trim().length >= 20 ? "2px solid #3498db" : "2px solid #16213e",
          borderRadius: 8, cursor: postInput.trim().length >= 20 ? "pointer" : "not-allowed",
          fontWeight: 700, fontSize: 13, transition: "all 0.3s",
        }}
      >Generer le commentaire</button>

      {result && (
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginTop: 12, borderLeft: "3px solid #3498db" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 10, color: "#3498db", fontWeight: 700, letterSpacing: 1 }}>COMMENTAIRE {result.topic !== "general" ? "\u00B7 " + result.topic.toUpperCase() : ""}</span>
            </div>
            <CopyBtn text={result.comment} label="Copier" />
          </div>
          <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7 }}>{result.comment}</div>
          <div style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginTop: 8 }}>
            <div style={{ fontSize: 10, color: "#495670", marginBottom: 2 }}>Brique utilisee ({result.brickSource || "chiffre"})</div>
            <div style={{ fontSize: 10, color: "#8892b0", lineHeight: 1.4 }}>{result.brickUsed}</div>
            {result.pillarUsed && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 10, color: "#3498db", marginBottom: 1 }}>Pilier injecte</div>
                <div style={{ fontSize: 10, color: "#8892b0" }}>{result.pillarUsed}</div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 10, color: "#8892b0", marginTop: 8, lineHeight: 1.4 }}>
            Pas de chiffre. La situation et la tension suffisent. L'auteur voit quelqu'un qui a fait, pas quelqu'un qui se vante. Il clique sur ton profil. Ta bio donne les chiffres en 6 secondes.
          </div>
        </div>
      )}
    </div>
  );
}

/* CROSS-ROLE INSIGHT Component — shows alternative career paths */
function CrossRoleInsight({ bricks, targetRoleId, trajectoryToggle }) {
  var exState = useState(false);
  var expanded = exState[0];
  var setExpanded = exState[1];

  var tScriptsState = useState({});
  var tScripts = tScriptsState[0];
  var setTScripts = tScriptsState[1];

  if (!targetRoleId) return null;

  var crossData = computeCrossRoleMatching(bricks, targetRoleId, trajectoryToggle);
  if (!crossData || crossData.alternatives.length === 0) return null;

  var isJySuis = trajectoryToggle === "j_y_suis";
  var isJyVais = trajectoryToggle === "j_y_vais";

  // Check if any alternative has strictly better elastic coverage
  var hasBetterPath = crossData.alternatives.some(function(a) { return a.elasticMatches > crossData.currentElastic; });

  return (
    <div style={{ background: "#16213e", borderRadius: 12, padding: 16, marginBottom: 24, border: hasBetterPath ? "1px solid #3498db" : "1px solid #16213e" }}>
      <button onClick={function() { setExpanded(!expanded); }} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{hasBetterPath ? "\uD83D\uDEA9" : "\uD83D\uDDFA\uFE0F"}</span>
            <span style={{ color: hasBetterPath ? "#3498db" : "#ccd6f6", fontWeight: 700, fontSize: 13 }}>
              {hasBetterPath ? "TERRAIN ALTERNATIF DETECTE" : "PARCOURS ALTERNATIFS"}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#495670" }}>{expanded ? "\u25B2" : "\u25BC"}</span>
        </div>
        {!expanded && hasBetterPath && (
          <div style={{ fontSize: 11, color: "#8892b0", marginTop: 4 }}>
            Tes briques couvrent mieux {crossData.alternatives[0].elasticMatches} KPIs elastiques de {crossData.alternatives[0].role} que {crossData.currentElastic} de {crossData.currentRole}.
          </div>
        )}
      </button>

      {expanded && (
        <div style={{ marginTop: 12 }}>
          {/* Current role coverage */}
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600 }}>{crossData.currentRole}</div>
              <span style={{ fontSize: 10, color: "#495670" }}>ton choix</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 11, color: "#4ecca3" }}>{crossData.currentElastic} KPI{crossData.currentElastic > 1 ? "s" : ""} elastique{crossData.currentElastic > 1 ? "s" : ""}</span>
              <span style={{ fontSize: 11, color: "#495670" }}>{crossData.currentCoverage}% de couverture</span>
            </div>
          </div>

          {/* Alternative paths */}
          {crossData.alternatives.map(function(alt) {
            var isBetter = alt.elasticMatches > crossData.currentElastic;
            return (
              <div key={alt.roleId} style={{ background: isBetter ? "#0f3460" : "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8, borderLeft: "3px solid " + (isBetter ? "#3498db" : "#495670") }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 12, color: isBetter ? "#3498db" : "#ccd6f6", fontWeight: 700 }}>{alt.role}</div>
                  <span style={{ fontSize: 10, color: isBetter ? "#3498db" : "#495670", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>{alt.coverage}%</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#4ecca3" }}>{alt.elasticMatches} KPI{alt.elasticMatches > 1 ? "s" : ""} elastique{alt.elasticMatches > 1 ? "s" : ""}</span>
                  <span style={{ fontSize: 11, color: "#8892b0" }}>{alt.totalMatches} match{alt.totalMatches > 1 ? "es" : ""} total{alt.totalMatches > 1 ? "es" : ""}</span>
                </div>
                {alt.matchedKpis.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    {alt.matchedKpis.slice(0, 3).map(function(mk, i) {
                      return (
                        <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 2 }}>
                          <span style={{ fontSize: 10, color: "#4ecca3", flexShrink: 0 }}>{"\u2197\uFE0F"}</span>
                          <div>
                            <span style={{ fontSize: 10, color: "#ccd6f6" }}>{mk.kpi}</span>
                            <span style={{ fontSize: 9, color: "#495670" }}> {"\u2190"} {mk.brick}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                  {isBetter
                    ? isJySuis
                      ? "Tes preuves couvrent mieux ce poste que celui que tu occupes. Tu as construit des preuves qui ouvrent un terrain que tu n'avais pas cible."
                      : isJyVais
                      ? "Ce poste est plus directement atteignable avec tes preuves actuelles. C'est une marche intermediaire credible avant ton objectif final."
                      : "Couverture superieure a ton choix. Tes briques matchent ce terrain."
                    : "Terrain accessible. Tes briques couvrent une partie des KPIs elastiques de ce poste."
                  }
                </div>
                {/* TRANSITION SCRIPT — Item 6 */}
                {isBetter && (
                  <div style={{ marginTop: 8 }}>
                    {!tScripts[alt.roleId] && (
                      <button onClick={function() {
                        var upd = Object.assign({}, tScripts);
                        upd[alt.roleId] = generateTransitionScript(bricks, targetRoleId, alt);
                        setTScripts(upd);
                      }} style={{
                        padding: "6px 12px", fontSize: 11, background: "#1a1a2e", color: "#3498db", border: "1px solid #3498db", borderRadius: 6, cursor: "pointer", fontWeight: 600,
                      }}>Generer un script de transition</button>
                    )}
                    {tScripts[alt.roleId] && (
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginTop: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: "#3498db", fontWeight: 600 }}>SCRIPT OUTSIDER</span>
                          <CopyBtn text={tScripts[alt.roleId]} label="Copier" />
                        </div>
                        <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5, whiteSpace: "pre-line" }}>{tScripts[alt.roleId]}</div>
                        <div style={{ fontSize: 10, color: "#495670", marginTop: 6 }}>Ton downside : 30 min de preparation. Son downside : 30 min d'ecoute. L'upside : un profil que le process RH aurait elimine mais qui resout le probleme.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5, marginTop: 8 }}>
            Ce croisement tourne a chaque Rendez-vous de Souverainete. Les briques que tu accumules en poste ouvrent progressivement de nouveaux terrains. Le systeme detecte quand tu es pret.
          </div>
        </div>
      )}
    </div>
  );
}

function EndScreen({ vault, bricks, duelResults, maturity, targetRoleId, nightmareCosts, trajectoryToggle }) {
  var tabSt = useState("arsenal");
  var tab = tabSt[0];
  var setTab = tabSt[1];
  var phaseSt = useState("recherche");
  var capturePhase = phaseSt[0];
  var setCapturePhase = phaseSt[1];

  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var missions = bricks.filter(function(b) { return b.type === "mission"; });
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  var decisions = validated.filter(function(b) { return b.brickCategory === "decision"; });
  var influences = validated.filter(function(b) { return b.brickCategory === "influence"; });
  var duelAnswered = duelResults.filter(function(r) { return r.answer; });
  var duelFailles = duelResults.filter(function(r) { return !r.answer; });

  // Cout de l'Incompetence Percue
  var kpiGaps = [];
  if (validated.length < 7) kpiGaps.push({ kpi: "Briques de preuve", msg: "Tu es muet sur " + (7 - validated.length) + " preuves. Le recruteur controlera cette partie de la negociation." });
  if (duelFailles.length > 0) kpiGaps.push({ kpi: "Failles de combat", msg: "Tu as " + duelFailles.length + " faille" + (duelFailles.length > 1 ? "s" : "") + " ouvertes. Le recruteur va tomber dessus." });
  if (decisions.length === 0) kpiGaps.push({ kpi: "Aucune brique decision", msg: "Tu n'as documente aucun arbitrage. Le recruteur ne sait pas si tu sais trancher." });
  if (influences.length === 0) kpiGaps.push({ kpi: "Aucune brique influence", msg: "Tu n'as documente aucun alignement. Le recruteur ne sait pas si tu sais naviguer la politique interne." });

  // Measurement hygiene diagnostic
  var totalAnswered = validated.length + missions.length;
  var missionRatio = totalAnswered > 0 ? Math.round((missions.length / totalAnswered) * 100) : 0;
  var measurementDiag = null;
  if (missions.length === 0 && validated.length >= 5) {
    measurementDiag = { level: "fort", color: "#4ecca3", title: "Hygiene de mesure : forte", msg: "Tu as repondu a chaque question avec un chiffre. Tu mesures ce que tu fais. C'est rare. Le recruteur verra un professionnel qui ne negocie pas avec des impressions." };
  } else if (missions.length >= 1 && missions.length <= 2) {
    measurementDiag = { level: "moyen", color: "#ff9800", title: "Hygiene de mesure : moyenne", msg: missions.length + " question" + (missions.length > 1 ? "s" : "") + " sans chiffre sur " + totalAnswered + ". Tu mesures une partie de ton impact. Les missions te donnent les etapes pour recuperer le reste. Chaque mission completee installe le reflexe de mesurer." };
  } else if (missions.length >= 3) {
    measurementDiag = { level: "faible", color: "#e94560", title: "Hygiene de mesure : absente", msg: missions.length + " questions sur " + totalAnswered + " sans chiffre (" + missionRatio + "%). Ce n'est pas un probleme de memoire. C'est un mode de fonctionnement : tu operes sans mesurer l'impact de ce que tu fais. Chaque trimestre sans tableau de bord est un trimestre de negociation perdu. Les missions ne sont pas des corvees. Ce sont les premiers pas vers un reflexe qui change tout." };
  }
  if (missions.length > 0) {
    kpiGaps.push({ kpi: "Deconnexion action-mesure", msg: missions.length + " mission" + (missions.length > 1 ? "s" : "") + " en attente. " + missionRatio + "% de tes reponses n'ont pas de preuve. Le professionnel qui mesure fixe son prix. Celui qui ne mesure pas accepte celui qu'on lui donne." });
  }
  var leveragePct = Math.round((validated.length / 9) * 100);
  leveragePct = Math.min(leveragePct, 100);

  // Elasticity summary
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "elastique"; });

  var capturePings = {
    recherche: [
      { month: "Janvier", text: "Tu as fini ton Q4. Quel est le chiffre final du pipeline ? Quel obstacle as-tu brise ?" },
      { month: "Fevrier", text: "Quelle competence as-tu utilisee ce mois-ci qui n'existait pas dans ta fiche de poste il y a un an ?" },
      { month: "Mars", text: "Quel indicateur as-tu suivi ce mois ? Quel chiffre a bouge ? Si la reponse est 'aucun', tu operes dans le noir." },
    ],
    en_poste: [
      { month: "Janvier", text: "Tu viens de finir un projet. Quel impact mesurable ? Quel feedback de ton N+1 ?" },
      { month: "Fevrier", text: "Tu as resolu un probleme interne. Quel indicateur a bouge ? De combien ? Nouvelle brique." },
      { month: "Mars", text: "Ouvre ton tableau de bord. Quel chiffre a change depuis le mois dernier grace a toi ? Si tu n'as pas de tableau de bord, c'est le premier probleme a resoudre." },
    ],
    negociation: [
      { month: "Janvier", text: "Tu prepares ton entretien annuel. Quelles briques mobiliser pour justifier +15% ?" },
      { month: "Fevrier", text: "Tu vises une promotion. L'IA identifie les 2 briques manquantes pour le niveau superieur." },
      { month: "Mars", text: "Combien de tes realisations du trimestre as-tu documentees avec un chiffre ? Ce que tu n'as pas mesure, tu ne le negocieras pas." },
    ],
    freelance: [
      { month: "Janvier", text: "Quelles sont les 3 decisions les plus couteuses que tu as prises ce mois pour ton client ? Ton rapport de valeur en depend." },
      { month: "Fevrier", text: "Ton client pense que 'tout va bien' parce que tu fais bien ton job. Quelles catastrophes as-tu evitees ce mois ? L'IA genere ton rapport de valeur." },
      { month: "Mars", text: "Quel indicateur as-tu fait bouger ce mois chez ton client ? Mets le chiffre dans ton rapport. Pas de chiffre, pas de justification d'honoraires." },
    ],
  };
  var pings = capturePings[capturePhase] || capturePings.recherche;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>{"\uD83D\uDE80"}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ccd6f6", marginBottom: 6 }}>Arsenal calibre.</div>
        <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>
          {validated.length} briques ({decisions.length > 0 || influences.length > 0 ? "chiffre + decision + influence" : "chiffre"}).
          {cicatrices.length > 0 ? " " + cicatrices.length + " cicatrice" + (cicatrices.length > 1 ? "s" : "") + "." : ""}
          {missions.length > 0 ? " " + missions.length + " mission" + (missions.length > 1 ? "s" : "") + " (" + missionRatio + "% sans preuve)." : ""}
          {" "}{duelAnswered.length} reponses de combat.
          {elasticBricks.length > 0 ? " " + elasticBricks.length + " briques sur marche elastique." : ""}
        </div>

        {/* CALIBRATION MESSAGE — Item 5: 3 postures par trajectoire */}
        <div style={{ background: "#0f3460", borderRadius: 8, padding: 12, marginTop: 12, textAlign: "left" }}>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            {trajectoryToggle === "j_y_suis"
              ? "10 000 professionnels de ton secteur publient cette semaine. 9 990 partagent des conseils generiques. Toi tu publies un diagnostic sectoriel ancre sur un vecu que l'IA ne peut pas inventer. Ton prochain poste ne viendra pas d'une offre. Il viendra de quelqu'un qui prononce ton nom dans une salle ou tu n'es pas."
              : "500 personnes ont postule a la meme offre. 490 ont envoye un CV generique. Tu as un CV forge depuis des preuves chiffrees, un script ancre sur le cauchemar du decideur, et des prises de position que l'IA ne peut pas ecrire. Tu es dans les 5."
            }
          </div>
        </div>

        {measurementDiag && (
          <div style={{ fontSize: 12, color: measurementDiag.color, fontWeight: 600, marginTop: 8 }}>
            {measurementDiag.level === "fort" ? "\uD83D\uDCCA" : measurementDiag.level === "moyen" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"} {measurementDiag.title}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[
          { id: "arsenal", label: "Ton Arsenal", emoji: "\u2694\uFE0F" },
          { id: "coffre", label: "Coffre-Fort", emoji: "\uD83D\uDD10" },
        ].map(function(t) {
          var act = tab === t.id;
          return (
            <button key={t.id} onClick={function() { setTab(t.id); }} style={{
              flex: 1, padding: "10px 8px", background: act ? "#e94560" : "#1a1a2e",
              border: act ? "2px solid #e94560" : "2px solid #16213e",
              borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700,
              color: act ? "#fff" : "#8892b0", transition: "all 0.2s",
            }}>{t.emoji} {t.label}</button>
          );
        })}
      </div>

      {/* ARSENAL TAB */}
      {tab === "arsenal" && (
        <div>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>TON LEVIER DE NEGOCIATION</div>
          <Deliverable emoji={"\uD83D\uDCC4"} title="CV reecrit" content={generateCV(bricks, targetRoleId, trajectoryToggle)} lines={4} />
          <Deliverable emoji={"\uD83D\uDCDD"} title="Bio LinkedIn" content={generateBio(bricks, vault, trajectoryToggle)} lines={3} />
          <ImpactReportPanel bricks={bricks} vault={vault} targetRoleId={targetRoleId} trajectoryToggle={trajectoryToggle} />
          <Deliverable emoji={"\uD83C\uDFAF"} title="Script de contact (ROI + elasticite)" content={generateScript(bricks, targetRoleId)} lines={3} />
          <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5, padding: "4px 0 8px", fontStyle: "italic" }}>
            Le recruteur recoit 500 candidatures. 490 commencent par "je me permets de vous contacter." Le tien commence par son probleme. C'est pour ca qu'il repond.
          </div>

          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginTop: 20, marginBottom: 12 }}>PRISES DE POSITION</div>
          {(function() {
            var positions = generatePositions(bricks, vault);
            if (positions.length === 0) return (
              <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, borderLeft: "3px solid #495670" }}>
                <div style={{ fontSize: 12, color: "#495670" }}>Aucune prise de position generee. Valide des piliers et des briques d'abord.</div>
              </div>
            );
            return positions.map(function(p, i) { return <PositionCard key={i} pos={p} idx={i} />; });
          })()}

          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginTop: 20, marginBottom: 12 }}>REPONSES DE COMBAT ({duelAnswered.length})</div>
          {duelResults.map(function(r, i) {
            return (
              <div key={i} style={{ background: r.answer ? "#0f3460" : "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 6, borderLeft: r.answer ? "3px solid #e94560" : "3px solid #495670" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", flex: 1 }}>{r.answer ? "\uD83D\uDEE1\uFE0F" : "\u26A0\uFE0F"} {r.question}</div>
                  {r.answer && <CopyBtn text={r.question + "\n\n" + r.answer} label="Copier" />}
                </div>
                {r.answer && <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{r.answer}</div>}
                {!r.answer && <div style={{ fontSize: 12, color: "#e94560" }}>Faille ouverte.</div>}
                {r.wordWarning && <div style={{ fontSize: 11, color: "#ff9800", marginTop: 4 }}>{r.wordWarning}</div>}
              </div>
            );
          })}

          <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 16, marginTop: 20, borderLeft: "3px solid #e94560" }}>
            <div style={{ fontSize: 12, color: "#495670", fontWeight: 600, marginBottom: 6 }}>{"\uD83D\uDD10"} NON EXPORTABLE</div>
            <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.7 }}>
              {validated.length} Briques {"\u00B7"} {vault.pillars} Piliers
            </div>
            <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, marginTop: 8, fontStyle: "italic" }}>"Tu as le PDF. Ton cerveau numerique reste ici."</div>
          </div>

          {/* ITERATION 7 — QUESTIONS DE DIAGNOSTIC (post-Duel) */}
          {(function() {
            var diagQuestions = generateDiagnosticQuestions(bricks, targetRoleId);
            if (diagQuestions.length === 0) return null;
            return (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>QUESTIONS DE DIAGNOSTIC ({diagQuestions.length})</div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 12 }}>
                  Questions calibrees sur tes briques les plus fortes. Tu ne poses pas des questions de curiosite. Tu poses des questions que tu es le seul a avoir la credibilite de poser.
                </div>
                {diagQuestions.map(function(q, i) {
                  return (
                    <div key={i} style={{ background: "#0f3460", borderRadius: 8, padding: 14, marginBottom: 8, borderLeft: "3px solid " + q.color }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <span style={{ fontSize: 10, color: q.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{q.type}</span>
                        <CopyBtn text={"NIVEAU 1 :\n" + q.level1 + "\n\nNIVEAU 2 :\n" + q.level2} label="Copier" />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 600, marginBottom: 3 }}>PREMIERE RENCONTRE</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, fontStyle: "italic" }}>"{q.level1}"</div>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 600, marginBottom: 3 }}>ENTRETIEN AVANCE</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, fontStyle: "italic" }}>"{q.level2}"</div>
                      </div>
                      <div style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginTop: 6 }}>
                        <div style={{ fontSize: 10, color: "#495670", marginBottom: 2 }}>Brique source : {q.brickRef}</div>
                        <div style={{ fontSize: 10, color: "#8892b0", lineHeight: 1.4 }}>{q.logic}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ITERATION 4 — CHAMP "COLLE UN SIGNAL" */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>COLLE UN SIGNAL</div>
            <SignalField bricks={bricks} targetRoleId={targetRoleId} />
          </div>

          {/* CHAMP "COMMENTE UN POST" */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: "#3498db", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>COMMENTE UN POST LINKEDIN</div>
            <CommentField bricks={bricks} vault={vault} />
          </div>

          {/* POSTS LINKEDIN GENERES */}
          {(function() {
            var posts = generateLinkedInPosts(bricks, vault, targetRoleId);
            if (posts.length === 0) return null;
            return (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>POSTS LINKEDIN GENERES ({posts.length})</div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 12 }}>
                  Generes depuis tes piliers et tes briques. Cauchemar + these + situation vecue + question ouverte. Pas de chiffre dans le post. La bio fait ce travail.
                </div>
                {posts.map(function(post, i) {
                  return (
                    <div key={i} style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginBottom: 12, borderLeft: "3px solid " + (post.pillarSource === "take" ? "#3498db" : "#e94560") }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 10, color: post.pillarSource === "take" ? "#3498db" : "#e94560", fontWeight: 700, letterSpacing: 1 }}>POST {i + 1}</span>
                          <span style={{ fontSize: 10, color: "#495670", marginLeft: 8 }}>{post.pillarSource === "take" ? "pilier take" : "pilier IA"} {"\u00B7"} brique {post.brickType} {"\u00B7"} {post.charCount} car.</span>
                        </div>
                        <CopyBtn text={post.text} label="Copier" />
                      </div>
                      <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-line" }}>{post.text}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <span style={{ fontSize: 9, color: "#495670", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>Pilier : {post.pillar.length > 30 ? post.pillar.slice(0, 30) + "..." : post.pillar}</span>
                        <span style={{ fontSize: 9, color: "#495670", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>Brique : {post.brickUsed}</span>
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize: 10, color: "#495670", lineHeight: 1.5, marginTop: 8 }}>
                  Chaque Rendez-vous produit de nouvelles briques. De nouvelles briques produisent de nouveaux posts. L'abonnement alimente le flux.
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* COFFRE-FORT TAB */}
      {tab === "coffre" && (
        <div>
          {/* BRIQUES with category + elasticity tags + audit badges */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6" }}>{"\uD83E\uDDF1"} Briques de Preuve ({validated.length})</div>
              <CopyBtn text={validated.map(function(b) { return b.text + " [" + b.kpi + "] [" + (b.brickCategory || "chiffre") + "]" + (b.elasticity ? " [" + b.elasticity + "]" : ""); }).join("\n\n")} label="Exporter briques" />
            </div>
            {/* EXPORT TRANSPORTABLE — with re-scan */}
            {(function() {
              var withAnon = validated.filter(function(b) { return b.anonymizedText; });
              if (withAnon.length === 0) return null;
              var allClean = withAnon.every(function(b) {
                var rescan = auditAnonymization(b.anonymizedText, false);
                return rescan.totalFindings === 0;
              });
              var exportText = withAnon.map(function(b) { return b.anonymizedText; }).join("\n\n");
              return (
                <div style={{ background: allClean ? "#4ecca3" + "11" : "#e94560" + "11", borderRadius: 8, padding: 10, marginBottom: 10, border: "1px solid " + (allClean ? "#4ecca3" : "#e94560") }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, color: allClean ? "#4ecca3" : "#e94560", fontWeight: 600 }}>
                        {allClean ? "\uD83D\uDD12 Versions transportables propres" : "\u26A0\uFE0F Re-scan : elements detectes"}
                      </div>
                      <div style={{ fontSize: 10, color: "#8892b0", marginTop: 2 }}>
                        {withAnon.length} version{withAnon.length > 1 ? "s" : ""} — re-scannee{withAnon.length > 1 ? "s" : ""} a l'export
                      </div>
                    </div>
                    {allClean && <CopyBtn text={exportText} label="Exporter" />}
                  </div>
                  {!allClean && (
                    <div style={{ fontSize: 11, color: "#e94560", marginTop: 6 }}>Export bloque. Une ou plusieurs versions transportables contiennent des elements sensibles detectes au re-scan.</div>
                  )}
                </div>
              );
            })()}
            {validated.map(function(b) {
              var cat = b.brickCategory && CATEGORY_LABELS[b.brickCategory];
              var elast = b.elasticity && ELASTICITY_LABELS[b.elasticity];
              return (
                <div key={b.id} style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: "3px solid " + (cat ? cat.color : "#e94560") }}>
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 6 }}>{b.text}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: cat ? cat.color : "#e94560", background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>
                      {b.brickType === "cicatrice" ? "cicatrice" : cat ? cat.label.toLowerCase() : b.kpi}
                    </span>
                    {elast && <span style={{ fontSize: 10, color: elast.color, background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>{elast.icon} {elast.label}</span>}
                  </div>
                  {b.nightmareText && (
                    <div style={{ fontSize: 11, color: "#e74c3c", marginTop: 6, lineHeight: 1.4 }}>{"\uD83D\uDCA2"} {b.nightmareText}</div>
                  )}
                  {b.anonymizedText && (
                    <div style={{ fontSize: 11, color: "#95a5a6", marginTop: 4, lineHeight: 1.4 }}>{"\uD83D\uDD12"} Transportable : "{b.anonymizedText}"</div>
                  )}
                  {b.kpiRefMatch && (
                    <div style={{ fontSize: 11, color: b.kpiRefMatch.elasticity === "elastique" ? "#4ecca3" : b.kpiRefMatch.elasticity === "sous_pression" ? "#e94560" : "#8892b0", marginTop: 4, lineHeight: 1.4 }}>
                      {b.kpiRefMatch.elasticity === "elastique" ? "\u2197\uFE0F" : b.kpiRefMatch.elasticity === "sous_pression" ? "\u2198\uFE0F" : "\u2194\uFE0F"} {b.kpiRefMatch.name} : {b.kpiRefMatch.why}
                    </div>
                  )}
                  {(function() {
                    var vuln = auditBrickVulnerability(b);
                    if (!vuln) return null;
                    return (
                      <div style={{ fontSize: 10, color: vuln.color, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>{vuln.level === "blindee" ? "\uD83D\uDEE1\uFE0F" : vuln.level === "credible" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"}</span>
                        <span>{vuln.level === "blindee" ? "Blindee" : vuln.level === "credible" ? "A blinder" : "Vulnerable"}</span>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* CAUCHEMAR COST SUMMARY — negotiation ammunition */}
          {(function() {
            var detailedCoverage = computeCauchemarCoverageDetailed(bricks, nightmareCosts || {});
            var withCosts = detailedCoverage.filter(function(c) { return c.cost; });
            var vulnerableCoverage = detailedCoverage.filter(function(c) { return c.covered && c.vulnerability && c.vulnerability.level === "vulnerable"; });
            if (withCosts.length === 0 && detailedCoverage.every(function(c) { return !c.covered; })) return null;
            return (
              <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, borderLeft: "3px solid #e94560" }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>{"\uD83D\uDCA2"} CARTE DES CAUCHEMARS</div>
                {detailedCoverage.map(function(c) {
                  return (
                    <div key={c.id} style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, color: c.covered ? "#4ecca3" : "#e94560" }}>{c.covered ? "\u2705" : "\u274C"}</span>
                          <span style={{ fontSize: 12, color: "#ccd6f6" }}>{c.label}</span>
                        </div>
                        {c.covered && c.vulnerability && (
                          <span style={{ fontSize: 9, color: c.vulnerability.color, background: "#0f3460", padding: "2px 6px", borderRadius: 4 }}>
                            {c.vulnerability.level === "blindee" ? "\uD83D\uDEE1\uFE0F" : c.vulnerability.level === "credible" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"} {c.vulnerability.level}
                          </span>
                        )}
                      </div>
                      {c.cost && (
                        <div style={{ fontSize: 11, color: "#e94560", marginTop: 4 }}>{"\uD83D\uDCB0"} Impact : {c.cost}</div>
                      )}
                      {c.covered && (
                        <div style={{ fontSize: 10, color: "#495670", marginTop: 2 }}>{c.brickCount} brique{c.brickCount > 1 ? "s" : ""} couvre{c.brickCount > 1 ? "nt" : ""} ce cauchemar</div>
                      )}
                    </div>
                  );
                })}
                {withCosts.length > 0 && (
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6, marginTop: 8 }}>
                    Ta negociation ne porte pas sur ton salaire. Elle porte sur la disparition de {withCosts.length === 1 ? "ce probleme qui coute " + withCosts[0].cost : "ces problemes"}. Le recruteur ne paie pas ta competence. Il paie la fin de sa douleur.
                  </div>
                )}
                {vulnerableCoverage.length > 0 && (
                  <div style={{ background: "#e94560" + "22", borderRadius: 6, padding: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5 }}>
                      {vulnerableCoverage.length} cauchemar{vulnerableCoverage.length > 1 ? "s" : ""} couvert{vulnerableCoverage.length > 1 ? "s" : ""} par des briques vulnerables. Tu te positionnes comme le remede mais ta preuve est faible. Si le probleme persiste, tu deviens la cible.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* DIAGNOSTIC DE MESURE */}
          {measurementDiag && (
            <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, borderLeft: "3px solid " + measurementDiag.color }}>
              <div style={{ fontSize: 11, color: measurementDiag.color, fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>{measurementDiag.level === "fort" ? "\uD83D\uDCCA" : measurementDiag.level === "moyen" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"} {measurementDiag.title.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>{measurementDiag.msg}</div>
              {missions.length > 0 && (
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginTop: 8 }}>
                  Ratio : {validated.length} brique{validated.length > 1 ? "s" : ""} prouvee{validated.length > 1 ? "s" : ""} / {missions.length} mission{missions.length > 1 ? "s" : ""} sans chiffre.
                  {missionRatio >= 50 ? " La majorite de ton activite est invisible. Tu negocies a l'aveugle." : ""}
                </div>
              )}
            </div>
          )}

          {/* MISSIONS */}
          {missions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{"\uD83D\uDCCB"} Missions en attente ({missions.length})</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 8 }}>Chaque mission completee ne remplit pas seulement ton arsenal. Elle installe un reflexe : mesurer ce que tu fais pendant que tu le fais.</div>
              {missions.map(function(m) {
                return (
                  <div key={m.id} style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 6, borderLeft: "3px solid #ff9800" }}>
                    <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 4 }}>{m.text}</div>
                    <span style={{ fontSize: 10, color: "#ff9800" }}>Complete cette mission. La prochaine fois, mesure en temps reel.</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* PILIERS */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{"\uD83C\uDFDB\uFE0F"} Piliers ({vault.pillars})</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Tes piliers definissent l'angle de chaque livrable. L'IA injecte tes convictions comme des variables fixes dans chaque texte genere.</div>
          </div>

          {/* STYLE ENGINE — now tracks corrections */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{"\u270D\uFE0F"} Editeur de Contraintes : {vault.corrections} correction{vault.corrections > 1 ? "s" : ""}</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 8 }}>Le moteur apprend de tes corrections, pas de tes validations. Chaque modification enseigne ta voix. Apres 50 corrections, l'IA ecrit comme toi.</div>
            <Bar pct={Math.min(100, vault.corrections * 2)} />
          </div>

          {/* INDICE DE LEVIER */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{"\u2694\uFE0F"} Indice de Levier</div>
            <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, border: "1px dashed #e94560" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 600 }}>POUVOIR DE NEGOCIATION</div>
                <span style={{ fontSize: 14, color: leveragePct >= 70 ? "#4ecca3" : "#e94560", fontWeight: 800 }}>{leveragePct}%</span>
              </div>
              <Bar pct={leveragePct} />
              {elasticBricks.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#4ecca3" }}>
                  {"\u2197\uFE0F"} {elasticBricks.length} brique{elasticBricks.length > 1 ? "s" : ""} sur marche elastique. Tu te positionnes la ou la demande accelere.
                </div>
              )}
              {kpiGaps.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>CE QUE TU LAISSES SUR LA TABLE</div>
                  {kpiGaps.map(function(g, i) {
                    return (
                      <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: "3px solid #e94560" }}>
                        <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 3 }}>{g.kpi}</div>
                        <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{g.msg}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {kpiGaps.length === 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#4ecca3", fontWeight: 600 }}>Aucune faille detectee. Ton levier est maximal sur les criteres Sprint.</div>
              )}
            </div>
          </div>

          {/* CAPTURE PINGS */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{"\uD83D\uDD14"} Interrogatoire de Capture</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[
                { id: "recherche", label: "Recherche" },
                { id: "en_poste", label: "En poste" },
                { id: "negociation", label: "Negociation" },
                { id: "freelance", label: "Freelance" },
              ].map(function(p) {
                var act = capturePhase === p.id;
                return (
                  <button key={p.id} onClick={function() { setCapturePhase(p.id); }} style={{
                    flex: 1, padding: "6px 4px", fontSize: 11, fontWeight: 700,
                    background: act ? "#e94560" : "#1a1a2e", color: act ? "#fff" : "#495670",
                    border: act ? "1px solid #e94560" : "1px solid #16213e",
                    borderRadius: 6, cursor: "pointer",
                  }}>{p.label}</button>
                );
              })}
            </div>
            <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, border: "1px solid #16213e" }}>
              {capturePhase === "freelance" && (
                <div style={{ fontSize: 12, color: "#4ecca3", lineHeight: 1.5, marginBottom: 12, padding: "8px 10px", background: "#1a1a2e", borderRadius: 8, borderLeft: "3px solid #4ecca3" }}>
                  Mode freelance : chaque ping genere un rapport de valeur que tu envoies a ton client pour justifier tes honoraires. Tu ne notes pas pour te souvenir. Tu blindes pour facturer.
                </div>
              )}
              {pings.map(function(ping, i) {
                return (
                  <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: i < pings.length - 1 ? 12 : 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "#e94560" : "#495670", marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 11, color: "#495670", marginBottom: 4 }}>PING \u2014 {ping.month}</div>
                        <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.5, fontWeight: 600 }}>"{ping.text}"</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BRIEF DE NEGOCIATION — cauchemars as leverage */}
          {(function() {
            var coverage = computeCauchemarCoverage(bricks);
            var coveredWithCost = coverage.filter(function(c) { return c.covered && c.costRange; });
            if (coveredWithCost.length === 0) return null;
            var totalCostMin = 0;
            var totalCostMax = 0;
            coveredWithCost.forEach(function(c) { totalCostMin += c.costRange[0]; totalCostMax += c.costRange[1]; });
            var hasElastic = coveredWithCost.some(function(c) { return c.hasElasticCovering; });
            return (
              <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #4ecca3" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{"\uD83D\uDCB0"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6" }}>BRIEF DE NEGOCIATION</div>
                    <div style={{ fontSize: 11, color: "#4ecca3" }}>Cadrage par le cout du probleme, pas par ton salaire</div>
                  </div>
                </div>
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 6 }}>Tu couvres {coveredWithCost.length} cauchemar{coveredWithCost.length > 1 ? "s" : ""} represetant un cout sectoriel de :</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#4ecca3" }}>
                    {(totalCostMin / 1000).toFixed(0)}K - {(totalCostMax / 1000).toFixed(0)}K{"\u20AC"}/an
                  </div>
                  <div style={{ fontSize: 11, color: "#495670", marginTop: 4 }}>Fourchette basee sur les moyennes Mid-Market SaaS</div>
                </div>
                {coveredWithCost.map(function(c) {
                  return (
                    <div key={c.id} style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: "#ccd6f6", fontWeight: 600 }}>{c.label}</span>
                        <span style={{ fontSize: 10, color: "#e94560" }}>{(c.costRange[0] / 1000).toFixed(0)}-{(c.costRange[1] / 1000).toFixed(0)}K{"\u20AC"}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.4 }}>{c.costContext}</div>
                      {c.hasElasticCovering && (
                        <div style={{ fontSize: 10, color: "#4ecca3", marginTop: 3 }}>{"\u2197\uFE0F"} Couvert par une brique elastique. Position de remede credible.</div>
                      )}
                      {c.covered && !c.hasElasticCovering && (
                        <div style={{ fontSize: 10, color: "#ff9800", marginTop: 3 }}>{"\u26A0\uFE0F"} Couvert par une brique stable. Levier de negociation limite.</div>
                      )}
                    </div>
                  );
                })}
                <div style={{ background: hasElastic ? "#4ecca3" + "15" : "#ff9800" + "15", borderRadius: 6, padding: 8, marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: hasElastic ? "#4ecca3" : "#ff9800", lineHeight: 1.5, fontWeight: 600 }}>
                    {hasElastic
                      ? "Ta negociation ne porte pas sur ton salaire. Elle porte sur le cout de ne pas te recruter. Le cauchemar coute " + (totalCostMin / 1000).toFixed(0) + "-" + (totalCostMax / 1000).toFixed(0) + "K\u20AC/an. Ton package est une fraction de ce risque."
                      : "Tes briques couvrent des cauchemars mais aucune n'est sur un KPI elastique. Ton levier de negociation est reel mais contestable. Cherche un angle elastique."
                    }
                  </div>
                </div>
              </div>
            );
          })()}

          {/* RENDEZ-VOUS DE SOUVERAINETE */}
          {targetRoleId && KPI_REFERENCE[targetRoleId] && (function() {
            var roleData = KPI_REFERENCE[targetRoleId];
            var nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + roleData.cadence);
            var dateStr = nextDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
            var elasticKpis = roleData.kpis.filter(function(k) { return k.elasticity === "elastique"; });
            var validatedBricks = bricks.filter(function(b) { return b.status === "validated"; });
            // Generate preview questions based on Coffre-Fort
            var previewQuestions = [];
            if (validatedBricks.length > 0) {
              previewQuestions.push("Quel arbitrage as-tu pris " + (roleData.cadence <= 30 ? "ce mois" : roleData.cadence <= 90 ? "ce trimestre" : "ce semestre") + " qui n'etait pas dans ta fiche de poste ?");
              previewQuestions.push("Parmi tes " + validatedBricks.length + " briques, laquelle est devenue obsolete ? Laquelle s'est renforcee ?");
              if (elasticKpis.length > 0) {
                previewQuestions.push("Quel chiffre as-tu fait bouger sur '" + elasticKpis[0].name + "' depuis le dernier Sprint ?");
              }
              previewQuestions.push("Quelle decision as-tu prise sous pression ? Qui s'y opposait ? Comment tu as tranche ?");
              previewQuestions.push("Mise a jour du Coffre-Fort : nouvelles briques, missions completees, metriques fraîches.");
            }
            return (
              <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #e94560" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{"\uD83D\uDD54"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6" }}>RENDEZ-VOUS DE SOUVERAINETE</div>
                    <div style={{ fontSize: 11, color: "#e94560" }}>Cadence {roleData.cadenceLabel.toLowerCase()} — {roleData.role}</div>
                  </div>
                </div>
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e94560", marginBottom: 4 }}>{dateStr}</div>
                  <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{roleData.cadenceReason}</div>
                </div>
                {/* Inquisiteur preview — what will be asked */}
                <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>L'INQUISITEUR DEMANDERA :</div>
                {previewQuestions.map(function(q, i) {
                  return (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#e94560", marginTop: 2 }}>{"\u25B8"}</span>
                      <span style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.4 }}>{q}</span>
                    </div>
                  );
                })}
                <div style={{ background: "#e94560" + "15", borderRadius: 6, padding: 8, marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5 }}>
                    Tu sais maintenant ce qui t'attend. A partir d'aujourd'hui, chaque arbitrage que tu prends est une brique en attente. Note-le ou arrive nu dans {roleData.cadence} jours.
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SCRIPT DE NEGOCIATION */}
          {(function() {
            var negoBrief = computeNegotiationBrief(bricks);
            var bluffRisks = detectBluffRisk(bricks);
            if (!negoBrief) return null;
            return (
              <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #4ecca3" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{"\u2694\uFE0F"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6" }}>SCRIPT DE NEGOCIATION</div>
                    <div style={{ fontSize: 11, color: "#4ecca3" }}>{negoBrief.coveredCount} cauchemar{negoBrief.coveredCount > 1 ? "s" : ""} couvert{negoBrief.coveredCount > 1 ? "s" : ""} / Impact total : {formatCost(negoBrief.totalCostLow)}-{formatCost(negoBrief.totalCostHigh)}/an</div>
                  </div>
                </div>

                {/* Each covered cauchemar = one negotiation lever */}
                {negoBrief.lines.map(function(line, i) {
                  var strengthColor = line.strength === "fort" ? "#4ecca3" : line.strength === "moyen" ? "#ff9800" : "#e94560";
                  return (
                    <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8, borderLeft: "3px solid " + strengthColor }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6" }}>{line.cauchemar}</span>
                        <span style={{ fontSize: 9, color: strengthColor, background: "#0f3460", padding: "2px 8px", borderRadius: 6 }}>
                          {line.strength === "fort" ? "\uD83D\uDEE1\uFE0F fort" : line.strength === "moyen" ? "\u26A0\uFE0F moyen" : "\uD83D\uDEA8 faible"} ({line.brickCount} brique{line.brickCount > 1 ? "s" : ""})
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#e94560", marginBottom: 4 }}>{"\uD83D\uDCB0"} {formatCost(line.costLow)}-{formatCost(line.costHigh)}/an — {line.costLogic}</div>
                      <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, fontStyle: "italic" }}>"{line.negoFrame}"</div>
                      {line.hasCicatrice && (
                        <div style={{ fontSize: 10, color: "#ff9800", marginTop: 4 }}>{"\uD83D\uDD25"} Bonus : tu as assume un echec sur ce terrain. Le recruteur sait que tu connais les pieges.</div>
                      )}
                    </div>
                  );
                })}

                {/* ALERTE BLUFF */}
                {bluffRisks.length > 0 && (
                  <div style={{ background: "#e94560" + "22", borderRadius: 8, padding: 12, marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{"\uD83D\uDEA8"} ALERTE BLUFF</div>
                    {bluffRisks.map(function(risk, i) {
                      return (
                        <div key={i} style={{ marginBottom: i < bluffRisks.length - 1 ? 6 : 0 }}>
                          <div style={{ fontSize: 11, color: "#ccd6f6", fontWeight: 600, marginBottom: 2 }}>{risk.cauchemar}</div>
                          <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5 }}>{risk.reason}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Mode d'emploi */}
                <div style={{ background: "#16213e", borderRadius: 6, padding: 10, marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6 }}>
                    Mode d'emploi : n'arrive pas en disant "je vaux X". Arrive en disant "votre probleme coute {formatCost(negoBrief.totalCostLow)}-{formatCost(negoBrief.totalCostHigh)} par an. Voici comment je l'ai resolu. Voici ce que ca vaut." Le recruteur ne paie pas ta competence. Il paie la fin de sa douleur.
                  </div>
                </div>
              </div>
            );
          })()}

          {/* PARCOURS ALTERNATIFS — cross-role matching */}
          <CrossRoleInsight bricks={bricks} targetRoleId={targetRoleId} trajectoryToggle={trajectoryToggle} />

          {/* CTA — Jevons reframe */}
          <div style={{ borderTop: "1px solid #495670", paddingTop: 20, marginTop: 8, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>Le marche s'elargit. Ton levier aussi.</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginBottom: 16 }}>
              {targetRoleId && KPI_REFERENCE[targetRoleId]
                ? "Rendez-vous " + KPI_REFERENCE[targetRoleId].cadenceLabel.toLowerCase() + ". Capture continue. Coffre-Fort mis a jour. Duel illimite. Bouton Eject."
                : "Capture continue. Carte d'elasticite mise a jour. Duel illimite. Bouton Eject."
              }
            </div>
            <button style={{
              width: "100%", padding: 16, background: "linear-gradient(135deg, #e94560, #c81d4e)",
              color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 15,
              boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
            }}>Activer le Coach \u2014 10\u20AC/mois</button>
            <div style={{ fontSize: 11, color: "#495670", marginTop: 10 }}>Tes briques restent accessibles en lecture seule meme sans abonnement.</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==============================
   ONBOARDING — Jevons reframe + elasticity in ready screen
   ============================== */

function Onboarding({ onStart, onScan }) {
  var modeState = useState(null);
  var mode = modeState[0];
  var setMode = modeState[1];
  var roleState = useState(null);
  var targetRole = roleState[0];
  var setTargetRole = roleState[1];
  var toggleState = useState(null);
  var trajectory = toggleState[0];
  var setTrajectory = toggleState[1];
  var cvState = useState("");
  var cv = cvState[0];
  var setCv = cvState[1];
  var offState = useState("");
  var offers = offState[0];
  var setOffers = offState[1];
  var phState = useState("input");
  var phase = phState[0];
  var setPhase = phState[1];
  var progState = useState(0);
  var scanProgress = progState[0];
  var setScanProgress = progState[1];
  var msgState = useState([]);
  var scanMessages = msgState[0];
  var setScanMessages = msgState[1];
  var scanDataState = useState(null);
  var scanData = scanDataState[0];
  var setScanData = scanDataState[1];

  var isPassif = mode === "passif";
  var canStart = isPassif ? cv.trim().length > 20 : (cv.trim().length > 20 && offers.trim().length > 20 && targetRole !== null && trajectory !== null);

  function handleScan() {
    setPhase("scanning");
    setScanProgress(0);
    setScanMessages([]);
    var steps = isPassif ? SCAN_STEPS_PASSIF : SCAN_STEPS_ACTIF;

    // Show progress messages
    steps.forEach(function(msg, i) {
      setTimeout(function() {
        setScanMessages(function(prev) { return prev.concat([msg]); });
        setScanProgress(((i + 1) / steps.length) * 100);
      }, (i + 1) * 600);
    });

    // Call real LLM scan if available
    if (onScan) {
      onScan(cv, offers, targetRole).then(function(data) {
        if (data && !data.error) {
          setScanData(data);
        }
        setTimeout(function() { setPhase("ready"); }, Math.max(0, steps.length * 600 + 800 - Date.now()));
        setPhase("ready");
      }).catch(function() {
        setPhase("ready");
      });
    } else {
      // Fallback: just show progress then ready
      setTimeout(function() { setPhase("ready"); }, steps.length * 600 + 800);
    }
  }

  if (!mode) {
    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>L'EXOSQUELETTE</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6", marginBottom: 8 }}>Le marche ne paie pas la performance.</div>
          <div style={{ fontSize: 14, color: "#8892b0", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>Il paie la rarete. L'outil te montre ou tu es rare, ou tu es substituable, et comment inverser le rapport de force.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <button onClick={function() { setMode("actif"); }} style={{
            background: "#0f3460", border: "2px solid #16213e", borderRadius: 12, padding: 20, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{"\uD83C\uDFAF"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 4 }}>Je vise un poste precis</div>
            <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.5 }}>L'IA extrait les KPIs caches, mesure l'elasticite du marche, et te dit ou investir ton energie.</div>
          </button>
          <button onClick={function() { setMode("passif"); }} style={{
            background: "#0f3460", border: "2px solid #16213e", borderRadius: 12, padding: 20, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{"\uD83D\uDC41\uFE0F"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 4 }}>Je veux un diagnostic rapide</div>
            <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.5 }}>L'IA scanne ton profil en 30 secondes. Tu vois ce que les recruteurs voient. Si ca te convainc, tu passes au Sprint.</div>
          </button>
        </div>
      </div>
    );
  }

  if (phase === "ready") {
    var scoreLabel = isPassif ? "SCORE DE VISIBILITE" : "SCORE DE LUCIDITE";
    var scorePct = isPassif ? 28 : 32;
    var scoreMsg = isPassif
      ? "Tu es visible sur 28% des criteres que les recruteurs utilisent pour te trouver."
      : "Tu comprends 32% des enjeux reels de tes offres cibles.";
    var subMsg = isPassif
      ? "3 KPIs cles de ton secteur t'echappent. Les recruteurs te cherchent. Ton profil ne repond pas."
      : "3 KPIs t'echappent. 2 sont sur des marches elastiques. Tu rates le terrain qui s'elargit.";

    // ITERATION 6 — Readiness diagnostic
    var readiness = estimateReadiness(cv, offers);

    return (
      <div style={{ padding: "32px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>{scoreLabel}</div>
          <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 16px" }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="#1a1a2e" strokeWidth="10" />
              <circle cx="70" cy="70" r="60" fill="none" stroke="#e94560" strokeWidth="10"
                strokeDasharray={2 * Math.PI * 60} strokeDashoffset={2 * Math.PI * 60 * (1 - scorePct / 100)}
                strokeLinecap="round" transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#e94560" }}>{scorePct}%</div>
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{scoreMsg}</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>{subMsg}</div>
        </div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, textAlign: "left" }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>{isPassif ? "CE QUE TU RATES" : "LES CAUCHEMARS QUE TU SAIS RESOUDRE (SANS LE SAVOIR)"}</div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
              <span style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600 }}>{"\uD83C\uDFAF"} {isPassif ? "Signal faible #1" : "Cauchemar #1"} : Croissance ARR Mid-Market</span>
              <span style={{ fontSize: 10, color: "#4ecca3", background: "#1a1a2e", padding: "1px 6px", borderRadius: 8 }}>{"\u2197\uFE0F"} elastique</span>
            </div>
            <div style={{ fontSize: 12, color: "#8892b0" }}>{isPassif ? "Ton profil ne mentionne aucun chiffre de croissance. Les recruteurs passent." : "Le VP Sales ne dort plus : son portefeuille Mid-Market stagne depuis 3 trimestres. L'offre le crie. Tu as le remede mais tu ne le formules pas."}</div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
              <span style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600 }}>{"\uD83C\uDFAF"} {isPassif ? "Signal faible #2" : "Cauchemar #2"} : Reduction cycle de vente</span>
              <span style={{ fontSize: 10, color: "#4ecca3", background: "#1a1a2e", padding: "1px 6px", borderRadius: 8 }}>{"\u2197\uFE0F"} elastique</span>
            </div>
            <div style={{ fontSize: 12, color: "#8892b0" }}>{isPassif ? "Aucune preuve de structuration de process. Tu es invisible sur ce critere." : "Le CFO calcule le cout du cash immobilise dans des deals qui trainent 6 mois. L'offre dit 'structurer les process'. Tu as la methode mais tu l'ecris nulle part."}</div>
          </div>
          <div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
              <span style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600 }}>{"\uD83C\uDFAF"} {isPassif ? "Signal faible #3" : "Cauchemar #3"} : Taux d'adoption outil</span>
              <span style={{ fontSize: 10, color: "#8892b0", background: "#1a1a2e", padding: "1px 6px", borderRadius: 8 }}>{"\u2194\uFE0F"} stable</span>
            </div>
            <div style={{ fontSize: 12, color: "#8892b0" }}>{isPassif ? "Tu mentionnes Salesforce sans preuve d'adoption. Le recruteur ne sait pas si tu sais faire adopter." : "Le CRO a depense 200K sur un CRM et personne ne l'utilise. L'offre dit 'Salesforce requis'. Tu sais faire adopter mais ton CV dit juste 'maitrise Salesforce'."}</div>
          </div>
        </div>

        {/* ITERATION 6 — DIAGNOSTIC DE READINESS */}
        {!isPassif && (
          <div style={{ background: readiness.readiness === "fort" ? "#4ecca3" + "15" : readiness.readiness === "moyen" ? "#ff9800" + "15" : "#e94560" + "15", borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid " + (readiness.readiness === "fort" ? "#4ecca3" : readiness.readiness === "moyen" ? "#ff9800" : "#e94560") }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{readiness.readiness === "fort" ? "\u26A1" : readiness.readiness === "moyen" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: readiness.readiness === "fort" ? "#4ecca3" : readiness.readiness === "moyen" ? "#ff9800" : "#e94560" }}>
                DIAGNOSTIC DE READINESS
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600, marginBottom: 6 }}>
              Estimation : {readiness.estimatedBricks} briques extractibles{readiness.estimatedCicatrices > 0 ? " + " + readiness.estimatedCicatrices + " cicatrice" : ""}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              {readiness.details.map(function(d, i) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: d.ok ? "#4ecca3" : "#e94560" }}>{d.ok ? "\u2714" : "\u2718"}</span>
                    <span style={{ fontSize: 11, color: d.ok ? "#8892b0" : "#e94560" }}>{d.label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
              {readiness.readiness === "fort"
                ? "Materiau dense. Le Sprint va extraire des briques fortes. Tu as les chiffres, les methodes et les signaux de leadership."
                : readiness.readiness === "moyen"
                ? "Materiau partiel. Le Sprint va extraire des briques mais certaines zones resteront floues. Prepare-toi a des missions de recuperation de donnees."
                : "Materiau faible. Le Sprint va reveler tes trous. Beaucoup de missions. C'est honnete, pas agreable. Si tu as acces a tes anciens outils (CRM, reporting), recupere tes chiffres avant de commencer."
              }
            </div>
          </div>
        )}

        {/* TRAJECTORY TOGGLE indicator */}
        {!isPassif && trajectory && (
          <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>{trajectory === "j_y_suis" ? "\uD83D\uDCCD" : "\uD83D\uDE80"}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6" }}>{trajectory === "j_y_suis" ? "J'y suis" : "J'y vais"}</div>
              <div style={{ fontSize: 10, color: "#8892b0" }}>{trajectory === "j_y_suis" ? "Le Sprint cherche la valeur cachee dans ce que tu fais deja." : "Le Sprint cherche les preuves transferables vers le poste vise."}</div>
            </div>
          </div>
        )}

        {/* LIGHT CROSS-ROLE HINT — pre-Sprint signal based on CV keywords */}
        {!isPassif && targetRole && (function() {
          var cvLower = cv.toLowerCase();
          var roleIds = Object.keys(KPI_REFERENCE);
          var hints = [];
          roleIds.forEach(function(rId) {
            if (rId === targetRole) return;
            var rd = KPI_REFERENCE[rId];
            var matchCount = 0;
            rd.kpis.forEach(function(kpi) {
              var words = kpi.name.toLowerCase().split(/[\s\/\(\)]+/).filter(function(w) { return w.length > 3; });
              words.forEach(function(w) { if (cvLower.indexOf(w) !== -1) matchCount++; });
            });
            if (matchCount >= 3) hints.push({ role: rd.role, matches: matchCount, roleId: rId });
          });
          hints.sort(function(a, b) { return b.matches - a.matches; });
          if (hints.length === 0) return null;
          var best = hints[0];
          return (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 16, borderLeft: "3px solid #3498db" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12 }}>{"\uD83D\uDDFA\uFE0F"}</span>
                <span style={{ fontSize: 11, color: "#3498db", fontWeight: 700 }}>SIGNAL : TERRAIN ADJACENT</span>
              </div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                Ton profil contient des signaux compatibles avec {best.role}. Le Sprint precisera si tes preuves couvrent ce terrain mieux que {KPI_REFERENCE[targetRole] ? KPI_REFERENCE[targetRole].role : "ton choix"}.
              </div>
            </div>
          );
        })()}

        {isPassif ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#8892b0", marginBottom: 16, lineHeight: 1.6 }}>
              Voila ce que les recruteurs voient. Si tu veux changer ca, le Sprint extrait tes preuves cachees, construit ton arsenal et te positionne sur les terrains elastiques.
            </div>
            <button onClick={function() { setMode("actif"); setPhase("input"); }} style={{
              width: "100%", padding: 16, background: "linear-gradient(135deg, #e94560, #c81d4e)",
              color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 16,
              boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
            }}>Passer au Sprint</button>
            <div style={{ fontSize: 11, color: "#495670", marginTop: 10 }}>Le profil que tu as colle est deja charge. Ajoute tes offres cibles et choisis ton poste.</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: "#495670", marginBottom: 24, textAlign: "center" }}>
              Tes hypotheses de briques sont pretes. A toi de valider.
            </div>
            <button onClick={function() { onStart(targetRole, trajectory); }} style={{
              width: "100%", padding: 16, background: "linear-gradient(135deg, #e94560, #c81d4e)",
              color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 16,
              boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
            }}>Commencer le Sprint</button>
          </div>
        )}
      </div>
    );
  }

  if (phase === "scanning") {
    var steps = isPassif ? SCAN_STEPS_PASSIF : SCAN_STEPS_ACTIF;
    return (
      <div style={{ padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>{"\uD83D\uDD0D"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6" }}>
            {isPassif ? "L'IA scanne ta visibilite" : "L'IA scanne ton profil et le marche"}
          </div>
        </div>
        <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 8, height: 6, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ width: scanProgress + "%", height: "100%", background: "linear-gradient(90deg, #e94560, #ff6b6b)", borderRadius: 8, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scanMessages.map(function(msg, i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i === scanMessages.length - 1 ? 1 : 0.5, transition: "opacity 0.3s" }}>
                <span style={{ color: "#e94560", fontSize: 14 }}>{i < scanMessages.length - 1 ? "\u2714" : "\u25B8"}</span>
                <span style={{ fontSize: 13, color: "#ccd6f6" }}>{msg}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Group clusters by bloc
  var blocs = {};
  ROLE_CLUSTERS.forEach(function(c) {
    if (!blocs[c.bloc]) blocs[c.bloc] = [];
    blocs[c.bloc].push(c);
  });
  var blocNames = Object.keys(blocs);

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>L'EXOSQUELETTE</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6", marginBottom: 8 }}>{isPassif ? "Ton profil est-il visible la ou ca compte ?" : "Identifie ou ta competence rencontre la demande."}</div>
        <div style={{ color: "#495670", fontSize: 12, marginTop: 4 }}>Temps estime : 2 minutes.</div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{"\uD83D\uDC64"}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Ton profil</span>
        </div>
        <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 8 }}>Colle ton CV, ta bio LinkedIn, ou decris ton dernier poste.</div>
        <textarea value={cv} onChange={function(e) { setCv(e.target.value); }}
          placeholder="Ex : Account Executive chez [Entreprise SaaS] (2 ans). Cycle de vente complet Mid-Market. Portefeuille de 45 comptes, ARR gere 1.2M euros..."
          style={{ width: "100%", minHeight: 120, padding: 14, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 10, color: "#ccd6f6", fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 11, color: cv.trim().length > 20 ? "#495670" : "#e94560", marginTop: 4, textAlign: "right" }}>
          {cv.trim().length > 20 ? "Suffisant" : "Minimum 20 caracteres"}
        </div>
      </div>
      {!isPassif && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>{"\uD83C\uDFAF"}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Tes cibles</span>
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 8 }}>Colle 1 a 3 offres d'emploi, ou decris le poste que tu vises.</div>
          <textarea value={offers} onChange={function(e) { setOffers(e.target.value); }}
            placeholder="Ex : Account Executive Mid-Market \u2014 Scale-up SaaS B2B serie B. Prospection outbound, demos, closing. 3+ ans experience SaaS. Salesforce requis. OTE 80-120K euros..."
            style={{ width: "100%", minHeight: 120, padding: 14, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 10, color: "#ccd6f6", fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: offers.trim().length > 20 ? "#495670" : "#e94560", marginTop: 4, textAlign: "right" }}>
            {offers.trim().length > 20 ? "Suffisant" : "Minimum 20 caracteres"}
          </div>
        </div>
      )}
      {/* ITERATION 1 — ROLE SELECTOR with clusters + toggle */}
      {!isPassif && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>{"\uD83D\uDCBC"}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Ton poste cible</span>
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 12 }}>Choisis la famille de metier. L'IA classe tes briques contre les 5 KPIs de ce poste.</div>

          {blocNames.map(function(blocName) {
            return (
              <div key={blocName} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#495670", fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{blocName}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {blocs[blocName].map(function(cluster) {
                    var sel = targetRole === cluster.id;
                    return (
                      <button key={cluster.id} onClick={function() { setTargetRole(cluster.id); }} style={{
                        background: sel ? "#0f3460" : "#1a1a2e",
                        border: sel ? "2px solid #e94560" : "2px solid #16213e",
                        borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: sel ? "#e94560" : "#ccd6f6", lineHeight: 1.3 }}>{cluster.label}</div>
                        <div style={{ fontSize: 10, color: "#8892b0", marginTop: 2 }}>{cluster.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* KPI display when role selected */}
          {targetRole && (
            <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 6 }}>5 KPIS DE CE POSTE</div>
              {KPI_REFERENCE[targetRole].kpis.map(function(k, i) {
                var eColor = k.elasticity === "elastique" ? "#4ecca3" : k.elasticity === "stable" ? "#8892b0" : "#e94560";
                var eLabel = k.elasticity === "elastique" ? "\u2197\uFE0F" : k.elasticity === "stable" ? "\u2194\uFE0F" : "\u2198\uFE0F";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: eColor }}>{eLabel}</span>
                    <span style={{ fontSize: 11, color: "#ccd6f6" }}>{k.name}</span>
                    <span style={{ fontSize: 9, color: eColor, background: "#1a1a2e", padding: "1px 6px", borderRadius: 6 }}>{k.elasticity === "elastique" ? "elastique" : k.elasticity === "stable" ? "stable" : "sous pression"}</span>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px solid #16213e", marginTop: 8, paddingTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>{"\uD83D\uDD54"}</span>
                <span style={{ fontSize: 11, color: "#ccd6f6" }}>Rendez-vous de Souverainete : {KPI_REFERENCE[targetRole].cadenceLabel}</span>
                <span style={{ fontSize: 9, color: "#495670" }}>({KPI_REFERENCE[targetRole].cadence}j)</span>
              </div>
              <div style={{ fontSize: 10, color: "#8892b0", marginTop: 4, lineHeight: 1.4 }}>{KPI_REFERENCE[targetRole].cadenceReason}</div>
            </div>
          )}

          {/* ITERATION 1 — TOGGLE "J'Y SUIS / J'Y VAIS" */}
          {targetRole && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 700, marginBottom: 8 }}>Tu y es deja ou tu veux y acceder ?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={function() { setTrajectory("j_y_suis"); }} style={{
                  flex: 1, padding: "14px 8px",
                  background: trajectory === "j_y_suis" ? "#0f3460" : "#1a1a2e",
                  border: trajectory === "j_y_suis" ? "2px solid #e94560" : "2px solid #16213e",
                  borderRadius: 10, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{"\uD83D\uDCCD"}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: trajectory === "j_y_suis" ? "#e94560" : "#ccd6f6" }}>J'y suis</div>
                  <div style={{ fontSize: 10, color: "#8892b0", marginTop: 4, lineHeight: 1.4 }}>Je fais deja ce metier. Je veux etre mieux positionne.</div>
                </button>
                <button onClick={function() { setTrajectory("j_y_vais"); }} style={{
                  flex: 1, padding: "14px 8px",
                  background: trajectory === "j_y_vais" ? "#0f3460" : "#1a1a2e",
                  border: trajectory === "j_y_vais" ? "2px solid #e94560" : "2px solid #16213e",
                  borderRadius: 10, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{"\uD83D\uDE80"}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: trajectory === "j_y_vais" ? "#e94560" : "#ccd6f6" }}>J'y vais</div>
                  <div style={{ fontSize: 10, color: "#8892b0", marginTop: 4, lineHeight: 1.4 }}>Je vise ce metier. Je viens d'un autre poste.</div>
                </button>
              </div>
              {trajectory && (
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: trajectory === "j_y_suis" ? "#4ecca3" : "#3498db", lineHeight: 1.5 }}>
                    {trajectory === "j_y_suis"
                      ? "Le Sprint va chercher la valeur cachee dans ce que tu fais deja. Quels accomplissements valent cher ? Lesquels ne valent plus rien face a l'IA ? L'angle est : tu es expert, montre-le."
                      : "Le Sprint va chercher les preuves transferables dans ton experience. Quels indicateurs du poste vise couvres-tu deja ? Quels trous faut-il combler ? L'angle est : tu as fait le travail, tu n'avais pas le titre."
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <button onClick={handleScan} disabled={!canStart} style={{
        width: "100%", padding: 16,
        background: canStart ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
        color: canStart ? "#fff" : "#495670", border: canStart ? "none" : "2px solid #16213e",
        borderRadius: 12, cursor: canStart ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 15,
        boxShadow: canStart ? "0 4px 20px rgba(233,69,96,0.3)" : "none",
      }}>{canStart ? (isPassif ? "Scanner ma visibilite" : "Lancer l'extraction") : "Remplis les champs pour commencer"}</button>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={function() { setMode(null); setCv(""); setOffers(""); setTargetRole(null); setTrajectory(null); }} style={{
          flex: 1, padding: 10, background: "#1a1a2e", color: "#495670", border: "1px solid #16213e",
          borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
        }}>{"\u2190"} Changer de mode</button>
      </div>
    </div>
  );
}

/* ==============================
   APP
   ============================== */

export default function Sprint({ initialState, onStateChange, onScan }) {
  var scrState = useState(initialState && initialState.screen ? initialState.screen : "onboarding");
  var screen = scrState[0];
  var setScreen = scrState[1];
  var stepState = useState(initialState && initialState.activeStep != null ? initialState.activeStep : 0);
  var activeStep = stepState[0];
  var setActiveStep = stepState[1];
  var brState = useState(initialState && initialState.bricks ? initialState.bricks : []);
  var bricks = brState[0];
  var setBricks = brState[1];
  var vState = useState(initialState && initialState.vault ? initialState.vault : { bricks: 0, missions: 0, pillars: 0, corrections: 0 });
  var vault = vState[0];
  var setVault = vState[1];
  var doneState = useState(initialState && initialState.sprintDone ? initialState.sprintDone : false);
  var sprintDone = doneState[0];
  var setSprintDone = doneState[1];
  var toastState = useState(null);
  var toastBrick = toastState[0];
  var setToastBrick = toastState[1];
  var nextIdState = useState(initialState && initialState.nextId ? initialState.nextId : 100);
  var nextId = nextIdState[0];
  var setNextId = nextIdState[1];
  var duelState = useState(initialState && initialState.duelResults ? initialState.duelResults : []);
  var duelResults = duelState[0];
  var setDuelResults = duelState[1];
  var paranoState = useState(true);
  var paranoMode = paranoState[0];
  var roleState = useState(initialState && initialState.targetRoleId ? initialState.targetRoleId : null);
  var targetRoleId = roleState[0];
  var setTargetRoleId = roleState[1];
  var costState = useState(initialState && initialState.nightmareCosts ? initialState.nightmareCosts : {});
  var nightmareCosts = costState[0];
  var setNightmareCosts = costState[1];
  var trajState = useState(initialState && initialState.trajectoryToggle ? initialState.trajectoryToggle : null);
  var trajectoryToggle = trajState[0];
  var setTrajectoryToggle = trajState[1];
  var takesState = useState(initialState && initialState.takes ? initialState.takes : []);
  var takes = takesState[0];
  var setTakes = takesState[1];
  var seedsState = useState(function() {
    return initialState && initialState.targetRoleId ? generateAdaptiveSeeds(initialState.targetRoleId) : generateAdaptiveSeeds(null);
  });
  var seeds = seedsState[0];
  var setSeeds = seedsState[1];

  // Persistence : notify parent on every meaningful state change
  var persistRef = useRef(null);
  useEffect(function() {
    if (!onStateChange) return;
    if (persistRef.current) clearTimeout(persistRef.current);
    persistRef.current = setTimeout(function() {
      onStateChange({
        screen: screen, activeStep: activeStep, bricks: bricks, vault: vault,
        sprintDone: sprintDone, nextId: nextId, duelResults: duelResults,
        targetRoleId: targetRoleId, nightmareCosts: nightmareCosts,
        trajectoryToggle: trajectoryToggle, takes: takes,
      });
    }, 500);
  }, [screen, activeStep, bricks, vault, sprintDone, nextId, duelResults, targetRoleId, nightmareCosts, trajectoryToggle, takes]);

  var maturity = getMaturityLevel(bricks);

  function handleForge(seed) {
    // TAKE TYPE — store as take, not brick
    if (seed.type === "take") {
      var take = {
        id: seed.id,
        text: seed.takeText,
        analysis: seed.takeAnalysis,
        pillar: seed.pillarPreview,
        status: "validated",
      };
      setTakes(function(prev) { return prev.concat([take]); });
      // Also store in bricks array for seed tracking (so allSeedsDone works)
      setBricks(function(prev) { return prev.concat([{ id: seed.id, text: seed.takeText, kpi: null, skills: [], usedIn: seed.usedIn, status: "validated", type: "take", brickType: "take" }]); });
      return;
    }

    var kpiMatch = targetRoleId ? matchKpiToReference(seed.kpi || "", targetRoleId) : null;
    var brick = {
      id: seed.id, text: seed.generatedText, kpi: seed.kpi,
      skills: seed.skills, usedIn: seed.usedIn,
      status: "validated", owned: true, brickType: seed.type,
      brickCategory: seed.brickCategory, elasticity: seed.elasticity,
      nightmareText: seed.nightmareText || null,
      anonymizedText: seed.anonymizedText || null,
      anonAuditTrail: seed.anonAuditTrail || null,
      anonStatus: seed.anonAuditTrail ? (seed.anonAuditTrail.findingsAtConfirm === 0 ? "OK" : "partiel") : (seed.anonymizedText ? "non_audite" : null),
      kpiRefMatch: kpiMatch,
      internalAdvocacy: seed.internalAdvocacy || null,
      controlRisk: seed.controlRisk || null,
      advocacyText: seed.advocacyText || null,
      type: "brick", corrected: false,
    };
    setBricks(function(prev) { return prev.concat([brick]); });
    setVault(function(prev) { return Object.assign({}, prev, { bricks: prev.bricks + 1 }); });
    setToastBrick(brick);
  }

  function handleCorrect(seed, correctedText) {
    var kpiMatch = targetRoleId ? matchKpiToReference(seed.kpi || "", targetRoleId) : null;
    var brick = {
      id: seed.id, text: correctedText, kpi: seed.kpi,
      skills: seed.skills, usedIn: seed.usedIn,
      status: "validated", owned: true, brickType: seed.type,
      brickCategory: seed.brickCategory, elasticity: seed.elasticity,
      nightmareText: seed.nightmareText || null,
      anonymizedText: seed.anonymizedText || null,
      anonAuditTrail: seed.anonAuditTrail || null,
      anonStatus: seed.anonAuditTrail ? (seed.anonAuditTrail.findingsAtConfirm === 0 ? "OK" : "partiel") : (seed.anonymizedText ? "non_audite" : null),
      kpiRefMatch: kpiMatch,
      internalAdvocacy: seed.internalAdvocacy || null,
      controlRisk: seed.controlRisk || null,
      advocacyText: seed.advocacyText || null,
      type: "brick", corrected: true,
    };
    setBricks(function(prev) { return prev.concat([brick]); });
    setVault(function(prev) { return Object.assign({}, prev, { bricks: prev.bricks + 1, corrections: prev.corrections + 1 }); });
    setToastBrick(brick);
  }

  function handleMission(seed) {
    var mission = {
      id: seed.id, text: seed.missionText, kpi: seed.kpi,
      skills: [], usedIn: [], status: "pending", owned: false, type: "mission",
    };
    setBricks(function(prev) { return prev.concat([mission]); });
    setVault(function(prev) { return Object.assign({}, prev, { missions: prev.missions + 1 }); });
    setToastBrick(mission);
  }

  function handleSkip(id) {
    setBricks(function(prev) { return prev.concat([{ id: id, text: "", kpi: "", skills: [], usedIn: [], status: "skipped", type: "brick" }]); });
  }

  function handleAddBrick(text, kpi, category) {
    var newBrick = { id: nextId, text: text, kpi: kpi, skills: [], usedIn: ["CV", "Simulateur", "Posts"], status: "validated", owned: true, brickType: "preuve", brickCategory: category || "chiffre", type: "brick", corrected: false };
    setNextId(nextId + 1);
    setBricks(function(prev) { return prev.concat([newBrick]); });
    setVault(function(prev) { return Object.assign({}, prev, { bricks: prev.bricks + 1 }); });
  }

  function handleValPillars(count, selectedIds, takePillars, aiPillars) {
    // Store which pillars were selected with their source info
    var selectedPillars = selectedIds.map(function(id) {
      var tp = takePillars.find(function(p) { return p.id === id; });
      if (tp) return { id: id, title: tp.title, desc: tp.desc, source: "take", depth: tp.depth };
      var ap = aiPillars.find(function(p) { return p.id === id; });
      if (ap) return { id: id, title: ap.title, desc: ap.desc, source: "ai" };
      return { id: id, source: "unknown" };
    });
    setVault(function(prev) { return Object.assign({}, prev, { pillars: count, selectedPillars: selectedPillars }); });
    setActiveStep(2);
  }

  function handleDuelComplete(results) {
    setDuelResults(results);
    setSprintDone(true);
  }

  var allSeedsDone = seeds.every(function(s) {
    return bricks.some(function(b) { return b.id === s.id; });
  });

  var density = computeDensityScore(bricks);

  var wrap = {
    color: "#ccd6f6",
    fontFamily: "'Inter', -apple-system, sans-serif",
  };

  if (screen === "onboarding") {
    return (
      <div style={wrap}>
        <Onboarding onStart={function(role, traj) { setTargetRoleId(role); setTrajectoryToggle(traj); setSeeds(generateAdaptiveSeeds(role)); setScreen("sprint"); }} onScan={onScan} />
      </div>
    );
  }

  function renderContent() {
    if (sprintDone) return <EndScreen vault={vault} bricks={bricks} duelResults={duelResults} maturity={maturity} targetRoleId={targetRoleId} nightmareCosts={nightmareCosts} trajectoryToggle={trajectoryToggle} />;
    if (activeStep === 0) {
      return (
        <div>
          <Interrogation seeds={seeds} bricks={bricks} onForge={handleForge} onCorrect={handleCorrect} onMission={handleMission} onSkip={handleSkip} onAddBrick={handleAddBrick} paranoMode={paranoMode} targetRoleId={targetRoleId} />
          {allSeedsDone && density.unlocks.forge && (
            <button onClick={function() { setActiveStep(1); }} style={{
              width: "100%", marginTop: 16, padding: 14, background: "#0f3460", color: "#ccd6f6",
              border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
            }}>Passer a la Forge {"\u2192"}</button>
          )}
          {allSeedsDone && !density.unlocks.forge && (
            <div style={{ background: "#e94560" + "22", borderRadius: 10, padding: 14, marginTop: 16, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>{"\uD83D\uDD12"} Verrou de Densite</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
                Il faut au moins 3 briques validees pour passer a la Forge. Tu en as {density.details.brickCount}. Ajoute des briques ou valide celles en attente.
              </div>
            </div>
          )}
        </div>
      );
    }
    if (activeStep === 1) return <Pillars pillars={getAdaptivePillars(targetRoleId)} takes={takes} onVal={handleValPillars} />;
    if (activeStep === 2) {
      return (
        <div>
          {density.unlocks.armement ? (
            <div>
              <Locked title="Affutage" desc="Audit CV, prises de position, rapport d'impact." />
              <button onClick={function() { setActiveStep(3); }} style={{
                width: "100%", marginTop: 16, padding: 14, background: "#0f3460", color: "#ccd6f6",
                border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
              }}>Passer a l'Armement {"\u2192"}</button>
            </div>
          ) : (
            <div>
              <Locked title="Affutage" desc="Audit CV, prises de position, rapport d'impact." />
              <div style={{ background: "#e94560" + "22", borderRadius: 10, padding: 14, marginTop: 16, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>{"\uD83D\uDD12"} Densite insuffisante : {density.score}%</div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
                  L'Armement s'ouvre a 70%. {density.details.blindedCount === 0 ? "Aucune brique blindee. Corrige et enrichis tes briques." : density.details.blindedRatio + "% de briques blindees. Continue."}
                  {density.details.cauchemarCoverage < 3 ? " " + (3 - density.details.cauchemarCoverage) + " cauchemar" + (3 - density.details.cauchemarCoverage > 1 ? "s" : "") + " non couvert" + (3 - density.details.cauchemarCoverage > 1 ? "s" : "") + "." : ""}
                  {!density.details.hasCicatrice ? " Aucune cicatrice assumee." : ""}
                </div>
                <button onClick={function() { setActiveStep(0); }} style={{
                  marginTop: 10, padding: "8px 20px", background: "#0f3460", color: "#ccd6f6",
                  border: "1px solid #e94560", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12,
                }}>{"\u2190"} Retour a l'Interrogatoire</button>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (activeStep === 3) {
      return <Duel questions={DUEL_QUESTIONS} bricks={bricks} onComplete={handleDuelComplete} targetRoleId={targetRoleId} />;
    }
    return null;
  }

  return (
    <div style={wrap}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>L'EXOSQUELETTE</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ccd6f6" }}>Sprint \u2014 Calibre en cours</div>
        {targetRoleId && KPI_REFERENCE[targetRoleId] && (
          <div style={{ fontSize: 11, color: "#495670", marginTop: 4 }}>{"\uD83C\uDFAF"} {KPI_REFERENCE[targetRoleId].role} ({KPI_REFERENCE[targetRoleId].sector}) {trajectoryToggle === "j_y_suis" ? "\u00B7 J'y suis" : trajectoryToggle === "j_y_vais" ? "\u00B7 J'y vais" : ""}</div>
        )}
      </div>
      {!sprintDone && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8892b0", marginBottom: 6 }}>
            <span style={{ color: density.score >= 70 ? "#4ecca3" : density.score >= 50 ? "#3498db" : "#e94560" }}>
              Densite : {density.score}%
            </span>
            <span>
              {density.score < 50 ? "Verrou actif \u2014 blinde tes briques" : density.score < 70 ? "Seuil de sortie : 70%" : "\uD83D\uDD13 Arsenal pret"}
            </span>
          </div>
          <Bar pct={density.score} />
        </div>
      )}
      {!sprintDone && <Nav steps={STEPS} active={activeStep} onSelect={setActiveStep} density={density} />}
      {!sprintDone && <Vault v={vault} maturity={maturity} bricks={bricks} nightmareCosts={nightmareCosts} onCostChange={function(cId, val) { setNightmareCosts(function(prev) { var next = Object.assign({}, prev); next[cId] = val; return next; }); }} />}
      {!sprintDone && <CVPreview bricks={bricks} />}
      {!sprintDone && <InvestmentIndex bricks={bricks} />}
      {!sprintDone && <CrossRoleInsight bricks={bricks} targetRoleId={targetRoleId} trajectoryToggle={trajectoryToggle} />}
      <div style={{ background: "#16213e", borderRadius: 12, padding: 20 }}>
        {renderContent()}
      </div>
      {toastBrick && <FeedbackToast brick={toastBrick} onDone={function() { setToastBrick(null); }} />}
    </div>
  );
}
