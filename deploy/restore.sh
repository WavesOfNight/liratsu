#!/usr/bin/env bash
# =============================================================================
#  Restauration d'une sauvegarde (base + fichiers).
#    ./restore.sh 20261012-041700
#  ⚠️ Écrase la base et les fichiers actuels. Le site est arrêté pendant l'opération.
# =============================================================================
set -Eeuo pipefail
# Node/npm/pm2 installés via nvm pour l'utilisateur du domaine (shell non interactif)
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"

APP_ROOT="${APP_ROOT:-/var/www/vhosts/liratsu.fr/app}"
STAMP="${1:?Usage : restore.sh <horodatage> (voir ls shared/backups)}"
SRC="$APP_ROOT/shared/backups"

[[ -f "$SRC/db-$STAMP.dump" ]] || { echo "Introuvable : $SRC/db-$STAMP.dump"; exit 1; }
set -a; source "$APP_ROOT/shared/.env"; set +a

read -r -p "Restaurer la sauvegarde $STAMP (écrase les données actuelles) ? [oui/NON] " ok
[[ "$ok" == "oui" ]] || exit 1

pm2 stop liratsu || true
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" "$SRC/db-$STAMP.dump"
if [[ -f "$SRC/files-$STAMP.tar.gz" ]]; then
  tar -C "$APP_ROOT/shared" -xzf "$SRC/files-$STAMP.tar.gz"
fi
pm2 start liratsu
echo "Restauration terminée."
