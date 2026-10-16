# ABNEG@TION — Système d'Évaluation & Matrice de Qualification RH

> **Concept-car logiciel & banc d'essai R&D conçu par Jean-Mikaël Bigeat (Product Manager — Talent Assessment & AI Systems).**  
> *« Remplacer le flou déclaratif par des affirmations précises, exposées à la contradiction et prêtes pour la vérification humaine. »*

---

## 🎯 Le Problème & La Thèse de Marché

Face à la saturation des ATS par les candidatures générées par LLM (**+182 % de volume par embauche** selon l'étude Ashby sur 109M de candidatures tech), 95 % des CV sont devenus du déclaratif pur sans valeur de signal.

**Abneg@tion** inverse cette dynamique : plutôt que d'amplifier le bruit par de l'IA générative complaisante, l'outil décompose le vécu professionnel du candidat en **affirmations précises et testables**, éprouve leur solidité face à la contradiction et garantit zéro hallucination sur le score (le LLM ne touche jamais à la notation).

---

## ⚙️ Ce que fait l'outil (4 surfaces, 1 pipeline)

1. **L'Éclaireur (Couche 0) :** Analyse sémantique de l'offre d'emploi cible. Détecte le rôle, extrait le KPI implicite du recruteur et cartographie les « cauchemars opérationnels » (les risques réels que l'employeur redoute sans les expliciter dans l'annonce).
2. **La Forge (Couche Moteur) :** Extraction et structuration des briques d'expérience. Chaque brique est soumise au **Blindage déterministe sur 4 axes** : *Chiffre vérifiable*, *Décision personnelle*, *Influence*, *Transférabilité argumentée*.
   - **Le Stress Test :** Attaque chaque affirmation sous 4 angles contradictoires calibrés par rôle et séniorité.
   - **Le Duel :** Épreuve textuelle contradictoire de 90 secondes confrontant le candidat à un sparring-partner adverse pour tester la solidité de ses arguments face à l'objection.
3. **La Trempe :** Transformation des briques qualifiées en artefacts de positionnement (articles de fond et posts d'autorité sédimentés, scorés par 8 heuristiques).
4. **L'Échoppe (Spécification prête) :** Espace recruteurs inversé. Matching direct par profil d'anomalie couverte et déclenchement du One-Pager de synthèse (statuts S1 Formulé et S2 Exposé).

---

## 🏛️ Architecture & Invariants Produit

- **Le Score : 100 % Fonctions Pures Déterministes · Le LLM : 3 Routes Hors Score :** Les moteurs de calcul (`assessBrickArmor`, `computeDensityScore`), les validateurs de règles, le Blindage (38 marqueurs lexicaux) et la densité reposent sur **12 modules de fonctions pures locales (0 token)**. Toute piste issue du scan initial (`/api/scan`) reste verrouillée à `0 point` (statut `vulnerable` / `S0`) tant que le candidat ne l'a pas réécrite et validée dans la Forge. Aucune probabilité n'entre dans la note finale, intégralement reproductible et calculable à la main.
- **Conçu pour l'Auditabilité Réglementaire EU AI Act (Art. 13, 14, 86) :** Architecture pensée pour répondre aux exigences de transparence des systèmes RH (Annexe III) :
  - **Articles 13 & 14 (Transparence et supervision humaine effective) :** Les critères et seuils restent lisibles, déterministes et opposables par un évaluateur humain.
  - **Article 86 (Droit à l'explicabilité) :** Chaque statut ou refus d'axe cite la règle booléenne exacte qui l'a produit, sans boîte noire de scoring prédictif.
- **Découplage Clinique Moteur vs Narration :** L'utilisateur interagit avec une structure narrative intuitive (ATMT : Accroche, Tension, Méthode, Transfert). Le moteur sous-jacent applique un modèle de contrainte distinct (Blindage 4 cases). Les deux couches ne se polluent jamais.
- **Arbitrages de Renoncement Documentés :**
  - Renoncement en cadrage à la construction d'un dashboard RH propriétaire au profit d'un livrable structuré (JSON/PDF) pensé pour l'ATS existant (connecteurs webhooks inscrits en roadmap), afin d'éviter le syndrome du "4ᵉ onglet" pour les managers.
  - Kill List gravée dans le code (`scripts/hooks/pre-commit`) : suppression des fonctionnalités parasites (Sprint Éclair, Recharge à l'Acte) avec blocage automatique de toute tentative de résurrection au commit.

---

## 📊 Métriques de Non-Régression & Qualité Logicielle

- **13 pièces de spécifications cliniques** et registres d'arbitrage produit (contrats de données prêts pour passation dev V2)
- **258 assertions de non-régression automatisées** (`smoke.mjs`) et **27 tests unitaires sous Vitest** couvrant le chemin critique (exécutés et bloquants dans le hook `pre-commit`)
- **12 modules de fonctions pures** et **38 marqueurs lexicaux** dans le moteur de qualification
- **4 surfaces métier unifiées** (Éclaireur, Forge, Trempe, Échoppe)
- **4 arbitrages majeurs de suppression** (Kill List documentée et verrouillée par hook Git)
- **10 rôles professionnels × 4 secteurs** modélisés
- **145+ déploiements** Vercel en continu

---

## 🛠️ Stack Technique

- **Front-end / Framework :** Next.js 14 (App Router), React, Tailwind CSS
- **Back-end & Persistance :** Supabase (PostgreSQL, Auth, RLS)
- **Validation & Sécurité :** Zod (schémas d'API stricts), Rate limiting (Upstash Redis)
- **Paiements :** Stripe API
- **IA (3 routes hors score uniquement) :** Anthropic API (`Claude Sonnet 4` pour les hypothèses initiales CV `/api/scan` et l'entraînement contradictoire `/api/challenge` / `/api/generate` ; `Claude Haiku 4.5` pour la recommandation de piliers `/api/recommend-pillars`)
- **Qualité & Tests :** Vitest (27 tests unitaires), Node Smoke Suite (`smoke.mjs`, 258 assertions), ESLint, Prettier

---

## 👤 Conception & Paternité Produit

**Jean-Mikaël Bigeat** — Product Manager (Talent Assessment & AI Systems)  
- Démo & Application : [abnegation.eu](https://abnegation.eu)
- Profil d'autorité & gouvernance : [github.com/Jmbigeat](https://github.com/Jmbigeat)
- Contact : contact@abnegation.eu · jeanmikael.bigeat@email.com

> *« Du terrain au logiciel : résoudre des frictions opérationnelles réelles par le cadrage d'invariants et l'élimination du superflu. »*
