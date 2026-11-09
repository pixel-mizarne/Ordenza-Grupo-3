<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Helper functions
function checkLogin() {
    if (!isset($_SESSION['usuario_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado.']);
        exit;
    }
}
function checkAdmin() {
    checkLogin();
    if ($_SESSION['rol'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['error' => 'Solo administradores.']);
        exit;
    }
}

require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../controller/EquipamientoController.php';

try {
    $database = new Database();
    $dbConnection = $database->getConnection();
    $equipamientoController = new EquipamientoController($dbConnection);
    
    $httpMethod = $_SERVER['REQUEST_METHOD'];
    $urlId = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $rawInput = file_get_contents('php://input');
    $requestPayload = json_decode($rawInput, true) ?? $_POST;

    checkLogin();

    if ($httpMethod === 'GET') {
        if (isset($_GET['id_ubicacion'])) {
            $idUbicacion = (int)$_GET['id_ubicacion'];
            echo json_encode($equipamientoController->listarPorUbicacion($idUbicacion));
        } else {
            echo json_encode($equipamientoController->listar());
        }
        exit;
    }

    if ($httpMethod === 'POST') {
        checkAdmin(); 
        $equipamientoController->crear($requestPayload);
        echo json_encode(['ok' => true, 'mensaje' => 'Equipo creado']);
        exit;
    }

        if ($httpMethod === 'PUT') {
        checkLogin();
        $equipamientoController->actualizar($urlId, $requestPayload);
        echo json_encode(['ok' => true, 'mensaje' => 'Equipo actualizado']);
        exit;
    }

    if ($httpMethod === 'DELETE') {
        checkAdmin();
        $equipamientoController->eliminar($urlId);
        echo json_encode(['ok' => true, 'mensaje' => 'Equipo eliminado']);
        exit;
    }

    throw new Exception("Método HTTP no permitido", 405);

} catch (Throwable $error) {
    http_response_code($error->getCode() ?: 500);
    echo json_encode(['error' => $error->getMessage()]);
}