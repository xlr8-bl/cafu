<?php

declare(strict_types=1);

namespace Srwa\Models;

use Srwa\Database;

/**
 * Lightweight market-basket recommender.
 * Given a set of menu_item_ids, returns the items most often co-ordered with them,
 * ranked by lift (P(B|A) / P(B)).
 *
 * The proposal asks for "simple data mining": this is Apriori-flavoured association,
 * computed on demand from the orders table. For larger volumes, the Python script
 * in /ml exports a precomputed table.
 */
final class Recommendation
{
    /**
     * @param list<int> $basket menu_item_ids currently in the cart
     * @return list<array{id:int, name:string, score:float, image_url:?string, price_cents:int}>
     */
    public static function forBasket(array $basket, int $limit = 4): array
    {
        $basket = array_values(array_unique(array_filter($basket, static fn ($v) => $v > 0)));
        if ($basket === []) {
            return self::popular($limit);
        }

        $pdo = Database::connection();

        $stmt = $pdo->query('SELECT COUNT(*) FROM orders WHERE status != "cancelled"');
        $totalOrders = max(1, (int) $stmt->fetchColumn());

        $placeholders = implode(',', array_fill(0, count($basket), '?'));

        $sql = "
            WITH basket_orders AS (
                SELECT DISTINCT order_id
                FROM order_items
                WHERE menu_item_id IN ($placeholders)
            )
            SELECT
                oi.menu_item_id           AS id,
                COUNT(DISTINCT oi.order_id) AS co_count,
                (SELECT COUNT(*) FROM basket_orders) AS basket_count,
                (SELECT COUNT(DISTINCT order_id) FROM order_items WHERE menu_item_id = oi.menu_item_id) AS item_count
            FROM order_items oi
            WHERE oi.order_id IN (SELECT order_id FROM basket_orders)
              AND oi.menu_item_id NOT IN ($placeholders)
            GROUP BY oi.menu_item_id
            HAVING co_count >= 1
            ORDER BY co_count DESC
            LIMIT 50
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([...$basket, ...$basket]);
        $rows = $stmt->fetchAll();
        if ($rows === []) {
            return self::popular($limit);
        }

        $scored = [];
        foreach ($rows as $row) {
            $basketCount = max(1, (int) $row['basket_count']);
            $itemCount   = max(1, (int) $row['item_count']);
            $confidence  = (int) $row['co_count'] / $basketCount;
            $support     = $itemCount / $totalOrders;
            $lift        = $support > 0 ? $confidence / $support : 0.0;
            $scored[] = ['id' => (int) $row['id'], 'score' => $lift];
        }
        usort($scored, static fn ($a, $b) => $b['score'] <=> $a['score']);
        $scored = array_slice($scored, 0, $limit);

        return self::hydrate($scored);
    }

    /** @return list<array{id:int, name:string, score:float, image_url:?string, price_cents:int}> */
    public static function popular(int $limit = 4): array
    {
        $pdo = Database::connection();
        $rows = $pdo->query(
            'SELECT mi.id, mi.name, mi.price_cents, mi.image_url,
                    COALESCE(SUM(oi.quantity), 0) AS units
             FROM menu_items mi
             LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
             WHERE mi.is_available = 1
             GROUP BY mi.id, mi.name, mi.price_cents, mi.image_url
             ORDER BY units DESC, mi.id ASC
             LIMIT ' . max(1, (int) $limit)
        )->fetchAll();

        $out = [];
        foreach ($rows as $row) {
            $out[] = [
                'id'          => (int) $row['id'],
                'name'        => (string) $row['name'],
                'score'       => (float) $row['units'],
                'image_url'   => $row['image_url'],
                'price_cents' => (int) $row['price_cents'],
            ];
        }
        return $out;
    }

    /** @param list<array{id:int, score:float}> $scored */
    private static function hydrate(array $scored): array
    {
        if ($scored === []) {
            return [];
        }
        $ids = array_map(static fn ($s) => $s['id'], $scored);
        $in  = implode(',', array_fill(0, count($ids), '?'));
        $stmt = Database::connection()->prepare(
            "SELECT id, name, price_cents, image_url FROM menu_items WHERE id IN ($in)"
        );
        $stmt->execute($ids);
        $byId = [];
        foreach ($stmt->fetchAll() as $row) {
            $byId[(int) $row['id']] = $row;
        }

        $out = [];
        foreach ($scored as $entry) {
            $row = $byId[$entry['id']] ?? null;
            if ($row === null) {
                continue;
            }
            $out[] = [
                'id'          => (int) $row['id'],
                'name'        => (string) $row['name'],
                'score'       => round($entry['score'], 3),
                'image_url'   => $row['image_url'],
                'price_cents' => (int) $row['price_cents'],
            ];
        }
        return $out;
    }
}
