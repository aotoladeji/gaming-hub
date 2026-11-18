<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * GET /api/admin/bookings.php?search=...&status=Active&date=2026-07-18&page=1
 * Requires: Authorization: Bearer <token>
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

Auth::requireAuth();

$db = Database::connect();

$page    = max(1, (int)($_GET['page'] ?? 1));
$perPage = 20;
$offset  = ($page - 1) * $perPage;

$where  = [];
$params = [];

if (!empty($_GET['search'])) {
    $where[] = '(b.customer_name LIKE :search OR b.phone_number LIKE :search OR b.ticket_number LIKE :search)';
    $params['search'] = '%' . $_GET['search'] . '%';
}
if (!empty($_GET['status'])) {
    $where[] = 'b.status = :status';
    $params['status'] = $_GET['status'];
}
if (!empty($_GET['date'])) {
    $where[] = 'b.booking_date = :date';
    $params['date'] = $_GET['date'];
}

$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $db->prepare("SELECT COUNT(*) c FROM bookings b $whereSql");
$countStmt->execute($params);
$total = (int)$countStmt->fetch()['c'];

$sql = "SELECT b.*, g.title AS game_title, s.name AS station_name
        FROM bookings b
        JOIN games g ON g.id = b.game_id
        JOIN stations s ON s.id = b.station_id
        $whereSql
        ORDER BY b.created_at DESC
        LIMIT $perPage OFFSET $offset";

$stmt = $db->prepare($sql);
$stmt->execute($params);

Response::ok([
    'bookings'   => $stmt->fetchAll(),
    'page'       => $page,
    'per_page'   => $perPage,
    'total'      => $total,
    'total_pages'=> (int)ceil($total / $perPage),
]);
