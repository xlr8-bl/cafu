<?php

declare(strict_types=1);

namespace Srwa\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Srwa\Models\Order;

final class OrderTest extends TestCase
{
    public function testReferenceLengthAndAlphabet(): void
    {
        $ref = Order::generateReference();
        $this->assertSame(10, strlen($ref));
        $this->assertMatchesRegularExpression('/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/', $ref);
    }

    public function testReferencesAreSufficientlyUnique(): void
    {
        $seen = [];
        for ($i = 0; $i < 1000; $i++) {
            $seen[Order::generateReference()] = true;
        }
        // 32^10 keyspace; expect 1000 unique with vanishing collision probability.
        $this->assertGreaterThanOrEqual(999, count($seen));
    }
}
