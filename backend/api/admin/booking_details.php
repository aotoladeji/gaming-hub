<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * GET /api/admin/booking_details.php?id=X
 * Returns complete booking details including transaction history and charges
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

Auth::requireAuth();

if (!isset($_GET['id'])) {
    Response::error('id query parameter is required', 400);
}

$bookingId = (int)$_GET['id'];
$db = Database::connect();

// Get booking details
$bookingStmt = $db->prepare(
    'SELECT b.*, 
            g.title AS game_title, g.console_type, g.category,
            s.name AS station_name, s.console_type AS station_console,
            CONCAT(a.full_name, " (", a.username, ")") AS confirmed_by
     FROM bookings b
     JOIN games g ON g.id = b.game_id
     JOIN stations s ON s.id = b.station_id
     LEFT JOIN admin_users a ON a.id = (
         SELECT recorded_by FROM transactions WHERE booking_id = b.id LIMIT 1
     )
     WHERE b.id = :id'
);
$bookingStmt->execute(['id' => $bookingId]);
$booking = $bookingStmt->fetch();

if (!$booking) {
    Response::notFound('Booking not found.');
}

// Get extra charges
$chargesStmt = $db->prepare(
    'SELECT bc.*, ct.name AS charge_name, ct.unit
     FROM booking_charges bc
     JOIN charge_types ct ON ct.id = bc.charge_type_id
     WHERE bc.booking_id = :id
     ORDER BY bc.created_at DESC'
);
$chargesStmt->execute(['id' => $bookingId]);
$charges = $chargesStmt->fetchAll();

// Get transactions
$transactionsStmt = $db->prepare(
    'SELECT t.*, 
            CONCAT(a.full_name, " (", a.username, ")") AS recorded_by_name
     FROM transactions t
     LEFT JOIN admin_users a ON a.id = t.recorded_by
     WHERE t.booking_id = :id
     ORDER BY t.paid_at DESC'
);
$transactionsStmt->execute(['id' => $bookingId]);
$transactions = $transactionsStmt->fetchAll();

// Calculate timing info if active
$timingInfo = null;
if ($booking['status'] === 'Active' && $booking['actual_start_at']) {
    $start = new DateTime($booking['actual_start_at']);
    $now = new DateTime();
    $elapsed = $now->getTimestamp() - $start->getTimestamp();
    $totalSeconds = (int)round($booking['duration_hours'] * 3600);
    
    $timingInfo = [
        'elapsed_seconds' => $elapsed,
        'remaining_seconds' => max(0, $totalSeconds - $elapsed),
        'total_seconds' => $totalSeconds,
        'is_overtime' => $elapsed > $totalSeconds,
    ];
}

Response::ok([
    'booking' => $booking,
    'charges' => $charges,
    'transactions' => $transactions,
    'timing_info' => $timingInfo,
]);
