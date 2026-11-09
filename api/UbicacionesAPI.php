<?php
    header('Content-Type: application/json; charset=utf-8');
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    require_once __DIR__ . '/../controller/UbicacionesController.php';

    try {
        $conexion = new PDO("mysql:host=localhost;dbname=reto_2daw;charset=utf8", "root", "");
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Fallo de conexion a la base de datos"]);
        exit;
    } 

    $controlador = new UbicacionesController($conexion);
    $metodo = $_SERVER["REQUEST_METHOD"];

    switch ($metodo) {
        case 'GET':
            if (isset($_GET['id'])) {
                $id = intval($_GET['id']);
                $resultado = $controlador->obtenerPorId($id);
                
                if ($resultado !== null) {
                    http_response_code(200);
                    echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "No se encontró la ubicación"]);
                }
            } else {
                $resultado = $controlador->obtenerTodas();
                http_response_code(200);
                echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
            }
            break;

        case 'POST':
            $contenido = file_get_contents("php://input");
            $datos = json_decode($contenido, true);
            
            $exito = $controlador->crear($datos);
            
            if ($exito) {
                http_response_code(201);
                echo json_encode(["mensaje" => "Ubicación creada con éxito"]);
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Error al crear la ubicación. Faltan datos."]);
            }
            break;

        case 'PUT':
            $contenido = file_get_contents("php://input");
            $datos = json_decode($contenido, true);
            
            $exito = $controlador->actualizar($datos);
            
            if ($exito) {
                http_response_code(200);
                echo json_encode(["mensaje" => "Ubicación actualizada correctamente"]);
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Error al actualizar. Comprueba los datos."]);
            }
            break;

        case 'DELETE':
            if (isset($_GET['id'])) {
                $id = intval($_GET['id']);
                $exito = $controlador->eliminar($id);
                
                if ($exito) {
                    http_response_code(200);
                    echo json_encode(["mensaje" => "Ubicación eliminada correctamente"]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Error al eliminar la ubicación"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Falta el ID"]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
            break;
    } 
    exit;
?>