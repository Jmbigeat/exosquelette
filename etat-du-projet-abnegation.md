# ÉTAT DU PROJET — Abneg@tion
## Dernière mise à jour : 25 mars 2026 (soir)

Ce document est la source de vérité. Il remplace journal.txt. Chaque session Claude.ai commence par le lire. Chaque session Claude.ai finit par le mettre à jour.

---

## MODÈLE COMMERCIAL (B2C2B — décidé le 6 mars 2026)

Éclaireur gratuit → Forge gratuite → densité 70% = profil armé → livrables en abonnement (~19€/mois, hypothèse à tester) → visibilité cabinets opt-in.

Le gratuit dit "tu sais." Le payant dit "tu agis." L'insight est gratuit, l'arme est payante.

Gratuit : Éclaireur V2 (KPI caché + audit CV × offre, 5 tests croisés), Forge complète (extraction, blindage, Duel, signature, GPS, élasticité, cauchemars, coût sectoriel, trajectoire).

Payant (abonnement) : livrables calibrés par canal/interlocuteur (One-Pager = arme, CV = procédure, bio, mail, script), Trempe hebdomadaire, négociation salariale (rapport, argumentaire, comparatif), visibilité cabinets opt-in.

B2B : L'Échoppe. Profil anonymisé, cabinets paient par crédits (150€/crédit). Quality gate : densité ≥70% + blindage ≥3/4. Seuil lancement : 20 profils opt-in/rôle, lancement progressif rôle par rôle. Le contact déclenche le One-Pager calibré pour le mandat. CV sur demande.

Pièces = mécanisme mort (ch14, code désactivé, compteur masqué dans le header).
Paywall 49€ = bypassé (redirect /paywall → /onboarding).

---

## 10 RÔLES COUVERTS (4 SECTEURS)

Croissance : enterprise_ae (Vente), head_of_growth (Marketing), strategic_csm (Relation client)
Produit & Tech : senior_pm (Produit), engineering_manager (Tech), ai_architect (Data & IA)
Stratégie & Ops : management_consultant (Conseil), strategy_associate (Stratégie), operations_manager (Opérations), fractional_coo (Direction)

---

## EN PRODUCTION (main)

Domaine : abnegation.eu (+ www.abnegation.eu). OVH DNS → Vercel. SSL automatique.
Smoke test : 209+ tests. Unit tests : 10.
Dernier push : 23 mars 2026.

| Élément | Statut |
|---------|--------|
| Chantiers 1-21 | ✅ Tous mergés |
| Refactor-bio Framework D | ✅ |
| Fix groupé generators (14 correctifs + extractBrickCore) | ✅ |
| Generator followup Framework Miroir (5 blocs) | ✅ |
| Generator signature email (≤80 chars) | ✅ |
| Éclaireur V2 audit CV × offre (5 tests croisés) | ✅ |
| LinkedIn 360 Brew V2 (page /brew, 2 tables Supabase, 3 zones) | ✅ |
| Bypass paywall 49€ (redirect → /onboarding) | ✅ |
| Continuité sessionStorage Éclaireur → Onboarding → Forge | ✅ |
| Skip onboarding (profil + offres si eclaireur_data) | ✅ |
| Tooltips vocabulaire (15 termes) | ✅ |
| Stress test influence adapté projets solo | ✅ |
| Fix conjugaison féminine audit-cv.js | ✅ |
| Fix marqueurs tension enrichis | ✅ |
| Fix verbes contextuels (aide, contribué) | ✅ |
| Fix intervieweur dira (extractBrickCore resultNumber) | ✅ |
| Fix largeur Éclaireur (aligné sur Forge) | ✅ |
| Suppression bouton Mise en Veille | ✅ |
| Compteur pièces masqué dans header | ✅ |
| 62,8% stat restreinte aux rôles sales | ✅ |
| Mot de passe oublié (resetPasswordForEmail) | ✅ |
| redirectTo → abnegation.eu partout | ✅ |
| RGPD (mentions légales, confidentialité, bannière cookies, footer) | ✅ |
| Trajectoire : rename "Le contexte de départ" | ✅ |
| Trajectoire : brick.transferStatement (champ optionnel Assemblage) | ✅ |
| Trajectoire : bloc Arsenal (distance linéaire/transverse/atypique) | ✅ |
| Landing page restructurée wireframe (bénéfices, 3 étapes, placeholders) | ✅ |
| Landing page B2C2B (Forge gratuite, 0 mention 49€) | ✅ |
| Pirsch analytics (script layout.js) | ✅ |
| Confirmation email différée (bandeau après 3 briques ou 24h) | ✅ |
| Retry sauvegarde + backup localStorage offline | ✅ |
| CODEMAP.md (51 fichiers documentés) | ✅ |
| Fix extractBrickCore resultNumber — brick.fields fast path | ✅ |
| ESLint + Prettier (flat config v9, 78 fichiers formatés) | ✅ |
| ADR directory (docs/adr/ — 2 ADR + README index) | ✅ |
| Bio LinkedIn bloc 1 ≤ 210 chars (troncation progressive 3 étapes) | ✅ 19 mars |
| Autosave toast première visite Forge (firstVisitToastShown flag) | ✅ 19 mars |
| Von Restorff Établi — livrable recommandé en surbrillance dorée | ✅ 19 mars |
| Audit CV Forge — 6 tests croisés CV × briques (Arsenal bloc 4, useMemo, debounce 500ms) | ✅ 20 mars |
| Comparatif salarial — position marché P25/P50/P75 + OTE/ACV + livrable négociation 4 blocs (Arsenal bloc 5 + Établi interne) | ✅ 20 mars |
| Marqueurs LoC + solo×équipe — hasInternalLocus (22 marqueurs), hasExternalLocus (16 marqueurs), isSoloBrick extrait, diagnostic 4 quadrants Arsenal bloc 6 | ✅ 21 mars |
| One-Pager generator — 5 blocs (titre+signature, preuves d'impact, pourquoi ce poste, parcours, contact). Livrable principal Établi. Von Restorff par défaut. Zéro jargon Abneg@tion. | ✅ 21 mars |
| ROLE_VARIANTS — 10 rôles × 10-13 variantes FR+EN. Matching additif dans analyzeOffer. Hints dans l'Onboarding. | ✅ 21 mars |
| 3 cauchemars transversaux — senior/junior manager (all), moving goalposts (all), variable inatteignable (sales). enterprise_ae=8, senior_pm=7. | ✅ 21 mars |
| ROLE_VALUE_RATIO — ratio coût/valeur par rôle (10 rôles × low/high/valueType). Arsenal bloc 5 enrichi + generator salary-comparison bloc 3 enrichi. | ✅ 21 mars |
| Axe séniorité IC/Manager/Leader — SENIORITY_LEVELS + SENIORITY_CALIBRATION dans references.js. Sélection Onboarding. Arsenal bloc 7 (fourchette ajustée ×1.0/1.25/1.55, interview focus, risque). | ✅ 21 mars |
| Appel découverte — 5 questions calibrées (terrain, équipe, mesure×séniorité, preuve asymétrique, process). Breadcrumbs implicites. Établi onglet Externe. | ✅ 21 mars |
| Fiche de combat V2 — 6 blocs assemblés depuis 8 sources (cauchemars triés par couverture, briques+parades calibrées LoC+blindage, 3 questions discovery, pitch+signature+séniorité, posture+ratio, position marché). | ✅ 21 mars |
| Refactor unification livrables — 17→11 livrables × 5 catégories (Candidature, Prise de contact, Entretien, LinkedIn, Négociation). Zones 1-3 fusionnées. UI only. | ✅ 21 mars |
| Refactor landing = Éclaireur — hero contient le champ Éclaireur (Approche A, embed direct). Zéro jargon. Forge absente du fold. Placeholders commentés. FAQ intègre pricing. | ✅ 21 mars |
| 16n Question parcours non linéaire — detectNonLinearCareer(bricks), heuristique "chez X/pour X/au sein de X" + mots-clés org, section conditionnelle dans generateInterviewQuestions, parade top 3 briques par armorScore. 4 smoke tests. | ✅ 23 mars |
| 16j Question "Pourquoi" post-Signature — 4ème écran overlay Signature (sigScreen "why"), whyThisRole stocké sur objet signature, 2 sorties (Valider/Passer), One-Pager bloc 3 intègre voix candidat si rempli, fallback auto sinon. 5 smoke tests. | ✅ 23 mars |
| 16i Checklist intégration 90 jours — INTEGRATION_MILESTONES (week1/month1/month3 × growth/product/strategy) + getRoleCluster dans references.js. Plan 30j enrichi (Semaine 1 + Mois 1). Plan 90j enrichi (Mois 1 + Mois 3). Discovery Call +Q6 intégration. Séniorité non câblée (V2). 20 smoke tests. | ✅ 23 mars |
| 16k Frictions/Intersections briques élastiques — 2 angles conditionnels dans STRESS_ANGLES (friction 3 variantes + intersection 3 variantes). generateStressTest Source 4 : déclenchement si brickType === "elastic" ou elasticity === "élastique". Proof/cicatrice non impactés. 10 smoke tests. | ✅ 23 mars |
| 16l Filtre anti-pattern Arsenal — detectOrphanArmoredBricks + brickFeedsSignature (heuristique metaPatterns) dans signature.js. Alerte "Brique blindée, mauvais mur" dans Arsenal (bordure jaune, armorScore === 4 strict). Conditionnel : Signature détectée + brique orpheline. Informatif, zéro blocage. | ✅ 23 mars |
| lessons.md ajouté au repo (10 entrées, bugs réels + règles) | ✅ 23 mars |
| working-style.md enrichi (section Claude.ai : challenge before validating, verdict first, ask questions when stuck, never re-explain context) | ✅ 23 mars |
| template-prompt-claude-code.md enrichi (Opération 0 statechart obligatoire pour modifications UI, lessons.md au démarrage, feat- dans les types de branche) | ✅ 23 mars |

---

## INFRASTRUCTURE

- Stack : Next.js 14, Supabase (auth + persistence + brew_weeks + brew_instructions), Stripe, Vercel
- Domaine : abnegation.eu (OVH, 8,99€/an)
- Email : contact@abnegation.eu (Zimbra Starter OVH, actif)
- Analytics : Pirsch (4€/mois, RGPD, script dans layout.js)
- Repo : ~/Downloads/exosquelette
- Monitoring : UptimeRobot (5 min, alerte email)
- DNS : OVH → Vercel (A + CNAME). Propagation terminée.

---

## TREMPE V2 (spec définitive — 19 mars 2026)

Nom UI : La Trempe. Code interne : brew (tables, hooks, routes). Renommage UI-only.
Doctrine : "La Trempe prépare, la Forge exécute."
Cycle : dimanche 19h → pilier + angle personnalisé → candidat exécute → déclare Fait.
Couverture piliers : rotation par défaut, corrigée par couverture réelle.
Angles : personnalisés par briques + niveau Dilts (invisible candidat).
Dashboard : 3 zones (instruction active, historique, progression).
Lien Trempe → Forge (code : brew → sprint) : router.push('/sprint?brew_pillar={N}&brew_dilts={N}') → Établi pré-injecté.
Statechart : Couche 2 (pas une région du Sprint). BREW.LOCKED → BREW.ACTIVE (INSTRUCTION ↔ DECLARED).
Gate : abonnement (is_subscribed). Pas de pièces.
Prérequis implémentation : Stripe actif.

Kano :
Basique (3) : instruction hebdomadaire, bouton Fait + historique, angle personnalisé.
Performance (3) : couverture piliers, streak, correction couverture réelle.
Attractif (4) : alerte stagnation Dilts, filtre pertinence commentaire, signal DM, bouton Établi pré-injecté.
Indifférent (2) : format lien, jour exact notification.
Inversé (3) : métriques engagement, blocage semaine, format imposé.

---

## LISTE D'ATTENTE (réordonnée 23 mars 2026)

### Priorité 1 — DISTRIBUTION
1. Mettre l'Éclaireur devant 10 candidats réels
2. 20 DM + 1 canal d'acquisition mesuré
3. ~~Alex BLUMA~~ → call semaine prochaine
4. ~~Loic Doufodji~~ → DM envoyé
5. 5 sessions utilisateur observées
6. Contacter Loris (Big Idea / canal distribution)
7. DM Noota (dans 2 semaines, post screening IA publié avant)
8. Profil consultante carrière 700 profils (après 10 candidats)
9. npm audit périodique (dépendances) — après Stripe + 10 candidats. Source : Julien Gelee post ai-rsk / CRA.

### Priorité 2 — REVENUS
7. Micro-entreprise INPI + SIRET
8. Stripe config (produit 19€, webhook, rate limit, user.id, is_subscribed, paywall)

### Priorité 3 — PRODUIT (réordonné par impact/effort)
- 15a ~~Bio 210 chars~~ → ✅ FAIT 19 mars
- 15b ~~Autosave toast~~ → ✅ FAIT 19 mars
- 15c ~~Von Restorff Établi~~ → ✅ FAIT 19 mars
- 15d ~~Audit CV Forge~~ → ✅ FAIT 20 mars
- 15e ~~Comparatif salarial + OTE/ACV~~ → ✅ FAIT 20 mars
- 15f ~~Marqueurs LoC + solo×équipe~~ → ✅ FAIT 21 mars
- 15g ~~Cadre théorique stress test~~ → doc fait, messaging reporté post-10 candidats
- ~~15i Rename Brew → La Trempe~~ → supprimé (natif dans 15h)
- 15j ~~One-Pager generator Établi~~ → ✅ FAIT 21 mars
- 15h La Trempe V2 (spec définitive prête, bloquée par Stripe/SIRET)

### Priorité 4 — ENRICHISSEMENT MÉTIER
- 16a ~~Cauchemar transversal "posture senior face à manager junior"~~ → ✅ FAIT 21 mars
- 16b ~~Cauchemar transversal "critères modifiés en cours de route"~~ → ✅ FAIT 21 mars
- 16c ~~Cauchemar transversal "variable structurellement inatteignable"~~ → ✅ FAIT 21 mars
- 16d ~~ROLE_VARIANTS — titres alternatifs par rôle~~ → ✅ FAIT 21 mars
- 16e ~~Ratio coût du poste / valeur produite~~ → ✅ FAIT 21 mars
- 16f ~~Axe séniorité (IC/Manager/Leader)~~ → ✅ FAIT 21 mars
- 16g ~~Appel découverte — miroir inversé du Duel~~ → ✅ FAIT 21 mars
- ~~Fiche de combat V2~~ → ✅ FAIT 21 mars (6 blocs, 8 sources)
- ~~Refactor unification livrables 17→11~~ → ✅ FAIT 21 mars
- ~~Refactor landing = Éclaireur~~ → ✅ FAIT 21 mars
- 16h. Zeigarnik 4 surfaces — partiellement bloqué (Trempe + Échoppe manquantes). Codable pour Éclaireur + Forge uniquement.
- ~~16i. Checklist intégration 90 jours~~ → ✅ FAIT 23 mars (INTEGRATION_MILESTONES + getRoleCluster + Plan 30j/90j enrichis + Discovery Q6)
- ~~16j. Question "Pourquoi" post-Signature~~ → ✅ FAIT 23 mars (4ème écran overlay, whyThisRole sur signature, One-Pager bloc 3)
- ~~16k. Questions Frictions/Intersections briques élastiques~~ → ✅ FAIT 23 mars (2 angles conditionnels STRESS_ANGLES, Source 4 generateStressTest)
- ~~16l. Filtre anti-pattern Arsenal~~ → ✅ FAIT 23 mars (detectOrphanArmoredBricks, alerte "mauvais mur", armorScore === 4 strict)
- 16m. Indicateur briques × livrables dans l'Arsenal — spec prête (feat-16m-bricks-deliverables.md). computeBrickDeliverableCount + badge "X/11" par brique. Source : Ha Hack Moreau.
- ~~16n. Question parcours non linéaire~~ → ✅ FAIT 23 mars (detectNonLinearCareer + section conditionnelle generateInterviewQuestions)
- 16o. Ponts entre briques — dans Arsenal ou One-Pager, connexions entre briques consécutives ("Brique 1 → Brique 2 : compétence transférée"). Parcours non linéaire = narratif, pas risque. Source : template Narratif Polymathe Moreau.

### Priorité 5 — SCALE
29. Intelligence éco locale
30. Scoring LLM (signal Promptfoo pour unit testing quand outputs non-déterministes)
31. GEO
32. L'Échoppe — Surface B2B (spec définitive prête : 10 blocs, 52 questions, 25 étapes d'implémentation sur 3 phases). Lancement après 20 profils opt-in/rôle. Beta 2-3 cabinets avant ouverture payante.
33. Éclaireur inversé (recruteur colle offre → profils matchés) — après 100 profils/rôle
34. Page comparatif alternatives (template Growth Room : URL mot-clé + intro problème + alternatives + tableau + CTA). Après 10 candidats + données d'usage.

### Hypothèses à tester
- Prix 19€/mois candidat (sur 50 candidats)
- Taux Éclaireur → Forge (sur 10 candidats)
- Rétention mois 2 Trempe (churn < 10%)
- Streak moyen Trempe (> 6 semaines)
- Taux déclaration Fait (> 60%)
- Prix 150€/crédit B2B (sur 5 cabinets beta)
- Taux d'acceptation candidat opt-in (cible > 40%)
- Seuil 20 profils/rôle (assez pour le recruteur ?)
- Taux conversion contact → placement (cible 20%)
- Taux opt-in parmi les candidats ≥ 70% densité

---

## 4 SURFACES — NAMING DÉFINITIF (19 mars 2026)

Couche 0 : L'Éclaireur — reconnaissance (le candidat voit le problème). Code interne : eclaireur.
Couche 1 : La Forge — fabrication (le candidat construit les preuves). Code interne : sprint.
Couche 2 : La Trempe — épreuve publique (le candidat durcit son positionnement en public). Code interne : brew.
Couche 3 : L'Échoppe — exposition (le recruteur trouve le candidat forgé). Code interne : recruiter.

Registre : artisanat de guerre. L'artisan fabrique l'arme (Forge, Trempe, Échoppe, Établi, briques). Le soldat l'utilise (Arsenal, Blindage, Duel, cauchemars, Éclaireur).

---

## DÉCISIONS ACTIVES (ne pas remettre en question)

Modèle : B2C2B. Forge gratuite. Livrables en abonnement. Pièces mortes. Trempe critique pour rétention.
Produit : ATMT. Blindage invisible. Densité > temps. Additif strict. Statechart = vérité UI. Proof deposits pas reach.
Cible : le candidat avec insight enfoui et craft absent. Le senior a 15 ans d'insight professionnel. Le junior a 5 ans d'insight de vie (sport, projets, associations, études, hobbies). Les deux manquent du même craft. Les deux sont le même gisement. Le Blindage fonctionne identiquement (chiffre, décision, influence, transférabilité). Les 10 rôles restent seniors au lancement. L'extension junior est une vision, pas un chantier immédiat.
Workflow : Claude.ai (spec/arbitrage) → Claude Code (implémentation). Branche avant chaque chantier. Review avant merge. Opération 0 statechart obligatoire dans le template pour toute modification UI.
Parcours : Éclaireur → sessionStorage → Onboarding (rôle pré-sélectionné, skip profil + offres) → Forge (offre injectée).
extractBrickCore : brick.fields.result = fast path. Heuristique = fallback legacy + corrections. Jamais structuredFields sur chemin correction.
Trempe : Couche 2 du statechart. Code interne "brew" (tables, hooks, routes). Densité absente du dashboard Trempe. Alerte stagnation Dilts = reset après déclaration. Module commentaire = filtre pertinence avant génération.
Échoppe : Couche 3. Spec définitive 19 mars (10 blocs, 52 questions). Cabinet = premier client. Coach = canal gratuit. Seuil 20 profils/rôle (pas 200). Lancement rôle par rôle. Prix 150€/crédit, packs sans récurrence. Même domaine (/recruiter), même base Supabase + RLS. Vue temps réel (trigger, pas snapshot). Contact par formulaire structuré (1 rôle, 1 cauchemar, contexte 80 mots, note 30 mots — l'outil assemble l'email, pas le recruteur). Opt-in global + 1 exclusion sectorielle. Retrait immédiat. Couche publique indexable AIO + couche privée authentifiée. Beta 2-3 cabinets avant ouverture payante.
Livrables Établi : 11 livrables × 5 catégories (Candidature : One-Pager + CV + Bio. Prise de contact : Script contact + Message post-entretien + Plan 30j. Entretien : Questions [Discovery/Formel] + Entretien [Préparation/Fiche de combat]. LinkedIn : Posts piliers. Négociation : bundle salarial [position marché + coût remplacement + argument calibré] + Plan 90j N+1). Le One-Pager est le livrable principal. Von Restorff par défaut.
Landing : abnegation.eu = l'Éclaireur. Le hero contient le champ (Approche A, embed direct). Le candidat colle et scanne sans quitter la page. Zéro jargon Abneg@tion sur la landing. La Forge se vend dans le résultat de l'Éclaireur, pas sur la landing.
Claude.ai : challenge before validating (posture avocat du diable par défaut). Verdict first, reasoning second, implementation last. Ask questions when JM is stuck. Never re-explain context.

---

## CONTACTS EN MOUVEMENT (23 mars 2026)

Alex BLUMA : call fait 25 mars. Designer pédagogique, étude évaluation compétences. 5 objections : (1) Blindage = déclaratif → réponse : déclaratif vérifiable vs invérifiable. (2) ATS offre du temps → compatible, pas concurrent. (3) Hard skills difficiles à prouver junior → signal backlog brique projet technique avec lien livrable. (4) Ère des projets morte → non, le craft d'extraction manque. (5) Part dans un résultat collectif → le delta avant/après, pas le chiffre global. Next step : deuxième call si intéressé.
Loic Doufodji : DM envoyé. Co-fondateur Startomatic 3000, ex-RH, associé dev thèse IA. Call 30 min. Ne pas montrer le code ni le workflow.
Loris (Big Idea) : à contacter. Newsletter singularité/5P. Même pattern qu'Alex — coach fait la couche humaine, outil fait la couche commodité. Canal distribution.
Noota : DM dans 2 semaines. Post screening IA publié avant. Angle : complémentarité screening IA × qualité input candidat. Ne pas attaquer leur produit.
Consultante carrière (700 profils) : après 10 candidats. Canal distribution. Elle facture la couche humaine (coaching entretien, posture). L'outil fait la couche commodité.

---

## BUGS CONNUS

1. CTA Éclaireur score 5/5 dit "couvre une partie" au lieu d'un message adapté
2. Persistance Supabase : briques dev@localhost ne persistent pas au refresh (non investigué)
3. "Sprint" dans le code interne (filenames, variables) — cosmétique

---

## BACKLOG SIGNAUX (non priorisé, non planifié)

| Signal | Description | Source | Date |
|--------|-------------|--------|------|
| prepareBrickContext() | 3+ generators appellent extractBrickCore + blindage + formatage séquentiellement. Un helper unique retournerait le contexte dense en 1 appel. Réduit la fragmentation de lecture Claude Code. | Post Mathieu (CTO easystrat) — consolidation appels tokens | 24 mars |
| DM ciblé réseau × entreprise visée | Le candidat exporte son réseau LinkedIn (CSV). Croise avec une entreprise cible. Identifie les ponts. Génère les messages. Le Brew V2 recommande posts et timing. Il ne recommande pas de DM ciblés vers des connexions existantes chez l'entreprise visée. Cas d'usage Brew V3 ou livrable Établi séparé. | Guide "Job Search x IA" — Prompt 3 referral | 24 mars |
| Trempe = boucle contacts + posts (pas posts seuls) | L'instruction hebdomadaire Brew devrait inclure "3 DM ciblés cette semaine" en plus du post. Le candidat qui utilise la Trempe ne publie pas seulement. Il contacte. Ratio terrain : 80 contacts/semaine → 10% retours (8) → 50% interactions (4). Les 3 questions de la boucle mappent sur les mécanismes existants : "Quel scénario explorer" = quel cauchemar cibler. "Qui sont les bonnes personnes" = quels recruteurs ont ce cauchemar. "Que leur proposer" = quelle brique blindée mettre en avant. La Fiche de Combat devient le brief hebdomadaire de la boucle contacts. | Post LinkedIn "80-8-4 boucle interactions stratégiques" (mars 2026) + signal DM ciblé 24 mars | 25 mars |
| Dossier cible entreprise | Briefing pré-entretien : signaux publics (funding, taille, turnover LinkedIn, ratio PM/dev, culture). L'Appel Découverte (mergé) produit les questions. Il ne produit pas le briefing amont. Enrichirait la Fiche de Combat V2. Nécessite web search ou scraping — incompatible avec l'archi actuelle (zéro appel API externe). | Guide "Job Search x IA" — Prompt 4 due diligence | 24 mars |
| Angle stress test "coût d'opportunité" | Question "Qu'est-ce que tu n'as PAS fait pour obtenir ce résultat ?" Le sacrifice contient la décision (Blindage case 2) + le coût d'opportunité. Marqueur de séniorité : le junior décide, le senior arbitre entre deux options de valeur. Injection dans generateInterviewQuestions ou Appel Découverte. Petit scope, fort impact. | Post LinkedIn "5 questions valeur" (anonyme) | 24 mars |
| Scoring qualité questions discovery (échelle Méroé) | Bloc Arsenal "qualité de tes questions." Score les questions discovery générées sur l'échelle Méroé (niveaux -1 à 6 : absence → wikipedia → logistique → fonctionnelle → contextuelle → miroir → révélatrice → inconfortable). Feedback candidat : "Tes questions sont au niveau 2 (fonctionnel). Tu as le matériau pour atteindre le niveau 4 (miroir)." Le Duel évalue la défense. Rien n'évalue la qualité des questions posées en retour. | Newsletter Méroé Nguimbi "Le Plus Gros Mensonge du Recrutement en 2026" (3 mars 2026) | 24 mars |
| Dossier cible entreprise — confirmation signal | Le niveau 6 Méroé (question inconfortable basée sur due diligence anciens employés) confirme le signal "Dossier cible entreprise" du même jour. Le generator Appel Découverte produit les questions. Il ne produit pas le matériau de recherche qui nourrit les questions de niveau 5-6. Deux sources indépendantes pointent le même manque. | Newsletter Méroé + Guide "Job Search x IA" | 24 mars |
| Brique "projet technique" avec lien livrable | Type de brique qui accepte un lien vers un livrable concret (repo GitHub, prototype, document). Le junior montre le code. La hard skill n'est plus déclarative, elle est vérifiable par le livrable. | Call Alex BLUMA 25 mars — objection "hard skill difficile à prouver" | 25 mars |
| Croisement briques × sources tierces (V3) | Réduire le déclaratif en croisant les briques avec recommandations LinkedIn, attestations employeur, données publiques. Le Blindage passe de "déclaratif vérifiable" à "déclaratif vérifié." Horizon V3. | Call Alex BLUMA 25 mars — objection "le Blindage reste du déclaratif" | 25 mars |
| Optimisation tokens Claude Code — choix dynamique du modèle | Les prompts docs (modifier une date, ajouter une ligne dans un tableau) consomment autant de tokens qu'un chantier complexe. Le choix dynamique (Haiku pour la maintenance, Opus pour l'architecture) réduirait la consommation. Non exploitable en plan Pro. À activer quand passage au plan supérieur ou à l'API. Pattern documenté dans everything-claude-code (96K stars). | Repo everything-claude-code + analyse session 25 mars | 25 mars |
| Instrumentation tokens production — coût par candidat | La prochaine fois qu'un generator est touché, ajouter un compteur de tokens consommés par livrable (console.log en dev, 5 lignes). Pas de caching ni batching maintenant. Juste la mesure. Le jour où 100 candidats génèrent 11 livrables chacun, la facture API sera le premier poste de coût. Savoir combien coûte un candidat avant que le problème existe. | Post LinkedIn "les prix des LLMs vont grimper" + architecture 80% déterministe existante | 25 mars |

---

## DOCUMENTS DU PROJET

**Synchro GitHub active (24 mars 2026).** 37 fichiers .md dans le repo, synchronisés avec le Project Knowledge Claude.ai en 1 clic (Sync). Plus d'upload manuel. Workflow : commit + push + Sync.

| Document | Rôle | À jour ? |
|----------|------|----------|
| etat-du-projet-abnegation.md | Snapshot source de vérité | ✅ Ce fichier (23 mars soir) |
| prompt-linkedin-post-jm.md | Prompt LinkedIn JM (8 étapes, Blindage Post 4 cases) | ✅ 23 mars |
| spec-brew-v2-definitive.md | Spec La Trempe (Brew V2) définitive | ✅ 20 mars (nom UI La Trempe ajouté) |
| spec-surface-b2b-definitive.md | Spec L'Échoppe (Surface B2B) définitive | ✅ 20 mars (10 blocs, 52 questions, One-Pager, formulaire structuré) |
| cadre-theorique-stress-test.md | NfA/Grit/LoC mapping | ✅ 19 mars (3 axes 100% implémentés) |
| arbitrages-orchestration-ia.md | ADR outillage IA | ✅ 20 mars (Hooks Claude Code ajouté — 7e approche évaluée, rejetée) |
| portfolio-pm-abnegation.md | Portfolio PM | ✅ 23 mars (+ prompt LinkedIn 8 étapes, analyse Moreau, post screening IA) |
| SKILL-abnegation-dev.md | Skill projet | ✅ 20 mars (4 surfaces, One-Pager, Trempe, Échoppe, anti-patterns 7-8) |
| about-me.md | Contexte fondateur | ✅ 20 mars (4 surfaces, One-Pager, Échoppe) |
| brand-voice.md | Ton et vocabulaire | ✅ 20 mars (Trempe, Échoppe, One-Pager, cible élargie, doctrine langue) |
| working-style.md | Comportement Claude | ✅ 23 mars (section Claude.ai conversations ajoutée : 4 règles) |
| template-prompt-claude-code.md | Template prompts | ✅ 23 mars (Opération 0 statechart + lessons.md au démarrage + feat- branche) |
| lessons.md | Règles anti-bugs (10 entrées) | ✅ 23 mars (ajouté au repo) |
| feat-16m-bricks-deliverables.md | Prompt indicateur briques × livrables | ✅ 23 mars (spec prête, non implémenté) |
| analyse-risques-production-mars-2026.md | ADR sécurité | ✅ |
| README.md | Onboarding dev | ✅ 10 mars |
| CODEMAP.md | Module map (51 fichiers) | ✅ 10 mars |
| spec-linkedin-360-brew-v2.md | Ancienne spec Brew | ❌ REMPLACÉ par spec-brew-v2-definitive.md |
| feat-16h à feat-16p (9 fichiers) | Prompts Claude Code (specs implémentées ou en attente) | ✅ 24 mars (ajoutés au repo) |
| refactor-*.md (5 fichiers) | Prompts refactoring (implémentés ou prêts) | ✅ 24 mars (ajoutés au repo) |
| CLAUDE.md | Config Claude Code | ✅ |
| feat-loc-markers.md | Prompt marqueurs LoC | ✅ |
| feat-role-value-ratio.md | Prompt ratio valeur/coût | ✅ |
| feat-role-variants.md | Prompt variantes rôles | ✅ |
| feat-salary-comparison.md | Prompt comparatif salarial | ✅ |
| feat-seniority-axis.md | Prompt axe séniorité | ✅ |
| feat-transversal-cauchemars.md | Prompt cauchemars transversaux | ✅ |
