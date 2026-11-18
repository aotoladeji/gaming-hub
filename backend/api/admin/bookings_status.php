<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * PUT /api/admin/bookings_status.php?id=12
 * Body: { "status": "Confirmed" | "Active" | "Completed" | "Cancelled", "payment_method"?: "cash" }
 * Requires: Authorization: Bearer <token>
 *
 * Transitions:
 *   Pending   -> Confirmed | Cancelled
 *   Confirmed -> Active | Cancelled          (Active = "Check-In", starts the timer)
 *   Active    -> Completed                   (Completed = "Check-Out", stops the timer, logs a transaction)
 */

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('Method not allowed', 405);
}

$admin = Auth::requireAuth();

if (!isset($_GET['id'])) {
    Response::error('id query parameter is required', 400);
}
$bookingId = (int)$_GET['id'];

$input = requestBody();
$validator = new Validator($input, [
    'status' => 'required|in:Pending,Confirmed,Active,Completed,Cancelled',
]);
if ($validator->fails()) Response::validationError($validator->errors());

$newStatus = $input['status'];
$allowedTransitions = [
    'Pending'   => ['Confirmed', 'Cancelled'],
    'Confirmed' => ['Active', 'Cancelled'],
    'Active'    => ['Completed'],
];

$db = Database::connect();

try {
    $db->beginTransaction();

    $stmt = $db->prepare('SELECT * FROM bookings WHERE id = :id FOR UPDATE');
    $stmt->execute(['id' => $bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        $db->rollBack();
        Response::notFound('Booking not found.');
    }

    $currentStatus = $booking['status'];
    if ($currentStatus === $newStatus) {
        $db->rollBack();
        Response::error("Booking is already $newStatus.", 409);
    }
    if (!isset($allowedTransitions[$currentStatus]) || !in_array($newStatus, $allowedTransitions[$currentStatus], true)) {
        $db->rollBack();
        Response::error("Cannot move booking from $currentStatus to $newStatus.", 409);
    }

    if ($newStatus === 'Active') {
        // Check-in: start the live countdown and mark the station occupied
        $db->prepare('UPDATE bookings SET status = "Active", actual_start_at = NOW() WHERE id = :id')
           ->execute(['id' => $bookingId]);
        $db->prepare('UPDATE stations SET status = "occupied" WHERE id = :sid')
           ->execute(['sid' => $booking['station_id']]);
    } elseif ($newStatus === 'Completed') {
        // Check-out: stop the timer, free the station, record the payment
        $db->prepare('UPDATE bookings SET status = "Completed", actual_end_at = NOW() WHERE id = :id')
           ->execute(['id' => $bookingId]);
        $db->prepare('UPDATE stations SET status = "idle" WHERE id = :sid')
           ->execute(['sid' => $booking['station_id']]);

        $paymentMethod = in_array($input['payment_method'] ?? '', ['cash', 'card', 'transfer', 'wallet'], true)
            ? $input['payment_method'] : 'cash';

        $db->prepare(
            'INSERT INTO transactions (booking_id, amount, payment_method, recorded_by) VALUES (:bid, :amount, :method, :staff)'
        )->execute([
            'bid'    => $bookingId,
            'amount' => $booking['total_price'],
            'method' => $paymentMethod,
            'staff'  => $admin['id'],
        ]);
    } elseif ($newStatus === 'Cancelled') {
        $db->prepare('UPDATE bookings SET status = "Cancelled" WHERE id = :id')->execute(['id' => $bookingId]);
        if ($currentStatus === 'Active') {
            $db->prepare('UPDATE stations SET status = "idle" WHERE id = :sid')->execute(['sid' => $booking['station_id']]);
        }
    } else {        // Confirmed
        $db->prepare('UPDATE bookings SET status = :status WHERE id = :id')
           ->execute(['status' => $newStatus, 'id' => $bookingId]);
    }

    $db->commit();

    $fresh = $db->prepare(
        'SELECT b.*, g.title AS game_title, s.name AS station_name
         FROM bookings b JOIN games g ON g.id = b.game_id JOIN stations s ON s.id = b.station_id
         WHERE b.id = :id'
    );
    $fresh->execute(['id' => $bookingId]);
    $freshBooking = $fresh->fetch();

    if ($newStatus === 'Cancelled') {
        Notifier::sendCancellation($freshBooking); // best-effort
    }

    Response::ok($freshBooking, "Booking marked as $newStatus.");
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    Response::error('Failed to update booking status.', 500, ['exception' => $e->getMessage()]);
}
