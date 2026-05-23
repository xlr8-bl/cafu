<?php

declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

use Srwa\Logging\Logger;

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

Logger::get()->info('http.request', [
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
    'path'   => $path,
]);

// Health endpoint — used by Docker, Jenkins, and GH Actions smoke jobs.
if ($path === '/healthz') {
    header('Content-Type: text/plain');
    echo "ok\n";
    return;
}

// API requests live under /api/* and dispatch to api/router.php.
if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/api/router.php';
    return;
}

// Anything else here is unexpected — nginx is the SPA host and should
// have returned the React shell before falling through to PHP.
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['error' => 'Not found'], JSON_THROW_ON_ERROR);
