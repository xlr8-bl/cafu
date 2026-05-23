<?php

declare(strict_types=1);

namespace Srwa\Tests\Unit;

use Monolog\Handler\TestHandler;
use Monolog\Level;
use Monolog\Logger as Monolog;
use PHPUnit\Framework\TestCase;
use Srwa\Logging\Logger;

final class LoggerTest extends TestCase
{
    protected function setUp(): void
    {
        Logger::reset();
    }

    protected function tearDown(): void
    {
        Logger::reset();
    }

    public function testReturnsConfiguredMonologInstance(): void
    {
        $logger = Logger::get();
        $this->assertInstanceOf(Monolog::class, $logger);
        $this->assertSame('srwa', $logger->getName());
    }

    public function testSingleton(): void
    {
        $a = Logger::get();
        $b = Logger::get();
        $this->assertSame($a, $b, 'Logger::get() must return the same instance');
    }

    public function testCapturedRecordCarriesMessageAndContext(): void
    {
        $handler = new TestHandler();
        $logger  = new Monolog('test');
        $logger->pushHandler($handler);
        Logger::set($logger);

        Logger::get()->info('order.placed', ['order_id' => 42]);

        $this->assertTrue($handler->hasInfoThatContains('order.placed'));
        $records = $handler->getRecords();
        $this->assertSame(42, $records[0]->context['order_id']);
        $this->assertSame(Level::Info, $records[0]->level);
    }
}
