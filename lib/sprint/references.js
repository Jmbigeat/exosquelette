// Sprint reference data — extracted from Sprint.jsx

export var SCAN_STEPS_ACTIF = [
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

export var SCAN_STEPS_PASSIF = [
  "Analyse du profil en cours...",
  "Extraction des compétences cles...",
  "Scan de visibilité sectorielle...",
  "Identification des signaux faibles...",
  "Cartographie de l'élasticité marche...",
  "Croisement profil et marche...",
  "Calcul du Fosse detecte...",
  "Coffre-Fort initialise.",
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

export var CAUCHEMAR_TEMPLATES_BY_ROLE = {
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
  { id: "strategic_csm", bloc: "Croissance", label: "Customer Success / Account Manager / Support Lead", subtitle: "Tu geres la retention ou l'upsell ?", sectorLabel: "Relation client" },
  { id: "senior_pm", bloc: "Produit & Tech", label: "Chef de Projet / Product Manager / Product Owner", subtitle: "Tu arbitres entre le besoin, la faisabilite et le budget ?", sectorLabel: "Produit" },
  { id: "engineering_manager", bloc: "Produit & Tech", label: "Tech Lead / Engineering Manager / CTO adjoint", subtitle: "Tu decides de l'architecture ou tu geres des developpeurs ?", sectorLabel: "Tech" },
  { id: "ai_architect", bloc: "Produit & Tech", label: "Data / IA / Solution Architect", subtitle: "Tu construis ou tu arbitres des systèmes de données ?", sectorLabel: "Data & IA" },
  { id: "management_consultant", bloc: "Stratégie & Ops", label: "Consultant / Manager en cabinet", subtitle: "Tu vends des recommandations et tu mesures ton impact ?", sectorLabel: "Conseil" },
  { id: "strategy_associate", bloc: "Stratégie & Ops", label: "Strategie / Finance / M&A", subtitle: "Tu produis des modèles financiers ou tu influences un comite de direction ?", sectorLabel: "Strategie" },
  { id: "operations_manager", bloc: "Stratégie & Ops", label: "Operations / Chef de Projet transverse / BizOps", subtitle: "Tu fluidifies les process entre les équipes ?", sectorLabel: "Operations" },
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

export var ROLE_PILLARS = {
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

/* ==============================
   DUEL QUESTIONS — includes decision/influence brick targets
   ============================== */

export var DUEL_CRISES = [
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

export var DUEL_CONTRADICTIONS = [
  "Votre ancien manager m'a donne une version differente. Que repondez-vous ?",
  "J'ai parle a quelqu'un dans votre ancienne équipe. Il dit que c'etait un effort collectif, pas individuel. Votre reaction ?",
  "Un de vos ex-collègues m'a dit que le contexte était favorable et que n'importe qui aurait obtenu ces résultats. Comment répondez-vous ?",
  "Les chiffres que vous annoncez ne correspondent pas a ce que j'ai vu dans le marché. Vous etes sur de vos données ?",
];

export var DUEL_QUESTIONS = [
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
  { keywords: ["restructur", "licencie", "plan social", "reorganis", "ferme", "reduc"], type: "reorganisation", label: "Reorganisation" },
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
  { id: "leadership_talk", label: "Leadership Talk", desc: "Posture haute, macro-vision, opinion tranchee" },
  { id: "expertise", label: "Expertise technique", desc: "Methode, framework, processus" },
  { id: "conviction_actu", label: "Conviction sur actu", desc: "Prise de position sur un fait sectoriel" },
  { id: "storytelling_brut", label: "Storytelling brut", desc: "Vecu brut, pas de filtre, fond > forme" },
  { id: "humour", label: "Humour", desc: "Decalage, auto-derision, verite qui pique" },
];

export var ELASTICITY_LABELS = { élastique: { label: "Marche élastique", color: "#4ecca3", icon: "\u2197\uFE0F" }, stable: { label: "Marche stable", color: "#8892b0", icon: "\u2194\uFE0F" }, sous_pression: { label: "Marche sous pression", color: "#e94560", icon: "\u2198\uFE0F" } };

export var CATEGORY_LABELS = { chiffre: { label: "Chiffre", color: "#e94560" }, decision: { label: "Decision", color: "#9b59b6" }, influence: { label: "Influence", color: "#3498db" } };

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


