# ADR 001 — Risques production et sessionStorage

**Date :** 9 mars 2026
**Statut :** Accepté

## Contexte

Le sprint Abneg@tion stocke l'état utilisateur (briques, rôle cible, offres, vault) côté client. En production, trois risques ont été identifiés :

1. **sessionStorage volatile** — L'état est perdu si l'utilisateur ferme l'onglet avant la sync Supabase.
2. **Race condition localStorage/useState** — En dev (React Strict Mode désactivé), le double-mount ne pose pas de problème, mais la lecture asynchrone de localStorage dans useEffect crée un flash de state vide.
3. **Auto-save debounce** — Le debounce de 2 secondes peut perdre les dernières modifications si l'utilisateur quitte la page.

## Options évaluées

| Option | Avantage | Inconvénient |
|--------|----------|--------------|
| Tout en Supabase (pas de local) | Pas de perte | Latence sur chaque action |
| localStorage + sync périodique | Résilient | Conflit si multi-onglet |
| sessionStorage + sync Supabase 2s | Rapide | Perte si fermeture brutale |

## Décision

**sessionStorage + sync Supabase avec debounce 2s + lecture synchrone dans useState.**

- `useState(() => JSON.parse(sessionStorage.getItem(...)))` pour éviter le flash.
- `beforeunload` déclenche un save immédiat (sans debounce).
- Le state Supabase fait foi au rechargement.

## Conséquences

- L'état local est toujours disponible sans latence réseau.
- La perte maximale est de 2 secondes de travail en cas de crash navigateur.
- Pas de gestion multi-onglet (un seul sprint actif par session).
