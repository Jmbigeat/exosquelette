# PROMPT CLAUDE CODE — FEAT 16l : Filtre anti-pattern Arsenal
## Alerter quand une brique est blindée 4/4 mais hors Signature

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-16l-filtre-antipattern
```

---

## CONTEXTE

Le candidat forge des briques. Le Blindage teste 4 cases (Chiffre, Décision, Influence, Transférabilité). Une brique blindée 4/4 est une preuve solide. La Signature capture le mode opératoire récurrent du candidat (détecté à 3 briques blindées × 2+ cauchemars).

Le problème : un candidat peut blinder une brique à 4/4 sur une compétence qui n'est PAS dans sa Signature. Exemple : un candidat enterprise_ae dont la Signature est "restructurer des pipelines en crise" blinde une brique sur "formation de juniors." La brique est solide (4/4). Mais elle ne nourrit pas la Signature. Le candidat investit du temps à perfectionner une preuve qui ne renforce pas son positionnement.

C'est comme appuyer son échelle contre le mauvais mur. La brique est bien montée. Le mur est le mauvais.

L'Arsenal doit signaler ce décalage. Pas bloquer. Pas pénaliser. Signaler. Le candidat décide.

Source : Anti-Patterns Jeu Infini.

---

## OPÉRATION 0 — STATECHART

Ce chantier touche l'UI (ajout d'une alerte conditionnelle dans l'Arsenal). L'alerte est un élément visuel nouveau dans un composant existant.

Lis le code de l'Arsenal (components/sprint/Arsenal.jsx). Rapporte :

| État actuel | Ce qui est affiché | Condition d'affichage |
|-------------|--------------------|-----------------------|

L'alerte anti-pattern est un nouvel élément conditionnel : visible si (signature détectée) ET (au moins 1 brique 4/4 hors Signature).

STOP ici. Rapporte AVANT de coder. Je valide.

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire et comprendre les modules

Lis ces fichiers dans l'ordre :

1. `lib/sprint/signature.js` — note les fonctions existantes : hasReachedSignatureThreshold, computeMetaPatterns, crossReferenceSignature, validateSignatureFormulation, isSignatureArmored, applySignatureFilter. Identifie laquelle détermine si une brique "nourrit" la Signature. Note les paramètres et le retour.

2. `lib/sprint/scoring.js` — note assessBrickArmor. Comment le armorScore est calculé. Quel score = blindé 4/4 ?

3. `components/sprint/Arsenal.jsx` — note la structure des blocs existants (bloc 1 radar, bloc 2 next action, bloc 3 simulation, bloc 4 audit CV, bloc 5 comparatif salarial, bloc 6 LoC, bloc 7 séniorité). Note comment les blocs conditionnels sont affichés (conditions d'apparition, format).

4. `components/sprint/hooks/useSignature.js` — note comment la signature est exposée. Est-ce que le composant Arsenal a accès à l'objet signature et à ses metaPatterns ?

Rapporte :

| Question | Réponse |
|----------|---------|
| Fonction qui détermine si une brique nourrit la Signature | (nom, params, retour) |
| armorScore pour blindé 4/4 | (valeur) |
| L'Arsenal a-t-il accès à l'objet signature | (oui/non, comment) |
| Nombre de blocs actuels dans l'Arsenal | (N) |

STOP ici. Rapporte avant de coder. La méthode de détection dépend de l'existence d'une fonction "brique nourrit Signature."

### Opération 2 — Créer la fonction de détection

**Scénario A — applySignatureFilter ou equivalent existe**

Si une fonction teste déjà si une brique est "dans" la Signature (par metaPatterns, par cauchemars communs, par mots-clés), l'utiliser directement.

```javascript
function detectOrphanArmoredBricks(bricks, signature) {
  if (!signature || !signature.formulation) return [];
  
  var armored = bricks.filter(function(b) {
    return b.status === "validated" && (b.armorScore || 0) >= 4;
  });
  
  return armored.filter(function(b) {
    return !brickFeedsSignature(b, signature); // utiliser la fonction existante
  });
}
```

**Scénario B — aucune fonction de matching brique↔Signature n'existe**

Créer une heuristique basée sur les metaPatterns de la Signature :

```javascript
function brickFeedsSignature(brick, signature) {
  if (!signature.metaPatterns || signature.metaPatterns.length === 0) return true; // pas de patterns = pas de filtre
  
  var text = (brick.editText || "").toLowerCase();
  
  // Vérifier si au moins 1 metaPattern de la Signature est présent dans la brique
  return signature.metaPatterns.some(function(pattern) {
    var keywords = pattern.toLowerCase().split(/\s+/);
    return keywords.some(function(kw) {
      return kw.length > 3 && text.indexOf(kw) !== -1;
    });
  });
}
```

Heuristique simple. Faux négatifs acceptables (une brique pertinente non détectée ne sera pas signalée comme orpheline = pas grave). Faux positifs à minimiser (une brique réellement dans la Signature signalée comme orpheline = confusant pour le candidat).

Placer la fonction dans `lib/sprint/signature.js` (c'est le module signature).

### Opération 3 — Ajouter l'alerte dans l'Arsenal

Dans Arsenal.jsx, après les blocs existants (ou après le bloc radar — position à déterminer en opération 0), ajouter un bloc conditionnel :

```jsx
{/* Bloc anti-pattern : briques blindées hors Signature (16l) */}
{signature && orphanBricks.length > 0 && (
  <div style={alertStyle}>
    <div style={alertTitleStyle}>Brique blindée, mauvais mur</div>
    <div style={alertTextStyle}>
      {orphanBricks.length === 1
        ? "1 brique est blindée 4/4 mais ne nourrit pas ta Signature."
        : orphanBricks.length + " briques sont blindées 4/4 mais ne nourrissent pas ta Signature."}
    </div>
    {orphanBricks.map(function(b, i) {
      return (
        <div key={i} style={orphanBrickStyle}>
          {(b.editText || "").substring(0, 80) + "..."}
        </div>
      );
    })}
    <div style={alertAdviceStyle}>
      Ces preuves sont solides. Mais elles ne renforcent pas ton positionnement principal. Tu peux les garder pour diversifier ou les reformuler vers ta Signature.
    </div>
  </div>
)}
```

Conditions d'affichage :
1. La Signature est détectée (signature !== null && signature.formulation).
2. Au moins 1 brique validée a un armorScore ≥ 4.
3. Au moins 1 de ces briques ne nourrit pas la Signature (detectOrphanArmoredBricks retourne un array non vide).

Si une des conditions est false → le bloc n'apparaît pas. Zéro alerte sans Signature. Zéro alerte si toutes les briques blindées nourrissent la Signature.

Style : fond sombre avec bordure jaune/orange (#f0a500). Pas rouge (ce n'est pas une erreur). Le jaune signale "attention, pas blocage."

### Opération 4 — Connecter l'Arsenal au calcul

Vérifier que l'Arsenal reçoit :
- `signature` (l'objet avec formulation + metaPatterns)
- `bricks` (toutes les briques)

Si signature n'est pas passée en props à Arsenal.jsx, l'ajouter. Remonter depuis Sprint.jsx ou depuis le hook useSignature.

Calculer orphanBricks dans l'Arsenal (ou via un useMemo si les briques sont nombreuses) :

```javascript
var orphanBricks = useMemo(function() {
  return detectOrphanArmoredBricks(bricks, signature);
}, [bricks, signature]);
```

---

## CE QUE TU NE FAIS PAS

- Tu ne bloques pas le candidat. L'alerte est informative. Zéro gate. Zéro pénalité.
- Tu ne modifies pas le scoring de densité. Les briques orphelines gardent leur armorScore.
- Tu ne modifies pas le Blindage.
- Tu ne modifies pas la détection de Signature (seuil, metaPatterns, overlay).
- Tu ne modifies pas les generators.
- Tu ne modifies pas Sprint.jsx sauf pour passer signature en props à Arsenal si nécessaire.
- Tu ne modifies pas les autres blocs de l'Arsenal.
- Tu ne crées pas de nouvelle route API.
- Tu ne crées pas de dépendance npm.
- Tu ne surfais pas le Blindage au candidat. L'alerte dit "ne nourrit pas ta Signature" (langage candidat), pas "armorScore 4 hors metaPatterns" (langage interne).

---

## TEXTE UI (français avec accents)

Titre alerte : "Brique blindée, mauvais mur"

Message singulier : "1 brique est blindée 4/4 mais ne nourrit pas ta Signature."
Message pluriel : "{N} briques sont blindées 4/4 mais ne nourrissent pas ta Signature."

Conseil : "Ces preuves sont solides. Mais elles ne renforcent pas ton positionnement principal. Tu peux les garder pour diversifier ou les reformuler vers ta Signature."

---

## TESTS MANUELS

1. `npm run build` — le build passe.
2. `npm run smoke` — 209+ tests, 0 régressions.
3. Crée un candidat avec Signature détectée ("je restructure les pipelines en crise"). Ajoute une brique blindée 4/4 sur "formation de juniors" (hors Signature). L'alerte "Brique blindée, mauvais mur" apparaît dans l'Arsenal avec la brique orpheline.
4. Même candidat. Ajoute une brique blindée 4/4 sur "pipeline restructuré de 400K€ à 1.2M€" (dans la Signature). L'alerte ne montre PAS cette brique. Elle ne montre que la brique orpheline.
5. Candidat SANS Signature détectée. Aucune alerte, même si une brique est 4/4. L'alerte dépend de la Signature.
6. Candidat avec Signature mais 0 brique 4/4. Aucune alerte.

---

## SMOKE TESTS À AJOUTER

```javascript
// 16l — Filtre anti-pattern Arsenal
console.log("\n=== ANTI-PATTERN ORPHAN BRICKS SMOKE ===");

var { detectOrphanArmoredBricks } = require("../lib/sprint/signature.js");
// ou import selon le format

assert("detectOrphanArmoredBricks exists", typeof detectOrphanArmoredBricks === "function");

// Brique 4/4 hors Signature → orpheline
var sigObj = { formulation: "je restructure les pipelines en crise", metaPatterns: ["pipeline", "restructurer", "crise"] };
var orphanBrick = { status: "validated", armorScore: 4, editText: "J'ai formé 5 juniors en 3 mois sur les process qualité" };
var result = detectOrphanArmoredBricks([orphanBrick], sigObj);
assert("orphan brick detected", result.length === 1);

// Brique 4/4 dans Signature → pas orpheline
var alignedBrick = { status: "validated", armorScore: 4, editText: "Pipeline restructuré de 400K à 1.2M en 4 mois" };
var result2 = detectOrphanArmoredBricks([alignedBrick], sigObj);
assert("aligned brick not orphan", result2.length === 0);

// Pas de Signature → array vide (pas d'alerte)
var result3 = detectOrphanArmoredBricks([orphanBrick], null);
assert("no signature = no orphans", result3.length === 0);

// armorScore < 4 → pas orpheline (pas blindée)
var weakBrick = { status: "validated", armorScore: 2, editText: "J'ai formé 5 juniors" };
var result4 = detectOrphanArmoredBricks([weakBrick], sigObj);
assert("weak brick not orphan", result4.length === 0);
```

---

## VÉRIFICATION FINALE

```bash
grep -rn "detectOrphanArmoredBricks\|orphanBricks\|mauvais mur" lib/ components/
```

detectOrphanArmoredBricks dans lib/sprint/signature.js (définition) + Arsenal.jsx (consommation) + tests (vérification).
"mauvais mur" uniquement dans Arsenal.jsx (texte UI).

Le build passe (`npm run build`).
Les smoke tests passent (`node tests/smoke.mjs`).
