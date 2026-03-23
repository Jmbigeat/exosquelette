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
