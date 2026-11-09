<?php
require_once __DIR__ . '/../dao/LoginDAO.php';
class LoginController
{
    private LoginDAO $loginDAO;

    public function __construct(PDO $db)
    {
        $this->loginDAO = new LoginDAO($db);
    }
    public function login(string $nombreUsuario, string $password): array
    {
        $cleanUsername = trim($nombreUsuario);

        if ($cleanUsername === '' || $password === '') {
            throw new InvalidArgumentException('Usuario y contraseña obligatorios', 400);
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $usuario = $this->loginDAO->buscarPorNombreUsuario($cleanUsername);

        if ($usuario === null) {
            throw new InvalidArgumentException('Credenciales inválidas', 401);
        }

        $hashFromDb = (string) $usuario['password_hash'];
        if (!password_verify($password, $hashFromDb)) {
            throw new InvalidArgumentException('Credenciales inválidas', 401);
        }

        $_SESSION['usuario_id'] = (int) $usuario['id_usuario'];
        $_SESSION['nombre'] = $usuario['nombre'];
        $_SESSION['nombre_usuario'] = $cleanUsername;
        
        if (isset($usuario['apellidos'])) {
            $_SESSION['apellidos'] = $usuario['apellidos'];
        } else {
            $_SESSION['apellidos'] = '';
        }
        
        $userRole = 'USER';
        if (isset($usuario['rol'])) {
            $userRole = $usuario['rol'];
        }
        $_SESSION['rol'] = $userRole;

        $response = [
            'id_usuario'     => (int) $usuario['id_usuario'],
            'nombre'         => $usuario['nombre'],
            'apellidos'      => $usuario['apellidos'] ?? '',
            'nombre_usuario' => $cleanUsername,
            'rol'            => $userRole,
        ];
        
        return $response;
    }
}