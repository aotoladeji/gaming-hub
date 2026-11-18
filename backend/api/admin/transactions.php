<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * GET /api/admin/transactions.php?from=2026-07-01&to=2026-07-18
 * Super Admin only. Lists all recorded payments with running totals.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

Auth::requireSuperAdmin();
$db = Database::connect();

$where = [];
$params = [];
if (!empty($_GET['from'])) {
    $where[] = 'DATE(t.paid_at) >= :from';
    $params['from'] = $_GET['from'];
}
if (!empty($_GET['to'])) {
    $where[] = 'DATE(t.paid_at) <= :to';
    $params['to'] = $_GET['to'];
}
$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$sql = "SELECT t.id, t.amount, t.payment_method, t.paid_at,
               b.ticket_number, b.customer_name, g.title AS game_title, s.name AS station_name,
               a.full_name AS recorded_by_name
        FROM transactions t
        JOIN bookings b ON b.id = t.booking_id
        JOIN games g ON g.id = b.game_id
        JOIN stations s ON s.id = b.station_id
        LEFT JOIN admin_users a ON a.id = t.recorded_by
        $whereSql
        ORDER BY t.paid_at DESC";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$transactions = $stmt->fetchAll();

$totalStmt = $db->prepare("SELECT COALESCE(SUM(t.amount),0) total FROM transactions t $whereSql");
$totalStmt->execute($params);

Response::ok([
    'transactions'  => $transactions,
    'total_revenue' => (float)$totalStmt->fetch()['total'],
    'count'         => count($transactions),
]);
