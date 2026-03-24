# PROMPT CLAUDE CODE — REFACTOR: Split generators.js
## Extraire chaque generator dans son propre fichier sous lib/generators/

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Tous les chantiers (1–21) + tous les fix mergés. 169 smoke tests. Ce refactoring ne change aucun comportement. Il déplace du code.

---

## BRANCHE

```bash
git checkout -b refactor-split-generators
```

---

## CONTEXTE

lib/sprint/generators.js contient 14+ generators dans un seul fichier de 2000+ lignes. Le fichier est impossible à naviguer. Chaque generator est une fonction exportée autonome. Ils partagent des helpers internes (extractBrickCore, cleanRedac, etc.). Le refactoring extrait chaque generator dans son propre fichier. Un fichier index.js réexporte tout. Les imports existants ne cassent pas.

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire l'existant

Lis `lib/sprint/generators.js` en entier. Note :

1. La liste complète des fonctions exportées (chaque export = un generator ou un helper).
2. Les fonctions internes NON exportées (helpers partagés entre generators : extractBrickCore, buildStructuredFields, et tout autre helper).
3. Les imports en tête de fichier (quels modules generators.js importe).
4. Les dépendances entre generators : est-ce qu'un generator appelle un autre generator ? Probablement non, mais vérifie.

Lis ensuite tous les fichiers qui importent depuis generators.js :

```bash
grep -rn "from.*generators" components/ lib/ app/ --include='*.js' --include='*.jsx'
```

Note chaque import et quelles fonctions sont importées. Ce sont les contrats à préserver.

Rapporte tes findings AVANT de coder :
- Nombre de generators exportés
- Nombre de helpers internes
- Liste des fichiers qui importent depuis generators.js
- Dépendances croisées entre generators (s'il y en a)

### Opération 2 — Créer la structure lib/generators/

Crée le dossier `lib/generators/`.

Pour chaque helper interne partagé (extractBrickCore, etc.), crée un fichier :
- `lib/generators/helpers.js` — contient TOUS les helpers internes. Exporte chacun en named export.

Pour chaque generator exporté, crée un fichier :
- `lib/generators/generate-cv.js` — contient generateCV
- `lib/generators/generate-bio.js` — contient generateBio
- `lib/generators/generate-contact-scripts.js` — contient generateContactScripts
- etc. (un fichier par generator)

Chaque fichier generator :
1. Importe les helpers depuis `./helpers.js`
2. Importe les modules externes dont il a besoin (references.js, scoring.js, etc.)
3. Exporte la fonction generator en named export

Convention de nommage : kebab-case pour les fichiers, camelCase pour les fonctions. Le nom du fichier correspond au nom de la fonction (generateCV → generate-cv.js).

### Opération 3 — Créer l'index de réexport

Fichier : `lib/generators/index.js`

```javascript
/**
 * Re-exports all generators and helpers.
 * Drop-in replacement for the former lib/sprint/generators.js monolith.
 */
export { extractBrickCore } from './helpers.js';
export { generateCV } from './generate-cv.js';
export { generateBio } from './generate-bio.js';
// ... un export par generator
```

Chaque fonction exportée par l'ancien generators.js est réexportée par l'index. Le contrat est identique.

### Opération 4 — Mettre à jour les imports

Chaque fichier qui importait depuis `lib/sprint/generators.js` ou `../../lib/sprint/generators` doit maintenant importer depuis `lib/generators/index.js` (ou le chemin relatif équivalent).

Deux stratégies possibles :
- A) Transformer l'ancien `lib/sprint/generators.js` en un fichier qui réexporte tout depuis `lib/generators/index.js`. ZÉRO changement dans les fichiers consommateurs.
- B) Mettre à jour chaque import.

**Choisis la stratégie A.** C'est la plus sûre. L'ancien fichier devient un proxy :

```javascript
// lib/sprint/generators.js — proxy vers le nouveau dossier
export * from '../generators/index.js';
```

Tous les imports existants continuent de fonctionner sans modification.

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies aucune logique de generator. Zéro changement de comportement.
- Tu ne renommes aucune fonction.
- Tu ne changes aucune signature.
- Tu ne supprimes pas lib/sprint/generators.js — il devient un proxy.
- Tu ne modifies pas les tests.
- Tu ne modifies pas les composants (Sprint.jsx, panels.jsx, etc.).
- Tu ne modifies pas les prompts IA dans les generators.
- Tu n'ajoutes pas de dépendance npm.

---

## TESTS MANUELS

1. npm run build — le build passe.
2. npm run smoke — 169 tests, 0 régressions.
3. Ouvre localhost:3000/sprint. Crée une brique. Ouvre l'Établi. Génère un CV. Vérifie que le livrable s'affiche normalement.
4. Génère un script de contact. Vérifie qu'il s'affiche normalement.
5. Génère des posts LinkedIn. Vérifie qu'ils s'affichent avec le score hook et le premier commentaire.

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

- `ls lib/generators/` → un fichier par generator + helpers.js + index.js
- `grep -rn "from.*sprint/generators" components/ lib/ app/` → tous les imports passent par le proxy ou l'index
- Chaque fichier generator importe ses helpers depuis ./helpers.js
- `lib/sprint/generators.js` existe toujours et réexporte via `export * from '../generators/index.js'`
- Aucune fonction exportée n'a changé de nom ou de signature
- extractBrickCore est dans helpers.js avec le fast path brick.fields.result
- Le build passe sans erreur (`npm run build`)
- `npm run smoke` → 0 régressions

---

## COMMIT

```
refactor: split generators.js into individual files under lib/generators/

- Extract each generator into its own file (generate-cv.js, generate-bio.js, etc.)
- Shared helpers (extractBrickCore, etc.) in helpers.js
- index.js re-exports all functions
- lib/sprint/generators.js becomes a proxy (export * from '../generators/index.js')
- Zero behavior change, zero signature change

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge refactor-split-generators --no-ff -m "refactor: split generators.js into lib/generators/"
```
