# PORTFOLIO PM — Jean-Mikaël Bigeat
## Preuves tangibles de compétences Product Manager extraites d'Abneg@tion

Ce fichier documente les preuves que le build d'Abneg@tion constitue pour une candidature PM. Chaque entrée est un fait vérifiable, pas une opinion. Le fichier grandit avec chaque décision.

---

## 1. DISCOVERY & STRATÉGIE PRODUIT

Ce que le recruteur PM cherche : "Tu sais identifier un problème réel, segmenter un marché, et choisir quoi NE PAS faire."

### Pivot pricing B2C → B2C2B (mars 2026)

Problème : le paywall 49€ one-shot bloquait la conversion. L'Éclaireur gratuit prouvait la valeur, mais le candidat payait avant de forger.
Décision : Forge gratuite. Livrables en abonnement 19€/mois. Le candidat prouve d'abord, paie ensuite.
Méthode : three mental models (first principles, inversion, second-order consequences) appliqués au pricing. L'insight gratuit crée l'engagement. L'arme payante crée le revenu.
Résultat : architecture produit cohérente. L'Éclaireur convertit vers la Forge (gratuit → gratuit). La Forge convertit vers l'abonnement (gratuit → payant). Pas de mur au milieu du funnel.

### Kill features (3 features tuées en production)

Sprint Éclair (recharge 19€, 3 pièces) : tuée. Raison : friction inutile, le modèle abonnement est supérieur pour la rétention.
Toggle "j'y suis / j'y vais" : tuée. Raison : complexité UI sans valeur mesurable. Le candidat ne sait pas dans quelle catégorie il est.
Pièces (mécanisme de consommation) : tuées. Raison : le modèle mental "pièces" freine la régénération. L'abonnement illimité encourage l'itération.
Preuve de discipline : tuer coûte moins cher que maintenir. Le produit fait 4 choses. Pas 40.

### Segmentation : 10 rôles × 4 secteurs

Pas de "profil générique." Chaque rôle a ses propres KPIs, cauchemars, coûts sectoriels, et seuils. Le candidat enterprise_ae ne voit pas les mêmes cauchemars que le candidat engineering_manager. La spécialisation bat la couverture.

### Arbitrage orchestration IA (mars 2026)

5 approches évaluées pour l'outillage IA. 4 rejetées. 1 retenue.
BMAD (framework multi-agent 7 rôles) : rejeté — résout la coordination d'équipe, pas applicable en solo.
Orchestration multi-agent Claude Code : rejeté — 4× consommation tokens, tâches séquentielles pas parallélisables.
Cursor (IDE IA) : rejeté — encourage le hands-on, brouille la frontière PM/dev.
Agent Analyst autonome : rejeté — la valeur est dans l'angle, pas dans le résumé.
QA Agent automatique : retenu — 15 checks post-merge, parallélisable, déterministe, scalable.
Principe de décision : "Est-ce que cet outil résout un problème que j'ai aujourd'hui ou demain ? Si demain, rejeté."
Document : arbitrages-orchestration-ia.md.

### Validation marché préparée (mars 2026)

Verbatims candidats collectés via Perplexity (Reddit, Quora, forums emploi). 4/5 features confirmées par des témoignages réels. 1 angle mort identifié : posture senior face à manager junior (cauchemar transversal non couvert, ajouté en liste d'attente).
Grille SEA-DUR-RPC (Scalezia) appliquée à Abneg@tion. 7/9 cases validées. 2 trous : Urgence (le candidat en poste n'a pas mal aujourd'hui — l'Éclaireur crée l'urgence) et Compris (le pitch froid ne fonctionne pas — les 10 candidats résolvent ça).
Verbatim clé : "100 candidatures, 10 ans d'expérience, et toujours 0 offre" → messaging Éclaireur.

### Plans A/B/C parallèles

Plan A (primaire) : B2C2B SaaS validation — 10 candidats réels, puis scale.
Plan B (portfolio) : Abneg@tion comme preuve PM pour reconversion Product Manager (LinkedIn, WTTJ).
Plan C (pivot) : Outplacement B2B — même moteur, packaging différent (l'entreprise paie pour armer ses salariés sortants).
Les trois ne s'excluent pas. Chaque action sur Abneg@tion alimente les trois simultanément. Le plan B gagne quel que soit le résultat du plan A.

### Coachs carrière = canal de distribution

Analyse : le coach facture 500-3 000€ la couche humaine. L'outil fait le travail de commodité en self-service. Le coach qui recommande l'outil envoie 20 candidats/mois et monte en gamme. Action post-10 candidats : identifier 3 coachs LinkedIn, proposer accès gratuit, mesurer l'apport.

### Spec Brew V2 — arbitrage produit structurant (19 mars 2026)

Problème : le Brew était "spec floue" — 8 questions non tranchées (contenu instruction, source recommandation, tracking, Dilts, timing, dashboard, lien generators, commentaires).
Méthode : 10 arbitrages tranchés un par un avec three mental models. Chaque question isolée, options formulées, verdict argumenté. 4 manques identifiés en croisant le workflow LinkedIn JM avec la spec Brew. Kano produit (3 basiques, 3 performances, 4 attractifs, 2 indifférents, 3 inversés). Statechart corrigé (Couche 2, pas "région indépendante").
Résultat : spec définitive de 350 lignes. Le Brew est au même niveau de précision que l'Éclaireur et la Forge. Prêt pour implémentation dès que Stripe est actif.
Preuves PM : Discovery (identifier les 8 trous), Product Sense (Kano sous contrainte, anti-patterns identifiés avant l'implémentation), Delivery (spec complète avant le code).

### Spec L'Échoppe (Surface B2B) — architecture marketplace complète (19 mars 2026)

Problème : le B2B était "Architecture C — après 200 profils/rôle." Aucune décision tranchée. Aucun modèle de revenu. Aucun parcours recruteur. 52 questions ouvertes.
Méthode : 10 blocs × 52 questions tranchées une par une avec three mental models. Chaque question isolée : first principles (quel est le besoin fondamental ?), inversion (que se passe-t-il si ça échoue ?), second-order (quelles conséquences en cascade ?). Verbatim candidat externe ("ne jamais avoir à faire à un recruteur") transformé en feature produit (Appel découverte = miroir inversé du Duel). Page Notion tuée en février ressuscitée comme fiche AIO indexable côté recruteur — même objet, bonne audience.
Résultat : spec définitive de 500+ lignes. Modèle de revenu (crédits 150€, packs sans récurrence). Quality gate candidat (opt-in + prévisualisation + seuil minimum). Parcours recruteur complet (onboarding → filtres cauchemar → fiche structurelle → contact par email). Infrastructure (même domaine, même base, RLS, trigger temps réel). Seuil réduit de 200 à 20 profils/rôle (lancement 14 mois plus tôt). Calendrier réaliste (4-5 mois).
Preuves PM : Discovery (52 questions identifiées et structurées en 10 blocs), Product Sense (connexion Forge ↔ B2B via opt-in + prévisualisation + CV déclenché, séparation ATMT/Blindage étendue au recruteur), Strategy (modèle de revenu B2C2B bouclé — le candidat forge gratuitement, le recruteur paie pour contacter, le coach remplit la base gratuitement), Delivery (séquence d'implémentation en 24 étapes sur 3 phases).

### Analyse de contenu tiers comme Discovery produit (23 mars 2026)

Problème : valider les mécanismes de l'outil sans utilisateurs réels. Les 10 candidats ne sont pas encore là.
Méthode : 26 contenus tiers analysés en 1 session (12 articles Moreau + 14 posts/prompts LinkedIn). Chaque contenu passé au filtre "Pour l'outil / Pour le prompt LinkedIn / Pass." 3 catégories de verdict : connexion directe (mécanisme existant confirmé), item backlog (mécanisme manquant identifié), formulation stockable (matériau pour les 4 piliers).
Résultat : 8 connexions produit confirmées (intérêts composés = densité, identité fluide = Signature, pre-mortem = Duel, vraisemblances/indices/tekmerions = Blindage 4 cases, pensée systémique = stress test, WOOP = fiche de combat, outil compétitif vs complémentaire = anti-dépendance). 3 items backlog ajoutés (16m indicateur briques × livrables, 16n question parcours non linéaire, 16o ponts entre briques). ~10 formulations stockables pour les 4 piliers. 14 contenus passés (hors cible).
Preuves PM : Discovery (extraire du signal produit de contenus non liés au produit), Product Sense (chaque connexion mappée sur un mécanisme existant ou un item backlog — pas de feature creep), Discipline (14 pass sur 26 contenus = savoir quoi NE PAS intégrer).

### Canaux de distribution identifiés (23 mars 2026)

5 canaux identifiés via analyse de contenu et veille LinkedIn :
- Coachs carrière (Alex BLUMA, Loris, consultante 700 profils) : facturent la couche humaine. L'outil fait la couche commodité. 20 candidats/mois par coach.
- Noota (agent IA screening) : complémentarité input candidat × tri automatisé. DM prévu dans 2 semaines, post screening IA publié avant. Angle : "votre outil trie, le nôtre structure l'input."
- Agents IA hiring : les posts LinkedIn blindés deviennent des aimants sémantiques pour les agents qui indexent les publications.
Preuve PM : identifier des canaux de distribution avant d'avoir un seul utilisateur, en analysant la chaîne de valeur recrutement.

---

## 2. DELIVERY & EXÉCUTION

Ce que le recruteur PM cherche : "Tu sais livrer. Tu gères le scope, les deadlines, et la qualité technique sans être ingénieur."

### Vélocité

De zéro à 19K lignes en production en 25 jours. 21 chantiers. 169 smoke tests. Domaine live (abnegation.eu). Stack complète : Next.js 14, Supabase, Stripe, Vercel.
Zéro background technique. L'IA code (Claude Code), je décide. Chaque spec écrite en markdown. Chaque diff reviewé avant merge. Commits atomiques.

### Workflow spec → implémentation

1. Spec/arbitrage dans Claude.ai (stratégie, architecture, décisions).
2. Prompt markdown copié dans Claude Code (implémentation).
3. Review du diff avant approbation.
4. Un commit par unité logique. Co-Authored-By: Claude.
5. npm run build + npm run smoke après chaque merge.
Template réutilisable avec sections obligatoires : Contexte, Opérations, Ce que tu ne fais pas, Tests manuels, Vérification finale.

### Gestion du scope

Chaque chantier a une section "Ce que tu ne fais pas." Chaque prompt protège contre la sur-ingénierie. Exemples :
- "Tu ne réécris pas extractBrickCore en entier. Tu ajoutes une branche conditionnelle."
- "Tu ne modifies pas la structure du state des briques dans Sprint.jsx."
- "Tu ne touches pas aux generators eux-mêmes. Seul l'input extractBrickCore change."

### Fix groupé : racine commune > tickets individuels

14 bugs generators identifiés. Racine commune isolée (extractBrickCore collait le texte brut). Une fonction partagée corrigée = 14 bugs résolus en un commit. Prioriser c'est regrouper, pas séquencer.

### Spec compliance en review (19 mars 2026)

Micro-fix Von Restorff : Claude Code propose getRecommendedDeliverable avec l'ordre Duel → briques → offre. La spec dit offre → briques → Duel. Le candidat avec une offre active a besoin de son CV d'abord. Déviation catchée à la review, corrigée avant merge. Preuve : la review du diff n'est pas cosmétique. Elle attrape les inversions de priorité.

---

## 3. QUALITÉ & RIGUEUR TECHNIQUE

Ce que le recruteur PM cherche : "Tu comprends les trade-offs techniques. Tu ne codes pas, mais tu sais quand le code est bon ou mauvais."

### Analyse de risques production (9 mars 2026)

8 blocs système analysés via three mental models. Résultats :
- sessionStorage : risque accepté, fallback V1 documenté.
- extractBrickCore : bug invisible (mauvais chiffre) identifié et corrigé.
- Brew : risque existentiel (écran blanc) mitigé par triple protection (Supabase client ne throw pas, .catch silencieux, guard isSubscribed).
- Infra : UptimeRobot + capture DNS + monitoring activés.
Document : analyse-risques-production-mars-2026.md.

### Threat model (10 mars 2026)

8 points d'entrée identifiés. 3 vérifications immédiates (XSS, service_role, guards auth) : clean. 2 items prérequis Stripe (rate limit inscription, validation user.id checkout) documentés. Zéro dangerouslySetInnerHTML. Clé service_role jamais côté client.

### Refactoring : dette technique gérée, pas ignorée

Plan de refactoring en 5 priorités, exécuté séquentiellement avec zéro régression :

P1 (fait) : generators.js (2381 lignes, 28 exports) splitté en 27 fichiers individuels sous lib/generators/. Proxy rétrocompatible. Aucun import consommateur modifié.

P2 (fait) : Sprint.jsx — 3 hooks extraits (usePersistence, useBrewNotif, useBricks). -160 lignes. L'orchestrateur délègue la logique aux hooks.

P2b (prêt) : Sprint.jsx — 3 hooks supplémentaires (useSignature, useDuel, useOffers). Sprint.jsx de ~1000 à ~500 lignes. 6 hooks au total, zéro dépendance circulaire.

P3 (prêt) : panels.jsx (800+ lignes) splitté en WorkBench.jsx (Établi) + Arsenal.jsx. Wrapper 30 lignes. Sprint.jsx inchangé.

P4 (prêt) : selectors.js — logique de sélection de briques extraite des generators. 4 fonctions pures (scoreBricksByCauchemar, selectGreedyCoverage, selectBestBrick, groupBricksByPillar). Les generators gardent le formatage.

P5 (prêt) : 10 tests unitaires (vitest) sur les 5 fonctions les plus fragiles (extractBrickCore, selectors, detectEnglish, hasDecisionMarkers). Couvre les bugs documentés dans lessons.md.

Règle : additif strict. V2 construit sur V1. Zéro réécriture. Chaque refactoring = zéro changement de comportement.

### Lessons.md : boucle d'amélioration

Chaque bug non trivial génère une règle écrite. Claude Code lit le fichier au démarrage. Les erreurs ne se répètent pas. 11 leçons documentées après une session.

---

## 4. PRODUCT SENSE & DESIGN

Ce que le recruteur PM cherche : "Tu comprends l'utilisateur. Tu fais des choix UI qui servent le comportement, pas l'esthétique."

### Deux couches candidat : ATMT visible / Blindage invisible

Le candidat voit ATMT (Accroche, Tension, Méthode, Transfert). Le moteur interne utilise le Blindage 4 cases (Chiffre, Décision, Influence, Transférabilité). Les deux ne s'intersectent jamais dans l'UI. Raison : le candidat ne pense pas en axes d'évaluation. Il pense en narration. ATMT suit la narration. Le Blindage suit l'évaluation.

### Densité > temps

La Forge avance par seuils de densité (70% = armé), pas par durée. Un candidat qui blinde 3 briques en 20 minutes avance plus qu'un candidat qui passe 3 heures sans chiffrer. La densité est un score 6 axes pondéré (Blindage 25%, Couverture cauchemars 20%, Matériau brut 15%, Singularité 15%, CV prêt 15%, Duel 10%).

### Éclaireur : conversion par la preuve

Le candidat colle une offre. L'outil détecte le rôle, révèle le KPI caché du recruteur. Le diagnostic CV croise 5 tests. Le candidat voit l'écart entre ce que son CV dit et ce que le recruteur cherche. Conversion par le problème, pas par la promesse.

### Anti-dépendance pédagogique (décidé, non implémenté)

3 mécanismes : audit-before-copy (audit au-dessus du livrable, pas en dessous), "pourquoi ça marche" one-liners, compteur de régénération visible. L'outil éduque le candidat au lieu de créer une dépendance.

### Doctrine proof deposit LinkedIn

Les posts LinkedIn sont des preuves sédimentées. La couverture des 4 piliers prime sur la performance d'un seul post. Le reach est un signal secondaire. Le Brew orchestre la couverture et le timing. Zéro automatisation. Le candidat exécute.

### Expansion cible : insight enfoui ≠ expérience professionnelle (19 mars 2026)

Constat initial : "la cible est le candidat senior avec insight enfoui et craft absent." Constat corrigé : le junior a de l'insight. Ses 6h d'entraînement/semaine = discipline structurée. Son premier PC démonté = raisonnement systémique. Sa gestion diététique = méthode itérative. Son workflow d'études = amélioration de processus. Le Blindage fonctionne identiquement (chiffre, décision, influence, transférabilité). La Forge extrait les mêmes preuves. La cible redéfinie : "le candidat avec insight enfoui et craft absent" — senior ou junior. Les 10 rôles restent seniors au lancement. L'extension junior est une vision, pas un chantier. Lien avec l'article SauceWriting "Ère des projets" (Valentin Decker) : les projets personnels sont des briques blindables.
Preuve PM : savoir élargir la cible sans élargir le scope d'implémentation. La vision grandit. Le code ne bouge pas.

### One-Pager vs CV : deux documents, deux fonctions (19 mars 2026)

Constat : le CV est un format chronologique (parcours) optimisé pour l'ATS et le processus administratif. Le recrutement par insight exige un format par problème résolu (cauchemar → preuve). Les deux sont incompatibles dans le même document.
Décision : l'Établi génère 2 documents. Le One-Pager (5 blocs : (1) titre du rôle visé + signature, (2) "Preuves d'impact" — formulations positives factuelles, pas de formulations négatives défensives, (3) "Pourquoi ce poste" — lien contexte passé × mandat, (4) parcours compressé 3 lignes, (5) contact avec nom) est l'arme — organisé par problème, calibré pour le mandat du recruteur, lu en 30 secondes. Le CV (titre du rôle visé en en-tête, chronologique, ATMT par brique) est la procédure — satisfait l'ATS et le DRH. Le One-Pager prouve. Le CV documente. Le One-Pager ouvre la porte. Le CV remplit le dossier.
Doctrine de langue : le vocabulaire Abneg@tion (cauchemar, blindage, densité) reste dans la plateforme. Le One-Pager sort de la plateforme. Il parle la langue du recruteur et du DRH. "Preuves d'impact" au lieu de "Cauchemars résolus." "Pourquoi ce poste" au lieu de "Transfert." Le positif prouve. Le négatif défend. Le One-Pager prouve.
Impact Échoppe : le recruteur qui contacte un candidat reçoit le One-Pager calibré (pas le CV). Le CV suit sur demande. Le One-Pager est le format natif du recrutement par insight.
Preuve PM : identifier qu'un besoin (le recruteur veut évaluer) et un process (l'ATS veut un CV) exigent deux formats distincts. Ne pas forcer un format à servir deux fonctions.

### Lois UX appliquées (conscientes ou confirmées)

Hick's Law (trop de choix = pas de choix) : l'Éclaireur a 1 champ, 1 bouton, zéro décision. Le CV est optionnel et ne conditionne pas le bouton. Appliquée.
Goal-Gradient Effect (plus on approche, plus on accélère) : la densité est un score visible. 30% → 50% → 70% = armé. Le candidat voit la barre monter. Appliquée.
Peak-End Rule (on juge sur un pic + la fin) : le pic = la Signature (découverte de l'avantage injuste). La fin = le premier livrable généré. Leverage point identifié : messaging premier livrable. Appliquée.
Von Restorff Effect (ce qui contraste se retient) : implémenté le 19 mars 2026. Le livrable recommandé reçoit une bordure dorée (#ff9800) + label "Recommandé." Logique contextuelle : offre → One-Pager (puis CV), 3 briques blindées → bio, Duel passé → entretien, défaut → One-Pager. Un seul livrable en surbrillance. Le candidat sait par où commencer. Le One-Pager est le livrable principal.

### Kano appliqué au Brew (19 mars 2026)

Le Brew spécifié avec grille Kano complète. 15 composants classifiés. 3 basiques non-négociables (instruction, tracking, personnalisation). 3 performances (couverture, streak, correction). 4 attractifs (stagnation Dilts, filtre pertinence, signal DM, pré-injection Établi). 3 inversés identifiés et rejetés (métriques engagement, blocage, format imposé). Le Kano a guidé la séquence d'implémentation : basiques d'abord, attractifs après feedback.

### Séparation densité / Brew (19 mars 2026)

Décision : la densité n'apparaît pas dans le dashboard Brew. La densité mesure la profondeur des preuves (Forge). Le Brew mesure la couverture et la régularité de la distribution (LinkedIn). Les deux progressent en parallèle. Le Brew pousse indirectement vers la Forge via les angles qui référencent les briques. La confusion aurait nui (le candidat penserait que publier un post augmente sa densité). Preuve Product Sense : savoir quoi NE PAS montrer.

### Diagnostic LoC × solo/équipe : feedback sans scoring (21 mars 2026)

Le Locus of Control (attribution interne vs externe) est un construit académique (Rotter, 1966). L'outil le détecte via 38 marqueurs de vocabulaire (22 internes, 16 externes). Croisé avec solo/équipe, 4 quadrants émergent : autonome, leader, isolé, exécutant. Le diagnostic apparaît dans l'Arsenal (bloc 6) à partir de 3 briques.
Décision : le LoC est un diagnostic, pas un axe de densité. Il informe sans bloquer. Le candidat "isolé" ou "exécutant" reçoit un message de reformulation. Le candidat "autonome" ou "leader" reçoit une confirmation. Zéro gate. Zéro pénalité. Le candidat est souverain.
Preuve PM : savoir quand un signal enrichit sans noter. Le LoC deviendra un axe de densité en V3, quand les données d'usage le justifieront.

### One-Pager implémenté (21 mars 2026)

Le One-Pager spécifié le 19 mars est implémenté le 21 mars. 5 blocs. Livrable principal de l'Établi. Von Restorff pointe dessus par défaut. Vocabulaire Abneg@tion absent du document généré (grep vérifié : zéro occurrence de cauchemar, blindage, densité, brique, ATMT). Le document sort de la plateforme et parle la langue du recruteur.
Preuve PM : un spec de 2 jours plus tôt implémenté sans dérive. Le prompt Claude Code (feat-one-pager.md) traduit la spec en 6 opérations vérifiables. La doctrine de langue est respectée dans le code.

### ROLE_VARIANTS : élargir l'entrée sans élargir le produit (21 mars 2026)

10 rôles × 10-13 variantes FR+EN. "Account Executive" = "Commercial grands comptes" = "Key Account Executive." Le matching dans analyzeOffer utilise la variante la plus longue trouvée. L'Onboarding affiche 3-4 synonymes sous chaque rôle. Le candidat se reconnaît.
Preuve PM : un problème de conversion (le candidat ne trouve pas son rôle) résolu par des données, pas par du code. Zéro modification du scoring, des generators, ou du flux.

### Cauchemars transversaux : enrichir sans complexifier (21 mars 2026)

3 cauchemars qui traversent tous les rôles : senior/junior manager, critères mouvants, variable inatteignable. Ajoutés via un champ applicableRoles ("all" ou liste de rôles). buildActiveCauchemars concatène spécifiques + transversaux. enterprise_ae passe de 5 à 8 cauchemars. senior_pm de 5 à 7. Les generators, le scoring, le stress test reçoivent la liste enrichie sans modification en aval.
Preuve PM : architecture additive. Un seul point d'entrée (getActiveCauchemars) absorbe la complexité. Zéro propagation de changement.

### Ratio valeur/coût : transformer la négociation salariale (21 mars 2026)

ROLE_VALUE_RATIO donne la valeur annuelle produite par rôle (revenue, coût évité, valeur projet). Le candidat passe de "je veux une augmentation" à "je coûte 4% de ce que je rapporte." Le ratio est affiché dans l'Arsenal (bloc 5 enrichi) et injecté dans le generator salary-comparison (bloc 3).
Preuve PM : un levier psychologique (ancrage par le ratio) implémenté en 3 opérations. Même données, argument plus fort.

### Axe séniorité : poser la donnée avant d'en avoir besoin (21 mars 2026)

IC/Manager/Leader. 3 niveaux dans l'Onboarding. Diagnostic dans l'Arsenal (bloc 7 : fourchette ajustée ×1.0/1.25/1.55, focus entretien, risque principal). Zéro modification du scoring. La donnée est posée pour L'Échoppe (filtre recruteur) et les generators (calibration V2).
Preuve PM : même pattern que le LoC (diagnostic sans scoring). Savoir quand une donnée enrichit le produit sans perturber les mécaniques existantes. Le scoring intégrera la séniorité en V3, quand les données d'usage le justifieront.

### Appel découverte : le Duel inversé (21 mars 2026)

Le Duel entraîne la défense. L'appel découverte entraîne l'attaque. 5 questions calibrées par cauchemar × séniorité × briques. Chaque question contient un breadcrumb (indice de preuve reformulé en question ouverte). Le candidat démontre sa compréhension sans rien affirmer. Séparation nette avec "Questions entretien" (ch15) : ch15 = entretien formel (niveaux 3-6), appel découverte = premier appel (qualification tactique).
Preuve PM : identifier que deux moments candidat (premier appel vs entretien formel) exigent deux formats de questions. Le même matériau (briques, cauchemars) sert deux usages distincts.

### Fiche de combat : le dernier kilomètre (21 mars 2026)

15 livrables dans l'Établi. Aucun conçu pour être lu en 2 minutes avant l'entretien. La fiche de combat assemble 8 sources existantes (cauchemars triés par couverture, briques + parades calibrées par blindage + LoC, 3 questions discovery, pitch + signature + séniorité, posture + ratio coût/valeur, position marché) en 1 page. Zéro donnée nouvelle. Zéro calcul nouveau. Format nouveau.
Preuve PM : identifier un trou fonctionnel (le candidat est armé mais dispersé) et le combler par assemblage, pas par ajout. Le livrable qui convertit le travail de la Forge en performance réelle.

### Unification livrables 17→11 × 5 catégories (21 mars 2026)

17 livrables dans un panneau. Hick's Law : trop de choix = pas de choix. 3 fusions identifiées (Questions discovery+formel, Entretien préparation+fiche, Négociation rapport+argumentaire+comparatif). 5 catégories visuelles (Candidature, Prise de contact, Entretien, LinkedIn, Négociation). Zéro generator modifié. UI refactoring uniquement.
Preuve PM : savoir quand simplifier l'interface sans simplifier le produit. Les generators restent séparés (testables, auditables). L'UI regroupe (lisible, navigable). La complexité vit dans le code. La clarté vit dans l'écran.

### Landing = Éclaireur (21 mars 2026)

La landing décrivait l'outil. Le candidat lisait, comprenait, ne faisait rien. Le hero contient maintenant le champ Éclaireur (Approche A, embed direct). Le candidat colle et scanne sans quitter la page. Zéro jargon Abneg@tion sur la landing. La Forge se vend dans le résultat de l'Éclaireur, pas sur la landing.
Preuve PM : la meilleure landing n'explique pas le produit. Elle EST le produit. 8 secondes entre le clic et l'action.

### Blindage Post 4 cases — framework qualité contenu LinkedIn (23 mars 2026)

Problème : les posts LinkedIn JM n'avaient pas de filtre qualité mécanique. Le workflow 7 étapes (Méroé, Marie Hook) testait le style et l'accroche. Rien ne testait la substance du post.
Décision : créer un Blindage Post à 4 cases, miroir du Blindage 4 cases candidat. Case 1 (Fait Situé) : chiffre non rond, date, contexte. Case 2 (Détail Inutile) : micro-détail concret qui ancre la scène. Case 3 (Tension Vécue) : décision, alternative refusée, conséquence. Case 4 (Leçon Non Universelle) : l'injonction finale ne s'applique pas à tout le monde. Scoring : 4/4 ou ne pas publier.
Résultat : le workflow passe de 7 à 8 étapes. Le Blindage Post est vérifié à l'étape 2 (complétion), à l'étape 7 (check binaire), et à l'étape 8 (refactorisation). Le même framework (4 cases obligatoires) s'applique au candidat (briques) et au fondateur (posts). La cohérence produit/marketing est mécanique, pas accidentelle.
Preuve PM : transférer un framework produit interne (Blindage candidat) à un framework marketing (Blindage Post). Même architecture. Même rigueur. Deux usages.

### Prompt LinkedIn JM — système de production complet (23 mars 2026)

Problème : le workflow LinkedIn était dispersé entre le prompt Méroé, le prompt Marie Hook, les doctrines post/commentaire, les verbatims terrain, et les constantes JM. 6 sources non reliées.
Décision : unifier en 1 prompt de 272 lignes. 8 étapes séquentielles. Modules intégrés : cadrage (5 pourquoi si concept abstrait), complétion Blindage Post (1 question par case vide), 4 piliers × 6 niveaux Dilts, vécu JM (tensions, détails, verbatims, coûts d'inaction, constantes), matériau frais, vocabulaire interdit, check binaire 5 tests.
Résultat : 1 prompt produit 1 post blindé 4/4 en 8 étapes vérifiables. Le premier post produit (screening IA × qualité matériau) a passé Marie Hook accroche 8.25/10, Marie Hook post entier 8.4/10, Méroé zéro correction, check binaire 5/5.
Preuve PM : savoir quand 6 outils séparés créent de la friction et les unifier en 1 système. Même logique que l'unification des 17 livrables en 11.

### Analyse concurrentielle : screening IA × qualité input (23 mars 2026)

Problème : Noota Talent lance un agent IA de screening (centaines de millions de profils, shortlist 24h). Menace ou opportunité ?
Méthode : three mental models. First principles : Noota résout le tri (volume). Abneg@tion résout l'input (qualité). Les deux problèmes sont différents. Inversion : si le candidat non forgé passe le screening Noota, le recruteur perd du temps en entretien. Conséquences de second ordre : le candidat forgé est le seul que l'agent Noota classera correctement (bon signaux, bons mots, bonnes preuves).
Décision : complémentarité, pas concurrence. DM privé dans 2 semaines. Post public anonymisé (zéro marqueur Noota). L'angle "le bottleneck est l'input, pas le filtre" dépose une preuve de positionnement sans attaquer le concurrent.
Preuve PM : analyser un concurrent indirect et transformer la menace en canal de distribution potentiel. La décision "anonymiser le post + DM privé" protège la relation tout en capitalisant sur l'insight.

---

## 5. LEADERSHIP SANS ÉQUIPE

Ce que le recruteur PM cherche : "Tu influences sans autorité. Tu prends des décisions seul et tu les assumes."

### Solo founder = PM + Designer + QA + Ops

Pas d'équipe à manager. Mais chaque rôle est assumé :
- PM : specs, priorisation, kill features, arbitrages pricing.
- Designer : design system (palette, fonts, spacing) documenté et cohérent.
- QA : 169 smoke tests, tests manuels obligatoires dans chaque prompt, review avant merge.
- Ops : DNS, monitoring, RGPD, email, analytics.

### Collaboration avec l'IA comme pair technique

Claude Code n'est pas un exécutant aveugle. Le workflow force le diagnostic avant le fix. Claude Code rapporte, je tranche. Exemple : Claude Code propose d'attacher structuredFields sur le chemin correction. J'identifie que editText est la source de vérité après correction. Je refuse le fix. La chaîne à trois cerveaux (Claude Code trouve, Claude.ai propose, JM tranche) fonctionne parce que chaque maillon a un rôle distinct.

### Décisions assumées et documentées

Chaque décision structurante est documentée avec les three mental models. Le snapshot État du Projet est la source de vérité. Pas de décision orale. Pas de "on avait dit que." Tout est écrit.

### Soft skills PM prouvés par le build (5/7 du référentiel marché)

| Soft skill | Preuve Abneg@tion |
|---|---|
| Tolérance à l'ambiguité | Pricing fixé à 19€/mois sans un client. Forge gratuite sans preuve de conversion. Kill 3 features sans données d'usage. Chaque décision sur three mental models, pas sur métriques. |
| Traduction simultanée | Spec technique à Claude Code. Stratégie produit à Claude.ai. Acquisition aux candidats LinkedIn. Architecture au portfolio PM. Même projet, même jour, quatre langues. |
| Diplomatie sous pression | Refusé un fix Claude Code (structuredFields correction path) sans dire "ton code est mauvais." Formulé : "editText est la source de vérité." Le bug n'est pas passé. Le stakeholder (IA) n'a pas perdu la face. |
| Confiance dans le vide | Plans A/B/C définis et exécutés en parallèle avec zéro validation marché. 21 chantiers livrés avant le premier candidat réel. La validation vient après le build, pas avant. |
| Storytelling de circonstance | L'Éclaireur raconte "tu as un problème" au candidat. Le même outil raconte "vos offres ne convertissent pas" au DRH (plan C outplacement). Le même build raconte "21 chantiers en 25 jours" au recruteur PM (plan B). Même fait, trois angles. |

Non prouvés par Abneg@tion (prouvables par carrière antérieure) : résistance aux revirements de direction, absorption des conflits entre stakeholders. Ces deux nécessitent une équipe et un CEO. Solo founder n'a ni l'un ni l'autre.

---

## MÉTRIQUES CLÉS

| Métrique | Valeur | Date |
|----------|--------|------|
| Lignes en production | ~19 000 | mars 2026 |
| Chantiers livrés | 21 + 18 micro-fixes + 7 refactorings + 12 features (audit CV, salary, LoC, One-Pager, role variants, cauchemars transversaux, ratio valeur/coût, séniorité, discovery call, fiche combat, unification 17→11, landing = Éclaireur) | 23 mars 2026 |
| Contenus tiers analysés | 26 (12 articles Moreau + 14 posts/prompts). 8 connexions produit, 3 items backlog (16m-16o), ~10 formulations stockables, 14 pass | 23 mars 2026 |
| Prompt LinkedIn JM | 272 lignes, 8 étapes, Blindage Post 4 cases, check binaire 5 tests | 23 mars 2026 |
| Posts LinkedIn forgés | 1 (screening IA × qualité matériau). Marie Hook accroche 8.25/10, post entier 8.4/10, Méroé 0 correction, check binaire 5/5 | 23 mars 2026 |
| Canaux distribution identifiés | 5 (3 coachs carrière, 1 agent IA screening, 1 agents IA hiring sémantique) | 23 mars 2026 |
| Smoke tests | 169 | 19 mars 2026 |
| Unit tests | 10 | 19 mars 2026 |
| Rôles couverts | 10 (4 secteurs) | mars 2026 |
| Temps zéro → production | 25 jours | février-mars 2026 |
| Features tuées | 3 | mars 2026 |
| Bugs fix groupé | 14 → 1 commit | mars 2026 |
| Analyse de risques | 8 blocs, 12 assumptions | 9 mars 2026 |
| Leçons documentées | 12 | 10 mars 2026 |
| Refactorings structurels | generators split (2381→4 lignes proxy), Sprint.jsx hooks (6 hooks, -274 lignes), panels split, selectors extraction | mars 2026 |
| Arbitrages Brew V2 | 10 décisions + Kano + statechart | 19 mars 2026 |
| Arbitrages L'Échoppe (B2B) | 10 blocs, 52 décisions, 3 mental models | 19 mars 2026 |
| Background technique préalable | Zéro | — |
| Approches IA évaluées | 7 évaluées, 6 rejetées, 1 retenue (QA agent) | mars 2026 |

---

## ARTEFACTS VÉRIFIABLES

| Artefact | Preuve |
|----------|--------|
| Produit live | abnegation.eu |
| Repo | github.com/Jmbigeat/exosquelette |
| Specs | 21 prompts markdown dans le projet |
| Spec Brew V2 définitive | spec-brew-v2-definitive.md (10 arbitrages, Kano, statechart) |
| Spec L'Échoppe (B2B) définitive | spec-surface-b2b-definitive.md (10 blocs, 52 décisions, modèle revenu, parcours recruteur) |
| Cadre théorique stress test | cadre-theorique-stress-test.md (NfA/Grit/LoC) |
| Analyse de risques | analyse-risques-production-mars-2026.md |
| Arbitrages orchestration IA | arbitrages-orchestration-ia.md |
| Lessons | lessons.md |
| QA Agent | scripts/qa-agent.js (15 checks automatisés) |
| State snapshot | etat-du-projet-abnegation.md |
| Workflow LinkedIn | workflow-linkedin-acquisition-jm.md |
| Prompt LinkedIn JM | prompt-linkedin-post-jm.md (272 lignes, 8 étapes, Blindage Post 4 cases) |
| CODEMAP | CODEMAP.md (51 fichiers documentés) |
| README | README.md (professionnel, onboarding dev en 60s) |
| Portfolio PM | portfolio-pm-abnegation.md (ce fichier) |
| Brand voice | brand-voice.md (tone, banned words, UI copy rules) |
| Working style | working-style.md (how Claude Code should behave) |
