<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../controller/LoginController.php';

function sendJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $loginController = new LoginController($db);
    $method = $_SERVER['REQUEST_METHOD'];

    // 1. CHECK SESSION (Used by Main.js)
    if ($method === 'GET') {
        if (isset($_SESSION['usuario_id'])) {
            sendJson([
                'autenticado' => true, 
                'usuario' => [
                    'id_usuario' => $_SESSION['usuario_id'],
                    'nombre' => $_SESSION['nombre'],
                    'rol' => $_SESSION['rol']
                ]
            ]);
        } else {
            sendJson(['autenticado' => false]);
        }
    }

    // 2. LOGIN (Used by Login.js)
    if ($method === 'POST') {
        $body = json_decode(file_get_contents('php://input'), true);
        $user = $loginController->login($body['nombre_usuario'] ?? '', $body['password'] ?? '');
        sendJson(['mensaje' => 'Login correcto', 'usuario' => $user]);
    }

    // 3. LOGOUT
    if ($method === 'DELETE') {
        $_SESSION = [];
        session_destroy();
        sendJson(['mensaje' => 'Sesión cerrada']);
    }

} catch (Throwable $e) {
    sendJson(['error' => $e->getMessage()], $e->getCode() ?: 500);
}