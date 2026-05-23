<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateAdmins extends AbstractMigration
{
    public function up(): void
    {
        $path = __DIR__ . '/../sql/002_admins.sql';
        $sql  = file_get_contents($path);
        if ($sql === false) {
            throw new RuntimeException("Admins schema file missing: {$path}");
        }
        foreach ($this->splitStatements($sql) as $stmt) {
            $this->execute($stmt);
        }
    }

    public function down(): void
    {
        $this->execute('DROP TABLE IF EXISTS admins');
    }

    /** @return list<string> */
    private function splitStatements(string $sql): array
    {
        $clean = preg_replace('/^\s*--.*$/m', '', $sql) ?? $sql;
        $parts = array_map('trim', explode(';', $clean));
        return array_values(array_filter($parts, static fn (string $s): bool => $s !== ''));
    }
}
