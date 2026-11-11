<?php

require_once 'Usuarios.php';
require_once 'UsuariosDAO.php';

    class UsuariosController{

        private UsuariosDAO $usuariosDAO;

        // este es el jefe de almacen (controlador) que prepara al carretillero (dao) dandole las llaves del almacen (conexion)
        public function __construct(PDO $conexion){
            $this->usuariosDAO = new UsuariosDAO($conexion);
        }

        // el jefe le pide al carretillero que traiga el inventario completo de usuarios y luego entrega esa lista para que se vea en la web
        public function listar(){
            $listaUsuarios = $this->usuariosDAO->buscarTodos();

            return $listaUsuarios;
        }

        // el jefe coge la hoja de pedido del mostrador (formulario post) empaqueta los datos en una caja nueva (objeto) y manda al carretillero a guardarla
        public function guardarNuevo(){
            $nombre_cliente = $_POST['nombre'];
            $apellido_cliente = $_POST['apellido'];
            $nombre_username_cliente = $_POST['nombre_usuarios'];
            $password_hash_cliente = $_POST['password_hash'];
            $rol_cliente = $_POST['rol'];

            // creamos la caja del usuario con id 0 porque todavia no tiene un hueco asignado en la estanteria
            $usuarioNuevo = new Usuarios(0, $nombre_cliente, $apellido_cliente, $nombre_username_cliente, $password_hash_cliente, $rol_cliente);

            $exito = $this->usuariosDAO->crear($usuarioNuevo);

            // si el carretillero logra guardar la caja redirigimos a la vista de usuarios
            if($exito){
                header("Location: ../index.html?page=usuarios");
                exit; // ponemos exit para cerrar la puerta y que no se ejecute nada mas despues de redirigir
            }else{
                echo "ERROR al guardar en la base de datos";
            }
        }

        // aqui cogemos los datos nuevos del mostrador montamos la caja con el id que ya tenia y le decimos al carretillero que cambie la caja vieja por la nueva
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

            // igual que antes si todo va bien devolvemos al usuario a la pantalla principal
            if($exito){
                header("Location: ../index.html?page=usuarios");
                exit;
            }else{
                echo "ERROR al actualizar en la base de datos";
            }
        }

        // el jefe coge el id de la url (get) y le dice al carretillero que vaya a esa posicion exacta de la estanteria y tire la caja a la basura
        public function eliminar(){
            $id_borrar = (int) $_GET['id'];

            $this->usuariosDAO->borrar($id_borrar);

            // al terminar volvemos a cargar la pantalla de usuarios para que se vea que ya no esta
            header("Location: ../index.html?page=usuarios");
            exit;
        }
    }
?>