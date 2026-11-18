<?php
/**
 * Sends consistent, machine-readable JSON responses across every endpoint.
 */

class Response
{
    public static function json(int $statusCode, bool $success, $data = null, ?string $message = null, ?array $errors = null): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');

        $payload = ['success' => $success];
        if ($message !== null) $payload['message'] = $message;
        if ($errors  !== null) $payload['errors']  = $errors;
        if ($data    !== null) $payload['data']    = $data;

        echo json_encode($payload, JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function ok($data = null, string $message = 'OK'): void
    {
        self::json(200, true, $data, $message);
    }

    public static function created($data = null, string $message = 'Created'): void
    {
        self::json(201, true, $data, $message);
    }

    public static function error(string $message, int $statusCode = 400, ?array $errors = null): void
    {
        self::json($statusCode, false, null, $message, $errors);
    }

    public static function notFound(string $message = 'Resource not found'): void
    {
        self::json(404, false, null, $message);
    }

    public static function unauthorized(string $message = 'Unauthorized'): void
    {
        self::json(401, false, null, $message);
    }

    public static function forbidden(string $message = 'Forbidden'): void
    {
        self::json(403, false, null, $message);
    }

    public static function validationError(array $errors): void
    {
        self::json(422, false, null, 'Validation failed', $errors);
    }
}
