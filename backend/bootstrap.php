<?php
/**
 * Shared bootstrap included by every API endpoint file.
 * Handles CORS (React dev server on :3000 / :5173), JSON body parsing,
 * and wires up common helpers.
 */

$allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Preflight short-circuit
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/helpers/Response.php';
require_once __DIR__ . '/helpers/Validator.php';
require_once __DIR__ . '/helpers/Auth.php';
require_once __DIR__ . '/helpers/Notifier.php';
require_once __DIR__ . '/config/database.php';

// Convert PHP warnings/notices into visible errors instead of corrupting JSON output
set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

/** Reads and JSON-decodes the raw request body. */
function requestBody(): array
{
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
