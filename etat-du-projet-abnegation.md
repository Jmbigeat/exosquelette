# ÉTAT DU PROJET — Abneg@tion
## Dernière mise à jour : 30 mars 2026

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
Smoke test : 258+ tests. Unit tests : 10.
Dernier push : 9 avril 2026.

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

## PLAN B DÉPENDANCES
Vercel tombe → Netlify ou Railway (même deploy flow)
Supabase tombe → Firebase ou Neon (migration lourde, 2-3 jours)
Stripe tombe → Paddle ou LemonSqueezy (migration moyenne, 1 jour)
Anthropic coupe l'API → OpenAI ou Mistral (les generators sont des prompts, portables en changeant l'endpoint)

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

## LISTE D'ATTENTE — ORIENTÉE RÉSULTATS (mise à jour 12 avril 2026)

Format Gibson Biddle : problème à résoudre → indicateur → maintenant / ensuite / à considérer.

### PROBLÈME 1 — PERSONNE NE CONNAÎT L'OUTIL
Indicateur : DM envoyés / taux de clic sur abnegation.eu
Bottleneck actuel.

Maintenant :
- Séquence DM 3 touches + Google Sheet 10 colonnes (template dans brand-voice.md)
- 2 signaux confiance landing — lien repo public + 3 lignes. 5 min

Ensuite :
- Page /pourquoi-abnegation — 7 plaintes en page web. Déclencheur : 1 candidat pose la question
- Bouton "Voir un exemple" Éclaireur — 3 offres-types. Déclencheur : trafic organique augmente
- Séquence relationnelle Gwladys — commenter ses posts. Subordonné aux DM (pas de commentaire un jour sans 3 DM envoyés)

À considérer :
- Messaging "forge pendant que tu as les chiffres" — DM V3 segment froid. Après validation DM V2 sur 10 candidats en recherche active

Fait : ✅ DM Santiago (8 avril), ✅ repo public (8 avril), ✅ README réécrit (8 avril)

### PROBLÈME 2 — LE VISITEUR ARRIVE ET REPART
Indicateur : taux de rebond Pirsch (actuellement ~80%)

Maintenant :
- Signaux confiance landing (partagé avec problème 1). 5 min

Ensuite :
- Bouton "Voir un exemple" (partagé avec problème 1)
- Design hygiene pass — 5 actions ciblées. 3-4h

À considérer :
- Les données des 10 premiers visiteurs diront pourquoi ils partent

### PROBLÈME 3 — LE CANDIDAT NE CRÉE PAS DE COMPTE
Indicateur : taux Éclaireur → inscription

Maintenant :
- Observer sur les 10 premiers candidats
- Vérifier : Éclaireur accessible sans inscription ? (bug potentiel priorité 0)
- Tester : parcours mobile depuis DM LinkedIn (sessionStorage navigateur in-app)

Ensuite :
- À déterminer par les données

À considérer :
- Ce problème se résout par l'observation, pas par des features

### PROBLÈME 4 — LE CANDIDAT SE FIGE DANS LA FORGE
Indicateur : taux de candidats qui forgent 1+ brique en 10 minutes

Maintenant :
- Test utilisateur 0 : JM traverse son propre outil de bout en bout
- 5 anti-rationalisations dans les tooltips (1 par mur cognitif). 10 min d'écriture

Ensuite :
- Mode guidé optionnel — 5 questions séquentielles, adaptées par type de brique (proof, cicatrice séquence Malvina, élastique). 50-70 lignes. Déclencheur : friction confirmée sur test utilisateur 0 ou 1er candidat
- Question extraction CV Fantôme — 1 question dans la Forge

À considérer :
- Chatbot hybride V3+ — déclencheur : mode guidé validé
- Tri briques par cauchemar — déclencheur : 1 candidat atteint 10+ briques

### PROBLÈME 5 — LE CANDIDAT NE REVIENT PAS
Indicateur : taux rétention session 1 → session 2

Maintenant :
- Observer. Pirsch montre les visites répétées sur /sprint

Ensuite :
- Brief de reprise contextuel — densité + dernière brique + action recommandée + 1 mention Signature à 2 briques blindées. 30-40 lignes. Déclencheur : 1 candidat dit "je ne savais pas par quoi reprendre"
- Détection livrables périmés — déclencheur : verbatim "j'ai envoyé l'ancien chiffre"

À considérer :
- Exercice écriture Fiche de Combat — déclencheur : 1 candidat a un entretien prévu
- Brew wording par profil apprenant — déclencheur : 10 candidats + patterns observés

### PROBLÈME 6 — LE LIVRABLE NE CONVERTIT PAS
Indicateur : taux de réponse recruteur sur les One-Pagers/scripts envoyés

Maintenant :
- Observer. Le premier candidat qui envoie un One-Pager produit la première donnée

Ensuite :
- Phrase de désamorçage cauchemar #1 dans One-Pager bloc 3 en hypothèse. 5-10 lignes template
- Audit-before-copy — avertissement non bloquant sous CopyBtn. Déclencheur : 1 candidat génère un One-Pager
- Scripts contact restructurés verbaliser→projeter→palpable. Déclencheur : 3 candidats envoient le template actuel sans réponse
- Diagnostic de cible — rôle recommandé après 3 briques. Déclencheur : 1 candidat hésite sur son rôle
- Score d'adéquation candidat×offre. Déclencheur : 1 candidat analyse une 2ème offre
- Signature co-écrite 4 composantes (verbe + domaine + transférabilité + contexte de rareté). Déclencheur : 1 candidat atteint la Signature et dit "la phrase ne me ressemble pas"

À considérer :
- STRESS_ANGLES "caractère" — 3 questions par rôle. Déclencheur : Duel couche 1 validé
- Duel sur livrable (One-Pager/CV). Déclencheur : Duel validé + entretien prévu
- Inversion Duel grille fit culturel — tag culture_signal + zones de friction. Enrichissement STRESS_ANGLES
- STRESS_ANGLE réputation adverse — 1-2 angles par rôle
- Question ouverte One-Pager bloc 5 — déclencheur : verbatims recruteurs
- Rapport Duel 2 sections Échoppe — déclencheur : l'Échoppe existe
- Benchmark main de poker — déclencheur : 50 candidats/rôle

### PROBLÈME 7 — PAS DE REVENUS
Indicateur : nombre de candidats prêts à payer 19€/mois

Maintenant :
- Micro-entreprise INPI + SIRET (30 min en ligne, 2-4 semaines traitement)

Ensuite :
- Stripe config (produit 19€, webhook, is_subscribed, paywall). Après 10 candidats gratuits
- Instrumentation coût par candidat — console.log tokens /api/scan. 5 lignes. N'est plus pré-requis Stripe

À considérer :
- Calculateur coût d'inaction Plan C — Google Sheet 4 onglets. Déclencheur : SIRET + 1er DRH identifié

### TRANSVERSE

Infra :
- 3 tests e2e critiques (Éclaireur → cauchemars, Forge → Blindage, Arsenal → One-Pager). Après 10 candidats
- GitHub Actions CI. Après tests e2e

Portfolio PM :
- Phrase hook — en attente (vient de JM après test utilisateur 0)
- Trajectoire ligne droite — en attente (idem)

Trempe :
- Test "How I vs How to" — 9ème test heuristique. Après Trempe V2
- Brew boucle contacts + DM. Après Trempe V2

Éclaireur V3 :
- Audit visibilité IA profil LinkedIn. Après Trempe V2

Burin :
- Découpage SKILL en fichiers par surface. Déclencheur : SKILL > 400 lignes

### ITEMS TUÉS (cumul sessions 8 avril - 12 avril 2026)

28 items tués au total. 23 tués par 3 mental models (sessions 8-9 avril, kill ratio 45%). 5 tués par le cadre résultat (12 avril) : auto-diagnostic 5 questions (absorbé par mode guidé), slash commands /smoke + /docs (gain cosmétique), pricing Plan C 3 tiers (se fixe en négociation), champ "ce que je refuse" (le candidat sait), One-Pager auto-recalibrage (un clic Régénérer suffit).

### WORKFLOW TUÉS (sessions 8-9 avril)
12-18 : ✅ faits (trunk-based, plan B dépendances, anti-écho, pattern session, protection tests, hiérarchie idées). 17 slash commands : tué (gain cosmétique).

---

## 4 SURFACES — NAMING DÉFINITIF (19 mars 2026)

Couche 0 : L'Éclaireur — reconnaissance (le candidat voit le problème). Code interne : eclaireur.
Couche 1 : La Forge — fabrication (le candidat construit les preuves). Code interne : sprint.
Couche 2 : La Trempe — épreuve publique (le candidat durcit son positionnement en public). Code interne : brew.
Couche 3 : L'Échoppe — exposition (le recruteur trouve le candidat forgé). Code interne : recruiter.

Registre : artisanat de guerre. L'artisan fabrique l'arme (Forge, Trempe, Échoppe, Établi, briques). Le soldat l'utilise (Arsenal, Blindage, Duel, cauchemars, Éclaireur).

---

## PLAN C — OUTPLACEMENT B2B (30 mars 2026)

Même moteur, packaging différent. L'entreprise paie pour armer ses salariés sortants. 12 décisions tranchées avec three mental models.

### Architecture

Flag "outplacement" dans l'Éclaireur. Pas de surface séparée. Pas de dashboard RH. Le candidat outplacement est un candidat. Même Forge, même Blindage, même opt-in Échoppe.

Raison : un dashboard RH = un deuxième produit. Coût d'échec 30x supérieur au flag. Le rapport PDF mensuel remplace le dashboard.

### Flux

1. Le RH uploade une fiche de poste par rôle (pas par salarié). Champ texte libre, pas upload fichier. L'Éclaireur extrait KPI et cauchemars.
2. Le RH reçoit un lien par rôle (pas par salarié). 6 rôles = 6 liens, pas 30.
3. Le salarié clique, crée son compte (inscription nominative volontaire), entre dans l'Éclaireur avec cauchemars pré-identifiés.
4. Le salarié choisit son rôle cible (pas le RH). L'Éclaireur guide le choix via le coût du silence par rôle.
5. Le salarié forge ses briques dans la Forge. Parcours identique au B2C.
6. Le salarié opt-in dans l'Échoppe via le même toggle que tout le monde. Toggle off par défaut. Message de réassurance : "Votre employeur n'a pas accès à cette information."

### Rapport mensuel RH

PDF envoyé par email le premier lundi du mois. Contenu : nombre d'activations par rôle, densité moyenne par rôle, nombre total de briques forgées par rôle, nombre de semaines écoulées. Agrégé par rôle, jamais par nom. L'information opt-in Échoppe n'apparaît pas dans le rapport.

### Pricing

800€/tête. Plancher 3 salariés (2400€ minimum). Dégressivité au-delà de 10 (600€ de 11 à 30, 450€ au-delà de 30). Hypothèses à tester sur les 3 premiers contrats.

### Durée

6 mois d'accès. Rapport mensuel pendant toute la durée. Message de transition J-14 avant expiration : "Votre accès financé par [entreprise] expire le [date]. Votre compte, vos briques et votre visibilité restent actifs. Pour continuer l'Établi et la Trempe : 19€/mois."

### Propriété des données

Le salarié garde tout. Compte actif indéfiniment. Briques, signature, densité, opt-in : intacts. Accès Établi et Trempe soumis à abonnement après expiration du contrat. La Forge reste gratuite.

### Wording différencié

Le flag outplacement modifie le wording de l'Éclaireur. Même parcours, même moteur, mêmes écrans. 10-15 phrases adaptées. Ton factuel, orienté valeur, zéro pathos. "Tu as 10 ans d'expérience. Voici ce qu'elles valent sur le marché aujourd'hui." Fichier de constantes avec switch.

### Cible

PME (< 250 salariés) avec 5-30 départs. Le DRH signe. Cycle de vente 2-4 semaines. Grands groupes après 10 contrats PME et 3 cas d'étude.

### Support

Zéro support humain au lancement. Email d'onboarding automatique J+3 et J+14 si taux d'abandon > 50% sur les 3 premiers contrats.

### Connexion Plan C → Plan A

Le salarié en outplacement qui opt-in alimente la marketplace Échoppe. Chaque contrat outplacement injecte des candidats blindés dans le pool B2B à coût d'acquisition zéro. Le Plan C finance l'acquisition candidats du Plan A.

### Séquence d'implémentation Plan C

Pas maintenant. Après Stripe actif + 10 candidats B2C + Échoppe V1. Le flag outplacement est ~1 semaine de dev (flag + pré-remplissage Éclaireur + template rapport PDF + wording différencié).

### Décisions actives Plan C (ne pas remettre en question)

- Flag dans l'Éclaireur, pas dashboard RH séparé
- Fiche de poste par rôle, pas par salarié
- Lien d'invitation par rôle, pas par salarié
- Rapport agrégé par rôle, jamais par nom
- Le salarié choisit son rôle cible, pas le RH
- Même opt-in Échoppe que tout le monde, toggle off par défaut
- L'information opt-in exclue du rapport RH
- Le salarié garde toutes ses données post-contrat
- 6 mois d'accès, transition vers abonnement individuel
- Wording Éclaireur différencié par flag, même parcours

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
Plan C (pivot) : Outplacement B2B — même moteur, packaging différent. 12 décisions tranchées (30 mars 2026). Flag "outplacement" dans l'Éclaireur. Le RH uploade une fiche par rôle, distribue un lien par rôle. Le salarié forge dans la Forge standard. Même opt-in Échoppe. Rapport PDF mensuel agrégé par rôle. 800€/tête, plancher 3. PME cible. Le Plan C injecte des candidats blindés dans la marketplace = acquisition gratuite pour Plan A. Prérequis : Stripe + 10 candidats + Échoppe V1.
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
Méroé Nguimbi : pas de contact maintenant. Audience candidats 80K-150K = cible premium Abneg@tion. Contact Échoppe après 20 profils opt-in. "Théorie du Fusible" + "Hiérarchie des questions" = deux signaux forts de compatibilité.
Santiago Fernández de Valderrama (Career-Ops) : Head of Applied AI chez Zinkee. Créateur de Career-Ops (22K+ stars GitHub). Builder solo, même stack (Claude Code, Supabase, Vercel). DM envoyé 8 avril en espagnol. Career-Ops filtre les offres (scoring 10 dimensions). Abneg@tion arme le candidat (Blindage 4 cases). Les deux sont complémentaires. Repo partagé. En attente de réponse.
Malvina Préveaux : recruteuse Digital & Marketing freelance, coach carrière. 9 ans, 700+ profils. Doctrine compatible (lever les doutes avant qu'ils apparaissent, preuves concrètes, résultats chiffrés). Contact potentiel — même séquence que Gwladys (commenter posts → DM après 10 candidats). Non contactée.

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
| Chatbot d'extraction hybride (V3+) | Le formulaire censure le candidat (champs structurés = réponses courtes). Un chatbot poserait les questions ATMT naturellement et produirait une brique structurée. Le moteur déterministe évalue. Chatbot seul = wrapper. Chatbot + moteur déterministe = produit. Après validation sur 10 candidats réels. | Post LinkedIn "Ask to Get" + analyse 3 mental models session 25 mars | 25 mars |
| Messaging "Forge pendant que tu as les chiffres" | Le candidat en recherche oublie ses chiffres. Le moment idéal pour forger = le jour du départ, pas 6 mois après. Messaging Trempe pour candidats en poste qui sentent le vent tourner. | Post Méroé "Théorie du Fusible" — asymétrie d'information | 25 mars |
| Post LinkedIn pilier 3 "preuve forgée vs générée" | Architecture prête : accroche = recruteur reçoit 200 CV IA + 3 profils forgés, appelle les 3. Tension = candidat nu en entretien. Méthode = la preuve se forge. Transfert = le lecteur reconnaît son CV. À passer dans le workflow 8 étapes. | Analyse newsletter Rémi (système IA prestataire) | 30 mars |
| Brique périmée Trempe (feat-brew-staleness) | refreshed_at + STALENESS_THRESHOLDS par cluster + injection pilier 4 + warning Arsenal > 3. ~45 lignes. Prérequis : Trempe V2 (15h). | Session arbitrage 30 mars | 30 mars |
| Spec Plan C outplacement | Flag Éclaireur + pré-remplissage fiche de poste + lien par rôle + rapport PDF mensuel + wording différencié + transition abonnement. ~1 semaine dev. Prérequis : Stripe + 10 candidats + Échoppe V1. | Session arbitrage 30 mars | 30 mars |
| Tests e2e Playwright — 3 parcours critiques | 3 tests e2e : (1) Éclaireur coller offre → résultat, (2) Inscription → compte, (3) Forge ajouter brique → densité. Les 258 smoke tests vérifient la structure. Les 10 unit tests vérifient le comportement. Rien ne vérifie le parcours bout en bout. 2-4h setup. Après les 10 candidats. | Article "Tester son code IA" Pilier 1 (mars 2026) | 25 mars |
| GitHub Actions CI — lint + tests auto à chaque push | Fichier .github/workflows/ci.yml (15 lignes). À chaque push : npm run lint + npm test + npm run smoke. Le seul filet actuel est la discipline manuelle. L'automatisation tiendrait mieux. 30 min setup. Sentry (error tracking) et PostHog (funnels) en même temps. | Article "CI/CD et monitoring" Pilier 2 (mars 2026) | 25 mars |
| --- IDÉES TUÉES (8-9 avril 2026 — kill ratio 45%) --- | 23 idées tuées par 3 mental models. Raisons : contradiction de positionnement, problème inexistant sans données, absorbées par mécanismes plus légers, mauvaise audience, format inadapté, prématuré. | Sessions 8-9 avril 2026 | 9 avril |

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
| working-style.md | Comportement Claude | ✅ 9 avril (frameworks adaptatifs, biais cognitifs, critical path, filtrage par profondeur, test de James, perspectives multiples) |
| template-prompt-claude-code.md | Template prompts | ✅ 23 mars (Opération 0 statechart + lessons.md au démarrage + feat- branche) |
| lessons.md | Règles anti-bugs (10 entrées) | ✅ 23 mars (ajouté au repo) |
| feat-16m-bricks-deliverables.md | Prompt indicateur briques × livrables | ✅ 23 mars (spec prête, non implémenté) |
| analyse-risques-production-mars-2026.md | ADR sécurité | ✅ |
| README.md | Architecture, stress test, métriques (repo public) | ✅ 8 avril |
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
| competitive-complaints.md | Plaintes concurrents × réponses Abneg@tion (7 plaintes) | ✅ 25 mars |
| spec-plan-c-outplacement.md | Spec Plan C outplacement (12 décisions, 3 mental models) | À créer depuis cette session |
