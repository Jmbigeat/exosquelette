# CODEMAP — L'Exosquelette

> Dernière mise à jour : 21 février 2026
> Total : **27 fichiers source**, **11 222 lignes**

---

## 1. Arborescence

```
exosquelette/                          (11 222 lignes)
├── app/
│   ├── layout.js                      19 lig.  — Layout racine, meta, font Inter
│   ├── page.js                        14 lig.  — Redirect → /sprint
│   ├── auth/page.js                   94 lig.  — Login / Signup Supabase
│   ├── sprint/page.js                183 lig.  — Auth + paywall + persistence + charge Sprint
│   └── api/
│       ├── scan/route.js              64 lig.  — Appel Anthropic (analyse CV + offres)
│       ├── checkout/route.js          36 lig.  — Création session Stripe
│       └── webhook/route.js           42 lig.  — Confirmation paiement Stripe → profiles.paid
│
├── components/
│   ├── Sprint.jsx                    429 lig.  — Orchestrateur principal (state, navigation, dispatch)
│   └── sprint/
│       ├── Onboarding.jsx            690 lig.  — Scan CV/offres, choix rôle, diagnostic, trajectoire
│       ├── Interrogation.jsx         953 lig.  — Forge de briques (saisie, correction, feedback)
│       ├── Duel.jsx                  674 lig.  — Simulation entretien (crises, contradictions, scoring)
│       ├── EndScreen.jsx           2 084 lig.  — Livrables finaux (CV, bio, LinkedIn, rapport d'impact)
│       ├── panels.jsx              1 009 lig.  — Panneaux (Vault, WorkBench, CrossRole, MarketMap)
│       └── ui.jsx                    238 lig.  — Composants UI réutilisables (Bar, Nav, CopyBtn, Pillars)
│
├── lib/
│   ├── supabase.js                    17 lig.  — Client Supabase (browser + server)
│   ├── stripe.js                       3 lig.  — Client Stripe
│   ├── sprint-db.js                   54 lig.  — CRUD sprints + checkPaid
│   └── sprint/
│       ├── references.js             726 lig.  — Référentiel maître (KPIs, rôles, cauchemars, templates)
│       ├── generators.js           1 143 lig.  — Générateurs (CV, bio, scripts, plan 90j, diagnostic)
│       ├── linkedin.js             1 078 lig.  — LinkedIn (posts, commentaires, signaux, audit Dilts)
│       ├── bricks.js                 491 lig.  — Logique briques (seeds, matching KPI, versions, audit)
│       ├── scoring.js                314 lig.  — Scoring (densité, couverture cauchemars, effort, bluff)
│       ├── analysis.js               258 lig.  — Analyse texte (readiness, verbes, externalisation)
│       ├── dilts.js                  242 lig.  — Pyramide de Dilts (détection, calibration, plafond)
│       ├── offers.js                 160 lig.  — Parsing offres (signaux, cauchemars, cohérence)
│       └── redac.js                  129 lig.  — Filtre rédactionnel (mots bannis, voix active)
│
├── supabase/
│   └── schema.sql                     78 lig.  — Tables profiles, sprints, payments
│
├── .env.example                                — Template variables d'environnement
├── package.json                                — Dépendances + scripts
├── jsconfig.json                               — Alias @/* → racine
└── next.config.js                              — Config Next.js
```

---

## 2. Flux utilisateur

```
/  ──redirect──▸  /auth  ──login──▸  /sprint
                                        │
                                        ▼
                                   SprintPage
                                   (auth + paywall + load state)
                                        │
                                        ▼
                                   Sprint.jsx (orchestrateur)
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              Onboarding          Interrogation           Duel
              (scan IA,           (forge briques,      (simulation
               diagnostic,         correction,          entretien,
               choix rôle)         feedback)            scoring)
                    │                   │                   │
                    └───────────────────┴───────────────────┘
                                        │
                                        ▼
                                   EndScreen
                                   (CV, bio, LinkedIn,
                                    rapport d'impact,
                                    signaux, commentaires)
```

**Panneaux transversaux** (visibles à plusieurs étapes) :
`Vault` · `InvestmentIndex` · `CVPreview` · `WorkBench` · `CrossRoleInsight` · `MarketMap` · `SubscriptionDashboard`

---

## 3. Composants — exports

### `components/Sprint.jsx` (429 lig.)
Orchestrateur principal. Gère tout le state du sprint et dispatch vers les sous-composants.

| Export | Description |
|--------|-------------|
| `Sprint` (default) | Composant racine. Props : `initialState`, `onStateChange`, `onScan` |

### `components/sprint/Onboarding.jsx` (690 lig.)
Écran d'entrée : scan du CV et des offres via l'API Anthropic, choix du rôle cible, diagnostic.

| Export | Description |
|--------|-------------|
| `Onboarding` | Formulaire scan CV/offres, sélection rôle, lancement sprint |
| `DiagnosticScreen` | Affichage du diagnostic post-scan (cauchemars, fossé, readiness) |

### `components/sprint/Interrogation.jsx` (953 lig.)
Forge de briques : l'utilisateur saisit ses preuves, le système analyse et corrige.

| Export | Description |
|--------|-------------|
| `Interrogation` | Interface de forge (seeds, saisie, correction, validation) |
| `FeedbackToast` | Toast animé post-validation d'une brique |
| `AddBrick` | Formulaire d'ajout libre d'une brique |

### `components/sprint/Duel.jsx` (674 lig.)
Simulation d'entretien : crises, contradictions, questions de recruteur.

| Export | Description |
|--------|-------------|
| `Duel` | Simulation complète avec scoring et feedback |

### `components/sprint/EndScreen.jsx` (2 084 lig.)
Écran final : tous les livrables générés à partir des briques validées.

| Export | Description |
|--------|-------------|
| `EndScreen` | Conteneur principal de l'écran de sortie |
| `ImpactReportPanel` | Rapport d'impact détaillé (zones, densité, couverture) |
| `Deliverable` | Carte livrable avec audit et copie |
| `PositionCard` | Prise de position LinkedIn |
| `SignalField` | Détection et script de réponse aux signaux marché |
| `CommentField` | Générateur de commentaires LinkedIn calibrés Dilts |

### `components/sprint/panels.jsx` (1 009 lig.)
Panneaux latéraux et dashboards accessibles durant le sprint.

| Export | Description |
|--------|-------------|
| `InvestmentIndex` | Jauge d'effort cumulé (briques, missions, cicatrices) |
| `Vault` | Coffre-fort : compteurs + thermomètre cauchemars |
| `CVPreview` | Prévisualisation du CV généré en temps réel |
| `BricksRecap` | Récapitulatif des briques validées par catégorie |
| `WorkBench` | Atelier : stress-test, versions, audit vulnérabilité |
| `SubscriptionDashboard` | Dashboard LinkedIn (posts hebdo, commentaires sleep) |
| `CrossRoleInsight` | Matching cross-rôle des briques |
| `MarketMap` | Carte marché (offres parsées, signaux, cohérence) |

### `components/sprint/ui.jsx` (238 lig.)
Composants UI atomiques réutilisés dans tout le sprint.

| Export | Description |
|--------|-------------|
| `Bar` | Barre de progression |
| `Nav` | Navigation par étapes avec gates de densité |
| `CopyBtn` | Bouton copier avec feedback "Copié" |
| `Pillars` | Sélecteur de piliers et takes |
| `Locked` | Placeholder pour fonctionnalité verrouillée |
| `OffersManager` | Gestionnaire d'offres multiples |

---

## 4. Modules lib — exports

### `lib/supabase.js` (17 lig.)
| Export | Description |
|--------|-------------|
| `createBrowserClient` | Client Supabase côté navigateur |
| `createServerClient` | Client Supabase côté serveur (service role) |

### `lib/stripe.js` (3 lig.)
| Export | Description |
|--------|-------------|
| `stripe` | Instance Stripe initialisée |

### `lib/sprint-db.js` (54 lig.)
| Export | Description |
|--------|-------------|
| `loadSprint` | Charge le sprint le plus récent d'un utilisateur |
| `saveSprint` | Crée ou met à jour l'état d'un sprint |
| `checkPaid` | Vérifie si l'utilisateur a payé |

### `lib/sprint/references.js` (726 lig.)
Référentiel maître — toutes les données statiques du sprint.

| Export | Description |
|--------|-------------|
| `KPI_REFERENCE` | 50 KPIs × 10 postes avec élasticité |
| `STEPS` | Définition des 4 étapes (Extraction, Assemblage, Polissage, Calibration) |
| `CAUCHEMAR_TEMPLATES_BY_ROLE` | Templates de cauchemars par rôle cible |
| `CAUCHEMARS_CIBLES` | 3 cauchemars par défaut |
| `TARGET_ROLES` | Liste des rôles disponibles |
| `ROLE_CLUSTERS` | Regroupement des rôles par famille |
| `ROLE_PILLARS` | Piliers éditoriaux par rôle |
| `BRICK_FIELDS` | Champs structurés d'une brique |
| `SEED_TEMPLATES` | Templates de seeds adaptatifs par rôle |
| `MARKET_DATA` | Données marché (fossé salarial, reconversion) |
| `DUEL_QUESTIONS` | Questions de duel par rôle |
| `DUEL_CRISES` | Scénarios de crise en entretien |
| `DUEL_CONTRADICTIONS` | Contradictions de recruteur |
| `SCAN_STEPS_ACTIF` / `SCAN_STEPS_PASSIF` | Messages de progression du scan |
| `SCRIPT_CHANNELS` | Canaux pour scripts de contact |
| `SIGNAL_TYPES` / `COMMENT_TOPICS` / `COMMENT_AVOID_PATTERNS` | Règles LinkedIn |
| `VISION_2026_FORMATS` | Formats de posts vision |
| `ELASTICITY_LABELS` / `CATEGORY_LABELS` | Labels d'affichage |
| `EFFORT_WEIGHTS` / `STRESS_ANGLES` | Pondérations de scoring |
| `SECTOR_KEYWORDS` / `OFFER_URGENCY_KEYWORDS` | Détection secteur et urgence |

### `lib/sprint/generators.js` (1 143 lig.)
Générateurs de contenu — tous les livrables textuels.

| Export | Description |
|--------|-------------|
| `generateCV` | CV structuré à partir des briques validées |
| `generateBio` | Bio professionnelle |
| `generatePlan90` | Plan d'action 90 jours |
| `generateContactScripts` | Scripts de prise de contact par canal |
| `scoreContactScript` | Score un script de contact (audit qualité) |
| `generateTransitionScript` | Script de transition cross-rôle |
| `generateImpactReport` | Rapport d'impact complet |
| `generateDiagnosticQuestions` | Questions de diagnostic adaptatives |
| `generateDiagnostic` | Diagnostic complet post-scan |
| `generateAdvocacyText` | Plaidoyer externe (recruteur) |
| `generateInternalAdvocacy` | Plaidoyer interne (auto-conviction) |
| `generateStressTest` | Stress-test d'une brique |
| `auditDeliverable` | Audit qualité d'un livrable |
| `computeFosseMarket` | Calcul du fossé salarial |
| `computeZones` | Zones de force / faiblesse |
| `translateCVPerception` | Traduction perception recruteur du CV |
| `generateSampleTransformation` | Exemple de transformation brique |
| `generateScript` | Script générique |
| `generateBio` | Bio calibrée |

### `lib/sprint/linkedin.js` (1 078 lig.)
Moteur LinkedIn — posts, commentaires, audits éditoriaux.

| Export | Description |
|--------|-------------|
| `generateLinkedInPosts` | Posts LinkedIn calibrés Dilts |
| `generateWeeklyPosts` | Planning hebdomadaire de posts |
| `generateLinkedInComment` | Commentaire LinkedIn sur un post externe |
| `generateFirstComment` | Premier commentaire sous son propre post |
| `generatePositions` | Prises de position à publier |
| `generatePostDraft` | Draft d'un post à partir d'une brique |
| `scoreHook` | Score l'accroche d'un post |
| `analyzeBodyRetention` | Analyse la rétention du corps de texte |
| `expertWritingAudit` | Audit éditorial expert |
| `marieHookAudit` | Audit accroche (méthode Marie) |
| `luisEnriqueAudit` | Audit structure (méthode Luis Enrique) |
| `applyMeroeStyle` | Application du style Meroé |
| `tagVision2026` | Tag vision 2026 sur un post |
| `detectSignalType` | Détection du type de signal marché |
| `generateSignalScript` | Script de réponse à un signal |
| `computeUserTerritory` | Calcul du territoire éditorial |
| `runCommentFilters` | Filtres de qualité commentaire |
| `auditComment` | Audit d'un commentaire |
| `detectPostTopic` / `detectPostGap` / `detectAvoidPatterns` | Analyse de post |
| `mapDiltsToFormat` | Mapping Dilts → format de post |
| `generateSleepComment` | Commentaire pour contact dormant |
| `generateDormantRelaunch` | Relance de contact dormant |
| `proposeSleepBrick` | Suggestion de brique pour profil dormant |

### `lib/sprint/bricks.js` (491 lig.)
Logique des briques — création, matching, audit.

| Export | Description |
|--------|-------------|
| `matchKpiToReference` | Match un KPI saisi contre le référentiel du rôle |
| `computeCrossRoleMatching` | Matching des briques sur plusieurs rôles |
| `generateAdaptiveSeeds` | Génère les seeds adaptés au rôle cible |
| `generateBrickVersions` | Variantes d'une brique (reformulations) |
| `getBrickFields` / `assembleFieldsToText` | Champs structurés ↔ texte |
| `analyzeTakeDepth` | Profondeur d'une prise de position |
| `takeToiPillar` | Rattachement take → pilier |
| `getAdaptivePillars` | Piliers adaptatifs par rôle |
| `auditBrickVulnerability` | Audit de vulnérabilité d'une brique |

### `lib/sprint/scoring.js` (314 lig.)
Scoring et métriques de progression.

| Export | Description |
|--------|-------------|
| `computeDensityScore` | Score de densité global (gate de progression) |
| `computeCauchemarCoverage` | Couverture des 3 cauchemars par les briques |
| `computeCauchemarCoverageDetailed` | Couverture détaillée avec coûts |
| `computeNegotiationBrief` | Brief de négociation |
| `computeEffort` | Effort total (pondéré par type de brique) |
| `detectBluffRisk` | Détection de risque de bluff |
| `formatCost` | Formatage montant (K, M) |
| `hashCode` | Hash simple pour déterminisme |
| `getActiveCauchemars` / `setActiveCauchemarsGlobal` | Cauchemars actifs (global) |
| `auditBrickVulnerability` | Audit vulnérabilité (doublon scoring) |

### `lib/sprint/analysis.js` (258 lig.)
Analyse textuelle des saisies utilisateur.

| Export | Description |
|--------|-------------|
| `estimateReadiness` | Estimation de maturité du profil |
| `hasNumbers` | Détecte la présence de chiffres |
| `hasExternalization` | Détecte l'externalisation (blâme externe) |
| `hasBlame` | Détecte le blâme direct |
| `hasDecisionMarkers` | Détecte les marqueurs de décision |
| `hasInfluenceMarkers` | Détecte les marqueurs d'influence |
| `auditAnonymization` | Audit d'anonymisation du texte |
| `detectSensitiveData` | Détection de données sensibles |
| `classifyCicatrice` | Classification d'une cicatrice |
| `analyzeVerbs` | Analyse des verbes utilisés |
| `getMaturityLevel` | Niveau de maturité global |

### `lib/sprint/dilts.js` (242 lig.)
Pyramide de Dilts — calibration éditoriale.

| Export | Description |
|--------|-------------|
| `DILTS_LEVELS` | Les 6 niveaux (Environnement → Mission) |
| `DILTS_MARKERS` | Marqueurs textuels par niveau |
| `DILTS_CALIBRATION` | Paramètres de calibration par cible |
| `DILTS_EDITORIAL_MAPPING` | Mapping niveau → style éditorial |
| `detectDiltsLevel` | Détection du niveau Dilts d'un texte |
| `getDiltsLabel` | Label d'un niveau |
| `analyzeDiltsProgression` | Analyse de progression Dilts |
| `checkDiltsSequence` | Vérifie la séquence de posts |
| `computeDiltsTarget` | Calcul de la cible Dilts |
| `selectBrickForDiltsTarget` | Sélection de brique pour un niveau cible |
| `getDiltsPlafond` | Plafond Dilts actuel |
| `getDiltsCeilingForOutput` | Plafond par type de sortie |
| `getDiltsThermometerState` | État du thermomètre Dilts |

### `lib/sprint/offers.js` (160 lig.)
Parsing et analyse des offres d'emploi.

| Export | Description |
|--------|-------------|
| `parseOfferSignals` | Extraction des signaux d'une offre |
| `buildActiveCauchemars` | Construction des cauchemars actifs depuis les offres |
| `mergeOfferSignals` | Fusion des signaux de plusieurs offres |
| `checkOfferCoherence` | Vérification de cohérence entre offres |

### `lib/sprint/redac.js` (129 lig.)
Filtre rédactionnel appliqué à tout texte généré.

| Export | Description |
|--------|-------------|
| `REDAC_BANNIS` | Liste de mots/expressions bannis avec remplacements |
| `cleanRedac` | Applique le filtre rédactionnel complet |

---

## 5. Routes API

| Route | Méthode | Service | Description |
|-------|---------|---------|-------------|
| `/api/scan` | POST | Anthropic | Envoie CV + offres à Claude, retourne briques hypothétiques + KPIs cachés |
| `/api/checkout` | POST | Stripe | Crée une session de paiement (49€) |
| `/api/webhook` | POST | Stripe | Reçoit `checkout.session.completed`, marque `profiles.paid = true` |

---

## 6. Base de données (Supabase)

Schéma défini dans `supabase/schema.sql` :

| Table | Colonnes clés | Rôle |
|-------|---------------|------|
| `profiles` | id, email, paid, stripe_customer_id | Utilisateurs et statut paiement |
| `sprints` | id, user_id, state (JSONB), updated_at | État complet du sprint (briques, vault, screen) |
| `payments` | id, user_id, stripe_session_id, amount, status | Journal des paiements |

---

## 7. Dépendances

| Package | Version | Usage |
|---------|---------|-------|
| next | 14.2.0 | Framework React (App Router) |
| react / react-dom | 18.3.0 | UI |
| @supabase/supabase-js | 2.45.0 | Auth + base de données |
| stripe | 16.0.0 | Paiement |
| @anthropic-ai/sdk | 0.30.0 | Scan IA (Claude) |
