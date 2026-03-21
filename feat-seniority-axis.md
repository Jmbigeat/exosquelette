# PROMPT CLAUDE CODE — FEAT: AXE SÉNIORITÉ IC/MANAGER/LEADER
## Le candidat déclare son niveau. L'outil calibre les questions, les livrables, et pose la donnée pour L'Échoppe.

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Tous les chantiers (1–21) + micro-fixes + features (audit CV, salary, loc-markers, one-pager, role-variants, transversal-cauchemars, role-value-ratio) mergés. Ce chantier ajoute un champ séniorité (IC/Manager/Leader) dans l'Onboarding et le Sprint, un diagnostic dans l'Arsenal, et des données de référence par niveau dans references.js.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-seniority-axis
```

---

## CONTEXTE

Le candidat choisit un rôle (enterprise_ae) mais pas un niveau. Un enterprise_ae IC (Individual Contributor) ferme des deals. Un enterprise_ae Manager pilote 5 AE. Un enterprise_ae Leader définit la stratégie commerciale. Les cauchemars, les questions d'entretien, et le One-Pager ne s'adressent pas au même interlocuteur.

Aujourd'hui l'outil traite tous les candidats d'un même rôle de façon identique. L'ajout de la séniorité permet de calibrer sans toucher au scoring (même pattern que le LoC : diagnostic, pas axe de densité).

3 niveaux :
- IC (Individual Contributor) : exécute, produit, livre. Pas de management. Le recruteur cherche l'expertise et l'autonomie.
- Manager : pilote une équipe (3-15 personnes). Le recruteur cherche le leadership opérationnel et la capacité à scaler.
- Leader : définit la stratégie, influence le comex. Le recruteur cherche la vision et l'impact organisationnel.

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire l'existant

Lis ces fichiers AVANT de modifier quoi que ce soit :

- `lib/sprint/references.js` — identifie ROLE_CLUSTERS, CAUCHEMAR_TEMPLATES_BY_ROLE, SALARY_RANGES_BY_ROLE. Note la structure.
- `components/Onboarding.jsx` — identifie les étapes, les champs collectés, comment le rôle est sélectionné et passé à Sprint.jsx.
- `components/Sprint.jsx` — identifie comment le rôle est stocké (targetRoleId). Note le state et la persistence (savedState / Supabase).
- `components/sprint/Arsenal.jsx` — identifie les blocs existants (1-6). Note où ajouter un bloc 7.
- `lib/generators/one-pager.js` — identifie comment le bloc 1 (titre + signature) est construit.
- `lib/generators/salary-comparison.js` — identifie comment les fourchettes salariales sont utilisées.

### Opération 2 — Ajouter SENIORITY_LEVELS et SENIORITY_CALIBRATION dans references.js

Nouveau bloc dans references.js, APRÈS ROLE_VALUE_RATIO :

```javascript
/**
 * Seniority levels. The candidate selects one during Onboarding.
 * Stored as seniorityLevel in Sprint state.
 */
export var SENIORITY_LEVELS = [
  { id: "ic", label: "IC — Contributeur individuel", shortLabel: "IC", description: "Tu produis, tu livres. Pas de management direct." },
  { id: "manager", label: "Manager — Pilote d'équipe", shortLabel: "Manager", description: "Tu pilotes une équipe (3-15 personnes). Tu recrutes, tu coaches, tu arbitres." },
  { id: "leader", label: "Leader — Stratégie et influence", shortLabel: "Leader", description: "Tu définis la direction. Tu influences le comex. Tu construis l'organisation." }
];

/**
 * Seniority-specific calibration per role.
 * interviewFocus: what the recruiter evaluates at this level.
 * salaryMultiplier: multiplier applied to SALARY_RANGES_BY_ROLE (1.0 = base = IC level).
 * cauchemarFocus: which cauchemars are amplified at this level.
 * onePagerAngle: how the One-Pager bloc 3 ("Pourquoi ce poste") should be framed.
 */
export var SENIORITY_CALIBRATION = {
  ic: {
    interviewFocus: "Expertise technique, autonomie, résultats individuels mesurables.",
    salaryMultiplier: 1.0,
    cauchemarFocus: "Obsolescence technique, incapacité à livrer sans supervision.",
    onePagerAngle: "Prouver l'expertise par les résultats. Chiffres individuels."
  },
  manager: {
    interviewFocus: "Leadership opérationnel, capacité à scaler une équipe, gestion de la performance.",
    salaryMultiplier: 1.25,
    cauchemarFocus: "Équipe qui ne performe pas, turnover, incapacité à recruter.",
    onePagerAngle: "Prouver la capacité à construire et piloter. Résultats d'équipe."
  },
  leader: {
    interviewFocus: "Vision stratégique, influence C-level, transformation organisationnelle.",
    salaryMultiplier: 1.55,
    cauchemarFocus: "Mauvais fit culturel au comex, incapacité à transformer, départ rapide.",
    onePagerAngle: "Prouver l'impact organisationnel. Résultats business et transformation."
  }
};
```

### Opération 3 — Ajouter le champ séniorité dans l'Onboarding et Sprint

**A. Onboarding.jsx**

Après la sélection du rôle, ajouter une étape de sélection de séniorité. 3 boutons radio (IC / Manager / Leader). Chaque bouton affiche le shortLabel + la description.

Import :
```javascript
import { SENIORITY_LEVELS } from "../lib/sprint/references";
```

Le candidat sélectionne un niveau. Valeur par défaut : aucune (le candidat choisit). La sélection est obligatoire pour passer à l'étape suivante. Stocker dans le state comme seniorityLevel (string : "ic", "manager", ou "leader").

Passer seniorityLevel à Sprint.jsx via le même mécanisme que targetRoleId.

Si eclaireur_data existe dans sessionStorage : ne pas pré-sélectionner la séniorité (l'Éclaireur ne la détecte pas). Le candidat choisit.

**B. Sprint.jsx**

Ajouter seniorityLevel au state :
```javascript
var seniorityLevelState = useState(initialState && initialState.seniorityLevel ? initialState.seniorityLevel : null);
var seniorityLevel = seniorityLevelState[0];
var setSeniorityLevel = seniorityLevelState[1];
```

Persister seniorityLevel dans savedState (même pattern que targetRoleId, currentSalary).

Passer seniorityLevel comme prop à Arsenal, WorkBench, et tout composant qui en a besoin.

### Opération 4 — Ajouter le diagnostic séniorité dans Arsenal.jsx (bloc 7)

Le bloc 7 s'affiche si seniorityLevel est défini. Pas conditionnel sur le nombre de briques.

Import :
```javascript
import { SENIORITY_CALIBRATION, SENIORITY_LEVELS } from "@/lib/sprint/references";
```

Calcul via useMemo :

```javascript
var seniorityDiag = useMemo(function () {
  if (!seniorityLevel) return null;
  var calibration = SENIORITY_CALIBRATION[seniorityLevel] || null;
  if (!calibration) return null;
  var levelInfo = SENIORITY_LEVELS.find(function (l) { return l.id === seniorityLevel; });

  // Salary adjusted by multiplier
  var adjustedSalary = null;
  var ranges = SALARY_RANGES_BY_ROLE[targetRoleId];
  if (ranges && calibration.salaryMultiplier) {
    adjustedSalary = {
      p25: Math.round(ranges.p25 * calibration.salaryMultiplier),
      p50: Math.round(ranges.p50 * calibration.salaryMultiplier),
      p75: Math.round(ranges.p75 * calibration.salaryMultiplier)
    };
  }

  return {
    level: seniorityLevel,
    levelLabel: levelInfo ? levelInfo.shortLabel : seniorityLevel,
    interviewFocus: calibration.interviewFocus,
    cauchemarFocus: calibration.cauchemarFocus,
    onePagerAngle: calibration.onePagerAngle,
    adjustedSalary: adjustedSalary
  };
}, [seniorityLevel, targetRoleId]);
```

Affichage :

```
┌─────────────────────────────────────────────────────────┐
│ CALIBRATION SÉNIORITÉ                                    │
│                                                          │
│ Niveau : Manager                                         │
│                                                          │
│ Le recruteur évalue :                                    │
│ Leadership opérationnel, capacité à scaler une équipe,   │
│ gestion de la performance.                               │
│                                                          │
│ Fourchette ajustée : 85 000€ — 106 000€ (P50-P75)       │
│                                                          │
│ Risque principal :                                       │
│ Équipe qui ne performe pas, turnover, incapacité à       │
│ recruter.                                                │
└─────────────────────────────────────────────────────────┘
```

Couleurs :
- Label "CALIBRATION SÉNIORITÉ" : même style que les autres labels Arsenal
- Niveau : #ccd6f6 (texte normal)
- "Le recruteur évalue" : #8892b0 (muted) pour le label, #ccd6f6 pour le contenu
- Fourchette ajustée : #4ecca3 (vert) si salaire ajusté existe
- "Risque principal" : #ff9800 (orange) pour le label, #ccd6f6 pour le contenu

Si seniorityLevel est null : ne pas afficher le bloc. Ajouter un message dans l'Arsenal : "Sélectionne ton niveau de séniorité dans les paramètres pour calibrer le diagnostic."

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies PAS le scoring (computeDensityScore). La séniorité est un diagnostic, pas un axe de densité. Elle le deviendra en V3.
- Tu ne modifies pas les generators existants (One-Pager, CV, etc.). La séniorité les enrichira en V2. Aujourd'hui elle pose la donnée.
- Tu ne modifies pas les cauchemars. La cauchemarFocus est informative, pas un filtre.
- Tu ne modifies pas le Duel.
- Tu ne modifies pas l'Éclaireur.
- Tu ne modifies pas le scoring salarial existant (le salaryMultiplier est affiché en diagnostic, pas injecté dans SALARY_RANGES_BY_ROLE).
- Tu ne crées pas de route.
- Tu ne crées pas de table Supabase (seniorityLevel est dans savedState, pas dans une table séparée).
- Tu n'ajoutes pas de dépendance npm.

---

## TESTS MANUELS

1. Ouvre l'Onboarding. Après la sélection du rôle, vérifie que les 3 niveaux de séniorité apparaissent.
2. Sélectionne "Manager." Vérifie que la valeur est passée au Sprint.
3. Ouvre l'Arsenal. Vérifie que le bloc "CALIBRATION SÉNIORITÉ" affiche "Manager" + interviewFocus + fourchette ajustée + risque.
4. Change la séniorité en "IC." Vérifie que le bloc se met à jour (salaryMultiplier 1.0, fourchette base).
5. Change en "Leader." Vérifie que la fourchette ajustée est 1.55× la base.
6. Sans séniorité sélectionnée : vérifie que le bloc est absent et le message guide apparaît.
7. Rafraîchis la page. Vérifie que seniorityLevel persiste (savedState).
8. `npm run build` — zéro erreur.
9. `npm run smoke` — zéro régression.

---

## CONVENTIONS (ne pas modifier)

- Langue du code : anglais
- Langue des strings UI : français avec accents corrects (é, è, ê, à, ù, ç)
- Pas de console.log en production
- Les fonctions exportées ont un JSDoc
- Pas d'unicode escapes (écrire é, pas \u00E9 ; écrire €, pas \u20AC)

---

## VÉRIFICATION FINALE

- SENIORITY_LEVELS existe dans references.js (3 entries : ic, manager, leader)
- SENIORITY_CALIBRATION existe dans references.js (3 entries avec interviewFocus, salaryMultiplier, cauchemarFocus, onePagerAngle)
- Onboarding affiche la sélection de séniorité après le rôle
- seniorityLevel persisté dans savedState (Sprint.jsx)
- Arsenal bloc 7 "CALIBRATION SÉNIORITÉ" conditionnel (seniorityLevel défini)
- Fourchette salariale ajustée par salaryMultiplier
- Aucune modification du scoring
- Aucun generator modifié
- Le build passe sans erreur
- Le smoke test passe sans régression

---

## COMMIT

```
feat: seniority axis IC/Manager/Leader — Onboarding + Arsenal diagnostic

- lib/sprint/references.js: SENIORITY_LEVELS (3 levels) + SENIORITY_CALIBRATION (interviewFocus, salaryMultiplier, cauchemarFocus, onePagerAngle)
- Onboarding.jsx: seniority selection step after role (3 radio buttons)
- Sprint.jsx: seniorityLevel state persisted in savedState
- Arsenal.jsx: bloc 7 "Calibration séniorité" (level, interview focus, adjusted salary range, risk)
- Zero modification to scoring, generators, cauchemars, or Duel

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge feat-seniority-axis --no-ff -m "feat: seniority axis IC/Manager/Leader"
npm run smoke
```
