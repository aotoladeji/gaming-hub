<?php
require_once __DIR__ . '/../bootstrap.php';

/**
 * POST /api/bookings_cancel.php
 * Body: { "ticket_number": "GHK-XXXXXX", "phone_number": "0801..." }
 *
 * Public — no login required, but the phone number must match the booking
 * so a stranger can't cancel someone else's ticket just by guessing the ID.
 * Only Pending/Confirmed bookings can be self-cancelled (once checked in,
 * only staff can cancel/complete a session).
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

$input = requestBody();
$validator = new Validator($input, [
    'ticket_number' => 'required|string|max:20',
    'phone_number'  => 'required|phone',
]);
if ($validator->fails()) Response::validationError($validator->errors());

$db = Database::connect();

try {
    $db->beginTransaction();

    $stmt = $db->prepare(
        'SELECT b.*, g.title AS game_title, s.name AS station_name
         FROM bookings b JOIN games g ON g.id = b.game_id JOIN stations s ON s.id = b.station_id
         WHERE b.ticket_number = :ticket FOR UPDATE'
    );
    $stmt->execute(['ticket' => trim($input['ticket_number'])]);
    $booking = $stmt->fetch();

    if (!$booking) {
        $db->rollBack();
        Response::notFound('Ticket not found.');
    }

    // Normalize both numbers (digits only) before comparing, so formatting differences don't block a valid cancel
    $normalize = fn($p) => preg_replace('/\D/', '', $p);
    if ($normalize($booking['phone_number']) !== $normalize($input['phone_number'])) {
        $db->rollBack();
        Response::forbidden('Phone number does not match this ticket.');
    }

    if (!in_array($booking['status'], ['Pending', 'Confirmed'], true)) {
        $db->rollBack();
        Response::error("This ticket can no longer be cancelled online (status: {$booking['status']}). Please contact the front desk.", 409);
    }

    $db->prepare('UPDATE bookings SET status = "Cancelled" WHERE id = :id')->execute(['id' => $booking['id']]);
    $db->commit();

    $booking['status'] = 'Cancelled';
    Notifier::sendCancellation($booking); // best-effort

    Response::ok($booking, 'Booking cancelled.');
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    Response::error('Failed to cancel booking.', 500, ['exception' => $e->getMessage()]);
}
