# ÉTAT DU PROJET — Abneg@tion
## Dernière mise à jour : 20 mars 2026

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
Smoke test : 169 tests. Unit tests : 10.
Dernier push : 20 mars 2026.

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
| Marqueurs LoC + solo×équipe — hasInternalLocus/hasExternalLocus/isSoloBrick + diagnostic Arsenal bloc 6 "Posture décisionnelle" 4 quadrants | ✅ 20 mars |

---

## INFRASTRUCTURE

- Stack : Next.js 14, Supabase (auth + persistence + brew_weeks + brew_instructions), Stripe, Vercel
- Domaine : abnegation.eu (OVH, 8,99€/an)
- Email : contact@abnegation.eu (Zimbra Starter OVH, actif)
- Analytics : Pirsch (4€/mois, RGPD, script dans layout.js)
- Repo : ~/Downloads/exosquelette
- Smoke test : npm run smoke (169 tests)
- Unit tests : npm test (10 tests vitest)
- QA agent : npm run qa (15 checks)
- Supabase Auth : email confirmation DÉSACTIVÉE (9 mars 2026). Le candidat crée un compte et accède à la Forge immédiatement. Pas de redirect externe. Le sessionStorage survit. Confirmation différée implémentée : bandeau après 3 briques ou 24h.

---

## ARCHITECTURE extractBrickCore (10 mars 2026)

brick.fields stocké au forge via buildStructuredFields dans Interrogation.jsx (3 chemins : Archiver, Anon confirm, Presque). extractBrickCore fast path : si brick.fields.result existe, extraction directe du nombre. Sinon fallback heuristique inchangé. Briques corrigées : pas de structuredFields (editText = source de vérité post-correction, fallback heuristique). 6 types de briques : seuls chiffre et decision mappent f3→result. Les 4 autres (influence, cicatrice, take, unfair) passent par le fallback. 10 call sites vérifiés.

---

## SPEC BREW V2 — DÉFINITIVE (19 mars 2026)

Spec complète : spec-brew-v2-definitive.md. Remplace spec-linkedin-360-brew-v2.md.

10 arbitrages tranchés (three mental models) + 4 manques intégrés + Kano + statechart Couche 2.

Doctrine : "La Trempe prépare, la Forge exécute." (code interne garde "brew" partout)
Cycle : dimanche 19h, email + in-app. Pilier + angle personnalisé par les briques.
Pilier : rotation par défaut + correction par couverture réelle.
Angle : personnalisé (briques) ou générique (si 0 brique). Dilts invisible dans l'angle.
Format : libre (post et/ou commentaire). Le candidat choisit.
Tracking : déclaratif (bouton "Fait" + lien optionnel + format).
Module commentaire : candidat colle post tiers → filtre pertinence ("Génère" / "Like et passe" / "Pas ta zone").
Dashboard : couverture piliers (4 barres) + streak + historique. Zéro engagement LinkedIn. Zéro densité.
Alerte stagnation Dilts : en langage humain. Disparaît après déclaration. Compteur reset. Revient après 3 nouveaux posts même niveau. Maximum une fois par mois.
Signal DM : timing sans générer ni cibler. Bloc conditionnel si semaine précédente déclarée.
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

## LISTE D'ATTENTE (réordonnée 20 mars 2026)

### Priorité 1 — DISTRIBUTION
1. Mettre l'Éclaireur devant 10 candidats réels
2. 20 DM + 1 canal d'acquisition mesuré
3. ~~Alex BLUMA~~ → call semaine prochaine
4. ~~Loic Doufodji~~ → DM envoyé
5. 5 sessions utilisateur observées
6. Pages "Alternatives à X" SEO/GEO (après les 10 candidats) — 2-3 pages : alternatives à LinkedIn Premium, alternatives à un coach carrière, alternatives au matching IA. Format structuré indexable par LLM. CTA vers l'Éclaireur. Coût : 2-3h rédaction. ROI composé (la page travaille 24/7).

### Priorité 2 — REVENUS
7. Micro-entreprise INPI + SIRET
8. Stripe config (produit 19€, webhook, rate limit, user.id, is_subscribed, paywall)

### Priorité 3 — PRODUIT (réordonné par impact/effort)
- 15a ~~Bio 210 chars~~ → ✅ FAIT 19 mars
- 15b ~~Autosave toast~~ → ✅ FAIT 19 mars
- 15c ~~Von Restorff Établi~~ → ✅ FAIT 19 mars
- 15d ~~Audit CV Forge~~ → ✅ FAIT 20 mars
- 15e ~~Comparatif salarial + OTE/ACV~~ → ✅ FAIT 20 mars
- 15f ~~Enrichir marqueurs LoC + solo×équipe~~ → ✅ FAIT 20 mars
- 15g Cadre théorique stress test (fait, messaging)
- 15h La Trempe V2 (spec définitive prête, prérequis Stripe)
- 15i Rename UI "Brew" → "La Trempe" (3 strings, 10 minutes dans Claude Code)
- 15j Generator One-Pager dans l'Établi (5 blocs : titre rôle + signature, Preuves d'impact, Pourquoi ce poste, parcours compressé, contact). Mêmes données que le CV. Nouveau format. Livrable principal. Von Restorff pointe vers le One-Pager en premier.

### Priorité 4 — ENRICHISSEMENT MÉTIER
16a. Cauchemar transversal "posture senior face à manager junior"
16b. Cauchemar transversal "critères modifiés en cours de route"
16c. Cauchemar transversal "variable structurellement inatteignable" (OTE/ACV > 35%)
16d. ROLE_VARIANTS — titres alternatifs par rôle
16e. Ratio coût du poste / valeur produite (10 rôles)
16f. Axe séniorité (IC/Manager/Leader)
16g. Appel découverte — miroir inversé du Duel (grille 5 questions calibrées cauchemars × rôle + breadcrumbs de preuve = 3 briques blindées reformulées en questions ouvertes). Le Duel teste la défense. L'appel découverte teste l'attaque. Generator ch20 + scoring ch20 + cauchemars = inputs existants. Format nouveau.
16h. Zeigarnik 4 surfaces — étendre le bloc "Prochaine action" de l'Arsenal aux 4 surfaces. L'Éclaireur ouvre les boucles (5 lacunes → 5 tâches). La Forge les ferme (checklist : blinde 1 brique, couvre 1 cauchemar, passe le Duel). La Trempe en ouvre de nouvelles (couverture piliers). L'Échoppe les rend visibles (signature absente, cauchemar non couvert). Un seul composant lit la surface active et affiche les 3 tâches les plus impactantes. L'Arsenal devient le cockpit Zeigarnik central. Inclut le mécanisme anti-dépendance pédagogique (décidé, non implémenté).
16i. Post rupture éditoriale Trempe — 1 post sur 6 (ou 8) hors pilier. Objectif : "cracker la bulle" algorithmique LinkedIn (algorithme sémantique = risque enfermement thématique). Le post rupture accepte un reach faible. Il élargit la couverture sémantique sans casser la cohérence des 4 piliers. L'instruction Trempe signale "cette semaine : rupture" avec un angle libre ancré dans une brique (pas un post générique). Le compteur pilier ne bouge pas. Le streak continue.

### Priorité 5 — SCALE
29. Intelligence éco locale
30. Scoring LLM
31. GEO
32. L'Échoppe — Surface B2B (spec définitive prête : 10 blocs, 52 questions, 25 étapes d'implémentation sur 3 phases). Lancement après 20 profils opt-in/rôle. Beta 2-3 cabinets avant ouverture payante.
33. Éclaireur inversé (recruteur colle offre → profils matchés) — après 100 profils/rôle

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
Workflow : Claude.ai (spec/arbitrage) → Claude Code (implémentation). Branche avant chaque chantier. Review avant merge.
Parcours : Éclaireur → sessionStorage → Onboarding (rôle pré-sélectionné, skip profil + offres) → Forge (offre injectée).
extractBrickCore : brick.fields.result = fast path. Heuristique = fallback legacy + corrections. Jamais structuredFields sur chemin correction.
Trempe : Couche 2 du statechart. Code interne "brew" (tables, hooks, routes). Densité absente du dashboard Trempe. Alerte stagnation Dilts = reset après déclaration. Module commentaire = filtre pertinence avant génération.
Échoppe : Couche 3. Spec définitive 19 mars (10 blocs, 52 questions). Cabinet = premier client. Coach = canal gratuit. Seuil 20 profils/rôle (pas 200). Lancement rôle par rôle. Prix 150€/crédit, packs sans récurrence. Même domaine (/recruiter), même base Supabase + RLS. Vue temps réel (trigger, pas snapshot). Contact par formulaire structuré (1 rôle, 1 cauchemar, contexte 80 mots, note 30 mots — l'outil assemble l'email, pas le recruteur). Opt-in global + 1 exclusion sectorielle. Retrait immédiat. Couche publique indexable AIO + couche privée authentifiée. Beta 2-3 cabinets avant ouverture payante.
Livrables Établi : 2 documents distincts. One-Pager (5 blocs : (1) titre du rôle visé + signature, (2) "Preuves d'impact" — formulations positives factuelles (le positif prouve, le négatif défend), (3) "Pourquoi ce poste" — lien contexte passé × mandat, (4) parcours compressé, (5) contact avec nom. Vocabulaire Abneg@tion absent du document — le One-Pager sort de la plateforme) = arme. CV calibré (titre du rôle visé en en-tête, chronologique, ATMT par brique, calibré pour l'offre) = procédure administrative. Le One-Pager prouve. Le CV documente. Le One-Pager est envoyé au recruteur après acceptation. Le CV suit sur demande. Le One-Pager est le livrable principal dans l'Établi. Le Von Restorff pointe vers le One-Pager en premier.

---

## CONTACTS EN MOUVEMENT (20 mars 2026)

Alex BLUMA : call semaine prochaine. Designer pédagogique, étude évaluation compétences. Écouter, décrire le problème, ne pas pitcher.
Loic Doufodji : DM envoyé. Co-fondateur Startomatic 3000, ex-RH, associé dev thèse IA. Call 30 min. Ne pas montrer le code ni le workflow.

---

## BUGS CONNUS

1. CTA Éclaireur score 5/5 dit "couvre une partie" au lieu d'un message adapté
2. Persistance Supabase : briques dev@localhost ne persistent pas au refresh (non investigué)
3. "Sprint" dans le code interne (filenames, variables) — cosmétique

---

## DOCUMENTS DU PROJET

| Document | Rôle | À jour ? |
|----------|------|----------|
| etat-du-projet-abnegation.md | Snapshot source de vérité | ✅ Ce fichier (20 mars) |
| spec-brew-v2-definitive.md | Spec La Trempe (Brew V2) définitive | ✅ 20 mars (nom UI La Trempe ajouté) |
| spec-surface-b2b-definitive.md | Spec L'Échoppe (Surface B2B) définitive | ✅ 20 mars (10 blocs, 52 questions, One-Pager, formulaire structuré) |
| cadre-theorique-stress-test.md | NfA/Grit/LoC mapping | ✅ 19 mars |
| arbitrages-orchestration-ia.md | ADR outillage IA | ✅ 20 mars (Hooks Claude Code ajouté — 7e approche évaluée, rejetée) |
| portfolio-pm-abnegation.md | Portfolio PM | ✅ 20 mars (L'Échoppe, One-Pager, cible élargie, doctrine langue) |
| SKILL-abnegation-dev.md | Skill projet | ✅ 20 mars (4 surfaces, One-Pager, Trempe, Échoppe, anti-patterns 7-8) |
| about-me.md | Contexte fondateur | ✅ 20 mars (4 surfaces, One-Pager, Échoppe) |
| brand-voice.md | Ton et vocabulaire | ✅ 20 mars (Trempe, Échoppe, One-Pager, cible élargie, doctrine langue) |
| spec-eclaireur-v2-audit-cv.md | Spec Éclaireur V2 | ✅ Implémenté |
| feat-audit-cv-forge.md | Prompt audit CV Forge | ✅ Prêt |
| template-prompt-claude-code.md | Template prompts | ✅ |
| analyse-risques-production-mars-2026.md | ADR sécurité | ✅ |
| README.md | Onboarding dev | ✅ 10 mars |
| CODEMAP.md | Module map (51 fichiers) | ✅ 10 mars |
| spec-linkedin-360-brew-v2.md | Ancienne spec Brew | ❌ REMPLACÉ par spec-brew-v2-definitive.md |
