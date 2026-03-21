# PROMPT CLAUDE CODE — FEAT: COMPARATIF SALARIAL + OTE/ACV
## Le candidat voit sa position salariale, son ratio OTE/ACV, et génère un livrable de négociation calibré.

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Tous les chantiers (1–21) + micro-fixes + feat-audit-cv-forge mergés. Le champ currentSalary existe dans Sprint.jsx (onglet interne Établi). REPLACEMENT_DATA_BY_ROLE existe dans references.js. Les generators rapport de remplacement et argumentaire d'augmentation existent dans generators.js. Ce chantier ajoute les données salariales par rôle, un diagnostic dans l'Arsenal, et un nouveau generator dans l'Établi.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-salary-comparison
```

---

## CONTEXTE

Le candidat a forgé ses briques. Il sait ce qu'il vaut (densité, cauchemars couverts, signature). Il ne sait pas combien il vaut en euros. Son salaire actuel est peut-être 10% sous la médiane du marché. Il négocie à l'aveugle.

Le comparatif salarial croise le salaire du candidat avec les fourchettes marché par rôle. Pour les rôles sales, il décompose l'OTE (fixe + variable) et calcule le ratio OTE/ACV. Il alerte si le ratio dépasse 35% (variable structurellement inatteignable).

L'Arsenal affiche le diagnostic court (position marché + alerte). L'Établi génère le livrable complet (4 blocs de négociation).

---

## RÉFÉRENCE STATECHART

Ce chantier étend deux régions parallèles du statechart Couche 1 (Forge). Aucun nouvel état. Aucune nouvelle transition.

Arsenal (Région 3 — ORIENTER) : ajout d'un bloc 5 conditionnel. Le bloc s'affiche si currentSalary > 0. Le diagnostic est un calcul dérivé (même pattern que le radar 6 axes : données existantes + calcul + affichage).

Établi (Région 1 — PRODUIRE) : ajout d'un livrable dans l'onglet interne. Même pattern que le rapport de remplacement et l'argumentaire. Le livrable est généré à la demande. La première génération est gratuite (pièces mortes, pas de consommation).

---

## CE QUE TU FAIS (5 opérations)

### Opération 1 — Lire l'existant

Lis ces fichiers en entier AVANT de modifier quoi que ce soit :

- `lib/sprint/references.js` — identifie les ROLE_CLUSTERS (les 10 rôles actuels et leurs identifiants exacts). Identifie REPLACEMENT_DATA_BY_ROLE. Note les identifiants.
- `components/Sprint.jsx` — identifie le state currentSalary et comment il est passé aux composants.
- `components/sprint/panels.jsx` — identifie l'onglet interne de l'Établi (WorkBench). Note comment les generators rapport de remplacement et argumentaire sont appelés. Note les props passées.
- `components/sprint/Arsenal.jsx` — identifie les blocs existants (1-4 : radar, prochaine action, simulation, audit CV). Note la structure pour ajouter un bloc 5.
- `lib/generators/index.js` — identifie les exports existants. Note la convention de nommage.
- `lib/generators/helpers.js` — identifie extractBrickCore et les helpers réutilisables.

### Opération 2 — Ajouter SALARY_RANGES_BY_ROLE et OTE_SPLIT_BY_ROLE dans references.js

Nouveau bloc dans references.js, APRÈS REPLACEMENT_DATA_BY_ROLE :

```javascript
/**
 * Fourchettes salariales marché par rôle (brut annuel, €, France 2025).
 * P25 = entrée, P50 = médiane, P75 = confirmé.
 * Sources : Robert Half, Hays, Michael Page — études 2025.
 * Mis à jour annuellement en janvier.
 */
export const SALARY_RANGES_BY_ROLE = {
  enterprise_ae:         { p25: 55000, p50: 70000, p75: 90000 },
  head_of_growth:        { p25: 60000, p50: 75000, p75: 95000 },
  strategic_csm:         { p25: 45000, p50: 55000, p75: 70000 },
  senior_pm:             { p25: 55000, p50: 68000, p75: 85000 },
  engineering_manager:   { p25: 65000, p50: 80000, p75: 100000 },
  ai_architect:          { p25: 70000, p50: 88000, p75: 110000 },
  management_consultant: { p25: 50000, p50: 65000, p75: 85000 },
  strategy_associate:    { p25: 45000, p50: 58000, p75: 72000 },
  operations_manager:    { p25: 50000, p50: 62000, p75: 78000 },
  fractional_coo:        { p25: 80000, p50: 100000, p75: 130000 },
};

/**
 * Décomposition fixe/variable pour les rôles à OTE.
 * fixeRatio + variableRatio = 1.0.
 * Les rôles absents de cet objet n'ont pas de variable (salaire = fixe).
 */
export const OTE_SPLIT_BY_ROLE = {
  enterprise_ae:    { fixeRatio: 0.50, variableRatio: 0.50 },
  head_of_growth:   { fixeRatio: 0.60, variableRatio: 0.40 },
  strategic_csm:    { fixeRatio: 0.70, variableRatio: 0.30 },
};
```

IMPORTANT : vérifie que les identifiants de rôle (enterprise_ae, senior_pm, etc.) correspondent EXACTEMENT aux clés dans ROLE_CLUSTERS. Si les clés diffèrent, utilise les clés réelles. Ne jamais inventer un identifiant.

### Opération 3 — Ajouter le champ ACV dans Sprint.jsx

Le champ ACV est optionnel, rôles sales uniquement.

```javascript
// State
var acvTargetState = useState(initialState && initialState.acvTarget ? initialState.acvTarget : null);
var acvTarget = acvTargetState[0];
var setAcvTarget = acvTargetState[1];
```

Persister acvTarget dans usePersistence (même pattern que currentSalary et cvText).

Passer acvTarget comme prop à Arsenal et à l'Établi (panels.jsx).

### Opération 4 — Ajouter le diagnostic salarial dans Arsenal.jsx (bloc 5)

Le bloc 5 est conditionnel : affiché si currentSalary > 0.

Import SALARY_RANGES_BY_ROLE et OTE_SPLIT_BY_ROLE depuis references.js.

Calcul via useMemo :

```javascript
var salaryDiag = useMemo(function () {
  if (!currentSalary || currentSalary <= 0) return null;
  var ranges = SALARY_RANGES_BY_ROLE[targetRoleId];
  if (!ranges) return null;

  var percentile;
  if (currentSalary <= ranges.p25) percentile = "< P25";
  else if (currentSalary <= ranges.p50) percentile = "P25-P50";
  else if (currentSalary <= ranges.p75) percentile = "P50-P75";
  else percentile = "> P75";

  var deltaP50 = currentSalary - ranges.p50;
  var deltaPercent = Math.round((deltaP50 / ranges.p50) * 100);

  // OTE decomposition (sales roles only)
  var oteSplit = OTE_SPLIT_BY_ROLE[targetRoleId] || null;
  var oteAlert = null;
  if (oteSplit && acvTarget && acvTarget > 0) {
    var ratio = Math.round((currentSalary / acvTarget) * 100);
    if (ratio > 35) {
      oteAlert = "OTE/ACV = " + ratio + "% (seuil : 35%). Variable structurellement inatteignable.";
    }
  }

  return { ranges: ranges, percentile: percentile, deltaP50: deltaP50, deltaPercent: deltaPercent, oteSplit: oteSplit, oteAlert: oteAlert };
}, [currentSalary, targetRoleId, acvTarget]);
```

Affichage :

```
┌─────────────────────────────────────────────────────────┐
│ POSITION MARCHÉ                                          │
│                                                          │
│ Ton salaire : 65 000€ — P25-P50 (10% sous la médiane)  │
│ Médiane : 72 000€ | P75 : 85 000€                       │
│                                                          │
│ ⚠ OTE/ACV = 42% — seuil : 35%. Variable inatteignable. │
└─────────────────────────────────────────────────────────┘
```

Couleurs :
- "> P75" = #4ecca3 (vert)
- "P50-P75" = #4ecca3 (vert)
- "P25-P50" = #ff9800 (orange)
- "< P25" = #e94560 (rouge)
- Alerte OTE/ACV : #e94560 (rouge)
- Label "POSITION MARCHÉ" : même style que les autres labels Arsenal (fontSize 10, fontWeight 700, letterSpacing 1)

Si le rôle est dans OTE_SPLIT_BY_ROLE ET que acvTarget est vide, afficher sous le diagnostic :
"Renseigne ton ACV cible pour un diagnostic OTE complet."

Le champ ACV apparaît sous le diagnostic salarial dans l'Arsenal (pas dans l'Établi). Un seul champ numérique.

```
Label : "ACV cible (€/an)"
Placeholder : "Valeur contractuelle annuelle visée..."
```

Même style que le textarea CV (fond sombre, bordure subtile). Pas de debounce nécessaire (pas de recalcul lourd). onChange → setAcvTarget(Number(e.target.value) || null).

### Opération 5 — Créer generateSalaryComparison dans lib/generators/

Nouveau fichier : `lib/generators/salary-comparison.js`

```javascript
/**
 * Génère un comparatif salarial avec position marché, OTE, et recommandation.
 * Croise salaire × fourchettes marché × coût de remplacement × cauchemars couverts.
 *
 * @param {number} currentSalary - salaire actuel brut annuel
 * @param {string} targetRoleId - rôle cible
 * @param {Array} bricks - briques validées
 * @param {Array} cauchemars - cauchemars actifs
 * @param {number|null} acvTarget - ACV cible (rôles sales)
 * @param {object|null} replacementData - REPLACEMENT_DATA_BY_ROLE[targetRoleId]
 * @returns {string} comparatif formaté (4 blocs)
 */
export function generateSalaryComparison(currentSalary, targetRoleId, bricks, cauchemars, acvTarget, replacementData) { ... }
```

**Bloc 1 — Position marché :**
"Ton salaire (65 000€) se situe entre le P25 (55 000€) et le P50 (68 000€). Tu es {deltaPercent}% {sous/au-dessus de} la médiane pour un {roleLabel} en France."
"Sources : Robert Half, Hays, Michael Page — études 2025."

**Bloc 2 — Décomposition OTE (conditionnel : rôle sales + acvTarget renseigné) :**
"Fixe estimé : {fixe}€ ({fixeRatio}%). Variable estimé : {variable}€ ({variableRatio}%)."
"Ratio OTE/ACV : {ratio}%."
Si ratio > 35% : "Ce ratio dépasse le seuil de 35%. Ta variable est structurellement inatteignable. L'entreprise te demande de générer {multiplier}× ton salaire en contrats."
Si ratio ≤ 35% : "Ce ratio est dans la norme. Ta variable est réaliste."
Si acvTarget vide : ne pas afficher ce bloc.

**Bloc 3 — Recommandation calibrée :**
"Fourchette de négociation : {P50}€ — {P75}€."
Si replacementData : "Ton coût de remplacement est estimé à {replacementCost}€ (recrutement + vacance + montée compétence). Cette fourchette est rationnelle."
"Tu couvres {N}/{total} cauchemars critiques. Chaque cauchemar non couvert par ton remplaçant coûte {montant moyen}."

**Bloc 4 — Argument prêt à l'emploi :**
Texte court (5-8 lignes max) que le candidat peut lire à voix haute en négociation :
"Mon salaire actuel ({salary}€) se situe {percent}% sous la médiane marché pour ce rôle ({p50}€). Mon coût de remplacement est estimé à {cost}€. Ma couverture de {N}/{total} cauchemars réduit le risque de vacance de {weeks} semaines. La fourchette {p50}-{p75}€ est un rééquilibrage, pas une demande agressive."

Si currentSalary est null ou 0 : retourner "Renseigne ton salaire actuel dans l'onglet Interne pour activer le comparatif salarial."

### Opération 6 — Ajouter le livrable dans l'Établi onglet interne (panels.jsx)

Dans l'onglet interne de WorkBench, ajouter "Comparatif salarial" APRÈS l'argumentaire d'augmentation.

Le livrable suit le même pattern que les autres :
- Bouton "Générer" si pas encore généré
- Texte affiché + bouton "Copier" + bouton "Régénérer"
- Audit ch17 branché (type 'salary_comparison', audience 'internal')
- Le generator reçoit : currentSalary, targetRoleId, bricks, nightmares, acvTarget, REPLACEMENT_DATA_BY_ROLE[targetRoleId]

Si currentSalary est vide, afficher le message "Renseigne ton salaire" au lieu du bouton Générer.

### Opération 7 — Exporter depuis lib/generators/index.js

Ajouter l'export de generateSalaryComparison dans index.js (même pattern que les autres generators).

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas l'Éclaireur
- Tu ne modifies pas le Duel
- Tu ne modifies pas les generators existants (rapport remplacement, argumentaire)
- Tu ne modifies pas la densité ni le scoring
- Tu ne modifies pas lib/eclaireur/audit-cv.js ni lib/forge/audit-cv-forge.js
- Tu ne crées pas de route
- Tu ne crées pas de table Supabase (les données sont statiques dans references.js)
- Tu n'ajoutes pas de dépendance npm
- Tu ne modifies pas le champ currentSalary existant (il reste dans l'onglet interne)
- Tu ne fais pas de scraping ni d'appel API externe pour les données salariales

---

## TESTS MANUELS

1. Ouvre la Forge. Va dans l'Établi onglet interne. Vérifie que le champ salaire existe.
2. Saisis un salaire (65000). Va dans l'Arsenal. Vérifie que le bloc "POSITION MARCHÉ" apparaît avec la bonne fourchette.
3. Sans salaire saisi : vérifie que le bloc est absent de l'Arsenal.
4. Avec un rôle sales (enterprise_ae) : vérifie que le message "Renseigne ton ACV cible" apparaît sous le diagnostic.
5. Saisis une ACV (200000). Vérifie que le ratio OTE/ACV s'affiche. Avec 65000/200000 = 32.5% → pas d'alerte.
6. Saisis une ACV (150000). Avec 65000/150000 = 43% → alerte rouge "Variable inatteignable."
7. Avec un rôle non-sales (senior_pm) : vérifie que le champ ACV et le bloc OTE n'apparaissent pas.
8. Va dans l'Établi onglet interne. Vérifie que "Comparatif salarial" apparaît. Clique Générer. Vérifie les 4 blocs.
9. Sans salaire : vérifie que le livrable affiche "Renseigne ton salaire."
10. Rafraîchis la page. Vérifie que salaire et ACV persistent (savedState).
11. `npm run build` — zéro erreur.
12. `npm run smoke` — zéro régression.

---

## CONVENTIONS (ne pas modifier)

- Langue du code : anglais
- Langue des strings UI : français avec accents corrects (é, è, ê, à, ù, ç)
- Langue du contenu généré : français
- Pas de console.log en production
- Les fonctions exportées ont un JSDoc
- Pas d'unicode escapes (écrire é, pas \u00E9 ; écrire €, pas \u20AC)

---

## VÉRIFICATION FINALE

- SALARY_RANGES_BY_ROLE existe dans references.js avec les 10 rôles (identifiants vérifiés)
- OTE_SPLIT_BY_ROLE existe avec 3 rôles sales
- acvTarget state dans Sprint.jsx, persisté dans savedState
- Arsenal bloc 5 conditionnel (currentSalary > 0)
- Champ ACV dans Arsenal (conditionnel : rôle sales)
- lib/generators/salary-comparison.js existe avec generateSalaryComparison exportée
- Le generator produit 4 blocs (position, OTE, recommandation, argument)
- Livrable "Comparatif salarial" dans l'Établi onglet interne
- Audit ch17 branché sur le livrable
- Aucun generator existant modifié
- Le build passe sans erreur
- Le smoke test passe sans régression

---

## COMMIT

```
feat: salary comparison — market position + OTE/ACV + negotiation deliverable

- lib/sprint/references.js: SALARY_RANGES_BY_ROLE (10 roles × P25/P50/P75) + OTE_SPLIT_BY_ROLE (3 sales roles)
- lib/generators/salary-comparison.js: generateSalaryComparison (4 blocs: position, OTE, recommendation, ready-made argument)
- Arsenal.jsx: bloc 5 salary diagnostic (conditional on currentSalary) + ACV input field (sales roles)
- Sprint.jsx: acvTarget state persisted in savedState
- panels.jsx: "Comparatif salarial" deliverable in internal tab
- Sources cited: Robert Half, Hays, Michael Page 2025
- Zero modification to existing generators or audit modules

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge feat-salary-comparison --no-ff -m "feat: salary comparison — market position + OTE/ACV + negotiation deliverable"
npm run smoke
```
