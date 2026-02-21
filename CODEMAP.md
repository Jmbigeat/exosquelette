# CODEMAP — L'Exosquelette

> Sprint carrière propulsé par IA. Extrais tes preuves. Mesure ta rareté. Arme-toi.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 14 (App Router) |
| UI | React 18, CSS inline, Google Fonts (Inter) |
| Base de données | Supabase (PostgreSQL + Auth + RLS) |
| Paiement | Stripe (Checkout + Webhooks) |
| IA | Anthropic Claude (SDK @anthropic-ai/sdk) |

---

## Arborescence

```
exosquelette/
├── app/                              # Next.js App Router
│   ├── layout.js                     # Layout racine (HTML, fonts, thème sombre)
│   ├── page.js                       # Redirect → /sprint
│   ├── auth/
│   │   └── page.js                   # Login / Signup (Supabase Auth)
│   ├── sprint/
│   │   └── page.js                   # Page principale (auth check, paywall, Sprint)
│   └── api/
│       ├── checkout/route.js         # POST — Création session Stripe
│       ├── scan/route.js             # POST — Analyse CV/offres via Claude
│       └── webhook/route.js          # POST — Webhook Stripe (paiement confirmé)
│
├── components/
│   ├── Sprint.jsx                    # Orchestrateur principal du sprint
│   └── sprint/
│       ├── ui.jsx                    # Composants UI atomiques
│       ├── panels.jsx                # Panneaux métier (Vault, CV, WorkBench…)
│       ├── Onboarding.jsx            # Flux d'onboarding + écran diagnostic
│       ├── Interrogation.jsx         # Saisie et validation des briques
│       ├── Duel.jsx                  # Simulation d'entretien avec crises
│       └── EndScreen.jsx             # Rapport final + livrables
│
├── lib/
│   ├── supabase.js                   # Clients Supabase (browser + server)
│   ├── stripe.js                     # Initialisation Stripe
│   ├── sprint-db.js                  # Persistance sprint (load/save/checkPaid)
│   └── sprint/
│       ├── references.js             # Données référentielles (KPIs, rôles, cauchemars, marchés)
│       ├── scoring.js                # Scoring densité, couverture, effort, bluff
│       ├── analysis.js               # Diagnostic CV (readiness, markers, maturité)
│       ├── bricks.js                 # Génération/matching briques, seeds, pilliers
│       ├── generators.js             # Génération de contenus (CV, bio, scripts, rapport)
│       ├── linkedin.js               # Posts LinkedIn, commentaires, audit éditorial
│       ├── dilts.js                  # Niveaux logiques de Dilts
│       ├── offers.js                 # Parsing offres, signaux, cauchemars actifs
│       └── redac.js                  # Filtre rédactionnel (mots bannis, nettoyage)
│
├── supabase/
│   └── schema.sql                    # Schéma DDL (profiles, sprints, payments + RLS)
│
├── package.json                      # Dépendances & scripts
├── next.config.js                    # Config Next.js
├── jsconfig.json                     # Alias @/* → ./*
└── .env.example                      # Variables d'environnement requises
```

---

## Routes API

### `POST /api/scan` — `app/api/scan/route.js`
Analyse un CV et des offres via Claude (claude-sonnet-4-20250514).
- **Input** : `{ cv, offers, roleId }`
- **Output** : `{ bricks[], hiddenKpis[], topSkills[], gaps[] }`
- Tronque CV et offres à 3 000 caractères chacun.

### `POST /api/checkout` — `app/api/checkout/route.js`
Crée une session Stripe Checkout.
- **Input** : `{ userId, email }`
- **Output** : `{ url }` (URL de redirection Stripe)

### `POST /api/webhook` — `app/api/webhook/route.js`
Reçoit les événements Stripe (`checkout.session.completed`).
- Met à jour `profiles.paid = true`
- Enregistre la transaction dans `payments`

---

## Composants

### `Sprint.jsx` — `components/Sprint.jsx`
Orchestrateur central. Gère le state global du sprint (bricks, vault, screen, steps, duel, rôle cible, offres).
- **Props** : `initialState`, `onStateChange`, `onScan`
- **Screens** : onboarding → interrogation → duel → end
- **State persisté** : auto-save via `onStateChange` (debounce 2s dans `sprint/page.js`)

### `sprint/ui.jsx` — Composants UI atomiques
| Export | Description |
|--------|-------------|
| `Bar({ pct })` | Barre de progression |
| `Nav({ steps, active, onSelect, density })` | Navigation entre étapes (avec locks) |
| `CopyBtn({ text, label })` | Bouton copier-coller |
| `Pillars({ pillars, takes, onVal })` | Affichage et validation des piliers |
| `Locked({ title, desc })` | Écran de verrouillage d'étape |
| `OffersManager({ offersArray, onAdd, onRemove, coherence, targetRoleId })` | Gestion multi-offres |

### `sprint/panels.jsx` — Panneaux métier
| Export | Description |
|--------|-------------|
| `InvestmentIndex({ bricks })` | Score d'investissement (effort) |
| `Vault({ v, maturity, bricks, nightmareCosts, onCostChange })` | Tableau de bord : briques, missions, piliers, corrections |
| `CVPreview({ bricks })` | Prévisualisation CV généré |
| `BricksRecap({ bricks })` | Récapitulatif des briques validées |
| `WorkBench({ bricks, targetRoleId, trajectoryToggle, vault, offersArray, isActive })` | Atelier de travail (scripts, contact, plan 90j) |
| `SubscriptionDashboard({ bricks, vault, targetRoleId, trajectoryToggle, offersArray })` | Dashboard abonnement |
| `CrossRoleInsight({ bricks, targetRoleId, trajectoryToggle })` | Matching cross-rôle |
| `MarketMap({ bricks, offersArray, targetRoleId })` | Carte marché |

### `sprint/Onboarding.jsx` — Onboarding
| Export | Description |
|--------|-------------|
| `DiagnosticScreen({ diagnostic, cvText, offerText, roleId, readiness, trajectory, onStartSprint })` | Écran diagnostic initial |
| `Onboarding({ onStart, onScan })` | Flux complet d'onboarding (CV, offres, rôle, scan) |

### `sprint/Interrogation.jsx` — Saisie des briques
| Export | Description |
|--------|-------------|
| `FeedbackToast({ brick, onDone })` | Toast de feedback après validation |
| `AddBrick({ onAdd })` | Formulaire d'ajout de brique manuelle |
| `Interrogation({ seeds, bricks, onForge, onCorrect, onMission, onSkip, onAddBrick, paranoMode, targetRoleId, trajectoryToggle })` | Écran principal d'interrogation |

### `sprint/Duel.jsx` — Simulation d'entretien
| Export | Description |
|--------|-------------|
| `Duel({ questions, bricks, onComplete, targetRoleId })` | Entretien simulé avec crises inattendues |

### `sprint/EndScreen.jsx` — Rapport final
| Export | Description |
|--------|-------------|
| `ImpactReportPanel({ bricks, vault, targetRoleId, trajectoryToggle })` | Rapport d'impact complet |
| `Deliverable({ emoji, title, content, lines, auditResult, onCorrect })` | Livrable individuel |
| `PositionCard({ pos, idx })` | Carte de prise de position |
| `SignalField({ bricks, targetRoleId })` | Champ de signaux LinkedIn |
| `CommentField({ bricks, vault, targetRoleId })` | Générateur de commentaires LinkedIn |
| `EndScreen({ vault, setVault, bricks, duelResults, maturity, targetRoleId, nightmareCosts, trajectoryToggle, offersArray })` | Écran final complet |

---

## Lib — Logique métier

### `lib/supabase.js`
| Export | Description |
|--------|-------------|
| `createBrowserClient()` | Client Supabase côté navigateur (anon key) |
| `createServerClient()` | Client Supabase côté serveur (service role, bypass RLS) |

### `lib/stripe.js`
Initialisation du client Stripe avec `STRIPE_SECRET_KEY`.

### `lib/sprint-db.js`
| Export | Description |
|--------|-------------|
| `loadSprint(userId)` | Charge le sprint le plus récent |
| `saveSprint(userId, sprintId, state)` | Crée ou met à jour le state JSONB |
| `checkPaid(userId)` | Vérifie le statut de paiement |

### `lib/sprint/references.js` — Données référentielles (726 lignes)
| Export | Description |
|--------|-------------|
| `SCAN_STEPS_ACTIF` | Messages de progression du scan (mode actif) |
| `SCAN_STEPS_PASSIF` | Messages de progression du scan (mode passif) |
| `STEPS` | Étapes du sprint (Extraction, Forge, Affûtage, Armement) |
| `KPI_REFERENCE` | Base de KPIs par rôle (enterprise_ae, csm, sdm, bdm, cro, vp_sales, head_cs) |
| `CAUCHEMAR_TEMPLATES_BY_ROLE` | Cauchemars-type par rôle avec mots-clés |
| `OFFER_URGENCY_KEYWORDS` | Mots-clés d'urgence dans les offres |
| `SECTOR_KEYWORDS` | Mots-clés par secteur (saas, finance, conseil…) |
| `TARGET_ROLES` | Liste des rôles cibles dérivée de KPI_REFERENCE |
| `ROLE_CLUSTERS` | Clusters de rôles pour matching cross-rôle |
| `CAUCHEMARS_CIBLES` | Cauchemars par défaut (8 items) |
| `MARKET_DATA` | Données marché (fossé salarial, reconversion, salaires) |
| `BRICK_FIELDS` | Champs par type de brique (kpi, action, cicatrice, take) |
| `SEED_TEMPLATES` | Templates de seeds par rôle |
| `ROLE_PILLARS` | Piliers par rôle |
| `DUEL_CRISES` | Scénarios de crise pour le duel |
| `DUEL_CONTRADICTIONS` | Contradictions pour le duel |
| `DUEL_QUESTIONS` | Questions d'entretien du duel |
| `SCRIPT_CHANNELS` | Canaux pour scripts de contact |
| `SIGNAL_TYPES` | Types de signaux LinkedIn |
| `COMMENT_TOPICS` | Sujets de commentaires |
| `COMMENT_AVOID_PATTERNS` | Patterns à éviter dans les commentaires |
| `VISION_2026_FORMATS` | Formats de vision 2026 |
| `ELASTICITY_LABELS` | Labels d'élasticité marché |
| `CATEGORY_LABELS` | Labels de catégories (chiffre, décision, influence) |
| `EFFORT_WEIGHTS` | Poids pour le calcul d'effort |
| `STRESS_ANGLES` | Angles de stress-test |

### `lib/sprint/scoring.js` — Scoring (314 lignes)
| Export | Description |
|--------|-------------|
| `getActiveCauchemars()` | Récupère les cauchemars actifs (global) |
| `setActiveCauchemarsGlobal(c)` | Définit les cauchemars actifs (global) |
| `computeDensityScore(bricks, cauchemars)` | Score de densité (0-100) — gate de progression |
| `computeCauchemarCoverage(bricks)` | Taux de couverture des cauchemars |
| `computeNegotiationBrief(bricks, cauchemars)` | Brief de négociation |
| `formatCost(n)` | Formatage montants (K, M) |
| `detectBluffRisk(bricks)` | Détection de risque de bluff |
| `computeEffort(bricks)` | Calcul du score d'investissement |
| `hashCode(str)` | Hash simple de chaîne |
| `computeCauchemarCoverageDetailed(bricks, nightmareCosts)` | Couverture détaillée avec coûts |
| `auditBrickVulnerability(brick)` | Audit de vulnérabilité d'une brique |
| `MARKET_DATA` | Copie locale des données marché |

### `lib/sprint/analysis.js` — Diagnostic CV (258 lignes)
| Export | Description |
|--------|-------------|
| `estimateReadiness(cvText, offersText)` | Diagnostic de préparation (score + détails) |
| `hasNumbers(text)` | Détecte des chiffres |
| `hasExternalization(text)` | Détecte l'externalisation de responsabilité |
| `hasBlame(text)` | Détecte le blâme |
| `hasDecisionMarkers(text)` | Détecte les marqueurs de décision |
| `hasInfluenceMarkers(text)` | Détecte les marqueurs d'influence |
| `auditAnonymization(text, paranoMode)` | Audit d'anonymisation |
| `detectSensitiveData(text)` | Détecte les données sensibles |
| `classifyCicatrice(text)` | Classifie une cicatrice (type de difficulté) |
| `analyzeVerbs(text)` | Analyse les verbes (actif vs passif) |
| `getMaturityLevel(bricks)` | Niveau de maturité du sprint |

### `lib/sprint/bricks.js` — Briques (491 lignes)
| Export | Description |
|--------|-------------|
| `matchKpiToReference(kpiText, roleId)` | Match un KPI contre la référence du rôle |
| `computeCrossRoleMatching(bricks, currentRoleId, trajectoryToggle)` | Matching cross-rôle |
| `getBrickFields(seed)` | Champs de saisie pour une seed |
| `assembleFieldsToText(fields, fieldDefs)` | Assemble les champs en texte |
| `generateAdaptiveSeeds(roleId)` | Génère des seeds adaptatives par rôle |
| `analyzeTakeDepth(text, surfacePatterns)` | Analyse la profondeur d'un take |
| `takeToiPillar(takeText, takeAnalysis)` | Convertit un take en pilier |
| `getAdaptivePillars(roleId)` | Piliers adaptatifs par rôle |
| `generateBrickVersions(brick, targetRoleId)` | Génère des versions alternatives d'une brique |
| `auditBrickVulnerability(brick)` | Audit de vulnérabilité |

### `lib/sprint/generators.js` — Génération de contenus (1 143 lignes)
| Export | Description |
|--------|-------------|
| `computeFosseMarket(salaire)` | Calcul du Fossé marché (perte salariale) |
| `generateCV(bricks, targetRoleId, trajectoryToggle)` | Génération CV structuré |
| `generateBio(bricks, vault, trajectoryToggle)` | Génération bio professionnelle |
| `generateScript(bricks, targetRoleId)` | Script d'entretien |
| `generatePlan90(bricks, targetRoleId, offersArray)` | Plan 90 jours post-prise-de-poste |
| `generateContactScripts(bricks, targetRoleId, targetOffer)` | Scripts de prise de contact multi-canaux |
| `scoreContactScript(text, bricks, cauchemars)` | Score d'un script de contact |
| `generateTransitionScript(bricks, sourceRoleId, targetAlt)` | Script de transition vers un rôle alternatif |
| `generateImpactReport(bricks, vault, targetRoleId, trajectoryToggle, density)` | Rapport d'impact complet |
| `computeZones(bricks, roleId)` | Calcul des zones d'impact |
| `generateDiagnosticQuestions(bricks, targetRoleId)` | Questions de diagnostic |
| `translateCVPerception(cvText, cauchemars)` | Traduction de la perception CV |
| `generateSampleTransformation(cvText, cauchemars, roleId)` | Exemple de transformation CV |
| `generateDiagnostic(cvText, offerText, roleId)` | Diagnostic complet (4 blocs) |
| `generateAdvocacyText(text, category, type, nightmareText)` | Texte de plaidoyer externe |
| `generateInternalAdvocacy(text, category, type, elasticity)` | Plaidoyer interne |
| `generateStressTest(brick, targetRoleId, offersArray)` | Stress-test d'une brique |
| `auditDeliverable(type, content, bricks, cauchemars)` | Audit d'un livrable |

### `lib/sprint/linkedin.js` — LinkedIn (1 078 lignes)
| Export | Description |
|--------|-------------|
| `generateLinkedInPosts(bricks, vault, targetRoleId)` | Génération de posts LinkedIn |
| `scoreHook(text)` | Score d'accroche |
| `analyzeBodyRetention(text)` | Analyse de rétention du corps de texte |
| `expertWritingAudit(text)` | Audit d'écriture experte |
| `generateFirstComment(post, bricks, vault)` | Premier commentaire sous un post |
| `generatePositions(bricks, vault)` | Prises de position |
| `detectSignalType(text)` | Détection du type de signal |
| `generateSignalScript(signalText, signalType, bricks, targetRoleId)` | Script de réaction à un signal |
| `detectPostTopic(text)` | Détection du sujet d'un post |
| `detectAvoidPatterns(text)` | Détection des patterns à éviter |
| `computeUserTerritory(bricks, vault, targetRoleId)` | Territoire éditorial de l'utilisateur |
| `detectPostGap(text)` | Détection d'un gap dans un post |
| `runCommentFilters(postText, bricks, vault, targetRoleId)` | Filtres de commentaires |
| `auditComment(commentText, bricks, vault)` | Audit d'un commentaire |
| `generateLinkedInComment(postText, bricks, vault, targetRoleId)` | Génération d'un commentaire LinkedIn |
| `mapDiltsToFormat(diltsLevel)` | Mapping Dilts → format de post |
| `generatePostDraft(brick, diltsLevel, pillar, take, targetRoleId)` | Brouillon de post |
| `applyMeroeStyle(draft, vault)` | Application du style Méroé |
| `marieHookAudit(draft)` | Audit d'accroche (méthode Marie) |
| `luisEnriqueAudit(draft, bricks)` | Audit Luis Enrique (preuve dans le post) |
| `tagVision2026(draft)` | Tag vision 2026 |
| `generateWeeklyPosts(bricks, vault, targetRoleId)` | Planning hebdomadaire de posts |
| `generateSleepComment(bricks, vault, targetRoleId)` | Commentaire pour profil dormant |
| `generateDormantRelaunch(bricks, vault, targetRoleId, monthsInactive)` | Relance profil dormant |
| `proposeSleepBrick(vault)` | Proposition de brique pour profil dormant |

### `lib/sprint/dilts.js` — Niveaux logiques de Dilts (242 lignes)
| Export | Description |
|--------|-------------|
| `DILTS_LEVELS` | 6 niveaux (Environnement → Mission) |
| `DILTS_MARKERS` | Marqueurs linguistiques par niveau |
| `detectDiltsLevel(text)` | Détecte le niveau Dilts dominant d'un texte |
| `getDiltsLabel(level)` | Label d'un niveau |
| `analyzeDiltsProgression(text)` | Analyse de la progression Dilts |
| `checkDiltsSequence(posts)` | Vérifie la séquence Dilts d'une série de posts |
| `DILTS_CALIBRATION` | Calibration éditoriale par niveau |
| `computeDiltsTarget(diltsHistory)` | Calcul du niveau cible Dilts |
| `selectBrickForDiltsTarget(bricks, targetLevel, usedBrickIds)` | Sélection de brique pour un niveau cible |
| `DILTS_EDITORIAL_MAPPING` | Mapping éditorial Dilts |
| `getDiltsPlafond(diltsHistory)` | Plafond Dilts actuel |
| `getDiltsCeilingForOutput(outputType, diltsHistory, monthsInactive)` | Plafond par type de sortie |
| `getDiltsThermometerState(diltsHistory)` | État du thermomètre Dilts |

### `lib/sprint/offers.js` — Parsing offres (160 lignes)
| Export | Description |
|--------|-------------|
| `parseOfferSignals(offersText, roleId)` | Parse les signaux d'une offre (urgence, cauchemars, secteur) |
| `buildActiveCauchemars(parsedOffers, roleId)` | Construit la liste des cauchemars actifs |
| `mergeOfferSignals(offersArray, roleId)` | Fusionne les signaux de plusieurs offres |
| `checkOfferCoherence(offersArray)` | Vérifie la cohérence entre offres |

### `lib/sprint/redac.js` — Filtre rédactionnel (129 lignes)
| Export | Description |
|--------|-------------|
| `REDAC_BANNIS` | Règles de remplacement (mots bannis → alternatives) |
| `cleanRedac(text, mode)` | Applique le filtre rédactionnel à un texte |

---

## Base de données (Supabase)

### Table `profiles`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | Référence `auth.users` |
| email | text | Email utilisateur |
| paid | boolean | Statut de paiement |
| stripe_customer_id | text | ID client Stripe |
| created_at | timestamptz | Date de création |

### Table `sprints`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | Identifiant sprint |
| user_id | UUID (FK → profiles) | Propriétaire |
| state | JSONB | État complet du sprint |
| created_at | timestamptz | Date de création |
| updated_at | timestamptz | Dernière mise à jour |

### Table `payments`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | Identifiant paiement |
| user_id | UUID (FK → profiles) | Payeur |
| stripe_session_id | text (unique) | ID session Stripe |
| amount | integer | Montant en centimes |
| status | text | Statut (completed…) |
| created_at | timestamptz | Date |

**RLS** activé sur toutes les tables. Chaque utilisateur accède uniquement à ses propres données.

---

## Flux principaux

### Authentification
```
/  →  redirect /sprint
       ↓
   auth check (Supabase)
       ↓ non authentifié
   /auth  →  login/signup  →  redirect /sprint
       ↓ authentifié
   checkPaid(userId)
       ↓ non payé
   Paywall (€49)  →  /api/checkout  →  Stripe  →  /api/webhook  →  profiles.paid=true
       ↓ payé
   loadSprint(userId)  →  Sprint component
```

### Sprint (parcours utilisateur)
```
Onboarding
  ├── Saisie CV + Offres + Rôle cible
  ├── /api/scan (Claude) → bricks initiales + KPIs cachés
  ├── parseOfferSignals → cauchemars actifs
  └── generateDiagnostic → DiagnosticScreen
       ↓
Interrogation (étape Extraction)
  ├── generateAdaptiveSeeds → seeds par rôle
  ├── Validation brique par brique (4 champs)
  ├── matchKpiToReference → rattachement KPI
  ├── generateAdvocacyText → plaidoyer
  ├── auditAnonymization → protection données
  └── computeDensityScore → unlock Forge (score ≥ 30)
       ↓
Forge → Affûtage → Armement
  ├── generateBrickVersions, generateStressTest
  ├── computeCauchemarCoverage
  └── Density gates (30 → 50 → 70)
       ↓
Duel
  ├── DUEL_QUESTIONS + DUEL_CRISES
  └── Diagnostic réponses (externalisation, recadrage)
       ↓
EndScreen
  ├── generateImpactReport → rapport d'impact
  ├── generateCV → CV structuré
  ├── generateBio → bio professionnelle
  ├── generateLinkedInPosts → posts LinkedIn
  ├── generateContactScripts → scripts de contact
  ├── generatePlan90 → plan 90 jours
  └── computeCrossRoleMatching → alternatives de carrière
```

### Persistance
```
Sprint state change → debounce 2s → saveSprint(userId, sprintId, state) → Supabase JSONB
Page load → loadSprint(userId) → restauration complète de l'état
```

---

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL          # URL du projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Clé publique Supabase
SUPABASE_SERVICE_ROLE_KEY         # Clé service (server-side, bypass RLS)
STRIPE_SECRET_KEY                 # Clé secrète Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY # Clé publique Stripe
STRIPE_WEBHOOK_SECRET             # Secret de vérification webhook
STRIPE_PRICE_ID                   # ID du prix Stripe (€49)
ANTHROPIC_API_KEY                 # Clé API Anthropic (Claude)
NEXT_PUBLIC_APP_URL               # URL de l'application
```

---

## Scripts

```bash
npm run dev      # Serveur de développement (localhost:3000)
npm run build    # Build production
npm start        # Serveur production
```
