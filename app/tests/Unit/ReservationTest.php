<?php

declare(strict_types=1);

namespace Srwa\Tests\Unit;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Srwa\Models\Reservation;

final class ReservationTest extends TestCase
{
    public function testFutureDateAccepted(): void
    {
        $future = (new \DateTimeImmutable('+2 days', new \DateTimeZone('UTC')))->format(DATE_ATOM);
        $dt = Reservation::parseFutureDateTime($future);
        $this->assertGreaterThan(new \DateTimeImmutable('now'), $dt);
    }

    public function testPastDateRejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Reservation::parseFutureDateTime('2000-01-01T00:00:00Z');
    }

    public function testGarbageDateRejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Reservation::parseFutureDateTime('not a date');
    }
}
