# PROMPT CLAUDE CODE — {TYPE}: {NOM}
## {Sous-titre — une phrase qui dit ce que le chantier fait}

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Chantiers 1-{N-1} terminés et mergés. {État actuel pertinent pour ce chantier}.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b {type}-{N}-{slug}
```

Types : `chantier-{N}-{slug}` | `refactor-{slug}` | `fix-{slug}` | `feat-{slug}`

---

## CONTEXTE

{Pourquoi ce chantier existe. Quel problème il résout. 3-5 phrases max. Pas de répétition de l'architecture générale — Claude Code a la skill.}

---

## OPÉRATION 0 — STATECHART (obligatoire si le chantier touche l'UI)

{Supprimer cette section si le chantier ne touche PAS l'UI (refactoring pur, ajout de données dans references.js, modification generator sans changement d'état). Garder si le chantier ajoute/modifie un écran, un état, une transition, un overlay, un prompt UI, ou un composant conditionnel.}

Lis le statechart actuel dans le code. Identifie les états et transitions impactés par ce chantier.

Rapporte sous cette forme :

| État actuel | Transition entrante | Transition sortante | Modifié par ce chantier ? |
|-------------|---------------------|---------------------|---------------------------|

Dessine la modification proposée (nouvel état, nouvelle transition, condition ajoutée).

STOP ici. Rapporte AVANT de coder. Je valide la modification du statechart.

Règle : le statechart Harel est la source de vérité pour toute modification UI. Si le code dévie du statechart, c'est le code qui a tort.

---

## CE QUE TU FAIS ({N} opérations)

### Opération 1 — Lire l'existant

Lis ces fichiers en entier AVANT de modifier quoi que ce soit :

{Liste des fichiers à lire. Pour chaque fichier, une consigne précise : "identifie X", "note la signature de Y", "cherche Z".}

### Opération {N} — {Verbe d'action + objet}

Fichier : `{chemin}`

{Description exacte de la modification. Code si nécessaire. Avant/Après si refactoring.}

---

## CE QUE TU NE FAIS PAS

{Liste courte. Chaque item protège contre une régression connue ou une sur-ingénierie prévisible.}

- Tu ne modifies pas {X}
- Tu ne modifies pas {Y}

---

## TESTS MANUELS

Après implémentation, exécute ces tests sur localhost (npm run dev) :

{Scénarios numérotés. Chaque scénario = une action + un résultat attendu vérifiable visuellement.}

1. Ouvre {route}. {Action}. Vérifie que {résultat attendu}.
2. {Action}. Vérifie que {résultat attendu}.
3. Cas limite : {scénario edge case}. Vérifie que {pas de crash / fallback correct}.

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

{Checklist spécifique au chantier. Chaque item est vérifiable par grep, build, ou inspection.}

- {Assertion 1}
- {Assertion 2}
- Le build passe sans erreur (`npm run build`)

---

## COMMIT

```
{type}: {description courte en anglais}

{Liste des modifications principales, 3-6 lignes}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge {branche} --no-ff -m "{type}: {description}"
```
