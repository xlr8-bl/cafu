#!/usr/bin/env sh
# Apply all pending DB migrations. Idempotent.
# Run inside the php image: `docker compose run --rm migrate`.
set -eu

cd /var/www/html
exec vendor/bin/phinx migrate -c /srwa-db/phinx.php
