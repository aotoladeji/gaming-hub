<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * Manage the games catalogue (prices, availability, add/remove titles).
 * Staff and Super Admin can manage games.
 * POST   /api/admin/games_manage.php            -> create
 * PUT    /api/admin/games_manage.php?id=5       -> update (price, status, etc.)
 * DELETE /api/admin/games_manage.php?id=5       -> delete
 * PATCH  /api/admin/games_manage.php            -> reorder games (bulk update display_order)
 */

$admin = Auth::requireAuth();

// All staff and super admin can manage games
if ($admin['role'] !== 'super_admin' && $admin['role'] !== 'staff') {
    Response::error('Admin access required.', 403);
}

$db = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = requestBody();
    $validator = new Validator($input, [
        'title'          => 'required|string|max:120',
        'console_type'   => 'required|in:PS5 Pro,PS4,Xbox Series X,Xbox One,PC,Nintendo Switch,Other',
        'price_per_hour' => 'required|numeric|min:0',
    ]);
    if ($validator->fails()) Response::validationError($validator->errors());

    // Get max display_order for the console_type
    $categoryStmt = $db->prepare('SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM games WHERE console_type = :console_type');
    $categoryStmt->execute(['console_type' => $input['console_type']]);
    $nextOrder = $categoryStmt->fetch()['next_order'];

    $stmt = $db->prepare(
        'INSERT INTO games (title, description, image_url, console_type, category, display_order, price_per_hour, status)
         VALUES (:title, :description, :image_url, :console_type, :category, :display_order, :price_per_hour, :status)'
    );
    $stmt->execute([
        'title'          => trim($input['title']),
        'description'    => $input['description'] ?? null,
        'image_url'      => $input['image_url'] ?? null,
        'console_type'   => $input['console_type'],
        'category'       => $input['category'] ?? 'Uncategorized',
        'display_order'  => $nextOrder,
        'price_per_hour' => $input['price_per_hour'],
        'status'         => in_array($input['status'] ?? '', ['available', 'unavailable'], true) ? $input['status'] : 'available',
    ]);

    $id = $db->lastInsertId();
    $game = $db->prepare('SELECT * FROM games WHERE id = :id');
    $game->execute(['id' => $id]);

    Response::created($game->fetch(), 'Game added.');
}

if ($method === 'PUT') {
    if (!isset($_GET['id'])) Response::error('id query parameter is required', 400);
    $id = (int)$_GET['id'];

    $existing = $db->prepare('SELECT * FROM games WHERE id = :id');
    $existing->execute(['id' => $id]);
    if (!$existing->fetch()) Response::notFound('Game not found.');

    $input = requestBody();
    $fields = [];
    $params = ['id' => $id];

    foreach (['title', 'description', 'image_url', 'console_type', 'category', 'status'] as $f) {
        if (array_key_exists($f, $input)) {
            $fields[] = "$f = :$f";
            $params[$f] = $input[$f];
        }
    }
    if (array_key_exists('price_per_hour', $input)) {
        $fields[] = 'price_per_hour = :price_per_hour';
        $params['price_per_hour'] = $input['price_per_hour'];
    }
    if (array_key_exists('display_order', $input)) {
        $fields[] = 'display_order = :display_order';
        $params['display_order'] = $input['display_order'];
    }

    if (empty($fields)) Response::error('No updatable fields provided.', 400);

    $sql = 'UPDATE games SET ' . implode(', ', $fields) . ' WHERE id = :id';
    $db->prepare($sql)->execute($params);

    $game = $db->prepare('SELECT * FROM games WHERE id = :id');
    $game->execute(['id' => $id]);

    Response::ok($game->fetch(), 'Game updated.');
}

if ($method === 'DELETE') {
    if (!isset($_GET['id'])) Response::error('id query parameter is required', 400);
    $id = (int)$_GET['id'];

    try {
        $db->prepare('DELETE FROM games WHERE id = :id')->execute(['id' => $id]);
        Response::ok(null, 'Game deleted.');
    } catch (PDOException $e) {
        // Foreign key constraint (game referenced by existing bookings)
        Response::error('Cannot delete a game with existing bookings. Mark it unavailable instead.', 409);
    }
}

if ($method === 'PATCH') {
    // Bulk reorder games
    $input = requestBody();
    if (!isset($input['games']) || !is_array($input['games'])) {
        Response::error('games array is required', 400);
    }

    try {
        $db->beginTransaction();
        
        foreach ($input['games'] as $gameUpdate) {
            if (!isset($gameUpdate['id']) || !isset($gameUpdate['display_order'])) {
                continue;
            }
            
            $db->prepare('UPDATE games SET display_order = :order WHERE id = :id')
               ->execute([
                   'order' => (int)$gameUpdate['display_order'],
                   'id' => (int)$gameUpdate['id']
               ]);
        }
        
        $db->commit();
        Response::ok(null, 'Games reordered successfully.');
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        Response::error('Failed to reorder games.', 500, ['exception' => $e->getMessage()]);
    }
}

Response::error('Method not allowed', 405);
