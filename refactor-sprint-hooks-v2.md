# PROMPT CLAUDE CODE — REFACTOR: Extract Signature, Duel, Offers hooks from Sprint.jsx
## Deuxième vague d'extraction de hooks — Sprint.jsx de ~1000 lignes à ~500

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Tous les chantiers (1–21) + fix + refactor-split-generators + refactor-sprint-hooks mergés. Sprint.jsx utilise déjà 3 hooks custom (usePersistence, useBrewNotif, useBricks) dans components/sprint/hooks/. Ce refactoring extrait 3 hooks supplémentaires. Zéro changement de comportement.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b refactor-sprint-hooks-v2
```

---

## CONTEXTE

Sprint.jsx fait encore ~1000 lignes après la première extraction. Trois blocs de logique restent intriqués avec l'orchestrateur : Signature (~190 lignes, 4+ fonctions, state dédié + refs), Duel (~80 lignes, 3 fonctions), Offers (~60 lignes, 4 fonctions). Les extraire dans des hooks custom réduit Sprint.jsx à ~500 lignes d'orchestration pure. Un dev senior lit 500 lignes sans grimacer.

---

## CE QUE TU FAIS (5 opérations)

### Opération 1 — Lire l'existant

Lis ces fichiers AVANT de modifier quoi que ce soit :

1. `components/Sprint.jsx` — identifie pour chaque bloc :
   - **Signature** : toutes les variables de state (signature, sigScreen, sigResponse, sigFormulation, sigValidationError + refs), les useEffects liés (seuil de déclenchement ~L582-592), les fonctions handleSig* (4+), renderSignatureOverlay. Note les dépendances : quelles props de bricks/vault/cauchemars sont nécessaires.
   - **Duel** : variables de state (duelResults, duelQRef), fonctions (buildDuelQuestions, handleDuelComplete, handleDuelRedo). Note les dépendances : quelles données de bricks/targetRoleId sont nécessaires.
   - **Offers** : variables de state (parsedOffers, offersArray, offerNextId, obsoleteDeliverables), useEffects (eclaireur ~L241-266, cauchemars ~L269-274), fonctions (recalcOffersSignals, handleAddOffer, handleRemoveOffer, markDeliverablesObsolete). Note les dépendances.

2. `components/sprint/hooks/useBricks.js` — note si des variables de Signature, Duel, ou Offers sont déjà dans ce hook. Ne pas créer de doublons.

3. `lessons.md` — lis les règles. En particulier : pas de dépendances circulaires entre hooks.

Rapporte tes findings sous forme de tableau :

| Hook | Variables de state | useEffects | Fonctions | Dépendances externes | Lignes approx |
|---|---|---|---|---|---|

STOP ici. Rapporte avant de coder. Je confirme.

### Opération 2 — Créer useSignature.js

Fichier : `components/sprint/hooks/useSignature.js`

```javascript
/**
 * Manages Signature detection and overlay lifecycle.
 * Triggers at 3 armored bricks × 2+ different cauchemars.
 * 3 screens: raw words → behavioral pattern → archetype.
 * @param {Array} bricks - validated bricks
 * @param {object} vault - vault with cauchemars, signature data
 * @param {Array} cauchemars - active cauchemars
 * @returns {{ signature, sigScreen, sigResponse, sigFormulation, sigValidationError, handleSig*, renderSignatureOverlay }}
 */
export function useSignature(bricks, vault, cauchemars) { ... }
```

Contient :
- Tous les state variables Signature
- Toutes les refs Signature
- Le useEffect de déclenchement (seuil 3 briques blindées × 2 cauchemars)
- Les 4+ fonctions handleSig*
- renderSignatureOverlay (la fonction de rendu de l'overlay)

Note : renderSignatureOverlay est une fonction qui retourne du JSX. Elle vit dans le hook. Sprint.jsx l'appelle dans son return : `{signature && renderSignatureOverlay()}`. C'est un pattern React valide.

### Opération 3 — Créer useDuel.js

Fichier : `components/sprint/hooks/useDuel.js`

```javascript
/**
 * Manages Duel (stress test) lifecycle.
 * Builds questions from bricks × ATMT, handles completion and redo.
 * @param {Array} bricks - validated bricks
 * @param {string} targetRoleId - target role
 * @param {Array} cauchemars - active cauchemars
 * @returns {{ duelResults, duelQRef, buildDuelQuestions, handleDuelComplete, handleDuelRedo }}
 */
export function useDuel(bricks, targetRoleId, cauchemars) { ... }
```

Contient :
- duelResults, duelQRef state/ref
- buildDuelQuestions
- handleDuelComplete
- handleDuelRedo

### Opération 4 — Créer useOffers.js

Fichier : `components/sprint/hooks/useOffers.js`

```javascript
/**
 * Manages dynamic offers: parsing, adding, removing, obsolete tracking.
 * Reads eclaireur_data from sessionStorage on mount.
 * @param {string} targetRoleId - target role
 * @returns {{ parsedOffers, offersArray, offerNextId, obsoleteDeliverables, handleAddOffer, handleRemoveOffer, recalcOffersSignals, markDeliverablesObsolete }}
 */
export function useOffers(targetRoleId) { ... }
```

Contient :
- parsedOffers, offersArray, offerNextId, obsoleteDeliverables state
- Le useEffect eclaireur (sessionStorage → parsed offers)
- Le useEffect cauchemars (recalc quand offres changent)
- recalcOffersSignals, handleAddOffer, handleRemoveOffer, markDeliverablesObsolete

### Opération 5 — Simplifier Sprint.jsx

Sprint.jsx compose les 6 hooks :

```javascript
export default function Sprint({ user }) {
  var persistence = usePersistence(user);
  var bricks = useBricks(persistence.savedState, persistence.saveState);
  var offers = useOffers(bricks.targetRoleId);
  var duel = useDuel(bricks.bricks, bricks.targetRoleId, offers.cauchemars);
  var signature = useSignature(bricks.bricks, bricks.vault, offers.cauchemars);
  var brew = useBrewNotif(user, bricks.densityScore, bricks.isSubscribed);

  // Le reste : UI orchestration, screen routing, props aux enfants
  return ( ... );
}
```

Sprint.jsx ne contient plus de logique Signature, Duel, ou Offers. Uniquement l'orchestration UI : screen routing, rendu conditionnel, props distribuées aux composants enfants.

**NOTE : les dépendances entre hooks sont unidirectionnelles :**
- usePersistence → ne dépend de rien (sauf user)
- useBricks → dépend de usePersistence
- useOffers → dépend de targetRoleId (via useBricks)
- useDuel → dépend de bricks + targetRoleId + cauchemars
- useSignature → dépend de bricks + vault + cauchemars
- useBrewNotif → dépend de user + densityScore + isSubscribed

Si tu trouves une dépendance circulaire, STOP. Rapporte. On arbitre.

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies aucune logique. Le comportement est identique.
- Tu ne modifies pas panels.jsx, Interrogation.jsx, Duel.jsx, ou les generators.
- Tu ne modifies pas les 3 hooks existants (usePersistence, useBrewNotif, useBricks) sauf pour supprimer du code qui migre vers les nouveaux hooks.
- Tu ne modifies pas la structure du state (savedState reste un JSONB).
- Tu ne crées pas de Context ou de Redux.
- Tu ne changes pas l'ordre d'exécution des useEffects.
- Tu ne touches pas au guard auth dans page.js.
- Tu n'ajoutes pas de dépendance npm.

---

## TESTS MANUELS

1. npm run build — le build passe.
2. npm run smoke — 169 tests, 0 régressions.
3. Ouvre localhost:3000/sprint en mode dev. Crée un compte test.
4. Ajoute 3 briques avec des chiffres. Vérifie que la Signature se déclenche au bon seuil (3 briques blindées × 2 cauchemars).
5. Lance le Duel. Réponds aux questions. Vérifie que le score s'affiche.
6. Colle une offre (si sessionStorage eclaireur_data). Vérifie que les cauchemars de l'offre apparaissent.
7. Ajoute une offre manuellement dans la Forge. Vérifie que les livrables sont marqués obsolètes.
8. Ouvre l'Établi. Génère un CV. Vérifie que le livrable s'affiche normalement.

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

- `ls components/sprint/hooks/` → 6 fichiers (usePersistence, useBrewNotif, useBricks, useSignature, useDuel, useOffers)
- Sprint.jsx < 600 lignes
- Sprint.jsx compose les 6 hooks en tête de fonction
- Aucune logique Signature dans Sprint.jsx (grep handleSig → 0 résultats hors appels)
- Aucune logique Duel dans Sprint.jsx (grep buildDuelQuestions → 0 résultats hors appels)
- Aucune logique Offers dans Sprint.jsx (grep recalcOffersSignals → 0 résultats hors appels)
- renderSignatureOverlay vit dans useSignature.js
- Aucune dépendance circulaire entre hooks
- Le build passe sans erreur (`npm run build`)
- `npm run smoke` → 0 régressions

---

## COMMIT

```
refactor: extract Signature, Duel, Offers hooks from Sprint.jsx

- useSignature: detection threshold + 3-screen overlay + validation
- useDuel: question building + completion + redo
- useOffers: dynamic offers parsing + obsolete tracking
- Sprint.jsx reduced from ~1000 to ~500 lines (pure orchestration)
- 6 hooks total, zero circular dependencies

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge refactor-sprint-hooks-v2 --no-ff -m "refactor: Sprint.jsx — extract Signature, Duel, Offers hooks"
```
