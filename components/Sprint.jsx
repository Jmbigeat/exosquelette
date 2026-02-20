"use client";
import { useState, useEffect, useCallback, useRef } from "react";

var SCAN_STEPS_ACTIF = [
  "Analyse du profil en cours...",
  "Extraction des compétences cles...",
  "Scan des offres cibles...",
  "Identification des KPIs caches...",
  "Extraction des cauchemars du décideur...",
  "Cartographie de l'élasticité marche...",
  "Simulation de l'entonnoir recruteur...",
  "Croisement profil et marche...",
  "Detection des terrains adjacents...",
  "Preparation des questions de prise de position...",
  "Calcul du Fosse detecte...",
  "Coffre-Fort initialise.",
];

var SCAN_STEPS_PASSIF = [
  "Analyse du profil en cours...",
  "Extraction des compétences cles...",
  "Scan de visibilité sectorielle...",
  "Identification des signaux faibles...",
  "Cartographie de l'élasticité marche...",
  "Croisement profil et marche...",
  "Calcul du Fosse detecte...",
  "Coffre-Fort initialise.",
];

/* ==============================
   FILTRE RÉDACTIONNEL — appliqué à tout texte généré
   Règles : voix active, pas de remplissage, pas de métronome,
   pas de règle de trois, pas de méta-commentaire, vocabulaire banni.
   ============================== */

var REDAC_BANNIS = [
  { from: /\bapprofondir\b/gi, to: "creuser" },
  { from: /\bfavoriser\b/gi, to: "servir" },
  { from: /\bfavorise\b/gi, to: "sert" },
  { from: /\bcomplexes\b/gi, to: function(m, offset, str) {
    var before = str.slice(Math.max(0, offset - 20), offset).toLowerCase();
    if (/\b(des|les|ces|quelles|approches|situations|tâches|phases|périodes|structures|compétences|équipes)\s*$/.test(before)) return "dures";
    return "durs";
  }},
  { from: /\bcomplexe\b/gi, to: function(m, offset, str) {
    var before = str.slice(Math.max(0, offset - 15), offset).toLowerCase();
    if (/\b(une|la|cette|quelle|approche|situation|tâche|phase|période|structure)\s*$/.test(before)) return "dure";
    return "dur";
  }},
  { from: /\bmettre en lumière\b/gi, to: "montrer" },
  { from: /\bmis en lumière\b/gi, to: "montré" },
  { from: /\bpourrait offrir\b/gi, to: "donne" },
  { from: /\bpourraient offrir\b/gi, to: "donnent" },
  { from: /\bil est important de noter que\b/gi, to: "" },
  { from: /\bil convient de souligner que\b/gi, to: "" },
  { from: /\ben conclusion\b/gi, to: "" },
  { from: /\bde plus,\b/gi, to: "" },
  { from: /\bcependant\b/gi, to: "mais" },
  { from: /\btoutefois\b/gi, to: "mais" },
  { from: /\bnéanmoins\b/gi, to: "mais" },
  { from: /\bdans cette section nous allons\b/gi, to: "" },
  { from: /\bafin de\b/gi, to: "pour" },
  { from: /\bdans le but de\b/gi, to: "pour" },
  { from: /\ben ce qui concerne\b/gi, to: "sur" },
  { from: /\bau niveau de\b/gi, to: "sur" },
  { from: /\bvéritablement\b/gi, to: "" },
  { from: /\blittéralement\b/gi, to: "" },
  { from: /\bvraiment\b/gi, to: "" },
  { from: /\btrès\b/gi, to: "" },
  { from: /\bgame[ -]?changer\b/gi, to: "" },
  { from: /\bdisruptif(s|ve|ves)?\b/gi, to: "" },
  { from: /\brévolutionner\b/gi, to: "changer" },
  { from: /\brévolutionne\b/gi, to: "change" },
  { from: /\btu pourrais\b/gi, to: "tu peux" },
  { from: /\bon pourrait\b/gi, to: "on peut" },
  { from: /\bil pourrait\b/gi, to: "il peut" },
  { from: /\belle pourrait\b/gi, to: "elle peut" },
  { from: /\btu devrais\b/gi, to: "tu dois" },
  { from: /\bon devrait\b/gi, to: "on doit" },
  { from: /\bil faudrait\b/gi, to: "il faut" },
  { from: /\bil semble(rait)? que\b/gi, to: "" },
  { from: /\bcela semble(rait)?\b/gi, to: "c'est" },
  { from: /\bça semble(rait)?\b/gi, to: "c'est" },
  { from: /\bplonger dans\b/gi, to: "entrer dans" },
  { from: /\bplongeons dans\b/gi, to: "entrons dans" },
  { from: /\bembarquer\b/gi, to: "commencer" },
  { from: /\bembarquons\b/gi, to: "commencons" },
  { from: /\btapisserie\b/gi, to: "" },
  { from: /\bpaysage\b/gi, to: "terrain" },
  { from: /\broyaume\b/gi, to: "domaine" },
  { from: /\bimaginez que\b/gi, to: "" },
  { from: /\bimaginez un(e)?\b/gi, to: "Prenons un$1" },
  { from: /\bon peut imaginer\b/gi, to: "" },
  { from: /\bon peut espérer\b/gi, to: "on attend" },
  { from: /\bespérons que\b/gi, to: "" },
  { from: /\bil faut espérer\b/gi, to: "" },
];

function cleanRedac(text, mode) {
  if (!text || typeof text !== "string") return text;
  var result = text;
  var isLivrable = mode === "livrable";

  // 1. Mots bannis → remplacements
  REDAC_BANNIS.forEach(function(rule) {
    // En mode livrable : préserver "complexe" (mot juste pour un recruteur)
    if (isLivrable && rule.from.toString().indexOf("complexe") !== -1) return;
    result = result.replace(rule.from, rule.to);
  });

  // 2. Nettoyage des espaces doubles et lignes vides créés par les suppressions
  result = result.replace(/  +/g, " ").replace(/\n /g, "\n").replace(/\n{3,}/g, "\n\n").replace(/^\s+/, "").replace(/\s+$/, "");

  // 3. Phrases qui commencent par une minuscule après suppression
  result = result.replace(/\. {1,2}[a-zéèêàùâîôû]/g, function(match) {
    return match.slice(0, -1) + match.slice(-1).toUpperCase();
  });

  // 4. Règle de trois — UNIQUEMENT en mode coaching
  // En mode livrable, lister 3 actions ou 3 résultats est légitime
  if (!isLivrable) {
    result = result.replace(/([A-ZÀ-Ú][^,]{3,30}), ([^,]{3,30}),? et ([^.]{3,40})\./g, function(match, a, b, c) {
      if (a.length > 35 || b.length > 35 || c.length > 45) return match;
      return a.trim() + " et " + b.trim() + ". " + c.trim().charAt(0).toUpperCase() + c.trim().slice(1) + " aussi.";
    });
  }

  // 5. Anti-métronome — UNIQUEMENT en mode coaching
  // En mode livrable, les phrases courtes sont du scan 6 secondes
  if (!isLivrable) {
    var sentences = result.split(/(?<=\.)\s+/);
    if (sentences.length >= 3) {
      var merged = [];
      var shortStreak = 0;
      for (var i = 0; i < sentences.length; i++) {
        var s = sentences[i];
        if (s.length < 25 && s.length > 2) {
          shortStreak++;
          if (shortStreak >= 3 && merged.length > 0) {
            merged[merged.length - 1] = merged[merged.length - 1].replace(/\.\s*$/, "") + " — " + s.charAt(0).toLowerCase() + s.slice(1);
            continue;
          }
        } else {
          shortStreak = 0;
        }
        merged.push(s);
      }
      result = merged.join(" ");
    }
  }

  // 6. Première lettre du texte en majuscule si suppression a laissé une minuscule
  if (result.length > 0 && /^[a-zéèêàùâîôû]/.test(result)) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}

var STEPS = [
  { gate: "OUVERT", title: "Extraction", icon: "\u26CF\uFE0F", desc: "Valide tes briques" },
  { gate: "3+ BRIQUES", title: "Assemblage", icon: "\uD83D\uDD28", desc: "Assemble et blinde" },
  { gate: "BLINDAGE 50%", title: "Polissage", icon: "\uD83D\uDD2A", desc: "Audit et positions" },
  { gate: "BLINDAGE 70%", title: "Calibration", icon: "\uD83C\uDFAF", desc: "Duel et scripts" },
];

// Density Lock — global quality score that gates progression
function computeDensityScore(bricks, cauchemars) {
  var activeCauch = cauchemars || CAUCHEMARS_CIBLES;
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
    var hasMethod = ["via", "grace a", "méthode", "process", "programme", "plan", "stratégie", "structure", "deploye", "mis en place", "construit", "installe"].some(function(m) { return text.indexOf(m) !== -1; });
    var hasContext = ["mois", "semaine", "trimestre", "jours", "équipe", "comptes", "commerciaux", "clients", "personnes"].some(function(m) { return text.indexOf(m) !== -1; });
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
  activeCauch.forEach(function(c) {
    if (c.kpis && c.kpis.some(function(k) { return coveredKpis[k]; })) coveredCauchemars++;
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
   Elasticite: élastique / stable / sous_pression
   ============================== */

var KPI_REFERENCE = {
  "enterprise_ae": {
    role: "Enterprise Account Executive",
    sector: "SaaS/Tech", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Cycles de deals courts, pipeline en mouvement constant. Chaque mois sans mise a jour est un mois de negotiation a l'aveugle.",
    kpis: [
      { name: "Alignement Multi-décideurs", elasticity: "élastique", why: "L'IA ne gere pas la politique interne d'un grand compte. C'est de l'influence pure." },
      { name: "Valeur Contractuelle (ACV)", elasticity: "stable", why: "Mesure la taille du deal. Standard, mais nécessaire pour prouver l'échelle." },
      { name: "Taux de Conquete (Win Rate)", elasticity: "élastique", why: "Prouve la capacité a battre la concurrence par la stratégie, pas par le prix." },
      { name: "Vitesse du Cycle de Vente", elasticity: "élastique", why: "Réduire le temps de décision dans le flou est un levier de cash massif." },
      { name: "Volume de Prospection", elasticity: "sous_pression", why: "L'IA génère déjà des séquences de mails. Zéro valeur ajoutée humaine ici." },
    ]
  },
  "head_of_growth": {
    role: "Head of Growth",
    sector: "Growth/Marketing", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Cycles de tests courts. Les metriques bougent chaque semaine. Cristalliser les apprentissages chaque mois empêche l'amnesie.",
    kpis: [
      { name: "LTV / CAC Ratio", elasticity: "élastique", why: "L'arbitrage final entre coût d'acquisition et valeur long-terme est une decision d'Architecte." },
      { name: "Taux d'Experimentation Reussie", elasticity: "élastique", why: "L'IA propose 100 tests, l'humain choisit les 2 qui vont scaler." },
      { name: "Retention (Cohortes)", elasticity: "stable", why: "Indicateur de sante du produit. Moins élastique que la stratégie d'acquisition." },
      { name: "CPA (Cout par Acquisition)", elasticity: "sous_pression", why: "L'IA optimise les enchères publicitaires mieux que n'importe quel humain." },
      { name: "Viralite / K-Factor", elasticity: "élastique", why: "Creer un desir organique demande une comprehension profonde de la psychologie humaine." },
    ]
  },
  "strategic_csm": {
    role: "Strategic Customer Success Manager",
    sector: "Customer Success", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Churn et expansion se jouent au mois. Chaque renouvellement est un arbitrage. Le documenter en temps réel est le seul filet.",
    kpis: [
      { name: "Net Revenue Retention (NRR)", elasticity: "élastique", why: "Faire croitre un compte existant demande une influence politique constante." },
      { name: "Expansion Revenue (Upsell)", elasticity: "élastique", why: "Identifier le besoin metier avant le client est un acte de pure lucidite." },
      { name: "Taux de Churn Predictif", elasticity: "stable", why: "L'IA détecté les signaux de depart, l'humain doit agir sur les causes profondes." },
      { name: "Nombre de Tickets Support", elasticity: "sous_pression", why: "La gestion du flux de problèmes est automatisable via Chatbots/IA." },
      { name: "NPS / CSAT", elasticity: "sous_pression", why: "La satisfaction declaree est souvent un bruit de fond inélastique." },
    ]
  },
  "senior_pm": {
    role: "Senior Product Manager",
    sector: "Product", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Les arbitrages produit se cristallisent par quarter. Trop frequent tue la profondeur. Trop rare efface les decisions.",
    kpis: [
      { name: "ROI des Fonctionnalites", elasticity: "élastique", why: "Decider de tuer une feature pour sauver le produit est un arbitrage critique." },
      { name: "Time-to-Market (Velocite)", elasticity: "élastique", why: "Orchestrer les équipes pour livrer vite dans le chaos est un levier majeur." },
      { name: "Adoption Rate (Usage)", elasticity: "stable", why: "Mesure si le produit est utile. C'est la base, pas forcement le levier." },
      { name: "Redaction de User Stories", elasticity: "sous_pression", why: "Claude ecrit déjà des specs parfaites. Zero levier pour un PM Senior." },
      { name: "Priorisation du Backlog", elasticity: "élastique", why: "Dire non a 99% des demandes demande un courage politique non-substituable." },
    ]
  },
  "ai_architect": {
    role: "AI Solution Architect",
    sector: "AI/Tech", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Projets de fond, arbitrages infra lourds. Le rythme trimestriel s'aligne sur les cycles budgétaires.",
    kpis: [
      { name: "Reduction de la Latence Decisionnelle", elasticity: "élastique", why: "Son role est de faire gagner des semaines a l'entreprise via l'IA." },
      { name: "Coût d'Infra / ROI IA", elasticity: "élastique", why: "Arbitrer entre puissance de modèle et rentabilite est une brique de Decision pure." },
      { name: "Taux d'Erreur (Hallucination)", elasticity: "stable", why: "Technique. Indispensable mais c'est de l'optimisation, pas de la stratégie." },
      { name: "Nombre de Prompts Créés", elasticity: "sous_pression", why: "Quantité vs Qualité. La génération de prompts devient une commodité." },
      { name: "Adoption Interne des Outils IA", elasticity: "élastique", why: "L'IA ne s'implemente pas seule, il faut vaincre la resistance humaine." },
    ]
  },
  "engineering_manager": {
    role: "Engineering Manager",
    sector: "Engineering", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Les decisions techniques structurantes se prennent par quarter. Build vs Buy, dette technique, retention talent.",
    kpis: [
      { name: "Densité de Talent (Retention)", elasticity: "élastique", why: "Garder les meilleurs devs en 2026 demande un cadre d'execution exceptionnel." },
      { name: "Cycle Time (Commit to Deploy)", elasticity: "élastique", why: "Fluidifier le passage à l'acte technique est l'actif principal du manager." },
      { name: "Qualite du Code (Bugs/Dette)", elasticity: "stable", why: "L'IA aide a nettoyer le code. C'est de l'hygiene de base." },
      { name: "Lignes de Code Produites", elasticity: "sous_pression", why: "L'IA produit des milliers de lignes. C'est une metrique de vanite." },
      { name: "Arbitrage Build vs Buy", elasticity: "élastique", why: "Decider d'acheter une solution plutot que de la coder est une decision de survie." },
    ]
  },
  "management_consultant": {
    role: "Management Consultant",
    sector: "Conseil", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Les missions durent 2-6 mois. Le rythme trimestriel capture un cycle complet de livraison.",
    kpis: [
      { name: "Taux d'Acceptation des Recommandations", elasticity: "élastique", why: "Vendre une idée difficile à un comité de direction est l'apogée de l'influence." },
      { name: "Impact sur l'EBITDA", elasticity: "élastique", why: "Prouver un gain financier direct après intervention est la brique ultime." },
      { name: "Clarte du Diagnostic", elasticity: "stable", why: "L'IA synthetise les données. L'expert en extrait le sens cache." },
      { name: "Nombre de Slides Produites", elasticity: "sous_pression", why: "Le Slide-making est mort. L'IA fait des decks en 2 minutes." },
      { name: "Vitesse de Resolution de Crise", elasticity: "élastique", why: "Agir vite quand tout brule est ce qui justifie le TJM eleve." },
    ]
  },
  "strategy_associate": {
    role: "Strategy & Corporate Associate",
    sector: "Strategy/Finance", cadence: 180, cadenceLabel: "Semestrielle", cadenceReason: "Évolution lente. Les arbitrages stratégiques se comptent par semestre. Focus sur l'alignement politique et les jalons annuels.",
    kpis: [
      { name: "Precision des Signaux Faibles", elasticity: "élastique", why: "Voir une menace dans un rapport SEC avant les autres est un levier pur." },
      { name: "Fiabilite des Modeles Financiers", elasticity: "stable", why: "C'est de l'ingenierie financiere. L'IA ne doit pas faire d'erreur ici." },
      { name: "Alignement du Comex", elasticity: "élastique", why: "Transformer une analyse en decision collective est de l'influence de haut vol." },
      { name: "Synthese de Rapports Annuels", elasticity: "sous_pression", why: "N'importe quel LLM resume 200 pages en 5 secondes. Zero valeur." },
      { name: "Impact M&A (Synergies)", elasticity: "élastique", why: "Evaluer si deux cultures peuvent fusionner demande une intuition humaine." },
    ]
  },
  "operations_manager": {
    role: "Operations Manager / BizOps",
    sector: "Operations", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "L'Ops vit au rythme des process. Chaque mois amène de nouvelles frictions inter-services à documenter.",
    kpis: [
      { name: "Reduction de la Charge Cognitive", elasticity: "élastique", why: "Simplifier le travail des autres pour qu'ils se concentrent sur le levier." },
      { name: "Taux de Passage à l'Acte (Output)", elasticity: "élastique", why: "Transformer une idée en processus fluide est le cœur de l'Ops." },
      { name: "Cout Operationnel Unitaire", elasticity: "stable", why: "Mesure l'efficience. Important pour la rentabilite." },
      { name: "Maintenance des Outils (SaaS)", elasticity: "sous_pression", why: "L'IA gere l'interoperabilite des outils. Tache administrative a faible valeur." },
      { name: "Indice de Friction Inter-services", elasticity: "élastique", why: "Resoudre les conflits entre Sales et Produit est un arbitrage humain." },
    ]
  },
  "fractional_coo": {
    role: "Fractional COO",
    sector: "Scale & Performance", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Flux de decisions rapide, multiplicite des clients. Justifier le ROI chaque mois est une question de survie.",
    kpis: [
      { name: "Acceleration du Runway", elasticity: "élastique", why: "Faire gagner 6 mois de survie a une boite est l'actif le plus cher du marché." },
      { name: "Alignement des Equipes N-1", elasticity: "élastique", why: "S'assurer que tout le monde court dans la même direction sans etre la 24/7." },
      { name: "Mise en Place du Cadre (Governance)", elasticity: "stable", why: "Indispensable pour scaler, mais c'est de la structure, pas encore du pivot." },
      { name: "Reporting Hebdomadaire", elasticity: "sous_pression", why: "L'automatisation du reporting est totale en 2026." },
      { name: "ROI du Temps de Direction", elasticity: "élastique", why: "Maximiser chaque minute du CEO est le levier de saillance ultime du COO." },
    ]
  },
};

/* ==============================
   OFFRES DYNAMIQUES — Item 8
   Templates de cauchemars par role + parsing d'offre
   ============================== */

var CAUCHEMAR_TEMPLATES_BY_ROLE = {
  enterprise_ae: [
    { kpis: ["Alignement Multi-décideurs"], kw: ["grand compte", "enterprise", "c-level", "comite", "multi", "stakeholder", "cycle long", "complexe", "key account", "strategic"], label: "Deals bloques en politique interne", nightmare: "4 decideurs. Aucun ne signe. Le commercial precedent a perdu 6 mois sur ce deal.", cost: [200000, 800000], context: "Cout du blocage politique : deals en stand-by, forecast non fiable, credibilite en chute." },
    { kpis: ["Valeur Contractuelle (ACV)"], kw: ["arr", "mrr", "acv", "revenue", "chiffre d'affaires", "panier moyen", "deal size", "mid-market", "upsell"], label: "Valeur contractuelle en erosion", nightmare: "Le panier moyen baisse. Les deals se signent mais pour moins cher. Le board demande des comptes.", cost: [150000, 600000], context: "Erosion du ACV : pression concurrentielle + remises non-strategiques." },
    { kpis: ["Taux de Conquete (Win Rate)"], kw: ["win rate", "taux de conversion", "closing", "concurrence", "competitif", "appel d'offre", "rfp", "benchmark"], label: "Win rate en chute libre", nightmare: "L'equipe perd 7 deals sur 10. La concurrence mange le pipeline. Le VP Sales ne dort plus.", cost: [300000, 1000000], context: "Chaque point de win rate perdu = pipeline entier devalue." },
    { kpis: ["Vitesse du Cycle de Vente"], kw: ["cycle de vente", "time to close", "pipeline", "forecast", "velocite", "acceleration", "process", "structurer"], label: "Deals qui trainent 6 mois", nightmare: "Le CFO calcule le cout du cash immobilise. Les deals meurent de vieillesse dans le CRM.", cost: [100000, 500000], context: "Cash immobilise dans des deals non-clos + cout d'opportunite." },
    { kpis: ["Volume de Prospection"], kw: ["prospection", "outbound", "lead", "sdr", "bdr", "generation", "cold call", "sequence", "mail"], label: "Pipeline vide en amont", nightmare: "Zero deal en entree de pipe. L'equipe attend. Le trimestre est deja perdu.", cost: [100000, 400000], context: "Pipeline sec = trimestre condamne. Chaque semaine sans lead est irreversible." },
  ],
  head_of_growth: [
    { kpis: ["LTV / CAC Ratio"], kw: ["ltv", "cac", "ratio", "rentabilite", "payback", "unit economics", "marge", "burn"], label: "LTV/CAC desequilibre", nightmare: "Chaque client acquis coute plus qu'il ne rapporte. Le burn rate accelere. Les investisseurs voient rouge.", cost: [200000, 800000], context: "Desequilibre LTV/CAC : chaque euro depense en acquisition detruit de la valeur." },
    { kpis: ["Taux d'Experimentation Reussie"], kw: ["a/b test", "experimentation", "test", "hypothese", "growth hack", "iteration", "data-driven", "growth"], label: "100 tests, zero signal", nightmare: "L'equipe teste tout. Rien ne scale. Le CEO demande où passe le budget.", cost: [100000, 500000], context: "Tests sans these = bruit. Budget consomme sans apprentissage." },
    { kpis: ["Retention (Cohortes)"], kw: ["retention", "cohorte", "churn", "engagement", "activation", "onboarding", "stickiness"], label: "Seau perce en activation", nightmare: "Le produit acquiert 1000 users par mois. 800 partent. La croissance est une illusion.", cost: [150000, 600000], context: "Chaque point de churn annule l'effort d'acquisition." },
    { kpis: ["CPA (Cout par Acquisition)"], kw: ["cpa", "cout", "paid", "ads", "adwords", "facebook ads", "meta ads", "budget media", "roas", "roi"], label: "CPA qui explose", nightmare: "Le cout par lead a double en 6 mois. Le meme budget génère 2x moins de clients.", cost: [100000, 400000], context: "Inflation publicitaire + saturation des canaux." },
    { kpis: ["Viralite / K-Factor"], kw: ["viralite", "referral", "organique", "bouche a oreille", "plg", "product-led", "k-factor", "nps"], label: "Croissance 100% achetee", nightmare: "Zero viralite. Chaque client vient de la pub. Le jour où le budget coupe, la croissance meurt.", cost: [100000, 500000], context: "Dependance totale aux canaux payes = fragilite structurelle." },
  ],
  strategic_csm: [
    { kpis: ["Net Revenue Retention (NRR)"], kw: ["nrr", "net revenue", "retention", "base installee", "renouvellement", "contrat", "expansion"], label: "Base qui retrecit", nightmare: "Le NRR passe sous 100%. La base installee fond. Chaque mois detruit du revenu recurrent.", cost: [200000, 800000], context: "NRR < 100% = entreprise qui retrecit meme en signant des nouveaux clients." },
    { kpis: ["Expansion Revenue (Upsell)"], kw: ["upsell", "cross-sell", "expansion", "upgrade", "adoption", "usage", "croissance organique"], label: "Zero expansion sur la base", nightmare: "Les clients paient le minimum. Personne ne detecte les besoins latents. Le revenu est flat.", cost: [150000, 600000], context: "Upsell manque : chaque client sous-exploite est du revenu invisible." },
    { kpis: ["Taux de Churn Predictif"], kw: ["churn", "attrition", "depart", "resiliation", "desengagement", "signal faible", "health score"], label: "Hemorragie de churn", nightmare: "Le churn bouffe la croissance. Chaque client perdu coute 5x. Personne ne voit les signaux.", cost: [150000, 600000], context: "Chaque point de churn = 5x le cout d'acquisition en revenus perdus." },
    { kpis: ["Nombre de Tickets Support"], kw: ["support", "ticket", "escalade", "incident", "bug", "sla", "satisfaction"], label: "Equipe noyee sous les tickets", nightmare: "L'equipe passe 80% du temps en reactif. Zero temps pour l'upsell. Les clients strategiques attendent.", cost: [80000, 300000], context: "Reactif tue le proactif. L'equipe eteint des feux au lieu de construire." },
    { kpis: ["NPS / CSAT"], kw: ["nps", "csat", "satisfaction", "feedback", "survey", "enquete", "voix du client"], label: "Satisfaction en chute silencieuse", nightmare: "Le NPS chute. Les clients ne se plaignent pas. Ils partent. Le signal arrive trop tard.", cost: [100000, 400000], context: "Satisfaction en baisse = churn futur. Le decalage temporel est le piege." },
  ],
  senior_pm: [
    { kpis: ["ROI des Fonctionnalites"], kw: ["roi", "impact", "fonctionnalite", "feature", "valeur", "priorisation", "discovery", "outcome"], label: "Features sans impact", nightmare: "L'equipe livre 12 features par quarter. 10 ne bougent aucune metrique. Le roadmap est un catalogue.", cost: [150000, 500000], context: "Features sans ROI = dette produit. Chaque sprint gaspille detruit la confiance engineering." },
    { kpis: ["Time-to-Market (Velocite)"], kw: ["time to market", "velocite", "sprint", "livraison", "agile", "scrum", "delivery", "release"], label: "Time-to-market en retard", nightmare: "La concurrence sort des features chaque semaine. L'equipe met 3 mois pour livrer. Le marche n'attend pas.", cost: [100000, 400000], context: "Retard de livraison = fenetre de marche ratee." },
    { kpis: ["Adoption Rate (Usage)"], kw: ["adoption", "usage", "engagement", "activation", "dau", "mau", "retention produit"], label: "Produit lance, personne ne l'utilise", nightmare: "L'adoption stagne a 15%. Le CEO demande pourquoi les users n'accrochent pas.", cost: [100000, 400000], context: "Feature livree sans adoption = investissement perdu." },
    { kpis: ["Redaction de User Stories"], kw: ["user story", "spec", "prd", "documentation", "brief", "cahier des charges"], label: "Specs floues, equipe perdue", nightmare: "L'engineering code dans le vide. Les specs changent en plein sprint. Le rework mange 40% du temps.", cost: [80000, 300000], context: "Specs instables = rework + frustration engineering." },
    { kpis: ["Priorisation du Backlog"], kw: ["priorisation", "backlog", "roadmap", "strategie", "arbitrage", "stakeholder", "trade-off"], label: "Backlog sans arbitrage", nightmare: "50 demandes. Zero tri. Le produit dit oui a tout le monde et ne livre rien d'important.", cost: [100000, 400000], context: "Priorisation absente = produit mediocre sur tous les fronts." },
  ],
  ai_architect: [
    { kpis: ["Reduction de la Latence Decisionnelle"], kw: ["decision", "latence", "automatisation", "workflow", "process", "temps", "efficacite"], label: "Decisions IA bloquees", nightmare: "Le projet IA est approuve depuis 6 mois. Personne n'avance. La concurrence deploie.", cost: [200000, 800000], context: "Chaque semaine de retard IA = avantage concurrentiel perdu." },
    { kpis: ["Cout d'Infra / ROI IA"], kw: ["cout", "infra", "cloud", "gpu", "compute", "budget", "roi", "rentabilite"], label: "Budget IA sans ROI", nightmare: "La facture cloud explose. Le CFO demande le ROI. Personne ne sait le calculer.", cost: [150000, 600000], context: "Investissement IA sans mesure = gouffre financier." },
    { kpis: ["Taux d'Erreur (Hallucination)"], kw: ["hallucination", "erreur", "precision", "qualite", "fiabilite", "guardrail", "eval"], label: "IA qui hallucine en prod", nightmare: "Le modele sort des reponses fausses. Les utilisateurs perdent confiance. Le projet risque l'arret.", cost: [100000, 500000], context: "Erreur en production = confiance detruite. Reconstruction lente." },
    { kpis: ["Nombre de Prompts Créés"], kw: ["prompt", "llm", "modele", "fine-tuning", "rag", "embedding", "generation"], label: "Prompts sans strategie", nightmare: "100 prompts crees. Zero industrialise. L'equipe reinvente la roue chaque semaine.", cost: [80000, 300000], context: "Multiplication sans capitalisation = effort perdu." },
    { kpis: ["Adoption Interne des Outils IA"], kw: ["adoption", "change management", "formation", "resistance", "transformation", "interne"], label: "Equipes qui refusent l'IA", nightmare: "L'outil est la. Personne ne l'utilise. Les equipes contournent et font a l'ancienne.", cost: [150000, 500000], context: "Investissement IA sans adoption = argent perdu." },
  ],
  engineering_manager: [
    { kpis: ["Densité de Talent (Retention)"], kw: ["retention", "talent", "recrutement", "turn-over", "depart", "senior", "equipe", "culture"], label: "Fuite de talents", nightmare: "Le meilleur dev est parti. Le deuxieme negocie. Le troisieme attend une offre. L'equipe se vide.", cost: [200000, 800000], context: "Remplacement d'un dev senior : 6 mois de productivite perdue + cout de recrutement." },
    { kpis: ["Cycle Time (Commit to Deploy)"], kw: ["cycle time", "deploy", "ci/cd", "release", "pipeline", "devops", "livraison"], label: "Cycle de deploy trop lent", nightmare: "Un commit met 3 semaines a atteindre la prod. La concurrence livre en 3 heures.", cost: [100000, 400000], context: "Cycle lent = feedback lent = produit deconnecte du marche." },
    { kpis: ["Qualite du Code (Bugs/Dette)"], kw: ["bug", "dette technique", "qualite", "refactoring", "test", "coverage", "regression"], label: "Dette technique qui paralyse", nightmare: "Chaque feature prend 3x le temps prevu. La dette technique mange les sprints.", cost: [100000, 400000], context: "Dette technique = taxe invisible sur chaque livraison." },
    { kpis: ["Lignes de Code Produites"], kw: ["productivite", "output", "velocite", "story point", "throughput"], label: "Productivite en chute", nightmare: "L'equipe travaille 60h mais le throughput baisse. Le probleme n'est pas l'effort.", cost: [80000, 300000], context: "Productivite en baisse = signal de management, pas d'effort." },
    { kpis: ["Arbitrage Build vs Buy"], kw: ["build vs buy", "make or buy", "saas", "outil", "integration", "api", "vendor"], label: "Build inutile sur un probleme resolu", nightmare: "L'equipe construit en interne un outil qui existe a 50 euros par mois. 6 mois perdus.", cost: [150000, 500000], context: "Build par fierte detruit plus de valeur qu'il n'en cree." },
  ],
  management_consultant: [
    { kpis: ["Taux d'Acceptation des Recommandations"], kw: ["recommandation", "presentation", "comite", "direction", "decision", "strategie", "accompagnement"], label: "Recommandations ignorees", nightmare: "Le deck est parfait. Le comite dit oui puis ne fait rien. L'impact est nul.", cost: [200000, 800000], context: "Recommandation acceptee sans execution = mission sans valeur." },
    { kpis: ["Impact sur l'EBITDA"], kw: ["ebitda", "p&l", "resultat", "marge", "rentabilite", "cout", "economies"], label: "Mission sans impact financier", nightmare: "6 mois de mission. Le client ne sait pas chiffrer l'impact. Le renouvellement est compromis.", cost: [150000, 600000], context: "Impact non mesure = valeur non percue = client perdu." },
    { kpis: ["Clarte du Diagnostic"], kw: ["diagnostic", "analyse", "audit", "etat des lieux", "transformation", "assessment"], label: "Diagnostic flou", nightmare: "Le diagnostic dit tout et ne tranche rien. Le client reste paralyse.", cost: [100000, 400000], context: "Diagnostic sans arbitrage = consultant remplacable par un LLM." },
    { kpis: ["Nombre de Slides Produites"], kw: ["slide", "powerpoint", "deck", "presentation", "rapport", "deliverable"], label: "Livrables sans substance", nightmare: "80 slides. Zero insight. Le partner demande où est la valeur ajoutée.", cost: [80000, 300000], context: "Slide-making sans pensée = commodite pure." },
    { kpis: ["Vitesse de Resolution de Crise"], kw: ["crise", "urgence", "restructuration", "transformation", "turnaround", "cost cutting"], label: "Crise non resolue", nightmare: "La crise dure depuis 3 mois. Le consultant precedent a produit des slides. Rien n'a change.", cost: [300000, 1000000], context: "En crise, chaque semaine coute. Le TJM se justifie par la vitesse." },
  ],
  strategy_associate: [
    { kpis: ["Precision des Signaux Faibles"], kw: ["signal", "veille", "marche", "tendance", "concurrence", "disruption", "analyse"], label: "Signaux faibles ignores", nightmare: "Le concurrent a vu la tendance 6 mois avant. Le Comex decouvre le probleme dans la presse.", cost: [200000, 800000], context: "Signal faible manque = decision strategique en retard." },
    { kpis: ["Fiabilite des Modeles Financiers"], kw: ["modele", "financier", "forecast", "projection", "budget", "plan", "business plan"], label: "Modeles financiers non fiables", nightmare: "La projection etait fausse de 40%. Le board a pris une decision sur des chiffres errones.", cost: [150000, 600000], context: "Modele faux = decision fausse = capital mal alloue." },
    { kpis: ["Alignement du Comex"], kw: ["comex", "board", "gouvernance", "alignement", "politique", "consensus", "arbitrage"], label: "Comex desaligne", nightmare: "Le CEO veut croissance. Le CFO veut profitabilite. Personne ne tranche. L'entreprise zigzague.", cost: [300000, 1000000], context: "Comex desaligne = paralysie strategique." },
    { kpis: ["Synthese de Rapports Annuels"], kw: ["rapport", "synthese", "analyse", "data", "benchmark", "etude"], label: "Analyse sans synthese", nightmare: "200 pages de donnees. Zero recommandation. Le directeur strategie demande 'et alors ?'", cost: [80000, 300000], context: "Data sans sens = bruit couteux." },
    { kpis: ["Impact M&A (Synergies)"], kw: ["m&a", "acquisition", "fusion", "synergie", "integration", "due diligence"], label: "Synergies M&A fantomes", nightmare: "L'acquisition est faite. Les synergies annoncees ne se materialisent pas. Le write-off approche.", cost: [500000, 2000000], context: "70% des fusions detruisent de la valeur. L'enjeu est dans l'execution." },
  ],
  operations_manager: [
    { kpis: ["Reduction de la Charge Cognitive"], kw: ["charge", "cognitive", "simplification", "process", "procedure", "workflow", "automatisation"], label: "Equipes surchargees", nightmare: "Les equipes passent 60% du temps sur des taches admin. Le vrai travail se fait en heures sup.", cost: [100000, 400000], context: "Charge cognitive excessive = erreurs + burn-out + turnover." },
    { kpis: ["Taux de Passage à l'Acte (Output)"], kw: ["execution", "output", "implementation", "deploiement", "mise en oeuvre", "projet"], label: "Idees sans execution", nightmare: "10 projets lances. 2 termines. Les autres meurent dans des spreadsheets.", cost: [100000, 400000], context: "Execution manquee = strategie inexistante." },
    { kpis: ["Cout Operationnel Unitaire"], kw: ["cout", "operationnel", "efficience", "optimisation", "budget", "reduction"], label: "Couts operationnels qui derapent", nightmare: "Le cout par transaction double. La marge fond. Personne ne sait où ça part.", cost: [100000, 400000], context: "Cout unitaire en hausse = rentabilite en erosion silencieuse." },
    { kpis: ["Maintenance des Outils (SaaS)"], kw: ["outil", "saas", "stack", "integration", "api", "interoperabilite", "migration"], label: "Stack techno ingerable", nightmare: "15 outils. Aucun ne se parle. L'equipe copie-colle entre 3 interfaces. 4h par jour perdues.", cost: [80000, 300000], context: "Stack fragmentee = donnees en silo + temps perdu." },
    { kpis: ["Indice de Friction Inter-services"], kw: ["friction", "silo", "transverse", "collaboration", "inter-equipe", "coordination", "communication"], label: "Guerre entre les services", nightmare: "Sales accuse Produit. Produit accuse Engineering. Le client attend au milieu.", cost: [150000, 500000], context: "Friction inter-services = retard client + turnover interne." },
  ],
  fractional_coo: [
    { kpis: ["Acceleration du Runway"], kw: ["runway", "cash", "burn", "levee", "financement", "tresorerie", "survie", "serie"], label: "Runway qui fond", nightmare: "6 mois de cash. Pas de levee en vue. Chaque decision compte double.", cost: [300000, 1000000], context: "Chaque mois de runway gagne = une chance supplementaire de pivoter." },
    { kpis: ["Alignement des Equipes N-1"], kw: ["equipe", "management", "n-1", "alignement", "organisation", "restructuration", "scale"], label: "Equipes N-1 desalignees", nightmare: "3 directors. 3 strategies. Le CEO arbitre a la journee. Zero coherence.", cost: [200000, 800000], context: "N-1 desaligne = execution chaotique = runway grille plus vite." },
    { kpis: ["Mise en Place du Cadre (Governance)"], kw: ["gouvernance", "cadre", "process", "structure", "kpi", "reporting", "suivi"], label: "Zero cadre de gouvernance", nightmare: "Pas de process. Pas de KPI. Le CEO gere au feeling. Ca marchait a 10, ca casse a 50.", cost: [150000, 500000], context: "Absence de cadre = decisions par urgence, pas par strategie." },
    { kpis: ["Reporting Hebdomadaire"], kw: ["reporting", "dashboard", "tableau de bord", "suivi", "visibilite", "data"], label: "Pilotage a l'aveugle", nightmare: "Le board demande les chiffres. Personne ne les a. Le CFO passe 2 jours a compiler.", cost: [80000, 300000], context: "Reporting manuel = donnees toujours en retard." },
    { kpis: ["ROI du Temps de Direction"], kw: ["direction", "ceo", "cofondateur", "temps", "delegation", "focus", "priorite"], label: "CEO noye dans l'operationnel", nightmare: "Le CEO passe 70% du temps a eteindre des feux. Zero temps strategie. Zero temps produit.", cost: [200000, 800000], context: "Temps du CEO mal alloue = cout d'opportunite maximum." },
  ],
};

/* Urgency boosters — keywords that increase cauchemar severity */
var OFFER_URGENCY_KEYWORDS = ["urgent", "asap", "immédiat", "rapidement", "des que possible", "forte croissance", "hyper-croissance", "scale-up", "restructuration", "remplacement", "depart", "critique", "prioritaire", "creation de poste", "ouverture de poste"];

/* Parse offer text and score cauchemar templates */
function parseOfferSignals(offersText, roleId) {
  if (!offersText || offersText.trim().length < 20) return null;
  var lower = offersText.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u").replace(/[ôö]/g, "o").replace(/[îï]/g, "i");
  var templates = CAUCHEMAR_TEMPLATES_BY_ROLE[roleId] || CAUCHEMAR_TEMPLATES_BY_ROLE.enterprise_ae;

  // Detect urgency
  var urgencyScore = 0;
  var urgencyHits = [];
  OFFER_URGENCY_KEYWORDS.forEach(function(u) {
    if (lower.indexOf(u) !== -1) { urgencyScore++; urgencyHits.push(u); }
  });

  // Score each template against offer text
  var scored = templates.map(function(t, i) {
    var hits = 0;
    var matchedKw = [];
    t.kw.forEach(function(k) {
      var kNorm = k.replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u").replace(/[ôö]/g, "o").replace(/[îï]/g, "i");
      if (lower.indexOf(kNorm) !== -1) { hits++; matchedKw.push(k); }
    });
    return { template: t, hits: hits, matchedKw: matchedKw, index: i };
  });

  // Sort: most keyword hits first, then by template order (elastic first in KPI_REFERENCE)
  scored.sort(function(a, b) {
    if (b.hits !== a.hits) return b.hits - a.hits;
    return a.index - b.index;
  });

  // Build top 3 cauchemars
  var active = scored.slice(0, 3).map(function(s, i) {
    var t = s.template;
    var costStr = formatCost(t.cost[0]) + "-" + formatCost(t.cost[1]);
    return {
      id: i + 1,
      label: t.label,
      kpis: t.kpis,
      nightmareShort: t.nightmare,
      costRange: t.cost,
      costUnit: "an",
      costContext: t.context,
      negoFrame: "La discussion ne porte pas sur ton salaire. Elle porte sur les " + costStr + " que ce probleme leur coute chaque annee.",
      costSymbolique: "Le signal interne : si ce probleme persiste, la confiance du board s'erode. Les meilleurs partent vers des equipes qui avancent.",
      costSystemique: "Effet domino : chaque mois sans resolution aggrave les problemes adjacents. Le cout reel depasse le perimetre visible.",
      detected: s.hits > 0,
      matchedKw: s.matchedKw,
      hitCount: s.hits,
    };
  });

  return {
    cauchemars: active,
    urgencyScore: urgencyScore,
    urgencyHits: urgencyHits,
    totalSignals: scored.reduce(function(sum, s) { return sum + s.hits; }, 0),
  };
}

/* Build active cauchemars from parsed signals or fall back to defaults */
function buildActiveCauchemars(parsedOffers, roleId) {
  if (parsedOffers && parsedOffers.cauchemars && parsedOffers.cauchemars.length >= 3) {
    return parsedOffers.cauchemars;
  }
  // Fallback: generate from role templates without offer matching
  var templates = CAUCHEMAR_TEMPLATES_BY_ROLE[roleId] || CAUCHEMAR_TEMPLATES_BY_ROLE.enterprise_ae;
  return templates.slice(0, 3).map(function(t, i) {
    var costStr = formatCost(t.cost[0]) + "-" + formatCost(t.cost[1]);
    return {
      id: i + 1,
      label: t.label,
      kpis: t.kpis,
      nightmareShort: t.nightmare,
      costRange: t.cost,
      costUnit: "an",
      costContext: t.context,
      negoFrame: "La discussion ne porte pas sur ton salaire. Elle porte sur les " + costStr + " que ce probleme leur coute chaque annee.",
      costSymbolique: "",
      costSystemique: "",
      detected: false,
      matchedKw: [],
      hitCount: 0,
    };
  });
}

/* Merge signals from multiple offers into unified cauchemar list */
function mergeOfferSignals(offersArray, roleId) {
  if (!offersArray || offersArray.length === 0) return null;
  var allScored = {};
  var totalSignals = 0;
  var allUrgencyHits = [];
  var urgencyScore = 0;

  offersArray.forEach(function(offer) {
    var parsed = parseOfferSignals(offer.text, roleId);
    if (!parsed) return;
    totalSignals += parsed.totalSignals;
    urgencyScore += parsed.urgencyScore;
    parsed.urgencyHits.forEach(function(h) { if (allUrgencyHits.indexOf(h) === -1) allUrgencyHits.push(h); });
    parsed.cauchemars.forEach(function(c) {
      var key = c.label;
      if (!allScored[key]) {
        allScored[key] = { template: c, totalHits: 0, allKw: [], offerIds: [] };
      }
      allScored[key].totalHits += c.hitCount;
      allScored[key].offerIds.push(offer.id);
      c.matchedKw.forEach(function(kw) { if (allScored[key].allKw.indexOf(kw) === -1) allScored[key].allKw.push(kw); });
    });
  });

  var merged = Object.keys(allScored).map(function(key) {
    var s = allScored[key];
    var c = Object.assign({}, s.template);
    c.hitCount = s.totalHits;
    c.matchedKw = s.allKw;
    c.detected = s.totalHits > 0;
    c.offerIds = s.offerIds;
    return c;
  });

  merged.sort(function(a, b) { return b.hitCount - a.hitCount; });
  var top3 = merged.slice(0, 3).map(function(c, i) { c.id = i + 1; return c; });

  return {
    cauchemars: top3,
    urgencyScore: urgencyScore,
    urgencyHits: allUrgencyHits,
    totalSignals: totalSignals,
  };
}

/* Detect sector dispersion across offers */
var SECTOR_KEYWORDS = {
  "SaaS/Tech": ["saas", "software", "tech", "cloud", "plateforme", "api", "startup"],
  "Finance": ["banque", "finance", "assurance", "investissement", "trading", "fintech", "audit"],
  "Conseil": ["conseil", "consulting", "cabinet", "strategie", "transformation", "big four"],
  "Industrie": ["industrie", "manufacturing", "production", "supply chain", "logistique", "usine"],
  "Santé": ["sante", "pharma", "medical", "biotech", "hopital", "clinique", "laboratoire"],
  "Retail": ["retail", "commerce", "e-commerce", "distribution", "magasin", "marketplace"],
  "Media": ["media", "agence", "communication", "publicite", "marketing digital", "contenu"],
  "Education": ["education", "formation", "edtech", "ecole", "universite", "enseignement"],
};

function checkOfferCoherence(offersArray) {
  if (!offersArray || offersArray.length < 2) return { coherent: true, sectors: [], message: null };
  var detectedSectors = {};
  offersArray.forEach(function(offer) {
    var lower = offer.text.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
    Object.keys(SECTOR_KEYWORDS).forEach(function(sector) {
      var hits = 0;
      SECTOR_KEYWORDS[sector].forEach(function(kw) { if (lower.indexOf(kw) !== -1) hits++; });
      if (hits >= 1) {
        if (!detectedSectors[sector]) detectedSectors[sector] = [];
        detectedSectors[sector].push(offer.id);
      }
    });
  });
  var sectorList = Object.keys(detectedSectors);
  if (sectorList.length >= 4) {
    return { coherent: false, sectors: sectorList, message: "Tes offres ciblent " + sectorList.length + " secteurs différents. Ta densité se dilue. Concentre sur 1-2 secteurs." };
  }
  return { coherent: true, sectors: sectorList, message: null };
}

var TARGET_ROLES = Object.keys(KPI_REFERENCE).map(function(key) {
  return { id: key, role: KPI_REFERENCE[key].role, sector: KPI_REFERENCE[key].sector };
});

/* ==============================
   ROLE CLUSTERS — 10 grouped buttons
   Labels: client-facing titles (not référence names)
   Subtitles: questions (not descriptions)
   ============================== */

var ROLE_CLUSTERS = [
  { id: "enterprise_ae", bloc: "Croissance", label: "Commercial / Account Executive / Business Developer", subtitle: "Tu gères un cycle de vente ou un portefeuille ?", sectorLabel: "Vente" },
  { id: "head_of_growth", bloc: "Croissance", label: "Growth / Marketing Manager / Acquisition", subtitle: "Tu mesures un coût d'acquisition ou un taux de conversion ?", sectorLabel: "Marketing" },
  { id: "strategic_csm", bloc: "Croissance", label: "Customer Success / Account Manager / Support Lead", subtitle: "Tu geres la retention ou l'upsell ?", sectorLabel: "Relation client" },
  { id: "senior_pm", bloc: "Produit & Tech", label: "Chef de Projet / Product Manager / Product Owner", subtitle: "Tu arbitres entre le besoin, la faisabilite et le budget ?", sectorLabel: "Produit" },
  { id: "engineering_manager", bloc: "Produit & Tech", label: "Tech Lead / Engineering Manager / CTO adjoint", subtitle: "Tu decides de l'architecture ou tu geres des developpeurs ?", sectorLabel: "Tech" },
  { id: "ai_architect", bloc: "Produit & Tech", label: "Data / IA / Solution Architect", subtitle: "Tu construis ou tu arbitres des systèmes de données ?", sectorLabel: "Data & IA" },
  { id: "management_consultant", bloc: "Stratégie & Ops", label: "Consultant / Manager en cabinet", subtitle: "Tu vends des recommandations et tu mesures ton impact ?", sectorLabel: "Conseil" },
  { id: "strategy_associate", bloc: "Stratégie & Ops", label: "Strategie / Finance / M&A", subtitle: "Tu produis des modèles financiers ou tu influences un comite de direction ?", sectorLabel: "Strategie" },
  { id: "operations_manager", bloc: "Stratégie & Ops", label: "Operations / Chef de Projet transverse / BizOps", subtitle: "Tu fluidifies les process entre les équipes ?", sectorLabel: "Operations" },
  { id: "fractional_coo", bloc: "Stratégie & Ops", label: "Direction / COO / Directeur de BU", subtitle: "Tu alignes des équipes, tu gères un P&L ou tu optimises le temps de la direction ?", sectorLabel: "Direction" },
];

// Match a brick's KPI text against the référence for a given role
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
        if (match.elasticity === "élastique") { elasticMatches++; matchedKpis.push({ kpi: match.name, elasticity: match.elasticity, brick: b.text.length > 50 ? b.text.slice(0, 50) + "..." : b.text }); }
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
      if (match.elasticity === "élastique") currentElastic++;
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
  { id: 1, label: "Portefeuille en stagnation", kpis: ["Croissance MRR", "Pipeline généré"], nightmareShort: "Le VP Sales ne dort plus : son portefeuille stagne.", costRange: [200000, 800000], costUnit: "an", costContext: "Coût de stagnation Mid-Market : pipeline non-converti, renouvellements flat, opportunités d'upsell manquées.", negoFrame: "La discussion ne porte pas sur ton salaire. Elle porte sur les {cost} que ce portefeuille en stagnation leur coûte chaque année.", costSymbolique: "Le board voit un segment flat. La confiance dans l'équipe commerciale s'érode. Les talents partent vers des équipes qui grandissent.", costSystemique: "Pas de référence client dans le segment. Les autres AE n'ont pas de précédent pour ouvrir des deals similaires. Le pipeline indirect n'existe pas." },
  { id: 2, label: "Hémorragie de churn", kpis: ["Taux de retention"], nightmareShort: "Le churn bouffe la croissance. Chaque client perdu coûte 5x.", costRange: [150000, 600000], costUnit: "an", costContext: "Coût du churn : chaque point de churn dans un portefeuille Mid-Market représente 5x le coût d'acquisition en revenus perdus.", negoFrame: "Tu ne négocies pas une augmentation. Tu négocies le prix de l'arrêt de l'hémorragie. {cost} par an partent en fumée.", costSymbolique: "Un client qui part parle. Les prospects du même secteur entendent. La réputation du produit se dégrade.", costSystemique: "Chaque client perdu est une référence en moins. Les deals en cours perdent un point d'appui. Le marketing perd un cas client." },
  { id: 3, label: "Deals qui traînent / outils morts", kpis: ["Cycle de vente", "Adoption outil"], nightmareShort: "Les deals traînent 6 mois. Le CRM coûte 200K et personne ne l'utilise.", costRange: [100000, 500000], costUnit: "an", costContext: "Coût du cycle long : cash immobilisé dans des deals non-clos + licence CRM sans adoption = destruction de valeur silencieuse.", negoFrame: "Le CFO calcule le coût du cash immobilisé. {cost} par an disparaissent dans des deals qui auraient dû closer 3 mois plus tôt.", costSymbolique: "L'équipe perd confiance dans les outils. Le management perd visibilité sur le pipeline. Les prévisions deviennent fiction.", costSystemique: "Sans données fiables, chaque décision d'allocation de ressources est un pari. Les recrutements sont retardés. La croissance est freinée par l'absence de visibilité." },
];

/* DONNÉES MARCHÉ — Source APEC, mise à jour annuelle */
/* Utilisées par : diagnostic (Fossé), cauchemar (friction candidat), Duel (ancrage négo) */
var MARKET_DATA = {
  source: "APEC 2022-2023 / Baromètres recrutement IA 2025-2026",
  lastUpdate: "2026",
  fosse: {
    salaire_median_cadre: 52000,
    ecart_salaire_marche: { min: 10, max: 20, unit: "%" },
    gain_changement_employeur: 6,
    gain_sans_changement: 3,
    part_estiment_gagner_plus: { pct: 44, seuil: "5%" },
    part_augmentes_changement: 74,
    part_augmentes_interne: 72,
    part_augmentes_meme_poste: 55,
  },
  friction: {
    ghosting: 62,
    duree_chomage_jours: { min: 328, max: 350 },
    candidatures_pour_offre: "30-80 candidatures → 5-10 entretiens → 0-1 offre en 6 mois",
    refus_si_process_long: 57,
    delai_recrutement_semaines: 12,
    hausse_candidatures_ia: 239,
    cout_par_embauche_ia: { min: 1800, max: 2400, unit: "€" },
  },
  ia_recrutement: {
    candidats_utilisent_ia_france: 52,
    candidats_utilisent_ia_global: 65,
    entreprises_integrent_ia: 87,
    tri_cv_par_ia: 83,
    projection_adoption_fin_2026: 95,
    precision_tri_ia: { min: 87, max: 89, unit: "%" },
    reduction_temps_traitement: { min: 70, max: 82, unit: "%" },
    entreprises_reconnaissent_biais: 67,
  },
  linkedin: {
    posts_par_jour: 2000000,
    impressions_par_semaine: 9000000000,
    taux_engagement_moyen: { min: 3, max: 4, unit: "%" },
    pct_publient_regulierement: 5.2,
    frequence_optimale: { min: 2, max: 5, unit: "posts/semaine" },
    offres_par_seconde: 140,
    candidatures_par_seconde: 77,
  },
  nego: {
    cherchent_a_negocier: 60,
    femmes_pensent_pas_assez_atouts: 20,
    hommes_pensent_pas_assez_atouts: 7,
    motivation_salaire: 48,
    motivation_missions: 27,
    risque_percu_changement: 49,
    pensent_plus_dur_quavant: 58,
  },
  reconversion: {
    projet_reconversion: 31,
    demarches_entamees: 8,
    ecart_intention_action: 23,
    acceptent_remuneration_plus_faible: 42,
    cherchent_sens: 37,
    cherchent_conditions: 35,
    ennui_lassitude: 34,
  },
};

/* Génère un résumé Fossé chiffré pour le diagnostic */
function computeFosseMarket(salaire) {
  var sal = salaire || MARKET_DATA.fosse.salaire_median_cadre;
  var minPerte = Math.round(sal * MARKET_DATA.fosse.ecart_salaire_marche.min / 100);
  var maxPerte = Math.round(sal * MARKET_DATA.fosse.ecart_salaire_marche.max / 100);
  return {
    salaire: sal,
    perteMensuelleMin: Math.round(minPerte / 12),
    perteMensuelleMax: Math.round(maxPerte / 12),
    perteAnnuelleMin: minPerte,
    perteAnnuelleMax: maxPerte,
    contexte: MARKET_DATA.fosse.part_augmentes_changement + "% des cadres qui changent sont augmentés. " + MARKET_DATA.fosse.part_augmentes_meme_poste + "% de ceux qui restent.",
    ecartGain: "+" + MARKET_DATA.fosse.gain_changement_employeur + "% en changeant vs +" + MARKET_DATA.fosse.gain_sans_changement + "% en restant.",
    intentionVsAction: MARKET_DATA.reconversion.projet_reconversion + "% veulent bouger. " + MARKET_DATA.reconversion.demarches_entamees + "% bougent. Le Fossé est là.",
  };
}

/* Global active cauchemars — set by Sprint component, used by all utility functions */
var _activeCauchemars = null;
function getActiveCauchemars() { return _activeCauchemars || CAUCHEMARS_CIBLES; }
function setActiveCauchemarsGlobal(c) { _activeCauchemars = c; }

// Negotiation script generator
function computeNegotiationBrief(bricks, cauchemars) {
  var activeCauch = cauchemars || CAUCHEMARS_CIBLES;
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var coverage = computeCauchemarCoverage(bricks, cauchemars);
  var coveredCauchemars = coverage.filter(function(c) { return c.covered; });
  if (coveredCauchemars.length === 0) return null;

  var totalCostLow = 0;
  var totalCostHigh = 0;
  var lines = [];

  coveredCauchemars.forEach(function(cc) {
    var cauch = getActiveCauchemars().find(function(c) { return c.id === cc.id; });
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
  return {
    totalCostLow: totalCostLow, totalCostHigh: totalCostHigh, lines: lines, coveredCount: coveredCauchemars.length, totalCount: getActiveCauchemars().length,
    marketContext: {
      pctNegocient: MARKET_DATA.nego.cherchent_a_negocier,
      pctFemmesFrein: MARKET_DATA.nego.femmes_pensent_pas_assez_atouts,
      pctHommesFrein: MARKET_DATA.nego.hommes_pensent_pas_assez_atouts,
      pctRisquePercu: MARKET_DATA.nego.risque_percu_changement,
      ancrage: "Le candidat moyen arrive sans chiffre. " + MARKET_DATA.nego.cherchent_a_negocier + "% tentent de négocier. Toi tu arrives avec le coût du problème. Tu es dans les " + (100 - MARKET_DATA.nego.cherchent_a_negocier) + "% qui cadrent la discussion.",
    },
  };
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
    var cauch = getActiveCauchemars().find(function(c) { return c.id === cc.id; });
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
        reason: "Ta preuve repose sur un KPI automatisable. Le recruteur sait que l'IA fait ce travail. Tu te positionnes comme le remède avec un outil que tout le monde a."
      });
    } else if (singleBrick && noChiffre) {
      risks.push({ cauchemar: cauch.label, severity: "alerte",
        reason: "Un seul indice. Pas de chiffre. Si le problème persiste après ton arrivée, tu es le fusible. Renforce cette preuve ou change de terrain."
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
    { key: "situation", label: "La situation qu'on m'a confiée", placeholder: "Le problème ou la mission" },
    { key: "action", label: "Ce que j'ai fait concrètement", placeholder: "L'action, la méthode" },
    { key: "result", label: "Le résultat mesuré", placeholder: "Le chiffre, le delta, le délai" },
    { key: "constraint", label: "Ce qui compliquait les choses", placeholder: "La contrainte, le risque, le blocage" },
  ],
  decision: [
    { key: "options", label: "Les deux options qui s'opposaient", placeholder: "Option A vs Option B" },
    { key: "choice", label: "Mon choix et pourquoi", placeholder: "Ce que j'ai tranché" },
    { key: "result", label: "Le résultat", placeholder: "Ce qui s'est passé après" },
    { key: "hindsight", label: "Ce que j'aurais fait différemment", placeholder: "Le recul" },
  ],
  influence: [
    { key: "resistance", label: "Qui résistait et pourquoi", placeholder: "Les acteurs, leurs positions" },
    { key: "stakes", label: "Ce qui était bloqué", placeholder: "L'enjeu, le coût du blocage" },
    { key: "method", label: "Comment j'ai débloqué", placeholder: "Ma méthode, mon levier" },
    { key: "insight", label: "Ce que j'ai appris sur cette organisation", placeholder: "La lecture politique" },
  ],
  cicatrice: [
    { key: "action", label: "Ce que j'ai fait", placeholder: "L'action qui a échoué" },
    { key: "damage", label: "Ce qui a raté", placeholder: "Le résultat négatif, les dégâts" },
    { key: "mypart", label: "Ma part dans cet échec", placeholder: "Ce qui dépendait de moi" },
    { key: "change", label: "Ce que j'ai changé après", placeholder: "La correction appliquée" },
  ],
  take: [
    { key: "consensus", label: "Ce que tout le monde pense vrai", placeholder: "Le consensus de ton secteur" },
    { key: "counter", label: "Pourquoi c'est faux ou incomplet", placeholder: "Ton contrepoint" },
    { key: "proof", label: "Ce que j'ai vu ou mesuré", placeholder: "L'expérience personnelle" },
    { key: "conséquence", label: "La conséquence pour ceux qui suivent", placeholder: "Le risque du consensus" },
  ],
  unfair: [
    { key: "asked", label: "Ce qu'on me demande souvent", placeholder: "Ce que tes collègues te demandent de montrer, expliquer, ou faire" },
    { key: "easy", label: "Pourquoi ça me paraît facile", placeholder: "Ce qui rend ça naturel pour toi" },
    { key: "others", label: "Ce que ça coûte aux autres", placeholder: "Le temps ou l'effort que les autres y mettent" },
    { key: "proof", label: "Une preuve concrète", placeholder: "Un moment où ce décalage était visible" },
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
    question: function(kpi) { return "Tu mentionnes une activité liée à " + kpi.name.toLowerCase() + ". Quel indicateur a bougé ? De combien ? En combien de temps ?"; },
    context: function(kpi) { return "Le recruteur cherche un chiffre sur " + kpi.name + ". " + kpi.why; },
    hint: function(kpi) { return "Ex : donne le chiffre avant, le chiffre après, et la méthode."; },
    missionText: function(kpi) { return "Tu n'as pas de chiffre sur " + kpi.name.toLowerCase() + ". Verifie tes anciens outils (CRM, reporting, dashboard). Cherche le delta avant/après ton intervention. Reviens avec le chiffre."; },
    nightmareGen: function(kpi, cauch) { return cauch ? cauch.nightmareShort : "Le décideur cherche quelqu'un qui a fait bouger " + kpi.name.toLowerCase() + ". Tu as le remède mais tu ne le formules pas."; },
  },
  chiffre_2: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Quel processus as-tu change ou construit qui a eu un impact mesurable sur " + kpi.name.toLowerCase() + " ?"; },
    context: function(kpi) { return "L'offre cache un besoin de structuration. " + kpi.why; },
    hint: function(kpi) { return "Ex : méthode déployée, nombre de personnes impactées, résultat mesuré."; },
    missionText: function(kpi) { return "Tu décris une activité sans mesure. Retrouve l'indicateur que ton action a fait bouger. Reviens avec le delta."; },
    nightmareGen: function(kpi, cauch) { return cauch ? cauch.nightmareShort : "Personne ne structure " + kpi.name.toLowerCase() + ". Tu sais le faire mais ton CV ne le dit pas."; },
  },
  chiffre_3: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Tu as encadre ou forme des gens. Combien ? Quel résultat mesurable ont-ils obtenu grace a toi ?"; },
    context: function(kpi) { return "Signal implicite : le poste evolue vers du leadership. Prouve que tu sais faire grandir une équipe."; },
    hint: function() { return "Ex : nombre de personnes, résultat de l'équipe, promotions obtenues."; },
    missionText: function() { return "Tu ne connais pas le résultat de ton équipe. Demande le reporting a ton manager ou calcule-le. Reviens avec le chiffre."; },
    nightmareGen: function() { return "Le manager recrute mais l'équipe ne produit pas. Il cherche quelqu'un qui sait former et faire grandir."; },
  },
  chiffre_4: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Quel outil ou système as-tu déployé ? Combien de personnes concernées ? Quel taux d'adoption ?"; },
    context: function(kpi) { return "Le recruteur cherche quelqu'un qui sait faire adopter, pas juste utiliser. " + kpi.why; },
    hint: function() { return "Ex : outil déployé, nombre d'utilisateurs, taux d'adoption, délai."; },
    missionText: function() { return "Tu ne connais pas le taux d'adoption. Verifie les logs de connexion ou demande a ton ops. Reviens avec le chiffre."; },
    nightmareGen: function() { return "L'outil coute une fortune et personne ne l'utilise. Le board demande des comptes."; },
  },
  chiffre_5: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Quel indicateur as-tu amélioré qui était directement lié à " + kpi.name.toLowerCase() + " ? Chiffre avant, chiffre après."; },
    context: function(kpi) { return kpi.why; },
    hint: function(kpi) { return "Ex : indicateur spécifique, avant/après, méthode utilisée."; },
    missionText: function(kpi) { return "Pas de chiffre sur " + kpi.name.toLowerCase() + ". C'est un KPI " + kpi.elasticity + ". Trouve la donnée."; },
    nightmareGen: function(kpi) { return "L'offre mentionne " + kpi.name.toLowerCase() + ". Le décideur veut voir un impact prouve."; },
  },
  decision: {
    brickCategory: "decision", type: "preuve",
    question: function() { return "Decris un moment où deux directions s'opposaient et où tu as dû trancher. Qui voulait quoi ? Qu'as-tu choisi et pourquoi ?"; },
    context: function() { return "Le recruteur cherche un arbitrage documenté, pas un chiffre. La prise de décision sous contrainte est le KPI le plus rare."; },
    hint: function() { return "Ex : deux options, les arguments de chaque camp, ton choix, le résultat."; },
    missionText: null,
    nightmareGen: function() { return "Personne ne tranche. Le projet est paralyse. Ton remède : tu sais decider quand les autres hesitent."; },
  },
  influence: {
    brickCategory: "influence", type: "preuve",
    question: function() { return "Raconte un moment où tu as dû obtenir l'accord de gens qui n'etaient pas d'accord entre eux. Qui resistait ? Comment tu as debloque ?"; },
    context: function() { return "L'influence sans autorite est la compétence la plus élastique du marché. L'IA ne remplace pas la politique interne."; },
    hint: function() { return "Ex : acteurs en conflit, ta méthode pour debloquer, le résultat obtenu."; },
    missionText: null,
    nightmareGen: function() { return "Les équipes ne s'alignent pas. Les décisions traînent. Ton remède : tu sais débloquer les situations politiques."; },
  },
  cicatrice_1: {
    brickCategory: "chiffre", type: "cicatrice",
    question: function() { return "Raconte-moi un échec professionnel. Pas un échec complique. Un échec que tu aurais du eviter. Qu'est-ce qui s'est passe ?"; },
    context: function() { return "Le recruteur teste ta maturité. Un profil sans échec analyse est un profil a risque."; },
    hint: function() { return "Ex : la situation, ce que tu as mal fait (pas le contexte), la leçon apprise."; },
    missionText: function() { return "Tu ne trouves pas d'échec precis. Prends 10 minutes. Revois tes projets du dernier semestre. Identifie celui où tu as le plus de regret."; },
    nightmareGen: null,
    blameDetection: true,
  },
  cicatrice_2: {
    brickCategory: "chiffre", type: "cicatrice",
    question: function() { return "Decris un projet qui a échoué. Qu'est-ce qui dependait de toi dans cet échec ? Pas du marché. Pas de ton manager. De toi."; },
    context: function() { return "Le recruteur distingue ceux qui assument de ceux qui externalisent."; },
    hint: function() { return "Ex : ce que tu as lance sans tester, les 2 mois perdus, ta correction."; },
    missionText: function() { return "Tu externalises l'échec. Identifie un facteur sous ton contrôle. Reviens avec cette part de responsabilite."; },
    nightmareGen: null,
    externalizeDetection: true,
  },
  take_1: {
    type: "take",
    question: function() { return "Quelle evolution de ton secteur te semble sous-estimée ou mal comprise par la majorité des professionnels autour de toi ?"; },
    context: function() { return "Cette question révèle si tu vis ton marché en surface ou en profondeur. Un expert sait dire : 'Voilà ce que tout le monde pense et voilà pourquoi c'est faux ou incomplet.'"; },
    hint: function() { return "Ex : Tout le monde pense que X. En réalité, Y. Parce que Z."; },
    surfacePatterns: ["ia va tout changer", "le marché evolue", "faut s'adapter", "c'est en train de bouger", "on verra", "ca depend", "je sais pas trop", "intelligence artificielle", "digital", "transformation", "agilite", "innovation"],
  },
  take_2: {
    type: "take",
    question: function() { return "Qu'est-ce que la majorité des gens de ton metier font par habitude et qui ne fonctionne plus selon toi ? Qu'est-ce que tu fais differemment ?"; },
    context: function() { return "La première réponse teste ta vision du secteur. Celle-ci teste ta pratique. Un expert ne se contente pas d'observer. Il fait autrement."; },
    hint: function() { return "Ex : La majorite fait X. Moi je fais Y. Le résultat est Z."; },
    surfacePatterns: ["je fais comme tout le monde", "je suis les process", "on fait ce qu'on peut", "c'est comme ca", "pas le choix", "tout le monde fait pareil"],
  },
  unfair_advantage: {
    type: "unfair_advantage", brickCategory: "chiffre",
    question: function() { return "Qu'est-ce que tes collègues ou ton manager te demandent régulièrement de leur montrer, de leur expliquer, ou de faire à leur place ?"; },
    context: function() { return "Ce qui te parait facile te parait facile parce que tu le fais depuis longtemps. Les autres y passent 3x plus de temps. C'est là que se cache ton avantage structurel."; },
    hint: function() { return "Ex : on me demande toujours comment je fais mes cold calls, comment je qualifie, comment je structure mes meetings."; },
    missionText: null,
    nightmareGen: function() { return "Ton avantage injuste est invisible pour toi. L'outil te le révèle."; },
  },
};

function generateAdaptiveSeeds(roleId) {
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;
  if (!roleData) {
    // Fallback: generic seeds if no role
    roleData = KPI_REFERENCE["enterprise_ae"];
  }

  var kpis = roleData.kpis;
  var elasticKpis = kpis.filter(function(k) { return k.elasticity === "élastique"; });
  var stableKpis = kpis.filter(function(k) { return k.elasticity === "stable"; });

  // Map KPIs to cauchemars for nightmare text
  function findCauchemar(kpi) {
    return getActiveCauchemars().find(function(c) {
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
      controlRisk: kpi.elasticity === "sous_pression" ? "Ce KPI est automatisable. Si c'est ta meilleure preuve, le recruteur doute. Trouve un angle élastique." : null,
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
    kpi: "Jugement stratégique", elasticity: "élastique",
    elasticityNote: "L'IA accelere l'execution. La prise de décision sous contrainte reste humaine.",
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
    kpi: "Influence transverse", elasticity: "élastique",
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
    skills: [], usedIn: ["Piliers de Singularité", "Posts LinkedIn", "Commentaires LinkedIn"],
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
    skills: [], usedIn: ["Piliers de Singularité", "Posts LinkedIn", "Script de contact"],
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
    contrarian: ["en réalité", "en fait", "le vrai problème", "ce qu'on ne dit pas", "ce que personne", "a tort", "faux", "incomplet", "illusion", "mythe", "erreur", "contresens"],
    specific: ["%", "x", "fois", "mois", "semaines", "clients", "deals", "équipes", "euros", "budget"],
    causal: ["parce que", "car", "la raison", "le problème c'est", "la conséquence", "résultat", "donc", "ce qui fait que"],
    personal: ["j'ai vu", "j'ai testé", "j'ai mesuré", "mon expérience", "dans ma pratique", "concrètement", "quand j'ai", "chez nous", "sur mon segment"],
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
  var contrarianMarkers = ["en réalité", "en fait", "le vrai problème", "mais", "pourtant", "alors que"];
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
    { id: 1, title: "Le terrain contre la tour d'ivoire", desc: "Pourquoi l'expérience opérationnelle bat la théorie dans la vente grands comptes." },
    { id: 2, title: "Les metriques qui mentent", desc: "Ce que les KPIs cachent sur la vraie performance commerciale." },
    { id: 3, title: "Le client comme partenaire", desc: "Pourquoi closer est un échec si le client ne renouvelle pas." },
    { id: 4, title: "L'anti-script", desc: "Pourquoi les meilleurs commerciaux n'ont pas de pitch." },
  ],
  head_of_growth: [
    { id: 1, title: "Le growth hack est mort", desc: "Pourquoi les tactiques virales sans retention tuent plus de boites qu'elles n'en sauvent." },
    { id: 2, title: "Le CAC ment", desc: "Ce que le coût d'acquisition cache quand on oublie de mesurer la qualité du client acquis." },
    { id: 3, title: "L'experimentation sans these", desc: "Pourquoi lancer 50 tests sans hypothese forte est du bruit, pas de la méthode." },
    { id: 4, title: "La retention est le vrai moteur", desc: "Pourquoi 1% de churn en moins bat 10% d'acquisition en plus." },
  ],
  strategic_csm: [
    { id: 1, title: "Le NPS est un placebo", desc: "Pourquoi un client satisfait part quand même et ce que ça révèle sur la mesure." },
    { id: 2, title: "L'upsell invisible", desc: "Pourquoi le meilleur commercial du compte est le CSM qui n'a pas le titre." },
    { id: 3, title: "Le silence tue le renouvellement", desc: "Pourquoi un client silencieux est un client en danger, pas un client satisfait." },
    { id: 4, title: "La politique interne du client", desc: "Pourquoi comprendre l'organigramme du client vaut plus que comprendre son produit." },
  ],
  senior_pm: [
    { id: 1, title: "La feature que personne ne veut tuer", desc: "Pourquoi le courage produit est de dire non a 99% des demandes." },
    { id: 2, title: "Le backlog est un mensonge collectif", desc: "Pourquoi prioriser sans arbitrage politique est une illusion." },
    { id: 3, title: "La velocite n'est pas la vitesse", desc: "Pourquoi livrer vite n'est pas livrer bien et ce que ca coute." },
    { id: 4, title: "Le PM n'est pas un chef de projet", desc: "Pourquoi la différence entre orchestrer et decider separe les PM juniors des seniors." },
  ],
  ai_architect: [
    { id: 1, title: "L'IA n'est pas une stratégie", desc: "Pourquoi déployer un modèle sans cas d'usage mesurable est du théâtre technologique." },
    { id: 2, title: "Le modèle parfait est un piège", desc: "Pourquoi 90% de précision suffit quand l'alternative est 0% d'adoption." },
    { id: 3, title: "La résistance humaine bat la dette technique", desc: "Pourquoi le vrai obstacle de l'IA en entreprise n'est pas technique." },
    { id: 4, title: "Le cout cache de l'infra", desc: "Pourquoi un GPU qui tourne a vide coute plus cher qu'un consultant qui ne fait rien." },
  ],
  engineering_manager: [
    { id: 1, title: "Les meilleurs devs partent en silence", desc: "Pourquoi la rétention de talent est le KPI que personne ne mesure avant qu'il soit trop tard." },
    { id: 2, title: "Build vs Buy est une question de survie", desc: "Pourquoi construire en interne par fierte detruit plus de valeur que d'en creer." },
    { id: 3, title: "La dette technique est un choix politique", desc: "Pourquoi chaque bug non-fixe est une decision de management, pas un oubli technique." },
    { id: 4, title: "Le code ne ment pas, les roadmaps si", desc: "Pourquoi le cycle time révèle plus sur l'équipe que n'importe quel standup." },
  ],
  management_consultant: [
    { id: 1, title: "Le slide deck est mort", desc: "Pourquoi un diagnostic de 3 pages bat un PowerPoint de 80 slides." },
    { id: 2, title: "Le client ne veut pas la vérité", desc: "Pourquoi vendre une recommandation difficile est le vrai metier du conseil." },
    { id: 3, title: "L'impact se mesure après le départ", desc: "Pourquoi un consultant qui laisse une trace bat celui qui facture plus d'heures." },
    { id: 4, title: "La crise révèle le vrai conseil", desc: "Pourquoi le TJM se justifie dans les 48h où tout brûle, pas dans les 6 mois de routine." },
  ],
  strategy_associate: [
    { id: 1, title: "Le signal faible vaut plus que le rapport annuel", desc: "Pourquoi une ligne dans un 10-K bat 200 pages de synthese." },
    { id: 2, title: "Le Comex ne décide pas avec des chiffres", desc: "Pourquoi l'alignement politique pèse plus que le modèle financier." },
    { id: 3, title: "La synergie M&A est un mythe mesurable", desc: "Pourquoi 70% des fusions detruisent de la valeur et ce que ça révèle sur l'analyse." },
    { id: 4, title: "L'IA commodifie l'analyse, pas le jugement", desc: "Pourquoi le strategiste qui pense bat celui qui synthetise." },
  ],
  operations_manager: [
    { id: 1, title: "Le process parfait n'existe pas", desc: "Pourquoi la friction inter-services est un signal, pas un problème à éliminer." },
    { id: 2, title: "Simplifier est plus dur que construire", desc: "Pourquoi réduire la charge cognitive de 10 personnes vaut plus qu'optimiser 1 workflow." },
    { id: 3, title: "L'outil n'est pas le process", desc: "Pourquoi acheter un SaaS sans changer les habitudes est du gaspillage organise." },
    { id: 4, title: "L'Ops invisible est le meilleur Ops", desc: "Pourquoi le signe de réussite est que personne ne remarque que tu es la." },
  ],
  fractional_coo: [
    { id: 1, title: "Le CEO n'a pas besoin d'un bras droit", desc: "Pourquoi un COO fractionne vend de la clarte, pas de la présence." },
    { id: 2, title: "Le runway se gagne en decisions, pas en levees", desc: "Pourquoi 6 mois de survie gagnes par l'execution battent 6 mois gagnes par la dilution." },
    { id: 3, title: "L'alignement N-1 est le seul KPI du COO", desc: "Pourquoi faire courir tout le monde dans la même direction est le levier le plus cher du marché." },
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
    scenario: "On vient de m'informer que votre ancien employeur annonce un plan de restructuration. 15% des effectifs. Votre équipe est impactee. Qu'est-ce que ca change a ce que vous venez de me dire ?",
    diagnostic: {
      externalize: ["c'etait previsible", "je le savais", "rien a voir avec moi", "la direction"],
      recadre: ["mon impact reste", "mes résultats", "la méthode fonctionne", "independamment", "reproductible"],
    },
  },
  {
    id: 2,
    trigger: "Le recruteur s'arrete au milieu de sa prise de notes.",
    scenario: "J'ai un autre candidat en face cet après-midi. Plus senior que vous, 12 ans d'expérience. Dites-moi en une phrase pourquoi je devrais continuer cet entretien au lieu de le raccourcir.",
    diagnostic: {
      externalize: ["je suis mieux", "il ne peut pas", "plus motive", "plus jeune"],
      recadre: ["mes résultats parlent", "voici ce que je resous", "la question n'est pas l'expérience", "le problème que vous avez"],
    },
  },
  {
    id: 3,
    trigger: "Le recruteur pose son stylo et croise les bras.",
    scenario: "Soyons honnetes. Votre CV est bon mais pas exceptionnel. J'en vois dix comme ca par semaine. Qu'est-ce qui fait que je vais me souvenir de vous demain ?",
    diagnostic: {
      externalize: ["je suis unique", "je travaille dur", "je suis passionne", "j'aime"],
      recadre: ["trois cauchemars", "voici le problème que je resous", "la preuve", "mesurable", "reproductible", "mon arbitrage"],
    },
  },
];

var DUEL_CONTRADICTIONS = [
  "Votre ancien manager m'a donne une version differente. Que repondez-vous ?",
  "J'ai parle a quelqu'un dans votre ancienne équipe. Il dit que c'etait un effort collectif, pas individuel. Votre reaction ?",
  "Un de vos ex-collègues m'a dit que le contexte était favorable et que n'importe qui aurait obtenu ces résultats. Comment répondez-vous ?",
  "Les chiffres que vous annoncez ne correspondent pas a ce que j'ai vu dans le marché. Vous etes sur de vos données ?",
];

var DUEL_QUESTIONS = [
  {
    id: 1,
    question: "Votre portefeuille a grandi de 22%. Pourquoi avez-vous quitte [Entreprise] si les résultats etaient bons ?",
    intent: "Tester la coherence de la narrative. Cherche une faille dans la motivation.",
    brickRef: "Croissance +22% portefeuille",
    danger: "Si tu réponds 'je cherchais autre chose', tu parais instable. Si tu réponds 'on m'a pousse', tu parais fragile.",
    idealAngle: "Répondre par l'ambition de scope. 'J'ai atteint le plafond du segment Mid-Market chez [Entreprise SaaS]. Je cherche un terrain Enterprise pour appliquer la même méthode à une échelle supérieure.'",
  },
  {
    id: 2,
    question: "Vous parlez de reduction du churn. Comment vous assurez-vous que ce n'était pas juste un cycle favorable du marché ?",
    intent: "Tester la rigueur analytique. Le recruteur veut savoir si tu contrôles tes variables.",
    brickRef: "Reduction churn -18%",
    danger: "Si tu ne peux pas isoler ton impact du contexte, ta brique s'effondre.",
    idealAngle: "Montrer la méthode. 'J'ai compare les cohortes avant/apres restructuration. Les clients passes par le nouveau parcours avaient un NRR de 108% vs 89% pour l'ancien.'",
  },
  {
    id: 3,
    question: "Vous avez arbitre entre refonte et migration. Le CTO voulait la refonte. Comment avez-vous gere le desaccord ?",
    intent: "Tester la capacité a gerer un conflit avec un supérieur hiérarchique. Le recruteur veut voir du courage, pas de la soumission.",
    brickRef: "Arbitrage refonte vs migration",
    danger: "Si tu dis 'j'ai convaincu le CTO', tu parais arrogant. Si tu dis 'on a trouve un compromis', tu parais mou.",
    idealAngle: "Montrer la méthode d'arbitrage. 'J'ai pose les deux scenarios avec couts et risques. Le CTO a vu que la refonte exposait la prod pendant 4 mois. La decision s'est faite sur les faits, pas sur les opinions.'",
  },
  {
    id: 4,
    question: "Vous dites avoir aligné 4 directeurs. Concrètement, lequel était le plus difficile à convaincre et pourquoi ?",
    intent: "Tester la profondeur de la lecture politique. Le recruteur veut savoir si tu comprends les jeux de pouvoir.",
    brickRef: "Alignement 4 directeurs",
    danger: "Si tu restes generique ('c'etait un travail d'équipe'), le recruteur lit 'cette personne n'a pas vraiment mene le sujet'.",
    idealAngle: "Nommer le blocage. 'Le directeur produit avait investi 2 ans sur le projet. Abandonner revenait a reconnaître un échec. J'ai reframe : pas un échec, un pivot stratégique. Il a accepte quand j'ai montré le coût d'opportunité en termes de roadmap.'",
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
  if (validated.length === 0) return "[Aucune brique validée. Le CV se construit a partir de tes preuves.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleTitle = roleData ? roleData.role.toUpperCase() : "PROFESSIONNEL";

  // Sort bricks: elastic first, then by category weight (decision > influence > cicatrice > chiffre)
  var catWeight = { decision: 4, influence: 3, cicatrice: 2, chiffre: 1 };
  var sorted = validated.slice().sort(function(a, b) {
    var ea = a.elasticity === "élastique" ? 10 : 0;
    var eb = b.elasticity === "élastique" ? 10 : 0;
    var ca = catWeight[a.brickCategory] || catWeight[a.brickType] || 0;
    var cb = catWeight[b.brickCategory] || catWeight[b.brickType] || 0;
    return (eb + cb) - (ea + ca);
  });

  // Header: title + top 3 elastic indicators compressed
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
  var headerStats = elasticBricks.slice(0, 3).map(function(b) {
    // Extract numbers from brick text
    var nums = b.text.match(/[\+\-]?\d+[%KM€]?/g);
    return nums ? nums[0] + " " + (b.kpi || "").toLowerCase() : (b.kpi || "");
  }).join(". ");

  var cv = roleTitle + "\n";
  cv += headerStats ? headerStats + ".\n" : "";
  cv += "\n[Poste] \u2014 [Entreprise] ([Dates])\n\n";

  // Bricks as lines — prefer cvVersion for 6-second scanning
  sorted.forEach(function(b) {
    cv += (b.cvVersion || b.text) + "\n\n";
  });

  cv += "Formation\n[Diplome] \u2014 [Ecole] ([Annee])";
  return cleanRedac(cv, "livrable");
}

function generateBio(bricks, vault, trajectoryToggle) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Bio générée après validation de tes briques.]";

  // LINE 1 — Cauchemar du décideur
  var strongestCauchemar = null;
  getActiveCauchemars().forEach(function(c) {
    var covers = validated.filter(function(b) {
      return c.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
    });
    if (covers.length > 0 && (!strongestCauchemar || covers.length > strongestCauchemar.count)) {
      strongestCauchemar = { text: c.nightmareShort, count: covers.length };
    }
  });
  var line1 = strongestCauchemar ? strongestCauchemar.text : "Les résultats existent. Personne ne les formule.";

  // LINE 2 — Top 3 elastic bricks, numbers only
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
  var proofBricks = elasticBricks.length >= 2 ? elasticBricks : validated;
  var line2parts = proofBricks.slice(0, 3).map(function(b) {
    var nums = b.text.match(/[\+\-]?\d+[%KM€]?[^\.\,]*/g);
    return nums ? nums[0].trim() : b.kpi || "";
  });
  var line2 = line2parts.join(". ") + ".";

  // LINE 3 — Pillar (take preferred)
  var line3 = "J'ecris ici sur ce que l'expérience revele quand on creuse sous les metriques.";
  if (vault && vault.selectedPillars && vault.selectedPillars.length > 0) {
    var takePillar = vault.selectedPillars.find(function(p) { return p.source === "take"; });
    var pillar = takePillar || vault.selectedPillars[0];
    if (pillar && pillar.title) {
      line3 = "J'ecris ici sur " + pillar.title.toLowerCase().replace(/^pourquoi /, "pourquoi ").replace(/\.$/, "") + ".";
    }
  }

  return cleanRedac(line1 + "\n\n" + line2 + "\n\n" + line3, "livrable");
}

/* ==============================
   ITEM 2 — TRIPLE SORTIE PAR BRIQUE
   CV 6sec + Entretien 3 interlocuteurs + Discovery
   ============================== */

function generateBrickVersions(brick, targetRoleId) {
  var text = brick.text || "";
  var kpi = brick.kpi || "";
  var category = brick.brickCategory || brick.brickType || "chiffre";
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role : "ce poste";

  // === VERSION CV (6 secondes) ===
  // Extract: action verb + number + minimal context
  var cvVersion = text;
  if (text.length > 120) {
    // Compress: keep first sentence or strongest clause
    var firstDot = text.indexOf(".");
    if (firstDot > 20 && firstDot < 120) {
      cvVersion = text.slice(0, firstDot + 1);
    } else {
      cvVersion = text.slice(0, 120).replace(/\s\S*$/, "") + ".";
    }
  }
  // Ensure starts with action verb if possible
  var actionStarters = ["croissance", "réduction", "déploiement", "lancement", "création", "restructuration", "mise en place", "pilotage", "optimisation", "négociation", "alignement", "construction", "transformation", "accélération", "conception"];
  var startsWithAction = actionStarters.some(function(a) { return cvVersion.toLowerCase().indexOf(a) < 15 && cvVersion.toLowerCase().indexOf(a) !== -1; });
  if (!startsWithAction && /[\+\-]?\d/.test(cvVersion)) {
    // Has numbers but no action start — try to restructure
    var numMatch = cvVersion.match(/([\+\-]?\d[\d.,]*\s*[%KM€]*)/);
    if (numMatch) {
      var numPart = numMatch[1];
      var rest = cvVersion.replace(numPart, "").replace(/^\s*[,:.\-]\s*/, "").trim();
      if (rest.length > 10) {
        cvVersion = rest.charAt(0).toUpperCase() + rest.slice(1);
        if (cvVersion.indexOf(numPart) === -1) cvVersion = cvVersion.replace(/\.$/, "") + " (" + numPart.trim() + ").";
      }
    }
  }

  // === VERSION ENTRETIEN (3 interlocuteurs) ===
  var interviewBase = text;

  // RH — parcours + soft skills
  var rhVersion = "";
  if (category === "cicatrice") {
    rhVersion = "J'ai traversé une situation difficile. " + interviewBase + " Cette expérience m'a appris à prendre du recul et à ajuster ma méthode. C'est ce type de moment qui structure un parcours.";
  } else if (category === "decision") {
    rhVersion = "J'ai été confronté à un choix stratégique. " + interviewBase + " Ce que j'en retiens, c'est ma capacité à trancher sous pression et à assumer les conséquences.";
  } else if (category === "influence") {
    rhVersion = "J'ai dû aligner des personnes aux intérêts divergents. " + interviewBase + " Ce qui m'a marqué, c'est l'importance de la lecture politique dans l'exécution.";
  } else {
    rhVersion = "Dans mon parcours, un moment clé a été quand " + interviewBase.charAt(0).toLowerCase() + interviewBase.slice(1) + " Ce résultat illustre ma façon de travailler : je mesure et j'ajuste jusqu'au résultat.";
  }

  // N+1 — terrain + méthode
  var n1Version = "";
  if (category === "cicatrice") {
    n1Version = "Le problème était concret. " + interviewBase + " La correction que j'ai appliquée ensuite a fonctionné parce que j'avais compris la cause racine, pas juste le symptôme.";
  } else if (category === "decision") {
    n1Version = "Deux options s'opposaient. " + interviewBase + " J'ai chiffré les risques et tranché. La méthode compte autant que le résultat.";
  } else if (category === "influence") {
    n1Version = "Le blocage venait des personnes, pas du process. " + interviewBase + " J'ai résolu ça en travaillant les objections une par une, en commençant par le plus résistant.";
  } else {
    n1Version = "Sur le terrain, voici ce qui s'est passé. " + interviewBase + " La méthode est reproductible. Je l'ai testée sur ce contexte, elle s'adapte à d'autres.";
  }

  // Direction — impact business + P&L
  var dirVersion = "";
  var cauchemar = getActiveCauchemars().find(function(c) {
    return c.kpis && c.kpis.some(function(k) { return kpi.toLowerCase().indexOf(k.toLowerCase().slice(0, 6)) !== -1; });
  });
  var costFrame = cauchemar ? " Ce type de problème coûte entre " + formatCost(cauchemar.costRange[0]) + " et " + formatCost(cauchemar.costRange[1]) + " par an quand il n'est pas résolu." : "";
  if (category === "cicatrice") {
    dirVersion = "L'enjeu business était réel. " + interviewBase + costFrame + " L'échec m'a coûté du temps mais m'a donné un cadre d'analyse que j'applique systématiquement.";
  } else if (category === "decision") {
    dirVersion = "En termes d'impact P&L, voici l'arbitrage. " + interviewBase + costFrame + " La décision a protégé la marge et accéléré l'exécution.";
  } else if (category === "influence") {
    dirVersion = "Le sujet était politique avant d'être opérationnel. " + interviewBase + costFrame + " L'alignement a débloqué l'exécution sur tout le périmètre.";
  } else {
    dirVersion = "L'impact business est mesurable. " + interviewBase + costFrame + " Ce delta se traduit directement en valeur pour l'organisation.";
  }

  // === VERSION DISCOVERY (questions à poser) ===
  var discoveryQuestions = [];
  if (kpi) {
    discoveryQuestions.push("Quel est votre indicateur actuel sur " + kpi.toLowerCase() + " ? Où en étiez-vous il y a 12 mois ?");
  }
  if (cauchemar) {
    discoveryQuestions.push(cauchemar.nightmareShort.replace(/\.$/, "") + " — c'est une situation que vous rencontrez aujourd'hui ?");
  }
  if (discoveryQuestions.length === 0) {
    discoveryQuestions.push("Quel est le problème le plus coûteux que personne n'a encore résolu dans votre équipe ?");
  }
  discoveryQuestions.push("Qu'est-ce qui a déclenché ce recrutement ?");
  discoveryQuestions.push("Quel profil ne voulez-vous surtout pas reproduire ?");

  return {
    cvVersion: cleanRedac(cvVersion, "livrable"),
    interviewVersions: {
      rh: cleanRedac(rhVersion, "livrable"),
      n1: cleanRedac(n1Version, "livrable"),
      direction: cleanRedac(dirVersion, "livrable"),
    },
    discoveryQuestions: discoveryQuestions.map(function(q) { return cleanRedac(q, "livrable"); }),
  };
}

/* ==============================
   ITEM 4 — NIVEAUX LOGIQUES DE DILTS
   1=Environnement 2=Comportement 3=Capacités 4=Croyances 5=Identité 6=Mission
   ============================== */

var DILTS_LEVELS = [
  { level: 1, name: "Environnement", desc: "Où, quand, avec qui", color: "#8892b0" },
  { level: 2, name: "Comportement", desc: "Ce que je fais", color: "#3498db" },
  { level: 3, name: "Capacités", desc: "Comment je le fais", color: "#4ecca3" },
  { level: 4, name: "Croyances", desc: "Pourquoi je le fais", color: "#ff9800" },
  { level: 5, name: "Identité", desc: "Qui je suis", color: "#e94560" },
  { level: 6, name: "Mission", desc: "Pour quoi je le fais", color: "#9b59b6" },
];

var DILTS_MARKERS = {
  1: ["chez", "dans l'equipe", "en 20", "pendant", "mois", "semaines", "trimestre", "clients", "comptes", "personnes", "euros", "budget", "paris", "lyon", "france", "entreprise", "start-up", "scale-up", "groupe"],
  2: ["j'ai fait", "j'ai lance", "j'ai mis en place", "j'ai deploye", "j'ai construit", "j'ai cree", "j'ai forme", "j'ai recrute", "j'ai gere", "j'ai pilote", "j'ai negocie", "j'ai redige", "j'ai organise", "j'ai produit", "j'ai execute"],
  3: ["ma methode", "mon approche", "mon process", "ma strategie", "mon cadre", "mon systeme", "la methode que", "la technique", "le framework", "reproductible", "structuré", "systematique", "optimise", "itere", "mesure", "analyse", "diagnostic"],
  4: ["je crois que", "je suis convaincu", "le vrai sujet", "le vrai probleme", "ce que personne ne dit", "contrairement a", "a tort", "en realite", "la majorite pense", "l'erreur commune", "mon parti pris", "ma conviction", "je refuse de", "je defends"],
  5: ["je suis le genre de", "mon role est", "je suis celui qui", "je suis celle qui", "mon positionnement", "ce qui me definit", "ma singularite", "ce qui me rend", "ma marque", "mon ADN", "ma posture", "je ne suis pas un", "on me reconnait"],
  6: ["pour que", "l'impact sur", "contribuer a", "au service de", "ma mission", "ce que je veux changer", "le systeme", "l'ecosysteme", "la prochaine génération", "transformer", "le monde du travail", "faire avancer", "laisser une trace", "plus grand que moi"],
};

function detectDiltsLevel(text) {
  if (!text || text.length < 10) return { dominant: 1, scores: {}, breakdown: [] };
  var lower = text.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u").replace(/[ôö]/g, "o").replace(/[îï]/g, "i");

  var scores = {};
  var breakdown = [];
  [1, 2, 3, 4, 5, 6].forEach(function(level) {
    var hits = 0;
    var matched = [];
    DILTS_MARKERS[level].forEach(function(m) {
      var mNorm = m.replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u").replace(/[ôö]/g, "o").replace(/[îï]/g, "i");
      if (lower.indexOf(mNorm) !== -1) { hits++; matched.push(m); }
    });
    scores[level] = hits;
    if (hits > 0) breakdown.push({ level: level, hits: hits, matched: matched });
  });

  // Dominant = highest score, tiebreak favors higher level
  var dominant = 1;
  var maxScore = 0;
  [1, 2, 3, 4, 5, 6].forEach(function(level) {
    if (scores[level] > maxScore || (scores[level] === maxScore && level > dominant)) {
      maxScore = scores[level];
      dominant = level;
    }
  });

  return { dominant: dominant, scores: scores, breakdown: breakdown };
}

function getDiltsLabel(level) {
  var d = DILTS_LEVELS.find(function(l) { return l.level === level; });
  return d || DILTS_LEVELS[0];
}

/* Detect Dilts progression in a script (open vs close) */
function analyzeDiltsProgression(text) {
  if (!text || text.length < 40) return { opens: 1, closes: 1, progression: 0 };
  var parts = text.split("\n\n");
  if (parts.length < 2) parts = text.split("\n");
  if (parts.length < 2) return { opens: 1, closes: 1, progression: 0 };

  var firstThird = parts.slice(0, Math.max(1, Math.floor(parts.length / 3))).join(" ");
  var lastThird = parts.slice(-Math.max(1, Math.floor(parts.length / 3))).join(" ");

  var openLevel = detectDiltsLevel(firstThird).dominant;
  var closeLevel = detectDiltsLevel(lastThird).dominant;

  return { opens: openLevel, closes: closeLevel, progression: closeLevel - openLevel };
}

/* Check sequence stagnation across multiple posts */
function checkDiltsSequence(posts) {
  if (!posts || posts.length < 3) return null;
  var last3 = posts.slice(-3);
  var levels = last3.map(function(p) { return p.diltsLevel || 1; });
  var allSame = levels[0] === levels[1] && levels[1] === levels[2];
  if (allSame) {
    var d = getDiltsLabel(levels[0]);
    return { stagnant: true, level: levels[0], name: d.name, message: "Tes 3 derniers posts sont au niveau " + levels[0] + " (" + d.name + "). Ta séquence stagne. Monte d'un niveau." };
  }
  return { stagnant: false };
}

/* ==============================
   CALIBRAGE DILTS ACTIF — séquence de montée
   Stratégie : 2 posts par niveau, puis on monte.
   Séquence idéale : 1,1 → 2,2 → 3,3 → 4,4 → 5,5 → cycle
   Le candidat construit sa crédibilité du concret vers l'identité.
   ============================== */

var DILTS_CALIBRATION = {
  // Pour chaque niveau cible : quel type de brique et quel cadrage
  1: { brickPriority: ["chiffre"], framingOpen: "", framingClose: "Les chiffres ne mentent pas. Ceux-là sont les miens." },
  2: { brickPriority: ["chiffre", "influence"], framingOpen: "", framingClose: "Ce que j'ai fait parle. Le reste est du bruit." },
  3: { brickPriority: ["decision", "influence"], framingOpen: "Ma méthode est reproductible. ", framingClose: "Le cadre compte autant que le talent. C'est lui qui tient sous pression." },
  4: { brickPriority: ["cicatrice", "decision"], framingOpen: "", framingClose: "Le consensus dit le contraire. Mon expérience dit ça." },
  5: { brickPriority: ["cicatrice", "decision"], framingOpen: "", framingClose: "Ce n'est pas ce que je fais. C'est ce qui me définit." },
};

function computeDiltsTarget(diltsHistory) {
  if (!diltsHistory || diltsHistory.length === 0) {
    return { targetLevel: 2, reason: "Premier post. On ancre sur du concret — ce que tu fais.", postsAtCurrent: 0, sequencePosition: 0, completed: 0 };
  }

  // Count posts per level
  var countPerLevel = {};
  diltsHistory.forEach(function(entry) {
    var lvl = entry.level || 2;
    countPerLevel[lvl] = (countPerLevel[lvl] || 0) + 1;
  });

  // Find the lowest level (2-5) that has < 2 posts — that's the target
  var target = 5;
  [2, 3, 4, 5].forEach(function(lvl) {
    if ((countPerLevel[lvl] || 0) < 2 && lvl < target) {
      target = lvl;
    }
  });

  // If all levels have 2+ posts, stay at 5 (identity)
  var postsAtCurrent = countPerLevel[target] || 0;

  // Count completed levels for display
  var highestCompleted = 0;
  [2, 3, 4, 5].forEach(function(lvl) {
    if ((countPerLevel[lvl] || 0) >= 2) highestCompleted = lvl;
  });

  var reasons = {
    2: "On montre l'action. Ce que tu as fait, pas ce que tu sais.",
    3: "On expose la méthode. Comment tu opères. Ton cadre est reproductible.",
    4: "On affirme la conviction. Ton parti pris contredit le consensus.",
    5: "On pose l'identité. Ce qui te définit au-delà du poste.",
  };

  return {
    targetLevel: target,
    reason: reasons[target] || "",
    postsAtCurrent: postsAtCurrent,
    sequencePosition: diltsHistory.length,
    completed: highestCompleted,
  };
}

/* Bias brick selection toward target Dilts level */
function selectBrickForDiltsTarget(bricks, targetLevel, usedBrickIds) {
  var available = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take" && usedBrickIds.indexOf(b.id) === -1; });
  if (available.length === 0) available = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (available.length === 0) return null;

  var calibration = DILTS_CALIBRATION[targetLevel] || DILTS_CALIBRATION[2];
  var priorities = calibration.brickPriority;

  // Score each brick by how well it matches the target level's preferred types
  var scored = available.map(function(b) {
    var cat = b.brickType === "cicatrice" ? "cicatrice" : (b.brickCategory || "chiffre");
    var priorityScore = priorities.indexOf(cat);
    if (priorityScore === -1) priorityScore = 10;
    // Also check if the brick text naturally hits the target Dilts level
    var dilts = detectDiltsLevel(b.text);
    var diltsBonus = dilts.scores[targetLevel] || 0;
    return { brick: b, priorityScore: priorityScore, diltsBonus: diltsBonus };
  });

  // Sort: best priority first, then by Dilts bonus
  scored.sort(function(a, b) {
    if (a.priorityScore !== b.priorityScore) return a.priorityScore - b.priorityScore;
    return b.diltsBonus - a.diltsBonus;
  });

  return scored[0].brick;
}

/* ==============================
   DILTS THERMOSTAT GLOBAL
   Le niveau Dilts atteint = plafond pour tous les outputs.
   Posts fixent le plafond. DM/commentaires/relances operent en dessous.
   ============================== */

var DILTS_EDITORIAL_MAPPING = {
  2: { registre: "Ce que j'ai fait", sujets: "projet mene, resultat obtenu, situation geree", brickTypes: ["chiffre", "cicatrice"], prospectPerception: "Le prospect enregistre un praticien." },
  3: { registre: "Comment je le fais", sujets: "methode appliquee, framework utilise, processus construit", brickTypes: ["chiffre", "decision"], prospectPerception: "Le prospect apprend de toi. Tu te distingues." },
  4: { registre: "Ce que je crois et pourquoi", sujets: "conviction nee de l'experience, desaccord avec le consensus", brickTypes: ["cicatrice", "decision"], prospectPerception: "Le prospect a une raison de se souvenir de toi. Tu occupes un territoire." },
  5: { registre: "Qui je suis dans cet ecosysteme", sujets: "role dans la conversation sectorielle, definition du metier", brickTypes: ["cicatrice", "decision"], prospectPerception: "Le prospect associe un probleme a ton nom. Tu es le raccourci mental." },
};

function getDiltsPlafond(diltsHistory) {
  if (!diltsHistory || diltsHistory.length === 0) return 2;
  var maxLevel = 2;
  var countPerLevel = {};
  diltsHistory.forEach(function(entry) {
    var lvl = entry.level || 2;
    countPerLevel[lvl] = (countPerLevel[lvl] || 0) + 1;
  });
  [2, 3, 4, 5].forEach(function(lvl) {
    if ((countPerLevel[lvl] || 0) >= 2) maxLevel = lvl;
  });
  return maxLevel;
}

function getDiltsCeilingForOutput(outputType, diltsHistory, monthsInactive) {
  var plafond = getDiltsPlafond(diltsHistory);
  var inactive = monthsInactive || 0;
  if (outputType === "post") return plafond;
  if (outputType === "dm_froid") return Math.max(2, plafond - 1);
  if (outputType === "commentaire") return plafond;
  if (outputType === "relance_dormant") return Math.max(2, plafond - inactive);
  if (outputType === "dm_chaud") return plafond;
  return plafond;
}

function getDiltsThermometerState(diltsHistory) {
  var plafond = getDiltsPlafond(diltsHistory);
  var lastPost = null;
  var weeksInactive = 0;
  if (diltsHistory && diltsHistory.length > 0) {
    lastPost = diltsHistory[diltsHistory.length - 1];
    if (lastPost.date) {
      var diff = Date.now() - new Date(lastPost.date).getTime();
      weeksInactive = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    }
  }
  // Decay: 1 semaine sans signal = alerte. 2+ semaines = decay réel.
  // 94.8% des utilisateurs LinkedIn ne publient pas. 1 post/semaine = top 5%.
  // Seuil plancher : 1 signal/semaine (post OU commentaire calibré).
  // Au-delà de 5/semaine : inutile pour un cadre senior, risque de bruit.
  var decay = weeksInactive >= 2 ? Math.floor((weeksInactive - 1) / 2) : 0;
  var isAlert = weeksInactive >= 1;
  var effectiveLevel = Math.max(2, plafond - decay);
  var mapping = DILTS_EDITORIAL_MAPPING[effectiveLevel] || DILTS_EDITORIAL_MAPPING[2];
  var plafondMapping = DILTS_EDITORIAL_MAPPING[plafond] || DILTS_EDITORIAL_MAPPING[2];
  return {
    plafond: plafond,
    effectiveLevel: effectiveLevel,
    weeksInactive: weeksInactive,
    decay: decay,
    isAlert: isAlert,
    registre: mapping.registre,
    prospectPerception: mapping.prospectPerception,
    plafondRegistre: plafondMapping.registre,
    lastPostDate: lastPost ? lastPost.date : null,
  };
}

function generateScript(bricks, targetRoleId) {
  var result = generateContactScripts(bricks, targetRoleId);
  return result ? result.email : "[Script généré après validation de tes briques.]";
}

/* ==============================
   ITEM 6 — SCRIPT 4 VARIANTES + GRILLE 6 TESTS
   ============================== */

var SCRIPT_CHANNELS = [
  { id: "email", label: "Email", icon: "\u2709\uFE0F", instruction: "Envoie entre 8h et 9h30. La première phrase fait le travail." },
  { id: "dm", label: "DM LinkedIn", icon: "\uD83D\uDCAC", instruction: "Envoie après avoir liké 2-3 posts de la personne. Jamais à froid." },
  { id: "n1", label: "N+1 opérationnel", icon: "\uD83C\uDFAF", instruction: "Ce message suppose que tu connais le nom du hiring manager. Trouve-le sur LinkedIn." },
  { id: "rh", label: "RH / Recruteur", icon: "\uD83D\uDC64", instruction: "Le RH filtre. Ton message doit passer le filtre, pas convaincre." },
];

/* ==============================
   PLAN 90 JOURS — Coordonné au Rendez-vous de Souveraineté
   Inputs : Coffre-Fort (briques + cauchemars + Take)
   Output : Plan en 3 phases aligné sur la cadence du rôle
   ============================== */

function generatePlan90(bricks, targetRoleId, offersArray) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return null;

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  if (!roleData) return null;

  var cadence = roleData.cadence; // 30, 90, or 180
  var roleName = roleData.role;

  // Get cauchemars from offer or defaults
  var activeCauchs = getActiveCauchemars();
  if (offersArray && offersArray.length > 0) {
    var parsed = parseOfferSignals(offersArray[0].text, targetRoleId);
    if (parsed && parsed.cauchemars && parsed.cauchemars.length >= 3) activeCauchs = parsed.cauchemars;
  }

  // Match cauchemars to bricks (sorted by cost descending)
  var sortedCauchs = activeCauchs.slice().sort(function(a, b) { return (b.costRange[1] || 0) - (a.costRange[1] || 0); });
  var cauchWithBrick = [];
  sortedCauchs.forEach(function(c) {
    var matchBrick = validated.find(function(b) {
      return c.kpis && c.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
    });
    cauchWithBrick.push({ cauchemar: c, brick: matchBrick || null });
  });

  // Get Take
  var takeBrick = bricks.find(function(b) { return b.brickType === "take" && b.status === "validated"; });
  var takeText = takeBrick ? takeBrick.text : null;

  // Phase structure depends on cadence
  var phases = [];

  if (cadence <= 30) {
    // MENSUEL: 3 rendez-vous de souveraineté en 90 jours
    phases = [
      { label: "Semaines 1-4", tag: "DIAGNOSTIC + QUICK WIN", rdvSouverainete: "1er Rendez-vous de Souverainete (J30)", color: "#e94560" },
      { label: "Semaines 5-8", tag: "EXECUTION + PREUVE", rdvSouverainete: "2e Rendez-vous de Souverainete (J60)", color: "#ff9800" },
      { label: "Semaines 9-12", tag: "SYSTEME + MESURE", rdvSouverainete: "3e Rendez-vous de Souverainete (J90)", color: "#4ecca3" },
    ];
  } else if (cadence <= 90) {
    // TRIMESTRIEL: 1 rendez-vous de souveraineté à J90
    phases = [
      { label: "Semaines 1-4", tag: "IMMERSION + DIAGNOSTIC", rdvSouverainete: null, color: "#e94560" },
      { label: "Semaines 5-8", tag: "PREMIERS ARBITRAGES", rdvSouverainete: null, color: "#ff9800" },
      { label: "Semaines 9-12", tag: "LIVRAISON + BILAN", rdvSouverainete: "Rendez-vous de Souverainete (J90)", color: "#4ecca3" },
    ];
  } else {
    // SEMESTRIEL: J90 = mi-parcours
    phases = [
      { label: "Semaines 1-4", tag: "CARTOGRAPHIE POLITIQUE", rdvSouverainete: null, color: "#e94560" },
      { label: "Semaines 5-8", tag: "PREMIERS SIGNAUX", rdvSouverainete: null, color: "#ff9800" },
      { label: "Semaines 9-12", tag: "POINT MI-CYCLE", rdvSouverainete: "Mi-parcours vers le 1er Rendez-vous de Souverainete (J180)", color: "#4ecca3" },
    ];
  }

  // Role-specific action templates
  var roleActions = {
    enterprise_ae: {
      phase1: ["Cartographier les 5 comptes stratégiques et leur cycle de décision", "Identifier le deal bloqué le plus coûteux et diagnostiquer le blocage", "Poser la question discovery au N+1 : ''{Q}''"],
      phase2: ["Débloquer 1 deal en appliquant la méthode multi-décideurs", "Documenter le before/after avec chiffre de pipeline", "Installer le rituel de revue hebdo avec le VP Sales"],
      phase3: ["Mesurer le delta de win rate depuis l'arrivée", "Présenter le ROI des 90 jours au COMEX", "Définir les 3 prochains comptes cibles avec le même playbook"],
    },
    head_of_growth: {
      phase1: ["Auditer les 3 canaux principaux et leur CAC réel", "Identifier l'expérimentation la plus rentable en cours", "Poser la question : quel canal a été abandonné trop tôt ?"],
      phase2: ["Lancer 2 expérimentations ciblées sur le canal sous-exploité", "Mesurer LTV/CAC par cohorte, pas en moyenne", "Couper 1 canal qui consomme du budget sans preuve de conversion"],
      phase3: ["Présenter le delta de CAC et les cohortes avant/après", "Proposer le plan Q2 avec budget et hypothèses testables", "Documenter la méthode pour qu'elle survive sans toi"],
    },
    strategic_csm: {
      phase1: ["Lister les 10 comptes à risque de churn avec date de renouvellement", "Identifier le compte le plus rentable avec le NRR le plus faible", "Poser la question au client : quel problème personne ne résout ?"],
      phase2: ["Sauver 1 compte à risque avec un plan d'action documenté", "Déclencher 1 upsell sur un besoin détecté (pas sur un pitch produit)", "Mesurer le NRR avant/après intervention"],
      phase3: ["Présenter le delta de churn sauvé en euros", "Créer le playbook de détection précoce pour l'équipe", "Identifier les 3 comptes d'expansion pour Q2"],
    },
    senior_pm: {
      phase1: ["Cartographier les 3 arbitrages produit en attente depuis plus de 2 mois", "Identifier la feature en production qui n'a bougé aucune métrique", "Poser la question à l'engineering : quel chantier est en cours sans sponsor ?"],
      phase2: ["Tuer 1 feature ou 1 projet sans impact mesurable", "Aligner engineering et business sur 1 métrique north star", "Livrer 1 quick win visible avec adoption mesurée"],
      phase3: ["Présenter le ROI des décisions prises (features tuées + livrées)", "Documenter les 3 prochains arbitrages du Q2", "Mesurer l'adoption du quick win à J90"],
    },
    ai_architect: {
      phase1: ["Auditer les projets IA en cours : combien en production vs POC", "Identifier le cas d'usage bloqué depuis plus de 3 mois", "Mesurer le coût d'infra actuel vs le ROI réel de chaque déploiement"],
      phase2: ["Débloquer 1 cas d'usage avec un périmètre réduit et mesurable", "Proposer 1 arbitrage build vs buy sur un modèle", "Former 1 équipe métier à l'usage autonome de l'outil IA"],
      phase3: ["Présenter le ROI du cas d'usage débloqué", "Documenter l'architecture de décision pour les prochains projets", "Mesurer le taux d'adoption interne avant/après intervention"],
    },
    engineering_manager: {
      phase1: ["Mesurer le cycle time réel (commit to deploy) sur les 3 derniers mois", "Identifier le dev le plus à risque de départ (signaux faibles)", "Cartographier la dette technique par impact business"],
      phase2: ["Réduire 1 friction dans le pipeline de livraison", "Conduire 1 entretien de rétention avec le talent à risque", "Arbitrer 1 décision build vs buy bloquée"],
      phase3: ["Présenter le delta de cycle time", "Documenter la décision build vs buy et son résultat", "Proposer le plan de rétention Q2 avec métriques"],
    },
    management_consultant: {
      phase1: ["Livrer le diagnostic en 2 semaines, pas en 6", "Identifier la recommandation que le COMEX refuse d'entendre", "Chiffrer le coût de l'inaction sur le problème principal"],
      phase2: ["Faire accepter 1 recommandation difficile avec données à l'appui", "Accompagner l'implémentation (pas juste livrer le slide deck)", "Mesurer le premier indicateur d'impact"],
      phase3: ["Présenter l'impact EBITDA de l'intervention", "Laisser un playbook utilisable sans consultant", "Poser la question : quel problème adjacent émerge ?"],
    },
    strategy_associate: {
      phase1: ["Cartographier les 3 dossiers stratégiques ouverts et leur sponsor", "Identifier le signal faible que personne n'a encore formalisé", "Comprendre l'alignement politique du COMEX sur chaque dossier"],
      phase2: ["Produire 1 analyse qui change la décision sur un dossier", "Aligner 2 membres du COMEX sur une position commune", "Documenter le raisonnement, pas juste la conclusion"],
      phase3: ["Présenter le delta de décision : qu'est-ce qui a changé grâce à l'analyse", "Préparer le cadrage du prochain cycle semestriel", "Identifier les 2 signaux faibles pour le S2"],
    },
    operations_manager: {
      phase1: ["Cartographier les 3 frictions inter-services les plus coûteuses en temps", "Mesurer la charge cognitive de l'équipe (nombre d'outils, étapes manuelles)", "Poser la question à chaque service : quel process vous fait perdre le plus de temps ?"],
      phase2: ["Éliminer 1 friction inter-services avec un process documenté", "Automatiser 1 tâche répétitive avec ROI mesurable", "Mesurer le temps gagné en heures par semaine"],
      phase3: ["Présenter le delta de friction et le temps libéré", "Documenter le process pour qu'il survive sans toi", "Identifier les 3 prochaines frictions à traiter en Q2"],
    },
    fractional_coo: {
      phase1: ["Diagnostiquer où le CEO passe son temps vs où il devrait le passer", "Identifier le process manquant qui coûte le plus cher", "Aligner les N-1 sur les 3 priorités du trimestre"],
      phase2: ["Installer 1 process de gouvernance qui libère le CEO de 5h/semaine", "Mesurer le runway impact de chaque décision opérationnelle", "Conduire le premier comité de pilotage structuré"],
      phase3: ["Présenter le ROI du temps libéré pour le CEO", "Documenter la gouvernance pour qu'elle fonctionne sans présence quotidienne", "Proposer le plan Q2 avec jalons et métriques"],
    },
  };

  var actions = roleActions[targetRoleId] || roleActions.enterprise_ae;

  // Inject cauchemar-specific content into phase 1
  var cauch1 = cauchWithBrick[0] || null;
  var cauch2 = cauchWithBrick[1] || null;
  var cauch3 = cauchWithBrick[2] || null;

  var plan = {
    role: roleName,
    cadence: cadence,
    cadenceLabel: roleData.cadenceLabel,
    phases: phases.map(function(p, i) {
      var phaseActions = i === 0 ? actions.phase1 : i === 1 ? actions.phase2 : actions.phase3;
      var targetCauch = i === 0 ? cauch1 : i === 1 ? cauch2 : cauch3;
      return {
        label: p.label,
        tag: p.tag,
        rdvSouverainete: p.rdvSouverainete,
        color: p.color,
        actions: phaseActions,
        cauchemar: targetCauch ? targetCauch.cauchemar.label : null,
        cauchemarCost: targetCauch ? formatCost(targetCauch.cauchemar.costRange[0]) + "-" + formatCost(targetCauch.cauchemar.costRange[1]) : null,
        brick: targetCauch && targetCauch.brick ? targetCauch.brick.cvVersion || targetCauch.brick.text : null,
      };
    }),
    take: takeText,
    ouverture: cauch1 ? "Le cauchemar le plus couteux (" + cauch1.cauchemar.label + ", " + formatCost(cauch1.cauchemar.costRange[0]) + "-" + formatCost(cauch1.cauchemar.costRange[1]) + "/an) est votre priorite semaine 1." : null,
  };

  return plan;
}

function generateContactScripts(bricks, targetRoleId, targetOffer) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return null;

  // If targetOffer provided, parse its signals and use those cauchemars
  var offerCauchemars = null;
  if (targetOffer && targetOffer.parsedSignals && targetOffer.parsedSignals.cauchemars) {
    offerCauchemars = targetOffer.parsedSignals.cauchemars;
  } else if (targetOffer && targetOffer.text && targetOffer.text.trim().length > 20) {
    var parsed = parseOfferSignals(targetOffer.text, targetRoleId);
    if (parsed) offerCauchemars = parsed.cauchemars;
  }
  var activeCauchs = offerCauchemars || getActiveCauchemars();

  var coverage = computeCauchemarCoverage(bricks);
  var covered = coverage.filter(function(c) { return c.covered; });
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role : "ce poste";

  var strongestCauchemar = null;
  var strongestBrick = null;
  covered.forEach(function(cc) {
    var cauch = activeCauchs.find(function(c) { return c.id === cc.id; });
    if (!cauch) {
      // Try matching by label/kpi for offer-specific cauchemars
      cauch = activeCauchs.find(function(c) {
        return c.kpis && c.kpis.some(function(kpi) { return cc.kpi && cc.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
      });
    }
    if (!cauch) return;
    if (!strongestCauchemar || cauch.costRange[1] > strongestCauchemar.costRange[1]) {
      var coveringBrick = validated.find(function(b) {
        return cauch.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
      });
      if (coveringBrick) { strongestCauchemar = cauch; strongestBrick = coveringBrick; }
    }
  });
  if (!strongestBrick) strongestBrick = validated[0];

  var cauchText = strongestCauchemar ? strongestCauchemar.nightmareShort : "";
  var brickText = strongestBrick ? strongestBrick.text : "";
  var brickCv = strongestBrick && strongestBrick.cvVersion ? strongestBrick.cvVersion : brickText;
  var costLow = strongestCauchemar ? formatCost(Math.round(strongestCauchemar.costRange[0] / 4)) : "";
  var costHigh = strongestCauchemar ? formatCost(Math.round(strongestCauchemar.costRange[1] / 4)) : "";
  var costLine = costLow && costHigh ? " Ce type de situation coûte entre " + costLow + " et " + costHigh + " par trimestre." : "";

  var closeQuestions = {
    enterprise_ae: "Qu'est-ce qui rend ce recrutement difficile aujourd'hui ?",
    head_of_growth: "Quel canal d'acquisition vous préoccupe le plus en ce moment ?",
    strategic_csm: "Quel est le compte qui vous empêche de dormir ?",
    senior_pm: "Quel arbitrage produit personne ne veut trancher en ce moment ?",
    ai_architect: "Quel cas d'usage IA est bloqué depuis plus de 3 mois ?",
    engineering_manager: "Quel est le frein technique que l'équipe n'arrive pas à débloquer ?",
    management_consultant: "Quel problème a déclenché ce recrutement ?",
    strategy_associate: "Quelle décision stratégique attend des données que personne ne produit ?",
    operations_manager: "Quelle friction inter-équipes consomme le plus de temps ?",
    fractional_coo: "Qu'est-ce que le CEO ne devrait plus faire lui-même dans 6 mois ?",
  };
  var closeQ = closeQuestions[targetRoleId] || "Qu'est-ce qui rend ce recrutement difficile aujourd'hui ?";
  var triggerQ = "Qu'est-ce qui a déclenché ce recrutement ?";
  var antiProfileQ = "Quel profil ne voulez-vous surtout pas reproduire ?";

  // A. EMAIL — 8-10 lignes, formel
  var email = "Bonjour [Prénom],\n\n";
  email += cauchText ? cauchText + costLine + "\n\n" : "Votre offre " + roleLabel + " m'a fait réagir sur un point précis.\n\n";
  email += "J'ai vécu ce problème. " + brickText + "\n\n";
  email += "Je ne sais pas si c'est pertinent pour votre contexte. Mais si ce sujet résonne, j'ai une question :\n\n";
  email += closeQ + "\n\n";
  email += "Bonne journée,\n[Prénom Nom]\n\n";
  email += "PS : Deux questions que je pose systématiquement en début d'échange :\n";
  email += "1. " + triggerQ + "\n";
  email += "2. " + antiProfileQ;

  // B. DM LINKEDIN — 3-4 lignes, direct
  var dm = "[Prénom], " + (cauchText ? cauchText.replace(/\.$/, "") + "." : "votre offre " + roleLabel + " m'a interpellé.") + " ";
  dm += brickCv + " ";
  dm += triggerQ;

  // C. N+1 OPÉRATIONNEL — terrain, problème concret
  var n1 = "Bonjour [Prénom],\n\n";
  n1 += cauchText ? cauchText + " C'est un problème que j'ai résolu concrètement.\n\n" : "Votre équipe recrute sur un sujet que j'ai vécu de l'intérieur.\n\n";
  n1 += brickText + "\n\n";
  n1 += "La méthode est reproductible. " + triggerQ + " " + closeQ + "\n\n";
  n1 += "[Prénom Nom]";

  // D. RH — parcours, trajectoire, culture fit
  var rh = "Bonjour [Prénom],\n\n";
  rh += cauchText ? cauchText + " " : "";
  rh += brickCv + "\n\n";
  if (strongestBrick && strongestBrick.interviewVersions) {
    rh += strongestBrick.interviewVersions.rh.length > 200 ? strongestBrick.interviewVersions.rh.slice(0, 200) + "..." : strongestBrick.interviewVersions.rh;
    rh += "\n\n";
  }
  rh += antiProfileQ + " Je préfère calibrer mon discours sur ce que vous cherchez à éviter.\n\n";
  rh += "[Prénom Nom]";

  return { email: cleanRedac(email, "livrable"), dm: cleanRedac(dm, "livrable"), n1: cleanRedac(n1, "livrable"), rh: cleanRedac(rh, "livrable") };
}

/* GRILLE 6 TESTS */
function scoreContactScript(text, bricks, cauchemars) {
  if (!text || text.length < 20) return { score: 0, tests: [] };
  var lower = text.toLowerCase();

  // 1. MIROIR — première phrase parle du destinataire
  var firstLine = text.split("\n").filter(function(l) { return l.trim().length > 5; })[0] || "";
  var firstLower = firstLine.toLowerCase();
  var miroir = firstLower.indexOf("vous") !== -1 || firstLower.indexOf("votre") !== -1 || firstLower.indexOf("[prénom]") !== -1 || firstLower.indexOf("[prenom]") !== -1;
  var miroirFail = firstLower.indexOf("je ") < 3 && firstLower.indexOf("je ") !== -1 && !miroir;

  // 2. CAUCHEMAR — nomme un cauchemar spécifique
  var activeCauch = cauchemars || getActiveCauchemars();
  var hasCauchemar = activeCauch.some(function(c) {
    return c.nightmareShort && lower.indexOf(c.nightmareShort.toLowerCase().slice(0, 20)) !== -1;
  });
  if (!hasCauchemar) {
    hasCauchemar = lower.indexOf("cauchemar") !== -1 || lower.indexOf("problème") !== -1 || lower.indexOf("coûte") !== -1 || lower.indexOf("coute") !== -1;
  }

  // 3. PREUVE ASYMÉTRIQUE — ouvre une question au lieu de fermer
  var hasQuestion = text.indexOf("?") !== -1;
  var hasProof = bricks.some(function(b) {
    return b.status === "validated" && b.text && lower.indexOf(b.text.toLowerCase().slice(0, 20)) !== -1;
  });
  var preuveAsym = hasQuestion && hasProof;

  // 4. COÛT DU NON — coût de ne pas répondre
  var coutDuNon = lower.indexOf("coûte") !== -1 || lower.indexOf("coute") !== -1 || lower.indexOf("perd") !== -1 || lower.indexOf("trimestre") !== -1 || lower.indexOf("par an") !== -1 || lower.indexOf("chaque mois") !== -1 || lower.indexOf("manque") !== -1;

  // 5. SORTIE FACILE — question de fin légère
  var lastLines = text.split("\n").filter(function(l) { return l.trim().length > 3; });
  var lastMeaningful = "";
  for (var i = lastLines.length - 1; i >= 0; i--) {
    if (lastLines[i].indexOf("?") !== -1) { lastMeaningful = lastLines[i]; break; }
  }
  var sortieFacile = lastMeaningful.length > 0 && lastMeaningful.length < 120;

  // 6. DILTS — monte d'au moins 1 niveau
  var diltsP = analyzeDiltsProgression(text);
  var diltsOk = diltsP.progression >= 1;

  var tests = [
    { id: "miroir", label: "Miroir", desc: "La première phrase parle du destinataire", passed: miroir && !miroirFail, fix: "Commence par 'vous' ou par le problème du destinataire, pas par 'je'." },
    { id: "cauchemar", label: "Cauchemar", desc: "Nomme un problème spécifique", passed: hasCauchemar, fix: "Ajoute le cauchemar du décideur issu de l'offre." },
    { id: "preuve", label: "Preuve asymétrique", desc: "Ouvre une question au lieu de la fermer", passed: preuveAsym, fix: "Inclus une preuve chiffrée ET termine par une question." },
    { id: "cout", label: "Coût du non", desc: "Le coût de ne pas répondre est visible", passed: coutDuNon, fix: "Ajoute le coût en euros ou en temps du problème non résolu." },
    { id: "sortie", label: "Sortie facile", desc: "La question de fin est légère", passed: sortieFacile, fix: "Termine par une question courte, facile à répondre." },
    { id: "dilts", label: "Registre", desc: "Monte d'au moins 1 niveau logique", passed: diltsOk, fix: "Ouvre sur du concret (fait, chiffre) et ferme sur de la vision (conviction, identité)." },
  ];

  var passed = tests.filter(function(t) { return t.passed; }).length;
  var score = Math.round(passed * 1.67);
  if (score > 10) score = 10;

  return { score: score, tests: tests, passedCount: passed };
}


/* Item 6 — Transition script for outsiders detected via cross-role matching */
function generateTransitionScript(bricks, sourceRoleId, targetAlt) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0 || !targetAlt) return null;

  // Find strongest elastic brick that matches the alternative role
  var bestBrick = null;
  validated.forEach(function(b) {
    if (b.elasticity === "élastique" && !bestBrick) bestBrick = b;
  });
  if (!bestBrick) bestBrick = validated[0];

  var altRoleData = KPI_REFERENCE[targetAlt.roleId] ? KPI_REFERENCE[targetAlt.roleId] : null;
  var altRoleLabel = altRoleData ? altRoleData.role : "ce poste";
  var sourceRoleData = sourceRoleId && KPI_REFERENCE[sourceRoleId] ? KPI_REFERENCE[sourceRoleId] : null;
  var sourceRoleLabel = sourceRoleData ? sourceRoleData.role : "mon poste actuel";

  var script = "Bonjour [Prenom],\n\n";
  script += "Mon titre actuel ne matche pas votre offre " + altRoleLabel + ". Je viens de " + sourceRoleLabel + ".\n\n";
  script += "Mais votre besoin m'a interpellé. " + bestBrick.text + "\n\n";
  script += "Ce résultat s'est produit dans un autre contexte. Je suis convaincu qu'il se transpose chez vous.\n\n";
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
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });

  var coverage = computeCauchemarCoverage(bricks);
  var coveredCount = coverage.filter(function(c) { return c.covered; }).length;

  var report = "RAPPORT D'IMPACT -- Forge #1\n\n";
  report += "Profil : " + (roleData ? roleData.role : "Non defini") + "\n";
  report += "Mode : " + (trajectoryToggle === "j_y_suis" ? "J'y suis" : trajectoryToggle === "j_y_vais" ? "J'y vais" : "Non defini") + "\n";
  report += "Densité atteinte : " + (density ? density.score : 0) + "%\n\n";

  report += "BRIQUES FORGEES : " + validated.length + "\n";
  if (chiffreBricks.length > 0) report += "- " + chiffreBricks.length + " brique" + (chiffreBricks.length > 1 ? "s" : "") + " chiffre\n";
  if (decisionBricks.length > 0) report += "- " + decisionBricks.length + " brique" + (decisionBricks.length > 1 ? "s" : "") + " decision\n";
  if (influenceBricks.length > 0) report += "- " + influenceBricks.length + " brique" + (influenceBricks.length > 1 ? "s" : "") + " influence\n";
  if (cicatrices.length > 0) report += "- " + cicatrices.length + " cicatrice" + (cicatrices.length > 1 ? "s" : "") + "\n";

  report += "\nCAUCHEMARS COUVERTS : " + coveredCount + "/" + getActiveCauchemars().length + "\n";
  coverage.forEach(function(c) {
    var cauch = getActiveCauchemars().find(function(cc) { return cc.id === c.id; });
    report += "- " + c.label + " -- " + (c.covered ? "couvert" : "NON COUVERT") + "\n";
    if (c.covered && cauch) {
      report += "  Coût direct : " + formatCost(cauch.costRange[0]) + "-" + formatCost(cauch.costRange[1]) + "/an\n";
      if (cauch.costSymbolique) report += "  Cout symbolique : " + cauch.costSymbolique + "\n";
      if (cauch.costSystemique) report += "  Cout systemique : " + cauch.costSystemique + "\n";
    }
  });

  report += "\nKPIS ELASTIQUES DOCUMENTES : " + elasticBricks.length + "\n";
  elasticBricks.forEach(function(b) {
    report += "- " + (b.kpi || "Non classe") + " (élastique)\n";
  });

  var unfairBrick = bricks.find(function(b) { return b.type === "unfair_advantage" && b.status === "validated"; });
  if (unfairBrick) {
    report += "\nAVANTAGE INJUSTE IDENTIFIE\n";
    report += "- " + unfairBrick.text + "\n";
    var matchingElastic = elasticBricks.find(function(eb) {
      return eb.text && unfairBrick.text && eb.kpi === unfairBrick.kpi;
    });
    if (matchingElastic) {
      report += "  Confirme par brique chiffre + signal collègues. Non-rattrapable par la formation.\n";
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
  report += "Ce rapport s'épaissit a chaque Rendez-vous de Souverainete. Les briques s'accumulent. Le levier grandit.";
  return cleanRedac(report);
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
      rupture.push({ kpi: kpi.name, reason: "Aucune preuve documentée", elasticity: kpi.elasticity });
    } else if (matchingBricks.length === 1 && !matchingBricks[0].brickCategory !== "decision") {
      rupture.push({ kpi: kpi.name, reason: "1 preuve fragile (sans arbitrage ni cicatrice)", elasticity: kpi.elasticity });
    }
  });

  // 9-PROFILE GRID
  var profileGrid = [
    { id: "hunter", label: "Chasseur", check: function() { return bricks.some(function(b) { return b.status === "validated" && b.kpi && (b.kpi.toLowerCase().indexOf("pipeline") !== -1 || b.kpi.toLowerCase().indexOf("prospection") !== -1); }); }, proofFn: function() { return "Brique pipeline/prospection validee"; } },
    { id: "zero_to_one", label: "Createur 0-to-1", check: function() { return validated.some(function(b) { return b.text && (b.text.toLowerCase().indexOf("from scratch") !== -1 || b.text.toLowerCase().indexOf("de zero") !== -1 || b.text.toLowerCase().indexOf("cree") !== -1 || b.text.toLowerCase().indexOf("lance") !== -1 || b.text.toLowerCase().indexOf("construit") !== -1); }); }, proofFn: function() { return "Contexte de création identifie dans une brique"; } },
    { id: "regular", label: "Regulier", check: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre"; }).length >= 3; }, proofFn: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre"; }).length + " briques chiffre (indice de régularité)"; } },
    { id: "track_record", label: "Track record blinde", check: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre" && hasNumbers(b.text); }).length >= 2; }, proofFn: function() { return "2+ briques chiffrees avec données quantifiees"; } },
    { id: "builder", label: "Constructeur", check: function() { return validated.some(function(b) { return b.brickCategory === "influence"; }) && validated.some(function(b) { return b.brickCategory === "decision"; }); }, proofFn: function() { return "Briques influence + decision (structure, pas juste execute)"; } },
    { id: "specialist", label: "Specialiste vertical", check: function() {
      var kpiNames = validated.map(function(b) { return b.kpi; }).filter(function(k) { return k; });
      var unique = []; kpiNames.forEach(function(k) { if (unique.indexOf(k) === -1) unique.push(k); });
      return unique.length <= 3 && validated.length >= 3;
    }, proofFn: function() { return "Toutes les preuves concentrées sur le même segment"; } },
    { id: "cicatrice", label: "Maturité (cicatrices)", check: function() { return bricks.filter(function(b) { return b.brickType === "cicatrice" && b.status === "validated"; }).length >= 1; }, proofFn: function() { return bricks.filter(function(b) { return b.brickType === "cicatrice" && b.status === "validated"; }).length + " échec(s) assume(s)"; } },
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

  // DILTS CALIBRATION — compute target from history
  var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
  var diltsTarget = computeDiltsTarget(diltsHistory);
  var targetLevel = diltsTarget.targetLevel;
  var calibration = DILTS_CALIBRATION[targetLevel] || DILTS_CALIBRATION[2];

  var usedBrickIds = [];
  var posts = [];

  // Sort pillars: for high Dilts targets (4-5), prefer takes (conviction/identity)
  // For low Dilts targets (1-2), prefer non-takes (fact-based)
  var sortedPillars = pillars.slice().sort(function(a, b) {
    if (targetLevel >= 4) {
      return (a.source === "take" ? 0 : 1) - (b.source === "take" ? 0 : 1);
    } else {
      return (a.source === "take" ? 1 : 0) - (b.source === "take" ? 1 : 0);
    }
  });

  sortedPillars.slice(0, 2).forEach(function(pillar) {
    // BRICK SELECTION — biased toward target Dilts level
    var brick = selectBrickForDiltsTarget(validated, targetLevel, usedBrickIds);
    if (!brick) return;
    usedBrickIds.push(brick.id);

    // LINE 1 — Cauchemar
    var cauchemar = "";
    getActiveCauchemars().forEach(function(c) {
      if (cauchemar) return;
      if (c.kpis.some(function(kpi) { return brick.kpi && brick.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; })) {
        cauchemar = c.nightmareShort;
      }
    });
    if (!cauchemar) cauchemar = "Le problème existe. Personne ne le formule.";

    // LINES 2-5 — These from pillar
    var these = "";
    if (pillar.source === "take" && pillar.desc) {
      these = pillar.desc;
    } else {
      these = pillar.title + ". " + (pillar.desc || "C'est une réalité que l'expérience révèle, pas les articles de blog.");
    }
    if (these.length > 250) these = these.slice(0, 250) + "...";

    // LINES 6-8 — Situation (brick without numbers)
    var situation = brick.text;
    situation = situation.replace(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]*/g, "").replace(/\d+[\.,]?\d*\s*(mois|semaines|jours|ans|comptes|commerciaux|personnes|équipes|EUR|euros|millions?)/gi, "$1").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trim();
    if (situation.length > 200) situation = situation.slice(0, 200) + "...";

    // Framing by brick type + DILTS CALIBRATION
    if (calibration.framingOpen) {
      situation = calibration.framingOpen + situation;
    } else if (brick.brickType === "cicatrice") {
      situation = "J'ai appris ça à mes dépens. " + situation;
    } else if (brick.brickCategory === "decision") {
      situation = "J'ai du trancher dans ce contexte. " + situation;
    } else if (brick.brickCategory === "influence") {
      situation = "Le plus dur n'etait pas la méthode. " + situation;
    }

    // LINE 9 — Closing calibré par niveau Dilts
    var closing = calibration.framingClose;
    // Ajoute une question ouverte adaptée au niveau
    var question = "";
    if (targetLevel <= 2) {
      question = pillar.title && pillar.title.length < 60
        ? "Quel résultat concret avez-vous obtenu sur " + pillar.title.toLowerCase().replace(/\.$/, "") + " ?"
        : "Quel chiffre de votre parcours personne ne connaît ?";
    } else if (targetLevel === 3) {
      question = pillar.title && pillar.title.length < 60
        ? "Quelle méthode utilisez-vous sur " + pillar.title.toLowerCase().replace(/\.$/, "") + " ?"
        : "Quel process avez-vous construit que personne ne vous a appris ?";
    } else if (targetLevel === 4) {
      question = "Et vous, quel est le consensus de votre secteur que votre expérience contredit ?";
    } else {
      question = "Quelle conviction professionnelle vous définit, même quand elle dérange ?";
    }

    var post = cleanRedac(cauchemar + "\n\n" + these + "\n\n" + situation + "\n\n" + closing + "\n\n" + question);

    var dilts = detectDiltsLevel(post);
    var hook = scoreHook(post);
    var body = analyzeBodyRetention(post);
    var expert = expertWritingAudit(post);

    var postObj = {
      pillar: pillar.title,
      pillarSource: pillar.source,
      brickUsed: brick.text.length > 60 ? brick.text.slice(0, 60) + "..." : brick.text,
      brickType: brick.brickType === "cicatrice" ? "cicatrice" : brick.brickCategory,
      text: post,
      charCount: post.length,
      diltsLevel: dilts.dominant,
      diltsBreakdown: dilts.breakdown,
      hookScore: hook.score,
      hookTests: hook.tests,
      bodyRetention: body,
      expertCritique: expert,
    };

    postObj.firstComment = generateFirstComment(postObj, bricks, vault);

    // Global score /10 = average of hook + expert checks
    var expertPassed = expert.miroir.filter(function(m) { return m.passed; }).length + expert.luisEnrique.filter(function(l) { return l.passed; }).length;
    var expertTotal = expert.miroir.length + expert.luisEnrique.length;
    var globalScore = Math.round(((hook.score / 10) + (expertPassed / expertTotal)) / 2 * 10);
    postObj.globalScore = globalScore;
    postObj.diltsTarget = targetLevel;

    posts.push(postObj);
  });

  // Attach calibration info to the array for UI access
  posts.diltsTarget = diltsTarget;
  return posts;
}

/* ==============================
   ITEM 5 — 4 FILTRES POSTS LINKEDIN
   ============================== */

/* FILTRE 2 — MARIE HOOK (accroche) — 6 tests sur la première phrase */
function scoreHook(text) {
  if (!text || text.length < 20) return { score: 0, tests: [] };
  var lines = text.split("\n").filter(function(l) { return l.trim().length > 5; });
  var hook = lines[0] || "";
  var lower = hook.toLowerCase();

  // A. So What — pourquoi le lecteur s'arrête
  var soWhat = lower.indexOf("?") !== -1 || lower.indexOf("personne") !== -1 || lower.indexOf("jamais") !== -1 || lower.indexOf("problème") !== -1 || lower.indexOf("coûte") !== -1 || lower.indexOf("coute") !== -1 || lower.indexOf("erreur") !== -1;

  // B. Ennemi — antagoniste identifié
  var ennemi = lower.indexOf("pas") !== -1 || lower.indexOf("jamais") !== -1 || lower.indexOf("personne ne") !== -1 || lower.indexOf("erreur") !== -1 || lower.indexOf("mythe") !== -1 || lower.indexOf("mensonge") !== -1 || lower.indexOf("faux") !== -1 || lower.indexOf("à tort") !== -1;

  // C. Consensus — dit le contraire de ce que tout le monde pense
  var consensus = lower.indexOf("contrairement") !== -1 || lower.indexOf("tout le monde") !== -1 || lower.indexOf("consensus") !== -1 || lower.indexOf("on pense que") !== -1 || lower.indexOf("idée reçue") !== -1 || lower.indexOf("idee recue") !== -1 || lower.indexOf("à rebours") !== -1;

  // D. Aliénation — prise de position risquée
  var alienation = lower.indexOf("refuse") !== -1 || lower.indexOf("déteste") !== -1 || lower.indexOf("n'en peux plus") !== -1 || lower.indexOf("stop") !== -1 || lower.indexOf("marre") !== -1 || lower.indexOf("insupportable") !== -1 || ennemi;

  // E. Authenticité — vécu ou template
  var authenticite = lower.indexOf("j'ai") !== -1 || lower.indexOf("j'étais") !== -1 || lower.indexOf("mon") !== -1 || lower.indexOf("ma ") !== -1 || lower.indexOf("quand j") !== -1 || lower.indexOf("ce jour") !== -1;

  // F. Mémorabilité — courte et percutante
  var memorabilite = hook.length < 80 && hook.length > 10;

  var tests = [
    { id: "soWhat", label: "So What", passed: soWhat },
    { id: "ennemi", label: "Ennemi", passed: ennemi },
    { id: "consensus", label: "Consensus", passed: consensus },
    { id: "alienation", label: "Aliénation", passed: alienation },
    { id: "authenticite", label: "Authenticité", passed: authenticite },
    { id: "memorabilite", label: "Mémorabilité", passed: memorabilite },
  ];

  var passed = tests.filter(function(t) { return t.passed; }).length;
  var score = Math.round((passed / 6) * 10);
  return { score: score, tests: tests, hook: hook, passedCount: passed };
}

/* FILTRE 3 — MARIE HOOK (corps) — rétention paragraphe par paragraphe */
function analyzeBodyRetention(text) {
  if (!text || text.length < 40) return { issues: [], charCount: 0, hasBullets: false, tooLong: false };
  var paragraphs = text.split("\n\n").filter(function(p) { return p.trim().length > 5; });
  var issues = [];

  // Détection bullets
  var hasBullets = /^[\-\*•]\s/m.test(text) || /^\d+\.\s/m.test(text);
  if (hasBullets) issues.push("Listes à puces détectées. Prose brute uniquement.");

  // Longueur
  var tooLong = text.length > 1500;
  if (tooLong) issues.push("Post trop long (" + text.length + " caractères). Max recommandé : 1500.");

  // Ventre mou — paragraphes intermédiaires trop longs sans tension
  if (paragraphs.length >= 3) {
    var middle = paragraphs.slice(1, -1);
    middle.forEach(function(p, i) {
      if (p.length > 300) issues.push("Paragraphe " + (i + 2) + " trop long (" + p.length + " car.). Découpe ou resserre.");
      var hasHook = p.indexOf("?") !== -1 || p.indexOf("!") !== -1 || p.toLowerCase().indexOf("mais") !== -1 || p.toLowerCase().indexOf("pourtant") !== -1 || p.toLowerCase().indexOf("sauf que") !== -1;
      if (!hasHook && p.length > 100) issues.push("Paragraphe " + (i + 2) + " : pas de relance. Ajoute une tension pour tirer le lecteur au suivant.");
    });
  }

  return { issues: issues, charCount: text.length, hasBullets: hasBullets, tooLong: tooLong, paragraphCount: paragraphs.length };
}

/* FILTRE 4 — EXPERT ÉCRITURE (Miroir + Luis Enrique) */
function expertWritingAudit(text) {
  if (!text || text.length < 40) return { miroir: [], luisEnrique: [] };
  var paragraphs = text.split("\n\n").filter(function(p) { return p.trim().length > 5; });
  var lower = text.toLowerCase();

  // Phase Miroir
  var miroir = [];

  // Force du hook
  var hookResult = scoreHook(text);
  var hookStrong = hookResult.score >= 7;
  miroir.push({ label: "Force du hook", passed: hookStrong, detail: hookStrong ? "Accroche solide (" + hookResult.score + "/10)" : "Accroche faible (" + hookResult.score + "/10). Reformule." });

  // Clarté de l'angle — 1 seul sujet
  var subjects = [];
  paragraphs.forEach(function(p) {
    var pl = p.toLowerCase();
    var detectedSubjects = 0;
    if (pl.indexOf("churn") !== -1 || pl.indexOf("retention") !== -1 || pl.indexOf("rétention") !== -1) detectedSubjects++;
    if (pl.indexOf("pipeline") !== -1 || pl.indexOf("prospection") !== -1) detectedSubjects++;
    if (pl.indexOf("management") !== -1 || pl.indexOf("equipe") !== -1 || pl.indexOf("équipe") !== -1) detectedSubjects++;
    if (pl.indexOf("produit") !== -1 || pl.indexOf("roadmap") !== -1) detectedSubjects++;
    if (pl.indexOf("negociation") !== -1 || pl.indexOf("négociation") !== -1 || pl.indexOf("deal") !== -1) detectedSubjects++;
    subjects.push(detectedSubjects);
  });
  var uniqueTopics = subjects.filter(function(s) { return s > 0; }).length;
  var singleTopic = uniqueTopics <= 2;
  miroir.push({ label: "Clarté de l'angle", passed: singleTopic, detail: singleTopic ? "Un sujet par post. OK." : "Trop de sujets mélangés. Recentre." });

  // Incarnation — vécu ou théorie
  var incarnation = lower.indexOf("j'ai") !== -1 || lower.indexOf("j'étais") !== -1 || lower.indexOf("mon ") !== -1 || lower.indexOf("ma ") !== -1 || lower.indexOf("mes ") !== -1;
  miroir.push({ label: "Incarnation", passed: incarnation, detail: incarnation ? "Vécu personnel détecté." : "Trop générique. Ajoute une expérience vécue." });

  // Structure — 1 idée par paragraphe
  var goodStructure = paragraphs.length >= 3 && paragraphs.every(function(p) { return p.length < 400; });
  miroir.push({ label: "Structure", passed: goodStructure, detail: goodStructure ? "Paragraphes bien découpés." : "Découpe en blocs plus courts. 1 idée = 1 paragraphe." });

  // Phase Luis Enrique
  var luisEnrique = [];

  // Utilité vs bruit
  var hasInsight = lower.indexOf("apprend") !== -1 || lower.indexOf("découvert") !== -1 || lower.indexOf("compris") !== -1 || lower.indexOf("résultat") !== -1 || lower.indexOf("concret") !== -1 || lower.indexOf("methode") !== -1 || lower.indexOf("méthode") !== -1;
  luisEnrique.push({ label: "Utilité vs bruit", passed: hasInsight, detail: hasInsight ? "Le lecteur apprend quelque chose." : "Le lecteur n'apprend rien de concret. Ajoute un enseignement." });

  // Clarté vs complaisance
  var filler = (lower.match(/en effet|en fait|il faut dire que|force est de constater|il est important de|fondamentalement|évidemment/g) || []).length;
  var nofiller = filler < 2;
  luisEnrique.push({ label: "Clarté vs complaisance", passed: nofiller, detail: nofiller ? "Phrases directes." : filler + " expressions creuses détectées. Coupe le gras." });

  // Lecteur vs ego
  var jeCount = (lower.match(/\bje\b|\bj'ai\b|\bj'étais\b|\bmon\b|\bma\b|\bmes\b/g) || []).length;
  var vousCount = (lower.match(/\bvous\b|\bvotre\b|\bvos\b|\btu\b|\bton\b|\bta\b|\btes\b/g) || []).length;
  var readerFocused = vousCount >= 1 || jeCount < 8;
  luisEnrique.push({ label: "Lecteur vs ego", passed: readerFocused, detail: readerFocused ? "Equilibre je/vous correct." : "Trop de 'je' (" + jeCount + "). Réoriente vers le lecteur." });

  return { miroir: miroir, luisEnrique: luisEnrique };
}

/* PREMIER COMMENTAIRE — relance algorithme, ancré sur pilier + brique */
function generateFirstComment(post, bricks, vault) {
  if (!post || !post.text) return "";
  var pillarTitle = post.pillar || "";
  var pillarLower = pillarTitle.toLowerCase();
  var brickType = post.brickType || "chiffre";
  var pillarSource = post.pillarSource || "ai";

  // 1. Ouverture — angle complémentaire croisé pilier × brickType
  var opener = "";
  if (brickType === "cicatrice") {
    opener = "Ce que je ne dis pas dans le post : cette erreur m'a forcé à changer de méthode.";
  } else if (brickType === "decision") {
    opener = "Un détail que je n'ai pas mis dans le post : le plus dur n'était pas les chiffres. C'était de convaincre les gens autour de la table.";
  } else if (brickType === "influence") {
    opener = "Ce que je ne dis pas dans le post : le blocage n'était pas technique. Il était humain.";
  } else {
    opener = "Un point que je n'ai pas développé : ce résultat est venu de la méthode. La méthode est reproductible.";
  }

  // 2. Pont vers le pilier — relie le commentaire au territoire
  var bridge = "";
  if (pillarSource === "take") {
    // Take = conviction personnelle → renforcer la position
    bridge = " C'est pour ça que je reviens souvent sur ce sujet.";
  } else if (pillarTitle.length > 5) {
    bridge = " Et ça rejoint une conviction que j'observe sur le terrain : " + pillarTitle.charAt(0).toLowerCase() + pillarTitle.slice(1).replace(/\.$/, "") + ".";
  }

  // 3. Question — calibrée sur le pilier, pas générique
  var question = "";

  // Questions par thématique de pilier détectée
  if (pillarLower.indexOf("churn") !== -1 || pillarLower.indexOf("r" + "é" + "tention") !== -1 || pillarLower.indexOf("retention") !== -1) {
    question = "Quel signal vous alerte avant qu'un client parte ?";
  } else if (pillarLower.indexOf("pipeline") !== -1 || pillarLower.indexOf("prospection") !== -1 || pillarLower.indexOf("vente") !== -1 || pillarLower.indexOf("commercial") !== -1) {
    question = "Quel deal perdu vous a le plus appris sur votre process de vente ?";
  } else if (pillarLower.indexOf("equipe") !== -1 || pillarLower.indexOf("équipe") !== -1 || pillarLower.indexOf("management") !== -1 || pillarLower.indexOf("talent") !== -1) {
    question = "Quel signe vous dit qu'un collaborateur va partir avant qu'il ne le dise ?";
  } else if (pillarLower.indexOf("produit") !== -1 || pillarLower.indexOf("roadmap") !== -1 || pillarLower.indexOf("feature") !== -1 || pillarLower.indexOf("backlog") !== -1) {
    question = "Quelle feature avez-vous tuée alors que tout le monde la voulait ?";
  } else if (pillarLower.indexOf("n" + "é" + "gociation") !== -1 || pillarLower.indexOf("negociation") !== -1 || pillarLower.indexOf("salaire") !== -1 || pillarLower.indexOf("deal") !== -1) {
    question = "Quelle négociation vous a appris que le premier chiffre posé décide de tout ?";
  } else if (pillarLower.indexOf("ia") !== -1 || pillarLower.indexOf("intelligence artificielle") !== -1 || pillarLower.indexOf("mod" + "è" + "le") !== -1 || pillarLower.indexOf("modele") !== -1) {
    question = "Quel projet IA vous a appris que le vrai obstacle n'est pas technique ?";
  } else if (pillarLower.indexOf("process") !== -1 || pillarLower.indexOf("ops") !== -1 || pillarLower.indexOf("workflow") !== -1 || pillarLower.indexOf("simplifier") !== -1) {
    question = "Quel process avez-vous supprimé et que personne n'a regretté ?";
  } else if (pillarLower.indexOf("dette") !== -1 || pillarLower.indexOf("code") !== -1 || pillarLower.indexOf("tech") !== -1 || pillarLower.indexOf("build") !== -1) {
    question = "Quelle décision technique avez-vous repoussée jusqu'à ce qu'elle coûte cher ?";
  } else if (pillarLower.indexOf("conseil") !== -1 || pillarLower.indexOf("consultant") !== -1 || pillarLower.indexOf("diagnostic") !== -1) {
    question = "Quelle recommandation difficile a changé la trajectoire d'un client ?";
  } else if (pillarLower.indexOf("strat" + "é" + "g") !== -1 || pillarLower.indexOf("strateg") !== -1 || pillarLower.indexOf("comex") !== -1 || pillarLower.indexOf("m&a") !== -1) {
    question = "Quelle analyse avez-vous produite que le Comex a ignorée, à tort ?";
  } else {
    // Fallback — question universelle mais ancrée sur le pilier
    if (pillarTitle.length > 10) {
      question = "Quelle expérience vous a convaincu que " + pillarTitle.charAt(0).toLowerCase() + pillarTitle.slice(1).replace(/\.$/, "") + " ?";
    } else {
      question = "Quel résultat concret a changé votre façon de voir ce sujet ?";
    }
  }

  return cleanRedac(opener + bridge + " " + question);
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
      text = pillar.desc || title + ". C'est une réalité que l'expérience révèle.";
    }

    // Bridge to proof
    text += "\n\n";
    if (brick.brickType === "cicatrice") {
      text += "J'ai appris ça à mes dépens. " + brick.text + " L'échec m'a obligé à changer de méthode. Depuis, je mesure autrement.";
    } else if (brick.brickCategory === "decision") {
      text += "J'ai du trancher dans ce contexte. " + brick.text + " L'arbitrage n'etait pas evident. Mais c'est la que se construit la crédibilité.";
    } else if (brick.brickCategory === "influence") {
      text += "Le plus dur n'était pas la méthode. C'était l'alignement. " + brick.text + " Quand tout le monde tire dans la même direction, le résultat suit.";
    } else {
      text += "Les chiffres parlent. " + brick.text + " Ce n'est pas une opinion. C'est un fait mesuré.";
    }

    // Closing
    text += "\n\nLe vrai KPI n'est pas celui qu'on affiche. C'est celui qu'on decouvre quand on creuse sous la surface.";

    positions.push({ title: title, text: cleanRedac(text), pillarSource: pillar.source });
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
      level1: "Comment les arbitrages stratégiques sont-ils pris ici ? Qui tranche quand les équipes ne s'alignent pas ?",
      level2: "J'ai du arbitrer entre " + (db.text.length > 50 ? db.text.slice(0, 50) + "..." : db.text) + ". Ici, quelle est la decision difficile que personne ne veut prendre pour atteindre les objectifs du prochain trimestre ?",
      logic: "Basee sur ta brique decision la plus forte. Tu as la crédibilité de poser cette question parce que tu as déjà traverse un arbitrage similaire.",
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
      level1: "Comment l'alignement entre les équipes fonctionne-t-il au quotidien ? Quels sont les points de friction les plus fréquents ?",
      level2: "J'ai aligné des équipes qui ne reportaient pas à moi sur des sujets similaires. Ici, comment gérez-vous le conflit d'intérêt entre la vision produit et la réalité commerciale ?",
      logic: "Basee sur ta brique influence. Tu montres que tu penses en dynamique politique, pas en organigramme.",
      brickRef: ib.text.length > 60 ? ib.text.slice(0, 60) + "..." : ib.text,
    });
  }

  // Cauchemar-based question (always)
  if (getActiveCauchemars().length > 0) {
    var cauchemar = getActiveCauchemars()[0];
    var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
    questions.push({
      type: "efficience",
      color: "#e94560",
      level1: "L'offre mentionne " + cauchemar.label.toLowerCase() + ". Qu'est-ce qui a été tenté avant pour résoudre ce problème ?",
      level2: "Ce type de problème coute entre " + formatCost(cauchemar.costRange[0]) + " et " + formatCost(cauchemar.costRange[1]) + " par an dans la plupart des structures que je connais. Si rien ne change dans les 6 prochains mois, quel est l'impact sur vos objectifs ?",
      logic: "Basee sur le cauchemar principal de l'offre. Tu montres que tu penses en coût du problème, pas en cout salarial.",
      brickRef: cauchemar.label,
    });
  }

  // Cicatrice-based question (if exists)
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  if (cicatrices.length > 0) {
    questions.push({
      type: "saillance",
      color: "#ff9800",
      level1: "Quel a été le dernier échec marquant de l'équipe et qu'est-ce qui a change après ?",
      level2: "J'ai moi-même perdu un deal majeur en sous-estimant la politique interne. Ca m'a force a changer de méthode. Ici, comment la culture de l'équipe traite-t-elle les échecs ? Est-ce qu'on en parle ou est-ce qu'on les enterre ?",
      logic: "Basée sur ta cicatrice. Tu as la crédibilité de parler d'échec parce que tu as assumé le tien. Le recruteur mesure ta maturité et la culture de l'entreprise en même temps.",
      brickRef: cicatrices[0].text.length > 60 ? cicatrices[0].text.slice(0, 60) + "..." : cicatrices[0].text,
    });
  }

  return questions.slice(0, 4);
}

/* ITERATION 4 — Signal-to-Script generator */
var SIGNAL_TYPES = [
  { keywords: ["leve", "levee", "serie", "fonds", "millions", "financement", "fundraise"], type: "levee_fonds", label: "Levée de fonds" },
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
  return { type: "autre", label: "Signal détecté" };
}

function generateSignalScript(signalText, signalType, bricks, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
  var bestBrick = elasticBricks.length > 0 ? elasticBricks[0] : (validated.length > 0 ? validated[0] : null);
  var cauchemar = getActiveCauchemars().length > 0 ? getActiveCauchemars()[0] : null;

  var opener = "";
  if (signalType.type === "levee_fonds") opener = "Vous venez de lever des fonds. Dans les 6 prochains mois, vous allez structurer une équipe qui n'existe pas encore.";
  else if (signalType.type === "recrutement") opener = "J'ai vu que vous recrutez. Ce type de poste signale un problème que je connais bien.";
  else if (signalType.type === "mouvement") opener = "J'ai note un changement dans votre équipe de direction. Les 90 premiers jours vont definir la trajectoire.";
  else if (signalType.type === "expansion") opener = "Vous ouvrez un nouveau terrain. Les erreurs des 6 premiers mois coutent cher.";
  else if (signalType.type === "reorganisation") opener = "Une reorganisation cree toujours un besoin que l'organigramme ne montre pas encore.";
  else opener = "J'ai identifié un signal dans votre actualité récente.";

  var proof = bestBrick ? "J'ai résolu un problème similaire : " + (bestBrick.text.length > 80 ? bestBrick.text.slice(0, 80) + "..." : bestBrick.text) : "";
  var cost = cauchemar ? "Ce type de problème coute entre " + formatCost(cauchemar.costRange[0]) + " et " + formatCost(cauchemar.costRange[1]) + " par an." : "";
  var close = "3 minutes cette semaine pour en parler ?";

  return cleanRedac(opener + "\n\n" + proof + (cost ? "\n\n" + cost : "") + "\n\n" + close, "livrable");
}

/* ==============================
   LINKEDIN COMMENT GENERATOR — crosses post content with Coffre-Fort
   ============================== */

var COMMENT_TOPICS = [
  { keywords: ["vente", "commercial", "closing", "pipeline", "prospection", "deal", "quota", "revenue"], topic: "vente" },
  { keywords: ["produit", "product", "feature", "roadmap", "backlog", "user", "adoption", "ux"], topic: "produit" },
  { keywords: ["management", "équipe", "leader", "manager", "culture", "recrutement", "talent", "rh"], topic: "management" },
  { keywords: ["ia", "ai", "intelligence artificielle", "chatgpt", "llm", "automatisation", "prompt"], topic: "ia" },
  { keywords: ["process", "operations", "efficacité", "productivite", "workflow", "outil", "crm", "saas"], topic: "operations" },
  { keywords: ["stratégie", "croissance", "scale", "levee", "fundraise", "startup", "serie"], topic: "stratégie" },
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

/* ==============================
   FILTRE COMMENTAIRE UTILISATEUR — 3 filtres + territoire + technique
   Calibré dynamiquement sur le Coffre-Fort, le rôle cible, les piliers.
   ============================== */

/* POSTS À ÉVITER — patterns toxiques pour la crédibilité */
var COMMENT_AVOID_PATTERNS = [
  { id: "victimaire", markers: ["c'est honteux", "scandaleux", "les entreprises ne respectent", "les recruteurs sont", "on ne devrait pas avoir a", "ras le bol", "j'en ai marre", "c'est inadmissible", "stop aux", "halte a"], label: "Post victimaire — zéro retour de crédibilité" },
  { id: "coaching_mental", markers: ["crois en toi", "tu merites", "ose etre toi", "sors de ta zone de confort", "visualise ton succes", "la clé c'est la confiance", "affirmation positive", "lacher prise", "energie positive", "mindset"], label: "Coaching mental — pas ton terrain de preuve" },
  { id: "fiche_entreprise", markers: ["nous recrutons", "on recrute", "rejoignez-nous", "nous recherchons", "offre d'emploi", "candidatez", "postulez", "#hiring", "#werehiring", "#recrutement"], label: "Fiche entreprise — commenter = supplier" },
  { id: "defouloir", markers: ["tag un ami", "qui est d'accord", "partage si", "like si tu", "qui se reconnait", "ca vous parle", "so true", "tellement vrai"], label: "Défouloir collectif — ton commentaire se noie" },
  { id: "concurrent", markers: ["coach carriere", "coach emploi", "bilan de competences", "faire son cv", "personal branding", "je vous aide a", "mon programme", "ma formation carriere", "accompagnement professionnel"], label: "Concurrent indirect — pas de visibilité gratuite" },
];

function detectAvoidPatterns(text) {
  var lower = text.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
  var detected = [];
  COMMENT_AVOID_PATTERNS.forEach(function(p) {
    var hits = 0;
    p.markers.forEach(function(m) {
      var mNorm = m.replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
      if (lower.indexOf(mNorm) !== -1) hits++;
    });
    if (hits >= 1) detected.push(p);
  });
  return detected;
}

/* TERRITOIRE UTILISATEUR — déduit du Coffre-Fort */
function computeUserTerritory(bricks, vault, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var takes = bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; });
  var pillars = vault && vault.selectedPillars ? vault.selectedPillars : [];
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;

  // Territory keywords: from KPIs (élastiques first), pillars, and brick text
  var territoryKw = [];
  if (roleData) {
    roleData.kpis.forEach(function(kpi) {
      if (kpi.elasticity === "élastique") {
        kpi.name.toLowerCase().split(/[\s\/\(\)]+/).forEach(function(w) { if (w.length > 3 && territoryKw.indexOf(w) === -1) territoryKw.push(w); });
      }
    });
  }
  pillars.forEach(function(p) {
    // Inject title keywords
    (p.title || "").toLowerCase().split(/\s+/).forEach(function(w) { if (w.length > 4 && territoryKw.indexOf(w) === -1) territoryKw.push(w); });
    // Inject desc keywords — le territoire inclut le développement du pilier, pas seulement le titre
    (p.desc || "").toLowerCase().split(/\s+/).forEach(function(w) {
      var clean = w.replace(/[.,;:!?()]/g, "");
      if (clean.length > 4 && territoryKw.indexOf(clean) === -1) territoryKw.push(clean);
    });
  });

  // Territory sectors from role
  var sectors = roleData ? [roleData.sector] : [];

  // Territory KPI names for matching
  var kpiNames = [];
  if (roleData) {
    roleData.kpis.forEach(function(kpi) { kpiNames.push(kpi.name.toLowerCase()); });
  }

  return {
    keywords: territoryKw,
    sectors: sectors,
    kpiNames: kpiNames,
    pillarCount: pillars.length,
    takeCount: takes.length,
    brickCount: validated.length,
    elasticKpis: roleData ? roleData.kpis.filter(function(k) { return k.elasticity === "élastique"; }).map(function(k) { return k.name; }) : [],
  };
}

/* DÉTECTION DU TROU — ce que le post dit sans le prouver */
function detectPostGap(text) {
  var lower = text.toLowerCase();
  var gaps = [];

  // Gap 1: claim without number
  var hasClaim = ["il faut", "on doit", "la cle c'est", "le secret", "l'essentiel", "le plus important", "ce qui compte"].some(function(m) { return lower.indexOf(m) !== -1; });
  var hasNumber = /\d+%|\d+x|\d+k|\d+€|\d+ mois|\d+ jours/.test(lower);
  if (hasClaim && !hasNumber) gaps.push({ type: "quoi_sans_combien", label: "Le quoi sans le combien", desc: "L'auteur affirme sans chiffrer. Ton chiffre sera le seul du fil." });

  // Gap 2: method without situation
  var hasMethod = ["methode", "process", "etapes", "framework", "strategie", "approche", "technique"].some(function(m) { return lower.indexOf(m) !== -1; });
  var hasSituation = ["chez", "quand j'ai", "dans mon", "en 20", "face a", "contexte", "equipe de", "pendant"].some(function(m) { return lower.indexOf(m) !== -1; });
  if (hasMethod && !hasSituation) gaps.push({ type: "comment_sans_ou", label: "Le comment sans le où", desc: "Méthode abstraite. Ton vécu ancre la théorie dans le réel." });

  // Gap 3: opinion without experience
  var hasOpinion = ["je pense que", "je crois que", "a mon avis", "selon moi", "conviction", "mon parti pris", "contrairement"].some(function(m) { return lower.indexOf(m) !== -1; });
  var hasExperience = ["j'ai vecu", "j'ai gere", "j'ai lance", "j'ai perdu", "j'ai construit", "dans mon experience", "quand j'ai du"].some(function(m) { return lower.indexOf(m) !== -1; });
  if (hasOpinion && !hasExperience) gaps.push({ type: "avis_sans_preuve", label: "L'avis sans la preuve", desc: "Opinion nue. Ton expérience vécue apporte ce que l'opinion seule ne donne pas." });

  // Gap 4: problem without solution
  var hasProblem = ["probleme", "difficulte", "challenge", "obstacle", "bloque", "galere", "crise", "echec"].some(function(m) { return lower.indexOf(m) !== -1; });
  var hasSolution = ["solution", "resolu", "regle", "mis en place", "lance", "deploye", "construit", "resultat"].some(function(m) { return lower.indexOf(m) !== -1; });
  if (hasProblem && !hasSolution) gaps.push({ type: "probleme_sans_solution", label: "Le problème sans la sortie", desc: "Constat sans issue. Ta brique montre comment tu as résolu un problème similaire." });

  if (gaps.length === 0) gaps.push({ type: "general", label: "Pas de trou flagrant", desc: "Le post est complet. Apporte un angle que l'auteur n'a pas couvert." });

  return gaps;
}

/* 3 FILTRES — chaque filtre retourne pass/fail + raison */
function runCommentFilters(postText, bricks, vault, targetRoleId) {
  var territory = computeUserTerritory(bricks, vault, targetRoleId);
  var topic = detectPostTopic(postText);
  var avoidPatterns = detectAvoidPatterns(postText);
  var gaps = detectPostGap(postText);
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var postLower = postText.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");

  // FILTRE 1 — Le post est-il dans ton territoire ?
  // Vérifie si le sujet du post croise les KPIs, piliers, ou mots-clés du rôle cible
  var territoryHits = 0;
  territory.keywords.forEach(function(kw) { if (postLower.indexOf(kw) !== -1) territoryHits++; });
  // Also check topic match against role KPIs
  var topicInKpi = false;
  if (topic.topic !== "general") {
    territory.kpiNames.forEach(function(kn) {
      if (kn.indexOf(topic.topic.slice(0, 4)) !== -1) topicInKpi = true;
    });
  }
  var filter1Pass = territoryHits >= 2 || topicInKpi || topic.topic !== "general";
  var filter1Reason = filter1Pass
    ? territoryHits + " mot" + (territoryHits > 1 ? "s" : "") + " de ton territoire détecté" + (territoryHits > 1 ? "s" : "") + ". Sujet : " + topic.topic + "."
    : "Ce post est hors de ton territoire. Ton commentaire n'aura pas l'ancrage de tes preuves.";

  // FILTRE 2 — As-tu une brique pertinente à injecter ?
  // Cherche une brique qui matche le sujet du post
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
  var filter2Pass = bestBrick !== null && bestRelevance >= 2;
  var filter2Reason = filter2Pass
    ? "Brique trouvée (" + (bestBrick.brickType === "cicatrice" ? "cicatrice" : bestBrick.brickCategory) + ") — pertinence " + bestRelevance + "/10."
    : "Aucune brique assez pertinente. Ton commentaire sera creux. Passe.";

  // FILTRE 3 — Le post a-t-il un trou que tu remplis ?
  // ET : le post n'est pas un pattern toxique
  var filter3Pass = avoidPatterns.length === 0 && gaps[0].type !== "general";
  var filter3Reason = "";
  if (avoidPatterns.length > 0) {
    filter3Reason = "PASSE. " + avoidPatterns[0].label + ".";
  } else if (gaps[0].type === "general") {
    filter3Reason = "Pas de trou détecté. Ton commentaire risque de répéter l'auteur.";
  } else {
    filter3Reason = "Trou détecté : " + gaps[0].label + ". " + gaps[0].desc;
  }

  var allPass = filter1Pass && filter2Pass && filter3Pass;
  var verdict = allPass ? "COMMENTE" : "PASSE";
  var verdictColor = allPass ? "#4ecca3" : "#e94560";

  return {
    verdict: verdict,
    verdictColor: verdictColor,
    filters: [
      { id: "territoire", label: "Dans ton territoire ?", passed: filter1Pass, reason: filter1Reason },
      { id: "brique", label: "Brique pertinente ?", passed: filter2Pass, reason: filter2Reason },
      { id: "trou", label: "Trou à combler ?", passed: filter3Pass, reason: filter3Reason },
    ],
    topic: topic,
    gaps: gaps,
    avoidPatterns: avoidPatterns,
    bestBrick: bestBrick,
    bestRelevance: bestRelevance,
    territory: territory,
  };
}

/* AUDIT QUALITÉ COMMENTAIRE — 3 tests sur le commentaire généré */
function auditComment(commentText, bricks, vault) {
  if (!commentText) return { score: 0, tests: [], verdict: "REJETTE" };
  var lower = commentText.toLowerCase();
  var tests = [];

  // TEST 1 — Preuve : chiffre ou KPI d'une brique dans le commentaire
  var hasNumber = /\d+[%KM€]|\d+\s*(mois|jours|semaines|ans|points?)/.test(commentText);
  var hasKpiRef = false;
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  validated.forEach(function(b) {
    if (hasKpiRef) return;
    var kpiWords = (b.kpi || "").toLowerCase().split(/\s+/).filter(function(w) { return w.length > 4; });
    kpiWords.forEach(function(kw) { if (lower.indexOf(kw) !== -1) hasKpiRef = true; });
  });
  var preuvePass = hasNumber || hasKpiRef;
  tests.push({ name: "Preuve", pass: preuvePass, detail: preuvePass ? "Chiffre ou KPI détecté." : "Aucune preuve. Opinion nue." });

  // TEST 2 — Pilier : un mot-clé d'un pilier sélectionné matche
  var pillars = vault && vault.selectedPillars ? vault.selectedPillars : [];
  var pillarHit = false;
  var pillarMatched = "";
  pillars.forEach(function(p) {
    if (pillarHit) return;
    var words = ((p.title || "") + " " + (p.desc || "")).toLowerCase().split(/\s+/).filter(function(w) { return w.length > 4; });
    words.forEach(function(w) {
      var clean = w.replace(/[.,;:!?()]/g, "");
      if (clean.length > 4 && lower.indexOf(clean) !== -1) { pillarHit = true; pillarMatched = p.title; }
    });
  });
  tests.push({ name: "Pilier", pass: pillarHit, detail: pillarHit ? "Ancré sur : " + pillarMatched : "Hors territoire. Risque de dilution." });

  // TEST 3 — Relance : question ou tension ouverte dans les 100 derniers caractères
  var tail = commentText.slice(-100);
  var hasQuestion = tail.indexOf("?") !== -1;
  var hasTension = /le vrai sujet|ce qui manque|la question que personne|curieux de|ce qui change/.test(tail.toLowerCase());
  var relancePass = hasQuestion || hasTension;
  tests.push({ name: "Relance", pass: relancePass, detail: relancePass ? "Question ou tension ouverte détectée." : "Commentaire fermé. Aucune relance." });

  var passed = tests.filter(function(t) { return t.pass; }).length;
  var verdict = passed >= 2 ? "PUBLIE" : passed === 1 ? "FAIBLE" : "REJETTE";
  var verdictColor = passed >= 2 ? "#4ecca3" : passed === 1 ? "#ff9800" : "#e94560";

  return { score: passed, total: 3, tests: tests, verdict: verdict, verdictColor: verdictColor };
}

function generateLinkedInComment(postText, bricks, vault, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return { comment: "Coffre-Fort vide. Valide des briques d'abord.", topic: "general", filterResult: null };

  // RUN 3 FILTERS
  var filterResult = runCommentFilters(postText, bricks, vault, targetRoleId);

  // If filters say PASSE, return early with filter diagnostic only
  if (filterResult.verdict === "PASSE") {
    // LIKE RECOMMENDATION — PASSE
    var hasAvoidPattern = filterResult.avoidPatterns && filterResult.avoidPatterns.length > 0;
    var likeAdvice = hasAvoidPattern
      ? { action: "NE LIKE PAS", reason: "Contenu toxique ou concurrent. Le like valide une thèse que tu combats.", color: "#e94560" }
      : { action: "LIKE POSSIBLE", reason: "Post hors de ton territoire mais correct. Le like maintient ta présence sans engager ton positionnement.", color: "#ff9800" };

    return {
      comment: null,
      topic: filterResult.topic.topic,
      filterResult: filterResult,
      likeAdvice: likeAdvice,
      brickUsed: null,
      pillarUsed: null,
      brickSource: null,
      gap: filterResult.gaps[0],
    };
  }

  var bestBrick = filterResult.bestBrick;
  if (!bestBrick) bestBrick = validated[0];
  var gap = filterResult.gaps[0];

  // Extract SITUATION from brick (strip numbers, keep context)
  var situation = bestBrick.text;
  situation = situation.replace(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]*/g, "").replace(/\d+[\.,]?\d*\s*(mois|semaines|jours|ans|comptes|commerciaux|personnes|équipes)/g, "$1").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trim();
  if (situation.length > 120) situation = situation.slice(0, 120) + "...";

  // Find relevant pillar from vault
  var pillarAngle = null;
  if (vault && vault.selectedPillars && vault.selectedPillars.length > 0) {
    var takePillar = vault.selectedPillars.find(function(p) { return p.source === "take"; });
    pillarAngle = takePillar || vault.selectedPillars[0];
  }

  // TECHNIQUE DE COMMENTAIRE — 3 temps calibrés sur le trou détecté
  // 1. Identifier le trou (déjà fait)
  // 2. Injecter une preuve du Coffre-Fort
  // 3. Fermer par une question qui montre l'expertise

  // TEMPS 1 — Acknowledgement calibré sur le trou
  var acknowledge = "";
  if (gap.type === "quoi_sans_combien") {
    acknowledge = "L'intention est la.";
  } else if (gap.type === "comment_sans_ou") {
    acknowledge = "Le cadre tient.";
  } else if (gap.type === "avis_sans_preuve") {
    acknowledge = "Prise de position nette.";
  } else if (gap.type === "probleme_sans_solution") {
    acknowledge = "Le constat est juste.";
  } else {
    acknowledge = "Point cle.";
  }

  // TEMPS 2 — Injection de preuve (situation sans chiffre)
  var proofText = "";
  if (bestBrick.brickType === "cicatrice") {
    proofText = "J'ai vecu l'inverse. " + situation + " L'échec m'a force a changer de méthode.";
  } else if (bestBrick.brickCategory === "decision") {
    proofText = "J'ai du trancher dans un contexte similaire. " + situation;
  } else if (bestBrick.brickCategory === "influence") {
    proofText = "Le plus dur n'était pas la méthode. C'était d'aligner les gens. " + situation;
  } else {
    proofText = "J'ai restructuré un processus dans le même contexte. " + situation;
  }

  // Inject pillar angle if available
  if (pillarAngle && gap.type === "avis_sans_preuve") {
    proofText = pillarAngle.title + ". " + proofText;
  }

  // TEMPS 3 — Question de fermeture (montre l'expertise, ne vend pas)
  var closing = "";
  if (gap.type === "quoi_sans_combien") {
    closing = "Sur quel indicateur tu mesures le delta avant/apres ?";
  } else if (gap.type === "comment_sans_ou") {
    closing = "Dans quel contexte tu as vu cette méthode tenir sous pression ?";
  } else if (gap.type === "avis_sans_preuve") {
    closing = "Curieux de savoir quelle situation t'a amené a cette conviction.";
  } else if (gap.type === "probleme_sans_solution") {
    closing = "Quelle a été la premiere action concrète pour en sortir ?";
  } else {
    closing = "Curieux de savoir comment ca se passe chez vous.";
  }

  var comment = acknowledge + " " + proofText + " " + closing;
  var cleanComment = cleanRedac(comment);

  // AUDIT QUALITÉ — 3 tests sur le commentaire généré
  var commentAudit = auditComment(cleanComment, bricks, vault);

  return {
    comment: cleanComment,
    topic: filterResult.topic.topic,
    filterResult: filterResult,
    commentAudit: commentAudit,
    likeAdvice: { action: "LIKE", reason: "Tu commentes. Le like amplifie le signal.", color: "#4ecca3" },
    brickUsed: bestBrick.text.length > 60 ? bestBrick.text.slice(0, 60) + "..." : bestBrick.text,
    pillarUsed: pillarAngle ? pillarAngle.title : null,
    brickSource: bestBrick.brickType === "cicatrice" ? "cicatrice" : bestBrick.brickCategory,
    gap: gap,
  };
}

/* ==============================
   CHAINE DE GENERATION DES POSTS
   Coffre-Fort → Dilts → Piliers/Takes → brouillon → Meroé → Marie Hook → Luis Enrique → Vision 2026
   ============================== */

var VISION_2026_FORMATS = [
  { id: "leadership_talk", label: "Leadership Talk", desc: "Posture haute, macro-vision, opinion tranchee" },
  { id: "expertise", label: "Expertise technique", desc: "Methode, framework, processus" },
  { id: "conviction_actu", label: "Conviction sur actu", desc: "Prise de position sur un fait sectoriel" },
  { id: "storytelling_brut", label: "Storytelling brut", desc: "Vecu brut, pas de filtre, fond > forme" },
  { id: "humour", label: "Humour", desc: "Decalage, auto-derision, verite qui pique" },
];

function mapDiltsToFormat(diltsLevel) {
  if (diltsLevel <= 2) return "storytelling_brut";
  if (diltsLevel === 3) return "expertise";
  if (diltsLevel === 4) return "conviction_actu";
  if (diltsLevel >= 5) return "leadership_talk";
  return "storytelling_brut";
}

function generatePostDraft(brick, diltsLevel, pillar, take, targetRoleId) {
  if (!brick) return null;
  var calibration = DILTS_CALIBRATION[diltsLevel] || DILTS_CALIBRATION[2];
  var mapping = DILTS_EDITORIAL_MAPPING[diltsLevel] || DILTS_EDITORIAL_MAPPING[2];
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;

  var situation = brick.text;
  situation = situation.replace(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]*/g, "").replace(/\s{2,}/g, " ").trim();
  if (situation.length > 100) situation = situation.slice(0, 100);
  var number = brick.text.match(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]+/);
  number = number ? number[0] : null;

  var hook = "";
  var body = "";
  var close = "";

  if (diltsLevel <= 2) {
    hook = brick.brickType === "cicatrice"
      ? "J'ai plante. " + (brick.kpi || "un projet") + "."
      : (number ? number + ". " : "") + "Pas un objectif. Un resultat.";
    body = situation + ".";
    close = calibration.framingClose;
  } else if (diltsLevel === 3) {
    hook = "La methode que personne n'applique sur " + (brick.kpi || "ce sujet").toLowerCase() + ".";
    body = situation + "." + (number ? " Resultat : " + number + "." : "");
    close = calibration.framingClose;
  } else if (diltsLevel === 4) {
    var conviction = take ? take.text || take.title || "" : "";
    hook = conviction ? conviction.replace(/\.$/, "") + "." : "Le consensus dit le contraire.";
    body = "Mon experience : " + situation + "." + (number ? " " + number + " de delta." : "");
    close = calibration.framingClose;
  } else {
    hook = "On me reconnait a ca.";
    body = situation + ".";
    if (pillar && pillar.title) body += " J'ecris sur " + pillar.title.toLowerCase().replace(/\.$/, "") + ".";
    close = calibration.framingClose;
  }

  if (pillar && diltsLevel === 3 && pillar.title) {
    body = pillar.title + ". " + body;
  }

  var draft = hook + "\n\n" + body + "\n\n" + close;
  return {
    text: cleanRedac(draft, "livrable"),
    hook: hook,
    body: body,
    close: close,
    brickId: brick.id,
    brickText: brick.text.length > 60 ? brick.text.slice(0, 60) + "..." : brick.text,
    diltsLevel: diltsLevel,
    format: mapDiltsToFormat(diltsLevel),
    pillar: pillar ? pillar.title : null,
    take: take ? (take.title || take.text || "").slice(0, 50) : null,
    isBlinded: brick.blinded || false,
    stockPotential: diltsLevel >= 3,
  };
}

function applyMeroeStyle(draft, vault) {
  if (!draft || !draft.text) return draft;
  var text = draft.text;
  text = cleanRedac(text, "livrable");
  if (vault && vault.styleCorrections && vault.styleCorrections.length > 0) {
    vault.styleCorrections.forEach(function(correction) {
      if (correction.from && correction.to) {
        text = text.replace(new RegExp(correction.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), correction.to);
      }
    });
  }
  draft.text = text;
  draft.meroeApplied = true;
  return draft;
}

function marieHookAudit(draft) {
  if (!draft || !draft.text) return { score: 0, tests: [], pass: false };
  var text = draft.text;
  var hook = draft.hook || text.split("\n")[0] || "";
  var lower = text.toLowerCase();
  var hookLower = hook.toLowerCase();
  var tests = [];

  // 1. So What — reaction immediate
  var hasTension = /\?|!|\.{3}|pas un|personne|le vrai|contrairement|en r[eé]alit[eé]|plant[eé]|[eé]chou[eé]|perdu/.test(hookLower);
  var hasNumber = /\d+[%KM€]/.test(hook);
  var soWhat = hasTension || hasNumber;
  tests.push({ name: "So What", pass: soWhat, detail: soWhat ? "Tension ou chiffre present" : "Accroche plate, aucune reaction" });

  // 2. Ennemi — antagoniste identifie
  var hasEnemy = /personne ne|le consensus|l'erreur|[aà] tort|le probl[eè]me|on croit que|la majorit[eé]|le mythe|le pi[eè]ge|on me dit/.test(lower);
  tests.push({ name: "Ennemi", pass: hasEnemy, detail: hasEnemy ? "Antagoniste detecte" : "Pas d'ennemi, trop mou" });

  // 3. Consensus — clivant ou contre-intuitif
  var isClivant = /contrairement|le contraire|refuse|en r[eé]alit[eé]|personne ne dit|[aà] tort|mon parti|impopulaire/.test(lower);
  var notConsensus = hasEnemy || isClivant || draft.diltsLevel >= 4;
  tests.push({ name: "Consensus", pass: notConsensus, detail: notConsensus ? "Position clivante ou contre-intuitive" : "Tout le monde est d'accord, aucun interet" });

  // 4. Alienation — repousse les non-cibles
  var hasSpecificity = /\d+|m[eé]thode|process|framework|churn|pipeline|r[eé]tention|conversion|onboarding|recrutement/.test(lower);
  tests.push({ name: "Alienation", pass: hasSpecificity, detail: hasSpecificity ? "Vocabulaire specifique, filtre actif" : "Trop generique, parle a tout le monde" });

  // 5. Authenticite — ton assume, pas pute-a-clic
  var iaWords = ["revolutionnaire", "révolutionnaire", "incontournable", "a l'ere du", "a l'ère du", "à l'ère du", "game-changer", "disruptif", "secret pour", "astuce pour", "vous ne croirez"];
  var hasIaSmell = iaWords.some(function(w) { return lower.indexOf(w) !== -1; });
  var authentic = !hasIaSmell && (draft.isBlinded || draft.diltsLevel <= 2);
  tests.push({ name: "Authenticite", pass: !hasIaSmell, detail: hasIaSmell ? "Vocabulaire IA detecte, sonne faux" : "Ton assume" });

  // 6. Memorabilite — phrase retenue 1h apres
  var hasImage = /j'ai plant[eé]|j'ai vu|le jour o[uù]|ce moment|[aà] ce moment|en face de|quand j'ai|la premi[eè]re fois/.test(lower);
  var isShort = hook.length < 60;
  var memorable = hasImage || (isShort && (hasTension || hasNumber));
  tests.push({ name: "Memorabilite", pass: memorable, detail: memorable ? "Image ou chiffre memorisable" : "Oubliable en 30 secondes" });

  var score = tests.filter(function(t) { return t.pass; }).length;
  var scoreSur10 = Math.round((score / 6) * 10);
  return { score: scoreSur10, tests: tests, pass: scoreSur10 >= 7, rawScore: score };
}

function luisEnriqueAudit(draft, bricks) {
  if (!draft || !draft.text) return { pass: false, tests: [], rejectReason: "Pas de texte" };
  var text = draft.text;
  var lower = text.toLowerCase();
  var tests = [];

  // 1. Utilite reelle ou bruit
  var hasConcrete = /\d+|m[eé]thode|r[eé]sultat|process|situation|contexte|[eé]quipe|client|impact/.test(lower);
  var isGeneric = /il est important|de nos jours|dans le monde|[aà] l'heure actuelle|tout le monde sait/.test(lower);
  var useful = hasConcrete && !isGeneric;
  tests.push({ name: "Utilite", pass: useful, detail: useful ? "Contenu concret et actionnable" : "Bruit — rien d'actionnable" });

  // 2. Clarte ou ego
  var egoMarkers = /je suis le meilleur|mon parcours exceptionnel|ma brillante|personne d'autre|je suis unique/;
  var isEgo = egoMarkers.test(lower);
  var brick = bricks.find(function(b) { return b.id === draft.brickId; });
  var hasProof = brick && brick.blinded;
  var isClear = !isEgo && (hasProof || draft.diltsLevel <= 3);
  tests.push({ name: "Clarte", pass: isClear, detail: isEgo ? "Ego — tu te regardes ecrire" : "Clair et ancre" });

  // 3. Aide autrui ou se montre
  var hasLearning = /m[eé]thode|le[cç]on|erreur|ce que j'ai appris|le pi[eè]ge|[eé]vite|question|comment/.test(lower);
  var helpsOthers = hasLearning || draft.diltsLevel === 3 || draft.format === "expertise";
  tests.push({ name: "Aide", pass: helpsOthers, detail: helpsOthers ? "Le lecteur apprend quelque chose" : "Le lecteur apprend que tu es bon. C'est tout." });

  var allPass = tests.every(function(t) { return t.pass; });
  var rejectReason = "";
  if (!allPass) {
    var failed = tests.filter(function(t) { return !t.pass; });
    rejectReason = failed.map(function(t) { return t.detail; }).join(". ");
  }
  return { pass: allPass, tests: tests, rejectReason: rejectReason };
}

function tagVision2026(draft) {
  if (!draft) return draft;
  var format = VISION_2026_FORMATS.find(function(f) { return f.id === draft.format; }) || VISION_2026_FORMATS[0];
  draft.formatLabel = format.label;
  draft.formatDesc = format.desc;
  draft.stockPotential = draft.diltsLevel >= 3;
  if (draft.stockPotential) {
    draft.stockAngle = "Cet angle merite un article long. Developpe en article LinkedIn cette semaine.";
  }
  return draft;
}

function generateWeeklyPosts(bricks, vault, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return { posts: [], rejected: [] };

  var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
  var diltsTarget = computeDiltsTarget(diltsHistory);
  var plafond = getDiltsPlafond(diltsHistory);
  var pillars = vault && vault.selectedPillars ? vault.selectedPillars : [];
  var takes = bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; });

  // Generate 4-5 candidates, filter down to 2-3 survivors
  var candidates = [];
  var usedBrickIds = [];
  var levels = [diltsTarget.targetLevel];
  if (diltsTarget.targetLevel > 2) levels.push(diltsTarget.targetLevel - 1);
  if (plafond >= 4 && levels.indexOf(2) === -1) levels.push(2);
  levels = levels.filter(function(l) { return l >= 2 && l <= plafond; });

  levels.forEach(function(level, i) {
    var brick = selectBrickForDiltsTarget(validated, level, usedBrickIds);
    if (!brick) return;
    usedBrickIds.push(brick.id);
    var pillar = pillars.length > 0 ? pillars[i % pillars.length] : null;
    var take = takes.length > 0 ? takes[i % takes.length] : null;
    var draft = generatePostDraft(brick, level, pillar, take, targetRoleId);
    if (draft) {
      draft = applyMeroeStyle(draft, vault);
      candidates.push(draft);
    }
  });

  // Add extra candidate from cicatrice if available
  var cicatrice = validated.find(function(b) { return b.brickType === "cicatrice" && usedBrickIds.indexOf(b.id) === -1; });
  if (cicatrice && candidates.length < 4) {
    var cicDraft = generatePostDraft(cicatrice, Math.min(2, plafond), null, null, targetRoleId);
    if (cicDraft) {
      cicDraft = applyMeroeStyle(cicDraft, vault);
      candidates.push(cicDraft);
    }
  }

  // Apply Marie Hook + Luis Enrique filters
  var survivors = [];
  var rejected = [];
  candidates.forEach(function(draft) {
    var marie = marieHookAudit(draft);
    draft.marieScore = marie.score;
    draft.marieTests = marie.tests;
    if (!marie.pass) {
      draft.rejectSource = "Marie Hook";
      draft.rejectReason = "Score " + marie.score + "/10. " + marie.tests.filter(function(t) { return !t.pass; }).map(function(t) { return t.detail; }).join(". ");
      rejected.push(draft);
      return;
    }
    var luis = luisEnriqueAudit(draft, bricks);
    draft.luisTests = luis.tests;
    if (!luis.pass) {
      draft.rejectSource = "Luis Enrique";
      draft.rejectReason = luis.rejectReason;
      rejected.push(draft);
      return;
    }
    draft = tagVision2026(draft);
    survivors.push(draft);
  });

  return { posts: survivors.slice(0, 3), rejected: rejected };
}

/* ==============================
   SLEEP MODE — 2 mécaniques
   1. Reseau maintenu (commentaire/semaine + relance dormant/mois)
   2. Coffre-Fort passif (nouvelles experiences → briques proposees)
   ============================== */

function generateSleepComment(bricks, vault, targetRoleId) {
  var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
  var ceiling = getDiltsCeilingForOutput("commentaire", diltsHistory, 0);
  var brick = selectBrickForDiltsTarget(
    bricks.filter(function(b) { return b.status === "validated"; }),
    Math.min(ceiling, 3),
    []
  );
  if (!brick) return null;
  var situation = brick.text.replace(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]*/g, "").replace(/\s{2,}/g, " ").trim();
  if (situation.length > 80) situation = situation.slice(0, 80) + "...";
  return {
    type: "commentaire_hebdo",
    diltsLevel: Math.min(ceiling, 3),
    suggestion: "Trouve un post dans ton secteur sur " + (brick.kpi || "ton sujet").toLowerCase() + ". Commente avec : \"" + situation + "\"",
    brickSource: brick.text.slice(0, 50),
    effort: "2 minutes",
  };
}

function generateDormantRelaunch(bricks, vault, targetRoleId, monthsInactive) {
  var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
  var ceiling = getDiltsCeilingForOutput("relance_dormant", diltsHistory, monthsInactive || 1);
  var brick = selectBrickForDiltsTarget(
    bricks.filter(function(b) { return b.status === "validated"; }),
    Math.min(ceiling, 2),
    []
  );
  if (!brick) return null;
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role.toLowerCase() : "ton secteur";
  return {
    type: "relance_dormant",
    diltsLevel: Math.min(ceiling, 2),
    suggestion: "Envoie un message a un ancien collegue ou contact dormant. Angle : \"J'ai vu que [actualite de son entreprise]. Ca rejoint un cas que j'ai gere en " + roleLabel + ".\"",
    brickSource: brick.text.slice(0, 50),
    effort: "3 minutes",
  };
}

function proposeSleepBrick(vault) {
  var weeks = 0;
  if (vault && vault.lastVisit) {
    weeks = Math.floor((Date.now() - new Date(vault.lastVisit).getTime()) / (7 * 24 * 60 * 60 * 1000));
  }
  if (weeks < 2) return null;
  return {
    type: "passive_brick",
    suggestion: "En " + weeks + " semaines, tu as probablement vecu au moins 1 situation notable. Un probleme resolu. Une decision prise. Un resultat mesure. Ajoute-la a ton Coffre-Fort. L'IA la transforme en brique.",
    effort: "5 minutes",
  };
}

/* ITERATION 6 — Readiness diagnostic */
function estimateReadiness(cvText, offersText) {
  var cvLower = (cvText || "").toLowerCase();
  var score = 0;
  var details = [];

  // Check for number présence (quantifiable expérience)
  var hasNumbers = /\d+%|\d+k|\d+m|\d+ comptes|\d+ commerciaux|\d+ mois|\d+ clients|\d+ personnes/.test(cvLower);
  if (hasNumbers) { score += 2; details.push({ label: "Chiffres détectés", ok: true }); }
  else { details.push({ label: "Aucun chiffre détecté", ok: false }); }

  // Check for method markers
  var methodMarkers = ["mis en place", "deploye", "structure", "construit", "lance", "cree", "restructure", "implemente", "optimise", "pilote"];
  var hasMethods = methodMarkers.some(function(m) { return cvLower.indexOf(m) !== -1; });
  if (hasMethods) { score += 2; details.push({ label: "Methodes détectées", ok: true }); }
  else { details.push({ label: "Pas de méthode identifiee", ok: false }); }

  // Check for leadership/decision markers
  var leadershipMarkers = ["équipe", "manage", "dirige", "recrute", "forme", "aligne", "convaincu", "arbitre", "decide"];
  var hasLeadership = leadershipMarkers.some(function(m) { return cvLower.indexOf(m) !== -1; });
  if (hasLeadership) { score += 2; details.push({ label: "Signaux de leadership", ok: true }); }
  else { details.push({ label: "Pas de leadership identifie", ok: false }); }

  // Check CV length (depth of material)
  var cvLen = cvText.trim().length;
  if (cvLen > 500) { score += 1; details.push({ label: "Profil detaille (" + cvLen + " car.)", ok: true }); }
  else if (cvLen > 100) { details.push({ label: "Profil court — moins de matière", ok: false }); }
  else { details.push({ label: "Profil tres court — extraction difficile", ok: false }); }

  // Check for tool/framework names
  var toolMarkers = ["salesforce", "hubspot", "meddic", "crm", "erp", "notion", "jira", "scrum", "agile", "okr", "kpi"];
  var hasTools = toolMarkers.some(function(m) { return cvLower.indexOf(m) !== -1; });
  if (hasTools) { score += 1; details.push({ label: "Outils/méthodes nommes", ok: true }); }

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

/* ==============================
   ENTRÉE GRATUITE — DIAGNOSTIC 4 BLOCS
   translateCVPerception + generateSampleTransformation + generateDiagnostic
   ============================== */

function translateCVPerception(cvText, cauchemars) {
  var cvLower = (cvText || "").toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
  var perceptions = [];
  cauchemars.forEach(function(c) {
    var kwFound = [];
    var kwMissing = [];
    (c.kpis || []).forEach(function(kpi) {
      var words = kpi.toLowerCase().split(/[\s\/\(\)]+/).filter(function(w) { return w.length > 3; });
      words.forEach(function(w) {
        var wNorm = w.replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
        if (cvLower.indexOf(wNorm) !== -1) { if (kwFound.indexOf(w) === -1) kwFound.push(w); }
        else { if (kwMissing.indexOf(w) === -1) kwMissing.push(w); }
      });
    });
    (c.matchedKw || c.kw || []).forEach(function(kw) {
      var kwNorm = kw.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
      if (cvLower.indexOf(kwNorm) !== -1 && kwFound.indexOf(kw) === -1) kwFound.push(kw);
    });
    var hasActivity = kwFound.length > 0;
    var hasProof = /\d+\s*[%kKmM€]/.test(cvText);
    var status = "silence";
    var perception = "";
    if (hasActivity && hasProof) {
      status = "activite_chiffree";
      perception = "Tu mentionnes " + kwFound.slice(0, 2).join(", ") + " avec un chiffre. Le recruteur lit : piste. Pas encore preuve blindee.";
    } else if (hasActivity && !hasProof) {
      status = "activite_sans_preuve";
      perception = "Tu mentionnes " + kwFound.slice(0, 2).join(", ") + ". Le recruteur lit : activite. Pas resultat. Il passe.";
    } else {
      status = "silence";
      perception = "Le recruteur cherche un remede a \"" + c.label + ".\" Ton CV : silence.";
    }
    perceptions.push({
      cauchemar: c.label,
      cauchemarId: c.id,
      status: status,
      perception: perception,
      kwFound: kwFound,
      kwMissing: kwMissing,
      costRange: c.costRange,
    });
  });
  return perceptions;
}

function generateSampleTransformation(cvText, cauchemars, roleId) {
  if (!cvText || cvText.trim().length < 20) return null;
  var lines = cvText.split(/[\n\r]+/).filter(function(l) { return l.trim().length > 15; });
  if (lines.length === 0) return null;
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;
  var bestLine = null;
  var bestScore = 0;
  var bestCauch = null;
  lines.forEach(function(line) {
    var lineLow = line.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
    cauchemars.forEach(function(c) {
      var score = 0;
      (c.matchedKw || []).forEach(function(kw) {
        if (lineLow.indexOf(kw.toLowerCase().replace(/[éèê]/g, "e")) !== -1) score += 2;
      });
      (c.kpis || []).forEach(function(kpi) {
        kpi.toLowerCase().split(/[\s\/]+/).filter(function(w) { return w.length > 3; }).forEach(function(w) {
          if (lineLow.indexOf(w.replace(/[éèê]/g, "e")) !== -1) score++;
        });
      });
      var hasNumber = /\d/.test(line);
      if (!hasNumber) score += 1;
      if (score > bestScore) { bestScore = score; bestLine = line.trim(); bestCauch = c; }
    });
  });
  if (!bestLine || bestScore < 1) {
    bestLine = lines.reduce(function(a, b) { return a.length > b.length ? a : b; }).trim();
    bestCauch = cauchemars[0];
  }
  var cleanLine = bestLine.replace(/^[\-\•\*\u2022\u2013\u2014]\s*/, "").trim();
  var kpiLabel = bestCauch && bestCauch.kpis ? bestCauch.kpis[0] : "";
  var elasticTag = roleData ? roleData.kpis.find(function(k) { return k.name === kpiLabel && k.elasticity === "élastique"; }) : null;
  var afterLine = cleanLine;
  if (!/\d+\s*%/.test(cleanLine)) {
    afterLine = cleanLine.replace(/gestion d[eu']/gi, "Reduction de 22% a 4% du churn sur").replace(/pilotage d[eu']/gi, "Acceleration de +35% du").replace(/mise en place/gi, "Deploiement en 3 mois de").replace(/responsable d[eu']/gi, "Restructuration complete de").replace(/suivi d[eu']/gi, "Optimisation de +28% de");
    if (afterLine === cleanLine) {
      afterLine = cleanLine + " — resultat : [chiffre a extraire pendant la Forge]";
    }
  } else {
    afterLine = cleanLine;
  }
  return {
    before: cleanLine,
    after: afterLine,
    cauchemar: bestCauch ? bestCauch.label : "",
    kpi: kpiLabel,
    isElastic: !!elasticTag,
    isSimulated: afterLine.indexOf("[chiffre a extraire") !== -1 || afterLine !== cleanLine,
  };
}

function generateDiagnostic(cvText, offerText, roleId) {
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
  return getActiveCauchemars().map(function(c) {
    var covered = c.kpis.some(function(k) { return coveredKpis[k]; });
    var coveringBricks = [];
    c.kpis.forEach(function(k) { if (kpiBricks[k]) coveringBricks = coveringBricks.concat(kpiBricks[k]); });
    var hasElasticCovering = coveringBricks.some(function(b) { return b.kpiRefMatch && b.kpiRefMatch.elasticity === "élastique"; });
    return { id: c.id, label: c.label, nightmareShort: c.nightmareShort, covered: covered, costRange: c.costRange, costUnit: c.costUnit, costContext: c.costContext, coveringBricks: coveringBricks, hasElasticCovering: hasElasticCovering };
  });
}

function hasExternalization(text) {
  var markers = ["le marché", "mon manager", "la direction", "on m'a", "le produit", "le prix etait", "pas ma faute", "l'équipe n'a pas", "le client n'a pas"];
  var lower = text.toLowerCase();
  var count = 0;
  markers.forEach(function(m) { if (lower.indexOf(m) !== -1) count++; });
  var hasOwnership = lower.indexOf("j'ai") !== -1 || lower.indexOf("j'aurais") !== -1 || lower.indexOf("mon erreur") !== -1 || lower.indexOf("ma responsabilite") !== -1;
  return count >= 2 && !hasOwnership;
}

function hasBlame(text) {
  var markers = ["le produit", "le prix", "le marché", "le budget", "le timing", "la concurrence", "pas de budget"];
  var lower = text.toLowerCase();
  var count = 0;
  markers.forEach(function(m) { if (lower.indexOf(m) !== -1) count++; });
  return count >= 1 && lower.indexOf("j'") === -1 && lower.indexOf("mon") === -1;
}

// Detect decision/influence language markers
function hasDecisionMarkers(text) {
  var actors = ["le board", "le cto", "le ceo", "la direction", "le directeur", "l'équipe", "le manager", "le vp", "le pm", "le product"];
  var tensions = ["voulait", "poussait", "bloquait", "refusait", "opposait", "contestait", "demandait", "exigeait", "insistait"];
  var résolutions = ["j'ai choisi", "j'ai decide", "j'ai propose", "j'ai arbitre", "j'ai tranche", "on a decide", "j'ai recommande"];
  var lower = text.toLowerCase();
  var actorCount = 0; var tensionCount = 0; var résolutionCount = 0;
  actors.forEach(function(a) { if (lower.indexOf(a) !== -1) actorCount++; });
  tensions.forEach(function(t) { if (lower.indexOf(t) !== -1) tensionCount++; });
  résolutions.forEach(function(r) { if (lower.indexOf(r) !== -1) résolutionCount++; });
  return actorCount >= 1 && tensionCount >= 1 && résolutionCount >= 1;
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
  var commonWords = ["Le", "La", "Les", "Un", "Une", "Des", "Ce", "Cette", "Mon", "Ma", "Mes", "Ton", "Ta", "Tes", "Son", "Sa", "Ses", "Nous", "Vous", "Ils", "Elles", "En", "Pour", "Par", "Sur", "Dans", "Avec", "Sans", "Sous", "Vers", "Chez", "Depuis", "Pendant", "Avant", "Apres", "Entre", "Comme", "Mais", "Ou", "Et", "Donc", "Or", "Ni", "Car", "Que", "Qui", "Si", "Quand", "Chaque", "Tout", "Tous", "Aucun", "Autre", "Meme", "Notre", "Votre", "Leur", "Quelque", "Plusieurs", "Certains", "Croissance", "Reduction", "Deploiement", "Mise", "Construction", "Arbitrage", "Alignement", "Perte", "Lancement", "Restructuration", "Programme", "Pilotage", "Diagnostic", "Correction", "Transition", "Optimisation", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre", "KPI", "MRR", "ARR", "CRM", "SaaS", "B2B", "ROI", "MEDDIC", "SDR", "AE", "PM", "VP", "CTO", "CEO", "CFO", "COO", "CSM", "NRR", "EBITDA", "Mid", "Market", "Scale"];
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
    var sectorTerms = ["serie A", "série B", "serie C", "serie D", "licorne", "pre-IPO", "post-IPO", "CAC 40", "SBF 120", "Next 40", "French Tech 120"];
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
  var operationalMarkers = ["oublie", "bug", "erreur technique", "plante", "crash", "pas testé", "manque de temps", "pas vérifié", "negligence", "oubli", "pas vu", "backup", "configuration", "serveur", "déploiement raté", "typo"];
  var sCount = 0; var oCount = 0;
  var foundStrategic = []; var foundOperational = [];
  strategicMarkers.forEach(function(m) { if (lower.indexOf(m) !== -1) { sCount++; foundStrategic.push(m); } });
  operationalMarkers.forEach(function(m) { if (lower.indexOf(m) !== -1) { oCount++; foundOperational.push(m); } });
  var totalMarkers = sCount + oCount;
  var confidence = totalMarkers >= 4 ? "forte" : totalMarkers >= 2 ? "moyenne" : "faible";
  var confidenceColor = confidence === "forte" ? "#4ecca3" : confidence === "moyenne" ? "#ff9800" : "#495670";
  if (sCount > oCount) return { type: "stratégique", label: "Echec d'arbitrage", color: "#9b59b6", msg: "Cet échec revele un choix difficile entre des options viables. C'est une preuve de jugement sous contrainte. Valeur haute pour un recruteur.", foundMarkers: foundStrategic, confidence: confidence, confidenceColor: confidenceColor, markerCount: totalMarkers };
  if (oCount > sCount) return { type: "operationnel", label: "Echec operationnel", color: "#ff9800", msg: "Cet échec vient d'un oubli ou d'une erreur technique. Le recruteur retient la capacité a corriger, pas l'échec lui-meme. Valeur moderee : insiste sur le fix, pas sur l'erreur.", foundMarkers: foundOperational, confidence: confidence, confidenceColor: confidenceColor, markerCount: totalMarkers };
  return { type: "indéterminé", label: "À préciser", color: "#495670", msg: "L'IA n'identifie pas clairement si cet échec vient d'un arbitrage ou d'une négligence. Précise : était-ce un choix entre deux options, ou un oubli ?", foundMarkers: [], confidence: "faible", confidenceColor: "#495670", markerCount: 0 };
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

var ELASTICITY_LABELS = { élastique: { label: "Marche élastique", color: "#4ecca3", icon: "\u2197\uFE0F" }, stable: { label: "Marche stable", color: "#8892b0", icon: "\u2194\uFE0F" }, sous_pression: { label: "Marche sous pression", color: "#e94560", icon: "\u2198\uFE0F" } };
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
  var hasMethod = ["via", "grace a", "méthode", "process", "programme", "plan", "stratégie", "structure", "deploye", "mis en place", "construit", "installe"].some(function(m) { return text.indexOf(m) !== -1; });
  var hasContext = ["mois", "semaine", "trimestre", "jours", "équipe", "comptes", "commerciaux", "clients", "personnes"].some(function(m) { return text.indexOf(m) !== -1; });
  var hasResult = ["%", "reduction", "croissance", "augmente", "diminue", "multiplie", "atteint", "genere", "ameliore"].some(function(m) { return text.indexOf(m) !== -1; });
  var depth = 0;
  if (hasNumber) depth++;
  if (hasMethod) depth++;
  if (hasContext) depth++;
  if (hasResult) depth++;
  if (brick.corrected) depth++;
  if (depth >= 4) return { level: "blindee", color: "#4ecca3", msg: "Brique blindee. Chiffre, méthode, contexte et résultat." };
  if (depth >= 2) return { level: "credible", color: "#3498db", msg: "Brique credible mais pas blindee." + (!hasNumber ? " Il manque un chiffre." : "") + (!hasMethod ? " Il manque une méthode." : "") + (!hasContext ? " Il manque un contexte." : "") + " Si tu te positionnes comme le remède, blinde cette brique." };
  return { level: "vulnerable", color: "#e94560", msg: "Brique vulnerable. Si le problème persiste après ton embauche, tu deviens la cible. Ajoute un chiffre, une méthode et un contexte." };
}

/* ==============================
   STRESS TEST — 3 angles d'attaque par brique
   Strong opinion (la brique) → Loosely held (les failles)
   Le candidat sort avec sa preuve ET ses contre-arguments.
   ============================== */

var STRESS_ANGLES = {
  contexte: [
    "Le recruteur dira : 'C'etait un contexte favorable. N'importe qui aurait obtenu ce résultat.'",
    "Le recruteur dira : 'Le marche etait en hausse. Quel merite personnel revendiquez-vous ?'",
    "Le recruteur dira : 'Votre équipe etait déjà performante avant vous. Qu'avez-vous change ?'",
  ],
  causalite: [
    "Le recruteur dira : 'Correlation ou causalite ? Comment prouvez-vous que c'est votre action qui a produit ce résultat ?'",
    "Le recruteur dira : 'D'autres facteurs expliquent ce chiffre. Isolez votre contribution.'",
    "Le recruteur dira : 'Votre prédécesseur avait lance le chantier. Vous avez récupéré son travail ?'",
  ],
  reproductibilite: [
    "Le recruteur dira : 'Ca a marche la-bas. Qu'est-ce qui vous dit que ca marchera chez nous ?'",
    "Le recruteur dira : 'Votre méthode dependait d'une équipe spécifique. Comment vous adaptez-vous ?'",
    "Le recruteur dira : 'Ce résultat date de 2 ans. Le marche a change. C'est encore pertinent ?'",
  ],
  collectif: [
    "Le recruteur dira : 'C'etait un effort d'equipe. Quelle était votre contribution individuelle ?'",
    "Le recruteur dira : 'Votre manager dit que c'etait une décision collective. Votre version ?'",
    "Le recruteur dira : 'Si on demande a vos anciens collègues, diront-ils la même chose ?'",
  ],
  echec: [
    "Le recruteur dira : 'Et si ca avait echoue, quelle aurait ete la cause ?'",
    "Le recruteur dira : 'Quel aspect de cette réalisation vous préoccupe encore aujourd'hui ?'",
    "Le recruteur dira : 'Qu'est-ce que vous feriez différemment si vous recommenciez ?'",
  ],
};

// ========== ADVOCACY TEXT — Ce que l'intervieweur dira a son directeur ==========
function generateAdvocacyText(text, category, type, nightmareText) {
  if (!text || text.length < 20) return null;
  // Extract first number from brick text
  var numMatch = text.match(/([\+\-]?\d[\d.,]*\s*[%KM€$]*)/);
  var num = numMatch ? numMatch[1].trim() : null;

  if (type === "cicatrice") {
    return num
      ? "Il a assume un echec qui a coute " + num + ". Il a corrige le tir. C'est rare a ce niveau. La plupart des candidats mentent ou esquivent."
      : "Il a traverse une situation difficile et il l'assume sans detour. Il sait ce qu'il ne refera pas. C'est un profil qui apprend de ses erreurs, pas quelqu'un qui les cache.";
  }
  if (category === "decision") {
    return num
      ? "Il a tranche un arbitrage a " + num + ". Il explique pourquoi il a choisi cette option et ce qu'il a sacrifie. Ce n'est pas un executant. Il decide sous pression."
      : "Il a pris une decision difficile et il assume les consequences. Il ne cherche pas le consensus. Il tranche et il avance.";
  }
  if (category === "influence") {
    return num
      ? "Il a aligne des gens qui ne voulaient pas s'aligner. Le resultat : " + num + ". Ce n'est pas un manager de process. Il sait naviguer la politique."
      : "Il a debloque une situation humaine. Il sait lire les resistances et les retourner. C'est le genre de personne qu'on met sur les sujets bloques.";
  }
  // Default: chiffre brick
  if (nightmareText && num) {
    return "Il a resolu exactement le probleme qu'on a en ce moment. Son chiffre : " + num + ". Il sait de quoi il parle parce qu'il l'a deja fait.";
  }
  if (num) {
    return "Son resultat cle : " + num + ". Il mesure ce qu'il fait. Il ne parle pas en impressions. Il y a un avant et un apres son passage.";
  }
  return "Il a un parcours concret. Il parle de ce qu'il a fait, pas de ce qu'il ferait. C'est un profil operationnel qui produit des resultats mesurables.";
}

// ========== INTERNAL ADVOCACY — Ce que ton N+1 perd si tu pars ==========
function generateInternalAdvocacy(text, category, type, elasticity) {
  if (!text || text.length < 20) return null;
  var numMatch = text.match(/([\+\-]?\d[\d.,]*\s*[%KM€$]*)/);
  var num = numMatch ? numMatch[1].trim() : null;
  var isElastic = elasticity === "élastique";

  if (type === "cicatrice") {
    return "Tu es la memoire de ce qui a echoue et pourquoi. Si tu pars, l'equipe refait les memes erreurs. Personne d'autre n'a vecu cette correction.";
  }
  if (category === "decision") {
    var base = "Tu es celui qui tranche quand tout le monde hesite.";
    if (num) base += " Ton dernier arbitrage a pese " + num + ".";
    base += isElastic
      ? " Cette capacite n'est pas remplacable par un outil ou un process. Elle part avec toi."
      : " Le remplacement prendra 6 mois minimum. Le cout de l'indecision en attendant est invisible mais reel.";
    return base;
  }
  if (category === "influence") {
    return "Tu es la personne qui debloque les situations humaines. Les alignements que tu as construits tiennent parce que tu les maintiens. Si tu pars, les frictions reviennent en 3 mois."
      + (num ? " Impact documente : " + num + "." : "");
  }
  // Default: chiffre
  if (num && isElastic) {
    return "Ton resultat de " + num + " repose sur ta methode. Pas sur un outil qu'on peut transferer. Si tu pars, le resultat part avec toi. Le recrutement de ton remplacement coutera 6-9 mois de salaire. Le trou de production entre les deux n'a pas de prix.";
  }
  if (num) {
    return "Tu produis " + num + ". Ton remplacement coutera du temps (6-9 mois de recrutement + integration) et de l'argent (cabinet + formation). Pendant ce temps, ce resultat disparait.";
  }
  return "Tu portes un savoir operationnel que l'entreprise n'a pas documente. Si tu pars, il faut 6 mois pour que ton remplacement atteigne ta vitesse actuelle. C'est un cout que ton N+1 ne voit pas aujourd'hui.";
}

function generateStressTest(brick, targetRoleId, offersArray) {
  if (!brick || !brick.text) return null;
  var text = brick.text.toLowerCase();
  var angles = [];

  // ===== SOURCE 1: ANGLES GÉNÉRIQUES (toujours présents) =====

  // Angle 1 : Contexte vs mérite (toujours pertinent)
  var ctxPool = STRESS_ANGLES.contexte;
  angles.push({
    type: "contexte",
    label: "Contexte favorable ?",
    attack: ctxPool[Math.abs(hashCode(brick.id + "ctx")) % ctxPool.length],
    defense: "Isole ton action du contexte. Cite la mesure avant/après TON intervention. Si le marche aidait tout le monde, pourquoi tes collègues n'ont pas le même résultat ?",
    source: "generique",
  });

  // Angle 2 : Selon le type de brique
  if (brick.brickType === "cicatrice") {
    var echPool = STRESS_ANGLES.echec;
    angles.push({
      type: "echec",
      label: "Echec assumé ou subi ?",
      attack: echPool[Math.abs(hashCode(brick.id + "ech")) % echPool.length],
      defense: "Montre ce que l'échec t'a appris. La cicatrice vaut par la décision que tu prends APRES. Pas par la douleur.",
      source: "generique",
    });
  } else if (brick.brickCategory === "decision" || brick.brickCategory === "influence") {
    var colPool = STRESS_ANGLES.collectif;
    angles.push({
      type: "collectif",
      label: "Contribution individuelle ?",
      attack: colPool[Math.abs(hashCode(brick.id + "col")) % colPool.length],
      defense: "Identifie TA décision. Pas le résultat collectif. La décision que TU as prise et que personne d'autre n'aurait prise de la même façon.",
      source: "generique",
    });
  } else {
    var cauPool = STRESS_ANGLES.causalite;
    angles.push({
      type: "causalite",
      label: "Causalité prouvée ?",
      attack: cauPool[Math.abs(hashCode(brick.id + "cau")) % cauPool.length],
      defense: "Montre la méthode. Avant X, après Y. Ce qui a change entre les deux, c'est ton action. Chiffre + périmètre + timeline.",
      source: "generique",
    });
  }

  // Angle 3 : Reproductibilité (toujours pertinent)
  var repPool = STRESS_ANGLES.reproductibilite;
  angles.push({
    type: "reproductibilite",
    label: "Reproductible ici ?",
    attack: repPool[Math.abs(hashCode(brick.id + "rep")) % repPool.length],
    defense: "Identifie le principe transférable. Pas le contexte spécifique. Ce que tu feras chez eux, c'est appliquer la même logique à LEUR problème.",
    source: "generique",
  });

  // ===== SOURCE 2: ATTAQUES TIRÉES DE L'OFFRE =====
  if (offersArray && offersArray.length > 0) {
    var offerText = offersArray[0].text || "";
    var offerLower = offerText.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u");
    var offerAttack = null;

    // Detect signals in offer and build specific attacks
    var hasAutonomie = offerLower.indexOf("autonomi") !== -1 || offerLower.indexOf("seul") !== -1 || offerLower.indexOf("independan") !== -1;
    var hasHyperCroissance = offerLower.indexOf("forte croissance") !== -1 || offerLower.indexOf("hyper") !== -1 || offerLower.indexOf("scale") !== -1;
    var hasRestructuration = offerLower.indexOf("restructur") !== -1 || offerLower.indexOf("transformation") !== -1 || offerLower.indexOf("reorganis") !== -1;
    var hasExigeant = offerLower.indexOf("exigean") !== -1 || offerLower.indexOf("pression") !== -1 || offerLower.indexOf("rythme soutenu") !== -1 || offerLower.indexOf("fast-paced") !== -1;
    var hasCreationPoste = offerLower.indexOf("creation de poste") !== -1 || offerLower.indexOf("nouveau poste") !== -1 || offerLower.indexOf("premiere recrue") !== -1;
    var hasInternational = offerLower.indexOf("international") !== -1 || offerLower.indexOf("multi-pays") !== -1 || offerLower.indexOf("emea") !== -1 || offerLower.indexOf("global") !== -1;
    var hasRemplacement = offerLower.indexOf("remplace") !== -1 || offerLower.indexOf("succession") !== -1 || offerLower.indexOf("depart") !== -1;

    if (hasAutonomie) {
      offerAttack = {
        type: "offre_autonomie",
        label: "Autonomie ou isolement ?",
        attack: "Le recruteur dira : 'L'offre mentionne une forte autonomie. Votre dernier poste incluait une equipe structuree. Donnez-moi un exemple ou vous avez delivre un resultat seul, sans support.'",
        defense: "Cite un projet ou tu as porte le resultat de A a Z sans equipe. Si tu n'en as pas, sois honnete : ton atout est de structurer la ou rien n'existe. C'est un atout d'autonomie.",
        source: "offre",
      };
    } else if (hasHyperCroissance) {
      offerAttack = {
        type: "offre_croissance",
        label: "Rythme de croissance ?",
        attack: "Le recruteur dira : 'On double chaque annee. Votre experience est dans une structure stable. Qu'est-ce qui prouve que vous tiendrez le rythme quand les process changent tous les 3 mois ?'",
        defense: "Montre un moment ou tout a change autour de toi et ou tu as produit un resultat malgre le chaos. La croissance casse les process. Ton atout c'est de livrer sans process.",
        source: "offre",
      };
    } else if (hasRestructuration) {
      offerAttack = {
        type: "offre_restructuration",
        label: "Gestion de crise ?",
        attack: "Le recruteur dira : 'Le contexte ici est une restructuration. Les gens partent. Le moral est bas. Qu'est-ce que vous faites les 90 premiers jours quand personne ne veut cooperer ?'",
        defense: "Cite une situation de tension ou tu as obtenu un resultat malgre la resistance. Le recruteur cherche quelqu'un qui avance quand les autres freinent.",
        source: "offre",
      };
    } else if (hasExigeant) {
      offerAttack = {
        type: "offre_pression",
        label: "Resistance a la pression ?",
        attack: "Le recruteur dira : 'L'environnement ici est exigeant. Le dernier sur ce poste n'a pas tenu 8 mois. Qu'est-ce qui vous rend different ?'",
        defense: "Ne dis pas 'je gere le stress.' Cite un trimestre ou tout a deraille et montre le resultat que tu as quand meme sorti. Le chiffre parle. Pas l'adjectif.",
        source: "offre",
      };
    } else if (hasCreationPoste) {
      offerAttack = {
        type: "offre_creation",
        label: "Poste sans precedent ?",
        attack: "Le recruteur dira : 'C'est une creation de poste. Il n'y a pas de fiche de poste claire. Pas de predecesseur. Comment vous definissez vos priorites quand personne ne sait ce qu'on attend de vous ?'",
        defense: "Montre un moment ou tu as defini le perimetre toi-meme. Le recruteur cherche quelqu'un qui structure le flou. Cite ta methode pour identifier les 3 premiers quick wins.",
        source: "offre",
      };
    } else if (hasInternational) {
      offerAttack = {
        type: "offre_international",
        label: "Contexte international ?",
        attack: "Le recruteur dira : 'Le poste couvre plusieurs pays. Les fuseaux horaires, les cultures, les reglementations different. Votre experience est franco-francaise. Comment vous gerez ?'",
        defense: "Cite une collaboration cross-country, un projet multi-fuseaux ou une negociation interculturelle. Si tu n'en as pas, montre ta capacite d'adaptation sur un changement de contexte radical.",
        source: "offre",
      };
    } else if (hasRemplacement) {
      offerAttack = {
        type: "offre_remplacement",
        label: "Comparaison au predecesseur ?",
        attack: "Le recruteur dira : 'Vous remplacez quelqu'un qui avait 8 ans d'anciennete. L'equipe lui etait loyale. Comment vous gagnez la confiance d'une equipe qui ne vous a pas choisi ?'",
        defense: "Ne critique jamais le predecesseur. Cite un moment ou tu as pris un poste apres quelqu'un et ou tu as gagne la confiance par un resultat rapide. Le premier quick win efface la comparaison.",
        source: "offre",
      };
    }

    if (offerAttack) angles.push(offerAttack);
  }

  // ===== SOURCE 3: ATTAQUES TIRÉES DU MARCHÉ / RÔLE =====
  if (targetRoleId) {
    var roleData = KPI_REFERENCE[targetRoleId];
    var marketAttack = null;

    // Extract numbers from brick text to compare with market benchmarks
    var numbers = text.match(/\d+/g);
    var hasSmallNumbers = numbers && numbers.some(function(n) { return parseInt(n) < 20; });
    var hasPercentage = text.indexOf("%") !== -1;

    if (targetRoleId === "enterprise_ae" && (text.indexOf("cycle") !== -1 || text.indexOf("deal") !== -1 || text.indexOf("vente") !== -1)) {
      marketAttack = {
        type: "marche_cycle",
        label: "Benchmark marche ?",
        attack: "Le recruteur dira : 'Le cycle de vente moyen dans notre secteur est de 6 a 9 mois. Vos chiffres viennent d'un cycle transactionnel beaucoup plus court. Comment vous transferez cette competence sur du enterprise long ?'",
        defense: "Separe la methode du cycle. Ta methode de qualification, de multi-threading, de gestion du champion fonctionne quel que soit le cycle. Cite l'etape du process que tu as amelioree, pas le resultat final.",
        source: "marche",
      };
    } else if (targetRoleId === "head_of_growth" && (text.indexOf("acquisition") !== -1 || text.indexOf("lead") !== -1 || text.indexOf("canal") !== -1 || text.indexOf("cac") !== -1)) {
      marketAttack = {
        type: "marche_cac",
        label: "CAC et scalabilite ?",
        attack: "Le recruteur dira : 'Votre CAC etait bas parce que votre marche n'etait pas sature. Ici la concurrence a fait exploser les couts d'acquisition. Votre methode tient encore quand le CPM triple ?'",
        defense: "Montre que ta methode a fonctionne PENDANT une hausse des couts, pas juste dans un marche vierge. Si tu as diversifie les canaux quand un s'est ferme, c'est la preuve.",
        source: "marche",
      };
    } else if (targetRoleId === "strategic_csm" && (text.indexOf("churn") !== -1 || text.indexOf("retention") !== -1 || text.indexOf("nrr") !== -1 || text.indexOf("upsell") !== -1)) {
      marketAttack = {
        type: "marche_churn",
        label: "Churn structurel ?",
        attack: "Le recruteur dira : 'Le churn moyen SaaS est de 5-7% annuel. Votre taux etait deja en dessous avant votre arrivee. Qu'avez-vous reellement change ?'",
        defense: "Isole le segment que tu as traite. Le churn global masque les segments. Montre le segment le plus risque et ce que tu as fait dessus. Le delta est ta preuve.",
        source: "marche",
      };
    } else if (targetRoleId === "senior_pm" && (text.indexOf("feature") !== -1 || text.indexOf("roadmap") !== -1 || text.indexOf("produit") !== -1 || text.indexOf("discovery") !== -1)) {
      marketAttack = {
        type: "marche_feature",
        label: "Impact produit reel ?",
        attack: "Le recruteur dira : 'En moyenne, 80% des features lancees n'ont pas d'impact mesurable. Comment vous mesurez que votre feature a reellement bouge une metrique, et pas juste fait plaisir a un stakeholder ?'",
        defense: "Cite la metrique AVANT et APRES le lancement. Si tu n'as pas mesure l'impact post-lancement, sois honnete et montre comment tu structurerais la mesure ici.",
        source: "marche",
      };
    } else if (targetRoleId === "engineering_manager" && (text.indexOf("equipe") !== -1 || text.indexOf("recrutement") !== -1 || text.indexOf("turnover") !== -1 || text.indexOf("delivery") !== -1)) {
      marketAttack = {
        type: "marche_retention",
        label: "Retention tech ?",
        attack: "Le recruteur dira : 'Le turnover moyen en engineering est de 15-20%. Le marche est tendu. Votre equipe restait peut-etre parce que le marche etait ferme, pas parce que votre management etait bon. Comment vous prouvez le contraire ?'",
        defense: "Cite les departs evites. Un membre qui a recu une offre et est reste, c'est ta preuve. Le taux de retention seul ne suffit pas. La raison du retention si.",
        source: "marche",
      };
    } else if (targetRoleId === "ai_architect") {
      marketAttack = {
        type: "marche_ia",
        label: "Production vs POC ?",
        attack: "Le recruteur dira : '85% des projets IA ne passent jamais en production. Votre projet etait-il un POC qui a impressionne un COMEX ou un systeme qui tourne encore aujourd'hui ?'",
        defense: "Cite le nombre d'utilisateurs actifs, le volume de requetes, ou la duree en production. Un POC en production depuis 18 mois vaut plus qu'un projet flagship arrete apres 3 mois.",
        source: "marche",
      };
    } else if (targetRoleId === "management_consultant") {
      marketAttack = {
        type: "marche_conseil",
        label: "Impact post-mission ?",
        attack: "Le recruteur dira : 'Les consultants partent, les recommandations restent dans un tiroir. Votre livrable a-t-il ete implemente ? Quel resultat 6 mois apres votre depart ?'",
        defense: "Cite le resultat post-mission. Si tu as un chiffre du client 6 mois apres, c'est ta meilleure preuve. Si tu n'en as pas, cite la decision concrete que le client a prise grace a toi.",
        source: "marche",
      };
    } else if (hasPercentage || hasSmallNumbers) {
      marketAttack = {
        type: "marche_benchmark",
        label: "Chiffre vs benchmark ?",
        attack: "Le recruteur dira : 'Ce chiffre est correct, mais c'est la moyenne du secteur. Qu'est-ce qui prouve que c'est exceptionnel et pas juste normal ?'",
        defense: "Situe ton chiffre. Compare-le au benchmark de ton secteur, de ton equipe precedente, ou de ton predecesseur. Un chiffre sans reference est un chiffre sans poids.",
        source: "marche",
      };
    }

    if (marketAttack) angles.push(marketAttack);
  }

  return angles;
}

function hashCode(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
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
  return getActiveCauchemars().map(function(c) {
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
              ? "Tu as fait un travail que la majorité des candidats ne fera jamais. Le recruteur verra la différence entre quelqu'un qui a préparé et quelqu'un qui a généré."
              : level === "solide"
              ? "Investissement solide. Chaque brique supplementaire creuse l'ecart avec les candidats qui arrivent les mains vides."
              : level === "en cours"
              ? "Debut d'investissement. Continue. La valeur arrive quand le travail devient inconfortable."
              : "Premier pas. La Forge demarre. Chaque réponse construit ton arsenal."
            }
          </div>
          {hasCicatrices && (
            <div style={{ fontSize: 11, color: "#ff9800", marginTop: 6 }}>Tu as assumé tes échecs. C'est le signal le plus rare en entretien.</div>
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
    { l: "Piliers Singularité", val: v.pillars, mx: 4, e: "\uD83C\uDFDB\uFE0F" },
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
                        {"\u2197\uFE0F"} Levier de négociation : ta brique couvre un cauchemar élastique a {(c.costRange[0] / 1000).toFixed(0)}-{(c.costRange[1] / 1000).toFixed(0)}K\u20AC. Ta négociation commence par ce chiffre.
                      </div>
                    </div>
                  )}
                  {/* Bluff alert for elastic coverage */}
                  {c.covered && c.hasElasticCovering && (
                    <div style={{ background: "#ff9800" + "15", borderRadius: 4, padding: 6, marginBottom: 3 }}>
                      <div style={{ fontSize: 10, color: "#ff9800", lineHeight: 1.4 }}>
                        {"\u26A0\uFE0F"} Alerte bluff : tu te positionnes comme le remède. Si le problème persiste après ton arrivée, tu es la cible. Ta preuve est-elle reproductible ?
                      </div>
                    </div>
                  )}
                  {/* Cost input */}
                  {onCostChange && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "#495670" }}>{"\uD83D\uDCB0"}</span>
                      <input
                        type="text"
                        placeholder="Coût estimé (ex: 180K/trimestre)"
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
            <div style={{ fontSize: 11, color: "#e94560", marginTop: 6 }}>{3 - coveredCount} cauchemar{3 - coveredCount > 1 ? "s" : ""} sans remède. Le recruteur le verra.</div>
          )}
          {coverage.some(function(c) { return c.covered && c.vulnerability && c.vulnerability.level === "vulnerable"; }) && (
            <div style={{ background: "#e94560" + "22", borderRadius: 6, padding: 8, marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5, fontWeight: 600 }}>Tu te positionnes comme le remède. Si tes briques sont faibles et que le problème persiste après ton embauche, tu deviens la cible. Blinde tes briques ou baisse tes prétentions.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==============================
   LIVEARSENAL — Mode Urgence
   Distribue les livrables pendant la Forge, brique par brique.
   Toggle activable/desactivable par l'utilisateur.
   ============================== */

function WorkBench({ bricks, targetRoleId, trajectoryToggle, vault, offersArray, isActive }) {
  var expandState = useState(false);
  var expanded = expandState[0];
  var setExpanded = expandState[1];
  var selectedOfferState = useState(0);
  var selectedOfferIdx = selectedOfferState[0];
  var setSelectedOfferIdx = selectedOfferState[1];
  var copiedState = useState(null);
  var copiedId = copiedState[0];
  var setCopiedId = copiedState[1];

  if (!isActive) return null;

  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return null;

  var blindedCount = validated.filter(function(b) { return b.blinded; }).length;
  var isBlinded = function(b) { return b.blinded; };

  // Generate scripts for selected offer or global
  var targetOffer = offersArray && offersArray.length > 0 ? offersArray[selectedOfferIdx] || offersArray[0] : null;
  var scripts = generateContactScripts(bricks, targetRoleId, targetOffer);
  var cvText = generateCV(bricks, targetRoleId, trajectoryToggle);
  var bioText = validated.length >= 2 ? generateBio(bricks, vault, trajectoryToggle) : null;

  var qualityLevel = blindedCount >= 3 ? "blinde" : blindedCount >= 1 ? "partiel" : "nu";
  var qualityColor = qualityLevel === "blinde" ? "#4ecca3" : qualityLevel === "partiel" ? "#ff9800" : "#e94560";
  var qualityLabel = qualityLevel === "blinde" ? "PREUVE BLINDEE" : qualityLevel === "partiel" ? "PARTIELLEMENT BLINDE" : "SANS PREUVE CHIFFREE";

  function handleCopy(text, id) {
    if (navigator.clipboard) { navigator.clipboard.writeText(text); }
    setCopiedId(id);
    setTimeout(function() { setCopiedId(null); }, 2000);
  }

  var armeCount = (scripts ? 1 : 0) + (cvText && validated.length > 0 ? 1 : 0) + (bioText ? 1 : 0);

  return (
    <div style={{ background: "#0d1b2a", border: "1px solid " + qualityColor + "44", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
      <button onClick={function() { setExpanded(!expanded); }} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer", padding: "12px 16px", textAlign: "left",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{"\u26A1"}</span>
          <span style={{ color: "#ccd6f6", fontWeight: 700, fontSize: 13 }}>L'ETABLI</span>
          <span style={{ fontSize: 10, color: qualityColor, background: qualityColor + "22", padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>{armeCount} arme{armeCount > 1 ? "s" : ""}</span>
          <span style={{ fontSize: 9, color: qualityColor, background: qualityColor + "15", padding: "1px 6px", borderRadius: 6 }}>{qualityLabel}</span>
        </div>
        <span style={{ fontSize: 12, color: "#495670" }}>{expanded ? "\u25B2" : "\u25BC"}</span>
      </button>

      {expanded && (
        <div style={{ padding: "0 16px 16px" }}>

          {/* Avertissement qualité */}
          {qualityLevel !== "blinde" && (
            <div style={{ background: "#e94560" + "15", borderRadius: 8, padding: 10, marginBottom: 12, borderLeft: "3px solid #e94560" }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, marginBottom: 4 }}>AVERTISSEMENT</div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                {qualityLevel === "nu"
                  ? "Tes scripts n'ont aucune preuve chiffree. Le hiring manager sera intrigue, pas convaincu. Blinde tes briques pour passer de \"interessant\" a \"evident.\""
                  : "Certaines briques ne sont pas blindees (" + blindedCount + "/" + validated.length + " blindees). Le script utilise la meilleure preuve disponible. Blinde le reste pour renforcer l'arsenal."}
              </div>
            </div>
          )}

          {/* Sélecteur d'offre */}
          {offersArray && offersArray.length > 1 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#495670", fontWeight: 600, marginBottom: 4, letterSpacing: 1 }}>CALIBRER SUR :</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {offersArray.map(function(o, i) {
                  var isSelected = i === selectedOfferIdx;
                  var shortLabel = o.text.slice(0, 40).replace(/\n/g, " ") + "...";
                  return (
                    <button key={o.id} onClick={function() { setSelectedOfferIdx(i); }} style={{
                      padding: "4px 10px", fontSize: 10, borderRadius: 6, cursor: "pointer", fontWeight: 600,
                      background: isSelected ? qualityColor + "22" : "#1a1a2e", border: "1px solid " + (isSelected ? qualityColor : "#16213e"),
                      color: isSelected ? qualityColor : "#8892b0",
                    }}>{"\uD83C\uDFAF"} Offre {i + 1}</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCRIPT DE CONTACT */}
          {scripts && (
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: qualityColor, fontWeight: 700, letterSpacing: 1 }}>{"\uD83D\uDCE8"} DM LINKEDIN</div>
                <button onClick={function() { handleCopy(scripts.dm, "dm"); }} style={{
                  padding: "3px 10px", fontSize: 10, background: copiedId === "dm" ? "#4ecca3" : "#0f3460",
                  color: copiedId === "dm" ? "#0a0a0a" : "#ccd6f6", border: "1px solid " + (copiedId === "dm" ? "#4ecca3" : "#16213e"),
                  borderRadius: 6, cursor: "pointer", fontWeight: 600,
                }}>{copiedId === "dm" ? "\u2705 Copie" : "Copier"}</button>
              </div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{scripts.dm}</div>
            </div>
          )}

          {/* EMAIL */}
          {scripts && (
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, letterSpacing: 1 }}>{"\u2709\uFE0F"} EMAIL</div>
                <button onClick={function() { handleCopy(scripts.email, "email"); }} style={{
                  padding: "3px 10px", fontSize: 10, background: copiedId === "email" ? "#4ecca3" : "#0f3460",
                  color: copiedId === "email" ? "#0a0a0a" : "#ccd6f6", border: "1px solid " + (copiedId === "email" ? "#4ecca3" : "#16213e"),
                  borderRadius: 6, cursor: "pointer", fontWeight: 600,
                }}>{copiedId === "email" ? "\u2705 Copie" : "Copier"}</button>
              </div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>{scripts.email}</div>
            </div>
          )}

          {/* CV EN CONSTRUCTION */}
          <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, letterSpacing: 1 }}>{"\uD83D\uDCC4"} CV ({validated.length} brique{validated.length > 1 ? "s" : ""})</div>
              <button onClick={function() { handleCopy(cvText, "cv"); }} style={{
                padding: "3px 10px", fontSize: 10, background: copiedId === "cv" ? "#4ecca3" : "#0f3460",
                color: copiedId === "cv" ? "#0a0a0a" : "#ccd6f6", border: "1px solid " + (copiedId === "cv" ? "#4ecca3" : "#16213e"),
                borderRadius: 6, cursor: "pointer", fontWeight: 600,
              }}>{copiedId === "cv" ? "\u2705 Copie" : "Copier"}</button>
            </div>
            <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 100, overflow: "auto" }}>{cvText}</div>
          </div>

          {/* BIO LINKEDIN */}
          {bioText ? (
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, letterSpacing: 1 }}>{"\uD83D\uDC64"} BIO LINKEDIN</div>
                <button onClick={function() { handleCopy(bioText, "bio"); }} style={{
                  padding: "3px 10px", fontSize: 10, background: copiedId === "bio" ? "#4ecca3" : "#0f3460",
                  color: copiedId === "bio" ? "#0a0a0a" : "#ccd6f6", border: "1px solid " + (copiedId === "bio" ? "#4ecca3" : "#16213e"),
                  borderRadius: 6, cursor: "pointer", fontWeight: 600,
                }}>{copiedId === "bio" ? "\u2705 Copie" : "Copier"}</button>
              </div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{bioText}</div>
            </div>
          ) : (
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12, opacity: 0.4 }}>
              <div style={{ fontSize: 11, color: "#495670", fontWeight: 700 }}>{"\uD83D\uDD12"} BIO LINKEDIN — 2 briques minimum</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==============================
   SUBSCRIPTION DASHBOARD
   Zone 1 — Thermostat (3 lignes)
   Zone 2 — Posts de la semaine (2-3 survivants)
   Zone 3 — Resume Coffre-Fort
   Zone grisee — Posts ecartes (optionnelle)
   ============================== */

/* LEGACY — SubscriptionDashboard. Posts hebdo et sleep mode branchés dans le tab Thermostat (ligne ~8685).
   Ce composant n'est plus appelé. Conservé comme référence pour V2 (posts rejected, publish tracking). */
function SubscriptionDashboard({ bricks, vault, targetRoleId, trajectoryToggle, offersArray }) {
  var expandRejectedState = useState(false);
  var showRejected = expandRejectedState[0];
  var setShowRejected = expandRejectedState[1];
  var copiedState = useState(null);
  var copiedId = copiedState[0];
  var setCopiedId = copiedState[1];
  var publishedState = useState(null);
  var publishedId = publishedState[0];
  var setPublishedId = publishedState[1];

  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var blinded = validated.filter(function(b) { return b.blinded; });
  var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
  var thermoState = getDiltsThermometerState(diltsHistory);
  var diltsTarget = computeDiltsTarget(diltsHistory);
  var diltsLabel = getDiltsLabel(thermoState.effectiveLevel);

  // Compute total cauchemar cost covered
  var coverage = computeCauchemarCoverage(bricks);
  var covered = coverage.filter(function(c) { return c.covered; });
  var totalCostLow = 0;
  var totalCostHigh = 0;
  covered.forEach(function(cc) {
    var cauch = getActiveCauchemars().find(function(c) { return c.id === cc.id; });
    if (cauch) { totalCostLow += cauch.costRange[0]; totalCostHigh += cauch.costRange[1]; }
  });

  // Generate weekly posts
  var weeklyResult = generateWeeklyPosts(bricks, vault, targetRoleId);
  var posts = weeklyResult.posts;
  var rejected = weeklyResult.rejected;

  // Sleep mode suggestions
  var sleepComment = generateSleepComment(bricks, vault, targetRoleId);
  var sleepBrick = proposeSleepBrick(vault);

  function handleCopy(text, id) {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(function() { setCopiedId(null); }, 2000);
  }

  return (
    <div style={{ padding: "20px 0" }}>

      {/* SOUS-TITRE PERMANENT */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>DASHBOARD</div>
        <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, maxWidth: 380, margin: "0 auto", fontStyle: "italic" }}>
          Ton expertise resout des problemes a 6 chiffres. Ce dashboard existe pour que le marche le sache.
        </div>
      </div>

      {/* MILLER FIX — Carte des zones : ancre la perception 4 blocs, pas 12 lignes */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[
          { color: "#e94560", label: "Thermostat", count: 3 },
          { color: "#4ecca3", label: "Posts", count: posts.length },
          { color: "#ff9800", label: "Coffre-Fort", count: validated.length },
          { color: "#3498db", label: "Actions", count: (sleepComment ? 1 : 0) + (sleepBrick ? 1 : 0) },
        ].map(function(z, i) {
          return (
            <div key={i} style={{
              flex: 1, textAlign: "center", padding: "8px 4px",
              background: "#16213e", borderRadius: 8, borderTop: "3px solid " + z.color,
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: z.color }}>{z.count}</div>
              <div style={{ fontSize: 9, color: "#8892b0", fontWeight: 600, letterSpacing: 0.5 }}>{z.label}</div>
            </div>
          );
        })}
      </div>

      {/* ZONE 1 — THERMOSTAT */}
      <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 20, borderLeft: "4px solid #e94560" }}>
        <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>THERMOSTAT</div>

        {/* Ligne 1 — Valeur prouvee */}
        <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #16213e" }}>
          <div style={{ fontSize: 12, color: "#4ecca3", fontWeight: 700, marginBottom: 4 }}>VALEUR PROUVEE</div>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            Tu resous {covered.length} cauchemar{covered.length > 1 ? "s" : ""} pour un cout cumule de {formatCost(totalCostLow)}-{formatCost(totalCostHigh)} par an. Preuve : {blinded.length} brique{blinded.length > 1 ? "s" : ""} blindee{blinded.length > 1 ? "s" : ""} dans ton Coffre-Fort.
          </div>
        </div>

        {/* Ligne 2 — Visibilite */}
        <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #16213e" }}>
          <div style={{ fontSize: 12, color: "#ff9800", fontWeight: 700, marginBottom: 4 }}>VISIBILITE</div>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            Dernier post declare : {thermoState.lastPostDate ? "il y a " + thermoState.weeksInactive + " semaine" + (thermoState.weeksInactive > 1 ? "s" : "") : "aucun"}.
            {" "}Registre : {diltsLabel.name} ({thermoState.effectiveLevel}/5).
            {" "}Prochain registre : {DILTS_EDITORIAL_MAPPING[diltsTarget.targetLevel] ? DILTS_EDITORIAL_MAPPING[diltsTarget.targetLevel].registre : "Comportement"}.
          </div>
        </div>

        {/* Ligne 3 — Cout du silence */}
        <div>
          <div style={{ fontSize: 12, color: thermoState.decay > 0 ? "#e94560" : thermoState.isAlert ? "#ff9800" : "#8892b0", fontWeight: 700, marginBottom: 4 }}>COUT DU SILENCE</div>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            {thermoState.decay > 0
              ? "Ton thermostat a baisse. Plafond atteint : " + getDiltsLabel(thermoState.plafond).name + ". Niveau effectif : " + diltsLabel.name + ". Chaque semaine sans signal, tu sors du top 5% des profils visibles. 2 millions de posts par jour sur LinkedIn. Sans signal, ton profil descend."
              : thermoState.isAlert
              ? "1 semaine sans signal. Tu es encore visible mais le compteur tourne. 94.8% des utilisateurs LinkedIn ne publient jamais. 1 post ou 2-3 commentaires cette semaine te maintiennent dans les 5% qui existent."
              : "Ton thermostat est stable. 1 signal par semaine minimum. Au-dela de 5, le bruit te dessert. Le cadre senior publie peu mais juste."
            }
          </div>
        </div>
      </div>

      {/* ZONE 2 — POSTS DE LA SEMAINE */}
      <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 20, borderLeft: "4px solid #4ecca3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, letterSpacing: 1 }}>POSTS DE LA SEMAINE</div>
          <span style={{ fontSize: 10, color: "#8892b0" }}>{posts.length} pret{posts.length > 1 ? "s" : ""}{rejected.length > 0 ? ", " + rejected.length + " ecarte" + (rejected.length > 1 ? "s" : "") : ""}</span>
        </div>

        {posts.length === 0 && (
          <div style={{ fontSize: 12, color: "#495670", textAlign: "center", padding: 20 }}>
            Pas assez de briques blindees pour generer des posts. Blinde ton Coffre-Fort.
          </div>
        )}

        {posts.map(function(post, i) {
          var diltsInfo = getDiltsLabel(post.diltsLevel);
          var isCopied = copiedId === "post-" + i;
          var isPublished = publishedId === "post-" + i;
          return (
            <div key={i} style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: i < posts.length - 1 ? 10 : 0 }}>
              {/* Header badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 9, color: diltsInfo.color, background: diltsInfo.color + "22", padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>{diltsInfo.name}</span>
                <span style={{ fontSize: 9, color: "#8892b0", background: "#1a1a2e", padding: "2px 6px", borderRadius: 6 }}>{post.formatLabel}</span>
                {post.marieScore && <span style={{ fontSize: 9, color: post.marieScore >= 7 ? "#4ecca3" : "#ff9800", background: "#1a1a2e", padding: "2px 6px", borderRadius: 6 }}>Marie {post.marieScore}/10</span>}
                {post.stockPotential && <span style={{ fontSize: 9, color: "#9b59b6", background: "#9b59b6" + "22", padding: "2px 6px", borderRadius: 6 }}>Stock</span>}
                {!post.isBlinded && <span style={{ fontSize: 9, color: "#e94560", background: "#e94560" + "22", padding: "2px 6px", borderRadius: 6 }}>brique non blindee</span>}
              </div>

              {/* Brick source */}
              <div style={{ fontSize: 10, color: "#495670", marginBottom: 6 }}>Source : {post.brickText}</div>

              {/* Post text */}
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 10 }}>{post.text}</div>

              {/* Stock angle */}
              {post.stockPotential && post.stockAngle && (
                <div style={{ fontSize: 10, color: "#9b59b6", marginBottom: 8, fontStyle: "italic" }}>{post.stockAngle}</div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={function() { handleCopy(post.text, "post-" + i); }} style={{
                  padding: "4px 12px", fontSize: 10, borderRadius: 6, cursor: "pointer", fontWeight: 600,
                  background: isCopied ? "#4ecca3" : "#0f3460", color: isCopied ? "#0a0a0a" : "#ccd6f6",
                  border: "1px solid " + (isCopied ? "#4ecca3" : "#16213e"),
                }}>{isCopied ? "\u2705 Copie" : "Copier"}</button>
                <button onClick={function() {
                  setPublishedId("post-" + i);
                  // In real implementation: add to vault.diltsHistory with date and level
                }} style={{
                  padding: "4px 12px", fontSize: 10, borderRadius: 6, cursor: "pointer", fontWeight: 600,
                  background: isPublished ? "#4ecca3" + "22" : "#1a1a2e", color: isPublished ? "#4ecca3" : "#495670",
                  border: "1px solid " + (isPublished ? "#4ecca3" : "#16213e"),
                }}>{isPublished ? "\u2705 Publie" : "Publie"}</button>
              </div>
            </div>
          );
        })}

        {/* Posts ecartes */}
        {rejected.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button onClick={function() { setShowRejected(!showRejected); }} style={{
              background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#495670", fontWeight: 600, padding: 0,
            }}>{showRejected ? "\u25B2" : "\u25BC"} {rejected.length} post{rejected.length > 1 ? "s" : ""} ecarte{rejected.length > 1 ? "s" : ""}</button>
            {showRejected && rejected.map(function(r, i) {
              return (
                <div key={"rej-" + i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginTop: 6, opacity: 0.6 }}>
                  <div style={{ fontSize: 10, color: "#e94560", fontWeight: 700, marginBottom: 4 }}>Ecarte par {r.rejectSource}</div>
                  <div style={{ fontSize: 10, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>{r.rejectReason}</div>
                  <div style={{ fontSize: 10, color: "#495670", whiteSpace: "pre-wrap" }}>{r.text}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ZONE 3 — RESUME COFFRE-FORT */}
      <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 20, borderLeft: "4px solid #ff9800" }}>
        <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>COFFRE-FORT</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ccd6f6" }}>{validated.length}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>briques</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#4ecca3" }}>{blinded.length}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>blindees</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ff9800" }}>{covered.length}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>cauchemars</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: diltsLabel.color }}>{thermoState.plafond}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>Registre max</div>
          </div>
        </div>
      </div>

      {/* SLEEP MODE SUGGESTIONS */}
      {(sleepComment || sleepBrick) && (
        <div style={{ background: "#16213e", borderRadius: 12, padding: 16, borderLeft: "4px solid #3498db" }}>
          <div style={{ fontSize: 11, color: "#495670", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>ACTIONS RAPIDES</div>
          {sleepComment && (
            <div style={{ marginBottom: sleepBrick ? 10 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11 }}>{"\uD83D\uDCAC"}</span>
                <span style={{ fontSize: 11, color: "#8892b0", fontWeight: 600 }}>Commentaire de la semaine ({sleepComment.effort})</span>
              </div>
              <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5 }}>{sleepComment.suggestion}</div>
            </div>
          )}
          {sleepBrick && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11 }}>{"\u2795"}</span>
                <span style={{ fontSize: 11, color: "#8892b0", fontWeight: 600 }}>Nouvelle brique ({sleepBrick.effort})</span>
              </div>
              <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5 }}>{sleepBrick.suggestion}</div>
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
        {brick.type === "mission" ? "\uD83D\uDCCB MISSION ASSIGNÉE" : brick.corrected ? "\u270D\uFE0F BRIQUE CORRIGEE" : "\u2705 BRIQUE FORGEE"}
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
          {brick.brickType === "cicatrice" ? "Echec assume. C'est la brique la plus rare de ton Coffre-Fort." : brick.brickCategory === "decision" ? "Arbitrage documente. Aucun generateur de CV ne produit ca." : "Influence prouvee. Le recruteur ne peut pas testér ca autrement qu'en entretien."}
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
        <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Brique ajoutée et structurée.</div>
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
        placeholder={category === "chiffre" ? "Ex : J'ai formé 12 commerciaux, 8 ont atteint leur quota en 4 mois." : category === "decision" ? "Ex : Le board voulait X, j'ai choisi Y parce que Z." : "Ex : 3 directeurs bloquaient, j'ai aligné tout le monde en montrant le coût d'opportunité."}
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

function Interrogation({ seeds, bricks, onForge, onCorrect, onMission, onSkip, onAddBrick, paranoMode, targetRoleId, trajectoryToggle }) {
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
            {missionItems.length > 0 ? "Les missions deviennent des briques quand tu apportes la preuve." : "Forgees a partir de tes réponses. Tu les incarnes. Tu les defendras."}
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
        <div style={{ fontSize: 15, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>L'IA analyse ta réponse...</div>
        <div style={{ fontSize: 12, color: "#8892b0" }}>Croisement avec le contexte marché.</div>
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
            Ta réponse ne contient pas de chiffre.
            {hasDecision || hasInfluence ? " Mais l'IA détecté des marqueurs de " + (hasDecision ? "decision" : "") + (hasDecision && hasInfluence ? " et d'" : "") + (hasInfluence ? "influence" : "") + "." : ""}
            {!hasDecision && !hasInfluence && hasRichContent ? " Mais ta réponse est riche (" + answer.trim().split(" ").length + " mots)." : ""}
            {!hasDecision && !hasInfluence && !hasRichContent ? " L'IA n'a pas détecté de marqueurs de décision ou d'influence." : ""}
          </div>
          <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 4 }}>CE QUE L'IA A DETECTE DANS TA REPONSE</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
              Chiffres : <span style={{ color: "#e94560" }}>aucun</span>
              {hasDecision && <span> {"\u00B7"} Marqueurs de décision : <span style={{ color: "#9b59b6" }}>oui</span></span>}
              {hasInfluence && <span> {"\u00B7"} Marqueurs d'influence : <span style={{ color: "#3498db" }}>oui</span></span>}
              {!hasDecision && <span> {"\u00B7"} Marqueurs de décision : <span style={{ color: "#495670" }}>non</span></span>}
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
            <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 400, marginTop: 2 }}>L'IA structure ta réponse sans chiffre. La brique sera moins precise mais existera.</div>
          </button>
          <button onClick={function() { setPhase("mission"); setIsMission(true); }} style={{
            padding: 14, background: "#0f3460", color: "#ccd6f6", border: "2px solid #ff9800", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, textAlign: "left",
          }}>
            <span style={{ color: "#ff9800" }}>{"\u2192"}</span> Assigne la mission, je reviendrai avec le chiffre
            <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 400, marginTop: 2 }}>L'IA te donne les étapes pour recuperer la preuve. La brique sera forgée quand tu reviendras.</div>
          </button>
          <button onClick={function() { setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); }} style={{
            padding: 14, background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, textAlign: "left",
          }}>
            <span style={{ color: "#495670" }}>{"\u2192"}</span> Je reformule ma réponse
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
          <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>MISSION ASSIGNÉE</div>
          <div style={{ fontSize: 14, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 12 }}>{seed.missionText}</div>
          <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 4 }}>POURQUOI UNE MISSION ET PAS UNE BRIQUE</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Ta réponse ne contient pas de chiffre. Sans chiffre, l'IA forge du vent. Un recruteur détecté la différence entre une preuve et une impression.</div>
          </div>
          {isHighMissions && (
            <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, borderLeft: "3px solid #e94560" }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>DIAGNOSTIC DE MESURE</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                C'est ta {missionCount}e mission sur {missionCount + brickCount} questions. {missionRatio}% de tes réponses n'ont pas de chiffre. Ce n'est pas un problème de mémoire. C'est un mode de fonctionnement : tu opères sans mesurer l'impact de ce que tu fais.
              </div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginTop: 6 }}>
                Chaque mission que tu complètes ne remplit pas seulement ton arsenal. Elle installe un réflexe : mesurer ce que tu fais pendant que tu le fais. Le professionnel qui négocie avec des preuves fixe son prix. Celui qui négocie avec des impressions accepte celui qu'on lui donne.
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
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Reformule ta réponse en incluant ta part de responsabilite.</div>
        </div>
        <button onClick={function() { setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setConfrontMsg(null); }} style={{
          width: "100%", padding: 14, background: "#0f3460", color: "#ccd6f6", border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>Reformuler ma réponse</button>
      </div>
    );
  }

  // CORRECTION MODE — editing the generated brick text
  if (phase === "correcting") {
    return (
      <div>
        <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>RETOUCHE DE LA BRIQUE</div>
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
      var reviewedSeed = Object.assign({}, seed, { generatedText: effectiveText, anonymizedText: anonEdit.trim(), anonAuditTrail: auditTrail, advocacyText: generateAdvocacyText(effectiveText, seed.brickCategory, seed.type, seed.nightmareText), internalAdvocacy: generateInternalAdvocacy(effectiveText, seed.brickCategory, seed.type, seed.elasticity) });
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
              ? audit.totalFindings + " élément" + (audit.totalFindings > 1 ? "s" : "") + " détecté" + (audit.totalFindings > 1 ? "s" : "") + " sur 3 passes. Vérifie et corrige avant d'archiver."
              : "3 passes exécutées. 0 élément détecté. Vérifie quand même : l'IA peut rater des éléments."
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
            Supprime les noms d'entreprise, montants absolus, données spécifiques. Garde la logique et les ratios.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleAnonConfirm} style={{
            flex: 1, padding: 14, background: isCorrection ? "linear-gradient(135deg, #9b59b6, #8e44ad)" : "linear-gradient(135deg, #e94560, #c81d4e)",
            color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}>
            {hasSensitive ? "J'ai vérifié — Archiver" : "Confirmer et archiver"}
            {isCorrection ? " la correction" : ""}
          </button>
          <button onClick={function() { setPhase(isCorrection ? "correcting" : "review"); setAnonEdit(""); setAnonAudit(null); }} style={{
            padding: "14px 16px", background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Retour</button>
        </div>
      </div>
    );
  }

  // BRICK REVIEW — with verb analysis + sectoral code + advocacy + elasticity + correction option + KPI référence
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
                  ? "Tu as un angle personnel, des exemples concrets et un raisonnement causal. C'est une these, pas une opinion. Elle deviendra un pilier de ta singularité."
                  : "Ta position est la. Mais elle manque de " + (
                    takeAnalysis.foundDepth.indexOf("contrarian") === -1 ? "contrepoint (qu'est-ce que les autres pensent a tort ?)" :
                    takeAnalysis.foundDepth.indexOf("personal") === -1 ? "vecu (qu'est-ce que TU as vu que les autres n'ont pas vu ?)" :
                    takeAnalysis.foundDepth.indexOf("causal") === -1 ? "logique causale (pourquoi c'est vrai ?)" :
                    "spécificité (donne un exemple concret)."
                  )
                }
              </div>
              {takeAnalysis.foundDepth.length > 0 && (
                <div style={{ fontSize: 10, color: "#495670", marginTop: 4 }}>Marqueurs détectés : {takeAnalysis.foundDepth.join(", ")}</div>
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
    var computedAdvocacy = generateAdvocacyText(effectiveText, seed.brickCategory, seed.type, seed.nightmareText);
    var computedInternalAdvocacy = generateInternalAdvocacy(effectiveText, seed.brickCategory, seed.type, seed.elasticity);
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
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid " + (isSousPression ? "#e94560" : kpiMatch.elasticity === "élastique" ? "#4ecca3" : "#8892b0") }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: isSousPression ? "#e94560" : kpiMatch.elasticity === "élastique" ? "#4ecca3" : "#8892b0", fontWeight: 600 }}>
                  {isSousPression ? "\uD83D\uDEA8 KPI SOUS PRESSION" : kpiMatch.elasticity === "élastique" ? "\u2197\uFE0F KPI ELASTIQUE" : "\u2194\uFE0F KPI STABLE"}
                </span>
                <span style={{ fontSize: 10, color: "#495670", background: "#0f3460", padding: "2px 8px", borderRadius: 8 }}>
                  {kpiMatch.name}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 4 }}>{kpiMatch.why}</div>
              {isSousPression && (
                <div style={{ background: "#e94560" + "22", borderRadius: 6, padding: 8, marginTop: 6 }}>
                  <div style={{ fontSize: 12, color: "#e94560", fontWeight: 600, lineHeight: 1.5 }}>
                    Ce KPI est automatisable. L'IA fait ça pour 0,01 euros. Si c'est ta meilleure preuve, tu négocies à la baisse. Trouve un angle élastique ou accepte que cette brique est faible.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BLUFF ALERT — elastic KPI covering a quantified cauchemar */}
          {kpiMatch && seed.kpi && (function() {
            var matchedCauchemar = getActiveCauchemars().filter(function(c) {
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
                    Tu couvres ce cauchemar avec un KPI automatisable. Le recruteur sait que l'IA fait ce travail. Tu es le remède avec un outil que tout le monde a. Trouve un angle élastique.
                  </div>
                ) : (
                  <div>
                    {negoText && (
                      <div style={{ fontSize: 12, color: "#4ecca3", lineHeight: 1.5, fontStyle: "italic", marginBottom: 4 }}>"{negoText}"</div>
                    )}
                    <div style={{ fontSize: 11, color: "#ff9800", lineHeight: 1.5 }}>
                      Si tu revendiques cette solution et que le problème persiste après ton arrivée, tu deviens la cible. Ta preuve doit être reproductible.
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
                  <div style={{ fontSize: 11, color: "#e94560", marginTop: 6, lineHeight: 1.4 }}>Corrige cette brique avant de l'archiver. Le bouton "Retoucher" te permet de l'enrichir.</div>
                )}
              </div>
            );
          })()}

          {/* CICATRICE — valorization without classification */}
          {seed.type === "cicatrice" && answer && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #ff9800", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>CICATRICE ASSUMEE</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Tu viens de raconter un échec. Le système le transforme en preuve de maturité. 95% des candidats mentent ou esquivent. Tu te separes d'eux.</div>
            </div>
          )}

          {/* ADVOCACY FRAMING — enhanced for hard questions */}
          {computedAdvocacy && (function() {
            var isHard = seed.brickCategory === "decision" || seed.brickCategory === "influence" || seed.type === "cicatrice";
            return (
              <div style={{ background: isHard ? "#0f3460" : "#1a1a2e", borderRadius: isHard ? 10 : 8, padding: isHard ? 16 : 10, borderLeft: "3px solid #4ecca3", marginBottom: 10, boxShadow: isHard ? "0 2px 12px rgba(78,204,163,0.15)" : "none" }}>
                <div style={{ fontSize: isHard ? 12 : 11, color: "#4ecca3", fontWeight: 600, marginBottom: isHard ? 8 : 4 }}>
                  {isHard ? "\uD83C\uDFAF CE QUE TON INTERVIEWEUR DIRA A SON DIRECTEUR" : "CE QUE TON INTERVIEWEUR DIRA A SON DIRECTEUR"}
                </div>
                <div style={{ fontSize: isHard ? 14 : 12, color: "#ccd6f6", lineHeight: 1.6, fontStyle: "italic" }}>"{computedAdvocacy}"</div>
                {isHard && (
                  <div style={{ background: "#4ecca3" + "15", borderRadius: 6, padding: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#4ecca3", lineHeight: 1.5 }}>
                      {seed.type === "cicatrice"
                        ? "Tu viens d'assumer un échec et de le transformer en preuve de maturité. 95% des candidats mentent ou esquivent. Tu viens de te separer d'eux."
                        : seed.brickCategory === "decision"
                        ? "Tu viens de documenter un arbitrage. C'est la preuve la plus rare en entretien. N'importe qui cite un chiffre. Personne ne montre comment il décide sous pression."
                        : "Tu viens de montrer comment tu alignes des gens qui ne veulent pas s'aligner. C'est le genre de preuve que les recruteurs n'arrivent pas à extraire en entretien. Tu l'as écrite."
                      }
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* CADRAGE INTERNE — what your N+1 loses if you leave (j_y_suis only) */}
          {computedInternalAdvocacy && trajectoryToggle === "j_y_suis" && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #3498db", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>CE QUE TON N+1 PERD SI TU PARS</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>{computedInternalAdvocacy}</div>
            </div>
          )}

          {/* AUDIT DE CONTRÔLE — bluff de l'expert */}
          {seed.controlRisk && (
            <div style={{ background: "#e94560" + "15", borderRadius: 8, padding: 10, borderLeft: "3px solid #ff9800", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>{"\u26A0\uFE0F"} AUDIT DE CONTRÔLE</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>{seed.controlRisk}</div>
              <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5, marginTop: 6 }}>Si tu te positionnes comme le remède et que le problème persiste, tu deviens la cible. Ta brique doit decrire ce que TU contrôles, pas ce que ton équipe a fait.</div>
            </div>
          )}

          {/* CAUCHEMAR DU DECIDEUR — le problème que tu resous */}
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
                  Verbes de processus détectés : <span style={{ color: "#e94560" }}>{verbData.foundProcess.join(", ")}</span>. Le recruteur lit : role secondaire.
                </div>
              )}
              {verbData.foundAvoidance.length > 0 && (
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>
                  Verbes d'evitement détectés : <span style={{ color: "#e94560" }}>{verbData.foundAvoidance.join(", ")}</span>. Le recruteur lit : pas d'engagement.
                </div>
              )}
              {verbData.foundResult.length > 0 && (
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>
                  Verbes de résultat : <span style={{ color: "#4ecca3" }}>{verbData.foundResult.join(", ")}</span>. Le recruteur lit : acteur.
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
              <div style={{ fontSize: 11, color: elast ? elast.color : "#8892b0", fontWeight: 600, marginBottom: 4 }}>ÉLASTICITÉ DU MARCHÉ</div>
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
              <div style={{ fontSize: 11, color: "#95a5a6", fontWeight: 600, marginBottom: 4 }}>APERÇU — VERSION TRANSPORTABLE</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>"{seed.anonymizedText}"</div>
              <div style={{ fontSize: 11, color: "#495670", marginTop: 6 }}>Tu pourras vérifier et éditer cette version avant archivage. L'IA détecte les éléments sensibles. C'est toi qui valides.</div>
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
            var forgedSeed = Object.assign({}, seed, { generatedText: effectiveText, advocacyText: generateAdvocacyText(effectiveText, seed.brickCategory, seed.type, seed.nightmareText), internalAdvocacy: generateInternalAdvocacy(effectiveText, seed.brickCategory, seed.type, seed.elasticity) });
            if (seed.anonymizedText) { setAnonEdit(seed.anonymizedText); setPhase("anon_review"); }
            else { onForge(forgedSeed); setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); setVerbDismissed(false); setCicOverride(null); }
          }} style={{
            flex: 1, padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}>Archiver</button>
          <button onClick={function() { setEditText(effectiveText); setPhase("correcting"); }} style={{
            flex: 1, padding: 14, background: "#0f3460", color: "#9b59b6", border: "2px solid #9b59b6", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Retoucher</button>
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
        setConfrontMsg("Ta réponse est celle de 90% des professionnels de ton secteur. C'est un recit dominant, pas une prise de position. Un recruteur qui lit ca ne retient rien. Creuse. Qu'est-ce que ton expérience t'a montre que les articles de blog ne disent pas ?");
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
      setConfrontMsg("Tu blames le produit ou le prix. Quel etait le budget reel du prospect ? Quelle étape de qualification as-tu sautee ? C'est là que le deal s'est perdu.");
      setPhase("confront");
      return;
    }
    // Externalization detection
    if (seed.externalizeDetection && hasExternalization(text)) {
      setConfrontMsg("Tu n'as cite aucun facteur sous ton contrôle. Le recruteur entend : cette personne ne prend pas de responsabilite. Trouve ta part dans cet échec.");
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
  var categoryLabels = { chiffre: "CHIFFRE", decision: "DÉCISION", influence: "INFLUENCE" };
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
        {canSubmit ? (seed.type === "take" ? "L'IA analyse la profondeur de ta position" : seed.type === "unfair_advantage" ? "L'IA croise avec tes briques" : seed.brickCategory === "chiffre" && seed.type === "preuve" && !hasNumbers(answer) ? "Attention : pas de chiffre détecté" : "L'IA structure ta réponse") : "Remplis au moins 2 champs"}
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
            Extraites de tes réponses. Ces piliers viennent de toi. L'IA les a structures, pas inventes. Ils pesent plus lourd que les piliers générés.
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
            : "J'ai croise tes briques et ton secteur. Tu n'as pas formule de prise de position pendant l'interrogatoire. Ces piliers sont générés. Ils servent de base, mais ils ne viennent pas de toi. La Forge suivante te posera la question."
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
            Tu n'as formule aucune these contrariante sur ton secteur. Les piliers ci-dessus sont générés. Ils fonctionnent, mais ils ne te separent pas des autres candidats qui utilisent l'IA pour ecrire. Au prochain Rendez-vous, le système te reposera la question.
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
    if (extCount > recCount) return { verdict: "externalisation", color: "#ff9800", msg: "Tu as externalise. Le recruteur lit : cette personne subit les événements au lieu de les cadrer." };
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
            Les questions qui te feront tomber si tu n'es pas préparé. Avec des surprises.
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
      enterprise_ae: "Quels sont les enjeux de croissance principaux de votre équipe cette année ?",
      head_of_growth: "Quel canal d'acquisition vous preoccupe le plus en ce moment ?",
      strategic_csm: "Quel est le segment de clients qui généré le plus de friction aujourd'hui ?",
      senior_pm: "Quel est l'arbitrage produit le plus difficile que l'équipe n'a pas encore tranche ?",
      ai_architect: "Quel cas d'usage IA est bloque depuis le plus longtemps ?",
      engineering_manager: "Quel est le frein technique que l'équipe n'arrive pas a debloquer ?",
      management_consultant: "Quel est le problème qui a declenche ce recrutement ?",
      strategy_associate: "Quelle decision stratégique attend des données que personne ne produit ?",
      operations_manager: "Quelle friction inter-équipes consomme le plus de temps ?",
      fractional_coo: "Qu'est-ce que le CEO ne devrait plus faire lui-même dans 6 mois ?",
    };
    var roleDiscovery = discoveryQs[targetRoleId] || "Avant que je deroule mon parcours, quels sont vos enjeux cles sur ce poste ?";
    var altDiscovery = "Quelle partie de mon parcours voulez-vous que je developpe en priorite ?";
    var triggerDiscovery = "Qu'est-ce qui a déclenché ce recrutement ?";
    var antiProfileDiscovery = "Quel profil ne voulez-vous surtout pas reproduire ?";
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #3498db" }}>
          <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>COACHING PRE-DUEL</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#ccd6f6", marginBottom: 12 }}>Avant de repondre, pose une question.</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.7, marginBottom: 16 }}>
            Le piège le plus courant des profils seniors : le monologue. Tu racontes pendant 6 minutes. Le recruteur décroche après 90 secondes. Pas parce que tu es mauvais. Parce que tu n'as pas calibré.
          </div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.7, marginBottom: 16 }}>
            Avant chaque réponse, pose une de ces questions au recruteur. Il te donnera la cible. Tu réponds avec la brique qui matche. Chaque mot que tu prononces est pertinent parce qu'il l'a demande.
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>QUESTION DISCOVERY (adaptée à ton rôle)</div>
            <div style={{ fontSize: 14, color: "#ccd6f6", fontStyle: "italic", lineHeight: 1.5 }}>"{roleDiscovery}"</div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>DÉCLENCHEUR (révèle l'urgence du décideur)</div>
            <div style={{ fontSize: 14, color: "#ccd6f6", fontStyle: "italic", lineHeight: 1.5 }}>"{triggerDiscovery}"</div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>CICATRICE RECRUTEUR (révèle le profil à éviter)</div>
            <div style={{ fontSize: 14, color: "#ccd6f6", fontStyle: "italic", lineHeight: 1.5 }}>"{antiProfileDiscovery}"</div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>CADRAGE D'ATTENTION</div>
            <div style={{ fontSize: 14, color: "#ccd6f6", fontStyle: "italic", lineHeight: 1.5 }}>"{altDiscovery}"</div>
          </div>
          <div style={{ fontSize: 12, color: "#495670", lineHeight: 1.5, marginTop: 12 }}>
            Un vrai senior n'est pas celui qui en dit le plus. C'est celui qui ecoute et cible. Il articule son vecu autour du problème de l'autre.
          </div>
          <div style={{ background: "#9b59b6" + "15", borderRadius: 8, padding: 12, marginTop: 12, border: "1px solid #9b59b6" + "33" }}>
            <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600, marginBottom: 4 }}>IN MEDIA RES</div>
            <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7 }}>
              Quand le recruteur te pose une question, ta premiere phrase est un chiffre ou un resultat. Le contexte vient apres. Pas avant. "J'ai reduit le cycle de 14 a 9 jours" puis le comment. Jamais l'inverse.
            </div>
          </div>
          <div style={{ background: "#e94560" + "15", borderRadius: 8, padding: 12, marginTop: 12, border: "1px solid #e94560" + "33" }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>LE SILENCE</div>
            <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7 }}>
              Le recruteur va se taire après ta réponse. Ne remplis pas le silence. Laisse-le revenir vers toi. Celui qui parle en premier après un silence perd le cadre de la négociation.
            </div>
          </div>
        </div>
        <button onClick={function() { setPhase("pitch_chrono"); }} style={{
          width: "100%", padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)",
          color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>J'ai compris. Lancer le Duel {"\u2192"}</button>
      </div>
    );
  }

  if (phase === "pitch_chrono") {
    var pitchTake = bricks.find(function(b) { return b.brickType === "take" && b.status === "validated"; });
    var pitchBricks = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; }).slice(0, 3);
    var pitchDiscoveryQ = pitchBricks.length > 0 && pitchBricks[0].discoveryQuestions && pitchBricks[0].discoveryQuestions.length > 0 ? pitchBricks[0].discoveryQuestions[0] : "Quel est le probleme que ce poste resout en priorite ?";

    var chronoBlocs = [
      { label: "CAUCHEMAR", time: "0-15s", color: "#e94560", content: pitchTake ? pitchTake.text : "Definis ton Take dans les Piliers.", hint: "Ouvre sur le probleme du decideur. Pas sur toi." },
      { label: "PREUVE 1", time: "15-30s", color: "#4ecca3", content: pitchBricks[0] ? pitchBricks[0].text : "Brique manquante.", hint: "Un chiffre. Un contexte. Un resultat." },
      { label: "PREUVE 2", time: "30-45s", color: "#4ecca3", content: pitchBricks[1] ? pitchBricks[1].text : "Brique manquante.", hint: "Preuve complementaire. Autre angle." },
      { label: "METHODE", time: "45-70s", color: "#3498db", content: pitchBricks[2] ? pitchBricks[2].text : "Comment tu transfères ici.", hint: "Ce que tu feras chez eux. Pas ce que tu as fait ailleurs." },
      { label: "QUESTION", time: "70-90s", color: "#ff9800", content: pitchDiscoveryQ, hint: "Tu reprends le cadre. Le recruteur parle." },
    ];

    // Pitch interruption state
    var pitchAnswerState = useState("");
    var pitchAnswer = pitchAnswerState[0];
    var setPitchAnswer = pitchAnswerState[1];
    var pitchInterruptedState = useState(false);
    var pitchInterrupted = pitchInterruptedState[0];
    var setPitchInterrupted = pitchInterruptedState[1];
    var pitchInterruptResponseState = useState("");
    var pitchInterruptResponse = pitchInterruptResponseState[0];
    var setPitchInterruptResponse = pitchInterruptResponseState[1];

    var pitchInterruptions = [
      "Stop. Le recruteur vous coupe : 'C'etait un effort d'equipe, non ? Quelle etait votre contribution individuelle ?'",
      "Stop. Le recruteur vous coupe : 'Ce chiffre est impressionnant. Mais c'est aussi le contexte qui aidait, non ?'",
      "Stop. Le recruteur vous coupe : 'Attendez. Comment vous savez que c'est reproductible ici ?'",
      "Stop. Le recruteur vous coupe : 'Votre predecesseur avait lance le chantier. Quel est votre merite personnel ?'",
      "Stop. Le recruteur vous coupe : 'On a eu 200 candidatures. En une phrase : pourquoi vous ?'",
    ];
    var selectedInterruption = pitchInterruptions[Math.abs(hashCode(ctx.company + ctx.role + "pitchint")) % pitchInterruptions.length];

    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #9b59b6" }}>
          <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>PITCH 90 SECONDES — CHRONO</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.7, marginBottom: 16 }}>
            Pas de texte a reciter. Une structure a suivre. 5 blocs. 90 secondes. Le chrono donne le rythme. Tes mots viennent de toi.
          </div>

          {chronoBlocs.map(function(bloc, bi) {
            return (
              <div key={bi} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "stretch" }}>
                <div style={{ width: 60, flexShrink: 0, background: bloc.color + "22", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: bloc.color }}>{bloc.time}</div>
                </div>
                <div style={{ flex: 1, background: "#1a1a2e", borderRadius: 6, padding: 10, borderLeft: "3px solid " + bloc.color }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: bloc.color, marginBottom: 4 }}>{bloc.label}</div>
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 4 }}>
                    {bloc.content.length > 100 ? bloc.content.slice(0, 100) + "..." : bloc.content}
                  </div>
                  <div style={{ fontSize: 10, color: "#495670", fontStyle: "italic" }}>{bloc.hint}</div>
                </div>
              </div>
            );
          })}

          {!pitchInterrupted && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 8 }}>ENTRAINEMENT : prononce ton pitch a voix haute. Puis clique.</div>
              <button onClick={function() { setPitchInterrupted(true); }} style={{
                width: "100%", padding: 14, background: "#e94560" + "22", color: "#e94560",
                border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}>J'ai fait mon pitch {"\u2192"} Interruption</button>
            </div>
          )}

          {pitchInterrupted && !pitchInterruptResponse && (
            <div style={{ marginTop: 16, background: "#e94560" + "15", borderRadius: 10, padding: 16, border: "1px solid #e94560" + "33" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e94560", marginBottom: 10 }}>{selectedInterruption}</div>
              <div style={{ fontSize: 11, color: "#8892b0", marginBottom: 8 }}>Le recruteur ne te laisse pas finir. C'est fait expres. Reprends le cadre.</div>
              <textarea value={pitchAnswer} onChange={function(e) { setPitchAnswer(e.target.value); }}
                placeholder="Ta reponse a l'interruption..."
                style={{ width: "100%", minHeight: 70, padding: 12, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }}
              />
              <button onClick={function() {
                if (pitchAnswer.trim().length >= 10) {
                  setPitchInterruptResponse(pitchAnswer.trim());
                  setEntropyLog(function(prev) { return prev.concat([{
                    type: "pitch_interrupt", scenario: selectedInterruption,
                    answer: pitchAnswer.trim(), color: "#9b59b6",
                    diagnostic: "Le recruteur teste ta capacite a tenir ta ligne quand il te coupe. Ta reponse montre si tu reprends le cadre ou si tu le perds."
                  }]); });
                }
              }} disabled={pitchAnswer.trim().length < 10} style={{
                width: "100%", padding: 12,
                background: pitchAnswer.trim().length >= 10 ? "#e94560" : "#1a1a2e",
                color: pitchAnswer.trim().length >= 10 ? "#fff" : "#495670",
                border: "none", borderRadius: 8, cursor: pitchAnswer.trim().length >= 10 ? "pointer" : "default", fontWeight: 700, fontSize: 13,
              }}>Soumettre {"\u2192"}</button>
            </div>
          )}

          {pitchInterruptResponse && (
            <div style={{ marginTop: 16, background: "#4ecca3" + "15", borderRadius: 10, padding: 16, border: "1px solid #4ecca3" + "33" }}>
              <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 600, marginBottom: 6 }}>INTERRUPTION ENCAISSEE</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 8 }}>Ta reponse : "{pitchInterruptResponse}"</div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                En entretien reel, le recruteur coupe pour tester ta resistance. Le candidat qui panique reformule tout depuis le debut. Le candidat prepare repond a l'objection en une phrase et reprend son fil. Tu viens de t'entrainer a reprendre le fil.
              </div>
            </div>
          )}
        </div>

        {pitchInterruptResponse && (
          <button onClick={function() { setPhase("question"); }} style={{
            width: "100%", padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)",
            color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}>Passer aux questions du Duel {"\u2192"}</button>
        )}
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
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>Duel terminé.</div>
          <div style={{ fontSize: 13, color: "#8892b0" }}>{answered.length} réponse{answered.length > 1 ? "s" : ""} forgée{answered.length > 1 ? "s" : ""}. {entropyLog.length} événement{entropyLog.length > 1 ? "s" : ""} imprevu{entropyLog.length > 1 ? "s" : ""}.</div>
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
              var typeLabel = ev.type === "crisis" ? "\uD83D\uDEA8 Crise" : ev.type === "contradiction" ? "\u2694\uFE0F Contradiction" : ev.type === "pitch_interrupt" ? "\uD83C\uDFA4 Interruption Pitch" : "\uD83E\uDD10 Silence";
              return (
                <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: "3px solid " + ev.color }}>
                  <div style={{ fontSize: 11, color: ev.color, fontWeight: 600, marginBottom: 4 }}>{typeLabel}</div>
                  <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.4, marginBottom: 4 }}>{ev.scenario}</div>
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.4, marginBottom: 4 }}>Ta réponse : "{ev.answer}"</div>
                  <div style={{ fontSize: 11, color: ev.color, lineHeight: 1.4 }}>{ev.diagnostic}</div>
                </div>
              );
            })}
          </div>
        )}
        <button onClick={function() { onComplete(results); }} style={{
          width: "100%", marginTop: 16, padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)",
          color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>Terminer la Forge</button>
      </div>
    );
  }

  var q = questions[idx];

  if (phase === "analyzing") {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>{"\uD83E\uDDE0"}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>Confrontation brique vs réponse...</div>
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
          placeholder="Tu n'as pas préparé ça. Réponds."
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
            var diagMsg = defends ? "Tu as tenu ta position avec des faits. Le recruteur respecte la solidite." : nuances ? "Tu as nuance intelligemment. Le recruteur voit de la maturité." : folds ? "Tu as plie. Le recruteur lit : cette personne doute de ses propres résultats." : "Reponse lue. En entretien, la contradiction teste si tu crois a tes propres chiffres.";
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
            setEntropyLog(function(prev) { return prev.concat([{ type: "silence", scenario: "C'est tout ?", answer: "J'ai tenu ma position.", diagnostic: "Tu as tenu ta réponse. Conviction affichee. Le recruteur note : cette personne ne doute pas de ce qu'elle dit.", color: "#4ecca3" }]); });
            setSilenceUsed(true);
            setPhase("feedback");
          }} style={{
            flex: 1, padding: 14, background: "#0f3460", color: "#4ecca3",
            border: "2px solid #4ecca3", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Oui. C'est ma réponse.</button>
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
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Tu as choisi de completer. Le recruteur ecoute. Mais il a note que tu as doute de ta première réponse.</div>
        </div>
        <textarea value={silenceAnswer} onChange={function(e) { setSilenceAnswer(e.target.value); }}
          placeholder="Ce que tu ajoutes..."
          style={{ width: "100%", minHeight: 70, padding: 14, background: "#1a1a2e", border: "2px solid #ff9800", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }}
        />
        <button onClick={function() {
          if (silenceAnswer.trim().length < 5) return;
          var hasNewInfo = silenceAnswer.trim().split(/\s+/).length > 10;
          var diagMsg = hasNewInfo ? "Tu as ajoute du contenu substantiel. Le recruteur lit : cette personne approfondit sous pression. Positif." : "Tu as ajoute peu. Le recruteur lit : doute sur la première réponse, mais rien de neuf. Negatif.";
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
              enterprise_ae: "En poste, tu laisserais le client driver le deal. Le prospect decroche après 90 secondes.",
              head_of_growth: "En poste, tu noierais le board dans les metriques au lieu de montrer le levier.",
              strategic_csm: "En poste, ton QBR durerait 45 minutes au lieu de 15. Le client decroche.",
              senior_pm: "En poste, tu présenterais une roadmap sans hiérarchie. L'équipe ne sait pas par où commencer.",
              ai_architect: "En poste, tu expliquerais le modèle pendant 20 minutes. Le CPO veut le cas d'usage en 2.",
              engineering_manager: "En poste, ton équipe attendrait 3 minutes de contexte avant chaque decision.",
              management_consultant: "En poste, ton slide deck ferait 80 pages au lieu de 3.",
              strategy_associate: "En poste, ton memo serait un rapport. Le Comex veut une recommandation en 1 page.",
              operations_manager: "En poste, tes meetings dureraient le double. L'équipe perdrait confiance.",
              fractional_coo: "En poste, le CEO te demanderait de synthetiser et tu donnerais un audit.",
            };
            var mirror = roleMirrors[targetRoleId] || "En poste, tu prendrais trop de temps a arriver au point. Le décideur decroche.";
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
    if (wordCount > 80) warning = "Ta réponse fait " + wordCount + " mots. En entretien, tu perds ton interlocuteur après 60. Condense.";
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
        placeholder="Réponds comme en entretien."
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
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
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
          <div style={{ fontSize: 10, color: "#495670" }}>blindage</div>
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
          <div style={{ fontSize: 11, color: "#8892b0", marginTop: 6 }}>{elasticBricks.length} brique{elasticBricks.length > 1 ? "s" : ""} sur marche élastique</div>
        )}
      </div>

      {/* CAUCHEMARS */}
      <div style={sBox}>
        <button onClick={function() { toggle("cauchemars"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={sHead}>Cauchemars couverts</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>{coveredCount}/{getActiveCauchemars().length}</span>
          </div>
        </button>
        {coverage.map(function(c) {
          var cauch = getActiveCauchemars().find(function(cc) { return cc.id === c.id; });
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
                <div style={{ fontSize: 11, color: "#e94560", marginTop: 2 }}>Aucune brique ne couvre ce cauchemar. Le recruteur contrôlera cette zone.</div>
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
            <div style={{ fontSize: 10, color: "#8892b0", marginTop: 4 }}>Confirme par brique chiffre + signal collègues. Non-rattrapable par la formation.</div>
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
        Prochain Rendez-vous : {roleData ? roleData.cadenceLabel : "dans 30 jours"}. Ce rapport s'épaissit a chaque iteration.
      </div>

      {/* COPY — Option 2 structured text */}
      <CopyBtn text={copyText} label="Copier le rapport complet" />
    </div>
  );
}

/* ==============================
   DELIVERABLE COMPONENTS
   ============================== */

/* ==============================
   ITEM 1 — AUDIT AUTOMATIQUE DES LIVRABLES
   4 principes : non-générique, preuve, destinataire d'abord, calibrage canal
   ============================== */

function auditDeliverable(type, content, bricks, cauchemars) {
  if (!content || content.length < 30) return { score: 0, passed: [], failed: [] };
  var lower = content.toLowerCase();
  var validated = bricks ? bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; }) : [];
  var activeCauch = cauchemars || getActiveCauchemars();

  // A. NON-GÉNÉRIQUE — contient des éléments du Coffre-Fort
  var hasSpecific = validated.some(function(b) {
    if (!b.text || b.text.length < 15) return false;
    var fragment = b.text.toLowerCase().slice(0, 30);
    return lower.indexOf(fragment) !== -1;
  });
  var hasCvVersion = validated.some(function(b) {
    if (!b.cvVersion || b.cvVersion.length < 10) return false;
    return lower.indexOf(b.cvVersion.toLowerCase().slice(0, 25)) !== -1;
  });
  var nonGenerique = hasSpecific || hasCvVersion;

  // B. PREUVE — au moins 1 brique référencée avec données
  var hasProof = validated.some(function(b) {
    if (!b.text) return false;
    var brickLow = b.text.toLowerCase();
    return lower.indexOf(brickLow.slice(0, 20)) !== -1 && /\d/.test(b.text);
  });
  if (!hasProof) hasProof = hasCvVersion && validated.some(function(b) { return b.cvVersion && /\d/.test(b.cvVersion); });

  // C. DESTINATAIRE D'ABORD — première phrase orientée recruteur/cauchemar
  var firstLines = content.split("\n").filter(function(l) { return l.trim().length > 5; });
  var firstLine = (firstLines[0] || "").toLowerCase();
  var destFirst = firstLine.indexOf("vous") !== -1 || firstLine.indexOf("votre") !== -1 || firstLine.indexOf("[prénom]") !== -1 || firstLine.indexOf("[prenom]") !== -1;
  if (!destFirst) {
    destFirst = activeCauch.some(function(c) {
      return c.nightmareShort && firstLine.indexOf(c.nightmareShort.toLowerCase().slice(0, 15)) !== -1;
    });
  }
  // CV exception: header with role title counts as reader-oriented
  if (type === "cv") {
    var roleInFirst = firstLine.indexOf("enterprise") !== -1 || firstLine.indexOf("head") !== -1 || firstLine.indexOf("senior") !== -1 || firstLine.indexOf("manager") !== -1 || firstLine.indexOf("csm") !== -1 || firstLine.indexOf("consultant") !== -1;
    if (roleInFirst) destFirst = true;
  }

  // D. CALIBRAGE CANAL
  var calibreOk = false;
  if (type === "cv") {
    // 6 secondes scannable — lignes courtes, pas de pavés
    var lines = content.split("\n").filter(function(l) { return l.trim().length > 0; });
    var longLines = lines.filter(function(l) { return l.length > 150; });
    calibreOk = longLines.length <= 1 && content.length < 2000;
  } else if (type === "dm") {
    var lineCount = content.split("\n").filter(function(l) { return l.trim().length > 3; }).length;
    calibreOk = lineCount <= 5 && content.length < 400;
  } else if (type === "email") {
    var emailLines = content.split("\n").filter(function(l) { return l.trim().length > 3; }).length;
    calibreOk = emailLines <= 12 && content.length < 1200;
  } else if (type === "post") {
    calibreOk = content.length <= 1500 && !/^[\-\*•]\s/m.test(content);
  } else if (type === "bio") {
    calibreOk = content.length <= 500;
  } else {
    calibreOk = true;
  }

  var tests = [
    { id: "generique", label: "Non-générique", desc: "Contient des éléments du Coffre-Fort", passed: nonGenerique, fix: "Le livrable ne référence aucune brique. Il ressemble à un template." },
    { id: "preuve", label: "Preuve", desc: "Au moins 1 brique chiffrée", passed: hasProof, fix: "Aucune donnée chiffrée. Ajoute une brique avec un résultat mesurable." },
    { id: "destinataire", label: "Destinataire d'abord", desc: "Première phrase orientée recruteur", passed: destFirst, fix: "La première phrase parle de toi. Commence par le problème du recruteur." },
    { id: "calibrage", label: "Calibrage canal", desc: "Format adapté au support", passed: calibreOk, fix: type === "cv" ? "CV trop dense. Raccourcis les lignes pour un scan en 6 secondes." : type === "dm" ? "DM trop long. Maximum 3-4 lignes." : type === "email" ? "Email trop long. Maximum 10 lignes." : type === "post" ? "Post trop long ou contient des listes. Prose brute, max 1500 car." : "Format non calibré pour ce canal." },
  ];

  var passed = tests.filter(function(t) { return t.passed; });
  var failed = tests.filter(function(t) { return !t.passed; });
  return { score: passed.length, tests: tests, passed: passed, failed: failed };
}

function Deliverable({ emoji, title, content, lines, auditResult, onCorrect }) {
  var st = useState(false);
  var open = st[0];
  var setOpen = st[1];
  var rows = content.split("\n");
  var preview = rows.slice(0, lines || 3).join("\n");
  var hasMore = rows.length > (lines || 3);
  return (
    <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 10, border: "1px solid " + (auditResult ? (auditResult.score === 4 ? "#4ecca3" : auditResult.score >= 2 ? "#ff9800" : "#e94560") : "#16213e") }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>{title}</span>
          {auditResult && <span style={{ fontSize: 10, fontWeight: 700, color: auditResult.score === 4 ? "#4ecca3" : auditResult.score >= 2 ? "#ff9800" : "#e94560" }}>{auditResult.score}/4</span>}
        </div>
        <CopyBtn text={content} label={auditResult && auditResult.score < 4 ? "Copier quand même" : undefined} />
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
        }}>{open ? "\u25B2 Réduire" : "\u25BC Voir tout"}</button>
      )}
      {auditResult && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {auditResult.tests.map(function(t) {
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: t.passed ? "#4ecca3" : "#e94560" }}>{t.passed ? "\u2714" : "\u2718"}</span>
                  <span style={{ fontSize: 9, color: t.passed ? "#8892b0" : "#ccd6f6", fontWeight: t.passed ? 400 : 600 }}>{t.label}</span>
                </div>
              );
            })}
          </div>
          {auditResult.failed.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {auditResult.failed.map(function(f) {
                return <div key={f.id} style={{ fontSize: 10, color: "#e94560", lineHeight: 1.5 }}>{"\u26A0\uFE0F"} {f.fix}</div>;
              })}
            </div>
          )}
        </div>
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
        Tu as repéré un signal ? Levée de fonds, recrutement, départ d'un dirigeant, expansion. Colle-le ici. Le système croise avec ton Coffre-Fort et génère un script d'approche.
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
      >Générer le script d'approche</button>

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
            Ce script est généré depuis ton Coffre-Fort. Il cite tes briques les plus fortes et le cauchemar probable de l'entreprise. Ajuste le ton et envoie.
          </div>
        </div>
      )}
    </div>
  );
}

/* LINKEDIN COMMENT FIELD Component */
function CommentField({ bricks, vault, targetRoleId }) {
  var inputSt = useState("");
  var postInput = inputSt[0];
  var setPostInput = inputSt[1];
  var resultSt = useState(null);
  var result = resultSt[0];
  var setResult = resultSt[1];

  function handleGenerate() {
    if (postInput.trim().length < 20) return;
    var gen = generateLinkedInComment(postInput, bricks, vault, targetRoleId);
    setResult(gen);
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 10 }}>
        Colle un post LinkedIn. Le système vérifie 3 filtres avant de générer. Si le post ne passe pas, il te dit pourquoi.
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
      >Analyser + Générer</button>

      {result && result.filterResult && (
        <div style={{ marginTop: 12 }}>
          {/* 3 FILTRES */}
          <div style={{ background: "#0a192f", borderRadius: 10, padding: 12, marginBottom: 10, border: "1px solid " + result.filterResult.verdictColor + "44" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: result.filterResult.verdictColor, letterSpacing: 1 }}>VERDICT : {result.filterResult.verdict}</span>
              {result.topic && result.topic !== "general" && (
                <span style={{ fontSize: 9, color: "#8892b0", background: "#1a1a2e", padding: "2px 8px", borderRadius: 4 }}>Sujet : {result.topic}</span>
              )}
            </div>
            {result.filterResult.filters.map(function(f) {
              return (
                <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>{f.passed ? "\u2714\uFE0F" : "\u274C"}</span>
                  <div>
                    <div style={{ fontSize: 11, color: f.passed ? "#4ecca3" : "#e94560", fontWeight: 600 }}>{f.label}</div>
                    <div style={{ fontSize: 10, color: "#8892b0", lineHeight: 1.4 }}>{f.reason}</div>
                  </div>
                </div>
              );
            })}

            {/* PATTERNS TOXIQUES */}
            {result.filterResult.avoidPatterns.length > 0 && (
              <div style={{ background: "#e94560" + "15", borderRadius: 6, padding: 8, marginTop: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#e94560", letterSpacing: 1, marginBottom: 4 }}>POST À ÉVITER</div>
                {result.filterResult.avoidPatterns.map(function(p, i) {
                  return <div key={i} style={{ fontSize: 10, color: "#e94560", lineHeight: 1.4 }}>{p.label}</div>;
                })}
              </div>
            )}

            {/* TROU DETECTE */}
            {result.gap && result.gap.type !== "general" && (
              <div style={{ background: "#3498db" + "15", borderRadius: 6, padding: 8, marginTop: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#3498db", letterSpacing: 1, marginBottom: 4 }}>TROU DÉTECTÉ</div>
                <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600 }}>{result.gap.label}</div>
                <div style={{ fontSize: 10, color: "#8892b0", lineHeight: 1.4 }}>{result.gap.desc}</div>
              </div>
            )}
          </div>

          {/* LIKE RECOMMENDATION */}
          {result.likeAdvice && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 10, background: result.likeAdvice.color + "15", borderRadius: 6, border: "1px solid " + result.likeAdvice.color + "44" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: result.likeAdvice.color, letterSpacing: 1, flexShrink: 0 }}>{result.likeAdvice.action}</span>
              <span style={{ fontSize: 10, color: "#8892b0" }}>{result.likeAdvice.reason}</span>
            </div>
          )}

          {/* COMMENTAIRE GENERE (seulement si verdict COMMENTE) */}
          {result.comment && (
            <div style={{ background: "#0f3460", borderRadius: 10, padding: 14, borderLeft: "3px solid #4ecca3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, letterSpacing: 1 }}>COMMENTAIRE</span>
                <CopyBtn text={result.comment} label="Copier" />
              </div>
              <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7 }}>{result.comment}</div>
              <div style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginTop: 8 }}>
                <div style={{ fontSize: 10, color: "#495670", marginBottom: 2 }}>Brique injectée ({result.brickSource || "chiffre"})</div>
                <div style={{ fontSize: 10, color: "#8892b0", lineHeight: 1.4 }}>{result.brickUsed}</div>
                {result.pillarUsed && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 10, color: "#3498db", marginBottom: 1 }}>Pilier</div>
                    <div style={{ fontSize: 10, color: "#8892b0" }}>{result.pillarUsed}</div>
                  </div>
                )}
              </div>

              {/* AUDIT QUALITÉ COMMENTAIRE */}
              {result.commentAudit && (
                <div style={{ background: "#0a192f", borderRadius: 6, padding: 8, marginTop: 8, border: "1px solid " + result.commentAudit.verdictColor + "44" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: result.commentAudit.verdictColor, letterSpacing: 1 }}>QUALITÉ : {result.commentAudit.verdict} ({result.commentAudit.score}/{result.commentAudit.total})</span>
                  </div>
                  {result.commentAudit.tests.map(function(t) {
                    return (
                      <div key={t.name} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, flexShrink: 0 }}>{t.pass ? "\u2714\uFE0F" : "\u274C"}</span>
                        <div>
                          <span style={{ fontSize: 10, color: t.pass ? "#4ecca3" : "#e94560", fontWeight: 600 }}>{t.name}</span>
                          <span style={{ fontSize: 9, color: "#8892b0", marginLeft: 6 }}>{t.detail}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: 10, color: "#8892b0", marginTop: 8, lineHeight: 1.4 }}>
                Zéro chiffre dans le commentaire. La situation suffit. L'auteur voit quelqu'un qui a fait. Il clique sur ton profil. Ta bio donne les preuves en 6 secondes.
              </div>
            </div>
          )}

          {/* MESSAGE SI PASSE */}
          {!result.comment && result.filterResult.verdict === "PASSE" && (
            <div style={{ background: "#e94560" + "15", borderRadius: 10, padding: 14, border: "1px solid #e94560" + "44" }}>
              <div style={{ fontSize: 12, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>Passe ce post.</div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                Commenter ici gaspille ta crédibilité. Le filtre a détecté {result.filterResult.filters.filter(function(f) { return !f.passed; }).length} blocage{result.filterResult.filters.filter(function(f) { return !f.passed; }).length > 1 ? "s" : ""}. Cherche un post dans ton territoire avec un trou que tes briques comblent.
              </div>
            </div>
          )}
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
            Tes briques couvrent mieux {crossData.alternatives[0].elasticMatches} KPIs élastiques de {crossData.alternatives[0].role} que {crossData.currentElastic} de {crossData.currentRole}.
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
              <span style={{ fontSize: 11, color: "#4ecca3" }}>{crossData.currentElastic} KPI{crossData.currentElastic > 1 ? "s" : ""} élastique{crossData.currentElastic > 1 ? "s" : ""}</span>
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
                  <span style={{ fontSize: 11, color: "#4ecca3" }}>{alt.elasticMatches} KPI{alt.elasticMatches > 1 ? "s" : ""} élastique{alt.elasticMatches > 1 ? "s" : ""}</span>
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
                      : "Couverture supérieure a ton choix. Tes briques matchent ce terrain."
                    : "Terrain accessible. Tes briques couvrent une partie des KPIs élastiques de ce poste."
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
                      }}>Générer un script de transition</button>
                    )}
                    {tScripts[alt.roleId] && (
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginTop: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: "#3498db", fontWeight: 600 }}>SCRIPT OUTSIDER</span>
                          <CopyBtn text={tScripts[alt.roleId]} label="Copier" />
                        </div>
                        <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5, whiteSpace: "pre-line" }}>{tScripts[alt.roleId]}</div>
                        <div style={{ fontSize: 10, color: "#495670", marginTop: 6 }}>Ton downside : 30 min de préparation. Son downside : 30 min d'écoute. L'upside : un profil que le process RH aurait éliminé mais qui résout le problème.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5, marginTop: 8 }}>
            Ce croisement tourne a chaque Rendez-vous de Souverainete. Les briques que tu accumules en poste ouvrent progressivement de nouveaux terrains. Le système détecté quand tu es pret.
          </div>
        </div>
      )}
    </div>
  );
}

/* ==============================
   CARTE DU MARCHÉ — offres × cauchemars × briques × élasticité
   Montre où le marché tire (offres), où tu es armé (briques),
   et où se trouvent les trous.
   ============================== */

function MarketMap({ bricks, offersArray, targetRoleId }) {
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  if (!roleData) return null;

  var templates = CAUCHEMAR_TEMPLATES_BY_ROLE[targetRoleId] || [];
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });

  // Build map data: for each KPI, compute demand (offers) and supply (bricks)
  var mapData = roleData.kpis.map(function(kpi, idx) {
    var template = templates[idx] || null;

    // DEMAND: count offers that signal this cauchemar
    var offerHits = 0;
    var matchedOffers = [];
    if (template && offersArray && offersArray.length > 0) {
      offersArray.forEach(function(offer) {
        var lower = (offer.text || "").toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
        var hits = 0;
        template.kw.forEach(function(kw) { if (lower.indexOf(kw) !== -1) hits++; });
        if (hits > 0) { offerHits++; matchedOffers.push(offer.id); }
      });
    }

    // SUPPLY: count bricks covering this KPI
    var coveringBricks = validated.filter(function(b) {
      return b.kpi && kpi.name.toLowerCase().indexOf(b.kpi.toLowerCase().slice(0, 6)) !== -1;
    });

    // Also check broader text match
    if (coveringBricks.length === 0 && template) {
      coveringBricks = validated.filter(function(b) {
        var bLower = (b.text || "").toLowerCase();
        return template.kw.slice(0, 3).some(function(kw) { return bLower.indexOf(kw) !== -1; });
      });
    }

    // STATUS
    var status = "invisible"; // no demand, no supply
    if (offerHits > 0 && coveringBricks.length > 0) status = "arme"; // covered
    else if (offerHits > 0 && coveringBricks.length === 0) status = "trou"; // gap
    else if (offerHits === 0 && coveringBricks.length > 0) status = "reserve"; // ammo without demand

    return {
      kpi: kpi.name,
      elasticity: kpi.elasticity,
      why: kpi.why,
      cauchemar: template ? template.label : "",
      cost: template ? template.cost : [0, 0],
      offerHits: offerHits,
      brickCount: coveringBricks.length,
      status: status,
    };
  });

  // Sort: élastique first, then stable, then sous_pression
  var elastOrder = { "élastique": 0, "stable": 1, "sous_pression": 2 };
  mapData.sort(function(a, b) { return (elastOrder[a.elasticity] || 0) - (elastOrder[b.elasticity] || 0); });

  var statusColors = {
    arme: "#4ecca3",
    trou: "#e94560",
    reserve: "#3498db",
    invisible: "#495670",
  };
  var statusLabels = {
    arme: "ARMÉ",
    trou: "TROU",
    reserve: "RÉSERVE",
    invisible: "—",
  };
  var elastColors = {
    "élastique": "#4ecca3",
    "stable": "#ff9800",
    "sous_pression": "#e94560",
  };
  var elastLabels = {
    "élastique": "ÉLASTIQUE",
    "stable": "STABLE",
    "sous_pression": "SOUS PRESSION IA",
  };

  // Stats
  var trous = mapData.filter(function(d) { return d.status === "trou"; });
  var armes = mapData.filter(function(d) { return d.status === "arme"; });
  var elastiques = mapData.filter(function(d) { return d.elasticity === "élastique"; });
  var elastiquesArmes = elastiques.filter(function(d) { return d.status === "arme"; });

  return (
    <div style={{ marginTop: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>{"\uD83D\uDDFA\uFE0F"} CARTE DU MARCHÉ</div>

      {offersArray.length === 0 && (
        <div style={{ background: "#16213e", borderRadius: 10, padding: 14, color: "#8892b0", fontSize: 12, lineHeight: 1.5 }}>
          Colle des offres d'emploi pour activer la carte. L'outil croise les cauchemars détectés dans les offres avec tes briques validées.
        </div>
      )}

      {offersArray.length > 0 && (
        <div>
          {/* SUMMARY BAR */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, background: "#4ecca3" + "22", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#4ecca3" }}>{armes.length}</div>
              <div style={{ fontSize: 9, color: "#4ecca3" }}>ARMÉS</div>
            </div>
            <div style={{ flex: 1, background: "#e94560" + "22", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#e94560" }}>{trous.length}</div>
              <div style={{ fontSize: 9, color: "#e94560" }}>TROUS</div>
            </div>
            <div style={{ flex: 1, background: "#ff9800" + "22", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#ff9800" }}>{elastiquesArmes.length}/{elastiques.length}</div>
              <div style={{ fontSize: 9, color: "#ff9800" }}>ÉLASTIQUES COUVERTS</div>
            </div>
          </div>

          {/* MAP GRID */}
          {mapData.map(function(d, i) {
            var sc = statusColors[d.status];
            var ec = elastColors[d.elasticity] || "#495670";
            return (
              <div key={i} style={{
                background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 6,
                borderLeft: "4px solid " + sc,
                opacity: d.status === "invisible" ? 0.5 : 1,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 8, color: ec, background: ec + "22", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{elastLabels[d.elasticity] || d.elasticity}</span>
                      <span style={{ fontSize: 8, color: sc, background: sc + "22", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{statusLabels[d.status]}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, lineHeight: 1.4 }}>{d.kpi}</div>
                    {d.cauchemar && <div style={{ fontSize: 10, color: "#8892b0", marginTop: 2 }}>{d.cauchemar}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 10, color: d.offerHits > 0 ? "#ff9800" : "#495670" }}>
                      {d.offerHits > 0 ? d.offerHits + " offre" + (d.offerHits > 1 ? "s" : "") : "—"}
                    </div>
                    <div style={{ fontSize: 10, color: d.brickCount > 0 ? "#4ecca3" : "#495670" }}>
                      {d.brickCount > 0 ? d.brickCount + " brique" + (d.brickCount > 1 ? "s" : "") : "—"}
                    </div>
                    {d.cost[1] > 0 && <div style={{ fontSize: 9, color: "#495670" }}>{formatCost(d.cost[0])}-{formatCost(d.cost[1])}/an</div>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* DIAGNOSTIC */}
          {trous.length > 0 && (
            <div style={{ background: "#e94560" + "15", borderRadius: 10, padding: 12, marginTop: 12, border: "1px solid #e94560" + "44" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#e94560", letterSpacing: 1, marginBottom: 6 }}>TROUS — le marché demande, tu n'as pas de preuve</div>
              {trous.map(function(t, i) {
                var priorityTag = t.elasticity === "élastique" ? "URGENT" : "À TRAITER";
                var priorityColor = t.elasticity === "élastique" ? "#e94560" : "#ff9800";
                return (
                  <div key={i} style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 4 }}>
                    <span style={{ fontSize: 8, color: priorityColor, background: priorityColor + "22", padding: "1px 4px", borderRadius: 3, fontWeight: 700, marginRight: 6 }}>{priorityTag}</span>
                    {t.kpi} — {t.offerHits} offre{t.offerHits > 1 ? "s" : ""} signal{t.offerHits > 1 ? "ent" : "e"} ce cauchemar. Forge une brique.
                  </div>
                );
              })}
            </div>
          )}

          {trous.length === 0 && armes.length > 0 && (
            <div style={{ background: "#4ecca3" + "15", borderRadius: 10, padding: 12, marginTop: 12, border: "1px solid #4ecca3" + "44" }}>
              <div style={{ fontSize: 11, color: "#4ecca3", lineHeight: 1.5 }}>Zéro trou. Chaque cauchemar détecté dans tes offres est couvert par au moins une brique.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EndScreen({ vault, setVault, bricks, duelResults, maturity, targetRoleId, nightmareCosts, trajectoryToggle, offersArray }) {
  var tabSt = useState("arsenal");
  var tab = tabSt[0];
  var setTab = tabSt[1];
  var phaseSt = useState("recherche");
  var capturePhase = phaseSt[0];
  var setCapturePhase = phaseSt[1];
  var brickViewSt = useState({});
  var brickViews = brickViewSt[0];
  var setBrickViews = brickViewSt[1];
  function setBrickView(brickId, view) {
    setBrickViews(function(prev) { var next = Object.assign({}, prev); next[brickId] = view; return next; });
  }
  var scriptTabSt = useState("email");
  var scriptTab = scriptTabSt[0];
  var setScriptTab = scriptTabSt[1];
  var defaultSection = trajectoryToggle === "j_y_suis" ? "linkedin" : "scripts";
  var arsenalSectionSt = useState(defaultSection);
  var arsenalSection = arsenalSectionSt[0];
  var setArsenalSection = arsenalSectionSt[1];
  function toggleArsenalSection(id) { setArsenalSection(arsenalSection === id ? null : id); }

  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var missions = bricks.filter(function(b) { return b.type === "mission"; });
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  var decisions = validated.filter(function(b) { return b.brickCategory === "decision"; });
  var influences = validated.filter(function(b) { return b.brickCategory === "influence"; });
  var duelAnswered = duelResults.filter(function(r) { return r.answer; });
  var duelFailles = duelResults.filter(function(r) { return !r.answer; });

  // Coût de l'Incompétence Percue
  var kpiGaps = [];
  if (validated.length < 7) kpiGaps.push({ kpi: "Briques de preuve", msg: "Tu es muet sur " + (7 - validated.length) + " preuves. Le recruteur contrôlera cette partie de la négociation." });
  if (duelFailles.length > 0) kpiGaps.push({ kpi: "Failles de combat", msg: "Tu as " + duelFailles.length + " faille" + (duelFailles.length > 1 ? "s" : "") + " ouvertes. Le recruteur va tomber dessus." });
  if (decisions.length === 0) kpiGaps.push({ kpi: "Aucune brique decision", msg: "Tu n'as documente aucun arbitrage. Le recruteur ne sait pas si tu sais trancher." });
  if (influences.length === 0) kpiGaps.push({ kpi: "Aucune brique influence", msg: "Tu n'as documente aucun alignement. Le recruteur ne sait pas si tu sais naviguer la politique interne." });

  // Measurement hygiene diagnostic
  var totalAnswered = validated.length + missions.length;
  var missionRatio = totalAnswered > 0 ? Math.round((missions.length / totalAnswered) * 100) : 0;
  var measurementDiag = null;
  if (missions.length === 0 && validated.length >= 5) {
    measurementDiag = { level: "fort", color: "#4ecca3", title: "Hygiène de mesure : forte", msg: "Tu as répondu à chaque question avec un chiffre. Tu mesures ce que tu fais. C'est rare. Le recruteur verra un professionnel qui ne négocie pas avec des impressions." };
  } else if (missions.length >= 1 && missions.length <= 2) {
    measurementDiag = { level: "moyen", color: "#ff9800", title: "Hygiène de mesure : moyenne", msg: missions.length + " question" + (missions.length > 1 ? "s" : "") + " sans chiffre sur " + totalAnswered + ". Tu mesures une partie de ton impact. Les missions te donnent les étapes pour récupérer le reste. Chaque mission complétée installe le réflexe de mesurer." };
  } else if (missions.length >= 3) {
    measurementDiag = { level: "faible", color: "#e94560", title: "Hygiène de mesure : absente", msg: missions.length + " questions sur " + totalAnswered + " sans chiffre (" + missionRatio + "%). Ce n'est pas un problème de mémoire. C'est un mode de fonctionnement : tu opères sans mesurer l'impact de ce que tu fais. Chaque trimestre sans tableau de bord est un trimestre de négociation perdu. Les missions ne sont pas des corvées. Ce sont les premiers pas vers un réflexe qui change tout." };
  }
  if (missions.length > 0) {
    kpiGaps.push({ kpi: "Deconnexion action-mesure", msg: missions.length + " mission" + (missions.length > 1 ? "s" : "") + " en attente. " + missionRatio + "% de tes réponses n'ont pas de preuve. Le professionnel qui mesure fixe son prix. Celui qui ne mesure pas accepte celui qu'on lui donne." });
  }
  var leveragePct = Math.round((validated.length / 9) * 100);
  leveragePct = Math.min(leveragePct, 100);

  // Elasticity summary
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });

  var capturePings = {
    recherche: [
      { month: "Janvier", text: "Tu as fini ton Q4. Quel est le chiffre final du pipeline ? Quel obstacle as-tu brise ?" },
      { month: "Février", text: "Quelle compétence as-tu utilisee ce mois-ci qui n'existait pas dans ta fiche de poste il y a un an ?" },
      { month: "Mars", text: "Quel indicateur as-tu suivi ce mois ? Quel chiffre a bougé ? Si la réponse est 'aucun', tu opères dans le noir." },
    ],
    en_poste: [
      { month: "Janvier", text: "Tu viens de finir un projet. Quel impact mesurable ? Quel feedback de ton N+1 ?" },
      { month: "Février", text: "Tu as résolu un problème interne. Quel indicateur a bougé ? De combien ? Nouvelle brique." },
      { month: "Mars", text: "Ouvre ton tableau de bord. Quel chiffre a change depuis le mois dernier grace a toi ? Si tu n'as pas de tableau de bord, c'est le premier problème a résoudre." },
    ],
    négociation: [
      { month: "Janvier", text: "Tu prépares ton entretien annuel. Quelles briques mobiliser pour justifier +15% ?" },
      { month: "Février", text: "Tu vises une promotion. L'IA identifie les 2 briques manquantes pour le niveau supérieur." },
      { month: "Mars", text: "Combien de tes réalisations du trimestre as-tu documentées avec un chiffre ? Ce que tu n'as pas mesure, tu ne le négocieras pas." },
    ],
    freelance: [
      { month: "Janvier", text: "Quelles sont les 3 decisions les plus couteuses que tu as prises ce mois pour ton client ? Ton rapport de valeur en depend." },
      { month: "Février", text: "Ton client pense que 'tout va bien' parce que tu fais bien ton job. Quelles catastrophes as-tu évitées ce mois ? L'IA génère ton rapport de valeur." },
      { month: "Mars", text: "Quel indicateur as-tu fait bouger ce mois chez ton client ? Mets le chiffre dans ton rapport. Pas de chiffre, pas de justification d'honoraires." },
    ],
  };
  var pings = capturePings[capturePhase] || capturePings.recherche;


  // ========== ARSENAL SECTIONS (defined once, rendered in trajectory-specific order) ==========
  var sectionScripts = (
    <div>
          <button onClick={function() { toggleArsenalSection("scripts"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "scripts" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "scripts" ? "1px solid #e94560" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "scripts" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "scripts" ? "#e94560" : "#8892b0" }}>{"\uD83C\uDFAF"} Scripts de contact{trajectoryToggle !== "j_y_suis" ? " " : ""}</span>
            {trajectoryToggle !== "j_y_suis" && <span style={{ fontSize: 8, color: "#e94560", background: "#e94560" + "22", padding: "2px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: 1 }}>PRIORITE</span>}
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "scripts" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "scripts" && (function() {
            var scripts = generateContactScripts(bricks, targetRoleId);
            if (!scripts) return <Deliverable emoji={"\uD83C\uDFAF"} title="Script de contact" content="[Valide des briques pour générer les scripts.]" lines={2} />;
            var variants = { email: scripts.email, dm: scripts.dm, n1: scripts.n1, rh: scripts.rh };
            var currentText = variants[scriptTab] || scripts.email;
            var currentScore = scoreContactScript(currentText, bricks);
            var diltsP = analyzeDiltsProgression(currentText);
            var openD = getDiltsLabel(diltsP.opens);
            var closeD = getDiltsLabel(diltsP.closes);
            var channelInfo = SCRIPT_CHANNELS.find(function(c) { return c.id === scriptTab; }) || SCRIPT_CHANNELS[0];
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>{"\uD83C\uDFAF"} SCRIPTS DE CONTACT — 4 VARIANTES</div>
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                  {SCRIPT_CHANNELS.map(function(ch) {
                    var active = scriptTab === ch.id;
                    var chScore = scoreContactScript(variants[ch.id] || "", bricks);
                    return (
                      <button key={ch.id} onClick={function() { setScriptTab(ch.id); }} style={{
                        flex: 1, padding: "8px 4px", fontSize: 10, fontWeight: 600,
                        background: active ? "#e94560" : "#1a1a2e",
                        color: active ? "#fff" : "#8892b0",
                        border: "none", borderRadius: 6, cursor: "pointer", textAlign: "center",
                      }}>
                        <div>{ch.icon} {ch.label}</div>
                        <div style={{ fontSize: 9, marginTop: 2, color: active ? "#fff" : (chScore.score >= 8 ? "#4ecca3" : chScore.score >= 5 ? "#ff9800" : "#e94560") }}>{chScore.score}/10</div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6" }}>{channelInfo.icon} {channelInfo.label}</span>
                    <CopyBtn text={currentText} label="Copier" />
                  </div>
                  <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-line", marginBottom: 10 }}>{currentText}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, color: openD.color, background: openD.color + "22", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>Registre {diltsP.opens} — {openD.name}</span>
                    <span style={{ fontSize: 9, color: "#495670" }}>{"\u2192"}</span>
                    <span style={{ fontSize: 9, color: closeD.color, background: closeD.color + "22", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>Registre {diltsP.closes} — {closeD.name}</span>
                    {diltsP.progression > 0 && <span style={{ fontSize: 9, color: "#4ecca3" }}>+{diltsP.progression}</span>}
                    {diltsP.progression <= 0 && <span style={{ fontSize: 9, color: "#e94560" }}>{"\u26A0\uFE0F"}</span>}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: currentScore.score >= 8 ? "#4ecca3" : currentScore.score >= 5 ? "#ff9800" : "#e94560", marginBottom: 6 }}>Score : {currentScore.score}/10 ({currentScore.passedCount}/6 tests)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {currentScore.tests.map(function(t) {
                      return (
                        <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <span style={{ fontSize: 10, color: t.passed ? "#4ecca3" : "#e94560", flexShrink: 0 }}>{t.passed ? "\u2714" : "\u2718"}</span>
                          <div>
                            <span style={{ fontSize: 10, color: t.passed ? "#8892b0" : "#ccd6f6", fontWeight: 600 }}>{t.label}</span>
                            {!t.passed && <span style={{ fontSize: 10, color: "#e94560", marginLeft: 6 }}>{t.fix}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>{"\uD83D\uDCA1"} INSTRUCTION</div>
                  <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>{channelInfo.instruction}</div>
                </div>
              </div>
            );
          })()}

    </div>
  );
  var sectionBioLK = (
    <div>
          <button onClick={function() { toggleArsenalSection("bio"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "bio" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "bio" ? "1px solid #e94560" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "bio" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "bio" ? "#e94560" : "#8892b0" }}>{"\uD83D\uDCDD"} Bio LinkedIn</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "bio" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "bio" && (
            <div style={{ marginBottom: 12 }}>
              {(function() {
                var bioContent = generateBio(bricks, vault, trajectoryToggle);
                var bioAudit = auditDeliverable("bio", bioContent, bricks);
                return <Deliverable emoji={"\uD83D\uDCDD"} title="Bio LinkedIn" content={bioContent} lines={3} auditResult={bioAudit} />;
              })()}
            </div>
          )}

    </div>
  );
  var sectionCV = (
    <div>
          <button onClick={function() { toggleArsenalSection("cv"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "cv" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "cv" ? "1px solid #e94560" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "cv" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "cv" ? "#e94560" : "#8892b0" }}>{"\uD83D\uDCC4"} CV + Carte de march\u00e9</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "cv" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "cv" && (
            <div style={{ marginBottom: 12 }}>
              {(function() {
                var cvContent = generateCV(bricks, targetRoleId, trajectoryToggle);
                var cvAudit = auditDeliverable("cv", cvContent, bricks);
                return <Deliverable emoji={"\uD83D\uDCC4"} title="CV r\u00e9\u00e9crit" content={cvContent} lines={4} auditResult={cvAudit} />;
              })()}
              <ImpactReportPanel bricks={bricks} vault={vault} targetRoleId={targetRoleId} trajectoryToggle={trajectoryToggle} />
              <MarketMap bricks={bricks} offersArray={offersArray} targetRoleId={targetRoleId} />
            </div>
          )}

    </div>
  );
  var sectionCombat = (
    <div>
          <button onClick={function() { toggleArsenalSection("combat"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "combat" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "combat" ? "1px solid #e94560" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "combat" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "combat" ? "#e94560" : "#8892b0" }}>{"\uD83D\uDEE1\uFE0F"} Combat ({duelAnswered.length} reponses, {duelFailles.length} failles)</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "combat" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "combat" && (
            <div style={{ marginBottom: 12 }}>

          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>PRISES DE POSITION</div>
          {(function() {
            var positions = generatePositions(bricks, vault);
            if (positions.length === 0) return (
              <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, borderLeft: "3px solid #495670" }}>
                <div style={{ fontSize: 12, color: "#495670" }}>Aucune prise de position générée. Valide des piliers et des briques d'abord.</div>
              </div>
            );
            return positions.map(function(p, i) { return <PositionCard key={i} pos={p} idx={i} />; });
          })()}

          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginTop: 20, marginBottom: 12 }}>RÉPONSES DE COMBAT ({duelAnswered.length})</div>
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
                  Questions calibrées sur tes briques les plus fortes. Tu ne poses pas des questions de curiosite. Tu poses des questions que tu es le seul a avoir la crédibilité de poser.
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

            </div>
          )}

    </div>
  );
  var sectionLinkedin = (
    <div>
          <button onClick={function() { toggleArsenalSection("linkedin"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "linkedin" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "linkedin" ? "1px solid #3498db" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "linkedin" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "linkedin" ? "#3498db" : "#8892b0" }}>{"\uD83D\uDCE3"} LinkedIn (posts, commentaires, signaux){trajectoryToggle === "j_y_suis" ? " " : ""}</span>
            {trajectoryToggle === "j_y_suis" && <span style={{ fontSize: 8, color: "#3498db", background: "#3498db" + "22", padding: "2px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: 1 }}>PRIORITE</span>}
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "linkedin" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "linkedin" && (
            <div style={{ marginBottom: 12 }}>

          {/* ITERATION 4 — CHAMP "COLLE UN SIGNAL" */}
          <div style={{ marginTop: 0 }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>COLLE UN SIGNAL</div>
            <SignalField bricks={bricks} targetRoleId={targetRoleId} />
          </div>

          {/* CHAMP "COMMENTE UN POST" */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: "#3498db", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>COMMENTE UN POST LINKEDIN</div>
            <CommentField bricks={bricks} vault={vault} targetRoleId={targetRoleId} />
          </div>

          {/* POSTS LINKEDIN GENERES */}
          {(function() {
            var posts = generateLinkedInPosts(bricks, vault, targetRoleId);
            if (posts.length === 0) return null;
            var seqAlert = checkDiltsSequence(posts);
            var dt = posts.diltsTarget || computeDiltsTarget(vault && vault.diltsHistory ? vault.diltsHistory : []);
            var targetInfo = getDiltsLabel(dt.targetLevel);
            var history = vault && vault.diltsHistory ? vault.diltsHistory : [];

            function recordDiltsPublish(diltsLevel) {
              var entry = { level: diltsLevel, date: new Date().toISOString() };
              setVault(function(prev) {
                var h = prev.diltsHistory ? prev.diltsHistory.slice() : [];
                h.push(entry);
                return Object.assign({}, prev, { diltsHistory: h });
              });
            }

            return (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>POSTS LINKEDIN GENERES ({posts.length})</div>

                {/* CALIBREUR DILTS */}
                <div style={{ background: "#0a192f", borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid " + targetInfo.color }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: targetInfo.color, letterSpacing: 1, marginBottom: 8 }}>CALIBRAGE DILTS — SEQUENCE</div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                    {DILTS_LEVELS.filter(function(d) { return d.level >= 2 && d.level <= 5; }).map(function(d) {
                      var postsAtLevel = history.filter(function(h) { return h.level === d.level; }).length;
                      var isTarget = d.level === dt.targetLevel;
                      var isCompleted = postsAtLevel >= 2;
                      var isPartial = postsAtLevel === 1;
                      return (
                        <div key={d.level} style={{ flex: 1, textAlign: "center" }}>
                          <div style={{
                            height: 6, borderRadius: 3, marginBottom: 4,
                            background: isCompleted ? d.color : isPartial ? d.color + "66" : "#1a1a2e",
                            border: isTarget ? "2px solid " + d.color : "1px solid #495670",
                          }}></div>
                          <div style={{ fontSize: 8, color: isTarget ? d.color : "#495670", fontWeight: isTarget ? 700 : 400 }}>{d.level}</div>
                          <div style={{ fontSize: 7, color: isTarget ? d.color : "#495670" }}>{d.name.slice(0, 5)}</div>
                          {postsAtLevel > 0 && <div style={{ fontSize: 8, color: d.color }}>{postsAtLevel}/2</div>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: targetInfo.color, lineHeight: 1.5 }}>
                    Cible : Registre {dt.targetLevel} — {targetInfo.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                    {dt.reason}
                  </div>
                  {history.length > 0 && (
                    <div style={{ fontSize: 10, color: "#495670", marginTop: 6 }}>{history.length} post{history.length > 1 ? "s" : ""} dans la séquence</div>
                  )}
                </div>

                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 12 }}>
                  Calibres sur Registre {dt.targetLevel}. Brique et cadrage sélectionnés pour pousser vers le niveau {targetInfo.name}.
                </div>
                {seqAlert && seqAlert.stagnant && (
                  <div style={{ background: "#ff9800" + "22", borderRadius: 8, padding: 10, marginBottom: 12, border: "1px solid #ff9800" }}>
                    <div style={{ fontSize: 11, color: "#ff9800", lineHeight: 1.5 }}>{"\u26A0\uFE0F"} {seqAlert.message}</div>
                  </div>
                )}
                {posts.map(function(post, i) {
                  var diltsInfo = getDiltsLabel(post.diltsLevel || 1);
                  var scoreColor = post.globalScore >= 7 ? "#4ecca3" : post.globalScore >= 5 ? "#ff9800" : "#e94560";
                  var onTarget = post.diltsLevel === dt.targetLevel;
                  return (
                    <div key={i} style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginBottom: 16, borderLeft: "3px solid " + (onTarget ? targetInfo.color : "#495670") }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 10, color: post.pillarSource === "take" ? "#3498db" : "#e94560", fontWeight: 700, letterSpacing: 1 }}>POST {i + 1}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>{post.globalScore}/10</span>
                          <span style={{ fontSize: 10, color: "#495670" }}>{post.charCount} car.</span>
                          {onTarget && <span style={{ fontSize: 9, color: targetInfo.color, background: targetInfo.color + "22", padding: "2px 6px", borderRadius: 4 }}>SUR CIBLE</span>}
                          {!onTarget && <span style={{ fontSize: 9, color: "#ff9800", background: "#ff980022", padding: "2px 6px", borderRadius: 4 }}>HORS CIBLE (Dilts {post.diltsLevel})</span>}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <CopyBtn text={post.text} label="Copier" />
                          <button onClick={function() { recordDiltsPublish(post.diltsLevel); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(post.text); }} style={{
                            padding: "5px 12px", background: "#4ecca3" + "22", color: "#4ecca3",
                            border: "1px solid #4ecca3", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11,
                          }}>{"\u2713"} Publie</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, color: diltsInfo.color, background: diltsInfo.color + "22", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>Dilts {post.diltsLevel} — {diltsInfo.name}</span>
                        <span style={{ fontSize: 9, color: post.hookScore >= 7 ? "#4ecca3" : post.hookScore >= 4 ? "#ff9800" : "#e94560", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>Hook {post.hookScore}/10</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-line", marginBottom: 10 }}>{post.text}</div>

                      {post.hookTests && (
                        <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#ff9800", marginBottom: 4 }}>ACCROCHE — 6 tests Marie Hook</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {post.hookTests.map(function(t) {
                              return <span key={t.id} style={{ fontSize: 9, color: t.passed ? "#4ecca3" : "#e94560" }}>{t.passed ? "\u2714" : "\u2718"} {t.label}</span>;
                            })}
                          </div>
                        </div>
                      )}

                      {post.bodyRetention && post.bodyRetention.issues.length > 0 && (
                        <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#ff9800", marginBottom: 4 }}>CORPS — rétention</div>
                          {post.bodyRetention.issues.map(function(issue, j) {
                            return <div key={j} style={{ fontSize: 10, color: "#e94560", lineHeight: 1.5 }}>{"\u26A0\uFE0F"} {issue}</div>;
                          })}
                        </div>
                      )}

                      {post.expertCritique && (
                        <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#9b59b6", marginBottom: 4 }}>EXPERT ÉCRITURE</div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                            {post.expertCritique.miroir.map(function(m, j) {
                              return <span key={"m" + j} style={{ fontSize: 9, color: m.passed ? "#4ecca3" : "#e94560" }}>{m.passed ? "\u2714" : "\u2718"} {m.label}</span>;
                            })}
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {post.expertCritique.luisEnrique.map(function(l, j) {
                              return <span key={"l" + j} style={{ fontSize: 9, color: l.passed ? "#4ecca3" : "#e94560" }}>{l.passed ? "\u2714" : "\u2718"} {l.label}</span>;
                            })}
                          </div>
                        </div>
                      )}

                      {post.firstComment && (
                        <div style={{ background: "#16213e", borderRadius: 8, padding: 10, marginBottom: 8, borderLeft: "2px solid #3498db" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#3498db" }}>PREMIER COMMENTAIRE</span>
                            <CopyBtn text={post.firstComment} label="Copier le commentaire" />
                          </div>
                          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{post.firstComment}</div>
                          <div style={{ fontSize: 9, color: "#495670", marginTop: 4 }}>Publie. Attends 30 secondes. Colle ton commentaire.</div>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, color: "#495670", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>Pilier : {post.pillar.length > 30 ? post.pillar.slice(0, 30) + "..." : post.pillar}</span>
                        <span style={{ fontSize: 9, color: "#495670", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>Brique : {post.brickUsed}</span>
                      </div>
                    </div>
                  );
                })}
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>{"\uD83D\uDCA1"} INSTRUCTION</div>
                  <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>Publie entre 7h30 et 8h30 en semaine. Réponds à tous les commentaires dans les 2 premières heures.</div>
                </div>
                <div style={{ fontSize: 10, color: "#495670", lineHeight: 1.5, marginTop: 8 }}>
                  Chaque Rendez-vous produit de nouvelles briques. De nouvelles briques produisent de nouveaux posts. L'abonnement alimente le flux.
                </div>
              </div>
            );
          })()}

            </div>
          )}

    </div>
  );
  var sectionLettre = (
    <div>
          <button onClick={function() { toggleArsenalSection("lettre"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "lettre" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "lettre" ? "1px solid #ff9800" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "lettre" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "lettre" ? "#ff9800" : "#8892b0" }}>{"\u2709\uFE0F"} Lettre de motivation</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "lettre" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "lettre" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, borderLeft: "3px solid #ff9800" }}>
                <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>ASSEMBLE. NE GENERE PAS.</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7, marginBottom: 16 }}>
                  52% des candidats utilisent l'IA pour leur lettre. Le résultat : des lettres identiques. Ton avantage : tu as des briques blindées. Assemble-les.
                </div>

                {(function() {
                  var cauchemarCoverage = computeCauchemarCoverageDetailed(bricks, nightmareCosts || {});
                  var topCauchemar = cauchemarCoverage.filter(function(c) { return c.covered && c.cost; }).sort(function(a, b) { return (b.cost.high || 0) - (a.cost.high || 0); })[0];
                  var topBrick = validated.length > 0 ? validated[0] : null;
                  var discoveryQ = topBrick && topBrick.discoveryQuestions && topBrick.discoveryQuestions.length > 0 ? topBrick.discoveryQuestions[0] : "Quel est le problème que ce poste résout en priorité ?";

                  return (
                    <div>
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#e94560", fontWeight: 700, marginBottom: 6 }}>PARAGRAPHE 1 — Le cauchemar du décideur</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                          {topCauchemar
                            ? "\"" + topCauchemar.label + " coûte entre " + (topCauchemar.cost.low ? (topCauchemar.cost.low / 1000).toFixed(0) + "K" : "?") + " et " + (topCauchemar.cost.high ? (topCauchemar.cost.high / 1000).toFixed(0) + "K" : "?") + " par an à une entreprise de votre taille.\""
                            : "Copie le cauchemar le plus coûteux depuis ta Carte des Cauchemars."
                          }
                        </div>
                        {topCauchemar && <CopyBtn text={topCauchemar.label + " coûte entre " + (topCauchemar.cost.low ? (topCauchemar.cost.low / 1000).toFixed(0) + "K" : "?") + " et " + (topCauchemar.cost.high ? (topCauchemar.cost.high / 1000).toFixed(0) + "K" : "?") + " par an à une entreprise de votre taille."} label="Copier" />}
                      </div>

                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, marginBottom: 6 }}>PARAGRAPHE 2 — Ta brique la plus forte</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                          {topBrick
                            ? "\"" + topBrick.text + "\""
                            : "Copie ta brique blindée la plus forte depuis ton Coffre-Fort."
                          }
                        </div>
                        {topBrick && <CopyBtn text={topBrick.text} label="Copier" />}
                      </div>

                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#3498db", fontWeight: 700, marginBottom: 6 }}>PARAGRAPHE 3 — Ta question discovery</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6, fontStyle: "italic" }}>
                          "{discoveryQ}"
                        </div>
                        <CopyBtn text={discoveryQ} label="Copier" />
                      </div>

                      <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, marginTop: 12 }}>
                        Trois paragraphes. Un coût. Une preuve. Une question. Le recruteur lit un chiffre ancré, pas une liste de qualités. Ta lettre ne ressemble à aucune autre parce qu'elle contient ce que l'IA ne génère pas : tes vrais chiffres.
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

    </div>
  );
  var sectionFiche = (
    <div>
          <button onClick={function() { toggleArsenalSection("fiche"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "fiche" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "fiche" ? "1px solid #e94560" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "fiche" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "fiche" ? "#e94560" : "#8892b0" }}>{"\u2694\uFE0F"} Fiche de combat</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "fiche" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "fiche" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, borderLeft: "3px solid #e94560" }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>GARDE-LA SUR TES GENOUX PENDANT L'ENTRETIEN.</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7, marginBottom: 16 }}>
                  Une page. Cauchemars du decideur. Tes 3 briques avec contre-arguments. Questions discovery. Pitch. La regle du silence. Tu n'oublies rien.
                </div>

                {(function() {
                  var cauchemarCoverage = computeCauchemarCoverageDetailed(bricks, nightmareCosts || {});
                  var topCauchemars = cauchemarCoverage.filter(function(c) { return c.covered && c.cost; }).sort(function(a, b) { return (b.cost.high || 0) - (a.cost.high || 0); }).slice(0, 3);
                  var top3 = validated.slice(0, 3);
                  var takePillar = vault && vault.selectedPillars ? vault.selectedPillars.find(function(p) { return p.source === "take"; }) : null;
                  var takeText = takePillar ? takePillar.title : null;
                  var discoveryQsLocal = {
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
                  var roleDisc = discoveryQsLocal[targetRoleId] || "Avant que je deroule mon parcours, quels sont vos enjeux cles sur ce poste ?";
                  var roleData = ROLE_LIBRARY.find(function(r) { return r.id === targetRoleId; });
                  var roleName = roleData ? roleData.role : "Non defini";

                  var ready = top3.length >= 1;

                  function generateFiche() {
                    var html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Fiche de Combat - " + roleName + "</title><style>";
                    html += "@page{size:A4;margin:20mm 18mm}";
                    html += "body{font-family:Helvetica,Arial,sans-serif;background:#0b1120;color:#ccd6f6;margin:0;padding:24px 28px;font-size:11px;line-height:1.5}";
                    html += ".header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e94560;padding-bottom:8px;margin-bottom:14px}";
                    html += ".header-tag{font-size:9px;letter-spacing:2px;color:#e94560;text-transform:uppercase;font-weight:bold}";
                    html += ".header-brand{font-size:8px;color:#495670}";
                    html += ".role{font-size:18px;font-weight:bold;margin-bottom:14px}";
                    html += ".section-tag{font-size:8px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;margin-bottom:6px}";
                    html += ".card{background:#0f1830;border-radius:6px;padding:8px 10px;margin-bottom:5px}";
                    html += ".card-row{display:flex;justify-content:space-between;align-items:center}";
                    html += ".cost{color:#e94560;font-weight:bold;font-size:11px}";
                    html += ".brick-card{background:#0f1830;border-radius:6px;padding:8px 10px;margin-bottom:5px;border-left:3px solid #4ecca3}";
                    html += ".brick-num{font-size:8px;color:#4ecca3;font-weight:bold;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px}";
                    html += ".brick-text{font-size:10px;color:#ccd6f6;margin-bottom:3px}";
                    html += ".contre{font-size:9px;color:#495670;margin-top:2px}";
                    html += ".disc-card{background:#0f1830;border-radius:6px;padding:6px 10px;margin-bottom:4px;display:flex;gap:12px;align-items:baseline}";
                    html += ".disc-label{font-size:7px;color:#3498db;font-weight:bold;letter-spacing:1px;text-transform:uppercase;flex-shrink:0;width:80px}";
                    html += ".disc-q{font-size:10px;color:#ccd6f6}";
                    html += ".pitch-box{background:#0f1830;border-radius:6px;padding:10px;border-left:3px solid #9b59b6;margin-bottom:10px}";
                    html += ".pitch-text{font-size:10px;color:#ccd6f6;line-height:1.6}";
                    html += ".silence-box{background:rgba(233,69,96,0.1);border:1px solid rgba(233,69,96,0.3);border-radius:6px;padding:8px 10px;margin-top:10px}";
                    html += ".silence-tag{font-size:9px;color:#e94560;font-weight:bold;margin-bottom:3px}";
                    html += ".silence-text{font-size:10px;color:#ccd6f6}";
                    html += ".footer{display:flex;justify-content:space-between;margin-top:14px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.04);font-size:7px;color:#495670}";
                    html += ".section-gap{margin-top:12px}";
                    html += "</style></head><body>";

                    // Header
                    html += "<div class='header'><div class='header-tag'>Fiche de combat</div><div class='header-brand'>Abneg@tion - L'Exosquelette</div></div>";
                    html += "<div class='role'>" + roleName + "</div>";

                    // Cauchemars
                    html += "<div class='section-tag' style='color:#e94560'>CAUCHEMARS DU DECIDEUR</div>";
                    if (topCauchemars.length > 0) {
                      topCauchemars.forEach(function(c) {
                        var lo = c.cost.low ? Math.round(c.cost.low / 1000) + "K" : "?";
                        var hi = c.cost.high ? Math.round(c.cost.high / 1000) + "K" : "?";
                        html += "<div class='card'><div class='card-row'><span>" + c.label + "</span><span class='cost'>" + lo + " - " + hi + "/an</span></div></div>";
                      });
                    } else {
                      html += "<div class='card'><span style='color:#495670'>Aucun cauchemar chiffre. Complete la Carte des Cauchemars.</span></div>";
                    }

                    // Top 3 briques + contre-arguments
                    html += "<div class='section-gap'></div><div class='section-tag' style='color:#4ecca3'>TOP 3 BRIQUES + CONTRE-ARGUMENTS</div>";
                    if (top3.length > 0) {
                      top3.forEach(function(b, i) {
                        html += "<div class='brick-card'>";
                        html += "<div class='brick-num'>Preuve " + (i + 1) + " (" + (b.brickCategory || "chiffre") + ")</div>";
                        html += "<div class='brick-text'>" + b.text + "</div>";
                        if (b.stressTest && b.stressTest.length > 0) {
                          html += "<div class='contre'>" + b.stressTest[0].label + " -> " + b.stressTest[0].defense + "</div>";
                        }
                        html += "</div>";
                      });
                    } else {
                      html += "<div class='card'><span style='color:#495670'>Coffre-Fort vide.</span></div>";
                    }

                    // Questions discovery
                    html += "<div class='section-gap'></div><div class='section-tag' style='color:#3498db'>QUESTIONS DISCOVERY</div>";
                    var discs = [
                      ["Discovery", roleDisc],
                      ["Declencheur", "Qu'est-ce qui a declenche ce recrutement ?"],
                      ["Cicatrice", "Quel profil ne voulez-vous surtout pas reproduire ?"],
                      ["Cadrage", "Quelle partie de mon parcours voulez-vous que je developpe en priorite ?"]
                    ];
                    discs.forEach(function(d) {
                      html += "<div class='disc-card'><div class='disc-label'>" + d[0] + "</div><div class='disc-q'>" + d[1] + "</div></div>";
                    });

                    // Pitch Chrono
                    var discoveryClose = top3.length > 0 && top3[0].discoveryQuestions && top3[0].discoveryQuestions.length > 0 ? top3[0].discoveryQuestions[0] : "Quel est le probleme que ce poste resout en priorite ?";
                    html += "<div class='section-gap'></div><div class='section-tag' style='color:#9b59b6'>PITCH 90 SECONDES — CHRONO</div>";
                    var chronoData = [
                      { label: "CAUCHEMAR", time: "0-15s", color: "#e94560", hint: "Ouvre sur le probleme du decideur" },
                      { label: "PREUVE 1", time: "15-30s", color: "#4ecca3", hint: "Un chiffre. Un contexte. Un resultat." },
                      { label: "PREUVE 2", time: "30-45s", color: "#4ecca3", hint: "Angle complementaire" },
                      { label: "METHODE", time: "45-70s", color: "#3498db", hint: "Ce que tu feras chez eux" },
                      { label: "QUESTION", time: "70-90s", color: "#ff9800", hint: "Tu reprends le cadre" },
                    ];
                    var chronoContent = [takeText || "", top3[0] ? top3[0].text : "", top3[1] ? top3[1].text : "", top3[2] ? top3[2].text : "", discoveryClose];
                    html += "<div style='display:flex;flex-direction:column;gap:4px'>";
                    chronoData.forEach(function(bloc, bi) {
                      var content = chronoContent[bi] || "";
                      if (content.length > 80) content = content.slice(0, 80) + "...";
                      html += "<div style='display:flex;gap:8px;align-items:stretch'>";
                      html += "<div style='width:50px;flex-shrink:0;background:" + bloc.color + "22;border-radius:4px;display:flex;align-items:center;justify-content:center;padding:4px'>";
                      html += "<span style='font-size:8px;font-weight:bold;color:" + bloc.color + "'>" + bloc.time + "</span></div>";
                      html += "<div style='flex:1;background:#1a1a2e;border-radius:4px;padding:6px 8px;border-left:2px solid " + bloc.color + "'>";
                      html += "<span style='font-size:8px;font-weight:bold;color:" + bloc.color + "'>" + bloc.label + "</span> ";
                      html += "<span style='font-size:9px;color:#ccd6f6'>" + content + "</span>";
                      html += "<div style='font-size:7px;color:#495670;font-style:italic'>" + bloc.hint + "</div>";
                      html += "</div></div>";
                    });
                    html += "</div>";
                    html += "<div style='font-size:8px;color:#8892b0;margin-top:6px'>Pas de texte a reciter. Une structure a suivre. Tes mots viennent de toi.</div>";

                    // Silence
                    html += "<div class='silence-box'><div class='silence-tag'>LE SILENCE</div><div class='silence-text'>Le recruteur se tait. Ne remplis pas. Laisse-le revenir. Celui qui parle en premier perd le cadre.</div></div>";

                    // Plan 90 jours
                    var plan90 = generatePlan90(bricks, targetRoleId, offersArray);
                    if (plan90) {
                      html += "<div style='margin-top:20px;page-break-before:always'>";
                      html += "<div style='font-size:14px;font-weight:bold;color:#9b59b6;margin-bottom:4px'>PLAN 90 JOURS — " + plan90.role.toUpperCase() + "</div>";
                      html += "<div style='font-size:9px;color:#8892b0;margin-bottom:12px'>Cadence " + plan90.cadenceLabel + "</div>";
                      if (plan90.ouverture) html += "<div style='font-size:10px;color:#e94560;font-style:italic;margin-bottom:12px;line-height:1.5'>" + plan90.ouverture + "</div>";
                      plan90.phases.forEach(function(p) {
                        html += "<div style='background:#1a1a2e;border-radius:6px;padding:10px;margin-bottom:8px;border-left:3px solid " + p.color + "'>";
                        html += "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:6px'>";
                        html += "<span style='font-size:11px;font-weight:bold;color:" + p.color + "'>" + p.label + "</span>";
                        html += "<span style='font-size:8px;font-weight:bold;color:" + p.color + ";background:" + p.color + "22;padding:2px 6px;border-radius:4px'>" + p.tag + "</span></div>";
                        if (p.cauchemar) html += "<div style='font-size:9px;color:#e94560;margin-bottom:6px'>\uD83D\uDCA2 " + p.cauchemar + " " + (p.cauchemarCost ? "(" + p.cauchemarCost + "/an)" : "") + "</div>";
                        p.actions.forEach(function(a) { html += "<div style='font-size:10px;color:#ccd6f6;line-height:1.6;padding-left:8px'>\u2192 " + a + "</div>"; });
                        if (p.brick) html += "<div style='font-size:9px;color:#4ecca3;margin-top:6px;line-height:1.4'>\uD83E\uDDF1 " + (p.brick.length > 100 ? p.brick.slice(0, 100) + "..." : p.brick) + "</div>";
                        if (p.rdvSouverainete) html += "<div style='font-size:8px;font-weight:bold;color:#9b59b6;margin-top:6px;background:#9b59b622;display:inline-block;padding:2px 6px;border-radius:4px'>\u23F0 " + p.rdvSouverainete + "</div>";
                        html += "</div>";
                      });
                      if (plan90.take) {
                        html += "<div style='background:#1a1a2e;border-radius:6px;padding:10px;margin-top:4px'>";
                        html += "<div style='font-size:8px;font-weight:bold;color:#ff9800;margin-bottom:4px'>TAKE — FIL ROUGE</div>";
                        html += "<div style='font-size:10px;color:#ccd6f6;font-style:italic;line-height:1.5'>\"" + plan90.take + "\"</div></div>";
                      }
                      html += "</div>";
                    }

                    // Footer
                    html += "<div class='footer'><span>Abneg@tion - L'IA extrait. Tu decides.</span><span>abnegation-fawn.vercel.app</span></div>";

                    html += "</body></html>";

                    var w = window.open("", "_blank");
                    if (w) {
                      w.document.write(html);
                      w.document.close();
                      setTimeout(function() { w.print(); }, 400);
                    }
                  }

                  return (
                    <div>
                      {/* Preview */}
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#e94560", fontWeight: 700, marginBottom: 4 }}>CAUCHEMARS</div>
                        <div style={{ fontSize: 12, color: topCauchemars.length > 0 ? "#ccd6f6" : "#495670" }}>
                          {topCauchemars.length > 0 ? topCauchemars.length + " cauchemar" + (topCauchemars.length > 1 ? "s" : "") + " chiffre" + (topCauchemars.length > 1 ? "s" : "") : "Aucun (complete la Carte)"}
                        </div>
                      </div>
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, marginBottom: 4 }}>BRIQUES + CONTRE-ARGUMENTS</div>
                        <div style={{ fontSize: 12, color: top3.length > 0 ? "#ccd6f6" : "#495670" }}>
                          {top3.length > 0 ? top3.length + " brique" + (top3.length > 1 ? "s" : "") + " avec stress test" : "Coffre-Fort vide"}
                        </div>
                      </div>
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#3498db", fontWeight: 700, marginBottom: 4 }}>QUESTIONS DISCOVERY</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6" }}>4 questions calibrees ({roleName})</div>
                      </div>
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#9b59b6", fontWeight: 700, marginBottom: 4 }}>CHRONO 90s + SILENCE</div>
                        <div style={{ fontSize: 12, color: takeText ? "#ccd6f6" : "#495670" }}>
                          {takeText ? "Pitch complet + regle du silence" : "Take manquant (valide tes Piliers)"}
                        </div>
                      </div>

                      <button onClick={generateFiche} disabled={!ready} style={{
                        width: "100%", padding: 14, marginTop: 8,
                        background: ready ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#16213e",
                        color: ready ? "#fff" : "#495670",
                        border: "none", borderRadius: 10, cursor: ready ? "pointer" : "default",
                        fontWeight: 700, fontSize: 14,
                      }}>
                        {ready ? "Generer la Fiche de Combat \u2192" : "Valide au moins 1 brique pour generer"}
                      </button>
                      {ready && (
                        <div style={{ fontSize: 11, color: "#495670", textAlign: "center", marginTop: 8 }}>
                          Ouvre une page. Imprime en PDF. Garde-la sur tes genoux.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
    </div>
  );

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>{"\uD83D\uDE80"}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ccd6f6", marginBottom: 6 }}>Arsenal calibré.</div>
        <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>
          {validated.length} briques ({decisions.length > 0 || influences.length > 0 ? "chiffre + decision + influence" : "chiffre"}).
          {cicatrices.length > 0 ? " " + cicatrices.length + " cicatrice" + (cicatrices.length > 1 ? "s" : "") + "." : ""}
          {missions.length > 0 ? " " + missions.length + " mission" + (missions.length > 1 ? "s" : "") + " (" + missionRatio + "% sans preuve)." : ""}
          {" "}{duelAnswered.length} réponses de combat.
          {elasticBricks.length > 0 ? " " + elasticBricks.length + " briques sur marche élastique." : ""}
        </div>

        {/* CALIBRATION MESSAGE — Item 5: 3 postures par trajectoire */}
        <div style={{ background: "#0f3460", borderRadius: 8, padding: 12, marginTop: 12, textAlign: "left" }}>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            {trajectoryToggle === "j_y_suis"
              ? "10 000 professionnels de ton secteur publient cette semaine. 9 990 partagent des conseils generiques. Toi tu publies un diagnostic sectoriel ancre sur un vecu que l'IA ne peut pas inventer. Ton prochain poste ne viendra pas d'une offre. Il viendra de quelqu'un qui prononce ton nom dans une salle où tu n'es pas."
              : "500 personnes ont postule a la même offre. 490 ont envoye un CV generique. Tu as un CV forge depuis des preuves chiffrees et un script ancre sur le cauchemar du décideur. Tes prises de position, l'IA ne sait pas les ecrire. Tu es dans les 5."
            }
          </div>
        </div>

        {/* Contexte post-Forge — friction marché */}
        <div style={{ background: "#e94560" + "12", borderRadius: 8, padding: 10, marginTop: 8, textAlign: "left", border: "1px solid #e94560" + "22" }}>
          <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: "#e94560" }}>{MARKET_DATA.friction.ghosting}% des candidats</span> n'obtiennent aucun retour après avoir postulé. Durée moyenne de chômage cadre : {MARKET_DATA.friction.duree_chomage_jours.min}-{MARKET_DATA.friction.duree_chomage_jours.max} jours. Ton Arsenal réduit ces chiffres. Les briques blindées passent le tri. Les scripts ancrent la négociation.
          </div>
          <div style={{ fontSize: 8, color: "#495670", marginTop: 4 }}>Données : APEC 2022-2023, Baromètre Unédic 2025.</div>
        </div>

        {measurementDiag && (
          <div style={{ fontSize: 12, color: measurementDiag.color, fontWeight: 600, marginTop: 8 }}>
            {measurementDiag.level === "fort" ? "\uD83D\uDCCA" : measurementDiag.level === "moyen" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"} {measurementDiag.title}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {(trajectoryToggle === "j_y_suis" ? [
          { id: "arsenal", label: "Ton Arsenal", emoji: "\u2694\uFE0F" },
          { id: "thermostat", label: "Thermostat", emoji: "\uD83C\uDF21\uFE0F" },
          { id: "coffre", label: "Coffre-Fort", emoji: "\uD83D\uDD10" },
        ] : [
          { id: "arsenal", label: "Ton Arsenal", emoji: "\u2694\uFE0F" },
          { id: "coffre", label: "Coffre-Fort", emoji: "\uD83D\uDD10" },
        ]).map(function(t) {
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

          {trajectoryToggle !== "j_y_suis" ? (
            <div>
              {/* PROSPECTION — Scripts + Bio LinkedIn + LinkedIn posts/signaux */}
              <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, marginTop: 4, textTransform: "uppercase" }}>{"\uD83C\uDFAF"} Prospection</div>
              {sectionScripts}
              {sectionBioLK}
              {sectionLinkedin}

              {/* ENTRETIEN — CV, Lettre, Fiche de Combat, Combat */}
              <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, marginTop: 20, textTransform: "uppercase" }}>{"\u2694\uFE0F"} Entretien</div>
              {sectionCV}
              {sectionLettre}
              {sectionFiche}
              {sectionCombat}
            </div>
          ) : (
            <div>
              {/* J_Y_SUIS: 3 sections (LinkedIn + Bio + Fiche de Combat) */}
              {sectionLinkedin}
              {sectionBioLK}
              {sectionFiche}
            </div>
          )}

        </div>
      )}
      {/* THERMOSTAT TAB — subscribers only (j_y_suis) */}
      {tab === "thermostat" && trajectoryToggle === "j_y_suis" && (function() {
        var thermoValidated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
        var thermoBlinded = thermoValidated.filter(function(b) { return b.blinded; });
        var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
        var thermoState = getDiltsThermometerState(diltsHistory);
        var diltsTarget = computeDiltsTarget(diltsHistory);
        var diltsLabel = getDiltsLabel(thermoState.effectiveLevel);
        var thermoCoverage = computeCauchemarCoverage(bricks);
        var thermoCovered = thermoCoverage.filter(function(c) { return c.covered; });
        var thermoCostLow = 0; var thermoCostHigh = 0;
        thermoCovered.forEach(function(cc) {
          var cauch = getActiveCauchemars().find(function(c) { return c.id === cc.id; });
          if (cauch) { thermoCostLow += cauch.costRange[0]; thermoCostHigh += cauch.costRange[1]; }
        });
        var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
        var cadence = roleData ? roleData.cadence : 90;
        var cadenceLabel = roleData ? roleData.cadenceLabel : "Trimestrielle";

        // Brick freshness calculation (simulated — in production, use brick.validatedAt)
        var now = Date.now();
        var freshBricks = thermoValidated.filter(function(b) { return !b.validatedAt || (now - b.validatedAt) < 30 * 24 * 3600 * 1000; });
        var agingBricks = thermoValidated.filter(function(b) { return b.validatedAt && (now - b.validatedAt) >= 30 * 24 * 3600 * 1000 && (now - b.validatedAt) < 90 * 24 * 3600 * 1000; });
        var staleBricks = thermoValidated.filter(function(b) { return b.validatedAt && (now - b.validatedAt) >= 90 * 24 * 3600 * 1000; });

        // Next RDV
        var nextRdvDate = new Date();
        nextRdvDate.setDate(nextRdvDate.getDate() + cadence);
        var rdvFormatted = nextRdvDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

        // Notification
        var hasNotif = thermoState.decay > 0 || staleBricks.length > 0;

        return (
          <div style={{ padding: "0 0 20px 0" }}>

            {/* NOTIFICATION BANNER */}
            {hasNotif && (
              <div style={{ background: "#e94560" + "22", borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid #e94560" + "44" }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, marginBottom: 6 }}>{"\u26A0\uFE0F"} ALERTE THERMOSTAT</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                  {staleBricks.length > 0 ? staleBricks.length + " brique" + (staleBricks.length > 1 ? "s" : "") + " depasse" + (staleBricks.length > 1 ? "nt" : "") + " 90 jours. Ton signal se degrade." : ""}
                  {thermoState.decay > 0 ? " Ton registre Dilts a baisse. " + thermoState.weeksInactive + " semaine" + (thermoState.weeksInactive > 1 ? "s" : "") + " sans signal." : ""}
                </div>
              </div>
            )}

            {/* SCORE DE FRAÎCHEUR GLOBAL */}
            <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16, borderLeft: "4px solid " + (staleBricks.length > 0 ? "#e94560" : agingBricks.length > 0 ? "#ff9800" : "#4ecca3") }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>THERMOSTAT</div>

              {/* Freshness bars */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: "center", background: "#1a1a2e", borderRadius: 8, padding: 10, borderTop: "3px solid #4ecca3" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#4ecca3" }}>{freshBricks.length}</div>
                  <div style={{ fontSize: 9, color: "#4ecca3", fontWeight: 600 }}>Fraiches</div>
                  <div style={{ fontSize: 8, color: "#495670" }}>&lt; 30 jours</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "#1a1a2e", borderRadius: 8, padding: 10, borderTop: "3px solid #ff9800" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#ff9800" }}>{agingBricks.length}</div>
                  <div style={{ fontSize: 9, color: "#ff9800", fontWeight: 600 }}>Vieillissantes</div>
                  <div style={{ fontSize: 8, color: "#495670" }}>30-90 jours</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "#1a1a2e", borderRadius: 8, padding: 10, borderTop: "3px solid #e94560" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#e94560" }}>{staleBricks.length}</div>
                  <div style={{ fontSize: 9, color: "#e94560", fontWeight: 600 }}>Perimees</div>
                  <div style={{ fontSize: 8, color: "#495670" }}>&gt; 90 jours</div>
                </div>
              </div>

              {/* Valeur + Visibilité + Coût */}
              <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #16213e" }}>
                <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, marginBottom: 4 }}>VALEUR PROUVEE</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                  {thermoCovered.length} cauchemar{thermoCovered.length > 1 ? "s" : ""} couvert{thermoCovered.length > 1 ? "s" : ""}. Cout cumule : {formatCost(thermoCostLow)}-{formatCost(thermoCostHigh)}/an. {thermoBlinded.length} brique{thermoBlinded.length > 1 ? "s" : ""} blindee{thermoBlinded.length > 1 ? "s" : ""}.
                </div>
              </div>

              <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #16213e" }}>
                <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, marginBottom: 4 }}>VISIBILITE</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                  Registre : {diltsLabel.name} ({thermoState.effectiveLevel}/5).
                  {thermoState.decay > 0 ? " Signal en baisse depuis " + thermoState.weeksInactive + " semaine" + (thermoState.weeksInactive > 1 ? "s" : "") + "." : " Signal stable."}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: thermoState.decay > 0 ? "#e94560" : "#8892b0", fontWeight: 700, marginBottom: 4 }}>COUT DU SILENCE</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                  {thermoState.decay > 0
                    ? "Ton thermostat a baisse. Chaque semaine sans signal, tu sors du top 5% des profils visibles."
                    : "Ton thermostat est stable. 1 signal par semaine suffit."
                  }
                </div>
              </div>
            </div>

            {/* PROCHAIN RENDEZ-VOUS DE SOUVERAINETE */}
            <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16, borderLeft: "4px solid #9b59b6" }}>
              <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>PROCHAIN RENDEZ-VOUS DE SOUVERAINETE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>{rdvFormatted}</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginBottom: 8 }}>
                Cadence {cadenceLabel.toLowerCase()} — {roleData ? roleData.role : "Role non defini"}.
              </div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                {roleData ? roleData.cadenceReason : ""}
              </div>
            </div>

            {/* BRIQUES A RAFRAICHIR */}
            {(agingBricks.length > 0 || staleBricks.length > 0) && (
              <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, borderLeft: "4px solid #ff9800" }}>
                <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>BRIQUES A RAFRAICHIR ({agingBricks.length + staleBricks.length})</div>
                {staleBricks.concat(agingBricks).map(function(b, i) {
                  var age = b.validatedAt ? Math.floor((now - b.validatedAt) / (24 * 3600 * 1000)) : 0;
                  var isStale = age >= 90;
                  return (
                    <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: "3px solid " + (isStale ? "#e94560" : "#ff9800") }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 12, color: "#ccd6f6", flex: 1 }}>{b.text.length > 80 ? b.text.slice(0, 80) + "..." : b.text}</div>
                        <div style={{ fontSize: 9, color: isStale ? "#e94560" : "#ff9800", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{age}j</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* POSTS DE LA SEMAINE — branché depuis generateWeeklyPosts */}
            {(function() {
              var weeklyResult = generateWeeklyPosts(bricks, vault, targetRoleId);
              var weeklyPosts = weeklyResult.posts;
              var weeklyRejected = weeklyResult.rejected;
              if (weeklyPosts.length === 0 && weeklyRejected.length === 0) return null;
              return (
                <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginTop: 16, borderLeft: "4px solid #4ecca3" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, letterSpacing: 1 }}>POSTS DE LA SEMAINE</div>
                    <span style={{ fontSize: 10, color: "#8892b0" }}>{weeklyPosts.length} pret{weeklyPosts.length > 1 ? "s" : ""}</span>
                  </div>
                  {weeklyPosts.length === 0 && (
                    <div style={{ fontSize: 12, color: "#495670", textAlign: "center", padding: 12 }}>
                      Pas assez de briques blindees pour generer des posts. Blinde ton Coffre-Fort.
                    </div>
                  )}
                  {weeklyPosts.map(function(post, pi) {
                    var postDilts = getDiltsLabel(post.diltsLevel);
                    return (
                      <div key={pi} style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: pi < weeklyPosts.length - 1 ? 10 : 0 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 9, color: postDilts.color, background: postDilts.color + "22", padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>{postDilts.name}</span>
                          <span style={{ fontSize: 9, color: "#8892b0", background: "#1a1a2e", padding: "2px 6px", borderRadius: 6 }}>{post.formatLabel}</span>
                          {post.marieScore && <span style={{ fontSize: 9, color: post.marieScore >= 7 ? "#4ecca3" : "#ff9800", background: "#1a1a2e", padding: "2px 6px", borderRadius: 6 }}>Marie {post.marieScore}/10</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "#495670", marginBottom: 6 }}>Source : {post.brickText.length > 60 ? post.brickText.slice(0, 60) + "..." : post.brickText}</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 8 }}>{post.text}</div>
                        <CopyBtn text={post.text} label="Copier" />
                      </div>
                    );
                  })}
                  <div style={{ fontSize: 10, color: "#495670", lineHeight: 1.5, marginTop: 8 }}>
                    Publie entre 7h30 et 8h30 en semaine. Reponds a tous les commentaires dans les 2 premieres heures.
                  </div>
                </div>
              );
            })()}

            {/* ACTIONS RAPIDES — sleep mode */}
            {(function() {
              var sleepComment = generateSleepComment(bricks, vault, targetRoleId);
              var sleepBrick = proposeSleepBrick(vault);
              if (!sleepComment && !sleepBrick) return null;
              return (
                <div style={{ background: "#16213e", borderRadius: 12, padding: 16, marginTop: 16, borderLeft: "4px solid #3498db" }}>
                  <div style={{ fontSize: 11, color: "#3498db", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>ACTIONS RAPIDES</div>
                  {sleepComment && (
                    <div style={{ marginBottom: sleepBrick ? 10 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11 }}>{"\uD83D\uDCAC"}</span>
                        <span style={{ fontSize: 11, color: "#8892b0", fontWeight: 600 }}>Commentaire de la semaine ({sleepComment.effort})</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5 }}>{sleepComment.suggestion}</div>
                    </div>
                  )}
                  {sleepBrick && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11 }}>{"\u2795"}</span>
                        <span style={{ fontSize: 11, color: "#8892b0", fontWeight: 600 }}>Nouvelle brique ({sleepBrick.effort})</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5 }}>{sleepBrick.suggestion}</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })()}

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
                        {allClean ? "\uD83D\uDD12 Versions transportables propres" : "\u26A0\uFE0F Re-scan : éléments détectés"}
                      </div>
                      <div style={{ fontSize: 10, color: "#8892b0", marginTop: 2 }}>
                        {withAnon.length} version{withAnon.length > 1 ? "s" : ""} — re-scannée{withAnon.length > 1 ? "s" : ""} a l'export
                      </div>
                    </div>
                    {allClean && <CopyBtn text={exportText} label="Exporter" />}
                  </div>
                  {!allClean && (
                    <div style={{ fontSize: 11, color: "#e94560", marginTop: 6 }}>Export bloque. Une ou plusieurs versions transportables contiennent des elements sensibles détectés au re-scan.</div>
                  )}
                </div>
              );
            })()}
            {validated.map(function(b) {
              var cat = b.brickCategory && CATEGORY_LABELS[b.brickCategory];
              var elast = b.elasticity && ELASTICITY_LABELS[b.elasticity];
              var activeView = brickViews[b.id] || "brut";
              var hasVersions = b.cvVersion || b.interviewVersions;
              return (
                <div key={b.id} style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: "3px solid " + (cat ? cat.color : "#e94560") }}>
                  {hasVersions && (
                    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                      {["brut", "cv", "rh", "n1", "dir", "disco", "stress"].map(function(v) {
                        var labels = { brut: "Brut", cv: "CV", rh: "RH", n1: "N+1", dir: "Direction", disco: "Questions", stress: "\u26A1 Stress" };
                        var active = activeView === v;
                        if (v === "stress" && !b.stressTest) return null;
                        return (
                          <button key={v} onClick={function() { setBrickView(b.id, v); }} style={{
                            padding: "3px 8px", fontSize: 9, fontWeight: 600,
                            background: active ? (v === "stress" ? "#ff9800" : "#e94560") : "#1a1a2e",
                            color: active ? "#fff" : "#8892b0",
                            border: "none", borderRadius: 6, cursor: "pointer",
                          }}>{labels[v]}</button>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 6 }}>
                    {activeView === "brut" && b.text}
                    {activeView === "cv" && (b.cvVersion || b.text)}
                    {activeView === "rh" && (b.interviewVersions ? b.interviewVersions.rh : b.text)}
                    {activeView === "n1" && (b.interviewVersions ? b.interviewVersions.n1 : b.text)}
                    {activeView === "dir" && (b.interviewVersions ? b.interviewVersions.direction : b.text)}
                    {activeView === "disco" && (b.discoveryQuestions ? b.discoveryQuestions.join("\n\n") : "Aucune question générée.")}
                    {activeView === "stress" && b.stressTest && (
                      <div>
                        <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 700, marginBottom: 8 }}>STRESS TEST — {b.stressTest.length} angles d'attaque</div>
                        {b.stressTest.map(function(angle, ai) {
                          var sourceColor = angle.source === "offre" ? "#3498db" : angle.source === "marche" ? "#9b59b6" : "#ff9800";
                          var sourceLabel = angle.source === "offre" ? "OFFRE" : angle.source === "marche" ? "MARCHE" : "";
                          return (
                            <div key={ai} style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginBottom: 6 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: sourceColor, marginBottom: 4 }}>{(ai + 1) + ". " + angle.label}{sourceLabel ? " — " + sourceLabel : ""}</div>
                              <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5, marginBottom: 6, fontStyle: "italic" }}>{angle.attack}</div>
                              <div style={{ fontSize: 11, color: "#4ecca3", lineHeight: 1.5 }}>{"\u2192"} {angle.defense}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {activeView !== "brut" && (
                    <CopyBtn text={activeView === "cv" ? (b.cvVersion || b.text) : activeView === "rh" ? (b.interviewVersions ? b.interviewVersions.rh : b.text) : activeView === "n1" ? (b.interviewVersions ? b.interviewVersions.n1 : b.text) : activeView === "dir" ? (b.interviewVersions ? b.interviewVersions.direction : b.text) : activeView === "disco" ? (b.discoveryQuestions ? b.discoveryQuestions.join("\n\n") : "") : b.text} label="Copier" />
                  )}
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
                    <div style={{ fontSize: 11, color: b.kpiRefMatch.elasticity === "élastique" ? "#4ecca3" : b.kpiRefMatch.elasticity === "sous_pression" ? "#e94560" : "#8892b0", marginTop: 4, lineHeight: 1.4 }}>
                      {b.kpiRefMatch.elasticity === "élastique" ? "\u2197\uFE0F" : b.kpiRefMatch.elasticity === "sous_pression" ? "\u2198\uFE0F" : "\u2194\uFE0F"} {b.kpiRefMatch.name} : {b.kpiRefMatch.why}
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
                    Ta négociation ne porte pas sur ton salaire. Elle porte sur la disparition de {withCosts.length === 1 ? "ce problème qui coute " + withCosts[0].cost : "ces problèmes"}. Le recruteur ne paie pas ta compétence. Il paie la fin de sa douleur.
                  </div>
                )}
                {vulnerableCoverage.length > 0 && (
                  <div style={{ background: "#e94560" + "22", borderRadius: 6, padding: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5 }}>
                      {vulnerableCoverage.length} cauchemar{vulnerableCoverage.length > 1 ? "s" : ""} couvert{vulnerableCoverage.length > 1 ? "s" : ""} par des briques vulnerables. Tu te positionnes comme le remède mais ta preuve est faible. Si le problème persiste, tu deviens la cible.
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
                  {missionRatio >= 50 ? " La majorité de ton activité est invisible. Tu négocies à l'aveugle." : ""}
                </div>
              )}
            </div>
          )}

          {/* MISSIONS */}
          {missions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{"\uD83D\uDCCB"} Missions en attente ({missions.length})</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 8 }}>Chaque mission completee ne remplit pas seulement ton arsenal. Elle installe un réflexe : mesurer ce que tu fais pendant que tu le fais.</div>
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
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Tes piliers définissent l'angle de chaque livrable. L'IA injecte tes convictions comme des variables fixes dans chaque texte généré.</div>
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
                  {"\u2197\uFE0F"} {elasticBricks.length} brique{elasticBricks.length > 1 ? "s" : ""} sur marche élastique. Tu te positionnes là où la demande accelere.
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
                <div style={{ marginTop: 12, fontSize: 12, color: "#4ecca3", fontWeight: 600 }}>Aucune faille détectée. Ton levier est maximal sur les criteres Forge.</div>
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
                { id: "négociation", label: "Negociation" },
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
                  Mode freelance : chaque ping généré un rapport de valeur que tu envoies à ton client pour justifier tes honoraires. Tu ne notes pas pour te souvenir. Tu blindes pour facturer.
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
                    <div style={{ fontSize: 11, color: "#4ecca3" }}>Cadrage par le coût du problème, pas par ton salaire</div>
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
                        <div style={{ fontSize: 10, color: "#4ecca3", marginTop: 3 }}>{"\u2197\uFE0F"} Couvert par une brique élastique. Position de remède credible.</div>
                      )}
                      {c.covered && !c.hasElasticCovering && (
                        <div style={{ fontSize: 10, color: "#ff9800", marginTop: 3 }}>{"\u26A0\uFE0F"} Couvert par une brique stable. Levier de négociation limite.</div>
                      )}
                    </div>
                  );
                })}
                <div style={{ background: hasElastic ? "#4ecca3" + "15" : "#ff9800" + "15", borderRadius: 6, padding: 8, marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: hasElastic ? "#4ecca3" : "#ff9800", lineHeight: 1.5, fontWeight: 600 }}>
                    {hasElastic
                      ? "Ta négociation ne porte pas sur ton salaire. Elle porte sur le coût de ne pas te recruter. Le cauchemar coute " + (totalCostMin / 1000).toFixed(0) + "-" + (totalCostMax / 1000).toFixed(0) + "K\u20AC/an. Ton package est une fraction de ce risque."
                      : "Tes briques couvrent des cauchemars mais aucune n'est sur un KPI élastique. Ton levier de négociation est reel mais contestable. Cherche un angle élastique."
                    }
                  </div>
                </div>
              </div>
            );
          })()}

          {/* THERMOSTAT TEASER — shown once at end of Forge, all green, sells subscription */}
          {targetRoleId && KPI_REFERENCE[targetRoleId] && (function() {
            var roleData = KPI_REFERENCE[targetRoleId];
            var validatedBricks = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
            var blindedBricks = validatedBricks.filter(function(b) { return b.blinded; });
            var decayDate = new Date();
            decayDate.setDate(decayDate.getDate() + 90);
            var decayStr = decayDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
            var nextRdv = new Date();
            nextRdv.setDate(nextRdv.getDate() + roleData.cadence);
            var rdvStr = nextRdv.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

            return (
              <div style={{ background: "#0f3460", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid #4ecca3" }}>
                <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>{"\uD83C\uDF21\uFE0F"} THERMOSTAT — ÉTAT ACTUEL</div>

                {/* All green today */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, textAlign: "center", background: "#4ecca3" + "15", borderRadius: 8, padding: 10, border: "1px solid #4ecca3" + "33" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#4ecca3" }}>{validatedBricks.length}</div>
                    <div style={{ fontSize: 9, color: "#4ecca3", fontWeight: 600 }}>Briques fraiches</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", background: "#4ecca3" + "15", borderRadius: 8, padding: 10, border: "1px solid #4ecca3" + "33" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#4ecca3" }}>{blindedBricks.length}</div>
                    <div style={{ fontSize: 9, color: "#4ecca3", fontWeight: 600 }}>Blindees</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", background: "#4ecca3" + "15", borderRadius: 8, padding: 10, border: "1px solid #4ecca3" + "33" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#4ecca3" }}>0</div>
                    <div style={{ fontSize: 9, color: "#4ecca3", fontWeight: 600 }}>Perimees</div>
                  </div>
                </div>

                {/* Decay warning */}
                <div style={{ background: "#e94560" + "15", borderRadius: 8, padding: 14, border: "1px solid #e94560" + "33", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e94560", marginBottom: 6 }}>Aujourd'hui tout est vert.</div>
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7 }}>
                    Le {decayStr}, ces {validatedBricks.length} briques auront perdu 40% de leur valeur. Un recruteur qui te contacte dans 3 mois entendra un pitch construit sur des chiffres anciens. Le marche aura bouge. Tes preuves non.
                  </div>
                </div>

                {/* RDV preview */}
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#9b59b6", fontWeight: 700 }}>PROCHAIN RENDEZ-VOUS DE SOUVERAINETE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6", marginTop: 4 }}>{rdvStr}</div>
                    </div>
                    <div style={{ fontSize: 9, color: "#8892b0", textAlign: "right" }}>
                      <div>Cadence {roleData.cadenceLabel.toLowerCase()}</div>
                      <div>{roleData.role}</div>
                    </div>
                  </div>
                </div>

                {/* What Thermostat does */}
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6 }}>
                  Le Thermostat surveille la fraicheur de chaque brique, te previent quand ton signal se degrade, et programme tes Rendez-vous de Souverainete. Il fonctionne avec l'abonnement.
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
                        <div style={{ fontSize: 10, color: "#ff9800", marginTop: 4 }}>{"\uD83D\uDD25"} Bonus : tu as assumé un échec sur ce terrain. Le recruteur sait que tu connais les pièges.</div>
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
                    Mode d'emploi : n'arrive pas en disant "je vaux X". Arrive en disant "votre problème coute {formatCost(negoBrief.totalCostLow)}-{formatCost(negoBrief.totalCostHigh)} par an. Voici comment je l'ai résolu. Voici ce que ca vaut." Le recruteur ne paie pas ta compétence. Il paie la fin de sa douleur.
                  </div>
                </div>
              </div>
            );
          })()}

          {/* PARCOURS ALTERNATIFS — cross-role matching */}
          <CrossRoleInsight bricks={bricks} targetRoleId={targetRoleId} trajectoryToggle={trajectoryToggle} />

          {/* CTA — tied to Thermostat */}
          <div style={{ borderTop: "1px solid #495670", paddingTop: 20, marginTop: 8, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>Le Thermostat surveille. Tu decides.</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginBottom: 16 }}>
              Score de fraicheur de chaque brique. Alerte quand ton signal se degrade. Rendez-vous de Souverainete programmes. Duel illimite. Coffre-Fort mis a jour en continu.
            </div>
            <button style={{
              width: "100%", padding: 16, background: "linear-gradient(135deg, #e94560, #c81d4e)",
              color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 15,
              boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
            }}>Activer le Thermostat \u2014 10\u20AC/mois</button>
            <div style={{ fontSize: 11, color: "#495670", marginTop: 10 }}>Tes briques restent accessibles en lecture seule sans abonnement.</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==============================
   DIAGNOSTIC SCREEN — Entrée gratuite 4 blocs
   Remplace la phase "ready" en mode actif
   ============================== */

function DiagnosticScreen({ diagnostic, cvText, offerText, roleId, readiness, trajectory, onStartSprint }) {
  if (!diagnostic) return null;
  var b1 = diagnostic.bloc1;
  var b2 = diagnostic.bloc2;
  var b3 = diagnostic.bloc3;
  var b4 = diagnostic.bloc4;
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;

  return (
    <div style={{ padding: "20px 0" }}>

      {/* BLOC 1 — Ce que l'offre demande VRAIMENT */}
      <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>CE QUE L'OFFRE DEMANDE VRAIMENT</div>
        <div style={{ fontSize: 11, color: "#495670", marginBottom: 12 }}>Pas les competences listees. Les cauchemars caches derriere les mots.</div>
        {b1.cauchemars.map(function(c, i) {
          var kpiRef = roleData ? roleData.kpis.find(function(k) { return c.kpis && c.kpis.indexOf(k.name) !== -1; }) : null;
          var eColor = kpiRef && kpiRef.elasticity === "élastique" ? "#4ecca3" : kpiRef && kpiRef.elasticity === "sous_pression" ? "#e94560" : "#8892b0";
          var costStr = formatCost(c.costRange[0]) + " - " + formatCost(c.costRange[1]);
          return (
            <div key={i} style={{ borderBottom: i < 2 ? "1px solid #16213e" : "none", paddingBottom: i < 2 ? 10 : 0, marginBottom: i < 2 ? 10 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 700 }}>{c.label}</span>
                {kpiRef && <span style={{ fontSize: 9, color: eColor, background: eColor + "22", padding: "1px 6px", borderRadius: 6 }}>{kpiRef.elasticity}</span>}
                {c.detected && <span style={{ fontSize: 9, color: "#4ecca3", background: "#4ecca3" + "22", padding: "1px 6px", borderRadius: 6 }}>signal detect\u00e9</span>}
              </div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>{c.nightmareShort}</div>
              <div style={{ fontSize: 10, color: "#e94560", fontWeight: 600 }}>Co\u00fbt : {costStr} / an</div>
            </div>
          );
        })}
        {b1.urgency > 0 && (
          <div style={{ marginTop: 8, fontSize: 10, color: "#e94560", fontWeight: 600 }}>{"\u26A1"} {b1.urgency} signaux d'urgence : {b1.urgencyHits.slice(0, 3).join(", ")}</div>
        )}
      </div>

      {/* BLOC 2 — Ce que ton CV dit au recruteur */}
      <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>CE QUE TON CV DIT AU RECRUTEUR</div>
        {b2.perceptions.map(function(p, i) {
          var statusColor = p.status === "activite_chiffree" ? "#4ecca3" : p.status === "activite_sans_preuve" ? "#ff9800" : "#e94560";
          var statusIcon = p.status === "activite_chiffree" ? "\u26A0\uFE0F" : p.status === "activite_sans_preuve" ? "\u26A0\uFE0F" : "\u274C";
          return (
            <div key={i} style={{ borderBottom: i < b2.perceptions.length - 1 ? "1px solid #16213e" : "none", paddingBottom: 8, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11 }}>{statusIcon}</span>
                <span style={{ fontSize: 11, color: statusColor, fontWeight: 700 }}>{p.cauchemar}</span>
              </div>
              <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5 }}>{p.perception}</div>
            </div>
          );
        })}
      </div>

      {/* BLOC 3 — Le fossé */}
      <div style={{ background: "#e94560" + "15", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #e94560" + "44" }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>LE FOSSE</div>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#e94560" }}>{b3.fossePct}%</div>
          <div style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600 }}>de tes preuves sont invisibles</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#e94560" }}>{b3.totalCauchemars}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>cauchemars</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ff9800" }}>{b3.coveredCount}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>mentionnes</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#4ecca3" }}>{b3.proofCount}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>prouves</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6, textAlign: "center" }}>
          Tu tires a blanc. Tu as l'experience. Tu ne la formules pas en preuve. Le recruteur ne voit pas le remede. Il te jette.
        </div>
      </div>

      {/* DONNÉES MARCHÉ — 4 tuiles les plus percutantes pour le diagnostic */}
      <div style={{ background: "#0a192f", borderRadius: 10, padding: 12, marginBottom: 16, border: "1px solid #e94560" + "22" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 45%", background: "#1a1a2e", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#e94560" }}>{MARKET_DATA.fosse.part_augmentes_changement}%</div>
            <div style={{ fontSize: 9, color: "#8892b0", lineHeight: 1.4 }}>des cadres qui changent sont augmentés</div>
          </div>
          <div style={{ flex: "1 1 45%", background: "#1a1a2e", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#495670" }}>{MARKET_DATA.fosse.part_augmentes_meme_poste}%</div>
            <div style={{ fontSize: 9, color: "#8892b0", lineHeight: 1.4 }}>de ceux qui restent au même poste</div>
          </div>
          <div style={{ flex: "1 1 45%", background: "#1a1a2e", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#ff9800" }}>+{MARKET_DATA.friction.hausse_candidatures_ia}%</div>
            <div style={{ fontSize: 9, color: "#8892b0", lineHeight: 1.4 }}>de candidatures depuis l'IA générative</div>
          </div>
          <div style={{ flex: "1 1 45%", background: "#1a1a2e", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#ff9800" }}>{MARKET_DATA.reconversion.projet_reconversion}% → {MARKET_DATA.reconversion.demarches_entamees}%</div>
            <div style={{ fontSize: 9, color: "#8892b0", lineHeight: 1.4 }}>veulent bouger → bougent vraiment</div>
          </div>
        </div>
        <div style={{ fontSize: 8, color: "#495670", marginTop: 8, textAlign: "center" }}>
          Données : APEC 2022-2023, Baromètre Unédic 2025, LinkedIn Economic Graph 2026.
        </div>
      </div>

      {/* BLOC 4 — Ce que la Forge debloque */}
      {b4.transformation && (
        <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#4ecca3", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>CE QUE LE SPRINT DEBLOQUE</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#e94560", fontWeight: 700, marginBottom: 4 }}>AVANT — Ton CV aujourd'hui</div>
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, fontSize: 12, color: "#8892b0", lineHeight: 1.5, borderLeft: "3px solid #e94560" }}>
              {b4.transformation.before}
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 18, color: "#495670", margin: "4px 0" }}>{"\u2193"}</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, marginBottom: 4 }}>APRES — Apres extraction Forge</div>
            <div style={{ background: "#4ecca3" + "15", borderRadius: 8, padding: 10, fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, fontWeight: 600, borderLeft: "3px solid #4ecca3" }}>
              {b4.transformation.after}
            </div>
          </div>
          {b4.transformation.isSimulated && (
            <div style={{ fontSize: 10, color: "#495670", fontStyle: "italic", textAlign: "center" }}>
              Transformation simulee. La Forge extrait TES vrais chiffres.
            </div>
          )}
        </div>
      )}

      {/* Readiness indicator */}
      {readiness && (
        <div style={{ background: readiness.readiness === "fort" ? "#4ecca3" + "15" : readiness.readiness === "moyen" ? "#ff9800" + "15" : "#e94560" + "15", borderRadius: 10, padding: 12, marginBottom: 16, border: "1px solid " + (readiness.readiness === "fort" ? "#4ecca3" : readiness.readiness === "moyen" ? "#ff9800" : "#e94560") }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: readiness.readiness === "fort" ? "#4ecca3" : readiness.readiness === "moyen" ? "#ff9800" : "#e94560", marginBottom: 6 }}>
            {readiness.readiness === "fort" ? "\u26A1" : readiness.readiness === "moyen" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"} GISEMENT : {readiness.estimatedBricks} briques extractibles
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {readiness.details.map(function(d, i) {
              return <span key={i} style={{ fontSize: 10, color: d.ok ? "#4ecca3" : "#e94560" }}>{d.ok ? "\u2714" : "\u2718"} {d.label}</span>;
            })}
          </div>
        </div>
      )}

      {/* Trajectory */}
      {trajectory && (
        <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{trajectory === "j_y_suis" ? "\uD83D\uDCCD" : "\uD83D\uDE80"}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6" }}>{trajectory === "j_y_suis" ? "J'y suis" : "J'y vais"}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>{trajectory === "j_y_suis" ? "La Forge cherche la valeur cachee dans ce que tu fais deja." : "La Forge cherche les preuves transferables vers le poste vise."}</div>
          </div>
        </div>
      )}

      {/* CTA */}
      <button onClick={function() { onStartSprint(); }} style={{
        width: "100%", padding: 16, background: "linear-gradient(135deg, #e94560, #c81d4e)",
        color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 16,
        boxShadow: "0 4px 20px rgba(233,69,96,0.3)", marginBottom: 8,
      }}>Lancer la Forge</button>
      <button onClick={function() {
        var lines = [];
        lines.push("=== DIAGNOSTIC ABNEG@TION ===\n");
        lines.push("CE QUE L'OFFRE DEMANDE VRAIMENT :");
        b1.cauchemars.forEach(function(c) {
          lines.push("- " + c.label + " : " + c.nightmareShort + " (cout : " + formatCost(c.costRange[0]) + " - " + formatCost(c.costRange[1]) + " / an)");
        });
        lines.push("\nCE QUE TON CV DIT AU RECRUTEUR :");
        b2.perceptions.forEach(function(p) {
          var icon = p.status === "silence" ? "[X]" : "[!]";
          lines.push(icon + " " + p.cauchemar + " : " + p.perception);
        });
        lines.push("\nLE FOSSE :");
        lines.push(b3.fossePct + "% de tes preuves sont invisibles. " + b3.totalCauchemars + " enjeux critiques, " + b3.coveredCount + " mentionnes, " + b3.proofCount + " prouves.");
        if (b4.transformation) {
          lines.push("\nAVANT (ton CV) : " + b4.transformation.before);
          lines.push("APRES (apres Forge) : " + b4.transformation.after);
          if (b4.transformation.isSimulated) lines.push("(Transformation simulee. La Forge extrait TES vrais chiffres.)");
        }
        lines.push("\n---\nDiagnostic genere par Abneg@tion — L'Exosquelette");
        var text = lines.join("\n");
        if (navigator.clipboard) { navigator.clipboard.writeText(text); }
        if (typeof onCopied === "function") onCopied();
      }} style={{
        width: "100%", padding: 12, background: "#16213e",
        color: "#8892b0", border: "1px solid #16213e", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13,
        marginBottom: 8,
      }}>Copier le diagnostic</button>
      <div style={{ fontSize: 11, color: "#495670", textAlign: "center" }}>Ta premiere munition en 20 minutes. Ton arsenal complet a ton rythme.</div>
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
  var offerSignalsState = useState(null);
  var offerSignals = offerSignalsState[0];
  var setOfferSignals = offerSignalsState[1];

  var isPassif = mode === "passif";
  var canStart = isPassif ? cv.trim().length > 20 : (cv.trim().length > 20 && offers.trim().length > 20 && targetRole !== null && trajectory !== null);

  function handleScan() {
    setPhase("scanning");
    setScanProgress(0);
    setScanMessages([]);
    var steps = isPassif ? SCAN_STEPS_PASSIF : SCAN_STEPS_ACTIF;

    // Parse offer signals immediately (synchronous, keyword-based)
    if (!isPassif && offers.trim().length > 20 && targetRole) {
      var signals = parseOfferSignals(offers, targetRole);
      setOfferSignals(signals);
      // Set global cauchemars for immediate use in ready screen
      if (signals && signals.cauchemars) {
        setActiveCauchemarsGlobal(signals.cauchemars);
      }
    }

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
          <div style={{ fontSize: 14, color: "#8892b0", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>Il paie la rareté. L'outil te montre où tu es rare, où tu es substituable, et comment inverser le rapport de force.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <button onClick={function() { setMode("actif"); }} style={{
            background: "#0f3460", border: "2px solid #16213e", borderRadius: 12, padding: 20, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{"\uD83C\uDFAF"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 4 }}>Je vise un poste precis</div>
            <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.5 }}>L'IA extrait les KPIs caches, mesure l'élasticité du marché, et te dit où investir ton energie.</div>
          </button>
          <button onClick={function() { setMode("passif"); }} style={{
            background: "#0f3460", border: "2px solid #16213e", borderRadius: 12, padding: 20, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{"\uD83D\uDC41\uFE0F"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 4 }}>Je veux un diagnostic rapide</div>
            <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.5 }}>L'IA scanne ton profil en 30 secondes. Tu vois ce que les recruteurs voient. Si ca te convainc, tu passes a la Forge.</div>
          </button>
        </div>
      </div>
    );
  }

  if (phase === "ready") {
    var scoreLabel = "LE FOSSE";
    // Dynamic score based on offer signal analysis
    var detectedCount = offerSignals ? offerSignals.cauchemars.filter(function(c) { return c.detected; }).length : 0;
    var scorePct = isPassif ? 28 : (offerSignals && offerSignals.totalSignals > 0 ? Math.min(45, 20 + offerSignals.totalSignals * 3) : 32);
    var elasticCount = 0;
    if (targetRole && KPI_REFERENCE[targetRole]) {
      getActiveCauchemars().forEach(function(c) {
        var kpiMatch = KPI_REFERENCE[targetRole].kpis.find(function(k) { return c.kpis && c.kpis.indexOf(k.name) !== -1; });
        if (kpiMatch && kpiMatch.elasticity === "élastique") elasticCount++;
      });
    }
    var scoreMsg = isPassif
      ? "Tu es visible sur " + scorePct + "% des critères que les recruteurs utilisent pour te trouver."
      : "Tu comprends " + scorePct + "% des enjeux reels de tes offres cibles.";
    var subMsg = isPassif
      ? "3 KPIs cles de ton secteur t'echappent. Les recruteurs te cherchent. Ton profil ne repond pas."
      : (detectedCount > 0
        ? detectedCount + " enjeu" + (detectedCount > 1 ? "x" : "") + " critique" + (detectedCount > 1 ? "s" : "") + " detecte" + (detectedCount > 1 ? "s" : "") + " dans ton offre." + (elasticCount > 0 ? " " + elasticCount + " sur marche élastique. C'est là que tu dois frapper." : "")
        : "3 KPIs t'echappent. La Forge va les extraire de ton parcours.");

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#e94560", fontWeight: 600, letterSpacing: 1 }}>{isPassif ? "CE QUE TU RATES" : "CAUCHEMARS DETECTES DANS L'OFFRE"}</div>
            {offerSignals && offerSignals.totalSignals > 0 && (
              <span style={{ fontSize: 10, color: "#4ecca3", background: "#1a1a2e", padding: "2px 8px", borderRadius: 8 }}>{offerSignals.totalSignals} signaux</span>
            )}
          </div>
          {getActiveCauchemars().map(function(c, i) {
            var kpiRef = targetRole && KPI_REFERENCE[targetRole] ? KPI_REFERENCE[targetRole].kpis.find(function(k) { return c.kpis && c.kpis.indexOf(k.name) !== -1; }) : null;
            var elasticity = kpiRef ? kpiRef.elasticity : null;
            var eColor = elasticity === "élastique" ? "#4ecca3" : elasticity === "stable" ? "#8892b0" : elasticity === "sous_pression" ? "#e94560" : "#495670";
            var eLabel = elasticity === "élastique" ? "\u2197\uFE0F" : elasticity === "stable" ? "\u2194\uFE0F" : elasticity === "sous_pression" ? "\u2198\uFE0F" : "\u2022";
            var eText = elasticity === "élastique" ? "élastique" : elasticity === "stable" ? "stable" : elasticity === "sous_pression" ? "sous pression" : "";
            return (
              <div key={i} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600 }}>{"\uD83C\uDFAF"} {isPassif ? "Signal #" : "Cauchemar #"}{i + 1} : {c.label}</span>
                  {eText && <span style={{ fontSize: 10, color: eColor, background: "#1a1a2e", padding: "1px 6px", borderRadius: 8 }}>{eLabel} {eText}</span>}
                  {c.detected && <span style={{ fontSize: 9, color: "#4ecca3", background: "#4ecca3" + "22", padding: "1px 6px", borderRadius: 8 }}>détecté</span>}
                </div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{c.nightmareShort}</div>
                {c.matchedKw && c.matchedKw.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    {c.matchedKw.slice(0, 4).map(function(kw, ki) {
                      return <span key={ki} style={{ fontSize: 9, color: "#4ecca3", background: "#1a1a2e", padding: "1px 6px", borderRadius: 6 }}>{kw}</span>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {offerSignals && offerSignals.urgencyScore > 0 && (
            <div style={{ borderTop: "1px solid #16213e", marginTop: 10, paddingTop: 8, fontSize: 11, color: "#e94560", fontWeight: 600 }}>
              {"\u26A1"} Signaux d'urgence détectés ({offerSignals.urgencyScore}) : {offerSignals.urgencyHits.slice(0, 3).join(", ")}
            </div>
          )}
        </div>

        {/* ITERATION 6 — GISEMENT DETECTE */}
        {!isPassif && (
          <div style={{ background: readiness.readiness === "fort" ? "#4ecca3" + "15" : readiness.readiness === "moyen" ? "#ff9800" + "15" : "#e94560" + "15", borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid " + (readiness.readiness === "fort" ? "#4ecca3" : readiness.readiness === "moyen" ? "#ff9800" : "#e94560") }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{readiness.readiness === "fort" ? "\u26A1" : readiness.readiness === "moyen" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: readiness.readiness === "fort" ? "#4ecca3" : readiness.readiness === "moyen" ? "#ff9800" : "#e94560" }}>
                GISEMENT DETECTE
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
                ? "Gisement dense. La Forge va extraire des briques fortes. Tu as les chiffres et les méthodes. Les signaux de leadership sont là."
                : readiness.readiness === "moyen"
                ? "Gisement partiel. La Forge va extraire des briques mais certaines zones resteront floues. Prepare-toi a des missions de recuperation de données."
                : "Gisement faible. La Forge va reveler tes trous. Beaucoup de missions. C'est honnête, pas agréable. Si tu as accès à tes anciens outils (CRM, reporting), récupère tes chiffres avant de commencer."
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
              <div style={{ fontSize: 10, color: "#8892b0" }}>{trajectory === "j_y_suis" ? "La Forge cherche la valeur cachee dans ce que tu fais deja." : "La Forge cherche les preuves transferables vers le poste vise."}</div>
            </div>
          </div>
        )}

        {/* LIGHT CROSS-ROLE HINT — pre-Forge signal based on CV keywords */}
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
                Ton profil contient des signaux compatibles avec {best.role}. La Forge precisera si tes preuves couvrent ce terrain mieux que {KPI_REFERENCE[targetRole] ? KPI_REFERENCE[targetRole].role : "ton choix"}.
              </div>
            </div>
          );
        })()}

        {isPassif ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#8892b0", marginBottom: 16, lineHeight: 1.6 }}>
              Voila ce que les recruteurs voient. Si tu veux changer ca, la Forge extrait tes preuves cachees, construit ton arsenal et te positionne sur les terrains élastiques.
            </div>
            <button onClick={function() { setMode("actif"); setPhase("input"); }} style={{
              width: "100%", padding: 16, background: "linear-gradient(135deg, #e94560, #c81d4e)",
              color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 16,
              boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
            }}>Passer a la Forge</button>
            <div style={{ fontSize: 11, color: "#495670", marginTop: 10 }}>Le profil que tu as colle est déjà charge. Ajoute tes offres cibles et choisis ton poste.</div>
          </div>
        ) : (
          <DiagnosticScreen
            diagnostic={generateDiagnostic(cv, offers, targetRole)}
            cvText={cv}
            offerText={offers}
            roleId={targetRole}
            readiness={readiness}
            trajectory={trajectory}
            onStartSprint={function() { onStart(targetRole, trajectory, offerSignals, offers); }}
          />
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
            {isPassif ? "L'IA scanne ta visibilité" : "L'IA scanne ton profil et le marché"}
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
        <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6", marginBottom: 8 }}>{isPassif ? "Ton profil est-il visible là où ça compte ?" : "Identifie où ta compétence rencontre la demande."}</div>
        <div style={{ color: "#495670", fontSize: 12, marginTop: 4 }}>Temps estimé : 2 minutes.</div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{"\uD83D\uDC64"}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Ton profil</span>
        </div>
        <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 8 }}>Colle ton CV, ta bio LinkedIn, ou decris ton dernier poste.</div>
        <textarea value={cv} onChange={function(e) { setCv(e.target.value); }}
          placeholder="Ex : Account Executive chez [Entreprise SaaS] (2 ans). Cycle de vente complet Mid-Market. Portefeuille de 45 comptes, ARR géré 1.2M euros..."
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
            placeholder="Ex : Account Executive Mid-Market \u2014 Scale-up SaaS B2B série B. Prospection outbound, demos, closing. 3+ ans expérience SaaS. Salesforce requis. OTE 80-120K euros..."
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
                var eColor = k.elasticity === "élastique" ? "#4ecca3" : k.elasticity === "stable" ? "#8892b0" : "#e94560";
                var eLabel = k.elasticity === "élastique" ? "\u2197\uFE0F" : k.elasticity === "stable" ? "\u2194\uFE0F" : "\u2198\uFE0F";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: eColor }}>{eLabel}</span>
                    <span style={{ fontSize: 11, color: "#ccd6f6" }}>{k.name}</span>
                    <span style={{ fontSize: 9, color: eColor, background: "#1a1a2e", padding: "1px 6px", borderRadius: 6 }}>{k.elasticity === "élastique" ? "élastique" : k.elasticity === "stable" ? "stable" : "sous pression"}</span>
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
              <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 700, marginBottom: 8 }}>Tu y es déjà ou tu veux y acceder ?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={function() { setTrajectory("j_y_suis"); }} style={{
                  flex: 1, padding: "14px 8px",
                  background: trajectory === "j_y_suis" ? "#0f3460" : "#1a1a2e",
                  border: trajectory === "j_y_suis" ? "2px solid #e94560" : "2px solid #16213e",
                  borderRadius: 10, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{"\uD83D\uDCCD"}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: trajectory === "j_y_suis" ? "#e94560" : "#ccd6f6" }}>J'y suis</div>
                  <div style={{ fontSize: 10, color: "#8892b0", marginTop: 4, lineHeight: 1.4 }}>Je fais déjà ce metier. Je veux etre mieux positionne.</div>
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
                      ? "La Forge va chercher la valeur cachee dans ce que tu fais deja. Quels accomplissements valent cher ? Lesquels ne valent plus rien face a l'IA ? L'angle est : tu es expert, montre-le."
                      : "La Forge va chercher les preuves transferables dans ton expérience. Quels indicateurs du poste vise couvres-tu déjà ? Quels trous faut-il combler ? L'angle est : tu as fait le travail, tu n'avais pas le titre."
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Contexte IA — juste avant La Forge */}
      {canStart && (
        <div style={{ background: "#3498db" + "12", borderRadius: 8, padding: 10, marginBottom: 12, border: "1px solid #3498db" + "33" }}>
          <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: "#3498db" }}>{MARKET_DATA.ia_recrutement.tri_cv_par_ia}% des recruteurs</span> trient par algorithme. Un CV sans chiffre ancré ne passe plus le filtre. La Forge blinde tes preuves pour qu'elles résistent au tri IA.
          </div>
          <div style={{ fontSize: 8, color: "#495670", marginTop: 4 }}>Baromètre recrutement IA 2025-2026</div>
        </div>
      )}
      <button onClick={handleScan} disabled={!canStart} style={{
        width: "100%", padding: 16,
        background: canStart ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
        color: canStart ? "#fff" : "#495670", border: canStart ? "none" : "2px solid #16213e",
        borderRadius: 12, cursor: canStart ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 15,
        boxShadow: canStart ? "0 4px 20px rgba(233,69,96,0.3)" : "none",
      }}>{canStart ? (isPassif ? "Scanner ma visibilité" : "Lancer l'extraction") : "Remplis les champs pour commencer"}</button>
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
   OFFERS MANAGER — Item 8 multi-offres
   ============================== */

function OffersManager({ offersArray, onAdd, onRemove, coherence, targetRoleId }) {
  var inputState = useState("");
  var inputText = inputState[0];
  var setInputText = inputState[1];
  var expandedState = useState(false);
  var expanded = expandedState[0];
  var setExpanded = expandedState[1];

  function handleAdd() {
    if (inputText.trim().length < 20) return;
    onAdd(inputText.trim());
    setInputText("");
  }

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;

  return (
    <div style={{ background: "#16213e", borderRadius: 10, padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={function() { setExpanded(!expanded); }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{"\uD83C\uDFAF"}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6" }}>Offres cibles ({offersArray.length})</span>
        </div>
        <span style={{ fontSize: 10, color: "#495670" }}>{expanded ? "\u25B2" : "\u25BC"}</span>
      </div>

      {coherence && !coherence.coherent && (
        <div style={{ background: "#e94560" + "22", borderRadius: 8, padding: 8, marginTop: 8 }}>
          <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5 }}>{"\u26A0\uFE0F"} {coherence.message}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {coherence.sectors.map(function(s, i) { return <span key={i} style={{ fontSize: 9, color: "#e94560", background: "#1a1a2e", padding: "1px 6px", borderRadius: 6 }}>{s}</span>; })}
          </div>
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 12 }}>
          {offersArray.map(function(offer, i) {
            var signals = offer.parsedSignals;
            var detected = signals ? signals.cauchemars.filter(function(c) { return c.detected; }).length : 0;
            return (
              <div key={offer.id} style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 8, borderLeft: "3px solid " + (detected > 0 ? "#4ecca3" : "#495670") }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5 }}>{offer.text.length > 150 ? offer.text.slice(0, 150) + "..." : offer.text}</div>
                    {signals && signals.totalSignals > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 9, color: "#4ecca3" }}>{signals.totalSignals} signaux</span>
                        <span style={{ fontSize: 9, color: "#8892b0" }}>{detected} cauchemar{detected > 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={function() { onRemove(offer.id); }} style={{ background: "none", border: "none", color: "#e94560", cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 }}>{"\u2715"}</button>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <textarea value={inputText} onChange={function(e) { setInputText(e.target.value); }}
              placeholder="Colle une nouvelle offre d'emploi ici..."
              style={{ width: "100%", minHeight: 80, padding: 10, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 12, lineHeight: 1.5, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <button onClick={handleAdd} disabled={inputText.trim().length < 20} style={{
              width: "100%", marginTop: 6, padding: 10,
              background: inputText.trim().length >= 20 ? "#e94560" : "#1a1a2e",
              color: inputText.trim().length >= 20 ? "#fff" : "#495670",
              border: "none", borderRadius: 8, cursor: inputText.trim().length >= 20 ? "pointer" : "not-allowed",
              fontWeight: 600, fontSize: 12,
            }}>Ajouter cette offre</button>
          </div>
        </div>
      )}
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
  var vState = useState(initialState && initialState.vault ? initialState.vault : { bricks: 0, missions: 0, pillars: 0, corrections: 0, diltsHistory: [] });
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
  var parsedOffersState = useState(initialState && initialState.parsedOffers ? initialState.parsedOffers : null);
  var parsedOffers = parsedOffersState[0];
  var setParsedOffers = parsedOffersState[1];
  var offersArrayState = useState(initialState && initialState.offersArray ? initialState.offersArray : []);
  var offersArray = offersArrayState[0];
  var setOffersArray = offersArrayState[1];
  var offerNextIdState = useState(initialState && initialState.offerNextId ? initialState.offerNextId : 1);
  var offerNextId = offerNextIdState[0];
  var setOfferNextId = offerNextIdState[1];
  var urgenceState = useState(false);
  var urgenceMode = urgenceState[0];
  var setUrgenceMode = urgenceState[1];

  // Recalculate merged signals when offersArray changes
  var offerCoherence = checkOfferCoherence(offersArray);

  function recalcOffersSignals(updatedOffers) {
    var merged = mergeOfferSignals(updatedOffers, targetRoleId);
    setParsedOffers(merged);
    if (merged && merged.cauchemars) {
      setActiveCauchemarsGlobal(merged.cauchemars);
    } else if (targetRoleId) {
      setActiveCauchemarsGlobal(buildActiveCauchemars(null, targetRoleId));
    }
  }

  function handleAddOffer(text) {
    var newOffer = { id: offerNextId, text: text, parsedSignals: parseOfferSignals(text, targetRoleId) };
    var updated = offersArray.concat([newOffer]);
    setOffersArray(updated);
    setOfferNextId(offerNextId + 1);
    recalcOffersSignals(updated);
  }

  function handleRemoveOffer(offerId) {
    var updated = offersArray.filter(function(o) { return o.id !== offerId; });
    setOffersArray(updated);
    recalcOffersSignals(updated);
  }

  // Set global active cauchemars whenever role or parsed offers change
  useEffect(function() {
    if (parsedOffers && parsedOffers.cauchemars) {
      setActiveCauchemarsGlobal(parsedOffers.cauchemars);
    } else if (targetRoleId) {
      setActiveCauchemarsGlobal(buildActiveCauchemars(null, targetRoleId));
    }
  }, [parsedOffers, targetRoleId]);

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
        trajectoryToggle: trajectoryToggle, takes: takes, parsedOffers: parsedOffers,
        offersArray: offersArray, offerNextId: offerNextId,
      });
    }, 500);
  }, [screen, activeStep, bricks, vault, sprintDone, nextId, duelResults, targetRoleId, nightmareCosts, trajectoryToggle, takes, parsedOffers, offersArray, offerNextId]);

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
      internalAdvocacy: seed.internalAdvocacy || generateInternalAdvocacy(seed.generatedText, seed.brickCategory, seed.type, seed.elasticity),
      controlRisk: seed.controlRisk || null,
      advocacyText: seed.advocacyText || generateAdvocacyText(seed.generatedText, seed.brickCategory, seed.type, seed.nightmareText),
      type: "brick", corrected: false,
    };
    var versions = generateBrickVersions(brick, targetRoleId);
    brick.cvVersion = versions.cvVersion;
    brick.interviewVersions = versions.interviewVersions;
    brick.discoveryQuestions = versions.discoveryQuestions;
    brick.stressTest = generateStressTest(brick, targetRoleId, offersArray);
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
      internalAdvocacy: seed.internalAdvocacy || generateInternalAdvocacy(correctedText, seed.brickCategory, seed.type, seed.elasticity),
      controlRisk: seed.controlRisk || null,
      advocacyText: seed.advocacyText || generateAdvocacyText(correctedText, seed.brickCategory, seed.type, seed.nightmareText),
      type: "brick", corrected: true,
    };
    var versions = generateBrickVersions(brick, targetRoleId);
    brick.cvVersion = versions.cvVersion;
    brick.interviewVersions = versions.interviewVersions;
    brick.discoveryQuestions = versions.discoveryQuestions;
    brick.stressTest = generateStressTest(brick, targetRoleId, offersArray);
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
    var versions = generateBrickVersions(newBrick, targetRoleId);
    newBrick.cvVersion = versions.cvVersion;
    newBrick.interviewVersions = versions.interviewVersions;
    newBrick.discoveryQuestions = versions.discoveryQuestions;
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

  var density = computeDensityScore(bricks, getActiveCauchemars());

  var wrap = {
    color: "#ccd6f6",
    fontFamily: "'Inter', -apple-system, sans-serif",
    background: "#0a0a1a",
    minHeight: "100vh",
    padding: "20px",
  };

  if (screen === "onboarding") {
    return (
      <div style={wrap}>
        <Onboarding onStart={function(role, traj, offerSignals, rawOfferText) {
          setTargetRoleId(role);
          setTrajectoryToggle(traj);
          setParsedOffers(offerSignals);
          setSeeds(generateAdaptiveSeeds(role));
          if (rawOfferText && rawOfferText.trim().length > 20) {
            var firstOffer = { id: 1, text: rawOfferText.trim(), parsedSignals: parseOfferSignals(rawOfferText, role) };
            setOffersArray([firstOffer]);
            setOfferNextId(2);
          }
          setScreen("sprint");
        }} onScan={onScan} />
      </div>
    );
  }

  function renderContent() {
    if (sprintDone) return <EndScreen vault={vault} setVault={setVault} bricks={bricks} duelResults={duelResults} maturity={maturity} targetRoleId={targetRoleId} nightmareCosts={nightmareCosts} trajectoryToggle={trajectoryToggle} offersArray={offersArray} />;
    if (activeStep === 0) {
      return (
        <div>
          <Interrogation seeds={seeds} bricks={bricks} onForge={handleForge} onCorrect={handleCorrect} onMission={handleMission} onSkip={handleSkip} onAddBrick={handleAddBrick} paranoMode={paranoMode} targetRoleId={targetRoleId} trajectoryToggle={trajectoryToggle} />
          {allSeedsDone && density.unlocks.forge && (
            <button onClick={function() { setActiveStep(1); }} style={{
              width: "100%", marginTop: 16, padding: 14, background: "#0f3460", color: "#ccd6f6",
              border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
            }}>Passer a la Forge {"\u2192"}</button>
          )}
          {allSeedsDone && !density.unlocks.forge && (
            <div style={{ background: "#e94560" + "22", borderRadius: 10, padding: 14, marginTop: 16, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>{"🔒"} Verrou de Blindage</div>
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
                <div style={{ fontSize: 13, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>{"\uD83D\uDD12"} Densité insuffisante : {density.score}%</div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
                  L'Armement s'ouvre a 70%. {density.details.blindedCount === 0 ? "Aucune brique blindee. Corrige et enrichis tes briques." : density.details.blindedRatio + "% de briques blindees. Continue."}
                  {density.details.cauchemarCoverage < 3 ? " " + (3 - density.details.cauchemarCoverage) + " cauchemar" + (3 - density.details.cauchemarCoverage > 1 ? "s" : "") + " non couvert" + (3 - density.details.cauchemarCoverage > 1 ? "s" : "") + "." : ""}
                  {!density.details.hasCicatrice ? " Aucune cicatrice assumée." : ""}
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
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ccd6f6" }}>La Forge \u2014 Calibrage en cours</div>
        {targetRoleId && KPI_REFERENCE[targetRoleId] && (
          <div style={{ fontSize: 11, color: "#495670", marginTop: 4 }}>{"\uD83C\uDFAF"} {KPI_REFERENCE[targetRoleId].role} ({KPI_REFERENCE[targetRoleId].sector}) {trajectoryToggle === "j_y_suis" ? "\u00B7 J'y suis" : trajectoryToggle === "j_y_vais" ? "\u00B7 J'y vais" : ""}</div>
        )}
      </div>
      {!sprintDone && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8892b0", marginBottom: 6 }}>
            <span style={{ color: density.score >= 70 ? "#4ecca3" : density.score >= 50 ? "#3498db" : "#e94560" }}>
              Densité : {density.score}%
            </span>
            <span>
              {density.score < 50 ? "Verrou actif \u2014 blinde tes briques" : density.score < 70 ? "Seuil de sortie : 70%" : "\uD83D\uDD13 Arsenal pret"}
            </span>
          </div>
          <Bar pct={density.score} />
        </div>
      )}
      {!sprintDone && <Nav steps={STEPS} active={activeStep} onSelect={setActiveStep} density={density} />}
      {!sprintDone && offersArray.length > 0 && <OffersManager offersArray={offersArray} onAdd={handleAddOffer} onRemove={handleRemoveOffer} coherence={offerCoherence} targetRoleId={targetRoleId} />}
      {!sprintDone && <Vault v={vault} maturity={maturity} bricks={bricks} nightmareCosts={nightmareCosts} onCostChange={function(cId, val) { setNightmareCosts(function(prev) { var next = Object.assign({}, prev); next[cId] = val; return next; }); }} />}
      {!sprintDone && <CVPreview bricks={bricks} />}
      {!sprintDone && <InvestmentIndex bricks={bricks} />}
      {!sprintDone && <CrossRoleInsight bricks={bricks} targetRoleId={targetRoleId} trajectoryToggle={trajectoryToggle} />}
      {!sprintDone && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={function() {
            if (!urgenceMode) {
              if (confirm("L'Etabli : tes scripts seront generes avec les briques disponibles, blindees ou non. Un script sans preuve chiffree ouvre une conversation. Il ne la ferme pas. Activer ?")) {
                setUrgenceMode(true);
              }
            } else {
              setUrgenceMode(false);
            }
          }} style={{
            width: "100%", padding: "10px 16px", background: urgenceMode ? "#e94560" + "22" : "#1a1a2e",
            border: "1px solid " + (urgenceMode ? "#e94560" : "#16213e"), borderRadius: 10,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>{urgenceMode ? "\u26A1" : "\u26A1"}</span>
              <span style={{ fontSize: 12, color: urgenceMode ? "#e94560" : "#495670", fontWeight: 700 }}>
                {urgenceMode ? "ETABLI ACTIF" : "Activer l'Etabli"}
              </span>
            </div>
            <div style={{
              width: 36, height: 20, borderRadius: 10, background: urgenceMode ? "#e94560" : "#0f3460",
              position: "relative", transition: "background 0.3s",
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: 8, background: "#ccd6f6",
                position: "absolute", top: 2, left: urgenceMode ? 18 : 2, transition: "left 0.3s",
              }} />
            </div>
          </button>
          {!urgenceMode && (
            <div style={{ fontSize: 10, color: "#495670", textAlign: "center", marginTop: 4 }}>Active l'Etabli pour recevoir tes scripts et CV pendant la Forge.</div>
          )}
        </div>
      )}
      {!sprintDone && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #16213e" }}>
          <button onClick={function() {
            var v = bricks.filter(function(b) { return b.status === "validated"; });
            var bl = v.filter(function(b) { return b.blinded; });
            var cov = computeCauchemarCoverage(bricks).filter(function(c) { return c.covered; });
            var mis = bricks.filter(function(b) { return b.type === "mission"; });
            var summary = v.length + " brique" + (v.length > 1 ? "s" : "") + " forgee" + (v.length > 1 ? "s" : "") + ". "
              + bl.length + " blindee" + (bl.length > 1 ? "s" : "") + ". "
              + cov.length + " cauchemar" + (cov.length > 1 ? "s" : "") + " couvert" + (cov.length > 1 ? "s" : "") + "."
              + (mis.length > 0 ? " " + mis.length + " mission" + (mis.length > 1 ? "s" : "") + " en attente." : "")
              + "\n\nTon Coffre-Fort est sauvegarde. Tu reviens quand tu veux.";
            if (confirm(summary)) { setSprintDone(true); }
          }} style={{
            width: "100%", padding: "10px 16px", background: "none",
            border: "1px solid #495670", borderRadius: 10, cursor: "pointer",
            fontSize: 12, color: "#495670", fontWeight: 600,
          }}>Mise en Veille</button>
          <div style={{ fontSize: 10, color: "#495670", textAlign: "center", marginTop: 4 }}>Pause la Forge. Tes briques restent.</div>
        </div>
      )}
      {!sprintDone && <WorkBench bricks={bricks} targetRoleId={targetRoleId} trajectoryToggle={trajectoryToggle} vault={vault} offersArray={offersArray} isActive={urgenceMode} />}
      <div style={{ background: "#16213e", borderRadius: 12, padding: 20 }}>
        {renderContent()}
      </div>
      {toastBrick && <FeedbackToast brick={toastBrick} onDone={function() { setToastBrick(null); }} />}
    </div>
  );
}
