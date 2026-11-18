<?php
require_once __DIR__ . '/../../bootstrap.php';

/** POST /api/admin/auth  { username, password } -> { token, admin } */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

$input = requestBody();
$validator = new Validator($input, [
    'username' => 'required|string|max:60',
    'password' => 'required|string',
]);
if ($validator->fails()) Response::validationError($validator->errors());

$db = Database::connect();
$stmt = $db->prepare('SELECT * FROM admin_users WHERE username = :username AND status = "active"');
$stmt->execute(['username' => $input['username']]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($input['password'], $admin['password_hash'])) {
    Response::unauthorized('Invalid username or password.');
}

$token = Auth::issueToken((int)$admin['id']);

unset($admin['password_hash']);

Response::ok(['token' => $token, 'admin' => $admin], 'Login successful.');
