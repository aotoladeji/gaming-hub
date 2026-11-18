<?php
require_once __DIR__ . '/../bootstrap.php';

/**
 * GET /api/leaderboard            -> top players across all games (default limit 10)
 * GET /api/leaderboard?game_id=2  -> top players for one game
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$db = Database::connect();
$limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 10;

$sql = 'SELECT l.id, l.player_name, l.score, l.wins, l.updated_at, g.title AS game_title
        FROM leaderboard l
        JOIN games g ON g.id = l.game_id';
$params = [];

if (isset($_GET['game_id'])) {
    $sql .= ' WHERE l.game_id = :game_id';
    $params['game_id'] = (int)$_GET['game_id'];
}

$sql .= ' ORDER BY l.score DESC LIMIT ' . $limit;

$stmt = $db->prepare($sql);
$stmt->execute($params);

Response::ok($stmt->fetchAll());
