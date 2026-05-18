<?php

declare(strict_types=1);

namespace Srwa\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Srwa\Models\Customer;

final class CustomerTest extends TestCase
{
    public function testPhoneIsTrimmedAndCollapsedWhitespace(): void
    {
        $this->assertSame(
            '+237 671 204 819',
            Customer::normalizePhone('  +237   671   204    819  ')
        );
    }

    public function testEmptyPhoneCollapsesToEmpty(): void
    {
        $this->assertSame('', Customer::normalizePhone('   '));
    }
}
