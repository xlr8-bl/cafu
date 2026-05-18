<?php

declare(strict_types=1);

namespace Srwa\Models;

use Srwa\Database;

final class MenuItem
{
    /** @return list<array<string,mixed>> */
    public static function all(?string $categorySlug = null): array
    {
        $sql = 'SELECT mi.id, mi.name, mi.description, mi.price_cents, mi.image_url, mi.tags,
                       mc.slug AS category_slug, mc.name AS category_name
                FROM menu_items mi
                JOIN menu_categories mc ON mc.id = mi.category_id
                WHERE mi.is_available = 1';
        $params = [];
        if ($categorySlug !== null) {
            $sql .= ' AND mc.slug = :slug';
            $params['slug'] = $categorySlug;
        }
        $sql .= ' ORDER BY mc.sort_order, mi.name';

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);

        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['tags'] = $row['tags'] !== null ? json_decode((string) $row['tags'], true) : [];
        }
        return $rows;
    }

    public static function find(int $id): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, name, price_cents, is_available FROM menu_items WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }
}
