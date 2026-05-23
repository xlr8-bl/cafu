<?php

declare(strict_types=1);

namespace Srwa\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Srwa\Auth\Csrf;

final class CsrfTest extends TestCase
{
    protected function setUp(): void
    {
        // Use a clean array-backed session for every test so tokens don't leak between them.
        $_SESSION = [];
    }

    public function testTokenIsHexAndLongEnough(): void
    {
        $token = Csrf::token();
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $token);
    }

    public function testTokenIsStableWithinSession(): void
    {
        $this->assertSame(Csrf::token(), Csrf::token());
    }

    public function testVerifyAcceptsCurrentTokenAndRejectsOthers(): void
    {
        $token = Csrf::token();
        $this->assertTrue(Csrf::verify($token));
        $this->assertFalse(Csrf::verify('not-the-real-token'));
        $this->assertFalse(Csrf::verify(null));
    }

    public function testRotateInvalidatesPreviousToken(): void
    {
        $old = Csrf::token();
        Csrf::rotate();
        $new = Csrf::token();
        $this->assertNotSame($old, $new);
        $this->assertFalse(Csrf::verify($old));
        $this->assertTrue(Csrf::verify($new));
    }
}
