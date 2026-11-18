<?php
require_once __DIR__ . '/../config/database.php';

/**
 * Lightweight bearer-token auth (no external JWT dependency).
 * Tokens are random 64-char strings stored in `admin_sessions` with an expiry.
 * Frontend sends: Authorization: Bearer <token>
 */
class Auth
{
    private const TOKEN_TTL_HOURS = 12;

    public static function issueToken(int $adminId): string
    {
        $db = Database::connect();
        $token = bin2hex(random_bytes(32));
        $expiresAt = (new DateTime())->modify('+' . self::TOKEN_TTL_HOURS . ' hours')->format('Y-m-d H:i:s');

        $stmt = $db->prepare('INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (:admin_id, :token, :expires_at)');
        $stmt->execute(['admin_id' => $adminId, 'token' => $token, 'expires_at' => $expiresAt]);

        return $token;
    }

    private static function bearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? apache_request_headers()['Authorization'] ?? null;
        if (!$header || !preg_match('/Bearer\s+(\S+)/', $header, $m)) {
            return null;
        }
        return $m[1];
    }

    /** Returns the authenticated admin row, or null. */
    public static function currentAdmin(): ?array
    {
        $token = self::bearerToken();
        if (!$token) return null;

        $db = Database::connect();
        $stmt = $db->prepare(
            'SELECT a.id, a.full_name, a.username, a.role, a.status
             FROM admin_sessions s
             JOIN admin_users a ON a.id = s.admin_id
             WHERE s.token = :token AND s.expires_at > NOW() AND a.status = "active"'
        );
        $stmt->execute(['token' => $token]);
        $admin = $stmt->fetch();

        return $admin ?: null;
    }

    /** Aborts the request with 401 unless a valid token is present. */
    public static function requireAuth(): array
    {
        $admin = self::currentAdmin();
        if (!$admin) {
            Response::unauthorized('Please log in to continue.');
        }
        
        // Load full admin data with permissions
        $db = Database::connect();
        $stmt = $db->prepare('SELECT * FROM admin_users WHERE id = :id');
        $stmt->execute(['id' => $admin['id']]);
        $fullAdmin = $stmt->fetch();
        
        unset($fullAdmin['password_hash']);
        
        // Parse permissions JSON if present
        if (!empty($fullAdmin['permissions'])) {
            $fullAdmin['permissions'] = json_decode($fullAdmin['permissions'], true);
        }
        
        return $fullAdmin;
    }

    /** Aborts with 403 unless the authenticated admin has role = super_admin. */
    public static function requireSuperAdmin(): array
    {
        $admin = self::requireAuth();
        if ($admin['role'] !== 'super_admin') {
            Response::forbidden('Super Admin privileges required.');
        }
        return $admin;
    }
}
