<?php
    // el mostrador dice que todas las respuestas que salgan de aqui van a ser en formato json
    header('Content-Type: application/json; charset=utf-8');
    
    // el mostrador comprueba si el cliente ya le habia enseñado el dni antes y si no le abre una ficha de visitante (sesion)
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    require_once __DIR__ . '/../controller/NotificacionesController.php';

    // enchufamos el mostrador a la base de datos y si falla cerramos la persiana y avisamos del error
    try {
        $conexion = new PDO("mysql:host=localhost;dbname=reto_2daw;charset=utf8", "root", "");
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Fallo de conexion a la base de datos"]);
        exit;
    }

    // llamamos al jefe de almacen (controlador) y le damos el walkie talkie (conexion) para que trabaje
    $controlador = new NotificacionesController($conexion);
    
    // miramos que tipo de camion ha llegado al mostrador (get post put delete)
    $metodo = $_SERVER["REQUEST_METHOD"];
    
    // un pequeño truco por si html no nos deja mandar un camion tipo patch lo camuflamos en un post con un parametro
    if ($metodo === 'POST' && ($_GET['action'] ?? '') === 'update-state') {
        $metodo = 'PATCH';
    }

    switch ($metodo) {
        case 'GET':
            // si el cliente pide ver solo "las mias" (mine)
            if (isset($_GET['mine'])) {
                // comprobamos que el cliente tenga su id puesto
                if (!isset($_SESSION['usuario_id'])) {
                    http_response_code(401);
                    echo json_encode(["error" => "Es necesario iniciar sesion"]);
                    break;
                }
                
                // le decimos al jefe que traiga solo las cajas de este usuario
                $resultado = $controlador->obtenerPorUsuario((int) $_SESSION['usuario_id']);
                http_response_code(200);
                echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
                
            // si el cliente pide buscar una caja en concreto por su id
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
            // si no especifica nada el jefe trae el registro de todas las cajas del almacen
            } else {
                $resultado = $controlador->obtenerTodas();
                http_response_code(200);
                echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
            }
            break;

        case 'POST':
            // un cliente viene a dejar un paquete nuevo, primero comprobamos su dni
            if (!isset($_SESSION['usuario_id'])) {
                http_response_code(401);
                echo json_encode(["error" => "Es necesario iniciar sesion"]);
                break;
            }

            // comprobamos en su ficha que sea un usuario normal y no un admin
            if (($_SESSION['rol'] ?? null) !== 'USER') {
                http_response_code(403);
                echo json_encode(["error" => "Solo los usuarios pueden crear notificaciones"]);
                break;
            }

            // abrimos el paquete que nos han mandado en formato json y lo leemos
            $contenido = file_get_contents("php://input");
            $datos = json_decode($contenido, true);

            // el recepcionista revisa que la etiqueta tenga titulo y descripcion obligatoriamente
            if (
                !is_array($datos) ||
                !is_string($datos['titulo'] ?? null) ||
                !is_string($datos['descripcion'] ?? null) ||
                trim($datos['titulo']) === '' ||
                trim($datos['descripcion']) === ''
            ) {
                http_response_code(400);
                echo json_encode(["error" => "El titulo y el mensaje son obligatorios"]);
                break;
            }

            // si todo esta bien pasamos los datos al jefe para que cree la caja con estado pendiente
            $exito = $controlador->crear([
                'titulo' => trim($datos['titulo']),
                'descripcion' => trim($datos['descripcion']),
                'fecha_creacion' => date('Y-m-d H:i:s'),
                'estado' => \enumNotificaciones\EstadoNotificaciones::PENDIENTE->value,
                'id_usuario' => (int) $_SESSION['usuario_id']
            ]);

            // le decimos al cliente por la pantalla si se ha podido guardar o no
            if ($exito) {
                http_response_code(201); 
                echo json_encode(["mensaje" => "Notificacion creada con exito"], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(400); 
                echo json_encode(["error" => "Faltan datos o el estado es invalido"]);
            }
            break;

        case 'PATCH':
            // alguien viene a cambiarle la pegatina de estado a una caja (pendiente a resuelto etc)
            if (!isset($_SESSION['usuario_id'])) {
                http_response_code(401);
                echo json_encode(["error" => "Es necesario iniciar sesion"]);
                break;
            }

            // miramos que sea el administrador porque los usuarios normales no pueden tocar esto
            if (($_SESSION['rol'] ?? null) !== 'ADMIN') {
                http_response_code(403);
                echo json_encode(["error" => "No tienes permiso para cambiar el estado"]);
                break;
            }

            $contenido = file_get_contents("php://input");
            $datos = json_decode($contenido === false ? '' : $contenido, true);
            
            // comprobamos que nos pase el id y que el estado sea uno de los que tenemos en la lista oficial (enum)
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

            // el jefe de almacen va y cambia la pegatina de esa caja
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
            // un usuario viene a reescribir por completo el contenido de su peticion
            if (!isset($_SESSION['usuario_id'])) {
                http_response_code(401);
                echo json_encode(["error" => "Es necesario iniciar sesion"]);
                break;
            }

            // comprobamos que sea un usuario
            if (($_SESSION['rol'] ?? null) !== 'USER') {
                http_response_code(403);
                echo json_encode(["error" => "Solo los usuarios pueden editar sus notificaciones"]);
                break;
            }

            $contenido = file_get_contents("php://input");
            $datos = json_decode($contenido === false ? '' : $contenido, true);
            $id = is_array($datos)
                ? filter_var($datos['id_notificacion'] ?? null, FILTER_VALIDATE_INT)
                : false;

            // el mostrador verifica que traiga la informacion completa para rellenar la caja
            if (
                $id === false ||
                $id < 1 ||
                !is_array($datos) ||
                !is_string($datos['titulo'] ?? null) ||
                !is_string($datos['descripcion'] ?? null) ||
                trim($datos['titulo']) === '' ||
                trim($datos['descripcion']) === ''
            ) {
                http_response_code(400);
                echo json_encode(["error" => "El ID, el titulo y el mensaje son obligatorios"]);
                break;
            }

            // le damos los datos nuevos al jefe para que actualice la caja comprobando que sea suya
            $exito = $controlador->actualizarContenidoPropio(
                $id,
                (int) $_SESSION['usuario_id'],
                trim($datos['titulo']),
                trim($datos['descripcion'])
            );

            if ($exito === null) {
                http_response_code(404);
                echo json_encode(["error" => "No se encontro la notificacion"]);
            } elseif ($exito) {
                http_response_code(200);
                echo json_encode(["mensaje" => "Notificacion actualizada correctamente"], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "No se pudo actualizar la notificacion"]);
            }
            break;

        case 'DELETE':
            // un usuario quiere retirar su queja y tirarla a la papelera
            if (!isset($_SESSION['usuario_id'])) {
                http_response_code(401);
                echo json_encode(["error" => "Es necesario iniciar sesion"]);
                break;
            }

            if (($_SESSION['rol'] ?? null) !== 'USER') {
                http_response_code(403);
                echo json_encode(["error" => "Solo los usuarios pueden eliminar sus notificaciones"]);
                break;
            }

            // recogemos el numero de ticket de la papelera desde la url
            $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
            if ($id === false || $id < 1) {
                http_response_code(400);
                echo json_encode(["error" => "El ID de la notificacion no es valido"]);
                break;
            }

            // el jefe manda destruir la caja comprobando primero que el id coincida con el usuario dueño
            $exito = $controlador->eliminarPropia($id, (int) $_SESSION['usuario_id']);

            if ($exito === null) {
                http_response_code(404);
                echo json_encode(["error" => "No se encontro la notificacion"]);
            } elseif ($exito) {
                http_response_code(200);
                echo json_encode(["mensaje" => "Notificacion eliminada correctamente"], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "No se pudo eliminar la notificacion"]);
            }
            break;
            
        default:
            // si el camion intenta entrar derrapando con un metodo inventado le cerramos el paso
            http_response_code(405);
            echo json_encode(["error" => "Metodo HTTP no permitido"]);
            break;
    }
    
    // finalizamos el turno del mostrador
    exit;
?>