# Dégustathèque

Application interne Quick (pôle R&D) pour centraliser l'historique des dégustations de produits alimentaires : recherche par ingrédient/dégustateur/code produit, moyennes et écarts-type par version, profil sensoriel, prises de photo, et circuit achats (passage en FR, prix, comité inno).

## Fonctionnalités

- **En cours** — sessions actives (produit / ingrédient / recette), version en cours de test.
- **Session** — versions successives, composition et dosages, moyennes, radar de profil sensoriel, dispersion du panel, commentaires, photos.
- **Saisir une grille** — échelle hédonique 9 points, profil descriptif (12 descripteurs), test JAR, commentaire, photo.
- **Historique** — recherche plein texte (produit, ingrédient, dégustateur, code, mots-clés).
- **Produits** — vue d'ensemble de toutes les sessions du pôle.
- **Achats et prix** — un compte R&D rattache un acheteur et fait le « passage en FR » ; l'acheteur renseigne alors le prix depuis son propre onglet « Mes achats », avec filtre par comité inno.
- **Admin** — création des comptes, pôle de rattachement (R&D / Marketing / Qualité / Achats).

Authentification par email/mot de passe (comptes créés par un admin), droits différenciés par pôle.

## Stack

- **`server/`** — Node.js, Express, Prisma + Postgres, sessions par cookie (stockées en base), photos sur Supabase Storage. `server/src/app.js` exporte l'app Express ; `server/src/index.js` (local) et `api/index.js` (Vercel) sont les deux points d'entrée qui la font tourner.
- **`web/`** — React + Vite (SPA), React Router, thème Quick (rouge `#e21f26`, Baloo 2 / Rubik).

Hébergement 100% gratuit : **Supabase** (base Postgres + stockage fichiers, plan gratuit) pour la persistance, **Vercel** (plan gratuit) pour faire tourner l'API et servir le frontend. L'API tourne en fonctions serverless (pas de serveur qui reste allumé), donc rien ne doit être gardé en mémoire ou sur disque entre deux requêtes — c'est déjà le cas ici : les sessions de connexion et les photos vivent sur Supabase, pas sur Vercel.

## Créer le projet Supabase (une fois)

1. [supabase.com](https://supabase.com) → **New project** (gratuit, pas de carte requise).
2. **Project Settings → Database → Connection string** : copiez-y **deux** chaînes différentes (visibles sur la même page) :
   - la connexion **pooled / Transaction** (port `6543`, contient `pgbouncer=true`) → `DATABASE_URL`
   - la connexion **directe** (port `5432`) → `DIRECT_URL`

   (La pooled sert aux requêtes de l'app depuis les fonctions serverless ; la directe sert uniquement aux migrations.)
3. **Project Settings → API** → copiez `Project URL` (→ `SUPABASE_URL`) et la clé **`service_role`** (→ `SUPABASE_SERVICE_ROLE_KEY`, à garder secrète, elle contourne les règles d'accès).
4. **Storage** → créez un bucket nommé `photos`, réglé en **Public**.

## Démarrage en local

```bash
cd server
cp .env.example .env   # puis remplissez avec vos valeurs Supabase
npm install
npx prisma migrate deploy
node prisma/seed.js         # comptes de démo + sessions d'exemple
npm run dev                 # API sur http://localhost:4000
```

```bash
cd web
npm install
npm run dev                 # app sur http://localhost:5173 (proxy /api vers :4000)
```

Ouvrez http://localhost:5173. (Le développement local pointe directement sur votre projet Supabase — une seule base de données à gérer.)

## Comptes de démonstration

Mot de passe pour tous : `Degustation2026!`

| Email | Pôle | Rôle |
|---|---|---|
| amelie.rouvier@quick.fr | R&D | admin |
| karim.benali@quick.fr | R&D | |
| julien.perrot@quick.fr | R&D | |
| sophie.lemoine@quick.fr | Qualité | |
| thomas.vasseur@quick.fr | Marketing | |
| ines.marechal@quick.fr | Achats | |

Pensez à changer ces mots de passe (et à créer vos propres comptes depuis l'onglet Admin) avant tout usage réel.

## Déploiement (Vercel, gratuit)

1. Sur [vercel.com](https://vercel.com), **Add New → Project**, connectez le dépôt GitHub. `vercel.json` à la racine configure déjà le build et le routage (`/api/*` vers le serveur, le reste vers l'app React) — Vercel le détecte automatiquement.
2. Avant de déployer, ajoutez les variables d'environnement (**Settings → Environment Variables**) : `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=photos`, `SESSION_SECRET=<valeur aléatoire>` — les mêmes valeurs que dans votre `.env` local.
3. Lancez le déploiement.
4. Les tables ne se créent pas toutes seules : depuis votre machine, avec `DATABASE_URL`/`DIRECT_URL` pointant vers Supabase, lancez une fois `cd server && npx prisma migrate deploy && node prisma/seed.js` pour créer le schéma et les comptes de démo.
5. Ouvrez l'URL fournie par Vercel — c'est l'app, en ligne, gratuite.

**Limites du plan gratuit Vercel** à connaître :
- Photos limitées à 4 Mo (taille max d'une requête pour une fonction serverless) — largement suffisant pour une photo prise depuis l'app, plus juste pour une photo haute résolution importée depuis la galerie.
- Fonctions serverless avec un léger délai de démarrage à froid après une période sans trafic (une ou deux secondes, pas un vrai temps de veille comme sur d'autres hébergeurs).

## Structure

```
vercel.json                config de build/routage Vercel
api/index.js                point d'entrée serverless (réexporte l'app Express)
server/
  .env.example              variables à copier dans .env
  prisma/schema.prisma      modèle de données
  prisma/seed.js            jeu de données de démo
  src/app.js                 l'app Express (routes, sessions, middlewares)
  src/index.js               point d'entrée local (`app.listen`)
  src/routes/                endpoints API (auth, users, sessions, photos)
  src/storage.js             upload des photos vers Supabase Storage
web/
  src/pages/                  un composant par écran
  src/context/                auth, données, caméra, en-tête
  src/lib/compute.js          moyennes, écart-type, radar, recherche
```
