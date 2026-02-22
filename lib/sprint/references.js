// Sprint reference data — extracted from Sprint.jsx

export var SCAN_STEPS_ACTIF = [
  "Analyse du profil en cours...",
  "Extraction des compétences clés...",
  "Scan des offres ciblées...",
  "Identification des KPIs cachés...",
  "Extraction des cauchemars du décideur...",
  "Cartographie de l'élasticité marché...",
  "Simulation de l'entonnoir recruteur...",
  "Croisement profil et marché...",
  "Détection des terrains adjacents...",
  "Préparation des questions de prise de position...",
  "Calcul du Fossé détecté...",
  "Coffre-Fort initialisé.",
];

export var SCAN_STEPS_PASSIF = [
  "Analyse du profil en cours...",
  "Extraction des compétences clés...",
  "Scan de visibilité sectorielle...",
  "Identification des signaux faibles...",
  "Cartographie de l'élasticité marché...",
  "Croisement profil et marché...",
  "Calcul du Fossé détecté...",
  "Coffre-Fort initialisé.",
];

export var STEPS = [
  { gate: "OUVERT", title: "Extraction", icon: "\u26CF\uFE0F", desc: "Valide tes briques" },
  { gate: "3+ BRIQUES", title: "Assemblage", icon: "\uD83D\uDD28", desc: "Assemble et blinde" },
  { gate: "BLINDAGE 50%", title: "Polissage", icon: "\uD83D\uDD2A", desc: "Audit et positions" },
  { gate: "BLINDAGE 70%", title: "Calibration", icon: "\uD83C\uDFAF", desc: "Duel et scripts" },
];


/* ==============================
   REFERENTIEL MAITRE — 50 KPIs x 10 POSTES
   Elasticite: élastique / stable / sous_pression
   ============================== */

export var KPI_REFERENCE = {
  "enterprise_ae": {
    role: "Enterprise Account Executive",
    sector: "SaaS/Tech", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Cycles de deals courts, pipeline en mouvement constant. Chaque mois sans mise à jour est un mois de négociation à l'aveugle.",
    kpis: [
      { name: "Alignement Multi-décideurs", elasticity: "élastique", why: "L'IA ne gère pas la politique interne d'un grand compte. C'est de l'influence pure." },
      { name: "Valeur Contractuelle (ACV)", elasticity: "stable", why: "Mesure la taille du deal. Standard, mais nécessaire pour prouver l'échelle." },
      { name: "Taux de Conquête (Win Rate)", elasticity: "élastique", why: "Prouve la capacité à battre la concurrence par la stratégie, pas par le prix." },
      { name: "Vitesse du Cycle de Vente", elasticity: "élastique", why: "Réduire le temps de décision dans le flou est un levier de cash massif." },
      { name: "Volume de Prospection", elasticity: "sous_pression", why: "L'IA génère déjà des séquences de mails. Zéro valeur ajoutée humaine ici." },
    ]
  },
  "head_of_growth": {
    role: "Head of Growth",
    sector: "Growth/Marketing", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Cycles de tests courts. Les métriques bougent chaque semaine. Cristalliser les apprentissages chaque mois empêche l'amnésie.",
    kpis: [
      { name: "LTV / CAC Ratio", elasticity: "élastique", why: "L'arbitrage final entre coût d'acquisition et valeur long-terme est une décision d'Architecte." },
      { name: "Taux d'Expérimentation Réussie", elasticity: "élastique", why: "L'IA propose 100 tests, l'humain choisit les 2 qui vont scaler." },
      { name: "Rétention (Cohortes)", elasticity: "stable", why: "Indicateur de santé du produit. Moins élastique que la stratégie d'acquisition." },
      { name: "CPA (Coût par Acquisition)", elasticity: "sous_pression", why: "L'IA optimise les enchères publicitaires mieux que n'importe quel humain." },
      { name: "Viralité / K-Factor", elasticity: "élastique", why: "Créer un désir organique demande une compréhension profonde de la psychologie humaine." },
    ]
  },
  "strategic_csm": {
    role: "Strategic Customer Success Manager",
    sector: "Customer Success", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Churn et expansion se jouent au mois. Chaque renouvellement est un arbitrage. Le documenter en temps réel est le seul filet.",
    kpis: [
      { name: "Net Revenue Retention (NRR)", elasticity: "élastique", why: "Faire croître un compte existant demande une influence politique constante." },
      { name: "Expansion Revenue (Upsell)", elasticity: "élastique", why: "Identifier le besoin métier avant le client est un acte de pure lucidité." },
      { name: "Taux de Churn Prédictif", elasticity: "stable", why: "L'IA détecte les signaux de départ, l'humain doit agir sur les causes profondes." },
      { name: "Nombre de Tickets Support", elasticity: "sous_pression", why: "La gestion du flux de problèmes est automatisable via Chatbots/IA." },
      { name: "NPS / CSAT", elasticity: "sous_pression", why: "La satisfaction déclarée est souvent un bruit de fond inélastique." },
    ]
  },
  "senior_pm": {
    role: "Senior Product Manager",
    sector: "Product", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Les arbitrages produit se cristallisent par quarter. Trop fréquent tue la profondeur. Trop rare efface les décisions.",
    kpis: [
      { name: "ROI des Fonctionnalités", elasticity: "élastique", why: "Décider de tuer une feature pour sauver le produit est un arbitrage critique." },
      { name: "Time-to-Market (Vélocité)", elasticity: "élastique", why: "Orchestrer les équipes pour livrer vite dans le chaos est un levier majeur." },
      { name: "Adoption Rate (Usage)", elasticity: "stable", why: "Mesure si le produit est utile. C'est la base, pas forcément le levier." },
      { name: "Rédaction de User Stories", elasticity: "sous_pression", why: "Claude écrit déjà des specs parfaites. Zéro levier pour un PM Senior." },
      { name: "Priorisation du Backlog", elasticity: "élastique", why: "Dire non à 99% des demandes demande un courage politique non-substituable." },
    ]
  },
  "ai_architect": {
    role: "AI Solution Architect",
    sector: "AI/Tech", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Projets de fond, arbitrages infra lourds. Le rythme trimestriel s'aligne sur les cycles budgétaires.",
    kpis: [
      { name: "Réduction de la Latence Décisionnelle", elasticity: "élastique", why: "Son rôle est de faire gagner des semaines à l'entreprise via l'IA." },
      { name: "Coût d'Infra / ROI IA", elasticity: "élastique", why: "Arbitrer entre puissance de modèle et rentabilité est une brique de Décision pure." },
      { name: "Taux d'Erreur (Hallucination)", elasticity: "stable", why: "Technique. Indispensable mais c'est de l'optimisation, pas de la stratégie." },
      { name: "Nombre de Prompts Créés", elasticity: "sous_pression", why: "Quantité vs Qualité. La génération de prompts devient une commodité." },
      { name: "Adoption Interne des Outils IA", elasticity: "élastique", why: "L'IA ne s'implémente pas seule, il faut vaincre la résistance humaine." },
    ]
  },
  "engineering_manager": {
    role: "Engineering Manager",
    sector: "Engineering", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Les decisions techniques structurantes se prennent par quarter. Build vs Buy, dette technique, retention talent.",
    kpis: [
      { name: "Densité de Talent (Rétention)", elasticity: "élastique", why: "Garder les meilleurs devs en 2026 demande un cadre d'exécution exceptionnel." },
      { name: "Cycle Time (Commit to Deploy)", elasticity: "élastique", why: "Fluidifier le passage à l'acte technique est l'actif principal du manager." },
      { name: "Qualité du Code (Bugs/Dette)", elasticity: "stable", why: "L'IA aide à nettoyer le code. C'est de l'hygiène de base." },
      { name: "Lignes de Code Produites", elasticity: "sous_pression", why: "L'IA produit des milliers de lignes. C'est une métrique de vanité." },
      { name: "Arbitrage Build vs Buy", elasticity: "élastique", why: "Décider d'acheter une solution plutôt que de la coder est une décision de survie." },
    ]
  },
  "management_consultant": {
    role: "Management Consultant",
    sector: "Conseil", cadence: 90, cadenceLabel: "Trimestrielle", cadenceReason: "Les missions durent 2-6 mois. Le rythme trimestriel capture un cycle complet de livraison.",
    kpis: [
      { name: "Taux d'Acceptation des Recommandations", elasticity: "élastique", why: "Vendre une idée difficile à un comité de direction est l'apogée de l'influence." },
      { name: "Impact sur l'EBITDA", elasticity: "élastique", why: "Prouver un gain financier direct après intervention est la brique ultime." },
      { name: "Clarté du Diagnostic", elasticity: "stable", why: "L'IA synthétise les données. L'expert en extrait le sens caché." },
      { name: "Nombre de Slides Produites", elasticity: "sous_pression", why: "Le Slide-making est mort. L'IA fait des decks en 2 minutes." },
      { name: "Vitesse de Résolution de Crise", elasticity: "élastique", why: "Agir vite quand tout brûle est ce qui justifie le TJM élevé." },
    ]
  },
  "strategy_associate": {
    role: "Strategy & Corporate Associate",
    sector: "Strategy/Finance", cadence: 180, cadenceLabel: "Semestrielle", cadenceReason: "Évolution lente. Les arbitrages stratégiques se comptent par semestre. Focus sur l'alignement politique et les jalons annuels.",
    kpis: [
      { name: "Précision des Signaux Faibles", elasticity: "élastique", why: "Voir une menace dans un rapport SEC avant les autres est un levier pur." },
      { name: "Fiabilité des Modèles Financiers", elasticity: "stable", why: "C'est de l'ingénierie financière. L'IA ne doit pas faire d'erreur ici." },
      { name: "Alignement du Comex", elasticity: "élastique", why: "Transformer une analyse en décision collective est de l'influence de haut vol." },
      { name: "Synthèse de Rapports Annuels", elasticity: "sous_pression", why: "N'importe quel LLM résume 200 pages en 5 secondes. Zéro valeur." },
      { name: "Impact M&A (Synergies)", elasticity: "élastique", why: "Évaluer si deux cultures peuvent fusionner demande une intuition humaine." },
    ]
  },
  "operations_manager": {
    role: "Operations Manager / BizOps",
    sector: "Operations", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "L'Ops vit au rythme des process. Chaque mois amène de nouvelles frictions inter-services à documenter.",
    kpis: [
      { name: "Réduction de la Charge Cognitive", elasticity: "élastique", why: "Simplifier le travail des autres pour qu'ils se concentrent sur le levier." },
      { name: "Taux de Passage à l'Acte (Output)", elasticity: "élastique", why: "Transformer une idée en processus fluide est le cœur de l'Ops." },
      { name: "Coût Opérationnel Unitaire", elasticity: "stable", why: "Mesure l'efficience. Important pour la rentabilité." },
      { name: "Maintenance des Outils (SaaS)", elasticity: "sous_pression", why: "L'IA gère l'interopérabilité des outils. Tâche administrative à faible valeur." },
      { name: "Indice de Friction Inter-services", elasticity: "élastique", why: "Résoudre les conflits entre Sales et Produit est un arbitrage humain." },
    ]
  },
  "fractional_coo": {
    role: "Fractional COO",
    sector: "Scale & Performance", cadence: 30, cadenceLabel: "Mensuelle", cadenceReason: "Flux de decisions rapide, multiplicite des clients. Justifier le ROI chaque mois est une question de survie.",
    kpis: [
      { name: "Accélération du Runway", elasticity: "élastique", why: "Faire gagner 6 mois de survie à une boîte est l'actif le plus cher du marché." },
      { name: "Alignement des Équipes N-1", elasticity: "élastique", why: "S'assurer que tout le monde court dans la même direction sans être là 24/7." },
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

export var CAUCHEMAR_TEMPLATES_BY_ROLE = {
  enterprise_ae: [
    { kpis: ["Alignement Multi-décideurs"], kw: ["grand compte", "enterprise", "c-level", "comite", "multi", "stakeholder", "cycle long", "complexe", "key account", "strategic"], label: "Deals bloqués en politique interne", nightmare: "4 décideurs. Aucun ne signe. Le commercial précédent a perdu 6 mois sur ce deal.", cost: [200000, 800000], context: "Coût du blocage politique : deals en stand-by, forecast non fiable, crédibilité en chute." },
    { kpis: ["Valeur Contractuelle (ACV)"], kw: ["arr", "mrr", "acv", "revenue", "chiffre d'affaires", "panier moyen", "deal size", "mid-market", "upsell"], label: "Valeur contractuelle en érosion", nightmare: "Le panier moyen baisse. Les deals se signent mais pour moins cher. Le board demande des comptes.", cost: [150000, 600000], context: "Érosion du ACV : pression concurrentielle + remises non-stratégiques." },
    { kpis: ["Taux de Conquête (Win Rate)"], kw: ["win rate", "taux de conversion", "closing", "concurrence", "competitif", "appel d'offre", "rfp", "benchmark"], label: "Win rate en chute libre", nightmare: "L'équipe perd 7 deals sur 10. La concurrence mange le pipeline. Le VP Sales ne dort plus.", cost: [300000, 1000000], context: "Chaque point de win rate perdu = pipeline entier dévalué." },
    { kpis: ["Vitesse du Cycle de Vente"], kw: ["cycle de vente", "time to close", "pipeline", "forecast", "velocite", "acceleration", "process", "structurer"], label: "Deals qui traînent 6 mois", nightmare: "Le CFO calcule le coût du cash immobilisé. Les deals meurent de vieillesse dans le CRM.", cost: [100000, 500000], context: "Cash immobilisé dans des deals non-clos + coût d'opportunité." },
    { kpis: ["Volume de Prospection"], kw: ["prospection", "outbound", "lead", "sdr", "bdr", "generation", "cold call", "sequence", "mail"], label: "Pipeline vide en amont", nightmare: "Zéro deal en entrée de pipe. L'équipe attend. Le trimestre est déjà perdu.", cost: [100000, 400000], context: "Pipeline sec = trimestre condamné. Chaque semaine sans lead est irréversible." },
  ],
  head_of_growth: [
    { kpis: ["LTV / CAC Ratio"], kw: ["ltv", "cac", "ratio", "rentabilite", "payback", "unit economics", "marge", "burn"], label: "LTV/CAC déséquilibré", nightmare: "Chaque client acquis coûte plus qu'il ne rapporte. Le burn rate accélère. Les investisseurs voient rouge.", cost: [200000, 800000], context: "Déséquilibre LTV/CAC : chaque euro dépensé en acquisition détruit de la valeur." },
    { kpis: ["Taux d'Expérimentation Réussie"], kw: ["a/b test", "experimentation", "test", "hypothese", "growth hack", "iteration", "data-driven", "growth"], label: "100 tests, zéro signal", nightmare: "L'équipe teste tout. Rien ne scale. Le CEO demande où passe le budget.", cost: [100000, 500000], context: "Tests sans thèse = bruit. Budget consommé sans apprentissage." },
    { kpis: ["Rétention (Cohortes)"], kw: ["retention", "cohorte", "churn", "engagement", "activation", "onboarding", "stickiness"], label: "Seau percé en activation", nightmare: "Le produit acquiert 1000 users par mois. 800 partent. La croissance est une illusion.", cost: [150000, 600000], context: "Chaque point de churn annule l'effort d'acquisition." },
    { kpis: ["CPA (Coût par Acquisition)"], kw: ["cpa", "cout", "paid", "ads", "adwords", "facebook ads", "meta ads", "budget media", "roas", "roi"], label: "CPA qui explose", nightmare: "Le coût par lead a doublé en 6 mois. Le même budget génère 2x moins de clients.", cost: [100000, 400000], context: "Inflation publicitaire + saturation des canaux." },
    { kpis: ["Viralité / K-Factor"], kw: ["viralite", "referral", "organique", "bouche a oreille", "plg", "product-led", "k-factor", "nps"], label: "Croissance 100% achetée", nightmare: "Zéro viralité. Chaque client vient de la pub. Le jour où le budget coupe, la croissance meurt.", cost: [100000, 500000], context: "Dépendance totale aux canaux payés = fragilité structurelle." },
  ],
  strategic_csm: [
    { kpis: ["Net Revenue Retention (NRR)"], kw: ["nrr", "net revenue", "retention", "base installee", "renouvellement", "contrat", "expansion"], label: "Base qui rétrécit", nightmare: "Le NRR passe sous 100%. La base installée fond. Chaque mois détruit du revenu récurrent.", cost: [200000, 800000], context: "NRR < 100% = entreprise qui rétrécit même en signant des nouveaux clients." },
    { kpis: ["Expansion Revenue (Upsell)"], kw: ["upsell", "cross-sell", "expansion", "upgrade", "adoption", "usage", "croissance organique"], label: "Zéro expansion sur la base", nightmare: "Les clients paient le minimum. Personne ne détecte les besoins latents. Le revenu est flat.", cost: [150000, 600000], context: "Upsell manqué : chaque client sous-exploité est du revenu invisible." },
    { kpis: ["Taux de Churn Prédictif"], kw: ["churn", "attrition", "depart", "resiliation", "desengagement", "signal faible", "health score"], label: "Hémorragie de churn", nightmare: "Le churn bouffe la croissance. Chaque client perdu coûte 5x. Personne ne voit les signaux.", cost: [150000, 600000], context: "Chaque point de churn = 5x le coût d'acquisition en revenus perdus." },
    { kpis: ["Nombre de Tickets Support"], kw: ["support", "ticket", "escalade", "incident", "bug", "sla", "satisfaction"], label: "Équipe noyée sous les tickets", nightmare: "L'équipe passe 80% du temps en réactif. Zéro temps pour l'upsell. Les clients stratégiques attendent.", cost: [80000, 300000], context: "Réactif tue le proactif. L'équipe éteint des feux au lieu de construire." },
    { kpis: ["NPS / CSAT"], kw: ["nps", "csat", "satisfaction", "feedback", "survey", "enquete", "voix du client"], label: "Satisfaction en chute silencieuse", nightmare: "Le NPS chute. Les clients ne se plaignent pas. Ils partent. Le signal arrive trop tard.", cost: [100000, 400000], context: "Satisfaction en baisse = churn futur. Le décalage temporel est le piège." },
  ],
  senior_pm: [
    { kpis: ["ROI des Fonctionnalités"], kw: ["roi", "impact", "fonctionnalite", "feature", "valeur", "priorisation", "discovery", "outcome"], label: "Features sans impact", nightmare: "L'équipe livre 12 features par quarter. 10 ne bougent aucune métrique. Le roadmap est un catalogue.", cost: [150000, 500000], context: "Features sans ROI = dette produit. Chaque sprint gaspillé détruit la confiance engineering." },
    { kpis: ["Time-to-Market (Vélocité)"], kw: ["time to market", "velocite", "sprint", "livraison", "agile", "scrum", "delivery", "release"], label: "Time-to-market en retard", nightmare: "La concurrence sort des features chaque semaine. L'équipe met 3 mois pour livrer. Le marché n'attend pas.", cost: [100000, 400000], context: "Retard de livraison = fenêtre de marché ratée." },
    { kpis: ["Adoption Rate (Usage)"], kw: ["adoption", "usage", "engagement", "activation", "dau", "mau", "retention produit"], label: "Produit lancé, personne ne l'utilise", nightmare: "L'adoption stagne à 15%. Le CEO demande pourquoi les users n'accrochent pas.", cost: [100000, 400000], context: "Feature livrée sans adoption = investissement perdu." },
    { kpis: ["Rédaction de User Stories"], kw: ["user story", "spec", "prd", "documentation", "brief", "cahier des charges"], label: "Specs floues, équipe perdue", nightmare: "L'engineering code dans le vide. Les specs changent en plein sprint. Le rework mange 40% du temps.", cost: [80000, 300000], context: "Specs instables = rework + frustration engineering." },
    { kpis: ["Priorisation du Backlog"], kw: ["priorisation", "backlog", "roadmap", "strategie", "arbitrage", "stakeholder", "trade-off"], label: "Backlog sans arbitrage", nightmare: "50 demandes. Zéro tri. Le produit dit oui à tout le monde et ne livre rien d'important.", cost: [100000, 400000], context: "Priorisation absente = produit médiocre sur tous les fronts." },
  ],
  ai_architect: [
    { kpis: ["Réduction de la Latence Décisionnelle"], kw: ["decision", "latence", "automatisation", "workflow", "process", "temps", "efficacite"], label: "Décisions IA bloquées", nightmare: "Le projet IA est approuvé depuis 6 mois. Personne n'avance. La concurrence déploie.", cost: [200000, 800000], context: "Chaque semaine de retard IA = avantage concurrentiel perdu." },
    { kpis: ["Coût d'Infra / ROI IA"], kw: ["cout", "infra", "cloud", "gpu", "compute", "budget", "roi", "rentabilite"], label: "Budget IA sans ROI", nightmare: "La facture cloud explose. Le CFO demande le ROI. Personne ne sait le calculer.", cost: [150000, 600000], context: "Investissement IA sans mesure = gouffre financier." },
    { kpis: ["Taux d'Erreur (Hallucination)"], kw: ["hallucination", "erreur", "precision", "qualite", "fiabilite", "guardrail", "eval"], label: "IA qui hallucine en prod", nightmare: "Le modèle sort des réponses fausses. Les utilisateurs perdent confiance. Le projet risque l'arrêt.", cost: [100000, 500000], context: "Erreur en production = confiance détruite. Reconstruction lente." },
    { kpis: ["Nombre de Prompts Créés"], kw: ["prompt", "llm", "modele", "fine-tuning", "rag", "embedding", "generation"], label: "Prompts sans stratégie", nightmare: "100 prompts créés. Zéro industrialisé. L'équipe réinvente la roue chaque semaine.", cost: [80000, 300000], context: "Multiplication sans capitalisation = effort perdu." },
    { kpis: ["Adoption Interne des Outils IA"], kw: ["adoption", "change management", "formation", "resistance", "transformation", "interne"], label: "Équipes qui refusent l'IA", nightmare: "L'outil est là. Personne ne l'utilise. Les équipes contournent et font à l'ancienne.", cost: [150000, 500000], context: "Investissement IA sans adoption = argent perdu." },
  ],
  engineering_manager: [
    { kpis: ["Densité de Talent (Rétention)"], kw: ["retention", "talent", "recrutement", "turn-over", "depart", "senior", "equipe", "culture"], label: "Fuite de talents", nightmare: "Le meilleur dev est parti. Le deuxième négocie. Le troisième attend une offre. L'équipe se vide.", cost: [200000, 800000], context: "Remplacement d'un dev senior : 6 mois de productivité perdue + coût de recrutement." },
    { kpis: ["Cycle Time (Commit to Deploy)"], kw: ["cycle time", "deploy", "ci/cd", "release", "pipeline", "devops", "livraison"], label: "Cycle de deploy trop lent", nightmare: "Un commit met 3 semaines à atteindre la prod. La concurrence livre en 3 heures.", cost: [100000, 400000], context: "Cycle lent = feedback lent = produit déconnecté du marché." },
    { kpis: ["Qualité du Code (Bugs/Dette)"], kw: ["bug", "dette technique", "qualite", "refactoring", "test", "coverage", "regression"], label: "Dette technique qui paralyse", nightmare: "Chaque feature prend 3x le temps prévu. La dette technique mange les sprints.", cost: [100000, 400000], context: "Dette technique = taxe invisible sur chaque livraison." },
    { kpis: ["Lignes de Code Produites"], kw: ["productivite", "output", "velocite", "story point", "throughput"], label: "Productivité en chute", nightmare: "L'équipe travaille 60h mais le throughput baisse. Le problème n'est pas l'effort.", cost: [80000, 300000], context: "Productivité en baisse = signal de management, pas d'effort." },
    { kpis: ["Arbitrage Build vs Buy"], kw: ["build vs buy", "make or buy", "saas", "outil", "integration", "api", "vendor"], label: "Build inutile sur un problème résolu", nightmare: "L'équipe construit en interne un outil qui existe à 50 euros par mois. 6 mois perdus.", cost: [150000, 500000], context: "Build par fierté détruit plus de valeur qu'il n'en crée." },
  ],
  management_consultant: [
    { kpis: ["Taux d'Acceptation des Recommandations"], kw: ["recommandation", "presentation", "comite", "direction", "decision", "strategie", "accompagnement"], label: "Recommandations ignorées", nightmare: "Le deck est parfait. Le comité dit oui puis ne fait rien. L'impact est nul.", cost: [200000, 800000], context: "Recommandation acceptée sans exécution = mission sans valeur." },
    { kpis: ["Impact sur l'EBITDA"], kw: ["ebitda", "p&l", "resultat", "marge", "rentabilite", "cout", "economies"], label: "Mission sans impact financier", nightmare: "6 mois de mission. Le client ne sait pas chiffrer l'impact. Le renouvellement est compromis.", cost: [150000, 600000], context: "Impact non mesuré = valeur non perçue = client perdu." },
    { kpis: ["Clarté du Diagnostic"], kw: ["diagnostic", "analyse", "audit", "etat des lieux", "transformation", "assessment"], label: "Diagnostic flou", nightmare: "Le diagnostic dit tout et ne tranche rien. Le client reste paralysé.", cost: [100000, 400000], context: "Diagnostic sans arbitrage = consultant remplaçable par un LLM." },
    { kpis: ["Nombre de Slides Produites"], kw: ["slide", "powerpoint", "deck", "presentation", "rapport", "deliverable"], label: "Livrables sans substance", nightmare: "80 slides. Zéro insight. Le partner demande où est la valeur ajoutée.", cost: [80000, 300000], context: "Slide-making sans pensée = commodité pure." },
    { kpis: ["Vitesse de Résolution de Crise"], kw: ["crise", "urgence", "restructuration", "transformation", "turnaround", "cost cutting"], label: "Crise non résolue", nightmare: "La crise dure depuis 3 mois. Le consultant précédent a produit des slides. Rien n'a changé.", cost: [300000, 1000000], context: "En crise, chaque semaine coûte. Le TJM se justifie par la vitesse." },
  ],
  strategy_associate: [
    { kpis: ["Précision des Signaux Faibles"], kw: ["signal", "veille", "marche", "tendance", "concurrence", "disruption", "analyse"], label: "Signaux faibles ignorés", nightmare: "Le concurrent a vu la tendance 6 mois avant. Le Comex découvre le problème dans la presse.", cost: [200000, 800000], context: "Signal faible manqué = décision stratégique en retard." },
    { kpis: ["Fiabilité des Modèles Financiers"], kw: ["modele", "financier", "forecast", "projection", "budget", "plan", "business plan"], label: "Modèles financiers non fiables", nightmare: "La projection était fausse de 40%. Le board a pris une décision sur des chiffres erronés.", cost: [150000, 600000], context: "Modèle faux = décision fausse = capital mal alloué." },
    { kpis: ["Alignement du Comex"], kw: ["comex", "board", "gouvernance", "alignement", "politique", "consensus", "arbitrage"], label: "Comex désaligné", nightmare: "Le CEO veut croissance. Le CFO veut profitabilité. Personne ne tranche. L'entreprise zigzague.", cost: [300000, 1000000], context: "Comex désaligné = paralysie stratégique." },
    { kpis: ["Synthèse de Rapports Annuels"], kw: ["rapport", "synthese", "analyse", "data", "benchmark", "etude"], label: "Analyse sans synthèse", nightmare: "200 pages de données. Zéro recommandation. Le directeur stratégie demande 'et alors ?'", cost: [80000, 300000], context: "Data sans sens = bruit coûteux." },
    { kpis: ["Impact M&A (Synergies)"], kw: ["m&a", "acquisition", "fusion", "synergie", "integration", "due diligence"], label: "Synergies M&A fantômes", nightmare: "L'acquisition est faite. Les synergies annoncées ne se matérialisent pas. Le write-off approche.", cost: [500000, 2000000], context: "70% des fusions détruisent de la valeur. L'enjeu est dans l'exécution." },
  ],
  operations_manager: [
    { kpis: ["Réduction de la Charge Cognitive"], kw: ["charge", "cognitive", "simplification", "process", "procedure", "workflow", "automatisation"], label: "Équipes surchargées", nightmare: "Les équipes passent 60% du temps sur des tâches admin. Le vrai travail se fait en heures sup.", cost: [100000, 400000], context: "Charge cognitive excessive = erreurs + burn-out + turnover." },
    { kpis: ["Taux de Passage à l'Acte (Output)"], kw: ["execution", "output", "implementation", "deploiement", "mise en oeuvre", "projet"], label: "Idées sans exécution", nightmare: "10 projets lancés. 2 terminés. Les autres meurent dans des spreadsheets.", cost: [100000, 400000], context: "Exécution manquée = stratégie inexistante." },
    { kpis: ["Coût Opérationnel Unitaire"], kw: ["cout", "operationnel", "efficience", "optimisation", "budget", "reduction"], label: "Coûts opérationnels qui dérapent", nightmare: "Le coût par transaction double. La marge fond. Personne ne sait où ça part.", cost: [100000, 400000], context: "Coût unitaire en hausse = rentabilité en érosion silencieuse." },
    { kpis: ["Maintenance des Outils (SaaS)"], kw: ["outil", "saas", "stack", "integration", "api", "interoperabilite", "migration"], label: "Stack techno ingérable", nightmare: "15 outils. Aucun ne se parle. L'équipe copie-colle entre 3 interfaces. 4h par jour perdues.", cost: [80000, 300000], context: "Stack fragmentée = données en silo + temps perdu." },
    { kpis: ["Indice de Friction Inter-services"], kw: ["friction", "silo", "transverse", "collaboration", "inter-equipe", "coordination", "communication"], label: "Guerre entre les services", nightmare: "Sales accuse Produit. Produit accuse Engineering. Le client attend au milieu.", cost: [150000, 500000], context: "Friction inter-services = retard client + turnover interne." },
  ],
  fractional_coo: [
    { kpis: ["Accélération du Runway"], kw: ["runway", "cash", "burn", "levee", "financement", "tresorerie", "survie", "serie"], label: "Runway qui fond", nightmare: "6 mois de cash. Pas de levée en vue. Chaque décision compte double.", cost: [300000, 1000000], context: "Chaque mois de runway gagné = une chance supplémentaire de pivoter." },
    { kpis: ["Alignement des Équipes N-1"], kw: ["equipe", "management", "n-1", "alignement", "organisation", "restructuration", "scale"], label: "Équipes N-1 désalignées", nightmare: "3 directors. 3 stratégies. Le CEO arbitre à la journée. Zéro cohérence.", cost: [200000, 800000], context: "N-1 désaligné = exécution chaotique = runway grillé plus vite." },
    { kpis: ["Mise en Place du Cadre (Governance)"], kw: ["gouvernance", "cadre", "process", "structure", "kpi", "reporting", "suivi"], label: "Zéro cadre de gouvernance", nightmare: "Pas de process. Pas de KPI. Le CEO gère au feeling. Ça marchait à 10, ça casse à 50.", cost: [150000, 500000], context: "Absence de cadre = décisions par urgence, pas par stratégie." },
    { kpis: ["Reporting Hebdomadaire"], kw: ["reporting", "dashboard", "tableau de bord", "suivi", "visibilite", "data"], label: "Pilotage à l'aveugle", nightmare: "Le board demande les chiffres. Personne ne les a. Le CFO passe 2 jours à compiler.", cost: [80000, 300000], context: "Reporting manuel = données toujours en retard." },
    { kpis: ["ROI du Temps de Direction"], kw: ["direction", "ceo", "cofondateur", "temps", "delegation", "focus", "priorite"], label: "CEO noyé dans l'opérationnel", nightmare: "Le CEO passe 70% du temps à éteindre des feux. Zéro temps stratégie. Zéro temps produit.", cost: [200000, 800000], context: "Temps du CEO mal alloué = coût d'opportunité maximum." },
  ],
};

/* Urgency boosters — keywords that increase cauchemar severity */
export var OFFER_URGENCY_KEYWORDS = ["urgent", "asap", "immédiat", "rapidement", "des que possible", "forte croissance", "hyper-croissance", "scale-up", "restructuration", "remplacement", "depart", "critique", "prioritaire", "creation de poste", "ouverture de poste"];

export var SECTOR_KEYWORDS = {
  "SaaS/Tech": ["saas", "software", "tech", "cloud", "plateforme", "api", "startup"],
  "Finance": ["banque", "finance", "assurance", "investissement", "trading", "fintech", "audit"],
  "Conseil": ["conseil", "consulting", "cabinet", "strategie", "transformation", "big four"],
  "Industrie": ["industrie", "manufacturing", "production", "supply chain", "logistique", "usine"],
  "Santé": ["sante", "pharma", "medical", "biotech", "hopital", "clinique", "laboratoire"],
  "Retail": ["retail", "commerce", "e-commerce", "distribution", "magasin", "marketplace"],
  "Media": ["media", "agence", "communication", "publicite", "marketing digital", "contenu"],
  "Education": ["education", "formation", "edtech", "ecole", "universite", "enseignement"],
};

export var TARGET_ROLES = Object.keys(KPI_REFERENCE).map(function(key) {
  return { id: key, role: KPI_REFERENCE[key].role, sector: KPI_REFERENCE[key].sector };
});

/* ==============================
   ROLE CLUSTERS — 10 grouped buttons
   Labels: client-facing titles (not référence names)
   Subtitles: questions (not descriptions)
   ============================== */

export var ROLE_CLUSTERS = [
  { id: "enterprise_ae", bloc: "Croissance", label: "Commercial / Account Executive / Business Developer", subtitle: "Tu gères un cycle de vente ou un portefeuille ?", sectorLabel: "Vente" },
  { id: "head_of_growth", bloc: "Croissance", label: "Growth / Marketing Manager / Acquisition", subtitle: "Tu mesures un coût d'acquisition ou un taux de conversion ?", sectorLabel: "Marketing" },
  { id: "strategic_csm", bloc: "Croissance", label: "Customer Success / Account Manager / Support Lead", subtitle: "Tu gères la rétention ou l'upsell ?", sectorLabel: "Relation client" },
  { id: "senior_pm", bloc: "Produit & Tech", label: "Chef de Projet / Product Manager / Product Owner", subtitle: "Tu arbitres entre le besoin, la faisabilité et le budget ?", sectorLabel: "Produit" },
  { id: "engineering_manager", bloc: "Produit & Tech", label: "Tech Lead / Engineering Manager / CTO adjoint", subtitle: "Tu décides de l'architecture ou tu gères des développeurs ?", sectorLabel: "Tech" },
  { id: "ai_architect", bloc: "Produit & Tech", label: "Data / IA / Solution Architect", subtitle: "Tu construis ou tu arbitres des systèmes de données ?", sectorLabel: "Data & IA" },
  { id: "management_consultant", bloc: "Stratégie & Ops", label: "Consultant / Manager en cabinet", subtitle: "Tu vends des recommandations et tu mesures ton impact ?", sectorLabel: "Conseil" },
  { id: "strategy_associate", bloc: "Stratégie & Ops", label: "Stratégie / Finance / M&A", subtitle: "Tu produis des modèles financiers ou tu influences un comité de direction ?", sectorLabel: "Stratégie" },
  { id: "operations_manager", bloc: "Stratégie & Ops", label: "Opérations / Chef de Projet transverse / BizOps", subtitle: "Tu fluidifies les process entre les équipes ?", sectorLabel: "Opérations" },
  { id: "fractional_coo", bloc: "Stratégie & Ops", label: "Direction / COO / Directeur de BU", subtitle: "Tu alignes des équipes, tu gères un P&L ou tu optimises le temps de la direction ?", sectorLabel: "Direction" },
];

/* ==============================
   INTERROGATOIRE SEEDS — 3 brick types: chiffre, decision, influence
   + cicatrices + mission fallbacks + elasticity + advocacy framing
   ============================== */

export var CAUCHEMARS_CIBLES = [
  { id: 1, label: "Portefeuille en stagnation", kpis: ["Croissance MRR", "Pipeline généré"], nightmareShort: "Le VP Sales ne dort plus : son portefeuille stagne.", costRange: [200000, 800000], costUnit: "an", costContext: "Coût de stagnation Mid-Market : pipeline non-converti, renouvellements flat, opportunités d'upsell manquées.", negoFrame: "La discussion ne porte pas sur ton salaire. Elle porte sur les {cost} que ce portefeuille en stagnation leur coûte chaque année.", costSymbolique: "Le board voit un segment flat. La confiance dans l'équipe commerciale s'érode. Les talents partent vers des équipes qui grandissent.", costSystemique: "Pas de référence client dans le segment. Les autres AE n'ont pas de précédent pour ouvrir des deals similaires. Le pipeline indirect n'existe pas." },
  { id: 2, label: "Hémorragie de churn", kpis: ["Taux de retention"], nightmareShort: "Le churn bouffe la croissance. Chaque client perdu coûte 5x.", costRange: [150000, 600000], costUnit: "an", costContext: "Coût du churn : chaque point de churn dans un portefeuille Mid-Market représente 5x le coût d'acquisition en revenus perdus.", negoFrame: "Tu ne négocies pas une augmentation. Tu négocies le prix de l'arrêt de l'hémorragie. {cost} par an partent en fumée.", costSymbolique: "Un client qui part parle. Les prospects du même secteur entendent. La réputation du produit se dégrade.", costSystemique: "Chaque client perdu est une référence en moins. Les deals en cours perdent un point d'appui. Le marketing perd un cas client." },
  { id: 3, label: "Deals qui traînent / outils morts", kpis: ["Cycle de vente", "Adoption outil"], nightmareShort: "Les deals traînent 6 mois. Le CRM coûte 200K et personne ne l'utilise.", costRange: [100000, 500000], costUnit: "an", costContext: "Coût du cycle long : cash immobilisé dans des deals non-clos + licence CRM sans adoption = destruction de valeur silencieuse.", negoFrame: "Le CFO calcule le coût du cash immobilisé. {cost} par an disparaissent dans des deals qui auraient dû closer 3 mois plus tôt.", costSymbolique: "L'équipe perd confiance dans les outils. Le management perd visibilité sur le pipeline. Les prévisions deviennent fiction.", costSystemique: "Sans données fiables, chaque décision d'allocation de ressources est un pari. Les recrutements sont retardés. La croissance est freinée par l'absence de visibilité." },
];

/* DONNÉES MARCHÉ — Source APEC, mise à jour annuelle */
/* Utilisées par : diagnostic (Fossé), cauchemar (friction candidat), Duel (ancrage négo) */
export var MARKET_DATA = {
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

export var BRICK_FIELDS = {
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

export var SEED_TEMPLATES = {
  chiffre_1: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi, hasMention) { return (hasMention ? "Tu mentionnes une activité liée à " : "Le recruteur cherche un chiffre sur ") + kpi.name + ". Quel indicateur a bougé ? De combien ? En combien de temps ?"; },
    context: function(kpi) { return "Le recruteur cherche un chiffre sur " + kpi.name + ". " + kpi.why; },
    hint: function(kpi) { return "Ex : donne le chiffre avant, le chiffre après, et la méthode."; },
    missionText: function(kpi) { return "Tu n'as pas de chiffre sur " + kpi.name + ". Vérifie tes anciens outils (CRM, reporting, dashboard). Cherche le delta avant/après ton intervention. Reviens avec le chiffre."; },
    nightmareGen: function(kpi, cauch) { return cauch ? cauch.nightmareShort : "Le décideur cherche quelqu'un qui a fait bouger " + kpi.name + ". Tu as le remède mais tu ne le formules pas."; },
  },
  chiffre_2: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Quel processus as-tu changé ou construit qui a eu un impact mesurable sur " + kpi.name + " ?"; },
    context: function(kpi) { return "L'offre cache un besoin de structuration. " + kpi.why; },
    hint: function(kpi) { return "Ex : méthode déployée, nombre de personnes impactées, résultat mesuré."; },
    missionText: function(kpi) { return "Tu décris une activité sans mesure. Retrouve l'indicateur que ton action a fait bouger. Reviens avec le delta."; },

    nightmareGen: function(kpi, cauch) { return cauch ? cauch.nightmareShort : "Personne ne structure " + kpi.name + ". Tu sais le faire mais ton CV ne le dit pas."; },
  },
  chiffre_3: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Tu as encadré ou formé des gens. Combien ? Quel résultat mesurable ont-ils obtenu grâce à toi ?"; },
    context: function(kpi) { return "Signal implicite : le poste évolue vers du leadership. Prouve que tu sais faire grandir une équipe."; },
    hint: function() { return "Ex : nombre de personnes, résultat de l'équipe, promotions obtenues."; },
    missionText: function() { return "Tu ne connais pas le résultat de ton équipe. Demande le reporting à ton manager ou calcule-le. Reviens avec le chiffre."; },
    nightmareGen: function() { return "Le manager recrute mais l'équipe ne produit pas. Il cherche quelqu'un qui sait former et faire grandir."; },
  },
  chiffre_4: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Quel outil ou système as-tu déployé ? Combien de personnes concernées ? Quel taux d'adoption ?"; },

    context: function(kpi) { return "Le recruteur cherche quelqu'un qui sait faire adopter, pas juste utiliser. " + kpi.why; },
    hint: function() { return "Ex : outil déployé, nombre d'utilisateurs, taux d'adoption, délai."; },
    missionText: function() { return "Tu ne connais pas le taux d'adoption. Vérifie les logs de connexion ou demande à ton ops. Reviens avec le chiffre."; },
    nightmareGen: function() { return "L'outil coûte une fortune et personne ne l'utilise. Le board demande des comptes."; },
  },
  chiffre_5: {
    brickCategory: "chiffre", type: "preuve",
    question: function(kpi) { return "Quel indicateur as-tu amélioré qui était directement lié à " + kpi.name + " ? Chiffre avant, chiffre après."; },

    context: function(kpi) { return kpi.why; },
    hint: function(kpi) { return "Ex : indicateur spécifique, avant/après, méthode utilisée."; },
    missionText: function(kpi) { return "Pas de chiffre sur " + kpi.name + ". C'est un KPI " + kpi.elasticity + ". Trouve la donnée."; },
    nightmareGen: function(kpi) { return "L'offre mentionne " + kpi.name + ". Le décideur veut voir un impact prouvé."; },
  },
  decision: {
    brickCategory: "decision", type: "preuve",
    question: function() { return "Décris un moment où deux directions s'opposaient et où tu as dû trancher. Qui voulait quoi ? Qu'as-tu choisi et pourquoi ?"; },
    context: function() { return "Le recruteur cherche un arbitrage documenté, pas un chiffre. La prise de décision sous contrainte est le KPI le plus rare."; },
    hint: function() { return "Ex : deux options, les arguments de chaque camp, ton choix, le résultat."; },
    missionText: null,
    nightmareGen: function() { return "Personne ne tranche. Le projet est paralysé. Ton remède : tu sais décider quand les autres hésitent."; },
  },
  influence: {
    brickCategory: "influence", type: "preuve",
    question: function() { return "Raconte un moment où tu as dû obtenir l'accord de gens qui n'étaient pas d'accord entre eux. Qui résistait ? Comment tu as débloqué ?"; },
    context: function() { return "L'influence sans autorité est la compétence la plus élastique du marché. L'IA ne remplace pas la politique interne."; },
    hint: function() { return "Ex : acteurs en conflit, ta méthode pour débloquer, le résultat obtenu."; },
    missionText: null,
    nightmareGen: function() { return "Les équipes ne s'alignent pas. Les décisions traînent. Ton remède : tu sais débloquer les situations politiques."; },
  },
  cicatrice_1: {
    brickCategory: "chiffre", type: "cicatrice",
    question: function() { return "Raconte-moi un échec professionnel. Pas un échec compliqué. Un échec que tu aurais dû éviter. Qu'est-ce qui s'est passé ?"; },
    context: function() { return "Le recruteur teste ta maturité. Un profil sans échec analysé est un profil à risque."; },
    hint: function() { return "Ex : la situation, ce que tu as mal fait (pas le contexte), la leçon apprise."; },
    missionText: function() { return "Tu ne trouves pas d'échec précis. Prends 10 minutes. Revois tes projets du dernier semestre. Identifie celui où tu as le plus de regret."; },
    nightmareGen: null,
    blameDetection: true,
  },
  cicatrice_2: {
    brickCategory: "chiffre", type: "cicatrice",
    question: function() { return "Décris un projet qui a échoué. Qu'est-ce qui dépendait de toi dans cet échec ? Pas du marché. Pas de ton manager. De toi."; },
    context: function() { return "Le recruteur distingue ceux qui assument de ceux qui externalisent."; },
    hint: function() { return "Ex : ce que tu as lancé sans tester, les 2 mois perdus, ta correction."; },
    missionText: function() { return "Tu externalises l'échec. Identifie un facteur sous ton contrôle. Reviens avec cette part de responsabilité."; },
    nightmareGen: null,
    externalizeDetection: true,
  },
  take_1: {
    type: "take",
    question: function() { return "Quelle évolution de ton secteur te semble sous-estimée ou mal comprise par la majorité des professionnels autour de toi ?"; },
    context: function() { return "Cette question révèle si tu vis ton marché en surface ou en profondeur. Un expert sait dire : 'Voilà ce que tout le monde pense et voilà pourquoi c'est faux ou incomplet.'"; },
    hint: function() { return "Ex : Tout le monde pense que X. En réalité, Y. Parce que Z."; },
    surfacePatterns: ["ia va tout changer", "le marché evolue", "faut s'adapter", "c'est en train de bouger", "on verra", "ca depend", "je sais pas trop", "intelligence artificielle", "digital", "transformation", "agilite", "innovation"],
  },
  take_2: {
    type: "take",
    question: function() { return "Qu'est-ce que la majorité des gens de ton métier font par habitude et qui ne fonctionne plus selon toi ? Qu'est-ce que tu fais différemment ?"; },
    context: function() { return "La première réponse teste ta vision du secteur. Celle-ci teste ta pratique. Un expert ne se contente pas d'observer. Il fait autrement."; },
    hint: function() { return "Ex : La majorité fait X. Moi je fais Y. Le résultat est Z."; },
    surfacePatterns: ["je fais comme tout le monde", "je suis les process", "on fait ce qu'on peut", "c'est comme ca", "pas le choix", "tout le monde fait pareil"],
  },
  unfair_advantage: {
    type: "unfair_advantage", brickCategory: "chiffre",
    question: function() { return "Qu'est-ce que tes collègues ou ton manager te demandent régulièrement de leur montrer, de leur expliquer, ou de faire à leur place ?"; },
    context: function() { return "Ce qui te paraît facile te paraît facile parce que tu le fais depuis longtemps. Les autres y passent 3x plus de temps. C'est là que se cache ton avantage structurel."; },
    hint: function() { return "Ex : on me demande toujours comment je fais mes cold calls, comment je qualifie, comment je structure mes meetings."; },
    missionText: null,
    nightmareGen: function() { return "Ton avantage injuste est invisible pour toi. L'outil te le révèle."; },

  },
};

export var ROLE_PILLARS = {
  enterprise_ae: [
    { id: 1, title: "Le terrain contre la tour d'ivoire", desc: "Pourquoi l'expérience opérationnelle bat la théorie dans la vente grands comptes." },
    { id: 2, title: "Les métriques qui mentent", desc: "Ce que les KPIs cachent sur la vraie performance commerciale." },
    { id: 3, title: "Le client comme partenaire", desc: "Pourquoi closer est un échec si le client ne renouvelle pas." },
    { id: 4, title: "L'anti-script", desc: "Pourquoi les meilleurs commerciaux n'ont pas de pitch." },
  ],
  head_of_growth: [
    { id: 1, title: "Le growth hack est mort", desc: "Pourquoi les tactiques virales sans rétention tuent plus de boîtes qu'elles n'en sauvent." },
    { id: 2, title: "Le CAC ment", desc: "Ce que le coût d'acquisition cache quand on oublie de mesurer la qualité du client acquis." },
    { id: 3, title: "L'expérimentation sans thèse", desc: "Pourquoi lancer 50 tests sans hypothèse forte est du bruit, pas de la méthode." },
    { id: 4, title: "La rétention est le vrai moteur", desc: "Pourquoi 1% de churn en moins bat 10% d'acquisition en plus." },
  ],
  strategic_csm: [
    { id: 1, title: "Le NPS est un placebo", desc: "Pourquoi un client satisfait part quand même et ce que ça révèle sur la mesure." },
    { id: 2, title: "L'upsell invisible", desc: "Pourquoi le meilleur commercial du compte est le CSM qui n'a pas le titre." },
    { id: 3, title: "Le silence tue le renouvellement", desc: "Pourquoi un client silencieux est un client en danger, pas un client satisfait." },
    { id: 4, title: "La politique interne du client", desc: "Pourquoi comprendre l'organigramme du client vaut plus que comprendre son produit." },
  ],
  senior_pm: [
    { id: 1, title: "La feature que personne ne veut tuer", desc: "Pourquoi le courage produit est de dire non à 99% des demandes." },
    { id: 2, title: "Le backlog est un mensonge collectif", desc: "Pourquoi prioriser sans arbitrage politique est une illusion." },
    { id: 3, title: "La vélocité n'est pas la vitesse", desc: "Pourquoi livrer vite n'est pas livrer bien et ce que ça coûte." },
    { id: 4, title: "Le PM n'est pas un chef de projet", desc: "Pourquoi la différence entre orchestrer et décider sépare les PM juniors des seniors." },
  ],
  ai_architect: [
    { id: 1, title: "L'IA n'est pas une stratégie", desc: "Pourquoi déployer un modèle sans cas d'usage mesurable est du théâtre technologique." },
    { id: 2, title: "Le modèle parfait est un piège", desc: "Pourquoi 90% de précision suffit quand l'alternative est 0% d'adoption." },
    { id: 3, title: "La résistance humaine bat la dette technique", desc: "Pourquoi le vrai obstacle de l'IA en entreprise n'est pas technique." },
    { id: 4, title: "Le coût caché de l'infra", desc: "Pourquoi un GPU qui tourne à vide coûte plus cher qu'un consultant qui ne fait rien." },
  ],
  engineering_manager: [
    { id: 1, title: "Les meilleurs devs partent en silence", desc: "Pourquoi la rétention de talent est le KPI que personne ne mesure avant qu'il soit trop tard." },
    { id: 2, title: "Build vs Buy est une question de survie", desc: "Pourquoi construire en interne par fierté détruit plus de valeur que d'en créer." },
    { id: 3, title: "La dette technique est un choix politique", desc: "Pourquoi chaque bug non-fixé est une décision de management, pas un oubli technique." },
    { id: 4, title: "Le code ne ment pas, les roadmaps si", desc: "Pourquoi le cycle time révèle plus sur l'équipe que n'importe quel standup." },
  ],
  management_consultant: [
    { id: 1, title: "Le slide deck est mort", desc: "Pourquoi un diagnostic de 3 pages bat un PowerPoint de 80 slides." },
    { id: 2, title: "Le client ne veut pas la vérité", desc: "Pourquoi vendre une recommandation difficile est le vrai métier du conseil." },
    { id: 3, title: "L'impact se mesure après le départ", desc: "Pourquoi un consultant qui laisse une trace bat celui qui facture plus d'heures." },
    { id: 4, title: "La crise révèle le vrai conseil", desc: "Pourquoi le TJM se justifie dans les 48h où tout brûle, pas dans les 6 mois de routine." },

  ],
  strategy_associate: [
    { id: 1, title: "Le signal faible vaut plus que le rapport annuel", desc: "Pourquoi une ligne dans un 10-K bat 200 pages de synthèse." },
    { id: 2, title: "Le Comex ne décide pas avec des chiffres", desc: "Pourquoi l'alignement politique pèse plus que le modèle financier." },
    { id: 3, title: "La synergie M&A est un mythe mesurable", desc: "Pourquoi 70% des fusions détruisent de la valeur et ce que ça révèle sur l'analyse." },
    { id: 4, title: "L'IA commodifie l'analyse, pas le jugement", desc: "Pourquoi le stratégiste qui pense bat celui qui synthétise." },
  ],
  operations_manager: [
    { id: 1, title: "Le process parfait n'existe pas", desc: "Pourquoi la friction inter-services est un signal, pas un problème à éliminer." },
    { id: 2, title: "Simplifier est plus dur que construire", desc: "Pourquoi réduire la charge cognitive de 10 personnes vaut plus qu'optimiser 1 workflow." },
    { id: 3, title: "L'outil n'est pas le process", desc: "Pourquoi acheter un SaaS sans changer les habitudes est du gaspillage organisé." },
    { id: 4, title: "L'Ops invisible est le meilleur Ops", desc: "Pourquoi le signe de réussite est que personne ne remarque que tu es là." },
  ],
  fractional_coo: [
    { id: 1, title: "Le CEO n'a pas besoin d'un bras droit", desc: "Pourquoi un COO fractionné vend de la clarté, pas de la présence." },
    { id: 2, title: "Le runway se gagne en décisions, pas en levées", desc: "Pourquoi 6 mois de survie gagnés par l'exécution battent 6 mois gagnés par la dilution." },
    { id: 3, title: "L'alignement N-1 est le seul KPI du COO", desc: "Pourquoi faire courir tout le monde dans la même direction est le levier le plus cher du marché." },
    { id: 4, title: "Le reporting est mort, le cadre est vivant", desc: "Pourquoi un dashboard que personne ne lit coûte plus cher qu'une conversation de 15 minutes." },
  ],
};

/* ==============================
   DUEL QUESTIONS — includes decision/influence brick targets
   ============================== */

export var DUEL_CRISES = [
  {
    id: 1,
    trigger: "Le recruteur regarde son téléphone. Il revient vers toi.",
    scenario: "On vient de m'informer que votre ancien employeur annonce un plan de restructuration. 15% des effectifs. Votre équipe est impactée. Qu'est-ce que ça change à ce que vous venez de me dire ?",
    diagnostic: {
      externalize: ["c'etait previsible", "je le savais", "rien a voir avec moi", "la direction"],
      recadre: ["mon impact reste", "mes résultats", "la méthode fonctionne", "independamment", "reproductible"],
    },
  },
  {
    id: 2,
    trigger: "Le recruteur s'arrête au milieu de sa prise de notes.",
    scenario: "J'ai un autre candidat en face cet après-midi. Plus senior que vous, 12 ans d'expérience. Dites-moi en une phrase pourquoi je devrais continuer cet entretien au lieu de le raccourcir.",
    diagnostic: {
      externalize: ["je suis mieux", "il ne peut pas", "plus motive", "plus jeune"],
      recadre: ["mes résultats parlent", "voici ce que je résous", "la question n'est pas l'expérience", "le problème que vous avez"],
    },
  },
  {
    id: 3,
    trigger: "Le recruteur pose son stylo et croise les bras.",
    scenario: "Soyons honnêtes. Votre CV est bon mais pas exceptionnel. J'en vois dix comme ça par semaine. Qu'est-ce qui fait que je vais me souvenir de vous demain ?",
    diagnostic: {
      externalize: ["je suis unique", "je travaille dur", "je suis passionné", "j'aime"],
      recadre: ["trois cauchemars", "voici le problème que je résous", "la preuve", "mesurable", "reproductible", "mon arbitrage"],
    },
  },
];

export var DUEL_CONTRADICTIONS = [
  "Votre ancien manager m'a donné une version différente. Que répondez-vous ?",
  "J'ai parlé à quelqu'un dans votre ancienne équipe. Il dit que c'était un effort collectif, pas individuel. Votre réaction ?",
  "Un de vos ex-collègues m'a dit que le contexte était favorable et que n'importe qui aurait obtenu ces résultats. Comment répondez-vous ?",
  "Les chiffres que vous annoncez ne correspondent pas à ce que j'ai vu dans le marché. Vous êtes sûr de vos données ?",
];

export var DUEL_QUESTIONS = [
  {
    id: 1,
    question: "Votre portefeuille a grandi de 22%. Pourquoi avez-vous quitté [Entreprise] si les résultats étaient bons ?",
    intent: "Tester la cohérence de la narrative. Cherche une faille dans la motivation.",
    brickRef: "Croissance +22% portefeuille",
    danger: "Si tu réponds 'je cherchais autre chose', tu parais instable. Si tu réponds 'on m'a poussé', tu parais fragile.",
    idealAngle: "Répondre par l'ambition de scope. 'J'ai atteint le plafond du segment Mid-Market chez [Entreprise SaaS]. Je cherche un terrain Enterprise pour appliquer la même méthode à une échelle supérieure.'",
  },
  {
    id: 2,
    question: "Vous parlez de réduction du churn. Comment vous assurez-vous que ce n'était pas juste un cycle favorable du marché ?",
    intent: "Tester la rigueur analytique. Le recruteur veut savoir si tu contrôles tes variables.",
    brickRef: "Réduction churn -18%",
    danger: "Si tu ne peux pas isoler ton impact du contexte, ta brique s'effondre.",
    idealAngle: "Montrer la méthode. 'J'ai comparé les cohortes avant/après restructuration. Les clients passés par le nouveau parcours avaient un NRR de 108% vs 89% pour l'ancien.'",
  },
  {
    id: 3,
    question: "Vous avez arbitré entre refonte et migration. Le CTO voulait la refonte. Comment avez-vous géré le désaccord ?",
    intent: "Tester la capacité à gérer un conflit avec un supérieur hiérarchique. Le recruteur veut voir du courage, pas de la soumission.",
    brickRef: "Arbitrage refonte vs migration",
    danger: "Si tu dis 'j'ai convaincu le CTO', tu parais arrogant. Si tu dis 'on a trouvé un compromis', tu parais mou.",
    idealAngle: "Montrer la méthode d'arbitrage. 'J'ai posé les deux scénarios avec coûts et risques. Le CTO a vu que la refonte exposait la prod pendant 4 mois. La décision s'est faite sur les faits, pas sur les opinions.'",
  },
  {
    id: 4,
    question: "Vous dites avoir aligné 4 directeurs. Concrètement, lequel était le plus difficile à convaincre et pourquoi ?",
    intent: "Tester la profondeur de la lecture politique. Le recruteur veut savoir si tu comprends les jeux de pouvoir.",
    brickRef: "Alignement 4 directeurs",
    danger: "Si tu restes générique ('c'était un travail d'équipe'), le recruteur lit 'cette personne n'a pas vraiment mené le sujet'.",
    idealAngle: "Nommer le blocage. 'Le directeur produit avait investi 2 ans sur le projet. Abandonner revenait à reconnaître un échec. J'ai reframé : pas un échec, un pivot stratégique. Il a accepté quand j'ai montré le coût d'opportunité en termes de roadmap.'",
  },
];

/* ==============================
   MOCK DELIVERABLES
   ============================== */

/* ==============================
   LIVRABLE GENERATORS — replace all mocks with real generation from Coffre-Fort
   ============================== */

export var SCRIPT_CHANNELS = [
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

export var SIGNAL_TYPES = [
  { keywords: ["leve", "levee", "serie", "fonds", "millions", "financement", "fundraise"], type: "levee_fonds", label: "Levée de fonds" },
  { keywords: ["recrute", "recrutement", "embauche", "poste ouvert", "CDI", "cherche"], type: "recrutement", label: "Recrutement" },
  { keywords: ["part", "quitte", "depart", "nomme", "nomination", "remplace", "arrive"], type: "mouvement", label: "Mouvement de direction" },
  { keywords: ["ouvre", "expansion", "bureau", "lancement", "nouveau marche", "nouvelle offre"], type: "expansion", label: "Expansion" },
  { keywords: ["restructur", "licencie", "plan social", "reorganis", "ferme", "reduc"], type: "reorganisation", label: "Réorganisation" },
];

export var COMMENT_TOPICS = [
  { keywords: ["vente", "commercial", "closing", "pipeline", "prospection", "deal", "quota", "revenue"], topic: "vente" },
  { keywords: ["produit", "product", "feature", "roadmap", "backlog", "user", "adoption", "ux"], topic: "produit" },
  { keywords: ["management", "équipe", "leader", "manager", "culture", "recrutement", "talent", "rh"], topic: "management" },
  { keywords: ["ia", "ai", "intelligence artificielle", "chatgpt", "llm", "automatisation", "prompt"], topic: "ia" },
  { keywords: ["process", "operations", "efficacité", "productivite", "workflow", "outil", "crm", "saas"], topic: "operations" },
  { keywords: ["stratégie", "croissance", "scale", "levee", "fundraise", "startup", "serie"], topic: "stratégie" },
  { keywords: ["data", "kpi", "metrique", "mesure", "analytics", "dashboard", "reporting"], topic: "data" },
  { keywords: ["client", "customer", "satisfaction", "churn", "retention", "onboarding", "nps"], topic: "client" },
];

export var COMMENT_AVOID_PATTERNS = [
  { id: "victimaire", markers: ["c'est honteux", "scandaleux", "les entreprises ne respectent", "les recruteurs sont", "on ne devrait pas avoir a", "ras le bol", "j'en ai marre", "c'est inadmissible", "stop aux", "halte a"], label: "Post victimaire — zéro retour de crédibilité" },
  { id: "coaching_mental", markers: ["crois en toi", "tu merites", "ose etre toi", "sors de ta zone de confort", "visualise ton succes", "la clé c'est la confiance", "affirmation positive", "lacher prise", "energie positive", "mindset"], label: "Coaching mental — pas ton terrain de preuve" },
  { id: "fiche_entreprise", markers: ["nous recrutons", "on recrute", "rejoignez-nous", "nous recherchons", "offre d'emploi", "candidatez", "postulez", "#hiring", "#werehiring", "#recrutement"], label: "Fiche entreprise — commenter = supplier" },
  { id: "defouloir", markers: ["tag un ami", "qui est d'accord", "partage si", "like si tu", "qui se reconnait", "ca vous parle", "so true", "tellement vrai"], label: "Défouloir collectif — ton commentaire se noie" },
  { id: "concurrent", markers: ["coach carriere", "coach emploi", "bilan de competences", "faire son cv", "personal branding", "je vous aide a", "mon programme", "ma formation carriere", "accompagnement professionnel"], label: "Concurrent indirect — pas de visibilité gratuite" },

];

export var VISION_2026_FORMATS = [
  { id: "leadership_talk", label: "Leadership Talk", desc: "Posture haute, macro-vision, opinion tranchée" },
  { id: "expertise", label: "Expertise technique", desc: "Méthode, framework, processus" },
  { id: "conviction_actu", label: "Conviction sur actu", desc: "Prise de position sur un fait sectoriel" },
  { id: "storytelling_brut", label: "Storytelling brut", desc: "Vécu brut, pas de filtre, fond > forme" },
  { id: "humour", label: "Humour", desc: "Décalage, auto-dérision, vérité qui pique" },
];

export var ELASTICITY_LABELS = { élastique: { label: "Marché élastique", color: "#4ecca3", icon: "\u2197\uFE0F" }, stable: { label: "Marché stable", color: "#8892b0", icon: "\u2194\uFE0F" }, sous_pression: { label: "Marché sous pression", color: "#e94560", icon: "\u2198\uFE0F" } };

export var CATEGORY_LABELS = { chiffre: { label: "Chiffre", color: "#e94560" }, decision: { label: "Décision", color: "#9b59b6" }, influence: { label: "Influence", color: "#3498db" } };

export var EFFORT_WEIGHTS = {
  brick_chiffre: 2,
  brick_decision: 4,
  brick_influence: 4,
  brick_cicatrice: 5,
  correction: 3,
  mission_assigned: 1,
  mission_completed: 6,
};

export var STRESS_ANGLES = {
  contexte: [
    "Le recruteur dira : 'C'était un contexte favorable. N'importe qui aurait obtenu ce résultat.'",
    "Le recruteur dira : 'Le marché était en hausse. Quel mérite personnel revendiquez-vous ?'",
    "Le recruteur dira : 'Votre équipe était déjà performante avant vous. Qu'avez-vous changé ?'",
  ],
  causalite: [
    "Le recruteur dira : 'Corrélation ou causalité ? Comment prouvez-vous que c'est votre action qui a produit ce résultat ?'",
    "Le recruteur dira : 'D'autres facteurs expliquent ce chiffre. Isolez votre contribution.'",
    "Le recruteur dira : 'Votre prédécesseur avait lancé le chantier. Vous avez récupéré son travail ?'",
  ],
  reproductibilite: [
    "Le recruteur dira : 'Ça a marché là-bas. Qu'est-ce qui vous dit que ça marchera chez nous ?'",
    "Le recruteur dira : 'Votre méthode dépendait d'une équipe spécifique. Comment vous adaptez-vous ?'",
    "Le recruteur dira : 'Ce résultat date de 2 ans. Le marché a changé. C'est encore pertinent ?'",
  ],
  collectif: [
    "Le recruteur dira : 'C'était un effort d'équipe. Quelle était votre contribution individuelle ?'",
    "Le recruteur dira : 'Votre manager dit que c'était une décision collective. Votre version ?'",
    "Le recruteur dira : 'Si on demande à vos anciens collègues, diront-ils la même chose ?'",
  ],
  echec: [
    "Le recruteur dira : 'Et si ça avait échoué, quelle aurait été la cause ?'",
    "Le recruteur dira : 'Quel aspect de cette réalisation vous préoccupe encore aujourd'hui ?'",
    "Le recruteur dira : 'Qu'est-ce que vous feriez différemment si vous recommenciez ?'",
  ],
};


