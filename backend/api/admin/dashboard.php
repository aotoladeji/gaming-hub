<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * GET /api/admin/dashboard
 * Requires: Authorization: Bearer <token> (staff or super_admin)
 *
 * Returns:
 *  - stations: every station with its current active booking (if any)
 *  - pending: bookings awaiting check-in (Pending/Confirmed) ordered by soonest
 *  - stats: quick counts for header widgets
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

Auth::requireAuth();

$db = Database::connect();

// Stations + their currently Active booking (one active booking per station at a time)
$stationsStmt = $db->query(
    'SELECT s.id, s.name, s.console_type, s.status,
            b.id AS booking_id, b.ticket_number, b.customer_name, b.duration_hours,
            b.actual_start_at, g.title AS game_title
     FROM stations s
     LEFT JOIN bookings b ON b.station_id = s.id AND b.status = "Active"
     LEFT JOIN games g ON g.id = b.game_id
     ORDER BY s.name ASC'
);
$stations = $stationsStmt->fetchAll();

// Attach a server-computed remaining_seconds for each active session
$now = new DateTime();
foreach ($stations as &$station) {
    if ($station['booking_id'] && $station['actual_start_at']) {
        $start = new DateTime($station['actual_start_at']);
        $elapsed = $now->getTimestamp() - $start->getTimestamp();
        $totalSeconds = (int)round($station['duration_hours'] * 3600);
        $station['remaining_seconds'] = max(0, $totalSeconds - $elapsed);
        $station['total_seconds'] = $totalSeconds;
    } else {
        $station['remaining_seconds'] = null;
        $station['total_seconds'] = null;
    }
}
unset($station);

// Bookings pending check-in, soonest first
$pendingStmt = $db->query(
    'SELECT b.id, b.ticket_number, b.customer_name, b.phone_number, b.booking_date, b.start_time,
            b.end_time, b.duration_hours, b.total_price, b.status,
            g.title AS game_title, s.name AS station_name
     FROM bookings b
     JOIN games g ON g.id = b.game_id
     JOIN stations s ON s.id = b.station_id
     WHERE b.status IN ("Pending", "Confirmed")
     ORDER BY b.booking_date ASC, b.start_time ASC'
);
$pending = $pendingStmt->fetchAll();

$stats = [
    'total_stations'     => count($stations),
    'occupied_stations'  => count(array_filter($stations, fn($s) => $s['booking_id'] !== null)),
    'pending_tickets'    => count($pending),
    'today_bookings'     => (int)$db->query('SELECT COUNT(*) c FROM bookings WHERE booking_date = CURDATE()')->fetch()['c'],
    'today_revenue'      => (float)$db->query('SELECT COALESCE(SUM(total_price),0) t FROM bookings WHERE booking_date = CURDATE() AND status = "Completed"')->fetch()['t'],
];

Response::ok([
    'stations' => $stations,
    'pending'  => $pending,
    'stats'    => $stats,
]);
