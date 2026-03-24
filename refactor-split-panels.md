# PROMPT CLAUDE CODE — REFACTOR: Split panels.jsx into WorkBench + Arsenal
## Séparer l'Établi et l'Arsenal en deux composants distincts

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Tous les chantiers (1–21) + fix + refactorings (generators split, Sprint hooks v1 + v2) mergés. Ce refactoring sépare panels.jsx (800+ lignes, 2 responsabilités) en deux composants. Zéro changement de comportement.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b refactor-split-panels
```

---

## CONTEXTE

panels.jsx rend deux overlays distincts : l'Établi (WorkBench — livrables calibrés) et l'Arsenal (GPS des écarts — radar + next action + simulation). Les deux partagent le même fichier de 800+ lignes. Un dev senior ouvre panels.jsx et doit scroller 400 lignes d'Établi pour trouver l'Arsenal. Chaque composant a sa propre logique, ses propres props, ses propres états internes. Ils n'ont aucune raison de vivre dans le même fichier.

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire l'existant

Lis `components/sprint/panels.jsx` en entier. Identifie :

1. **Établi (WorkBench)** : où commence-t-il, où finit-il ? Quelles fonctions et variables de state sont exclusives à l'Établi ? Quels sont les onglets (Externe, Interne) ? Comment chaque livrable est rendu ? Quelles props reçoit-il de Sprint.jsx ?

2. **Arsenal** : où commence-t-il, où finit-il ? Quelles fonctions et variables de state sont exclusives à l'Arsenal ? Radar, next action, simulation — comment sont-ils rendus ? Quelles props reçoit-il de Sprint.jsx ?

3. **Code partagé** : y a-t-il des fonctions ou du state utilisés par les DEUX composants ? Si oui, ces fonctions vivent dans un fichier helpers partagé ou sont dupliquées (on choisira).

4. **Sprint.jsx** : comment Sprint.jsx rend panels.jsx actuellement ? Identifie l'import, le rendu conditionnel (etabliOpen, arsenalOpen), et les props passées.

Rapporte tes findings :

| Composant | Lignes début-fin | State propre | Props reçues | Fonctions propres |
|---|---|---|---|---|

STOP ici. Rapporte avant de coder. Je confirme.

### Opération 2 — Créer WorkBench.jsx

Fichier : `components/sprint/WorkBench.jsx`

```javascript
/**
 * Établi — Calibrated deliverables by channel and audience.
 * Two tabs: External (CV, DM, email, bio, posts, followup, interview) 
 * and Internal (replacement cost report, raise arguments, 90-day plan).
 * Each deliverable: generate button + audit + copy.
 * @param {object} props - bricks, vault, targetRoleId, cauchemars, isSubscribed, etc.
 */
export default function WorkBench(props) { ... }
```

Contient :
- Tout le code de l'Établi extrait de panels.jsx
- Les onglets Externe / Interne
- La logique de génération par livrable (handleGenerate)
- Les boutons Copier
- L'audit ch17 par livrable
- Le state interne (onglet actif, livrable sélectionné, etc.)

### Opération 3 — Créer Arsenal.jsx

Fichier : `components/sprint/Arsenal.jsx`

```javascript
/**
 * Arsenal — GPS of gaps. Radar + next action + simulation.
 * Shows density breakdown, cauchemar coverage, effort estimation.
 * Available from Assemblage stage onward.
 * @param {object} props - bricks, vault, densityScore, cauchemars, targetRoleId, etc.
 */
export default function Arsenal(props) { ... }
```

Contient :
- Tout le code de l'Arsenal extrait de panels.jsx
- Le radar de densité
- La next action recommandée
- La simulation (quel impact si le candidat ajoute une brique sur tel axe)
- Le state interne propre à l'Arsenal

### Opération 4 — Mettre à jour les imports

**Deux stratégies possibles :**

A) panels.jsx devient un wrapper mince qui importe et rend WorkBench et Arsenal. Sprint.jsx ne change pas.

B) Sprint.jsx importe directement WorkBench et Arsenal. panels.jsx est supprimé.

**Choisis la stratégie A.** Plus sûre. Zéro changement dans Sprint.jsx.

```javascript
// components/sprint/panels.jsx — wrapper
import WorkBench from './WorkBench.jsx';
import Arsenal from './Arsenal.jsx';

export function WorkBenchOverlay(props) {
  return <WorkBench {...props} />;
}

export function ArsenalOverlay(props) {
  return <Arsenal {...props} />;
}
```

Les exports de panels.jsx gardent le même nom. Sprint.jsx ne voit aucune différence.

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies aucune logique de génération de livrables.
- Tu ne modifies pas les generators.
- Tu ne modifies pas Sprint.jsx (stratégie A — wrapper).
- Tu ne modifies pas l'audit ch17.
- Tu ne modifies pas les hooks (usePersistence, useBrewNotif, useBricks, useSignature, useDuel, useOffers).
- Tu ne modifies pas le Brew, l'Éclaireur, l'Onboarding, ou le Duel.
- Tu ne changes pas l'UI. Le rendu visuel est identique.
- Tu ne crées pas de Context ou de Redux.
- Tu n'ajoutes pas de dépendance npm.
- Si du code est partagé entre WorkBench et Arsenal, extrais-le dans un fichier `components/sprint/panel-helpers.js`. Ne le duplique pas.

---

## TESTS MANUELS

1. npm run build — le build passe.
2. npm run smoke — 169 tests, 0 régressions.
3. Ouvre localhost:3000/sprint. Ouvre l'Établi. Vérifie que les deux onglets (Externe, Interne) s'affichent.
4. Génère un CV dans l'onglet Externe. Vérifie que le livrable s'affiche. Copier fonctionne.
5. Génère un plan 90 jours dans l'onglet Interne. Vérifie que le livrable s'affiche.
6. Ferme l'Établi. Ouvre l'Arsenal. Vérifie que le radar de densité s'affiche.
7. Vérifie que la next action recommandée s'affiche.
8. Ferme l'Arsenal. Rouvre l'Établi. Le state interne (onglet actif) est préservé.

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

- `ls components/sprint/` → WorkBench.jsx, Arsenal.jsx, panels.jsx (wrapper)
- WorkBench.jsx contient toute la logique Établi
- Arsenal.jsx contient toute la logique Arsenal
- panels.jsx < 30 lignes (wrapper + exports)
- `grep -rn "from.*panels" components/ app/` → tous les imports fonctionnent via le wrapper
- Aucune duplication de code entre WorkBench et Arsenal (code partagé dans panel-helpers.js si nécessaire)
- Le build passe sans erreur (`npm run build`)
- `npm run smoke` → 0 régressions

---

## COMMIT

```
refactor: split panels.jsx into WorkBench.jsx + Arsenal.jsx

- WorkBench: Établi with External/Internal tabs, deliverable generation, audit, copy
- Arsenal: density radar, next action, simulation
- panels.jsx becomes a thin wrapper (re-exports both components)
- Zero behavior change, zero Sprint.jsx modification
- Shared helpers in panel-helpers.js if needed

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge refactor-split-panels --no-ff -m "refactor: split panels.jsx into WorkBench + Arsenal"
```
