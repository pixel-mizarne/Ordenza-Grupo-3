<?php

require_once 'Usuarios.php';
require_once 'UsuariosDAO.php';

    class UsuariosController{

        private UsuariosDAO $usuariosDAO;

        // Crea el controlador y prepara el acceso a datos con la conexión recibida.
        public function __construct(PDO $conexion){
            $this->usuariosDAO = new UsuariosDAO($conexion);
        }

        // Obtiene todos los usuarios a través del DAO.
        public function listar(){
            $listaUsuarios = $this->usuariosDAO->buscarTodos();

            return 'PorDefinir';
        }

        // Recoge los datos del formulario, construye el usuario y solicita su creación.
        public function guardarNuevo(){
            $nombre_cliente = $_POST['nombre'];
            $apellido_cliente = $_POST['apellido'];
            $nombre_username_cliente = $_POST['nombre_usuarios'];
            $password_hash_cliente = $_POST['password_hash'];
            $rol_cliente = $_POST['rol'];

            // El ID inicial es 0 porque el usuario aún no se ha guardado.
            $usuarioNuevo = new Usuarios(0, $nombre_cliente, $apellido_cliente, $nombre_username_cliente, $password_hash_cliente,$rol_cliente);

            $exito = $this->usuariosDAO->crear($usuarioNuevo);

            if($exito){
                header("PorDefinir");
            }else{
                echo "ERROR al guardar en la base de datos";
            }
        }

        // Recoge los datos del formulario y solicita al DAO la actualización del usuario.
        public function actualizar(){
            $id_usuario = (int) $_POST['id'];
            $nombre_cliente = $_POST['nombre'];
            $apellido_cliente = $_POST['apellido'];
            $nombre_username_cliente = $_POST['nombre_usuarios'];
            $password_hash_cliente = $_POST['password_hash'];
            $rol_cliente = $_POST['rol'];

            $usuarioActualizado = new Usuarios(
                $id_usuario,
                $nombre_cliente,
                $apellido_cliente,
                $nombre_username_cliente,
                $password_hash_cliente,
                $rol_cliente
            );

            $exito = $this->usuariosDAO->actualizar($usuarioActualizado);

            if($exito){
                header("PorDefinir");
            }else{
                echo "ERROR al actualizar en la base de datos";
            }
        }

        // Obtiene el ID de la solicitud y solicita al DAO que elimine ese usuario.
        public function eliminar(){
            $id_borrar = (int) $_GET['id'];

            $this->usuariosDAO->borrar($id_borrar);

            header("PorDefinir");
        }
    }
?>