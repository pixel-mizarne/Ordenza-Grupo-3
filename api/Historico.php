<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Habilitar errores temporalmente para depurar si algo falla
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Verificar que el usuario esté logueado (opcional, por seguridad)
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../controller/HistoricoController.php';

try {
    $database = new Database();
    $dbConnection = $database->getConnection();
    
    if (!$dbConnection instanceof PDO) {
        throw new RuntimeException("Error de conexión a la base de datos", 500);
    }

    $controller = new HistoricoController($dbConnection);
    
    // Validar que venga el ID del equipo
    $idEquipo = isset($_GET['id_equipamiento']) ? (int)$_GET['id_equipamiento'] : 0;
    if ($idEquipo <= 0) {
        throw new Exception("ID de equipamiento inválido", 400);
    }

    // Obtener el historial y devolverlo como JSON
    $historial = $controller->listar($idEquipo);
    echo json_encode($historial);
    exit;

} catch (Throwable $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}