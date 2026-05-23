<?php

declare(strict_types=1);

/**
 * CLI: seed an admin account.
 *
 * Usage (inside the php container):
 *   docker compose exec php php /var/www/html/bin/create-admin.php <email> <password> "<name>"
 *
 * Example:
 *   docker compose exec php php /var/www/html/bin/create-admin.php \
 *     chef@cafu.local "TempPass1234" "Chef Ngalle"
 */

require __DIR__ . '/../vendor/autoload.php';

use Srwa\Models\Admin;

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from the command line.\n");
    exit(1);
}

[$_, $email, $password, $name] = array_pad($argv, 4, null);

if ($email === null || $password === null || $name === null) {
    fwrite(STDERR, "Usage: create-admin.php <email> <password> <name>\n");
    exit(2);
}

try {
    $id = Admin::create((string) $email, (string) $password, (string) $name);
    fwrite(STDOUT, "Created admin #{$id} <{$email}>.\n");
    exit(0);
} catch (\Throwable $e) {
    fwrite(STDERR, "Failed: " . $e->getMessage() . "\n");
    exit(1);
}
