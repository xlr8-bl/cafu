<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class InitialSchema extends AbstractMigration
{
    public function up(): void
    {
        $path = __DIR__ . '/../sql/001_initial_schema.sql';
        $sql  = file_get_contents($path);
        if ($sql === false) {
            throw new RuntimeException("Initial schema file missing: {$path}");
        }
        foreach ($this->splitStatements($sql) as $stmt) {
            $this->execute($stmt);
        }
    }

    public function down(): void
    {
        // Reverse FK order so InnoDB lets each DROP through.
        $tables = ['order_items', 'reservations', 'orders', 'menu_items', 'menu_categories', 'customers'];
        foreach ($tables as $t) {
            $this->execute("DROP TABLE IF EXISTS {$t}");
        }
    }

    /**
     * Strip line comments and split on `;`. Good enough for our schema file
     * (no stored procedures, no DELIMITER blocks).
     *
     * @return list<string>
     */
    private function splitStatements(string $sql): array
    {
        $clean = preg_replace('/^\s*--.*$/m', '', $sql) ?? $sql;
        $parts = array_map('trim', explode(';', $clean));
        return array_values(array_filter($parts, static fn (string $s): bool => $s !== ''));
    }
}
