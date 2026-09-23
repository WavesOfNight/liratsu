# Liratsu — site officiel

Site vitrine + boutique + espace communauté + arcade de la streameuse **Liratsu**,
entièrement administrable. Direction artistique *Frutiger Aero × Y2K × scene kid cute*.

- **Stack** : Next.js 16 (App Router) · TypeScript strict · Payload CMS 3 (admin `/admin`) · PostgreSQL
- **Paiement** : Stripe Checkout + PayPal, validés **uniquement par webhook signé**, même modèle de commande
- **Print-on-demand** : Gelato (création de commande + webhooks de suivi)
- **Emails** : Nodemailer (SMTP configuré dans l'admin)
- **Mini-jeu** : *The Saac* (Canvas 2D TypeScript, lazy-loadé)
- Éditeur et gestionnaire juridique : **Reads Records** · Codé par **El Technico Lionel**

---

## Sommaire

1. [Démarrage en local](#1-démarrage-en-local)
2. [Premiers pas dans l'admin](#2-premiers-pas-dans-ladmin)
3. [Architecture](#3-architecture)
4. [Tests](#4-tests)
5. [Déploiement sur Plesk / IONOS (100 % SSH)](#5-déploiement-sur-plesk--ionos-100--ssh)
6. [Webhooks Stripe, PayPal, Gelato](#6-webhooks-stripe-paypal-gelato)
7. [Sauvegardes et restauration](#7-sauvegardes-et-restauration)
8. [Bascule du site de maintenance sans coupure](#8-bascule-du-site-de-maintenance-sans-coupure)
9. [Mises à jour](#9-mises-à-jour)

---

## 1. Démarrage en local

Prérequis : Node.js ≥ 20.9 (testé avec Node 24), npm.

```bash
npm ci
npm run fonts          # copie Fredoka + Quicksand (woff2) depuis @fontsource vers public/fonts
cp .env.example .env   # puis compléter PAYLOAD_SECRET et ENCRYPTION_KEY (openssl rand -hex 32)
```

Base de données : soit un PostgreSQL existant (`DATABASE_URL`), soit la base **embarquée**
de développement, sans installation (à laisser tourner dans un terminal) :

```bash
npm run db:local       # postgres://liratsu:liratsu@127.0.0.1:5432/liratsu
```

Puis :

```bash
npm run seed           # contenus de démo, pages légales, produits/codes TEST, compte admin (identifiants affichés)
npm run dev            # http://localhost:3000  ·  admin : http://localhost:3000/admin
```

### Polices (RGPD : aucun appel à Google Fonts)

Les polices sont auto-hébergées. Commande utilisée :

```bash
npm run fonts   # = node scripts/copy-fonts.mjs → public/fonts/{fredoka,quicksand}-latin[-ext]-{500,600,700}-normal.woff2
```

Elles sont déclarées via `next/font/local` (`src/lib/fonts.ts`, `font-display: swap`).

### Outils de développement

| Commande | Rôle |
| --- | --- |
| `npx payload run scripts/dev-sections.ts -- shop=on community=on` | changer l'état des sections sans passer par l'admin |
| `npx payload run scripts/dev-simulate-payment.ts` | simuler un paiement validé (stock, promo, facture PDF, email journalisé) sans clés |
| `npm run generate:types` | régénérer `src/payload-types.ts` après modification des collections |
| `npm run migrate:create -- nom` | créer une migration après modification du schéma |

---

## 2. Premiers pas dans l'admin

1. **Se connecter** avec le compte créé par le seed, **changer le mot de passe** et **activer la 2FA**
   (fiche du compte > « Double authentification »). Tant qu'un compte 2FA n'a pas saisi son code, l'API
   lui refuse tout accès.
2. **Réglages > Clés API & services** (rôle Admin) : Twitch, YouTube, Stripe (test + live), PayPal
   (sandbox + live), Gelato, SMTP, statistiques. Les secrets sont **chiffrés** (AES-256-GCM) et ne sont
   jamais réaffichés. Les variables d'environnement de `.env.example` ne servent que de repli.
3. **Légal > Identité légale** : informations de Reads Records et d'IONOS → injectées dans les pages
   légales (`{{editeur.nom}}`, …). Puis **Légal > Pages légales** (historique des versions). Voir
   [`LEGAL_TODO.md`](LEGAL_TODO.md).
4. **Réglages > Réglages du site > Sections** : chaque section peut être *Activée*, *Désactivée* ou
   *« Bientôt ? »* (teaser + formulaire « préviens-moi »). Par défaut : Communauté et Boutique en « Bientôt ? ».
5. **Boutique > Paramètres boutique** : mode test/sandbox (bandeau visible sur le site), TVA, factures.
   Supprimer les produits/codes `[TEST]` avant l'ouverture.
6. **Réglages > Thème** : palette, bulles, poissons, sons, curseurs · **Réglages > Easter eggs**.

Rôles : **Admin** (tout), **Liratsu / Éditrice** (contenu + boutique), **Modérateur** (communauté).
Toutes les modifications sont tracées dans **Réglages > Journal d'activité**.

---

## 3. Architecture

```
src/
  app/(frontend)/       pages publiques (accueil, biographie, communaute, boutique, arcade, liens, legal, 404)
  app/(payload)/        admin Payload + API REST Payload (/api/<collection>)
  app/api/site/         API du site : boutique, webhooks, communauté, jeu, 2FA, santé
  collections/ globals/ modèles Payload (contenu, boutique, communauté, arcade, légal)
  blocks/               blocs réordonnables des pages Accueil/Biographie
  components/           UI (fenêtres aero, logo, fond animé, bandeau cookies, easter eggs…)
  game/saac/            moteur de The Saac (+ registre pour de futures bornes)
  lib/                  logique serveur (paiements, Gelato, emails, factures, Twitch, sécurité)
  lib/shop/pricing.ts   calculs panier/promo/port/TVA — purs et testés
  migrations/           migrations PostgreSQL versionnées
  proxy.ts              CSP avec nonce (site public)
scripts/                seed, polices, base locale, outils de dev
deploy/                 deploy.sh, backup.sh, restore.sh, nginx-liratsu.conf
tests/unit, tests/e2e   Vitest, Playwright
```

Sécurité : CSP stricte à nonce (embeds autorisés), HSTS et en-têtes durcis, rate limiting sur toutes les
API publiques, vérification d'origine (CSRF), validation zod, signatures de webhooks vérifiées, uploads
filtrés (type, taille, décodage sharp), secrets chiffrés, 2FA appliquée côté API, cookies signés HMAC.

RGPD : polices locales, aucun contenu tiers ni statistique avant consentement (bandeau CNIL,
« Tout refuser » au même niveau que « Tout accepter »), IP hachées, email « préviens-moi » à usage unique.

---

## 4. Tests

```bash
npm test                 # tests unitaires (panier, promos, TVA, statuts, anti-triche, sécurité, webhooks)
npm run typecheck
npm run lint
npx playwright install chromium
npm run test:e2e         # smoke tests (bandeau CNIL, CSP, 404, légal, sitemap)
```

Parcours d'achat complet en **sandbox Stripe** : clés test saisies dans l'admin, boutique activée, puis

```bash
stripe listen --forward-to localhost:3000/api/site/webhooks/stripe   # dans un autre terminal
E2E_STRIPE=1 npm run test:e2e -- checkout
```

---

## 5. Déploiement sur Plesk / IONOS (100 % SSH)

Hypothèses : serveur IONOS avec Plesk Obsidian, domaine `liratsu.fr` déjà créé dans Plesk, accès SSH root
(ou sudo). Remplacer les valeurs `CHANGE_ME`. Les commandes `plesk bin …` peuvent varier selon la
version : en cas de doute, `plesk bin <utilitaire> --help`.

### 5.1 Paquets système

```bash
# PostgreSQL via l'installeur Plesk (ou apt install postgresql si géré hors Plesk)
plesk installer add --components postgresql
# Outils clients (pg_dump / pg_restore pour les sauvegardes)
apt-get install -y postgresql-client git curl
```

Node.js 22 LTS pour l'utilisateur système du domaine (sans dépendre de l'interface) :

```bash
SYSUSER=$(plesk bin domain --info liratsu.fr | awk -F': *' '/FTP Login|Login/ {print $2; exit}')
su - "$SYSUSER" -s /bin/bash -c 'curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && . ~/.nvm/nvm.sh && nvm install 22 && npm i -g pm2'
```

### 5.2 Base PostgreSQL

```bash
DBPASS=$(openssl rand -hex 20)
plesk bin database --create liratsu -domain liratsu.fr -type postgresql -server localhost:5432
plesk bin database --create-dbuser liratsu -passwd "$DBPASS" -domain liratsu.fr -server localhost:5432 -database liratsu -type postgresql
echo "DATABASE_URL=postgres://liratsu:$DBPASS@127.0.0.1:5432/liratsu"
```

Alternative sans Plesk : `sudo -u postgres psql -c "CREATE ROLE liratsu LOGIN PASSWORD '…'" -c "CREATE DATABASE liratsu OWNER liratsu ENCODING 'UTF8'"`.

### 5.3 Arborescence, variables d'environnement, premier déploiement

Toutes les commandes suivantes sont exécutées **en tant que l'utilisateur du domaine** (`su - $SYSUSER -s /bin/bash`) :

```bash
APP=/var/www/vhosts/liratsu.fr/app
mkdir -p $APP/{releases,shared/{media,fanarts,protected-files,backups,logs}}
nano $APP/shared/.env   # contenu de .env.example complété :
#   DATABASE_URL=…  PAYLOAD_SECRET=$(openssl rand -hex 32)  ENCRYPTION_KEY=$(openssl rand -hex 32)
#   NEXT_PUBLIC_SERVER_URL=https://liratsu.fr
chmod 600 $APP/shared/.env

# Clé de déploiement (lecture seule) à ajouter au dépôt Git
ssh-keygen -t ed25519 -N '' -f ~/.ssh/liratsu_deploy && cat ~/.ssh/liratsu_deploy.pub
printf 'Host github.com\n  IdentityFile ~/.ssh/liratsu_deploy\n' >> ~/.ssh/config

# Récupération du script puis premier déploiement (clone, npm ci, migrations, build, PM2)
git clone --depth 1 git@github.com:CHANGE_ME/liratsu-site.git /tmp/liratsu && cp /tmp/liratsu/deploy/*.sh $APP/ && chmod +x $APP/*.sh
REPO=git@github.com:CHANGE_ME/liratsu-site.git $APP/deploy.sh main

# Contenus initiaux (une seule fois) — affiche les identifiants admin
cd $APP/current && npm run seed

# Démarrage automatique de PM2 au boot (la commande affichée est à lancer en root)
pm2 startup systemd
```

> Le premier déploiement démarre PM2 sur `127.0.0.1:3000`, **non exposé** : le site de maintenance
> reste en ligne tant que le proxy n'est pas activé (§ 8).

### 5.4 Reverse proxy et SSL

```bash
# Certificat Let's Encrypt (extension Plesk, en CLI)
plesk bin extension --exec letsencrypt cli.php -d liratsu.fr -d www.liratsu.fr -m CHANGE_ME@reads-records.com
plesk bin subscription --update-web-server-settings liratsu.fr -ssl-redirect true 2>/dev/null || true
```

Le reverse proxy nginx → Next.js est appliqué au moment de la bascule (§ 8).

### Alternative : extension Node.js de Plesk

Si vous préférez l'extension Node.js de Plesk à PM2 : `plesk ext nodejs --help` liste les commandes
(activation de Node sur le domaine, *Application root* = `app/current`, *Startup file* =
`node_modules/next/dist/bin/next`, arguments `start`). PM2 reste recommandé : il permet le rollback
instantané de `deploy.sh`.

---

## 6. Webhooks Stripe, PayPal, Gelato

| Service | URL | Événements |
| --- | --- | --- |
| Stripe | `https://liratsu.fr/api/site/webhooks/stripe` | `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired` |
| PayPal | `https://liratsu.fr/api/site/webhooks/paypal` | `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED` |
| Gelato | `https://liratsu.fr/api/site/webhooks/gelato?token=<jeton>` | statut de commande + codes de suivi |

**Stripe** (CLI Stripe, une fois en mode test et une fois en mode live avec `--live`) :

```bash
stripe webhook_endpoints create --url https://liratsu.fr/api/site/webhooks/stripe \
  --enabled-events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired
```

Copier le `secret` (`whsec_…`) retourné dans l'admin (Clés API > Stripe > Secret de webhook).

**PayPal** (API REST ; `api-m.sandbox.paypal.com` pour la sandbox) :

```bash
TOKEN=$(curl -s -u "CLIENT_ID:SECRET" -d grant_type=client_credentials https://api-m.paypal.com/v1/oauth2/token | sed 's/.*"access_token":"\([^"]*\)".*/\1/')
curl -s https://api-m.paypal.com/v1/notifications/webhooks -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"url":"https://liratsu.fr/api/site/webhooks/paypal","event_types":[{"name":"PAYMENT.CAPTURE.COMPLETED"},{"name":"PAYMENT.CAPTURE.DENIED"},{"name":"PAYMENT.CAPTURE.REFUNDED"}]}'
```

Copier l'`id` retourné dans l'admin (Clés API > PayPal > Webhook ID).

**Gelato** : générer un jeton (`openssl rand -hex 24`), le saisir dans l'admin (Clés API > Gelato >
Jeton secret) puis déclarer l'URL avec `?token=…` dans le tableau de bord Gelato
(*Developer > Webhooks*), événements de statut de commande et de suivi.

Rappel : **la commande n'est validée que par le webhook**, jamais par le retour navigateur ; chaque
événement est traité une seule fois (idempotence).

---

## 7. Sauvegardes et restauration

```bash
# Tâche cron quotidienne (utilisateur du domaine) : base + médias, rotation 14 jours
crontab -l 2>/dev/null | { cat; echo '17 4 * * * /var/www/vhosts/liratsu.fr/app/current/deploy/backup.sh >> /var/www/vhosts/liratsu.fr/app/shared/logs/backup.log 2>&1'; } | crontab -
```

Les sauvegardes sont dans `app/shared/backups` (`db-*.dump`, `files-*.tar.gz`). Une sauvegarde est aussi
faite **avant chaque migration** par `deploy.sh`. Pensez à une copie hors serveur (rclone, stockage IONOS).

### Restaurer une sauvegarde

```bash
ls /var/www/vhosts/liratsu.fr/app/shared/backups
/var/www/vhosts/liratsu.fr/app/current/deploy/restore.sh 20261012-041700
```

---

## 8. Bascule du site de maintenance sans coupure

1. Le nouveau site tourne déjà sous PM2 sur `127.0.0.1:3000` (§ 5.3). Vérifier en local sur le serveur :
   ```bash
   curl -fsS http://127.0.0.1:3000/api/site/health && curl -s -H 'Host: liratsu.fr' http://127.0.0.1:3000/ | head -c 300
   ```
2. Remplir l'admin (clés, identité légale, contenus) — possible avant la bascule via un tunnel SSH :
   `ssh -L 3000:127.0.0.1:3000 user@serveur` puis http://localhost:3000/admin.
3. Garder une copie du site de maintenance : `cp -a /var/www/vhosts/liratsu.fr/httpdocs /var/www/vhosts/liratsu.fr/maintenance-backup`
4. **Bascule** : activer le proxy nginx. Plesk valide la configuration puis recharge nginx à chaud
   (aucune connexion coupée) :
   ```bash
   plesk bin domain --update-web-server-settings liratsu.fr -additional-nginx-settings-file /var/www/vhosts/liratsu.fr/app/current/deploy/nginx-liratsu.conf
   curl -sI https://liratsu.fr | head -5
   ```
5. **Retour arrière** (si besoin) : même commande avec un fichier vide → le site de maintenance statique est
   de nouveau servi.
   ```bash
   : > /tmp/empty.conf && plesk bin domain --update-web-server-settings liratsu.fr -additional-nginx-settings-file /tmp/empty.conf
   ```
6. Une fois stable : déclarer les webhooks (§ 6), passer la boutique en mode live, supprimer les données `[TEST]`.

---

## 9. Mises à jour

```bash
/var/www/vhosts/liratsu.fr/app/deploy.sh main        # pull, install, sauvegarde, migrations, build, reload, test de santé
/var/www/vhosts/liratsu.fr/app/deploy.sh --rollback  # revenir instantanément à la release précédente
```

`deploy.sh` construit chaque version dans un dossier `releases/<date>` séparé : le site en ligne n'est
jamais interrompu pendant le build. Si le build, les migrations ou le test de santé échouent, la version
précédente est remise en service (et la base restaurée si des migrations avaient été appliquées).

---

## Informations encore nécessaires

- Adresse du dépôt Git de production et accès SSH au serveur IONOS (utilisateur du domaine).
- URL de la chaîne YouTube + ID de chaîne (UC…), à saisir dans l'admin.
- Clés Twitch (Client ID/Secret), Stripe (test + live), PayPal (sandbox + live), Gelato, SMTP : à saisir dans l'admin.
- Informations légales de Reads Records, médiateur de la consommation, coordonnées IONOS vérifiées (voir `LEGAL_TODO.md`).
- Produits réels : visuels, prix, productUid Gelato et fichiers d'impression.
- Textes de la biographie (parcours, jeux préférés, setup) et visuels (fonds d'écran, image Open Graph).
