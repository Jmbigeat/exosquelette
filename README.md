# ABNEG@TION — Système d'Évaluation & Matrice de Preuves RH

> **Concept-car logiciel & banc d'essai R&D conçu par Jean-Mikaël Bigeat (Product Manager — Talent Assessment & AI Systems).**  
> *« Le candidat ne déclare plus. Il prouve. »*

---

## 🎯 Le Problème & La Thèse de Marché

Face à la saturation des ATS par les candidatures générées par LLM (**+182 % de volume par embauche** selon l'étude Ashby sur 109M de candidatures tech), 95 % des CV sont devenus du déclaratif pur sans valeur de signal.

**Abneg@tion** inverse cette dynamique : plutôt que d'amplifier le bruit par de l'IA générative complaisante, l'outil décompose le vécu professionnel du candidat en **preuves de compétences vérifiables**, audite leur consistance sous contrainte et élimine les hallucinations algorithmiques.

---

## ⚙️ Ce que fait l'outil (4 surfaces, 1 pipeline)

1. **L'Éclaireur (Couche 0) :** Analyse sémantique de l'offre d'emploi cible. Détecte le rôle, extrait le KPI implicite du recruteur et cartographie les « cauchemars opérationnels » (les risques réels que l'employeur redoute sans les expliciter dans l'annonce).
2. **La Forge (Couche Moteur) :** Extraction et structuration des briques d'expérience. Chaque brique est soumise au **Blindage déterministe sur 4 axes** : *Chiffre vérifiable*, *Décision personnelle*, *Influence prouvée*, *Transférabilité argumentée*.
   - **Le Stress Test :** Attaque chaque preuve sous 4 angles contradictoires calibrés par rôle et séniorité.
   - **Le Duel :** Épreuve textuelle contradictoire de 90 secondes confrontant le candidat à un sparring-partner adverse pour tester la tenue de ses preuves sous pression.
3. **La Trempe :** Transformation des preuves validées en artefacts de positionnement (articles de fond et posts d'autorité sédimentés, scorés par 8 heuristiques).
4. **L'Échoppe (Spécification prête) :** Espace recruteurs inversé. Matching direct par profil d'anomalie couverte et déclenchement du One-Pager opposable.

---

## 🏛️ Architecture & Invariants Produit

- **Architecture Hybride (80 % déterministe / 20 % IA) :** Les moteurs de calcul, les validateurs de règles, le Blindage et la densité sont des **fonctions pures locales (0 token)**. Zéro modèle probabiliste dans le chemin critique d'évaluation : aucune probabilité dans la note finale, calculable à la main.
- **Dérisquage Réglementaire EU AI Act (Auditabilité & Explicabilité) :** Conçu pour répondre aux obligations d'auditabilité des systèmes de recrutement classés "Haut Risque" (Annexe III) :
  - **Article 14 (Supervision humaine effective) :** Les métriques restent transparentes, auditables et opposables par un humain.
  - **Article 86 (Droit à l'explicabilité) :** Zéro boîte noire de scoring prédictif opaque protégeant les entreprises contre le risque d'exposition juridique.
- **Découplage Clinique Moteur vs Narration :** L'utilisateur interagit avec une structure narrative intuitive (ATMT : Accroche, Tension, Méthode, Transfert). Le moteur sous-jacent applique un modèle de contrainte distinct (Blindage 4 cases). Les deux couches ne se polluent jamais.
- **Arbitrages de Renoncement Documentés :**
  - Suppression de 3 mois de développement front sur le dashboard propriétaire au profit d'une injection native par webhooks dans l'ATS (éviter le syndrome du "4ᵉ onglet" pour les managers).
  - Suppression de 3 fonctionnalités parasites en production (recharge à l'acte, compteur de crédits, option d'onboarding) pour fluidifier la boucle d'usage.

---

## 📊 Métriques d'Invariance & Qualité Logicielle

- **13 pièces de spécifications cliniques** et registres d'arbitrage produit (contrats de données prêts pour passation dev V2)
- **Suite d'invariance de 258 assertions automatisées** (`smoke.mjs`) et **27 tests unitaires sous Vitest** couvrant le critical path
- **4 surfaces métier unifiées** (Éclaireur, Forge, Trempe, Échoppe)
- **4 arbitrages majeurs de suppression** (Kill List documentée : suppression des crédits, des toggles et du dashboard RH)
- **10 rôles professionnels × 4 secteurs** modélisés
- **145+ déploiements** Vercel en production continue

---

## 🛠️ Stack Technique

- **Front-end / Framework :** Next.js 14 (App Router), React, Tailwind CSS
- **Back-end & Persistance :** Supabase (PostgreSQL, Auth, RLS)
- **Validation & Sécurité :** Zod (schémas d'API stricts), Rate limiting (Upstash Redis)
- **Paiements :** Stripe API
- **IA (Dernier kilomètre uniquement) :** Google Gen AI API (Gemini 1.5 Flash sur le scan initial de l'Éclaireur)
- **Qualité & Tests :** Vitest, ESLint, Prettier

---

## 👤 Conception & Paternité Produit

**Jean-Mikaël Bigeat** — Product Manager (Talent Assessment & AI Systems)  
- Démo & Application : [abnegation.eu](https://abnegation.eu)
- Profil d'autorité & gouvernance : [github.com/Jmbigeat](https://github.com/Jmbigeat)
- Contact : contact@abnegation.eu · jeanmikael.bigeat@email.com

> *« Du terrain au logiciel : résoudre des frictions opérationnelles réelles par le cadrage d'invariants et l'élimination du superflu. »*
