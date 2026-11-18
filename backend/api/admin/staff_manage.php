<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * Super Admin only. Manage staff/admin accounts.
 * GET    /api/admin/staff_manage.php          -> list all staff
 * POST   /api/admin/staff_manage.php          -> create a staff/super_admin account
 * PUT    /api/admin/staff_manage.php?id=3     -> update (status, role, reset password)
 * DELETE /api/admin/staff_manage.php?id=3     -> remove a staff account
 */

$actingAdmin = Auth::requireSuperAdmin();
$db = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query('SELECT id, full_name, username, role, permissions, status, created_at FROM admin_users ORDER BY created_at DESC');
    Response::ok($stmt->fetchAll());
}

if ($method === 'POST') {
    $input = requestBody();
    $validator = new Validator($input, [
        'full_name' => 'required|string|max:120',
        'username'  => 'required|string|max:60',
        'password'  => 'required|string|min:8',
        'role'      => 'required|in:staff,super_admin',
    ]);
    if ($validator->fails()) Response::validationError($validator->errors());

    $existsStmt = $db->prepare('SELECT id FROM admin_users WHERE username = :u');
    $existsStmt->execute(['u' => $input['username']]);
    if ($existsStmt->fetch()) {
        Response::error('Username already taken.', 409);
    }

    // Handle permissions for staff
    $permissions = null;
    if ($input['role'] === 'staff' && isset($input['permissions'])) {
        $permissions = json_encode($input['permissions']);
    }

    $stmt = $db->prepare(
        'INSERT INTO admin_users (full_name, username, password_hash, role, permissions, status)
         VALUES (:full_name, :username, :password_hash, :role, :permissions, "active")'
    );
    $stmt->execute([
        'full_name'     => trim($input['full_name']),
        'username'      => trim($input['username']),
        'password_hash' => password_hash($input['password'], PASSWORD_BCRYPT),
        'role'          => $input['role'],
        'permissions'   => $permissions,
    ]);

    $staff = $db->prepare('SELECT id, full_name, username, role, permissions, status, created_at FROM admin_users WHERE id = :id');
    $staff->execute(['id' => $db->lastInsertId()]);
    Response::created($staff->fetch(), 'Staff account created.');
}

if ($method === 'PUT') {
    if (!isset($_GET['id'])) Response::error('id query parameter is required', 400);
    $id = (int)$_GET['id'];
    $input = requestBody();

    $fields = [];
    $params = ['id' => $id];

    foreach (['full_name', 'role', 'status'] as $f) {
        if (array_key_exists($f, $input)) {
            $fields[] = "$f = :$f";
            $params[$f] = $input[$f];
        }
    }
    
    // Handle permissions update
    if (array_key_exists('permissions', $input)) {
        $fields[] = 'permissions = :permissions';
        $params['permissions'] = $input['permissions'] ? json_encode($input['permissions']) : null;
    }
    
    if (!empty($input['password'])) {
        $fields[] = 'password_hash = :password_hash';
        $params['password_hash'] = password_hash($input['password'], PASSWORD_BCRYPT);
    }
    if (empty($fields)) Response::error('No updatable fields provided.', 400);

    $db->prepare('UPDATE admin_users SET ' . implode(', ', $fields) . ' WHERE id = :id')->execute($params);

    $staff = $db->prepare('SELECT id, full_name, username, role, permissions, status, created_at FROM admin_users WHERE id = :id');
    $staff->execute(['id' => $id]);
    Response::ok($staff->fetch(), 'Staff account updated.');
}

if ($method === 'DELETE') {
    if (!isset($_GET['id'])) Response::error('id query parameter is required', 400);
    $id = (int)$_GET['id'];

    if ($id === (int)$actingAdmin['id']) {
        Response::error('You cannot delete your own account.', 400);
    }

    $db->prepare('DELETE FROM admin_users WHERE id = :id')->execute(['id' => $id]);
    Response::ok(null, 'Staff account removed.');
}

Response::error('Method not allowed', 405);
