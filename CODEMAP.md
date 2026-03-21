# CODEMAP — Abneg@tion

> Carte du projet pour développeurs et LLMs. Généré le 2026-03-09.
> 51 fichiers · ~19 000 lignes de code applicatif.

---

## app/

### `app/layout.js` (28 lignes)
**Rôle :** Layout racine HTML — meta, fonts Inter, Pirsch analytics, footer légal, cookie banner.
**Exports :** `metadata`, `default RootLayout`

### `app/page.js` (372 lignes)
**Rôle :** Landing page publique — hero, vidéo placeholder, bénéfices, 3 étapes, avant/après, comparaison, pricing, FAQ, CTA.
**Exports :** `default Home`

### `app/auth/page.js` (121 lignes)
**Rôle :** Page login/signup email+password via Supabase Auth.
**Exports :** `default AuthPage`

### `app/sprint/page.js` (254 lignes)
**Rôle :** Page Sprint — auth check, sync state localStorage/Supabase, auto-save 2s debounce, gate onboarding, rendu Sprint.
**Exports :** `default SprintPage`

### `app/eclaireur/page.jsx` (15 lignes)
**Rôle :** Wrapper page pour le composant Éclaireur (diagnostic gratuit offre+CV).
**Exports :** `default EclaireurPage`

### `app/onboarding/page.jsx` (72 lignes)
**Rôle :** Page onboarding — capture rôle cible, profil, offres, lance le sprint via sessionStorage.
**Exports :** `default OnboardingPage`

### `app/brew/page.jsx` (88 lignes)
**Rôle :** Page Brew (cockpit LinkedIn hebdo) — auth, chargement semaine, rendu Brew.
**Exports :** `default BrewPage`

### `app/paywall/page.jsx` (6 lignes)
**Rôle :** Page paywall — rendu du composant Paywall.
**Exports :** `default PaywallPage`

### `app/confidentialite/page.jsx` (85 lignes)
**Rôle :** Page politique de confidentialité RGPD.
**Exports :** `default ConfidentialitePage`

### `app/mentions-legales/page.jsx` (63 lignes)
**Rôle :** Page mentions légales obligatoires.
**Exports :** `default MentionsLegalesPage`

---

### API Routes

### `app/api/scan/route.js` (65 lignes)
**Rôle :** POST — envoie CV+offres+roleId à Claude Sonnet 4, retourne `{ bricks, hiddenKpis, topSkills, gaps }`.
**Exports :** `POST`

### `app/api/checkout/route.js` (71 lignes)
**Rôle :** POST — crée une session Stripe Checkout (49 €).
**Exports :** `POST`

### `app/api/checkout/verify/route.js` (23 lignes)
**Rôle :** GET — vérifie le statut de paiement d'une session Stripe.
**Exports :** `GET`

### `app/api/webhook/route.js` (42 lignes)
**Rôle :** POST — webhook Stripe `checkout.session.completed`, marque l'utilisateur `paid` en base.
**Exports :** `POST`

### `app/api/auth/register/route.js` (35 lignes)
**Rôle :** POST — inscription utilisateur côté serveur via Supabase Admin.
**Exports :** `POST`

### `app/api/recommend-pillars/route.js` (67 lignes)
**Rôle :** POST — recommandation de piliers via Claude Haiku, retourne `[{ recommended, reason }]`.
**Exports :** `POST`

---

## components/

### `components/Sprint.jsx` (1105 lignes)
**Rôle :** Orchestrateur principal du sprint — gère l'état global, les 5 étapes (Interrogation, Duel, EndScreen), la navigation, le scan IA, la persistance.
**Exports :** `default Sprint`

### `components/CookieBanner.jsx` (43 lignes)
**Rôle :** Bannière cookies minimale avec consentement localStorage.
**Exports :** `default CookieBanner`

---

### components/sprint/

### `components/sprint/panels.jsx` (2562 lignes)
**Rôle :** Panneaux latéraux du sprint — Arsenal (radar + trajectoire), Vault, CV Preview, WorkBench (livrables), MarketMap, SubscriptionDashboard, CrossRoleInsight.
**Exports :** `InvestmentIndex`, `Vault`, `CVPreview`, `BricksRecap`, `WorkBench`, `SubscriptionDashboard`, `CrossRoleInsight`, `Arsenal`, `MarketMap`

### `components/sprint/EndScreen.jsx` (2085 lignes)
**Rôle :** Écran de fin — rapport d'impact, livrables (CV, bio, scripts, LinkedIn), positions, signaux, commentaires.
**Exports :** `ImpactReportPanel`, `Deliverable`, `PositionCard`, `SignalField`, `CommentField`, `EndScreen`

### `components/sprint/Interrogation.jsx` (1509 lignes)
**Rôle :** Étape interrogation — forge des briques (preuve/cicatrice/élastique), stress test 4 angles, champ transferStatement.
**Exports :** `FeedbackToast`, `AddBrick`, `Interrogation`, `BrickStressTest`

### `components/sprint/Arsenal.jsx` (311 lignes)
**Rôle :** Density radar, next action, simulation.
**Exports :** `Arsenal`

### `components/sprint/Duel.jsx` (685 lignes)
**Rôle :** Étape duel — simulation d'entretien avec crises, contradictions, questions difficiles.
**Exports :** `Duel`

### `components/sprint/Onboarding.jsx` (630 lignes)
**Rôle :** Onboarding interne (legacy) — diagnostic, scan CV, choix de rôle cible.
**Exports :** `getActiveCauchemars`, `setActiveCauchemarsGlobal`, `DiagnosticScreen`, `Onboarding`

### `components/sprint/ui.jsx` (347 lignes)
**Rôle :** Composants UI partagés du sprint — barre de progression, navigation, copier, piliers, offres, verrouillage.
**Exports :** `Bar`, `Nav`, `CopyBtn`, `Pillars`, `Locked`, `OffersManager`

### `components/sprint/Toast.jsx` (29 lignes)
**Rôle :** Composant toast notification.
**Exports :** `Toast`

### `components/sprint/WorkBench.jsx` (1287 lignes)
**Rôle :** Établi: External/Internal tabs, deliverable generation, audit, copy.
**Exports :** `WorkBench`

---

### components/sprint/hooks/

### `components/sprint/hooks/useDuel.js` (118 lignes)
**Rôle :** Duel lifecycle: question building, completion, redo.
**Exports :** `useDuel`

### `components/sprint/hooks/useOffers.js` (131 lignes)
**Rôle :** Dynamic offers lifecycle: parsing, adding, removing, obsolete tracking.
**Exports :** `useOffers`

### `components/sprint/hooks/useSignature.js` (297 lignes)
**Rôle :** Signature detection + 3-screen overlay + validation.
**Exports :** `useSignature`

---

### components/eclaireur/

### `components/eclaireur/Eclaireur.jsx` (354 lignes)
**Rôle :** Diagnostic gratuit — analyse offre + audit CV, score cauchemars, aperçu Forge.
**Exports :** `Eclaireur`

---

### components/onboarding/

### `components/onboarding/OnboardingFlow.jsx` (451 lignes)
**Rôle :** Flux onboarding en 4 étapes — rôle cible, profil+CV, offres, génération de briques seeds.
**Exports :** `OnboardingFlow`

---

### components/brew/

### `components/brew/Brew.jsx` (700 lignes)
**Rôle :** Cockpit LinkedIn hebdomadaire — génération de posts calibrés Dilts, audit Méroé/Marie Hook/Luis Enrique.
**Exports :** `default Brew`

---

### components/paywall/

### `components/paywall/Paywall.jsx` (150 lignes)
**Rôle :** Composant paywall — présentation offre 49 €, redirect Stripe Checkout.
**Exports :** `Paywall`

---

### components/ui/

### `components/ui/Tooltip.jsx` (42 lignes)
**Rôle :** Tooltip générique hover/click.
**Exports :** `default Tooltip`

---

## lib/

### `lib/supabase.js` (17 lignes)
**Rôle :** Clients Supabase — `createBrowserClient` (navigateur) et `createServerClient` (serveur, service role key).
**Exports :** `createBrowserClient`, `createServerClient`

### `lib/stripe.js` (3 lignes)
**Rôle :** Singleton Stripe initialisé avec `STRIPE_SECRET_KEY`.
**Exports :** `stripe`

### `lib/sprint-db.js` (54 lignes)
**Rôle :** Opérations Supabase sprint — charger, sauvegarder, vérifier paiement.
**Exports :** `loadSprint`, `saveSprint`, `checkPaid`

### `lib/audit.js` (281 lignes)
**Rôle :** Audit de livrables (CV, bio, scripts) — vérification structure, ton, couverture cauchemars.
**Exports :** `auditDeliverable`

### `lib/brew-db.js` (158 lignes)
**Rôle :** Opérations Supabase Brew — semaines, instructions, DMs générés.
**Exports :** `loadBrewWeeks`, `saveBrewWeek`, `loadBrewInstructions`, `createBrewInstruction`, `markInstructionDone`, `isWeekDeclared`, `incrementDmsGenerated`, `getMonday`

### `lib/postScore.js` (313 lignes)
**Rôle :** Scoring de posts LinkedIn — hook score, rétention corps, audit Méroé, audit Marie Hook, génération variantes.
**Exports :** `scoreHook`, `analyzeBodyRetention`, `marieHookFullPost`, `meroeAudit`, `generateHookVariants`

### `lib/vocabulary.js` (19 lignes)
**Rôle :** Dictionnaire de termes métier avec définitions pour tooltips.
**Exports :** `default VOCABULARY`

---

### lib/eclaireur/

### `lib/eclaireur/analyze.js` (122 lignes)
**Rôle :** Analyse d'offre d'emploi — détection rôle, cauchemars, signaux d'urgence, KPIs cachés.
**Exports :** `analyzeOffer`

### `lib/eclaireur/audit-cv.js` (150 lignes)
**Rôle :** Audit CV externe — score de couverture cauchemars, annotations par section.
**Exports :** `auditExternalCV`

---

### lib/generators/

### `lib/generators/selectors.js`
**Rôle :** Brick selection logic: scoreBricksByCauchemar, selectGreedyCoverage, selectBestBrick.
**Exports :** `scoreBricksByCauchemar`, `selectGreedyCoverage`, `selectBestBrick`

### `lib/generators/one-pager.js`
**Rôle :** Génère un One-Pager : document de preuve en 5 blocs (en-tête, preuves d'impact, pourquoi ce poste, parcours compressé, contact). Zéro vocabulaire Abneg@tion — conçu pour sortir de la plateforme.
**Exports :** `generateOnePager`

---

### lib/sprint/

### `lib/sprint/generators.js` (2381 lignes)
**Rôle :** Moteur de génération de tous les livrables — CV, bio, scripts contact (4 variantes), interview, plan 90j, rapport remplacement, négociation salariale, signature email, posts LinkedIn, follow-up, stress test.
**Exports :** `extractBestNum`, `computeFosseMarket`, `generateCV`, `generateBio`, `generateCVLine`, `generateInterviewVersions`, `generateScript`, `generatePlan90`, `generateContactScripts`, `scoreContactScript`, `generateTransitionScript`, `generateImpactReport`, `computeZones`, `generateDiagnosticQuestions`, `translateCVPerception`, `generateSampleTransformation`, `generateDiagnostic`, `generateAdvocacyText`, `generateInternalAdvocacy`, `generateStressTest`, `auditDeliverable`, `generatePlan30jRH`, `generateReplacementReport`, `generateRaiseArgument`, `generatePlan90jN1`, `generateInterviewQuestions`, `generateFollowUp`, `generateEmailSignature`

### `lib/sprint/references.js` (737 lignes)
**Rôle :** Données de référence — rôles cibles, KPIs par rôle, cauchemars recruteur, templates briques, piliers, questions duel, channels scripts, données marché, variantes de titres, cauchemars transversaux, ratio valeur/coût, niveaux de séniorité.
**Exports :** `SCAN_STEPS_ACTIF`, `SCAN_STEPS_PASSIF`, `STEPS`, `KPI_REFERENCE`, `CAUCHEMAR_TEMPLATES_BY_ROLE`, `TRANSVERSAL_CAUCHEMARS`, `OFFER_URGENCY_KEYWORDS`, `SECTOR_KEYWORDS`, `TARGET_ROLES`, `ROLE_CLUSTERS`, `ROLE_VARIANTS`, `CAUCHEMARS_CIBLES`, `MARKET_DATA`, `BRICK_FIELDS`, `SEED_TEMPLATES`, `ROLE_PILLARS`, `DUEL_CRISES`, `DUEL_CONTRADICTIONS`, `DUEL_QUESTIONS`, `SCRIPT_CHANNELS`, `SIGNAL_TYPES`, `COMMENT_TOPICS`, `COMMENT_AVOID_PATTERNS`, `VISION_2026_FORMATS`, `ELASTICITY_LABELS`, `CATEGORY_LABELS`, `EFFORT_WEIGHTS`, `REPLACEMENT_DATA_BY_ROLE`, `STRESS_ANGLES`, `SALARY_RANGES_BY_ROLE`, `OTE_SPLIT_BY_ROLE`, `ROLE_VALUE_RATIO`, `SENIORITY_LEVELS`, `SENIORITY_CALIBRATION`

### `lib/sprint/linkedin.js` (1089 lignes)
**Rôle :** Moteur LinkedIn — génération posts (Dilts-calibrés), scoring hooks, audit corps, first comment, positions, signaux, commentaires, audit Méroé/Marie Hook/Luis Enrique, posts hebdo, relance dormants.
**Exports :** `generateLinkedInPosts`, `scoreHook`, `analyzeBodyRetention`, `expertWritingAudit`, `generateFirstComment`, `generatePositions`, `detectSignalType`, `generateSignalScript`, `detectPostTopic`, `detectAvoidPatterns`, `computeUserTerritory`, `detectPostGap`, `runCommentFilters`, `auditComment`, `generateLinkedInComment`, `mapDiltsToFormat`, `generatePostDraft`, `applyMeroeStyle`, `marieHookAudit`, `luisEnriqueAudit`, `tagVision2026`, `generateWeeklyPosts`, `generateSleepComment`, `generateDormantRelaunch`, `proposeSleepBrick`

### `lib/sprint/scoring.js` (508 lignes)
**Rôle :** Scoring des briques — armure (4 angles), densité, couverture cauchemars, brief négociation, bluff risk, effort, vulnérabilité.
**Exports :** `getActiveCauchemars`, `setActiveCauchemarsGlobal`, `assessBrickArmor`, `computeDensityScore`, `computeCauchemarCoverage`, `computeNegotiationBrief`, `formatCost`, `detectBluffRisk`, `computeEffort`, `hashCode`, `computeCauchemarCoverageDetailed`, `auditBrickVulnerability`, `MARKET_DATA`

### `lib/sprint/brickExtractor.js` (272 lignes)
**Rôle :** Extraction structurelle des briques — résultat chiffré, verbe d'action, contexte, contrainte. Couche de compression pour tous les générateurs.
**Exports :** `extractBrickCore`, `formatAnchorLine`, `formatCVLine`, `hasMentoringMarkers`

### `lib/sprint/bricks.js` (499 lignes)
**Rôle :** Logique métier briques — matching KPI, cross-role, champs adaptatifs, seeds, analyse take, piliers, versions, audit vulnérabilité.
**Exports :** `matchKpiToReference`, `computeCrossRoleMatching`, `getBrickFields`, `assembleFieldsToText`, `generateAdaptiveSeeds`, `analyzeTakeDepth`, `takeToiPillar`, `getAdaptivePillars`, `generateBrickVersions`, `auditBrickVulnerability`

### `lib/sprint/signature.js` (447 lignes)
**Rôle :** Signature professionnelle — détection seuil, hypothèses masquées, méta-patterns, cross-référence, validation, armure, filtre livrables.
**Exports :** `hasReachedSignatureThreshold`, `generateMaskedHypotheses`, `computeMetaPatterns`, `crossReferenceSignature`, `validateSignatureFormulation`, `isSignatureArmored`, `applySignatureFilter`

### `lib/sprint/analysis.js` (299 lignes)
**Rôle :** Analyse qualitative des briques — readiness, nombres, externalisation, blâme, décision, influence, anonymisation, données sensibles, cicatrices, verbes, résumé, maturité.
**Exports :** `estimateReadiness`, `hasNumbers`, `hasExternalization`, `hasBlame`, `hasDecisionMarkers`, `hasInfluenceMarkers`, `auditAnonymization`, `detectSensitiveData`, `classifyCicatrice`, `analyzeVerbs`, `extractBrickSummary`, `getMaturityLevel`

### `lib/sprint/dilts.js` (277 lignes)
**Rôle :** Modèle Dilts — niveaux logiques, détection, progression, séquence, stagnation, calibration, thermomètre, plafond éditorial.
**Exports :** `DILTS_LEVELS`, `DILTS_MARKERS`, `detectDiltsLevel`, `getDiltsLabel`, `analyzeDiltsProgression`, `checkDiltsSequence`, `detectDiltsStagnation`, `DILTS_CALIBRATION`, `computeDiltsTarget`, `selectBrickForDiltsTarget`, `DILTS_EDITORIAL_MAPPING`, `getDiltsPlafond`, `getDiltsCeilingForOutput`, `getDiltsThermometerState`

### `lib/sprint/offers.js` (267 lignes)
**Rôle :** Parsing d'offres d'emploi — signaux recruteur, cauchemars actifs, cohérence multi-offres, signaux internes, dispersion sectorielle.
**Exports :** `parseOfferSignals`, `buildActiveCauchemars`, `mergeOfferSignals`, `checkOfferCoherence`, `parseInternalSignals`, `aggregateOfferSignals`, `detectSectoralDispersion`

### `lib/sprint/redac.js` (129 lignes)
**Rôle :** Filtre rédactionnel — liste de mots bannis (bullshit corporate), nettoyage de texte généré.
**Exports :** `REDAC_BANNIS`, `cleanRedac`

### `lib/sprint/migrations.js` (43 lignes)
**Rôle :** Migration de l'état sprint entre versions de schéma.
**Exports :** `migrateState`, `CURRENT_VERSION`

---

## scripts/

### `scripts/hooks/post-merge`
**Rôle :** Runs QA agent automatically after merge to main.
**Exports :** aucun (git hook)

### `scripts/hooks/pre-commit`
**Rôle :** Blocks unicode escapes, console.log, dangerouslySetInnerHTML, dead features.
**Exports :** aucun (git hook)

### `scripts/install-hooks.sh`
**Rôle :** One-time hook installation (copies to .git/hooks/).
**Exports :** aucun (script shell)

### `scripts/qa-agent.js`
**Rôle :** 15 automated post-merge checks (npm run qa).
**Exports :** aucun (script exécutable)

---

## tests/

### `tests/analysis.test.js`
**Rôle :** hasDecisionMarkers: decision vs execution verbs.
**Exports :** aucun (test unitaire)

### `tests/audit-cv.test.js`
**Rôle :** detectEnglish via auditExternalCV: French, English, mixed text.
**Exports :** aucun (test unitaire)

### `tests/helpers.test.js`
**Rôle :** extractBrickCore: fast path, fallback, no-number edge case.
**Exports :** aucun (test unitaire)

### `tests/selectors.test.js`
**Rôle :** scoreBricksByCauchemar, selectGreedyCoverage, selectBestBrick.
**Exports :** aucun (test unitaire)

### `tests/smoke.mjs` (548 lignes)
**Rôle :** Suite de 170 smoke tests — couvre scoring, generators, analysis, offers, brickExtractor, éclaireur, email signature, dilts, contact score, brew utils, post score, dev server.
**Exports :** aucun (script exécutable)

---

## Racine

### `next.config.js` (6 lignes)
**Rôle :** Configuration Next.js — React Strict Mode désactivé.
**Exports :** `default` (config object)
