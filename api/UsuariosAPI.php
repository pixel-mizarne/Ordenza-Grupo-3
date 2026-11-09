<?php

header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Envía una respuesta JSON y establece el código de estado HTTP.
function responderUsuarios(array $datos, int $estado = 200): void
{
    http_response_code($estado);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
}

// Lee y valida que el cuerpo de la solicitud sea un objeto JSON.
function leerJsonUsuarios(): ?array
{
    $contenido = file_get_contents('php://input');
    $datos = json_decode($contenido === false ? '' : $contenido, true);

    if (!is_array($datos)) {
        responderUsuarios(['error' => 'El cuerpo debe ser un objeto JSON válido.'], 400);
        return null;
    }

    return $datos;
}

// Comprueba que los campos indicados existan, sean texto y no estén vacíos.
function tieneCamposTextoUsuarios(array $datos, array $campos): bool
{
    foreach ($campos as $campo) {
        if (!isset($datos[$campo]) || !is_string($datos[$campo]) || trim($datos[$campo]) === '') {
            return false;
        }
    }

    return true;
}

function esContrasenaValidaUsuarios(string $contrasena): bool
{
    return preg_match('/\A(?=[\s\S]{8,}\z)(?=[\s\S]*\p{Ll})(?=[\s\S]*\p{Lu})(?=[\s\S]*[0-9])(?=[\s\S]*[._-])[\s\S]*\z/u', $contrasena) === 1;
}

// Indica si existe un usuario con el identificador proporcionado.
function existeUsuario(PDO $conexion, int $id): bool
{
    $consulta = $conexion->prepare('SELECT 1 FROM usuarios WHERE id_usuario = :id_usuario');
    $consulta->execute(['id_usuario' => $id]);

    return $consulta->fetchColumn() !== false;
}

// Evita que la sesión actual modifique o elimine su propia cuenta.
function esUsuarioDeSesion(int $id): bool
{
    return isset($_SESSION['usuario_id']) && (int) $_SESSION['usuario_id'] === $id;
}

// Obtiene el ID de usuario desde el parámetro de consulta o la ruta.
function obtenerIdUsuarioApi(array $ruta): ?int
{
    if (isset($_GET['id'])) {
        return filter_var($_GET['id'], FILTER_VALIDATE_INT) ?: null;
    }

    if (isset($ruta[0]) && ctype_digit($ruta[0])) {
        return (int) $ruta[0];
    }

    return null;
}

// Determina los segmentos de ruta posteriores a "usuarios".
function obtenerRutaUsuarioApi(): array
{
    $ruta = $_SERVER['PATH_INFO'] ?? '';
    if ($ruta === '') {
        $ruta = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
        $segmentos = array_values(array_filter(explode('/', trim($ruta, '/')), 'strlen'));
        $indiceUsuarios = null;

        foreach ($segmentos as $indice => $segmento) {
            if (strtolower($segmento) === 'usuarios' || strtolower($segmento) === 'usuarios.php') {
                $indiceUsuarios = $indice;
            }
        }

        $ruta = $indiceUsuarios === null ? '' : implode('/', array_slice($segmentos, $indiceUsuarios + 1));
    }

    return array_values(array_filter(explode('/', trim($ruta, '/')), 'strlen'));
}

// Abre la conexión con la base de datos; ante un error, responde y termina.
try {
    $conexion = new PDO(
        'mysql:host=localhost;dbname=reto_2daw;charset=utf8',
        'root',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $error) {
    error_log('No se pudo conectar a la base de datos para la API de usuarios: ' . $error->getMessage());
    responderUsuarios(['error' => 'No se pudo conectar con la base de datos.'], 500);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$ruta = obtenerRutaUsuarioApi();
$id = obtenerIdUsuarioApi($ruta);

try {
    switch ($metodo) {
        case 'GET':
            // Devuelve un usuario concreto si hay ID, o la lista completa en caso contrario.
            if ($ruta !== [] && (count($ruta) !== 1 || !ctype_digit($ruta[0]))) {
                responderUsuarios(['error' => 'Ruta no encontrada.'], 404);
                break;
            }

            if ($id !== null) {
                if ($id < 1) {
                    responderUsuarios(['error' => 'El ID debe ser un entero positivo.'], 400);
                    break;
                }

                $consulta = $conexion->prepare(
                    'SELECT id_usuario, nombre, apellidos, nombre_usuario, rol
                     FROM usuarios WHERE id_usuario = :id_usuario'
                );
                $consulta->execute(['id_usuario' => $id]);
                $usuario = $consulta->fetch(PDO::FETCH_ASSOC);

                if ($usuario === false) {
                    responderUsuarios(['error' => 'No se encontró el usuario.'], 404);
                    break;
                }

                responderUsuarios($usuario);
                break;
            }

            $consulta = $conexion->query(
                'SELECT id_usuario, nombre, apellidos, nombre_usuario, rol FROM usuarios'
            );
            responderUsuarios($consulta->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'POST':
            // Autentica al usuario cuando la ruta o el parámetro de acción indican login.
            if (($ruta === ['login']) || ($_GET['accion'] ?? '') === 'login') {
                $datos = leerJsonUsuarios();
                if ($datos === null) {
                    break;
                }
                if (!tieneCamposTextoUsuarios($datos, ['nombre_usuario', 'password'])) {
                    responderUsuarios(['error' => 'Se requieren nombre_usuario y password.'], 400);
                    break;
                }

                $consulta = $conexion->prepare(
                    'SELECT password_hash FROM usuarios WHERE nombre_usuario = :nombre_usuario LIMIT 1'
                );
                $consulta->execute(['nombre_usuario' => $datos['nombre_usuario']]);
                $passwordHash = $consulta->fetchColumn();

                responderUsuarios([
                    'autenticado' => $passwordHash !== false && password_verify($datos['password'], $passwordHash)
                ]);
                break;
            }

            // Crea un usuario nuevo y guarda la contraseña como hash.
            if ($ruta !== []) {
                responderUsuarios(['error' => 'Ruta no encontrada.'], 404);
                break;
            }

            $datos = leerJsonUsuarios();
            if ($datos === null) {
                break;
            }
            if (!tieneCamposTextoUsuarios($datos, ['nombre', 'apellidos', 'nombre_usuario'])) {
                responderUsuarios(['error' => 'Se requieren nombre, apellidos y nombre_usuario.'], 400);
                break;
            }

            $password = $datos['password'] ?? null;
            if (!is_string($password) || !esContrasenaValidaUsuarios($password)) {
                responderUsuarios([
                    'error' => 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y uno de estos caracteres: . - _'
                ], 400);
                break;
            }
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            // Falta la validacion de rol      -Miz
            // Validar que el rol sea correcto
            $rol = $datos['rol'] ?? 'USER';
            if (!in_array($rol, ['ADMIN', 'USER'])) {
                $rol = 'USER'; 
            }


            $consulta = $conexion->prepare(
                'INSERT INTO usuarios (nombre, apellidos, nombre_usuario, password_hash, rol)
                 VALUES (:nombre, :apellidos, :nombre_usuario, :password_hash, :rol)'
            );
            $consulta->execute([
                'nombre' => trim($datos['nombre']),
                'apellidos' => trim($datos['apellidos']),
                'nombre_usuario' => trim($datos['nombre_usuario']),
                'password_hash' => $passwordHash,
                'rol' => $rol // he añadido el rol al array de parámetros -Miz
            ]);

            responderUsuarios([
                'exito' => true,
                'id_usuario' => (int) $conexion->lastInsertId()
            ], 201);
            break;

        case 'PUT':
            // Actualiza los datos de perfil del usuario identificado por ID.
            if (($ruta !== [] && (count($ruta) !== 1 || !ctype_digit($ruta[0])))
                || $id === null || $id < 1) {
                responderUsuarios(['error' => 'Se requiere un ID de usuario válido.'], 400);
                break;
            }

            if (esUsuarioDeSesion($id)) {
                responderUsuarios(['error' => 'No puedes editar tu propia cuenta mientras tienes la sesión iniciada.'], 403);
                break;
            }

            $datos = leerJsonUsuarios();
            if ($datos === null) {
                break;
            }
            if (!tieneCamposTextoUsuarios($datos, ['nombre', 'apellidos', 'nombre_usuario'])) {
                responderUsuarios(['error' => 'Se requieren nombre, apellidos y nombre_usuario.'], 400);
                break;
            }

            if (array_key_exists('password', $datos)
                && (!is_string($datos['password']) || ($datos['password'] !== '' && trim($datos['password']) === ''))) {
                responderUsuarios(['error' => 'La contraseña no es válida.'], 400);
                break;
            }

            $actualizarPassword = isset($datos['password']) && $datos['password'] !== '';
            if ($actualizarPassword && !esContrasenaValidaUsuarios($datos['password'])) {
                responderUsuarios([
                    'error' => 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y uno de estos caracteres: . - _'
                ], 400);
                break;
            }

            if ($actualizarPassword) {

             // Aqui lo mismo para validar rol
            $rol = $datos['rol'] ?? 'USER';
            if (!in_array($rol, ['ADMIN', 'USER'])) {
                $rol = 'USER';
            }
                $consulta = $conexion->prepare(
                    'UPDATE usuarios
                     SET nombre = :nombre, apellidos = :apellidos, nombre_usuario = :nombre_usuario,
                         password_hash = :password_hash, rol = :rol
                     WHERE id_usuario = :id_usuario'
                );
                $parametros = [ 
                    'nombre' => trim($datos['nombre']),
                    'apellidos' => trim($datos['apellidos']),
                    'nombre_usuario' => trim($datos['nombre_usuario']),
                    'password_hash' => password_hash($datos['password'], PASSWORD_DEFAULT),
                    'id_usuario' => $id,
                    'rol' => $rol // lo mismo aqui
                ];
            } else {
                $consulta = $conexion->prepare(
                    'UPDATE usuarios
                     SET nombre = :nombre, apellidos = :apellidos, nombre_usuario = :nombre_usuario, rol = :rol
                     WHERE id_usuario = :id_usuario'
                );
                $parametros = [
                    'nombre' => trim($datos['nombre']),
                    'apellidos' => trim($datos['apellidos']),
                    'nombre_usuario' => trim($datos['nombre_usuario']),
                    'id_usuario' => $id,
                    'rol' => $rol // y aqui
                ];
            }
            $consulta->execute($parametros);

            if ($consulta->rowCount() === 0 && !existeUsuario($conexion, $id)) {
                responderUsuarios(['error' => 'No se encontró el usuario.'], 404);
                break;
            }

            responderUsuarios(['exito' => true]);
            break;

        case 'PATCH':
            // Cambia únicamente la contraseña del usuario indicado en la ruta.
            if (count($ruta) !== 2 || !ctype_digit($ruta[0]) || $ruta[1] !== 'password'
                || $id === null || $id < 1) {
                responderUsuarios(['error' => 'Se requiere un ID y la ruta password.'], 400);
                break;
            }

            if (esUsuarioDeSesion($id)) {
                responderUsuarios(['error' => 'No puedes editar tu propia cuenta mientras tienes la sesión iniciada.'], 403);
                break;
            }

            $datos = leerJsonUsuarios();
            if ($datos === null) {
                break;
            }
            if (!tieneCamposTextoUsuarios($datos, ['password'])) {
                responderUsuarios(['error' => 'Se requiere una contraseña válida.'], 400);
                break;
            }
            if (!esContrasenaValidaUsuarios($datos['password'])) {
                responderUsuarios([
                    'error' => 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y uno de estos caracteres: . - _'
                ], 400);
                break;
            }

            $consulta = $conexion->prepare(
                'UPDATE usuarios SET password_hash = :password_hash WHERE id_usuario = :id_usuario'
            );
            $consulta->execute([
                'password_hash' => password_hash($datos['password'], PASSWORD_DEFAULT),
                'id_usuario' => $id
            ]);

            if ($consulta->rowCount() === 0 && !existeUsuario($conexion, $id)) {
                responderUsuarios(['error' => 'No se encontró el usuario.'], 404);
                break;
            }

            responderUsuarios(['exito' => true]);
            break;

        case 'DELETE':
            // Elimina el usuario identificado por ID.
            if (($ruta !== [] && (count($ruta) !== 1 || !ctype_digit($ruta[0])))
                || $id === null || $id < 1) {
                responderUsuarios(['error' => 'Se requiere un ID de usuario válido.'], 400);
                break;
            }

            if (esUsuarioDeSesion($id)) {
                responderUsuarios(['error' => 'No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada.'], 403);
                break;
            }

            $consulta = $conexion->prepare('DELETE FROM usuarios WHERE id_usuario = :id_usuario');
            $consulta->execute(['id_usuario' => $id]);

            if ($consulta->rowCount() === 0) {
                responderUsuarios(['error' => 'No se encontró el usuario.'], 404);
                break;
            }

            responderUsuarios(['exito' => true]);
            break;

        default:
            // Informa cuando se solicita un método HTTP que esta API no admite.
            responderUsuarios(['error' => 'Método HTTP no permitido.'], 405);
            break;
    }
} catch (PDOException $error) {
    error_log('Error de base de datos en la API de usuarios: ' . $error->getMessage());
    responderUsuarios(['error' => 'Error al procesar la solicitud.'], 500);
}

exit;
