<?php
/**
 * Quick schema check script
 * Run this to verify if migrations are needed
 */

require_once __DIR__ . '/config/database.php';

echo "<h1>Gaming Hub Schema Check</h1>";

$db = Database::connect();

// Check for new columns in games table
$checkGames = $db->query("SHOW COLUMNS FROM games LIKE 'category'");
$hasCategory = $checkGames->rowCount() > 0;

$checkDisplayOrder = $db->query("SHOW COLUMNS FROM games LIKE 'display_order'");
$hasDisplayOrder = $checkDisplayOrder->rowCount() > 0;

$checkDescription = $db->query("SHOW COLUMNS FROM games LIKE 'description'");
$hasDescription = $checkDescription->rowCount() > 0;

// Check for permissions column in admin_users
$checkPermissions = $db->query("SHOW COLUMNS FROM admin_users LIKE 'permissions'");
$hasPermissions = $checkPermissions->rowCount() > 0;

echo "<h2>Games Table:</h2>";
echo "<ul>";
echo "<li>Category column: " . ($hasCategory ? "✅ EXISTS" : "❌ MISSING") . "</li>";
echo "<li>Display Order column: " . ($hasDisplayOrder ? "✅ EXISTS" : "❌ MISSING") . "</li>";
echo "<li>Description column: " . ($hasDescription ? "✅ EXISTS" : "❌ MISSING") . "</li>";
echo "</ul>";

echo "<h2>Admin Users Table:</h2>";
echo "<ul>";
echo "<li>Permissions column: " . ($hasPermissions ? "✅ EXISTS" : "❌ MISSING") . "</li>";
echo "</ul>";

$needsMigration = !$hasCategory || !$hasDisplayOrder || !$hasDescription || !$hasPermissions;

if ($needsMigration) {
    echo "<h2 style='color: red;'>⚠️ Migration Required!</h2>";
    echo "<p>Please run: <code>backend/migrations/003_permissions_categories_ordering.sql</code></p>";
    echo "<p><strong>Steps:</strong></p>";
    echo "<ol>";
    echo "<li>Open phpMyAdmin (http://localhost/phpmyadmin)</li>";
    echo "<li>Select the 'gaming_hub' database</li>";
    echo "<li>Click 'Import' tab</li>";
    echo "<li>Choose file: <code>backend/migrations/003_permissions_categories_ordering.sql</code></li>";
    echo "<li>Click 'Go'</li>";
    echo "</ol>";
} else {
    echo "<h2 style='color: green;'>✅ All migrations applied!</h2>";
}
?>
