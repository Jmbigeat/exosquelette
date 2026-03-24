# PROMPT CLAUDE CODE — REFACTOR: Extract hooks from Sprint.jsx
## Extraire les hooks custom de Sprint.jsx pour séparer les responsabilités

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Tous les chantiers (1–21) + tous les fix mergés. Le refactor-split-generators est mergé (ou en cours). Ce refactoring ne change aucun comportement. Il extrait de la logique dans des hooks custom.

IMPORTANT : exécute ce prompt APRÈS le refactor generators. Pas en parallèle.

---

## BRANCHE

```bash
git checkout -b refactor-sprint-hooks
```

---

## CONTEXTE

Sprint.jsx est l'orchestrateur de la Forge. Il fait trois jobs en même temps : state management (briques, densité, pièces, abonnement), persistance (Supabase fetch/save, localStorage backup, retry), et UI (rendu des panels, navigation entre étapes). Les useEffects s'enchaînent et créent des dépendances implicites. La race condition localStorage (corrigée le 10 mars) en est un symptôme.

Le refactoring extrait la logique dans des hooks custom. Sprint.jsx reste l'orchestrateur qui compose les hooks. Chaque hook gère une responsabilité. Les hooks vivent dans un dossier dédié.

---

## CE QUE TU FAIS (5 opérations)

### Opération 1 — Lire l'existant

Lis `components/Sprint.jsx` en entier. Identifie et regroupe les blocs de logique par responsabilité :

1. **Auth** : lecture du user, vérification session, redirect si non connecté. Note les variables : user, isSubscribed.
2. **Persistance** : sauvegarde Supabase, retry 3×, backup localStorage, sync au montage, indicateur "✓ Sauvegardé". Note les variables : savedState, setSavedState, le useEffect de sauvegarde, le useEffect de chargement.
3. **Brew notifications** : fetch isWeekDeclared + loadBrewInstructions, state brewNotif. Note le useEffect conditionnel (densityScore >= 70 ET isSubscribed).
4. **Briques** : handleForge, handleCorrect, handleDelete, la logique de seed, le state des briques. Note les dépendances entre handleForge et la persistance.
5. **UI orchestration** : ce qui reste. Le rendu, les props passées aux enfants, la navigation.

Rapporte tes findings sous forme de tableau :

| Responsabilité | Variables de state | useEffects | Fonctions | Lignes approximatives |
|---|---|---|---|---|

Ce tableau dicte la découpe en hooks.

### Opération 2 — Créer le dossier hooks

Crée `components/sprint/hooks/`.

### Opération 3 — Extraire les hooks

Crée un hook par responsabilité. Chaque hook :
- Vit dans `components/sprint/hooks/`
- Exporte une seule fonction (le hook)
- Retourne un objet avec les valeurs et fonctions nécessaires
- A un JSDoc

**Hook 1 : usePersistence.js**

Gère la sauvegarde et le chargement des données Forge.

```javascript
/**
 * Handles Supabase persistence with retry and localStorage fallback.
 * @param {object} user - authenticated user ({ id, email })
 * @returns {{ savedState, setSavedState, saveState, isSaving, lastSaved }}
 */
export function usePersistence(user) { ... }
```

Contient :
- Le lazy initializer useState pour localStorage (fix race condition du 10 mars)
- Le useEffect de chargement depuis Supabase (avec guard user.id === "dev")
- La fonction saveState avec retry 3× + backup localStorage
- L'indicateur "✓ Sauvegardé"

**Hook 2 : useBrewNotif.js**

Gère les notifications Brew.

```javascript
/**
 * Fetches Brew notification state (week declared, pending instructions).
 * Only runs when density >= 70 and user is subscribed.
 * @param {object} user
 * @param {number} densityScore
 * @param {boolean} isSubscribed
 * @returns {{ brewNotif }}
 */
export function useBrewNotif(user, densityScore, isSubscribed) { ... }
```

Contient :
- Le useEffect conditionnel avec isWeekDeclared + loadBrewInstructions
- Le state brewNotif
- Le .catch(function() {}) silencieux

**Hook 3 : useBricks.js**

Gère la logique métier des briques.

```javascript
/**
 * Manages brick lifecycle: forge, correct, delete.
 * @param {object} savedState - current persisted state
 * @param {function} saveState - persistence function from usePersistence
 * @returns {{ bricks, handleForge, handleCorrect, handleDelete, densityScore, ... }}
 */
export function useBricks(savedState, saveState) { ... }
```

Contient :
- handleForge (avec structuredFields)
- handleCorrect (SANS structuredFields — cf. lessons.md)
- handleDelete
- Le calcul de densityScore
- Le state des briques

**NOTE IMPORTANTE** : les dépendances entre hooks sont unidirectionnelles :
- usePersistence ne dépend de rien (sauf user)
- useBricks dépend de usePersistence (savedState, saveState)
- useBrewNotif dépend de useBricks (densityScore) et de user

Si tu trouves des dépendances circulaires, STOP. Rapporte-les. On arbitre.

### Opération 4 — Simplifier Sprint.jsx

Sprint.jsx compose les hooks :

```javascript
export default function Sprint({ user }) {
  var persistence = usePersistence(user);
  var bricks = useBricks(persistence.savedState, persistence.saveState);
  var brew = useBrewNotif(user, bricks.densityScore, bricks.isSubscribed);

  // Le reste : rendu UI, props aux enfants
  return ( ... );
}
```

Sprint.jsx ne contient plus de useEffect directement (sauf ceux liés au rendu UI pur, comme le scroll ou le focus). Toute la logique est dans les hooks.

### Opération 5 — Vérifier les dépendances

```bash
grep -rn "from.*Sprint" components/ --include='*.jsx'
```

Aucun composant enfant n'importe Sprint.jsx directement (les enfants reçoivent des props). Mais vérifie que page.js importe toujours Sprint correctement.

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies aucune logique. Le comportement est identique.
- Tu ne modifies pas panels.jsx, Interrogation.jsx, Duel.jsx, ou les generators.
- Tu ne modifies pas la structure du state (savedState reste un JSONB).
- Tu ne crées pas de Context ou de Redux. Les hooks communiquent par props.
- Tu ne changes pas l'ordre d'exécution des useEffects. L'ordre dans Sprint.jsx dicte l'ordre dans les hooks.
- Tu ne touches pas au guard auth dans page.js.
- Tu ne touches pas au commentaire ligne 371 (structuredFields correction path).
- Tu n'ajoutes pas de dépendance npm.

---

## TESTS MANUELS

1. npm run build — le build passe.
2. npm run smoke — 169 tests, 0 régressions.
3. Ouvre localhost:3000/sprint en mode dev. Les briques persistent au refresh (fix localStorage vérifié).
4. Crée une brique. Vérifie que "✓ Sauvegardé" apparaît.
5. Ouvre l'Établi. Génère un CV. Vérifie que le livrable s'affiche.
6. Si densityScore >= 70 et isSubscribed : vérifie que la notification Brew apparaît (ou n'apparaît pas si semaine déclarée).
7. Corrige une brique existante. Vérifie que le texte corrigé est bien sauvegardé (pas l'ancien).

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

- `ls components/sprint/hooks/` → usePersistence.js, useBrewNotif.js, useBricks.js
- Sprint.jsx ne contient plus de useEffect de persistance ou de Brew
- Sprint.jsx compose les 3 hooks en tête de fonction
- Le lazy initializer useState (fix race condition) est dans usePersistence.js
- Le guard structuredFields correction (commentaire ligne 371) est préservé dans useBricks ou Interrogation.jsx (là où il vit)
- Aucune dépendance circulaire entre hooks
- Le build passe sans erreur (`npm run build`)
- `npm run smoke` → 0 régressions

---

## COMMIT

```
refactor: extract custom hooks from Sprint.jsx

- usePersistence: Supabase save/load + retry + localStorage fallback
- useBrewNotif: conditional Brew notification fetch
- useBricks: brick lifecycle (forge, correct, delete) + density scoring
- Sprint.jsx becomes a thin orchestrator composing 3 hooks
- Zero behavior change

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge refactor-sprint-hooks --no-ff -m "refactor: extract custom hooks from Sprint.jsx"
```
