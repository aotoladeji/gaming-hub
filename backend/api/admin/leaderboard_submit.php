<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * POST /api/admin/leaderboard_submit.php
 * Body: { "booking_id": 12, "player_name"?: "Ada", "score": 250, "won": true }
 * Requires: Authorization: Bearer <token> (staff or super_admin)
 *
 * Ties a real session to the leaderboard: score accumulates per player+game,
 * wins increments on a win. player_name defaults to the booking's customer
 * name (players can use a gamertag instead by passing player_name explicitly).
 * Can only be logged against a Completed booking, once.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

Auth::requireAuth();
$db = Database::connect();

$input = requestBody();
$validator = new Validator($input, [
    'booking_id' => 'required|integer',
    'score'      => 'required|integer|min:0',
]);
if ($validator->fails()) Response::validationError($validator->errors());

$won = filter_var($input['won'] ?? false, FILTER_VALIDATE_BOOLEAN);

try {
    $db->beginTransaction();

    $bookingStmt = $db->prepare('SELECT * FROM bookings WHERE id = :id FOR UPDATE');
    $bookingStmt->execute(['id' => $input['booking_id']]);
    $booking = $bookingStmt->fetch();

    if (!$booking) {
        $db->rollBack();
        Response::notFound('Booking not found.');
    }
    if ($booking['status'] !== 'Completed') {
        $db->rollBack();
        Response::error('A score can only be logged for a Completed session.', 409);
    }

    $playerName = !empty($input['player_name']) ? trim($input['player_name']) : $booking['customer_name'];
    $gameId = $booking['game_id'];

    // Upsert: accumulate score and win count for this player on this game
    $stmt = $db->prepare(
        'INSERT INTO leaderboard (player_name, game_id, score, wins)
         VALUES (:player_name, :game_id, :score, :wins)
         ON DUPLICATE KEY UPDATE
           score = score + VALUES(score),
           wins  = wins + VALUES(wins),
           updated_at = NOW()'
    );
    $stmt->execute([
        'player_name' => $playerName,
        'game_id'     => $gameId,
        'score'       => (int)$input['score'],
        'wins'        => $won ? 1 : 0,
    ]);

    $db->commit();

    $result = $db->prepare(
        'SELECT l.*, g.title AS game_title FROM leaderboard l JOIN games g ON g.id = l.game_id
         WHERE l.player_name = :player_name AND l.game_id = :game_id'
    );
    $result->execute(['player_name' => $playerName, 'game_id' => $gameId]);

    Response::ok($result->fetch(), "Score logged for $playerName.");
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    Response::error('Failed to log score.', 500, ['exception' => $e->getMessage()]);
}
