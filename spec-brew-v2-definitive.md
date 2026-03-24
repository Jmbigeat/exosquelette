# SPEC BREW V2 — Abneg@tion
## Cockpit stratégique LinkedIn hebdomadaire
## Version définitive — 19 mars 2026

Nom UI : **La Trempe** (la preuve forgée passe l'épreuve du public). Le code interne garde "brew" partout (tables, hooks, routes). Le renommage est UI-only : navigation, titre page, notifications.

---

## DOCTRINE

"La Trempe prépare, la Forge exécute."

Le Brew ne génère pas de contenu. Il dit au candidat quoi publier cette semaine. Le candidat exécute dans la Forge (Établi) ou manuellement. Le Brew crée l'autonomie, pas la dépendance.

---

## GATE

Abonnement (is_subscribed = true). Pas de pièces. Le Brew est le mécanisme principal de rétention de l'abonnement 19€/mois.

---

## CYCLE HEBDOMADAIRE

Dimanche 19h : email + notification in-app.

Le candidat reçoit :
- Un pilier (parmi les 4)
- Un angle personnalisé tiré de ses briques

Le candidat exécute pendant la semaine : post, commentaire, ou les deux. Format libre.

Le candidat déclare "Fait" dans /brew. Il colle le lien du post (optionnel). Il indique le format (post / commentaire / les deux).

Le Brew avance toujours. Zéro blocage si la semaine précédente n'est pas déclarée. Le Brew ne juge pas. Il recommande. Toujours.

---

## CHOIX DU PILIER

Rotation par défaut (pilier 1, 2, 3, 4, 1, 2...) corrigée par la couverture réelle.

Si le candidat a déclaré des semaines précédentes : le Brew recommande le pilier le moins couvert. Si deux piliers sont à égalité : la rotation tranche.

Si le candidat est nouveau (zéro semaine déclarée) : la rotation pure s'applique.

---

## CHOIX DE L'ANGLE

L'angle est personnalisé par les briques forgées du candidat. Si le candidat a 0 brique : angle générique par pilier.

L'angle est influencé invisiblement par le niveau Dilts. Le mot "Dilts" n'apparaît jamais dans l'UI.

### Mapping pilier × Dilts

| Pilier | Nom | Niveaux Dilts naturels |
|--------|-----|----------------------|
| 1 | "Le silence a un prix" → Diagnostic | 1-2 (faits, chiffres bruts) |
| 2 | "Le chiffre ouvre la porte, la cicatrice ferme la négo" → Preuve | 2-3 (actions, méthodes) |
| 3 | "Le positionnement se forge" → Construction | 3-4 (méthodes, convictions) |
| 4 | "Le positionnement est périssable" → Maintenance | 4-5 (convictions, identité) |

Le Brew choisit un angle qui correspond au pilier ET au prochain niveau Dilts du candidat. Le candidat voit un angle concret. Le moteur voit pilier × Dilts.

### Alerte stagnation

Si les 3 dernières semaines déclarées sont au même niveau Dilts : alerte en langage humain au-dessus de l'instruction.

Exemple : "Tes 3 derniers posts racontent ce que tu as fait. Cette semaine, parle de pourquoi tu le fais différemment."

L'alerte disparaît après la prochaine déclaration "Fait" (quel que soit le niveau). Le compteur se réinitialise. Si le candidat produit 3 nouveaux posts consécutifs au même niveau, l'alerte revient. Cycle : 3 posts même niveau → alerte → déclaration → reset → 3 nouveaux → alerte. Le candidat voit l'alerte au maximum une fois par mois. C'est un rappel, pas un reproche.

---

## CONTENU D'UNE INSTRUCTION

Le candidat ouvre /brew. Il voit :

```
SEMAINE 7 — Pilier 3 : Le positionnement se forge

Angle : Ta brique "Réduction du churn de 12% à 4%" montre
ta méthode. Raconte comment tu as convaincu l'équipe de
changer d'approche — pas le résultat, le moment de bascule.

[Générer mon post]  [Générer un commentaire]

○ Fait    Lien du post (optionnel) : [____________]
```

Si 0 brique : "Angle : Raconte un moment où ta méthode a changé un résultat. Le processus, pas le chiffre."

---

## MODULE COMMENTAIRE

Le candidat colle le texte d'un post LinkedIn tiers. L'outil croise le post avec le rôle cible du candidat et ses briques.

Trois réponses possibles :

1. "Génère" — le post est dans la zone du candidat ET une brique répond. L'outil génère un commentaire AVANT/APRÈS tiré du Coffre-Fort. Filtres Méroé + Luis Enrique appliqués. Le commentaire finit par un dilemme (deux réalités concrètes, les deux camps ont raison). Jamais par une question ouverte.

2. "Like et passe" — le post est dans la zone du candidat MAIS aucune brique ne répond. Le candidat like. Il ne commente pas. Un commentaire sans preuve est du bruit.

3. "Pas ta zone" — le post n'a aucun lien avec le rôle cible, les cauchemars, ou les piliers du candidat. Commenter ici ne dépose aucune preuve.

### Doctrine premier commentaire (s'applique aussi aux commentaires générés)

Le commentaire a deux jobs :
- Déposer une preuve complémentaire (fait, chiffre, expérience vécue). Jamais de reformulation du post.
- Ouvrir un débat par un dilemme. Deux camps, tous deux valides.

Exemples de bonnes fins :
- "Entre un candidat qui a postulé à 40 offres et un candidat qui a armé 4 preuves sur un seul poste — lequel reçoit un retour en premier ?"

Exemples de mauvaises fins :
- "Et vous, qu'en pensez-vous ?"
- "Ça vous parle ?"

Le commentaire ne contient jamais de lien, de CTA, ou de mention de l'outil.

---

## LIEN BREW → FORGE

Bouton "Générer mon post" dans /brew : ouvre l'Établi avec le pilier + Dilts pré-injectés comme suggestion. Le candidat change s'il veut.

Bouton "Générer un commentaire" dans /brew : ouvre le module commentaire (champ pour coller le post tiers + filtre de pertinence + génération).

Le chemin sans Brew (candidat ouvre l'Établi directement) fonctionne normalement. Le pilier n'est pas pré-injecté. Le candidat choisit librement.

### Doctrine post (s'applique aux posts générés via Brew)

Le post finit par une injonction ou une affirmation. Pas par une question. Le post tranche. La dernière phrase est celle qui reste.

Note pour l'implémentation : vérifier si le generator de posts (ch21) applique déjà cette règle. Si non, l'ajouter comme contrainte dans le generator quand le pilier Brew est pré-injecté.

---

## SIGNAL DM

Conditionnel : visible uniquement si la semaine précédente est déclarée "Fait."

Bloc optionnel sous l'instruction de la semaine :

```
💬 Ton post de la semaine dernière est en place.
Si un profil intéressant a interagi, c'est le moment
d'ouvrir la conversation.
[Ouvrir l'Établi → DM LinkedIn]
```

Le Brew ne recommande pas de nombre de DM. Il ne nomme aucun profil. Il ne scrape pas LinkedIn. Il rappelle le timing. Le generator ch20 (contact script, variante DM LinkedIn) fait le travail.

---

## DASHBOARD

3 éléments. Pas plus.

### 1. Couverture piliers (4 barres)

Chaque barre représente un pilier. Se remplit proportionnellement au nombre de semaines déclarées sur ce pilier. L'objectif implicite : 4/4 remplies. La barre vide est une invitation.

### 2. Streak (semaines consécutives)

Nombre de semaines d'affilée avec au moins une déclaration "Fait." Le streak est le switching cost émotionnel. Le candidat à 12 semaines ne résilie pas pour 19€.

### 3. Historique

Liste des semaines. Pour chaque semaine :
- Numéro de semaine
- Pilier recommandé
- Statut : fait / pas fait
- Format : post / commentaire / les deux
- Lien du post (si collé)

Pas de métriques d'engagement LinkedIn. Pas de likes. Pas de vues. La doctrine proof deposit dit : le reach est un signal secondaire. Le dashboard montre la couverture et la régularité. Pas la popularité.

Pas de score de densité. La densité mesure la profondeur des preuves dans la Forge (6 axes, briques, blindage). Le Brew mesure la couverture et la régularité de la distribution LinkedIn. Les deux progressent en parallèle. Le Brew pousse indirectement vers la Forge via les angles qui référencent les briques. Le candidat qui suit l'angle Brew retourne blinder ses briques dans la Forge. La densité monte sans que le Brew l'affiche.

---

## NOTIFICATIONS

### Email (dimanche 19h)

Objet : "Semaine {N} — {Nom du pilier}"
Corps : l'angle personnalisé + bouton vers /brew.
Ne se déclenche pas si la semaine est déjà déclarée.

### In-app (au login)

Toast ou bandeau dans la Forge : "Ta recommandation Brew de la semaine est prête."
Ne se déclenche pas si la semaine est déjà déclarée.
Le hook useBrewNotif dans Sprint.jsx gère ce state.

---

## SUPABASE

### Table brew_weeks

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK profiles.id |
| week_number | integer | Numéro de semaine ISO |
| year | integer | Année |
| pillar | integer | 1-4 |
| angle | text | Angle personnalisé généré |
| dilts_level | integer | 1-6 (invisible, moteur uniquement) |
| completed | boolean | Le candidat a cliqué "Fait" |
| post_url | text nullable | Lien du post si collé |
| format | text nullable | "post" / "comment" / "both" |
| created_at | timestamptz | Auto |

RLS : user_id = auth.uid()

### Table brew_instructions

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| pillar | integer | 1-4 |
| dilts_level | integer | 1-6 |
| angle_template | text | Template d'angle (avec placeholders brique) |
| angle_generic | text | Angle par défaut si 0 brique |

Données statiques. 4 piliers × 6 niveaux Dilts = 24 lignes. Pas de RLS (données publiques).

---

## CE QUE LE BREW NE FAIT PAS

- Ne génère pas de contenu. Il recommande.
- Ne scrape pas LinkedIn. Jamais.
- Ne track pas l'engagement (likes, vues, commentaires LinkedIn).
- Ne bloque jamais le candidat. Zéro gate.
- Ne recommande pas de likes. Le like est libre.
- Ne recommande pas de nombre de DM. Il signale le timing.
- Ne montre pas le Dilts au candidat. Le Dilts est dans le moteur.
- Ne montre pas le score de densité. La densité vit dans la Forge (Arsenal). Le Brew pousse indirectement vers la Forge via les angles.
- Ne consomme pas de pièces. Les pièces sont mortes.
- Ne remplace pas le workflow LinkedIn personnel de JM (acquisition). Le Brew est pour les candidats. Le workflow JM est pour JM.

---

## ANTI-PATTERNS BREW

- Ne jamais montrer de métriques d'engagement dans le dashboard.
- Ne jamais recommander d'optimiser l'horaire de publication.
- Ne jamais utiliser de hashtags dans les posts/commentaires générés.
- Ne jamais terminer un post par une question ouverte.
- Ne jamais terminer un commentaire par une question ouverte.
- Ne jamais mentionner l'outil dans un post ou commentaire généré.
- Ne jamais bloquer le Brew si la semaine précédente n'est pas déclarée.
- Ne jamais forcer un format (post ou commentaire). Le candidat choisit.
- Ne jamais afficher le score de densité dans le dashboard Brew. La densité vit dans la Forge.

---

## HYPOTHÈSES À TESTER

| Hypothèse | Mesure | Seuil |
|-----------|--------|-------|
| Rétention mois 2 avec Brew vs sans | Taux renouvellement | Brew > 80%, sans Brew < 60% |
| Churn mensuel | % désabonnement | < 10% = soutenable |
| Streak moyen | Semaines consécutives | > 6 = signal fort |
| Couverture piliers | % candidats 4/4 à 3 mois | > 50% |
| Déclaration "Fait" | % semaines déclarées vs envoyées | > 60% |

---

## STATECHART HAREL — BREW

Le Brew est une Couche distincte du statechart, pas une région du Sprint.

```
Architecture des couches :
  Couche 0 : Éclaireur → Paywall → Onboarding → Sprint
  Couche 1 : Sprint (3 régions + 2 interruptions) = la Forge
  Couche 2 : Brew (page /brew, gate abonnement) = cockpit LinkedIn
```

Le Brew ne modifie pas les états de la Couche 1 (Forge), de la Couche 0 (Éclaireur), ou de l'Onboarding. La navigation entre couches passe par le routeur Next.js, pas par des transitions d'état.

### États Brew

```
ÉTAT BREW.LOCKED
  Condition : is_subscribed = false
  UI : message "Le Brew est réservé aux abonnés" + bouton abonnement
  Transition → BREW.ACTIVE quand is_subscribed = true

ÉTAT BREW.ACTIVE
  Sous-état BREW.INSTRUCTION
    Condition : nouvelle semaine non déclarée
    UI : instruction (pilier + angle) + boutons Générer + Fait
    Transition → BREW.DECLARED quand candidat clique "Fait"
  
  Sous-état BREW.DECLARED
    Condition : semaine courante déclarée
    UI : "Fait ✓" + dashboard (couverture + streak + historique)
    Transition → BREW.INSTRUCTION dimanche 19h suivant (nouvelle semaine)

Le signal DM apparaît dans BREW.INSTRUCTION si semaine précédente = DECLARED.
L'alerte stagnation apparaît dans BREW.INSTRUCTION si 3 dernières semaines même Dilts.
L'alerte disparaît après la prochaine déclaration. Compteur reset.
```

### Transition cross-couches : Brew → Forge

```
Couche 2 (BREW.INSTRUCTION)
  → action "Générer mon post" ou "Générer un commentaire"
  → router.push('/sprint?brew_pillar={N}&brew_dilts={N}')
  → Couche 1 (Sprint) monte avec Interruption 2 (PRODUIRE) ouverte
  → pilier + Dilts pré-injectés dans le generator comme suggestion
  → query params éphémères (consommés au montage, supprimés de l'URL)
```

Le candidat qui ouvre l'Établi sans passer par le Brew n'a pas de query params. Le generator fonctionne normalement sans pré-injection.

### Signal passif : useBrewNotif dans la Couche 1

```
Couche 1 (Sprint) — Région 2 (MESURER)
  Signal passif : useBrewNotif lit brew_weeks (Supabase, lecture seule)
  Si semaine courante non déclarée → toast "Ta recommandation Brew est prête"
  Aucune modification de l'état Sprint
  Le toast pointe vers /brew (navigation, pas transition d'état)
```

useBrewNotif est une lecture. Pas une mutation. Le hook ne modifie pas le state du Sprint. Il affiche un toast qui navigue vers une autre couche.

---

## PRIORITÉ D'IMPLÉMENTATION

Cette spec est complète. L'implémentation ne dépend d'aucun autre chantier en attente. Prérequis : Stripe actif (is_subscribed doit fonctionner). Le Brew sans abonnement = page locked pour 100% des utilisateurs.

Séquence d'implémentation suggérée :
1. Tables Supabase (brew_weeks enrichie, brew_instructions peuplée)
2. Logique de sélection pilier × Dilts × angle (lib/brew/)
3. UI /brew (instruction + dashboard + boutons)
4. Module commentaire (filtre pertinence + génération)
5. Notifications (email dimanche 19h + in-app)
6. Lien Brew → Établi (pilier + Dilts pré-injectés)
7. Signal DM (bloc conditionnel)
