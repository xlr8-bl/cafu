<?php

declare(strict_types=1);

use Srwa\Http\Json;
use Srwa\Models\MenuItem;
use Srwa\Models\Order;
use Srwa\Models\Recommendation;
use Srwa\Models\Reservation;

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path   = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

try {
    return match (true) {
        $method === 'GET'  && $path === '/api/menu'           => Json::send(200, [
            'items' => MenuItem::all($_GET['category'] ?? null),
        ]),
        $method === 'POST' && $path === '/api/orders'         => handleOrder(),
        $method === 'POST' && $path === '/api/reservations'   => handleReservation(),
        $method === 'POST' && $path === '/api/recommend'      => handleRecommend(),
        $method === 'GET'  && $path === '/api/recommend'      => Json::send(200, [
            'items' => Recommendation::popular(4),
        ]),
        default => Json::send(404, ['error' => 'Not found']),
    };
} catch (\InvalidArgumentException $e) {
    \Srwa\Logging\Logger::get()->notice('api.validation_error', [
        'path'  => $path,
        'error' => $e->getMessage(),
    ]);
    Json::send(422, ['error' => $e->getMessage()]);
} catch (\Throwable $e) {
    \Srwa\Logging\Logger::get()->error('api.unhandled_exception', [
        'path'      => $path,
        'exception' => get_class($e),
        'error'     => $e->getMessage(),
    ]);
    if (function_exists('\Sentry\captureException')) {
        \Sentry\captureException($e);
    }
    Json::send(500, ['error' => 'Internal error']);
}

function handleOrder(): never
{
    $body = Json::readBody();
    $customer = [
        'name'  => trim((string) ($body['customer']['name']  ?? '')),
        'phone' => trim((string) ($body['customer']['phone'] ?? '')),
        'email' => $body['customer']['email'] ?? null,
        'notes' => $body['notes'] ?? null,
    ];
    if ($customer['name'] === '' || $customer['phone'] === '') {
        Json::send(422, ['error' => 'Name and phone are required.']);
    }
    $items = array_values(array_map(
        static fn ($i) => [
            'menu_item_id' => (int) ($i['menu_item_id'] ?? 0),
            'quantity'     => (int) ($i['quantity'] ?? 1),
        ],
        (array) ($body['items'] ?? [])
    ));
    $result = Order::place($customer, $items);
    Json::send(201, $result);
}

function handleReservation(): never
{
    $body = Json::readBody();
    $customer = [
        'name'  => trim((string) ($body['customer']['name']  ?? '')),
        'phone' => trim((string) ($body['customer']['phone'] ?? '')),
        'email' => $body['customer']['email'] ?? null,
    ];
    if ($customer['name'] === '' || $customer['phone'] === '') {
        Json::send(422, ['error' => 'Name and phone are required.']);
    }
    $result = Reservation::hold(
        $customer,
        (int) ($body['party_size']   ?? 0),
        (string) ($body['reserved_for'] ?? ''),
        $body['notes'] ?? null,
    );
    Json::send(201, $result);
}

function handleRecommend(): never
{
    $body   = Json::readBody();
    $basket = array_map('intval', (array) ($body['basket'] ?? []));
    Json::send(200, ['items' => Recommendation::forBasket($basket, 4)]);
}
