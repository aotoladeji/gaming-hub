<?php
require_once __DIR__ . '/../bootstrap.php';

/**
 * GET /api/games            -> list all games (including unavailable, so the UI can show them disabled)
 * GET /api/games?all=1      -> same list; kept for backwards compatibility
 * GET /api/games?id=5       -> single game
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$db = Database::connect();

if (isset($_GET['id'])) {
    $stmt = $db->prepare('SELECT * FROM games WHERE id = :id');
    $stmt->execute(['id' => (int)$_GET['id']]);
    $game = $stmt->fetch();

    if (!$game) Response::notFound('Game not found');
    Response::ok($game);
}

$sql = 'SELECT g.*,
          (SELECT COUNT(*) FROM stations s WHERE s.console_type = g.console_type AND s.status != "offline") AS available_slots
        FROM games g
        ORDER BY g.console_type ASC, g.display_order ASC, g.title ASC';

$games = $db->query($sql)->fetchAll();

// Group by console_type for categorization
$categorized = [];
$consoleOrder = ['PS5 Pro', 'PS4', 'PC', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Other'];

foreach ($games as $game) {
    $category = $game['console_type'];
    if (!isset($categorized[$category])) {
        $categorized[$category] = [];
    }
    $categorized[$category][] = $game;
}

// Sort categorized by console order (PS5 Pro first, PC second, etc.)
$sortedCategorized = [];
foreach ($consoleOrder as $console) {
    if (isset($categorized[$console])) {
        $sortedCategorized[$console] = $categorized[$console];
    }
}
$categorized = $sortedCategorized;

Response::ok(['games' => $games, 'categorized' => $categorized]);
