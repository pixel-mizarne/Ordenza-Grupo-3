<?php
require_once 'Usuarios.php';
require_once 'UsuariosDAO.php';

class UsuariosController {

    private UsuariosDAO $usuariosDAO;

    public function __construct(PDO $conexion) {
        $this->usuariosDAO = new UsuariosDAO($conexion);
    }

    // saca todos los usuarios y los pasa a array para que el json los lea bien
    public function listar() {
        $listaUsuarios = $this->usuariosDAO->buscarTodos();
        $resultado = [];

        foreach ($listaUsuarios as $usuario) {
            $resultado[] = $usuario->toArray();
        }

        return $resultado;
    }

    // crea un usuario nuevo con los datos que llegan y devuelve true o false
    public function guardarNuevo(array $datos) {
        if (isset($datos['nombre']) && isset($datos['apellido']) && isset($datos['nombre_usuarios']) && isset($datos['password_hash']) && isset($datos['rol'])) {
            $usuarioNuevo = new Usuarios(
                0,
                $datos['nombre'],
                $datos['apellido'],
                $datos['nombre_usuarios'],
                $datos['password_hash'],
                $datos['rol']
            );

            return $this->usuariosDAO->crear($usuarioNuevo);
        }
        return false;
    }

    // actualiza un usuario existente forzando el id a entero para que no de problemas
    public function actualizar(array $datos) {
        if (isset($datos['id']) && isset($datos['nombre']) && isset($datos['apellido']) && isset($datos['nombre_usuarios']) && isset($datos['password_hash']) && isset($datos['rol'])) {
            $usuarioActualizado = new Usuarios(
                intval($datos['id']),
                $datos['nombre'],
                $datos['apellido'],
                $datos['nombre_usuarios'],
                $datos['password_hash'],
                $datos['rol']
            );

            return $this->usuariosDAO->actualizar($usuarioActualizado);
        }
        return false;
    }

    // borra el usuario por su id y devuelve true o false
    public function eliminar(int $id) {
        return $this->usuariosDAO->borrar($id);
    }
}
?>