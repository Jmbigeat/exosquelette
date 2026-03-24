# PROMPT CLAUDE CODE — FEAT 16n : Question parcours non linéaire
## Question conditionnelle dans generateInterviewQuestions si 3+ postes en < 5 ans

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-16n-parcours-non-lineaire
```

---

## CONTEXTE

Le candidat qui a changé 3+ fois de poste en moins de 5 ans reçoit la question "Pourquoi avez-vous changé si souvent ?" en entretien. C'est le pattern le plus fréquent chez les profils atypiques et les polymathes. Le recruteur voit de l'instabilité. Le candidat doit montrer un pattern de résolution de problèmes.

Actuellement, `generateInterviewQuestions` produit des questions calibrées par cauchemar × séniorité, mais ne détecte pas ce pattern de parcours. Le candidat reçoit les mêmes questions qu'un candidat à parcours linéaire.

Source : verbatim Emmanuel Moreau — "J'avais résolu les problèmes pour lesquels j'avais été embauché."

---

## CE QUE TU FAIS (3 opérations)

### Opération 1 — Lire et comprendre le code existant

Lis ces fichiers dans l'ordre :

1. `lib/sprint/generators.js` — trouve la fonction `generateInterviewQuestions`. Note ses paramètres, sa structure, et comment elle assemble les questions. Note le format de sortie (string ou array).
2. `lib/sprint/references.js` — vérifie s'il y a déjà des données de séniorité ou de parcours accessibles.
3. `components/sprint/Interrogation.jsx` — vérifie comment les briques sont stockées. Chaque brique a-t-elle un champ temporel (date, durée, entreprise) ? Ou le parcours est-il uniquement dans le profil/CV ?
4. `components/onboarding/OnboardingFlow.jsx` — vérifie si le profil candidat contient des données de parcours (nombre de postes, années d'expérience).

Rapporte :

| Question | Réponse |
|----------|---------|
| Signature de generateInterviewQuestions | (params, return type) |
| Données de parcours disponibles dans state | (quels champs, où) |
| Le candidat saisit-il ses postes précédents quelque part ? | (oui/non, où) |
| Les briques contiennent-elles un champ entreprise ou date ? | (oui/non) |

STOP ici. Rapporte avant de coder. La méthode de détection dépend des données disponibles.

### Opération 2 — Implémenter la détection du parcours non linéaire

Deux scénarios possibles selon l'opération 1 :

**Scénario A — Les briques contiennent des marqueurs d'entreprise ou de contexte différent**

Créer une fonction helper `detectNonLinearCareer(bricks)` dans le même fichier que generateInterviewQuestions (ou dans un helper existant si plus pertinent).

```javascript
/**
 * Détecte un parcours non linéaire : 3+ contextes professionnels distincts
 * identifiés dans les briques du candidat.
 * @param {Array} bricks - briques validées
 * @returns {{ isNonLinear: boolean, contexts: string[], count: number }}
 */
function detectNonLinearCareer(bricks) {
  // Extraire les contextes distincts depuis les briques
  // Un "contexte" = une entreprise, un secteur, ou un rôle différent
  // mentionné dans brick.editText ou brick.fields
  // ...
  return { isNonLinear: count >= 3, contexts, count };
}
```

Marqueurs à chercher dans `brick.editText` :
- Noms d'entreprise (mots avec majuscule suivis de contexte business)
- Changements de secteur (mots-clés sectoriels différents entre briques)
- Changements de rôle (titres de poste différents entre briques)

Heuristique simple : si les briques du candidat mentionnent 3+ contextes clairement différents → parcours non linéaire. Pas besoin de perfection. Un faux négatif (ne pas détecter) est acceptable. Un faux positif (question inutile) est acceptable aussi (la question est pertinente même pour un parcours semi-linéaire).

**Scénario B — Aucune donnée de parcours exploitable dans les briques**

Ajouter un champ optionnel dans le profil candidat (Onboarding ou Forge). Format minimal :

```
Nombre de postes sur les 5 dernières années : [champ numérique, optionnel]
```

Si le champ est rempli et ≥ 3 → parcours non linéaire.
Si le champ est vide → ne pas injecter la question (fail silencieux, pas de blocage).

**Privilégie le scénario A** (détection automatique depuis les briques). Le scénario B est le fallback si les briques ne contiennent pas assez de signal.

### Opération 3 — Injecter la question conditionnelle dans generateInterviewQuestions

Dans `generateInterviewQuestions`, après la génération des questions existantes, ajouter un bloc conditionnel :

```javascript
// --- Parcours non linéaire (16n) ---
var career = detectNonLinearCareer(bricks);
if (career.isNonLinear) {
  // Construire la parade depuis les briques
  var topBricks = bricks
    .filter(function(b) { return b.status === 'validated'; })
    .sort(function(a, b) { return (b.armorScore || 0) - (a.armorScore || 0); })
    .slice(0, 3);

  var paradeLines = topBricks.map(function(b, i) {
    var core = extractBrickCore(b);
    return (i + 1) + '. ' + (core.resultLine || b.editText.substring(0, 80));
  });

  var questionBlock = '--- Parcours non linéaire ---\n' +
    'Le recruteur te demandera : "Pourquoi avez-vous changé si souvent ?"\n\n' +
    'Ta parade :\n' +
    '"Chaque poste correspondait à un problème résolu. Voici les 3 problèmes et les 3 résultats :"\n\n' +
    paradeLines.join('\n') + '\n\n' +
    'Le recruteur entend un pattern de résolution, pas de l\'instabilité.\n' +
    'Ancre chaque transition sur une décision (case 2 du Blindage), pas sur une circonstance.';

  // Injecter après les questions existantes ou dans une section dédiée
  // Adapter au format de sortie de generateInterviewQuestions
}
```

Le format exact dépend de ce que l'opération 1 révèle sur la structure de sortie de generateInterviewQuestions. Adapter.

La parade utilise `extractBrickCore` (déjà importé dans generators.js). Les 3 meilleures briques par armorScore fournissent les 3 problèmes résolus. Le candidat lit sa parade pré-formulée. Il ne l'invente pas en entretien.

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas les questions existantes de generateInterviewQuestions. Tu ajoutes un bloc conditionnel à la fin.
- Tu ne modifies pas extractBrickCore, le scoring, le Blindage, ou la densité.
- Tu ne modifies pas l'Onboarding (sauf si scénario B est nécessaire — et même dans ce cas, un seul champ optionnel).
- Tu ne modifies pas le One-Pager, le CV, la bio, ou les autres generators.
- Tu ne modifies pas Sprint.jsx, panels.jsx, WorkBench.jsx, Arsenal.jsx.
- Tu ne crées pas de nouvelle route API.
- Tu ne crées pas de dépendance npm.
- Tu ne surfais pas le Blindage au candidat. La mention "case 2 du Blindage" dans la parade est un commentaire interne pour le développeur, PAS du texte visible par le candidat. Le candidat voit "Ancre chaque transition sur une décision, pas sur une circonstance."

---

## TEXTE UI (français avec accents)

Titre de la section dans le livrable : "Parcours non linéaire"

Question affichée : "Pourquoi avez-vous changé si souvent ?"

Intro parade : "Chaque poste correspondait à un problème résolu. Voici les 3 problèmes et les 3 résultats :"

Conseil affiché : "Ancre chaque transition sur une décision, pas sur une circonstance."

---

## TESTS MANUELS

1. `npm run build` — le build passe.
2. `npm run smoke` — 169+ tests, 0 régressions.
3. Crée un candidat avec 3+ briques de contextes différents (ex : "chez Danone j'ai restructuré...", "chez Salesforce j'ai piloté...", "en startup j'ai lancé..."). Génère les questions d'entretien. La section "Parcours non linéaire" apparaît avec les 3 briques les mieux blindées.
4. Crée un candidat avec 2 briques du même contexte. Génère les questions d'entretien. La section "Parcours non linéaire" n'apparaît PAS.
5. Crée un candidat avec 0 briques. Génère les questions d'entretien. Pas d'erreur. La section n'apparaît pas.

---

## VÉRIFICATION FINALE

```bash
grep -rn "detectNonLinearCareer\|Parcours non linéaire\|changé si souvent" lib/ components/
```

La fonction est appelée uniquement dans generateInterviewQuestions.
Le texte "Parcours non linéaire" apparaît uniquement dans le livrable questions d'entretien.
Aucune mention de "Blindage" dans le texte visible par le candidat.

---

## SMOKE TEST À AJOUTER

Ajouter 2 tests dans `tests/smoke.mjs` :

```javascript
// 16n — Parcours non linéaire
assert(typeof detectNonLinearCareer === 'function', 'detectNonLinearCareer exists');

// Test avec 3+ contextes différents
var nlBricks = [
  { status: 'validated', editText: 'Chez Danone j\'ai restructuré le pipeline', armorScore: 3 },
  { status: 'validated', editText: 'Chez Salesforce j\'ai piloté 12 comptes', armorScore: 4 },
  { status: 'validated', editText: 'En startup j\'ai lancé le produit en 3 mois', armorScore: 2 }
];
var nlResult = detectNonLinearCareer(nlBricks);
assert(nlResult.isNonLinear === true, 'detectNonLinearCareer: 3 contexts = non-linear');

// Test avec 2 briques même contexte
var linearBricks = [
  { status: 'validated', editText: 'Chez Danone j\'ai restructuré le pipeline', armorScore: 3 },
  { status: 'validated', editText: 'Chez Danone j\'ai doublé le CA', armorScore: 4 }
];
var linResult = detectNonLinearCareer(linearBricks);
assert(linResult.isNonLinear === false, 'detectNonLinearCareer: same context = linear');
```

Adapter les imports selon l'emplacement final de detectNonLinearCareer.
