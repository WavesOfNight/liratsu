#!/usr/bin/env bash
# =============================================================================
#  Sauvegarde quotidienne : base PostgreSQL + fichiers envoyés (médias, fanarts,
#  téléchargements). Rotation : 14 jours en local.
#
#  Cron (tous les jours à 4 h 17) :
#    17 4 * * * /var/www/vhosts/liratsu.fr/app/current/deploy/backup.sh >> /var/www/vhosts/liratsu.fr/app/shared/logs/backup.log 2>&1
#
#  Restauration : voir README, section « Restaurer une sauvegarde ».
# =============================================================================
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/var/www/vhosts/liratsu.fr/app}"
DEST="$APP_ROOT/shared/backups"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

set -a; source "$APP_ROOT/shared/.env"; set +a
mkdir -p "$DEST"

pg_dump -Fc -d "$DATABASE_URL" -f "$DEST/db-$STAMP.dump"
tar -C "$APP_ROOT/shared" -czf "$DEST/files-$STAMP.tar.gz" media fanarts protected-files

find "$DEST" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'files-*.tar.gz' -o -name 'pre-deploy-*.dump' \) -mtime +"$KEEP_DAYS" -delete
echo "$(date -Is) sauvegarde OK : db-$STAMP.dump, files-$STAMP.tar.gz"

# Copie hors serveur recommandée (exemple, à adapter) :
# rclone copy "$DEST" remote:liratsu-backups --max-age 25h
