# PROMPT CLAUDE CODE — FEAT 16j : Question "Pourquoi" post-Signature
## Capturer la motivation du candidat après détection de sa Signature, nourrir le One-Pager bloc 3

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-16j-question-pourquoi
```

---

## CONTEXTE

La Signature capture le mode opératoire du candidat (le "comment"). Les briques capturent les preuves (le "quoi"). Le One-Pager bloc 3 ("Pourquoi ce poste") assemble un lien entre le contexte passé et le mandat ciblé.

Ce qui manque : le "pourquoi" explicite du candidat. Pourquoi ce rôle fait sens pour toi, sachant ce que tu fais naturellement (ta Signature) ? La réponse n'est pas dans les briques. Elle n'est pas dans l'offre. Elle est dans la tête du candidat.

Actuellement, le One-Pager bloc 3 est généré automatiquement à partir des briques et du contexte société. Le résultat est mécaniquement correct mais impersonnel. Le recruteur lit "le candidat a des compétences transférables." Il ne lit pas "le candidat a choisi ce rôle parce que..."

La question "Pourquoi" se pose APRÈS la Signature parce que :
1. Le candidat connaît maintenant son mode opératoire (Signature)
2. Il voit le lien entre ses preuves et le poste (densité, cauchemars couverts)
3. Il est capable d'articuler pourquoi ce rôle est le bon terrain pour sa Signature
4. Sans Signature, la question est prématurée — le candidat ne sait pas encore ce qu'il fait naturellement

Source : Jeu Infini — "un jeu auquel tu as envie de jouer pour le restant de tes jours."

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire et comprendre le code existant

Lis ces fichiers dans l'ordre :

1. `components/sprint/hooks/useSignature.js` — note le flow complet : seuil de déclenchement → overlay 3 écrans → validation. Note comment sigFormulation est stockée dans le vault. Identifie le moment APRÈS la validation de la Signature (le callback ou le state update final).

2. `lib/generators/one-pager.js` (ou le generator du One-Pager dans lib/generators/) — note comment le bloc 3 ("Pourquoi ce poste") est assemblé. Quels inputs sont utilisés (briques, targetRoleId, offerSignals, companyContext, signature). Note le format de sortie du bloc 3.

3. `components/Sprint.jsx` — note où le vault est mis à jour. Identifie si le vault a un champ libre accessible ou s'il faut en ajouter un.

4. `components/sprint/panels.jsx` ou `components/sprint/WorkBench.jsx` — note si le One-Pager utilise des données du vault au moment de la génération.

Rapporte :

| Question | Réponse |
|----------|---------|
| Comment la Signature est stockée après validation | (champ, emplacement dans state) |
| Format actuel du One-Pager bloc 3 | (template, inputs) |
| Le vault a-t-il un champ whyThisRole ou équivalent | (oui/non) |
| Où s'insère le moment "juste après Signature validée" dans le code | (fichier, ligne approx) |

STOP ici. Rapporte avant de coder. L'emplacement de la question dépend de la structure de l'overlay Signature.

### Opération 2 — Ajouter le champ whyThisRole au vault

Dans le state du sprint (savedState), ajouter un champ :

```javascript
vault: {
  // ... champs existants
  whyThisRole: null  // string, rempli après Signature, nullable
}
```

Le champ est nullable. S'il est null, le One-Pager bloc 3 fonctionne comme avant (fallback sur la version automatique). S'il est rempli, le bloc 3 intègre la réponse du candidat.

Pas de migration nécessaire : les vaults existants n'ont pas le champ. Le || null suffit.

### Opération 3 — Ajouter l'écran "Pourquoi" après la validation de la Signature

**Deux options possibles (choisir selon l'architecture de useSignature) :**

**Option A — 4ème écran dans l'overlay Signature**

Si l'overlay Signature a un système d'écrans séquentiels (sigScreen = 0, 1, 2), ajouter un écran 3 :

Écran 3 (après validation) :
```
Ta Signature : [sigFormulation]

Dernière question.

Sachant ce que tu fais naturellement,
pourquoi ce rôle est-il le bon terrain ?

[textarea, 3-5 phrases, placeholder : "Ce poste me correspond parce que..."]

[Bouton : "Valider"]
```

Le textarea stocke la réponse dans vault.whyThisRole. Le bouton ferme l'overlay.

**Option B — Prompt séparé dans la Forge (après fermeture overlay)**

Si l'overlay Signature est déjà complexe (3 écrans = assez), ajouter un prompt discret dans la Forge qui apparaît après la première fermeture de l'overlay :

```
Ta Signature est détectée : [sigFormulation]

Pourquoi ce rôle est-il le bon terrain pour cette Signature ?

[textarea, 3-5 phrases]

[Bouton : "Ajouter au One-Pager"] [Lien : "Passer"]
```

Le prompt apparaît une seule fois (flag whyThisRoleAsked dans le vault). Si le candidat passe, vault.whyThisRole reste null. Le One-Pager fonctionne sans.

**Privilégie l'option A** si l'overlay est propre et que l'ajout d'un écran est simple. **Privilégie l'option B** si l'overlay est déjà chargé (3 écrans + validation + animation).

### Opération 4 — Intégrer whyThisRole dans le One-Pager bloc 3

Dans le generator du One-Pager, modifier le bloc 3 ("Pourquoi ce poste") :

```javascript
// Bloc 3 — Pourquoi ce poste
var whyBlock = '';

if (vault.whyThisRole) {
  // Le candidat a répondu : utiliser sa voix
  whyBlock = vault.whyThisRole;
} else {
  // Fallback : version automatique (code existant inchangé)
  whyBlock = /* ... code actuel du bloc 3 ... */;
}
```

Le fallback préserve le comportement actuel. Le candidat qui n'a pas répondu obtient le même One-Pager qu'avant. Le candidat qui a répondu obtient un bloc 3 personnalisé avec sa propre voix.

**Nettoyage de la réponse candidat :**

Passer le texte par cleanRedac (supprime les mots bannis). Ne pas reformater au-delà. Le One-Pager bloc 3 est la voix du candidat, pas celle de l'outil.

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas les 2 premiers écrans de l'overlay Signature (mots bruts → pattern comportemental).
- Tu ne modifies pas la logique de détection de Signature (seuil 3 briques × 2 cauchemars).
- Tu ne modifies pas le One-Pager blocs 1, 2, 4, 5.
- Tu ne rends pas la question obligatoire. Le candidat peut passer. vault.whyThisRole = null est un état valide.
- Tu ne modifies pas le CV calibré (le CV n'utilise pas le "pourquoi").
- Tu ne modifies pas le scoring, la densité, le Blindage.
- Tu ne surfais pas le Blindage au candidat.
- Tu n'ajoutes pas de dépendance npm.
- Tu ne crées pas de nouvelle route API.

---

## TEXTE UI (français avec accents)

Titre écran / prompt : (pas de titre, le contexte suffit)

Intro : "Sachant ce que tu fais naturellement, pourquoi ce rôle est-il le bon terrain ?"

Placeholder textarea : "Ce poste me correspond parce que..."

Bouton validation (option A) : "Valider"
Bouton validation (option B) : "Ajouter au One-Pager"
Lien skip (option B) : "Passer"

Aucun jargon Abneg@tion dans le texte candidat. Pas de "Signature", "Blindage", "densité" dans la question affichée. Le candidat voit "ce que tu fais naturellement" (langage humain), pas "ta Signature" (jargon interne).

CORRECTION : "Ta Signature" EST le terme que le candidat voit dans l'overlay (c'est son moment de révélation). Donc dans le contexte de l'overlay, utiliser "Ta Signature : [formulation]" est correct. Dans le contexte du One-Pager (document qui sort de la plateforme), le mot "Signature" ne doit PAS apparaître.

---

## TESTS MANUELS

1. `npm run build` — le build passe.
2. `npm run smoke` — 174+ tests, 0 régressions.
3. Crée un candidat. Forge 3 briques blindées couvrant 2+ cauchemars. La Signature se déclenche. L'écran "Pourquoi" apparaît (option A) ou le prompt apparaît après fermeture (option B).
4. Remplis le textarea ("Ce poste me correspond parce que j'ai restructuré des équipes commerciales dans 3 contextes différents et je veux appliquer ce pattern à une scale-up."). Valide. Génère le One-Pager. Le bloc 3 contient la réponse du candidat.
5. Crée un autre candidat. Même parcours Signature. Passe la question (clic "Passer" ou ne pas remplir). Génère le One-Pager. Le bloc 3 contient la version automatique (fallback). Identique au comportement actuel.
6. Ferme et rouvre la Forge. Le champ whyThisRole est persisté (Supabase). Le One-Pager garde la réponse.
7. Le candidat modifie sa réponse ? Vérifie si le textarea est ré-accessible (via l'Établi ou l'Arsenal). Si non documenté dans cette spec, le candidat régénère le One-Pager → le fallback s'applique. C'est acceptable en V1.

---

## SMOKE TEST À AJOUTER

```javascript
// 16j — Question Pourquoi post-Signature
// Vérifier que generateOnePager intègre whyThisRole quand disponible
var onePagerWithWhy = generateOnePager(
  testBricks, 'enterprise_ae', testCauchemars, testOfferSignals,
  { whyThisRole: 'Ce poste me correspond parce que j\'ai restructuré des pipelines dans 3 secteurs.' },
  testSignature
);
assert(onePagerWithWhy.includes('restructuré des pipelines'), 'One-Pager includes whyThisRole when provided');

// Vérifier le fallback sans whyThisRole
var onePagerWithout = generateOnePager(
  testBricks, 'enterprise_ae', testCauchemars, testOfferSignals,
  { whyThisRole: null },
  testSignature
);
assert(onePagerWithout.length > 50, 'One-Pager bloc 3 fallback works without whyThisRole');
```

Adapter les imports et les arguments selon la signature réelle de generateOnePager (vérifiée en opération 1).

---

## VÉRIFICATION FINALE

```bash
grep -rn "whyThisRole" lib/ components/
```

Le champ apparaît dans :
- useSignature.js (ou Sprint.jsx si option B) — capture
- Le generator One-Pager — consommation
- Le vault dans le state — stockage

Le champ N'apparaît PAS dans :
- Les autres generators (CV, bio, contact scripts, etc.)
- Le scoring ou la densité
- L'Éclaireur
- L'Échoppe (B2B) — pour l'instant

Le mot "Signature" apparaît dans l'overlay (contexte interne). Il N'apparaît PAS dans le One-Pager généré.
