<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Si no hay sesión, bloqueamos
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

// Nos conectamos a la base de datos (usando tu conexion.php)
require_once __DIR__ . '/../config/conexion.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db instanceof PDO) {
        throw new RuntimeException("Error de conexión");
    }

    // Hacemos la consulta SQL directamente para evitar errores con los DAOs
    $stmt = $db->prepare("SELECT id_usuario, nombre, apellidos, nombre_usuario, rol 
                          FROM usuarios WHERE id_usuario = :id LIMIT 1");
    $stmt->execute([':id' => $_SESSION['usuario_id']]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        http_response_code(404);
        echo json_encode(['error' => 'Usuario no encontrado en la BD']);
        exit;
    }

    // Devolvemos los datos
    echo json_encode($usuario);
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}