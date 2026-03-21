# PROMPT CLAUDE CODE — FEAT: RATIO COÛT DU POSTE / VALEUR PRODUITE
## Le candidat voit combien son rôle coûte vs combien il rapporte. L'argumentaire de négociation devient rationnel.

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Tous les chantiers (1–21) + micro-fixes + features (audit CV, salary, loc-markers, one-pager, role-variants, transversal-cauchemars) mergés. SALARY_RANGES_BY_ROLE, REPLACEMENT_DATA_BY_ROLE, OTE_SPLIT_BY_ROLE existent dans references.js. Le comparatif salarial (Arsenal bloc 5 + generator Établi interne) est en prod. Ce chantier ajoute le ratio valeur/coût par rôle et l'intègre dans le diagnostic et les livrables existants.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-role-value-ratio
```

---

## CONTEXTE

Le candidat connaît son salaire (currentSalary), sa position marché (P25-P75), et son coût de remplacement (REPLACEMENT_DATA). Il ne connaît pas la valeur qu'il produit pour l'entreprise.

Un enterprise_ae à 70K€ de salaire génère 500K-2M€ de revenu annuel. Son ratio coût/valeur est de 3-14%. Le manager qui négocie une augmentation de 5K€ bloque sur le budget. Le candidat qui dit "je coûte 4% de ce que je rapporte, je demande 5%" change la conversation.

ROLE_VALUE_RATIO est une estimation par rôle de la valeur annuelle produite (revenue, coût évité, ou valeur projet). Le ratio salaire/valeur donne un levier de négociation factuel.

---

## CE QUE TU FAIS (3 opérations)

### Opération 1 — Lire l'existant

Lis ces fichiers AVANT de modifier quoi que ce soit :

- `lib/sprint/references.js` — identifie SALARY_RANGES_BY_ROLE, REPLACEMENT_DATA_BY_ROLE, OTE_SPLIT_BY_ROLE. Note les 10 identifiants.
- `components/sprint/Arsenal.jsx` — identifie le bloc 5 (diagnostic salarial). Note le useMemo salaryDiag et comment il affiche les données.
- `lib/generators/salary-comparison.js` — identifie generateSalaryComparison. Note les 4 blocs et comment ils consomment les données.

### Opération 2 — Ajouter ROLE_VALUE_RATIO dans references.js

Nouveau bloc dans references.js, APRÈS OTE_SPLIT_BY_ROLE :

```javascript
/**
 * Estimation de la valeur annuelle produite par rôle (€, France 2025).
 * valueType : 'revenue' (CA généré), 'cost_saved' (coût évité), 'project_value' (valeur projet livrée).
 * low/high = fourchette réaliste. Pas un plafond.
 * Sources : benchmarks marché SaaS/conseil/ops — estimations conservatrices.
 * Le ratio salary/value donne le levier de négociation.
 */
export const ROLE_VALUE_RATIO = {
  enterprise_ae:         { low: 500000,  high: 2000000, valueType: "revenue",       label: "CA signé" },
  head_of_growth:        { low: 300000,  high: 1500000, valueType: "revenue",       label: "Pipeline généré" },
  strategic_csm:         { low: 200000,  high: 800000,  valueType: "revenue",       label: "Revenu retenu (anti-churn)" },
  senior_pm:             { low: 500000,  high: 3000000, valueType: "project_value", label: "Valeur produit livrée" },
  engineering_manager:   { low: 400000,  high: 2000000, valueType: "project_value", label: "Valeur technique livrée" },
  ai_architect:          { low: 500000,  high: 5000000, valueType: "project_value", label: "Valeur IA déployée" },
  management_consultant: { low: 200000,  high: 1000000, valueType: "revenue",       label: "Honoraires facturés" },
  strategy_associate:    { low: 150000,  high: 600000,  valueType: "project_value", label: "Valeur projet stratégique" },
  operations_manager:    { low: 200000,  high: 1000000, valueType: "cost_saved",    label: "Coût opérationnel évité" },
  fractional_coo:        { low: 500000,  high: 3000000, valueType: "cost_saved",    label: "Valeur organisationnelle" },
};
```

IMPORTANT : vérifie que les identifiants correspondent EXACTEMENT aux clés dans ROLE_CLUSTERS.

### Opération 3 — Intégrer le ratio dans le diagnostic salarial (Arsenal + generator)

**A. Arsenal.jsx — bloc 5 enrichi**

Dans le useMemo salaryDiag, ajouter le calcul du ratio :

```javascript
// Après le calcul de deltaP50...
var valueRatio = ROLE_VALUE_RATIO[targetRoleId] || null;
var costRatioLow = null;
var costRatioHigh = null;
if (valueRatio && currentSalary > 0) {
  costRatioLow = Math.round((currentSalary / valueRatio.high) * 100);
  costRatioHigh = Math.round((currentSalary / valueRatio.low) * 100);
}
```

Import ROLE_VALUE_RATIO depuis references.js.

Affichage sous le diagnostic marché existant (même bloc 5, nouvelle ligne) :

```
Ratio coût/valeur : 4-14% ({label})
```

Si costRatioHigh ≤ 10% : couleur #4ecca3 (vert) + "Ton coût est faible par rapport à ta valeur produite."
Si costRatioHigh ≤ 20% : couleur #ccd6f6 (neutre) — pas de message.
Si costRatioHigh > 20% : couleur #ff9800 (orange) + "Ton ratio coût/valeur est élevé. Renforce tes preuves d'impact."

Si currentSalary est vide ou ROLE_VALUE_RATIO n'a pas le rôle : ne pas afficher cette ligne.

**B. salary-comparison.js — bloc 3 enrichi**

Dans generateSalaryComparison, enrichir le bloc 3 (Recommandation calibrée) :

Après "Ton coût de remplacement est estimé à..." ajouter :

```
"Un {roleLabel} produit entre {low}€ et {high}€ de {label} par an. Ton salaire représente {costRatioLow}-{costRatioHigh}% de cette valeur. Une augmentation de {delta}€ porte ce ratio à {newRatio}% — toujours rentable."
```

Import ROLE_VALUE_RATIO dans salary-comparison.js.

Le calcul du newRatio utilise la fourchette P50-P75 comme nouveau salaire cible :
```javascript
var newRatioLow = Math.round((ranges.p50 / valueRatio.high) * 100);
var newRatioHigh = Math.round((ranges.p75 / valueRatio.low) * 100);
```

Si ROLE_VALUE_RATIO n'a pas le rôle : ne pas afficher ce paragraphe. Le bloc 3 reste intact sans le ratio.

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas SALARY_RANGES_BY_ROLE
- Tu ne modifies pas REPLACEMENT_DATA_BY_ROLE
- Tu ne modifies pas OTE_SPLIT_BY_ROLE
- Tu ne modifies pas le scoring
- Tu ne modifies pas les autres generators
- Tu ne modifies pas le One-Pager
- Tu ne modifies pas l'Éclaireur
- Tu ne crées pas de route
- Tu ne crées pas de table Supabase
- Tu n'ajoutes pas de dépendance npm

---

## TESTS MANUELS

1. Lis ROLE_VALUE_RATIO dans references.js. Vérifie les 10 rôles, les fourchettes, les labels.
2. Avec salaire 70000 et rôle enterprise_ae : le ratio est 70000/2000000=3.5% à 70000/500000=14%. Vérifie l'affichage "4-14%" dans l'Arsenal.
3. Avec salaire 65000 et rôle senior_pm : le ratio est 65000/3000000=2.2% à 65000/500000=13%. Vérifie.
4. Sans salaire : vérifie que la ligne ratio n'apparaît pas.
5. Génère le comparatif salarial dans l'Établi. Vérifie que le bloc 3 contient le paragraphe valeur produite.
6. Avec un rôle qui n'aurait pas de ROLE_VALUE_RATIO (test edge case) : vérifie que le bloc 3 fonctionne sans le paragraphe.
7. `npm run build` — zéro erreur.
8. `npm run smoke` — zéro régression.

---

## CONVENTIONS (ne pas modifier)

- Langue du code : anglais
- Langue des strings UI : français avec accents corrects (é, è, ê, à, ù, ç)
- Pas de console.log en production
- Les fonctions exportées ont un JSDoc
- Pas d'unicode escapes (écrire é, pas \u00E9 ; écrire €, pas \u20AC)

---

## VÉRIFICATION FINALE

- ROLE_VALUE_RATIO existe dans references.js avec 10 rôles (identifiants vérifiés)
- Chaque rôle a low, high, valueType, label
- Arsenal bloc 5 affiche le ratio coût/valeur (conditionnel sur currentSalary)
- Couleur adaptée selon le ratio (vert ≤10%, neutre ≤20%, orange >20%)
- generateSalaryComparison bloc 3 intègre le paragraphe valeur produite
- Aucune donnée salariale existante modifiée
- Aucun autre generator modifié
- Le build passe sans erreur
- Le smoke test passe sans régression

---

## COMMIT

```
feat: ROLE_VALUE_RATIO — cost/value ratio per role enriches salary diagnostic

- lib/sprint/references.js: ROLE_VALUE_RATIO (10 roles × low/high/valueType/label)
- Arsenal.jsx: cost/value ratio line in salary diagnostic (bloc 5)
- salary-comparison.js: value-based argument in bloc 3 recommendation
- Zero modification to existing salary/replacement data or other generators

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge feat-role-value-ratio --no-ff -m "feat: ROLE_VALUE_RATIO — cost/value ratio per role"
npm run smoke
```
