<?php
/**
 * Database connection (PDO singleton).
 * Update credentials to match your local XAMPP MySQL setup.
 */

class Database
{
    private static ?PDO $instance = null;

    // --- XAMPP defaults ---
    private const HOST    = '127.0.0.1';
    private const PORT    = '3306';
    private const DBNAME  = 'gaming_hub';
    private const USER    = 'root';
    private const PASS    = '';       // default XAMPP root password is empty
    private const CHARSET = 'utf8mb4';

    public static function connect(): PDO
    {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                self::HOST, self::PORT, self::DBNAME, self::CHARSET
            );

            try {
                self::$instance = new PDO($dsn, self::USER, self::PASS, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Database connection failed.',
                    'error'   => $e->getMessage(),
                ]);
                exit;
            }
        }

        return self::$instance;
    }
}
