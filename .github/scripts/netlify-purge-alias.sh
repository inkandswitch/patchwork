#!/usr/bin/env bash
# Delete every deploy on $NETLIFY_SITE_ID published under $ALIAS, so the alias
# is unbound and the next deploy is the only thing serving it.
set -euo pipefail

api() { curl -sf -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" "$@"; }

for page in 1 2 3 4 5; do
  deploys=$(api "https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID/deploys?per_page=100&page=$page")
  [ "$(echo "$deploys" | jq length)" = 0 ] && break
  for id in $(echo "$deploys" | jq -r --arg a "$ALIAS" \
    '.[] | select(.branch == $a or (.deploy_url // "" | contains("//" + $a + "--"))) | .id'); do
    echo "deleting deploy $id"
    api -X DELETE "https://api.netlify.com/api/v1/deploys/$id" -o /dev/null
  done
done
