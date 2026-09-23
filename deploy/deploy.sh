#!/usr/bin/env bash
# =============================================================================
#  Mise à jour de production du site Liratsu (Plesk / IONOS, via SSH)
#
#  Arborescence (APP_ROOT) :
#    releases/<horodatage>/   une copie du dépôt par déploiement
#    shared/.env              variables d'environnement (jamais dans git)
#    shared/media, shared/fanarts, shared/protected-files   fichiers envoyés
#    shared/backups, shared/logs
#    current -> releases/<…>  lien symbolique servi par PM2
#
#  Étapes : clone → install → sauvegarde BDD → migrations → build → bascule
#           → reload PM2 → test de santé. En cas d'échec : retour automatique à
#           la release précédente (et restauration de la BDD si les migrations
#           ont déjà tourné).
#
#  Usage :  ./deploy.sh [branche]        (défaut : main)
#           ./deploy.sh --rollback        revenir à la release précédente
# =============================================================================
set -Eeuo pipefail
# Node/npm/pm2 installés via nvm pour l'utilisateur du domaine (shell non interactif)
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"

APP_ROOT="${APP_ROOT:-/var/www/vhosts/liratsu.fr/app}"
REPO="${REPO:-git@github.com:CHANGE_ME/liratsu-site.git}"
BRANCH="${1:-main}"
KEEP=5
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/site/health}"
PM2_APP=liratsu

log() { printf '\033[1;34m✦ %s\033[0m\n' "$*"; }
die() { printf '\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

cd "$APP_ROOT"
PREVIOUS="$(readlink -f current 2>/dev/null || true)"

switch_to() {
  ln -sfn "$1" current.tmp && mv -Tf current.tmp current
  (cd current && pm2 startOrReload ecosystem.config.cjs --update-env)
  pm2 save >/dev/null
}

healthy() {
  for _ in $(seq 1 30); do
    curl -fsS "$HEALTH_URL" >/dev/null 2>&1 && return 0
    sleep 2
  done
  return 1
}

if [[ "${1:-}" == "--rollback" ]]; then
  TARGET="$(ls -1dt releases/*/ | sed -n 2p)"
  [[ -n "$TARGET" ]] || die "Aucune release précédente."
  log "Retour à $TARGET"
  switch_to "$(readlink -f "$TARGET")"
  healthy && log "Rollback OK" || die "Le site ne répond pas après rollback !"
  exit 0
fi

RELEASE="$APP_ROOT/releases/$(date +%Y%m%d-%H%M%S)"
DB_BACKUP=""
MIGRATED=0

on_error() {
  log "Échec — nettoyage et retour arrière"
  if [[ $MIGRATED -eq 1 && -n "$DB_BACKUP" ]]; then
    log "Restauration de la base depuis $DB_BACKUP"
    set -a; source shared/.env; set +a
    pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" "$DB_BACKUP" || true
  fi
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then switch_to "$PREVIOUS" || true; fi
  rm -rf "$RELEASE"
}
trap on_error ERR

log "Clonage de $BRANCH dans $RELEASE"
git clone --depth 1 --branch "$BRANCH" "$REPO" "$RELEASE"

log "Liens vers les fichiers partagés"
mkdir -p shared/{media,fanarts,protected-files,backups,logs}
ln -sfn "$APP_ROOT/shared/.env" "$RELEASE/.env"
for d in media fanarts protected-files; do ln -sfn "$APP_ROOT/shared/$d" "$RELEASE/$d"; done

cd "$RELEASE"
log "Installation des dépendances (npm ci)"
npm ci --no-audit --no-fund
npm run fonts

log "Sauvegarde de la base avant migration"
set -a; source .env; set +a
DB_BACKUP="$APP_ROOT/shared/backups/pre-deploy-$(date +%Y%m%d-%H%M%S).dump"
pg_dump -Fc -d "$DATABASE_URL" -f "$DB_BACKUP"

log "Migrations"
MIGRATED=1
NODE_ENV=production npm run migrate

log "Build de production"
NODE_ENV=production npm run build

cd "$APP_ROOT"
log "Bascule vers la nouvelle release"
switch_to "$RELEASE"
if ! healthy; then
  false # déclenche on_error → retour à la release précédente
fi
trap - ERR

log "Nettoyage (on garde les $KEEP dernières releases)"
ls -1dt releases/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf

log "Déploiement terminé : $(readlink -f current)"
