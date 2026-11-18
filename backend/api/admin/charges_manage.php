<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * Super Admin only. Define chargeable extras (e.g. "Extra time in game room").
 * GET    /api/admin/charges_manage.php          -> list all
 * POST   /api/admin/charges_manage.php          -> create
 * PUT    /api/admin/charges_manage.php?id=2     -> update
 * DELETE /api/admin/charges_manage.php?id=2     -> delete
 *
 * Staff apply a charge to a booking via:
 * POST /api/admin/apply_charge.php  { booking_id, charge_type_id, quantity }
 */

Auth::requireSuperAdmin();
$db = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    Response::ok($db->query('SELECT * FROM charge_types ORDER BY name ASC')->fetchAll());
}

if ($method === 'POST') {
    $input = requestBody();
    $validator = new Validator($input, [
        'name'   => 'required|string|max:120',
        'amount' => 'required|numeric|min:0',
        'unit'   => 'required|in:flat,per_hour',
    ]);
    if ($validator->fails()) Response::validationError($validator->errors());

    $stmt = $db->prepare('INSERT INTO charge_types (name, amount, unit, status) VALUES (:name, :amount, :unit, "active")');
    $stmt->execute(['name' => trim($input['name']), 'amount' => $input['amount'], 'unit' => $input['unit']]);

    $charge = $db->prepare('SELECT * FROM charge_types WHERE id = :id');
    $charge->execute(['id' => $db->lastInsertId()]);
    Response::created($charge->fetch(), 'Charge type added.');
}

if ($method === 'PUT') {
    if (!isset($_GET['id'])) Response::error('id query parameter is required', 400);
    $id = (int)$_GET['id'];
    $input = requestBody();

    $fields = [];
    $params = ['id' => $id];
    foreach (['name', 'amount', 'unit', 'status'] as $f) {
        if (array_key_exists($f, $input)) {
            $fields[] = "$f = :$f";
            $params[$f] = $input[$f];
        }
    }
    if (empty($fields)) Response::error('No updatable fields provided.', 400);

    $db->prepare('UPDATE charge_types SET ' . implode(', ', $fields) . ' WHERE id = :id')->execute($params);

    $charge = $db->prepare('SELECT * FROM charge_types WHERE id = :id');
    $charge->execute(['id' => $id]);
    Response::ok($charge->fetch(), 'Charge type updated.');
}

if ($method === 'DELETE') {
    if (!isset($_GET['id'])) Response::error('id query parameter is required', 400);
    $db->prepare('DELETE FROM charge_types WHERE id = :id')->execute(['id' => (int)$_GET['id']]);
    Response::ok(null, 'Charge type deleted.');
}

Response::error('Method not allowed', 405);
