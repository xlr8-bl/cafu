"""
SRWA pairing recommender — apriori-style co-occurrence on the orders table.

This script computes the top item pairings offline and writes them to a
JSON file the PHP layer can fall back on when the live SQL recommender
returns nothing (cold-start). Re-run nightly via cron or a Jenkins job.

Usage:
    python3 ml/recommend.py --host localhost --port 3307 --db srwa \
                            --user srwa --password srwa_dev_password \
                            --out ml/pairings.json
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path

try:
    import pymysql  # lightweight, pure-python; runs in alpine without compilers
except ImportError:
    sys.stderr.write(
        "pymysql not installed. Run: python3 -m pip install pymysql\n"
    )
    sys.exit(2)


def fetch_baskets(cursor) -> list[set[int]]:
    cursor.execute(
        """
        SELECT order_id, menu_item_id
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status <> 'cancelled'
        """
    )
    baskets: dict[int, set[int]] = defaultdict(set)
    for order_id, item_id in cursor.fetchall():
        baskets[order_id].add(item_id)
    return list(baskets.values())


def compute_pairings(baskets: list[set[int]], min_support: int = 2) -> dict[int, list[dict]]:
    """For each item, list co-occurring items ranked by lift."""
    n = max(1, len(baskets))
    item_counts: Counter[int] = Counter()
    pair_counts: Counter[tuple[int, int]] = Counter()

    for basket in baskets:
        for item in basket:
            item_counts[item] += 1
        for a, b in combinations(sorted(basket), 2):
            pair_counts[(a, b)] += 1

    pairings: dict[int, list[dict]] = defaultdict(list)
    for (a, b), c in pair_counts.items():
        if c < min_support:
            continue
        support_a = item_counts[a] / n
        support_b = item_counts[b] / n
        confidence_ab = c / item_counts[a]
        confidence_ba = c / item_counts[b]
        lift_ab = confidence_ab / support_b if support_b > 0 else 0.0
        lift_ba = confidence_ba / support_a if support_a > 0 else 0.0
        pairings[a].append({"id": b, "co_count": c, "confidence": round(confidence_ab, 4), "lift": round(lift_ab, 4)})
        pairings[b].append({"id": a, "co_count": c, "confidence": round(confidence_ba, 4), "lift": round(lift_ba, 4)})

    for k, lst in pairings.items():
        lst.sort(key=lambda x: (-x["lift"], -x["co_count"]))
        pairings[k] = lst[:8]
    return pairings


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--host", default=os.getenv("DB_HOST", "127.0.0.1"))
    p.add_argument("--port", type=int, default=int(os.getenv("DB_PORT", "3306")))
    p.add_argument("--db",   default=os.getenv("DB_NAME", "srwa"))
    p.add_argument("--user", default=os.getenv("DB_USER", "srwa"))
    p.add_argument("--password", default=os.getenv("DB_PASS", ""))
    p.add_argument("--out", default="ml/pairings.json")
    p.add_argument("--min-support", type=int, default=2)
    args = p.parse_args()

    conn = pymysql.connect(
        host=args.host, port=args.port, db=args.db,
        user=args.user, password=args.password, charset="utf8mb4",
    )
    try:
        with conn.cursor() as cur:
            baskets = fetch_baskets(cur)
    finally:
        conn.close()

    pairings = compute_pairings(baskets, min_support=args.min_support)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(pairings, indent=2, sort_keys=True))
    print(f"Wrote pairings for {len(pairings)} items to {out_path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
