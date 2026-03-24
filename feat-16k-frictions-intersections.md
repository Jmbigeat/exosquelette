# PROMPT CLAUDE CODE — FEAT 16k : Questions Frictions/Intersections (briques élastiques)
## Enrichir le stress test avec 2 angles spécifiques aux briques élastiques

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-16k-frictions-intersections
```

---

## CONTEXTE

Le stress test actuel teste les 4 cases du Blindage sur toutes les briques (chiffre, décision, influence, transférabilité). Chaque brique reçoit les mêmes angles de test, quel que soit son type.

Les briques élastiques (brickType === "elastic") sont des compétences transférées d'un domaine à un autre (sport → management, cuisine → gestion de projet, musique → discipline). Elles ont un angle de vulnérabilité spécifique que les briques proof et cicatrice n'ont pas : la friction de transfert.

Le recruteur qui voit une brique élastique pense deux choses :

1. "Qu'est-ce qui NE se transfère PAS ?" (friction) — Le candidat qui dit "mon entraînement sportif m'a appris la discipline" doit savoir répondre à "qu'est-ce qui dans le sport ne s'applique pas au management ?" Le candidat lucide connaît les limites de son analogie. Le candidat naïf survend.

2. "Qu'est-ce que tu appliques sans y penser ?" (intersection) — Le candidat qui a une habitude transférée inconsciemment a une preuve plus forte que celui qui fait une analogie consciente. "Je chronomètre chaque tâche comme mes séries à la salle" est une intersection. "Le sport m'a appris la persévérance" est un cliché.

Ces 2 angles n'existent pas dans le stress test actuel. Les briques élastiques passent les mêmes questions que les briques proof. Le stress test ne teste pas la lucidité sur les limites du transfert.

Source : Jeu Infini — angles C (frictions) et E (intersections).

---

## OPÉRATION 0 — STATECHART

Ce chantier ne touche PAS l'UI. Il enrichit le contenu du stress test (generateStressTest dans les generators). Aucun état, aucune transition, aucun écran modifié. Opération 0 non applicable.

---

## CE QUE TU FAIS (3 opérations)

### Opération 1 — Lire et comprendre le stress test

Lis ces fichiers dans l'ordre :

1. Le generator du stress test (generateStressTest) — note sa signature, comment il choisit les angles, comment il formate les questions. Note si le brickType est accessible dans la fonction.
2. `lib/sprint/references.js` — cherche STRESS_ANGLES. Note les angles existants et leur format.
3. `components/sprint/Interrogation.jsx` — cherche BrickStressTest. Note comment le stress test est déclenché et affiché. Note si brickType est passé au stress test.

Rapporte :

| Question | Réponse |
|----------|---------|
| Signature de generateStressTest | (params, return type) |
| Angles existants (STRESS_ANGLES) | (liste des noms) |
| Le brickType est-il accessible dans generateStressTest | (oui/non, comment) |
| Format d'une question de stress test | (template, structure) |

STOP ici. Rapporte avant de coder. L'implémentation dépend de l'accès au brickType.

### Opération 2 — Ajouter les 2 angles conditionnels

**Dans STRESS_ANGLES (references.js)**, ajouter 2 entrées :

```javascript
{
  id: "friction",
  label: "Friction de transfert",
  condition: "elastic",  // ne s'applique qu'aux briques élastiques
  question: function(brick, core) {
    return "Tu transfères cette compétence de " +
      (core.contextLine || "ton domaine d'origine") +
      " vers le poste visé. Qu'est-ce qui NE se transfère PAS ? " +
      "Quel aspect de cette expérience est spécifique au contexte d'origine " +
      "et ne fonctionne pas dans le nouveau ?";
  },
  followUp: "Le recruteur teste ta lucidité. Un candidat qui connaît les limites de son analogie est crédible. Un candidat qui survend le transfert est suspect."
},
{
  id: "intersection",
  label: "Intersection cachée",
  condition: "elastic",
  question: function(brick, core) {
    return "Quelle habitude concrète de cette expérience appliques-tu " +
      "automatiquement dans ton travail, sans y penser ? " +
      "Pas une leçon que tu as tirée consciemment — " +
      "un réflexe que tu as importé sans le décider.";
  },
  followUp: "Une intersection inconsciente est plus forte qu'une analogie consciente. Le recruteur entend la différence entre 'le sport m'a appris la persévérance' (cliché) et 'je chronomètre chaque tâche comme mes séries' (preuve)."
}
```

**Format** : si STRESS_ANGLES est un tableau d'objets, ajouter les 2 objets avec un champ `condition`. Si STRESS_ANGLES est un tableau de strings, adapter le format (ajouter un wrapper ou une structure conditionnelle dans le generator).

Le champ `condition: "elastic"` permet au generator de filtrer : si la brique est élastique, inclure ces angles. Si la brique est proof ou cicatrice, les ignorer.

### Opération 3 — Modifier generateStressTest pour filtrer par brickType

Dans generateStressTest, après la sélection des angles :

```javascript
// Filtrer les angles conditionnels
var angles = STRESS_ANGLES.filter(function(angle) {
  if (!angle.condition) return true;  // angles universels : toujours inclus
  if (angle.condition === "elastic" && brick.brickType === "elastic") return true;
  return false;
});
```

Si le brickType n'est PAS accessible dans generateStressTest (vérifié en opération 1), deux options :

**Option A** : passer brickType comme paramètre supplémentaire (modifier la signature).

**Option B** : détecter le type élastique via le contenu de la brique (présence de marqueurs sport, hobby, activité extra-professionnelle dans editText). Heuristique acceptable en V1.

Privilégie l'option A si le brickType est déjà dans l'objet brick passé au generator.

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas les angles existants du stress test. Tu ajoutes 2 angles conditionnels.
- Tu ne modifies pas le Blindage, le scoring, la densité.
- Tu ne modifies pas l'UI du stress test (Interrogation.jsx). Le stress test affiche les questions quelle que soit leur source.
- Tu ne modifies pas les autres generators.
- Tu ne modifies pas Sprint.jsx, panels.jsx, WorkBench.jsx, Arsenal.jsx.
- Tu ne crées pas de nouvelle route API.
- Tu ne crées pas de dépendance npm.
- Tu ne surfais pas le Blindage au candidat.

---

## TEXTE UI (français avec accents)

Question friction : "Tu transfères cette compétence de {contexte} vers le poste visé. Qu'est-ce qui NE se transfère PAS ? Quel aspect de cette expérience est spécifique au contexte d'origine et ne fonctionne pas dans le nouveau ?"

Question intersection : "Quelle habitude concrète de cette expérience appliques-tu automatiquement dans ton travail, sans y penser ? Pas une leçon que tu as tirée consciemment — un réflexe que tu as importé sans le décider."

Follow-up friction : "Le recruteur teste ta lucidité. Un candidat qui connaît les limites de son analogie est crédible. Un candidat qui survend le transfert est suspect."

Follow-up intersection : "Une intersection inconsciente est plus forte qu'une analogie consciente. Le recruteur entend la différence entre 'le sport m'a appris la persévérance' (cliché) et 'je chronomètre chaque tâche comme mes séries' (preuve)."

---

## TESTS MANUELS

1. `npm run build` — le build passe.
2. `npm run smoke` — 199+ tests, 0 régressions.
3. Crée une brique élastique ("6h d'entraînement sportif par semaine pendant 3 ans"). Lance le stress test. Les questions friction et intersection apparaissent EN PLUS des questions standard.
4. Crée une brique proof ("pipeline restructuré de 400K€ à 1.2M€"). Lance le stress test. Les questions friction et intersection N'apparaissent PAS. Les questions standard sont présentes.
5. Crée une brique cicatrice. Même vérification : pas de friction/intersection.
6. 0 briques → pas de stress test. Pas d'erreur.

---

## SMOKE TESTS À AJOUTER

```javascript
// 16k — Frictions/Intersections briques élastiques
console.log("\n=== ELASTIC BRICK STRESS ANGLES SMOKE ===");

// Vérifier que les angles friction et intersection existent
var frictionAngle = references.STRESS_ANGLES.find(function(a) { return a.id === "friction"; });
var intersectionAngle = references.STRESS_ANGLES.find(function(a) { return a.id === "intersection"; });
assert("STRESS_ANGLES has friction angle", frictionAngle !== undefined);
assert("STRESS_ANGLES has intersection angle", intersectionAngle !== undefined);
assert("friction angle has condition elastic", frictionAngle.condition === "elastic");
assert("intersection angle has condition elastic", intersectionAngle.condition === "elastic");

// Vérifier que generateStressTest pour une brique élastique inclut friction
var elasticBrick = { status: "validated", brickType: "elastic", editText: "6h entraînement sportif par semaine pendant 3 ans", armorScore: 2 };
var elasticST = generators.generateStressTest(elasticBrick, "enterprise_ae", testCauchemars);
assert("stress test elastic includes friction", elasticST.indexOf("transfère") !== -1 || elasticST.indexOf("friction") !== -1);

// Vérifier que generateStressTest pour une brique proof N'inclut PAS friction
var proofBrick = { status: "validated", brickType: "proof", editText: "Pipeline restructuré de 400K à 1.2M en 4 mois", armorScore: 4 };
var proofST = generators.generateStressTest(proofBrick, "enterprise_ae", testCauchemars);
assert("stress test proof excludes friction", proofST.indexOf("NE se transfère PAS") === -1);
```

Adapter les imports et arguments selon la signature réelle de generateStressTest (vérifiée en opération 1).

---

## VÉRIFICATION FINALE

```bash
grep -rn "friction\|intersection\|condition.*elastic" lib/sprint/references.js lib/generators/
```

Les 2 angles apparaissent dans references.js (définition) et sont filtrés dans le generator du stress test (consommation).
Aucune brique non-élastique ne reçoit les questions friction/intersection.

Le build passe (`npm run build`).
Les smoke tests passent (`node tests/smoke.mjs`).
