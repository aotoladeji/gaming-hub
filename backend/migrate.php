<!DOCTYPE html>
<html>
<head>
    <title>Gaming Hub - Database Migration Tool</title>
    <style>
        body { font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px; background: #0a0e17; color: #e4e7eb; }
        .card { background: #151922; border: 1px solid #232931; border-radius: 12px; padding: 24px; margin: 20px 0; }
        h1 { color: #7c5cff; }
        .success { background: #064e3b; border: 1px solid #10b981; color: #10b981; padding: 12px; border-radius: 8px; margin: 12px 0; }
        .error { background: #7f1d1d; border: 1px solid #ef4444; color: #ef4444; padding: 12px; border-radius: 8px; margin: 12px 0; }
        .info { background: #1e3a8a; border: 1px solid #3b82f6; color: #3b82f6; padding: 12px; border-radius: 8px; margin: 12px 0; }
        .warning { background: #78350f; border: 1px solid #f59e0b; color: #f59e0b; padding: 12px; border-radius: 8px; margin: 12px 0; }
        button { background: #7c5cff; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; }
        button:hover { background: #6a4de6; }
        button:disabled { background: #4a4a4a; cursor: not-allowed; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #232931; }
        th { color: #7c5cff; font-weight: 600; }
        .status-ok { color: #10b981; }
        .status-missing { color: #ef4444; }
        code { background: #232931; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        pre { background: #232931; padding: 16px; border-radius: 8px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🎮 Gaming Hub - Database Migration Tool</h1>
    
    <?php
    require_once __DIR__ . '/config/database.php';
    
    $db = Database::connect();
    $action = $_GET['action'] ?? 'check';
    
    // Check current schema status
    function checkColumn($db, $table, $column) {
        $stmt = $db->query("SHOW COLUMNS FROM $table LIKE '$column'");
        return $stmt->rowCount() > 0;
    }
    
    $checks = [
        'games.category' => checkColumn($db, 'games', 'category'),
        'games.display_order' => checkColumn($db, 'games', 'display_order'),
        'games.description' => checkColumn($db, 'games', 'description'),
        'admin_users.permissions' => checkColumn($db, 'admin_users', 'permissions'),
        'admin_users.last_password_change' => checkColumn($db, 'admin_users', 'last_password_change'),
    ];
    
    $needsMigration = in_array(false, $checks, true);
    
    if ($action === 'migrate' && $needsMigration) {
        echo '<div class="card">';
        echo '<h2>🔄 Running Migration...</h2>';
        
        try {
            $migrationFile = __DIR__ . '/migrations/003_permissions_categories_ordering_safe.sql';
            
            if (!file_exists($migrationFile)) {
                throw new Exception("Migration file not found: $migrationFile");
            }
            
            $sql = file_get_contents($migrationFile);
            
            // Split by semicolons and execute each statement
            $statements = array_filter(array_map('trim', explode(';', $sql)));
            
            $db->beginTransaction();
            
            foreach ($statements as $statement) {
                if (empty($statement) || strpos($statement, '--') === 0) continue;
                
                // Skip SELECT statements used for conditional logic
                if (stripos($statement, 'SELECT IF') !== false || 
                    stripos($statement, 'PREPARE') !== false ||
                    stripos($statement, 'EXECUTE') !== false ||
                    stripos($statement, 'DEALLOCATE') !== false ||
                    stripos($statement, 'SET @') !== false) {
                    try {
                        $db->exec($statement);
                    } catch (Exception $e) {
                        // Ignore errors from conditional checks
                        continue;
                    }
                } else {
                    $db->exec($statement);
                }
            }
            
            $db->commit();
            
            echo '<div class="success">✅ Migration completed successfully!</div>';
            echo '<p>All database schema updates have been applied.</p>';
            echo '<a href="?action=check"><button>View Results</button></a>';
            
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            echo '<div class="error">❌ Migration failed: ' . htmlspecialchars($e->getMessage()) . '</div>';
            echo '<p>Please check the error message and try again, or run the migration manually via phpMyAdmin.</p>';
        }
        
        echo '</div>';
    } else {
        // Show current status
        echo '<div class="card">';
        echo '<h2>📊 Current Schema Status</h2>';
        
        echo '<table>';
        echo '<tr><th>Column</th><th>Status</th></tr>';
        
        foreach ($checks as $column => $exists) {
            $status = $exists ? '<span class="status-ok">✅ EXISTS</span>' : '<span class="status-missing">❌ MISSING</span>';
            echo "<tr><td><code>$column</code></td><td>$status</td></tr>";
        }
        
        echo '</table>';
        
        if ($needsMigration) {
            echo '<div class="warning">';
            echo '<strong>⚠️ Migration Required!</strong><br>';
            echo 'Some database columns are missing. Click the button below to run the migration.';
            echo '</div>';
            echo '<a href="?action=migrate"><button>🚀 Run Migration Now</button></a>';
        } else {
            echo '<div class="success">';
            echo '<strong>✅ All migrations applied!</strong><br>';
            echo 'Your database schema is up to date.';
            echo '</div>';
        }
        
        echo '</div>';
        
        // Show what will be migrated
        if ($needsMigration) {
            echo '<div class="card">';
            echo '<h2>📋 What Will Be Added</h2>';
            echo '<h3>Games Table:</h3>';
            echo '<ul>';
            echo '<li><code>category</code> - Organize games by type (Sports, Strategy, etc.)</li>';
            echo '<li><code>display_order</code> - Custom ordering for games</li>';
            echo '<li><code>description</code> - Detailed game descriptions</li>';
            echo '</ul>';
            
            echo '<h3>Admin Users Table:</h3>';
            echo '<ul>';
            echo '<li><code>permissions</code> - JSON column for staff permissions</li>';
            echo '<li><code>last_password_change</code> - Track password changes</li>';
            echo '</ul>';
            
            echo '<h3>New Table:</h3>';
            echo '<ul>';
            echo '<li><code>password_reset_tokens</code> - For password reset functionality</li>';
            echo '</ul>';
            echo '</div>';
        }
    }
    
    // Quick links
    echo '<div class="card">';
    echo '<h2>🔗 Quick Links</h2>';
    echo '<ul>';
    echo '<li><a href="../" style="color: #7c5cff;">← Back to Gaming Hub</a></li>';
    echo '<li><a href="/phpmyadmin" style="color: #7c5cff;" target="_blank">Open phpMyAdmin</a></li>';
    echo '<li><a href="check_schema.php" style="color: #7c5cff;">Detailed Schema Check</a></li>';
    echo '</ul>';
    echo '</div>';
    ?>
    
    <div class="info">
        <strong>ℹ️ Need Help?</strong><br>
        If migration fails, you can run it manually via phpMyAdmin. See <code>MIGRATION_GUIDE.md</code> for instructions.
    </div>
</body>
</html>
