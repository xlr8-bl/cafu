<?php

declare(strict_types=1);

namespace Srwa\Tests\Unit;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Srwa\Auth\Password;

final class PasswordTest extends TestCase
{
    public function testHashVerifyRoundTrip(): void
    {
        $hash = Password::hash('correct horse battery staple');
        $this->assertTrue(Password::verify('correct horse battery staple', $hash));
        $this->assertFalse(Password::verify('wrong password 12345', $hash));
    }

    public function testHashIsBcryptFormatted(): void
    {
        $hash = Password::hash('a-long-enough-passphrase');
        // password_hash with PASSWORD_BCRYPT produces "$2y$<cost>$..."
        $this->assertMatchesRegularExpression('/^\$2y\$12\$/', $hash);
    }

    public function testHashesAreSalted(): void
    {
        $a = Password::hash('same-input-12345');
        $b = Password::hash('same-input-12345');
        $this->assertNotSame($a, $b, 'bcrypt must salt — identical inputs should produce different hashes');
    }

    public function testShortPasswordRejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Password::hash('short');
    }
}
