<?php
    header('Content-Type: application/json; charset=utf-8');
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    

    require_once __DIR__ . '/../controller/NotificacionesController.php';

    // conexion con la base de datos
    try {
        $conexion = new PDO("mysql:host=localhost;dbname=reto_2daw;charset=utf8", "root", "");
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Fallo de conexion a la base de datos"]);
        exit;
    }

    $controlador = new NotificacionesController($conexion);
    $metodo = $_SERVER["REQUEST_METHOD"];
    if ($metodo === 'POST' && ($_GET['action'] ?? '') === 'update-state') {
        $metodo = 'PATCH';
    }

    switch ($metodo) {
        case 'GET':
            if (isset($_GET['mine'])) {
                if (!isset($_SESSION['usuario_id'])) {
                    http_response_code(401);
                    echo json_encode(["error" => "Es necesario iniciar sesion"]);
                    break;
                }
                
                $resultado = $controlador->obtenerPorUsuario((int) $_SESSION['usuario_id']);
                http_response_code(200);
                echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
                
            } elseif (isset($_GET['id'])) {
                $id = intval($_GET['id']);
                $resultado = $controlador->obtenerPorId($id);

                if ($resultado !== null) {
                    http_response_code(200);
                    echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "No se encontro la notificacion"]);
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
                echo json_encode(["mensaje" => "Notificacion creada con exito"]);
            } else {
                http_response_code(400); 
                echo json_encode(["error" => "Faltan datos o el estado es invalido"]);
            }
            break;

        case 'PATCH':
            if (!isset($_SESSION['usuario_id'])) {
                http_response_code(401);
                echo json_encode(["error" => "Es necesario iniciar sesion"]);
                break;
            }

            if (($_SESSION['rol'] ?? null) !== 'ADMIN') {
                http_response_code(403);
                echo json_encode(["error" => "No tienes permiso para cambiar el estado"]);
                break;
            }

            $contenido = file_get_contents("php://input");
            $datos = json_decode($contenido === false ? '' : $contenido, true);
            $id = is_array($datos)
                ? filter_var($datos['id_notificacion'] ?? null, FILTER_VALIDATE_INT)
                : false;
            $estado = is_array($datos) && is_string($datos['estado'] ?? null)
                ? \enumNotificaciones\EstadoNotificaciones::tryFrom($datos['estado'])
                : null;

            if ($id === false || $id < 1 || $estado === null) {
                http_response_code(400);
                echo json_encode(["error" => "El ID o el estado de la notificacion no es valido"]);
                break;
            }

            $exito = $controlador->actualizarEstado($id, $estado);

            if ($exito === null) {
                http_response_code(404);
                echo json_encode(["error" => "No se encontro la notificacion"]);
            } elseif ($exito) {
                http_response_code(200);
                echo json_encode(["mensaje" => "Estado de la notificacion actualizado correctamente"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "No se pudo actualizar el estado de la notificacion"]);
            }
            break;

        case 'PUT':
            $contenido = file_get_contents("php://input");
            $datos = json_decode($contenido, true);

            $exito = $controlador->actualizar($datos);
            
            if ($exito) {
                http_response_code(200);
                echo json_encode(["mensaje" => "Notificacion actualizada correctamente"]);
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Faltan datos o el estado es invalido"]);
            }
            break;

        case 'DELETE':
            if (isset($_GET['id'])) {
                $id = intval($_GET['id']);
                $exito = $controlador->eliminar($id);
                
                if ($exito) {
                    http_response_code(200);
                    echo json_encode(["mensaje" => "Notificacion eliminada correctamente"]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Error al eliminar la notificacion"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Falta el ID de la notificacion a eliminar"]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(["error" => "Metodo HTTP no permitido"]);
            break;
    }
    
    exit;
?>