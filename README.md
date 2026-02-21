# L'Exosquelette — Guide de lancement

Ce dossier contient tout le code. Tu n'as rien a ecrire. Tu suis les etapes dans l'ordre.

Temps total estime : 45-90 minutes (la premiere fois).


## CE QU'IL TE FAUT AVANT DE COMMENCER

1. Un ordinateur (Mac, Windows, ou Linux)
2. Node.js installe sur ta machine
3. Un compte Supabase (gratuit)
4. Un compte Stripe (gratuit en mode test)
5. Une cle API Anthropic (payante a l'usage — quelques centimes par scan)


## ETAPE 1 — Installer Node.js (si pas deja fait)

Va sur https://nodejs.org
Telecharge la version LTS (le gros bouton vert).
Installe-le en cliquant "Next" partout.

Pour verifier que ca marche, ouvre un Terminal :
- Mac : Cmd+Espace, tape "Terminal", Entree
- Windows : touche Windows, tape "cmd", Entree

Tape cette commande :

    node --version

Si tu vois un numero (genre v20.11.0), c'est bon.
Si tu vois une erreur, reinstalle Node.js.


## ETAPE 2 — Installer les dependances du projet

Dans le Terminal, va dans le dossier du projet.
Si tu as telecharge le dossier sur ton Bureau :

Mac :

    cd ~/Desktop/exosquelette

Windows :

    cd %USERPROFILE%\Desktop\exosquelette

Puis tape :

    npm install

Attends que ca finisse (30 secondes a 2 minutes).
Tu verras des lignes defiler. C'est normal.
Si tu vois "added XXX packages", c'est bon.


## ETAPE 3 — Creer le compte Supabase (base de donnees)

1. Va sur https://supabase.com
2. Clique "Start your project" puis "Sign up"
3. Connecte-toi avec GitHub ou email
4. Clique "New project"
5. Nom du projet : exosquelette
6. Mot de passe de la base : choisis quelque chose et NOTE-LE quelque part
7. Region : West EU (Paris)
8. Clique "Create new project" — attends 1-2 minutes

### Recuperer les cles Supabase

1. Dans ton projet Supabase, clique "Settings" (engrenage en bas a gauche)
2. Clique "API" dans le menu
3. Tu vois 2 blocs :
   - "Project URL" — c'est ton NEXT_PUBLIC_SUPABASE_URL
   - "anon public" — c'est ton NEXT_PUBLIC_SUPABASE_ANON_KEY
   - "service_role secret" — c'est ton SUPABASE_SERVICE_ROLE_KEY (clique "Reveal" pour le voir)
4. Garde cette page ouverte, tu en auras besoin a l'etape 6

### Creer les tables

1. Dans Supabase, clique "SQL Editor" dans le menu de gauche
2. Clique "New query"
3. Ouvre le fichier supabase/schema.sql qui est dans le dossier du projet
4. Copie TOUT le contenu du fichier
5. Colle-le dans l'editeur SQL de Supabase
6. Clique "Run" (bouton vert en haut a droite)
7. Tu dois voir "Success. No rows returned." — c'est normal et c'est bon


## ETAPE 4 — Creer le compte Stripe (paiement)

1. Va sur https://dashboard.stripe.com/register
2. Cree un compte
3. Tu arrives sur le Dashboard en MODE TEST (bandeau orange en haut)
4. RESTE EN MODE TEST tant que tu n'es pas pret a encaisser de l'argent reel

### Recuperer les cles Stripe

1. Clique "Developers" en haut a droite, puis "API keys"
2. Tu vois :
   - "Publishable key" (commence par pk_test_) — c'est ton NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - "Secret key" (clique "Reveal") (commence par sk_test_) — c'est ton STRIPE_SECRET_KEY

### Creer le produit a 49 euros

1. Dans Stripe, clique "Products" dans le menu de gauche
2. Clique "+ Add product"
3. Nom : Sprint L'Exosquelette
4. Prix : 49.00 EUR, paiement unique (One time)
5. Clique "Save product"
6. Sur la page du produit, tu vois le prix. Clique dessus.
7. Dans l'URL ou sur la page, tu verras un ID qui commence par "price_" — c'est ton STRIPE_PRICE_ID

### Configurer le Webhook (pour confirmer les paiements)

NOTE : Le webhook ne marchera qu'une fois deploye sur Vercel.
Pour le developpement local, tu peux mettre n'importe quoi dans STRIPE_WEBHOOK_SECRET.
On reviendra dessus a l'etape 8.


## ETAPE 5 — Creer la cle API Anthropic (IA)

1. Va sur https://console.anthropic.com
2. Cree un compte ou connecte-toi
3. Clique "API keys" dans le menu
4. Clique "Create key"
5. Nom : exosquelette
6. Copie la cle (commence par sk-ant-) — c'est ton ANTHROPIC_API_KEY
7. IMPORTANT : cette cle ne se re-affiche pas. Copie-la maintenant.

Cout : chaque scan consomme environ 0.01 a 0.03 euros. 100 scans = 1 a 3 euros.


## ETAPE 6 — Remplir le fichier de configuration

1. Dans le dossier du projet, tu vois un fichier .env.example
2. Copie ce fichier et renomme la copie en .env.local

Mac :

    cp .env.example .env.local

Windows :

    copy .env.example .env.local

3. Ouvre .env.local avec un editeur de texte (TextEdit sur Mac, Notepad sur Windows)
4. Remplace chaque "xxxxx" par la vraie valeur que tu as recuperee aux etapes precedentes

Le fichier doit ressembler a ca (avec TES valeurs) :

    NEXT_PUBLIC_SUPABASE_URL=https://abcdefg.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
    SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
    STRIPE_SECRET_KEY=sk_test_51abc...
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51abc...
    STRIPE_WEBHOOK_SECRET=whsec_test
    STRIPE_PRICE_ID=price_1abc...
    ANTHROPIC_API_KEY=sk-ant-api03-abc...
    NEXT_PUBLIC_APP_URL=http://localhost:3000

5. Sauvegarde le fichier


## ETAPE 7 — Lancer en local

Dans le Terminal, tape :

    npm run dev

Tu devrais voir :

    ready - started server on 0.0.0.0:3000

Ouvre ton navigateur et va sur http://localhost:3000

Tu verras la page de connexion. Cree un compte avec ton email.
Puis tu verras le paywall. Pour tester sans payer :

1. Va dans Supabase
2. Clique "Table Editor" dans le menu
3. Clique sur la table "profiles"
4. Trouve ta ligne (ton email)
5. Clique sur "paid" et mets-le a "true"
6. Rafraichis la page du Sprint

Tu es dans le Sprint. Tout fonctionne comme dans le prototype.


## ETAPE 8 — Deployer sur Vercel (mettre en ligne)

1. Cree un compte sur https://vercel.com (gratuit, connecte-toi avec GitHub)
2. Pousse ton code sur GitHub :
   - Cree un repo sur https://github.com/new (nom : exosquelette, prive)
   - Dans le Terminal :

         git init
         git add .
         git commit -m "V1"
         git remote add origin https://github.com/TON_PSEUDO/exosquelette.git
         git push -u origin main

3. Sur Vercel, clique "Add New" > "Project"
4. Selectionne ton repo "exosquelette"
5. Dans "Environment Variables", ajoute TOUTES les variables de ton .env.local
   SAUF change NEXT_PUBLIC_APP_URL par l'URL que Vercel te donnera (genre https://exosquelette.vercel.app)
6. Clique "Deploy" — attends 2-3 minutes

### Configurer le Webhook Stripe (maintenant que tu as l'URL)

1. Retourne sur Stripe > Developers > Webhooks
2. Clique "Add endpoint"
3. URL : https://TON_DOMAINE.vercel.app/api/webhook
4. Evenements : selectionne "checkout.session.completed"
5. Clique "Add endpoint"
6. Copie le "Signing secret" (commence par whsec_)
7. Retourne sur Vercel > Settings > Environment Variables
8. Remplace STRIPE_WEBHOOK_SECRET par la vraie valeur
9. Redeploy (Vercel > Deployments > clic sur les 3 points > Redeploy)

C'est en ligne. Les clients arrivent sur /auth, creent un compte, paient, et font le Sprint.


## ETAPE 9 — Passer en mode reel (quand tu es pret)

1. Stripe : desactive le mode Test et passe en mode Live
2. Recree un produit a 49 euros en mode Live
3. Recupere les nouvelles cles Live (pk_live_, sk_live_)
4. Mets a jour les variables sur Vercel
5. Redeploy

A partir de la, les paiements sont reels.


## STRUCTURE DU PROJET

Voir CODEMAP.md pour le detail complet (exports, flux, services).

    exosquelette/                          (11 222 lignes)
    ├── app/
    │   ├── layout.js                      # Layout racine, meta, font Inter
    │   ├── page.js                        # Redirect vers /sprint
    │   ├── auth/page.js                   # Login / Signup Supabase
    │   ├── sprint/page.js                 # Auth + paywall + persistence + charge Sprint
    │   └── api/
    │       ├── scan/route.js              # Appel Anthropic (analyse CV + offres)
    │       ├── checkout/route.js          # Creation session Stripe
    │       └── webhook/route.js           # Confirmation paiement Stripe
    ├── components/
    │   ├── Sprint.jsx                     # Orchestrateur principal (429 lig.)
    │   └── sprint/
    │       ├── Onboarding.jsx             # Scan CV/offres, diagnostic (690 lig.)
    │       ├── Interrogation.jsx          # Forge de briques (953 lig.)
    │       ├── Duel.jsx                   # Simulation entretien (674 lig.)
    │       ├── EndScreen.jsx              # Livrables finaux (2 084 lig.)
    │       ├── panels.jsx                 # Vault, WorkBench, CrossRole (1 009 lig.)
    │       └── ui.jsx                     # Composants UI (238 lig.)
    ├── lib/
    │   ├── supabase.js                    # Client Supabase (browser + server)
    │   ├── stripe.js                      # Client Stripe
    │   ├── sprint-db.js                   # CRUD sprints + checkPaid
    │   └── sprint/
    │       ├── references.js              # Referentiel maitre — KPIs, roles, templates (726 lig.)
    │       ├── generators.js              # CV, bio, scripts, plan 90j, diagnostic (1 143 lig.)
    │       ├── linkedin.js                # Posts, commentaires, audit Dilts (1 078 lig.)
    │       ├── bricks.js                  # Seeds, matching KPI, versions (491 lig.)
    │       ├── scoring.js                 # Densite, couverture, effort, bluff (314 lig.)
    │       ├── analysis.js                # Readiness, verbes, externalisation (258 lig.)
    │       ├── dilts.js                   # Pyramide de Dilts (242 lig.)
    │       ├── offers.js                  # Parsing offres, cauchemars (160 lig.)
    │       └── redac.js                   # Filtre redactionnel (129 lig.)
    ├── supabase/
    │   └── schema.sql                     # Tables profiles, sprints, payments
    ├── .env.example                       # Template des variables
    ├── package.json                       # Dependances
    ├── jsconfig.json                      # Aliases de chemin (@/*)
    └── next.config.js                     # Config Next.js


## SI CA NE MARCHE PAS

Erreur "Module not found" : tape npm install a nouveau
Erreur "NEXT_PUBLIC_SUPABASE_URL" : verifie que .env.local existe et contient les bonnes valeurs
Page blanche : ouvre la console du navigateur (F12) et regarde l'erreur en rouge
Erreur 500 sur /api/scan : verifie ta cle ANTHROPIC_API_KEY
Le paiement ne debloque pas le Sprint : verifie que le webhook est configure sur Stripe

Pour tout autre probleme, copie l'erreur et colle-la dans Claude. Je la diagnostique.
