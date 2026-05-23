<?php

declare(strict_types=1);

/**
 * Phinx config. Reads DB_* env vars so the same file works
 * locally, inside Docker, and in CI.
 */

return [
    'paths' => [
        'migrations' => __DIR__ . '/migrations',
        'seeds'      => __DIR__ . '/seeds',
    ],
    'environments' => [
        'default_migration_table' => 'schema_migrations',
        'default_environment'     => 'default',
        'default' => [
            'adapter'   => 'mysql',
            'host'      => getenv('DB_HOST') ?: 'mysql',
            'port'      => (int)(getenv('DB_PORT') ?: 3306),
            'name'      => getenv('DB_NAME') ?: 'srwa',
            'user'      => getenv('DB_USER') ?: 'srwa',
            'pass'      => getenv('DB_PASS') ?: '',
            'charset'   => 'utf8mb4',
            'collation' => 'utf8mb4_0900_ai_ci',
        ],
    ],
    'version_order' => 'creation',
];
