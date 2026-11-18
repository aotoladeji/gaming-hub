<?php
require_once __DIR__ . '/../bootstrap.php';

/**
 * GET /api/stations.php?console_type=PS5 Pro   -> stations of that type that aren't offline
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$db = Database::connect();

$sql = 'SELECT id, name, console_type, status FROM stations WHERE status != "offline"';
$params = [];

if (!empty($_GET['console_type'])) {
    $sql .= ' AND console_type = :console_type';
    $params['console_type'] = $_GET['console_type'];
}

$sql .= ' ORDER BY name ASC';

$stmt = $db->prepare($sql);
$stmt->execute($params);

Response::ok($stmt->fetchAll());
