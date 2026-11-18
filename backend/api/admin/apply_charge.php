<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * POST /api/admin/apply_charge.php
 * Body: { "booking_id": 5, "charge_type_id": 1, "quantity": 2 }
 * Requires: Authorization: Bearer <token> (staff or super_admin)
 *
 * Used e.g. to bill "Extra time in game room" (per_hour) or a flat rental fee
 * onto an existing ticket before checkout.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

Auth::requireAuth();
$db = Database::connect();

$input = requestBody();
$validator = new Validator($input, [
    'booking_id'     => 'required|integer',
    'charge_type_id' => 'required|integer',
    'quantity'       => 'required|numeric|min:0.5',
]);
if ($validator->fails()) Response::validationError($validator->errors());

try {
    $db->beginTransaction();

    $chargeStmt = $db->prepare('SELECT * FROM charge_types WHERE id = :id AND status = "active"');
    $chargeStmt->execute(['id' => $input['charge_type_id']]);
    $chargeType = $chargeStmt->fetch();
    if (!$chargeType) {
        $db->rollBack();
        Response::notFound('Charge type not found or inactive.');
    }

    $bookingStmt = $db->prepare('SELECT * FROM bookings WHERE id = :id FOR UPDATE');
    $bookingStmt->execute(['id' => $input['booking_id']]);
    $booking = $bookingStmt->fetch();
    if (!$booking) {
        $db->rollBack();
        Response::notFound('Booking not found.');
    }

    $amount = round($chargeType['amount'] * $input['quantity'], 2);

    $db->prepare(
        'INSERT INTO booking_charges (booking_id, charge_type_id, quantity, amount) VALUES (:bid, :ctid, :qty, :amount)'
    )->execute([
        'bid' => $booking['id'], 'ctid' => $chargeType['id'], 'qty' => $input['quantity'], 'amount' => $amount,
    ]);

    $newExtra = round($booking['extra_charges'] + $amount, 2);
    $newTotal = round($booking['base_price'] + $newExtra, 2);

    $db->prepare('UPDATE bookings SET extra_charges = :extra, total_price = :total WHERE id = :id')
       ->execute(['extra' => $newExtra, 'total' => $newTotal, 'id' => $booking['id']]);

    $db->commit();

    $fresh = $db->prepare('SELECT * FROM bookings WHERE id = :id');
    $fresh->execute(['id' => $booking['id']]);

    Response::ok($fresh->fetch(), "Applied {$chargeType['name']} (+₦$amount) to ticket.");
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    Response::error('Failed to apply charge.', 500, ['exception' => $e->getMessage()]);
}
