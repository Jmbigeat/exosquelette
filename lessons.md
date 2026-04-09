# LESSONS — Abneg@tion
## Règles tirées d'erreurs réelles. Claude Code lit ce fichier au démarrage.

Chaque entrée = un bug attrapé + la règle qui empêche sa récurrence.

---

## extractBrickCore — 10 mars 2026

Bug : extractBrickCore utilisait une heuristique "première moitié / seconde moitié" sur du texte concaténé. Le chiffre du contexte (2500€, prix concurrent) était sélectionné comme resultNumber au lieu du chiffre du résultat (18K€). 14 generators produisaient le mauvais chiffre en même temps. La cohérence interne masquait l'erreur.

Règle : quand une fonction parse du texte concaténé pour en extraire un champ, toujours vérifier si les champs séparés sont disponibles. Préférer la source structurée (brick.fields.result) à l'heuristique textuelle. L'heuristique reste en fallback pour les données legacy.

---

## structuredFields sur chemin correction — 10 mars 2026

Bug : Claude Code a proposé d'attacher buildStructuredFields(seed) sur le chemin correction (ligne 371 Interrogation.jsx). buildStructuredFields lit les champs f1..f4 originaux de la seed. Après correction, le candidat a modifié le texte via editText. Les champs f1..f4 ne reflètent pas la correction. Le fast path d'extractBrickCore aurait retourné l'ancien chiffre.

Règle : ne jamais attacher structuredFields sur le chemin correction. editText est la source de vérité après une correction. Les briques corrigées passent par le fallback heuristique. C'est intentionnel, pas un défaut.

---

## Mapping f3 → result par type de brique — 10 mars 2026

Bug potentiel : seuls les types "chiffre" et "decision" mappent f3 vers la clé "result". Les 4 autres types (influence, cicatrice, take, unfair) mappent f3 vers d'autres clés (method, mypart, proof, others). Sans vérification, le fast path aurait cherché brick.fields.result sur des types qui n'ont pas cette clé.

Règle : quand un fix touche une fonction utilisée par plusieurs types de données, vérifier le mapping pour CHAQUE type. Ne pas tester sur un seul type et extrapoler.

---

## Race condition useState + localStorage — 10 mars 2026

Bug : savedState initialisé avec useState(null). Le useEffect qui lit localStorage appelait setSavedState. Le check if (!savedState) s'exécutait dans le même tick — savedState était encore null. Le mock écrasait le cache. Les briques disparaissaient au refresh.

Règle : quand un state React dépend d'une valeur synchrone disponible au montage (localStorage, sessionStorage, URL params), utiliser le lazy initializer de useState au lieu d'un useEffect. useState(() => readFromStorage()) est synchrone. useEffect + setState est async.

---

## Supabase client ne throw pas — 10 mars 2026

Constat : le client Supabase ne lance pas d'exception quand une table n'existe pas. Il retourne res.error sans throw. Une fonction qui fait `var res = await client.from("table_inexistante").select()` ne crashe pas — res.data est null, res.error est défini.

Règle : ne pas compter sur try/catch pour détecter les erreurs Supabase côté client. Vérifier res.error explicitement. Le .catch() sur un Promise.all de fonctions Supabase ne se déclenche que sur des erreurs réseau, pas sur des erreurs de table.

---

## Tables Supabase et foreign keys — 10 mars 2026

Bug potentiel : le SQL initial du Brew référençait auth.users(id). Le schéma existant utilise public.profiles(id) comme table intermédiaire. Toutes les foreign keys (sprints, payments) pointent vers profiles, pas vers auth.users directement.

Règle : avant de créer une table avec une foreign key user_id, vérifier le schéma existant. Suivre le pattern en place. Dans ce repo : user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE.

---

## Unicode escapes — récurrent

Bug récurrent : Claude Code écrit \u00E9 au lieu de é, \u20AC au lieu de €. Le build passe. La lisibilité souffre. Le grep casse.

Règle : écrire les caractères accentués directement. Toujours. Corriger par sed global après chaque session si nécessaire. Vérifier : grep -rn '\\u00' components/ lib/ app/

---

## sessionStorage et redirects externes — mars 2026

Bug : tout redirect externe (Stripe Checkout, OAuth, email confirmation) entre l'Éclaireur et Sprint.jsx tue le sessionStorage. Le skip onboarding casse. Le rôle n'est pas pré-sélectionné. L'offre n'est pas injectée.

Règle : ne jamais insérer de redirect hors domaine dans le flux Éclaireur → Onboarding → Forge. Le sessionStorage ne survit pas aux changements de domaine. Fallback V1 (parcours complet) reste le filet de sécurité permanent.

---

## dangerouslySetInnerHTML — mars 2026

Constat : zéro occurrence dans le repo (vérifié 10 mars 2026). Les textareas candidat injectent du texte dans du JSX. React échappe par défaut.

Règle : ne jamais introduire dangerouslySetInnerHTML. Si un generator produit du HTML, le convertir en texte avant le rendu. Vérifier par grep après chaque chantier.

---

## service_role côté client — mars 2026

Constat : SUPABASE_SERVICE_ROLE_KEY existe uniquement dans lib/supabase.js (createServerClient), utilisé par les API routes server-side. Jamais exposé côté client (vérifié 10 mars 2026).

Règle : ne jamais importer createServerClient ou SUPABASE_SERVICE_ROLE_KEY dans un fichier composant (components/) ou dans un fichier lib/ utilisé côté client. Vérifier : grep -rn 'SERVICE_ROLE' components/ —include='*.js' —include='*.jsx'

---

## Ordre de lecture des fichiers dans les prompts Claude Code — 24 mars 2026

Constat : la fenêtre de contexte LLM a un biais de récence. Le dernier fichier lu par Claude Code est le plus saillant quand le raisonnement commence. Dans un prompt Opération 1 "lis ces 6 fichiers", le fichier en position 6 domine le contexte. Le fichier en position 1 est le moins saillant au moment de la première modification.

Règle : dans chaque prompt, lister le fichier à MODIFIER en dernier dans la liste de lecture. Les fichiers de contexte pur (references.js, helpers.js) viennent en premier. Le fichier cible (celui que Claude Code va éditer) vient en dernier. Si plusieurs fichiers sont modifiés, les ordonner du moins critique au plus critique.

---

## Déclaratif vérifiable vs déclaratif invérifiable — 25 mars 2026

Constat : lors du call Alex BLUMA (designer pédagogique), l'objection "les 4 cases du Blindage restent du déclaratif" n'a pas pu être contrée. L'argument manquant : le Blindage ne supprime pas le déclaratif. Il le rend vérifiable. Le CV dit "expérience en développement commercial" — le recruteur ne sait pas quoi vérifier. La brique dit "croissance de +22% du portefeuille Mid-Market chez Danone en 12 mois" — le recruteur appelle Danone et demande "c'est vrai ?"

Règle : quand quelqu'un objecte "c'est du déclaratif", la réponse est : "Oui, du déclaratif vérifiable. Le CV est du déclaratif invérifiable. La brique est du déclaratif vérifiable." Deuxième argument : le delta. L'outil ne demande pas le chiffre global (98%). Il demande le delta (de 89% à 98%). Le delta isole la contribution personnelle du système.

Une idée n'existe pas tant qu'elle n'est pas un prompt. Hiérarchie : morte (pas de trace) → dormante (un déclencheur, pas de prompt) → vivante (un prompt prêt) → faite (un commit).

Règle 6 anti-écho : si Claude répond en < 30s avec un pattern matching, demande 3 raisons contre avant d'accepter.

Pattern session : sens → action → structure → cadre. Les urgences sautent au sens et commencent par l'action.

1 session = maximum 3 signaux backlog. Au-delà, chaque signal supplémentaire dilue l'attention sur les précédents.

Chaque idée présentée à JM a traversé un raisonnement profond AVANT d'être présentée. Si l'idée ne tient pas au raisonnement, elle meurt silencieusement. Si elle tient, elle arrive avec sa faiblesse principale en première ligne. JM valide ou invalide. Le nombre d'idées qui survivent n'est pas un objectif. La rigueur du raisonnement est l'objectif.

Le critical path dicte la priorité. Tout ce qui n'est pas sur le chemin DM → candidat → Éclaireur → Forge → livrable → entretien est hors critical path. Hors critical path = priorité 3 minimum, quel que soit l'impact estimé. Le critical path évolue quand le bottleneck change.

Test de James : une feature qui ne change rien dans l'expérience vécue du candidat n'a pas de cash-value. Un fichier .md mis à jour n'est pas du progrès. Un candidat qui traverse l'Éclaireur est du progrès. Mesurer le progrès par les commits est du Confirmation Bias. Mesurer le progrès par les candidats réels est du pragmatisme.

3 features ont une cash-value immédiate : l'Éclaireur (le candidat comprend l'offre en 10 secondes), le champ brique + Blindage (le candidat voit la différence entre 0/4 et 4/4), le generator One-Pager (le candidat a un livrable qui sort de l'outil et entre dans le réel). Les 41 autres enrichissent ces 3. Elles ne les remplacent pas.
