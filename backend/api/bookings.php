<?php
require_once __DIR__ . '/../bootstrap.php';

/**
 * POST /api/bookings                    -> create a booking (public)
 * GET  /api/bookings?ticket=GHK-XXXXXX   -> look up a single ticket (public, for confirmation page)
 */

$db = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!isset($_GET['ticket'])) {
        Response::error('ticket query parameter is required', 400);
    }
    $stmt = $db->prepare(
        'SELECT b.*, g.title AS game_title, s.name AS station_name
         FROM bookings b
         JOIN games g ON g.id = b.game_id
         JOIN stations s ON s.id = b.station_id
         WHERE b.ticket_number = :ticket'
    );
    $stmt->execute(['ticket' => $_GET['ticket']]);
    $booking = $stmt->fetch();

    if (!$booking) Response::notFound('Ticket not found');
    Response::ok($booking);
}

if ($method !== 'POST') {
    Response::error('Method not allowed', 405);
}

$input = requestBody();

$validator = new Validator($input, [
    'customer_name' => 'required|string|max:120',
    'phone_number'  => 'required|phone',
    'customer_email'=> 'email|max:150',
    'station_id'    => 'required|integer',
    'game_id'       => 'required|integer',
    'booking_date'  => 'required|date',
    'start_time'    => 'required|time',
    'duration_hours'=> 'required|numeric|min:1|max:12',
]);

if ($validator->fails()) {
    Response::validationError($validator->errors());
}

// Reject bookings for dates in the past
$today = (new DateTime())->format('Y-m-d');
if ($input['booking_date'] < $today) {
    Response::validationError(['booking_date' => ['booking_date cannot be in the past.']]);
}

try {
    $db->beginTransaction();

    // Lock the station row for the duration of this transaction to prevent
    // two simultaneous requests from double-booking the same slot (race condition).
    $stationStmt = $db->prepare('SELECT * FROM stations WHERE id = :id FOR UPDATE');
    $stationStmt->execute(['id' => $input['station_id']]);
    $station = $stationStmt->fetch();

    if (!$station) {
        $db->rollBack();
        Response::error('Selected station does not exist.', 404);
    }
    if ($station['status'] === 'offline' || $station['status'] === 'maintenance') {
        $db->rollBack();
        Response::error('Selected station is currently unavailable.', 409);
    }

    $gameStmt = $db->prepare('SELECT * FROM games WHERE id = :id AND status = "available"');
    $gameStmt->execute(['id' => $input['game_id']]);
    $game = $gameStmt->fetch();

    if (!$game) {
        $db->rollBack();
        Response::error('Selected game is unavailable.', 404);
    }

    // Compute end_time from start_time + duration_hours
    $start = DateTime::createFromFormat('H:i', substr($input['start_time'], 0, 5));
    $end   = (clone $start)->modify('+' . (int)round($input['duration_hours'] * 60) . ' minutes');
    $startTime = $start->format('H:i:s');
    $endTime   = $end->format('H:i:s');

    // --- Core conflict check: is this station already booked for an overlapping slot? ---
    $conflictStmt = $db->prepare(
        'SELECT id FROM bookings
         WHERE station_id = :station_id
           AND booking_date = :booking_date
           AND status IN ("Pending", "Confirmed", "Active")
           AND NOT (end_time <= :start_time OR start_time >= :end_time)
         LIMIT 1'
    );
    $conflictStmt->execute([
        'station_id'   => $input['station_id'],
        'booking_date' => $input['booking_date'],
        'start_time'   => $startTime,
        'end_time'     => $endTime,
    ]);

    if ($conflictStmt->fetch()) {
        $db->rollBack();
        Response::error('This station is already booked for the selected time slot. Please choose another time or station.', 409);
    }

    // Generate a unique short ticket number, e.g. GHK-9F3A1C
    do {
        $ticketNumber = 'GHK-' . strtoupper(bin2hex(random_bytes(3)));
        $existsStmt = $db->prepare('SELECT id FROM bookings WHERE ticket_number = :t');
        $existsStmt->execute(['t' => $ticketNumber]);
    } while ($existsStmt->fetch());

    $totalPrice = round($game['price_per_hour'] * $input['duration_hours'], 2);

    $insertStmt = $db->prepare(
        'INSERT INTO bookings
         (ticket_number, customer_name, phone_number, customer_email, station_id, game_id, booking_date, start_time, end_time, duration_hours, base_price, extra_charges, total_price, status)
         VALUES
         (:ticket_number, :customer_name, :phone_number, :customer_email, :station_id, :game_id, :booking_date, :start_time, :end_time, :duration_hours, :base_price, 0, :total_price, "Pending")'
    );
    $insertStmt->execute([
        'ticket_number'  => $ticketNumber,
        'customer_name'  => trim($input['customer_name']),
        'phone_number'   => trim($input['phone_number']),
        'customer_email' => !empty($input['customer_email']) ? trim($input['customer_email']) : null,
        'station_id'     => $input['station_id'],
        'game_id'        => $input['game_id'],
        'booking_date'   => $input['booking_date'],
        'start_time'     => $startTime,
        'end_time'       => $endTime,
        'duration_hours' => $input['duration_hours'],
        'base_price'     => $totalPrice,
        'total_price'    => $totalPrice,
    ]);

    $bookingId = (int)$db->lastInsertId();
    $db->commit();

    $resultStmt = $db->prepare(
        'SELECT b.*, g.title AS game_title, s.name AS station_name
         FROM bookings b JOIN games g ON g.id = b.game_id JOIN stations s ON s.id = b.station_id
         WHERE b.id = :id'
    );
    $resultStmt->execute(['id' => $bookingId]);
    $created = $resultStmt->fetch();

    Notifier::sendBookingConfirmation($created); // best-effort; never throws

    Response::created($created, 'Booking created successfully.');
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    Response::error('Failed to create booking.', 500, ['exception' => $e->getMessage()]);
}
