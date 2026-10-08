#!/bin/bash
# Test d'intégration PocketBase en local (même montage que la CI, .github/workflows/ci.yml) :
# base vierge dans .pb/, hooks du dépôt, schéma, puis la suite d'intégration. Identifiants locaux de la CI, jamais ceux d'un serveur.
#   bash scripts/itest-local.sh            # toute la suite
#   bash scripts/itest-local.sh -t "lune"  # un test (il doit appeler ensureAB(), CLAUDE.md)
set -u
cd "$(dirname "$0")/.."
PB_VERSION="${PB_VERSION:-0.36.0}"
EMAIL=ci@test.local
PASS=ci-password-123
mkdir -p .pb
if [ ! -x .pb/pocketbase ]; then
  curl -sSL -o .pb/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"
  unzip -oq .pb/pb.zip pocketbase -d .pb && rm .pb/pb.zip
fi
# Arrête un PocketBase local déjà lancé sur 8090 (jamais un autre processus).
ps -eo pid,args | awk '$2 ~ /pocketbase$/ && /127.0.0.1:8090/ {print $1}' | xargs -r kill
sleep 1
rm -rf .pb/pb_data
# 6.14.130 : migrations écrites seules par PocketBase quand on modifie le schéma dans son interface (base jetable) ; elles
# empêchaient le démarrage (les collections viennent de pb_schema.json et de la synchronisation au démarrage).
rm -rf .pb/pb_migrations
.pb/pocketbase superuser upsert "$EMAIL" "$PASS" --dir .pb/pb_data >/dev/null
COSMIC_HOOKS_AUTOUPDATE=0 nohup .pb/pocketbase serve --http 127.0.0.1:8090 --dir .pb/pb_data --hooksDir pocketbase/pb_hooks > .pb/pb.log 2>&1 &
for i in $(seq 1 30); do curl -sf 127.0.0.1:8090/api/health >/dev/null && break; sleep 1; done
PB_URL=http://127.0.0.1:8090 PB_ADMIN_EMAIL="$EMAIL" PB_ADMIN_PASSWORD="$PASS" node pocketbase/setup.mjs >/dev/null 2>&1
PB_TEST_URL=http://127.0.0.1:8090 PB_TEST_ADMIN_EMAIL="$EMAIL" PB_TEST_ADMIN_PASSWORD="$PASS" \
  npx vitest run src/services/pocketbase.integration.test.ts "$@" 2>&1 | grep -E "×|→|Tests |integration.test.ts:[0-9]+"
