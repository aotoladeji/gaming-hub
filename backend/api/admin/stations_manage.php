<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * Manage physical stations.
 * Staff and Super Admin can manage stations.
 * POST   /api/admin/stations_manage.php          -> create
 * PUT    /api/admin/stations_manage.php?id=3     -> update (name/status)
 * DELETE /api/admin/stations_manage.php?id=3     -> delete
 */

$admin = Auth::requireAuth();

// All staff and super admin can manage stations
if ($admin['role'] !== 'super_admin' && $admin['role'] !== 'staff') {
    Response::error('Admin access required.', 403);
}

$db = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = requestBody();
    $validator = new Validator($input, [
        'name'         => 'required|string|max:100',
        'console_type' => 'required|in:PS5 Pro,PS4,Xbox Series X,Xbox One,PC,Nintendo Switch,Other',
    ]);
    if ($validator->fails()) Response::validationError($validator->errors());

    $stmt = $db->prepare('INSERT INTO stations (name, console_type, status) VALUES (:name, :console_type, :status)');
    $stmt->execute([
        'name'         => trim($input['name']),
        'console_type' => $input['console_type'],
        'status'       => in_array($input['status'] ?? '', ['idle', 'maintenance', 'offline'], true) ? $input['status'] : 'idle',
    ]);

    $station = $db->prepare('SELECT * FROM stations WHERE id = :id');
    $station->execute(['id' => $db->lastInsertId()]);
    Response::created($station->fetch(), 'Station added.');
}

if ($method === 'PUT') {
    if (!isset($_GET['id'])) Response::error('id query parameter is required', 400);
    $id = (int)$_GET['id'];
    $input = requestBody();

    $fields = [];
    $params = ['id' => $id];
    foreach (['name', 'console_type', 'status'] as $f) {
        if (array_key_exists($f, $input)) {
            $fields[] = "$f = :$f";
            $params[$f] = $input[$f];
        }
    }
    if (empty($fields)) Response::error('No updatable fields provided.', 400);

    $db->prepare('UPDATE stations SET ' . implode(', ', $fields) . ' WHERE id = :id')->execute($params);

    $station = $db->prepare('SELECT * FROM stations WHERE id = :id');
    $station->execute(['id' => $id]);
    if (!$station) Response::notFound('Station not found.');

    Response::ok($station->fetch(), 'Station updated.');
}

if ($method === 'DELETE') {
    if (!isset($_GET['id'])) Response::error('id query parameter is required', 400);
    try {
        $db->prepare('DELETE FROM stations WHERE id = :id')->execute(['id' => (int)$_GET['id']]);
        Response::ok(null, 'Station deleted.');
    } catch (PDOException $e) {
        Response::error('Cannot delete a station with existing bookings.', 409);
    }
}

Response::error('Method not allowed', 405);
